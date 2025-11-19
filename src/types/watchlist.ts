/**
 * Watchlist Type Definitions
 * For saving and tracking LinkedIn profiles and companies
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

export interface WatchlistCompany {
  id: string; // Unique identifier (LinkedIn company URL)
  name: string;
  industry?: string;
  companyUrl: string;
  companyLogo?: string | null;
  addedAt: number; // Timestamp when added
  notes?: string; // User notes about this company
  tags?: string[]; // Custom tags for organization
  jobAlertEnabled: boolean; // Whether to monitor for new jobs
  jobPreferences?: {
    // What types of jobs to watch for at this company
    keywords?: string[]; // Job title keywords (e.g., ["marketing", "manager"])
    experienceLevel?: string[]; // Entry, Mid, Senior, Director, etc.
    remote?: boolean; // Only remote jobs?
    location?: string[]; // Preferred locations
  };
  lastChecked?: number; // Last time we checked for new jobs
  lastViewed?: number; // Last time user viewed this company
}

export interface WatchlistStats {
  totalPeople: number;
  totalCompanies: number;
  addedThisWeek: number;
  addedThisMonth: number;
}

// Storage keys for chrome.storage
export const WATCHLIST_PEOPLE_STORAGE_KEY = 'uproot_watchlist'; // Keep old key for backward compatibility
export const WATCHLIST_COMPANIES_STORAGE_KEY = 'uproot_watchlist_companies';
