/**
 * Tab Configuration - Simplified 5+3+1 Structure
 *
 * Defines all tabs, their properties, and visibility rules
 */

import {
  Activity,
  BookmarkCheck,
  Search,
  FileText,

  Settings2,
  UserCircle,
  Building2,
  Briefcase,
  Rocket,
} from 'lucide-react';
import type { TabConfig } from '../types/navigation';

export const TAB_CONFIGS: TabConfig[] = [
  // ========================================
  // ALWAYS VISIBLE (5 core tabs)
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
    id: 'search',
    label: 'Search',
    icon: Search,
    shortcut: 2,
    alwaysVisible: true,
    badge: false,
  },

  {
    id: 'watchlist',
    label: 'Watchlist',
    icon: BookmarkCheck,
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
    id: 'jobs',
    label: 'Jobs',
    icon: Briefcase,
    shortcut: 5,
    alwaysVisible: false,
    visibleOn: ['job'], // Only on LinkedIn job pages
    badge: true, // Show count of analyzed jobs
    badgeColor: 'blue',
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
  // CONTEXT-SENSITIVE (3 tabs)
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
    id: 'company',
    label: 'Company',
    icon: Building2,
    shortcut: 8,
    alwaysVisible: false,
    visibleOn: ['company'], // Only on company pages
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
  console.log('[Uproot] getVisibleTabs called with:', { pageContextType, isFirstRun });

  // If first run, ONLY show onboarding tab
  if (isFirstRun) {
    const onboardingTab = TAB_CONFIGS.find((tab) => tab.id === 'onboarding');
    if (onboardingTab) {
      console.log('[Uproot] First run - showing ONLY onboarding tab');
      return [onboardingTab];
    }
  }

  const visibleTabs = TAB_CONFIGS.filter((tab) => {
    // Hide onboarding after first run
    if (tab.id === 'onboarding') {
      console.log(`[Uproot] Tab "${tab.id}": HIDDEN (not first run)`);
      return false;
    }

    // Always visible tabs
    if (tab.alwaysVisible) {
      console.log(`[Uproot] Tab "${tab.id}": VISIBLE (always visible)`);
      return true;
    }

    // Context-sensitive tabs
    if (tab.visibleOn) {
      const shouldShow = tab.visibleOn.includes(pageContextType as any);
      console.log(`[Uproot] Tab "${tab.id}": ${shouldShow ? 'VISIBLE' : 'HIDDEN'} (visibleOn: ${JSON.stringify(tab.visibleOn)}, current: ${pageContextType})`);
      return shouldShow;
    }

    console.log(`[Uproot] Tab "${tab.id}": HIDDEN (no visibility rules)`);
    return false;
  });

  console.log('[Uproot] Final visible tabs:', visibleTabs.map(t => t.id));
  return visibleTabs;
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
