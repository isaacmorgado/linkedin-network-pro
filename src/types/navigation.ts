/**
 * Tab Navigation Type Definitions - Simplified Structure
 *
 * 6 core tabs (always visible) + 2 context-sensitive + 1 special
 */

import type { LucideIcon } from 'lucide-react';

// Simplified Tab IDs
export type TabId =
  // Always visible (6 core tabs)
  | 'feed'          // Activity feed
  | 'watchlist'     // Saved people/companies
  | 'network'       // Path finder (was networkPath)
  | 'resume'        // Resume editor
  | 'notifications' // Alerts
  | 'settings'      // Preferences
  // Context-sensitive (2 tabs)
  | 'profile'       // Only on person pages
  | 'jobs'          // Only on job pages
  // Special (1 tab)
  | 'onboarding';   // First-run only

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
  } | null;
  jobData?: {
    title: string;
    company: string;
    jobUrl: string;
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
  notifications: number;
  watchlist: number;
  feed: number;
}

// Component props
export interface TabButtonProps {
  tab: TabConfig;
  isActive: boolean;
  onClick: () => void;
  badgeCount?: number;
  compact?: boolean; // For small panel widths
}

export interface TabBadgeProps {
  count: number;
  color?: 'red' | 'orange' | 'blue' | 'green';
}
