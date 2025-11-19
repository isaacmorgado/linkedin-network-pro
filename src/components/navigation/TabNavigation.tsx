/**
 * Tab Navigation Component - Simplified 6+2+1 Structure
 * Apple-inspired bottom tab bar with context-sensitive tabs
 */

import React, { useEffect, useMemo } from 'react';
import type { TabId } from '../../types/navigation';
import { TabButton } from './TabButton';
import { usePageContext } from '../../hooks/usePageContext';
import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts';
import { useBadgeCounts } from '../../hooks/useBadgeCounts';
import { TAB_CONFIGS, getVisibleTabs } from '../../config/tabs';
import { ProfileTab } from '../tabs/ProfileTab';
import { CompanyTab } from '../tabs/CompanyTab';
import { WatchlistTab } from '../tabs/WatchlistTab';
import { OnboardingTab } from '../tabs/OnboardingTab';
import { SettingsTab } from '../tabs/SettingsTab';
import { FeedTab } from '../tabs/FeedTab';
import { ResumeTab } from '../tabs/ResumeTab';

// Tab content props interface
interface TabContentProps {
  panelWidth?: number;
}

// Tab content components
const TabContent: Record<string, React.ComponentType<TabContentProps>> = {
  feed: FeedTab,
  profile: ProfileTab,
  company: CompanyTab,
  watchlist: WatchlistTab,
  resume: ResumeTab,
  onboarding: OnboardingTab,
  settings: SettingsTab,
  // Other tabs will use placeholder for now
};

const TabPlaceholder = ({ title }: { title: string }) => (
  <div style={{
    padding: '24px',
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
  }}>
    <h3 style={{
      fontSize: '18px',
      fontWeight: '600',
      margin: '0 0 8px 0',
      color: '#1d1d1f',
    }}>
      {title}
    </h3>
    <p style={{
      fontSize: '14px',
      color: '#6e6e73',
      margin: 0,
    }}>
      Coming soon...
    </p>
  </div>
);

interface TabNavigationProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
  panelWidth?: number;
}

export function TabNavigation({ activeTab, onTabChange, panelWidth = 400 }: TabNavigationProps) {
  const pageContext = usePageContext();
  const { getCountForTab } = useBadgeCounts();
  const [isFirstRun, setIsFirstRun] = React.useState(false);

  // Check onboarding status on mount
  useEffect(() => {
    async function checkOnboarding() {
      const { isOnboardingComplete } = await import('../../utils/storage');
      const completed = await isOnboardingComplete();
      setIsFirstRun(!completed);
    }
    checkOnboarding();
  }, []);

  // Get visible tabs based on page context
  const visibleTabs = useMemo(() => {
    const tabs = getVisibleTabs(pageContext.type, isFirstRun);
    console.log('[Uproot] Visible tabs:', {
      pageType: pageContext.type,
      isProfilePage: pageContext.isProfilePage,
      tabIds: tabs.map(t => t.id),
    });
    return tabs;
  }, [pageContext.type, isFirstRun, pageContext.isProfilePage]);

  // Add badge counts to tabs
  const tabsWithBadges = useMemo(() => {
    return visibleTabs.map((tab) => ({
      ...tab,
      badgeCount: getCountForTab(tab.id),
    }));
  }, [visibleTabs, getCountForTab]);

  // Enable keyboard shortcuts
  useKeyboardShortcuts({
    activeTab,
    visibleTabs: tabsWithBadges.map((t) => t.id),
    onTabChange,
    enabled: true,
  });

  // Auto-switch away from hidden tabs
  useEffect(() => {
    const isActiveTabVisible = tabsWithBadges.some((tab) => tab.id === activeTab);
    if (!isActiveTabVisible && tabsWithBadges.length > 0) {
      // Switch to first visible tab (usually Feed)
      onTabChange(tabsWithBadges[0].id);
    }
  }, [activeTab, tabsWithBadges, onTabChange]);

  // Determine if we should use compact mode
  const isCompact = panelWidth < 400;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        width: '100%',
      }}
    >
      {/* Tab Content Area */}
      <div
        role="tabpanel"
        id={`panel-${activeTab}`}
        aria-labelledby={`tab-${activeTab}`}
        style={{
          flex: 1,
          overflow: 'auto',
          backgroundColor: '#FFFFFF',
        }}
      >
        {/* Render actual tab component or placeholder */}
        {TabContent[activeTab] ? (
          React.createElement(TabContent[activeTab], { panelWidth })
        ) : (
          <TabPlaceholder title={activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} />
        )}
      </div>

      {/* Bottom Tab Bar - Apple Style */}
      <div
        role="tablist"
        aria-label="Main navigation"
        aria-orientation="horizontal"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-around',
          gap: isCompact ? '2px' : tabsWithBadges.length >= 7 ? '2px' : '4px',
          padding: '8px',
          borderTop: '1px solid rgba(0, 0, 0, 0.08)',
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          minHeight: '60px',
          position: 'relative',
        }}
      >
        {tabsWithBadges.map((tab) => (
          <TabButton
            key={tab.id}
            tab={tab}
            isActive={activeTab === tab.id}
            onClick={() => onTabChange(tab.id)}
            badgeCount={tab.badgeCount}
            compact={isCompact}
            totalVisibleTabs={tabsWithBadges.length}
          />
        ))}
      </div>
    </div>
  );
}
