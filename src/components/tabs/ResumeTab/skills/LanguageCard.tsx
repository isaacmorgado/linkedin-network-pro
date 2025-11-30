import { Trash2 } from 'lucide-react';
import type { Language } from '../../../../types/resume';


export function LanguageCard({ language, onDelete }: { language: Language; onDelete: () => void }) {
  const proficiencyLabels: Record<Language['proficiency'], string> = {
    'elementary': 'Elementary',
    'limited-working': 'Limited Working',
    'professional-working': 'Professional Working',
    'full-professional': 'Full Professional',
    'native': 'Native / Bilingual',
  };

  const proficiencyColors: Record<Language['proficiency'], string> = {
    'elementary': '#94a3b8',
    'limited-working': '#64748b',
    'professional-working': '#0077B5',
    'full-professional': '#0ea5e9',
    'native': '#7c3aed',
  };

  return (
    <div style={{ backgroundColor: 'white', border: '1px solid rgba(0, 0, 0, 0.08)', borderRadius: '8px', padding: '14px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '20px' }}>🌍</span>
          <div>
            <h3 style={{ fontSize: '15px', fontWeight: '600', color: '#1d1d1f', margin: '0 0 4px 0' }}>
              {language.name}
            </h3>
            <span
              style={{
                padding: '4px 10px',
                backgroundColor: `${proficiencyColors[language.proficiency]}15`,
                color: proficiencyColors[language.proficiency],
                borderRadius: '4px',
                fontSize: '12px',
                fontWeight: '600',
              }}
            >
              {proficiencyLabels[language.proficiency]}
            </span>
          </div>
        </div>

        <button onClick={onDelete} style={{ padding: '6px', background: 'transparent', border: 'none', color: '#dc2626', cursor: 'pointer', borderRadius: '4px' }}>
          <Trash2 size={14} strokeWidth={2} />
        </button>
      </div>
    </div>
  );
}

// ============================================================================
// EDUCATION TAB
// ============================================================================

