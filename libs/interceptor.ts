/**
 * @fileoverview Interceptor pattern for middleware processing
 * @module interceptor
 */

import { InterceptorHandler } from "./types";

/**
 * Generic interceptor for processing items with middleware pattern
 * @template T - The type of item being processed
 * @class
 * @example
 * ```typescript
 * const interceptor = new Interceptor<string>();
 * const id = interceptor.use((str) => str.toUpperCase());
 * const result = await interceptor.execute('hello'); // "HELLO"
 * console.log(result);
 * interceptor.reject(id); // Remove the handler
 * ```
 */
export class Interceptor<T> {
  /**
   * Map of handler functions indexed by ID
   * @private
   * @type {Map<number, InterceptorHandler<T>>}
   */
  private handlers: Map<number, InterceptorHandler<T>> = new Map();

  /**
   * Counter for generating unique handler IDs
   * @private
   * @type {number}
   */
  private nextId: number = 0;

  /**
   * Register a new interceptor handler
   * @param {function(T): (T|Promise<T>)} handler - Function to process the item
   * @returns {number} Unique ID for the registered handler
   * @throws {TypeError} When handler is not a function
   * @example
   * ```typescript
   * const id = interceptor.use((item) => {
   *   console.log('Processing:', item);
   *   return item;
   * });
   * ```
   */
  use(handler: (item: T) => T | Promise<T>): number {
    if (typeof handler !== 'function') {
      throw new TypeError('Handler must be a function');
    }
    const id = this.nextId++;
    this.handlers.set(id, handler);
    return id;
  }

  /**
   * Execute all registered handlers in sequence
   * @param {T} item - Item to process through the handler chain
   * @returns {Promise<T>} Promise resolving to the processed item
   * @throws {Error} When any handler fails
   * @example
   * ```typescript
   * try {
   *   const result = await interceptor.execute(originalItem);
   *   console.log('Processed:', result);
   * } catch (error) {
   *   console.error('Handler failed:', error.message);
   * }
   * ```
   */
  async execute(item: T): Promise<T> {
    let result = item;
    
    for (const [, handler] of this.handlers) {
      try {
        result = await handler(result);
      } catch (error) {
        throw new Error(
          `Interceptor handler failed: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }
    }
    
    return result;
  }

  /**
   * Clear all registered handlers
   * @returns {void}
   * @example
   * ```typescript
   * interceptor.clear();
   * console.log(interceptor.isEmpty); // true
   * ```
   */
  clear(): void {
    this.handlers.clear();
  }

  /**
   * Get the number of registered handlers
   * @returns {number} Number of handlers in the chain
   * @example
   * ```typescript
   * console.log(`Interceptor has ${interceptor.size} handlers`);
   * ```
   */
  get size(): number {
    return this.handlers.size;
  }

  /**
   * Check if the interceptor has any handlers
   * @returns {boolean} True if no handlers are registered, false otherwise
   * @example
   * ```typescript
   * if (interceptor.isEmpty) {
   *   console.log('No handlers registered');
   * }
   * ```
   */
  get isEmpty(): boolean {
    return this.handlers.size === 0;
  }

  /**
   * Remove a specific handler by ID
   * @param {number} id - Handler ID to remove
   * @returns {void}
   * @example
   * ```typescript
   * const id = interceptor.use(handler);
   * interceptor.reject(id); // Remove the handler
   * ```
   */
  reject(id: number): void {
    this.handlers.delete(id);
  }
}