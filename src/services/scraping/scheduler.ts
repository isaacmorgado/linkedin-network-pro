/**
 * Scraping Scheduler
 * Manages background sync schedules and idle detection
 *
 * Features:
 * - Daily connection sync (24 hours)
 * - Idle detection for opportunistic scraping
 * - Online/offline status awareness
 * - Deduplication checks
 */

import { scrapingOrchestrator } from './orchestrator';
import { ScrapingPriority } from './types';
import { networkDB } from '@/lib/storage/network-db';
import { log, LogCategory } from '@/utils/logger';

// ============================================================================
// CONSTANTS
// ============================================================================

const IDLE_DETECTION_INTERVAL = 60; // Check idle state every 60 seconds
const STALE_DATA_THRESHOLD_DAYS = 7; // Re-scrape profiles older than 7 days

// ============================================================================
// DEDUPLICATION HELPERS
// ============================================================================

/**
 * Check if a profile was scraped recently (within threshold)
 *
 * @param profileId - LinkedIn profile ID
 * @param thresholdDays - Number of days to consider "recent" (default: 7)
 * @returns True if profile was scraped recently, false otherwise
 */
export async function isRecentlyScraped(
  profileId: string,
  thresholdDays: number = STALE_DATA_THRESHOLD_DAYS
): Promise<boolean> {
  try {
    const node = await networkDB.nodes.get(profileId);

    if (!node || !node.profile.scrapedAt) {
      return false; // Never scraped
    }

    const scrapedAt = new Date(node.profile.scrapedAt);
    const now = new Date();
    const daysSinceScraped = (now.getTime() - scrapedAt.getTime()) / (1000 * 60 * 60 * 24);

    return daysSinceScraped < thresholdDays;
  } catch (error) {
    console.error('[Scheduler] Error checking if profile recently scraped:', error);
    return false; // Assume not scraped on error
  }
}

/**
 * Get list of profile IDs that need re-scraping (older than threshold)
 *
 * @param thresholdDays - Number of days to consider "stale" (default: 7)
 * @returns Array of profile IDs that need re-scraping
 */
export async function getStaleProfiles(
  thresholdDays: number = STALE_DATA_THRESHOLD_DAYS
): Promise<string[]> {
  try {
    const allNodes = await networkDB.nodes.toArray();
    const now = new Date();
    const staleProfiles: string[] = [];

    for (const node of allNodes) {
      if (!node.profile.scrapedAt) {
        staleProfiles.push(node.id);
        continue;
      }

      const scrapedAt = new Date(node.profile.scrapedAt);
      const daysSinceScraped = (now.getTime() - scrapedAt.getTime()) / (1000 * 60 * 60 * 24);

      if (daysSinceScraped >= thresholdDays) {
        staleProfiles.push(node.id);
      }
    }

    log.info(LogCategory.BACKGROUND, 'Found stale profiles', {
      total: allNodes.length,
      stale: staleProfiles.length,
      thresholdDays,
    });

    return staleProfiles;
  } catch (error) {
    log.error(LogCategory.BACKGROUND, 'Failed to get stale profiles', error as Error);
    return [];
  }
}

// ============================================================================
// BACKGROUND SYNC SCHEDULING
// ============================================================================

/**
 * Initialize background sync scheduler
 * Sets up idle detection and periodic sync checks
 *
 * Call this from background script initialization
 */
export function initializeScheduler(): void {
  log.info(LogCategory.BACKGROUND, 'Initializing scraping scheduler');

  // Set up idle state change listener
  setupIdleDetection();

  // Check if we should sync on startup
  checkAndScheduleSync();

  log.info(LogCategory.BACKGROUND, 'Scraping scheduler initialized');
}

/**
 * Set up idle detection for opportunistic scraping
 * Triggers background scraping when user is idle
 */
function setupIdleDetection(): void {
  // Check if chrome.idle API is available
  if (!chrome.idle) {
    log.warn(LogCategory.BACKGROUND, 'chrome.idle API not available - idle detection disabled');
    return;
  }

  // Set idle detection interval (60 seconds)
  chrome.idle.setDetectionInterval(IDLE_DETECTION_INTERVAL);

  // Listen for idle state changes
  chrome.idle.onStateChanged.addListener(async (state) => {
    log.debug(LogCategory.BACKGROUND, 'Idle state changed', { state });

    if (state === 'idle') {
      await handleIdleState();
    } else if (state === 'active') {
      // User became active - pause LOW priority tasks to not interfere
      log.info(LogCategory.BACKGROUND, 'User active, deprioritizing background scraping');
      // Note: We don't pause completely, just let HIGH priority tasks go first
    }
  });

  log.info(LogCategory.BACKGROUND, 'Idle detection set up', {
    interval: IDLE_DETECTION_INTERVAL,
  });
}

/**
 * Handle idle state - trigger opportunistic background scraping
 */
async function handleIdleState(): Promise<void> {
  log.info(LogCategory.BACKGROUND, 'User idle, checking for background scraping opportunities');

  try {
    // Check online status
    if (!navigator.onLine) {
      log.warn(LogCategory.BACKGROUND, 'User offline, skipping background scraping');
      return;
    }

    // Check if there are pending tasks already
    const queueStatus = await scrapingOrchestrator.getQueueStatus();

    if (queueStatus.lowPriority > 0) {
      log.info(LogCategory.BACKGROUND, 'Low priority tasks already queued', {
        count: queueStatus.lowPriority,
      });
      return; // Already have background tasks queued
    }

    // Check for stale profiles that need updating
    const staleProfiles = await getStaleProfiles();

    if (staleProfiles.length > 0) {
      log.info(LogCategory.BACKGROUND, 'Enqueuing stale profile updates', {
        count: Math.min(staleProfiles.length, 10), // Limit to 10 at a time
      });

      // Enqueue batch profile scrape for first 10 stale profiles
      await scrapingOrchestrator.enqueueTask({
        type: 'batch_profile',
        priority: ScrapingPriority.LOW,
        params: {
          profileUrls: staleProfiles.slice(0, 10).map((id) => `https://linkedin.com/in/${id}`),
        },
      });
    }
  } catch (error) {
    log.error(LogCategory.BACKGROUND, 'Error handling idle state', error as Error);
  }
}

/**
 * Check if background sync is needed and schedule if necessary
 * Called on extension startup and periodically
 */
async function checkAndScheduleSync(): Promise<void> {
  try {
    // Check last sync time
    const result = await chrome.storage.local.get('last_connection_sync');
    const lastSync = result.last_connection_sync
      ? new Date(result.last_connection_sync)
      : null;

    const now = new Date();
    const hoursSinceLastSync = lastSync
      ? (now.getTime() - lastSync.getTime()) / (1000 * 60 * 60)
      : Infinity;

    log.info(LogCategory.BACKGROUND, 'Checking sync schedule', {
      lastSync: lastSync?.toISOString(),
      hoursSinceLastSync: hoursSinceLastSync.toFixed(1),
    });

    // If more than 24 hours since last sync, trigger now
    if (hoursSinceLastSync >= 24) {
      log.info(LogCategory.BACKGROUND, 'Triggering overdue connection sync');
      await triggerConnectionSync();
    }
  } catch (error) {
    log.error(LogCategory.BACKGROUND, 'Error checking sync schedule', error as Error);
  }
}

/**
 * Trigger connection sync
 * Enqueues a LOW priority connection scrape task
 */
export async function triggerConnectionSync(): Promise<void> {
  log.info(LogCategory.BACKGROUND, 'Triggering connection sync');

  try {
    // Check online status
    if (!navigator.onLine) {
      log.warn(LogCategory.BACKGROUND, 'User offline, skipping connection sync');
      return;
    }

    // Enqueue connection scrape task
    const taskId = await scrapingOrchestrator.enqueueTask({
      type: 'connection',
      priority: ScrapingPriority.LOW,
      params: { resume: true },
    });

    // Update last sync time
    await chrome.storage.local.set({
      last_connection_sync: new Date().toISOString(),
    });

    log.info(LogCategory.BACKGROUND, 'Connection sync enqueued', { taskId });
  } catch (error) {
    log.error(LogCategory.BACKGROUND, 'Failed to trigger connection sync', error as Error);
  }
}

// ============================================================================
// ONLINE/OFFLINE STATUS MONITORING
// ============================================================================

/**
 * Set up online/offline status monitoring
 * Pauses scraping when offline, resumes when online
 *
 * NOTE: Uses 'self' instead of 'window' for service worker compatibility
 */
export function setupOnlineStatusMonitoring(): void {
  // Use 'self' in service worker context, 'window' in other contexts
  const globalContext = typeof window !== 'undefined' ? window : (globalThis as any);

  // Listen for offline event
  globalContext.addEventListener('offline', async () => {
    log.warn(LogCategory.BACKGROUND, 'User went offline, pausing scraping');
    await scrapingOrchestrator.pauseAll();
  });

  // Listen for online event
  globalContext.addEventListener('online', async () => {
    log.info(LogCategory.BACKGROUND, 'User came online, resuming scraping');
    await scrapingOrchestrator.resumeAll();
  });

  log.info(LogCategory.BACKGROUND, 'Online/offline monitoring set up');
}

// ============================================================================
// DEDUPLICATION UTILITIES
// ============================================================================

/**
 * Check if connection scraping should be skipped (already done recently)
 *
 * @returns True if scraping should proceed, false if recently done
 */
export async function shouldScrapeConnections(): Promise<boolean> {
  try {
    const result = await chrome.storage.local.get('last_connection_sync');
    const lastSync = result.last_connection_sync
      ? new Date(result.last_connection_sync)
      : null;

    if (!lastSync) {
      return true; // Never synced, should scrape
    }

    const now = new Date();
    const hoursSinceLastSync = (now.getTime() - lastSync.getTime()) / (1000 * 60 * 60);

    // Only scrape if more than 6 hours since last sync
    // (Daily sync is 24h, but allow manual trigger after 6h)
    return hoursSinceLastSync >= 6;
  } catch (error) {
    console.error('[Scheduler] Error checking connection scrape status:', error);
    return true; // Allow scraping on error
  }
}

/**
 * Get statistics about scraping freshness
 *
 * @returns Statistics about scraped data age
 */
export async function getScrapingStats(): Promise<{
  totalProfiles: number;
  recentProfiles: number; // < 7 days
  staleProfiles: number; // >= 7 days
  neverScraped: number;
  lastConnectionSync: string | null;
}> {
  try {
    const allNodes = await networkDB.nodes.toArray();
    const now = new Date();

    let recentCount = 0;
    let staleCount = 0;
    let neverScrapedCount = 0;

    for (const node of allNodes) {
      if (!node.profile.scrapedAt) {
        neverScrapedCount++;
        continue;
      }

      const scrapedAt = new Date(node.profile.scrapedAt);
      const daysSinceScraped = (now.getTime() - scrapedAt.getTime()) / (1000 * 60 * 60 * 24);

      if (daysSinceScraped < STALE_DATA_THRESHOLD_DAYS) {
        recentCount++;
      } else {
        staleCount++;
      }
    }

    const result = await chrome.storage.local.get('last_connection_sync');
    const lastConnectionSync = result.last_connection_sync || null;

    return {
      totalProfiles: allNodes.length,
      recentProfiles: recentCount,
      staleProfiles: staleCount,
      neverScraped: neverScrapedCount,
      lastConnectionSync,
    };
  } catch (error) {
    log.error(LogCategory.BACKGROUND, 'Failed to get scraping stats', error as Error);
    return {
      totalProfiles: 0,
      recentProfiles: 0,
      staleProfiles: 0,
      neverScraped: 0,
      lastConnectionSync: null,
    };
  }
}
