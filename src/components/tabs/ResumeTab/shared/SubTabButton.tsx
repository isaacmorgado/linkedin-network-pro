import React from 'react';

interface SubTabButtonProps {
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  onClick: () => void;
  panelWidth: number;
}

export function SubTabButton({ icon, label, isActive, onClick, panelWidth }: SubTabButtonProps) {
  // Responsive sizing
  const isIconOnly = panelWidth < 360;
  const isSmall = panelWidth < 420;

  // Abbreviated labels for small screens
  const shortLabel = label === 'Experience' ? 'Exp' : label === 'Education' ? 'Edu' : label === 'Generate' ? 'Gen' : label;

  return (
    <button
      onClick={onClick}
      title={label} // Tooltip for icon-only mode
      style={{
        flex: 1,
        padding: isIconOnly ? '10px 8px' : isSmall ? '8px 10px' : '10px 14px',
        background: isActive ? '#0077B5' : 'white',
        color: isActive ? 'white' : '#6e6e73',
        border: isActive ? 'none' : '1px solid rgba(0, 0, 0, 0.12)',
        borderRadius: isSmall ? '6px' : '8px',
        fontSize: '13px',
        fontWeight: '600',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '6px',
        transition: 'all 0.2s',
        minWidth: 0,
      }}
      onMouseEnter={(e) => {
        if (!isActive) {
          e.currentTarget.style.backgroundColor = '#f9fafb';
          e.currentTarget.style.borderColor = 'rgba(0, 0, 0, 0.16)';
        }
      }}
      onMouseLeave={(e) => {
        if (!isActive) {
          e.currentTarget.style.backgroundColor = 'white';
          e.currentTarget.style.borderColor = 'rgba(0, 0, 0, 0.12)';
        }
      }}
    >
      {icon}
      {!isIconOnly && (
        <span style={{
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}>
          {isSmall ? shortLabel : label}
        </span>
      )}
    </button>
  );
}
