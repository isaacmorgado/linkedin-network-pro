/**
 * Save Bar Component for Unsaved Changes
 */


interface SaveBarProps {
  hasUnsavedChanges: boolean;
  saveMessage: string;
  onSave: () => void;
  onDiscard: () => void;
  accentColor: string;
  backgroundColor: string;
  textColor: string;
}

export function SaveBar({
  hasUnsavedChanges,
  saveMessage,
  onSave,
  onDiscard,
  accentColor,
  backgroundColor,
  textColor,
}: SaveBarProps) {
  return (
    <>
      {/* Save/Discard Bar */}
      {hasUnsavedChanges && (
        <div
          style={{
            backgroundColor: `${backgroundColor}e6`,
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            border: `1px solid ${accentColor}`,
            borderRadius: '8px',
            padding: '12px 16px',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            transition: 'all 250ms cubic-bezier(0.4, 0.0, 0.2, 1)',
            transform: 'translateY(0)',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
          }}
        >
          <span style={{ fontSize: '13px', color: textColor, fontWeight: '500' }}>
            You have unsaved changes
          </span>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={onDiscard}
              style={{
                padding: '6px 12px',
                backgroundColor: 'transparent',
                color: textColor,
                opacity: 0.6,
                border: `1px solid ${textColor}40`,
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 150ms',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.opacity = '1';
                e.currentTarget.style.backgroundColor = `${textColor}10`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.opacity = '0.6';
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              Discard
            </button>
            <button
              onClick={onSave}
              style={{
                padding: '6px 12px',
                backgroundColor: accentColor,
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 150ms',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.opacity = '0.85';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.opacity = '1';
              }}
            >
              Save Changes
            </button>
          </div>
        </div>
      )}

      {/* Save Message */}
      {saveMessage && (
        <div
          style={{
            backgroundColor: `${backgroundColor}e6`,
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            border: `1px solid ${saveMessage.startsWith('') ? '#4CAF50' : '#F44336'}`,
            borderRadius: '8px',
            padding: '12px 16px',
            marginBottom: '16px',
            fontSize: '13px',
            color: textColor,
            fontWeight: '500',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
          }}
        >
          {saveMessage}
        </div>
      )}
    </>
  );
}
