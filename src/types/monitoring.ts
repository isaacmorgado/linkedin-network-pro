/**
 * Watchlist Monitoring Type Definitions
 * For tracking changes and generating feed items
 */

import type { ExperienceLevel, WorkLocationType } from './onboarding';

// ============================================================================
// JOB MONITORING
// ============================================================================

export interface LinkedInJob {
  id: string;
  title: string;
  company: string;
  companyUrl: string;
  location: string;
  workLocation?: WorkLocationType;
  experienceLevel?: ExperienceLevel;
  postedDate: string; // LinkedIn's format: "2 days ago", "1 week ago"
  postedTimestamp: number; // Estimated timestamp
  jobUrl: string;
  description?: string;
  applicantCount?: string; // "50 applicants", "Be among the first 25 applicants"
  isEasyApply?: boolean;
}

export interface JobSnapshot {
  companyId: string; // Company watchlist ID
  lastChecked: number;
  jobs: LinkedInJob[];
}

// ============================================================================
// PERSON MONITORING
// ============================================================================

export interface LinkedInPersonProfile {
  profileUrl: string;
  name: string;
  headline: string;
  currentRole: {
    title: string;
    company: string;
    companyUrl?: string;
    startDate?: string; // "Jan 2024"
  };
  location: string;
  photoUrl?: string;
  recentActivity?: {
    type: 'post' | 'article' | 'comment';
    timestamp: number;
    url: string;
    preview: string;
  }[];
}

export interface PersonSnapshot {
  personId: string; // Person watchlist ID
  lastChecked: number;
  profile: LinkedInPersonProfile;
}

// ============================================================================
// COMPANY MONITORING
// ============================================================================

export interface LinkedInCompanyUpdate {
  id: string;
  type: 'post' | 'article' | 'event' | 'hiring';
  timestamp: number;
  url: string;
  preview: string;
  imageUrl?: string;
}

export interface CompanySnapshot {
  companyId: string; // Company watchlist ID
  lastChecked: number;
  updates: LinkedInCompanyUpdate[];
}

// ============================================================================
// MONITORING EVENTS
// ============================================================================

export type MonitoringEventType =
  | 'new_job'           // New job posted by watchlisted company
  | 'job_closed'        // Job removed/closed
  | 'role_change'       // Person changed jobs
  | 'promotion'         // Person got promoted (same company, new title)
  | 'company_post'      // Company posted update
  | 'person_activity'   // Person posted/commented
  | 'connection_update'; // Someone in connection path changed role

export interface MonitoringEvent {
  id: string;
  type: MonitoringEventType;
  timestamp: number;
  sourceId: string; // Watchlist item ID that triggered this
  data: any; // Type-specific data
}

// ============================================================================
// MATCH SCORING
// ============================================================================

export interface JobMatchCriteria {
  jobTitles: string[];
  experienceLevel: ExperienceLevel[];
  workLocation: WorkLocationType[];
  locations: string[];
  industries: string[];
}

export interface JobMatchResult {
  score: number; // 0-100
  matches: {
    title: boolean;
    experienceLevel: boolean;
    workLocation: boolean;
    location: boolean;
  };
  reasons: string[]; // Why this is a good match
}

// ============================================================================
// STORAGE KEYS
// ============================================================================

export const JOB_SNAPSHOTS_KEY = 'uproot_job_snapshots';
export const PERSON_SNAPSHOTS_KEY = 'uproot_person_snapshots';
export const COMPANY_SNAPSHOTS_KEY = 'uproot_company_snapshots';
export const MONITORING_EVENTS_KEY = 'uproot_monitoring_events';
