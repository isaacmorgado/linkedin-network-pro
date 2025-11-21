/**
 * Account Settings Component
 *
 * Manages user account information, privacy settings, and data management
 */

import React, { useState, useCallback, useEffect } from 'react';
import {
  User,
  Shield,
  Database,
  Download,
  Trash2,
  AlertTriangle,
  Check,
  Info,
} from 'lucide-react';
import { useSettingsStore } from '../../../stores/settings';
import { useAuthStore } from '../../../stores/auth';
import type { PrivacySettings, Theme } from '../../../types';


interface AccountSettingsProps {
  panelWidth?: number;
}

export function AccountSettings({ panelWidth = 400 }: AccountSettingsProps) {
  const privacy = useSettingsStore((state) => state.privacy);
  const updatePrivacy = useSettingsStore((state) => state.updatePrivacy);
  const theme = useSettingsStore((state) => state.theme);
  const updateTheme = useSettingsStore((state) => state.updateTheme);
  const resetSettings = useSettingsStore((state) => state.resetSettings);
  const user = useAuthStore((state) => state.user);
  const isElite = user?.subscriptionTier === 'elite';
  const { backgroundColor, textColor, accentColor } = useTheme();

  // Default theme values for reset functionality
  // Local state for unsaved changes
  const [localPrivacy, setLocalPrivacy] = useState<PrivacySettings>(privacy);
  const [localTheme, setLocalTheme] = useState<Theme>(theme);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string>('');
  const [storageUsage, setStorageUsage] = useState<{ used: number; total: number }>({
    used: 0,
    total: 0,
  });
  const [extensionVersion, setExtensionVersion] = useState<string>('');

  // Responsive sizing
  const isCompact = panelWidth < 360;
  const isNarrow = panelWidth < 400;

  // Load extension info and storage usage
  useEffect(() => {
    loadExtensionInfo();
    loadStorageUsage();
  }, []);

  // Sync local state with store
  useEffect(() => {
    setLocalPrivacy(privacy);
  }, [privacy]);

  useEffect(() => {
    setLocalTheme(theme);
  }, [theme]);

  // Check for unsaved changes (excluding real-time updates: blurIntensity, primaryColor, accentColor)
  useEffect(() => {
    const privacyChanges = JSON.stringify(localPrivacy) !== JSON.stringify(privacy);

    // Compare theme without real-time fields since they update immediately
    const localThemeWithoutRealtime = {
      ...localTheme,
      blurIntensity: theme.blurIntensity,
      primaryColor: theme.primaryColor,
      accentColor: theme.accentColor
    };
    const themeChanges = JSON.stringify(localThemeWithoutRealtime) !== JSON.stringify(theme);

    setHasUnsavedChanges(privacyChanges || themeChanges);
  }, [localPrivacy, privacy, localTheme, theme]);

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
      console.error('[AccountSettings] Error loading storage usage:', error);
    }
  };

  // ============================================================================
  // PRIVACY SETTINGS HANDLERS
  // ============================================================================

  const toggleCloudSync = useCallback(() => {
    setLocalPrivacy((prev) => ({
      ...prev,
      cloudSyncEnabled: !prev.cloudSyncEnabled,
    }));
  }, []);

  const toggleAutoSend = useCallback(() => {
    setLocalPrivacy((prev) => ({
      ...prev,
      autoSendEnabled: !prev.autoSendEnabled,
    }));
  }, []);

  const toggleAnalytics = useCallback(() => {
    setLocalPrivacy((prev) => ({
      ...prev,
      analyticsEnabled: !prev.analyticsEnabled,
    }));
  }, []);

  const toggleClearDataOnLogout = useCallback(() => {
    setLocalPrivacy((prev) => ({
      ...prev,
      clearDataOnLogout: !prev.clearDataOnLogout,
    }));
  }, []);

  // ============================================================================
  // SAVE & DISCARD HANDLERS
  // ============================================================================

  const handleSave = useCallback(async () => {
    try {
      await updatePrivacy(localPrivacy);
      await updateTheme(localTheme);
      setSaveMessage('✓ Settings saved successfully!');
      setHasUnsavedChanges(false);

      // Clear message after 3 seconds
      setTimeout(() => setSaveMessage(''), 3000);
    } catch (error) {
      console.error('[AccountSettings] Error saving settings:', error);
      setSaveMessage('✗ Failed to save settings. Please try again.');
      setTimeout(() => setSaveMessage(''), 3000);
    }
  }, [localPrivacy, localTheme, updatePrivacy, updateTheme]);

  const handleDiscard = useCallback(() => {
    setLocalPrivacy(privacy);
    setLocalTheme(theme);
    setHasUnsavedChanges(false);
    setSaveMessage('');
  }, [privacy, theme]);

  // ============================================================================
  // DATA MANAGEMENT HANDLERS
  // ============================================================================

  const handleExportData = useCallback(async () => {
    try {
      // Get all data from chrome.storage.local
      const allData = await chrome.storage.local.get(null);

      // Create downloadable JSON file
      const dataStr = JSON.stringify(allData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);

      // Trigger download
      const link = document.createElement('a');
      link.href = url;
      link.download = `uproot-data-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setSaveMessage('✓ Data exported successfully!');
      setTimeout(() => setSaveMessage(''), 3000);
    } catch (error) {
      console.error('[AccountSettings] Error exporting data:', error);
      setSaveMessage('✗ Failed to export data.');
      setTimeout(() => setSaveMessage(''), 3000);
    }
  }, []);

  const handleClearAllData = useCallback(async () => {
    const confirmed = window.confirm(
      '⚠️ WARNING: This will delete ALL your data including:\n\n' +
        '• Professional profile\n' +
        '• Job analyses\n' +
        '• Generated resumes\n' +
        '• Watchlists\n' +
        '• Feed items\n' +
        '• Settings\n\n' +
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
      // Clear all chrome.storage.local data
      await chrome.storage.local.clear();

      setSaveMessage('✓ All data cleared successfully!');
      setTimeout(() => {
        setSaveMessage('');
        // Reload to reset state
        window.location.reload();
      }, 2000);
    } catch (error) {
      console.error('[AccountSettings] Error clearing data:', error);
      setSaveMessage('✗ Failed to clear data.');
      setTimeout(() => setSaveMessage(''), 3000);
    }
  }, []);

  // ============================================================================
  // RENDER
  // ============================================================================

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
      {/* Save/Discard Bar */}
      {hasUnsavedChanges && (
        <div
          style={{
            backgroundColor: `${backgroundColor}e6`,
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            border: `1px solid ${accentColor}`,
            borderRadius: '8px',
            padding: '12px 16px',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            transition: 'all 250ms cubic-bezier(0.4, 0.0, 0.2, 1)',
            transform: 'translateY(0)',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
          }}
        >
          <span style={{ fontSize: '13px', color: textColor, fontWeight: '500' }}>
            You have unsaved changes
          </span>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={handleDiscard}
              style={{
                padding: '6px 12px',
                backgroundColor: 'transparent',
                color: textColor,
                opacity: 0.6,
                border: `1px solid ${textColor}40`,
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 150ms',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.opacity = '1';
                e.currentTarget.style.backgroundColor = `${textColor}10`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.opacity = '0.6';
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              Discard
            </button>
            <button
              onClick={handleSave}
              style={{
                padding: '6px 12px',
                backgroundColor: accentColor,
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 150ms',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.opacity = '0.85';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.opacity = '1';
              }}
            >
              Save Changes
            </button>
          </div>
        </div>
      )}

      {/* Save Message */}
      {saveMessage && (
        <div
          style={{
            backgroundColor: `${backgroundColor}e6`,
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            border: `1px solid ${saveMessage.startsWith('✓') ? '#4CAF50' : '#F44336'}`,
            borderRadius: '8px',
            padding: '12px 16px',
            marginBottom: '16px',
            fontSize: '13px',
            color: textColor,
            fontWeight: '500',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
          }}
        >
          {saveMessage}
        </div>
      )}

      {/* Extension Info Section */}
      <Section title="Extension Info" icon={<Info size={18} />} accentColor={accentColor} backgroundColor={backgroundColor} textColor={textColor}>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
          }}
        >
          <InfoRow label="Version" value={`v${extensionVersion}`} textColor={textColor} />
          <InfoRow
            label="Storage Used"
            value={`${(storageUsage.used / 1024).toFixed(1)} KB / ${(
              storageUsage.total / 1024
            ).toFixed(0)} KB`}
            textColor={textColor}
          />
          <InfoRow
            label="Storage %"
            value={`${((storageUsage.used / storageUsage.total) * 100).toFixed(1)}%`}
            textColor={textColor}
          />
        </div>
      </Section>

      {/* Design Customization Section (Elite Only) */}
      <Section
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>Design Customization</span>
            {isElite && (
              <Crown
                size={14}
                style={{ color: '#FFD700' }}
                fill="#FFD700"
              />
            )}
          </div>
        }
        icon={<Palette size={18} />}
        accentColor={accentColor}
        backgroundColor={backgroundColor}
        textColor={textColor}
      >
        {!isElite ? (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '24px',
              backgroundColor: `${accentColor}10`,
              borderRadius: '8px',
              border: `1px dashed ${accentColor}40`,
              textAlign: 'center',
            }}
          >
            <Lock size={32} color={accentColor} style={{ marginBottom: '12px' }} />
            <h4
              style={{
                fontSize: '15px',
                fontWeight: '600',
                margin: '0 0 6px 0',
                color: textColor,
              }}
            >
              Elite Feature
            </h4>
            <p
              style={{
                fontSize: '13px',
                color: `${textColor}80`,
                margin: '0 0 16px 0',
                lineHeight: '1.5',
              }}
            >
              Customize colors and frosted glass effects with an Elite subscription
            </p>
            <button
              style={{
                padding: '8px 16px',
                backgroundColor: accentColor,
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '6px',
                fontSize: '13px',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
              onClick={() => alert('Upgrade to Elite coming soon!')}
            >
              <Crown size={14} />
              Upgrade to Elite
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <AppleColorPicker
              label="Background Color"
              description="Main background color for the extension panel"
              value={theme.primaryColor}
              onChange={(color) => {
                // Update theme immediately for real-time visual feedback
                updateTheme({ primaryColor: color });
              }}
            />
            <AppleColorPicker
              label="Accent Color"
              description="Accent color for highlights and interactive elements"
              value={theme.accentColor}
              onChange={(color) => {
                // Update theme immediately for real-time visual feedback
                updateTheme({ accentColor: color });
              }}
            />
            <SliderControl
              label="Frosted Glass Intensity"
              description="Adjust the blur and transparency effect (5-15)"
              value={theme.blurIntensity}
              min={5}
              max={15}
              onChange={(value) => {
                // Update theme immediately for real-time visual feedback
                updateTheme({ blurIntensity: value });
              }}
              accentColor={accentColor}
            />
            {/* Revert to Defaults Button */}
            <div
              style={{
                marginTop: '16px',
                paddingTop: '16px',
                borderTop: `1px solid ${textColor}15`,
              }}
            >
              <button
                onClick={handleResetTheme}
                style={{
                  width: '100%',
                  padding: '10px 16px',
                  backgroundColor: 'transparent',
                  color: accentColor,
                  border: `1px solid ${accentColor}`,
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 150ms',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = `${accentColor}15`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                ↺ Revert to Default Settings
              </button>
            </div>
          </div>
        )}
      </Section>

      {/* Privacy Settings Section */}
      <Section title="Privacy & Security" icon={<Shield size={18} />} accentColor={accentColor} backgroundColor={backgroundColor} textColor={textColor}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <Toggle
            label="Cloud Sync"
            description="Sync your data across devices (requires Supabase account)"
            checked={localPrivacy.cloudSyncEnabled}
            onChange={toggleCloudSync}
            disabled={false}
            accentColor={accentColor}
            textColor={textColor}
          />
          <Toggle
            label="Auto-send Connection Requests"
            description="Automatically send connection requests based on your preferences"
            checked={localPrivacy.autoSendEnabled}
            onChange={toggleAutoSend}
            disabled={false}
            accentColor={accentColor}
            textColor={textColor}
          />
          <Toggle
            label="Usage Analytics"
            description="Help improve Uproot by sharing anonymous usage data"
            checked={localPrivacy.analyticsEnabled}
            onChange={toggleAnalytics}
            disabled={false}
            accentColor={accentColor}
            textColor={textColor}
          />
          <Toggle
            label="Clear Data on Logout"
            description="Automatically clear all local data when you sign out of LinkedIn"
            checked={localPrivacy.clearDataOnLogout}
            onChange={toggleClearDataOnLogout}
            disabled={false}
            accentColor={accentColor}
            textColor={textColor}
          />
        </div>
      </Section>

      {/* Data Management Section */}
      <Section title="Data Management" icon={<Database size={18} />} accentColor={accentColor} backgroundColor={backgroundColor} textColor={textColor}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <ActionButton
            icon={<Download size={16} />}
            label="Export All Data"
            description="Download all your data as a JSON file"
            onClick={handleExportData}
            variant="primary"
            accentColor={accentColor}
            textColor={textColor}
          />
          <ActionButton
            icon={<Trash2 size={16} />}
            label="Clear All Data"
            description="Permanently delete all your local data"
            onClick={handleClearAllData}
            variant="danger"
            accentColor={accentColor}
            textColor={textColor}
          />
        </div>
      </Section>

      {/* Legal & Support Section */}
      <Section title="Legal & Support" icon={<Info size={18} />} accentColor={accentColor} backgroundColor={backgroundColor} textColor={textColor}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <TextLink label="Privacy Policy" href="https://uproot.app/privacy" accentColor={accentColor} />
          <TextLink label="Terms of Service" href="https://uproot.app/terms" accentColor={accentColor} />
          <TextLink label="Help & Support" href="https://uproot.app/support" accentColor={accentColor} />
          <TextLink
            label="Report a Bug"
            href="https://github.com/your-repo/issues/new"
            accentColor={accentColor}
          />
        </div>
      </Section>
    </div>
  );
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

interface SectionProps {
  title: string | React.ReactNode;
  icon: React.ReactNode;
  children: React.ReactNode;
  accentColor: string;
  backgroundColor: string;
  textColor: string;
}

function Section({ title, icon, children, accentColor, backgroundColor, textColor }: SectionProps) {
  return (
    <div
      style={{
        backgroundColor: `${backgroundColor}e6`,
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        borderRadius: '12px',
        padding: '16px',
        marginBottom: '16px',
        border: `1px solid ${textColor}15`,
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
        transition: 'all 250ms cubic-bezier(0.4, 0.0, 0.2, 1)',
        transform: 'translateY(0)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow = '0 8px 16px rgba(0, 0, 0, 0.15)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.08)';
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          marginBottom: '16px',
          paddingBottom: '12px',
          borderBottom: `1px solid ${textColor}20`,
        }}
      >
        <div style={{ color: accentColor }}>{icon}</div>
        <h3
          style={{
            fontSize: '16px',
            fontWeight: '700',
            margin: 0,
            color: textColor,
          }}
        >
          {title}
        </h3>
      </div>
      {children}
    </div>
  );
}

interface ToggleProps {
  label: string;
  description?: string;
  checked: boolean;
  onChange: () => void;
  disabled?: boolean;
  accentColor: string;
  textColor: string;
}

function Toggle({ label, description, checked, onChange, disabled = false, accentColor, textColor }: ToggleProps) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        gap: '12px',
      }}
    >
      <div style={{ flex: 1 }}>
        <div
          style={{
            fontSize: '14px',
            fontWeight: '600',
            color: disabled ? `${textColor}60` : textColor,
            marginBottom: description ? '4px' : 0,
          }}
        >
          {label}
        </div>
        {description && (
          <div
            style={{
              fontSize: '12px',
              color: `${textColor}80`,
              lineHeight: '1.4',
            }}
          >
            {description}
          </div>
        )}
      </div>
      <button
        onClick={onChange}
        disabled={disabled}
        style={{
          position: 'relative',
          width: '44px',
          height: '24px',
          backgroundColor: checked ? accentColor : '#d1d1d6',
          borderRadius: '12px',
          border: 'none',
          cursor: disabled ? 'not-allowed' : 'pointer',
          transition: 'background-color 200ms',
          flexShrink: 0,
          opacity: disabled ? 0.5 : 1,
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: '2px',
            left: checked ? '22px' : '2px',
            width: '20px',
            height: '20px',
            backgroundColor: '#FFFFFF',
            borderRadius: '50%',
            transition: 'left 200ms',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.2)',
          }}
        />
      </button>
    </div>
  );
}

interface InfoRowProps {
  label: string;
  value: string;
  textColor: string;
}

function InfoRow({ label, value, textColor }: InfoRowProps) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '8px 0',
        borderBottom: `1px solid ${textColor}10`,
      }}
    >
      <span style={{ fontSize: '13px', color: `${textColor}80` }}>{label}</span>
      <span style={{ fontSize: '13px', fontWeight: '600', color: textColor }}>{value}</span>
    </div>
  );
}

interface ActionButtonProps {
  icon: React.ReactNode;
  label: string;
  description: string;
  onClick: () => void;
  variant: 'primary' | 'danger';
  accentColor: string;
  textColor: string;
}

function ActionButton({ icon, label, description, onClick, variant, accentColor, textColor }: ActionButtonProps) {
  // Helper to darken a hex color for hover state
  const darkenColor = (hex: string, percent: number = 20) => {
    const num = parseInt(hex.slice(1), 16);
    const r = Math.max(0, ((num >> 16) & 0xff) * (1 - percent / 100));
    const g = Math.max(0, ((num >> 8) & 0xff) * (1 - percent / 100));
    const b = Math.max(0, (num & 0xff) * (1 - percent / 100));
    return `#${Math.round(r).toString(16).padStart(2, '0')}${Math.round(g).toString(16).padStart(2, '0')}${Math.round(b).toString(16).padStart(2, '0')}`;
  };

  const colors = {
    primary: {
      bg: accentColor,
      bgHover: darkenColor(accentColor, 15),
      text: '#FFFFFF',
    },
    danger: {
      bg: '#F44336',
      bgHover: '#D32F2F',
      text: '#FFFFFF',
    },
  };

  const [isHovered, setIsHovered] = useState(false);

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '12px 16px',
        backgroundColor: isHovered ? colors[variant].bgHover : colors[variant].bg,
        color: colors[variant].text,
        border: 'none',
        borderRadius: '8px',
        cursor: 'pointer',
        transition: 'background-color 150ms',
        width: '100%',
        textAlign: 'left',
      }}
    >
      <div style={{ flexShrink: 0 }}>{icon}</div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '2px' }}>{label}</div>
        <div style={{ fontSize: '12px', opacity: 0.9 }}>{description}</div>
      </div>
    </button>
  );
}

interface TextLinkProps {
  label: string;
  href: string;
  accentColor: string;
}

function TextLink({ label, href, accentColor }: TextLinkProps) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        fontSize: '13px',
        color: accentColor,
        textDecoration: 'none',
        padding: '8px 0',
        display: 'block',
        borderBottom: `1px solid ${accentColor}20`,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.textDecoration = 'underline';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.textDecoration = 'none';
      }}
    >
      {label} →
    </a>
  );
}

interface SliderControlProps {
  label: string;
  description: string;
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
  accentColor: string;
}

function SliderControl({ label, description, value, min, max, onChange, accentColor }: SliderControlProps) {
  // Get textColor from context for label styling
  const { textColor } = useTheme();

  // Event handlers to prevent slider drag from propagating to panel drag
  const handleMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    e.stopPropagation();
  };

  return (
    <div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: '12px',
        }}
      >
        <div style={{ flex: 1 }}>
          <div
            style={{
              fontSize: '14px',
              fontWeight: '600',
              color: textColor,
              marginBottom: '4px',
            }}
          >
            {label}
          </div>
          <div
            style={{
              fontSize: '12px',
              color: `${textColor}80`,
              lineHeight: '1.4',
            }}
          >
            {description}
          </div>
        </div>
        <div
          style={{
            fontSize: '14px',
            fontWeight: '600',
            color: accentColor,
            minWidth: '32px',
            textAlign: 'right',
          }}
        >
          {value}
        </div>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        style={{
          width: '100%',
          height: '6px',
          borderRadius: '3px',
          background: `linear-gradient(to right, ${accentColor} 0%, ${accentColor} ${((value - min) / (max - min)) * 100}%, #d1d1d6 ${((value - min) / (max - min)) * 100}%, #d1d1d6 100%)`,
          outline: 'none',
          WebkitAppearance: 'none',
          appearance: 'none',
          cursor: 'pointer',
        }}
      />
    </div>
  );
}
