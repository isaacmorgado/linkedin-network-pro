/**
 * Checkbox Component
 *
 * Consistent checkbox with label and optional description.
 */


import { COLORS, TYPOGRAPHY, SPACING, RADIUS, TRANSITIONS } from '../../styles/tokens';

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
        type="checkbox"
        checked={checked}
        onChange={disabled ? undefined : onChange}
        disabled={disabled}
        style={{
          width: '18px',
          height: '18px',
          marginTop: '2px',
          cursor: disabled ? 'not-allowed' : 'pointer',
          accentColor: COLORS.accent.default,
        }}
      />
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
