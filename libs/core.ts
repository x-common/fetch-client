/**
 * Core API client components - Unified module containing error handling, 
 * request processing, and response parsing functionality
 * 
 * @description This module contains the three core classes that work together
 * to provide HTTP client functionality with advanced error handling, retry logic,
 * and automatic response parsing.
 * 
 * @author API Client Library
 * @version 1.1.1
 * 
 * Classes included:
 * - ApiError: Enhanced error class with detailed context
 * - ApiRequest: HTTP request processor with retry logic
 * - ApiResponse: Response wrapper with automatic parsing
 */

import type { 
  HttpMethod, 
  Body, 
  RequestConfig, 
  RetryConfig,
  ErrorCode
} from './types';
import { 
  DEFAULT_RETRY_STATUSES, 
  RETRY_DEFAULTS, 
  READ_ONLY_METHODS, 
  DEFAULT_HEADERS,
  HTTP_STATUS,
  CONTENT_TYPES,
  ERROR_CODES
} from './constants';

/**
 * Enhanced API error with detailed context and debugging information
 * 
 * @description Extends the native Error class to provide comprehensive
 * error information for API failures. Includes error categorization,
 * retry detection, and debugging context.
 * 
 * @example
 * ```typescript
 * // Handle different error types
 * try {
 *   await api.get('/data');
 * } catch (error) {
 *   if (error instanceof ApiError) {
 *     console.log('Error code:', error.code);        // 'NETWORK_ERROR'
 *     console.log('HTTP status:', error.status);     // 500
 *     console.log('Can retry:', error.isRetryable);  // true
 *     console.log('Response:', error.response);      // Full response object
 *   }
 * }
 * ```
 */
export class ApiError extends Error {
  /**
   * Timestamp when the error occurred (milliseconds since epoch)
   * @description Useful for error tracking and debugging
   */
  public readonly timestamp: number;
  
  /**
   * Create a new ApiError instance
   * 
   * @param code - Categorized error code for programmatic handling
   * @param status - HTTP status code (0 for network errors)
   * @param message - Human-readable error description
   * @param response - Original response object (if available)
   * @param request - Original request object that caused the error
   * 
   * @example
   * ```typescript
   * // Create a custom API error
   * throw new ApiError(
   *   'VALIDATION_ERROR',
   *   400,
   *   'Invalid email format',
   *   response,
   *   request
   * );
   * ```
   */
  constructor(
    public readonly code: ErrorCode,
    public readonly status: number,
    message: string,
    public readonly response?: globalThis.Response | ApiResponse,
    public readonly request?: ApiRequest
  ) {
    super(message);
    this.name = "ApiError";
    this.timestamp = Date.now();
    
    // Maintain proper stack trace for better debugging
    if ('captureStackTrace' in Error) {
      (Error as any).captureStackTrace(this, ApiError);
    }
  }
  
  /**
   * Check if error is retryable based on error type and status code
   * 
   * @returns True if the error should be retried, false otherwise
   * 
   * @description Determines if the error represents a temporary failure
   * that might succeed if retried. Retryable errors include:
   * - Network errors (connection issues)
   * - Timeout errors (request took too long)
   * - Server errors (5xx status codes)
   * 
   * @example
   * ```typescript
   * if (error instanceof ApiError && error.isRetryable) {
   *   // Attempt retry with exponential backoff
   *   console.log('Error can be retried');
   * } else {
   *   // Permanent failure, do not retry
   *   console.log('Error should not be retried');
   * }
   * ```
   */
  get isRetryable(): boolean {
    // Network and timeout errors are always retryable
    return ["NETWORK_ERROR", "TIMEOUT"].includes(this.code) || 
           // Server errors (5xx) are typically temporary
           (this.code === "HTTP_ERROR" && this.status >= 500);
  }
  
  /**
   * Serialize error details to JSON for logging and debugging
   * 
   * @returns Object containing error details suitable for JSON serialization
   * 
   * @description Creates a plain object representation of the error
   * that can be safely serialized to JSON for logging, monitoring,
   * or sending to error tracking services.
   * 
   * @example
   * ```typescript
   * try {
   *   await api.get('/data');
   * } catch (error) {
   *   if (error instanceof ApiError) {
   *     // Log error details
   *     console.log(JSON.stringify(error.toJSON(), null, 2));
   *     
   *     // Send to error tracking service
   *     errorTracker.capture(error.toJSON());
   *   }
   * }
   * ```
   */
  toJSON(): Record<string, unknown> {
    return {
      name: this.name,           // Error class name
      code: this.code,           // Categorized error code
      status: this.status,       // HTTP status code
      message: this.message,     // Human-readable message
      timestamp: this.timestamp, // When error occurred
      url: this.request?.url     // Request URL that failed
    };
  }

  /**
   * Create ApiError from HTTP response
   * 
   * @param response - The HTTP response that indicates failure
   * @param request - The original request that generated this response
   * @returns New ApiError instance with HTTP_ERROR code
   * 
   * @description Factory method for creating errors from HTTP responses
   * with 4xx or 5xx status codes. Automatically extracts status code
   * and creates appropriate error message.
   * 
   * @example
   * ```typescript
   * // Handle HTTP error response
   * if (!response.ok) {
   *   const error = ApiError.fromResponse(response, request);
   *   console.log(error.status); // 404, 500, etc.
   *   throw error;
   * }
   * ```
   */
  static fromResponse(response: globalThis.Response, request?: ApiRequest): ApiError {
    return new ApiError(
      ERROR_CODES.HTTP_ERROR,
      response.status,
      `Request failed with status ${response.status}`,
      response,
      request
    );
  }

  /**
   * Create ApiError for timeout scenarios
   * 
   * @param request - The request that timed out
   * @returns New ApiError instance with TIMEOUT code
   * 
   * @description Factory method for creating timeout errors when
   * requests exceed the specified timeout duration. Always uses
   * 408 (Request Timeout) as the HTTP status code.
   * 
   * @example
   * ```typescript
   * // Handle timeout in fetch
   * const controller = new AbortController();
   * setTimeout(() => controller.abort(), 5000);
   * 
   * try {
   *   await fetch(url, { signal: controller.signal });
   * } catch (error) {
   *   if (error.name === 'AbortError') {
   *     throw ApiError.fromTimeout(request);
   *   }
   * }
   * ```
   */
  static fromTimeout(request?: ApiRequest): ApiError {
    return new ApiError(
      ERROR_CODES.TIMEOUT, 
      HTTP_STATUS.REQUEST_TIMEOUT, 
      "Request timed out", 
      undefined, 
      request
    );
  }

  /**
   * Create ApiError for network failures
   * 
   * @param error - The original network error
   * @param request - The request that failed
   * @returns New ApiError instance with NETWORK_ERROR code
   * 
   * @description Factory method for creating errors from network-level
   * failures like DNS resolution, connection refused, or other connectivity
   * issues. Preserves the original error message for debugging.
   * 
   * @example
   * ```typescript
   * try {
   *   await fetch(url);
   * } catch (error) {
   *   if (error instanceof TypeError) {
   *     // Network error (fetch throws TypeError for network issues)
   *     throw ApiError.fromNetworkError(error, request);
   *   }
   * }
   * ```
   */
  static fromNetworkError(error: Error, request?: ApiRequest): ApiError {
    return new ApiError(
      ERROR_CODES.NETWORK_ERROR, 
      0, 
      `Network error: ${error.message}`, 
      undefined, 
      request
    );
  }

  /**
   * Create ApiError for aborted requests
   * 
   * @param request - The request that was aborted
   * @returns New ApiError instance with ABORTED code
   * 
   * @description Factory method for creating errors when requests
   * are manually cancelled using AbortController. Typically occurs
   * when user cancels the request or component unmounts.
   * 
   * @example
   * ```typescript
   * const controller = new AbortController();
   * 
   * // Cancel request after user action
   * cancelButton.onclick = () => controller.abort();
   * 
   * try {
   *   await fetch(url, { signal: controller.signal });
   * } catch (error) {
   *   if (error.name === 'AbortError') {
   *     throw ApiError.fromAbort(request);
   *   }
   * }
   * ```
   */
  static fromAbort(request?: ApiRequest): ApiError {
    return new ApiError(
      ERROR_CODES.ABORTED, 
      0, 
      "Request was aborted", 
      undefined, 
      request
    );
  }

  /**
   * Create ApiError for response parsing failures
   * 
   * @param dataType - The type of data that failed to parse (e.g., 'json', 'text')
   * @param status - HTTP status code of the response
   * @param error - The original parsing error
   * @param response - The response that failed to parse
   * @param request - The request that generated this response
   * @returns New ApiError instance with specific parse error code
   * 
   * @description Factory method for creating errors when response data
   * cannot be parsed in the expected format. Automatically generates
   * appropriate error codes like JSON_PARSE_ERROR, TEXT_PARSE_ERROR, etc.
   * 
   * @example
   * ```typescript
   * try {
   *   const data = await response.json();
   * } catch (parseError) {
   *   throw ApiError.fromParseError(
   *     'json',
   *     response.status,
   *     parseError,
   *     response,
   *     request
   *   );
   * }
   * ```
   */
  static fromParseError(
    dataType: string,
    status: number,
    error: Error,
    response?: ApiResponse,
    request?: ApiRequest
  ): ApiError {
    return new ApiError(
      `${dataType.toUpperCase()}_PARSE_ERROR`,
      status,
      `Failed to parse ${dataType}: ${error.message}`,
      response,
      request
    );
  }
}

/**
 * HTTP Request with advanced retry logic and exponential backoff
 * 
 * @description Handles HTTP request execution with sophisticated retry mechanisms,
 * automatic body serialization, URL building, and timeout management. Implements
 * exponential backoff with jitter to prevent thundering herd problems.
 * 
 * @example
 * ```typescript
 * // Create and execute a request
 * const request = new ApiRequest({
 *   method: 'POST',
 *   url: '/api/users',
 *   baseURL: 'https://api.example.com',
 *   data: { name: 'John', email: 'john@example.com' },
 *   retry: { maxRetries: 3, delay: 1000 },
 *   timeout: 10000
 * });
 * 
 * try {
 *   const response = await request.send();
 *   console.log('Success:', response.status);
 * } catch (error) {
 *   console.error('Request failed:', error);
 * }
 * ```
 */
export class ApiRequest {
  /** 
   * HTTP headers for the request
   * @description Automatically populated from config.headers and includes
   * content-type headers for JSON data
   */
  public readonly headers: Headers;
  
  /** 
   * URL query parameters
   * @description Automatically URL-encoded parameters from config.params
   */
  public readonly params: URLSearchParams;
  
  /** 
   * Request body data
   * @description Raw data that will be serialized based on type
   */
  public readonly data: Body;
  
  /** 
   * HTTP method for the request
   * @description One of GET, POST, PUT, DELETE, PATCH, HEAD, OPTIONS
   */
  public readonly method: HttpMethod;
  
  /** 
   * Retry configuration for failed requests
   * @description Can be a number (simple retry count) or detailed config object
   */
  public readonly retry?: number | RetryConfig | undefined;
  
  /** 
   * Request URL path
   * @description Will be combined with baseURL if provided
   */
  public readonly url: string;
  
  /** 
   * Request timeout in milliseconds
   * @description Request will be aborted if it takes longer than this
   */
  public readonly timeout?: number | undefined;
  
  /**
   * Create a new ApiRequest instance
   * 
   * @param config - Complete request configuration
   * 
   * @description Initializes a new HTTP request with all necessary
   * configuration and prepares headers, parameters, and other settings.
   * 
   * @example
   * ```typescript
   * const request = new ApiRequest({
   *   method: 'GET',
   *   url: '/users',
   *   baseURL: 'https://api.example.com',
   *   params: { page: 1, limit: 10 },
   *   headers: { 'Authorization': 'Bearer token123' },
   *   timeout: 5000
   * });
   * ```
   */
  constructor(public readonly config: RequestConfig) {
    // Initialize headers from config
    this.headers = new Headers(config.headers);
    
    // Convert params object to URLSearchParams
    this.params = this.createParams(config.params);
    
    // Store request configuration
    this.data = config.data;
    this.method = config.method;
    this.retry = config.retry;
    this.url = config.url;
    this.timeout = config.timeout ?? undefined;
  }
  
  /**
   * Convert parameters object to URLSearchParams
   * 
   * @param params - Object containing query parameters
   * @returns URLSearchParams instance with all parameters added
   * 
   * @description Converts a plain object into URLSearchParams for URL building.
   * All values are converted to strings and properly URL-encoded.
   * 
   * @private
   * @example
   * ```typescript
   * // Input: { page: 1, search: 'hello world', active: true }
   * // Output: URLSearchParams with 'page=1&search=hello%20world&active=true'
   * ```
   */
  private createParams(params?: Record<string, string | number | boolean>): URLSearchParams {
    const searchParams = new URLSearchParams();
    
    // Only process if params object is provided
    if (params) {
      // Convert each key-value pair to string and add to URLSearchParams
      Object.entries(params).forEach(([key, value]) => {
        searchParams.append(key, String(value));
      });
    }
    
    return searchParams;
  }

  /**
   * Execute the request with retry logic and error handling
   * 
   * @returns Promise resolving to the HTTP Response
   * @throws {ApiError} When request fails after all retry attempts
   * 
   * @description Executes the HTTP request with sophisticated retry logic:
   * - Implements exponential backoff with jitter
   * - Handles timeouts with AbortController
   * - Automatically retries on network errors and server errors
   * - Converts native errors to ApiError instances
   * 
   * @example
   * ```typescript
   * try {
   *   const response = await request.send();
   *   if (response.ok) {
   *     const data = await response.json();
   *     console.log('Success:', data);
   *   }
   * } catch (error) {
   *   if (error instanceof ApiError) {
   *     console.log('API Error:', error.code, error.status);
   *   }
   * }
   * ```
   */
  async send(): Promise<globalThis.Response> {
    // Get retry configuration (either from config or defaults)
    const retrySettings = this.getRetrySettings();
    let lastError: Error | null = null;

    // Attempt request with retries (original + retries = maxRetries + 1 total attempts)
    for (let attempt = 0; attempt <= retrySettings.maxRetries; attempt++) {
      // Create abort controller for timeout handling
      const controller = new AbortController();
      const timeoutId = this.timeout 
        ? setTimeout(() => controller.abort(), this.timeout) 
        : undefined;

      try {
        // Execute the HTTP request
        const response = await fetch(this.buildUrl(), {
          ...this.config,
          method: this.method,
          headers: this.headers,
          body: this.createBody(),
          signal: controller.signal,
        });

        // Clear timeout since request completed
        if (timeoutId) clearTimeout(timeoutId);

        // Check if response failed and should be retried
        if (!response.ok && attempt < retrySettings.maxRetries && this.shouldRetryResponse(response, retrySettings)) {
          // Wait with exponential backoff before retrying
          await this.wait(retrySettings.delay || 1000, attempt);
          continue; // Try again
        }

        // Request succeeded or max retries reached - return response
        return response;

      } catch (error) {
        // Clear timeout on error
        if (timeoutId) clearTimeout(timeoutId);
        
        // Handle different types of errors
        if (error instanceof Error) {
          lastError = error;
          
          // Check if request was aborted due to timeout
          if (error.name === "AbortError") {
            throw ApiError.fromTimeout(this);
          }
          
          // Check if error should be retried
          if (attempt < retrySettings.maxRetries && this.shouldRetryError(error, retrySettings)) {
            // Wait with exponential backoff before retrying
            await this.wait(retrySettings.delay || 1000, attempt);
            continue; // Try again
          }
          
          // Convert to ApiError and throw
          throw ApiError.fromNetworkError(error, this);
        }
        
        // Re-throw unknown errors as-is
        throw error;
      }
    }

    // This should never be reached, but provides fallback error
    throw lastError || new Error("Maximum retries exceeded");
  }

   /**
   * Builds the final request URL by combining baseURL, url path, and query parameters.
   * 
   * @returns The fully qualified request URL as a string.
   * 
   * @private
   */
  private buildUrl(): string {
    const url = new URL(this.config.url, this.config.baseURL);

    // Append all query parameters
    this.params.forEach((value, key) => {
      url.searchParams.append(key, value);
    });

    return url.toString();
  }

  /**
   * Creates and serializes the request body based on data type and HTTP method.
   * 
   * @returns A `BodyInit` instance or `null` if no body should be sent.
   * 
   * @description
   * - For GET/HEAD requests, returns null.
   * - For objects, automatically JSON-encodes and adds `Content-Type: application/json`.
   * - For native types (Blob, FormData, etc.), returns as-is.
   * 
   * @private
   */
  private createBody(): BodyInit | null {
    // GET, HEAD, etc. must not have a body
    if (READ_ONLY_METHODS.includes(this.method) || this.data == null) {
      return null;
    }

    // Native BodyInit types are passed directly
    if (this.isNativeBodyType(this.data)) {
      return this.data;
    }

    // Automatically JSON-encode objects
    if (typeof this.data === "object") {
      this.headers.set("Content-Type", DEFAULT_HEADERS.JSON_CONTENT_TYPE);
      return JSON.stringify(this.data);
    }

    // Convert other primitives to string
    return String(this.data);
  }

  /**
   * Checks whether the given value is a native `BodyInit` type.
   * 
   * @param data - The value to check.
   * @returns True if data is a valid `BodyInit` type.
   * @private
   */
  private isNativeBodyType(data: Body): data is BodyInit {
    return (
      typeof data === "string" ||
      data instanceof ArrayBuffer ||
      data instanceof Uint8Array ||
      data instanceof DataView ||
      data instanceof Blob ||
      data instanceof File ||
      data instanceof FormData ||
      data instanceof URLSearchParams ||
      data instanceof ReadableStream
    );
  }

  /**
   * Retrieves retry settings from configuration, with defaults applied.
   * 
   * @returns The resolved `RetryConfig` object.
   * @private
   */
  private getRetrySettings(): Required<RetryConfig> {
    // Case 1: retry specified as number
    if (typeof this.retry === "number") {
      return {
        maxRetries: this.retry,
        delay: RETRY_DEFAULTS.DELAY,
        shouldRetry: DEFAULT_RETRY_STATUSES,
      };
    }

    // Case 2: detailed RetryConfig object
    if (this.retry && typeof this.retry === "object") {
      return {
        maxRetries: this.retry.maxRetries,
        delay: this.retry.delay ?? RETRY_DEFAULTS.DELAY,
        shouldRetry: this.retry.shouldRetry ?? DEFAULT_RETRY_STATUSES,
      };
    }

    // Case 3: no retry configuration provided → use defaults
    return {
      maxRetries: RETRY_DEFAULTS.MAX_RETRIES,
      delay: RETRY_DEFAULTS.DELAY,
      shouldRetry: DEFAULT_RETRY_STATUSES,
    };
  }

  /**
   * Determines whether a failed response should be retried based on configuration.
   * 
   * @param response - The failed HTTP response.
   * @param config - Retry configuration.
   * @returns True if the response should be retried.
   * @private
   */
  private shouldRetryResponse(
    response: globalThis.Response,
    config: Required<RetryConfig>
  ): boolean {
    if (Array.isArray(config.shouldRetry)) {
      return config.shouldRetry.includes(response.status);
    }
    if (typeof config.shouldRetry === "function") {
      return config.shouldRetry(response);
    }
    return false;
  }

  /**
   * Determines whether a thrown error (usually network) should be retried.
   * 
   * @param error - The encountered error.
   * @param config - Retry configuration.
   * @returns True if the error should be retried.
   * @private
   */
  private shouldRetryError(error: Error, config: Required<RetryConfig>): boolean {
    if (Array.isArray(config.shouldRetry)) {
      // Retry all network errors except timeouts (AbortError)
      return error.name !== "AbortError";
    }
    if (typeof config.shouldRetry === "function") {
      return config.shouldRetry(error);
    }
    return false;
  }

  /**
   * Waits before retrying the next attempt using exponential backoff with jitter.
   * 
   * @param delay - The base delay in milliseconds.
   * @param attempt - The current attempt number (0-based).
   * 
   * @description
   * Delay increases exponentially: `delay * 2^attempt`
   * with a random jitter factor to avoid thundering herd effect.
   * 
   * @private
   */
  private async wait(delay: number, attempt: number): Promise<void> {
    const exponentialDelay = delay * Math.pow(2, attempt);
    const jitter =
      exponentialDelay * RETRY_DEFAULTS.JITTER_FACTOR * Math.random();
    const totalDelay = Math.min(
      exponentialDelay + jitter,
      RETRY_DEFAULTS.MAX_DELAY
    );

    return new Promise((resolve) => setTimeout(resolve, totalDelay));
  }
}
/**
 * Represents an enhanced HTTP response with intelligent parsing capabilities.
 * This class wraps the native Fetch API `Response` and automatically determines
 * the appropriate parsing strategy for the returned data.
 */
export class ApiResponse {
  /**
   * Constructs an instance of `ApiResponse`.
   * @param response - The native Fetch API Response object.
   * @param request - The associated ApiRequest that generated this response.
   */
  constructor(
    public readonly response: globalThis.Response,
    public readonly request: ApiRequest
  ) {}

  /**
   * Indicates whether the HTTP response status is within the successful range (200–299).
   * @returns `true` if the response is successful, otherwise `false`.
   */
  get ok(): boolean {
    return this.response.ok;
  }

  /**
   * Returns the numeric HTTP status code of the response.
   * @example 200, 404, 500, etc.
   */
  get status(): number {
    return this.response.status;
  }

  /**
   * Returns the HTTP status text of the response.
   * @example "OK", "Not Found", "Internal Server Error"
   */
  get statusText(): string {
    return this.response.statusText;
  }

  /**
   * Returns all response headers as a `Headers` object.
   */
  get headers(): Headers {
    return this.response.headers;
  }

  /**
   * Retrieves and parses the response body automatically based on the request configuration.
   * 
   * @template T - The expected type of the parsed data.
   * @returns A promise resolving to the parsed data of type `T`.
   * 
   * Supported response types:
   * - `json`
   * - `text`
   * - `blob`
   * - `arrayBuffer`
   * - `auto` (default – automatically detects format)
   */
  async getData<T = unknown>(): Promise<T> {
    const responseType = this.request.config.responseType;

    switch (responseType) {
      case "json":
        return this.json<T>();

      case "text":
        return this.text() as Promise<T>;

      case "blob":
        return this.blob() as Promise<T>;

      case "arrayBuffer":
        return this.arrayBuffer() as Promise<T>;

      // Automatically detect and parse based on Content-Type
      case "auto":
      default:
        return this.autoParseData<T>();
    }
  }

  /**
   * Parses the response as JSON.
   *
   * @template T - The expected JSON object type.
   * @returns A promise resolving to parsed JSON data.
   * @throws {ApiError} If the response body cannot be parsed as JSON.
   */
  async json<T = unknown>(): Promise<T> {
    try {
      const text = await this.response.text();

      // If the response body is empty, return `undefined` instead of throwing.
      if (!text.trim()) {
        return undefined as T;
      }

      return JSON.parse(text);
    } catch (error) {
      // Wrap parsing errors with a custom ApiError
      throw ApiError.fromParseError(
        "json",
        this.status,
        error as Error,
        this,
        this.request
      );
    }
  }

  /**
   * Parses the response as plain text.
   *
   * @returns A promise resolving to a string value.
   * @throws {ApiError} If the text body cannot be retrieved.
   */
  async text(): Promise<string> {
    try {
      return await this.response.text();
    } catch (error) {
      throw ApiError.fromParseError(
        "text",
        this.status,
        error as Error,
        this,
        this.request
      );
    }
  }

  /**
   * Parses the response as a binary Blob.
   *
   * @returns A promise resolving to a Blob object.
   * @throws {ApiError} If the blob body cannot be retrieved.
   */
  async blob(): Promise<Blob> {
    try {
      return await this.response.blob();
    } catch (error) {
      throw ApiError.fromParseError(
        "blob",
        this.status,
        error as Error,
        this,
        this.request
      );
    }
  }

  /**
   * Parses the response as an ArrayBuffer.
   *
   * @returns A promise resolving to an ArrayBuffer.
   * @throws {ApiError} If the array buffer cannot be retrieved.
   */
  async arrayBuffer(): Promise<ArrayBuffer> {
    try {
      return await this.response.arrayBuffer();
    } catch (error) {
      throw ApiError.fromParseError(
        "arrayBuffer",
        this.status,
        error as Error,
        this,
        this.request
      );
    }
  }

  /**
   * Retrieves the `Content-Type` header from the response.
   * @returns The Content-Type string if available, otherwise `undefined`.
   */
  private getContentType(): string | undefined {
    return this.headers.get("Content-Type") || undefined;
  }

  /**
   * Automatically parses the response body based on the detected Content-Type header.
   * 
   * The logic follows these rules:
   * 1. If the status indicates no content (204, 304), returns `undefined`.
   * 2. If there’s no `Content-Type` header, attempts to parse as JSON, then falls back to text.
   * 3. If content type includes "application/json", parse as JSON.
   * 4. If content type includes text types (e.g., "text/plain", "text/html"), parse as text.
   * 5. If content type is binary (e.g., images, PDFs), parse as Blob.
   * 6. Defaults to JSON parsing if type cannot be determined.
   *
   * @template T - Expected data type.
   * @returns A promise resolving to parsed data of type `T`.
   */
  private async autoParseData<T>(): Promise<T> {
    const contentType = this.getContentType();

    // 1. Handle empty responses (204 No Content, 304 Not Modified)
    if (
      this.status === HTTP_STATUS.NO_CONTENT ||
      this.status === HTTP_STATUS.NOT_MODIFIED
    ) {
      return undefined as T;
    }

    // 2. Handle unknown or missing content-type
    if (!contentType) {
      try {
        // Attempt to parse as JSON first
        return await this.json<T>();
      } catch {
        // Fallback to plain text if JSON parsing fails
        return this.text() as Promise<T>;
      }
    }

    // 3. JSON response
    if (contentType.includes(CONTENT_TYPES.JSON)) {
      return this.json<T>();
    }

    // 4. Text-based response (HTML, XML, plain text, etc.)
    if (CONTENT_TYPES.TEXT.some((type) => contentType.includes(type))) {
      return this.text() as Promise<T>;
    }

    // 5. Binary response (images, audio, PDF, etc.)
    if (CONTENT_TYPES.BINARY.test(contentType)) {
      return this.blob() as Promise<T>;
    }

    // 6. Default fallback — try to parse as JSON
    return this.json<T>();
  }
}