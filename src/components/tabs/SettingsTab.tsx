/**
 * Settings Tab - Tabbed Settings Interface
 */

import React, { useState } from 'react';
import { Briefcase, User, CreditCard, Bell } from 'lucide-react';
import { JobPreferencesSettings } from './settings/JobPreferencesSettings';
import { NotificationSettings } from './settings/NotificationSettings';
import { AccountSettings } from './settings/AccountSettings';


type SettingsView = 'preferences' | 'notifications' | 'account' | 'subscription';

interface SettingsTabProps {
  panelWidth?: number;
}

export function SettingsTab({ panelWidth = 400 }: SettingsTabProps) {
  const [activeView, setActiveView] = useState<SettingsView>('preferences');
  // Use white theme colors
  const accentColor = '#0077B5';
  const textColor = '#1d1d1f';

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '20px 20px 16px 20px',
          borderBottom: '1px solid rgba(0, 0, 0, 0.08)',
        }}
      >
        <h2
          style={{
            fontSize: '20px',
            fontWeight: '700',
            margin: '0 0 4px 0',
            color: textColor,
          }}
        >
          Settings
        </h2>
        <p
          style={{
            fontSize: '13px',
            color: textColor,
            opacity: 0.7,
            margin: 0,
          }}
        >
          Manage your preferences and account
        </p>
      </div>

      {/* Settings Navigation */}
      <SettingsNavigation
        activeView={activeView}
        onViewChange={setActiveView}
        panelWidth={panelWidth}
        accentColor={accentColor}
      />

      {/* Settings Content */}
      <div
        style={{
          flex: 1,
          overflow: 'hidden',
        }}
      >
        {activeView === 'preferences' && <JobPreferencesSettings panelWidth={panelWidth} />}
        {activeView === 'notifications' && <NotificationSettings panelWidth={panelWidth} />}
        {activeView === 'account' && <AccountSettings panelWidth={panelWidth} />}
        {activeView === 'subscription' && <SubscriptionSettings />}
      </div>
    </div>
  );
}

// Settings Navigation Component
interface SettingsNavigationProps {
  activeView: SettingsView;
  onViewChange: (view: SettingsView) => void;
  panelWidth?: number;
  accentColor: string;
}

function SettingsNavigation({ activeView, onViewChange, panelWidth = 400, accentColor }: SettingsNavigationProps) {
  // Use white theme colors
  const textColor = '#1d1d1f';
  const backgroundColor = '#FFFFFF';
  const getHoverColor = (_bg: string) => 'rgba(0, 0, 0, 0.04)';
  // Responsive sizing based on panel width
  const isNarrow = panelWidth < 360;
  const isCompact = panelWidth < 400;
  const showIcons = true; // Always show icons for clarity
  const fontSize = isNarrow ? '11px' : isCompact ? '13px' : '14px';
  const padding = isNarrow ? '8px 6px' : isCompact ? '9px 12px' : '10px 14px';
  const gap = isNarrow ? '4px' : '8px';
  const iconSize = isNarrow ? 14 : 16;
  const showLabels = panelWidth >= 360; // Hide labels on very narrow widths

  // Convert accent color to RGB for background with alpha
  const hexToRgba = (hex: string, alpha: number) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  const accentColorBg = hexToRgba(accentColor, 0.03);

  return (
    <div
      style={{
        padding: '16px',
        borderBottom: '1px solid rgba(0, 0, 0, 0.08)',
        backgroundColor: accentColorBg,
      }}
    >
      <div style={{ display: 'flex', gap }}>
        <SettingsNavButton
          icon={<Briefcase size={iconSize} strokeWidth={2} />}
          label="Job Preferences"
          shortLabel="Jobs"
          isActive={activeView === 'preferences'}
          onClick={() => onViewChange('preferences')}
          showIcon={showIcons}
          showLabel={showLabels}
          fontSize={fontSize}
          padding={padding}
          primaryColor={accentColor}
          textColor={textColor}
          backgroundColor={backgroundColor}
          getHoverColor={getHoverColor}
        />
        <SettingsNavButton
          icon={<Bell size={iconSize} strokeWidth={2} />}
          label="Notifications"
          shortLabel="Alerts"
          isActive={activeView === 'notifications'}
          onClick={() => onViewChange('notifications')}
          showIcon={showIcons}
          showLabel={showLabels}
          fontSize={fontSize}
          padding={padding}
          primaryColor={accentColor}
          textColor={textColor}
          backgroundColor={backgroundColor}
          getHoverColor={getHoverColor}
        />
        <SettingsNavButton
          icon={<User size={iconSize} strokeWidth={2} />}
          label="Account"
          shortLabel="Account"
          isActive={activeView === 'account'}
          onClick={() => onViewChange('account')}
          showIcon={showIcons}
          showLabel={showLabels}
          fontSize={fontSize}
          padding={padding}
          primaryColor={accentColor}
          textColor={textColor}
          backgroundColor={backgroundColor}
          getHoverColor={getHoverColor}
        />
        <SettingsNavButton
          icon={<CreditCard size={iconSize} strokeWidth={2} />}
          label="Subscription"
          shortLabel="Plan"
          isActive={activeView === 'subscription'}
          onClick={() => onViewChange('subscription')}
          showIcon={showIcons}
          showLabel={showLabels}
          fontSize={fontSize}
          padding={padding}
          primaryColor={accentColor}
          textColor={textColor}
          backgroundColor={backgroundColor}
          getHoverColor={getHoverColor}
        />
      </div>
    </div>
  );
}

// Settings Nav Button Component
interface SettingsNavButtonProps {
  icon: React.ReactNode;
  label: string;
  shortLabel?: string;
  isActive: boolean;
  onClick: () => void;
  showIcon: boolean;
  showLabel: boolean;
  fontSize: string;
  padding: string;
  primaryColor: string;
  textColor: string;
  backgroundColor: string;
  getHoverColor: (bgColor: string) => string;
}

function SettingsNavButton({
  icon,
  label,
  shortLabel,
  isActive,
  onClick,
  showIcon,
  showLabel,
  fontSize,
  padding,
  primaryColor,
  textColor,
  backgroundColor,
  getHoverColor,
}: SettingsNavButtonProps) {
  const displayLabel = shortLabel || label;
  const hoverColor = getHoverColor(backgroundColor);

  return (
    <button
      onClick={onClick}
      style={{
        flex: 1,
        padding,
        backgroundColor: isActive ? primaryColor : 'transparent',
        color: isActive ? '#FFFFFF' : textColor,
        opacity: isActive ? 1 : 0.6,
        border: isActive ? 'none' : '1px solid rgba(0, 0, 0, 0.12)',
        borderRadius: '8px',
        fontSize,
        fontWeight: '600',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '6px',
        transition: 'all 150ms',
        minWidth: 0, // Allow flex shrinking
      }}
      onMouseEnter={(e) => {
        if (!isActive) {
          e.currentTarget.style.backgroundColor = hoverColor;
          e.currentTarget.style.opacity = '0.8';
        }
      }}
      onMouseLeave={(e) => {
        if (!isActive) {
          e.currentTarget.style.backgroundColor = 'transparent';
          e.currentTarget.style.opacity = '0.6';
        }
      }}
    >
      {showIcon && icon}
      {showLabel && (
        <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {displayLabel}
        </span>
      )}
    </button>
  );
}


// Subscription Settings Placeholder
function SubscriptionSettings() {
  // Use white theme colors (hardcoded to avoid useTheme dependency)
  const textColor = '#1d1d1f';
  return (
    <div
      style={{
        padding: '40px 24px',
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
      }}
    >
      <CreditCard size={48} color={textColor} strokeWidth={1.5} style={{ opacity: 0.5 }} />
      <h3
        style={{
          fontSize: '18px',
          fontWeight: '600',
          margin: '16px 0 8px 0',
          color: textColor,
        }}
      >
        Subscription
      </h3>
      <p
        style={{
          fontSize: '14px',
          color: textColor,
          opacity: 0.6,
          margin: 0,
        }}
      >
        Coming soon...
      </p>
    </div>
  );
}
