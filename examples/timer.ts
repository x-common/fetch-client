/**
 * Timer and Performance Monitoring Examples
 * 
 * This example demonstrates how to implement timing and performance
 * monitoring with the fetch-client library, including request timing,
 * performance metrics, and advanced monitoring features.
 */

import { Client, ApiError } from '../libs/index';

// Performance metrics interface
interface PerformanceMetrics {
  requestCount: number;
  totalDuration: number;
  averageDuration: number;
  minDuration: number;
  maxDuration: number;
  successCount: number;
  errorCount: number;
  timeouts: number;
}

// Timer utility class
class RequestTimer {
  private timers = new Map<string, number>();
  private metrics: PerformanceMetrics = {
    requestCount: 0,
    totalDuration: 0,
    averageDuration: 0,
    minDuration: Infinity,
    maxDuration: 0,
    successCount: 0,
    errorCount: 0,
    timeouts: 0
  };

  startTimer(requestId: string): void {
    this.timers.set(requestId, performance.now());
  }

  endTimer(requestId: string, success: boolean = true): number | null {
    const startTime = this.timers.get(requestId);
    if (!startTime) return null;

    const duration = performance.now() - startTime;
    this.timers.delete(requestId);

    // Update metrics
    this.metrics.requestCount++;
    this.metrics.totalDuration += duration;
    this.metrics.averageDuration = this.metrics.totalDuration / this.metrics.requestCount;
    this.metrics.minDuration = Math.min(this.metrics.minDuration, duration);
    this.metrics.maxDuration = Math.max(this.metrics.maxDuration, duration);

    if (success) {
      this.metrics.successCount++;
    } else {
      this.metrics.errorCount++;
    }

    return duration;
  }

  recordTimeout(): void {
    this.metrics.timeouts++;
    this.metrics.errorCount++;
  }

  getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  reset(): void {
    this.timers.clear();
    this.metrics = {
      requestCount: 0,
      totalDuration: 0,
      averageDuration: 0,
      minDuration: Infinity,
      maxDuration: 0,
      successCount: 0,
      errorCount: 0,
      timeouts: 0
    };
  }
}

async function demonstrateBasicTiming() {
  console.log('⏱️  Basic Request Timing Example\n');

  try {
    console.log('🔧 1. Setting up basic request timing...');

    const timer = new RequestTimer();
    const timedClient = new Client({
      baseURL: 'https://httpbin.org',
      timeout: 10000
    });

    // Add timing interceptors
    timedClient.interceptors.request.use((request) => {
      const requestId = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      request.headers.set('X-Request-ID', requestId);
      timer.startTimer(requestId);
      
      console.log(`   ⏱️  Started timing for request: ${request.method} ${request.url}`);
      return request;
    });

    timedClient.interceptors.response.use((response) => {
      const requestId = response.request.headers.get('X-Request-ID');
      if (requestId) {
        const duration = timer.endTimer(requestId, response.status < 400);
        if (duration !== null) {
          console.log(`   ✅ Request completed in ${duration.toFixed(2)}ms (Status: ${response.status})`);
        }
      }
      return response;
    });

    console.log('   📡 Making timed requests...');
    
    // Test different types of requests
    await timedClient.get('/get');
    await timedClient.get('/delay/1'); // 1 second delay
    await timedClient.post('/post', { data: 'test' });
    
    // Display metrics
    const metrics = timer.getMetrics();
    console.log('\n   📊 Basic Timing Metrics:');
    console.log(`      Total Requests: ${metrics.requestCount}`);
    console.log(`      Average Duration: ${metrics.averageDuration.toFixed(2)}ms`);
    console.log(`      Min Duration: ${metrics.minDuration.toFixed(2)}ms`);
    console.log(`      Max Duration: ${metrics.maxDuration.toFixed(2)}ms`);
    console.log(`      Success Rate: ${((metrics.successCount / metrics.requestCount) * 100).toFixed(1)}%`);

    console.log();

  } catch (error) {
    console.error('❌ Basic timing test failed:', error);
  }
}

async function demonstratePerformanceMonitoring() {
  console.log('⏱️  Performance Monitoring Example\n');

  try {
    console.log('🔧 2. Setting up comprehensive performance monitoring...');

    const performanceClient = new Client({
      baseURL: 'https://httpbin.org',
      timeout: 8000
    });

    // Performance tracking data
    const performanceData = {
      requests: [] as any[],
      slowRequests: [] as any[],
      errorRequests: [] as any[]
    };

    const SLOW_REQUEST_THRESHOLD = 2000; // 2 seconds

    // Enhanced performance interceptor
    performanceClient.interceptors.request.use((request) => {
      const requestMetadata = {
        id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        method: request.method,
        url: request.url,
        startTime: performance.now(),
        timestamp: new Date().toISOString()
      };

      request.headers.set('X-Performance-ID', requestMetadata.id);
      
      // Store request metadata (in real app, you might use a more sophisticated storage)
      (request as any)._performanceData = requestMetadata;
      
      console.log(`   📊 Monitoring: ${request.method} ${request.url}`);
      return request;
    });

    performanceClient.interceptors.response.use((response) => {
      const performanceId = response.request.headers.get('X-Performance-ID');
      const requestData = (response.request as any)._performanceData;
      
      if (requestData) {
        const endTime = performance.now();
        const duration = endTime - requestData.startTime;
        
        const performanceResult = {
          ...requestData,
          endTime,
          duration,
          status: response.status,
          success: response.status < 400,
          contentLength: response.headers.get('content-length') || 'unknown'
        };

        performanceData.requests.push(performanceResult);

        // Categorize performance
        if (duration > SLOW_REQUEST_THRESHOLD) {
          performanceData.slowRequests.push(performanceResult);
          console.log(`   🐌 Slow request detected: ${duration.toFixed(2)}ms`);
        } else {
          console.log(`   ⚡ Fast request: ${duration.toFixed(2)}ms`);
        }

        if (!performanceResult.success) {
          performanceData.errorRequests.push(performanceResult);
        }
      }

      return response;
    });

    console.log('   📡 Making performance-monitored requests...');

    // Test various performance scenarios
    const performanceTests = [
      { endpoint: '/get', description: 'Fast GET request' },
      { endpoint: '/delay/1', description: 'Medium delay (1s)' },
      { endpoint: '/delay/3', description: 'Slow request (3s)' },
      { endpoint: '/bytes/10240', description: 'Large response (10KB)' },
      { endpoint: '/status/500', description: 'Error response' }
    ];

    for (const test of performanceTests) {
      console.log(`     🧪 ${test.description}...`);
      try {
        await performanceClient.get(test.endpoint);
      } catch (error) {
        console.log(`     ❌ ${test.description} failed`);
      }
    }

    // Generate performance report
    console.log('\n   📈 Performance Report:');
    console.log(`      Total Requests: ${performanceData.requests.length}`);
    console.log(`      Slow Requests: ${performanceData.slowRequests.length}`);
    console.log(`      Error Requests: ${performanceData.errorRequests.length}`);
    
    if (performanceData.requests.length > 0) {
      const avgDuration = performanceData.requests.reduce((sum, req) => sum + req.duration, 0) / performanceData.requests.length;
      const maxDuration = Math.max(...performanceData.requests.map(req => req.duration));
      const minDuration = Math.min(...performanceData.requests.map(req => req.duration));
      
      console.log(`      Average Duration: ${avgDuration.toFixed(2)}ms`);
      console.log(`      Max Duration: ${maxDuration.toFixed(2)}ms`);
      console.log(`      Min Duration: ${minDuration.toFixed(2)}ms`);
    }

    console.log();

  } catch (error) {
    console.error('❌ Performance monitoring test failed:', error);
  }
}

async function demonstrateRealtimeMetrics() {
  console.log('⏱️  Real-time Metrics Dashboard Example\n');

  try {
    console.log('🔧 3. Setting up real-time metrics dashboard...');

    const metricsClient = new Client({
      baseURL: 'https://httpbin.org',
      timeout: 5000
    });

    // Real-time metrics storage
    const realtimeMetrics = {
      activeRequests: 0,
      requestsPerSecond: 0,
      currentMinute: new Date().getMinutes(),
      minuteRequestCount: 0,
      avgResponseTime: 0,
      lastUpdateTime: Date.now()
    };

    const activeTimers = new Map<string, number>();

    // Real-time request tracking
    metricsClient.interceptors.request.use((request) => {
      const requestId = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const startTime = performance.now();
      
      activeTimers.set(requestId, startTime);
      realtimeMetrics.activeRequests++;
      
      // Update requests per minute
      const currentMinute = new Date().getMinutes();
      if (currentMinute !== realtimeMetrics.currentMinute) {
        realtimeMetrics.requestsPerSecond = realtimeMetrics.minuteRequestCount / 60;
        realtimeMetrics.minuteRequestCount = 0;
        realtimeMetrics.currentMinute = currentMinute;
      }
      realtimeMetrics.minuteRequestCount++;
      
      request.headers.set('X-Metrics-ID', requestId);
      
      // Update dashboard (simulated)
      console.log(`   📊 Active: ${realtimeMetrics.activeRequests} | Req/min: ${realtimeMetrics.minuteRequestCount}`);
      
      return request;
    });

    metricsClient.interceptors.response.use((response) => {
      const requestId = response.request.headers.get('X-Metrics-ID');
      
      if (requestId && activeTimers.has(requestId)) {
        const startTime = activeTimers.get(requestId)!;
        const duration = performance.now() - startTime;
        
        activeTimers.delete(requestId);
        realtimeMetrics.activeRequests--;
        
        // Update average response time (simple moving average)
        realtimeMetrics.avgResponseTime = 
          (realtimeMetrics.avgResponseTime * 0.8) + (duration * 0.2);
        
        console.log(`   ⚡ Completed: ${duration.toFixed(0)}ms | Avg: ${realtimeMetrics.avgResponseTime.toFixed(0)}ms`);
      }
      
      return response;
    });

    console.log('   📡 Generating real-time metrics...');

    // Simulate multiple concurrent requests
    const concurrentRequests = Array.from({ length: 5 }, (_, i) => 
      metricsClient.get(`/delay/${Math.floor(Math.random() * 3) + 1}`)
        .catch(() => {}) // Ignore errors for demo
    );

    await Promise.all(concurrentRequests);

    // Display final metrics
    console.log('\n   📊 Final Real-time Metrics:');
    console.log(`      Active Requests: ${realtimeMetrics.activeRequests}`);
    console.log(`      Requests This Minute: ${realtimeMetrics.minuteRequestCount}`);
    console.log(`      Average Response Time: ${realtimeMetrics.avgResponseTime.toFixed(2)}ms`);

    console.log();

  } catch (error) {
    console.error('❌ Real-time metrics test failed:', error);
  }
}

async function demonstrateResourceTiming() {
  console.log('⏱️  Resource Timing Analysis Example\n');

  try {
    console.log('🔧 4. Setting up resource timing analysis...');

    const resourceClient = new Client({
      baseURL: 'https://httpbin.org',
      timeout: 10000
    });

    // Resource timing breakdown
    interface TimingBreakdown {
      dns?: number;
      connect?: number;
      ssl?: number;
      request?: number;
      response?: number;
      total: number;
    }

    const timingResults: TimingBreakdown[] = [];

    resourceClient.interceptors.request.use((request) => {
      const startTime = performance.now();
      request.headers.set('X-Start-Time', startTime.toString());
      
      console.log(`   🔍 Starting resource timing for: ${request.url}`);
      return request;
    });

    resourceClient.interceptors.response.use((response) => {
      const startTime = parseFloat(response.request.headers.get('X-Start-Time') || '0');
      const endTime = performance.now();
      const totalTime = endTime - startTime;
      
      // Simulate timing breakdown (in real implementation, you might use Performance API)
      const timing: TimingBreakdown = {
        dns: Math.random() * 50,         // DNS lookup
        connect: Math.random() * 100,    // TCP connection
        ssl: Math.random() * 150,        // SSL handshake
        request: Math.random() * 50,     // Request send
        response: totalTime - 300,       // Response receive (remaining time)
        total: totalTime
      };

      timingResults.push(timing);

      console.log(`   ⏱️  Timing breakdown for ${response.request.url}:`);
      console.log(`      DNS: ${timing.dns?.toFixed(1)}ms`);
      console.log(`      Connect: ${timing.connect?.toFixed(1)}ms`);
      console.log(`      SSL: ${timing.ssl?.toFixed(1)}ms`);
      console.log(`      Request: ${timing.request?.toFixed(1)}ms`);
      console.log(`      Response: ${timing.response?.toFixed(1)}ms`);
      console.log(`      Total: ${timing.total.toFixed(1)}ms`);

      return response;
    });

    console.log('   📡 Analyzing resource timing...');

    // Test different resource types
    await resourceClient.get('/get');
    await resourceClient.get('/json');
    await resourceClient.get('/bytes/5120'); // 5KB response

    // Generate timing analysis
    if (timingResults.length > 0) {
      console.log('\n   📈 Resource Timing Analysis:');
      
      const avgTiming = timingResults.reduce((acc, timing) => ({
        dns: (acc.dns || 0) + (timing.dns || 0),
        connect: (acc.connect || 0) + (timing.connect || 0),
        ssl: (acc.ssl || 0) + (timing.ssl || 0),
        request: (acc.request || 0) + (timing.request || 0),
        response: (acc.response || 0) + (timing.response || 0),
        total: acc.total + timing.total
      }), { total: 0 } as TimingBreakdown);

      const count = timingResults.length;
      console.log(`      Average DNS: ${(avgTiming.dns! / count).toFixed(1)}ms`);
      console.log(`      Average Connect: ${(avgTiming.connect! / count).toFixed(1)}ms`);
      console.log(`      Average SSL: ${(avgTiming.ssl! / count).toFixed(1)}ms`);
      console.log(`      Average Request: ${(avgTiming.request! / count).toFixed(1)}ms`);
      console.log(`      Average Response: ${(avgTiming.response! / count).toFixed(1)}ms`);
      console.log(`      Average Total: ${(avgTiming.total / count).toFixed(1)}ms`);
    }

    console.log();

  } catch (error) {
    console.error('❌ Resource timing test failed:', error);
  }
}

async function demonstratePerformanceBudgets() {
  console.log('⏱️  Performance Budgets Example\n');

  try {
    console.log('🔧 5. Setting up performance budgets...');

    // Define performance budgets
    const performanceBudgets = {
      maxRequestTime: 2000,      // 2 seconds
      maxTotalTime: 10000,       // 10 seconds for all requests
      maxConcurrentRequests: 5,
      maxErrorRate: 0.1          // 10% error rate
    };

    const budgetClient = new Client({
      baseURL: 'https://httpbin.org',
      timeout: 5000
    });

    // Budget tracking
    const budgetTracker = {
      totalTime: 0,
      requestCount: 0,
      errorCount: 0,
      currentConcurrent: 0,
      violations: [] as string[]
    };

    budgetClient.interceptors.request.use((request) => {
      budgetTracker.currentConcurrent++;
      budgetTracker.requestCount++;
      
      // Check concurrent request budget
      if (budgetTracker.currentConcurrent > performanceBudgets.maxConcurrentRequests) {
        budgetTracker.violations.push(`Concurrent requests exceeded: ${budgetTracker.currentConcurrent}`);
        console.log(`   ⚠️  BUDGET VIOLATION: Too many concurrent requests (${budgetTracker.currentConcurrent})`);
      }
      
      const startTime = performance.now();
      request.headers.set('X-Budget-Start', startTime.toString());
      
      return request;
    });

    budgetClient.interceptors.response.use((response) => {
      const startTime = parseFloat(response.request.headers.get('X-Budget-Start') || '0');
      const duration = performance.now() - startTime;
      
      budgetTracker.currentConcurrent--;
      budgetTracker.totalTime += duration;
      
      // Check request time budget
      if (duration > performanceBudgets.maxRequestTime) {
        budgetTracker.violations.push(`Request time exceeded: ${duration.toFixed(0)}ms`);
        console.log(`   ⚠️  BUDGET VIOLATION: Request too slow (${duration.toFixed(0)}ms)`);
      }
      
      // Check total time budget
      if (budgetTracker.totalTime > performanceBudgets.maxTotalTime) {
        budgetTracker.violations.push(`Total time budget exceeded: ${budgetTracker.totalTime.toFixed(0)}ms`);
        console.log(`   ⚠️  BUDGET VIOLATION: Total time exceeded (${budgetTracker.totalTime.toFixed(0)}ms)`);
      }
      
      // Track errors
      if (response.status >= 400) {
        budgetTracker.errorCount++;
      }
      
      // Check error rate budget
      const errorRate = budgetTracker.errorCount / budgetTracker.requestCount;
      if (errorRate > performanceBudgets.maxErrorRate) {
        budgetTracker.violations.push(`Error rate exceeded: ${(errorRate * 100).toFixed(1)}%`);
        console.log(`   ⚠️  BUDGET VIOLATION: Error rate too high (${(errorRate * 100).toFixed(1)}%)`);
      }
      
      console.log(`   ✅ Request within budget: ${duration.toFixed(0)}ms`);
      return response;
    });

    console.log('   📡 Testing performance budgets...');

    // Test requests that may violate budgets
    const budgetTests = [
      budgetClient.get('/get'),                    // Should be fast
      budgetClient.get('/delay/1'),                // Should be acceptable  
      budgetClient.get('/delay/3'),                // May violate time budget
      budgetClient.get('/status/500').catch(() => {}), // Will violate error budget
    ];

    await Promise.allSettled(budgetTests);

    // Report budget performance
    console.log('\n   💰 Performance Budget Report:');
    console.log(`      Total Requests: ${budgetTracker.requestCount}`);
    console.log(`      Total Time: ${budgetTracker.totalTime.toFixed(0)}ms (Budget: ${performanceBudgets.maxTotalTime}ms)`);
    console.log(`      Error Rate: ${((budgetTracker.errorCount / budgetTracker.requestCount) * 100).toFixed(1)}% (Budget: ${performanceBudgets.maxErrorRate * 100}%)`);
    console.log(`      Budget Violations: ${budgetTracker.violations.length}`);
    
    if (budgetTracker.violations.length > 0) {
      console.log('      Violations:');
      budgetTracker.violations.forEach(violation => {
        console.log(`        - ${violation}`);
      });
    } else {
      console.log('      🎉 All performance budgets met!');
    }

    console.log();

  } catch (error) {
    console.error('❌ Performance budgets test failed:', error);
  }
}

// Main function to run all timer examples
async function main() {
  console.log('🚀 Timer and Performance Monitoring Examples\n');
  console.log('==========================================\n');

  await demonstrateBasicTiming();
  await demonstratePerformanceMonitoring();
  await demonstrateRealtimeMetrics();
  await demonstrateResourceTiming();
  await demonstratePerformanceBudgets();

  console.log('🎉 All timer examples completed!');
}

// Execute only if this file is run directly
if (require.main === module) {
  main().catch(console.error);
}

export {
  demonstrateBasicTiming,
  demonstratePerformanceMonitoring,
  demonstrateRealtimeMetrics,
  demonstrateResourceTiming,
  demonstratePerformanceBudgets,
  RequestTimer
};