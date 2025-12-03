/**
 * Profile Scraper - Activity Processing
 * Handles activity and engagement data extraction
 */

import type { LinkedInProfile } from '@/types';
import type { ActivityEvent } from '@/types/network';
import { scrapeProfileActivityWithMetrics } from './activity-scraper';
import { rateLimiter } from '@/lib/rate-limiter';

/**
 * Process activity data and extract user posts and engaged posts
 * Now uses real engagement metrics instead of hardcoded 0s
 */
export async function processActivityData(
  profileData: Partial<LinkedInProfile>,
  activities: ActivityEvent[],
  engagementMetrics?: Map<string, { likes: number; comments: number }>
): Promise<{
  userPosts: Array<{ content: string; timestamp: string; likes: number; comments: number }>;
  engagedPosts: Array<{
    authorId: string;
    authorName: string;
    topic: string;
    timestamp: string;
    engagementType: 'comment' | 'reaction' | 'share';
  }>;
}> {
  // Extract user's own posts
  const userPosts = activities
    .filter(event => event.type === 'post' && event.actorId === profileData.id)
    .map(event => {
      // Get real engagement metrics from map if available
      const metrics = event.postId && engagementMetrics?.get(event.postId);
      return {
        content: event.content || '',
        timestamp: event.timestamp,
        likes: (metrics && typeof metrics === 'object') ? metrics.likes : 0,
        comments: (metrics && typeof metrics === 'object') ? metrics.comments : 0,
      };
    });

  // Extract posts the user has engaged with
  const engagedPosts = activities
    .filter(event =>
      event.actorId === profileData.id &&
      event.targetId !== profileData.id &&
      ['comment', 'reaction', 'share'].includes(event.type)
    )
    .map(event => ({
      authorId: event.targetId,
      authorName: '',
      topic: event.content || '',
      timestamp: event.timestamp,
      engagementType: event.type as 'comment' | 'reaction' | 'share',
    }));

  return { userPosts, engagedPosts };
}

/**
 * Scrape activity data for a profile with engagement metrics
 * Returns both activities and engagement metrics for use in processActivityData
 */
export async function scrapeActivityForProfile(
  profileUrl: string,
  // @ts-expect-error - Parameter required by interface but not used in implementation
  profileId?: string
): Promise<{
  activities: ActivityEvent[];
  engagementMetrics: Map<string, { likes: number; comments: number }>;
}> {
  console.log('[ProfileScraper] Scraping activity data with engagement metrics (rate-limited)...');

  const result = await rateLimiter.enqueue(() => scrapeProfileActivityWithMetrics(profileUrl));

  console.log(`[ProfileScraper] Found ${result.activities.length} activities with ${result.engagementMetrics.size} engagement metrics`);
  return result;
}
