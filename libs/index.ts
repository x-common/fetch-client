/**
 * API Client Library - Main Export Module
 * 
 * @description Central export module for the API client library. 
 * Provides clean, organized exports of all public APIs including
 * classes, types, and constants.
 * 
 * @author API Client Library
 * @version 1.0.0
 * 
 * @example
 * ```typescript
 * // Import everything you need
 * import { 
 *   ApiClient, 
 *   ApiError, 
 *   type RequestConfig,
 *   HTTP_STATUS 
 * } from './libs';
 * 
 * // Create client instance
 * const api = new ApiClient({
 *   baseURL: 'https://api.example.com',
 *   timeout: 10000
 * });
 * 
 * // Make requests
 * try {
 *   const users = await api.get('/users');
 *   console.log('Users:', users);
 * } catch (error) {
 *   if (error instanceof ApiError) {
 *     console.log('API Error:', error.code);
 *   }
 * }
 * ```
 */

/**
 * Core API client exports
 * 
 * @description Main classes for HTTP client functionality
 */
export { Client } from './client';
export { ApiError, ApiRequest, ApiResponse } from './core';
export { Interceptor } from './interceptor';

/**
 * Type definitions for TypeScript support
 * 
 * @description Complete type definitions for request/response handling,
 * configuration, and error management
 */
export type {
  Body,           // Request body types
  HttpMethod,     // HTTP methods (GET, POST, etc.)
  ResponseType,   // Response parsing types
  RetryConfig,    // Retry configuration
  RequestConfig,  // Individual request configuration
  ClientConfig,   // Client-wide configuration
  RequestOptions, // Simplified request options
  ErrorCode       // Error categorization codes
} from './types.js';

/**
 * Constants for configuration and defaults
 * 
 * @description Pre-defined constants for common configurations,
 * HTTP status codes, and error codes
 */
export {
  DEFAULT_RETRY_STATUSES, // Status codes that trigger retries
  RETRY_DEFAULTS,         // Default retry configuration
  HTTP_STATUS,            // Common HTTP status codes
  CONTENT_TYPES,          // Content-type parsing patterns
  ERROR_CODES,            // Standardized error codes
  DEFAULT_RESPONSE_TYPE   // Default auto-parsing mode
} from './constants.js';