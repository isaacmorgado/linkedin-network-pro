/**
 * Activity Scraper - LinkedIn Engagement Data Extraction
 *
 * Extracts engagement events (comments, reactions, shares, posts) from LinkedIn profiles.
 * CRITICAL for engagement_bridge pathfinding strategy.
 *
 * LEGAL WARNING: LinkedIn's ToS prohibits scraping. This code is for
 * educational purposes. Use official LinkedIn APIs in production.
 */

import type { ActivityEvent } from '@/types/network';
import { waitForElement } from './helpers';
import { rateLimiter } from '@/lib/rate-limiter';
import {
  querySelectorAllFallback,
  scrollToLoadMore,
  sleep,
} from './activity-scraper-helpers';
import { extractActivity } from './activity-scraper-extraction';

const ACTIVITY_CONTAINER_SELECTORS = [
  '.profile-creator-shared-feed-update__container',
  '.feed-shared-update-v2',
  '[data-urn*="activity"]',
];

/**
 * Scrape activity/engagement data from a LinkedIn profile's activity tab
 */
export async function scrapeProfileActivity(profileUrl: string): Promise<ActivityEvent[]> {
  const activities: ActivityEvent[] = [];

  try {
    console.log('[ActivityScraper] Starting activity scrape:', profileUrl);

    const activityUrl = profileUrl.endsWith('/')
      ? `${profileUrl}recent-activity/all/`
      : `${profileUrl}/recent-activity/all/`;

    console.log('[ActivityScraper] Activity URL:', activityUrl);

    const containerLoaded = await waitForElement(
      ACTIVITY_CONTAINER_SELECTORS[0],
      10000
    );

    if (!containerLoaded) {
      console.warn('[ActivityScraper] Activity container did not load.');
      return [];
    }

    await scrollToLoadMore('.scaffold-finite-scroll__content', 50);

    const activityElements = querySelectorAllFallback(
      document,
      ACTIVITY_CONTAINER_SELECTORS
    );

    console.log(`[ActivityScraper] Found ${activityElements.length} activity elements`);

    for (const element of activityElements) {
      const activity = extractActivity(element);
      if (activity) {
        activities.push(activity);
      }
    }

    console.log(
      `[ActivityScraper] Successfully extracted ${activities.length} activities`
    );

    return activities;
  } catch (error) {
    console.error('[ActivityScraper] Failed to scrape activities:', error);
    return [];
  }
}

/**
 * Scrape profile activity with rate limiting
 */
export async function scrapeProfileActivityRateLimited(
  profileUrl: string
): Promise<ActivityEvent[]> {
  return rateLimiter.enqueue(() => scrapeProfileActivity(profileUrl));
}

/**
 * Scrape profile activity with retry logic and exponential backoff
 */
export async function scrapeProfileActivityWithRetry(
  profileUrl: string,
  maxRetries: number = 3
): Promise<ActivityEvent[]> {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(
        `[ActivityScraper] Attempt ${attempt}/${maxRetries} for ${profileUrl}`
      );

      const activities = await scrapeProfileActivity(profileUrl);

      if (activities.length > 0 || attempt === maxRetries) {
        return activities;
      }

      console.warn(
        `[ActivityScraper] Got 0 activities on attempt ${attempt}, retrying...`
      );
    } catch (error) {
      lastError = error as Error;
      console.error(
        `[ActivityScraper] Attempt ${attempt}/${maxRetries} failed:`,
        error
      );

      if (attempt < maxRetries) {
        const backoffMs = Math.pow(2, attempt) * 1000;
        console.log(
          `[ActivityScraper] Waiting ${backoffMs}ms before retry...`
        );
        await sleep(backoffMs);
      }
    }
  }

  if (lastError) {
    console.error(
      `[ActivityScraper] All ${maxRetries} attempts failed:`,
      lastError
    );
  }

  return [];
}

/**
 * Scrape profile activity with both rate limiting and retry logic
 * RECOMMENDED for production use
 */
export async function scrapeProfileActivitySafe(
  profileUrl: string,
  maxRetries: number = 3
): Promise<ActivityEvent[]> {
  return rateLimiter.enqueue(() =>
    scrapeProfileActivityWithRetry(profileUrl, maxRetries)
  );
}
