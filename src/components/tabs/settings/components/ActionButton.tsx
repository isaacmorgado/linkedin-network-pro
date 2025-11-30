/**
 * Action Button Component
 * Button for triggering actions (export, delete, etc.)
 */

import React, { useState } from 'react';

interface ActionButtonProps {
  icon: React.ReactNode;
  label: string;
  description: string;
  onClick: () => void;
  variant: 'primary' | 'danger';
  accentColor: string;
  textColor: string;
}

export function ActionButton({ icon, label, description, onClick, variant, accentColor, textColor: _textColor }: ActionButtonProps) {
  // Helper to darken a hex color for hover state
  const darkenColor = (hex: string, percent: number = 20) => {
    const num = parseInt(hex.slice(1), 16);
    const r = Math.max(0, ((num >> 16) & 0xff) * (1 - percent / 100));
    const g = Math.max(0, ((num >> 8) & 0xff) * (1 - percent / 100));
    const b = Math.max(0, (num & 0xff) * (1 - percent / 100));
    return `#${Math.round(r).toString(16).padStart(2, '0')}${Math.round(g).toString(16).padStart(2, '0')}${Math.round(b).toString(16).padStart(2, '0')}`;
  };

  const colors = {
    primary: {
      bg: accentColor,
      bgHover: darkenColor(accentColor, 15),
      text: '#FFFFFF',
    },
    danger: {
      bg: '#F44336',
      bgHover: '#D32F2F',
      text: '#FFFFFF',
    },
  };

  const [isHovered, setIsHovered] = useState(false);

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '12px 16px',
        backgroundColor: isHovered ? colors[variant].bgHover : colors[variant].bg,
        color: colors[variant].text,
        border: 'none',
        borderRadius: '8px',
        cursor: 'pointer',
        transition: 'background-color 150ms',
        width: '100%',
        textAlign: 'left',
      }}
    >
      <div style={{ flexShrink: 0 }}>{icon}</div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '2px' }}>{label}</div>
        <div style={{ fontSize: '12px', opacity: 0.9 }}>{description}</div>
      </div>
    </button>
  );
}
