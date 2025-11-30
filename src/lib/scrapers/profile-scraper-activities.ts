/**
 * Profile Scraper - Activity Processing
 * Handles activity and engagement data extraction
 */

import type { LinkedInProfile } from '@/types';
import type { ActivityEvent } from '@/types/network';
import { scrapeProfileActivitySafe } from './activity-scraper';

/**
 * Process activity data and extract user posts and engaged posts
 */
export async function processActivityData(
  profileData: Partial<LinkedInProfile>,
  activities: ActivityEvent[]
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
    .map(event => ({
      content: event.content || '',
      timestamp: event.timestamp,
      likes: 0,
      comments: 0,
    }));

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
 * Scrape activity data for a profile
 */
export async function scrapeActivityForProfile(
  profileUrl: string,
  // @ts-expect-error - Parameter required by interface but not used in implementation
  profileId?: string
): Promise<ActivityEvent[]> {
  console.log('[ProfileScraper] Scraping activity data (rate-limited)...');
  const activities = await scrapeProfileActivitySafe(profileUrl);
  console.log(`[ProfileScraper] Found ${activities.length} activities`);
  return activities;
}
