/**
 * Chrome Storage Utilities
 * Wrapper around chrome.storage.local for type-safe operations
 */

import type { WatchlistPerson, WatchlistCompany, ConnectionPath } from '../types/watchlist';
import {
  CONNECTION_PATHS_STORAGE_KEY,
  WATCHLIST_PEOPLE_STORAGE_KEY,
  WATCHLIST_COMPANIES_STORAGE_KEY
} from '../types/watchlist';

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

// ============================================================================
// COMPANY WATCHLIST FUNCTIONS
// ============================================================================

// Get company watchlist from storage
export async function getCompanyWatchlist(): Promise<WatchlistCompany[]> {
  try {
    const result = await chrome.storage.local.get(WATCHLIST_COMPANIES_STORAGE_KEY);
    return result[WATCHLIST_COMPANIES_STORAGE_KEY] || [];
  } catch (error) {
    console.error('[Uproot] Error getting company watchlist:', error);
    return [];
  }
}

// Save company watchlist to storage
export async function saveCompanyWatchlist(companies: WatchlistCompany[]): Promise<void> {
  try {
    await chrome.storage.local.set({ [WATCHLIST_COMPANIES_STORAGE_KEY]: companies });
    console.log('[Uproot] Company watchlist saved:', companies.length, 'companies');
  } catch (error) {
    console.error('[Uproot] Error saving company watchlist:', error);
    throw error;
  }
}

// Add company to watchlist
export async function addCompanyToWatchlist(
  company: Omit<WatchlistCompany, 'id' | 'addedAt'>
): Promise<WatchlistCompany> {
  const companies = await getCompanyWatchlist();

  // Generate ID from company URL
  const id = company.companyUrl;

  // Check if already in watchlist
  const existingIndex = companies.findIndex((c) => c.id === id);
  if (existingIndex !== -1) {
    console.log('[Uproot] Company already in watchlist:', company.name);
    return companies[existingIndex];
  }

  // Create new watchlist company
  const newCompany: WatchlistCompany = {
    ...company,
    id,
    addedAt: Date.now(),
    jobAlertEnabled: company.jobAlertEnabled ?? false,
  };

  // Add to beginning of list
  companies.unshift(newCompany);

  await saveCompanyWatchlist(companies);
  console.log('[Uproot] Added company to watchlist:', company.name);

  return newCompany;
}

// Remove company from watchlist
export async function removeCompanyFromWatchlist(id: string): Promise<void> {
  const companies = await getCompanyWatchlist();
  const filteredCompanies = companies.filter((c) => c.id !== id);

  await saveCompanyWatchlist(filteredCompanies);
  console.log('[Uproot] Removed company from watchlist:', id);
}

// Update company in watchlist
export async function updateWatchlistCompany(
  id: string,
  updates: Partial<WatchlistCompany>
): Promise<void> {
  const companies = await getCompanyWatchlist();
  const index = companies.findIndex((c) => c.id === id);

  if (index === -1) {
    throw new Error('Company not found in watchlist');
  }

  companies[index] = {
    ...companies[index],
    ...updates,
  };

  await saveCompanyWatchlist(companies);
  console.log('[Uproot] Updated watchlist company:', id);
}

// Check if company is in watchlist
export async function isCompanyInWatchlist(companyUrl: string): Promise<boolean> {
  const companies = await getCompanyWatchlist();
  return companies.some((c) => c.id === companyUrl);
}

// ============================================================================
// CONNECTION PATH FUNCTIONS
// ============================================================================

// Get connection paths from storage
export async function getConnectionPaths(): Promise<ConnectionPath[]> {
  try {
    const result = await chrome.storage.local.get(CONNECTION_PATHS_STORAGE_KEY);
    return result[CONNECTION_PATHS_STORAGE_KEY] || [];
  } catch (error) {
    console.error('[Uproot] Error getting connection paths:', error);
    return [];
  }
}

// Save connection paths to storage
export async function saveConnectionPaths(paths: ConnectionPath[]): Promise<void> {
  try {
    await chrome.storage.local.set({ [CONNECTION_PATHS_STORAGE_KEY]: paths });
    console.log('[Uproot] Connection paths saved:', paths.length, 'paths');
  } catch (error) {
    console.error('[Uproot] Error saving connection paths:', error);
    throw error;
  }
}

// Add connection path
export async function addConnectionPath(
  path: Omit<ConnectionPath, 'id' | 'addedAt' | 'lastUpdated'>
): Promise<ConnectionPath> {
  const paths = await getConnectionPaths();

  // Generate ID from target profile URL
  const id = path.targetProfileUrl;

  // Check if already exists
  const existingIndex = paths.findIndex((p) => p.id === id);
  if (existingIndex !== -1) {
    console.log('[Uproot] Connection path already exists:', path.targetName);
    return paths[existingIndex];
  }

  // Create new connection path
  const newPath: ConnectionPath = {
    ...path,
    id,
    addedAt: Date.now(),
    lastUpdated: Date.now(),
  };

  // Add to beginning of list
  paths.unshift(newPath);

  await saveConnectionPaths(paths);
  console.log('[Uproot] Added connection path:', path.targetName);

  return newPath;
}

// Remove connection path
export async function removeConnectionPath(id: string): Promise<void> {
  const paths = await getConnectionPaths();
  const filteredPaths = paths.filter((p) => p.id !== id);

  await saveConnectionPaths(filteredPaths);
  console.log('[Uproot] Removed connection path:', id);
}

// Update connection path
export async function updateConnectionPath(
  id: string,
  updates: Partial<ConnectionPath>
): Promise<void> {
  const paths = await getConnectionPaths();
  const index = paths.findIndex((p) => p.id === id);

  if (index === -1) {
    throw new Error('Connection path not found');
  }

  paths[index] = {
    ...paths[index],
    ...updates,
    lastUpdated: Date.now(),
  };

  await saveConnectionPaths(paths);
  console.log('[Uproot] Updated connection path:', id);
}

// Mark step as connected in a path
export async function markStepConnected(pathId: string, stepIndex: number): Promise<void> {
  const paths = await getConnectionPaths();
  const pathIndex = paths.findIndex((p) => p.id === pathId);

  if (pathIndex === -1) {
    throw new Error('Connection path not found');
  }

  const path = paths[pathIndex];
  
  if (stepIndex < 0 || stepIndex >= path.path.length) {
    throw new Error('Invalid step index');
  }

  // Mark step as connected
  path.path[stepIndex].connected = true;

  // Update completed steps count
  path.completedSteps = path.path.filter((step) => step.connected).length;

  // Check if path is complete
  path.isComplete = path.completedSteps === path.totalSteps;
  path.lastUpdated = Date.now();

  await saveConnectionPaths(paths);
  console.log('[Uproot] Marked step as connected:', pathId, stepIndex);
}

// Check if connection path exists
export async function isConnectionPathSaved(targetProfileUrl: string): Promise<boolean> {
  const paths = await getConnectionPaths();
  return paths.some((p) => p.id === targetProfileUrl);
}
