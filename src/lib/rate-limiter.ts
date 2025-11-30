/**
 * Rate Limiter for LinkedIn Scraping
 *
 * CRITICAL for anti-detection:
 * - Enforces hourly request quota (default: 100 requests/hour)
 * - Adds random delays between requests (5-15 seconds)
 * - Coordinates all scrapers through single queue
 * - Prevents multiple scrapers from overwhelming LinkedIn
 *
 * Usage:
 * ```typescript
 * import { rateLimiter } from '@/lib/rate-limiter';
 *
 * const data = await rateLimiter.enqueue(async () => {
 *   return await scrapeFunction();
 * });
 * ```
 */

/**
 * Queue-based rate limiter with hourly quota enforcement
 *
 * Features:
 * - Generic Promise-based API
 * - Automatic hourly reset
 * - Random human-like delays
 * - Error propagation
 * - Max queue size protection
 */
export class RateLimiter {
  private queue: Array<() => Promise<any>> = [];
  private processing = false;
  private requestCount = 0;
  private hourStartTime = Date.now();

  /**
   * Create a new rate limiter
   *
   * @param maxRequestsPerHour - Maximum requests allowed per hour (default: 100)
   * @param minDelayMs - Minimum delay between requests in ms (default: 5000)
   * @param maxDelayMs - Maximum delay between requests in ms (default: 15000)
   */
  constructor(
    private maxRequestsPerHour: number = 100,
    private minDelayMs: number = 5000,
    private maxDelayMs: number = 15000
  ) {
    console.log(
      `[RateLimiter] Initialized: ${maxRequestsPerHour} req/hr, ${minDelayMs}-${maxDelayMs}ms delays`
    );
  }

  /**
   * Enqueue a function to be executed with rate limiting
   *
   * @param fn - Async function to execute
   * @returns Promise that resolves with function result
   * @throws Error if queue is full or function execution fails
   *
   * @example
   * ```typescript
   * const profile = await rateLimiter.enqueue(() => scrapeProfile(url));
   * ```
   */
  async enqueue<T>(fn: () => Promise<T>): Promise<T> {
    // Prevent queue from growing unbounded
    if (this.queue.length >= 1000) {
      throw new Error('[RateLimiter] Queue full (1000 requests). Too many pending requests.');
    }

    return new Promise((resolve, reject) => {
      // Wrap function with error handling
      this.queue.push(async () => {
        try {
          const result = await fn();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });

      // Start processing if not already running
      if (!this.processing) {
        this.processQueue();
      }
    });
  }

  /**
   * Process queued functions one at a time
   * Handles hourly quota, delays, and error recovery
   */
  private async processQueue(): Promise<void> {
    this.processing = true;

    console.log(`[RateLimiter] Starting queue processing (${this.queue.length} pending)`);

    while (this.queue.length > 0) {
      // Check if hour has elapsed
      const hourElapsed = Date.now() - this.hourStartTime;
      if (hourElapsed > 3600000) {
        // Reset counter every hour
        console.log(
          `[RateLimiter] Hour elapsed. Resetting counter (was ${this.requestCount} requests)`
        );
        this.requestCount = 0;
        this.hourStartTime = Date.now();
      }

      // Check if we've hit hourly limit
      if (this.requestCount >= this.maxRequestsPerHour) {
        // Wait until next hour
        const waitTime = 3600000 - hourElapsed;
        const waitTimeMin = Math.ceil(waitTime / 60000);

        console.warn(
          `[RateLimiter] Rate limit reached (${this.requestCount}/${this.maxRequestsPerHour}). ` +
            `Waiting ${waitTimeMin} minutes until next hour.`
        );

        await this.sleep(waitTime);

        // Reset for new hour
        this.requestCount = 0;
        this.hourStartTime = Date.now();

        console.log('[RateLimiter] Rate limit reset. Resuming queue processing.');
      }

      // Process next request
      const fn = this.queue.shift();
      if (fn) {
        try {
          await fn();
          this.requestCount++;

          console.log(
            `[RateLimiter] Request ${this.requestCount}/${this.maxRequestsPerHour} complete. ` +
              `Queue: ${this.queue.length} remaining.`
          );

          // Random delay before next request (human-like behavior)
          if (this.queue.length > 0) {
            const delay = this.randomDelay();
            const delaySec = (delay / 1000).toFixed(1);

            console.log(`[RateLimiter] Waiting ${delaySec}s before next request...`);

            await this.sleep(delay);
          }
        } catch (error) {
          // Log error but continue processing queue
          // Error already propagated to caller via Promise.reject
          console.error('[RateLimiter] Request failed (continuing queue):', error);
        }
      }
    }

    console.log('[RateLimiter] Queue empty. Stopping processing.');
    this.processing = false;
  }

  /**
   * Generate random delay between min and max
   * Mimics human browsing patterns
   */
  private randomDelay(): number {
    return Math.floor(Math.random() * (this.maxDelayMs - this.minDelayMs) + this.minDelayMs);
  }

  /**
   * Sleep for specified milliseconds
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Get current queue statistics
   * Useful for debugging and monitoring
   */
  getStats(): {
    queueLength: number;
    requestCount: number;
    maxRequests: number;
    timeUntilReset: number;
    processing: boolean;
  } {
    const timeUntilReset = Math.max(0, 3600000 - (Date.now() - this.hourStartTime));

    return {
      queueLength: this.queue.length,
      requestCount: this.requestCount,
      maxRequests: this.maxRequestsPerHour,
      timeUntilReset,
      processing: this.processing,
    };
  }
}

/**
 * Singleton rate limiter instance
 *
 * All scrapers should use this shared instance to coordinate
 * LinkedIn requests and avoid detection.
 *
 * Configuration: 100 requests/hour, 5-15 second delays
 */
export const rateLimiter = new RateLimiter();
