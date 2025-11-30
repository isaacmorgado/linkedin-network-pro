/**
 * Person Insights Detection Service
 * Detects opportunity-relevant changes from watchlisted people
 */


import type { WatchlistPerson, WatchlistCompany } from '../types/watchlist';
import type { FeedItem } from '../types/feed';
import type { LinkedInProfile } from '../types';
import { log, LogCategory } from '../utils/logger';

// Hiring-related keywords for activity detection
const HIRING_KEYWORDS = [
  'hiring',
  'we\'re hiring',
  'we are hiring',
  'looking for',
  'seeking',
  'intern',
  'internship',
  'open role',
  'open position',
  'join our team',
  'join us',
  'we\'re looking',
  'we are looking',
  'recruiting',
  'applications',
];

/**
 * Check if a company is in the watchlist
 */
async function isCompanyWatchlisted(companyName: string): Promise<boolean> {
  try {
    const result = await chrome.storage.local.get('uproot_watchlist_companies');
    const companies: WatchlistCompany[] = result.uproot_watchlist_companies || [];

    // Case-insensitive company name matching
    const normalizedName = companyName.toLowerCase().trim();
    return companies.some(c => c.name.toLowerCase().trim() === normalizedName);
  } catch (error) {
    log.error(LogCategory.SERVICE, 'Error checking if company is watchlisted', { error, companyName });
    return false;
  }
}

/**
 * Check if text contains hiring-related keywords
 */
function containsHiringKeywords(text: string): boolean {
  const lowerText = text.toLowerCase();
  return HIRING_KEYWORDS.some(keyword => lowerText.includes(keyword));
}

/**
 * Detect opportunity-relevant insights from profile changes
 */
export async function detectPersonInsights(
  current: LinkedInProfile,
  previous: LinkedInProfile | undefined,
  person: WatchlistPerson
): Promise<FeedItem | null> {
  log.debug(LogCategory.SERVICE, 'Detecting person insights', {
    personName: person.name,
    currentCompany: current.currentRole?.company,
    previousCompany: previous?.currentRole?.company,
  });

  // If no current role, can't detect job-related insights
  if (!current.currentRole) {
    return await detectHiringActivity(current, person);
  }

  // If no previous snapshot, check for hiring activity only
  if (!previous || !previous.currentRole) {
    return await detectHiringActivity(current, person);
  }

  // Check for job change (different company)
  if (current.currentRole.company !== previous.currentRole.company) {
    log.info(LogCategory.SERVICE, 'Job change detected', {
      personName: person.name,
      from: previous.currentRole.company,
      to: current.currentRole.company,
    });

    const isTargetCompany = await isCompanyWatchlisted(current.currentRole.company);

    // Only create feed item if it's opportunity-relevant:
    // 1. Person joined a watchlisted company (high priority)
    // 2. Person changed to a senior role (could hire interns/juniors)
    const isSeniorRole = /senior|lead|manager|director|head|vp|chief/i.test(current.currentRole.title);

    if (isTargetCompany || isSeniorRole) {
      const feedItem: FeedItem = {
        id: `person_insight_${person.id}_${Date.now()}`,
        type: 'person_update',
        timestamp: Date.now(),
        read: false,

        // Person details
        personName: current.name,
        personTitle: current.currentRole.title,
        personUrl: current.profileUrl,
        personImage: current.photoUrl,

        // Insight details
        insightType: 'job_change',
        newCompany: current.currentRole.company,
        newRole: current.currentRole.title,
        isTargetCompany,

        // Metadata
        title: isTargetCompany
          ? `${current.name} joined ${current.currentRole.company}`
          : `${current.name} changed jobs`,
        description: `${current.name} is now ${current.currentRole.title} at ${current.currentRole.company}${
          isTargetCompany ? ' (Watchlisted Company!)' : ''
        }`,
        updateText: `Started new position at ${current.currentRole.company}`,
        actionUrl: current.profileUrl,
        actionLabel: 'View Profile',
      };

      log.info(LogCategory.SERVICE, 'Created job change feed item', {
        personName: current.name,
        isTargetCompany,
        isSeniorRole,
      });

      return feedItem;
    }

    log.debug(LogCategory.SERVICE, 'Job change not opportunity-relevant, skipping feed item', {
      isTargetCompany,
      isSeniorRole,
      role: current.currentRole.title,
    });
    return null;
  }

  // Check for promotion (same company, different title, and more senior)
  if (current.currentRole.title !== previous.currentRole.title) {
    const isTargetCompany = await isCompanyWatchlisted(current.currentRole.company);
    const isSeniorRole = /senior|lead|manager|director|head|vp|chief/i.test(current.currentRole.title);

    // Only create feed item if at watchlisted company AND promoted to senior role
    if (isTargetCompany && isSeniorRole) {
      const feedItem: FeedItem = {
        id: `person_insight_${person.id}_${Date.now()}`,
        type: 'person_update',
        timestamp: Date.now(),
        read: false,

        // Person details
        personName: current.name,
        personTitle: current.currentRole.title,
        personUrl: current.profileUrl,
        personImage: current.photoUrl,

        // Insight details
        insightType: 'job_change', // Treat promotion as job_change for V1
        newCompany: current.currentRole.company,
        newRole: current.currentRole.title,
        isTargetCompany: true,

        // Metadata
        title: `${current.name} promoted at ${current.currentRole.company}`,
        description: `${current.name} is now ${current.currentRole.title} at ${current.currentRole.company} (Watchlisted Company!)`,
        updateText: `Promoted to ${current.currentRole.title}`,
        actionUrl: current.profileUrl,
        actionLabel: 'View Profile',
      };

      log.info(LogCategory.SERVICE, 'Created promotion feed item', {
        personName: current.name,
        newTitle: current.currentRole.title,
      });

      return feedItem;
    }

    log.debug(LogCategory.SERVICE, 'Promotion not opportunity-relevant, skipping feed item', {
      isTargetCompany,
      isSeniorRole,
    });
    return null;
  }

  // Check for hiring-related activity
  return await detectHiringActivity(current, person);
}

/**
 * Detect hiring-related posts/activity
 */
async function detectHiringActivity(
  profile: LinkedInProfile,
  person: WatchlistPerson
): Promise<FeedItem | null> {
  if (!profile.recentActivity || profile.recentActivity.length === 0) {
    return null;
  }

  // Check each recent activity for hiring keywords
  for (const activity of profile.recentActivity) {
    if (containsHiringKeywords(activity.preview)) {
      log.info(LogCategory.SERVICE, 'Hiring-related activity detected', {
        personName: person.name,
        activityPreview: activity.preview.substring(0, 100),
      });

      const feedItem: FeedItem = {
        id: `person_insight_${person.id}_${Date.now()}`,
        type: 'person_update',
        timestamp: Date.now(),
        read: false,

        // Person details
        personName: profile.name,
        personTitle: profile.currentRole?.title,
        personUrl: profile.profileUrl,
        personImage: profile.photoUrl,

        // Insight details
        insightType: 'new_activity',
        updateText: activity.preview,

        // Metadata
        title: `${profile.name} posted about hiring`,
        description: activity.preview.substring(0, 200) + (activity.preview.length > 200 ? '...' : ''),
        actionUrl: activity.url || profile.profileUrl,
        actionLabel: 'View Post',
      };

      log.info(LogCategory.SERVICE, 'Created hiring activity feed item', {
        personName: profile.name,
      });

      return feedItem;
    }
  }

  return null;
}
