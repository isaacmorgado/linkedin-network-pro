/**
 * Design Tokens - Uproot Design System
 *
 * Centralized design values for consistent UI across the extension.
 * All spacing uses 8px base unit for consistency.
 */

// ============================================================================
// SPACING (8px base unit)
// ============================================================================

export const SPACING = {
  none: 0,
  xxs: 4,   // 4px - Tiny gaps
  xs: 8,    // 8px - Small gaps, tight padding
  sm: 12,   // 12px - Default gaps
  md: 16,   // 16px - Medium padding, margins
  lg: 20,   // 20px - Large padding
  xl: 24,   // 24px - Section spacing
  xxl: 32,  // 32px - Major section spacing
  xxxl: 40, // 40px - Page-level spacing
} as const;

// ============================================================================
// TYPOGRAPHY
// ============================================================================

export const TYPOGRAPHY = {
  fontSize: {
    xs: 10,    // 10px - Micro text
    sm: 11,    // 11px - Small text, labels
    base: 13,  // 13px - Body text (default)
    md: 14,    // 14px - Slightly larger body
    lg: 16,    // 16px - Subsection headings (h3)
    xl: 20,    // 20px - Section headings (h2)
    xxl: 24,   // 24px - Page titles (h1)
    xxxl: 28,  // 28px - Hero text
  },
  fontWeight: {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },
  lineHeight: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.75,
  },
} as const;

// ============================================================================
// COLORS
// ============================================================================

export const COLORS = {
  // Primary text colors
  text: {
    primary: '#1d1d1f',
    secondary: 'rgba(29, 29, 31, 0.7)',  // 70% opacity
    tertiary: 'rgba(29, 29, 31, 0.5)',   // 50% opacity
    disabled: 'rgba(29, 29, 31, 0.3)',   // 30% opacity
    inverse: '#FFFFFF',
  },

  // Background colors
  background: {
    primary: '#FFFFFF',
    secondary: 'rgba(29, 29, 31, 0.05)', // 5% gray
    tertiary: 'rgba(29, 29, 31, 0.08)',  // 8% gray
    hover: 'rgba(29, 29, 31, 0.04)',     // 4% gray
  },

  // Accent color (LinkedIn blue)
  accent: {
    default: '#0077B5',
    hover: '#005582',   // 18% darker
    active: '#004466',  // 36% darker
    light: 'rgba(0, 119, 181, 0.1)',   // 10% opacity
    lighter: 'rgba(0, 119, 181, 0.05)', // 5% opacity
  },

  // Border colors
  border: {
    default: 'rgba(29, 29, 31, 0.15)',  // 15% opacity
    light: 'rgba(29, 29, 31, 0.1)',     // 10% opacity
    lighter: 'rgba(29, 29, 31, 0.05)',  // 5% opacity
  },

  // Status colors
  status: {
    success: '#2E7D32',
    successBg: '#E8F5E9',
    error: '#C62828',
    errorBg: '#FFEBEE',
    warning: '#F57C00',
    warningBg: '#FFF3E0',
    info: '#0277BD',
    infoBg: '#E1F5FE',
  },

  // Badge colors
  badge: {
    red: '#EF4444',
    orange: '#F97316',
    blue: '#3B82F6',
    green: '#10B981',
  },
} as const;

// ============================================================================
// BORDER RADIUS
// ============================================================================

export const RADIUS = {
  none: 0,
  sm: 6,    // 6px - Small elements (badges, chips)
  md: 8,    // 8px - Buttons, inputs
  lg: 12,   // 12px - Cards, sections
  xl: 16,   // 16px - Large cards, modals
  full: 9999, // Pill shape
} as const;

// ============================================================================
// SHADOWS
// ============================================================================

export const SHADOWS = {
  none: 'none',
  sm: '0 1px 2px rgba(0, 0, 0, 0.05)',
  md: '0 2px 8px rgba(0, 0, 0, 0.06)',
  lg: '0 4px 12px rgba(0, 0, 0, 0.08)',
  xl: '0 8px 24px rgba(0, 0, 0, 0.12)',
} as const;

// ============================================================================
// TRANSITIONS
// ============================================================================

export const TRANSITIONS = {
  duration: {
    instant: 0,
    fast: 100,    // 100ms - Micro-interactions (toggles, checkboxes)
    normal: 150,  // 150ms - Buttons, hover states (STANDARD)
    slow: 300,    // 300ms - Modals, panels, large movements
  },
  easing: {
    // CSS cubic-bezier values
    enter: 'cubic-bezier(0.0, 0.0, 0.2, 1)',     // Deceleration (ease-in)
    exit: 'cubic-bezier(0.4, 0.0, 1, 1)',        // Acceleration (ease-out)
    standard: 'cubic-bezier(0.4, 0.0, 0.2, 1)',  // Standard (ease-in-out)

    // String values for CSS
    enterStr: 'ease-in',
    exitStr: 'ease-out',
    standardStr: 'ease-in-out',
  },
} as const;

// ============================================================================
// Z-INDEX LAYERS
// ============================================================================

export const Z_INDEX = {
  base: 0,
  dropdown: 1000,
  sticky: 1100,
  overlay: 1200,
  modal: 1300,
  popover: 1400,
  tooltip: 1500,
} as const;

// ============================================================================
// BUTTON SIZES
// ============================================================================

export const BUTTON = {
  size: {
    sm: {
      padding: `${SPACING.xs}px ${SPACING.sm}px`,   // 8px 12px
      fontSize: TYPOGRAPHY.fontSize.sm,              // 11px
      height: 32,
    },
    md: {
      padding: `${SPACING.xs + 2}px ${SPACING.md}px`, // 10px 16px
      fontSize: TYPOGRAPHY.fontSize.base,             // 13px
      height: 36,
    },
    lg: {
      padding: `${SPACING.sm}px ${SPACING.lg}px`,  // 12px 20px
      fontSize: TYPOGRAPHY.fontSize.md,             // 14px
      height: 40,
    },
  },
} as const;

// ============================================================================
// ICON SIZES
// ============================================================================

export const ICON = {
  size: {
    xs: 12,
    sm: 16,
    md: 20,
    lg: 24,
    xl: 32,
  },
} as const;

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Create a transition CSS string
 */
export function transition(
  properties: string | string[],
  duration: keyof typeof TRANSITIONS.duration = 'normal',
  easing: 'enter' | 'exit' | 'standard' = 'standard'
): string {
  const props = Array.isArray(properties) ? properties : [properties];
  const dur = TRANSITIONS.duration[duration];
  const ease = TRANSITIONS.easing[easing];

  return props.map(prop => `${prop} ${dur}ms ${ease}`).join(', ');
}

/**
 * Apply consistent spacing
 */
export function spacing(...values: (keyof typeof SPACING)[]): string {
  return values.map(key => `${SPACING[key]}px`).join(' ');
}

/**
 * Darken a hex color by a percentage
 */
export function darken(hex: string, percent: number): string {
  const num = parseInt(hex.replace('#', ''), 16);
  const r = Math.max(0, Math.floor((num >> 16) * (1 - percent / 100)));
  const g = Math.max(0, Math.floor(((num >> 8) & 0x00FF) * (1 - percent / 100)));
  const b = Math.max(0, Math.floor((num & 0x0000FF) * (1 - percent / 100)));

  return '#' + (r << 16 | g << 8 | b).toString(16).padStart(6, '0');
}

/**
 * Lighten a hex color by a percentage
 */
export function lighten(hex: string, percent: number): string {
  const num = parseInt(hex.replace('#', ''), 16);
  const r = Math.min(255, Math.floor((num >> 16) + (255 - (num >> 16)) * (percent / 100)));
  const g = Math.min(255, Math.floor(((num >> 8) & 0x00FF) + (255 - ((num >> 8) & 0x00FF)) * (percent / 100)));
  const b = Math.min(255, Math.floor((num & 0x0000FF) + (255 - (num & 0x0000FF)) * (percent / 100)));

  return '#' + (r << 16 | g << 8 | b).toString(16).padStart(6, '0');
}
