/**
 * Retry Logic Examples
 * 
 * This example demonstrates how to configure and use retry logic
 * with the fetch-client library, including different retry strategies,
 * custom retry conditions, and retry error handling.
 */

import { Client, ApiError, ERROR_CODES } from '../libs/index';

// Create clients with different retry configurations
const basicRetryClient = new Client({
  baseURL: 'https://httpbin.org',
  timeout: 5000,
  retry: {
    maxRetries: 3,
    delay: 1000, // 1 second delay between retries
  }
});

const advancedRetryClient = new Client({
  baseURL: 'https://httpbin.org',
  timeout: 3000,
  retry: {
    maxRetries: 5,
    delay: 2000, // 2 second delay
    shouldRetry: [408, 429, 500, 502, 503, 504] // Specific status codes
  }
});

async function demonstrateBasicRetry() {
  console.log('🔄 Basic Retry Configuration Example\n');

  try {
    console.log('🔧 1. Testing basic retry with simulated failures...');

    // Simulate a request that might fail
    console.log('   📡 Request to endpoint that returns random status...');
    
    try {
      // This endpoint returns random HTTP status codes
      const response = await basicRetryClient.get('/status/500,502,200', {
        timeout: 2000
      });
      console.log('   ✅ Request succeeded after potential retries');
      console.log('   📊 Response received successfully');
    } catch (error) {
      if (error instanceof ApiError) {
        console.log(`   ❌ Request failed after retries: ${error.message}`);
        console.log(`   📊 Status: ${error.status}, Code: ${error.code}`);
      } else {
        console.log(`   ❌ Unexpected error: ${error}`);
      }
    }

    console.log();

  } catch (error) {
    console.error('❌ Basic retry test failed:', error);
  }
}

async function demonstrateCustomRetryConditions() {
  console.log('🔄 Custom Retry Conditions Example\n');

  try {
    console.log('🔧 2. Testing custom retry conditions...');

    // Create client with custom retry logic
    const customRetryClient = new Client({
      baseURL: 'https://httpbin.org',
      timeout: 3000,
      retry: {
        maxRetries: 4,
        delay: 1500,
        shouldRetry: (error) => {
          // Custom retry logic
          if (error instanceof Response) {
            // Retry on specific status codes
            return [429, 500, 502, 503, 504].includes(error.status);
          }
          
          if (error instanceof ApiError) {
            // Retry on network errors and timeouts
            return error.code === ERROR_CODES.NETWORK_ERROR || 
                   error.code === ERROR_CODES.TIMEOUT;
          }
          
          return false;
        }
      }
    });

    console.log('   📡 Testing custom retry conditions...');
    
    const retryTests = [
      { endpoint: '/status/500', description: 'Server error (should retry)' },
      { endpoint: '/status/404', description: 'Not found (should NOT retry)' },
      { endpoint: '/status/429', description: 'Rate limit (should retry)' },
      { endpoint: '/status/200', description: 'Success (no retry needed)' }
    ];

    for (const test of retryTests) {
      console.log(`   🧪 ${test.description}...`);
      
      try {
        const response = await customRetryClient.get(test.endpoint);
        console.log(`      ✅ Success: ${test.endpoint}`);
      } catch (error) {
        if (error instanceof ApiError) {
          console.log(`      ❌ Failed: ${error.status} - ${error.message}`);
        } else {
          console.log(`      ❌ Error: ${error}`);
        }
      }
    }

    console.log();

  } catch (error) {
    console.error('❌ Custom retry test failed:', error);
  }
}

async function demonstrateExponentialBackoff() {
  console.log('🔄 Exponential Backoff Example\n');

  try {
    console.log('🔧 3. Testing exponential backoff strategy...');

    // Simulate exponential backoff by tracking timing
    const backoffClient = new Client({
      baseURL: 'https://httpbin.org',
      timeout: 2000,
      retry: {
        maxRetries: 4,
        delay: 1000, // Base delay
        // In a real implementation, you'd implement exponential backoff
        // For demo, we'll show the concept
      }
    });

    console.log('   📡 Simulating exponential backoff timing...');
    
    const delays = [1000, 2000, 4000, 8000]; // Exponential: 1s, 2s, 4s, 8s
    
    for (let i = 0; i < delays.length; i++) {
      const delay = delays[i];
      console.log(`   ⏱️  Retry ${i + 1}: delay = ${delay}ms`);
      
      // Simulate the delay
      await new Promise(resolve => setTimeout(resolve, 100)); // Quick simulation
      
      try {
        // Simulate a request that fails initially
        const startTime = Date.now();
        
        // Use delay endpoint to simulate processing time
        await backoffClient.get(`/delay/1`);
        
        const endTime = Date.now();
        console.log(`      ✅ Attempt ${i + 1} completed in ${endTime - startTime}ms`);
        break; // Success, no more retries needed
        
      } catch (error) {
        console.log(`      ❌ Attempt ${i + 1} failed`);
        if (i === delays.length - 1) {
          console.log('      🚫 Max retries reached, giving up');
        }
      }
    }

    console.log();

  } catch (error) {
    console.error('❌ Exponential backoff test failed:', error);
  }
}

async function demonstrateRetryWithDifferentMethods() {
  console.log('🔄 Retry with Different HTTP Methods Example\n');

  try {
    console.log('🔧 4. Testing retry behavior with different HTTP methods...');

    const methodRetryClient = new Client({
      baseURL: 'https://httpbin.org',
      timeout: 4000,
      retry: {
        maxRetries: 3,
        delay: 1000
      }
    });

    const testMethods = [
      { 
        method: 'GET', 
        endpoint: '/status/500,200', 
        description: 'GET request (safe to retry)'
      },
      { 
        method: 'POST', 
        endpoint: '/status/500,201', 
        description: 'POST request (careful with retry)',
        data: { message: 'Test POST data', timestamp: Date.now() }
      },
      { 
        method: 'PUT', 
        endpoint: '/status/500,200', 
        description: 'PUT request (idempotent, safe to retry)',
        data: { id: 1, name: 'Updated name' }
      },
      { 
        method: 'DELETE', 
        endpoint: '/status/500,204', 
        description: 'DELETE request (idempotent, safe to retry)'
      }
    ];

    for (const test of testMethods) {
      console.log(`   📡 ${test.description}...`);
      
      try {
        let response;
        const startTime = Date.now();
        
        switch (test.method) {
          case 'GET':
            response = await methodRetryClient.get(test.endpoint);
            break;
          case 'POST':
            response = await methodRetryClient.post(test.endpoint, test.data);
            break;
          case 'PUT':
            response = await methodRetryClient.put(test.endpoint, test.data);
            break;
          case 'DELETE':
            response = await methodRetryClient.delete(test.endpoint);
            break;
        }
        
        const endTime = Date.now();
        console.log(`      ✅ ${test.method} succeeded (${endTime - startTime}ms)`);
        
      } catch (error) {
        if (error instanceof ApiError) {
          console.log(`      ❌ ${test.method} failed: ${error.status} - ${error.message}`);
        } else {
          console.log(`      ❌ ${test.method} error: ${error}`);
        }
      }
    }

    console.log();

  } catch (error) {
    console.error('❌ Method retry test failed:', error);
  }
}

async function demonstrateRetryWithCircuitBreaker() {
  console.log('🔄 Retry with Circuit Breaker Pattern Example\n');

  try {
    console.log('🔧 5. Simulating circuit breaker pattern with retry...');

    // Simulate a circuit breaker state
    let failureCount = 0;
    let circuitOpen = false;
    const maxFailures = 3;
    const circuitResetTime = 5000; // 5 seconds

    const circuitBreakerClient = new Client({
      baseURL: 'https://httpbin.org',
      timeout: 2000,
      retry: {
        maxRetries: 2,
        delay: 1000,
        shouldRetry: (error) => {
          // Don't retry if circuit is open
          if (circuitOpen) {
            console.log('      🔴 Circuit breaker is OPEN - blocking request');
            return false;
          }
          
          // Increment failure count
          failureCount++;
          
          if (failureCount >= maxFailures) {
            circuitOpen = true;
            console.log('      🔴 Circuit breaker OPENED after max failures');
            
            // Reset circuit after timeout
            setTimeout(() => {
              circuitOpen = false;
              failureCount = 0;
              console.log('      🟢 Circuit breaker RESET');
            }, circuitResetTime);
            
            return false;
          }
          
          return true;
        }
      }
    });

    // Test requests that will trigger circuit breaker
    const testRequests = [
      '/status/500', // Will fail
      '/status/500', // Will fail  
      '/status/500', // Will fail - should open circuit
      '/status/200', // Would succeed but circuit is open
      '/status/200'  // Would succeed but circuit is open
    ];

    for (let i = 0; i < testRequests.length; i++) {
      const endpoint = testRequests[i];
      console.log(`   📡 Request ${i + 1}: ${endpoint}...`);
      
      try {
        const response = await circuitBreakerClient.get(endpoint);
        console.log(`      ✅ Request ${i + 1} succeeded`);
        // Reset failure count on success
        failureCount = 0;
        
      } catch (error) {
        console.log(`      ❌ Request ${i + 1} failed`);
      }
      
      // Small delay between requests
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    console.log();

  } catch (error) {
    console.error('❌ Circuit breaker test failed:', error);
  }
}

async function demonstrateRetryStatistics() {
  console.log('🔄 Retry Statistics and Monitoring Example\n');

  try {
    console.log('🔧 6. Collecting retry statistics...');

    // Track retry statistics
    const retryStats = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      totalRetries: 0,
      averageRetries: 0
    };

    const statsClient = new Client({
      baseURL: 'https://httpbin.org',
      timeout: 3000,
      retry: {
        maxRetries: 3,
        delay: 1000
      }
    });

    // Add request interceptor to track attempts
    let currentRequestRetries = 0;
    statsClient.interceptors.request.use((request) => {
      if (request.url.includes('retry-test')) {
        currentRequestRetries++;
      }
      return request;
    });

    const testEndpoints = [
      '/status/200',           // Should succeed immediately
      '/status/500,500,200',   // Should succeed after 2 retries
      '/status/500,500,500,200', // Should succeed after 3 retries
      '/status/500',           // Should fail after max retries
      '/status/200'            // Should succeed immediately
    ];

    for (let i = 0; i < testEndpoints.length; i++) {
      const endpoint = testEndpoints[i];
      currentRequestRetries = 0;
      retryStats.totalRequests++;
      
      console.log(`   📡 Test ${i + 1}: ${endpoint}...`);
      
      try {
        const response = await statsClient.get(`${endpoint}?retry-test=${i}`);
        retryStats.successfulRequests++;
        retryStats.totalRetries += Math.max(0, currentRequestRetries - 1);
        console.log(`      ✅ Succeeded after ${currentRequestRetries} attempt(s)`);
        
      } catch (error) {
        retryStats.failedRequests++;
        retryStats.totalRetries += currentRequestRetries - 1;
        console.log(`      ❌ Failed after ${currentRequestRetries} attempt(s)`);
      }
    }

    // Calculate statistics
    retryStats.averageRetries = retryStats.totalRetries / retryStats.totalRequests;

    console.log('\n   📊 Retry Statistics:');
    console.log(`      Total Requests: ${retryStats.totalRequests}`);
    console.log(`      Successful: ${retryStats.successfulRequests}`);
    console.log(`      Failed: ${retryStats.failedRequests}`);
    console.log(`      Total Retries: ${retryStats.totalRetries}`);
    console.log(`      Average Retries per Request: ${retryStats.averageRetries.toFixed(2)}`);
    console.log(`      Success Rate: ${((retryStats.successfulRequests / retryStats.totalRequests) * 100).toFixed(1)}%`);

    console.log();

  } catch (error) {
    console.error('❌ Retry statistics test failed:', error);
  }
}

// Main function to run all retry examples
async function main() {
  console.log('🚀 Retry Logic Examples\n');
  console.log('==========================================\n');

  await demonstrateBasicRetry();
  await demonstrateCustomRetryConditions();
  await demonstrateExponentialBackoff();
  await demonstrateRetryWithDifferentMethods();
  await demonstrateRetryWithCircuitBreaker();
  await demonstrateRetryStatistics();

  console.log('🎉 All retry examples completed!');
}

// Execute only if this file is run directly
if (require.main === module) {
  main().catch(console.error);
}

export {
  demonstrateBasicRetry,
  demonstrateCustomRetryConditions,
  demonstrateExponentialBackoff,
  demonstrateRetryWithDifferentMethods,
  demonstrateRetryWithCircuitBreaker,
  demonstrateRetryStatistics
};