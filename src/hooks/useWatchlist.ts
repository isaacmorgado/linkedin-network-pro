/**
 * Watchlist Hook
 * Manages watchlist state and operations for people, companies, and connection paths
 */

import { useState, useEffect, useCallback } from 'react';
import type { WatchlistPerson, WatchlistCompany, ConnectionPath } from '../types/watchlist';
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
  getConnectionPaths,
  addConnectionPath as addConnectionPathStorage,
  removeConnectionPath as removeConnectionPathStorage,
  updateConnectionPath as updateConnectionPathStorage,
  markStepConnected as markStepConnectedStorage,
  isConnectionPathSaved as isConnectionPathSavedStorage,
} from '../utils/storage';

export function useWatchlist() {
  const [watchlist, setWatchlist] = useState<WatchlistPerson[]>([]);
  const [companyWatchlist, setCompanyWatchlist] = useState<WatchlistCompany[]>([]);
  const [connectionPaths, setConnectionPaths] = useState<ConnectionPath[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load watchlists from storage
  const loadWatchlist = useCallback(async () => {
    setIsLoading(true);
    try {
      const [paths, people, companies] = await Promise.all([
        getConnectionPaths(),
        getWatchlist(),
        getCompanyWatchlist(),
      ]);
      setConnectionPaths(paths);
      setWatchlist(people);
      setCompanyWatchlist(companies);
    } catch (error) {
      console.error('[Uproot] Error loading watchlist:', error instanceof Error ? error.message : String(error), error);
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
      console.error('[Uproot] Error adding to watchlist:', error instanceof Error ? error.message : String(error), error);
      throw error;
    }
  }, []);

  // Remove person from watchlist
  const removePerson = useCallback(async (id: string) => {
    try {
      await removeFromWatchlistStorage(id);
      setWatchlist((prev) => prev.filter((p) => p.id !== id));
    } catch (error) {
      console.error('[Uproot] Error removing from watchlist:', error instanceof Error ? error.message : String(error), error);
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
      console.error('[Uproot] Error updating watchlist person:', error instanceof Error ? error.message : String(error), error);
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
      console.error('[Uproot] Error adding company to watchlist:', error instanceof Error ? error.message : String(error), error);
      throw error;
    }
  }, []);

  // Remove company from watchlist
  const removeCompany = useCallback(async (id: string) => {
    try {
      await removeCompanyFromWatchlistStorage(id);
      setCompanyWatchlist((prev) => prev.filter((c) => c.id !== id));
    } catch (error) {
      console.error('[Uproot] Error removing company from watchlist:', error instanceof Error ? error.message : String(error), error);
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
      console.error('[Uproot] Error updating watchlist company:', error instanceof Error ? error.message : String(error), error);
      throw error;
    }
  }, []);

  // Check if company is in watchlist
  const isCompanyInWatchlist = useCallback(async (companyUrl: string) => {
    return isCompanyInWatchlistStorage(companyUrl);
  }, []);

  // Add connection path
  const addPath = useCallback(async (path: Omit<ConnectionPath, 'id' | 'addedAt' | 'lastUpdated'>) => {
    try {
      const newPath = await addConnectionPathStorage(path);
      setConnectionPaths((prev) => [newPath, ...prev.filter((p) => p.id !== newPath.id)]);
      return newPath;
    } catch (error) {
      console.error('[Uproot] Error adding connection path:', error instanceof Error ? error.message : String(error), error);
      throw error;
    }
  }, []);

  // Remove connection path
  const removePath = useCallback(async (id: string) => {
    try {
      await removeConnectionPathStorage(id);
      setConnectionPaths((prev) => prev.filter((p) => p.id !== id));
    } catch (error) {
      console.error('[Uproot] Error removing connection path:', error instanceof Error ? error.message : String(error), error);
      throw error;
    }
  }, []);

  // Update connection path
  const updatePath = useCallback(async (id: string, updates: Partial<ConnectionPath>) => {
    try {
      await updateConnectionPathStorage(id, updates);
      setConnectionPaths((prev) =>
        prev.map((p) => (p.id === id ? { ...p, ...updates, lastUpdated: Date.now() } : p))
      );
    } catch (error) {
      console.error('[Uproot] Error updating connection path:', error instanceof Error ? error.message : String(error), error);
      throw error;
    }
  }, []);

  // Mark step as connected
  const markStepConnected = useCallback(async (pathId: string, stepIndex: number) => {
    try {
      await markStepConnectedStorage(pathId, stepIndex);
      // Reload to get updated path
      await loadWatchlist();
    } catch (error) {
      console.error('[Uproot] Error marking step as connected:', error instanceof Error ? error.message : String(error), error);
      throw error;
    }
  }, [loadWatchlist]);

  // Check if connection path is saved
  const isPathSaved = useCallback(async (targetProfileUrl: string) => {
    return isConnectionPathSavedStorage(targetProfileUrl);
  }, []);

  // Load watchlist on mount
  useEffect(() => {
    loadWatchlist();
  }, [loadWatchlist]);

  // Listen for storage changes from other tabs/contexts
  useEffect(() => {
    const handleStorageChange = (changes: any, areaName: string) => {
      if (areaName === 'local') {
        if (changes.uproot_connection_paths) {
          setConnectionPaths(changes.uproot_connection_paths.newValue || []);
        }
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
    // Connection paths
    connectionPaths,
    addPath,
    removePath,
    updatePath,
    markStepConnected,
    isPathSaved,
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
