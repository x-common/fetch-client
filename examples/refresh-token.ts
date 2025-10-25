/**
 * Refresh Token Authentication Examples
 * 
 * This example demonstrates how to implement refresh token authentication
 * with the fetch-client library, including automatic token refresh,
 * token storage, and handling expired tokens.
 */

import { Client, ApiError, ERROR_CODES } from '../libs/index';

// Token storage interface
interface TokenData {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  tokenType: string;
}

// Simple token storage (in production, use secure storage)
class TokenStorage {
  private tokens: TokenData | null = null;

  setTokens(tokens: TokenData): void {
    this.tokens = tokens;
    console.log('🔒 Tokens stored securely');
  }

  getTokens(): TokenData | null {
    return this.tokens;
  }

  clearTokens(): void {
    this.tokens = null;
    console.log('🗑️  Tokens cleared');
  }

  isTokenExpired(): boolean {
    if (!this.tokens) return true;
    return Date.now() >= this.tokens.expiresAt;
  }

  getValidAccessToken(): string | null {
    if (!this.tokens || this.isTokenExpired()) {
      return null;
    }
    return this.tokens.accessToken;
  }
}

// Auth service for handling token operations
class AuthService {
  private tokenStorage: TokenStorage;
  private authClient: Client;

  constructor() {
    this.tokenStorage = new TokenStorage();
    
    // Separate client for auth operations to avoid circular dependency
    this.authClient = new Client({
      baseURL: 'https://httpbin.org', // Using httpbin for demo
      timeout: 10000
    });
  }

  // Simulate login and get initial tokens
  async login(username: string, password: string): Promise<boolean> {
    console.log('🔐 Attempting login...');
    
    try {
      // Simulate login request
      const response = await this.authClient.post('/post', {
        username,
        password,
        grant_type: 'password'
      });

      // Simulate successful login response
      const tokenData: TokenData = {
        accessToken: `access_token_${Date.now()}`,
        refreshToken: `refresh_token_${Date.now()}`,
        expiresAt: Date.now() + (15 * 60 * 1000), // 15 minutes
        tokenType: 'Bearer'
      };

      this.tokenStorage.setTokens(tokenData);
      console.log('✅ Login successful');
      console.log(`   Access token expires at: ${new Date(tokenData.expiresAt).toLocaleTimeString()}`);
      
      return true;
    } catch (error) {
      console.error('❌ Login failed:', error);
      return false;
    }
  }

  // Refresh access token using refresh token
  async refreshAccessToken(): Promise<boolean> {
    console.log('🔄 Refreshing access token...');
    
    const tokens = this.tokenStorage.getTokens();
    if (!tokens?.refreshToken) {
      console.error('❌ No refresh token available');
      return false;
    }

    try {
      // Simulate refresh token request
      const response = await this.authClient.post('/post', {
        refresh_token: tokens.refreshToken,
        grant_type: 'refresh_token'
      });

      // Simulate new token response
      const newTokenData: TokenData = {
        accessToken: `refreshed_access_token_${Date.now()}`,
        refreshToken: tokens.refreshToken, // Refresh token usually stays the same
        expiresAt: Date.now() + (15 * 60 * 1000), // New 15 minutes
        tokenType: 'Bearer'
      };

      this.tokenStorage.setTokens(newTokenData);
      console.log('✅ Token refreshed successfully');
      console.log(`   New access token expires at: ${new Date(newTokenData.expiresAt).toLocaleTimeString()}`);
      
      return true;
    } catch (error) {
      console.error('❌ Token refresh failed:', error);
      this.tokenStorage.clearTokens(); // Clear invalid tokens
      return false;
    }
  }

  // Get valid access token, refresh if necessary
  async getValidAccessToken(): Promise<string | null> {
    const validToken = this.tokenStorage.getValidAccessToken();
    if (validToken) {
      return validToken;
    }

    console.log('⚠️  Access token expired, attempting refresh...');
    const refreshSuccess = await this.refreshAccessToken();
    
    if (refreshSuccess) {
      return this.tokenStorage.getValidAccessToken();
    }

    return null;
  }

  // Logout and clear tokens
  async logout(): Promise<void> {
    console.log('👋 Logging out...');
    
    const tokens = this.tokenStorage.getTokens();
    if (tokens?.refreshToken) {
      try {
        // Simulate logout request to invalidate refresh token
        await this.authClient.post('/post', {
          refresh_token: tokens.refreshToken,
          action: 'logout'
        });
        console.log('✅ Server logout successful');
      } catch (error) {
        console.log('⚠️  Server logout failed, but clearing local tokens');
      }
    }

    this.tokenStorage.clearTokens();
    console.log('✅ Logout completed');
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    return this.tokenStorage.getTokens() !== null;
  }
}

async function demonstrateBasicRefreshToken() {
  console.log('🔄 Basic Refresh Token Authentication Example\n');

  try {
    const authService = new AuthService();

    console.log('🔧 1. Setting up refresh token authentication...');

    // Create API client with automatic token injection
    const apiClient = new Client({
      baseURL: 'https://httpbin.org',
      timeout: 10000
    });

    // Request interceptor for automatic token injection
    apiClient.interceptors.request.use(async (request) => {
      const accessToken = await authService.getValidAccessToken();
      
      if (accessToken) {
        request.headers.set('Authorization', `Bearer ${accessToken}`);
        console.log(`   🔑 Added access token to request: ${request.method} ${request.url}`);
      } else {
        console.log('   ⚠️  No valid access token available');
      }

      return request;
    });

    // Response interceptor for handling 401 errors
    apiClient.interceptors.response.use(async (response) => {
      if (response.status === 401) {
        console.log('   🔒 Received 401 Unauthorized - token may be invalid');
        
        // Try to refresh token
        const refreshSuccess = await authService.refreshAccessToken();
        if (!refreshSuccess) {
          console.log('   ❌ Token refresh failed - user needs to login again');
        }
      }
      return response;
    });

    // Simulate user login
    console.log('   📡 Performing login...');
    const loginSuccess = await authService.login('demo-user', 'demo-password');
    
    if (!loginSuccess) {
      throw new Error('Login failed');
    }

    // Make authenticated requests
    console.log('   📡 Making authenticated request...');
    await apiClient.get('/headers');
    console.log('   ✅ Authenticated request successful');

    console.log();

  } catch (error) {
    console.error('❌ Basic refresh token test failed:', error);
  }
}

async function demonstrateAutomaticTokenRefresh() {
  console.log('🔄 Automatic Token Refresh Example\n');

  try {
    const authService = new AuthService();

    console.log('🔧 2. Setting up automatic token refresh...');

    // Login first
    await authService.login('demo-user', 'demo-password');

    const autoRefreshClient = new Client({
      baseURL: 'https://httpbin.org',
      timeout: 8000
    });

    // Enhanced request interceptor with automatic refresh
    autoRefreshClient.interceptors.request.use(async (request) => {
      let accessToken = await authService.getValidAccessToken();
      
      // If token is null (expired and refresh failed), try one more time
      if (!accessToken && authService.isAuthenticated()) {
        console.log('   🔄 Attempting token refresh before request...');
        await authService.refreshAccessToken();
        accessToken = await authService.getValidAccessToken();
      }

      if (accessToken) {
        request.headers.set('Authorization', `Bearer ${accessToken}`);
        console.log(`   ✅ Request authorized: ${request.method} ${request.url}`);
      } else {
        console.log(`   ⚠️  Request not authorized: ${request.method} ${request.url}`);
      }

      return request;
    });

    console.log('   📡 Making multiple requests to test auto-refresh...');

    // Make several requests
    for (let i = 1; i <= 3; i++) {
      console.log(`     Request ${i}:`);
      try {
        await autoRefreshClient.get(`/get?request=${i}`);
        console.log(`     ✅ Request ${i} completed`);
      } catch (error) {
        console.log(`     ❌ Request ${i} failed`);
      }

      // Wait a bit between requests
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    console.log();

  } catch (error) {
    console.error('❌ Automatic token refresh test failed:', error);
  }
}

async function demonstrateTokenExpirationHandling() {
  console.log('🔄 Token Expiration Handling Example\n');

  try {
    const authService = new AuthService();

    console.log('🔧 3. Setting up token expiration simulation...');

    // Login and get tokens
    await authService.login('demo-user', 'demo-password');

    const expirationClient = new Client({
      baseURL: 'https://httpbin.org',
      timeout: 10000
    });

    // Request interceptor with detailed token expiration handling
    expirationClient.interceptors.request.use(async (request) => {
      const tokens = authService.isAuthenticated() ? (authService as any).tokenStorage.getTokens() : null;
      
      if (tokens) {
        const timeToExpiry = tokens.expiresAt - Date.now();
        console.log(`   ⏰ Token expires in: ${Math.round(timeToExpiry / 1000)}s`);
        
        // Refresh if token expires within 5 minutes
        if (timeToExpiry < 5 * 60 * 1000) {
          console.log('   🔄 Token expires soon, refreshing proactively...');
          await authService.refreshAccessToken();
        }
      }

      const accessToken = await authService.getValidAccessToken();
      if (accessToken) {
        request.headers.set('Authorization', `Bearer ${accessToken}`);
      }

      return request;
    });

    console.log('   📡 Testing proactive token refresh...');

    // Simulate token near expiration by manually setting expiration time
    const tokens = (authService as any).tokenStorage.getTokens();
    if (tokens) {
      tokens.expiresAt = Date.now() + (3 * 60 * 1000); // 3 minutes from now
      (authService as any).tokenStorage.setTokens(tokens);
      console.log('   ⚠️  Simulated token expiring in 3 minutes');
    }

    await expirationClient.get('/get');
    console.log('   ✅ Request with proactive refresh completed');

    console.log();

  } catch (error) {
    console.error('❌ Token expiration handling test failed:', error);
  }
}

async function demonstrateRetryOnAuthFailure() {
  console.log('🔄 Retry on Authentication Failure Example\n');

  try {
    const authService = new AuthService();

    console.log('🔧 4. Setting up retry on auth failure...');

    await authService.login('demo-user', 'demo-password');

    const retryClient = new Client({
      baseURL: 'https://httpbin.org',
      timeout: 8000,
      retry: {
        maxRetries: 3,
        delay: 1000,
        shouldRetry: (error) => {
          // Retry on auth failures after attempting token refresh
          if (error instanceof Response && error.status === 401) {
            return true;
          }
          return false;
        }
      }
    });

    let authRetryCount = 0;

    // Request interceptor with retry logic
    retryClient.interceptors.request.use(async (request) => {
      // If this is a retry due to auth failure, try to refresh token first
      if (authRetryCount > 0) {
        console.log(`   🔄 Auth retry attempt ${authRetryCount}, refreshing token...`);
        await authService.refreshAccessToken();
      }

      const accessToken = await authService.getValidAccessToken();
      if (accessToken) {
        request.headers.set('Authorization', `Bearer ${accessToken}`);
        request.headers.set('X-Auth-Retry-Count', authRetryCount.toString());
      }

      return request;
    });

    // Response interceptor to track auth failures
    retryClient.interceptors.response.use((response) => {
      if (response.status === 401) {
        authRetryCount++;
        console.log(`   🔒 Auth failure detected (attempt ${authRetryCount})`);
      } else {
        authRetryCount = 0; // Reset on success
      }
      return response;
    });

    console.log('   📡 Testing retry on auth failure...');

    // Simulate expired token
    (authService as any).tokenStorage.tokens.expiresAt = Date.now() - 1000; // Expired
    console.log('   ⚠️  Simulated expired token');

    try {
      await retryClient.get('/headers');
      console.log('   ✅ Request succeeded after auth retry');
    } catch (error) {
      console.log('   ❌ Request failed even after retries');
    }

    console.log();

  } catch (error) {
    console.error('❌ Retry on auth failure test failed:', error);
  }
}

async function demonstrateMultipleClientsWithSharedAuth() {
  console.log('🔄 Multiple Clients with Shared Authentication Example\n');

  try {
    const authService = new AuthService();

    console.log('🔧 5. Setting up multiple clients with shared auth...');

    await authService.login('demo-user', 'demo-password');

    // Create multiple clients for different services
    const apiClient = new Client({
      baseURL: 'https://httpbin.org',
      headers: { 'X-Service': 'api' }
    });

    const uploadClient = new Client({
      baseURL: 'https://httpbin.org',
      headers: { 'X-Service': 'upload' },
      timeout: 30000
    });

    const analyticsClient = new Client({
      baseURL: 'https://httpbin.org',
      headers: { 'X-Service': 'analytics' }
    });

    // Shared auth interceptor function
    const addAuthInterceptor = (client: Client, serviceName: string) => {
      client.interceptors.request.use(async (request) => {
        const accessToken = await authService.getValidAccessToken();
        if (accessToken) {
          request.headers.set('Authorization', `Bearer ${accessToken}`);
          console.log(`   🔑 ${serviceName} service authenticated`);
        }
        return request;
      });
    };

    // Add auth to all clients
    addAuthInterceptor(apiClient, 'API');
    addAuthInterceptor(uploadClient, 'Upload');
    addAuthInterceptor(analyticsClient, 'Analytics');

    console.log('   📡 Making requests from multiple services...');

    // Make concurrent requests from different services
    await Promise.all([
      apiClient.get('/get?service=api'),
      uploadClient.post('/post', { type: 'upload', data: 'file-data' }),
      analyticsClient.get('/get?service=analytics')
    ]);

    console.log('   ✅ All services successfully authenticated');

    // Demonstrate logout affecting all clients
    console.log('   📡 Testing logout effect on all clients...');
    await authService.logout();

    try {
      await apiClient.get('/get?after-logout=true');
      console.log('   ⚠️  Request succeeded without authentication (unexpected)');
    } catch (error) {
      console.log('   ✅ Request properly failed after logout');
    }

    console.log();

  } catch (error) {
    console.error('❌ Multiple clients test failed:', error);
  }
}

async function demonstrateAdvancedTokenManagement() {
  console.log('🔄 Advanced Token Management Example\n');

  try {
    const authService = new AuthService();

    console.log('🔧 6. Setting up advanced token management...');

    // Enhanced token storage with events
    class AdvancedTokenStorage extends TokenStorage {
      private listeners: { [key: string]: Function[] } = {};

      setTokens(tokens: TokenData): void {
        super.setTokens(tokens);
        this.emit('tokensUpdated', tokens);
      }

      clearTokens(): void {
        super.clearTokens();
        this.emit('tokensCleared');
      }

      on(event: string, callback: Function): void {
        if (!this.listeners[event]) {
          this.listeners[event] = [];
        }
        this.listeners[event].push(callback);
      }

      private emit(event: string, data?: any): void {
        if (this.listeners[event]) {
          this.listeners[event].forEach(callback => callback(data));
        }
      }
    }

    const advancedStorage = new AdvancedTokenStorage();

    // Listen for token events
    advancedStorage.on('tokensUpdated', (tokens: TokenData) => {
      console.log('   📢 Token updated event triggered');
      console.log(`      New expiry: ${new Date(tokens.expiresAt).toLocaleTimeString()}`);
    });

    advancedStorage.on('tokensCleared', () => {
      console.log('   📢 Tokens cleared event triggered');
    });

    // Use the advanced storage
    (authService as any).tokenStorage = advancedStorage;

    await authService.login('demo-user', 'demo-password');

    const advancedClient = new Client({
      baseURL: 'https://httpbin.org',
      timeout: 10000
    });

    // Advanced request interceptor with token analytics
    const tokenUsageStats = {
      requestsWithToken: 0,
      requestsWithoutToken: 0,
      tokenRefreshes: 0
    };

    advancedClient.interceptors.request.use(async (request) => {
      const accessToken = await authService.getValidAccessToken();
      
      if (accessToken) {
        request.headers.set('Authorization', `Bearer ${accessToken}`);
        tokenUsageStats.requestsWithToken++;
        
        // Check if this was a refresh
        const tokens = (authService as any).tokenStorage.getTokens();
        if (tokens && tokens.accessToken.includes('refreshed')) {
          tokenUsageStats.tokenRefreshes++;
        }
      } else {
        tokenUsageStats.requestsWithoutToken++;
      }

      return request;
    });

    console.log('   📡 Making requests with advanced token management...');

    // Make multiple requests
    for (let i = 1; i <= 3; i++) {
      await advancedClient.get(`/get?request=${i}`);
    }

    // Force token refresh
    console.log('   🔄 Forcing token refresh...');
    await authService.refreshAccessToken();
    
    await advancedClient.get('/get?after-refresh=true');

    // Display statistics
    console.log('\n   📊 Token Usage Statistics:');
    console.log(`      Requests with token: ${tokenUsageStats.requestsWithToken}`);
    console.log(`      Requests without token: ${tokenUsageStats.requestsWithoutToken}`);
    console.log(`      Token refreshes: ${tokenUsageStats.tokenRefreshes}`);

    console.log();

  } catch (error) {
    console.error('❌ Advanced token management test failed:', error);
  }
}

// Main function to run all refresh token examples
async function main() {
  console.log('🚀 Refresh Token Authentication Examples\n');
  console.log('==========================================\n');

  await demonstrateBasicRefreshToken();
  await demonstrateAutomaticTokenRefresh();
  await demonstrateTokenExpirationHandling();
  await demonstrateRetryOnAuthFailure();
  await demonstrateMultipleClientsWithSharedAuth();
  await demonstrateAdvancedTokenManagement();

  console.log('🎉 All refresh token examples completed!');
}

// Execute only if this file is run directly
if (require.main === module) {
  main().catch(console.error);
}

export {
  demonstrateBasicRefreshToken,
  demonstrateAutomaticTokenRefresh,
  demonstrateTokenExpirationHandling,
  demonstrateRetryOnAuthFailure,
  demonstrateMultipleClientsWithSharedAuth,
  demonstrateAdvancedTokenManagement,
  TokenStorage,
  AuthService
};