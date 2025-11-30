/**
 * InfoRow Component
 *
 * Consistent key-value display for settings and information.
 */

import React from 'react';
import { COLORS, SPACING, TYPOGRAPHY } from '../../styles/tokens';

export interface InfoRowProps {
  label: string;
  value: string | React.ReactNode;
  icon?: React.ReactNode;
  action?: React.ReactNode;
}

export function InfoRow({ label, value, icon, action }: InfoRowProps) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: `${SPACING.sm}px 0`,
        borderBottom: `1px solid ${COLORS.border.lighter}`,
      }}
    >
      {/* Label */}
      <div style={{ display: 'flex', alignItems: 'center', gap: `${SPACING.xs}px` }}>
        {icon && icon}
        <span
          style={{
            fontSize: `${TYPOGRAPHY.fontSize.base}px`,
            fontWeight: TYPOGRAPHY.fontWeight.medium,
            color: COLORS.text.secondary,
          }}
        >
          {label}
        </span>
      </div>

      {/* Value + Action */}
      <div style={{ display: 'flex', alignItems: 'center', gap: `${SPACING.sm}px` }}>
        <span
          style={{
            fontSize: `${TYPOGRAPHY.fontSize.base}px`,
            fontWeight: TYPOGRAPHY.fontWeight.semibold,
            color: COLORS.text.primary,
          }}
        >
          {value}
        </span>
        {action && action}
      </div>
    </div>
  );
}
