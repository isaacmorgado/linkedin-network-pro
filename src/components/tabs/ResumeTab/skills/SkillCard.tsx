import { Edit2, Trash2 } from 'lucide-react';
import type { Skill } from '../../../../types/resume';


export function SkillCard({ skill, onEdit, onDelete }: { skill: Skill; onEdit: () => void; onDelete: () => void }) {
  const proficiencyColors: Record<Skill['proficiency'], string> = {
    beginner: '#94a3b8',
    intermediate: '#60a5fa',
    advanced: '#0077B5',
    expert: '#7c3aed',
  };

  const categoryIcons: Record<Skill['category'], string> = {
    frontend: '🎨',
    backend: '⚙️',
    devops: '🚀',
    data: '📊',
    design: '✨',
    management: '👔',
    other: '💡',
  };

  return (
    <div style={{ backgroundColor: 'white', border: '1px solid rgba(0, 0, 0, 0.08)', borderRadius: '8px', padding: '14px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <span style={{ fontSize: '16px' }}>{categoryIcons[skill.category]}</span>
            <h3 style={{ fontSize: '15px', fontWeight: '600', color: '#1d1d1f', margin: 0 }}>
              {skill.name}
            </h3>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
            <span
              style={{
                padding: '4px 10px',
                backgroundColor: `${proficiencyColors[skill.proficiency]}15`,
                color: proficiencyColors[skill.proficiency],
                borderRadius: '4px',
                fontSize: '12px',
                fontWeight: '600',
                textTransform: 'capitalize',
              }}
            >
              {skill.proficiency}
            </span>
            <span style={{ fontSize: '12px', color: '#6e6e73', textTransform: 'capitalize' }}>
              {skill.category.replace('-', ' ')}
            </span>
            {skill.yearsOfExperience && skill.yearsOfExperience > 0 && (
              <span style={{ fontSize: '12px', color: '#6e6e73' }}>
                • {skill.yearsOfExperience} {skill.yearsOfExperience === 1 ? 'year' : 'years'}
              </span>
            )}
          </div>

          {skill.synonyms && skill.synonyms.length > 0 && (
            <div style={{ marginTop: '8px', fontSize: '11px', color: '#9ca3af' }}>
              ATS: {skill.synonyms.join(', ')}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: '4px' }}>
          <button onClick={onEdit} style={{ padding: '6px', background: 'transparent', border: 'none', color: '#0077B5', cursor: 'pointer', borderRadius: '4px' }}>
            <Edit2 size={14} strokeWidth={2} />
          </button>
          <button onClick={onDelete} style={{ padding: '6px', background: 'transparent', border: 'none', color: '#dc2626', cursor: 'pointer', borderRadius: '4px' }}>
            <Trash2 size={14} strokeWidth={2} />
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// TOOL FORMS & CARDS
// ============================================================================

