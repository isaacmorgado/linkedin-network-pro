/**
 * ActionCard Component
 *
 * Clickable card for features/actions.
 * Extracted from ProfileTab.tsx and CompanyTab.tsx (was duplicated).
 */

import React from 'react';
import { ChevronRight } from 'lucide-react';
import { COLORS, SPACING, RADIUS, TYPOGRAPHY, SHADOWS, ICON, TRANSITIONS } from '../../styles/tokens';

export interface ActionCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  onClick: () => void;
  badge?: string;
  badgeColor?: string;
}

export function ActionCard({
  icon,
  title,
  description,
  onClick,
  badge,
  badgeColor = COLORS.accent.default,
}: ActionCardProps) {
  const [isHovered, setIsHovered] = React.useState(false);

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        padding: `${SPACING.md}px`,
        backgroundColor: COLORS.background.primary,
        border: `1px solid ${COLORS.border.light}`,
        borderRadius: `${RADIUS.lg}px`,
        cursor: 'pointer',
        transition: `all ${TRANSITIONS.duration.normal}ms ${TRANSITIONS.easing.standardStr}`,
        boxShadow: isHovered ? SHADOWS.lg : SHADOWS.sm,
        transform: isHovered ? 'translateY(-2px)' : 'translateY(0)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: `${SPACING.sm}px` }}>
        {/* Icon */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '40px',
            height: '40px',
            backgroundColor: COLORS.accent.lighter,
            borderRadius: `${RADIUS.md}px`,
            flexShrink: 0,
          }}
        >
          {icon}
        </div>

        {/* Content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: `${SPACING.xs}px`, marginBottom: '2px' }}>
            <h4
              style={{
                fontSize: `${TYPOGRAPHY.fontSize.md}px`,
                fontWeight: TYPOGRAPHY.fontWeight.semibold,
                color: COLORS.text.primary,
                margin: 0,
              }}
            >
              {title}
            </h4>
            {badge && (
              <span
                style={{
                  fontSize: `${TYPOGRAPHY.fontSize.xs}px`,
                  fontWeight: TYPOGRAPHY.fontWeight.semibold,
                  color: COLORS.text.inverse,
                  backgroundColor: badgeColor,
                  padding: '2px 6px',
                  borderRadius: `${RADIUS.sm}px`,
                }}
              >
                {badge}
              </span>
            )}
          </div>
          <p
            style={{
              fontSize: `${TYPOGRAPHY.fontSize.sm}px`,
              color: COLORS.text.secondary,
              margin: 0,
            }}
          >
            {description}
          </p>
        </div>

        {/* Arrow */}
        <ChevronRight
          size={ICON.size.sm}
          color={COLORS.text.tertiary}
          style={{
            flexShrink: 0,
            transition: `transform ${TRANSITIONS.duration.normal}ms ${TRANSITIONS.easing.standardStr}`,
            transform: isHovered ? 'translateX(4px)' : 'translateX(0)',
          }}
        />
      </div>
    </div>
  );
}
