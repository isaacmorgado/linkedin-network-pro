/**
 * Watchlist Storage Module
 * Handles storage operations for people watchlist
 * Extracted from storage.ts for better modularity
 */

import { log, LogCategory } from '../logger';
import type { WatchlistPerson } from '../../types/watchlist';
import { isContextInvalidatedError } from './helpers';

// Get watchlist from storage
export async function getWatchlist(): Promise<WatchlistPerson[]> {
  return log.trackAsync(LogCategory.STORAGE, 'getWatchlist', async () => {
    try {
      log.debug(LogCategory.STORAGE, 'Fetching watchlist from storage');
      const result = await chrome.storage.local.get('uproot_watchlist');
      const watchlist = result.uproot_watchlist || [];
      log.info(LogCategory.STORAGE, 'Watchlist retrieved', { count: watchlist.length });
      console.log('[Uproot] Retrieved watchlist:', watchlist.length, 'people');
      return watchlist;
    } catch (error) {
      // Silently handle extension context invalidation during reloads
      if (isContextInvalidatedError(error)) {
        return [];
      }
      // Log other errors normally
      log.error(LogCategory.STORAGE, 'Error getting watchlist', { error });
      console.error('[Uproot] Error getting watchlist:', error);
      return [];
    }
  });
}

// Save watchlist to storage
export async function saveWatchlist(watchlist: WatchlistPerson[]): Promise<void> {
  return log.trackAsync(LogCategory.STORAGE, 'saveWatchlist', async () => {
    try {
      log.debug(LogCategory.STORAGE, 'Saving watchlist to storage', { count: watchlist.length });
      await chrome.storage.local.set({ uproot_watchlist: watchlist });
      log.change(LogCategory.STORAGE, 'watchlist', 'update', { count: watchlist.length });
      console.log('[Uproot] Watchlist saved:', watchlist.length, 'people');
    } catch (error) {
      // Silently handle extension context invalidation during reloads
      if (isContextInvalidatedError(error)) {
        return;
      }
      // Log and throw other errors normally
      log.error(LogCategory.STORAGE, 'Error saving watchlist', error as Error);
      console.error('[Uproot] Error saving watchlist:', error);
      throw error;
    }
  });
}

// Add person to watchlist
export async function addToWatchlist(person: Omit<WatchlistPerson, 'id' | 'addedAt'>): Promise<WatchlistPerson> {
  return log.trackAsync(LogCategory.STORAGE, 'addToWatchlist', async () => {
    log.debug(LogCategory.STORAGE, 'Adding person to watchlist', { name: person.name, profileUrl: person.profileUrl });
    const watchlist = await getWatchlist();

    // Generate ID from profile URL
    const id = person.profileUrl;

    // Check if already in watchlist
    const existingIndex = watchlist.findIndex((p) => p.id === id);
    if (existingIndex !== -1) {
      log.info(LogCategory.STORAGE, 'Person already in watchlist', { name: person.name, id });
      console.log('[Uproot] Person already in watchlist:', person.name);
      return watchlist[existingIndex];
    }

    // Create new watchlist person
    const newPerson: WatchlistPerson = {
      ...person,
      id,
      addedAt: Date.now(),
    };

    // Add to beginning of list
    watchlist.unshift(newPerson);

    await saveWatchlist(watchlist);
    log.change(LogCategory.STORAGE, 'watchlist', 'create', { id: newPerson.id, name: newPerson.name });
    console.log('[Uproot] Added to watchlist:', person.name);

    return newPerson;
  });
}

// Remove person from watchlist
export async function removeFromWatchlist(id: string): Promise<void> {
  return log.trackAsync(LogCategory.STORAGE, 'removeFromWatchlist', async () => {
    log.debug(LogCategory.STORAGE, 'Removing person from watchlist', { id });
    const watchlist = await getWatchlist();
    const filteredWatchlist = watchlist.filter((p) => p.id !== id);

    await saveWatchlist(filteredWatchlist);
    log.change(LogCategory.STORAGE, 'watchlist', 'delete', { id });
    console.log('[Uproot] Removed from watchlist:', id);
  });
}

// Update person in watchlist
export async function updateWatchlistPerson(id: string, updates: Partial<WatchlistPerson>): Promise<void> {
  return log.trackAsync(LogCategory.STORAGE, 'updateWatchlistPerson', async () => {
    log.debug(LogCategory.STORAGE, 'Updating watchlist person', { id, updates });
    const watchlist = await getWatchlist();
    const index = watchlist.findIndex((p) => p.id === id);

    if (index === -1) {
      const error = new Error(`Person not found in watchlist: ${id}`);
      log.error(LogCategory.STORAGE, 'Person not found in watchlist', error);
      throw error;
    }

    watchlist[index] = {
      ...watchlist[index],
      ...updates,
    };

    await saveWatchlist(watchlist);
    log.change(LogCategory.STORAGE, 'watchlist', 'update', { id, updates });
    console.log('[Uproot] Updated watchlist person:', id);
  });
}

// Check if person is in watchlist
export async function isInWatchlist(profileUrl: string): Promise<boolean> {
  return log.trackAsync(LogCategory.STORAGE, 'isInWatchlist', async () => {
    log.debug(LogCategory.STORAGE, 'Checking if person is in watchlist', { profileUrl });
    const watchlist = await getWatchlist();
    const isInList = watchlist.some((p) => p.id === profileUrl);
    log.info(LogCategory.STORAGE, 'Watchlist check complete', { profileUrl, isInList });
    return isInList;
  });
}
