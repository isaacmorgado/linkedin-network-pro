/**
 * Notification Settings Component
 * Manage email and push notification preferences
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Bell, Mail, Save } from 'lucide-react';
import { useSettingsStore } from '../../../stores/settings';
import type { NotificationPreferences } from '../../../types';
import { LoadingSpinner, Toggle, Checkbox, RadioButton, Button } from '../../shared';
import { COLORS, SPACING, RADIUS, TYPOGRAPHY, SHADOWS } from '../../../styles/tokens';


interface NotificationSettingsProps {
  panelWidth?: number;
}

type NotificationType = 'job_alert' | 'connection_accepted' | 'message_follow_up' | 'activity_update' | 'system';
type EmailFrequency = 'instant' | 'daily' | 'weekly';

export function NotificationSettings({ panelWidth = 400 }: NotificationSettingsProps) {
  // Use white theme colors
  const textColor = "#1d1d1f";
  const accentColor = "#0077B5";
  const notifications = useSettingsStore((state) => state.notifications);
  const updateNotifications = useSettingsStore((state) => state.updateNotifications);
  const loadSettings = useSettingsStore((state) => state.loadSettings);

  const [localNotifications, setLocalNotifications] = useState<NotificationPreferences>(notifications);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  const [emailAddress, setEmailAddress] = useState('');

  const isCompact = panelWidth < 380;

  // Load settings on mount
  useEffect(() => {
    async function loadNotificationSettings() {
      try {
        await loadSettings();
        setIsLoading(false);
      } catch (error) {
        console.error('[Uproot] Error loading notification settings:', error);
        setIsLoading(false);
      }
    }
    loadNotificationSettings();
  }, [loadSettings]);

  // Update local state when store changes
  useEffect(() => {
    setLocalNotifications(notifications);
  }, [notifications]);

  // Save settings
  const handleSave = useCallback(async () => {
    setIsSaving(true);
    setSaveMessage(null);
    try {
      await updateNotifications(localNotifications);
      setSaveMessage('✓ Notification preferences saved successfully!');
      setTimeout(() => setSaveMessage(null), 3000);
    } catch (error) {
      console.error('[Uproot] Error saving notification preferences:', error);
      setSaveMessage('✗ Failed to save preferences');
    } finally {
      setIsSaving(false);
    }
  }, [localNotifications, updateNotifications]);

  // Toggle email enabled
  const toggleEmailEnabled = useCallback(() => {
    setLocalNotifications((prev) => ({
      ...prev,
      email: {
        ...prev.email,
        enabled: !prev.email.enabled,
      },
    }));
  }, []);

  // Toggle email notification type
  const toggleEmailType = useCallback((type: NotificationType) => {
    setLocalNotifications((prev) => ({
      ...prev,
      email: {
        ...prev.email,
        types: prev.email.types.includes(type)
          ? prev.email.types.filter((t) => t !== type)
          : [...prev.email.types, type],
      },
    }));
  }, []);

  // Update email frequency
  const updateEmailFrequency = useCallback((frequency: EmailFrequency) => {
    setLocalNotifications((prev) => ({
      ...prev,
      email: {
        ...prev.email,
        frequency,
      },
    }));
  }, []);


  // Toggle push enabled
  const togglePushEnabled = useCallback(() => {
    setLocalNotifications((prev) => ({
      ...prev,
      push: {
        ...prev.push,
        enabled: !prev.push.enabled,
      },
    }));
  }, []);

  // Toggle push notification type
  const togglePushType = useCallback((type: NotificationType) => {
    setLocalNotifications((prev) => ({
      ...prev,
      push: {
        ...prev.push,
        types: prev.push.types.includes(type)
          ? prev.push.types.filter((t) => t !== type)
          : [...prev.push.types, type],
      },
    }));
  }, []);

  const notificationTypes: { value: NotificationType; label: string; description: string }[] = [
    { value: 'job_alert', label: 'Job Alerts', description: 'New jobs matching your preferences' },
    { value: 'connection_accepted', label: 'Connections', description: 'When someone accepts your connection' },
    { value: 'message_follow_up', label: 'Follow-ups', description: 'Message reminders and follow-ups' },
    { value: 'activity_update', label: 'Activity', description: 'Watchlist activity updates' },
    { value: 'system', label: 'System', description: 'Important system notifications' },
  ];

  const emailFrequencies: { value: EmailFrequency; label: string }[] = [
    { value: 'instant', label: 'Instant' },
    { value: 'daily', label: 'Daily Digest' },
    { value: 'weekly', label: 'Weekly Digest' },
  ];

  if (isLoading) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '400px',
        }}
      >
        <LoadingSpinner size={32} />
      </div>
    );
  }

  return (
    <div
      style={{
        height: '100%',
        overflow: 'auto',
        padding: isCompact ? '16px' : '20px',
        maxWidth: '600px',
      }}
    >
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h2
          style={{
            fontSize: '20px',
            fontWeight: '700',
            margin: '0 0 8px 0',
            color: textColor,
          }}
        >
          Notification Preferences
        </h2>
        <p style={{ fontSize: '13px', color: textColor, opacity: 0.6, margin: 0 }}>
          Choose how you want to be notified about important updates
        </p>
      </div>

      {/* Email Notifications */}
      <Section title="Email Notifications" icon={<Mail size={18} color={accentColor} />} textColor={textColor}>
        <div style={{ marginBottom: '16px' }}>
          <Toggle
            label="Enable email notifications"
            checked={localNotifications.email.enabled}
            onChange={toggleEmailEnabled}
          />
        </div>

        {localNotifications.email.enabled && (
          <>
            <div style={{ marginBottom: '16px' }}>
              <label
                style={{
                  display: 'block',
                  fontSize: '13px',
                  fontWeight: '600',
                  marginBottom: '6px',
                  color: textColor,
                }}
              >
                Email Address
              </label>
              <input
                type="email"
                value={emailAddress}
                onChange={(e) => setEmailAddress(e.target.value)}
                placeholder="your.email@example.com"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: `1px solid ${textColor}20`,
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontFamily: 'inherit',
                  color: textColor,
                  backgroundColor: 'transparent',
                }}
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label
                style={{
                  display: 'block',
                  fontSize: '13px',
                  fontWeight: '600',
                  marginBottom: '8px',
                  color: textColor,
                }}
              >
                Notify me about
              </label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {notificationTypes.map((type) => (
                  <Checkbox
                    key={type.value}
                    label={type.label}
                    description={type.description}
                    checked={localNotifications.email.types.includes(type.value)}
                    onChange={() => toggleEmailType(type.value)}
                  />
                ))}
              </div>
            </div>

            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '13px',
                  fontWeight: '600',
                  marginBottom: '8px',
                  color: textColor,
                }}
              >
                Email Frequency
              </label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {emailFrequencies.map((freq) => (
                  <RadioButton
                    key={freq.value}
                    label={freq.label}
                    checked={localNotifications.email.frequency === freq.value}
                    onChange={() => updateEmailFrequency(freq.value)}
                  />
                ))}
              </div>
            </div>
          </>
        )}
      </Section>

      {/* Push Notifications */}
      <Section title="Push Notifications" icon={<Bell size={18} color={accentColor} />} textColor={textColor}>
        <div style={{ marginBottom: '16px' }}>
          <Toggle
            label="Enable browser notifications"
            checked={localNotifications.push.enabled}
            onChange={togglePushEnabled}
          />
        </div>

        {localNotifications.push.enabled && (
          <div>
            <label
              style={{
                display: 'block',
                fontSize: '13px',
                fontWeight: '600',
                marginBottom: '8px',
                color: '#1d1d1f',
              }}
            >
              Notify me about
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {notificationTypes.map((type) => (
                <Checkbox
                  key={type.value}
                  label={type.label}
                  description={type.description}
                  checked={localNotifications.push.types.includes(type.value)}
                  onChange={() => togglePushType(type.value)}
                />
              ))}
            </div>
          </div>
        )}
      </Section>

      {/* Save Button */}
      <div style={{ marginTop: `${SPACING.xl}px` }}>
        <Button
          onClick={handleSave}
          disabled={isSaving}
          fullWidth
          icon={isSaving ? <LoadingSpinner size={16} color={COLORS.text.inverse} /> : <Save size={16} />}
        >
          {isSaving ? 'Saving...' : 'Save Preferences'}
        </Button>

        {saveMessage && (
          <div
            style={{
              marginTop: '12px',
              padding: '12px',
              backgroundColor: saveMessage.startsWith('✓') ? '#E8F5E9' : '#FFEBEE',
              color: saveMessage.startsWith('✓') ? '#2E7D32' : '#C62828',
              borderRadius: '8px',
              fontSize: '13px',
              textAlign: 'center',
            }}
          >
            {saveMessage}
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// Section Component (local - slightly different from shared)
// ============================================================================

function Section({ title, icon, children, textColor }: { title: string; icon: React.ReactNode; children: React.ReactNode; textColor: string }) {
  return (
    <div
      style={{
        marginBottom: `${SPACING.xl}px`,
        padding: `${SPACING.lg}px`,
        backgroundColor: `${textColor}08`,
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        borderRadius: `${RADIUS.lg}px`,
        border: `1px solid ${COLORS.border.default}`,
        boxShadow: SHADOWS.md,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: `${SPACING.xs}px`, marginBottom: `${SPACING.md}px` }}>
        {icon}
        <h3
          style={{
            fontSize: `${TYPOGRAPHY.fontSize.lg}px`,
            fontWeight: TYPOGRAPHY.fontWeight.semibold,
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
