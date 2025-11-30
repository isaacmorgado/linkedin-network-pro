/**
 * Reset Settings Section Component
 */

import { useState } from 'react';
import { RotateCcw, Check } from 'lucide-react';
import { Section, ActionButton, ConfirmDialog } from '../components';

interface ResetSettingsProps {
  onResetSettings: () => Promise<void>;
  accentColor: string;
  backgroundColor: string;
  textColor: string;
}

export function ResetSettings({
  onResetSettings,
  accentColor,
  backgroundColor,
  textColor,
}: ResetSettingsProps) {
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showResetSuccess, setShowResetSuccess] = useState(false);

  const handleResetToDefaults = async () => {
    await onResetSettings();
    setShowResetConfirm(false);
    setShowResetSuccess(true);

    // Hide success message after 3 seconds
    setTimeout(() => setShowResetSuccess(false), 3000);
  };

  return (
    <>
      <Section
        title="Reset Settings"
        icon={<RotateCcw size={18} />}
        accentColor={accentColor}
        backgroundColor={backgroundColor}
        textColor={textColor}
      >
        <div style={{ marginBottom: '12px' }}>
          <p
            style={{
              fontSize: '13px',
              color: `${textColor}cc`,
              lineHeight: 1.5,
              margin: 0,
            }}
          >
            Return all settings to their default values. This will reset theme preferences,
            notifications, privacy settings, and feed preferences.
          </p>
        </div>

        <ActionButton
          icon={<RotateCcw size={16} />}
          label="Return to Default Settings"
          description="Reset all settings to factory defaults"
          onClick={() => setShowResetConfirm(true)}
          variant="danger"
          accentColor={accentColor}
          textColor={textColor}
        />

        {/* Success Message */}
        {showResetSuccess && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginTop: '12px',
              padding: '12px',
              backgroundColor: '#10B981',
              color: 'white',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: 500,
            }}
          >
            <Check size={16} />
            Settings reset to defaults successfully!
          </div>
        )}
      </Section>

      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showResetConfirm}
        title="Reset All Settings?"
        message="Are you sure you want to reset all settings to their default values? This will reset theme, notifications, privacy, and feed preferences. This action cannot be undone."
        confirmLabel="Reset to Defaults"
        cancelLabel="Cancel"
        variant="danger"
        onConfirm={handleResetToDefaults}
        onCancel={() => setShowResetConfirm(false)}
        accentColor={accentColor}
        backgroundColor={backgroundColor}
        textColor={textColor}
      />
    </>
  );
}
