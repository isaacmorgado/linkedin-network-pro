/**
 * Hiring Heat Detector Service
 * Detects when watchlisted companies are ramping up hiring and generates feed items
 */

import { log, LogCategory } from '../utils/logger';
import type { LinkedInJob, JobSnapshot } from '../types/monitoring';
import type { WatchlistCompany } from '../types/watchlist';
import type { FeedItem } from '../types/feed';
import { addFeedItem, getFeedItems } from '../utils/storage/feed-storage';

// ============================================================================
// CONSTANTS
// ============================================================================

const DETECTION_WINDOW_DAYS = 7;
const MIN_NEW_JOBS_THRESHOLD = 3;

// Heat level thresholds
const HEAT_THRESHOLDS = {
  WARMING: 3,    // 3-5 new jobs
  HOT: 6,        // 6-9 new jobs
  VERY_HOT: 10,  // 10+ new jobs
};

// Keywords to identify intern/junior roles
const JUNIOR_KEYWORDS = [
  'intern',
  'internship',
  'co-op',
  'coop',
  'entry',
  'junior',
  'associate',
  'new grad',
  'graduate',
  'entry level',
  'entry-level',
];

// ============================================================================
// TYPES
// ============================================================================

export type HeatLevel = 'warming' | 'hot' | 'very_hot';

export interface HiringHeatIndicator {
  company: WatchlistCompany;
  jobCount: number;
  internshipCount: number;
  heatLevel: HeatLevel;
  topJobTitles: string[];
  detectionWindow: number;
  actionUrl: string;
}

// HiringHeatFeedItem fields (extends FeedItem):
// - type: 'hiring_heat'
// - company: string (company name)
// - companyLogo?: string (company logo URL)
// - jobCount: number (new jobs in detection window)
// - detectionWindow: number (days)
// - heatLevel: HeatLevel ('warming' | 'hot' | 'very_hot')
// - topJobTitles: string[] (up to 3 job titles)
// - internshipCount?: number (count of intern/junior roles)

// ============================================================================
// DETECTION LOGIC
// ============================================================================

/**
 * Detects if a company is experiencing a hiring heat spike
 * Returns an indicator if conditions are met, null otherwise
 */
export function detectHiringHeat(
  currentJobs: LinkedInJob[],
  previousSnapshot: JobSnapshot | undefined,
  company: WatchlistCompany
): HiringHeatIndicator | null {
  log.debug(LogCategory.SERVICE, 'Detecting hiring heat for company', {
    company: company.name,
    currentJobCount: currentJobs.length,
  });

  // 1. Filter jobs posted within detection window
  const now = Date.now();
  const windowStart = now - DETECTION_WINDOW_DAYS * 24 * 60 * 60 * 1000;

  const recentJobs = currentJobs.filter((job) => job.postedTimestamp >= windowStart);

  log.debug(LogCategory.SERVICE, 'Recent jobs within window', {
    recentJobCount: recentJobs.length,
    windowDays: DETECTION_WINDOW_DAYS,
  });

  if (recentJobs.length < MIN_NEW_JOBS_THRESHOLD) {
    log.debug(LogCategory.SERVICE, 'Not enough recent jobs', {
      recentJobCount: recentJobs.length,
      threshold: MIN_NEW_JOBS_THRESHOLD,
    });
    return null;
  }

  // 2. Identify NEW jobs (not in previous snapshot)
  const previousJobIds = new Set(previousSnapshot?.jobs.map((j) => j.id) || []);

  const newJobs = recentJobs.filter((job) => !previousJobIds.has(job.id));

  log.debug(LogCategory.SERVICE, 'New jobs detected', {
    newJobCount: newJobs.length,
    previousSnapshotSize: previousJobIds.size,
  });

  if (newJobs.length < MIN_NEW_JOBS_THRESHOLD) {
    log.debug(LogCategory.SERVICE, 'Not enough NEW jobs', {
      newJobCount: newJobs.length,
      threshold: MIN_NEW_JOBS_THRESHOLD,
    });
    return null;
  }

  // 3. Calculate heat level based on job count
  const heatLevel: HeatLevel =
    newJobs.length >= HEAT_THRESHOLDS.VERY_HOT
      ? 'very_hot'
      : newJobs.length >= HEAT_THRESHOLDS.HOT
      ? 'hot'
      : 'warming';

  // 4. Identify intern/junior roles
  const internshipJobs = newJobs.filter((job) =>
    JUNIOR_KEYWORDS.some((keyword) => job.title.toLowerCase().includes(keyword))
  );

  log.info(LogCategory.SERVICE, 'Hiring heat detected', {
    company: company.name,
    newJobCount: newJobs.length,
    internshipCount: internshipJobs.length,
    heatLevel,
  });

  // 5. Extract top 3 job titles (prioritize internships)
  const topJobs = [
    ...internshipJobs.slice(0, 3),
    ...newJobs.filter((j) => !internshipJobs.includes(j)).slice(0, 3 - internshipJobs.length),
  ];

  return {
    company,
    jobCount: newJobs.length,
    internshipCount: internshipJobs.length,
    heatLevel,
    topJobTitles: topJobs.map((j) => j.title),
    detectionWindow: DETECTION_WINDOW_DAYS,
    actionUrl: `${company.companyUrl}/jobs/`,
  };
}

// ============================================================================
// DEDUPLICATION
// ============================================================================

/**
 * Checks if a hiring_heat item should be created
 * Returns false if a recent item already exists for this company
 */
export async function shouldCreateHiringHeatItem(
  company: WatchlistCompany,
  detectionWindow: number
): Promise<boolean> {
  log.debug(LogCategory.SERVICE, 'Checking for existing hiring_heat items', {
    company: company.name,
    detectionWindow,
  });

  try {
    const feedItems = await getFeedItems();

    // Check for existing hiring_heat item for this company within window
    const windowStart = Date.now() - detectionWindow * 24 * 60 * 60 * 1000;

    const existingHeat = feedItems.find(
      (item) =>
        item.type === 'hiring_heat' &&
        item.company === company.name &&
        item.timestamp >= windowStart
    );

    if (existingHeat) {
      log.debug(LogCategory.SERVICE, 'Found existing hiring_heat item, skipping', {
        company: company.name,
        existingItemId: existingHeat.id,
        existingItemAge: Date.now() - existingHeat.timestamp,
      });
      return false;
    }

    log.debug(LogCategory.SERVICE, 'No existing hiring_heat item found, OK to create', {
      company: company.name,
    });
    return true;
  } catch (error) {
    log.error(LogCategory.SERVICE, 'Error checking existing hiring_heat items', { error });
    // On error, allow creation (fail open)
    return true;
  }
}

// ============================================================================
// FEED ITEM GENERATION
// ============================================================================

/**
 * Generates and persists a hiring_heat feed item
 */
export async function generateHiringHeatFeedItem(
  indicator: HiringHeatIndicator
): Promise<void> {
  const { company, jobCount, internshipCount, heatLevel, topJobTitles, detectionWindow, actionUrl } =
    indicator;

  log.debug(LogCategory.SERVICE, 'Generating hiring_heat feed item', {
    company: company.name,
    jobCount,
    heatLevel,
  });

  // Check deduplication
  const shouldCreate = await shouldCreateHiringHeatItem(company, detectionWindow);
  if (!shouldCreate) {
    log.info(LogCategory.SERVICE, 'Skipping duplicate hiring_heat item', {
      company: company.name,
    });
    console.log(`[Uproot] Skipping duplicate hiring_heat for ${company.name}`);
    return;
  }

  // Generate title based on heat level
  const heatEmoji = {
    warming: '🔥',
    hot: '🔥🔥',
    very_hot: '🔥🔥🔥',
  }[heatLevel];

  const title = `${company.name} is ramping up hiring ${heatEmoji}`;

  // Generate description
  const description = `${jobCount} new position${jobCount > 1 ? 's' : ''} posted in the last ${detectionWindow} days${
    internshipCount && internshipCount > 0 ? ` (${internshipCount} intern/junior)` : ''
  }.\n\nTop roles: ${topJobTitles.slice(0, 3).join(', ')}`;

  // Create feed item (omit id, will be auto-generated)
  const feedItem: Omit<FeedItem, 'id'> = {
    type: 'hiring_heat',
    timestamp: Date.now(),
    read: false,

    company: company.name,
    companyLogo: company.companyLogo || undefined,

    jobCount,
    detectionWindow,
    heatLevel,
    topJobTitles: topJobTitles.slice(0, 3),
    internshipCount,

    title,
    description,
    actionUrl,
    actionLabel: 'View Open Roles',
  };

  // Persist to storage
  try {
    await addFeedItem(feedItem);

    log.change(LogCategory.SERVICE, 'feedItems', 'create', {
      type: 'hiring_heat',
      company: company.name,
      jobCount,
      heatLevel,
    });

    console.log(
      `[Uproot] Created hiring_heat feed item for ${company.name} (${jobCount} jobs, ${heatLevel})`
    );
  } catch (error) {
    log.error(LogCategory.SERVICE, 'Error creating hiring_heat feed item', {
      company: company.name,
      error,
    });
    console.error(`[Uproot] Error creating hiring_heat feed item:`, error);
    throw error;
  }
}
