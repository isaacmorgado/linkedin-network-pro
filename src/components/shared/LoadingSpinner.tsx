/**
 * LoadingSpinner Component
 *
 * Consistent loading indicator across the extension.
 * Uses shared spin animation from animations.css
 */


import { RefreshCw } from 'lucide-react';
import '../../styles/animations.css';
import { COLORS } from '../../styles/tokens';

export interface LoadingSpinnerProps {
  size?: number;
  color?: string;
  className?: string;
}

export function LoadingSpinner({
  size = 20,
  color = COLORS.accent.default,
  className = '',
}: LoadingSpinnerProps) {
  return (
    <RefreshCw
      size={size}
      color={color}
      className={`animate-spin ${className}`}
    />
  );
}
