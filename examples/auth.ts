/**
 * Authentication Examples
 * 
 * This example demonstrates various authentication methods
 * using the fetch-client library, including Bearer tokens,
 * API keys, Basic authentication, and custom auth schemes.
 */

import { Client, ApiError } from '../libs/index';

// Demo authentication credentials (for testing only)
const AUTH_CONFIG = {
  bearerToken: 'demo-bearer-token-12345',
  apiKey: 'demo-api-key-67890',
  basicAuth: {
    username: 'demo-user',
    password: 'demo-password'
  },
  customToken: 'custom-auth-token-xyz'
};

async function demonstrateBearerTokenAuth() {
  console.log('🔐 Bearer Token Authentication Example\n');

  try {
    console.log('🔧 1. Setting up Bearer token authentication...');

    // Client with Bearer token in headers
    const bearerClient = new Client({
      baseURL: 'https://httpbin.org',
      headers: {
        'Authorization': `Bearer ${AUTH_CONFIG.bearerToken}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('   📡 Making authenticated request...');
    const response = await bearerClient.get('/bearer');
    
    console.log('   ✅ Bearer token request successful');
    console.log('   📊 Response includes authentication info');
    console.log();

    // Dynamic Bearer token update
    console.log('🔧 2. Updating Bearer token dynamically...');
    const newToken = 'updated-bearer-token-54321';
    bearerClient.setHeader('Authorization', `Bearer ${newToken}`);
    
    console.log('   📡 Making request with updated token...');
    const updatedResponse = await bearerClient.get('/headers');
    console.log('   ✅ Updated Bearer token request successful');
    console.log();

  } catch (error) {
    if (error instanceof ApiError) {
      console.error('❌ Bearer auth failed:', error.message);
      console.error('   Status:', error.status);
    } else {
      console.error('❌ Unexpected error:', error);
    }
  }
}

async function demonstrateAPIKeyAuth() {
  console.log('🔐 API Key Authentication Example\n');

  try {
    console.log('🔧 3. Setting up API key authentication...');

    // Client with API key in headers
    const apiKeyClient = new Client({
      baseURL: 'https://httpbin.org',
      headers: {
        'X-API-Key': AUTH_CONFIG.apiKey,
        'Content-Type': 'application/json'
      }
    });

    console.log('   📡 Making API key authenticated request...');
    const headerResponse = await apiKeyClient.get('/headers');
    
    console.log('   ✅ API key request successful');
    console.log('   📊 Headers sent include API key');
    console.log();

    // API key in query parameters
    console.log('🔧 4. API key in query parameters...');
    const queryApiClient = new Client({
      baseURL: 'https://httpbin.org'
    });

    console.log('   📡 Making request with API key in query...');
    const queryResponse = await queryApiClient.get('/get', {
      params: {
        'api_key': AUTH_CONFIG.apiKey,
        'format': 'json'
      }
    });

    console.log('   ✅ Query parameter API key request successful');
    console.log();

  } catch (error) {
    if (error instanceof ApiError) {
      console.error('❌ API key auth failed:', error.message);
    } else {
      console.error('❌ Unexpected error:', error);
    }
  }
}

async function demonstrateBasicAuth() {
  console.log('🔐 Basic Authentication Example\n');

  try {
    console.log('🔧 5. Setting up Basic authentication...');

    // Encode credentials for Basic auth
    const credentials = btoa(`${AUTH_CONFIG.basicAuth.username}:${AUTH_CONFIG.basicAuth.password}`);
    
    const basicAuthClient = new Client({
      baseURL: 'https://httpbin.org',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('   📡 Making Basic auth request...');
    const response = await basicAuthClient.get('/basic-auth/demo-user/demo-password');
    
    console.log('   ✅ Basic authentication successful');
    console.log('   📊 Authenticated user info received');
    console.log();

    // Alternative Basic auth setup
    console.log('🔧 6. Alternative Basic auth configuration...');
    
    // Helper function to create Basic auth header
    const createBasicAuthHeader = (username: string, password: string): string => {
      return `Basic ${btoa(`${username}:${password}`)}`;
    };

    const altBasicClient = new Client({
      baseURL: 'https://httpbin.org'
    });

    console.log('   📡 Making request with helper function...');
    const altResponse = await altBasicClient.get('/basic-auth/test-user/test-pass', {
      headers: {
        'Authorization': createBasicAuthHeader('test-user', 'test-pass')
      }
    });

    console.log('   ✅ Alternative Basic auth successful');
    console.log();

  } catch (error) {
    if (error instanceof ApiError) {
      console.error('❌ Basic auth failed:', error.message);
      if (error.status === 401) {
        console.error('   🔒 Invalid credentials provided');
      }
    } else {
      console.error('❌ Unexpected error:', error);
    }
  }
}

async function demonstrateCustomAuthSchemes() {
  console.log('🔐 Custom Authentication Schemes Example\n');

  try {
    console.log('🔧 7. Setting up custom authentication...');

    // Custom auth scheme 1: Signature-based
    const generateSignature = (method: string, url: string, timestamp: string): string => {
      // Simplified signature generation (in real app, use proper crypto)
      const data = `${method}|${url}|${timestamp}|${AUTH_CONFIG.customToken}`;
      return btoa(data).substring(0, 16);
    };

    const customAuthClient = new Client({
      baseURL: 'https://httpbin.org'
    });

    // Add request interceptor for custom auth
    customAuthClient.interceptors.request.use((request) => {
      const timestamp = new Date().toISOString();
      const signature = generateSignature(request.method, request.url, timestamp);
      
      request.headers.set('X-Auth-Token', AUTH_CONFIG.customToken);
      request.headers.set('X-Auth-Timestamp', timestamp);
      request.headers.set('X-Auth-Signature', signature);
      request.headers.set('X-Auth-Version', '1.0');
      
      return request;
    });

    console.log('   📡 Making request with custom auth...');
    const customResponse = await customAuthClient.get('/headers');
    
    console.log('   ✅ Custom authentication request successful');
    console.log('   📊 Custom headers included in request');
    console.log();

    // Custom auth scheme 2: JWT-like token
    console.log('🔧 8. JWT-like token authentication...');
    
    const createJWTLikeToken = (payload: any): string => {
      // Simplified JWT-like token (not a real JWT)
      const header = btoa(JSON.stringify({ alg: 'demo', typ: 'JWT' }));
      const payloadStr = btoa(JSON.stringify(payload));
      const signature = btoa('demo-signature');
      return `${header}.${payloadStr}.${signature}`;
    };

    const jwtToken = createJWTLikeToken({
      sub: 'demo-user',
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600 // 1 hour
    });

    const jwtClient = new Client({
      baseURL: 'https://httpbin.org',
      headers: {
        'Authorization': `Bearer ${jwtToken}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('   📡 Making JWT-like token request...');
    const jwtResponse = await jwtClient.get('/bearer');
    
    console.log('   ✅ JWT-like token request successful');
    console.log();

  } catch (error) {
    if (error instanceof ApiError) {
      console.error('❌ Custom auth failed:', error.message);
    } else {
      console.error('❌ Unexpected error:', error);
    }
  }
}

async function demonstrateAuthInterceptors() {
  console.log('🔐 Authentication Interceptors Example\n');

  try {
    console.log('🔧 9. Setting up authentication interceptors...');

    // Simulate token storage
    let authToken = 'initial-token-12345';
    let tokenExpiry = Date.now() + 60000; // 1 minute from now

    const interceptorClient = new Client({
      baseURL: 'https://httpbin.org'
    });

    // Request interceptor for automatic token injection
    interceptorClient.interceptors.request.use((request) => {
      // Check if token is expired
      if (Date.now() > tokenExpiry) {
        console.log('   🔄 Token expired, refreshing...');
        // Simulate token refresh
        authToken = `refreshed-token-${Date.now()}`;
        tokenExpiry = Date.now() + 60000;
        console.log('   ✅ Token refreshed');
      }

      // Add auth header
      request.headers.set('Authorization', `Bearer ${authToken}`);
      request.headers.set('X-Client-Version', '1.0.0');
      
      return request;
    });

    // Response interceptor for auth error handling
    interceptorClient.interceptors.response.use((response) => {
      if (response.status === 401) {
        console.log('   🔒 Received 401 - authentication failed');
        // In real app, might redirect to login or refresh token
      }
      return response;
    });

    console.log('   📡 Making requests with interceptor-managed auth...');
    
    // Make multiple requests to test interceptor
    for (let i = 0; i < 3; i++) {
      try {
        const response = await interceptorClient.get(`/headers?request=${i + 1}`);
        console.log(`   ✅ Request ${i + 1} successful with auto-auth`);
      } catch (error) {
        console.log(`   ❌ Request ${i + 1} failed`);
      }
      
      // Small delay
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log();

  } catch (error) {
    if (error instanceof ApiError) {
      console.error('❌ Auth interceptor failed:', error.message);
    } else {
      console.error('❌ Unexpected error:', error);
    }
  }
}

async function demonstrateMultipleAuthMethods() {
  console.log('🔐 Multiple Authentication Methods Example\n');

  try {
    console.log('🔧 10. Testing multiple authentication approaches...');

    // Different clients for different APIs/services
    const services = [
      {
        name: 'Service A (Bearer Token)',
        client: new Client({
          baseURL: 'https://httpbin.org',
          headers: {
            'Authorization': `Bearer ${AUTH_CONFIG.bearerToken}`,
            'X-Service': 'service-a'
          }
        }),
        endpoint: '/bearer'
      },
      {
        name: 'Service B (API Key)',
        client: new Client({
          baseURL: 'https://httpbin.org',
          headers: {
            'X-API-Key': AUTH_CONFIG.apiKey,
            'X-Service': 'service-b'
          }
        }),
        endpoint: '/headers'
      },
      {
        name: 'Service C (Custom)',
        client: new Client({
          baseURL: 'https://httpbin.org',
          headers: {
            'X-Custom-Auth': AUTH_CONFIG.customToken,
            'X-Service': 'service-c'
          }
        }),
        endpoint: '/headers'
      }
    ];

    // Test all services concurrently
    console.log('   📡 Testing multiple services concurrently...');
    
    const results = await Promise.allSettled(
      services.map(async (service) => {
        try {
          const response = await service.client.get(service.endpoint);
          return {
            service: service.name,
            status: 'success',
            response
          };
        } catch (error) {
          return {
            service: service.name,
            status: 'error',
            error: error instanceof ApiError ? error.message : String(error)
          };
        }
      })
    );

    // Report results
    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        const data = result.value;
        if (data.status === 'success') {
          console.log(`   ✅ ${data.service}: Authentication successful`);
        } else {
          console.log(`   ❌ ${data.service}: ${data.error}`);
        }
      } else {
        console.log(`   ❌ ${services[index].name}: Promise rejected`);
      }
    });

    console.log();

  } catch (error) {
    console.error('❌ Multiple auth methods test failed:', error);
  }
}

// Main function to run all authentication examples
async function main() {
  console.log('🚀 Authentication Examples\n');
  console.log('==========================================\n');

  await demonstrateBearerTokenAuth();
  await demonstrateAPIKeyAuth();
  await demonstrateBasicAuth();
  await demonstrateCustomAuthSchemes();
  await demonstrateAuthInterceptors();
  await demonstrateMultipleAuthMethods();

  console.log('🎉 All authentication examples completed!');
}

// Execute only if this file is run directly
if (require.main === module) {
  main().catch(console.error);
}

export {
  demonstrateBearerTokenAuth,
  demonstrateAPIKeyAuth,
  demonstrateBasicAuth,
  demonstrateCustomAuthSchemes,
  demonstrateAuthInterceptors,
  demonstrateMultipleAuthMethods
};