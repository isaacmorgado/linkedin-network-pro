/**
 * Toggle Component
 *
 * Consistent toggle switch for boolean settings.
 * Enhanced with direct DOM manipulation to ensure visual state updates in Chrome extension context.
 */

import { useRef, useEffect } from 'react';
import { COLORS, TRANSITIONS, TYPOGRAPHY, SPACING, SHADOWS } from '../../styles/tokens';

export interface ToggleProps {
  label: string;
  checked: boolean;
  onChange: () => void;
  disabled?: boolean;
}

export function Toggle({ label, checked, onChange, disabled = false }: ToggleProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const thumbRef = useRef<HTMLDivElement>(null);

  // Force visual update using direct DOM manipulation
  // This bypasses React's virtual DOM and ensures styles are applied
  // even if LinkedIn's CSS tries to override
  useEffect(() => {
    if (trackRef.current) {
      const bgColor = checked ? COLORS.accent.default : COLORS.background.tertiary;
      trackRef.current.style.backgroundColor = bgColor;
      // Also set via cssText for extra specificity
      trackRef.current.setAttribute('data-checked', String(checked));
    }

    if (thumbRef.current) {
      const leftPos = checked ? '22px' : '2px';
      thumbRef.current.style.left = leftPos;
    }
  }, [checked]);

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
        ref={trackRef}
        onClick={disabled ? undefined : onChange}
        role="switch"
        aria-checked={checked}
        aria-label={label}
        tabIndex={disabled ? -1 : 0}
        data-toggle-track
        data-checked={checked}
        onKeyDown={(e) => {
          if (!disabled && (e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault();
            onChange();
          }
        }}
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
          ref={thumbRef}
          data-toggle-thumb
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
