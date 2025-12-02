/**
 * Company Scraper
 * Extracts company updates and posts from LinkedIn company pages
 */

import type { LinkedInCompanyUpdate } from '../../types/monitoring';

/**
 * Scrape company posts/updates
 * Works on: linkedin.com/company/{company}/posts
 * NOTE: This function requires DOM access and cannot run in service worker context
 */
// @ts-expect-error - Parameter will be used in future implementation
export function scrapeCompanyUpdates(companyUrl: string): LinkedInCompanyUpdate[] {
  // Guard: Only execute in DOM context (not in service worker)
  if (typeof document === 'undefined') {
    console.warn('[Uproot] scrapeCompanyUpdates() cannot be called in service worker context');
    return [];
  }

  const updates: LinkedInCompanyUpdate[] = [];

  try {
    // Company post cards
    const postCards = document.querySelectorAll('.feed-shared-update-v2, .occludable-update');

    postCards.forEach((card, _index) => {
      try {
        const update = extractUpdateFromCard(card as HTMLElement);
        if (update) {
          updates.push(update);
        }
      } catch (error) {
        console.error('[Uproot] Error extracting update from card:', error instanceof Error ? error.message : String(error), error);
      }
    });

    console.log(`[Uproot] Scraped ${updates.length} updates from company page`);
  } catch (error) {
    console.error('[Uproot] Error scraping company updates:', error instanceof Error ? error.message : String(error), error);
  }

  return updates;
}

/**
 * Simple deterministic hash function for generating stable IDs
 * Uses djb2 algorithm for consistent hashing
 */
function simpleHash(str: string): string {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash) + str.charCodeAt(i); // hash * 33 + char
  }
  return Math.abs(hash).toString(36);
}

/**
 * Extract update data from a single post card
 */
function extractUpdateFromCard(card: HTMLElement): LinkedInCompanyUpdate | null {
  try {
    // Post URL
    const linkElement = card.querySelector('a[href*="/feed/update/"]') as HTMLAnchorElement;
    const url = linkElement?.href || '';

    // Post text preview
    const textElement = card.querySelector('.feed-shared-text__text-view span[dir="ltr"]');
    const preview = textElement?.textContent?.trim().slice(0, 200) || '';

    // Post image
    const imageElement = card.querySelector('img.feed-shared-image__image') as HTMLImageElement;
    const imageUrl = imageElement?.src;

    // Timestamp
    const timeElement = card.querySelector('time') as HTMLTimeElement;
    const timestamp = timeElement?.dateTime ? new Date(timeElement.dateTime).getTime() : Date.now();

    // Generate stable ID: try LinkedIn URN first, fallback to deterministic hash
    let id = url.match(/urn:li:activity:(\d+)/)?.[1];
    if (!id) {
      // Fallback: Generate stable ID from URL + timestamp + preview
      // Use a simple hash of the content to create a consistent ID
      const contentHash = simpleHash(url + timestamp + preview.slice(0, 50));
      id = `update_${contentHash}`;
    }

    // Infer type from content
    let type: 'post' | 'article' | 'event' | 'hiring' = 'post';
    if (preview.toLowerCase().includes('hiring') || preview.toLowerCase().includes('join our team')) {
      type = 'hiring';
    } else if (card.querySelector('.feed-shared-article')) {
      type = 'article';
    } else if (preview.toLowerCase().includes('event')) {
      type = 'event';
    }

    return {
      id,
      type,
      timestamp,
      url,
      preview,
      imageUrl,
    };
  } catch (error) {
    console.error('[Uproot] Error extracting update from card:', error instanceof Error ? error.message : String(error), error);
    return null;
  }
}
