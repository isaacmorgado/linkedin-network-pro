
interface SectionButtonProps {
  label: string;
  isActive: boolean;
  onClick: () => void;
}

export function SectionButton({ label, isActive, onClick }: SectionButtonProps) {
  return (
    <button
      onClick={onClick}
      style={{
        flex: 1,
        padding: '8px 12px',
        background: isActive ? 'white' : 'transparent',
        color: isActive ? '#1d1d1f' : '#6e6e73',
        border: 'none',
        borderRadius: '6px',
        fontSize: '13px',
        fontWeight: '600',
        cursor: 'pointer',
        transition: 'all 0.2s',
        boxShadow: isActive ? '0 1px 3px rgba(0, 0, 0, 0.08)' : 'none',
      }}
    >
      {label}
    </button>
  );
}
