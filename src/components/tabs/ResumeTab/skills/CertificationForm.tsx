import React, { useState } from 'react';
import type { Certification } from '../../../../types/resume';

interface CertificationFormProps {
  onSave: (data: Omit<Certification, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onCancel: () => void;
}

export function CertificationForm({ onSave, onCancel }: CertificationFormProps) {
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
    issuer: '',
    issueDate: '',
    expiryDate: '',
    credentialId: '',
    credentialUrl: '',
    acronym: '',
  });

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

    if (!formData.name.trim() || !formData.issuer.trim()) return;
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} noValidate style={{ position: 'relative', backgroundColor: 'white', border: '1px solid rgba(0, 0, 0, 0.08)', borderRadius: '8px', padding: '16px', marginBottom: '16px' }}>
      <h3 style={{ fontSize: '15px', fontWeight: '600', color: '#1d1d1f', margin: '0 0 16px 0' }}>
        Add Certification
      </h3>

      {/* Name */}
      <div style={{ marginBottom: '16px' }}>
        <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#1d1d1f', marginBottom: '6px' }}>
          Certification Name *
        </label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="e.g., AWS Certified Solutions Architect"
          required
          style={{ width: '100%', padding: '10px 12px', border: '1px solid rgba(0, 0, 0, 0.12)', borderRadius: '6px', fontSize: '13px', fontFamily: 'inherit' }}
        />
      </div>

      {/* Issuer & Acronym */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
        <div>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#1d1d1f', marginBottom: '6px' }}>
            Issuer *
          </label>
          <input
            type="text"
            value={formData.issuer}
            onChange={(e) => setFormData({ ...formData, issuer: e.target.value })}
            placeholder="e.g., Amazon Web Services"
            required
            style={{ width: '100%', padding: '10px 12px', border: '1px solid rgba(0, 0, 0, 0.12)', borderRadius: '6px', fontSize: '13px', fontFamily: 'inherit' }}
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#1d1d1f', marginBottom: '6px' }}>
            Acronym
          </label>
          <input
            type="text"
            value={formData.acronym}
            onChange={(e) => setFormData({ ...formData, acronym: e.target.value })}
            placeholder="e.g., SAA-C03"
            style={{ width: '100%', padding: '10px 12px', border: '1px solid rgba(0, 0, 0, 0.12)', borderRadius: '6px', fontSize: '13px', fontFamily: 'inherit' }}
          />
        </div>
      </div>

      {/* Issue & Expiry Dates */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
        {/* Issue Date */}
        <div>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#1d1d1f', marginBottom: '6px' }}>
            Issue Date
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 80px', gap: '8px' }}>
            <select
              value={parseDate(formData.issueDate).month}
              onChange={(e) => {
                const { year } = parseDate(formData.issueDate);
                setFormData({ ...formData, issueDate: formatDate(e.target.value, year) });
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
              value={parseDate(formData.issueDate).year}
              onChange={(e) => {
                const { month } = parseDate(formData.issueDate);
                setFormData({ ...formData, issueDate: formatDate(month, e.target.value) });
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

        {/* Expiry Date */}
        <div>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#1d1d1f', marginBottom: '6px' }}>
            Expiry Date (optional)
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 80px', gap: '8px' }}>
            <select
              value={parseDate(formData.expiryDate).month}
              onChange={(e) => {
                const { year } = parseDate(formData.expiryDate);
                setFormData({ ...formData, expiryDate: formatDate(e.target.value, year) });
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
              value={parseDate(formData.expiryDate).year}
              onChange={(e) => {
                const { month } = parseDate(formData.expiryDate);
                setFormData({ ...formData, expiryDate: formatDate(month, e.target.value) });
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

      {/* Credential ID & URL */}
      <div style={{ marginBottom: '16px' }}>
        <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#1d1d1f', marginBottom: '6px' }}>
          Credential ID
        </label>
        <input
          type="text"
          value={formData.credentialId}
          onChange={(e) => setFormData({ ...formData, credentialId: e.target.value })}
          placeholder="e.g., ABC123XYZ"
          style={{ width: '100%', padding: '10px 12px', border: '1px solid rgba(0, 0, 0, 0.12)', borderRadius: '6px', fontSize: '13px', fontFamily: 'inherit' }}
        />
      </div>

      <div style={{ marginBottom: '16px' }}>
        <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#1d1d1f', marginBottom: '6px' }}>
          Credential URL
        </label>
        <input
          type="url"
          value={formData.credentialUrl}
          onChange={(e) => setFormData({ ...formData, credentialUrl: e.target.value })}
          placeholder="https://..."
          style={{ width: '100%', padding: '10px 12px', border: '1px solid rgba(0, 0, 0, 0.12)', borderRadius: '6px', fontSize: '13px', fontFamily: 'inherit' }}
        />
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
        <button type="button" onClick={onCancel} style={{ padding: '10px 16px', background: 'white', color: '#6e6e73', border: '1px solid rgba(0, 0, 0, 0.12)', borderRadius: '6px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>
          Cancel
        </button>
        <button type="submit" style={{ padding: '10px 16px', background: '#0077B5', color: 'white', border: 'none', borderRadius: '6px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>
          Add Certification
        </button>
      </div>
    </form>
  );
}

