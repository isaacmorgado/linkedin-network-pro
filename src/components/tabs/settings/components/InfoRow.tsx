/**
 * Info Row Component
 * Displays a key-value pair for read-only information
 */

interface InfoRowProps {
  label: string;
  value: string;
  textColor: string;
}

export function InfoRow({ label, value, textColor }: InfoRowProps) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '8px 0',
        borderBottom: `1px solid ${textColor}10`,
      }}
    >
      <span style={{ fontSize: '13px', color: `${textColor}80` }}>{label}</span>
      <span style={{ fontSize: '13px', fontWeight: '600', color: textColor }}>{value}</span>
    </div>
  );
}
