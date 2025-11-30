/**
 * Tab Badge Component
 * Displays notification counts on tabs
 */

import { useEffect } from 'react';
import type { TabBadgeProps } from '../../types/navigation';
import { log, LogCategory } from '../../utils/logger';

export function TabBadge({ count, color = 'red' }: TabBadgeProps) {
  // Log badge display
  useEffect(() => {
    if (count > 0) {
      log.debug(LogCategory.UI, 'TabBadge displayed', { count, color });
    }
  }, [count, color]);

  if (count === 0) return null;

  const colors = {
    red: {
      background: '#FF3B30',
      text: '#FFFFFF',
    },
    orange: {
      background: '#FF9500',
      text: '#FFFFFF',
    },
    blue: {
      background: '#0077B5',
      text: '#FFFFFF',
    },
    green: {
      background: '#30D158',
      text: '#FFFFFF',
    },
  };

  const displayCount = count > 99 ? '99+' : count.toString();

  return (
    <div
      style={{
        position: 'absolute',
        top: '-6px',
        right: '-8px',
        minWidth: '18px',
        height: '18px',
        borderRadius: '9px',
        backgroundColor: colors[color].background,
        color: colors[color].text,
        fontSize: '11px',
        fontWeight: '600',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '0 5px',
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
        zIndex: 10,
        animation: 'badgePopIn 200ms cubic-bezier(0.34, 1.56, 0.64, 1)',
      }}
    >
      {displayCount}
      <style>
        {`
          @keyframes badgePopIn {
            0% {
              transform: scale(0.5);
              opacity: 0;
            }
            100% {
              transform: scale(1);
              opacity: 1;
            }
          }
        `}
      </style>
    </div>
  );
}
