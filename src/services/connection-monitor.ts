/**
 * Connection Monitor Service
 * Detects and logs connection acceptances
 */

import type { ConnectionPath } from '../types/watchlist';
import type { FeedItem } from '../types/feed';
import type { LinkedInPersonProfile } from '../types/monitoring';

import { scrapePersonProfile } from '../utils/linkedin-scraper';
import {
  detectWarmPathForConnection,
  shouldCreateWarmPathItem,
  generateWarmPathFeedItem,
} from './warm-path-detector';

const LOGGED_ACCEPTANCES_KEY = 'uproot_logged_acceptances';

/**
 * Detects newly accepted connections by comparing current connections
 * with stored connection paths
 */
export async function detectConnectionAcceptances(
  currentConnections: string[], // LinkedIn profile URLs
  connectionPaths: ConnectionPath[]
): Promise<Array<{ pathId: string; stepIndex: number; personName: string }>> {
  const acceptances: Array<{
    pathId: string;
    stepIndex: number;
    personName: string;
  }> = [];

  // Get already logged acceptances
  const result = await chrome.storage.local.get(LOGGED_ACCEPTANCES_KEY);
  const loggedAcceptances: Set<string> = new Set(
    result[LOGGED_ACCEPTANCES_KEY] || []
  );

  // Check each connection path for new acceptances
  for (const path of connectionPaths) {
    for (let i = 0; i < path.path.length; i++) {
      const step = path.path[i];

      // Create unique ID for this acceptance
      const acceptanceId = `${path.id}_${step.profileUrl}`;

      // Check if this connection was accepted
      const isConnected = currentConnections.includes(step.profileUrl);

      // Check if already logged
      const alreadyLogged = loggedAcceptances.has(acceptanceId);

      // New acceptance: connected but not logged yet
      if (isConnected && !step.connected && !alreadyLogged) {
        acceptances.push({
          pathId: path.id,
          stepIndex: i,
          personName: step.name,
        });
      }
    }
  }

  return acceptances;
}

/**
 * Logs a connection acceptance by creating a feed item and updating storage
 */
export async function logConnectionAcceptance(
  pathId: string,
  stepIndex: number,
  personName: string,
  personProfileUrl: string
): Promise<void> {
  // Get connection path to show progress details
  const pathsResult = await chrome.storage.local.get('uproot_connection_paths');
  const paths: ConnectionPath[] = pathsResult['uproot_connection_paths'] || [];
  const pathIndex = paths.findIndex((p) => p.id === pathId);
  const targetPath = paths[pathIndex];

  // Calculate progress
  const totalSteps = targetPath?.totalSteps || 1;
  const completedSteps = (targetPath?.completedSteps || 0) + 1;
  const isComplete = completedSteps >= totalSteps;

  // Create enhanced feed item with progress details
  const feedItem: Omit<FeedItem, 'id'> = {
    type: 'connection_update',
    timestamp: Date.now(),
    read: false,
    connectionName: personName,
    connectionUpdate: `${personName} accepted your connection request`,
    title: isComplete ? '🎉 Connection Path Complete!' : `✅ Step ${completedSteps}/${totalSteps} Complete`,
    description: isComplete
      ? `${personName} connected! You've completed your path to ${targetPath?.targetName || 'your target'}`
      : `${personName} connected! ${totalSteps - completedSteps} ${totalSteps - completedSteps === 1 ? 'step' : 'steps'} remaining to reach ${targetPath?.targetName || 'your target'}`,
    actionUrl: personProfileUrl,
    actionLabel: 'View Profile',
  };

  // Add to feed
  const feedResult = await chrome.storage.local.get('uproot_feed');
  const feedItems = feedResult['uproot_feed'] || [];
  const newItem = { ...feedItem, id: `feed_${Date.now()}` };
  feedItems.unshift(newItem);
  await chrome.storage.local.set({ uproot_feed: feedItems });

  // Update connection path to mark step as connected
  if (pathIndex !== -1) {
    const path = paths[pathIndex];

    if (stepIndex >= 0 && stepIndex < path.path.length) {
      // Mark step as connected
      path.path[stepIndex].connected = true;

      // Update completed steps count
      path.completedSteps = path.path.filter((step) => step.connected).length;

      // Check if path is complete
      path.isComplete = path.completedSteps === path.totalSteps;
      path.lastUpdated = Date.now();

      await chrome.storage.local.set({ uproot_connection_paths: paths });
    }
  }

  // Mark as logged
  const loggedResult = await chrome.storage.local.get(LOGGED_ACCEPTANCES_KEY);
  const loggedAcceptances: string[] = loggedResult[LOGGED_ACCEPTANCES_KEY] || [];
  const acceptanceId = `${pathId}_${personProfileUrl}`;
  loggedAcceptances.push(acceptanceId);
  await chrome.storage.local.set({ [LOGGED_ACCEPTANCES_KEY]: loggedAcceptances });

  // NEW: Check for warm path
  try {
    await checkForWarmPath(personProfileUrl, personName);
  } catch (error) {
    console.error('[Uproot] Failed to check warm path:', error);
    // Don't break existing flow
  }
}

/**
 * Tracks connection status for a given profile
 */
export function trackConnectionStatus(
  profileUrl: string,
  currentConnections: string[]
): 'connected' | 'pending' | 'not_connected' {
  if (currentConnections.includes(profileUrl)) {
    return 'connected';
  }
  return 'not_connected';
}

/**
 * Checks if a new connection opens a warm path into a watchlisted company
 * This is called after logging a connection acceptance
 */
async function checkForWarmPath(
  profileUrl: string,
  personName: string
): Promise<void> {
  console.log(`[Uproot] Checking for warm path: ${personName}`);

  // 1. Scrape new connection's profile
  // Note: This requires the profile page to be loaded
  // In V1, this may not always be available, so we handle gracefully
  let profile: LinkedInPersonProfile | null = null;
  try {
    profile = scrapePersonProfile();
  } catch (error) {
    console.log('[Uproot] Could not scrape profile for warm path check:', error);
    return; // Cannot detect warm path without profile data
  }

  if (!profile) {
    console.log('[Uproot] No profile data available for warm path check');
    return;
  }

  // 2. Convert LinkedInPersonProfile to LinkedInProfile
  const linkedInProfile = {
    id: profile.profileUrl,
    name: profile.name,
    headline: profile.headline,
    location: profile.location,
    photoUrl: profile.photoUrl,
    profileUrl: profile.profileUrl,
    currentRole: profile.currentRole,
    experience: profile.currentRole ? [{
      company: profile.currentRole.company,
      title: profile.currentRole.title,
      duration: profile.currentRole.startDate,
      location: profile.location,
    }] : [],
    education: [],
    certifications: [],
    skills: [],
    mutualConnections: [],
    recentPosts: [],
    userPosts: [],
    engagedPosts: [],
    recentActivity: (profile.recentActivity || []).map(activity => ({
      preview: activity.preview,
      type: activity.type,
      url: activity.url,
      timestamp: new Date(activity.timestamp).toISOString(),
    })),
    scrapedAt: new Date().toISOString(),
  };

  // 3. Detect warm path
  const descriptor = await detectWarmPathForConnection(profileUrl, linkedInProfile);
  if (!descriptor) {
    console.log('[Uproot] No warm path detected');
    return;
  }

  // 4. Check deduplication
  const shouldCreate = await shouldCreateWarmPathItem(
    descriptor.targetCompanyUrl,
    descriptor.viaPersonProfileUrl,
    descriptor.pathLength
  );

  if (!shouldCreate) {
    console.log('[Uproot] Warm path is duplicate, skipping');
    return;
  }

  // 5. Generate feed item
  await generateWarmPathFeedItem(descriptor);
  console.log(`[Uproot] Warm path opened: ${personName} → ${descriptor.targetCompany}`);
}
