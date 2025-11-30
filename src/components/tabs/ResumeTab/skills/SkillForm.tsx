import React, { useState } from 'react';
import type { Skill } from '../../../../types/resume';

interface SkillFormProps {
  existingData?: Skill;
  onSave: (data: Omit<Skill, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onCancel: () => void;
}

export function SkillForm({ existingData, onSave, onCancel }: SkillFormProps) {
  const [formData, setFormData] = useState({
    name: existingData?.name || '',
    category: existingData?.category || 'other' as Skill['category'],
    proficiency: existingData?.proficiency || 'intermediate' as Skill['proficiency'],
    yearsOfExperience: existingData?.yearsOfExperience || 0,
    synonyms: existingData?.synonyms || [],
  });

  const [synonymInput, setSynonymInput] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
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
    <form onSubmit={handleSubmit} style={{ backgroundColor: 'white', border: '1px solid rgba(0, 0, 0, 0.08)', borderRadius: '8px', padding: '16px', marginBottom: '16px' }}>
      <h3 style={{ fontSize: '15px', fontWeight: '600', color: '#1d1d1f', margin: '0 0 16px 0' }}>
        {existingData ? 'Edit Skill' : 'Add Technical Skill'}
      </h3>

      {/* Skill Name */}
      <div style={{ marginBottom: '16px' }}>
        <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#1d1d1f', marginBottom: '6px' }}>
          Skill Name *
        </label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="e.g., React, Python, Machine Learning"
          required
          style={{ width: '100%', padding: '10px 12px', border: '1px solid rgba(0, 0, 0, 0.12)', borderRadius: '6px', fontSize: '13px', fontFamily: 'inherit' }}
        />
      </div>

      {/* Category & Proficiency Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
        <div>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#1d1d1f', marginBottom: '6px' }}>
            Category
          </label>
          <select
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value as Skill['category'] })}
            style={{ width: '100%', padding: '10px 12px', border: '1px solid rgba(0, 0, 0, 0.12)', borderRadius: '6px', fontSize: '13px', fontFamily: 'inherit', backgroundColor: 'white' }}
          >
            <option value="frontend">Frontend</option>
            <option value="backend">Backend</option>
            <option value="devops">DevOps</option>
            <option value="data">Data/ML</option>
            <option value="design">Design</option>
            <option value="management">Management</option>
            <option value="other">Other</option>
          </select>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#1d1d1f', marginBottom: '6px' }}>
            Proficiency
          </label>
          <select
            value={formData.proficiency}
            onChange={(e) => setFormData({ ...formData, proficiency: e.target.value as Skill['proficiency'] })}
            style={{ width: '100%', padding: '10px 12px', border: '1px solid rgba(0, 0, 0, 0.12)', borderRadius: '6px', fontSize: '13px', fontFamily: 'inherit', backgroundColor: 'white' }}
          >
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
            <option value="expert">Expert</option>
          </select>
        </div>
      </div>

      {/* Years of Experience */}
      <div style={{ marginBottom: '16px' }}>
        <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#1d1d1f', marginBottom: '6px' }}>
          Years of Experience (optional)
        </label>
        <input
          type="number"
          min="0"
          max="50"
          value={formData.yearsOfExperience || ''}
          onChange={(e) => setFormData({ ...formData, yearsOfExperience: parseInt(e.target.value) || 0 })}
          placeholder="e.g., 3"
          style={{ width: '100%', padding: '10px 12px', border: '1px solid rgba(0, 0, 0, 0.12)', borderRadius: '6px', fontSize: '13px', fontFamily: 'inherit' }}
        />
      </div>

      {/* Synonyms for ATS */}
      <div style={{ marginBottom: '16px' }}>
        <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#1d1d1f', marginBottom: '6px' }}>
          Synonyms (for ATS matching)
        </label>
        <p style={{ fontSize: '12px', color: '#6e6e73', margin: '0 0 8px 0' }}>
          Add variations: React.js, ReactJS, etc.
        </p>
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
            placeholder="e.g., React.js"
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
          {existingData ? 'Update' : 'Add'} Skill
        </button>
      </div>
    </form>
  );
}

