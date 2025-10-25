/**
 * API Client Library - HTTP Client Implementation
 *
 * @description Main HTTP client class that provides a high-level interface
 * for making HTTP requests with advanced features like interceptors, automatic
 * retries, timeout handling, and comprehensive error management.
 *
 * @author API Client Library
 * @version 1.1.1
 */

import type {
  ClientConfig,
  RequestConfig,
  RequestOptions,
  Body,
} from "./types";
import { Interceptor } from "./interceptor";
import { ApiError, ApiRequest, ApiResponse } from "./core";
import { DEFAULT_RESPONSE_TYPE, ERROR_CODES } from "./constants";

/**
 * High-performance API client with automatic retries, interceptors, and type safety
 *
 * @description Modern HTTP client built on the native fetch API with enterprise-grade
 * features including request/response interceptors, automatic retry logic with
 * exponential backoff, comprehensive error handling, and full TypeScript support.
 *
 * @example
 * ```typescript
 * // Basic usage
 * const api = new Client({
 *   baseURL: 'https://api.example.com',
 *   timeout: 10000,
 *   headers: {
 *     'Authorization': 'Bearer your-token',
 *     'Content-Type': 'application/json'
 *   }
 * });
 *
 * // Make requests
 * const users = await api.get('/users');
 * const newUser = await api.post('/users', { name: 'John', email: 'john@example.com' });
 *
 * // With interceptors
 * api.interceptors.request.use((request) => {
 *   console.log('Sending request to:', request.url);
 *   return request;
 * });
 *
 * api.interceptors.response.use((response) => {
 *   console.log('Received response:', response.status);
 *   return response;
 * });
 * ```
 */
export class Client {
  /**
   * Request and response interceptors for middleware processing
   *
   * @description Provides hooks to transform requests before they're sent
   * and responses before they're returned. Useful for authentication,
   * logging, error handling, and data transformation.
   *
   * @example
   * ```typescript
   * // Add authentication to all requests
   * api.interceptors.request.use((request) => {
   *   request.headers.set('Authorization', `Bearer ${getToken()}`);
   *   return request;
   * });
   *
   * // Handle errors globally
   * api.interceptors.response.use((response) => {
   *   if (response.status === 401) {
   *     redirectToLogin();
   *   }
   *   return response;
   * });
   * ```
   */
  public readonly interceptors: {
    request: Interceptor<ApiRequest>;
    response: Interceptor<ApiResponse>;
  };

  /**
   * Client configuration with default headers
   *
   * @private
   * @description Stores the client configuration with guaranteed headers object
   */
  private readonly config: Required<Pick<ClientConfig, "headers">> &
    ClientConfig;

  /**
   * Create a new Client instance
   *
   * @param config - Client configuration options
   * @param config.baseURL - Base URL for all requests (e.g., 'https://api.example.com')
   * @param config.timeout - Request timeout in milliseconds (default: no timeout)
   * @param config.headers - Default headers to include in all requests
   * @param config.retryConfig - Retry configuration for failed requests
   * @param config.responseType - Default response parsing type ('json', 'text', 'blob', etc.)
   *
   * @description Initializes the HTTP client with the provided configuration.
   * Sets up interceptors and validates the configuration for common issues.
   *
   * @example
   * ```typescript
   * // Minimal configuration
   * const api = new Client();
   *
   * // Full configuration
   * const api = new Client({
   *   baseURL: 'https://api.example.com',
   *   timeout: 15000,
   *   headers: {
   *     'User-Agent': 'MyApp/1.0',
   *     'Accept': 'application/json',
   *     'Authorization': 'Bearer your-token'
   *   },
   *   retryConfig: {
   *     retries: 3,
   *     retryDelay: 1000,
   *     retryCondition: (error) => error.status >= 500
   *   },
   *   responseType: 'json'
   * });
   * ```
   *
   * @throws {Error} When configuration is invalid (negative timeout, invalid baseURL format)
   */
  constructor(config: ClientConfig = {}) {
    // Ensure headers is always an object
    this.config = {
      headers: {},
      ...config,
    };

    // Initialize interceptors
    this.interceptors = {
      request: new Interceptor<ApiRequest>(),
      response: new Interceptor<ApiResponse>(),
    };

    // Validate configuration for common issues
    this.validateConfig();
  }

  /**
   * Validates the provided configuration.
   *
   * @private
   * @throws {Error} If the configuration is invalid (e.g., invalid baseURL or timeout).
   */
  private validateConfig(): void {
    if (this.config.timeout && this.config.timeout <= 0) {
      // Timeout must be positive
      throw new Error("Timeout must be greater than 0");
    }

    if (this.config.baseURL && !/^https?:\/\//.test(this.config.baseURL)) {
      // Base URL should be a valid HTTP or HTTPS URL
      throw new Error("BaseURL must be a valid HTTP/HTTPS URL");
    }
  }

  // ===============================================================
  // ============= HTTP Request Methods =============================
  // ===============================================================

  /**
   * Sends an HTTP GET request
   *
   * @template T - The expected response data type
   * @param url - The endpoint path (relative to baseURL or absolute URL)
   * @param options - Optional request configuration
   * @param options.headers - Request-specific headers
   * @param options.timeout - Request-specific timeout in milliseconds
   * @param options.responseType - Response parsing type override
   * @param options.retryConfig - Request-specific retry configuration
   * 
   * @returns Promise resolving to parsed response data of type T
   * 
   * @throws {ApiError} When the request fails or returns an error status
   * 
   * @example
   * ```typescript
   * // Simple GET request
   * const users = await api.get<User[]>('/users');
   * 
   * // GET with custom headers
   * const user = await api.get<User>('/users/123', {
   *   headers: { 'Cache-Control': 'no-cache' }
   * });
   * 
   * // GET with timeout
   * const data = await api.get('/slow-endpoint', {
   *   timeout: 5000
   * });
   * ```
   */
  async get<T = unknown>(
    url: string,
    options: RequestOptions = {}
  ): Promise<T> {
    return this.execute<T>({ ...options, url, method: "GET" });
  }

  /**
   * Sends an HTTP POST request
   *
   * @template T - The expected response data type
   * @param url - The endpoint path (relative to baseURL or absolute URL)
   * @param data - Request body payload (JSON object, FormData, string, etc.)
   * @param options - Optional request configuration
   * @param options.headers - Request-specific headers  
   * @param options.timeout - Request-specific timeout in milliseconds
   * @param options.responseType - Response parsing type override
   * @param options.retryConfig - Request-specific retry configuration
   * 
   * @returns Promise resolving to parsed response data of type T
   * 
   * @throws {ApiError} When the request fails or returns an error status
   * 
   * @example
   * ```typescript
   * // POST JSON data
   * const newUser = await api.post<User>('/users', {
   *   name: 'John Doe',
   *   email: 'john@example.com'
   * });
   * 
   * // POST FormData
   * const formData = new FormData();
   * formData.append('file', file);
   * const result = await api.post('/upload', formData);
   * 
   * // POST with custom headers
   * const response = await api.post('/webhook', payload, {
   *   headers: { 'X-Webhook-Secret': secret }
   * });
   * ```
   */
  async post<T = unknown>(
    url: string,
    data?: Body,
    options: RequestOptions = {}
  ): Promise<T> {
    return this.execute<T>({ ...options, data, url, method: "POST" });
  }

  /**
   * Sends an HTTP PUT request
   *
   * @template T - The expected response data type
   * @param url - The endpoint path (relative to baseURL or absolute URL)
   * @param data - Request body payload for updating the entire resource
   * @param options - Optional request configuration
   * 
   * @returns Promise resolving to parsed response data of type T
   * 
   * @throws {ApiError} When the request fails or returns an error status
   * 
   * @example
   * ```typescript
   * // Update entire user resource
   * const updatedUser = await api.put<User>('/users/123', {
   *   id: 123,
   *   name: 'Jane Doe',
   *   email: 'jane@example.com',
   *   status: 'active'
   * });
   * ```
   */
  async put<T = unknown>(
    url: string,
    data?: Body,
    options: RequestOptions = {}
  ): Promise<T> {
    return this.execute<T>({ ...options, url, method: "PUT", data });
  }

  /**
   * Sends an HTTP PATCH request
   *
   * @template T - The expected response data type  
   * @param url - The endpoint path (relative to baseURL or absolute URL)
   * @param data - Partial payload to update specific fields of the resource
   * @param options - Optional request configuration
   * 
   * @returns Promise resolving to parsed response data of type T
   * 
   * @throws {ApiError} When the request fails or returns an error status
   * 
   * @example
   * ```typescript
   * // Partial update of user
   * const user = await api.patch<User>('/users/123', {
   *   name: 'Updated Name'  // Only update the name field
   * });
   * ```
   */
  async patch<T = unknown>(
    url: string,
    data?: Body,
    options: RequestOptions = {}
  ): Promise<T> {
    return this.execute<T>({ ...options, url, method: "PATCH", data });
  }

  /**
   * Sends an HTTP DELETE request
   *
   * @template T - The expected response data type (often void or deletion confirmation)
   * @param url - The endpoint path (relative to baseURL or absolute URL)
   * @param options - Optional request configuration
   * 
   * @returns Promise resolving to parsed response data of type T
   * 
   * @throws {ApiError} When the request fails or returns an error status
   * 
   * @example
   * ```typescript
   * // Delete a user
   * await api.delete('/users/123');
   * 
   * // Delete with confirmation response
   * const result = await api.delete<{success: boolean}>('/users/123');
   * ```
   */
  async delete<T = unknown>(
    url: string,
    options: RequestOptions = {}
  ): Promise<T> {
    return this.execute<T>({ ...options, url, method: "DELETE" });
  }

  /**
   * Sends an HTTP HEAD request.
   *
   * @param url - The endpoint path.
   * @param options - Additional request options.
   * @returns Parsed response headers as `T`.
   */
  async head<T = unknown>(
    url: string,
    options: RequestOptions = {}
  ): Promise<T> {
    return this.execute<T>({ ...options, url, method: "HEAD" });
  }

  // ===============================================================
  // ============= Utility Methods =================================
  // ===============================================================

  /**
   * Sets a default header applied to all outgoing requests.
   *
   * @param name - The header name.
   * @param value - The header value.
   */
  setHeader(name: string, value: string): void {
    this.config.headers[name] = value;
  }

  /**
   * Removes a default header.
   *
   * @param name - The header name to remove.
   */
  removeHeader(name: string): void {
    delete this.config.headers[name];
  }

  /**
   * Returns the current client configuration.
   *
   * @returns A read-only copy of the configuration.
   */
  getConfig(): Readonly<ClientConfig> {
    return { ...this.config };
  }

  /**
   * Executes a high-level HTTP request and automatically parses the response.
   *
   * @param requestConfig - The full request configuration (method, URL, body, etc.).
   * @returns Parsed data of type `T`.
   */
  private async execute<T>(requestConfig: RequestConfig): Promise<T> {
    const response = await this.request(requestConfig);
    return response.getData<T>();
  }

  /**
   * Executes the raw request flow:
   * 1. Merges configurations.
   * 2. Applies request interceptors.
   * 3. Sends the HTTP request.
   * 4. Applies response interceptors.
   *
   * @param requestConfig - The user-supplied request configuration.
   * @returns The wrapped {@link ApiResponse} instance.
   * @throws {ApiError} If the request or response fails.
   */
  async request(requestConfig: RequestConfig): Promise<ApiResponse> {
    const mergedConfig = this.mergeConfig(requestConfig);
    const apiRequest = new ApiRequest(mergedConfig);

    try {
      // Apply request interceptors before sending
      const processedRequest = await this.interceptors.request.execute(
        apiRequest
      );

      // Execute network request
      const rawResponse = await processedRequest.send();

      // Wrap in ApiResponse and apply response interceptors
      const apiResponse = new ApiResponse(rawResponse, processedRequest);
      return this.interceptors.response.execute(apiResponse);
    } catch (error) {
      // Normalize and rethrow errors as ApiError
      const apiError = this.normalizeError(error, apiRequest);
      throw apiError;
    }
  }

  /**
   * Merges the global client configuration with per-request overrides.
   *
   * @private
   * @param requestConfig - The specific request configuration.
   * @returns The merged configuration object.
   */
  private mergeConfig(requestConfig: RequestConfig): RequestConfig {
    return {
      ...this.config,
      ...requestConfig,
      headers: {
        ...this.config.headers,
        ...requestConfig.headers,
      },
      responseType:
        requestConfig.responseType ??
        this.config.responseType ??
        DEFAULT_RESPONSE_TYPE,
    };
  }

  /**
   * Converts any thrown error into a consistent {@link ApiError}.
   *
   * @private
   * @param error - The error caught during request execution.
   * @param request - The associated {@link ApiRequest}.
   * @returns A normalized {@link ApiError} instance.
   */
  private normalizeError(error: unknown, request: ApiRequest): ApiError {
    if (error instanceof ApiError) {
      return error; // Already normalized
    }

    if (error instanceof Error) {
      return ApiError.fromNetworkError(error, request);
    }

    return new ApiError(
      ERROR_CODES.UNKNOWN_ERROR,
      0,
      error ? String(error) : "Unknown error occurred",
      undefined,
      request
    );
  }
}