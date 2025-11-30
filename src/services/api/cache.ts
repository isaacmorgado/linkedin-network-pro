/**
 * API Response Cache
 * Client-side caching for backend API responses
 *
 * Features:
 * - In-memory cache with TTL
 * - LRU eviction policy
 * - Cache key generation from request params
 * - Size limits to prevent memory issues
 */

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

export class ApiCache {
  private cache: Map<string, CacheEntry<any>>;
  private maxSize: number;
  private hitCount: number = 0;
  private missCount: number = 0;

  constructor(maxSize: number = 100) {
    this.cache = new Map();
    this.maxSize = maxSize;
  }

  /**
   * Generate cache key from endpoint and params
   */
  private generateKey(endpoint: string, params?: Record<string, any>): string {
    if (!params) {
      return endpoint;
    }

    // Sort params for consistent keys
    const sortedParams = Object.keys(params)
      .sort()
      .map((key) => `${key}=${JSON.stringify(params[key])}`)
      .join('&');

    return `${endpoint}?${sortedParams}`;
  }

  /**
   * Get cached response
   */
  get<T>(endpoint: string, params?: Record<string, any>): T | null {
    const key = this.generateKey(endpoint, params);
    const entry = this.cache.get(key);

    if (!entry) {
      this.missCount++;
      return null;
    }

    // Check if expired
    const now = Date.now();
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      this.missCount++;
      return null;
    }

    this.hitCount++;
    return entry.data as T;
  }

  /**
   * Set cached response
   */
  set<T>(endpoint: string, data: T, ttl: number, params?: Record<string, any>): void {
    const key = this.generateKey(endpoint, params);

    // If cache is full, evict oldest entry (LRU)
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey !== undefined) {
        this.cache.delete(firstKey);
      }
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
  }

  /**
   * Invalidate cache for specific endpoint
   */
  invalidate(endpoint: string, params?: Record<string, any>): void {
    const key = this.generateKey(endpoint, params);
    this.cache.delete(key);
  }

  /**
   * Invalidate all cache entries matching pattern
   */
  invalidatePattern(pattern: string): void {
    const keysToDelete: string[] = [];

    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach((key) => this.cache.delete(key));
  }

  /**
   * Clear entire cache
   */
  clear(): void {
    this.cache.clear();
    this.hitCount = 0;
    this.missCount = 0;
  }

  /**
   * Get cache statistics
   */
  getStats(): {
    size: number;
    maxSize: number;
    hitCount: number;
    missCount: number;
    hitRate: number;
  } {
    const total = this.hitCount + this.missCount;
    const hitRate = total > 0 ? this.hitCount / total : 0;

    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      hitCount: this.hitCount,
      missCount: this.missCount,
      hitRate: Math.round(hitRate * 100) / 100,
    };
  }
}

// ============================================================================
// Global Cache Instance
// ============================================================================

export const apiCache = new ApiCache(100);

// ============================================================================
// Cache Helpers
// ============================================================================

/**
 * Wrap async function with caching
 */
export function withCache<T>(
  cacheKey: string,
  fetcher: () => Promise<T>,
  ttl: number = 5 * 60 * 1000, // 5 minutes default
  params?: Record<string, any>
): Promise<T> {
  // Try cache first
  const cached = apiCache.get<T>(cacheKey, params);
  if (cached !== null) {
    console.log(`[Cache] HIT: ${cacheKey}`);
    return Promise.resolve(cached);
  }

  // Cache miss - fetch and cache
  console.log(`[Cache] MISS: ${cacheKey}`);
  return fetcher().then((data) => {
    apiCache.set(cacheKey, data, ttl, params);
    return data;
  });
}
