/**
 * Design Customization Section Component (Elite Feature)
 */

import { Palette, Crown, Lock } from 'lucide-react';
import { Section, SliderControl, ColorPicker } from '../components';
import type { Theme } from '../../../../types';

interface DesignCustomizationProps {
  isElite: boolean;
  theme: Theme;
  onThemeUpdate: (updates: Partial<Theme>) => Promise<void>;
  onResetTheme: () => Promise<void>;
  accentColor: string;
  backgroundColor: string;
  textColor: string;
}

export function DesignCustomization({
  isElite,
  theme,
  onThemeUpdate,
  onResetTheme,
  accentColor,
  backgroundColor,
  textColor,
}: DesignCustomizationProps) {
  return (
    <Section
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>Design Customization</span>
          {isElite && (
            <Crown size={14} style={{ color: '#FFD700' }} fill="#FFD700" />
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
          <ColorPicker
            label="Accent Color"
            description="Accent color for highlights and interactive elements"
            value={theme.accentColor}
            onChange={(color) => {
              onThemeUpdate({ accentColor: color });
            }}
          />
          <SliderControl
            label="Frosted Glass Intensity"
            description="Adjust the blur and transparency effect (5-15)"
            value={theme.blurIntensity}
            min={5}
            max={15}
            onChange={(value) => {
              onThemeUpdate({ blurIntensity: value });
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
              onClick={onResetTheme}
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
              � Revert to Default Settings
            </button>
          </div>
        </div>
      )}
    </Section>
  );
}
