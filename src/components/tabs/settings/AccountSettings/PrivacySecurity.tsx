/**
 * Privacy & Security Section Component
 */

import { Shield } from 'lucide-react';
import { Section, Toggle } from '../components';
import type { PrivacySettings } from '../../../../types';

interface PrivacySecurityProps {
  localPrivacy: PrivacySettings;
  onToggleCloudSync: () => void;
  onToggleAutoSend: () => void;
  onToggleAnalytics: () => void;
  onToggleClearDataOnLogout: () => void;
  accentColor: string;
  backgroundColor: string;
  textColor: string;
}

export function PrivacySecurity({
  localPrivacy,
  onToggleCloudSync,
  onToggleAutoSend,
  onToggleAnalytics,
  onToggleClearDataOnLogout,
  accentColor,
  backgroundColor,
  textColor,
}: PrivacySecurityProps) {
  return (
    <Section
      title="Privacy & Security"
      icon={<Shield size={18} />}
      accentColor={accentColor}
      backgroundColor={backgroundColor}
      textColor={textColor}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <Toggle
          label="Cloud Sync"
          description="Sync your data across devices (requires Supabase account)"
          checked={localPrivacy.cloudSyncEnabled}
          onChange={onToggleCloudSync}
          disabled={false}
          accentColor={accentColor}
          textColor={textColor}
        />
        <Toggle
          label="Auto-send Connection Requests"
          description="Automatically send connection requests based on your preferences"
          checked={localPrivacy.autoSendEnabled}
          onChange={onToggleAutoSend}
          disabled={false}
          accentColor={accentColor}
          textColor={textColor}
        />
        <Toggle
          label="Usage Analytics"
          description="Help improve Uproot by sharing anonymous usage data"
          checked={localPrivacy.analyticsEnabled}
          onChange={onToggleAnalytics}
          disabled={false}
          accentColor={accentColor}
          textColor={textColor}
        />
        <Toggle
          label="Clear Data on Logout"
          description="Automatically clear all local data when you sign out of LinkedIn"
          checked={localPrivacy.clearDataOnLogout}
          onChange={onToggleClearDataOnLogout}
          disabled={false}
          accentColor={accentColor}
          textColor={textColor}
        />
      </div>
    </Section>
  );
}
