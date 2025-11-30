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
  | 'recommendation'      // AI recommendation
  | 'deadline_alert'      // Deadline or aging alert for saved jobs/applications
  | 'hiring_heat'         // Company ramping up hiring activity
  | 'warm_path_opened';   // New warm connection path into a watchlisted company

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

  // Person insight specific (V1)
  insightType?: 'job_change' | 'new_activity' | 'unknown';
  newCompany?: string;
  newRole?: string;
  isTargetCompany?: boolean; // True if newCompany is in watchlist

  // Connection update specific
  connectionName?: string;
  connectionUpdate?: string;

  // Deadline alert specific (V1)
  alertType?: 'saved_not_applied' | 'application_deadline' | 'no_follow_up';
  urgency?: 'medium' | 'high';
  daysSinceAction?: number; // Days since saved/applied/last contact
  daysUntilDeadline?: number; // Days remaining (negative if overdue)
  lastActionDate?: number; // Timestamp
  lastActionType?: 'saved' | 'applied' | 'screening' | 'interview';
  applicationId?: string; // Reference to Application object if exists
  savedJobId?: string; // Reference to SavedJob if exists

  // Hiring heat specific (V1)
  jobCount?: number; // Number of new jobs in detection window
  detectionWindow?: number; // Days (e.g., 7)
  heatLevel?: 'warming' | 'hot' | 'very_hot';
  topJobTitles?: string[]; // Up to 3 most relevant job titles
  internshipCount?: number; // Count of intern/junior roles

  // Warm path specific (V1)
  warmPath?: {
    targetCompany: string;              // "Anthropic"
    targetCompanyUrl: string;           // "https://linkedin.com/company/anthropic"
    targetCompanyLogo?: string;
    viaPersonName: string;              // "Sarah Chen"
    viaPersonProfileUrl: string;        // "https://linkedin.com/in/sarachen"
    viaPersonImage?: string;
    viaPersonTitle?: string;            // "Senior Engineer at Anthropic"
    pathLength: 1 | 2;                  // Direct colleague (1) or 2-hop bridge (2)

    // For path length 2 only
    bridgeToName?: string;              // "John Doe" (person at target company)
    bridgeToProfileUrl?: string;        // Their profile URL
    bridgeToTitle?: string;             // "Engineering Manager at Anthropic"
  };

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
  warmPaths: number;
}

// Storage key
export const FEED_STORAGE_KEY = 'uproot_feed';
