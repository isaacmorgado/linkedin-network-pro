/**
 * Activity Scraper - Activity Extraction
 * Functions for extracting activity event data from DOM
 */

import type { ActivityEvent } from '@/types/network';
import { querySelectorFallback } from './activity-scraper-helpers';
import { generateUUID } from './activity-scraper-helpers';

const ACTOR_SELECTORS = [
  '.update-components-actor__name',
  '.feed-shared-actor__name',
  '[data-control-name="actor"] a',
  'a[href*="/in/"]',
];

const TARGET_SELECTORS = [
  '.feed-shared-actor__name',
  '.update-components-target__name',
  '[data-control-name="target"] a',
];

const CONTENT_SELECTORS = [
  '.feed-shared-text__text-view span[dir="ltr"]',
  '.feed-shared-text__text-view',
  '.feed-shared-inline-show-more-text',
  '[data-test-id="post-content"]',
  '.feed-shared-text',
];

const TIME_SELECTORS = [
  'time[datetime]',
  'time',
  '.feed-shared-actor__sub-description time',
  '[data-control-name="time"]',
];

const COMMENT_INDICATORS = [
  '.comment-entity',
  '[data-test-id="comment"]',
  '.comments-comment-item',
  '[aria-label*="comment"]',
];

const REACTION_INDICATORS = [
  '.social-details-social-activity',
  '.reactions-react-button',
  '[data-control-name="like"]',
  '[aria-label*="react"]',
];

const SHARE_INDICATORS = [
  '.feed-shared-update-v2__reshared',
  '.feed-shared-reshare-header',
  '[data-test-id="reshare"]',
  '[aria-label*="share"]',
];

/**
 * Extract activity event data from a single activity element
 */
export function extractActivity(element: Element): ActivityEvent | null {
  try {
    const type = detectActivityType(element);

    const actorElement = querySelectorFallback(element, ACTOR_SELECTORS);
    const actorId = extractProfileId(actorElement);

    const targetElement = querySelectorFallback(element, TARGET_SELECTORS);
    const targetId = extractProfileId(targetElement) || actorId;

    const contentElement = querySelectorFallback(element, CONTENT_SELECTORS);
    const content = contentElement?.textContent?.trim() || undefined;

    const timeElement = querySelectorFallback(element, TIME_SELECTORS);
    const timestamp =
      timeElement?.getAttribute('datetime') ||
      new Date().toISOString();

    const postId =
      element.getAttribute('data-urn') ||
      element.getAttribute('data-activity-urn') ||
      undefined;

    if (!actorId) {
      console.warn('[ActivityScraper] Missing actorId, skipping activity');
      return null;
    }

    const id = generateUUID();

    return {
      id,
      actorId,
      targetId: targetId || actorId,
      type,
      content,
      postId,
      timestamp,
      scrapedAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error('[ActivityScraper] Error extracting activity:', error);
    return null;
  }
}

/**
 * Detect activity type based on DOM indicators
 */
function detectActivityType(
  element: Element
): 'comment' | 'reaction' | 'share' | 'post' {
  if (querySelectorFallback(element, COMMENT_INDICATORS)) {
    return 'comment';
  }

  if (querySelectorFallback(element, REACTION_INDICATORS)) {
    return 'reaction';
  }

  if (querySelectorFallback(element, SHARE_INDICATORS)) {
    return 'share';
  }

  return 'post';
}

/**
 * Extract LinkedIn profile ID from an element's href attribute
 */
function extractProfileId(element: Element | null): string | null {
  if (!element) return null;

  const href = element.getAttribute('href');
  if (!href) return null;

  const match = href.match(/\/in\/([^\/\?]+)/);
  return match ? match[1] : null;
}
