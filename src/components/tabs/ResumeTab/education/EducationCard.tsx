import { Trash2 } from 'lucide-react';
import type { Education } from '../../../../types/resume';


export function EducationCard({ education, onDelete }: { education: Education; onDelete: () => void }) {
  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const [year, month] = dateStr.split('-');
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${monthNames[parseInt(month) - 1]} ${year}`;
  };

  return (
    <div style={{ backgroundColor: 'white', border: '1px solid rgba(0, 0, 0, 0.08)', borderRadius: '8px', padding: '14px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <span style={{ fontSize: '16px' }}>🎓</span>
            <h3 style={{ fontSize: '15px', fontWeight: '600', color: '#1d1d1f', margin: 0 }}>
              {education.degree} in {education.field}
            </h3>
          </div>

          <div style={{ fontSize: '13px', color: '#6e6e73', marginBottom: '6px' }}>
            {education.institution} • {education.location}
          </div>

          <div style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '8px' }}>
            {formatDate(education.startDate)} - {education.current ? 'Present' : formatDate(education.endDate || '')}
            {education.gpa && ` • GPA: ${education.gpa}`}
          </div>

          {education.honors && education.honors.length > 0 && (
            <div style={{ marginTop: '8px' }}>
              <div style={{ fontSize: '12px', fontWeight: '600', color: '#1d1d1f', marginBottom: '4px' }}>Honors:</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                {education.honors.map((honor: string, i: number) => (
                  <div key={i} style={{ fontSize: '12px', color: '#059669' }}>
                    • {honor}
                  </div>
                ))}
              </div>
            </div>
          )}

          {education.relevantCoursework && education.relevantCoursework.length > 0 && (
            <div style={{ marginTop: '8px' }}>
              <div style={{ fontSize: '12px', fontWeight: '600', color: '#1d1d1f', marginBottom: '4px' }}>Relevant Coursework:</div>
              <div style={{ fontSize: '11px', color: '#9ca3af' }}>
                {education.relevantCoursework.join(', ')}
              </div>
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
// PROJECT FORMS & CARDS
// ============================================================================

