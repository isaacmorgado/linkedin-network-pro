import React, { useState } from 'react';
import type { Project, ExperienceBullet } from '../../../../types/resume';

interface ProjectFormProps {
  onSave: (data: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onCancel: () => void;
}

export function ProjectForm({ onSave, onCancel }: ProjectFormProps) {
  // Get current year for date range validation
  const currentYear = new Date().getFullYear();
  const months = [
    { value: '01', label: 'January' },
    { value: '02', label: 'February' },
    { value: '03', label: 'March' },
    { value: '04', label: 'April' },
    { value: '05', label: 'May' },
    { value: '06', label: 'June' },
    { value: '07', label: 'July' },
    { value: '08', label: 'August' },
    { value: '09', label: 'September' },
    { value: '10', label: 'October' },
    { value: '11', label: 'November' },
    { value: '12', label: 'December' },
  ];

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    bullets: [] as ExperienceBullet[],
    technologies: [] as string[],
    links: {
      github: '',
      demo: '',
      youtube: '',
      website: '',
      other: '',
    },
    startDate: '',
    endDate: '',
    tags: [] as string[],
  });

  const [techInput, setTechInput] = useState('');
  const [tagInput, setTagInput] = useState('');

  // Helper to parse date string (YYYY-MM) into month and year
  const parseDate = (dateString: string) => {
    if (!dateString) return { month: '', year: '' };
    const [year, month] = dateString.split('-');
    return { month: month || '', year: year || '' };
  };

  // Helper to format month and year into date string (YYYY-MM)
  const formatDate = (month: string, year: string) => {
    if (!month && !year) return '';
    if (!month) return `${year}-`;
    if (!year) return `-${month}`;
    return `${year}-${month}`;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Check form validity and scroll to first invalid field
    const form = e.currentTarget as HTMLFormElement;
    if (!form.checkValidity()) {
      const firstInvalid = form.querySelector(':invalid') as HTMLElement;
      if (firstInvalid) {
        firstInvalid.scrollIntoView({ behavior: 'smooth', block: 'center' });
        firstInvalid.focus();
      }
      return;
    }

    if (!formData.name.trim() || !formData.description.trim()) return;
    onSave(formData);
  };

  const addTech = () => {
    if (!techInput.trim()) return;
    setFormData({ ...formData, technologies: [...formData.technologies, techInput.trim()] });
    setTechInput('');
  };

  const removeTech = (index: number) => {
    setFormData({ ...formData, technologies: formData.technologies.filter((_, i) => i !== index) });
  };

  const addTag = () => {
    if (!tagInput.trim()) return;
    setFormData({ ...formData, tags: [...formData.tags, tagInput.trim()] });
    setTagInput('');
  };

  const removeTag = (index: number) => {
    setFormData({ ...formData, tags: formData.tags.filter((_, i) => i !== index) });
  };

  return (
    <form onSubmit={handleSubmit} noValidate style={{ position: 'relative', backgroundColor: 'white', border: '1px solid rgba(0, 0, 0, 0.08)', borderRadius: '8px', padding: '16px', marginBottom: '16px' }}>
      <h3 style={{ fontSize: '15px', fontWeight: '600', color: '#1d1d1f', margin: '0 0 16px 0' }}>
        Add Project
      </h3>

      {/* Project Name */}
      <div style={{ marginBottom: '16px' }}>
        <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#1d1d1f', marginBottom: '6px' }}>
          Project Name *
        </label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="e.g., AI Resume Builder"
          required
          style={{ width: '100%', padding: '10px 12px', border: '1px solid rgba(0, 0, 0, 0.12)', borderRadius: '6px', fontSize: '13px', fontFamily: 'inherit' }}
        />
      </div>

      {/* Description */}
      <div style={{ marginBottom: '16px' }}>
        <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#1d1d1f', marginBottom: '6px' }}>
          Description *
        </label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Brief 1-2 sentence description of the project"
          required
          rows={3}
          style={{ width: '100%', padding: '10px 12px', border: '1px solid rgba(0, 0, 0, 0.12)', borderRadius: '6px', fontSize: '13px', fontFamily: 'inherit', resize: 'vertical' }}
        />
      </div>

      {/* Technologies */}
      <div style={{ marginBottom: '16px' }}>
        <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#1d1d1f', marginBottom: '6px' }}>
          Technologies Used
        </label>
        <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
          <input
            type="text"
            value={techInput}
            onChange={(e) => setTechInput(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addTech();
              }
            }}
            placeholder="e.g., React, TypeScript"
            style={{ flex: 1, padding: '8px 12px', border: '1px solid rgba(0, 0, 0, 0.12)', borderRadius: '6px', fontSize: '13px', fontFamily: 'inherit' }}
          />
          <button type="button" onClick={addTech} style={{ padding: '8px 16px', background: '#0077B5', color: 'white', border: 'none', borderRadius: '6px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>
            Add
          </button>
        </div>
        {formData.technologies.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {formData.technologies.map((tech, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '4px 8px', backgroundColor: '#f0f9ff', borderRadius: '4px', fontSize: '12px', color: '#0077B5' }}>
                <span>{tech}</span>
                <button type="button" onClick={() => removeTech(i)} style={{ padding: '0', background: 'transparent', border: 'none', color: '#0077B5', cursor: 'pointer', fontSize: '14px', lineHeight: '1' }}>
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Links */}
      <div style={{ marginBottom: '16px' }}>
        <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#1d1d1f', marginBottom: '6px' }}>
          Links (optional)
        </label>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          <input
            type="url"
            value={formData.links.github}
            onChange={(e) => setFormData({ ...formData, links: { ...formData.links, github: e.target.value } })}
            placeholder="GitHub URL"
            style={{ padding: '8px 12px', border: '1px solid rgba(0, 0, 0, 0.12)', borderRadius: '6px', fontSize: '13px', fontFamily: 'inherit' }}
          />
          <input
            type="url"
            value={formData.links.demo}
            onChange={(e) => setFormData({ ...formData, links: { ...formData.links, demo: e.target.value } })}
            placeholder="Live Demo URL"
            style={{ padding: '8px 12px', border: '1px solid rgba(0, 0, 0, 0.12)', borderRadius: '6px', fontSize: '13px', fontFamily: 'inherit' }}
          />
          <input
            type="url"
            value={formData.links.website}
            onChange={(e) => setFormData({ ...formData, links: { ...formData.links, website: e.target.value } })}
            placeholder="Website URL"
            style={{ padding: '8px 12px', border: '1px solid rgba(0, 0, 0, 0.12)', borderRadius: '6px', fontSize: '13px', fontFamily: 'inherit' }}
          />
          <input
            type="url"
            value={formData.links.youtube}
            onChange={(e) => setFormData({ ...formData, links: { ...formData.links, youtube: e.target.value } })}
            placeholder="YouTube URL"
            style={{ padding: '8px 12px', border: '1px solid rgba(0, 0, 0, 0.12)', borderRadius: '6px', fontSize: '13px', fontFamily: 'inherit' }}
          />
        </div>
      </div>

      {/* Dates */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
        {/* Start Date */}
        <div>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#1d1d1f', marginBottom: '6px' }}>
            Start Date
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 80px', gap: '8px' }}>
            <select
              value={parseDate(formData.startDate).month}
              onChange={(e) => {
                const { year } = parseDate(formData.startDate);
                setFormData({ ...formData, startDate: formatDate(e.target.value, year) });
              }}
              style={{
                width: '100%',
                padding: '14px 4px',
                paddingRight: '24px',
                border: '1px solid rgba(0, 0, 0, 0.12)',
                borderRadius: '6px',
                fontSize: '11px',
                fontFamily: 'inherit',
                backgroundColor: 'white',
                cursor: 'pointer',
                minHeight: '42px',
                lineHeight: '1.2',
              }}
            >
              <option value="">Month</option>
              {months.map((month) => (
                <option key={month.value} value={month.value}>
                  {month.label}
                </option>
              ))}
            </select>
            <input
              type="number"
              value={parseDate(formData.startDate).year}
              onChange={(e) => {
                const { month } = parseDate(formData.startDate);
                setFormData({ ...formData, startDate: formatDate(month, e.target.value) });
              }}
              placeholder="Year"
              min="1950"
              max={currentYear + 10}
              style={{
                width: '100%',
                padding: '14px 8px',
                border: '1px solid rgba(0, 0, 0, 0.12)',
                borderRadius: '6px',
                fontSize: '11px',
                fontFamily: 'inherit',
                backgroundColor: 'white',
                textAlign: 'center',
                minHeight: '42px',
                lineHeight: '1.2',
              }}
            />
          </div>
        </div>

        {/* End Date */}
        <div>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#1d1d1f', marginBottom: '6px' }}>
            End Date
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 80px', gap: '8px' }}>
            <select
              value={parseDate(formData.endDate).month}
              onChange={(e) => {
                const { year } = parseDate(formData.endDate);
                setFormData({ ...formData, endDate: formatDate(e.target.value, year) });
              }}
              style={{
                width: '100%',
                padding: '14px 4px',
                paddingRight: '24px',
                border: '1px solid rgba(0, 0, 0, 0.12)',
                borderRadius: '6px',
                fontSize: '11px',
                fontFamily: 'inherit',
                backgroundColor: 'white',
                cursor: 'pointer',
                minHeight: '42px',
                lineHeight: '1.2',
              }}
            >
              <option value="">Month</option>
              {months.map((month) => (
                <option key={month.value} value={month.value}>
                  {month.label}
                </option>
              ))}
            </select>
            <input
              type="number"
              value={parseDate(formData.endDate).year}
              onChange={(e) => {
                const { month } = parseDate(formData.endDate);
                setFormData({ ...formData, endDate: formatDate(month, e.target.value) });
              }}
              placeholder="Year"
              min="1950"
              max={currentYear + 10}
              style={{
                width: '100%',
                padding: '14px 8px',
                border: '1px solid rgba(0, 0, 0, 0.12)',
                borderRadius: '6px',
                fontSize: '11px',
                fontFamily: 'inherit',
                backgroundColor: 'white',
                textAlign: 'center',
                minHeight: '42px',
                lineHeight: '1.2',
              }}
            />
          </div>
        </div>
      </div>

      {/* Tags */}
      <div style={{ marginBottom: '16px' }}>
        <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#1d1d1f', marginBottom: '6px' }}>
          Tags
        </label>
        <p style={{ fontSize: '11px', color: '#6e6e73', margin: '0 0 8px 0' }}>
          e.g., open-source, hackathon, personal
        </p>
        <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
          <input
            type="text"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addTag();
              }
            }}
            placeholder="e.g., hackathon"
            style={{ flex: 1, padding: '8px 12px', border: '1px solid rgba(0, 0, 0, 0.12)', borderRadius: '6px', fontSize: '13px', fontFamily: 'inherit' }}
          />
          <button type="button" onClick={addTag} style={{ padding: '8px 16px', background: '#0077B5', color: 'white', border: 'none', borderRadius: '6px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>
            Add
          </button>
        </div>
        {formData.tags.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {formData.tags.map((tag, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '4px 8px', backgroundColor: '#fef3c7', borderRadius: '4px', fontSize: '12px', color: '#f59e0b' }}>
                <span>{tag}</span>
                <button type="button" onClick={() => removeTag(i)} style={{ padding: '0', background: 'transparent', border: 'none', color: '#f59e0b', cursor: 'pointer', fontSize: '14px', lineHeight: '1' }}>
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
        <button type="button" onClick={onCancel} style={{ padding: '10px 16px', background: 'white', color: '#6e6e73', border: '1px solid rgba(0, 0, 0, 0.12)', borderRadius: '6px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>
          Cancel
        </button>
        <button type="submit" style={{ padding: '10px 16px', background: '#0077B5', color: 'white', border: 'none', borderRadius: '6px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>
          Add Project
        </button>
      </div>
    </form>
  );
}

