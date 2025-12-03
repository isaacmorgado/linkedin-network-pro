/**
 * Warm Path Detector Service
 * Detects when new connections open warm paths into watchlisted companies
 */

import { log, LogCategory } from '../utils/logger';

import type { FeedItem } from '../types/feed';
import type { LinkedInProfile } from '../types';
import { getCompanyWatchlist } from '../utils/storage/company-watchlist-storage';
import { addFeedItem } from '../utils/storage/feed-storage';
import {
  addWarmPathDedupe,
  isDuplicateWarmPath,
} from '../utils/storage/warm-path-storage';

// ============================================================================
// TYPES
// ============================================================================

export interface WarmPathDescriptor {
  targetCompany: string;
  targetCompanyUrl: string;
  targetCompanyLogo?: string;
  viaPersonName: string;
  viaPersonProfileUrl: string;
  viaPersonImage?: string;
  viaPersonTitle?: string;
  pathLength: 1 | 2;

  // For path length 2 only
  bridgeToName?: string;
  bridgeToProfileUrl?: string;
  bridgeToTitle?: string;
}

// ============================================================================
// MAIN DETECTION FUNCTION
// ============================================================================

/**
 * Detects if a new connection opens a warm path into a watchlisted company
 * V1: Only implements path length 1 (direct connection at watchlisted company)
 * V2: Will add path length 2 (2-hop bridge through connection's colleagues)
 */
export async function detectWarmPathForConnection(
  newConnectionProfileUrl: string,
  newConnectionProfile: LinkedInProfile
): Promise<WarmPathDescriptor | null> {
  return log.trackAsync(
    LogCategory.MONITORING,
    'detectWarmPathForConnection',
    async () => {
      log.debug(LogCategory.MONITORING, 'Checking for warm path', {
        profileUrl: newConnectionProfileUrl,
        name: newConnectionProfile.name,
      });

      try {
        // V1: Path length 1 - Direct connection at watchlisted company
        const directPath = await detectDirectWarmPath(
          newConnectionProfileUrl,
          newConnectionProfile
        );

        if (directPath) {
          log.info(
            LogCategory.MONITORING,
            'Direct warm path detected',
            directPath
          );
          return directPath;
        }

        // V2: Path length 2 - Bridge through connection's company
        // TODO: Implement in V2
        // const bridgePath = await detectBridgeWarmPath(newConnectionProfileUrl, newConnectionProfile);
        // if (bridgePath) return bridgePath;

        log.debug(
          LogCategory.MONITORING,
          'No warm path detected',
          { profileUrl: newConnectionProfileUrl }
        );
        return null;
      } catch (error) {
        log.error(LogCategory.MONITORING, 'Error detecting warm path', {
          error,
          profileUrl: newConnectionProfileUrl,
        });
        return null;
      }
    }
  );
}

// ============================================================================
// PATH DETECTION HELPERS
// ============================================================================

/**
 * Check if a company is in the watchlist by name (case-insensitive)
 */
async function isCompanyWatchlistedByName(companyName: string): Promise<boolean> {
  try {
    const companies = await getCompanyWatchlist();
    const normalizedName = companyName.toLowerCase().trim();
    return companies.some((c) => c.name.toLowerCase().trim() === normalizedName);
  } catch (error) {
    log.error(LogCategory.MONITORING, 'Error checking if company is watchlisted', {
      error,
      companyName,
    });
    return false;
  }
}

/**
 * Detects path length 1: New connection works at a watchlisted company
 */
async function detectDirectWarmPath(
  profileUrl: string,
  profile: LinkedInProfile
): Promise<WarmPathDescriptor | null> {
  // 1. Extract current company from profile
  const currentCompany = profile.currentRole?.company;

  if (!currentCompany) {
    log.debug(LogCategory.MONITORING, 'No company info in profile', {
      profileUrl,
    });
    return null; // No company info available
  }

  // 2. Check if company is watchlisted (by name since URL not available in currentRole)
  const isWatchlisted = await isCompanyWatchlistedByName(currentCompany);

  if (!isWatchlisted) {
    log.debug(LogCategory.MONITORING, 'Company not watchlisted', {
      company: currentCompany,
    });
    return null; // Not a target company
  }

  // 3. Get company details from watchlist for logo and URL
  const watchlist = await getCompanyWatchlist();
  const watchlistedCompany = watchlist.find(
    (c) => c.name.toLowerCase().trim() === currentCompany.toLowerCase().trim()
  );

  // 4. Build descriptor
  const descriptor: WarmPathDescriptor = {
    targetCompany: currentCompany,
    targetCompanyUrl: watchlistedCompany?.companyUrl || '',
    targetCompanyLogo: watchlistedCompany?.companyLogo || undefined,
    viaPersonName: profile.name,
    viaPersonProfileUrl: profileUrl,
    viaPersonImage: profile.photoUrl,
    viaPersonTitle: profile.currentRole?.title,
    pathLength: 1,
  };

  log.info(LogCategory.MONITORING, 'Direct warm path found', descriptor);
  return descriptor;
}

// ============================================================================
// DEDUPLICATION
// ============================================================================

/**
 * Checks if a warm path item should be created (not a duplicate)
 * Uses both feed items and dedupe storage
 */
export async function shouldCreateWarmPathItem(
  targetCompanyUrl: string,
  viaPersonProfileUrl: string,
  pathLength: number
): Promise<boolean> {
  return log.trackAsync(
    LogCategory.MONITORING,
    'shouldCreateWarmPathItem',
    async () => {
      log.debug(LogCategory.MONITORING, 'Checking if warm path item should be created', {
        targetCompanyUrl,
        viaPersonProfileUrl,
        pathLength,
      });

      // Check dedupe storage (fast O(1) lookup)
      const isDupe = await isDuplicateWarmPath(
        targetCompanyUrl,
        viaPersonProfileUrl,
        pathLength
      );

      if (isDupe) {
        log.debug(
          LogCategory.MONITORING,
          'Warm path is duplicate, skipping creation',
          {
            targetCompanyUrl,
            viaPersonProfileUrl,
            pathLength,
          }
        );
        return false;
      }

      log.debug(
        LogCategory.MONITORING,
        'Warm path is not duplicate, should create',
        {
          targetCompanyUrl,
          viaPersonProfileUrl,
          pathLength,
        }
      );
      return true;
    }
  );
}

// ============================================================================
// FEED ITEM GENERATION
// ============================================================================

/**
 * Generates and stores a warm_path_opened feed item
 */
export async function generateWarmPathFeedItem(
  descriptor: WarmPathDescriptor
): Promise<void> {
  return log.trackAsync(
    LogCategory.MONITORING,
    'generateWarmPathFeedItem',
    async () => {
      log.debug(
        LogCategory.MONITORING,
        'Generating warm path feed item',
        descriptor
      );

      try {
        // Build feed item
        const feedItem: Omit<FeedItem, 'id'> = {
          type: 'warm_path_opened',
          timestamp: Date.now(),
          read: false,
          title: generateTitle(descriptor),
          description: generateDescription(descriptor),
          actionUrl: descriptor.viaPersonProfileUrl,
          actionLabel: getActionLabel(descriptor.pathLength),
          warmPath: {
            targetCompany: descriptor.targetCompany,
            targetCompanyUrl: descriptor.targetCompanyUrl,
            targetCompanyLogo: descriptor.targetCompanyLogo,
            viaPersonName: descriptor.viaPersonName,
            viaPersonProfileUrl: descriptor.viaPersonProfileUrl,
            viaPersonImage: descriptor.viaPersonImage,
            viaPersonTitle: descriptor.viaPersonTitle,
            pathLength: descriptor.pathLength,
            bridgeToName: descriptor.bridgeToName,
            bridgeToProfileUrl: descriptor.bridgeToProfileUrl,
            bridgeToTitle: descriptor.bridgeToTitle,
          },
        };

        // Add to feed
        await addFeedItem(feedItem);

        // Add to dedupe storage
        await addWarmPathDedupe({
          targetCompanyUrl: descriptor.targetCompanyUrl,
          viaPersonProfileUrl: descriptor.viaPersonProfileUrl,
          pathLength: descriptor.pathLength,
        });

        log.change(
          LogCategory.MONITORING,
          'warmPathOpened',
          'create',
          descriptor
        );
        console.log(
          '[Uproot] Warm path opened:',
          descriptor.viaPersonName,
          '→',
          descriptor.targetCompany
        );
      } catch (error) {
        log.error(LogCategory.MONITORING, 'Error generating warm path feed item', {
          error,
          descriptor,
        });
        throw error;
      }
    }
  );
}

// ============================================================================
// UI TEXT GENERATORS
// ============================================================================

function generateTitle(descriptor: WarmPathDescriptor): string {
  if (descriptor.pathLength === 1) {
    return `Warm path opened to ${descriptor.targetCompany}`;
  } else {
    // Path length 2
    return `New bridge into ${descriptor.targetCompany}`;
  }
}

function generateDescription(descriptor: WarmPathDescriptor): string {
  if (descriptor.pathLength === 1) {
    return `Your new connection ${descriptor.viaPersonName} works at ${descriptor.targetCompany} (a watchlisted company). Now's a great time to reach out!`;
  } else {
    // Path length 2
    const bridgeName = descriptor.bridgeToName || 'someone';
    return `Your new connection ${descriptor.viaPersonName} knows ${bridgeName} at ${descriptor.targetCompany}. Ask ${descriptor.viaPersonName} for an intro!`;
  }
}

function getActionLabel(pathLength: number): string {
  if (pathLength === 1) {
    return 'View Profile';
  } else {
    return 'Ask for Intro';
  }
}
