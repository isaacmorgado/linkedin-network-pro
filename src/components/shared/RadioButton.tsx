/**
 * RadioButton Component
 *
 * Custom radio button with explicit visual states for reliable feedback in Chrome extensions.
 * Uses DOM manipulation to ensure visual updates even when LinkedIn CSS tries to override.
 */

import { useRef, useEffect } from 'react';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS, TRANSITIONS } from '../../styles/tokens';

export interface RadioButtonProps {
  label: string;
  checked: boolean;
  onChange: () => void;
  disabled?: boolean;
}

export function RadioButton({
  label,
  checked,
  onChange,
  disabled = false,
}: RadioButtonProps) {
  const circleRef = useRef<HTMLDivElement>(null);
  const dotRef = useRef<HTMLDivElement>(null);

  // Force visual update using direct DOM manipulation
  // This ensures the radio button state is visually updated even in Chrome extension context
  useEffect(() => {
    if (circleRef.current) {
      const borderColor = checked ? COLORS.accent.default : COLORS.border.default;
      circleRef.current.style.borderColor = borderColor;
      circleRef.current.setAttribute('data-checked', String(checked));
      circleRef.current.setAttribute('aria-checked', String(checked));
    }

    if (dotRef.current) {
      dotRef.current.style.opacity = checked ? '1' : '0';
      dotRef.current.style.transform = checked ? 'scale(1)' : 'scale(0)';
    }
  }, [checked]);

  return (
    <label
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: `${SPACING.xs + 2}px`,
        cursor: disabled ? 'not-allowed' : 'pointer',
        padding: `${SPACING.xs}px`,
        borderRadius: `${RADIUS.sm}px`,
        transition: `background-color ${TRANSITIONS.duration.normal}ms ${TRANSITIONS.easing.standardStr}`,
        opacity: disabled ? 0.5 : 1,
        userSelect: 'none',
      }}
      onMouseEnter={(e) => {
        if (!disabled) {
          e.currentTarget.style.backgroundColor = COLORS.background.hover;
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = 'transparent';
      }}
    >
      <div
        ref={circleRef}
        onClick={disabled ? undefined : onChange}
        role="radio"
        aria-checked={checked}
        aria-label={label}
        tabIndex={disabled ? -1 : 0}
        data-radio
        data-checked={checked}
        onKeyDown={(e) => {
          if (!disabled && (e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault();
            onChange();
          }
        }}
        style={{
          width: '18px',
          height: '18px',
          minWidth: '18px',
          minHeight: '18px',
          border: `2px solid ${checked ? COLORS.accent.default : COLORS.border.default}`,
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: disabled ? 'not-allowed' : 'pointer',
          transition: `all ${TRANSITIONS.duration.fast}ms ${TRANSITIONS.easing.standardStr}`,
          position: 'relative',
        }}
      >
        <div
          ref={dotRef}
          style={{
            width: '10px',
            height: '10px',
            borderRadius: '50%',
            backgroundColor: COLORS.accent.default,
            opacity: checked ? 1 : 0,
            transform: checked ? 'scale(1)' : 'scale(0)',
            transition: `all ${TRANSITIONS.duration.fast}ms ${TRANSITIONS.easing.standardStr}`,
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
