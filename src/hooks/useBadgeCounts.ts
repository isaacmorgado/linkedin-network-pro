/**
 * Badge Counts Hook
 * Tracks notification and watchlist counts for badge display
 */

import { useState, useEffect } from 'react';
import type { TabId } from '../types/navigation';

interface BadgeCounts {
  notifications: number;
  watchlist: number;
  feed: number;
}

export function useBadgeCounts() {
  const [counts, setCounts] = useState<BadgeCounts>({
    notifications: 0,
    watchlist: 0,
    feed: 0,
  });

  useEffect(() => {
    // TODO: Connect to actual data sources (Supabase, IndexedDB, etc.)
    // For now, simulate with mock data

    const fetchCounts = async () => {
      try {
        // Mock implementation - replace with actual API calls
        const mockCounts: BadgeCounts = {
          notifications: 3,  // Unread notifications
          watchlist: 12,     // Total watchlist items
          feed: 5,           // Unread feed items
        };

        setCounts(mockCounts);
      } catch (error) {
        console.error('Failed to fetch badge counts:', error);
      }
    };

    // Initial fetch
    fetchCounts();

    // Refresh every 30 seconds
    const intervalId = setInterval(fetchCounts, 30000);

    // Listen for custom events that might update counts
    const handleCountUpdate = (event: CustomEvent) => {
      const { tabId, count } = event.detail;
      setCounts((prev) => ({
        ...prev,
        [tabId]: count,
      }));
    };

    window.addEventListener('linkedin-extension:badge-update', handleCountUpdate as EventListener);

    return () => {
      clearInterval(intervalId);
      window.removeEventListener('linkedin-extension:badge-update', handleCountUpdate as EventListener);
    };
  }, []);

  // Helper to get count for a specific tab
  const getCountForTab = (tabId: TabId): number => {
    switch (tabId) {
      case 'notifications':
        return counts.notifications;
      case 'watchlist':
        return counts.watchlist;
      case 'feed':
        return counts.feed;
      default:
        return 0;
    }
  };

  return {
    counts,
    getCountForTab,
  };
}
