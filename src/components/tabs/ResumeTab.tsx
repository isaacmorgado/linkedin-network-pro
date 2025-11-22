/**
 * Professional Profile Builder Tab
 * Optional: Build comprehensive career profile for AI-powered resume generation
 * Note: This tab is only needed for resume generation features. Connection pathfinding works without it.
 */

import React, { useState, useEffect } from 'react';
import {
  Briefcase,
  GraduationCap,
  Code,
  FileText,
  Plus,
  Edit2,
  Trash2,
  Save,
  X,
  Calendar,
  MapPin,
  Building2,
  Award,
  Link as LinkIcon,
  Sparkles,
  CheckCircle2,
  TrendingUp,
  RefreshCw,
  Info,
} from 'lucide-react';
import type {
  ProfessionalProfile,
  JobExperience,
  InternshipExperience,
  VolunteerExperience,
  ExperienceBullet,
  Skill,
  Tool,
  Certification,
  Language,
  Education,
  Project,
} from '../../types/resume';
import {
  getProfessionalProfile,
  saveProfessionalProfile,
  addJobExperience,
  updateJobExperience,
  deleteJobExperience,
  addInternshipExperience,
  deleteInternshipExperience,
  addVolunteerExperience,
  deleteVolunteerExperience,
  addTechnicalSkill,
  updateTechnicalSkill,
  deleteTechnicalSkill,
  addTool,
  updateTool,
  deleteTool,
  addCertification,
  deleteCertification,
  addEducation,
  deleteEducation,
  addProject,
  deleteProject,
} from '../../utils/storage';
import { COLORS, SPACING, TYPOGRAPHY, RADIUS } from '../../styles/tokens';

interface ResumeTabProps {
  panelWidth?: number;
}

type SubTab = 'experience' | 'skills' | 'education' | 'generate';

export function ResumeTab({ panelWidth = 400 }: ResumeTabProps) {
  const [activeSubTab, setActiveSubTab] = useState<SubTab>('experience');
  const [profile, setProfile] = useState<ProfessionalProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    setIsLoading(true);
    try {
      const profileData = await getProfessionalProfile();
      setProfile(profileData);
    } catch (error) {
      console.error('[Uproot] Error loading profile:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          color: '#6e6e73',
          flexDirection: 'column',
          gap: '12px',
        }}
      >
        <RefreshCw size={32} className="animate-spin" strokeWidth={2} />
        <span style={{ fontSize: '14px', fontWeight: '500' }}>Loading profile...</span>
      </div>
    );
  }

  if (!profile) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '40px 20px',
          gap: '16px',
        }}
      >
        <p style={{ color: '#991B1B', fontSize: '14px', fontWeight: '600', margin: 0 }}>
          Unable to load your profile
        </p>
        <button
          onClick={loadProfile}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 16px',
            backgroundColor: '#0077B5',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'background-color 150ms',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#005885';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#0077B5';
          }}
        >
          <RefreshCw size={16} />
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '20px 20px 16px 20px',
          borderBottom: '1px solid rgba(0, 0, 0, 0.08)',
        }}
      >
        <h2
          style={{
            fontSize: '20px',
            fontWeight: '700',
            margin: '0 0 4px 0',
            color: '#1d1d1f',
          }}
        >
          Professional Profile
        </h2>
        <p
          style={{
            fontSize: '13px',
            color: '#6e6e73',
            margin: 0,
          }}
        >
          Optional: Build your career database for AI resume generation
        </p>
      </div>

      {/* Sub-Tab Navigation */}
      <div
        style={{
          padding: panelWidth < 360 ? '12px' : '16px',
          borderBottom: '1px solid rgba(0, 0, 0, 0.08)',
          backgroundColor: 'rgba(0, 119, 181, 0.03)',
        }}
      >
        <div style={{ display: 'flex', gap: panelWidth < 360 ? '4px' : '8px' }}>
          <SubTabButton
            icon={<Briefcase size={14} strokeWidth={2} />}
            label="Experience"
            isActive={activeSubTab === 'experience'}
            onClick={() => setActiveSubTab('experience')}
            panelWidth={panelWidth}
          />
          <SubTabButton
            icon={<Code size={14} strokeWidth={2} />}
            label="Skills"
            isActive={activeSubTab === 'skills'}
            onClick={() => setActiveSubTab('skills')}
            panelWidth={panelWidth}
          />
          <SubTabButton
            icon={<GraduationCap size={14} strokeWidth={2} />}
            label="Education"
            isActive={activeSubTab === 'education'}
            onClick={() => setActiveSubTab('education')}
            panelWidth={panelWidth}
          />
          <SubTabButton
            icon={<Sparkles size={14} strokeWidth={2} />}
            label="Generate"
            isActive={activeSubTab === 'generate'}
            onClick={() => setActiveSubTab('generate')}
            panelWidth={panelWidth}
          />
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflow: 'auto' }}>
        {activeSubTab === 'experience' && <ExperienceTab profile={profile} onUpdate={loadProfile} />}
        {activeSubTab === 'skills' && <SkillsTab profile={profile} onUpdate={loadProfile} />}
        {activeSubTab === 'education' && <EducationTab profile={profile} onUpdate={loadProfile} />}
        {activeSubTab === 'generate' && <GenerateTab profile={profile} />}
      </div>
    </div>
  );
}

// Sub-Tab Button Component
interface SubTabButtonProps {
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  onClick: () => void;
  panelWidth: number;
}

function SubTabButton({ icon, label, isActive, onClick, panelWidth }: SubTabButtonProps) {
  // Responsive sizing
  const isIconOnly = panelWidth < 360;
  const isSmall = panelWidth < 420;

  // Abbreviated labels for small screens
  const shortLabel = label === 'Experience' ? 'Exp' : label === 'Education' ? 'Edu' : label === 'Generate' ? 'Gen' : label;

  return (
    <button
      onClick={onClick}
      title={label} // Tooltip for icon-only mode
      style={{
        flex: 1,
        padding: isIconOnly ? '10px 8px' : isSmall ? '8px 10px' : '10px 14px',
        background: isActive ? '#0077B5' : 'white',
        color: isActive ? 'white' : '#6e6e73',
        border: isActive ? 'none' : '1px solid rgba(0, 0, 0, 0.12)',
        borderRadius: isSmall ? '6px' : '8px',
        fontSize: '13px',
        fontWeight: '600',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '6px',
        transition: 'all 0.2s',
        minWidth: 0,
      }}
      onMouseEnter={(e) => {
        if (!isActive) {
          e.currentTarget.style.backgroundColor = '#f9fafb';
          e.currentTarget.style.borderColor = 'rgba(0, 0, 0, 0.16)';
        }
      }}
      onMouseLeave={(e) => {
        if (!isActive) {
          e.currentTarget.style.backgroundColor = 'white';
          e.currentTarget.style.borderColor = 'rgba(0, 0, 0, 0.12)';
        }
      }}
    >
      {icon}
      {!isIconOnly && (
        <span style={{
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}>
          {isSmall ? shortLabel : label}
        </span>
      )}
    </button>
  );
}

// ============================================================================
// EXPERIENCE TAB
// ============================================================================

interface ExperienceTabProps {
  profile: ProfessionalProfile;
  onUpdate: () => void;
}

function ExperienceTab({ profile, onUpdate }: ExperienceTabProps) {
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

// Section Button
interface SectionButtonProps {
  label: string;
  isActive: boolean;
  onClick: () => void;
}

function SectionButton({ label, isActive, onClick }: SectionButtonProps) {
  return (
    <button
      onClick={onClick}
      style={{
        flex: 1,
        padding: '8px 12px',
        background: isActive ? 'white' : 'transparent',
        color: isActive ? '#1d1d1f' : '#6e6e73',
        border: 'none',
        borderRadius: '6px',
        fontSize: '13px',
        fontWeight: '600',
        cursor: 'pointer',
        transition: 'all 0.2s',
        boxShadow: isActive ? '0 1px 3px rgba(0, 0, 0, 0.08)' : 'none',
      }}
    >
      {label}
    </button>
  );
}

// Job Form Component
interface JobFormProps {
  type: 'jobs' | 'internships' | 'volunteer';
  existingData?: any;
  onSave: (data: any) => void;
  onCancel: () => void;
}

function JobForm({ type, existingData, onSave, onCancel }: JobFormProps) {
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

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
      style={{
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
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#1d1d1f', marginBottom: '6px' }}>
              Start Date *
            </label>
            <input
              type="month"
              value={formData.startDate}
              onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              required
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
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#1d1d1f', marginBottom: '6px' }}>
              End Date
            </label>
            <input
              type="month"
              value={formData.endDate}
              onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
              disabled={formData.current}
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid rgba(0, 0, 0, 0.12)',
                borderRadius: '6px',
                fontSize: '14px',
                fontFamily: 'inherit',
                opacity: formData.current ? 0.5 : 1,
              }}
            />
          </div>
        </div>

        {/* Current Position */}
        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#1d1d1f', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={formData.current}
            onChange={(e) => setFormData({ ...formData, current: e.target.checked, endDate: e.target.checked ? '' : formData.endDate })}
            style={{ width: '16px', height: '16px' }}
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

// Job Card Component
interface JobCardProps {
  job: JobExperience;
  onEdit: () => void;
  onDelete: () => void;
}

function JobCard({ job, onEdit, onDelete }: JobCardProps) {
  const formatDate = (date: string) => {
    if (!date) return '';
    const [year, month] = date.split('-');
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${monthNames[parseInt(month) - 1]} ${year}`;
  };

  const dateRange = `${formatDate(job.startDate)} - ${job.current ? 'Present' : formatDate(job.endDate || '')}`;

  return (
    <div
      style={{
        backgroundColor: 'white',
        border: '1px solid rgba(0, 0, 0, 0.08)',
        borderRadius: '8px',
        padding: '16px',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
        <div style={{ flex: 1 }}>
          <h3 style={{ fontSize: '15px', fontWeight: '600', color: '#1d1d1f', margin: '0 0 4px 0' }}>
            {job.title}
          </h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#6e6e73', marginBottom: '4px' }}>
            <Building2 size={12} strokeWidth={2} />
            <span>{job.company}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '12px', color: '#6e6e73' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Calendar size={12} strokeWidth={2} />
              <span>{dateRange}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <MapPin size={12} strokeWidth={2} />
              <span>{job.location}</span>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '4px' }}>
          <button
            onClick={onEdit}
            style={{
              padding: '8px',
              background: 'transparent',
              border: 'none',
              color: '#0077B5',
              cursor: 'pointer',
              borderRadius: '6px',
              transition: 'background 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(0, 119, 181, 0.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            <Edit2 size={16} strokeWidth={2} />
          </button>
          <button
            onClick={onDelete}
            style={{
              padding: '8px',
              background: 'transparent',
              border: 'none',
              color: '#dc2626',
              cursor: 'pointer',
              borderRadius: '6px',
              transition: 'background 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#fef2f2';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            <Trash2 size={16} strokeWidth={2} />
          </button>
        </div>
      </div>

      {/* Bullets */}
      {job.bullets.length > 0 && (
        <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid rgba(0, 0, 0, 0.08)' }}>
          <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {job.bullets.slice(0, 3).map((bullet) => (
              <li key={bullet.id} style={{ fontSize: '13px', color: '#1d1d1f', display: 'flex', gap: '8px' }}>
                <span style={{ color: '#0077B5' }}>•</span>
                <span style={{ flex: 1 }}>{bullet.text}</span>
              </li>
            ))}
          </ul>
          {job.bullets.length > 3 && (
            <p style={{ fontSize: '12px', color: '#6e6e73', margin: '8px 0 0 0' }}>
              +{job.bullets.length - 3} more accomplishment{job.bullets.length - 3 !== 1 ? 's' : ''}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// Internship & Volunteer Cards (similar structure)
function InternshipCard({ internship, onEdit, onDelete }: { internship: InternshipExperience; onEdit: () => void; onDelete: () => void }) {
  return <JobCard job={internship as any} onEdit={onEdit} onDelete={onDelete} />;
}

function VolunteerCard({ volunteer, onEdit, onDelete }: { volunteer: VolunteerExperience; onEdit: () => void; onDelete: () => void }) {
  return <JobCard job={{ ...volunteer, title: volunteer.role, company: volunteer.organization } as any} onEdit={onEdit} onDelete={onDelete} />;
}

// Empty State
function EmptyState({ message }: { message: string }) {
  return (
    <div style={{ textAlign: 'center', padding: '48px 20px' }}>
      <Briefcase size={48} strokeWidth={1.5} style={{ color: '#d1d5db', margin: '0 auto 16px auto' }} />
      <p style={{ fontSize: '14px', color: '#6e6e73', margin: 0 }}>{message}</p>
    </div>
  );
}

// ============================================================================
// SKILLS TAB
// ============================================================================

function SkillsTab({ profile, onUpdate }: { profile: ProfessionalProfile; onUpdate: () => void }) {
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

interface SkillFormProps {
  existingData?: Skill;
  onSave: (data: Omit<Skill, 'id'>) => void;
  onCancel: () => void;
}

function SkillForm({ existingData, onSave, onCancel }: SkillFormProps) {
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
            {formData.synonyms.map((syn, i) => (
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

function SkillCard({ skill, onEdit, onDelete }: { skill: Skill; onEdit: () => void; onDelete: () => void }) {
  const proficiencyColors = {
    beginner: '#94a3b8',
    intermediate: '#60a5fa',
    advanced: '#0077B5',
    expert: '#7c3aed',
  };

  const categoryIcons = {
    frontend: '🎨',
    backend: '⚙️',
    devops: '🚀',
    data: '📊',
    design: '✨',
    management: '👔',
    other: '💡',
  };

  return (
    <div style={{ backgroundColor: 'white', border: '1px solid rgba(0, 0, 0, 0.08)', borderRadius: '8px', padding: '14px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <span style={{ fontSize: '16px' }}>{categoryIcons[skill.category]}</span>
            <h3 style={{ fontSize: '15px', fontWeight: '600', color: '#1d1d1f', margin: 0 }}>
              {skill.name}
            </h3>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
            <span
              style={{
                padding: '4px 10px',
                backgroundColor: `${proficiencyColors[skill.proficiency]}15`,
                color: proficiencyColors[skill.proficiency],
                borderRadius: '4px',
                fontSize: '12px',
                fontWeight: '600',
                textTransform: 'capitalize',
              }}
            >
              {skill.proficiency}
            </span>
            <span style={{ fontSize: '12px', color: '#6e6e73', textTransform: 'capitalize' }}>
              {skill.category.replace('-', ' ')}
            </span>
            {skill.yearsOfExperience && skill.yearsOfExperience > 0 && (
              <span style={{ fontSize: '12px', color: '#6e6e73' }}>
                • {skill.yearsOfExperience} {skill.yearsOfExperience === 1 ? 'year' : 'years'}
              </span>
            )}
          </div>

          {skill.synonyms && skill.synonyms.length > 0 && (
            <div style={{ marginTop: '8px', fontSize: '11px', color: '#9ca3af' }}>
              ATS: {skill.synonyms.join(', ')}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: '4px' }}>
          <button onClick={onEdit} style={{ padding: '6px', background: 'transparent', border: 'none', color: '#0077B5', cursor: 'pointer', borderRadius: '4px' }}>
            <Edit2 size={14} strokeWidth={2} />
          </button>
          <button onClick={onDelete} style={{ padding: '6px', background: 'transparent', border: 'none', color: '#dc2626', cursor: 'pointer', borderRadius: '4px' }}>
            <Trash2 size={14} strokeWidth={2} />
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// TOOL FORMS & CARDS
// ============================================================================

interface ToolFormProps {
  existingData?: Tool;
  onSave: (data: Omit<Tool, 'id'>) => void;
  onCancel: () => void;
}

function ToolForm({ existingData, onSave, onCancel }: ToolFormProps) {
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
            {formData.synonyms.map((syn, i) => (
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

function ToolCard({ tool, onEdit, onDelete }: { tool: Tool; onEdit: () => void; onDelete: () => void }) {
  const proficiencyColors = {
    beginner: '#94a3b8',
    intermediate: '#60a5fa',
    advanced: '#0077B5',
    expert: '#7c3aed',
  };

  const categoryIcons = {
    language: '📝',
    framework: '🏗️',
    database: '🗄️',
    cloud: '☁️',
    tool: '🔧',
    platform: '🌐',
  };

  return (
    <div style={{ backgroundColor: 'white', border: '1px solid rgba(0, 0, 0, 0.08)', borderRadius: '8px', padding: '14px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <span style={{ fontSize: '16px' }}>{categoryIcons[tool.category]}</span>
            <h3 style={{ fontSize: '15px', fontWeight: '600', color: '#1d1d1f', margin: 0 }}>
              {tool.name}
            </h3>
            {tool.version && (
              <span style={{ fontSize: '12px', color: '#6e6e73', fontWeight: '500' }}>
                v{tool.version}
              </span>
            )}
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
            <span
              style={{
                padding: '4px 10px',
                backgroundColor: `${proficiencyColors[tool.proficiency]}15`,
                color: proficiencyColors[tool.proficiency],
                borderRadius: '4px',
                fontSize: '12px',
                fontWeight: '600',
                textTransform: 'capitalize',
              }}
            >
              {tool.proficiency}
            </span>
            <span style={{ fontSize: '12px', color: '#6e6e73', textTransform: 'capitalize' }}>
              {tool.category}
            </span>
          </div>

          {tool.synonyms && tool.synonyms.length > 0 && (
            <div style={{ marginTop: '8px', fontSize: '11px', color: '#9ca3af' }}>
              ATS: {tool.synonyms.join(', ')}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: '4px' }}>
          <button onClick={onEdit} style={{ padding: '6px', background: 'transparent', border: 'none', color: '#0077B5', cursor: 'pointer', borderRadius: '4px' }}>
            <Edit2 size={14} strokeWidth={2} />
          </button>
          <button onClick={onDelete} style={{ padding: '6px', background: 'transparent', border: 'none', color: '#dc2626', cursor: 'pointer', borderRadius: '4px' }}>
            <Trash2 size={14} strokeWidth={2} />
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// CERTIFICATION FORMS & CARDS
// ============================================================================

interface CertificationFormProps {
  onSave: (data: Omit<Certification, 'id'>) => void;
  onCancel: () => void;
}

function CertificationForm({ onSave, onCancel }: CertificationFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    issuer: '',
    issueDate: '',
    expiryDate: '',
    credentialId: '',
    credentialUrl: '',
    acronym: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.issuer.trim()) return;
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} style={{ backgroundColor: 'white', border: '1px solid rgba(0, 0, 0, 0.08)', borderRadius: '8px', padding: '16px', marginBottom: '16px' }}>
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
        <div>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#1d1d1f', marginBottom: '6px' }}>
            Issue Date
          </label>
          <input
            type="month"
            value={formData.issueDate}
            onChange={(e) => setFormData({ ...formData, issueDate: e.target.value })}
            style={{ width: '100%', padding: '10px 12px', border: '1px solid rgba(0, 0, 0, 0.12)', borderRadius: '6px', fontSize: '13px', fontFamily: 'inherit' }}
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#1d1d1f', marginBottom: '6px' }}>
            Expiry Date (optional)
          </label>
          <input
            type="month"
            value={formData.expiryDate}
            onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
            style={{ width: '100%', padding: '10px 12px', border: '1px solid rgba(0, 0, 0, 0.12)', borderRadius: '6px', fontSize: '13px', fontFamily: 'inherit' }}
          />
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

function CertificationCard({ certification, onDelete }: { certification: Certification; onDelete: () => void }) {
  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const [year, month] = dateStr.split('-');
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${monthNames[parseInt(month) - 1]} ${year}`;
  };

  const isExpired = certification.expiryDate && new Date(certification.expiryDate) < new Date();

  return (
    <div style={{ backgroundColor: 'white', border: '1px solid rgba(0, 0, 0, 0.08)', borderRadius: '8px', padding: '14px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <span style={{ fontSize: '16px' }}>🎓</span>
            <h3 style={{ fontSize: '15px', fontWeight: '600', color: '#1d1d1f', margin: 0 }}>
              {certification.name}
            </h3>
            {certification.acronym && (
              <span style={{ fontSize: '12px', color: '#6e6e73', fontWeight: '600' }}>
                ({certification.acronym})
              </span>
            )}
          </div>

          <div style={{ fontSize: '13px', color: '#6e6e73', marginBottom: '6px' }}>
            {certification.issuer}
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center', fontSize: '12px', color: '#6e6e73' }}>
            {certification.issueDate && (
              <span>Issued: {formatDate(certification.issueDate)}</span>
            )}
            {certification.expiryDate && (
              <span style={{ color: isExpired ? '#dc2626' : '#6e6e73' }}>
                {isExpired ? '⚠️ Expired' : 'Expires'}: {formatDate(certification.expiryDate)}
              </span>
            )}
          </div>

          {(certification.credentialId || certification.credentialUrl) && (
            <div style={{ marginTop: '8px', fontSize: '11px', color: '#9ca3af' }}>
              {certification.credentialId && <div>ID: {certification.credentialId}</div>}
              {certification.credentialUrl && (
                <a href={certification.credentialUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#0077B5', textDecoration: 'none' }}>
                  View Credential →
                </a>
              )}
            </div>
          )}
        </div>

        <button onClick={onDelete} style={{ padding: '6px', background: 'transparent', border: 'none', color: '#dc2626', cursor: 'pointer', borderRadius: '4px' }}>
          <Trash2 size={14} strokeWidth={2} />
        </button>
      </div>
    </div>
  );
}

// ============================================================================
// LANGUAGE FORMS & CARDS
// ============================================================================

interface LanguageFormProps {
  onSave: (data: Omit<Language, 'id'>) => void;
  onCancel: () => void;
}

function LanguageForm({ onSave, onCancel }: LanguageFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    proficiency: 'professional-working' as Language['proficiency'],
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} style={{ backgroundColor: 'white', border: '1px solid rgba(0, 0, 0, 0.08)', borderRadius: '8px', padding: '16px', marginBottom: '16px' }}>
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

function LanguageCard({ language, onDelete }: { language: Language; onDelete: () => void }) {
  const proficiencyLabels = {
    'elementary': 'Elementary',
    'limited-working': 'Limited Working',
    'professional-working': 'Professional Working',
    'full-professional': 'Full Professional',
    'native': 'Native / Bilingual',
  };

  const proficiencyColors = {
    'elementary': '#94a3b8',
    'limited-working': '#64748b',
    'professional-working': '#0077B5',
    'full-professional': '#0ea5e9',
    'native': '#7c3aed',
  };

  return (
    <div style={{ backgroundColor: 'white', border: '1px solid rgba(0, 0, 0, 0.08)', borderRadius: '8px', padding: '14px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '20px' }}>🌍</span>
          <div>
            <h3 style={{ fontSize: '15px', fontWeight: '600', color: '#1d1d1f', margin: '0 0 4px 0' }}>
              {language.name}
            </h3>
            <span
              style={{
                padding: '4px 10px',
                backgroundColor: `${proficiencyColors[language.proficiency]}15`,
                color: proficiencyColors[language.proficiency],
                borderRadius: '4px',
                fontSize: '12px',
                fontWeight: '600',
              }}
            >
              {proficiencyLabels[language.proficiency]}
            </span>
          </div>
        </div>

        <button onClick={onDelete} style={{ padding: '6px', background: 'transparent', border: 'none', color: '#dc2626', cursor: 'pointer', borderRadius: '4px' }}>
          <Trash2 size={14} strokeWidth={2} />
        </button>
      </div>
    </div>
  );
}

// ============================================================================
// EDUCATION TAB
// ============================================================================

function EducationTab({ profile, onUpdate }: { profile: ProfessionalProfile; onUpdate: () => void }) {
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

interface EducationFormProps {
  onSave: (data: Omit<Education, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onCancel: () => void;
}

function EducationForm({ onSave, onCancel }: EducationFormProps) {
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
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
    <form onSubmit={handleSubmit} style={{ backgroundColor: 'white', border: '1px solid rgba(0, 0, 0, 0.08)', borderRadius: '8px', padding: '16px', marginBottom: '16px' }}>
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
        <div>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#1d1d1f', marginBottom: '6px' }}>
            Start Date
          </label>
          <input
            type="month"
            value={formData.startDate}
            onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
            style={{ width: '100%', padding: '10px 12px', border: '1px solid rgba(0, 0, 0, 0.12)', borderRadius: '6px', fontSize: '13px', fontFamily: 'inherit' }}
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#1d1d1f', marginBottom: '6px' }}>
            End Date
          </label>
          <input
            type="month"
            value={formData.endDate}
            onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
            disabled={formData.current}
            style={{ width: '100%', padding: '10px 12px', border: '1px solid rgba(0, 0, 0, 0.12)', borderRadius: '6px', fontSize: '13px', fontFamily: 'inherit', opacity: formData.current ? 0.5 : 1 }}
          />
        </div>
      </div>

      {/* Current */}
      <div style={{ marginBottom: '16px' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={formData.current}
            onChange={(e) => setFormData({ ...formData, current: e.target.checked, endDate: e.target.checked ? '' : formData.endDate })}
            style={{ cursor: 'pointer' }}
          />
          <span style={{ fontSize: '13px', fontWeight: '600', color: '#1d1d1f' }}>
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

function EducationCard({ education, onDelete }: { education: Education; onDelete: () => void }) {
  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const [year, month] = dateStr.split('-');
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${monthNames[parseInt(month) - 1]} ${year}`;
  };

  return (
    <div style={{ backgroundColor: 'white', border: '1px solid rgba(0, 0, 0, 0.08)', borderRadius: '8px', padding: '14px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <span style={{ fontSize: '16px' }}>🎓</span>
            <h3 style={{ fontSize: '15px', fontWeight: '600', color: '#1d1d1f', margin: 0 }}>
              {education.degree} in {education.field}
            </h3>
          </div>

          <div style={{ fontSize: '13px', color: '#6e6e73', marginBottom: '6px' }}>
            {education.institution} • {education.location}
          </div>

          <div style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '8px' }}>
            {formatDate(education.startDate)} - {education.current ? 'Present' : formatDate(education.endDate || '')}
            {education.gpa && ` • GPA: ${education.gpa}`}
          </div>

          {education.honors && education.honors.length > 0 && (
            <div style={{ marginTop: '8px' }}>
              <div style={{ fontSize: '12px', fontWeight: '600', color: '#1d1d1f', marginBottom: '4px' }}>Honors:</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                {education.honors.map((honor, i) => (
                  <div key={i} style={{ fontSize: '12px', color: '#059669' }}>
                    • {honor}
                  </div>
                ))}
              </div>
            </div>
          )}

          {education.relevantCoursework && education.relevantCoursework.length > 0 && (
            <div style={{ marginTop: '8px' }}>
              <div style={{ fontSize: '12px', fontWeight: '600', color: '#1d1d1f', marginBottom: '4px' }}>Relevant Coursework:</div>
              <div style={{ fontSize: '11px', color: '#9ca3af' }}>
                {education.relevantCoursework.join(', ')}
              </div>
            </div>
          )}
        </div>

        <button onClick={onDelete} style={{ padding: '6px', background: 'transparent', border: 'none', color: '#dc2626', cursor: 'pointer', borderRadius: '4px' }}>
          <Trash2 size={14} strokeWidth={2} />
        </button>
      </div>
    </div>
  );
}

// ============================================================================
// PROJECT FORMS & CARDS
// ============================================================================

interface ProjectFormProps {
  onSave: (data: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onCancel: () => void;
}

function ProjectForm({ onSave, onCancel }: ProjectFormProps) {
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
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
    <form onSubmit={handleSubmit} style={{ backgroundColor: 'white', border: '1px solid rgba(0, 0, 0, 0.08)', borderRadius: '8px', padding: '16px', marginBottom: '16px' }}>
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
        <div>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#1d1d1f', marginBottom: '6px' }}>
            Start Date
          </label>
          <input
            type="month"
            value={formData.startDate}
            onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
            style={{ width: '100%', padding: '10px 12px', border: '1px solid rgba(0, 0, 0, 0.12)', borderRadius: '6px', fontSize: '13px', fontFamily: 'inherit' }}
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#1d1d1f', marginBottom: '6px' }}>
            End Date
          </label>
          <input
            type="month"
            value={formData.endDate}
            onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
            style={{ width: '100%', padding: '10px 12px', border: '1px solid rgba(0, 0, 0, 0.12)', borderRadius: '6px', fontSize: '13px', fontFamily: 'inherit' }}
          />
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

function ProjectCard({ project, onDelete }: { project: Project; onDelete: () => void }) {
  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const [year, month] = dateStr.split('-');
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${monthNames[parseInt(month) - 1]} ${year}`;
  };

  return (
    <div style={{ backgroundColor: 'white', border: '1px solid rgba(0, 0, 0, 0.08)', borderRadius: '8px', padding: '14px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <span style={{ fontSize: '16px' }}>💻</span>
            <h3 style={{ fontSize: '15px', fontWeight: '600', color: '#1d1d1f', margin: 0 }}>
              {project.name}
            </h3>
          </div>

          <div style={{ fontSize: '13px', color: '#6e6e73', marginBottom: '8px', lineHeight: '1.4' }}>
            {project.description}
          </div>

          {project.startDate && (
            <div style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '8px' }}>
              {formatDate(project.startDate)} {project.endDate && `- ${formatDate(project.endDate)}`}
            </div>
          )}

          {project.technologies.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '8px' }}>
              {project.technologies.map((tech, i) => (
                <span key={i} style={{ padding: '3px 8px', backgroundColor: '#f0f9ff', color: '#0077B5', borderRadius: '4px', fontSize: '11px', fontWeight: '600' }}>
                  {tech}
                </span>
              ))}
            </div>
          )}

          {project.tags.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '8px' }}>
              {project.tags.map((tag, i) => (
                <span key={i} style={{ padding: '3px 8px', backgroundColor: '#fef3c7', color: '#f59e0b', borderRadius: '4px', fontSize: '11px', fontWeight: '600' }}>
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {(project.links.github || project.links.demo || project.links.website || project.links.youtube) && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '8px' }}>
              {project.links.github && (
                <a href={project.links.github} target="_blank" rel="noopener noreferrer" style={{ fontSize: '11px', color: '#0077B5', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span>GitHub →</span>
                </a>
              )}
              {project.links.demo && (
                <a href={project.links.demo} target="_blank" rel="noopener noreferrer" style={{ fontSize: '11px', color: '#0077B5', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span>Demo →</span>
                </a>
              )}
              {project.links.website && (
                <a href={project.links.website} target="_blank" rel="noopener noreferrer" style={{ fontSize: '11px', color: '#0077B5', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span>Website →</span>
                </a>
              )}
              {project.links.youtube && (
                <a href={project.links.youtube} target="_blank" rel="noopener noreferrer" style={{ fontSize: '11px', color: '#0077B5', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span>Video →</span>
                </a>
              )}
            </div>
          )}
        </div>

        <button onClick={onDelete} style={{ padding: '6px', background: 'transparent', border: 'none', color: '#dc2626', cursor: 'pointer', borderRadius: '4px' }}>
          <Trash2 size={14} strokeWidth={2} />
        </button>
      </div>
    </div>
  );
}

// ============================================================================
// GENERATE TAB (Placeholder)
// ============================================================================

function GenerateTab({ profile }: { profile: ProfessionalProfile; onUpdate?: () => void }) {
  const [step, setStep] = useState<'input' | 'analysis' | 'generated'>('input');
  const [jobTitle, setJobTitle] = useState('');
  const [company, setCompany] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');
  const [analysis, setAnalysis] = useState<any>(null);
  const [generatedResume, setGeneratedResume] = useState<any>(null);

  // Reset to start
  const handleReset = () => {
    setStep('input');
    setJobTitle('');
    setCompany('');
    setJobDescription('');
    setError('');
    setAnalysis(null);
    setGeneratedResume(null);
  };

  // Step 1: Analyze job description
  const handleAnalyzeJob = async () => {
    if (!jobTitle.trim() || !company.trim() || !jobDescription.trim()) {
      setError('Please fill in all fields');
      return;
    }

    setIsAnalyzing(true);
    setError('');

    try {
      // Dynamically import keyword extractor
      const { extractKeywordsFromJobDescription, categorizeJobRequirements } = await import('../../services/keyword-extractor');

      // Extract keywords and categorize requirements
      const extractedKeywords = extractKeywordsFromJobDescription(jobDescription);
      const { required, preferred } = categorizeJobRequirements(jobDescription);

      // Create analysis object
      const jobAnalysis = {
        id: `job_${Date.now()}`,
        rawText: jobDescription,
        jobTitle,
        company,
        extractedKeywords,
        requiredSkills: required,
        preferredSkills: preferred,
        analyzedAt: new Date().toISOString(),
      };

      setAnalysis(jobAnalysis);
      setStep('analysis');
    } catch (err) {
      console.error('[Uproot] Error analyzing job:', err);
      setError('Failed to analyze job description. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Step 2: Generate resume from analysis
  const handleGenerateResume = async () => {
    if (!analysis) return;

    setIsGenerating(true);
    setError('');

    try {
      // Dynamically import resume generator
      const { generateResumeWithAI } = await import('../../services/ai-resume-generator');

      // Generate optimized resume
      const resume = await generateResumeWithAI(analysis, profile);

      setGeneratedResume(resume);
      setStep('generated');
    } catch (err) {
      console.error('[Uproot] Error generating resume:', err);
      setError('Failed to generate resume. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Copy resume to clipboard
  const handleCopyToClipboard = () => {
    if (!generatedResume) return;

    const resumeText = formatResumeForClipboard(generatedResume);
    navigator.clipboard.writeText(resumeText).then(() => {
      alert('Resume copied to clipboard!');
    });
  };

  // Format resume content as plain text
  const formatResumeForClipboard = (resume: any): string => {
    const { content } = resume;
    let text = '';

    // Professional Summary
    if (content.professionalSummary) {
      text += `${content.professionalSummary}\n\n`;
    }

    // Technical Skills
    if (content.technicalSkills && content.technicalSkills.length > 0) {
      text += 'TECHNICAL SKILLS\n';
      text += content.technicalSkills.join(' • ') + '\n\n';
    }

    // Experience
    if (content.experience && content.experience.length > 0) {
      text += 'EXPERIENCE\n\n';
      content.experience.forEach((exp: any) => {
        text += `${exp.title} | ${exp.company}\n`;
        text += `${exp.startDate} - ${exp.endDate || 'Present'}${exp.location ? ` | ${exp.location}` : ''}\n`;
        if (exp.bullets && exp.bullets.length > 0) {
          exp.bullets.forEach((bullet: any) => {
            text += `• ${bullet.text}\n`;
          });
        }
        text += '\n';
      });
    }

    // Education
    if (content.education && content.education.length > 0) {
      text += 'EDUCATION\n\n';
      content.education.forEach((edu: any) => {
        text += `${edu.degree} in ${edu.field}\n`;
        text += `${edu.institution}${edu.location ? ` | ${edu.location}` : ''}\n`;
        text += `${edu.startDate} - ${edu.endDate || 'Present'}${edu.gpa ? ` | GPA: ${edu.gpa}` : ''}\n\n`;
      });
    }

    // Projects
    if (content.projects && content.projects.length > 0) {
      text += 'PROJECTS\n\n';
      content.projects.forEach((proj: any) => {
        text += `${proj.name}\n`;
        if (proj.description) {
          text += `${proj.description}\n`;
        }
        if (proj.technologies && proj.technologies.length > 0) {
          text += `Technologies: ${proj.technologies.join(', ')}\n`;
        }
        text += '\n';
      });
    }

    return text;
  };

  // Get ATS score styling
  const getATSScoreStyle = (score: number) => {
    if (score >= 80) return { color: '#34C759', label: 'Excellent' };
    if (score >= 65) return { color: '#0077B5', label: 'Good' };
    if (score >= 50) return { color: '#FF9500', label: 'Needs Work' };
    return { color: '#FF3B30', label: 'Poor' };
  };

  // STEP 1: Input job description
  if (step === 'input') {
    return (
      <>
        <style>
          {`
            @keyframes spin {
              from { transform: rotate(0deg); }
              to { transform: rotate(360deg); }
            }
          `}
        </style>
        <div style={{ padding: '20px' }}>
          <div style={{ marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <Sparkles size={20} strokeWidth={2} style={{ color: '#0077B5' }} />
              <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#1d1d1f', margin: 0 }}>
                Generate ATS-Optimized Resume
              </h3>
            </div>
            <p style={{ fontSize: '13px', color: '#6e6e73', margin: 0 }}>
              Paste a job description to generate a tailored resume with ATS optimization
            </p>
          </div>

          {error && (
            <div style={{
              padding: '12px',
              backgroundColor: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: '8px',
              marginBottom: '16px',
            }}>
              <p style={{ fontSize: '13px', color: '#dc2626', margin: 0 }}>{error}</p>
            </div>
          )}

          {/* Job Title */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#1d1d1f', marginBottom: '6px' }}>
              Job Title *
            </label>
            <input
              type="text"
              value={jobTitle}
              onChange={(e) => setJobTitle(e.target.value)}
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
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#1d1d1f', marginBottom: '6px' }}>
              Company *
            </label>
            <input
              type="text"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
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

          {/* Job Description */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#1d1d1f', marginBottom: '6px' }}>
              Job Description *
            </label>
            <textarea
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              placeholder="Paste the full job description here..."
              rows={12}
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid rgba(0, 0, 0, 0.12)',
                borderRadius: '6px',
                fontSize: '13px',
                fontFamily: 'inherit',
                resize: 'vertical',
                lineHeight: '1.5',
              }}
            />
            <p style={{ fontSize: '12px', color: '#6e6e73', margin: '6px 0 0 0' }}>
              {jobDescription.length} characters
            </p>
          </div>

          {/* Analyze Button */}
          <button
            onClick={handleAnalyzeJob}
            disabled={isAnalyzing}
            style={{
              width: '100%',
              padding: '14px 16px',
              background: isAnalyzing ? '#d1d5db' : '#0077B5',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: isAnalyzing ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              transition: 'background 0.2s',
            }}
            onMouseEnter={(e) => {
              if (!isAnalyzing) e.currentTarget.style.background = '#006399';
            }}
            onMouseLeave={(e) => {
              if (!isAnalyzing) e.currentTarget.style.background = '#0077B5';
            }}
          >
            {isAnalyzing ? (
              <>
                <RefreshCw size={18} strokeWidth={2} style={{ animation: 'spin 1s linear infinite' }} />
                <span>Analyzing...</span>
              </>
            ) : (
              <>
                <TrendingUp size={18} strokeWidth={2} />
                <span>Analyze Job Description</span>
              </>
            )}
          </button>
        </div>
      </>
    );
  }

  // STEP 2: Show analysis results
  if (step === 'analysis' && analysis) {
    const topKeywords = analysis.extractedKeywords
      .filter((k: any) => k.importance > 0.3)
      .slice(0, 15);

    return (
      <>
        <style>
          {`
            @keyframes spin {
              from { transform: rotate(0deg); }
              to { transform: rotate(360deg); }
            }
          `}
        </style>
        <div style={{ padding: '20px' }}>
          {/* Header */}
          <div style={{ marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckCircle2 size={20} strokeWidth={2} style={{ color: '#34C759' }} />
                <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#1d1d1f', margin: 0 }}>
                  Analysis Complete
                </h3>
              </div>
              <button
                onClick={handleReset}
                style={{
                  padding: '6px 12px',
                  background: 'white',
                  color: '#6e6e73',
                  border: '1px solid rgba(0, 0, 0, 0.12)',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: '600',
                  cursor: 'pointer',
                }}
              >
                Start Over
              </button>
            </div>
            <p style={{ fontSize: '13px', color: '#6e6e73', margin: 0 }}>
              {analysis.jobTitle} at {analysis.company}
            </p>
          </div>

          {error && (
            <div style={{
              padding: '12px',
              backgroundColor: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: '8px',
              marginBottom: '16px',
            }}>
              <p style={{ fontSize: '13px', color: '#dc2626', margin: 0 }}>{error}</p>
            </div>
          )}

          {/* Top Keywords */}
          <div style={{ marginBottom: '20px' }}>
            <h4 style={{ fontSize: '14px', fontWeight: '600', color: '#1d1d1f', margin: '0 0 10px 0' }}>
              Top Keywords Extracted ({analysis.extractedKeywords.length} total)
            </h4>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {topKeywords.map((keyword: any, index: number) => (
                <span
                  key={index}
                  style={{
                    padding: '6px 10px',
                    backgroundColor: keyword.category === 'technical-skill' ? 'rgba(0, 119, 181, 0.1)' :
                                   keyword.category === 'soft-skill' ? 'rgba(52, 199, 89, 0.1)' :
                                   'rgba(0, 0, 0, 0.05)',
                    color: keyword.category === 'technical-skill' ? '#0077B5' :
                           keyword.category === 'soft-skill' ? '#34C759' :
                           '#1d1d1f',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: '500',
                  }}
                >
                  {keyword.keyword}
                </span>
              ))}
            </div>
          </div>

          {/* Required Skills */}
          {analysis.requiredSkills.length > 0 && (
            <div style={{ marginBottom: '20px' }}>
              <h4 style={{ fontSize: '14px', fontWeight: '600', color: '#1d1d1f', margin: '0 0 10px 0' }}>
                Required Skills ({analysis.requiredSkills.length})
              </h4>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {analysis.requiredSkills.map((skill: string, index: number) => (
                  <span
                    key={index}
                    style={{
                      padding: '6px 10px',
                      backgroundColor: '#fef2f2',
                      color: '#dc2626',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: '500',
                      border: '1px solid #fecaca',
                    }}
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Preferred Skills */}
          {analysis.preferredSkills.length > 0 && (
            <div style={{ marginBottom: '20px' }}>
              <h4 style={{ fontSize: '14px', fontWeight: '600', color: '#1d1d1f', margin: '0 0 10px 0' }}>
                Preferred Skills ({analysis.preferredSkills.length})
              </h4>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {analysis.preferredSkills.map((skill: string, index: number) => (
                  <span
                    key={index}
                    style={{
                      padding: '6px 10px',
                      backgroundColor: 'rgba(0, 119, 181, 0.05)',
                      color: '#0077B5',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: '500',
                      border: '1px solid rgba(0, 119, 181, 0.2)',
                    }}
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Generate Resume Button */}
          <button
            onClick={handleGenerateResume}
            disabled={isGenerating}
            style={{
              width: '100%',
              padding: '14px 16px',
              background: isGenerating ? '#d1d5db' : '#0077B5',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: isGenerating ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              transition: 'background 0.2s',
            }}
            onMouseEnter={(e) => {
              if (!isGenerating) e.currentTarget.style.background = '#006399';
            }}
            onMouseLeave={(e) => {
              if (!isGenerating) e.currentTarget.style.background = '#0077B5';
            }}
          >
            {isGenerating ? (
              <>
                <RefreshCw size={18} strokeWidth={2} style={{ animation: 'spin 1s linear infinite' }} />
                <span>Generating Resume...</span>
              </>
            ) : (
              <>
                <Sparkles size={18} strokeWidth={2} />
                <span>Generate Optimized Resume</span>
              </>
            )}
          </button>
        </div>
      </>
    );
  }

  // STEP 3: Show generated resume
  if (step === 'generated' && generatedResume) {
    const atsScore = generatedResume.atsOptimization.overallATSScore;
    const scoreStyle = getATSScoreStyle(atsScore);

    return (
      <div style={{ padding: '20px' }}>
        {/* Header */}
        <div style={{ marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Sparkles size={20} strokeWidth={2} style={{ color: '#0077B5' }} />
              <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#1d1d1f', margin: 0 }}>
                Resume Generated
              </h3>
            </div>
            <button
              onClick={handleReset}
              style={{
                padding: '6px 12px',
                background: 'white',
                color: '#6e6e73',
                border: '1px solid rgba(0, 0, 0, 0.12)',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: '600',
                cursor: 'pointer',
              }}
            >
              New Resume
            </button>
          </div>
          <p style={{ fontSize: '13px', color: '#6e6e73', margin: 0 }}>
            {generatedResume.jobTitle} at {generatedResume.company}
          </p>
        </div>

        {/* ATS Score */}
        <div style={{
          padding: '16px',
          backgroundColor: 'white',
          border: `2px solid ${scoreStyle.color}`,
          borderRadius: '12px',
          marginBottom: '20px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <div>
              <h4 style={{ fontSize: '14px', fontWeight: '600', color: '#1d1d1f', margin: '0 0 4px 0' }}>
                ATS Compatibility Score
              </h4>
              <p style={{ fontSize: '12px', color: '#6e6e73', margin: 0 }}>
                {generatedResume.atsOptimization.keywordsUsed.length} of {generatedResume.atsOptimization.totalKeywords} keywords matched
              </p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '32px', fontWeight: '700', color: scoreStyle.color }}>
                {atsScore}
              </div>
              <div style={{ fontSize: '12px', fontWeight: '600', color: scoreStyle.color }}>
                {scoreStyle.label}
              </div>
            </div>
          </div>

          {/* Score Breakdown */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', paddingTop: '12px', borderTop: '1px solid rgba(0, 0, 0, 0.08)' }}>
            <div>
              <div style={{ fontSize: '11px', color: '#6e6e73', marginBottom: '2px' }}>Match Rate</div>
              <div style={{ fontSize: '14px', fontWeight: '600', color: '#1d1d1f' }}>
                {Math.round(generatedResume.atsOptimization.keywordMatchRate)}%
              </div>
            </div>
            <div>
              <div style={{ fontSize: '11px', color: '#6e6e73', marginBottom: '2px' }}>Format</div>
              <div style={{ fontSize: '14px', fontWeight: '600', color: '#1d1d1f' }}>
                {generatedResume.atsOptimization.formatCompliance.score}%
              </div>
            </div>
            <div>
              <div style={{ fontSize: '11px', color: '#6e6e73', marginBottom: '2px' }}>Quality</div>
              <div style={{ fontSize: '14px', fontWeight: '600', color: '#1d1d1f' }}>
                {generatedResume.atsOptimization.contentQuality.score}%
              </div>
            </div>
          </div>
        </div>

        {/* Recommendations */}
        {generatedResume.atsOptimization.recommendations.length > 0 && (
          <div style={{ marginBottom: '20px' }}>
            <h4 style={{ fontSize: '14px', fontWeight: '600', color: '#1d1d1f', margin: '0 0 10px 0' }}>
              Optimization Tips
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {generatedResume.atsOptimization.recommendations.slice(0, 5).map((rec: string, index: number) => (
                <div
                  key={index}
                  style={{
                    padding: '10px 12px',
                    backgroundColor: rec.startsWith('✅') ? 'rgba(52, 199, 89, 0.05)' :
                                   rec.startsWith('❌') ? 'rgba(220, 38, 38, 0.05)' :
                                   'rgba(255, 149, 0, 0.05)',
                    borderLeft: `3px solid ${rec.startsWith('✅') ? '#34C759' :
                                             rec.startsWith('❌') ? '#dc2626' :
                                             '#FF9500'}`,
                    borderRadius: '6px',
                    fontSize: '12px',
                    color: '#1d1d1f',
                    lineHeight: '1.5',
                  }}
                >
                  {rec}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Resume Preview */}
        <div style={{ marginBottom: '20px' }}>
          <h4 style={{ fontSize: '14px', fontWeight: '600', color: '#1d1d1f', margin: '0 0 10px 0' }}>
            Resume Content
          </h4>

          {/* Professional Summary */}
          {generatedResume.professionalSummary && (
            <div style={{ marginBottom: '16px' }}>
              <h5 style={{ fontSize: '13px', fontWeight: '600', color: '#0077B5', margin: '0 0 6px 0', textTransform: 'uppercase' }}>
                Professional Summary
              </h5>
              <p style={{ fontSize: '13px', color: '#1d1d1f', margin: 0, lineHeight: '1.6' }}>
                {generatedResume.professionalSummary}
              </p>
            </div>
          )}

          {/* Selected Experiences */}
          {generatedResume.selectedExperiences && generatedResume.selectedExperiences.length > 0 && (
            <div style={{ marginBottom: '16px' }}>
              <h5 style={{ fontSize: '13px', fontWeight: '600', color: '#0077B5', margin: '0 0 10px 0', textTransform: 'uppercase' }}>
                Experience ({generatedResume.selectedExperiences.length})
              </h5>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {generatedResume.selectedExperiences.slice(0, 3).map((exp: any, index: number) => (
                  <div key={index} style={{ paddingLeft: '12px', borderLeft: '2px solid rgba(0, 119, 181, 0.2)' }}>
                    <div style={{ fontSize: '13px', fontWeight: '600', color: '#1d1d1f' }}>
                      {exp.title} • {exp.company}
                    </div>
                    <div style={{ fontSize: '11px', color: '#6e6e73', marginBottom: '6px' }}>
                      {exp.selectedBullets.length} bullet{exp.selectedBullets.length !== 1 ? 's' : ''} selected • {Math.round(exp.relevanceScore * 100)}% match
                    </div>
                  </div>
                ))}
                {generatedResume.selectedExperiences.length > 3 && (
                  <p style={{ fontSize: '12px', color: '#6e6e73', margin: 0 }}>
                    +{generatedResume.selectedExperiences.length - 3} more
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Selected Skills */}
          {generatedResume.selectedSkills && generatedResume.selectedSkills.length > 0 && (
            <div style={{ marginBottom: '16px' }}>
              <h5 style={{ fontSize: '13px', fontWeight: '600', color: '#0077B5', margin: '0 0 8px 0', textTransform: 'uppercase' }}>
                Skills ({generatedResume.selectedSkills.length})
              </h5>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {generatedResume.selectedSkills.slice(0, 12).map((skill: string, index: number) => (
                  <span
                    key={index}
                    style={{
                      padding: '4px 8px',
                      backgroundColor: 'rgba(0, 119, 181, 0.1)',
                      color: '#0077B5',
                      borderRadius: '4px',
                      fontSize: '11px',
                      fontWeight: '500',
                    }}
                  >
                    {skill}
                  </span>
                ))}
                {generatedResume.selectedSkills.length > 12 && (
                  <span style={{ fontSize: '11px', color: '#6e6e73', alignSelf: 'center' }}>
                    +{generatedResume.selectedSkills.length - 12} more
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Copy to Clipboard Button */}
        <button
          onClick={handleCopyToClipboard}
          style={{
            width: '100%',
            padding: '14px 16px',
            background: '#34C759',
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
            transition: 'background 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#2fb350';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = '#34C759';
          }}
        >
          <FileText size={18} strokeWidth={2} />
          <span>Copy Resume to Clipboard</span>
        </button>
      </div>
    );
  }

  return null;
}
