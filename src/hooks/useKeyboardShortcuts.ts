/**
 * Keyboard Shortcuts Hook
 * Provides power user navigation via keyboard
 */

import { useEffect } from 'react';
import type { TabId } from '../types/navigation';

interface KeyboardShortcutConfig {
  [key: string]: TabId | 'nextTab' | 'prevTab';
}

const SHORTCUTS: KeyboardShortcutConfig = {
  'alt+1': 'feed',
  'alt+2': 'watchlist',
  'alt+3': 'resume',
  'alt+4': 'settings',
  'alt+5': 'profile',      // Context-sensitive
  'alt+6': 'company',      // Context-sensitive
  'alt+7': 'jobs',         // Context-sensitive
  'alt+8': 'onboarding',   // First-run only
};

interface UseKeyboardShortcutsProps {
  activeTab: TabId;
  visibleTabs: TabId[];
  onTabChange: (tab: TabId) => void;
  enabled?: boolean;
}

export function useKeyboardShortcuts({
  activeTab,
  visibleTabs,
  onTabChange,
  enabled = true,
}: UseKeyboardShortcutsProps) {
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      // Don't trigger if user is typing in input/textarea
      const target = event.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return;
      }

      const key = event.key.toLowerCase();
      const modifiers = {
        alt: event.altKey,
        ctrl: event.ctrlKey,
        shift: event.shiftKey,
        meta: event.metaKey,
      };

      // Build shortcut string (e.g., "alt+1")
      const shortcutParts: string[] = [];
      if (modifiers.alt) shortcutParts.push('alt');
      if (modifiers.ctrl) shortcutParts.push('ctrl');
      if (modifiers.shift) shortcutParts.push('shift');
      if (modifiers.meta) shortcutParts.push('meta');
      shortcutParts.push(key);

      const shortcut = shortcutParts.join('+');

      // Check if this shortcut is mapped
      const action = SHORTCUTS[shortcut];

      if (action) {
        event.preventDefault();

        if (action === 'nextTab') {
          const currentIndex = visibleTabs.indexOf(activeTab);
          const nextIndex = (currentIndex + 1) % visibleTabs.length;
          onTabChange(visibleTabs[nextIndex]);
        } else if (action === 'prevTab') {
          const currentIndex = visibleTabs.indexOf(activeTab);
          const prevIndex = (currentIndex - 1 + visibleTabs.length) % visibleTabs.length;
          onTabChange(visibleTabs[prevIndex]);
        } else {
          // Direct tab navigation
          const tabId = action as TabId;
          if (visibleTabs.includes(tabId)) {
            onTabChange(tabId);
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeTab, visibleTabs, onTabChange, enabled]);

  return SHORTCUTS;
}
