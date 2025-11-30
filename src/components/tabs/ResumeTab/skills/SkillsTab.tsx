import { useState } from 'react';
import { Plus, Code } from 'lucide-react';
import type { ProfessionalProfile, Language } from '../../../../types/resume';
import {
  getProfessionalProfile,
  saveProfessionalProfile,
  addTechnicalSkill,
  updateTechnicalSkill,
  deleteTechnicalSkill,
  addTool,
  updateTool,
  deleteTool,
  addCertification,
  deleteCertification,
} from '../../../../utils/storage';
import { SectionButton } from '../shared/SectionButton';
import { EmptyState } from '../shared/EmptyState';
import { SkillForm } from './SkillForm';
import { SkillCard } from './SkillCard';
import { ToolForm } from './ToolForm';
import { ToolCard } from './ToolCard';
import { CertificationForm } from './CertificationForm';
import { CertificationCard } from './CertificationCard';
import { LanguageForm } from './LanguageForm';
import { LanguageCard } from './LanguageCard';

export function SkillsTab({ profile, onUpdate }: { profile: ProfessionalProfile; onUpdate: () => void }) {
  const [activeSection, setActiveSection] = useState<'skills' | 'tools' | 'certifications' | 'languages'>('skills');
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  if (!profile) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <Code size={48} strokeWidth={1.5} style={{ color: '#d1d5db', margin: '0 auto 16px auto' }} />
        <p style={{ fontSize: '14px', color: '#6e6e73', margin: 0 }}>Loading profile...</p>
      </div>
    );
  }

  const handleAddSkill = async (skillData: any) => {
    try {
      await addTechnicalSkill(skillData);
      setIsAdding(false);
      onUpdate();
    } catch (error) {
      console.error('[Uproot] Error adding skill:', error);
    }
  };

  const handleUpdateSkill = async (id: string, updates: any) => {
    try {
      await updateTechnicalSkill(id, updates);
      setEditingId(null);
      onUpdate();
    } catch (error) {
      console.error('[Uproot] Error updating skill:', error);
    }
  };

  const handleDeleteSkill = async (id: string) => {
    if (!confirm('Delete this skill?')) return;
    try {
      await deleteTechnicalSkill(id);
      onUpdate();
    } catch (error) {
      console.error('[Uproot] Error deleting skill:', error);
    }
  };

  const handleAddTool = async (toolData: any) => {
    try {
      await addTool(toolData);
      setIsAdding(false);
      onUpdate();
    } catch (error) {
      console.error('[Uproot] Error adding tool:', error);
    }
  };

  const handleUpdateTool = async (id: string, updates: any) => {
    try {
      await updateTool(id, updates);
      setEditingId(null);
      onUpdate();
    } catch (error) {
      console.error('[Uproot] Error updating tool:', error);
    }
  };

  const handleDeleteTool = async (id: string) => {
    if (!confirm('Delete this tool?')) return;
    try {
      await deleteTool(id);
      onUpdate();
    } catch (error) {
      console.error('[Uproot] Error deleting tool:', error);
    }
  };

  const handleAddCertification = async (certData: any) => {
    try {
      await addCertification(certData);
      setIsAdding(false);
      onUpdate();
    } catch (error) {
      console.error('[Uproot] Error adding certification:', error);
    }
  };

  const handleDeleteCertification = async (id: string) => {
    if (!confirm('Delete this certification?')) return;
    try {
      await deleteCertification(id);
      onUpdate();
    } catch (error) {
      console.error('[Uproot] Error deleting certification:', error);
    }
  };

  const handleAddLanguage = async (langData: any) => {
    try {
      // Add language directly to profile
      const updatedProfile = await getProfessionalProfile();
      const newLang: Language = {
        ...langData,
        id: `lang_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      };
      updatedProfile.languages.push(newLang);
      await saveProfessionalProfile(updatedProfile);
      setIsAdding(false);
      onUpdate();
    } catch (error) {
      console.error('[Uproot] Error adding language:', error);
    }
  };

  const handleDeleteLanguage = async (id: string) => {
    if (!confirm('Delete this language?')) return;
    try {
      const updatedProfile = await getProfessionalProfile();
      updatedProfile.languages = updatedProfile.languages.filter((l) => l.id !== id);
      await saveProfessionalProfile(updatedProfile);
      onUpdate();
    } catch (error) {
      console.error('[Uproot] Error deleting language:', error);
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      {/* Section Selector */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', padding: '4px', backgroundColor: '#f9fafb', borderRadius: '8px' }}>
        <SectionButton label="Skills" isActive={activeSection === 'skills'} onClick={() => { setActiveSection('skills'); setIsAdding(false); setEditingId(null); }} />
        <SectionButton label="Tools" isActive={activeSection === 'tools'} onClick={() => { setActiveSection('tools'); setIsAdding(false); setEditingId(null); }} />
        <SectionButton label="Certs" isActive={activeSection === 'certifications'} onClick={() => { setActiveSection('certifications'); setIsAdding(false); setEditingId(null); }} />
        <SectionButton label="Languages" isActive={activeSection === 'languages'} onClick={() => { setActiveSection('languages'); setIsAdding(false); setEditingId(null); }} />
      </div>

      {/* Technical Skills Section */}
      {activeSection === 'skills' && (
        <>
          {/* Add Button */}
          {!isAdding && !editingId && (
            <button
              onClick={() => setIsAdding(true)}
              style={{
                width: '100%',
                padding: '12px',
                background: 'white',
                color: '#0077B5',
                border: '1px dashed rgba(0, 119, 181, 0.3)',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: '600',
                cursor: 'pointer',
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                transition: 'all 0.2s',
              }}
            >
              <Plus size={16} strokeWidth={2} />
              Add Technical Skill
            </button>
          )}

          {/* Add/Edit Form */}
          {isAdding && (
            <SkillForm onSave={handleAddSkill} onCancel={() => setIsAdding(false)} />
          )}
          {editingId && (
            <SkillForm
              existingData={profile.technicalSkills.find((s) => s.id === editingId)}
              onSave={(data) => handleUpdateSkill(editingId, data)}
              onCancel={() => setEditingId(null)}
            />
          )}

          {/* Skills List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {profile.technicalSkills.map((skill) => (
              <SkillCard
                key={skill.id}
                skill={skill}
                onEdit={() => setEditingId(skill.id)}
                onDelete={() => handleDeleteSkill(skill.id)}
              />
            ))}
          </div>

          {profile.technicalSkills.length === 0 && !isAdding && (
            <EmptyState message="No technical skills added yet. Click above to add your first skill!" />
          )}
        </>
      )}

      {/* Tools Section */}
      {activeSection === 'tools' && (
        <>
          {!isAdding && !editingId && (
            <button
              onClick={() => setIsAdding(true)}
              style={{
                width: '100%',
                padding: '12px',
                background: 'white',
                color: '#0077B5',
                border: '1px dashed rgba(0, 119, 181, 0.3)',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: '600',
                cursor: 'pointer',
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
              }}
            >
              <Plus size={16} strokeWidth={2} />
              Add Tool/Software
            </button>
          )}

          {isAdding && (
            <ToolForm onSave={handleAddTool} onCancel={() => setIsAdding(false)} />
          )}
          {editingId && (
            <ToolForm
              existingData={profile.tools.find((t) => t.id === editingId)}
              onSave={(data) => handleUpdateTool(editingId, data)}
              onCancel={() => setEditingId(null)}
            />
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {profile.tools.map((tool) => (
              <ToolCard
                key={tool.id}
                tool={tool}
                onEdit={() => setEditingId(tool.id)}
                onDelete={() => handleDeleteTool(tool.id)}
              />
            ))}
          </div>

          {profile.tools.length === 0 && !isAdding && (
            <EmptyState message="No tools added yet. Add frameworks, platforms, and software you use!" />
          )}
        </>
      )}

      {/* Certifications Section */}
      {activeSection === 'certifications' && (
        <>
          {!isAdding && (
            <button
              onClick={() => setIsAdding(true)}
              style={{
                width: '100%',
                padding: '12px',
                background: 'white',
                color: '#0077B5',
                border: '1px dashed rgba(0, 119, 181, 0.3)',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: '600',
                cursor: 'pointer',
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
              }}
            >
              <Plus size={16} strokeWidth={2} />
              Add Certification
            </button>
          )}

          {isAdding && (
            <CertificationForm onSave={handleAddCertification} onCancel={() => setIsAdding(false)} />
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {profile.certifications.map((cert) => (
              <CertificationCard
                key={cert.id}
                certification={cert}
                onDelete={() => handleDeleteCertification(cert.id)}
              />
            ))}
          </div>

          {profile.certifications.length === 0 && !isAdding && (
            <EmptyState message="No certifications added yet. Add your AWS, Google, Microsoft, or other certs!" />
          )}
        </>
      )}

      {/* Languages Section */}
      {activeSection === 'languages' && (
        <>
          {!isAdding && (
            <button
              onClick={() => setIsAdding(true)}
              style={{
                width: '100%',
                padding: '12px',
                background: 'white',
                color: '#0077B5',
                border: '1px dashed rgba(0, 119, 181, 0.3)',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: '600',
                cursor: 'pointer',
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
              }}
            >
              <Plus size={16} strokeWidth={2} />
              Add Language
            </button>
          )}

          {isAdding && (
            <LanguageForm onSave={handleAddLanguage} onCancel={() => setIsAdding(false)} />
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {profile.languages.map((lang) => (
              <LanguageCard
                key={lang.id}
                language={lang}
                onDelete={() => handleDeleteLanguage(lang.id)}
              />
            ))}
          </div>

          {profile.languages.length === 0 && !isAdding && (
            <EmptyState message="No languages added yet. Add languages you speak!" />
          )}
        </>
      )}
    </div>
  );
}

// ============================================================================
// SKILL FORMS & CARDS
// ============================================================================
