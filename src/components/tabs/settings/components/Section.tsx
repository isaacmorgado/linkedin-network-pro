/**
 * Section Component
 * Reusable section container for settings groups
 */

import React from 'react';

interface SectionProps {
  title: string | React.ReactNode;
  icon: React.ReactNode;
  children: React.ReactNode;
  accentColor: string;
  backgroundColor: string;
  textColor: string;
}

export function Section({ title, icon, children, accentColor, backgroundColor, textColor }: SectionProps) {
  return (
    <div
      style={{
        backgroundColor: `${backgroundColor}e6`,
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        borderRadius: '12px',
        padding: '16px',
        marginBottom: '16px',
        border: `1px solid ${textColor}15`,
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
        transition: 'all 250ms cubic-bezier(0.4, 0.0, 0.2, 1)',
        transform: 'translateY(0)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow = '0 8px 16px rgba(0, 0, 0, 0.15)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.08)';
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          marginBottom: '16px',
          paddingBottom: '12px',
          borderBottom: `1px solid ${textColor}20`,
        }}
      >
        <div style={{ color: accentColor }}>{icon}</div>
        <h3
          style={{
            fontSize: '16px',
            fontWeight: '700',
            margin: 0,
            color: textColor,
          }}
        >
          {title}
        </h3>
      </div>
      {children}
    </div>
  );
}
