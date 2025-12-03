import React, { useState } from 'react';
import { Save, X, Trash2 } from 'lucide-react';
import type {
  ExperienceBullet,
} from '../../../../types/resume';

interface JobFormProps {
  type: 'jobs' | 'internships' | 'volunteer';
  existingData?: any;
  onSave: (data: any) => void;
  onCancel: () => void;
}

export function JobForm({ type, existingData, onSave, onCancel }: JobFormProps) {
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
    title: existingData?.title || existingData?.role || '',
    company: existingData?.company || existingData?.organization || '',
    location: existingData?.location || '',
    startDate: existingData?.startDate || '',
    endDate: existingData?.endDate || '',
    current: existingData?.current || false,
    employmentType: existingData?.employmentType || 'full-time',
    bullets: existingData?.bullets || [],
    technologies: existingData?.technologies || existingData?.skills || [],
  });

  const [bulletText, setBulletText] = useState('');

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

    const dataToSave: any = {
      location: formData.location,
      startDate: formData.startDate,
      endDate: formData.endDate,
      current: formData.current,
      bullets: formData.bullets,
    };

    if (type === 'volunteer') {
      dataToSave.role = formData.title;
      dataToSave.organization = formData.company;
      dataToSave.skills = formData.technologies;
    } else {
      dataToSave.title = formData.title;
      dataToSave.company = formData.company;
      dataToSave.technologies = formData.technologies;
      if (type === 'jobs') {
        dataToSave.employmentType = formData.employmentType;
      }
    }

    onSave(dataToSave);
  };

  const addBullet = () => {
    if (!bulletText.trim()) return;

    const newBullet: ExperienceBullet = {
      id: `bullet_${Date.now()}`,
      text: bulletText.trim(),
      keywords: [],
      order: formData.bullets.length,
    };

    setFormData({
      ...formData,
      bullets: [...formData.bullets, newBullet],
    });
    setBulletText('');
  };

  const removeBullet = (id: string) => {
    setFormData({
      ...formData,
      bullets: formData.bullets.filter((b: ExperienceBullet) => b.id !== id),
    });
  };

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      style={{
        position: 'relative',
        backgroundColor: 'white',
        border: '1px solid rgba(0, 0, 0, 0.08)',
        borderRadius: '8px',
        padding: '16px',
        marginBottom: '16px',
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {/* Title */}
        <div>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#1d1d1f', marginBottom: '6px' }}>
            {type === 'jobs' ? 'Job Title' : type === 'internships' ? 'Internship Title' : 'Role'} *
          </label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            required
            placeholder="e.g., Senior Software Engineer"
            style={{
              width: '100%',
              padding: '10px 12px',
              border: '1px solid rgba(0, 0, 0, 0.12)',
              borderRadius: '6px',
              fontSize: '14px',
              fontFamily: 'inherit',
            }}
          />
        </div>

        {/* Company */}
        <div>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#1d1d1f', marginBottom: '6px' }}>
            {type === 'volunteer' ? 'Organization' : 'Company'} *
          </label>
          <input
            type="text"
            value={formData.company}
            onChange={(e) => setFormData({ ...formData, company: e.target.value })}
            required
            placeholder="e.g., Google"
            style={{
              width: '100%',
              padding: '10px 12px',
              border: '1px solid rgba(0, 0, 0, 0.12)',
              borderRadius: '6px',
              fontSize: '14px',
              fontFamily: 'inherit',
            }}
          />
        </div>

        {/* Location */}
        <div>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#1d1d1f', marginBottom: '6px' }}>
            Location *
          </label>
          <input
            type="text"
            value={formData.location}
            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            required
            placeholder="e.g., San Francisco, CA or Remote"
            style={{
              width: '100%',
              padding: '10px 12px',
              border: '1px solid rgba(0, 0, 0, 0.12)',
              borderRadius: '6px',
              fontSize: '14px',
              fontFamily: 'inherit',
            }}
          />
        </div>

        {/* Dates */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          {/* Start Date */}
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#1d1d1f', marginBottom: '6px' }}>
              Start Date *
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 80px', gap: '8px' }}>
              <select
                value={parseDate(formData.startDate).month}
                onChange={(e) => {
                  const { year } = parseDate(formData.startDate);
                  setFormData({ ...formData, startDate: formatDate(e.target.value, year) });
                }}
                required
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
                required
                min="1950"
                max={currentYear + 1}
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
                disabled={formData.current}
                style={{
                  width: '100%',
                  padding: '14px 4px',
                  paddingRight: '24px',
                  border: '1px solid rgba(0, 0, 0, 0.12)',
                  borderRadius: '6px',
                  fontSize: '11px',
                  fontFamily: 'inherit',
                  backgroundColor: 'white',
                  cursor: formData.current ? 'not-allowed' : 'pointer',
                  opacity: formData.current ? 0.5 : 1,
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
                disabled={formData.current}
                min="1950"
                max={currentYear + 1}
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
                  cursor: formData.current ? 'not-allowed' : 'pointer',
                  opacity: formData.current ? 0.5 : 1,
                }}
              />
            </div>
          </div>
        </div>

        {/* Current Position */}
        <label
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '13px',
            color: '#1d1d1f',
            cursor: 'pointer',
            padding: '10px 12px',
            border: formData.current ? '2px solid #0077B5' : '1px solid rgba(0, 0, 0, 0.12)',
            borderRadius: '6px',
            backgroundColor: formData.current ? '#e6f4ff' : 'transparent',
            transition: 'all 0.2s ease',
          }}
        >
          <input
            type="checkbox"
            checked={formData.current}
            onChange={(e) => setFormData({ ...formData, current: e.target.checked, endDate: e.target.checked ? '' : formData.endDate })}
            style={{
              width: '16px',
              height: '16px',
              accentColor: '#0077B5',
              cursor: 'pointer',
            }}
          />
          <span>I currently {type === 'volunteer' ? 'volunteer' : 'work'} here</span>
        </label>

        {/* Accomplishment Bullets */}
        <div>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#1d1d1f', marginBottom: '6px' }}>
            Key Accomplishments
          </label>
          <p style={{ fontSize: '12px', color: '#6e6e73', margin: '0 0 8px 0' }}>
            Use APR format: Action + Project/Problem + Result. Include metrics!
          </p>

          {/* Bullet Input */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
            <input
              type="text"
              value={bulletText}
              onChange={(e) => setBulletText(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addBullet();
                }
              }}
              placeholder="e.g., Led migration of 50+ microservices to Kubernetes, reducing infrastructure costs by 40%"
              style={{
                flex: 1,
                padding: '10px 12px',
                border: '1px solid rgba(0, 0, 0, 0.12)',
                borderRadius: '6px',
                fontSize: '13px',
                fontFamily: 'inherit',
              }}
            />
            <button
              type="button"
              onClick={addBullet}
              style={{
                padding: '10px 16px',
                background: '#0077B5',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: '13px',
                fontWeight: '600',
                cursor: 'pointer',
              }}
            >
              Add
            </button>
          </div>

          {/* Bullet List */}
          {formData.bullets.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {formData.bullets.map((bullet: ExperienceBullet) => (
                <div
                  key={bullet.id}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '8px',
                    padding: '10px',
                    backgroundColor: '#f9fafb',
                    borderRadius: '6px',
                  }}
                >
                  <span style={{ fontSize: '13px', color: '#1d1d1f', flex: 1, lineHeight: '1.5' }}>
                    • {bullet.text}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeBullet(bullet.id)}
                    style={{
                      padding: '4px',
                      background: 'transparent',
                      border: 'none',
                      color: '#dc2626',
                      cursor: 'pointer',
                    }}
                  >
                    <Trash2 size={14} strokeWidth={2} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
          <button
            type="submit"
            style={{
              flex: 1,
              padding: '12px 16px',
              background: '#0077B5',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
            }}
          >
            <Save size={16} strokeWidth={2} />
            <span>Save</span>
          </button>
          <button
            type="button"
            onClick={onCancel}
            style={{
              flex: 1,
              padding: '12px 16px',
              background: 'white',
              color: '#6e6e73',
              border: '1px solid rgba(0, 0, 0, 0.12)',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
            }}
          >
            <X size={16} strokeWidth={2} />
            <span>Cancel</span>
          </button>
        </div>
      </div>
    </form>
  );
}
