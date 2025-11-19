/**
 * Chrome Storage Utilities
 * Wrapper around chrome.storage.local for type-safe operations
 */

import type { WatchlistPerson, WATCHLIST_STORAGE_KEY } from '../types/watchlist';

// Get watchlist from storage
export async function getWatchlist(): Promise<WatchlistPerson[]> {
  try {
    const result = await chrome.storage.local.get('uproot_watchlist');
    return result.uproot_watchlist || [];
  } catch (error) {
    console.error('[Uproot] Error getting watchlist:', error);
    return [];
  }
}

// Save watchlist to storage
export async function saveWatchlist(watchlist: WatchlistPerson[]): Promise<void> {
  try {
    await chrome.storage.local.set({ uproot_watchlist: watchlist });
    console.log('[Uproot] Watchlist saved:', watchlist.length, 'people');
  } catch (error) {
    console.error('[Uproot] Error saving watchlist:', error);
    throw error;
  }
}

// Add person to watchlist
export async function addToWatchlist(person: Omit<WatchlistPerson, 'id' | 'addedAt'>): Promise<WatchlistPerson> {
  const watchlist = await getWatchlist();

  // Generate ID from profile URL
  const id = person.profileUrl;

  // Check if already in watchlist
  const existingIndex = watchlist.findIndex((p) => p.id === id);
  if (existingIndex !== -1) {
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
  console.log('[Uproot] Added to watchlist:', person.name);

  return newPerson;
}

// Remove person from watchlist
export async function removeFromWatchlist(id: string): Promise<void> {
  const watchlist = await getWatchlist();
  const filteredWatchlist = watchlist.filter((p) => p.id !== id);

  await saveWatchlist(filteredWatchlist);
  console.log('[Uproot] Removed from watchlist:', id);
}

// Update person in watchlist
export async function updateWatchlistPerson(id: string, updates: Partial<WatchlistPerson>): Promise<void> {
  const watchlist = await getWatchlist();
  const index = watchlist.findIndex((p) => p.id === id);

  if (index === -1) {
    throw new Error('Person not found in watchlist');
  }

  watchlist[index] = {
    ...watchlist[index],
    ...updates,
  };

  await saveWatchlist(watchlist);
  console.log('[Uproot] Updated watchlist person:', id);
}

// Check if person is in watchlist
export async function isInWatchlist(profileUrl: string): Promise<boolean> {
  const watchlist = await getWatchlist();
  return watchlist.some((p) => p.id === profileUrl);
}
