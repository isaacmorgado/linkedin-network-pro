/**
 * RadioButton Component
 *
 * Consistent radio button with label.
 */


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
      <input
        type="radio"
        checked={checked}
        onChange={disabled ? undefined : onChange}
        disabled={disabled}
        style={{
          width: '18px',
          height: '18px',
          cursor: disabled ? 'not-allowed' : 'pointer',
          accentColor: COLORS.accent.default,
        }}
      />
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
