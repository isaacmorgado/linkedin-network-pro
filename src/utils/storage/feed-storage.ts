/**
 * Feed Storage Module
 * Handles storage operations for feed items
 */

import { log, LogCategory } from '../logger';
import type { FeedItem, FeedStats } from '../../types/feed';
import { FEED_STORAGE_KEY } from '../../types/feed';

// Get feed items from storage
export async function getFeedItems(): Promise<FeedItem[]> {
  return log.trackAsync(LogCategory.STORAGE, 'getFeedItems', async () => {
    try {
      log.debug(LogCategory.STORAGE, 'Fetching feed items from storage');
      const result = await chrome.storage.local.get(FEED_STORAGE_KEY);
      const items = result[FEED_STORAGE_KEY] || [];
      // Sort by timestamp, newest first
      const sortedItems = items.sort((a: FeedItem, b: FeedItem) => b.timestamp - a.timestamp);
      log.info(LogCategory.STORAGE, 'Feed items retrieved', { count: sortedItems.length });
      console.log('[Uproot] Retrieved feed items:', sortedItems.length, 'items');
      return sortedItems;
    } catch (error) {
      log.error(LogCategory.STORAGE, 'Error getting feed items', { error });
      console.error('[Uproot] Error getting feed items:', error);
      return [];
    }
  });
}

// Save feed items to storage
export async function saveFeedItems(items: FeedItem[]): Promise<void> {
  return log.trackAsync(LogCategory.STORAGE, 'saveFeedItems', async () => {
    try {
      log.debug(LogCategory.STORAGE, 'Saving feed items to storage', { count: items.length });
      // Sort by timestamp, newest first before saving
      const sortedItems = items.sort((a, b) => b.timestamp - a.timestamp);
      await chrome.storage.local.set({ [FEED_STORAGE_KEY]: sortedItems });
      log.change(LogCategory.STORAGE, 'feedItems', 'update', { count: items.length });
      console.log('[Uproot] Feed items saved:', items.length, 'items');
    } catch (error) {
      log.error(LogCategory.STORAGE, 'Error saving feed items', { error, count: items.length });
      console.error('[Uproot] Error saving feed items:', error);
      throw error;
    }
  });
}

// Add new feed item
export async function addFeedItem(item: Omit<FeedItem, 'id'>): Promise<FeedItem> {
  return log.trackAsync(LogCategory.STORAGE, 'addFeedItem', async () => {
    log.debug(LogCategory.STORAGE, 'Adding feed item', { type: item.type, title: item.title });
    const items = await getFeedItems();

    // Generate unique ID
    const id = `feed_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Create new feed item
    const newItem: FeedItem = {
      ...item,
      id,
    };

    // Add to beginning of list
    items.unshift(newItem);

    await saveFeedItems(items);
    log.change(LogCategory.STORAGE, 'feedItems', 'create', { id, type: newItem.type, title: newItem.title });
    console.log('[Uproot] Added feed item:', newItem.type, newItem.title);

    return newItem;
  });
}

// Update feed item
export async function updateFeedItem(id: string, updates: Partial<FeedItem>): Promise<void> {
  return log.trackAsync(LogCategory.STORAGE, 'updateFeedItem', async () => {
    log.debug(LogCategory.STORAGE, 'Updating feed item', { id, updates });
    const items = await getFeedItems();
    const index = items.findIndex((item) => item.id === id);

    if (index === -1) {
      log.error(LogCategory.STORAGE, 'Feed item not found', { id });
      throw new Error('Feed item not found');
    }

    items[index] = {
      ...items[index],
      ...updates,
    };

    await saveFeedItems(items);
    log.change(LogCategory.STORAGE, 'feedItems', 'update', { id, updates });
    console.log('[Uproot] Updated feed item:', id);
  });
}

// Toggle read status of feed item
export async function toggleFeedItemRead(id: string): Promise<void> {
  return log.trackAsync(LogCategory.STORAGE, 'toggleFeedItemRead', async () => {
    log.debug(LogCategory.STORAGE, 'Toggling feed item read status', { id });
    const items = await getFeedItems();
    const index = items.findIndex((item) => item.id === id);

    if (index === -1) {
      log.error(LogCategory.STORAGE, 'Feed item not found', { id });
      throw new Error('Feed item not found');
    }

    items[index].read = !items[index].read;

    await saveFeedItems(items);
    log.change(LogCategory.STORAGE, 'feedItems', 'update', { id, read: items[index].read });
    console.log('[Uproot] Toggled read status for feed item:', id, '→', items[index].read);
  });
}

// Mark all feed items as read
export async function markAllFeedItemsAsRead(): Promise<void> {
  return log.trackAsync(LogCategory.STORAGE, 'markAllFeedItemsAsRead', async () => {
    log.debug(LogCategory.STORAGE, 'Marking all feed items as read');
    const items = await getFeedItems();
    const updatedItems = items.map((item) => ({ ...item, read: true }));

    await saveFeedItems(updatedItems);
    log.change(LogCategory.STORAGE, 'feedItems', 'markAllRead', { count: items.length });
    console.log('[Uproot] Marked all feed items as read');
  });
}

// Delete feed item
export async function deleteFeedItem(id: string): Promise<void> {
  return log.trackAsync(LogCategory.STORAGE, 'deleteFeedItem', async () => {
    log.debug(LogCategory.STORAGE, 'Deleting feed item', { id });
    const items = await getFeedItems();
    const filteredItems = items.filter((item) => item.id !== id);

    await saveFeedItems(filteredItems);
    log.change(LogCategory.STORAGE, 'feedItems', 'delete', { id });
    console.log('[Uproot] Deleted feed item:', id);
  });
}

// Get feed statistics
export async function getFeedStats(): Promise<FeedStats> {
  return log.trackAsync(LogCategory.STORAGE, 'getFeedStats', async () => {
    log.debug(LogCategory.STORAGE, 'Calculating feed statistics');
    const items = await getFeedItems();

    const stats = {
      totalItems: items.length,
      unreadCount: items.filter((item) => !item.read).length,
      jobAlerts: items.filter((item) => item.type === 'job_alert').length,
      companyUpdates: items.filter((item) => item.type === 'company_update').length,
      connectionUpdates: items.filter((item) => item.type === 'connection_update').length,
      warmPaths: items.filter((item) => item.type === 'warm_path_opened').length,
    };

    log.info(LogCategory.STORAGE, 'Feed statistics calculated', stats);
    return stats;
  });
}

// Clear all feed items (for testing/reset)
export async function clearFeed(): Promise<void> {
  return log.trackAsync(LogCategory.STORAGE, 'clearFeed', async () => {
    try {
      log.debug(LogCategory.STORAGE, 'Clearing all feed items');
      await chrome.storage.local.remove(FEED_STORAGE_KEY);
      log.change(LogCategory.STORAGE, 'feedItems', 'clear', {});
      console.log('[Uproot] Feed cleared');
    } catch (error) {
      log.error(LogCategory.STORAGE, 'Error clearing feed', { error });
      console.error('[Uproot] Error clearing feed:', error);
      throw error;
    }
  });
}

/**
 * Clean up feed items older than specified number of days
 * @param maxAgeDays - Maximum age in days (default: 30 days)
 * @returns Number of items removed
 */
export async function cleanupOldFeedItems(maxAgeDays = 30): Promise<number> {
  return log.trackAsync(LogCategory.STORAGE, 'cleanupOldFeedItems', async () => {
    try {
      log.debug(LogCategory.STORAGE, 'Starting feed cleanup', { maxAgeDays });
      const items = await getFeedItems();
      const cutoffTime = Date.now() - (maxAgeDays * 24 * 60 * 60 * 1000);

      const freshItems = items.filter(item => item.timestamp > cutoffTime);
      const removedCount = items.length - freshItems.length;

      if (removedCount > 0) {
        await saveFeedItems(freshItems);
        log.change(LogCategory.STORAGE, 'feedItems', 'cleanup', { removedCount, maxAgeDays });
        console.log(`[Uproot] Cleaned up ${removedCount} old items (older than ${maxAgeDays} days)`);
      } else {
        log.debug(LogCategory.STORAGE, 'No old items to clean up');
      }

      return removedCount;
    } catch (error) {
      log.error(LogCategory.STORAGE, 'Error cleaning up old items', { error, maxAgeDays });
      console.error('[Uproot] Error cleaning up old items:', error);
      return 0;
    }
  });
}

/**
 * Clear company update snapshots
 * Useful when clearing feed to force fresh detection
 */
export async function clearCompanySnapshots(): Promise<void> {
  try {
    await chrome.storage.local.remove('uproot_company_snapshots');
    console.log('[Uproot] Company snapshots cleared');
  } catch (error) {
    console.error('[Uproot] Error clearing company snapshots:', error);
  }
}

/**
 * Get current storage usage stats
 * @returns Storage usage information
 */
export async function getStorageStats(): Promise<{
  feedItemCount: number;
  estimatedSizeKB: number;
  oldestItemAge: number;
}> {
  return log.trackAsync(LogCategory.STORAGE, 'getStorageStats', async () => {
    try {
      const items = await getFeedItems();
      const now = Date.now();
      const oldestItem = items.reduce((oldest, item) =>
        item.timestamp < oldest ? item.timestamp : oldest,
        now
      );

      // Rough estimate: each item ~500 bytes
      const estimatedSizeKB = Math.round((items.length * 500) / 1024);
      const oldestItemAge = items.length > 0
        ? Math.round((now - oldestItem) / (24 * 60 * 60 * 1000))
        : 0; // days

      return {
        feedItemCount: items.length,
        estimatedSizeKB,
        oldestItemAge,
      };
    } catch (error) {
      log.error(LogCategory.STORAGE, 'Error getting storage stats', { error });
      console.error('[Uproot] Error getting storage stats:', error);
      return {
        feedItemCount: 0,
        estimatedSizeKB: 0,
        oldestItemAge: 0,
      };
    }
  });
}
