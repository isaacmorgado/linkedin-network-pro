/**
 * Account Settings Component (Refactored Main Orchestrator)
 *
 * Manages user account information, privacy settings, and data management
 */

import { useAccountSettings } from './useAccountSettings';
import { SaveBar } from './SaveBar';
import { ExtensionInfo } from './ExtensionInfo';
import { DesignCustomization } from './DesignCustomization';
// Privacy & Security section removed per user request
import { DataManagement } from './DataManagement';
import { StorageSyncStatus } from '../StorageSyncStatus';
import { ResetSettings } from './ResetSettings';
import { LegalSupport } from './LegalSupport';
import type { AccountSettingsProps } from './types';

export function AccountSettings({ panelWidth = 400 }: AccountSettingsProps) {
  const {
    theme,
    hasUnsavedChanges,
    saveMessage,
    storageUsage,
    extensionVersion,
    isElite,
    handleSave,
    handleDiscard,
    handleExportData,
    handleClearAllData,
    handleResetTheme,
    handleResetAllSettings,
    updateTheme,
  } = useAccountSettings();

  // Use white theme colors (hardcoded to avoid useTheme dependency)
  const backgroundColor = '#FFFFFF';
  const textColor = '#1d1d1f';
  const accentColor = '#0077B5';

  // Responsive sizing
  const isCompact = panelWidth < 360;

  return (
    <div
      className="settings-scrollable-container"
      style={{
        height: '100%',
        overflow: 'auto',
        padding: isCompact ? '12px' : '16px',
      }}
    >
      {/* Custom Scrollbar Styling */}
      <style>{`
        .settings-scrollable-container::-webkit-scrollbar {
          width: 8px;
        }
        .settings-scrollable-container::-webkit-scrollbar-track {
          background: ${backgroundColor}40;
          border-radius: 4px;
        }
        .settings-scrollable-container::-webkit-scrollbar-thumb {
          background: ${accentColor};
          border-radius: 4px;
          transition: background 200ms;
        }
        .settings-scrollable-container::-webkit-scrollbar-thumb:hover {
          background: ${accentColor}cc;
        }
        /* Firefox scrollbar styling */
        .settings-scrollable-container {
          scrollbar-width: thin;
          scrollbar-color: ${accentColor} ${backgroundColor}40;
        }
      `}</style>

      <SaveBar
        hasUnsavedChanges={hasUnsavedChanges}
        saveMessage={saveMessage}
        onSave={handleSave}
        onDiscard={handleDiscard}
        accentColor={accentColor}
        backgroundColor={backgroundColor}
        textColor={textColor}
      />

      <ExtensionInfo
        extensionVersion={extensionVersion}
        storageUsage={storageUsage}
        accentColor={accentColor}
        backgroundColor={backgroundColor}
        textColor={textColor}
      />

      <DesignCustomization
        isElite={isElite}
        theme={theme}
        onThemeUpdate={updateTheme}
        onResetTheme={handleResetTheme}
        accentColor={accentColor}
        backgroundColor={backgroundColor}
        textColor={textColor}
      />

      {/* Privacy & Security section removed per user request */}

      <DataManagement
        onExportData={handleExportData}
        onClearAllData={handleClearAllData}
        accentColor={accentColor}
        backgroundColor={backgroundColor}
        textColor={textColor}
      />

      <StorageSyncStatus />

      <ResetSettings
        onResetSettings={handleResetAllSettings}
        accentColor={accentColor}
        backgroundColor={backgroundColor}
        textColor={textColor}
      />

      <LegalSupport
        accentColor={accentColor}
        backgroundColor={backgroundColor}
        textColor={textColor}
      />
    </div>
  );
}

// Re-export types
export type { AccountSettingsProps } from './types';
