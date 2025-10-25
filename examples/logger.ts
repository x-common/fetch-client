/**
 * Logger Integration Examples
 * 
 * This example demonstrates how to integrate logging capabilities
 * with the fetch-client library using interceptors for comprehensive
 * request/response logging, error tracking, and performance monitoring.
 */

import { Client, ApiError, ERROR_CODES } from '../libs/index';

// Simple logger interface
interface Logger {
  info(message: string, data?: any): void;
  warn(message: string, data?: any): void;
  error(message: string, data?: any): void;
  debug(message: string, data?: any): void;
}

// Simple console logger implementation
class ConsoleLogger implements Logger {
  info(message: string, data?: any): void {
    console.log(`ℹ️  [INFO] ${message}`, data ? JSON.stringify(data, null, 2) : '');
  }

  warn(message: string, data?: any): void {
    console.log(`⚠️  [WARN] ${message}`, data ? JSON.stringify(data, null, 2) : '');
  }

  error(message: string, data?: any): void {
    console.log(`❌ [ERROR] ${message}`, data ? JSON.stringify(data, null, 2) : '');
  }

  debug(message: string, data?: any): void {
    console.log(`🐛 [DEBUG] ${message}`, data ? JSON.stringify(data, null, 2) : '');
  }
}

// Advanced logger with structured logging
class StructuredLogger implements Logger {
  private logLevel: string;

  constructor(logLevel: string = 'info') {
    this.logLevel = logLevel;
  }

  private log(level: string, message: string, data?: any): void {
    const logEntry = {
      timestamp: new Date().toISOString(),
      level: level.toUpperCase(),
      message,
      data,
      requestId: this.generateRequestId()
    };

    console.log(JSON.stringify(logEntry));
  }

  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  info(message: string, data?: any): void {
    this.log('info', message, data);
  }

  warn(message: string, data?: any): void {
    this.log('warn', message, data);
  }

  error(message: string, data?: any): void {
    this.log('error', message, data);
  }

  debug(message: string, data?: any): void {
    this.log('debug', message, data);
  }
}

async function demonstrateBasicLogging() {
  console.log('📝 Basic Request/Response Logging Example\n');

  try {
    const logger = new ConsoleLogger();
    
    console.log('🔧 1. Setting up basic logging...');

    const loggedClient = new Client({
      baseURL: 'https://jsonplaceholder.typicode.com',
      timeout: 10000
    });

    // Request logging interceptor
    loggedClient.interceptors.request.use((request) => {
      logger.info('Outgoing Request', {
        method: request.method,
        url: request.url,
        headers: Object.fromEntries(request.headers.entries())
      });
      return request;
    });

    // Response logging interceptor
    loggedClient.interceptors.response.use((response) => {
      logger.info('Incoming Response', {
        status: response.status,
        statusText: response.statusText,
        url: response.request.url,
        headers: Object.fromEntries(response.headers.entries())
      });
      return response;
    });

    console.log('   📡 Making logged requests...');
    
    // Test different requests
    await loggedClient.get('/posts/1');
    await loggedClient.get('/users/1');
    
    console.log('   ✅ Basic logging completed');
    console.log();

  } catch (error) {
    console.error('❌ Basic logging test failed:', error);
  }
}

async function demonstrateStructuredLogging() {
  console.log('📝 Structured Logging Example\n');

  try {
    const logger = new StructuredLogger('debug');
    
    console.log('🔧 2. Setting up structured logging...');

    const structuredClient = new Client({
      baseURL: 'https://httpbin.org',
      timeout: 8000
    });

    // Enhanced request logging
    structuredClient.interceptors.request.use((request) => {
      const requestData = {
        method: request.method,
        url: request.url,
        headers: Object.fromEntries(request.headers.entries()),
        timestamp: new Date().toISOString(),
        // Note: Body access would need special handling in real implementation
        hasBody: false // Placeholder for body presence
      };

      logger.info('HTTP Request Started', requestData);
      return request;
    });

    // Enhanced response logging
    structuredClient.interceptors.response.use((response) => {
      const responseData = {
        status: response.status,
        statusText: response.statusText,
        url: response.request.url,
        headers: Object.fromEntries(response.headers.entries()),
        timestamp: new Date().toISOString()
      };

      if (response.status >= 400) {
        logger.error('HTTP Response Error', responseData);
      } else {
        logger.info('HTTP Response Success', responseData);
      }

      return response;
    });

    console.log('   📡 Making requests with structured logging...');
    
    await structuredClient.get('/get');
    await structuredClient.post('/post', { message: 'Test data' });
    
    try {
      await structuredClient.get('/status/404');
    } catch (error) {
      logger.error('Request failed', { error: error instanceof ApiError ? error.message : String(error) });
    }

    console.log('   ✅ Structured logging completed');
    console.log();

  } catch (error) {
    console.error('❌ Structured logging test failed:', error);
  }
}

async function demonstratePerformanceLogging() {
  console.log('📝 Performance Logging Example\n');

  try {
    const logger = new ConsoleLogger();
    
    console.log('🔧 3. Setting up performance logging...');

    const perfClient = new Client({
      baseURL: 'https://httpbin.org',
      timeout: 10000
    });

    // Performance tracking
    const requestTimes = new Map<string, number>();

    // Start timing on request
    perfClient.interceptors.request.use((request) => {
      const requestId = `${request.method}_${request.url}_${Date.now()}`;
      requestTimes.set(requestId, Date.now());
      
      // Store request ID for later reference
      request.headers.set('X-Request-ID', requestId);
      
      logger.debug('Request started', {
        requestId,
        method: request.method,
        url: request.url,
        startTime: new Date().toISOString()
      });
      
      return request;
    });

    // End timing on response
    perfClient.interceptors.response.use((response) => {
      const requestId = response.request.headers.get('X-Request-ID');
      const startTime = requestTimes.get(requestId || '');
      
      if (startTime) {
        const duration = Date.now() - startTime;
        requestTimes.delete(requestId || '');
        
        const perfData = {
          requestId,
          method: response.request.method,
          url: response.request.url,
          status: response.status,
          duration: `${duration}ms`,
          endTime: new Date().toISOString()
        };

        if (duration > 2000) {
          logger.warn('Slow request detected', perfData);
        } else {
          logger.info('Request completed', perfData);
        }
      }
      
      return response;
    });

    console.log('   📡 Making performance-monitored requests...');
    
    // Test requests with different response times
    await perfClient.get('/delay/1'); // 1 second delay
    await perfClient.get('/get');      // Fast request
    await perfClient.get('/delay/3');  // 3 second delay (should trigger slow warning)

    console.log('   ✅ Performance logging completed');
    console.log();

  } catch (error) {
    console.error('❌ Performance logging test failed:', error);
  }
}

async function demonstrateErrorLogging() {
  console.log('📝 Error Logging Example\n');

  try {
    const logger = new ConsoleLogger();
    
    console.log('🔧 4. Setting up comprehensive error logging...');

    const errorClient = new Client({
      baseURL: 'https://httpbin.org',
      timeout: 3000,
      retry: {
        maxRetries: 2,
        delay: 1000
      }
    });

    // Request error tracking
    errorClient.interceptors.request.use((request) => {
      logger.debug('Request initiated', {
        method: request.method,
        url: request.url,
        timestamp: new Date().toISOString()
      });
      return request;
    });

    // Response and error logging
    errorClient.interceptors.response.use((response) => {
      if (response.status >= 400) {
        logger.warn('HTTP Error Response', {
          status: response.status,
          statusText: response.statusText,
          url: response.request.url,
          method: response.request.method
        });
      }
      return response;
    });

    console.log('   📡 Testing various error scenarios...');

    const errorTests = [
      { url: '/status/200', description: 'Success case' },
      { url: '/status/400', description: 'Client error' },
      { url: '/status/401', description: 'Unauthorized' },
      { url: '/status/404', description: 'Not found' },
      { url: '/status/500', description: 'Server error' },
      { url: '/delay/5', description: 'Timeout error' }
    ];

    for (const test of errorTests) {
      console.log(`     🧪 Testing: ${test.description}...`);
      
      try {
        await errorClient.get(test.url);
        logger.info('Test successful', { test: test.description });
      } catch (error) {
        if (error instanceof ApiError) {
          logger.error('API Error occurred', {
            test: test.description,
            errorCode: error.code,
            status: error.status,
            message: error.message,
            url: test.url
          });
        } else {
          logger.error('Unexpected error', {
            test: test.description,
            error: String(error)
          });
        }
      }
    }

    console.log('   ✅ Error logging completed');
    console.log();

  } catch (error) {
    console.error('❌ Error logging test failed:', error);
  }
}

async function demonstrateConditionalLogging() {
  console.log('📝 Conditional Logging Example\n');

  try {
    const logger = new ConsoleLogger();
    
    console.log('🔧 5. Setting up conditional logging...');

    // Environment-based logging configuration
    const LOG_LEVEL = 'debug'; // Could be from environment variable
    const ENABLE_REQUEST_BODY_LOGGING = true;
    const ENABLE_RESPONSE_BODY_LOGGING = false;

    const conditionalClient = new Client({
      baseURL: 'https://httpbin.org',
      timeout: 8000
    });

    // Conditional request logging
    conditionalClient.interceptors.request.use((request) => {
      if (LOG_LEVEL === 'debug') {
        const logData: any = {
          method: request.method,
          url: request.url,
          headers: Object.fromEntries(request.headers.entries())
        };

        if (ENABLE_REQUEST_BODY_LOGGING) {
          logData.note = 'Request body logging enabled but requires special handling';
        }

        logger.debug('Request details', logData);
      } else {
        logger.info(`${request.method} ${request.url}`);
      }

      return request;
    });

    // Conditional response logging
    conditionalClient.interceptors.response.use((response) => {
      const isError = response.status >= 400;
      
      if (isError || LOG_LEVEL === 'debug') {
        const logData: any = {
          status: response.status,
          url: response.request.url,
          method: response.request.method
        };

        if (ENABLE_RESPONSE_BODY_LOGGING) {
          // Note: In real implementation, you'd need to clone response to read body
          logData.note = 'Response body logging enabled but requires special handling';
        }

        if (isError) {
          logger.error('HTTP Error', logData);
        } else {
          logger.debug('Response details', logData);
        }
      }

      return response;
    });

    console.log('   📡 Making requests with conditional logging...');
    
    await conditionalClient.get('/get');
    await conditionalClient.post('/post', { data: 'sample' });
    
    try {
      await conditionalClient.get('/status/500');
    } catch (error) {
      // Error already logged by interceptor
    }

    console.log('   ✅ Conditional logging completed');
    console.log();

  } catch (error) {
    console.error('❌ Conditional logging test failed:', error);
  }
}

async function demonstrateLogAggregation() {
  console.log('📝 Log Aggregation Example\n');

  try {
    const logger = new StructuredLogger();
    
    console.log('🔧 6. Setting up log aggregation...');

    // Log aggregation storage
    const logAggregator = {
      requests: 0,
      responses: 0,
      errors: 0,
      totalDuration: 0,
      statusCounts: {} as Record<number, number>,
      errorTypes: {} as Record<string, number>
    };

    const aggregationClient = new Client({
      baseURL: 'https://httpbin.org',
      timeout: 5000
    });

    const requestStartTimes = new Map<string, number>();

    // Request counting
    aggregationClient.interceptors.request.use((request) => {
      logAggregator.requests++;
      const requestId = Date.now().toString();
      requestStartTimes.set(requestId, Date.now());
      request.headers.set('X-Request-ID', requestId);
      
      logger.debug('Request tracked', {
        requestId,
        totalRequests: logAggregator.requests
      });
      
      return request;
    });

    // Response aggregation
    aggregationClient.interceptors.response.use((response) => {
      logAggregator.responses++;
      
      // Count status codes
      logAggregator.statusCounts[response.status] = 
        (logAggregator.statusCounts[response.status] || 0) + 1;

      // Track duration
      const requestId = response.request.headers.get('X-Request-ID');
      if (requestId && requestStartTimes.has(requestId)) {
        const duration = Date.now() - requestStartTimes.get(requestId)!;
        logAggregator.totalDuration += duration;
        requestStartTimes.delete(requestId);
      }

      if (response.status >= 400) {
        logAggregator.errors++;
      }

      return response;
    });

    console.log('   📡 Making requests for aggregation...');

    // Make various requests
    const requests = [
      aggregationClient.get('/get'),
      aggregationClient.get('/status/200'),
      aggregationClient.get('/status/404').catch(() => {}), // Ignore error
      aggregationClient.get('/status/500').catch(() => {}), // Ignore error
      aggregationClient.post('/post', { test: 'data' }),
    ];

    await Promise.allSettled(requests);

    // Report aggregated statistics
    console.log('\n   📊 Aggregated Log Statistics:');
    console.log(`      Total Requests: ${logAggregator.requests}`);
    console.log(`      Total Responses: ${logAggregator.responses}`);
    console.log(`      Total Errors: ${logAggregator.errors}`);
    console.log(`      Average Duration: ${Math.round(logAggregator.totalDuration / logAggregator.responses)}ms`);
    console.log('      Status Code Distribution:');
    
    Object.entries(logAggregator.statusCounts).forEach(([status, count]) => {
      console.log(`        ${status}: ${count} requests`);
    });

    logger.info('Request aggregation summary', logAggregator);

    console.log('   ✅ Log aggregation completed');
    console.log();

  } catch (error) {
    console.error('❌ Log aggregation test failed:', error);
  }
}

// Main function to run all logging examples
async function main() {
  console.log('🚀 Logger Integration Examples\n');
  console.log('==========================================\n');

  await demonstrateBasicLogging();
  await demonstrateStructuredLogging();
  await demonstratePerformanceLogging();
  await demonstrateErrorLogging();
  await demonstrateConditionalLogging();
  await demonstrateLogAggregation();

  console.log('🎉 All logging examples completed!');
}

// Execute only if this file is run directly
if (require.main === module) {
  main().catch(console.error);
}

export {
  demonstrateBasicLogging,
  demonstrateStructuredLogging,
  demonstratePerformanceLogging,
  demonstrateErrorLogging,
  demonstrateConditionalLogging,
  demonstrateLogAggregation,
  ConsoleLogger,
  StructuredLogger
};