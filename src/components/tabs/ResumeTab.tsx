/**
 * Professional Profile Builder Tab
 * Optional: Build comprehensive career profile for AI-powered resume generation
 * Note: This tab is only needed for resume generation features. Connection pathfinding works without it.
 */

import { useState, useEffect } from 'react';
import {
  Briefcase,
  GraduationCap,
  Code,
  Sparkles,
  RefreshCw,
} from 'lucide-react';
import type { ProfessionalProfile } from '../../types/resume';
import { getProfessionalProfile } from '../../utils/storage';
import { SubTabButton } from './ResumeTab/shared/SubTabButton';
import { ExperienceTab } from './ResumeTab/experience/ExperienceTab';
import { SkillsTab } from './ResumeTab/skills/SkillsTab';
import { EducationTab } from './ResumeTab/education/EducationTab';
import { GenerateTab } from './ResumeTab/generate/GenerateTab';

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
