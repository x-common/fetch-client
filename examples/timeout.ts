/**
 * Timeout Configuration Examples
 * 
 * This example demonstrates how to configure and handle timeouts
 * with the fetch-client library, including global timeouts,
 * per-request timeouts, and timeout error handling.
 */

import { Client, ApiError, ERROR_CODES } from '../libs/index';

// Create clients with different timeout configurations
const shortTimeoutClient = new Client({
  baseURL: 'https://httpbin.org',
  timeout: 2000, // 2 seconds - very short for testing
  headers: {
    'User-Agent': 'fetch-client-timeout-example/1.0.0'
  }
});

const normalTimeoutClient = new Client({
  baseURL: 'https://httpbin.org',
  timeout: 10000, // 10 seconds - normal timeout
});

const longTimeoutClient = new Client({
  baseURL: 'https://httpbin.org',
  timeout: 30000, // 30 seconds - long timeout
});

async function demonstrateGlobalTimeout() {
  console.log('⏱️  Global Timeout Configuration Example\n');

  try {
    console.log('🔧 1. Testing global timeout settings...');

    // This request should complete normally
    console.log('   📡 Quick request (should succeed)...');
    const quickResponse = await normalTimeoutClient.get('/delay/1'); // 1 second delay
    console.log('   ✅ Quick request completed successfully');
    console.log();

    // This request might timeout with short timeout client
    console.log('   📡 Slow request with short timeout (might timeout)...');
    try {
      const slowResponse = await shortTimeoutClient.get('/delay/5'); // 5 second delay
      console.log('   ✅ Slow request completed (unexpected)');
    } catch (error) {
      if (error instanceof ApiError && error.code === ERROR_CODES.TIMEOUT) {
        console.log('   ⏰ Request timed out as expected (5s > 2s timeout)');
      } else {
        console.log('   ❌ Unexpected error:', error);
      }
    }
    console.log();

  } catch (error) {
    console.error('❌ Global timeout test failed:', error);
  }
}

async function demonstratePerRequestTimeout() {
  console.log('⏱️  Per-Request Timeout Override Example\n');

  try {
    console.log('🔧 2. Testing per-request timeout overrides...');

    // Use normal client but override timeout for specific requests
    console.log('   📡 Request with custom short timeout...');
    try {
      const response1 = await normalTimeoutClient.get('/delay/3', {
        timeout: 1000 // Override to 1 second
      });
      console.log('   ✅ Short timeout request completed (unexpected)');
    } catch (error) {
      if (error instanceof ApiError && error.code === ERROR_CODES.TIMEOUT) {
        console.log('   ⏰ Request timed out with custom timeout (3s > 1s)');
      } else {
        console.log('   ❌ Unexpected error:', error);
      }
    }

    console.log('   📡 Request with custom long timeout...');
    const response2 = await shortTimeoutClient.get('/delay/3', {
      timeout: 15000 // Override to 15 seconds
    });
    console.log('   ✅ Long timeout request completed (3s < 15s override)');
    console.log();

  } catch (error) {
    console.error('❌ Per-request timeout test failed:', error);
  }
}

async function demonstrateTimeoutErrorHandling() {
  console.log('⏱️  Timeout Error Handling Example\n');

  try {
    console.log('🔧 3. Testing comprehensive timeout error handling...');

    const timeoutTests = [
      { delay: 1, timeout: 3000, shouldTimeout: false },
      { delay: 4, timeout: 2000, shouldTimeout: true },
      { delay: 2, timeout: 5000, shouldTimeout: false },
    ];

    for (let i = 0; i < timeoutTests.length; i++) {
      const test = timeoutTests[i];
      console.log(`   📡 Test ${i + 1}: ${test.delay}s delay with ${test.timeout}ms timeout...`);

      try {
        const startTime = Date.now();
        const response = await normalTimeoutClient.get(`/delay/${test.delay}`, {
          timeout: test.timeout
        });
        const endTime = Date.now();
        const duration = endTime - startTime;

        console.log(`   ✅ Completed in ${duration}ms (expected: ~${test.delay * 1000}ms)`);
        
        if (test.shouldTimeout) {
          console.log('   ⚠️  Expected timeout but request succeeded');
        }

      } catch (error) {
        if (error instanceof ApiError) {
          if (error.code === ERROR_CODES.TIMEOUT) {
            console.log(`   ⏰ Timed out as expected (${error.message})`);
            
            if (!test.shouldTimeout) {
              console.log('   ⚠️  Unexpected timeout occurred');
            }
          } else {
            console.log(`   ❌ API Error: ${error.message} (Code: ${error.code})`);
          }
        } else {
          console.log(`   ❌ Unexpected error: ${error}`);
        }
      }
    }

    console.log();

  } catch (error) {
    console.error('❌ Timeout error handling test failed:', error);
  }
}

async function demonstrateTimeoutWithRetry() {
  console.log('⏱️  Timeout with Retry Logic Example\n');

  try {
    console.log('🔧 4. Testing timeout behavior with retry logic...');

    // Create a client with retry configuration
    const retryClient = new Client({
      baseURL: 'https://httpbin.org',
      timeout: 3000, // 3 second timeout
      retry: {
        maxRetries: 2,
        delay: 1000,
        shouldRetry: (error) => {
          // Retry on timeout errors
          return (error as any).code === ERROR_CODES.TIMEOUT;
        }
      }
    });

    console.log('   📡 Request that will timeout and retry...');
    const startTime = Date.now();

    try {
      const response = await retryClient.get('/delay/5'); // 5 second delay, will timeout
      console.log('   ✅ Request completed (unexpected)');
    } catch (error) {
      const endTime = Date.now();
      const totalDuration = endTime - startTime;

      if (error instanceof ApiError && error.code === ERROR_CODES.TIMEOUT) {
        console.log(`   ⏰ Final timeout after retries (total time: ${totalDuration}ms)`);
        console.log('   📊 Expected: ~3 attempts × 3s timeout + 2 × 1s delay = ~11s');
      } else {
        console.log(`   ❌ Unexpected error: ${error}`);
      }
    }

    console.log();

  } catch (error) {
    console.error('❌ Timeout with retry test failed:', error);
  }
}

async function demonstrateDifferentTimeoutScenarios() {
  console.log('⏱️  Different Timeout Scenarios Example\n');

  try {
    console.log('🔧 5. Testing various timeout scenarios...');

    const scenarios = [
      {
        name: 'Fast API call',
        endpoint: '/get',
        timeout: 5000,
        description: 'Simple GET request'
      },
      {
        name: 'Medium delay',
        endpoint: '/delay/2',
        timeout: 5000,
        description: '2 second server delay'
      },
      {
        name: 'Upload simulation',
        endpoint: '/post',
        timeout: 15000,
        description: 'POST request with data',
        method: 'POST',
        data: { 
          message: 'Large data simulation',
          data: Array(1000).fill('x').join(''),
          timestamp: new Date().toISOString()
        }
      },
      {
        name: 'Long operation',
        endpoint: '/delay/8',
        timeout: 5000,
        description: '8 second delay (will timeout)'
      }
    ];

    for (let i = 0; i < scenarios.length; i++) {
      const scenario = scenarios[i];
      console.log(`   📡 Scenario ${i + 1}: ${scenario.name}`);
      console.log(`      ${scenario.description}`);

      const startTime = Date.now();

      try {
        let response;
        if (scenario.method === 'POST') {
          response = await normalTimeoutClient.post(scenario.endpoint, scenario.data, {
            timeout: scenario.timeout
          });
        } else {
          response = await normalTimeoutClient.get(scenario.endpoint, {
            timeout: scenario.timeout
          });
        }

        const endTime = Date.now();
        const duration = endTime - startTime;
        console.log(`      ✅ Completed in ${duration}ms`);

      } catch (error) {
        const endTime = Date.now();
        const duration = endTime - startTime;

        if (error instanceof ApiError && error.code === ERROR_CODES.TIMEOUT) {
          console.log(`      ⏰ Timed out after ${duration}ms`);
        } else {
          console.log(`      ❌ Failed: ${error}`);
        }
      }

      console.log();
    }

  } catch (error) {
    console.error('❌ Timeout scenarios test failed:', error);
  }
}

async function demonstrateTimeoutBestPractices() {
  console.log('⏱️  Timeout Best Practices Example\n');

  try {
    console.log('🔧 6. Demonstrating timeout best practices...');

    // Best Practice 1: Different timeouts for different operations
    const apiClient = new Client({
      baseURL: 'https://httpbin.org',
      timeout: 10000 // Default 10 seconds
    });

    console.log('   📋 Best Practice 1: Operation-specific timeouts');
    
    // Quick data retrieval
    console.log('      📡 Quick data fetch (5s timeout)...');
    try {
      await apiClient.get('/get', { timeout: 5000 });
      console.log('      ✅ Quick fetch completed');
    } catch (error) {
      console.log('      ⏰ Quick fetch timed out');
    }

    // File upload simulation
    console.log('      📡 File upload simulation (30s timeout)...');
    try {
      await apiClient.post('/post', { large_data: 'simulated' }, { timeout: 30000 });
      console.log('      ✅ Upload simulation completed');
    } catch (error) {
      console.log('      ⏰ Upload simulation timed out');
    }

    // Report generation
    console.log('      📡 Report generation (60s timeout)...');
    try {
      await apiClient.get('/delay/3', { timeout: 60000 });
      console.log('      ✅ Report generation completed');
    } catch (error) {
      console.log('      ⏰ Report generation timed out');
    }

    console.log('   ✅ Best practices demonstrated');
    console.log();

  } catch (error) {
    console.error('❌ Best practices test failed:', error);
  }
}

// Main function to run all timeout examples
async function main() {
  console.log('🚀 Timeout Configuration Examples\n');
  console.log('==========================================\n');

  await demonstrateGlobalTimeout();
  await demonstratePerRequestTimeout();
  await demonstrateTimeoutErrorHandling();
  await demonstrateTimeoutWithRetry();
  await demonstrateDifferentTimeoutScenarios();
  await demonstrateTimeoutBestPractices();

  console.log('🎉 All timeout examples completed!');
}

// Execute only if this file is run directly
if (require.main === module) {
  main().catch(console.error);
}

export {
  demonstrateGlobalTimeout,
  demonstratePerRequestTimeout,
  demonstrateTimeoutErrorHandling,
  demonstrateTimeoutWithRetry,
  demonstrateDifferentTimeoutScenarios,
  demonstrateTimeoutBestPractices
};