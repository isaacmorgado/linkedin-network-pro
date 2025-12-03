/**
 * Connection List Scraper
 * Scrapes user's 1st-degree connections from LinkedIn connections page
 *
 * HIGH VOLUME scraper designed for 500-2000+ connections
 * Features: incremental progress saving, pause/resume, most conservative rate limiting
 *
 * LEGAL WARNING: LinkedIn's ToS prohibits scraping. This code is for
 * educational purposes. Use official LinkedIn APIs in production.
 */

import { NetworkNodeSchema, type NetworkNode } from '@/types';
import { waitForElement } from './helpers';
import { rateLimiter } from '../rate-limiter';
import { bulkAddNodes } from '../storage/network-db';
import { z } from 'zod';
import {
  type ConnectionScrapeProgress,
  type ProgressUpdate,
  loadProgress,
  updateProgress,
  clearProgress,
  resetState,
  checkStopped,
  pauseScraping,
  resumeScraping,
  stopScraping,
} from './connection-scraper-progress';
import {
  extractConnection,
  connectionExists,
  getTotalConnectionCount,
} from './connection-scraper-extraction';
import { scrollToLoadAllConnections } from './connection-scraper-scroll';

const BATCH_SIZE = 50;
const CONNECTION_LIST_SELECTORS = [
  '.mn-connection-card',
  '.artdeco-list__item',
  '[data-test-component="connections-list-item"]',
  '.reusable-search__result-container',
];

// Export pause/resume/stop functions
export { pauseScraping, resumeScraping, stopScraping };

/**
 * Save a batch of connections to IndexedDB
 */
async function saveBatch(connections: NetworkNode[]): Promise<void> {
  if (connections.length === 0) {
    return;
  }

  try {
    await bulkAddNodes(connections);
    console.log(`[ConnectionScraper] Saved batch of ${connections.length} connections to IndexedDB`);
  } catch (error) {
    console.error('[ConnectionScraper] Failed to save batch:', error);
    throw error;
  }
}

/**
 * Scrape all 1st-degree connections from LinkedIn connections page
 */
export async function scrapeConnections(options?: {
  resume?: boolean;
  onProgress?: (update: ProgressUpdate) => void;
}): Promise<NetworkNode[]> {
  try {
    resetState();

    // Load or initialize progress
    let progress: ConnectionScrapeProgress;

    if (options?.resume) {
      const existingProgress = await loadProgress();
      if (existingProgress && existingProgress.status !== 'complete') {
        console.log(
          `[ConnectionScraper] Resuming from ${existingProgress.totalScraped} connections`
        );
        progress = {
          ...existingProgress,
          status: 'running',
        };
      } else {
        console.log('[ConnectionScraper] No progress to resume, starting fresh');
        progress = createFreshProgress();
      }
    } else {
      progress = createFreshProgress();
      await clearProgress();
    }

    // Wait for connections list to load
    console.log('[ConnectionScraper] Waiting for connections list...');
    await waitForElement(CONNECTION_LIST_SELECTORS[0], 15000);

    // Extract total connection count
    progress.totalConnections = getTotalConnectionCount();

    // Scroll to load all connections
    console.log('[ConnectionScraper] Scrolling to load all connections...');
    const connectionElements = await scrollToLoadAllConnections(
      200,
      options?.onProgress,
      progress
    );

    if (checkStopped()) {
      progress.status = 'paused';
      await updateProgress(progress);
      console.log('[ConnectionScraper] Scraping stopped, progress saved');
      return [];
    }

    // Extract connection data with batch processing
    const allConnections: NetworkNode[] = [];
    const seenIds = new Set<string>(); // O(1) lookup for deduplication
    let currentBatch: NetworkNode[] = [];
    let newConnectionsCount = 0;

    console.log(`[ConnectionScraper] Extracting data from ${connectionElements.length} cards...`);

    for (let i = 0; i < connectionElements.length; i++) {
      const cardElement = connectionElements[i];

      try {
        const connection = extractConnection(cardElement);

        if (connection) {
          // Check if already seen in current session (O(1))
          if (seenIds.has(connection.id)) {
            console.log(`[ConnectionScraper] Duplicate in session skipped: ${connection.id}`);
            continue;
          }

          // Check if exists in database
          const existsInDb = await connectionExists(connection.id, []);

          if (!existsInDb) {
            currentBatch.push(connection);
            allConnections.push(connection);
            seenIds.add(connection.id); // Track as seen
            newConnectionsCount++;

            // Save batch every BATCH_SIZE connections
            if (currentBatch.length >= BATCH_SIZE) {
              await saveBatch(currentBatch);

              progress.totalScraped += currentBatch.length;
              progress.lastScrapedId = currentBatch[currentBatch.length - 1].id;
              progress.lastSaveAt = new Date().toISOString();
              await updateProgress(progress);

              if (options?.onProgress) {
                options.onProgress({
                  scraped: i + 1,
                  total: progress.totalConnections,
                  status: 'running',
                  lastSaved: progress.totalScraped,
                });
              }

              console.log(
                `[ConnectionScraper] Batch saved: ${progress.totalScraped} total connections`
              );

              currentBatch = [];
            }
          } else {
            // Already exists in database, just track it as seen
            seenIds.add(connection.id);
            console.log(`[ConnectionScraper] Already in database, skipped: ${connection.id}`);
          }
        }
      } catch (error) {
        console.error(`[ConnectionScraper] Error processing connection ${i}:`, error);
      }
    }

    // Save final batch
    if (currentBatch.length > 0) {
      await saveBatch(currentBatch);
      progress.totalScraped += currentBatch.length;
      progress.lastScrapedId = currentBatch[currentBatch.length - 1].id;
      progress.lastSaveAt = new Date().toISOString();
      await updateProgress(progress);

      console.log(`[ConnectionScraper] Final batch saved: ${currentBatch.length} connections`);
    }

    // Mark progress as complete
    progress.status = 'complete';
    await updateProgress(progress);

    // Final progress notification
    if (options?.onProgress) {
      options.onProgress({
        scraped: allConnections.length,
        total: progress.totalConnections,
        status: 'complete',
        lastSaved: progress.totalScraped,
      });
    }

    console.log(
      `[ConnectionScraper] Scraping complete: ${allConnections.length} connections (${newConnectionsCount} new)`
    );

    // Validate connections against schema
    const validated = z.array(NetworkNodeSchema).parse(allConnections);

    return validated;
  } catch (error) {
    console.error('[ConnectionScraper] Fatal error during scraping:', error);

    try {
      const errorProgress = await loadProgress();
      if (errorProgress) {
        errorProgress.status = 'error';
        await updateProgress(errorProgress);
      }
    } catch (e) {
      console.error('[ConnectionScraper] Failed to save error state:', error);
    }

    throw error;
  }
}

/**
 * Scrape connections with retry logic
 */
export async function scrapeConnectionsWithRetry(
  options?: {
    resume?: boolean;
    onProgress?: (update: ProgressUpdate) => void;
  },
  maxRetries: number = 3
): Promise<NetworkNode[]> {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`[ConnectionScraper] Attempt ${attempt}/${maxRetries}`);
      return await scrapeConnections(options);
    } catch (error) {
      lastError = error as Error;
      console.error(`[ConnectionScraper] Attempt ${attempt} failed:`, error);

      if (attempt < maxRetries) {
        const delay = Math.pow(2, attempt) * 1000;
        console.log(`[ConnectionScraper] Retrying in ${delay}ms...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  console.error(
    `[ConnectionScraper] All ${maxRetries} attempts failed, throwing last error`
  );
  throw lastError;
}

/**
 * RECOMMENDED: Scrape connections with rate limiting, retries, and exponential backoff
 */
export async function scrapeConnectionsSafe(
  options?: {
    resume?: boolean;
    onProgress?: (update: ProgressUpdate) => void;
  },
  maxRetries: number = 3
): Promise<NetworkNode[]> {
  return rateLimiter.enqueue(() => scrapeConnectionsWithRetry(options, maxRetries));
}

function createFreshProgress(): ConnectionScrapeProgress {
  return {
    totalScraped: 0,
    lastScrapedId: null,
    startedAt: new Date().toISOString(),
    lastSaveAt: new Date().toISOString(),
    status: 'running',
    totalConnections: null,
  };
}
