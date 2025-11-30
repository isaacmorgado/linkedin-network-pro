/**
 * Professional Profile Builder Tab
 * Comprehensive career database for AI-powered resume generation
 */

import React, { useState, useEffect } from 'react';
import {
  Briefcase,
  GraduationCap,
  Award,
  Code,
  Plus,
  Sparkles,
} from 'lucide-react';
import type {
  ProfessionalProfile,
} from '../../types/resume';
import {
  getProfessionalProfile,
  saveProfessionalProfile,
  getProfileStats,
} from '../../utils/storage';
import type { ProfileStats } from '../../types/resume';

interface ProfileBuilderTabProps {
  panelWidth?: number;
}

type Section = 'overview' | 'experience' | 'skills' | 'education' | 'projects';

export function ProfileBuilderTab({ panelWidth = 400 }: ProfileBuilderTabProps) {
  const [profile, setProfile] = useState<ProfessionalProfile | null>(null);
  const [stats, setStats] = useState<ProfileStats | null>(null);
  const [activeSection, setActiveSection] = useState<Section>('overview');
  const [isLoading, setIsLoading] = useState(true);

  // Load profile
  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    setIsLoading(true);
    try {
      const [profileData, statsData] = await Promise.all([
        getProfessionalProfile(),
        getProfileStats(),
      ]);
      setProfile(profileData);
      setStats(statsData);
    } catch (error) {
      console.error('[Uproot] Error loading profile:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveProfile = async (updatedProfile: ProfessionalProfile) => {
    try {
      await saveProfessionalProfile(updatedProfile);
      setProfile(updatedProfile);
      // Reload stats
      const statsData = await getProfileStats();
      setStats(statsData);
    } catch (error) {
      console.error('[Uproot] Error saving profile:', error);
    }
  };

  const isCompact = panelWidth < 400;

  if (isLoading) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          flexDirection: 'column',
          gap: '12px',
          color: '#6e6e73',
        }}
      >
        <Sparkles size={32} className="animate-pulse" strokeWidth={2} />
        <span style={{ fontSize: '14px', fontWeight: '500' }}>Loading profile...</span>
      </div>
    );
  }

  if (!profile) {
    return <EmptyProfileState onCreateProfile={loadProfile} />;
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        overflow: 'hidden',
        backgroundColor: '#FFFFFF',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: isCompact ? '16px' : '20px',
          borderBottom: '1px solid rgba(0, 0, 0, 0.08)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
          <Sparkles size={20} color="#0077B5" />
          <h2
            style={{
              fontSize: isCompact ? '18px' : '20px',
              fontWeight: '700',
              margin: 0,
              color: '#1d1d1f',
            }}
          >
            Professional Profile
          </h2>
        </div>

        {/* Profile Completeness */}
        {stats && (
          <div style={{ marginBottom: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
              <span style={{ fontSize: '12px', color: '#6e6e73' }}>Profile Completeness</span>
              <span style={{ fontSize: '12px', fontWeight: '600', color: '#0077B5' }}>
                {stats.profileCompleteness}%
              </span>
            </div>
            <div
              style={{
                height: '6px',
                backgroundColor: 'rgba(0, 0, 0, 0.05)',
                borderRadius: '3px',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  height: '100%',
                  width: `${stats.profileCompleteness}%`,
                  backgroundColor: '#0077B5',
                  transition: 'width 300ms ease',
                }}
              />
            </div>
          </div>
        )}

        {/* Quick Stats */}
        {stats && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: '8px',
            }}
          >
            <StatBadge icon={<Briefcase size={12} />} value={stats.totalJobs} label="Jobs" />
            <StatBadge icon={<GraduationCap size={12} />} value={stats.totalProjects} label="Projects" />
            <StatBadge icon={<Code size={12} />} value={stats.totalSkills} label="Skills" />
            <StatBadge icon={<Award size={12} />} value={stats.totalCertifications} label="Certs" />
          </div>
        )}
      </div>

      {/* Section Navigation */}
      <div
        style={{
          display: 'flex',
          borderBottom: '1px solid rgba(0, 0, 0, 0.08)',
          backgroundColor: '#FAFAFA',
          overflowX: 'auto',
        }}
      >
        <SectionTab
          label="Overview"
          isActive={activeSection === 'overview'}
          onClick={() => setActiveSection('overview')}
        />
        <SectionTab
          label="Experience"
          isActive={activeSection === 'experience'}
          onClick={() => setActiveSection('experience')}
          count={stats?.totalJobs}
        />
        <SectionTab
          label="Skills"
          isActive={activeSection === 'skills'}
          onClick={() => setActiveSection('skills')}
          count={stats?.totalSkills}
        />
        <SectionTab
          label="Education"
          isActive={activeSection === 'education'}
          onClick={() => setActiveSection('education')}
          count={profile.education.length}
        />
        <SectionTab
          label="Projects"
          isActive={activeSection === 'projects'}
          onClick={() => setActiveSection('projects')}
          count={stats?.totalProjects}
        />
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', backgroundColor: '#FAFAFA' }}>
        {activeSection === 'overview' && (
          <OverviewSection profile={profile} onUpdate={saveProfile} panelWidth={panelWidth} />
        )}
        {activeSection === 'experience' && (
          <ExperienceSection profile={profile} onUpdate={saveProfile} panelWidth={panelWidth} />
        )}
        {activeSection === 'skills' && (
          <SkillsSection profile={profile} onUpdate={saveProfile} panelWidth={panelWidth} />
        )}
        {activeSection === 'education' && (
          <EducationSection profile={profile} onUpdate={saveProfile} panelWidth={panelWidth} />
        )}
        {activeSection === 'projects' && (
          <ProjectsSection profile={profile} onUpdate={saveProfile} panelWidth={panelWidth} />
        )}
      </div>
    </div>
  );
}

// ============================================================================
// UTILITY COMPONENTS
// ============================================================================

function StatBadge({
  icon,
  value,
  label,
}: {
  icon: React.ReactNode;
  value: number;
  label: string;
}) {
  return (
    <div
      style={{
        padding: '6px 8px',
        backgroundColor: 'rgba(0, 0, 0, 0.02)',
        borderRadius: '6px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '2px',
      }}
    >
      <div style={{ color: '#0077B5' }}>{icon}</div>
      <div style={{ fontSize: '14px', fontWeight: '700', color: '#1d1d1f' }}>{value}</div>
      <div style={{ fontSize: '9px', color: '#6e6e73', textTransform: 'uppercase' }}>{label}</div>
    </div>
  );
}

function SectionTab({
  label,
  isActive,
  onClick,
  count,
}: {
  label: string;
  isActive: boolean;
  onClick: () => void;
  count?: number;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        flex: 1,
        padding: '10px 12px',
        backgroundColor: isActive ? '#FFFFFF' : 'transparent',
        borderBottom: isActive ? '2px solid #0077B5' : '2px solid transparent',
        border: 'none',
        borderRadius: 0,
        cursor: 'pointer',
        fontSize: '12px',
        fontWeight: isActive ? '600' : '500',
        color: isActive ? '#0077B5' : '#6e6e73',
        transition: 'all 150ms',
        whiteSpace: 'nowrap',
      }}
    >
      {label}
      {count !== undefined && count > 0 && (
        <span
          style={{
            marginLeft: '4px',
            padding: '1px 5px',
            backgroundColor: isActive ? 'rgba(0, 119, 181, 0.1)' : 'rgba(0, 0, 0, 0.05)',
            borderRadius: '8px',
            fontSize: '10px',
            fontWeight: '600',
          }}
        >
          {count}
        </span>
      )}
    </button>
  );
}

function EmptyProfileState({ onCreateProfile }: { onCreateProfile: () => void }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        padding: '40px',
        textAlign: 'center',
      }}
    >
      <Sparkles size={64} color="#0077B5" strokeWidth={1.5} />
      <h2
        style={{
          fontSize: '24px',
          fontWeight: '700',
          margin: '24px 0 12px 0',
          color: '#1d1d1f',
        }}
      >
        Build Your Professional Profile
      </h2>
      <p
        style={{
          fontSize: '14px',
          color: '#6e6e73',
          margin: '0 0 32px 0',
          maxWidth: '400px',
        }}
      >
        Create a comprehensive career database. AI will use this to generate perfectly tailored,
        ATS-optimized resumes for every job you apply to.
      </p>
      <button
        onClick={onCreateProfile}
        style={{
          padding: '14px 32px',
          backgroundColor: '#0077B5',
          color: 'white',
          border: 'none',
          borderRadius: '12px',
          fontSize: '14px',
          fontWeight: '600',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          transition: 'all 150ms',
        }}
      >
        <Plus size={16} />
        Create Profile
      </button>
    </div>
  );
}

// ============================================================================
// SECTION COMPONENTS (Placeholders - will implement next)
// ============================================================================

function OverviewSection({
  profile: _profile,
  onUpdate: _onUpdate,
  panelWidth: _panelWidth,
}: {
  profile: ProfessionalProfile;
  onUpdate: (profile: ProfessionalProfile) => void;
  panelWidth: number;
}) {
  return (
    <div style={{ padding: '16px' }}>
      <p style={{ color: '#6e6e73', fontSize: '13px' }}>Overview section coming next...</p>
    </div>
  );
}

function ExperienceSection({
  profile: _profile,
  onUpdate: _onUpdate,
  panelWidth: _panelWidth,
}: {
  profile: ProfessionalProfile;
  onUpdate: (profile: ProfessionalProfile) => void;
  panelWidth: number;
}) {
  return (
    <div style={{ padding: '16px' }}>
      <p style={{ color: '#6e6e73', fontSize: '13px' }}>Experience section coming next...</p>
    </div>
  );
}

function SkillsSection({
  profile: _profile,
  onUpdate: _onUpdate,
  panelWidth: _panelWidth,
}: {
  profile: ProfessionalProfile;
  onUpdate: (profile: ProfessionalProfile) => void;
  panelWidth: number;
}) {
  return (
    <div style={{ padding: '16px' }}>
      <p style={{ color: '#6e6e73', fontSize: '13px' }}>Skills section coming next...</p>
    </div>
  );
}

function EducationSection({
  profile: _profile,
  onUpdate: _onUpdate,
  panelWidth: _panelWidth,
}: {
  profile: ProfessionalProfile;
  onUpdate: (profile: ProfessionalProfile) => void;
  panelWidth: number;
}) {
  return (
    <div style={{ padding: '16px' }}>
      <p style={{ color: '#6e6e73', fontSize: '13px' }}>Education section coming next...</p>
    </div>
  );
}

function ProjectsSection({
  profile: _profile,
  onUpdate: _onUpdate,
  panelWidth: _panelWidth,
}: {
  profile: ProfessionalProfile;
  onUpdate: (profile: ProfessionalProfile) => void;
  panelWidth: number;
}) {
  return (
    <div style={{ padding: '16px' }}>
      <p style={{ color: '#6e6e73', fontSize: '13px' }}>Projects section coming next...</p>
    </div>
  );
}
