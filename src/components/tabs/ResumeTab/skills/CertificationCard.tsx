import { Trash2 } from 'lucide-react';
import type { Certification } from '../../../../types/resume';


export function CertificationCard({ certification, onDelete }: { certification: Certification; onDelete: () => void }) {
  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const [year, month] = dateStr.split('-');
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${monthNames[parseInt(month) - 1]} ${year}`;
  };

  const isExpired = certification.expiryDate && new Date(certification.expiryDate) < new Date();

  return (
    <div style={{ backgroundColor: 'white', border: '1px solid rgba(0, 0, 0, 0.08)', borderRadius: '8px', padding: '14px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <span style={{ fontSize: '16px' }}>🎓</span>
            <h3 style={{ fontSize: '15px', fontWeight: '600', color: '#1d1d1f', margin: 0 }}>
              {certification.name}
            </h3>
            {certification.acronym && (
              <span style={{ fontSize: '12px', color: '#6e6e73', fontWeight: '600' }}>
                ({certification.acronym})
              </span>
            )}
          </div>

          <div style={{ fontSize: '13px', color: '#6e6e73', marginBottom: '6px' }}>
            {certification.issuer}
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center', fontSize: '12px', color: '#6e6e73' }}>
            {certification.issueDate && (
              <span>Issued: {formatDate(certification.issueDate)}</span>
            )}
            {certification.expiryDate && (
              <span style={{ color: isExpired ? '#dc2626' : '#6e6e73' }}>
                {isExpired ? '⚠️ Expired' : 'Expires'}: {formatDate(certification.expiryDate)}
              </span>
            )}
          </div>

          {(certification.credentialId || certification.credentialUrl) && (
            <div style={{ marginTop: '8px', fontSize: '11px', color: '#9ca3af' }}>
              {certification.credentialId && <div>ID: {certification.credentialId}</div>}
              {certification.credentialUrl && (
                <a href={certification.credentialUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#0077B5', textDecoration: 'none' }}>
                  View Credential →
                </a>
              )}
            </div>
          )}
        </div>

        <button onClick={onDelete} style={{ padding: '6px', background: 'transparent', border: 'none', color: '#dc2626', cursor: 'pointer', borderRadius: '4px' }}>
          <Trash2 size={14} strokeWidth={2} />
        </button>
      </div>
    </div>
  );
}

// ============================================================================
// LANGUAGE FORMS & CARDS
// ============================================================================

