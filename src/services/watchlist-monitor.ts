/**
 * Watchlist Monitoring Service
 * Monitors watchlist items for changes and generates feed items
 */

import type {
  JobSnapshot,
  PersonSnapshot,
  CompanySnapshot,
  LinkedInJob,
  LinkedInPersonProfile,
  LinkedInCompanyUpdate,
  JobMatchCriteria,
} from '../types/monitoring';
import type { WatchlistCompany, WatchlistPerson } from '../types/watchlist';
import type { JobPreferences } from '../types/onboarding';
import type { FeedItem } from '../types/feed';
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
import { calculateJobMatch, filterMatchingJobs } from './job-matcher';
import { addFeedItem } from '../utils/storage';

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
  try {
    console.log(`[Uproot] Checking jobs for ${company.name}...`);

    // Get current jobs from page (must be run in content script context)
    const currentJobs = scrapeCompanyJobs(company.companyUrl);

    if (currentJobs.length === 0) {
      console.log(`[Uproot] No jobs found for ${company.name}`);
      return [];
    }

    // Get previous snapshot
    const snapshots = await getJobSnapshots();
    const previousSnapshot = snapshots.get(company.id);

    // Detect new jobs
    const newJobs = detectNewJobs(currentJobs, previousSnapshot);

    console.log(`[Uproot] Found ${newJobs.length} new jobs for ${company.name}`);

    // Update snapshot
    snapshots.set(company.id, {
      companyId: company.id,
      lastChecked: Date.now(),
      jobs: currentJobs,
    });
    await saveJobSnapshots(snapshots);

    // Filter by user preferences
    const matchCriteria: JobMatchCriteria = {
      jobTitles: preferences.jobTitles,
      experienceLevel: preferences.experienceLevel,
      workLocation: preferences.workLocation,
      locations: preferences.locations,
      industries: preferences.industries,
    };

    const matchingJobs = filterMatchingJobs(newJobs, matchCriteria, 50);

    console.log(`[Uproot] ${matchingJobs.length} jobs match user preferences`);

    // Generate feed items for matching jobs
    for (const { job, match } of matchingJobs) {
      await generateJobAlertFeedItem(job, company, match.score, match.reasons);
    }

    return matchingJobs.map((m) => m.job);
  } catch (error) {
    console.error(`[Uproot] Error checking jobs for ${company.name}:`, error);
    return [];
  }
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
  reasons: string[]
): Promise<void> {
  try {
    const feedItem: Omit<FeedItem, 'id'> = {
      type: 'job_alert',
      timestamp: Date.now(),
      read: false,
      title: 'New Job Match',
      description: job.title,
      company: company.name,
      companyLogo: company.logo,
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
  try {
    console.log(`[Uproot] Checking profile for ${person.name}...`);

    // Get current profile from page
    const currentProfile = scrapePersonProfile();

    if (!currentProfile) {
      console.log(`[Uproot] Could not scrape profile for ${person.name}`);
      return;
    }

    // Get previous snapshot
    const snapshots = await getPersonSnapshots();
    const previousSnapshot = snapshots.get(person.id);

    // Detect changes
    if (previousSnapshot) {
      await detectProfileChanges(currentProfile, previousSnapshot.profile, person);
    }

    // Update snapshot
    snapshots.set(person.id, {
      personId: person.id,
      lastChecked: Date.now(),
      profile: currentProfile,
    });
    await savePersonSnapshots(snapshots);

    console.log(`[Uproot] Updated profile snapshot for ${person.name}`);
  } catch (error) {
    console.error(`[Uproot] Error checking profile for ${person.name}:`, error);
  }
}

/**
 * Detect and generate feed items for profile changes
 */
async function detectProfileChanges(
  current: LinkedInPersonProfile,
  previous: LinkedInPersonProfile,
  person: WatchlistPerson
): Promise<void> {
  // Check for job change (different company)
  if (current.currentRole.company !== previous.currentRole.company) {
    await addFeedItem({
      type: 'person_update',
      timestamp: Date.now(),
      read: false,
      title: 'Connection Update',
      description: `${current.name} started a new position at ${current.currentRole.company}`,
      actionUrl: current.profileUrl,
      actionLabel: 'View Profile',
    });

    console.log(`[Uproot] ${current.name} changed companies: ${previous.currentRole.company} → ${current.currentRole.company}`);
  }
  // Check for promotion (same company, different title)
  else if (current.currentRole.title !== previous.currentRole.title) {
    await addFeedItem({
      type: 'person_update',
      timestamp: Date.now(),
      read: false,
      title: 'Connection Update',
      description: `${current.name} was promoted to ${current.currentRole.title} at ${current.currentRole.company}`,
      actionUrl: current.profileUrl,
      actionLabel: 'View Profile',
    });

    console.log(`[Uproot] ${current.name} got promoted: ${previous.currentRole.title} → ${current.currentRole.title}`);
  }
}

// ============================================================================
// COMPANY MONITORING
// ============================================================================

/**
 * Check a company for new posts/updates
 */
export async function checkCompanyUpdates(company: WatchlistCompany): Promise<void> {
  try {
    console.log(`[Uproot] Checking updates for ${company.name}...`);

    // Get current updates from page
    const currentUpdates = scrapeCompanyUpdates(company.companyUrl);

    if (currentUpdates.length === 0) {
      console.log(`[Uproot] No updates found for ${company.name}`);
      return;
    }

    // Get previous snapshot
    const snapshots = await getCompanySnapshots();
    const previousSnapshot = snapshots.get(company.id);

    // Detect new updates
    const newUpdates = detectNewUpdates(currentUpdates, previousSnapshot);

    console.log(`[Uproot] Found ${newUpdates.length} new updates for ${company.name}`);

    // Generate feed items for new updates
    for (const update of newUpdates) {
      await generateCompanyUpdateFeedItem(update, company);
    }

    // Update snapshot
    snapshots.set(company.id, {
      companyId: company.id,
      lastChecked: Date.now(),
      updates: currentUpdates,
    });
    await saveCompanySnapshots(snapshots);
  } catch (error) {
    console.error(`[Uproot] Error checking updates for ${company.name}:`, error);
  }
}

/**
 * Detect new updates by comparing with previous snapshot
 */
function detectNewUpdates(
  currentUpdates: LinkedInCompanyUpdate[],
  previousSnapshot?: CompanySnapshot
): LinkedInCompanyUpdate[] {
  if (!previousSnapshot) {
    // First time, only show most recent update
    return currentUpdates.slice(0, 1);
  }

  const previousUpdateIds = new Set(previousSnapshot.updates.map((u) => u.id));
  return currentUpdates.filter((update) => !previousUpdateIds.has(update.id));
}

/**
 * Generate a feed item for a company update
 */
async function generateCompanyUpdateFeedItem(
  update: LinkedInCompanyUpdate,
  company: WatchlistCompany
): Promise<void> {
  try {
    await addFeedItem({
      type: 'company_update',
      timestamp: update.timestamp,
      read: false,
      title: 'Company Update',
      description: update.preview,
      company: company.name,
      companyLogo: company.logo,
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
  const currentUrl = window.location.href;

  console.log('[Uproot] Monitoring current page:', currentUrl);

  // Check if current page is a watchlisted company
  const companyId = getCompanyIdFromUrl(currentUrl);
  if (companyId) {
    const company = watchlistCompanies.find((c) =>
      c.companyUrl.includes(companyId)
    );

    if (company) {
      console.log(`[Uproot] On watchlisted company page: ${company.name}`);

      // Check for jobs if job alerts enabled
      if (company.jobAlertEnabled && currentUrl.includes('/jobs')) {
        await checkCompanyJobs(company, preferences);
      }

      // Check for company updates if on posts page
      if (currentUrl.includes('/posts')) {
        await checkCompanyUpdates(company);
      }
    }
  }

  // Check if current page is a watchlisted person
  const profileUsername = getProfileUsernameFromUrl(currentUrl);
  if (profileUsername) {
    const person = watchlistPeople.find((p) =>
      p.profileUrl.includes(profileUsername)
    );

    if (person) {
      console.log(`[Uproot] On watchlisted person page: ${person.name}`);
      await checkPersonProfile(person);
    }
  }
}
