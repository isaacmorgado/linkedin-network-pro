import React, { useState } from 'react';
import type { Education } from '../../../../types/resume';

interface EducationFormProps {
  onSave: (data: Omit<Education, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onCancel: () => void;
}

export function EducationForm({ onSave, onCancel }: EducationFormProps) {
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
    institution: '',
    degree: '',
    field: '',
    location: '',
    startDate: '',
    endDate: '',
    current: false,
    gpa: '',
    honors: [] as string[],
    relevantCoursework: [] as string[],
  });

  const [honorInput, setHonorInput] = useState('');
  const [courseInput, setCourseInput] = useState('');

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

    if (!formData.institution.trim() || !formData.degree.trim() || !formData.field.trim()) return;
    onSave(formData);
  };

  const addHonor = () => {
    if (!honorInput.trim()) return;
    setFormData({ ...formData, honors: [...(formData.honors || []), honorInput.trim()] });
    setHonorInput('');
  };

  const removeHonor = (index: number) => {
    setFormData({ ...formData, honors: formData.honors?.filter((_, i) => i !== index) || [] });
  };

  const addCourse = () => {
    if (!courseInput.trim()) return;
    setFormData({ ...formData, relevantCoursework: [...(formData.relevantCoursework || []), courseInput.trim()] });
    setCourseInput('');
  };

  const removeCourse = (index: number) => {
    setFormData({ ...formData, relevantCoursework: formData.relevantCoursework?.filter((_, i) => i !== index) || [] });
  };

  return (
    <form onSubmit={handleSubmit} noValidate style={{ position: 'relative', backgroundColor: 'white', border: '1px solid rgba(0, 0, 0, 0.08)', borderRadius: '8px', padding: '16px', marginBottom: '16px' }}>
      <h3 style={{ fontSize: '15px', fontWeight: '600', color: '#1d1d1f', margin: '0 0 16px 0' }}>
        Add Education
      </h3>

      {/* Institution */}
      <div style={{ marginBottom: '16px' }}>
        <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#1d1d1f', marginBottom: '6px' }}>
          Institution *
        </label>
        <input
          type="text"
          value={formData.institution}
          onChange={(e) => setFormData({ ...formData, institution: e.target.value })}
          placeholder="e.g., Stanford University"
          required
          style={{ width: '100%', padding: '10px 12px', border: '1px solid rgba(0, 0, 0, 0.12)', borderRadius: '6px', fontSize: '13px', fontFamily: 'inherit' }}
        />
      </div>

      {/* Degree & Field */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
        <div>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#1d1d1f', marginBottom: '6px' }}>
            Degree *
          </label>
          <input
            type="text"
            value={formData.degree}
            onChange={(e) => setFormData({ ...formData, degree: e.target.value })}
            placeholder="e.g., Bachelor of Science"
            required
            style={{ width: '100%', padding: '10px 12px', border: '1px solid rgba(0, 0, 0, 0.12)', borderRadius: '6px', fontSize: '13px', fontFamily: 'inherit' }}
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#1d1d1f', marginBottom: '6px' }}>
            Field of Study *
          </label>
          <input
            type="text"
            value={formData.field}
            onChange={(e) => setFormData({ ...formData, field: e.target.value })}
            placeholder="e.g., Computer Science"
            required
            style={{ width: '100%', padding: '10px 12px', border: '1px solid rgba(0, 0, 0, 0.12)', borderRadius: '6px', fontSize: '13px', fontFamily: 'inherit' }}
          />
        </div>
      </div>

      {/* Location */}
      <div style={{ marginBottom: '16px' }}>
        <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#1d1d1f', marginBottom: '6px' }}>
          Location
        </label>
        <input
          type="text"
          value={formData.location}
          onChange={(e) => setFormData({ ...formData, location: e.target.value })}
          placeholder="e.g., Stanford, CA"
          style={{ width: '100%', padding: '10px 12px', border: '1px solid rgba(0, 0, 0, 0.12)', borderRadius: '6px', fontSize: '13px', fontFamily: 'inherit' }}
        />
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
                cursor: formData.current ? 'not-allowed' : 'pointer',
                opacity: formData.current ? 0.5 : 1,
              }}
            />
          </div>
        </div>
      </div>

      {/* Current */}
      <div style={{ marginBottom: '16px' }}>
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
          <span style={{ fontWeight: '600' }}>
            Currently attending
          </span>
        </label>
      </div>

      {/* GPA */}
      <div style={{ marginBottom: '16px' }}>
        <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#1d1d1f', marginBottom: '6px' }}>
          GPA (optional)
        </label>
        <input
          type="text"
          value={formData.gpa}
          onChange={(e) => setFormData({ ...formData, gpa: e.target.value })}
          placeholder="e.g., 3.8/4.0"
          style={{ width: '100%', padding: '10px 12px', border: '1px solid rgba(0, 0, 0, 0.12)', borderRadius: '6px', fontSize: '13px', fontFamily: 'inherit' }}
        />
      </div>

      {/* Honors */}
      <div style={{ marginBottom: '16px' }}>
        <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#1d1d1f', marginBottom: '6px' }}>
          Honors & Awards
        </label>
        <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
          <input
            type="text"
            value={honorInput}
            onChange={(e) => setHonorInput(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addHonor();
              }
            }}
            placeholder="e.g., Dean's List"
            style={{ flex: 1, padding: '8px 12px', border: '1px solid rgba(0, 0, 0, 0.12)', borderRadius: '6px', fontSize: '13px', fontFamily: 'inherit' }}
          />
          <button type="button" onClick={addHonor} style={{ padding: '8px 16px', background: '#0077B5', color: 'white', border: 'none', borderRadius: '6px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>
            Add
          </button>
        </div>
        {formData.honors && formData.honors.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {formData.honors.map((honor, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 10px', backgroundColor: '#f0f9ff', borderRadius: '4px', fontSize: '12px', color: '#0077B5' }}>
                <span>• {honor}</span>
                <button type="button" onClick={() => removeHonor(i)} style={{ padding: '0', background: 'transparent', border: 'none', color: '#0077B5', cursor: 'pointer', fontSize: '16px', lineHeight: '1' }}>
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Relevant Coursework */}
      <div style={{ marginBottom: '16px' }}>
        <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#1d1d1f', marginBottom: '6px' }}>
          Relevant Coursework
        </label>
        <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
          <input
            type="text"
            value={courseInput}
            onChange={(e) => setCourseInput(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addCourse();
              }
            }}
            placeholder="e.g., Data Structures"
            style={{ flex: 1, padding: '8px 12px', border: '1px solid rgba(0, 0, 0, 0.12)', borderRadius: '6px', fontSize: '13px', fontFamily: 'inherit' }}
          />
          <button type="button" onClick={addCourse} style={{ padding: '8px 16px', background: '#0077B5', color: 'white', border: 'none', borderRadius: '6px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>
            Add
          </button>
        </div>
        {formData.relevantCoursework && formData.relevantCoursework.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {formData.relevantCoursework.map((course, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '4px 8px', backgroundColor: '#f0f9ff', borderRadius: '4px', fontSize: '12px', color: '#0077B5' }}>
                <span>{course}</span>
                <button type="button" onClick={() => removeCourse(i)} style={{ padding: '0', background: 'transparent', border: 'none', color: '#0077B5', cursor: 'pointer', fontSize: '14px', lineHeight: '1' }}>
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
          Add Education
        </button>
      </div>
    </form>
  );
}

