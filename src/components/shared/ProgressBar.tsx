/**
 * ProgressBar Component
 *
 * Consistent progress indicator following established design patterns.
 * Supports both linear and stepped progress displays.
 */


import { COLORS, SPACING, TRANSITIONS } from '../../styles/tokens';

export interface ProgressBarProps {
  /** Current progress value (0-max) */
  value: number;
  /** Maximum value (default: 100) */
  max?: number;
  /** Variant style */
  variant?: 'linear' | 'stepped';
  /** Number of steps (for stepped variant) */
  steps?: number;
  /** Current step (for stepped variant, 0-indexed) */
  currentStep?: number;
  /** Progress bar height in pixels */
  height?: number;
  /** Show label with progress text */
  showLabel?: boolean;
  /** Custom label text */
  label?: string;
  /** Color override */
  color?: string;
  /** Color when complete */
  completeColor?: string;
  /** Show as complete (uses complete color) */
  isComplete?: boolean;
}

export function ProgressBar({
  value,
  max = 100,
  variant = 'linear',
  steps = 3,
  currentStep = 0,
  height = 6,
  showLabel = false,
  label,
  color = COLORS.accent.default,
  completeColor = '#30D158',
  isComplete = false,
}: ProgressBarProps) {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));
  const activeColor = isComplete ? completeColor : color;

  if (variant === 'stepped') {
    return (
      <div style={{ width: '100%' }}>
        {/* Stepped indicators */}
        <div
          style={{
            display: 'flex',
            gap: `${SPACING.xs}px`,
            marginBottom: showLabel ? `${SPACING.sm}px` : 0,
          }}
        >
          {Array.from({ length: steps }).map((_, index) => (
            <div
              key={index}
              style={{
                flex: 1,
                height: `${height}px`,
                backgroundColor: index <= currentStep ? activeColor : COLORS.background.tertiary,
                borderRadius: `${height / 2}px`,
                transition: `background-color ${TRANSITIONS.duration.slow}ms ${TRANSITIONS.easing.standardStr}`,
              }}
            />
          ))}
        </div>

        {/* Optional label */}
        {showLabel && (
          <div
            style={{
              fontSize: '11px',
              fontWeight: 500,
              color: COLORS.text.secondary,
              textAlign: 'center',
            }}
          >
            {label || `Step ${currentStep + 1} of ${steps}`}
          </div>
        )}
      </div>
    );
  }

  // Linear variant (default)
  return (
    <div style={{ width: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: `${SPACING.sm}px` }}>
        {/* Progress bar container */}
        <div
          style={{
            flex: 1,
            height: `${height}px`,
            backgroundColor: COLORS.background.tertiary,
            borderRadius: `${height / 2}px`,
            overflow: 'hidden',
          }}
        >
          {/* Progress fill */}
          <div
            style={{
              width: `${percentage}%`,
              height: '100%',
              backgroundColor: activeColor,
              transition: `width ${TRANSITIONS.duration.slow}ms ${TRANSITIONS.easing.standardStr}`,
              borderRadius: `${height / 2}px`,
            }}
          />
        </div>

        {/* Optional label */}
        {showLabel && (
          <div
            style={{
              fontSize: '11px',
              fontWeight: 600,
              color: COLORS.text.primary,
              minWidth: '45px',
              textAlign: 'right',
            }}
          >
            {label || `${Math.round(percentage)}%`}
          </div>
        )}
      </div>
    </div>
  );
}
