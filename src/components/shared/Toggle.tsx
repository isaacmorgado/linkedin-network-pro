/**
 * Toggle Component
 *
 * Consistent toggle switch for boolean settings.
 */

import React from 'react';
import { COLORS, TRANSITIONS, TYPOGRAPHY, SPACING, SHADOWS } from '../../styles/tokens';

export interface ToggleProps {
  label: string;
  checked: boolean;
  onChange: () => void;
  disabled?: boolean;
}

export function Toggle({ label, checked, onChange, disabled = false }: ToggleProps) {
  return (
    <label
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: `${SPACING.sm}px`,
        cursor: disabled ? 'not-allowed' : 'pointer',
        userSelect: 'none',
        opacity: disabled ? 0.5 : 1,
      }}
    >
      <div
        onClick={disabled ? undefined : onChange}
        style={{
          width: '44px',
          height: '24px',
          backgroundColor: checked ? COLORS.accent.default : COLORS.background.tertiary,
          borderRadius: `${SPACING.sm}px`,
          position: 'relative',
          transition: `background-color ${TRANSITIONS.duration.normal}ms ${TRANSITIONS.easing.standardStr}`,
          cursor: disabled ? 'not-allowed' : 'pointer',
        }}
      >
        <div
          style={{
            width: '20px',
            height: '20px',
            backgroundColor: COLORS.background.primary,
            borderRadius: '50%',
            position: 'absolute',
            top: '2px',
            left: checked ? '22px' : '2px',
            transition: `left ${TRANSITIONS.duration.normal}ms ${TRANSITIONS.easing.standardStr}`,
            boxShadow: SHADOWS.sm,
          }}
        />
      </div>
      <span
        style={{
          fontSize: `${TYPOGRAPHY.fontSize.base}px`,
          fontWeight: TYPOGRAPHY.fontWeight.medium,
          color: COLORS.text.primary,
        }}
      >
        {label}
      </span>
    </label>
  );
}
