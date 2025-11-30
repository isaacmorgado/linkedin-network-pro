/**
 * Button Component
 *
 * Consistent button styling with size and variant options.
 */

import React from 'react';
import { BUTTON, COLORS, RADIUS, TRANSITIONS, TYPOGRAPHY, SPACING } from '../../styles/tokens';

export interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  fullWidth?: boolean;
  icon?: React.ReactNode;
  className?: string;
  type?: 'button' | 'submit' | 'reset';
}

export function Button({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  disabled = false,
  fullWidth = false,
  icon,
  className = '',
  type = 'button',
}: ButtonProps) {
  const sizeConfig = BUTTON.size[size];

  const variants = {
    primary: {
      background: disabled ? COLORS.accent.light : COLORS.accent.default,
      color: COLORS.text.inverse,
      hoverBg: COLORS.accent.hover,
      border: 'none',
    },
    secondary: {
      background: 'transparent',
      color: COLORS.accent.default,
      hoverBg: COLORS.accent.lighter,
      border: `1px solid ${COLORS.accent.default}`,
    },
    ghost: {
      background: 'transparent',
      color: COLORS.text.primary,
      hoverBg: COLORS.background.hover,
      border: 'none',
    },
    danger: {
      background: disabled ? COLORS.status.errorBg : COLORS.status.error,
      color: COLORS.text.inverse,
      hoverBg: '#A02020',
      border: 'none',
    },
  };

  const variantStyles = variants[variant];

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={className}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: icon ? `${SPACING.xs}px` : '0',
        padding: sizeConfig.padding,
        fontSize: `${sizeConfig.fontSize}px`,
        fontWeight: TYPOGRAPHY.fontWeight.semibold,
        backgroundColor: variantStyles.background,
        color: variantStyles.color,
        border: variantStyles.border,
        borderRadius: `${RADIUS.md}px`,
        cursor: disabled ? 'not-allowed' : 'pointer',
        transition: `all ${TRANSITIONS.duration.normal}ms ${TRANSITIONS.easing.standardStr}`,
        width: fullWidth ? '100%' : 'auto',
        opacity: disabled ? 0.6 : 1,
        fontFamily: 'inherit',
      }}
      onMouseEnter={(e) => {
        if (!disabled) {
          e.currentTarget.style.backgroundColor = variantStyles.hoverBg;
        }
      }}
      onMouseLeave={(e) => {
        if (!disabled) {
          e.currentTarget.style.backgroundColor = variantStyles.background;
        }
      }}
    >
      {icon && icon}
      {children}
    </button>
  );
}
