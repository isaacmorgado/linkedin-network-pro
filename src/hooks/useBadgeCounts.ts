/**
 * Badge Counts Hook
 * Tracks notification and watchlist counts for badge display
 */

import { useState, useEffect } from 'react';
import type { TabId } from '../types/navigation';
import { getFeedStats, getWatchlist, getJobDescriptionAnalyses } from '../utils/storage';
import { FEED_STORAGE_KEY } from '../types/feed';
import { WATCHLIST_PEOPLE_STORAGE_KEY } from '../types/watchlist';
import { JOB_DESCRIPTIONS_KEY } from '../types/resume';

interface BadgeCounts {
  watchlist: number;
  feed: number;
  jobs: number;
}

export function useBadgeCounts() {
  const [counts, setCounts] = useState<BadgeCounts>({
    watchlist: 0,
    feed: 0,
    jobs: 0,
  });

  useEffect(() => {
    // Fetch actual counts from Chrome storage
    const fetchCounts = async () => {
      try {
        // Get feed unread count
        const feedStats = await getFeedStats();

        // Get watchlist total count
        const watchlistPeople = await getWatchlist();

        // Get analyzed jobs count
        const jobs = await getJobDescriptionAnalyses();

        setCounts({
          feed: feedStats.unreadCount,
          watchlist: watchlistPeople.length,
          jobs: jobs.length,
        });

        console.log('[Uproot] Badge counts updated:', {
          feed: feedStats.unreadCount,
          watchlist: watchlistPeople.length,
          jobs: jobs.length,
        });
      } catch (error) {
        console.error('[Uproot] Failed to fetch badge counts:', error);
      }
    };

    // Initial fetch
    fetchCounts();

    // Listen for Chrome storage changes
    const handleStorageChange = (
      changes: { [key: string]: chrome.storage.StorageChange },
      areaName: string
    ) => {
      if (areaName === 'local') {
        // Check if feed, watchlist, or jobs changed
        if (changes[FEED_STORAGE_KEY] || changes[WATCHLIST_PEOPLE_STORAGE_KEY] || changes[JOB_DESCRIPTIONS_KEY]) {
          fetchCounts();
        }
      }
    };

    chrome.storage.onChanged.addListener(handleStorageChange);

    return () => {
      chrome.storage.onChanged.removeListener(handleStorageChange);
    };
  }, []);

  // Helper to get count for a specific tab
  const getCountForTab = (tabId: TabId): number => {
    switch (tabId) {
      case 'watchlist':
        return counts.watchlist;
      case 'feed':
        return counts.feed;
      case 'jobs':
        return counts.jobs;
      default:
        return 0;
    }
  };

  return {
    counts,
    getCountForTab,
  };
}
