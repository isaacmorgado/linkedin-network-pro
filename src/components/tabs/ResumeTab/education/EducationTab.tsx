import { useState } from 'react';
import { Plus, GraduationCap } from 'lucide-react';
import type { ProfessionalProfile } from '../../../../types/resume';
import {
  addEducation,
  deleteEducation,
  addProject,
  deleteProject,
} from '../../../../utils/storage';
import { SectionButton } from '../shared/SectionButton';
import { EmptyState } from '../shared/EmptyState';
import { EducationForm } from './EducationForm';
import { EducationCard } from './EducationCard';
import { ProjectForm } from './ProjectForm';
import { ProjectCard } from './ProjectCard';

export function EducationTab({ profile, onUpdate }: { profile: ProfessionalProfile; onUpdate: () => void }) {
  const [activeSection, setActiveSection] = useState<'education' | 'projects'>('education');
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  if (!profile) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <GraduationCap size={48} strokeWidth={1.5} style={{ color: '#d1d5db', margin: '0 auto 16px auto' }} />
        <p style={{ fontSize: '14px', color: '#6e6e73', margin: 0 }}>Loading profile...</p>
      </div>
    );
  }

  const handleAddEducation = async (eduData: any) => {
    try {
      await addEducation(eduData);
      setIsAdding(false);
      onUpdate();
    } catch (error) {
      console.error('[Uproot] Error adding education:', error);
    }
  };

  const handleDeleteEducation = async (id: string) => {
    if (!confirm('Delete this education entry?')) return;
    try {
      await deleteEducation(id);
      onUpdate();
    } catch (error) {
      console.error('[Uproot] Error deleting education:', error);
    }
  };

  const handleAddProject = async (projectData: any) => {
    try {
      await addProject(projectData);
      setIsAdding(false);
      onUpdate();
    } catch (error) {
      console.error('[Uproot] Error adding project:', error);
    }
  };

  const handleDeleteProject = async (id: string) => {
    if (!confirm('Delete this project?')) return;
    try {
      await deleteProject(id);
      onUpdate();
    } catch (error) {
      console.error('[Uproot] Error deleting project:', error);
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      {/* Section Selector */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', padding: '4px', backgroundColor: '#f9fafb', borderRadius: '8px' }}>
        <SectionButton
          label="Education"
          isActive={activeSection === 'education'}
          onClick={() => { setActiveSection('education'); setIsAdding(false); setEditingId(null); }}
        />
        <SectionButton
          label="Projects"
          isActive={activeSection === 'projects'}
          onClick={() => { setActiveSection('projects'); setIsAdding(false); setEditingId(null); }}
        />
      </div>

      {/* Education Section */}
      {activeSection === 'education' && (
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
                transition: 'all 0.2s',
              }}
            >
              <Plus size={16} strokeWidth={2} />
              Add Education
            </button>
          )}

          {isAdding && (
            <EducationForm onSave={handleAddEducation} onCancel={() => setIsAdding(false)} />
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {profile.education.map((edu) => (
              <EducationCard
                key={edu.id}
                education={edu}
                onDelete={() => handleDeleteEducation(edu.id)}
              />
            ))}
          </div>

          {profile.education.length === 0 && !isAdding && (
            <EmptyState message="No education added yet. Add your degrees and certifications!" />
          )}
        </>
      )}

      {/* Projects Section */}
      {activeSection === 'projects' && (
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
              Add Project
            </button>
          )}

          {isAdding && (
            <ProjectForm onSave={handleAddProject} onCancel={() => setIsAdding(false)} />
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {profile.projects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                onDelete={() => handleDeleteProject(project.id)}
              />
            ))}
          </div>

          {profile.projects.length === 0 && !isAdding && (
            <EmptyState message="No projects added yet. Showcase your work and side projects!" />
          )}
        </>
      )}
    </div>
  );
}

// ============================================================================
// EDUCATION FORMS & CARDS
// ============================================================================
