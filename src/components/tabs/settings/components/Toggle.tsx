/**
 * Toggle Component
 * iOS-style toggle switch for boolean settings
 * Enhanced with direct DOM manipulation to ensure visual state updates in Chrome extension context.
 */

import { useRef, useEffect } from 'react';

interface ToggleProps {
  label: string;
  description?: string;
  checked: boolean;
  onChange: () => void;
  disabled?: boolean;
  accentColor: string;
  textColor: string;
}

export function Toggle({ label, description, checked, onChange, disabled = false, accentColor, textColor }: ToggleProps) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const thumbRef = useRef<HTMLDivElement>(null);

  // Force visual update using direct DOM manipulation
  // This bypasses React's virtual DOM and ensures styles are applied
  // even if LinkedIn's CSS tries to override
  useEffect(() => {
    if (buttonRef.current) {
      const bgColor = checked ? accentColor : '#d1d1d6';
      buttonRef.current.style.backgroundColor = bgColor;
      // Also set via attribute for debugging
      buttonRef.current.setAttribute('data-checked', String(checked));
      buttonRef.current.setAttribute('aria-checked', String(checked));
    }

    if (thumbRef.current) {
      const leftPos = checked ? '22px' : '2px';
      thumbRef.current.style.left = leftPos;
    }
  }, [checked, accentColor]);

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        gap: '12px',
      }}
    >
      <div style={{ flex: 1 }}>
        <div
          style={{
            fontSize: '14px',
            fontWeight: '600',
            color: disabled ? `${textColor}60` : textColor,
            marginBottom: description ? '4px' : 0,
          }}
        >
          {label}
        </div>
        {description && (
          <div
            style={{
              fontSize: '12px',
              color: `${textColor}80`,
              lineHeight: '1.4',
            }}
          >
            {description}
          </div>
        )}
      </div>
      <button
        ref={buttonRef}
        onClick={onChange}
        disabled={disabled}
        role="switch"
        aria-checked={checked}
        aria-label={label}
        data-toggle-button
        data-checked={checked}
        style={{
          position: 'relative',
          width: '44px',
          height: '24px',
          backgroundColor: checked ? accentColor : '#d1d1d6',
          borderRadius: '12px',
          border: 'none',
          cursor: disabled ? 'not-allowed' : 'pointer',
          transition: 'background-color 200ms',
          flexShrink: 0,
          opacity: disabled ? 0.5 : 1,
        }}
      >
        <div
          ref={thumbRef}
          data-toggle-thumb
          style={{
            position: 'absolute',
            top: '2px',
            left: checked ? '22px' : '2px',
            width: '20px',
            height: '20px',
            backgroundColor: '#FFFFFF',
            borderRadius: '50%',
            transition: 'left 200ms',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.2)',
          }}
        />
      </button>
    </div>
  );
}
