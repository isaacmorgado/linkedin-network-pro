/**
 * Section Component
 *
 * Consistent section container with optional collapsible functionality.
 */

import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { COLORS, SPACING, RADIUS, TYPOGRAPHY, SHADOWS, ICON } from '../../styles/tokens';

export interface SectionProps {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  collapsible?: boolean;
  defaultCollapsed?: boolean;
  headerAction?: React.ReactNode;
}

export function Section({
  title,
  icon,
  children,
  collapsible = false,
  defaultCollapsed = false,
  headerAction,
}: SectionProps) {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);

  const handleToggle = () => {
    if (collapsible) {
      setIsCollapsed(!isCollapsed);
    }
  };

  return (
    <div
      style={{
        marginBottom: `${SPACING.xl}px`,
        padding: `${SPACING.lg}px`,
        backgroundColor: COLORS.background.tertiary,
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        borderRadius: `${RADIUS.lg}px`,
        border: `1px solid ${COLORS.border.default}`,
        boxShadow: SHADOWS.md,
      }}
    >
      {/* Header */}
      <div
        onClick={handleToggle}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: isCollapsed ? 0 : `${SPACING.md}px`,
          cursor: collapsible ? 'pointer' : 'default',
          userSelect: 'none',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: `${SPACING.xs}px` }}>
          {icon && icon}
          <h3
            style={{
              fontSize: `${TYPOGRAPHY.fontSize.lg}px`,
              fontWeight: TYPOGRAPHY.fontWeight.semibold,
              margin: 0,
              color: COLORS.text.primary,
            }}
          >
            {title}
          </h3>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: `${SPACING.xs}px` }}>
          {headerAction && headerAction}
          {collapsible && (
            isCollapsed ? (
              <ChevronDown size={ICON.size.sm} color={COLORS.text.secondary} />
            ) : (
              <ChevronUp size={ICON.size.sm} color={COLORS.text.secondary} />
            )
          )}
        </div>
      </div>

      {/* Content */}
      {!isCollapsed && (
        <div
          style={{
            animation: 'slideDown 150ms ease-out',
          }}
        >
          {children}
        </div>
      )}
    </div>
  );
}
