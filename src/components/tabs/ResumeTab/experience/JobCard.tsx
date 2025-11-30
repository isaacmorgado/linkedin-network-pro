import { Edit2, Trash2, Calendar, MapPin, Building2 } from 'lucide-react';
import type { JobExperience } from '../../../../types/resume';

interface JobCardProps {
  job: JobExperience;
  onEdit: () => void;
  onDelete: () => void;
}

export function JobCard({ job, onEdit, onDelete }: JobCardProps) {
  const formatDate = (date: string) => {
    if (!date) return '';
    const [year, month] = date.split('-');
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${monthNames[parseInt(month) - 1]} ${year}`;
  };

  const dateRange = `${formatDate(job.startDate)} - ${job.current ? 'Present' : formatDate(job.endDate || '')}`;

  return (
    <div
      style={{
        backgroundColor: 'white',
        border: '1px solid rgba(0, 0, 0, 0.08)',
        borderRadius: '8px',
        padding: '16px',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
        <div style={{ flex: 1 }}>
          <h3 style={{ fontSize: '15px', fontWeight: '600', color: '#1d1d1f', margin: '0 0 4px 0' }}>
            {job.title}
          </h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#6e6e73', marginBottom: '4px' }}>
            <Building2 size={12} strokeWidth={2} />
            <span>{job.company}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '12px', color: '#6e6e73' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Calendar size={12} strokeWidth={2} />
              <span>{dateRange}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <MapPin size={12} strokeWidth={2} />
              <span>{job.location}</span>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '4px' }}>
          <button
            onClick={onEdit}
            style={{
              padding: '8px',
              background: 'transparent',
              border: 'none',
              color: '#0077B5',
              cursor: 'pointer',
              borderRadius: '6px',
              transition: 'background 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(0, 119, 181, 0.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            <Edit2 size={16} strokeWidth={2} />
          </button>
          <button
            onClick={onDelete}
            style={{
              padding: '8px',
              background: 'transparent',
              border: 'none',
              color: '#dc2626',
              cursor: 'pointer',
              borderRadius: '6px',
              transition: 'background 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#fef2f2';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            <Trash2 size={16} strokeWidth={2} />
          </button>
        </div>
      </div>

      {/* Bullets */}
      {job.bullets.length > 0 && (
        <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid rgba(0, 0, 0, 0.08)' }}>
          <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {job.bullets.slice(0, 3).map((bullet) => (
              <li key={bullet.id} style={{ fontSize: '13px', color: '#1d1d1f', display: 'flex', gap: '8px' }}>
                <span style={{ color: '#0077B5' }}>•</span>
                <span style={{ flex: 1 }}>{bullet.text}</span>
              </li>
            ))}
          </ul>
          {job.bullets.length > 3 && (
            <p style={{ fontSize: '12px', color: '#6e6e73', margin: '8px 0 0 0' }}>
              +{job.bullets.length - 3} more accomplishment{job.bullets.length - 3 !== 1 ? 's' : ''}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
