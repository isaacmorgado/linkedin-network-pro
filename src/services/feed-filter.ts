/**
 * Feed Filter Service
 * Filters job alerts based on user preferences
 */

import type { FeedItem } from '../types/feed';
import type { WatchlistCompany } from '../types/watchlist';

/**
 * Filters job alert feed items based on user preferences
 */
export function filterJobAlertsByPreferences(
  feedItems: FeedItem[],
  companies: WatchlistCompany[],
  globalPreferences?: WatchlistCompany['jobPreferences']
): FeedItem[] {
  return feedItems.filter((item) => {
    // Only filter job alerts
    if (item.type !== 'job_alert') {
      return true;
    }

    // Find the company in watchlist
    const company = companies.find((c) => c.name === item.company);

    // If company not in watchlist or job alerts disabled, exclude
    if (!company || !company.jobAlertEnabled) {
      return false;
    }

    // Use company preferences or fall back to global preferences
    const preferences = company.jobPreferences || globalPreferences;

    // If no preferences set, include all job alerts from this company
    if (!preferences) {
      return true;
    }

    // Match against preferences
    return matchesJobPreferences(item, preferences);
  });
}

/**
 * Checks if a job alert matches the given preferences
 */
export function matchesJobPreferences(
  jobAlert: FeedItem,
  preferences: NonNullable<WatchlistCompany['jobPreferences']>
): boolean {
  // Check keywords (must match at least one if specified)
  if (preferences.keywords && preferences.keywords.length > 0) {
    const titleLower = jobAlert.jobTitle?.toLowerCase() || '';
    const hasKeywordMatch = preferences.keywords.some((keyword) =>
      titleLower.includes(keyword.toLowerCase())
    );

    if (!hasKeywordMatch) {
      return false;
    }
  }

  // Check location (must match at least one if specified)
  if (preferences.location && preferences.location.length > 0) {
    const jobLocation = jobAlert.location?.toLowerCase() || '';
    const hasLocationMatch = preferences.location.some((loc) =>
      jobLocation.includes(loc.toLowerCase())
    );

    if (!hasLocationMatch) {
      return false;
    }
  }

  // Check work location preference
  if (preferences.workLocation && preferences.workLocation.length > 0) {
    const location = jobAlert.location?.toLowerCase() || '';
    const title = jobAlert.jobTitle?.toLowerCase() || '';

    const isRemote = location.includes('remote') || title.includes('remote') || location.includes('work from home');
    const isHybrid = location.includes('hybrid');
    const isOnsite = !isRemote && !isHybrid;

    // Check if job matches any of the preferred work location types
    const matchesWorkLocation = preferences.workLocation.some((type) => {
      if (type === 'remote') return isRemote;
      if (type === 'hybrid') return isHybrid;
      if (type === 'onsite') return isOnsite;
      return false;
    });

    if (!matchesWorkLocation) {
      return false;
    }
  }

  // All checks passed
  return true;
}
