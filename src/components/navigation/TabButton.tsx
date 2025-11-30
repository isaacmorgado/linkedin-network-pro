/**
 * Tab Button Component
 * Individual tab with icon, label, and optional badge
 */

import React, { useRef, useState, useEffect } from 'react';
import type { TabButtonProps } from '../../types/navigation';
import { TabBadge } from './TabBadge';
import { log, LogCategory } from '../../utils/logger';

export function TabButton({ tab, isActive, onClick, badgeCount, compact = false, totalVisibleTabs = 6 }: TabButtonProps) {
  const [isHovered, setIsHovered] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Log mount and active state changes
  useEffect(() => {
    log.debug(LogCategory.UI, 'TabButton state changed', {
      tabId: tab.id,
      isActive,
      badgeCount
    });
  }, [isActive, tab.id, badgeCount]);

  const Icon = tab.icon;

  // Smart sizing: reduce minWidth when there are 7+ tabs to ensure all fit
  const shouldShrink = totalVisibleTabs >= 7;
  const minWidth = compact ? '50px' : shouldShrink ? '48px' : '60px';
  const padding = compact ? '6px 8px' : shouldShrink ? '8px 8px' : '8px 12px';

  const baseStyles: React.CSSProperties = {
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: compact ? '2px' : '4px',
    padding,
    minWidth,
    background: isActive ? 'rgba(0, 119, 181, 0.1)' : 'transparent',
    border: 'none',
    borderRadius: '12px',
    cursor: 'pointer',
    transition: 'all 150ms ease-in-out',
    outline: 'none',
    WebkitTapHighlightColor: 'transparent',
  };

  const hoverStyles: React.CSSProperties = isHovered && !isActive
    ? {
        background: 'rgba(0, 0, 0, 0.04)',
      }
    : {};

  const iconColor = isActive ? '#0077B5' : isHovered ? '#1d1d1f' : '#8e8e93';
  const labelColor = isActive ? '#0077B5' : isHovered ? '#1d1d1f' : '#8e8e93';

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    log.action('Tab button clicked', {
      tabId: tab.id,
      tabLabel: tab.label,
      wasActive: isActive,
      component: 'TabButton'
    });
    onClick();

    // Add a subtle press animation
    if (buttonRef.current) {
      buttonRef.current.style.transform = 'scale(0.95)';
      setTimeout(() => {
        if (buttonRef.current) {
          buttonRef.current.style.transform = 'scale(1)';
        }
      }, 100);
    }
  };

  const shortcutLabel = tab.shortcut ? `Alt+${tab.shortcut}` : undefined;

  return (
    <button
      ref={buttonRef}
      role="tab"
      aria-selected={isActive}
      aria-controls={`panel-${tab.id}`}
      aria-label={`${tab.label}${badgeCount ? ` (${badgeCount} items)` : ''}`}
      tabIndex={isActive ? 0 : -1}
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{ ...baseStyles, ...hoverStyles }}
      title={shortcutLabel ? `${tab.label} (${shortcutLabel})` : tab.label}
    >
      {/* Icon */}
      <div style={{ position: 'relative' }}>
        <Icon size={compact ? 18 : 20} color={iconColor} strokeWidth={2} />
        {badgeCount !== undefined && badgeCount > 0 && tab.badge && (
          <TabBadge count={badgeCount} color={tab.badgeColor || 'blue'} />
        )}
      </div>

      {/* Label */}
      {!compact && (
        <span
          style={{
            fontSize: '11px',
            fontWeight: isActive ? '600' : '500',
            color: labelColor,
            transition: 'color 150ms ease-in-out',
            whiteSpace: 'nowrap',
          }}
        >
          {tab.label}
        </span>
      )}

      {/* Active Indicator */}
      {isActive && (
        <div
          style={{
            position: 'absolute',
            bottom: '-8px',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '32px',
            height: '3px',
            borderRadius: '1.5px',
            backgroundColor: '#0077B5',
            animation: 'indicatorSlideIn 300ms cubic-bezier(0.25, 0.1, 0.25, 1)',
          }}
        />
      )}

      <style>
        {`
          @keyframes indicatorSlideIn {
            0% {
              width: 0px;
              opacity: 0;
            }
            100% {
              width: 32px;
              opacity: 1;
            }
          }
        `}
      </style>
    </button>
  );
}
