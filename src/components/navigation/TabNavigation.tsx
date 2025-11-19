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

// Tab content components (stubs for now - will be built next)
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

  // TODO: Get isFirstRun from storage
  const isFirstRun = false;

  // Get visible tabs based on page context
  const visibleTabs = useMemo(() => {
    return getVisibleTabs(pageContext.type, isFirstRun);
  }, [pageContext.type, isFirstRun]);

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
        {/* Render placeholder for now - actual tab components coming next */}
        <TabPlaceholder title={activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} />
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
          gap: isCompact ? '2px' : '4px',
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
          />
        ))}
      </div>
    </div>
  );
}
