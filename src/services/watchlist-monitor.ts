/**
 * Watchlist Monitoring Service
 * Monitors watchlist items for changes and generates feed items
 */

import type {
  JobSnapshot,
  PersonSnapshot,
  CompanySnapshot,
  LinkedInJob,
  LinkedInCompanyUpdate,
  JobMatchCriteria,
  LinkedInPersonProfile,
} from '../types/monitoring';
import type { WatchlistCompany, WatchlistPerson } from '../types/watchlist';
import type { JobPreferences } from '../types/onboarding';
import type { FeedItem } from '../types/feed';
import type { LinkedInProfile } from '../types';
import {
  JOB_SNAPSHOTS_KEY,
  PERSON_SNAPSHOTS_KEY,
  COMPANY_SNAPSHOTS_KEY,
} from '../types/monitoring';
import {
  scrapeCompanyJobs,
  scrapePersonProfile,
  scrapeCompanyUpdates,
  getCompanyIdFromUrl,
  getProfileUsernameFromUrl,
} from '../utils/linkedin-scraper';
import { filterMatchingJobs } from './job-matcher';
import { addFeedItem } from '../utils/storage';
import { log, LogCategory } from '../utils/logger';
import { detectPersonInsights } from './person-insights';
import {
  detectHiringHeat,
  generateHiringHeatFeedItem,
} from './hiring-heat-detector';

// ============================================================================
// TYPE CONVERTERS
// ============================================================================

/**
 * Convert LinkedInPersonProfile to LinkedInProfile
 */
function convertPersonProfileToLinkedInProfile(profile: LinkedInPersonProfile): LinkedInProfile {
  return {
    id: profile.profileUrl,
    profileUrl: profile.profileUrl,
    name: profile.name,
    headline: profile.headline,
    location: profile.location,
    photoUrl: profile.photoUrl,
    avatarUrl: profile.photoUrl,
    currentRole: profile.currentRole,
    experience: profile.currentRole ? [{
      company: profile.currentRole.company,
      title: profile.currentRole.title,
      location: profile.location,
    }] : [],
    education: [],
    certifications: [],
    skills: [],
    connections: 0,
    mutualConnections: [],
    recentPosts: [],
    userPosts: [],
    engagedPosts: [],
    recentActivity: (profile.recentActivity || []).map(activity => ({
      preview: activity.preview,
      timestamp: new Date(activity.timestamp).toISOString(),
      type: activity.type,
      url: activity.url,
    })),
    scrapedAt: new Date().toISOString(),
  };
}

// ============================================================================
// SNAPSHOT STORAGE
// ============================================================================

/**
 * Get job snapshots from storage
 */
async function getJobSnapshots(): Promise<Map<string, JobSnapshot>> {
  try {
    const result = await chrome.storage.local.get(JOB_SNAPSHOTS_KEY);
    const snapshots = result[JOB_SNAPSHOTS_KEY] || [];
    return new Map(snapshots.map((s: JobSnapshot) => [s.companyId, s]));
  } catch (error) {
    console.error('[Uproot] Error getting job snapshots:', error);
    return new Map();
  }
}

/**
 * Save job snapshots to storage
 */
async function saveJobSnapshots(snapshots: Map<string, JobSnapshot>): Promise<void> {
  try {
    const snapshotsArray = Array.from(snapshots.values());
    await chrome.storage.local.set({ [JOB_SNAPSHOTS_KEY]: snapshotsArray });
    console.log(`[Uproot] Saved ${snapshotsArray.length} job snapshots`);
  } catch (error) {
    console.error('[Uproot] Error saving job snapshots:', error);
  }
}

/**
 * Get person snapshots from storage
 */
async function getPersonSnapshots(): Promise<Map<string, PersonSnapshot>> {
  try {
    const result = await chrome.storage.local.get(PERSON_SNAPSHOTS_KEY);
    const snapshots = result[PERSON_SNAPSHOTS_KEY] || [];
    return new Map(snapshots.map((s: PersonSnapshot) => [s.personId, s]));
  } catch (error) {
    console.error('[Uproot] Error getting person snapshots:', error);
    return new Map();
  }
}

/**
 * Save person snapshots to storage
 */
async function savePersonSnapshots(snapshots: Map<string, PersonSnapshot>): Promise<void> {
  try {
    const snapshotsArray = Array.from(snapshots.values());
    await chrome.storage.local.set({ [PERSON_SNAPSHOTS_KEY]: snapshotsArray });
    console.log(`[Uproot] Saved ${snapshotsArray.length} person snapshots`);
  } catch (error) {
    console.error('[Uproot] Error saving person snapshots:', error);
  }
}

/**
 * Get company snapshots from storage
 */
async function getCompanySnapshots(): Promise<Map<string, CompanySnapshot>> {
  try {
    const result = await chrome.storage.local.get(COMPANY_SNAPSHOTS_KEY);
    const snapshots = result[COMPANY_SNAPSHOTS_KEY] || [];
    return new Map(snapshots.map((s: CompanySnapshot) => [s.companyId, s]));
  } catch (error) {
    console.error('[Uproot] Error getting company snapshots:', error);
    return new Map();
  }
}

/**
 * Save company snapshots to storage
 */
async function saveCompanySnapshots(snapshots: Map<string, CompanySnapshot>): Promise<void> {
  try {
    const snapshotsArray = Array.from(snapshots.values());
    await chrome.storage.local.set({ [COMPANY_SNAPSHOTS_KEY]: snapshotsArray });
    console.log(`[Uproot] Saved ${snapshotsArray.length} company snapshots`);
  } catch (error) {
    console.error('[Uproot] Error saving company snapshots:', error);
  }
}

// ============================================================================
// JOB MONITORING
// ============================================================================

/**
 * Check a company for new job postings
 * Returns array of new jobs that match user preferences
 */
export async function checkCompanyJobs(
  company: WatchlistCompany,
  preferences: JobPreferences
): Promise<LinkedInJob[]> {
  return log.trackAsync(LogCategory.SERVICE, 'checkCompanyJobs', async () => {
    console.log(`[Uproot] Checking jobs for ${company.name}...`);
    log.debug(LogCategory.SERVICE, 'Starting job check for company', {
      companyId: company.id,
      companyName: company.name,
      jobAlertEnabled: company.jobAlertEnabled,
    });

    try {
      // Get current jobs from page (must be run in content script context)
      log.debug(LogCategory.SERVICE, 'Scraping company jobs from page');
      const currentJobs = scrapeCompanyJobs(company.companyUrl);

      if (currentJobs.length === 0) {
        console.log(`[Uproot] No jobs found for ${company.name}`);
        log.warn(LogCategory.SERVICE, 'No jobs found for company', { companyName: company.name });
        return [];
      }

      log.info(LogCategory.SERVICE, `Scraped ${currentJobs.length} current jobs`);

      // Get previous snapshot
      log.debug(LogCategory.SERVICE, 'Retrieving previous job snapshot');
      const snapshots = await getJobSnapshots();
      const previousSnapshot = snapshots.get(company.id);

      // Detect new jobs
      log.debug(LogCategory.SERVICE, 'Detecting new jobs');
      const newJobs = detectNewJobs(currentJobs, previousSnapshot);

      console.log(`[Uproot] Found ${newJobs.length} new jobs for ${company.name}`);
      log.info(LogCategory.SERVICE, `Detected ${newJobs.length} new jobs`, {
        companyName: company.name,
        totalJobs: currentJobs.length,
        newJobs: newJobs.length,
      });

      // Update snapshot
      log.debug(LogCategory.SERVICE, 'Updating job snapshot');
      snapshots.set(company.id, {
        companyId: company.id,
        lastChecked: Date.now(),
        jobs: currentJobs,
      });
      await saveJobSnapshots(snapshots);

      // Filter by user preferences
      log.debug(LogCategory.SERVICE, 'Filtering jobs by user preferences');
      const matchCriteria: JobMatchCriteria = {
        jobTitles: preferences.jobTitles,
        experienceLevel: preferences.experienceLevel,
        workLocation: preferences.workLocation,
        locations: preferences.locations,
        industries: preferences.industries,
      };

      const matchingJobs = filterMatchingJobs(newJobs, matchCriteria, 50);

      console.log(`[Uproot] ${matchingJobs.length} jobs match user preferences`);
      log.info(LogCategory.SERVICE, 'Jobs filtered by preferences', {
        newJobs: newJobs.length,
        matchingJobs: matchingJobs.length,
        minScore: 50,
      });

      // Generate feed items for matching jobs
      log.debug(LogCategory.SERVICE, 'Generating feed items for matching jobs');
      for (const { job, match } of matchingJobs) {
        await generateJobAlertFeedItem(job, company, match.score, match.reasons);
      }
      log.info(LogCategory.SERVICE, `Created ${matchingJobs.length} job alert feed items`);

      // Detect hiring heat (V1)
      try {
        log.debug(LogCategory.SERVICE, 'Detecting hiring heat for company');
        const hiringHeat = detectHiringHeat(currentJobs, previousSnapshot, company);
        if (hiringHeat) {
          log.info(LogCategory.SERVICE, 'Hiring heat detected, generating feed item');
          await generateHiringHeatFeedItem(hiringHeat);
        }
      } catch (error) {
        // Log error but don't break job alerts
        log.error(LogCategory.SERVICE, 'Error detecting hiring heat', error as Error, {
          companyName: company.name,
        });
        console.error('[Uproot] Error detecting hiring heat:', error);
      }

      return matchingJobs.map((m) => m.job);
    } catch (error) {
      console.error(`[Uproot] Error checking jobs for ${company.name}:`, error);
      log.error(LogCategory.SERVICE, 'Job check failed', error as Error, {
        companyId: company.id,
        companyName: company.name,
      });
      return [];
    }
  });
}

/**
 * Detect new jobs by comparing with previous snapshot
 */
function detectNewJobs(
  currentJobs: LinkedInJob[],
  previousSnapshot?: JobSnapshot
): LinkedInJob[] {
  if (!previousSnapshot) {
    // First time checking, treat all as new
    return currentJobs;
  }

  const previousJobIds = new Set(previousSnapshot.jobs.map((j) => j.id));
  return currentJobs.filter((job) => !previousJobIds.has(job.id));
}

/**
 * Generate a feed item for a new job alert
 */
async function generateJobAlertFeedItem(
  job: LinkedInJob,
  company: WatchlistCompany,
  matchScore: number,
  _reasons: string[]
): Promise<void> {
  try {
    const feedItem: Omit<FeedItem, 'id'> = {
      type: 'job_alert',
      timestamp: Date.now(),
      read: false,
      title: 'New Job Match',
      description: job.title,
      company: company.name,
      companyLogo: company.companyLogo ?? undefined,
      location: job.location,
      jobUrl: job.jobUrl,
      matchScore,
      actionUrl: job.jobUrl,
      actionLabel: job.isEasyApply ? 'Easy Apply' : 'View Job',
      jobTitle: job.title,
    };

    await addFeedItem(feedItem);

    console.log(`[Uproot] Created feed item for job: ${job.title} at ${company.name} (${matchScore}% match)`);
  } catch (error) {
    console.error('[Uproot] Error generating job alert feed item:', error);
  }
}

// ============================================================================
// PERSON MONITORING
// ============================================================================

/**
 * Check a person for profile updates (job changes, promotions)
 */
export async function checkPersonProfile(person: WatchlistPerson): Promise<void> {
  return log.trackAsync(LogCategory.SERVICE, 'checkPersonProfile', async () => {
    console.log(`[Uproot] Checking profile for ${person.name}...`);
    log.debug(LogCategory.SERVICE, 'Starting profile check', {
      personId: person.id,
      personName: person.name,
    });

    try {
      // Get current profile from page
      log.debug(LogCategory.SERVICE, 'Scraping person profile from page');
      const currentProfile = scrapePersonProfile();

      if (!currentProfile) {
        console.log(`[Uproot] Could not scrape profile for ${person.name}`);
        log.warn(LogCategory.SERVICE, 'Failed to scrape profile', { personName: person.name });
        return;
      }

      log.info(LogCategory.SERVICE, 'Profile scraped successfully', {
        personName: currentProfile.name,
        currentRole: currentProfile.currentRole.title,
        currentCompany: currentProfile.currentRole.company,
      });

      // Get previous snapshot
      log.debug(LogCategory.SERVICE, 'Retrieving previous profile snapshot');
      const snapshots = await getPersonSnapshots();
      const previousSnapshot = snapshots.get(person.id);

      // Convert profiles to LinkedInProfile format
      const currentLinkedInProfile = convertPersonProfileToLinkedInProfile(currentProfile);
      const previousLinkedInProfile = previousSnapshot?.profile
        ? convertPersonProfileToLinkedInProfile(previousSnapshot.profile)
        : undefined;

      // Detect opportunity-relevant insights
      log.debug(LogCategory.SERVICE, 'Detecting person insights');
      const insight = await detectPersonInsights(
        currentLinkedInProfile,
        previousLinkedInProfile,
        person
      );

      if (insight) {
        log.info(LogCategory.SERVICE, 'Person insight detected, adding to feed', {
          personName: person.name,
          insightType: insight.insightType,
        });
        await addFeedItem(insight);
      } else {
        log.debug(LogCategory.SERVICE, 'No opportunity-relevant insights detected');
      }

      // Update snapshot
      log.debug(LogCategory.SERVICE, 'Updating profile snapshot');
      snapshots.set(person.id, {
        personId: person.id,
        lastChecked: Date.now(),
        profile: currentProfile,
      });
      await savePersonSnapshots(snapshots);

      console.log(`[Uproot] Updated profile snapshot for ${person.name}`);
      log.info(LogCategory.SERVICE, 'Profile check completed', { personName: person.name });
    } catch (error) {
      console.error(`[Uproot] Error checking profile for ${person.name}:`, error);
      log.error(LogCategory.SERVICE, 'Profile check failed', error as Error, {
        personId: person.id,
        personName: person.name,
      });
    }
  });
}

/**
 * @deprecated Legacy function - replaced by detectPersonInsights from person-insights.ts
 * Kept for reference during migration
 */
// async function detectProfileChanges(
//   current: LinkedInProfile,
//   previous: LinkedInProfile,
//   person: WatchlistPerson
// ): Promise<void> {
//   // This function has been replaced by detectPersonInsights which provides
//   // more intelligent, opportunity-relevant insights
// }

// ============================================================================
// COMPANY MONITORING
// ============================================================================

/**
 * Check a company for new posts/updates
 */
export async function checkCompanyUpdates(company: WatchlistCompany): Promise<void> {
  return log.trackAsync(LogCategory.SERVICE, 'checkCompanyUpdates', async () => {
    console.log(`[Uproot] Checking updates for ${company.name}...`);
    log.debug(LogCategory.SERVICE, 'Starting company updates check', {
      companyId: company.id,
      companyName: company.name,
    });

    try {
      // Get current updates from page
      log.debug(LogCategory.SERVICE, 'Scraping company updates from page');
      const currentUpdates = scrapeCompanyUpdates(company.companyUrl);

      if (currentUpdates.length === 0) {
        console.log(`[Uproot] No updates found for ${company.name}`);
        log.warn(LogCategory.SERVICE, 'No updates found for company', { companyName: company.name });
        return;
      }

      log.info(LogCategory.SERVICE, `Scraped ${currentUpdates.length} current updates`);

      // Get previous snapshot
      log.debug(LogCategory.SERVICE, 'Retrieving previous updates snapshot');
      const snapshots = await getCompanySnapshots();
      const previousSnapshot = snapshots.get(company.id);

      // Detect new updates
      log.debug(LogCategory.SERVICE, 'Detecting new updates');
      const newUpdates = detectNewUpdates(currentUpdates, previousSnapshot);

      console.log(`[Uproot] Found ${newUpdates.length} new updates for ${company.name}`);
      log.info(LogCategory.SERVICE, `Detected ${newUpdates.length} new updates`, {
        companyName: company.name,
        totalUpdates: currentUpdates.length,
      });

      // Generate feed items for new updates
      log.debug(LogCategory.SERVICE, 'Generating feed items for new updates');
      for (const update of newUpdates) {
        await generateCompanyUpdateFeedItem(update, company);
      }
      log.info(LogCategory.SERVICE, `Created ${newUpdates.length} company update feed items`);

      // Update snapshot
      log.debug(LogCategory.SERVICE, 'Updating company updates snapshot');
      snapshots.set(company.id, {
        companyId: company.id,
        lastChecked: Date.now(),
        updates: currentUpdates,
      });
      await saveCompanySnapshots(snapshots);

      log.info(LogCategory.SERVICE, 'Company updates check completed', { companyName: company.name });
    } catch (error) {
      console.error(`[Uproot] Error checking updates for ${company.name}:`, error);
      log.error(LogCategory.SERVICE, 'Company updates check failed', error as Error, {
        companyId: company.id,
        companyName: company.name,
      });
    }
  });
}

/**
 * Detect new updates by comparing with previous snapshot
 */
function detectNewUpdates(
  currentUpdates: LinkedInCompanyUpdate[],
  previousSnapshot?: CompanySnapshot
): LinkedInCompanyUpdate[] {
  if (!previousSnapshot) {
    // First time visiting or after clearing - don't show any updates
    // Just establish the baseline snapshot for future comparisons
    // Only show notifications for posts that appear AFTER this initial snapshot
    console.log('[Uproot] No previous snapshot - establishing baseline, showing 0 notifications');
    return [];
  }

  const previousUpdateIds = new Set(previousSnapshot.updates.map((u) => u.id));
  const newUpdates = currentUpdates.filter((update) => !previousUpdateIds.has(update.id));

  if (newUpdates.length > 0) {
    console.log(`[Uproot] Detected ${newUpdates.length} truly new updates (not in previous snapshot)`);
  }

  return newUpdates;
}

/**
 * Generate a feed item for a company update
 */
async function generateCompanyUpdateFeedItem(
  update: LinkedInCompanyUpdate,
  company: WatchlistCompany
): Promise<void> {
  try {
    // Deduplication: Check if this exact update already exists in feed
    const { getFeedItems } = await import('../utils/storage/feed-storage');
    const existingFeed = await getFeedItems();

    const isDuplicate = existingFeed.some(item =>
      item.type === 'company_update' &&
      item.company === company.name &&
      item.actionUrl === update.url
    );

    if (isDuplicate) {
      console.log(`[Uproot] Skipping duplicate update for ${company.name} (already in feed)`);
      return;
    }

    await addFeedItem({
      type: 'company_update',
      timestamp: update.timestamp,
      read: false,
      title: 'Company Update',
      description: update.preview,
      company: company.name,
      companyLogo: company.companyLogo ?? undefined,
      actionUrl: update.url,
      actionLabel: 'See Post',
    });

    console.log(`[Uproot] Created feed item for ${company.name} update`);
  } catch (error) {
    console.error('[Uproot] Error generating company update feed item:', error);
  }
}

// ============================================================================
// MAIN MONITORING FUNCTION
// ============================================================================

/**
 * Monitor all watchlist items on current page
 * Call this when user visits a LinkedIn page
 */
export async function monitorCurrentPage(
  watchlistCompanies: WatchlistCompany[],
  watchlistPeople: WatchlistPerson[],
  preferences: JobPreferences
): Promise<void> {
  return log.trackAsync(LogCategory.SERVICE, 'monitorCurrentPage', async () => {
    const currentUrl = window.location.href;

    console.log('[Uproot] Monitoring current page:', currentUrl);
    log.debug(LogCategory.SERVICE, 'Starting page monitoring', {
      url: currentUrl,
      watchlistCompanies: watchlistCompanies.length,
      watchlistPeople: watchlistPeople.length,
    });

    // Check if current page is a watchlisted company
    const companyId = getCompanyIdFromUrl(currentUrl);
    if (companyId) {
      log.debug(LogCategory.SERVICE, 'Company page detected, checking watchlist', { companyId });
      const company = watchlistCompanies.find((c) =>
        c.companyUrl.includes(companyId)
      );

      if (company) {
        console.log(`[Uproot] On watchlisted company page: ${company.name}`);
        log.info(LogCategory.SERVICE, 'Watchlisted company page detected', {
          companyName: company.name,
          jobAlertsEnabled: company.jobAlertEnabled,
        });

        // Check for jobs if job alerts enabled
        if (company.jobAlertEnabled && currentUrl.includes('/jobs')) {
          log.info(LogCategory.SERVICE, 'Company jobs page detected, checking for new jobs');
          await checkCompanyJobs(company, preferences);
        }

        // Check for company updates if on posts page
        if (currentUrl.includes('/posts')) {
          log.info(LogCategory.SERVICE, 'Company posts page detected, checking for updates');
          await checkCompanyUpdates(company);
        }
      } else {
        log.debug(LogCategory.SERVICE, 'Company page not in watchlist');
      }
    }

    // Check if current page is a watchlisted person
    const profileUsername = getProfileUsernameFromUrl(currentUrl);
    if (profileUsername) {
      log.debug(LogCategory.SERVICE, 'Profile page detected, checking watchlist', { profileUsername });
      const person = watchlistPeople.find((p) =>
        p.profileUrl.includes(profileUsername)
      );

      if (person) {
        console.log(`[Uproot] On watchlisted person page: ${person.name}`);
        log.info(LogCategory.SERVICE, 'Watchlisted person page detected', { personName: person.name });
        await checkPersonProfile(person);
      } else {
        log.debug(LogCategory.SERVICE, 'Profile page not in watchlist');
      }
    }

    log.info(LogCategory.SERVICE, 'Page monitoring cycle completed');
  });
}
