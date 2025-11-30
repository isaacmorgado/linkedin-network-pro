import { Trash2 } from 'lucide-react';
import type { Project } from '../../../../types/resume';


export function ProjectCard({ project, onDelete }: { project: Project; onDelete: () => void }) {
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
            <span style={{ fontSize: '16px' }}>💻</span>
            <h3 style={{ fontSize: '15px', fontWeight: '600', color: '#1d1d1f', margin: 0 }}>
              {project.name}
            </h3>
          </div>

          <div style={{ fontSize: '13px', color: '#6e6e73', marginBottom: '8px', lineHeight: '1.4' }}>
            {project.description}
          </div>

          {project.startDate && (
            <div style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '8px' }}>
              {formatDate(project.startDate)} {project.endDate && `- ${formatDate(project.endDate)}`}
            </div>
          )}

          {project.technologies.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '8px' }}>
              {project.technologies.map((tech: string, i: number) => (
                <span key={i} style={{ padding: '3px 8px', backgroundColor: '#f0f9ff', color: '#0077B5', borderRadius: '4px', fontSize: '11px', fontWeight: '600' }}>
                  {tech}
                </span>
              ))}
            </div>
          )}

          {project.tags.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '8px' }}>
              {project.tags.map((tag: string, i: number) => (
                <span key={i} style={{ padding: '3px 8px', backgroundColor: '#fef3c7', color: '#f59e0b', borderRadius: '4px', fontSize: '11px', fontWeight: '600' }}>
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {(project.links.github || project.links.demo || project.links.website || project.links.youtube) && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '8px' }}>
              {project.links.github && (
                <a href={project.links.github} target="_blank" rel="noopener noreferrer" style={{ fontSize: '11px', color: '#0077B5', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span>GitHub →</span>
                </a>
              )}
              {project.links.demo && (
                <a href={project.links.demo} target="_blank" rel="noopener noreferrer" style={{ fontSize: '11px', color: '#0077B5', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span>Demo →</span>
                </a>
              )}
              {project.links.website && (
                <a href={project.links.website} target="_blank" rel="noopener noreferrer" style={{ fontSize: '11px', color: '#0077B5', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span>Website →</span>
                </a>
              )}
              {project.links.youtube && (
                <a href={project.links.youtube} target="_blank" rel="noopener noreferrer" style={{ fontSize: '11px', color: '#0077B5', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span>Video →</span>
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
// GENERATE TAB (Placeholder)
// ============================================================================

