/**
 * useFeed Hook
 * Manages feed items with persistent storage
 */

import { useState, useEffect, useCallback } from 'react';
import type { FeedItem, FeedStats } from '../types/feed';
import {
  getFeedItems,
  addFeedItem as storageAddFeedItem,
  toggleFeedItemRead,
  markAllFeedItemsAsRead,
  deleteFeedItem as storageDeleteFeedItem,
  getFeedStats,
} from '../utils/storage';
import { FEED_STORAGE_KEY } from '../types/feed';

export function useFeed() {
  const [feedItems, setFeedItems] = useState<FeedItem[]>([]);
  const [stats, setStats] = useState<FeedStats>({
    totalItems: 0,
    unreadCount: 0,
    jobAlerts: 0,
    companyUpdates: 0,
    connectionUpdates: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load feed items from storage
  const loadFeed = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const items = await getFeedItems();
      const feedStats = await getFeedStats();
      setFeedItems(items);
      setStats(feedStats);
    } catch (err) {
      console.error('[Uproot] Error loading feed:', err);
      setError('Failed to load feed');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load on mount
  useEffect(() => {
    loadFeed();
  }, [loadFeed]);

  // Listen for storage changes
  useEffect(() => {
    const handleStorageChange = (
      changes: { [key: string]: chrome.storage.StorageChange },
      areaName: string
    ) => {
      if (areaName === 'local' && changes[FEED_STORAGE_KEY]) {
        // Reload feed when storage changes
        loadFeed();
      }
    };

    chrome.storage.onChanged.addListener(handleStorageChange);

    return () => {
      chrome.storage.onChanged.removeListener(handleStorageChange);
    };
  }, [loadFeed]);

  // Add new feed item
  const addFeedItem = useCallback(async (item: Omit<FeedItem, 'id'>) => {
    try {
      const newItem = await storageAddFeedItem(item);
      await loadFeed(); // Reload to get updated stats
      return newItem;
    } catch (err) {
      console.error('[Uproot] Error adding feed item:', err);
      setError('Failed to add feed item');
      throw err;
    }
  }, [loadFeed]);

  // Toggle read status
  const toggleRead = useCallback(async (itemId: string) => {
    try {
      await toggleFeedItemRead(itemId);
      // Optimistically update local state
      setFeedItems((prevItems) =>
        prevItems.map((item) =>
          item.id === itemId ? { ...item, read: !item.read } : item
        )
      );
      // Update stats
      const feedStats = await getFeedStats();
      setStats(feedStats);
    } catch (err) {
      console.error('[Uproot] Error toggling read status:', err);
      setError('Failed to update read status');
      // Reload to restore correct state
      await loadFeed();
    }
  }, [loadFeed]);

  // Mark all as read
  const markAllAsRead = useCallback(async () => {
    try {
      await markAllFeedItemsAsRead();
      // Optimistically update local state
      setFeedItems((prevItems) =>
        prevItems.map((item) => ({ ...item, read: true }))
      );
      // Update stats
      setStats((prevStats) => ({ ...prevStats, unreadCount: 0 }));
    } catch (err) {
      console.error('[Uproot] Error marking all as read:', err);
      setError('Failed to mark all as read');
      // Reload to restore correct state
      await loadFeed();
    }
  }, [loadFeed]);

  // Delete feed item
  const deleteFeedItem = useCallback(async (itemId: string) => {
    try {
      await storageDeleteFeedItem(itemId);
      await loadFeed(); // Reload to get updated stats
    } catch (err) {
      console.error('[Uproot] Error deleting feed item:', err);
      setError('Failed to delete feed item');
      throw err;
    }
  }, [loadFeed]);

  return {
    feedItems,
    stats,
    isLoading,
    error,
    addFeedItem,
    toggleRead,
    markAllAsRead,
    deleteFeedItem,
    reload: loadFeed,
  };
}
