/**
 * Custom hook for AccountSettings logic
 */

import { useState, useCallback, useEffect } from 'react';
import { useSettingsStore } from '../../../../stores/settings';
import { useAuthStore } from '../../../../stores/auth';
import type { Theme } from '../../../../types';
import type { StorageUsage } from './types';

export function useAccountSettings() {
  // Privacy settings removed from UI but store integration kept for backwards compatibility
  const theme = useSettingsStore((state) => state.theme);
  const updateTheme = useSettingsStore((state) => state.updateTheme);
  const user = useAuthStore((state) => state.user);
  const isElite = user?.subscriptionTier === 'elite';

  // Local state
  const [localTheme, setLocalTheme] = useState<Theme>(theme);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string>('');
  const [storageUsage, setStorageUsage] = useState<StorageUsage>({
    used: 0,
    total: 0,
  });
  const [extensionVersion, setExtensionVersion] = useState<string>('');

  // Load extension info and storage usage
  useEffect(() => {
    loadExtensionInfo();
    loadStorageUsage();
  }, []);

  // Sync local state with store
  useEffect(() => {
    setLocalTheme(theme);
  }, [theme]);

  // Check for unsaved changes (excluding real-time updates)
  useEffect(() => {
    // Compare theme without real-time fields since they update immediately
    const localThemeWithoutRealtime = {
      ...localTheme,
      blurIntensity: theme.blurIntensity,
      accentColor: theme.accentColor,
    };
    const themeChanges = JSON.stringify(localThemeWithoutRealtime) !== JSON.stringify(theme);

    setHasUnsavedChanges(themeChanges);
  }, [localTheme, theme]);

  const loadExtensionInfo = () => {
    const version = chrome.runtime.getManifest().version;
    setExtensionVersion(version);
  };

  const loadStorageUsage = async () => {
    try {
      const usage = await chrome.storage.local.getBytesInUse();
      const total = chrome.storage.local.QUOTA_BYTES || 5242880; // 5MB default
      setStorageUsage({ used: usage, total });
    } catch (error) {
      console.error('[useAccountSettings] Error loading storage usage:', error);
    }
  };

  // Save & discard handlers
  const handleSave = useCallback(async () => {
    try {
      await updateTheme(localTheme);
      setSaveMessage(' Settings saved successfully!');
      setHasUnsavedChanges(false);

      setTimeout(() => setSaveMessage(''), 3000);
    } catch (error) {
      console.error('[useAccountSettings] Error saving settings:', error);
      setSaveMessage(' Failed to save settings. Please try again.');
      setTimeout(() => setSaveMessage(''), 3000);
    }
  }, [localTheme, updateTheme]);

  const handleDiscard = useCallback(() => {
    setLocalTheme(theme);
    setHasUnsavedChanges(false);
    setSaveMessage('');
  }, [theme]);

  // Data management handlers
  const handleExportData = useCallback(async () => {
    try {
      const allData = await chrome.storage.local.get(null);
      const dataStr = JSON.stringify(allData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);

      const link = document.createElement('a');
      link.href = url;
      link.download = `uproot-data-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setSaveMessage(' Data exported successfully!');
      setTimeout(() => setSaveMessage(''), 3000);
    } catch (error) {
      console.error('[useAccountSettings] Error exporting data:', error);
      setSaveMessage(' Failed to export data.');
      setTimeout(() => setSaveMessage(''), 3000);
    }
  }, []);

  const handleClearAllData = useCallback(async () => {
    const confirmed = window.confirm(
      '� WARNING: This will delete ALL your data including:\n\n' +
        '" Professional profile\n' +
        '" Job analyses\n' +
        '" Generated resumes\n' +
        '" Watchlists\n' +
        '" Feed items\n' +
        '" Settings\n\n' +
        'This action CANNOT be undone!\n\n' +
        'Are you absolutely sure you want to continue?'
    );

    if (!confirmed) return;

    const doubleConfirm = window.confirm(
      'This is your last chance!\n\n' +
        'Type "DELETE" in the next prompt to confirm deletion.'
    );

    if (!doubleConfirm) return;

    const userInput = window.prompt('Type DELETE to confirm:');

    if (userInput !== 'DELETE') {
      alert('Deletion cancelled - input did not match.');
      return;
    }

    try {
      await chrome.storage.local.clear();
      setSaveMessage(' All data cleared successfully!');
      setTimeout(() => {
        setSaveMessage('');
        window.location.reload();
      }, 2000);
    } catch (error) {
      console.error('[useAccountSettings] Error clearing data:', error);
      setSaveMessage(' Failed to clear data.');
      setTimeout(() => setSaveMessage(''), 3000);
    }
  }, []);

  // Theme reset handler
  const handleResetTheme = useCallback(async () => {
    const confirmed = window.confirm(
      'Reset theme to default settings?\n\n' +
        'This will revert all color and blur customizations.'
    );

    if (!confirmed) return;

    try {
      const defaultTheme: Theme = {
        mode: 'system',
        accentColor: '#0A66C2',
        blurIntensity: 10,
        curvePreset: 'moderate',
      };
      await updateTheme(defaultTheme);
      setLocalTheme(defaultTheme);
      setSaveMessage(' Theme reset to defaults!');
      setTimeout(() => setSaveMessage(''), 3000);
    } catch (error) {
      console.error('[useAccountSettings] Error resetting theme:', error);
      setSaveMessage(' Failed to reset theme.');
      setTimeout(() => setSaveMessage(''), 3000);
    }
  }, [updateTheme]);

  // Reset all settings handler
  const handleResetAllSettings = useCallback(async () => {
    const resetSettings = useSettingsStore.getState().resetSettings;

    try {
      await resetSettings();
      setSaveMessage(' Settings reset to defaults!');

      // Reload storage usage
      await loadStorageUsage();

      setTimeout(() => setSaveMessage(''), 3000);
    } catch (error) {
      console.error('[useAccountSettings] Error resetting settings:', error);
      setSaveMessage(' Failed to reset settings.');
      setTimeout(() => setSaveMessage(''), 3000);
    }
  }, []);

  return {
    // State
    theme,
    hasUnsavedChanges,
    saveMessage,
    storageUsage,
    extensionVersion,
    isElite,
    // Save/discard handlers
    handleSave,
    handleDiscard,
    // Data handlers
    handleExportData,
    handleClearAllData,
    // Theme handlers
    handleResetTheme,
    updateTheme,
    // Reset handlers
    handleResetAllSettings,
  };
}
