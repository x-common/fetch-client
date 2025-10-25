/**
 * Type definitions for the API client
 */

/**
 * Supported request body types for HTTP requests
 * 
 * @description Defines all possible data types that can be sent as request body
 * @example
 * ```typescript
 * const jsonBody: Body = { name: 'John', age: 25 };
 * const textBody: Body = 'Hello World';
 * const formBody: Body = new FormData();
 * const fileBody: Body = new File(['content'], 'file.txt');
 * ```
 */
export type Body =
  | string                    // Plain text content
  | ArrayBuffer              // Binary data buffer
  | ArrayBufferView          // Typed array views (Uint8Array, etc.)
  | Blob                     // File-like object of immutable, raw data
  | File                     // File object from file input
  | FormData                 // Multipart form data
  | URLSearchParams          // URL-encoded form data
  | ReadableStream           // Streaming data
  | Record<string, unknown>  // JSON object (will be stringified)
  | null                     // No body content
  | undefined;               // No body content

/**
 * Supported HTTP methods for API requests
 * 
 * @description Standard HTTP methods commonly used in REST APIs
 * @example
 * ```typescript
 * const getMethod: HttpMethod = 'GET';     // Retrieve data
 * const postMethod: HttpMethod = 'POST';   // Create new resource
 * const putMethod: HttpMethod = 'PUT';     // Update entire resource
 * const patchMethod: HttpMethod = 'PATCH'; // Partial update
 * const deleteMethod: HttpMethod = 'DELETE'; // Remove resource
 * ```
 */
export type HttpMethod = 
  | "GET"      // Retrieve data from server
  | "POST"     // Send data to create new resource
  | "PUT"      // Send data to update entire resource
  | "DELETE"   // Remove resource from server
  | "PATCH"    // Send data for partial resource update
  | "HEAD"     // Get headers only (no body)
  | "OPTIONS"; // Get allowed methods and headers

/**
 * Supported response types for automatic parsing
 * 
 * @description Determines how the response body should be parsed
 * @example
 * ```typescript
 * // Automatic detection based on Content-Type header
 * const autoType: ResponseType = 'auto';
 * 
 * // Force specific parsing
 * const jsonType: ResponseType = 'json';        // Parse as JSON object
 * const textType: ResponseType = 'text';        // Parse as plain string
 * const blobType: ResponseType = 'blob';        // Parse as Blob (files)
 * const bufferType: ResponseType = 'arrayBuffer'; // Parse as ArrayBuffer
 * ```
 */
export type ResponseType = 
  | "json"        // Parse response as JSON object
  | "text"        // Parse response as plain text string
  | "blob"        // Parse response as Blob (for files/binary data)
  | "arrayBuffer" // Parse response as ArrayBuffer (for binary data)
  | "auto";       // Auto-detect based on Content-Type header

/**
 * Configuration for retry behavior when requests fail
 * 
 * @description Controls how failed requests should be retried with exponential backoff
 * @example
 * ```typescript
 * // Simple retry with default settings
 * const simpleRetry: RetryConfig = { maxRetries: 3 };
 * 
 * // Advanced retry configuration
 * const advancedRetry: RetryConfig = {
 *   maxRetries: 5,
 *   delay: 2000,
 *   shouldRetry: [408, 429, 500, 502, 503, 504]
 * };
 * 
 * // Custom retry logic
 * const customRetry: RetryConfig = {
 *   maxRetries: 3,
 *   shouldRetry: (error) => error instanceof Error && error.name === 'NetworkError'
 * };
 * ```
 */
export interface RetryConfig {
  /** 
   * Maximum number of retry attempts before giving up
   * @example 3 // Will try original request + 3 retries = 4 total attempts
   */
  maxRetries: number;
  
  /** 
   * Base delay between retries in milliseconds (default: 1000)
   * @description Uses exponential backoff: delay * 2^attempt + jitter
   * @example 1000 // First retry after 1s, second after ~2s, third after ~4s
   */
  delay?: number;
  
  /** 
   * HTTP status codes to retry on, or custom retry function
   * @description Array of status codes or function to determine if request should be retried
   * @example [408, 429, 500, 502, 503, 504] // Retry on timeout and server errors
   * @example (error) => error.status >= 500 // Retry only on server errors
   */
  shouldRetry?: readonly number[] | ((error: Error | globalThis.Response) => boolean);
}

/**
 * Configuration for individual HTTP requests
 * 
 * @description Extends native RequestInit with additional API client features
 * @example
 * ```typescript
 * const config: RequestConfig = {
 *   method: 'POST',
 *   url: '/api/users',
 *   baseURL: 'https://api.example.com',
 *   data: { name: 'John', email: 'john@example.com' },
 *   headers: { 'Authorization': 'Bearer token123' },
 *   timeout: 10000,
 *   retry: { maxRetries: 3, delay: 1000 },
 *   params: { include: 'profile', format: 'json' }
 * };
 * ```
 */
export interface RequestConfig extends Omit<RequestInit, "body" | "method"> {
  /** 
   * Base URL for the request - will be combined with url
   * @example 'https://api.example.com' 
   */
  baseURL?: string;
  
  /** 
   * Request timeout in milliseconds before aborting
   * @example 10000 // 10 second timeout
   */
  timeout?: number;
  
  /** 
   * HTTP method for the request
   * @example 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
   */
  method: HttpMethod;
  
  /** 
   * Query parameters to append to URL
   * @description Automatically URL-encoded and appended as query string
   * @example { page: 1, limit: 10 } // Results in ?page=1&limit=10
   */
  params?: Record<string, string | number | boolean>;
  
  /** 
   * Request URL path (relative to baseURL if provided)
   * @example '/api/users' or 'https://api.example.com/users'
   */
  url: string;
  
  /** 
   * Expected response type for automatic parsing
   * @example 'json' | 'text' | 'blob' | 'arrayBuffer' | 'auto'
   */
  responseType?: ResponseType;
  
  /** 
   * Request body data (will be automatically serialized)
   * @example { name: 'John' } // JSON object
   * @example 'raw text' // Plain string
   * @example new FormData() // Form data
   */
  data?: Body;
  
  /** 
   * Retry configuration for failed requests
   * @example 3 // Simple: retry 3 times with defaults
   * @example { maxRetries: 5, delay: 2000 } // Advanced configuration
   */
  retry?: number | RetryConfig;
}

/**
 * Configuration for the API client instance
 * 
 * @description Global settings applied to all requests made by the client
 * @example
 * ```typescript
 * const config: ClientConfig = {
 *   baseURL: 'https://api.example.com',
 *   timeout: 15000,
 *   headers: {
 *     'Authorization': 'Bearer token123',
 *     'Content-Type': 'application/json',
 *     'User-Agent': 'MyApp/1.0'
 *   },
 *   responseType: 'json',
 *   retry: { maxRetries: 3, delay: 1000 }
 * };
 * ```
 */
export interface ClientConfig extends Pick<RequestConfig, "baseURL" | "timeout" | "retry"> {
  /** 
   * Default headers for all requests made by this client
   * @description These headers will be merged with request-specific headers
   * @example { 'Authorization': 'Bearer token', 'Content-Type': 'application/json' }
   */
  headers?: Record<string, string>;
  
  /** 
   * Default response type for all requests
   * @description Can be overridden per request
   * @example 'json' // Default to JSON parsing for all responses
   */
  responseType?: ResponseType;
}

/**
 * Options for individual requests (excludes method, data, and url)
 * 
 * @description Simplified request configuration without the main request properties
 * @example
 * ```typescript
 * const options: RequestOptions = {
 *   headers: { 'Accept': 'application/json' },
 *   timeout: 5000,
 *   params: { format: 'detailed' },
 *   retry: 2
 * };
 * 
 * // Usage with client methods
 * const data = await client.get('/users', options);
 * const user = await client.post('/users', userData, options);
 * ```
 */
export type RequestOptions = Omit<RequestConfig, "method" | "data" | "url">;

/**
 * Error codes used by ApiError for categorizing different types of failures
 * 
 * @description Standardized error codes to help identify and handle specific error types
 * @example
 * ```typescript
 * try {
 *   await client.get('/api/data');
 * } catch (error) {
 *   if (error instanceof ApiError) {
 *     switch (error.code) {
 *       case 'HTTP_ERROR':
 *         console.log('Server returned error status:', error.status);
 *         break;
 *       case 'TIMEOUT':
 *         console.log('Request timed out - try again later');
 *         break;
 *       case 'NETWORK_ERROR':
 *         console.log('Network connectivity issue');
 *         break;
 *       case 'JSON_PARSE_ERROR':
 *         console.log('Invalid JSON response from server');
 *         break;
 *     }
 *   }
 * }
 * ```
 */
export type ErrorCode = 
  | "HTTP_ERROR"              // Server returned 4xx or 5xx status code
  | "TIMEOUT"                 // Request exceeded timeout limit
  | "NETWORK_ERROR"           // Network connectivity or DNS issues
  | "ABORTED"                 // Request was manually cancelled
  | "JSON_PARSE_ERROR"        // Failed to parse response as JSON
  | "TEXT_PARSE_ERROR"        // Failed to parse response as text
  | "BLOB_PARSE_ERROR"        // Failed to parse response as Blob
  | "ARRAYBUFFER_PARSE_ERROR" // Failed to parse response as ArrayBuffer
  | "UNKNOWN_ERROR"           // Unexpected error type
  | `${string}_PARSE_ERROR`;   // Custom parse errors (e.g., XML_PARSE_ERROR)

  export type InterceptorHandler<T> = (item: T) => T | Promise<T>;