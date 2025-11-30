/**
 * Color Picker Component
 * Apple-style color picker with hex value display
 */

interface ColorPickerProps {
  label: string;
  description: string;
  value: string;
  onChange: (color: string) => void;
}

export function ColorPicker({ label, description, value, onChange }: ColorPickerProps) {
  // Use white theme colors (hardcoded to avoid useTheme dependency)
  const textColor = '#1d1d1f';

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
            fontSize: '12px',
            fontWeight: '600',
            color: textColor,
            minWidth: '80px',
            textAlign: 'right',
            fontFamily: 'monospace',
          }}
        >
          {value}
        </div>
      </div>
      <input
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          width: '100%',
          height: '40px',
          border: `1px solid ${textColor}20`,
          borderRadius: '8px',
          cursor: 'pointer',
        }}
      />
    </div>
  );
}
