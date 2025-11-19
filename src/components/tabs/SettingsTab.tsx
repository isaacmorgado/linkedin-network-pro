/**
 * Settings Tab - Tabbed Settings Interface
 */

import React, { useState } from 'react';
import { Briefcase, User, CreditCard } from 'lucide-react';
import { JobPreferencesSettings } from './settings/JobPreferencesSettings';

type SettingsView = 'preferences' | 'account' | 'subscription';

interface SettingsTabProps {
  panelWidth?: number;
}

export function SettingsTab({ panelWidth = 400 }: SettingsTabProps) {
  const [activeView, setActiveView] = useState<SettingsView>('preferences');

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
            color: '#1d1d1f',
          }}
        >
          Settings
        </h2>
        <p
          style={{
            fontSize: '13px',
            color: '#6e6e73',
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
      />

      {/* Settings Content */}
      <div
        style={{
          flex: 1,
          overflow: 'hidden',
        }}
      >
        {activeView === 'preferences' && <JobPreferencesSettings panelWidth={panelWidth} />}
        {activeView === 'account' && <AccountSettings />}
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
}

function SettingsNavigation({ activeView, onViewChange, panelWidth = 400 }: SettingsNavigationProps) {
  // Responsive sizing based on panel width
  const isNarrow = panelWidth < 360;
  const isCompact = panelWidth < 400;
  const showIcons = true; // Always show icons for clarity
  const fontSize = isNarrow ? '11px' : isCompact ? '13px' : '14px';
  const padding = isNarrow ? '8px 6px' : isCompact ? '9px 12px' : '10px 14px';
  const gap = isNarrow ? '4px' : '8px';
  const iconSize = isNarrow ? 14 : 16;
  const showLabels = panelWidth >= 360; // Hide labels on very narrow widths

  return (
    <div
      style={{
        padding: '16px',
        borderBottom: '1px solid rgba(0, 0, 0, 0.08)',
        backgroundColor: 'rgba(0, 119, 181, 0.03)',
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
}: SettingsNavButtonProps) {
  const displayLabel = shortLabel || label;

  return (
    <button
      onClick={onClick}
      style={{
        flex: 1,
        padding,
        backgroundColor: isActive ? '#0077B5' : 'transparent',
        color: isActive ? '#FFFFFF' : '#6e6e73',
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
          e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.04)';
        }
      }}
      onMouseLeave={(e) => {
        if (!isActive) {
          e.currentTarget.style.backgroundColor = 'transparent';
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

// Account Settings Placeholder
function AccountSettings() {
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
      <User size={48} color="#86868b" strokeWidth={1.5} />
      <h3
        style={{
          fontSize: '18px',
          fontWeight: '600',
          margin: '16px 0 8px 0',
          color: '#1d1d1f',
        }}
      >
        Account Settings
      </h3>
      <p
        style={{
          fontSize: '14px',
          color: '#6e6e73',
          margin: 0,
        }}
      >
        Coming soon...
      </p>
    </div>
  );
}

// Subscription Settings Placeholder
function SubscriptionSettings() {
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
      <CreditCard size={48} color="#86868b" strokeWidth={1.5} />
      <h3
        style={{
          fontSize: '18px',
          fontWeight: '600',
          margin: '16px 0 8px 0',
          color: '#1d1d1f',
        }}
      >
        Subscription
      </h3>
      <p
        style={{
          fontSize: '14px',
          color: '#6e6e73',
          margin: 0,
        }}
      >
        Coming soon...
      </p>
    </div>
  );
}
