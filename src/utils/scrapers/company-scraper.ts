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
 * Extract update data from a single post card
 */
function extractUpdateFromCard(card: HTMLElement): LinkedInCompanyUpdate | null {
  try {
    // Post URL
    const linkElement = card.querySelector('a[href*="/feed/update/"]') as HTMLAnchorElement;
    const url = linkElement?.href || '';
    const id = url.match(/urn:li:activity:(\d+)/)?.[1] || `update_${Date.now()}`;

    // Post text preview
    const textElement = card.querySelector('.feed-shared-text__text-view span[dir="ltr"]');
    const preview = textElement?.textContent?.trim().slice(0, 200) || '';

    // Post image
    const imageElement = card.querySelector('img.feed-shared-image__image') as HTMLImageElement;
    const imageUrl = imageElement?.src;

    // Timestamp
    const timeElement = card.querySelector('time') as HTMLTimeElement;
    const timestamp = timeElement?.dateTime ? new Date(timeElement.dateTime).getTime() : Date.now();

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
