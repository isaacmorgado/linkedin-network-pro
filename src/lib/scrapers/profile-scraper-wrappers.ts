/**
 * Profile Scraper Wrappers
 * Rate-limited and retry-enabled wrappers for profile scraping
 *
 * Extracted to reduce profile-scraper.ts file size
 */

import type { LinkedInProfile } from '@/types';
import type { ActivityEvent } from '@/types/network';
import { rateLimiter } from '@/lib/rate-limiter';
import { scrapeProfileData } from './profile-scraper';

/**
 * Rate-limited wrapper for scrapeProfileData
 *
 * IMPORTANT: Use this function instead of scrapeProfileData() to prevent
 * LinkedIn account bans from excessive scraping.
 *
 * @param options - Same options as scrapeProfileData
 * @returns Profile data with rate limiting applied
 */
export async function scrapeProfileDataRateLimited(options?: {
  includeActivity?: boolean;
  includeEndorsers?: boolean;
  maxEndorsedSkills?: number;
}): Promise<Partial<LinkedInProfile> & { activities?: ActivityEvent[] } | null> {
  return rateLimiter.enqueue(() => scrapeProfileData(options));
}

/**
 * Scrape profile with retry logic and exponential backoff
 */
export async function scrapeProfileDataWithRetry(
  options?: {
    includeActivity?: boolean;
    includeEndorsers?: boolean;
    maxEndorsedSkills?: number;
  },
  maxRetries: number = 3
): Promise<Partial<LinkedInProfile> & { activities?: ActivityEvent[] } | null> {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`[ProfileScraper] Attempt ${attempt}/${maxRetries}...`);
      const result = await scrapeProfileData(options);

      if (result) {
        console.log(`[ProfileScraper] Success on attempt ${attempt}`);
        return result;
      }

      console.warn(`[ProfileScraper] Got null result on attempt ${attempt}`);
    } catch (error) {
      lastError = error as Error;
      console.error(`[ProfileScraper] Error on attempt ${attempt}:`, error);

      if (attempt < maxRetries) {
        const waitMs = Math.pow(2, attempt) * 1000;
        console.log(`[ProfileScraper] Retrying in ${waitMs}ms...`);
        await new Promise((resolve) => setTimeout(resolve, waitMs));
      }
    }
  }

  if (lastError) {
    console.error(`[ProfileScraper] Failed after ${maxRetries} attempts:`, lastError);
    throw lastError;
  }

  console.warn(`[ProfileScraper] No data after ${maxRetries} attempts`);
  return null;
}

/**
 * Scrape profile with both rate limiting and retry logic
 * RECOMMENDED for production use
 */
export async function scrapeProfileDataSafe(
  options?: {
    includeActivity?: boolean;
    includeEndorsers?: boolean;
    maxEndorsedSkills?: number;
  },
  maxRetries: number = 3
): Promise<Partial<LinkedInProfile> & { activities?: ActivityEvent[] } | null> {
  return rateLimiter.enqueue(() => scrapeProfileDataWithRetry(options, maxRetries));
}
