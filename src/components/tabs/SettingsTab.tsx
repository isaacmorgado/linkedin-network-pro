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
      <div
        style={{
          padding: '16px',
          borderBottom: '1px solid rgba(0, 0, 0, 0.08)',
          backgroundColor: 'rgba(0, 119, 181, 0.03)',
        }}
      >
        <div style={{ display: 'flex', gap: '8px' }}>
          <SettingsNavButton
            icon={<Briefcase size={16} strokeWidth={2} />}
            label="Job Preferences"
            isActive={activeView === 'preferences'}
            onClick={() => setActiveView('preferences')}
          />
          <SettingsNavButton
            icon={<User size={16} strokeWidth={2} />}
            label="Account"
            isActive={activeView === 'account'}
            onClick={() => setActiveView('account')}
          />
          <SettingsNavButton
            icon={<CreditCard size={16} strokeWidth={2} />}
            label="Subscription"
            isActive={activeView === 'subscription'}
            onClick={() => setActiveView('subscription')}
          />
        </div>
      </div>

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

// Settings Nav Button Component
interface SettingsNavButtonProps {
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  onClick: () => void;
}

function SettingsNavButton({ icon, label, isActive, onClick }: SettingsNavButtonProps) {
  return (
    <button
      onClick={onClick}
      style={{
        flex: 1,
        padding: '10px 14px',
        backgroundColor: isActive ? '#0077B5' : 'transparent',
        color: isActive ? '#FFFFFF' : '#6e6e73',
        border: isActive ? 'none' : '1px solid rgba(0, 0, 0, 0.12)',
        borderRadius: '8px',
        fontSize: '14px',
        fontWeight: '600',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '6px',
        transition: 'all 150ms',
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
      {icon}
      <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
        {label}
      </span>
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
