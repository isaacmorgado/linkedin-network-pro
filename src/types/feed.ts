/**
 * Feed Type Definitions
 * For activity feed and notifications
 */

export type FeedItemType =
  | 'job_alert'           // New job from watchlist company
  | 'company_update'      // Company posted something
  | 'person_update'       // Person in watchlist changed job/posted
  | 'connection_update'   // Someone in connection path got promoted/changed job
  | 'application_status'  // Application status changed
  | 'recommendation';     // AI recommendation

export interface FeedItem {
  id: string;
  type: FeedItemType;
  timestamp: number;
  read: boolean;

  // Job alert specific
  jobTitle?: string;
  company?: string;
  companyLogo?: string;
  location?: string;
  jobUrl?: string;
  matchScore?: number; // 0-100 based on preferences

  // Person/Company update specific
  personName?: string;
  personTitle?: string;
  personUrl?: string;
  personImage?: string;
  updateText?: string;

  // Connection update specific
  connectionName?: string;
  connectionUpdate?: string;

  // General
  title: string;
  description: string;
  actionUrl?: string;
  actionLabel?: string;
}

export interface FeedStats {
  totalItems: number;
  unreadCount: number;
  jobAlerts: number;
  companyUpdates: number;
  connectionUpdates: number;
}

// Storage key
export const FEED_STORAGE_KEY = 'uproot_feed';
