/**
 * Watchlist Type Definitions
 * For saving and tracking LinkedIn profiles
 */

export interface WatchlistPerson {
  id: string; // Unique identifier (LinkedIn profile URL or hash)
  name: string;
  headline: string;
  profileUrl: string;
  profileImage?: string | null;
  addedAt: number; // Timestamp when added
  notes?: string; // User notes about this person
  tags?: string[]; // Custom tags for organization
  lastViewed?: number; // Last time profile was viewed
}

export interface WatchlistStats {
  totalPeople: number;
  addedThisWeek: number;
  addedThisMonth: number;
}

// Storage key for chrome.storage
export const WATCHLIST_STORAGE_KEY = 'uproot_watchlist';
