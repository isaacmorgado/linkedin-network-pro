/**
 * Watchlist Hook
 * Manages watchlist state and operations
 */

import { useState, useEffect, useCallback } from 'react';
import type { WatchlistPerson } from '../types/watchlist';
import {
  getWatchlist,
  addToWatchlist as addToWatchlistStorage,
  removeFromWatchlist as removeFromWatchlistStorage,
  updateWatchlistPerson as updateWatchlistPersonStorage,
  isInWatchlist as isInWatchlistStorage,
} from '../utils/storage';

export function useWatchlist() {
  const [watchlist, setWatchlist] = useState<WatchlistPerson[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load watchlist from storage
  const loadWatchlist = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getWatchlist();
      setWatchlist(data);
    } catch (error) {
      console.error('[Uproot] Error loading watchlist:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Add person to watchlist
  const addPerson = useCallback(async (person: Omit<WatchlistPerson, 'id' | 'addedAt'>) => {
    try {
      const newPerson = await addToWatchlistStorage(person);
      setWatchlist((prev) => [newPerson, ...prev.filter((p) => p.id !== newPerson.id)]);
      return newPerson;
    } catch (error) {
      console.error('[Uproot] Error adding to watchlist:', error);
      throw error;
    }
  }, []);

  // Remove person from watchlist
  const removePerson = useCallback(async (id: string) => {
    try {
      await removeFromWatchlistStorage(id);
      setWatchlist((prev) => prev.filter((p) => p.id !== id));
    } catch (error) {
      console.error('[Uproot] Error removing from watchlist:', error);
      throw error;
    }
  }, []);

  // Update person in watchlist
  const updatePerson = useCallback(async (id: string, updates: Partial<WatchlistPerson>) => {
    try {
      await updateWatchlistPersonStorage(id, updates);
      setWatchlist((prev) =>
        prev.map((p) => (p.id === id ? { ...p, ...updates } : p))
      );
    } catch (error) {
      console.error('[Uproot] Error updating watchlist person:', error);
      throw error;
    }
  }, []);

  // Check if person is in watchlist
  const isPersonInWatchlist = useCallback(async (profileUrl: string) => {
    return isInWatchlistStorage(profileUrl);
  }, []);

  // Load watchlist on mount
  useEffect(() => {
    loadWatchlist();
  }, [loadWatchlist]);

  // Listen for storage changes from other tabs/contexts
  useEffect(() => {
    const handleStorageChange = (changes: any, areaName: string) => {
      if (areaName === 'local' && changes.uproot_watchlist) {
        setWatchlist(changes.uproot_watchlist.newValue || []);
      }
    };

    chrome.storage.onChanged.addListener(handleStorageChange);
    return () => chrome.storage.onChanged.removeListener(handleStorageChange);
  }, []);

  return {
    watchlist,
    isLoading,
    addPerson,
    removePerson,
    updatePerson,
    isPersonInWatchlist,
    refresh: loadWatchlist,
  };
}
