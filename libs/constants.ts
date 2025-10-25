/**
 * Constants and default values for the API client
 * 
 * @description Centralized configuration constants to ensure consistency
 * across the entire API client library. These values are used as defaults
 * throughout the codebase and can be referenced for customization.
 * 
 * @author API Client Library
 * @version 1.0.0
 */

/**
 * Default HTTP status codes that should trigger a retry attempt
 * 
 * @description These status codes indicate temporary failures that might
 * succeed if retried after a delay. Includes timeout, rate limiting,
 * and server errors that are typically transient.
 * 
 * @readonly
 * @example
 * ```typescript
 * // Check if status should be retried
 * if (DEFAULT_RETRY_STATUSES.includes(response.status)) {
 *   // Retry the request
 * }
 * ```
 */
export const DEFAULT_RETRY_STATUSES: readonly number[] = [
  408, // Request Timeout - server didn't receive complete request in time
  429, // Too Many Requests - rate limiting, should retry after delay
  500, // Internal Server Error - temporary server issue
  502, // Bad Gateway - invalid response from upstream server
  503, // Service Unavailable - server temporarily overloaded
  504  // Gateway Timeout - upstream server didn't respond in time
] as const;

/**
 * HTTP methods that should not include a request body
 * 
 * @description RFC 7231 specifies that these methods should not have
 * a message body. The client will automatically exclude body data
 * when using these methods to ensure HTTP compliance.
 * 
 * @readonly
 * @example
 * ```typescript
 * // Check if method allows body
 * if (!READ_ONLY_METHODS.includes(method)) {
 *   // Add request body
 * }
 * ```
 */
export const READ_ONLY_METHODS: readonly string[] = [
  "GET",  // Retrieve data - should not modify server state
  "HEAD"  // Get headers only - same as GET but without response body
] as const;

/**
 * Default timeout values in milliseconds for different scenarios
 * 
 * @description Provides reasonable defaults for request timeouts to prevent
 * hanging requests while allowing enough time for typical API responses.
 * 
 * @readonly
 * @example
 * ```typescript
 * // Use default timeout
 * const timeout = TIMEOUTS.DEFAULT;
 * 
 * // Validate timeout range
 * if (userTimeout < TIMEOUTS.MIN || userTimeout > TIMEOUTS.MAX) {
 *   throw new Error('Invalid timeout value');
 * }
 * ```
 */
export const TIMEOUTS = {
  /** Default request timeout for most API calls (10 seconds) */
  DEFAULT: 10_000,
  
  /** Maximum allowed timeout to prevent indefinite hangs (5 minutes) */
  MAX: 300_000,
  
  /** Minimum timeout to ensure reasonable response time (1 second) */
  MIN: 1_000,
} as const;

/**
 * Default retry configuration values
 * 
 * @description Controls the exponential backoff retry mechanism with jitter
 * to prevent thundering herd problems when multiple clients retry simultaneously.
 * 
 * @readonly
 * @example
 * ```typescript
 * // Calculate retry delay with exponential backoff
 * const delay = RETRY_DEFAULTS.DELAY * Math.pow(2, attempt);
 * const jitter = delay * RETRY_DEFAULTS.JITTER_FACTOR * Math.random();
 * const totalDelay = Math.min(delay + jitter, RETRY_DEFAULTS.MAX_DELAY);
 * ```
 */
export const RETRY_DEFAULTS = {
  /** Default number of retry attempts before giving up */
  MAX_RETRIES: 3,
  
  /** Default base delay between retries in milliseconds */
  DELAY: 1_000,
  
  /** Maximum delay between retries to prevent excessive waits */
  MAX_DELAY: 30_000,
  
  /** Jitter factor to prevent thundering herd (10% randomization) */
  JITTER_FACTOR: 0.1,
} as const;

/**
 * Default headers that are commonly used across requests
 * 
 * @description Standard headers for common content types and client identification.
 * These can be used as defaults or for header validation.
 * 
 * @readonly
 * @example
 * ```typescript
 * // Set JSON content type
 * headers.set('Content-Type', DEFAULT_HEADERS.JSON_CONTENT_TYPE);
 * 
 * // Add user agent
 * headers.set('User-Agent', DEFAULT_HEADERS.USER_AGENT);
 * ```
 */
export const DEFAULT_HEADERS = {
  /** Default content type for JSON requests */
  JSON_CONTENT_TYPE: 'application/json',
  
  /** Default user agent string for client identification */
  USER_AGENT: 'ApiClient/1.0',
} as const;

/**
 * HTTP status codes for different response scenarios
 * 
 * @description Common HTTP status codes used throughout the client
 * for response handling and error detection.
 * 
 * @readonly
 * @example
 * ```typescript
 * // Check for empty response
 * if (response.status === HTTP_STATUS.NO_CONTENT) {
 *   return undefined;
 * }
 * 
 * // Handle rate limiting
 * if (response.status === HTTP_STATUS.TOO_MANY_REQUESTS) {
 *   // Implement backoff strategy
 * }
 * ```
 */
export const HTTP_STATUS = {
  /** No Content - successful request with no response body */
  NO_CONTENT: 204,
  
  /** Not Modified - cached version is still valid */
  NOT_MODIFIED: 304,
  
  /** Request Timeout - server didn't receive complete request */
  REQUEST_TIMEOUT: 408,
  
  /** Too Many Requests - rate limiting in effect */
  TOO_MANY_REQUESTS: 429,
  
  /** Internal Server Error - generic server error */
  INTERNAL_SERVER_ERROR: 500,
  
  /** Bad Gateway - invalid response from upstream server */
  BAD_GATEWAY: 502,
  
  /** Service Unavailable - server temporarily overloaded */
  SERVICE_UNAVAILABLE: 503,
  
  /** Gateway Timeout - upstream server didn't respond */
  GATEWAY_TIMEOUT: 504,
} as const;

/**
 * Content type patterns for response parsing
 * 
 * @description Patterns used to determine how to parse response data
 * based on the Content-Type header.
 * 
 * @readonly
 * @example
 * ```typescript
 * // Check content type for parsing
 * if (contentType.includes(CONTENT_TYPES.JSON)) {
 *   return response.json();
 * }
 * 
 * // Check if binary content
 * if (CONTENT_TYPES.BINARY.test(contentType)) {
 *   return response.blob();
 * }
 * ```
 */
export const CONTENT_TYPES = {
  /** JSON content type pattern for parsing */
  JSON: 'json',
  
  /** Text content type patterns (includes XML) */
  TEXT: ['text/', 'xml'],
  
  /** Binary content type patterns (images, videos, etc.) */
  BINARY: /^(image|video|audio|application\/octet-stream)/,
} as const;

/**
 * Default response type for automatic parsing
 * 
 * @description When no specific response type is requested, the client
 * will use this default to automatically detect the appropriate parsing method.
 * 
 * @readonly
 * @example
 * ```typescript
 * // Use default response type
 * const responseType = config.responseType ?? DEFAULT_RESPONSE_TYPE;
 * ```
 */
export const DEFAULT_RESPONSE_TYPE = 'auto' as const;

/**
 * Error codes used throughout the API client
 * 
 * @description Standardized error codes for consistent error handling
 * and debugging across the entire client library.
 * 
 * @readonly
 * @example
 * ```typescript
 * // Create specific error types
 * throw new ApiError(ERROR_CODES.TIMEOUT, 408, 'Request timed out');
 * 
 * // Handle different error types
 * switch (error.code) {
 *   case ERROR_CODES.NETWORK_ERROR:
 *     // Handle network issues
 *     break;
 *   case ERROR_CODES.HTTP_ERROR:
 *     // Handle HTTP errors
 *     break;
 * }
 * ```
 */
export const ERROR_CODES = {
  /** HTTP error - server returned 4xx or 5xx status */
  HTTP_ERROR: 'HTTP_ERROR',
  
  /** Timeout error - request exceeded time limit */
  TIMEOUT: 'TIMEOUT',
  
  /** Network error - connectivity or DNS issues */
  NETWORK_ERROR: 'NETWORK_ERROR',
  
  /** Aborted error - request was manually cancelled */
  ABORTED: 'ABORTED',
  
  /** JSON parsing error - invalid JSON response */
  JSON_PARSE_ERROR: 'JSON_PARSE_ERROR',
  
  /** Text parsing error - failed to read as text */
  TEXT_PARSE_ERROR: 'TEXT_PARSE_ERROR',
  
  /** Blob parsing error - failed to read as blob */
  BLOB_PARSE_ERROR: 'BLOB_PARSE_ERROR',
  
  /** ArrayBuffer parsing error - failed to read as buffer */
  ARRAYBUFFER_PARSE_ERROR: 'ARRAYBUFFER_PARSE_ERROR',
  
  /** Unknown error - unexpected error type */
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
} as const;