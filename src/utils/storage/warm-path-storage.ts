/**
 * Warm Path Storage Module
 * Handles deduplication storage for warm_path_opened feed items
 */

import { log, LogCategory } from '../logger';

export interface WarmPathDedupeEntry {
  key: string;
  targetCompanyUrl: string;
  viaPersonProfileUrl: string;
  pathLength: number;
  createdAt: number;
}

// Storage key
const WARM_PATH_DEDUPE_KEY = 'uproot_warm_path_dedupe';

// Deduplication window (30 days in milliseconds)
const DEDUPE_WINDOW_MS = 30 * 24 * 60 * 60 * 1000;

// Get warm path dedupe entries from storage
export async function getWarmPathDedupe(): Promise<WarmPathDedupeEntry[]> {
  return log.trackAsync(LogCategory.STORAGE, 'getWarmPathDedupe', async () => {
    try {
      log.debug(LogCategory.STORAGE, 'Fetching warm path dedupe entries from storage');
      const result = await chrome.storage.local.get(WARM_PATH_DEDUPE_KEY);
      const entries = result[WARM_PATH_DEDUPE_KEY] || [];
      log.info(LogCategory.STORAGE, 'Warm path dedupe entries retrieved', { count: entries.length });
      return entries;
    } catch (error) {
      log.error(LogCategory.STORAGE, 'Error getting warm path dedupe entries', { error });
      console.error('[Uproot] Error getting warm path dedupe entries:', error);
      return [];
    }
  });
}

// Save warm path dedupe entries to storage
async function saveWarmPathDedupe(entries: WarmPathDedupeEntry[]): Promise<void> {
  return log.trackAsync(LogCategory.STORAGE, 'saveWarmPathDedupe', async () => {
    try {
      log.debug(LogCategory.STORAGE, 'Saving warm path dedupe entries to storage', { count: entries.length });
      await chrome.storage.local.set({ [WARM_PATH_DEDUPE_KEY]: entries });
      log.change(LogCategory.STORAGE, 'warmPathDedupe', 'update', { count: entries.length });
    } catch (error) {
      log.error(LogCategory.STORAGE, 'Error saving warm path dedupe entries', { error, count: entries.length });
      console.error('[Uproot] Error saving warm path dedupe entries:', error);
      throw error;
    }
  });
}

// Add new warm path dedupe entry
export async function addWarmPathDedupe(
  entry: Omit<WarmPathDedupeEntry, 'key' | 'createdAt'>
): Promise<void> {
  return log.trackAsync(LogCategory.STORAGE, 'addWarmPathDedupe', async () => {
    log.debug(LogCategory.STORAGE, 'Adding warm path dedupe entry', entry);
    const entries = await getWarmPathDedupe();

    // Generate key
    const key = `${entry.targetCompanyUrl}_${entry.viaPersonProfileUrl}_${entry.pathLength}`;

    // Check if already exists
    const existingIndex = entries.findIndex(e => e.key === key);
    if (existingIndex !== -1) {
      log.debug(LogCategory.STORAGE, 'Warm path dedupe entry already exists', { key });
      return; // Already exists, no need to add
    }

    // Create new entry
    const newEntry: WarmPathDedupeEntry = {
      ...entry,
      key,
      createdAt: Date.now()
    };

    entries.push(newEntry);

    await saveWarmPathDedupe(entries);
    log.change(LogCategory.STORAGE, 'warmPathDedupe', 'create', { key });
    console.log('[Uproot] Added warm path dedupe entry:', key);
  });
}

// Prune old dedupe entries (older than 30 days)
export async function pruneWarmPathDedupe(): Promise<void> {
  return log.trackAsync(LogCategory.STORAGE, 'pruneWarmPathDedupe', async () => {
    log.debug(LogCategory.STORAGE, 'Pruning old warm path dedupe entries');
    const entries = await getWarmPathDedupe();
    const now = Date.now();
    const cutoff = now - DEDUPE_WINDOW_MS;

    const validEntries = entries.filter(entry => entry.createdAt > cutoff);

    const prunedCount = entries.length - validEntries.length;

    if (prunedCount > 0) {
      await saveWarmPathDedupe(validEntries);
      log.change(LogCategory.STORAGE, 'warmPathDedupe', 'prune', { prunedCount, remaining: validEntries.length });
      console.log(`[Uproot] Pruned ${prunedCount} old warm path dedupe entries`);
    } else {
      log.debug(LogCategory.STORAGE, 'No old warm path dedupe entries to prune');
    }
  });
}

// Check if a warm path is a duplicate
export async function isDuplicateWarmPath(
  targetCompanyUrl: string,
  viaPersonProfileUrl: string,
  pathLength: number
): Promise<boolean> {
  return log.trackAsync(LogCategory.STORAGE, 'isDuplicateWarmPath', async () => {
    log.debug(LogCategory.STORAGE, 'Checking for duplicate warm path', {
      targetCompanyUrl,
      viaPersonProfileUrl,
      pathLength
    });

    // Prune old entries first
    await pruneWarmPathDedupe();

    const entries = await getWarmPathDedupe();
    const key = `${targetCompanyUrl}_${viaPersonProfileUrl}_${pathLength}`;

    const isDuplicate = entries.some(entry => entry.key === key);

    log.debug(LogCategory.STORAGE, 'Duplicate check result', { key, isDuplicate });
    return isDuplicate;
  });
}

// Clear all warm path dedupe entries (for testing/reset)
export async function clearWarmPathDedupe(): Promise<void> {
  return log.trackAsync(LogCategory.STORAGE, 'clearWarmPathDedupe', async () => {
    try {
      log.debug(LogCategory.STORAGE, 'Clearing all warm path dedupe entries');
      await chrome.storage.local.remove(WARM_PATH_DEDUPE_KEY);
      log.change(LogCategory.STORAGE, 'warmPathDedupe', 'clear', {});
      console.log('[Uproot] Warm path dedupe cleared');
    } catch (error) {
      log.error(LogCategory.STORAGE, 'Error clearing warm path dedupe', { error });
      console.error('[Uproot] Error clearing warm path dedupe:', error);
      throw error;
    }
  });
}
