/**
 * Slider Control Component
 * Numeric slider input for range values
 */

import React from 'react';

interface SliderControlProps {
  label: string;
  description: string;
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
  accentColor: string;
}

export function SliderControl({ label, description, value, min, max, onChange, accentColor }: SliderControlProps) {
  // Use white theme colors (hardcoded to avoid useTheme dependency)
  const textColor = '#1d1d1f';

  // Event handlers to prevent slider drag from propagating to panel drag
  const handleMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    e.stopPropagation();
  };

  return (
    <div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: '12px',
        }}
      >
        <div style={{ flex: 1 }}>
          <div
            style={{
              fontSize: '14px',
              fontWeight: '600',
              color: textColor,
              marginBottom: '4px',
            }}
          >
            {label}
          </div>
          <div
            style={{
              fontSize: '12px',
              color: `${textColor}80`,
              lineHeight: '1.4',
            }}
          >
            {description}
          </div>
        </div>
        <div
          style={{
            fontSize: '14px',
            fontWeight: '600',
            color: accentColor,
            minWidth: '32px',
            textAlign: 'right',
          }}
        >
          {value}
        </div>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        style={{
          width: '100%',
          height: '6px',
          borderRadius: '3px',
          background: `linear-gradient(to right, ${accentColor} 0%, ${accentColor} ${((value - min) / (max - min)) * 100}%, #d1d1d6 ${((value - min) / (max - min)) * 100}%, #d1d1d6 100%)`,
          outline: 'none',
          WebkitAppearance: 'none',
          appearance: 'none',
          cursor: 'pointer',
        }}
      />
    </div>
  );
}
