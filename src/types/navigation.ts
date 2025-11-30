/**
 * Tab Navigation Type Definitions - Simplified Structure
 *
 * 4 core tabs (always visible) + 3 context-sensitive + 1 special
 */

import type { LucideIcon } from 'lucide-react';

// Simplified Tab IDs
export type TabId =
  // Always visible (4 core tabs)
  | 'feed'          // Activity feed (includes all notifications/alerts)
  | 'watchlist'     // Saved people/companies/paths
  | 'resume'        // Resume editor
  | 'settings'      // Preferences
  // Context-sensitive (3 tabs)
  | 'profile'       // Only on person pages
  | 'company'       // Only on company pages
  | 'jobs'          // Only on job pages
  // Special (1 tab)
  | 'onboarding'    // First-run only
  // Tool tabs (accessed from main tabs)
  | 'profile-builder'     // Profile builder tool
  | 'job-analyzer'        // Job description analyzer
  | 'resume-generator'    // AI resume generator
  | 'cover-letter';       // AI cover letter generator

export type PageContextType =
  | 'unknown'
  | 'feed'
  | 'profile'
  | 'job'
  | 'company'
  | 'messaging'
  | 'network';

export interface PageContext {
  type: PageContextType;
  isProfilePage: boolean;
  isJobPage: boolean;
  profileData?: {
    name: string;
    headline: string;
    profileUrl: string;
    profileImage?: string | null;
    publicId?: string;
  } | null;
  jobData?: {
    title: string;
    company: string;
    jobUrl: string;
  } | null;
  companyData?: {
    name: string;
    industry?: string;
    companyUrl: string;
    companyLogo?: string | null;
    followerCount?: string;
    employeeCount?: string;
  } | null;
}

export interface TabConfig {
  id: TabId;
  label: string;
  icon: LucideIcon;
  shortcut?: number;           // Alt+[number] keyboard shortcut
  alwaysVisible: boolean;      // Always show or context-sensitive?
  visibleOn?: PageContextType[]; // If context-sensitive, show on these pages
  badge?: boolean;             // Can show badge count?
  badgeColor?: 'red' | 'orange' | 'blue' | 'green'; // Badge color
}

export interface NavigationState {
  activeTab: TabId;
  visibleTabs: TabId[];
  pageContext: PageContext;
  isFirstRun: boolean;
}

// Badge counts for tabs that support badges
export interface BadgeCounts {
  feed: number;
  watchlist: number;
}

// Component props
export interface TabButtonProps {
  tab: TabConfig;
  isActive: boolean;
  onClick: () => void;
  badgeCount?: number;
  compact?: boolean; // For small panel widths
  totalVisibleTabs?: number; // Total number of visible tabs (for sizing)
}

export interface TabBadgeProps {
  count: number;
  color?: 'red' | 'orange' | 'blue' | 'green';
}
