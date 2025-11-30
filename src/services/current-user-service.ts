/**
 * Current User Caching Service
 *
 * Provides cached access to the current LinkedIn user's profile data
 * to avoid repeated scraping of the same information.
 *
 * Features:
 * - 7-day TTL (Time To Live) for cached data
 * - Retry logic (3 attempts) for scraping failures
 * - Automatic refresh when cache is stale
 * - Full logging for all operations
 */

import type { LinkedInProfile } from '@/types';
import { getCurrentLinkedInUser } from '@/utils/linkedin-scraper';
import { log, LogCategory } from '@/utils/logger';

// ============================================================================
// Constants
// ============================================================================

const CACHE_KEY = 'uproot_current_user';
const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds
const MAX_RETRY_ATTEMPTS = 3;
const RETRY_DELAY_MS = 1000; // 1 second between retries

// ============================================================================
// Types
// ============================================================================

interface CachedUserData {
  profile: LinkedInProfile;
  cachedAt: number; // Timestamp in milliseconds
  expiresAt: number; // Timestamp in milliseconds
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Sleep for a specified duration
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Check if cached data is still valid
 */
function isCacheValid(cachedData: CachedUserData | null): boolean {
  if (!cachedData) {
    return false;
  }

  const now = Date.now();
  const isValid = now < cachedData.expiresAt;

  log.debug(
    LogCategory.SERVICE,
    'Cache validity check',
    {
      isValid,
      cachedAt: new Date(cachedData.cachedAt).toISOString(),
      expiresAt: new Date(cachedData.expiresAt).toISOString(),
      ageInDays: ((now - cachedData.cachedAt) / (24 * 60 * 60 * 1000)).toFixed(2),
    }
  );

  return isValid;
}

/**
 * Get current logged-in user profile with retry logic
 * CRITICAL: Gets logged-in user from nav bar, NOT from the page being viewed
 */
async function scrapeCurrentUserWithRetry(attemptNumber = 1): Promise<Partial<LinkedInProfile> | null> {
  log.info(
    LogCategory.SERVICE,
    `Getting current logged-in user profile (attempt ${attemptNumber}/${MAX_RETRY_ATTEMPTS})`
  );

  try {
    // Get logged-in user from LinkedIn nav bar (top right profile menu)
    // This returns the LOGGED-IN user, not the profile page being viewed
    const profileData = getCurrentLinkedInUser();

    if (!profileData || !profileData.profileUrl) {
      throw new Error('Could not detect logged-in user from nav bar');
    }

    // Convert to LinkedInProfile format
    const linkedInProfile: Partial<LinkedInProfile> = {
      id: profileData.profileUrl,
      publicId: profileData.profileUrl.match(/\/in\/([^\/]+)/)?.[1],
      name: profileData.name,
      headline: profileData.headline,
      location: profileData.location,
      avatarUrl: profileData.photoUrl,
      experience: profileData.currentRole?.title ? [{
        company: profileData.currentRole.company || '',
        title: profileData.currentRole.title,
        duration: undefined,
        location: profileData.location
      }] : [],
      education: [],
      skills: [],
      scrapedAt: new Date().toISOString(),
    };

    log.info(
      LogCategory.SERVICE,
      'Successfully detected current logged-in user',
      {
        profileId: linkedInProfile.id,
        name: linkedInProfile.name,
        headline: linkedInProfile.headline,
      }
    );

    return linkedInProfile;
  } catch (error) {
    log.error(
      LogCategory.SERVICE,
      `Failed to scrape current user profile (attempt ${attemptNumber}/${MAX_RETRY_ATTEMPTS})`,
      error as Error,
      { attemptNumber }
    );

    // Retry if we haven't exhausted all attempts
    if (attemptNumber < MAX_RETRY_ATTEMPTS) {
      log.info(
        LogCategory.SERVICE,
        `Retrying in ${RETRY_DELAY_MS}ms...`
      );

      await sleep(RETRY_DELAY_MS);
      return scrapeCurrentUserWithRetry(attemptNumber + 1);
    }

    // All retry attempts exhausted
    log.error(
      LogCategory.SERVICE,
      'All retry attempts exhausted for current user scraping',
      error as Error
    );

    return null;
  }
}

/**
 * Get cached data from storage
 */
async function getCachedData(): Promise<CachedUserData | null> {
  try {
    const result = await chrome.storage.local.get(CACHE_KEY);
    const cachedData = result[CACHE_KEY] as CachedUserData | undefined;

    if (!cachedData) {
      log.debug(LogCategory.STORAGE, 'No cached user data found');
      return null;
    }

    log.debug(
      LogCategory.STORAGE,
      'Retrieved cached user data',
      {
        profileId: cachedData.profile.id,
        name: cachedData.profile.name,
        cachedAt: new Date(cachedData.cachedAt).toISOString(),
      }
    );

    return cachedData;
  } catch (error) {
    log.error(
      LogCategory.STORAGE,
      'Error retrieving cached user data',
      error as Error
    );
    return null;
  }
}

/**
 * Save data to cache
 */
async function saveCachedData(profile: LinkedInProfile): Promise<void> {
  const now = Date.now();
  const cachedData: CachedUserData = {
    profile,
    cachedAt: now,
    expiresAt: now + CACHE_TTL_MS,
  };

  try {
    await chrome.storage.local.set({ [CACHE_KEY]: cachedData });

    log.info(
      LogCategory.STORAGE,
      'Cached current user data',
      {
        profileId: profile.id,
        name: profile.name,
        cachedAt: new Date(cachedData.cachedAt).toISOString(),
        expiresAt: new Date(cachedData.expiresAt).toISOString(),
        ttlDays: (CACHE_TTL_MS / (24 * 60 * 60 * 1000)),
      }
    );
  } catch (error) {
    log.error(
      LogCategory.STORAGE,
      'Error caching user data',
      error as Error
    );
    throw error;
  }
}

// ============================================================================
// Public API
// ============================================================================

/**
 * Get current LinkedIn user profile
 *
 * Returns cached data if available and valid (less than 7 days old).
 * Otherwise, scrapes fresh data from LinkedIn.
 *
 * @returns Current user's LinkedIn profile, or null if scraping fails
 *
 * @example
 * ```typescript
 * const currentUser = await getCurrentUser();
 * if (currentUser) {
 *   console.log(`Logged in as: ${currentUser.name}`);
 * }
 * ```
 */
export async function getCurrentUser(): Promise<LinkedInProfile | null> {
  const timer = log.startTimer(LogCategory.SERVICE, 'getCurrentUser');

  try {
    log.debug(LogCategory.SERVICE, 'Getting current user profile');

    // Check cache first
    const cachedData = await getCachedData();

    if (isCacheValid(cachedData)) {
      log.info(
        LogCategory.SERVICE,
        'Returning cached current user profile',
        {
          profileId: cachedData!.profile.id,
          name: cachedData!.profile.name,
          cacheAge: ((Date.now() - cachedData!.cachedAt) / (60 * 60 * 1000)).toFixed(2) + ' hours',
        }
      );
      timer();
      return cachedData!.profile;
    }

    // Cache is invalid or doesn't exist, scrape fresh data
    log.info(
      LogCategory.SERVICE,
      cachedData ? 'Cache expired, refreshing current user profile' : 'No cache found, fetching current user profile'
    );

    return await refreshCurrentUser();
  } catch (error) {
    log.error(
      LogCategory.SERVICE,
      'Error getting current user',
      error as Error
    );
    timer();
    return null;
  }
}

/**
 * Force refresh current user profile
 *
 * Ignores cached data and scrapes fresh profile information from LinkedIn.
 * Uses retry logic (3 attempts) to handle transient failures.
 *
 * @returns Freshly scraped user profile, or null if all attempts fail
 *
 * @example
 * ```typescript
 * // Force refresh to get latest profile data
 * const freshProfile = await refreshCurrentUser();
 * ```
 */
export async function refreshCurrentUser(): Promise<LinkedInProfile | null> {
  const timer = log.startTimer(LogCategory.SERVICE, 'refreshCurrentUser');

  try {
    log.info(LogCategory.SERVICE, 'Force refreshing current user profile');

    // Scrape fresh data with retry logic
    const profileData = await scrapeCurrentUserWithRetry();

    if (!profileData || !profileData.id) {
      log.warn(
        LogCategory.SERVICE,
        'Failed to scrape current user profile after all retry attempts'
      );
      timer();
      return null;
    }

    // Ensure we have a complete profile object
    const completeProfile: LinkedInProfile = {
      id: profileData.id,
      publicId: profileData.publicId,
      name: profileData.name || 'Unknown User',
      headline: profileData.headline,
      location: profileData.location,
      industry: profileData.industry,
      avatarUrl: profileData.avatarUrl,
      about: profileData.about,
      experience: profileData.experience || [],
      education: profileData.education || [],
      skills: profileData.skills || [],
      connections: profileData.connections,
      mutualConnections: profileData.mutualConnections || [],
      recentPosts: profileData.recentPosts || [],
      certifications: profileData.certifications || [],
      userPosts: profileData.userPosts || [],
      engagedPosts: profileData.engagedPosts || [],
      recentActivity: profileData.recentActivity || [],
      scrapedAt: new Date().toISOString(),
    };

    // Cache the fresh data
    await saveCachedData(completeProfile);

    log.info(
      LogCategory.SERVICE,
      'Successfully refreshed current user profile',
      {
        profileId: completeProfile.id,
        name: completeProfile.name,
      }
    );

    timer();
    return completeProfile;
  } catch (error) {
    log.error(
      LogCategory.SERVICE,
      'Error refreshing current user',
      error as Error
    );
    timer();
    return null;
  }
}

/**
 * Clear cached current user data
 *
 * Removes the cached profile from storage. The next call to getCurrentUser()
 * will scrape fresh data from LinkedIn.
 *
 * @example
 * ```typescript
 * // Clear cache when user logs out
 * await clearCurrentUser();
 * ```
 */
export async function clearCurrentUser(): Promise<void> {
  try {
    log.info(LogCategory.SERVICE, 'Clearing current user cache');

    await chrome.storage.local.remove(CACHE_KEY);

    log.info(LogCategory.SERVICE, 'Successfully cleared current user cache');
  } catch (error) {
    log.error(
      LogCategory.SERVICE,
      'Error clearing current user cache',
      error as Error
    );
    throw error;
  }
}

/**
 * Check if current user cache exists and is valid
 *
 * @returns true if valid cache exists, false otherwise
 *
 * @example
 * ```typescript
 * if (!await isCacheValid()) {
 *   console.log('Cache is stale, will fetch fresh data');
 * }
 * ```
 */
export async function hasValidCache(): Promise<boolean> {
  try {
    const cachedData = await getCachedData();
    return isCacheValid(cachedData);
  } catch (error) {
    log.error(
      LogCategory.SERVICE,
      'Error checking cache validity',
      error as Error
    );
    return false;
  }
}

/**
 * Get cache metadata (useful for debugging)
 *
 * @returns Cache metadata including age and expiration, or null if no cache
 *
 * @example
 * ```typescript
 * const metadata = await getCacheMetadata();
 * if (metadata) {
 *   console.log(`Cache age: ${metadata.ageInHours} hours`);
 * }
 * ```
 */
export async function getCacheMetadata(): Promise<{
  cachedAt: string;
  expiresAt: string;
  ageInHours: number;
  ageInDays: number;
  isValid: boolean;
} | null> {
  try {
    const cachedData = await getCachedData();

    if (!cachedData) {
      return null;
    }

    const now = Date.now();
    const ageMs = now - cachedData.cachedAt;

    return {
      cachedAt: new Date(cachedData.cachedAt).toISOString(),
      expiresAt: new Date(cachedData.expiresAt).toISOString(),
      ageInHours: ageMs / (60 * 60 * 1000),
      ageInDays: ageMs / (24 * 60 * 60 * 1000),
      isValid: isCacheValid(cachedData),
    };
  } catch (error) {
    log.error(
      LogCategory.SERVICE,
      'Error getting cache metadata',
      error as Error
    );
    return null;
  }
}
