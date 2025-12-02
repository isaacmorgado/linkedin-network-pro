/**
 * Data Migration Utilities
 * Handles migration of old data structures to new formats
 */

import { log, LogCategory } from '../logger';
import type { WatchlistCompany } from '../../types/watchlist';
import type { WorkLocationType } from '../../types/onboarding';
import { WATCHLIST_COMPANIES_STORAGE_KEY } from '../../types/watchlist';

// Version tracking for migrations
const MIGRATION_VERSION_KEY = 'uproot_migration_version';
const CURRENT_MIGRATION_VERSION = 1;

interface OldWatchlistCompany extends Omit<WatchlistCompany, 'jobPreferences'> {
  jobPreferences?: {
    keywords?: string[];
    experienceLevel?: string[];
    remote?: boolean; // Old property
    workLocation?: WorkLocationType[]; // New property
    location?: string[];
  };
}

/**
 * Get current migration version from storage
 */
async function getMigrationVersion(): Promise<number> {
  try {
    const result = await chrome.storage.local.get(MIGRATION_VERSION_KEY);
    return result[MIGRATION_VERSION_KEY] || 0;
  } catch (error) {
    console.error('[Uproot Migration] Error getting migration version:', error);
    return 0;
  }
}

/**
 * Set migration version in storage
 */
async function setMigrationVersion(version: number): Promise<void> {
  try {
    await chrome.storage.local.set({ [MIGRATION_VERSION_KEY]: version });
    console.log(`[Uproot Migration] Set migration version to ${version}`);
  } catch (error) {
    console.error('[Uproot Migration] Error setting migration version:', error);
  }
}

/**
 * Migrate company preferences from remote: boolean to workLocation: WorkLocationType[]
 */
function migrateCompanyPreferences(company: OldWatchlistCompany): WatchlistCompany {
  // If already has workLocation, no migration needed
  if (company.jobPreferences?.workLocation) {
    // Remove old remote property if it exists
    const { remote, ...restPrefs } = company.jobPreferences as any;
    return {
      ...company,
      jobPreferences: restPrefs as WatchlistCompany['jobPreferences'],
    };
  }

  // If has old remote property, migrate it
  if (company.jobPreferences && 'remote' in company.jobPreferences) {
    const { remote, ...restPrefs } = company.jobPreferences;
    const workLocation: WorkLocationType[] = remote ? ['remote'] : [];

    return {
      ...company,
      jobPreferences: {
        ...restPrefs,
        workLocation,
      },
    };
  }

  // No jobPreferences or no migration needed
  return company as WatchlistCompany;
}

/**
 * Migrate all company watchlist entries
 */
async function migrateCompanyWatchlist(): Promise<void> {
  return log.trackAsync(LogCategory.STORAGE, 'migrateCompanyWatchlist', async () => {
    try {
      console.log('[Uproot Migration] Starting company watchlist migration...');

      const result = await chrome.storage.local.get(WATCHLIST_COMPANIES_STORAGE_KEY);
      const companies: OldWatchlistCompany[] = result[WATCHLIST_COMPANIES_STORAGE_KEY] || [];

      if (companies.length === 0) {
        console.log('[Uproot Migration] No companies to migrate');
        return;
      }

      let migrationCount = 0;
      const migratedCompanies: WatchlistCompany[] = companies.map((company) => {
        const hasOldFormat =
          company.jobPreferences &&
          'remote' in company.jobPreferences &&
          !company.jobPreferences.workLocation;

        if (hasOldFormat) {
          migrationCount++;
          console.log(`[Uproot Migration] Migrating company: ${company.name}`);
          return migrateCompanyPreferences(company);
        }

        return company as WatchlistCompany;
      });

      if (migrationCount > 0) {
        await chrome.storage.local.set({ [WATCHLIST_COMPANIES_STORAGE_KEY]: migratedCompanies });
        log.change(LogCategory.STORAGE, 'companyWatchlist', 'migrate', {
          count: migrationCount,
          total: companies.length,
        });
        console.log(`[Uproot Migration] Migrated ${migrationCount} companies successfully`);
      } else {
        console.log('[Uproot Migration] All companies already in new format');
      }
    } catch (error) {
      log.error(LogCategory.STORAGE, 'Company watchlist migration failed', error as Error);
      console.error('[Uproot Migration] Migration failed:', error);
      throw error;
    }
  });
}

/**
 * Run all pending migrations
 */
export async function runMigrations(): Promise<void> {
  try {
    const currentVersion = await getMigrationVersion();
    console.log(`[Uproot Migration] Current version: ${currentVersion}, Target version: ${CURRENT_MIGRATION_VERSION}`);

    if (currentVersion >= CURRENT_MIGRATION_VERSION) {
      console.log('[Uproot Migration] No migrations needed');
      return;
    }

    // Run migrations in order
    if (currentVersion < 1) {
      console.log('[Uproot Migration] Running migration v1: Company preferences structure');
      await migrateCompanyWatchlist();
      await setMigrationVersion(1);
    }

    console.log('[Uproot Migration] All migrations completed successfully');
  } catch (error) {
    console.error('[Uproot Migration] Error running migrations:', error);
    // Don't throw - allow extension to continue even if migration fails
  }
}

/**
 * Force re-run migrations (for debugging)
 */
export async function resetMigrations(): Promise<void> {
  try {
    await chrome.storage.local.remove(MIGRATION_VERSION_KEY);
    console.log('[Uproot Migration] Migration version reset');
  } catch (error) {
    console.error('[Uproot Migration] Error resetting migrations:', error);
  }
}
