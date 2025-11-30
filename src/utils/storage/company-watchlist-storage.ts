/**
 * Company Watchlist Storage Module
 * Handles storage operations for company watchlist
 */

import { log, LogCategory } from '../logger';
import type { WatchlistCompany } from '../../types/watchlist';
import { WATCHLIST_COMPANIES_STORAGE_KEY } from '../../types/watchlist';
import { useSettingsStore } from '../../stores/settings';
import { isContextInvalidatedError } from './helpers';

// Get company watchlist from storage
export async function getCompanyWatchlist(): Promise<WatchlistCompany[]> {
  return log.trackAsync(LogCategory.STORAGE, 'getCompanyWatchlist', async () => {
    try {
      log.debug(LogCategory.STORAGE, 'Fetching company watchlist from storage');
      const result = await chrome.storage.local.get(WATCHLIST_COMPANIES_STORAGE_KEY);
      const companies = result[WATCHLIST_COMPANIES_STORAGE_KEY] || [];
      log.info(LogCategory.STORAGE, 'Company watchlist retrieved', { count: companies.length });
      console.log('[Uproot] Retrieved company watchlist:', companies.length, 'companies');
      return companies;
    } catch (error) {
      // Silently handle extension context invalidation during reloads
      if (isContextInvalidatedError(error)) {
        return [];
      }
      // Log other errors normally
      log.error(LogCategory.STORAGE, 'Error getting company watchlist', { error });
      console.error('[Uproot] Error getting company watchlist:', error);
      return [];
    }
  });
}

// Save company watchlist to storage
export async function saveCompanyWatchlist(companies: WatchlistCompany[]): Promise<void> {
  return log.trackAsync(LogCategory.STORAGE, 'saveCompanyWatchlist', async () => {
    try {
      log.debug(LogCategory.STORAGE, 'Saving company watchlist to storage', { count: companies.length });
      await chrome.storage.local.set({ [WATCHLIST_COMPANIES_STORAGE_KEY]: companies });
      log.change(LogCategory.STORAGE, 'companyWatchlist', 'update', { count: companies.length });
      console.log('[Uproot] Company watchlist saved:', companies.length, 'companies');
    } catch (error) {
      // Silently handle extension context invalidation during reloads
      if (isContextInvalidatedError(error)) {
        return;
      }
      // Log and throw other errors normally
      log.error(LogCategory.STORAGE, 'Error saving company watchlist', { error, count: companies.length });
      console.error('[Uproot] Error saving company watchlist:', error);
      throw error;
    }
  });
}

// Add company to watchlist
export async function addCompanyToWatchlist(
  company: Omit<WatchlistCompany, 'id' | 'addedAt'>
): Promise<WatchlistCompany> {
  return log.trackAsync(LogCategory.STORAGE, 'addCompanyToWatchlist', async () => {
    log.debug(LogCategory.STORAGE, 'Adding company to watchlist', { name: company.name, companyUrl: company.companyUrl });
    const companies = await getCompanyWatchlist();

    // Generate ID from company URL
    const id = company.companyUrl;

    // Check if already in watchlist
    const existingIndex = companies.findIndex((c) => c.id === id);
    if (existingIndex !== -1) {
      log.info(LogCategory.STORAGE, 'Company already in watchlist', { name: company.name, id });
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
    log.change(LogCategory.STORAGE, 'companyWatchlist', 'create', { id: newCompany.id, name: newCompany.name });
    console.log('[Uproot] Added company to watchlist:', company.name);

    // NEW: Sync to feedPreferences.enabledCompanies if job alerts enabled
    if (newCompany.jobAlertEnabled) {
      try {
        const { feedPreferences, updateFeedPreferences } = useSettingsStore.getState();
        const enabledCompanies = feedPreferences.enabledCompanies || [];

        if (!enabledCompanies.includes(newCompany.id)) {
          await updateFeedPreferences({
            enabledCompanies: [...enabledCompanies, newCompany.id],
          });
          log.info(LogCategory.STORAGE, 'Synced company to feedPreferences.enabledCompanies', { companyId: newCompany.id });
          console.log('[Uproot] Synced company to feedPreferences:', newCompany.name);
        }
      } catch (error) {
        log.error(LogCategory.STORAGE, 'Error syncing to feedPreferences', { error, companyId: newCompany.id });
      }
    }

    return newCompany;
  });
}

// Remove company from watchlist
export async function removeCompanyFromWatchlist(id: string): Promise<void> {
  return log.trackAsync(LogCategory.STORAGE, 'removeCompanyFromWatchlist', async () => {
    log.debug(LogCategory.STORAGE, 'Removing company from watchlist', { id });
    const companies = await getCompanyWatchlist();
    const filteredCompanies = companies.filter((c) => c.id !== id);

    await saveCompanyWatchlist(filteredCompanies);
    log.change(LogCategory.STORAGE, 'companyWatchlist', 'delete', { id });
    console.log('[Uproot] Removed company from watchlist:', id);

    // NEW: Remove from feedPreferences.enabledCompanies
    try {
      const { feedPreferences, updateFeedPreferences } = useSettingsStore.getState();
      const enabledCompanies = feedPreferences.enabledCompanies || [];

      if (enabledCompanies.includes(id)) {
        await updateFeedPreferences({
          enabledCompanies: enabledCompanies.filter((companyId) => companyId !== id),
        });
        log.info(LogCategory.STORAGE, 'Removed company from feedPreferences.enabledCompanies', { companyId: id });
        console.log('[Uproot] Removed company from feedPreferences:', id);
      }
    } catch (error) {
      log.error(LogCategory.STORAGE, 'Error removing from feedPreferences', { error, companyId: id });
    }
  });
}

// Update company in watchlist
export async function updateWatchlistCompany(
  id: string,
  updates: Partial<WatchlistCompany>
): Promise<void> {
  return log.trackAsync(LogCategory.STORAGE, 'updateWatchlistCompany', async () => {
    log.debug(LogCategory.STORAGE, 'Updating watchlist company', { id, updates });
    const companies = await getCompanyWatchlist();
    const index = companies.findIndex((c) => c.id === id);

    if (index === -1) {
      log.error(LogCategory.STORAGE, 'Company not found in watchlist', { id });
      throw new Error('Company not found in watchlist');
    }

    companies[index] = {
      ...companies[index],
      ...updates,
    };
    const updatedCompany = companies[index];

    await saveCompanyWatchlist(companies);
    log.change(LogCategory.STORAGE, 'companyWatchlist', 'update', { id, updates });
    console.log('[Uproot] Updated watchlist company:', id);

    // NEW: Sync jobAlertEnabled changes to feedPreferences.enabledCompanies
    if ('jobAlertEnabled' in updates) {
      try {
        const { feedPreferences, updateFeedPreferences } = useSettingsStore.getState();
        const enabledCompanies = feedPreferences.enabledCompanies || [];

        if (updatedCompany.jobAlertEnabled && !enabledCompanies.includes(id)) {
          // Job alerts enabled → add to enabledCompanies
          await updateFeedPreferences({
            enabledCompanies: [...enabledCompanies, id],
          });
          log.info(LogCategory.STORAGE, 'Added company to feedPreferences.enabledCompanies', { companyId: id });
          console.log('[Uproot] Added company to feedPreferences (alerts enabled):', id);
        } else if (!updatedCompany.jobAlertEnabled && enabledCompanies.includes(id)) {
          // Job alerts disabled → remove from enabledCompanies
          await updateFeedPreferences({
            enabledCompanies: enabledCompanies.filter((companyId) => companyId !== id),
          });
          log.info(LogCategory.STORAGE, 'Removed company from feedPreferences.enabledCompanies', { companyId: id });
          console.log('[Uproot] Removed company from feedPreferences (alerts disabled):', id);
        }
      } catch (error) {
        log.error(LogCategory.STORAGE, 'Error syncing jobAlertEnabled to feedPreferences', { error, companyId: id });
      }
    }
  });
}

// Check if company is in watchlist
export async function isCompanyInWatchlist(companyUrl: string): Promise<boolean> {
  return log.trackAsync(LogCategory.STORAGE, 'isCompanyInWatchlist', async () => {
    log.debug(LogCategory.STORAGE, 'Checking if company is in watchlist', { companyUrl });
    const companies = await getCompanyWatchlist();
    const isInList = companies.some((c) => c.id === companyUrl);
    log.info(LogCategory.STORAGE, 'Company watchlist check complete', { companyUrl, isInList });
    return isInList;
  });
}
