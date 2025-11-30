import { useState } from 'react';
import { Plus } from 'lucide-react';
import type {
  ProfessionalProfile,
  JobExperience,
  InternshipExperience,
  VolunteerExperience,
} from '../../../../types/resume';
import {
  updateJobExperience,
  deleteJobExperience,
  addJobExperience,
  addInternshipExperience,
  deleteInternshipExperience,
  addVolunteerExperience,
  deleteVolunteerExperience,
} from '../../../../utils/storage';
import { SectionButton } from '../shared/SectionButton';
import { EmptyState } from '../shared/EmptyState';
import { JobForm } from './JobForm';
import { JobCard } from './JobCard';
import { InternshipCard } from './InternshipCard';
import { VolunteerCard } from './VolunteerCard';

interface ExperienceTabProps {
  profile: ProfessionalProfile;
  onUpdate: () => void;
}

export function ExperienceTab({ profile, onUpdate }: ExperienceTabProps) {
  const [activeSection, setActiveSection] = useState<'jobs' | 'internships' | 'volunteer'>('jobs');
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  return (
    <div style={{ padding: '20px' }}>
      {/* Section Selector */}
      <div
        style={{
          display: 'flex',
          gap: '8px',
          marginBottom: '20px',
          padding: '4px',
          backgroundColor: '#f9fafb',
          borderRadius: '8px',
        }}
      >
        <SectionButton
          label="Jobs"
          isActive={activeSection === 'jobs'}
          onClick={() => setActiveSection('jobs')}
        />
        <SectionButton
          label="Internships"
          isActive={activeSection === 'internships'}
          onClick={() => setActiveSection('internships')}
        />
        <SectionButton
          label="Volunteer"
          isActive={activeSection === 'volunteer'}
          onClick={() => setActiveSection('volunteer')}
        />
      </div>

      {/* Add Button */}
      {!isAdding && !editingId && (
        <button
          onClick={() => setIsAdding(true)}
          style={{
            width: '100%',
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
            marginBottom: '16px',
            transition: 'background 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#006399';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = '#0077B5';
          }}
        >
          <Plus size={18} strokeWidth={2} />
          <span>Add {activeSection === 'jobs' ? 'Job' : activeSection === 'internships' ? 'Internship' : 'Volunteer Work'}</span>
        </button>
      )}

      {/* Add/Edit Form */}
      {(isAdding || editingId) && (
        <JobForm
          type={activeSection}
          existingData={editingId ? (activeSection === 'jobs' ? profile.jobs.find(j => j.id === editingId) : activeSection === 'internships' ? profile.internships.find(i => i.id === editingId) : profile.volunteerWork.find(v => v.id === editingId)) : undefined}
          onSave={async (data) => {
            if (editingId) {
              if (activeSection === 'jobs') {
                await updateJobExperience(editingId, data as Partial<JobExperience>);
              }
              setEditingId(null);
            } else {
              if (activeSection === 'jobs') {
                await addJobExperience(data as Omit<JobExperience, 'id' | 'createdAt' | 'updatedAt'>);
              } else if (activeSection === 'internships') {
                await addInternshipExperience(data as Omit<InternshipExperience, 'id' | 'createdAt' | 'updatedAt'>);
              } else {
                await addVolunteerExperience(data as Omit<VolunteerExperience, 'id' | 'createdAt' | 'updatedAt'>);
              }
              setIsAdding(false);
            }
            onUpdate();
          }}
          onCancel={() => {
            setIsAdding(false);
            setEditingId(null);
          }}
        />
      )}

      {/* List */}
      {!isAdding && !editingId && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {activeSection === 'jobs' && profile.jobs.map((job) => (
            <JobCard
              key={job.id}
              job={job}
              onEdit={() => setEditingId(job.id)}
              onDelete={async () => {
                if (confirm(`Delete ${job.title} at ${job.company}?`)) {
                  await deleteJobExperience(job.id);
                  onUpdate();
                }
              }}
            />
          ))}
          {activeSection === 'internships' && profile.internships.map((internship) => (
            <InternshipCard
              key={internship.id}
              internship={internship}
              onEdit={() => setEditingId(internship.id)}
              onDelete={async () => {
                if (confirm(`Delete ${internship.title} at ${internship.company}?`)) {
                  await deleteInternshipExperience(internship.id);
                  onUpdate();
                }
              }}
            />
          ))}
          {activeSection === 'volunteer' && profile.volunteerWork.map((volunteer) => (
            <VolunteerCard
              key={volunteer.id}
              volunteer={volunteer}
              onEdit={() => setEditingId(volunteer.id)}
              onDelete={async () => {
                if (confirm(`Delete ${volunteer.role} at ${volunteer.organization}?`)) {
                  await deleteVolunteerExperience(volunteer.id);
                  onUpdate();
                }
              }}
            />
          ))}

          {/* Empty State */}
          {activeSection === 'jobs' && profile.jobs.length === 0 && (
            <EmptyState message="No jobs added yet" />
          )}
          {activeSection === 'internships' && profile.internships.length === 0 && (
            <EmptyState message="No internships added yet" />
          )}
          {activeSection === 'volunteer' && profile.volunteerWork.length === 0 && (
            <EmptyState message="No volunteer work added yet" />
          )}
        </div>
      )}
    </div>
  );
}
