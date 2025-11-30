/**
 * EmptyState Component
 *
 * Consistent empty state placeholder.
 */

import React from 'react';
import { COLORS, SPACING, TYPOGRAPHY } from '../../styles/tokens';

export interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: `${SPACING.xxxl}px ${SPACING.lg}px`,
        textAlign: 'center',
      }}
    >
      {/* Icon */}
      <div
        style={{
          marginBottom: `${SPACING.md}px`,
          opacity: 0.4,
        }}
      >
        {icon}
      </div>

      {/* Title */}
      <h3
        style={{
          fontSize: `${TYPOGRAPHY.fontSize.lg}px`,
          fontWeight: TYPOGRAPHY.fontWeight.semibold,
          color: COLORS.text.primary,
          margin: `0 0 ${SPACING.xs}px 0`,
        }}
      >
        {title}
      </h3>

      {/* Description */}
      <p
        style={{
          fontSize: `${TYPOGRAPHY.fontSize.base}px`,
          color: COLORS.text.secondary,
          margin: action ? `0 0 ${SPACING.lg}px 0` : 0,
          maxWidth: '280px',
        }}
      >
        {description}
      </p>

      {/* Action Button */}
      {action && (
        <button
          onClick={action.onClick}
          style={{
            padding: `${SPACING.xs + 2}px ${SPACING.md}px`,
            backgroundColor: COLORS.accent.default,
            color: COLORS.text.inverse,
            border: 'none',
            borderRadius: '8px',
            fontSize: `${TYPOGRAPHY.fontSize.base}px`,
            fontWeight: TYPOGRAPHY.fontWeight.semibold,
            cursor: 'pointer',
            transition: `background-color 150ms ease-out`,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = COLORS.accent.hover;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = COLORS.accent.default;
          }}
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
