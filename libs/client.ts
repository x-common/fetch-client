/**
 * API Client Library - HTTP Client Implementation
 *
 * @description Main HTTP client class that provides a high-level interface
 * for making HTTP requests with advanced features like interceptors, automatic
 * retries, timeout handling, and comprehensive error management.
 *
 * @author API Client Library
 * @version 1.0.0
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
   * Create a new ApiClient instance
   *
   * @param config - Client configuration options
   *
   * @description Initializes the HTTP client with the provided configuration.
   * Sets up interceptors and validates the configuration for common issues.
   *
   * @example
   * ```typescript
   * // Minimal configuration
   * const api = new ApiClient();
   *
   * // Full configuration
   * const api = new ApiClient({
   *   baseURL: 'https://api.example.com',
   *   timeout: 15000,
   *   headers: {
   *     'User-Agent': 'MyApp/1.0',
   *     'Accept': 'application/json'
   *   },
   *   retry: {
   *     maxRetries: 3,
   *     delay: 1000
   *   }
   * });
   * ```
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
   * Sends an HTTP GET request.
   *
   * @param url - The endpoint path (relative or absolute).
   * @param options - Optional request options such as headers or query params.
   * @returns Parsed response data of type `T`.
   */
  async get<T = unknown>(
    url: string,
    options: RequestOptions = {}
  ): Promise<T> {
    return this.execute<T>({ ...options, url, method: "GET" });
  }

  /**
   * Sends an HTTP POST request.
   *
   * @param url - The endpoint path.
   * @param data - Optional request body payload.
   * @param options - Additional request options.
   * @returns Parsed response data of type `T`.
   */
  async post<T = unknown>(
    url: string,
    data?: Body,
    options: RequestOptions = {}
  ): Promise<T> {
    return this.execute<T>({ ...options, data, url, method: "POST" });
  }

  /**
   * Sends an HTTP PUT request.
   *
   * @param url - The endpoint path.
   * @param data - Optional request body payload.
   * @param options - Additional request options.
   * @returns Parsed response data of type `T`.
   */
  async put<T = unknown>(
    url: string,
    data?: Body,
    options: RequestOptions = {}
  ): Promise<T> {
    return this.execute<T>({ ...options, url, method: "PUT", data });
  }

  /**
   * Sends an HTTP PATCH request.
   *
   * @param url - The endpoint path.
   * @param data - Partial payload to update the resource.
   * @param options - Additional request options.
   * @returns Parsed response data of type `T`.
   */
  async patch<T = unknown>(
    url: string,
    data?: Body,
    options: RequestOptions = {}
  ): Promise<T> {
    return this.execute<T>({ ...options, url, method: "PATCH", data });
  }

  /**
   * Sends an HTTP DELETE request.
   *
   * @param url - The endpoint path.
   * @param options - Additional request options.
   * @returns Parsed response data of type `T`.
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