import React, { useState } from 'react';
import type { Tool } from '../../../../types/resume';

interface ToolFormProps {
  existingData?: Tool;
  onSave: (data: Omit<Tool, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onCancel: () => void;
}

export function ToolForm({ existingData, onSave, onCancel }: ToolFormProps) {
  const [formData, setFormData] = useState({
    name: existingData?.name || '',
    category: existingData?.category || 'tool' as Tool['category'],
    proficiency: existingData?.proficiency || 'intermediate' as Tool['proficiency'],
    version: existingData?.version || '',
    synonyms: existingData?.synonyms || [],
  });

  const [synonymInput, setSynonymInput] = useState('');

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

  const addSynonym = () => {
    if (!synonymInput.trim()) return;
    setFormData({
      ...formData,
      synonyms: [...(formData.synonyms || []), synonymInput.trim()],
    });
    setSynonymInput('');
  };

  const removeSynonym = (index: number) => {
    setFormData({
      ...formData,
      synonyms: formData.synonyms?.filter((_, i) => i !== index) || [],
    });
  };

  return (
    <form onSubmit={handleSubmit} noValidate style={{ position: 'relative', backgroundColor: 'white', border: '1px solid rgba(0, 0, 0, 0.08)', borderRadius: '8px', padding: '16px', marginBottom: '16px' }}>
      <h3 style={{ fontSize: '15px', fontWeight: '600', color: '#1d1d1f', margin: '0 0 16px 0' }}>
        {existingData ? 'Edit Tool' : 'Add Tool/Software'}
      </h3>

      {/* Tool Name */}
      <div style={{ marginBottom: '16px' }}>
        <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#1d1d1f', marginBottom: '6px' }}>
          Tool/Software Name *
        </label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="e.g., Docker, AWS, PostgreSQL"
          required
          style={{ width: '100%', padding: '10px 12px', border: '1px solid rgba(0, 0, 0, 0.12)', borderRadius: '6px', fontSize: '13px', fontFamily: 'inherit' }}
        />
      </div>

      {/* Category & Proficiency */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
        <div>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#1d1d1f', marginBottom: '6px' }}>
            Category
          </label>
          <select
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value as Tool['category'] })}
            style={{ width: '100%', padding: '10px 12px', border: '1px solid rgba(0, 0, 0, 0.12)', borderRadius: '6px', fontSize: '13px', fontFamily: 'inherit', backgroundColor: 'white' }}
          >
            <option value="language">Language</option>
            <option value="framework">Framework</option>
            <option value="database">Database</option>
            <option value="cloud">Cloud Platform</option>
            <option value="tool">Tool</option>
            <option value="platform">Platform</option>
          </select>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#1d1d1f', marginBottom: '6px' }}>
            Proficiency
          </label>
          <select
            value={formData.proficiency}
            onChange={(e) => setFormData({ ...formData, proficiency: e.target.value as Tool['proficiency'] })}
            style={{ width: '100%', padding: '10px 12px', border: '1px solid rgba(0, 0, 0, 0.12)', borderRadius: '6px', fontSize: '13px', fontFamily: 'inherit', backgroundColor: 'white' }}
          >
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
            <option value="expert">Expert</option>
          </select>
        </div>
      </div>

      {/* Version */}
      <div style={{ marginBottom: '16px' }}>
        <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#1d1d1f', marginBottom: '6px' }}>
          Version (optional)
        </label>
        <input
          type="text"
          value={formData.version}
          onChange={(e) => setFormData({ ...formData, version: e.target.value })}
          placeholder="e.g., React 18, Python 3.11"
          style={{ width: '100%', padding: '10px 12px', border: '1px solid rgba(0, 0, 0, 0.12)', borderRadius: '6px', fontSize: '13px', fontFamily: 'inherit' }}
        />
      </div>

      {/* Synonyms */}
      <div style={{ marginBottom: '16px' }}>
        <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#1d1d1f', marginBottom: '6px' }}>
          Synonyms (for ATS matching)
        </label>
        <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
          <input
            type="text"
            value={synonymInput}
            onChange={(e) => setSynonymInput(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addSynonym();
              }
            }}
            placeholder="e.g., PostgreSQL, Postgres"
            style={{ flex: 1, padding: '8px 12px', border: '1px solid rgba(0, 0, 0, 0.12)', borderRadius: '6px', fontSize: '13px', fontFamily: 'inherit' }}
          />
          <button type="button" onClick={addSynonym} style={{ padding: '8px 16px', background: '#0077B5', color: 'white', border: 'none', borderRadius: '6px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>
            Add
          </button>
        </div>
        {formData.synonyms && formData.synonyms.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {formData.synonyms.map((syn: string, i: number) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '4px 8px', backgroundColor: '#f0f9ff', borderRadius: '4px', fontSize: '12px', color: '#0077B5' }}>
                <span>{syn}</span>
                <button type="button" onClick={() => removeSynonym(i)} style={{ padding: '0', background: 'transparent', border: 'none', color: '#0077B5', cursor: 'pointer', fontSize: '14px', lineHeight: '1' }}>
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
          {existingData ? 'Update' : 'Add'} Tool
        </button>
      </div>
    </form>
  );
}

