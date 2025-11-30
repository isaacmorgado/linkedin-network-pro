/**
 * Similarity Cache
 * In-memory cache for profile similarity calculations to improve performance
 */

import type { ProfileSimilarity } from './types';

/**
 * Simple in-memory cache for similarity calculations
 *
 * Reduces computation for frequently compared profiles
 * Expires after 7 days
 */
export class ProfileSimilarityCache {
  private cache = new Map<string, { similarity: ProfileSimilarity; expiresAt: Date }>();

  /**
   * Get cached similarity (if exists and not expired)
   */
  getCached(id1: string, id2: string): ProfileSimilarity | null {
    const key = [id1, id2].sort().join(':');
    const entry = this.cache.get(key);

    if (!entry) return null;

    // Check expiration
    if (new Date() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return entry.similarity;
  }

  /**
   * Cache similarity calculation
   */
  setCached(id1: string, id2: string, similarity: ProfileSimilarity): void {
    const key = [id1, id2].sort().join(':');

    // Expire after 7 days
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    this.cache.set(key, { similarity, expiresAt });
  }

  /**
   * Clear expired entries
   */
  clearExpired(): void {
    const now = new Date();
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Clear all cache
   */
  clearAll(): void {
    this.cache.clear();
  }
}
