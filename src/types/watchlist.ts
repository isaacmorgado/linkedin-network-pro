/**
 * Watchlist Type Definitions
 * For saving and tracking LinkedIn profiles, companies, and connection paths
 */

export interface ConnectionPath {
  id: string; // Unique identifier (target profile URL)
  targetName: string;
  targetProfileUrl: string;
  targetProfileImage?: string | null;
  targetHeadline?: string;
  path: Array<{
    name: string;
    profileUrl: string;
    profileImage?: string | null;
    degree: number; // 1st, 2nd, 3rd degree
    connected: boolean; // Whether connection has been made
  }>;
  totalSteps: number; // Total connections needed
  completedSteps: number; // How many connections made so far
  isComplete: boolean; // All connections made
  addedAt: number; // Timestamp when saved
  lastUpdated: number; // Last time path was updated
  notes?: string;
}

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
  totalPaths: number;
  totalPeople: number;
  totalCompanies: number;
  addedThisWeek: number;
  addedThisMonth: number;
}

// Storage keys for chrome.storage
export const CONNECTION_PATHS_STORAGE_KEY = 'uproot_connection_paths';
export const WATCHLIST_PEOPLE_STORAGE_KEY = 'uproot_watchlist'; // Keep old key for backward compatibility
export const WATCHLIST_COMPANIES_STORAGE_KEY = 'uproot_watchlist_companies';
