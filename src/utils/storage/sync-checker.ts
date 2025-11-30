/**
 * Storage Sync Checker Utility
 * Checks synchronization status between storage systems:
 * - onboarding_state (job preferences)
 * - feed_preferences (feed filtering)
 * - uproot_watchlist_companies (watchlist)
 */

import { useSettingsStore } from '../../stores/settings';
import { getCompanyWatchlist } from './company-watchlist-storage';

export interface SyncStatus {
  isSynced: boolean;
  lastChecked: number;
  issues: string[];
}

export interface AllSyncStatus {
  jobPreferences: SyncStatus;
  watchlistCompanies: SyncStatus;
  overall: 'synced' | 'out-of-sync' | 'unknown';
}

/**
 * Check if job preferences are synced between onboarding_state and feed_preferences
 */
export async function checkJobPreferencesSync(): Promise<SyncStatus> {
  const issues: string[] = [];

  try {
    // Get job preferences from onboarding_state
    const onboardingResult = await chrome.storage.local.get('onboarding_state');
    const onboardingPrefs = onboardingResult.onboarding_state?.preferences;

    // Get feed preferences from app_settings
    const { feedPreferences } = useSettingsStore.getState();

    if (!onboardingPrefs) {
      issues.push('No job preferences found in onboarding state');
      return { isSynced: false, lastChecked: Date.now(), issues };
    }

    // Check if keywords match
    const onboardingKeywords = onboardingPrefs.jobTitles || [];
    const feedKeywords = feedPreferences.globalFilters?.keywords || [];

    if (!arraysMatch(onboardingKeywords, feedKeywords)) {
      issues.push('Job titles/keywords are out of sync');
    }

    // Check if experience levels match
    const onboardingExp = onboardingPrefs.experienceLevel || [];
    const feedExp = feedPreferences.globalFilters?.experienceLevel || [];

    if (!arraysMatch(onboardingExp, feedExp)) {
      issues.push('Experience levels are out of sync');
    }

    // Check if remote preference matches
    const onboardingRemote = onboardingPrefs.workLocation?.includes('remote');
    const feedRemote = feedPreferences.globalFilters?.remote;

    if (onboardingRemote !== feedRemote) {
      issues.push('Remote preference is out of sync');
    }

    // Check if locations match
    const onboardingLocs = onboardingPrefs.locations || [];
    const feedLocs = feedPreferences.globalFilters?.locations || [];

    if (!arraysMatch(onboardingLocs, feedLocs)) {
      issues.push('Locations are out of sync');
    }

    return {
      isSynced: issues.length === 0,
      lastChecked: Date.now(),
      issues,
    };
  } catch (error) {
    console.error('[SyncChecker] Error checking job preferences sync:', error);
    return {
      isSynced: false,
      lastChecked: Date.now(),
      issues: ['Error checking sync status'],
    };
  }
}

/**
 * Check if watchlist companies are synced with enabled companies
 */
export async function checkWatchlistSync(): Promise<SyncStatus> {
  const issues: string[] = [];

  try {
    // Get watchlist companies
    const watchlistCompanies = await getCompanyWatchlist();
    const enabledWatchlistIds = watchlistCompanies
      .filter(c => c.jobAlertEnabled)
      .map(c => c.id);

    // Get enabled companies from feed preferences
    const { feedPreferences } = useSettingsStore.getState();
    const enabledCompanies = feedPreferences.enabledCompanies || [];

    // Check if arrays match
    if (!arraysMatch(enabledWatchlistIds, enabledCompanies)) {
      const missing = enabledWatchlistIds.filter(id => !enabledCompanies.includes(id));
      const extra = enabledCompanies.filter(id => !enabledWatchlistIds.includes(id));

      if (missing.length > 0) {
        issues.push(`${missing.length} watchlist companies missing from enabled companies`);
      }
      if (extra.length > 0) {
        issues.push(`${extra.length} extra companies in enabled list`);
      }
    }

    return {
      isSynced: issues.length === 0,
      lastChecked: Date.now(),
      issues,
    };
  } catch (error) {
    console.error('[SyncChecker] Error checking watchlist sync:', error);
    return {
      isSynced: false,
      lastChecked: Date.now(),
      issues: ['Error checking sync status'],
    };
  }
}

/**
 * Check overall sync status
 */
export async function checkAllSync(): Promise<AllSyncStatus> {
  const jobPreferences = await checkJobPreferencesSync();
  const watchlistCompanies = await checkWatchlistSync();

  const overall = jobPreferences.isSynced && watchlistCompanies.isSynced
    ? 'synced'
    : 'out-of-sync';

  return {
    jobPreferences,
    watchlistCompanies,
    overall,
  };
}

/**
 * Manually trigger re-sync of all storage systems
 */
export async function manualSync(): Promise<void> {
  console.log('[SyncChecker] Manual sync triggered');

  try {
    // 1. Sync job preferences
    const onboardingResult = await chrome.storage.local.get('onboarding_state');
    const preferences = onboardingResult.onboarding_state?.preferences;

    if (preferences) {
      const { updateFeedPreferences } = useSettingsStore.getState();
      await updateFeedPreferences({
        globalFilters: {
          keywords: preferences.jobTitles || [],
          experienceLevel: preferences.experienceLevel || [],
          remote: preferences.workLocation?.includes('remote'),
          locations: preferences.locations || [],
        },
      });
      console.log('[SyncChecker] Job preferences synced');
    }

    // 2. Sync watchlist companies
    const watchlistCompanies = await getCompanyWatchlist();
    const enabledCompanyIds = watchlistCompanies
      .filter(c => c.jobAlertEnabled)
      .map(c => c.id);

    const { updateFeedPreferences } = useSettingsStore.getState();
    await updateFeedPreferences({
      enabledCompanies: enabledCompanyIds,
    });
    console.log('[SyncChecker] Watchlist companies synced');

    console.log('[SyncChecker] Manual sync complete');
  } catch (error) {
    console.error('[SyncChecker] Error during manual sync:', error);
    throw error;
  }
}

// Helper: Compare arrays (order-independent)
function arraysMatch<T>(arr1: T[], arr2: T[]): boolean {
  if (arr1.length !== arr2.length) return false;
  const sorted1 = [...arr1].sort();
  const sorted2 = [...arr2].sort();
  return sorted1.every((val, idx) => val === sorted2[idx]);
}
