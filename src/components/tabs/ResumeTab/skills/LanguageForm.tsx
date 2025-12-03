import React, { useState } from 'react';
import type { Language } from '../../../../types/resume';

interface LanguageFormProps {
  onSave: (data: Omit<Language, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onCancel: () => void;
}

export function LanguageForm({ onSave, onCancel }: LanguageFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    proficiency: 'professional-working' as Language['proficiency'],
  });

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

    if (!formData.name.trim()) return;
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} noValidate style={{ position: 'relative', backgroundColor: 'white', border: '1px solid rgba(0, 0, 0, 0.08)', borderRadius: '8px', padding: '16px', marginBottom: '16px' }}>
      <h3 style={{ fontSize: '15px', fontWeight: '600', color: '#1d1d1f', margin: '0 0 16px 0' }}>
        Add Language
      </h3>

      {/* Language Name */}
      <div style={{ marginBottom: '16px' }}>
        <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#1d1d1f', marginBottom: '6px' }}>
          Language *
        </label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="e.g., Spanish, Mandarin, French"
          required
          style={{ width: '100%', padding: '10px 12px', border: '1px solid rgba(0, 0, 0, 0.12)', borderRadius: '6px', fontSize: '13px', fontFamily: 'inherit' }}
        />
      </div>

      {/* Proficiency */}
      <div style={{ marginBottom: '16px' }}>
        <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#1d1d1f', marginBottom: '6px' }}>
          Proficiency
        </label>
        <select
          value={formData.proficiency}
          onChange={(e) => setFormData({ ...formData, proficiency: e.target.value as Language['proficiency'] })}
          style={{ width: '100%', padding: '10px 12px', border: '1px solid rgba(0, 0, 0, 0.12)', borderRadius: '6px', fontSize: '13px', fontFamily: 'inherit', backgroundColor: 'white' }}
        >
          <option value="elementary">Elementary</option>
          <option value="limited-working">Limited Working</option>
          <option value="professional-working">Professional Working</option>
          <option value="full-professional">Full Professional</option>
          <option value="native">Native / Bilingual</option>
        </select>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
        <button type="button" onClick={onCancel} style={{ padding: '10px 16px', background: 'white', color: '#6e6e73', border: '1px solid rgba(0, 0, 0, 0.12)', borderRadius: '6px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>
          Cancel
        </button>
        <button type="submit" style={{ padding: '10px 16px', background: '#0077B5', color: 'white', border: 'none', borderRadius: '6px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>
          Add Language
        </button>
      </div>
    </form>
  );
}

