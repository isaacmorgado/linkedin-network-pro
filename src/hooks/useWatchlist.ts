/**
 * Watchlist Hook
 * Manages watchlist state and operations for both people and companies
 */

import { useState, useEffect, useCallback } from 'react';
import type { WatchlistPerson, WatchlistCompany } from '../types/watchlist';
import {
  getWatchlist,
  addToWatchlist as addToWatchlistStorage,
  removeFromWatchlist as removeFromWatchlistStorage,
  updateWatchlistPerson as updateWatchlistPersonStorage,
  isInWatchlist as isInWatchlistStorage,
  getCompanyWatchlist,
  addCompanyToWatchlist as addCompanyToWatchlistStorage,
  removeCompanyFromWatchlist as removeCompanyFromWatchlistStorage,
  updateWatchlistCompany as updateWatchlistCompanyStorage,
  isCompanyInWatchlist as isCompanyInWatchlistStorage,
} from '../utils/storage';

export function useWatchlist() {
  const [watchlist, setWatchlist] = useState<WatchlistPerson[]>([]);
  const [companyWatchlist, setCompanyWatchlist] = useState<WatchlistCompany[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load watchlists from storage
  const loadWatchlist = useCallback(async () => {
    setIsLoading(true);
    try {
      const [people, companies] = await Promise.all([
        getWatchlist(),
        getCompanyWatchlist(),
      ]);
      setWatchlist(people);
      setCompanyWatchlist(companies);
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

  // Add company to watchlist
  const addCompany = useCallback(async (company: Omit<WatchlistCompany, 'id' | 'addedAt'>) => {
    try {
      const newCompany = await addCompanyToWatchlistStorage(company);
      setCompanyWatchlist((prev) => [newCompany, ...prev.filter((c) => c.id !== newCompany.id)]);
      return newCompany;
    } catch (error) {
      console.error('[Uproot] Error adding company to watchlist:', error);
      throw error;
    }
  }, []);

  // Remove company from watchlist
  const removeCompany = useCallback(async (id: string) => {
    try {
      await removeCompanyFromWatchlistStorage(id);
      setCompanyWatchlist((prev) => prev.filter((c) => c.id !== id));
    } catch (error) {
      console.error('[Uproot] Error removing company from watchlist:', error);
      throw error;
    }
  }, []);

  // Update company in watchlist
  const updateCompany = useCallback(async (id: string, updates: Partial<WatchlistCompany>) => {
    try {
      await updateWatchlistCompanyStorage(id, updates);
      setCompanyWatchlist((prev) =>
        prev.map((c) => (c.id === id ? { ...c, ...updates } : c))
      );
    } catch (error) {
      console.error('[Uproot] Error updating watchlist company:', error);
      throw error;
    }
  }, []);

  // Check if company is in watchlist
  const isCompanyInWatchlist = useCallback(async (companyUrl: string) => {
    return isCompanyInWatchlistStorage(companyUrl);
  }, []);

  // Load watchlist on mount
  useEffect(() => {
    loadWatchlist();
  }, [loadWatchlist]);

  // Listen for storage changes from other tabs/contexts
  useEffect(() => {
    const handleStorageChange = (changes: any, areaName: string) => {
      if (areaName === 'local') {
        if (changes.uproot_watchlist) {
          setWatchlist(changes.uproot_watchlist.newValue || []);
        }
        if (changes.uproot_watchlist_companies) {
          setCompanyWatchlist(changes.uproot_watchlist_companies.newValue || []);
        }
      }
    };

    chrome.storage.onChanged.addListener(handleStorageChange);
    return () => chrome.storage.onChanged.removeListener(handleStorageChange);
  }, []);

  return {
    // People watchlist
    watchlist,
    isLoading,
    addPerson,
    removePerson,
    updatePerson,
    isPersonInWatchlist,
    // Company watchlist
    companyWatchlist,
    addCompany,
    removeCompany,
    updateCompany,
    isCompanyInWatchlist,
    // Common
    refresh: loadWatchlist,
  };
}
