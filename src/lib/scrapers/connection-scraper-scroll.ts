/**
 * Connection Scraper - Scroll Handler
 * Manages infinite scroll for loading all connections
 */

import { querySelectorAllFallback } from './helpers';
import { checkPaused, checkStopped, type ProgressUpdate, type ConnectionScrapeProgress } from './connection-scraper-progress';

const MAX_SCROLLS = 200;
const NO_CHANGE_THRESHOLD = 5;
const MIN_DELAY_MS = 3000;
const MAX_DELAY_MS = 5000;

const CONNECTION_LIST_SELECTORS = [
  '.mn-connection-card',
  '.artdeco-list__item',
  '[data-test-component="connections-list-item"]',
  '.reusable-search__result-container',
];

/**
 * Scroll to load all connections with infinite scroll
 */
export async function scrollToLoadAllConnections(
  maxScrolls: number = MAX_SCROLLS,
  onProgress?: (update: ProgressUpdate) => void,
  existingProgress?: ConnectionScrapeProgress
): Promise<Element[]> {
  let scrollCount = 0;
  let noChangeCount = 0;
  let previousCount = 0;

  console.log('[ConnectionScraper] Starting infinite scroll...');

  while (scrollCount < maxScrolls && noChangeCount < NO_CHANGE_THRESHOLD) {
    // Check pause/stop state
    if (checkStopped()) {
      console.log('[ConnectionScraper] Scraping stopped by user');
      break;
    }

    while (checkPaused()) {
      console.log('[ConnectionScraper] Scraping paused, waiting for resume...');
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    // Scroll to bottom
    window.scrollTo(0, document.body.scrollHeight);
    scrollCount++;

    // Wait for new content to load
    const delay = Math.random() * (MAX_DELAY_MS - MIN_DELAY_MS) + MIN_DELAY_MS;
    console.log(
      `[ConnectionScraper] Scroll ${scrollCount}/${maxScrolls}, waiting ${Math.round(delay)}ms...`
    );
    await new Promise((resolve) => setTimeout(resolve, delay));

    // Count current connections
    const currentConnections = querySelectorAllFallback(
      document,
      CONNECTION_LIST_SELECTORS
    );
    const currentCount = currentConnections.length;

    console.log(
      `[ConnectionScraper] Found ${currentCount} connection cards (${currentCount - previousCount} new)`
    );

    // Notify progress
    if (onProgress && existingProgress) {
      onProgress({
        scraped: currentCount,
        total: existingProgress.totalConnections,
        status: 'running',
        lastSaved: existingProgress.totalScraped,
      });
    }

    // Check if new connections were loaded
    if (currentCount === previousCount) {
      noChangeCount++;
      console.log(
        `[ConnectionScraper] No new connections (${noChangeCount}/${NO_CHANGE_THRESHOLD})`
      );
    } else {
      noChangeCount = 0;
    }

    previousCount = currentCount;
  }

  if (scrollCount >= maxScrolls) {
    console.warn(`[ConnectionScraper] Reached max scrolls (${maxScrolls})`);
  }

  if (noChangeCount >= NO_CHANGE_THRESHOLD) {
    console.log('[ConnectionScraper] All connections loaded (no new content)');
  }

  const finalConnections = querySelectorAllFallback(document, CONNECTION_LIST_SELECTORS);
  console.log(`[ConnectionScraper] Scroll complete: ${finalConnections.length} total cards`);

  return finalConnections;
}
