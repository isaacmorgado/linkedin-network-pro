/**
 * Checkbox Component
 *
 * Custom checkbox with explicit visual states for reliable feedback in Chrome extensions.
 * Uses DOM manipulation to ensure visual updates even when LinkedIn CSS tries to override.
 */

import { useRef, useEffect } from 'react';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS, TRANSITIONS } from '../../styles/tokens';
import { Check } from 'lucide-react';

export interface CheckboxProps {
  label: string;
  description?: string;
  checked: boolean;
  onChange: () => void;
  disabled?: boolean;
}

export function Checkbox({
  label,
  description,
  checked,
  onChange,
  disabled = false,
}: CheckboxProps) {
  const boxRef = useRef<HTMLDivElement>(null);
  const checkRef = useRef<HTMLDivElement>(null);

  // Force visual update using direct DOM manipulation
  // This ensures the checkbox state is visually updated even in Chrome extension context
  useEffect(() => {
    if (boxRef.current) {
      const bgColor = checked ? COLORS.accent.default : 'transparent';
      const borderColor = checked ? COLORS.accent.default : COLORS.border.default;
      boxRef.current.style.backgroundColor = bgColor;
      boxRef.current.style.borderColor = borderColor;
      boxRef.current.setAttribute('data-checked', String(checked));
      boxRef.current.setAttribute('aria-checked', String(checked));
    }

    if (checkRef.current) {
      checkRef.current.style.opacity = checked ? '1' : '0';
      checkRef.current.style.transform = checked ? 'scale(1)' : 'scale(0.5)';
    }
  }, [checked]);

  return (
    <label
      style={{
        display: 'flex',
        alignItems: 'flex-start',
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
        ref={boxRef}
        onClick={disabled ? undefined : onChange}
        role="checkbox"
        aria-checked={checked}
        aria-label={label}
        tabIndex={disabled ? -1 : 0}
        data-checkbox
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
          marginTop: '2px',
          border: `2px solid ${checked ? COLORS.accent.default : COLORS.border.default}`,
          borderRadius: `${RADIUS.sm / 2}px`,
          backgroundColor: checked ? COLORS.accent.default : 'transparent',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: disabled ? 'not-allowed' : 'pointer',
          transition: `all ${TRANSITIONS.duration.fast}ms ${TRANSITIONS.easing.standardStr}`,
          position: 'relative',
        }}
      >
        <div
          ref={checkRef}
          style={{
            opacity: checked ? 1 : 0,
            transform: checked ? 'scale(1)' : 'scale(0.5)',
            transition: `all ${TRANSITIONS.duration.fast}ms ${TRANSITIONS.easing.standardStr}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#FFFFFF',
            lineHeight: 0,
          }}
        >
          <Check size={14} strokeWidth={3} />
        </div>
      </div>
      <div style={{ flex: 1 }}>
        <div
          style={{
            fontSize: `${TYPOGRAPHY.fontSize.base}px`,
            fontWeight: TYPOGRAPHY.fontWeight.medium,
            color: COLORS.text.primary,
            marginBottom: description ? '2px' : 0,
          }}
        >
          {label}
        </div>
        {description && (
          <div
            style={{
              fontSize: `${TYPOGRAPHY.fontSize.sm}px`,
              color: COLORS.text.tertiary,
            }}
          >
            {description}
          </div>
        )}
      </div>
    </label>
  );
}
