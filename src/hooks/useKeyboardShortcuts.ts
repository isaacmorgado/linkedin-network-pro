/**
 * Keyboard Shortcuts Hook
 * Provides power user navigation via keyboard
 *
 * Windows/Linux: Alt+1-6
 * Mac: Ctrl+1-6
 */

import { useEffect } from 'react';
import type { TabId } from '../types/navigation';
import { TAB_CONFIGS } from '../config/tabs';

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
      const key = event.key.toLowerCase();

      // Check for Alt (Windows/Linux) or Ctrl (Mac)
      // Windows/Linux: Alt+1-6
      // Mac: Ctrl+1-6
      const isShortcutModifier = event.altKey || event.ctrlKey;

      if (!isShortcutModifier) return;

      // Check if key is a number 1-9
      const shortcutNumber = parseInt(key);
      if (isNaN(shortcutNumber) || shortcutNumber < 1 || shortcutNumber > 9) return;

      // Find visible tab with this shortcut number
      const matchingTab = TAB_CONFIGS.find(
        (tab) => tab.shortcut === shortcutNumber && visibleTabs.includes(tab.id)
      );

      if (matchingTab) {
        // Prevent default browser behavior (e.g., focus search bar)
        event.preventDefault();
        event.stopPropagation();

        // Blur any focused element (input/textarea) to prevent focus trap
        const activeElement = document.activeElement as HTMLElement;
        if (activeElement && typeof activeElement.blur === 'function') {
          activeElement.blur();
        }

        // Switch to the selected tab
        onTabChange(matchingTab.id);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeTab, visibleTabs, onTabChange, enabled]);
}
