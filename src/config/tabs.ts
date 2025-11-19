/**
 * Tab Configuration - Simplified 6+2+1 Structure
 *
 * Defines all tabs, their properties, and visibility rules
 */

import {
  Activity,
  BookmarkCheck,
  GitBranch,
  FileText,
  Bell,
  Settings2,
  UserCircle,
  Briefcase,
  Rocket,
} from 'lucide-react';
import type { TabConfig } from '../types/navigation';

export const TAB_CONFIGS: TabConfig[] = [
  // ========================================
  // ALWAYS VISIBLE (6 core tabs)
  // ========================================

  {
    id: 'feed',
    label: 'Feed',
    icon: Activity,
    shortcut: 1,
    alwaysVisible: true,
    badge: true,
    badgeColor: 'orange',
  },

  {
    id: 'watchlist',
    label: 'Watchlist',
    icon: BookmarkCheck,
    shortcut: 2,
    alwaysVisible: true,
    badge: true,
    badgeColor: 'blue',
  },

  {
    id: 'network',
    label: 'Network',
    icon: GitBranch,
    shortcut: 3,
    alwaysVisible: true,
    badge: false,
  },

  {
    id: 'resume',
    label: 'Resume',
    icon: FileText,
    shortcut: 4,
    alwaysVisible: true,
    badge: false,
  },

  {
    id: 'notifications',
    label: 'Alerts',
    icon: Bell,
    shortcut: 5,
    alwaysVisible: true,
    badge: true,
    badgeColor: 'red',
  },

  {
    id: 'settings',
    label: 'Settings',
    icon: Settings2,
    shortcut: 6,
    alwaysVisible: true,
    badge: false,
  },

  // ========================================
  // CONTEXT-SENSITIVE (2 tabs)
  // ========================================

  {
    id: 'profile',
    label: 'Profile',
    icon: UserCircle,
    shortcut: 7,
    alwaysVisible: false,
    visibleOn: ['profile'], // Only on person pages
    badge: false,
  },

  {
    id: 'jobs',
    label: 'Jobs',
    icon: Briefcase,
    shortcut: 8,
    alwaysVisible: false,
    visibleOn: ['job'], // Only on job pages
    badge: false,
  },

  // ========================================
  // SPECIAL (1 tab - first-run only)
  // ========================================

  {
    id: 'onboarding',
    label: 'Get Started',
    icon: Rocket,
    shortcut: 9,
    alwaysVisible: false, // Only shown on first run
    badge: false,
  },
];

// Helper: Get visible tabs based on page context and first-run state
export function getVisibleTabs(
  pageContextType: string,
  isFirstRun: boolean
): TabConfig[] {
  return TAB_CONFIGS.filter((tab) => {
    // Special case: onboarding only on first run
    if (tab.id === 'onboarding') {
      return isFirstRun;
    }

    // Always visible tabs
    if (tab.alwaysVisible) {
      return true;
    }

    // Context-sensitive tabs
    if (tab.visibleOn) {
      return tab.visibleOn.includes(pageContextType as any);
    }

    return false;
  });
}

// Helper: Get tab by ID
export function getTabById(id: string): TabConfig | undefined {
  return TAB_CONFIGS.find((tab) => tab.id === id);
}

// Helper: Get tab keyboard shortcut map
export function getShortcutMap(): Record<number, string> {
  const map: Record<number, string> = {};
  TAB_CONFIGS.forEach((tab) => {
    if (tab.shortcut) {
      map[tab.shortcut] = tab.id;
    }
  });
  return map;
}
