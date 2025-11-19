/**
 * Tab Navigation Component (Stub - Phase 3)
 */

import React from 'react';
import { User, BookmarkIcon, Briefcase, Activity, Bell, Settings } from 'lucide-react';

interface TabNavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export function TabNavigation({ activeTab, onTabChange }: TabNavigationProps) {
  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'watchlist', label: 'Watchlist', icon: BookmarkIcon },
    { id: 'jobs', label: 'Jobs', icon: Briefcase },
    { id: 'feed', label: 'Feed', icon: Activity },
    { id: 'notifications', label: 'Alerts', icon: Bell },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="flex border-b border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;

        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`
              flex-1 flex flex-col items-center gap-1 py-3 px-2
              transition-colors relative
              ${isActive
                ? 'text-blue-600 dark:text-blue-400'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }
            `}
          >
            <Icon className="w-5 h-5" />
            <span className="text-xs font-medium">{tab.label}</span>
            {isActive && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-400" />
            )}
          </button>
        );
      })}
    </div>
  );
}
