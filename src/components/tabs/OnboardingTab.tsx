/**
 * Onboarding Tab
 * First-run setup and job preferences
 */

import { useState } from 'react';
import { Rocket, ArrowRight, Check, Briefcase, MapPin } from 'lucide-react';
import { completeOnboarding } from '../../utils/storage';
import type { JobPreferences, ExperienceLevel, WorkLocationType } from '../../types/onboarding';

interface OnboardingTabProps {
  panelWidth?: number;
}

export function OnboardingTab({ panelWidth: _panelWidth = 400 }: OnboardingTabProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [preferences, setPreferences] = useState<JobPreferences>({
    jobTitles: [],
    experienceLevel: [],
    workLocation: [],
    locations: [],
    industries: [],
  });

  // Form state for current inputs
  const [jobTitleInput, setJobTitleInput] = useState('');
  const [locationInput, setLocationInput] = useState('');
  const [industryInput, setIndustryInput] = useState('');

  const handleNext = () => {
    setCurrentStep((prev) => Math.min(prev + 1, 2));
  };

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  };

  const handleComplete = async () => {
    try {
      await completeOnboarding(preferences);
      console.log('[Uproot] Onboarding completed!');
      // Refresh the page to hide onboarding tab
      window.location.reload();
    } catch (error) {
      console.error('[Uproot] Failed to complete onboarding:', error);
    }
  };

  const addJobTitle = () => {
    if (jobTitleInput.trim() && !preferences.jobTitles.includes(jobTitleInput.trim())) {
      setPreferences({
        ...preferences,
        jobTitles: [...preferences.jobTitles, jobTitleInput.trim()],
      });
      setJobTitleInput('');
    }
  };

  const removeJobTitle = (title: string) => {
    setPreferences({
      ...preferences,
      jobTitles: preferences.jobTitles.filter((t) => t !== title),
    });
  };

  const toggleExperienceLevel = (level: ExperienceLevel) => {
    const updated = preferences.experienceLevel.includes(level)
      ? preferences.experienceLevel.filter((l) => l !== level)
      : [...preferences.experienceLevel, level];
    setPreferences({ ...preferences, experienceLevel: updated });
  };

  const toggleWorkLocation = (location: WorkLocationType) => {
    const updated = preferences.workLocation.includes(location)
      ? preferences.workLocation.filter((l) => l !== location)
      : [...preferences.workLocation, location];
    setPreferences({ ...preferences, workLocation: updated });
  };

  const addLocation = () => {
    if (locationInput.trim() && !preferences.locations.includes(locationInput.trim())) {
      setPreferences({
        ...preferences,
        locations: [...preferences.locations, locationInput.trim()],
      });
      setLocationInput('');
    }
  };

  const removeLocation = (loc: string) => {
    setPreferences({
      ...preferences,
      locations: preferences.locations.filter((l) => l !== loc),
    });
  };

  const addIndustry = () => {
    if (industryInput.trim() && !preferences.industries.includes(industryInput.trim())) {
      setPreferences({
        ...preferences,
        industries: [...preferences.industries, industryInput.trim()],
      });
      setIndustryInput('');
    }
  };

  const removeIndustry = (ind: string) => {
    setPreferences({
      ...preferences,
      industries: preferences.industries.filter((i) => i !== ind),
    });
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        overflow: 'auto',
      }}
    >
      {/* Progress Bar */}
      <div
        style={{
          padding: '20px 20px 16px 20px',
          borderBottom: '1px solid rgba(0, 0, 0, 0.08)',
          backgroundColor: 'rgba(255, 149, 0, 0.03)',
        }}
      >
        <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
          {[0, 1, 2].map((step) => (
            <div
              key={step}
              style={{
                flex: 1,
                height: '4px',
                backgroundColor: currentStep >= step ? '#0077B5' : 'rgba(0, 0, 0, 0.1)',
                borderRadius: '2px',
                transition: 'all 300ms',
              }}
            />
          ))}
        </div>
        <p
          style={{
            fontSize: '13px',
            color: '#6e6e73',
            margin: 0,
            textAlign: 'center',
          }}
        >
          Step {currentStep + 1} of 3
        </p>
      </div>

      {/* Step Content */}
      <div
        style={{
          flex: 1,
          padding: '24px 20px',
          overflowY: 'auto',
        }}
      >
        {currentStep === 0 && <WelcomeStep />}
        {currentStep === 1 && (
          <JobPreferencesStep
            preferences={preferences}
            jobTitleInput={jobTitleInput}
            setJobTitleInput={setJobTitleInput}
            addJobTitle={addJobTitle}
            removeJobTitle={removeJobTitle}
            toggleExperienceLevel={toggleExperienceLevel}
            toggleWorkLocation={toggleWorkLocation}
          />
        )}
        {currentStep === 2 && (
          <LocationPreferencesStep
            preferences={preferences}
            locationInput={locationInput}
            setLocationInput={setLocationInput}
            addLocation={addLocation}
            removeLocation={removeLocation}
            industryInput={industryInput}
            setIndustryInput={setIndustryInput}
            addIndustry={addIndustry}
            removeIndustry={removeIndustry}
          />
        )}
      </div>

      {/* Navigation Buttons */}
      <div
        style={{
          padding: '16px 20px',
          borderTop: '1px solid rgba(0, 0, 0, 0.08)',
          display: 'flex',
          gap: '12px',
        }}
      >
        {currentStep > 0 && (
          <button
            onClick={handleBack}
            style={{
              flex: 1,
              padding: '12px 16px',
              backgroundColor: 'transparent',
              color: '#0077B5',
              border: '1px solid #0077B5',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 150ms',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(0, 119, 181, 0.05)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            Back
          </button>
        )}

        <button
          onClick={currentStep === 2 ? handleComplete : handleNext}
          style={{
            flex: 1,
            padding: '12px 16px',
            backgroundColor: '#0077B5',
            color: '#FFFFFF',
            border: 'none',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: '600',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            transition: 'all 150ms',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#006399';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#0077B5';
          }}
        >
          {currentStep === 2 ? (
            <>
              <Check size={16} />
              Complete Setup
            </>
          ) : (
            <>
              Next
              <ArrowRight size={16} />
            </>
          )}
        </button>
      </div>
    </div>
  );
}

// Welcome Step Component
function WelcomeStep() {
  return (
    <div style={{ textAlign: 'center', maxWidth: '400px', margin: '0 auto', padding: '20px 0' }}>
      <div
        style={{
          width: '80px',
          height: '80px',
          margin: '0 auto 24px',
          borderRadius: '20px',
          background: 'linear-gradient(135deg, #0077B5 0%, #00A0DC 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Rocket size={40} color="#FFFFFF" strokeWidth={2} />
      </div>

      <h1
        style={{
          fontSize: '24px',
          fontWeight: '700',
          margin: '0 0 12px 0',
          color: '#1d1d1f',
        }}
      >
        Welcome to Uproot!
      </h1>

      <p
        style={{
          fontSize: '15px',
          color: '#6e6e73',
          margin: '0 0 32px 0',
          lineHeight: '1.6',
        }}
      >
        Your AI-powered LinkedIn assistant for networking and job searching
      </p>

      <div style={{ textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <Feature
          icon="🎯"
          title="Smart Networking"
          description="Find the shortest path to connect with anyone on LinkedIn"
        />
        <Feature
          icon="👁️"
          title="Job Monitoring"
          description="Track companies and get notified of relevant job openings"
        />
        <Feature
          icon="📝"
          title="ATS-Beating Resume & Cover Letters"
          description="Auto-generate tailored resumes and cover letters for every job that bypass ATS systems"
        />
        <Feature
          icon="🤖"
          title="Smart Application Assistant"
          description="Highlight & save common questions, paste answers instantly, or let AI fill it out - sounds human, beats ATS"
        />
        <Feature
          icon="✉️"
          title="AI Connection Messages"
          description="Generate personalized connection messages with behavioral psychology that get responses"
        />
        <Feature
          icon="🧠"
          title="UX Psychology & Behavioral Tech"
          description="Animations and micro-interactions designed to keep you motivated and engaged throughout your job search"
        />
      </div>

      <p
        style={{
          fontSize: '13px',
          color: '#8e8e93',
          margin: '32px 0 0 0',
          lineHeight: '1.5',
        }}
      >
        Let's set up your job preferences so we can help you find the perfect opportunities
      </p>
    </div>
  );
}

interface FeatureProps {
  icon: string;
  title: string;
  description: string;
}

function Feature({ icon, title, description }: FeatureProps) {
  return (
    <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
      <span style={{ fontSize: '24px', flexShrink: 0 }}>{icon}</span>
      <div>
        <h3
          style={{
            fontSize: '15px',
            fontWeight: '600',
            margin: '0 0 4px 0',
            color: '#1d1d1f',
          }}
        >
          {title}
        </h3>
        <p
          style={{
            fontSize: '13px',
            color: '#6e6e73',
            margin: 0,
            lineHeight: '1.4',
          }}
        >
          {description}
        </p>
      </div>
    </div>
  );
}

// Job Preferences Step Component
interface JobPreferencesStepProps {
  preferences: JobPreferences;
  jobTitleInput: string;
  setJobTitleInput: (value: string) => void;
  addJobTitle: () => void;
  removeJobTitle: (title: string) => void;
  toggleExperienceLevel: (level: ExperienceLevel) => void;
  toggleWorkLocation: (location: WorkLocationType) => void;
}

function JobPreferencesStep({
  preferences,
  jobTitleInput,
  setJobTitleInput,
  addJobTitle,
  removeJobTitle,
  toggleExperienceLevel,
  toggleWorkLocation,
}: JobPreferencesStepProps) {
  const experienceLevels: { value: ExperienceLevel; label: string }[] = [
    { value: 'internship', label: 'Internship' },
    { value: 'entry', label: 'Entry Level' },
    { value: 'mid', label: 'Mid Level' },
    { value: 'senior', label: 'Senior' },
    { value: 'director', label: 'Director' },
    { value: 'executive', label: 'Executive' },
  ];

  const workLocations: { value: WorkLocationType; label: string; icon: string }[] = [
    { value: 'remote', label: 'Remote', icon: '🏠' },
    { value: 'hybrid', label: 'Hybrid', icon: '🔄' },
    { value: 'onsite', label: 'On-site', icon: '🏢' },
  ];

  return (
    <div style={{ maxWidth: '500px', margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <Briefcase size={32} color="#0077B5" strokeWidth={2} style={{ marginBottom: '12px' }} />
        <h2
          style={{
            fontSize: '20px',
            fontWeight: '700',
            margin: '0 0 8px 0',
            color: '#1d1d1f',
          }}
        >
          What type of roles are you looking for?
        </h2>
        <p style={{ fontSize: '14px', color: '#6e6e73', margin: 0 }}>
          This helps us find the most relevant opportunities
        </p>
      </div>

      {/* Job Titles */}
      <div style={{ marginBottom: '24px' }}>
        <label
          style={{
            fontSize: '13px',
            fontWeight: '600',
            color: '#1d1d1f',
            display: 'block',
            marginBottom: '8px',
          }}
        >
          Job Titles *
        </label>
        <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
          <input
            type="text"
            value={jobTitleInput}
            onChange={(e) => setJobTitleInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && addJobTitle()}
            placeholder="e.g., Marketing Manager"
            style={{
              flex: 1,
              padding: '10px 12px',
              border: '1px solid rgba(0, 0, 0, 0.12)',
              borderRadius: '6px',
              fontSize: '14px',
              outline: 'none',
            }}
          />
          <button
            onClick={addJobTitle}
            style={{
              padding: '10px 16px',
              backgroundColor: '#0077B5',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
            }}
          >
            Add
          </button>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          {preferences.jobTitles.map((title) => (
            <Pill key={title} text={title} onRemove={() => removeJobTitle(title)} />
          ))}
        </div>
      </div>

      {/* Experience Level */}
      <div style={{ marginBottom: '24px' }}>
        <label
          style={{
            fontSize: '13px',
            fontWeight: '600',
            color: '#1d1d1f',
            display: 'block',
            marginBottom: '8px',
          }}
        >
          Experience Level
        </label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          {experienceLevels.map((level) => (
            <ToggleChip
              key={level.value}
              label={level.label}
              isSelected={preferences.experienceLevel.includes(level.value)}
              onClick={() => toggleExperienceLevel(level.value)}
            />
          ))}
        </div>
      </div>

      {/* Work Location */}
      <div style={{ marginBottom: '24px' }}>
        <label
          style={{
            fontSize: '13px',
            fontWeight: '600',
            color: '#1d1d1f',
            display: 'block',
            marginBottom: '8px',
          }}
        >
          Work Location Preference
        </label>
        <div style={{ display: 'flex', gap: '8px' }}>
          {workLocations.map((loc) => (
            <ToggleChip
              key={loc.value}
              label={`${loc.icon} ${loc.label}`}
              isSelected={preferences.workLocation.includes(loc.value)}
              onClick={() => toggleWorkLocation(loc.value)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// Location Preferences Step Component
interface LocationPreferencesStepProps {
  preferences: JobPreferences;
  locationInput: string;
  setLocationInput: (value: string) => void;
  addLocation: () => void;
  removeLocation: (loc: string) => void;
  industryInput: string;
  setIndustryInput: (value: string) => void;
  addIndustry: () => void;
  removeIndustry: (ind: string) => void;
}

function LocationPreferencesStep({
  preferences,
  locationInput,
  setLocationInput,
  addLocation,
  removeLocation,
  industryInput,
  setIndustryInput,
  addIndustry,
  removeIndustry,
}: LocationPreferencesStepProps) {
  return (
    <div style={{ maxWidth: '500px', margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <MapPin size={32} color="#0077B5" strokeWidth={2} style={{ marginBottom: '12px' }} />
        <h2
          style={{
            fontSize: '20px',
            fontWeight: '700',
            margin: '0 0 8px 0',
            color: '#1d1d1f',
          }}
        >
          Where do you want to work?
        </h2>
        <p style={{ fontSize: '14px', color: '#6e6e73', margin: 0 }}>
          Add cities, regions, or "Remote" for remote positions
        </p>
      </div>

      {/* Locations */}
      <div style={{ marginBottom: '24px' }}>
        <label
          style={{
            fontSize: '13px',
            fontWeight: '600',
            color: '#1d1d1f',
            display: 'block',
            marginBottom: '8px',
          }}
        >
          Preferred Locations (Optional)
        </label>
        <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
          <input
            type="text"
            value={locationInput}
            onChange={(e) => setLocationInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && addLocation()}
            placeholder="e.g., New York, NY"
            style={{
              flex: 1,
              padding: '10px 12px',
              border: '1px solid rgba(0, 0, 0, 0.12)',
              borderRadius: '6px',
              fontSize: '14px',
              outline: 'none',
            }}
          />
          <button
            onClick={addLocation}
            style={{
              padding: '10px 16px',
              backgroundColor: '#0077B5',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
            }}
          >
            Add
          </button>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          {preferences.locations.map((loc) => (
            <Pill key={loc} text={loc} onRemove={() => removeLocation(loc)} />
          ))}
        </div>
      </div>

      {/* Industries */}
      <div style={{ marginBottom: '24px' }}>
        <label
          style={{
            fontSize: '13px',
            fontWeight: '600',
            color: '#1d1d1f',
            display: 'block',
            marginBottom: '8px',
          }}
        >
          Industries of Interest (Optional)
        </label>
        <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
          <input
            type="text"
            value={industryInput}
            onChange={(e) => setIndustryInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && addIndustry()}
            placeholder="e.g., Technology, Healthcare"
            style={{
              flex: 1,
              padding: '10px 12px',
              border: '1px solid rgba(0, 0, 0, 0.12)',
              borderRadius: '6px',
              fontSize: '14px',
              outline: 'none',
            }}
          />
          <button
            onClick={addIndustry}
            style={{
              padding: '10px 16px',
              backgroundColor: '#0077B5',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
            }}
          >
            Add
          </button>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          {preferences.industries.map((ind) => (
            <Pill key={ind} text={ind} onRemove={() => removeIndustry(ind)} />
          ))}
        </div>
      </div>

      <div
        style={{
          padding: '16px',
          backgroundColor: 'rgba(48, 209, 88, 0.1)',
          borderRadius: '8px',
          border: '1px solid rgba(48, 209, 88, 0.2)',
        }}
      >
        <p
          style={{
            fontSize: '13px',
            color: '#30D158',
            margin: 0,
            display: 'flex',
            alignItems: 'flex-start',
            gap: '8px',
          }}
        >
          <Check size={16} style={{ marginTop: '1px', flexShrink: 0 }} />
          <span>
            You can always update these preferences later in Settings
          </span>
        </p>
      </div>
    </div>
  );
}

// Pill Component (for removable tags)
interface PillProps {
  text: string;
  onRemove: () => void;
}

function Pill({ text, onRemove }: PillProps) {
  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: '6px 12px',
        backgroundColor: 'rgba(0, 119, 181, 0.1)',
        borderRadius: '16px',
        fontSize: '13px',
        color: '#0077B5',
        fontWeight: '500',
      }}
    >
      {text}
      <button
        onClick={onRemove}
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: 0,
          display: 'flex',
          alignItems: 'center',
          color: '#0077B5',
          fontSize: '16px',
          lineHeight: 1,
        }}
      >
        ×
      </button>
    </div>
  );
}

// Toggle Chip Component (for selectable options)
interface ToggleChipProps {
  label: string;
  isSelected: boolean;
  onClick: () => void;
}

function ToggleChip({ label, isSelected, onClick }: ToggleChipProps) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '8px 14px',
        backgroundColor: isSelected ? '#0077B5' : 'transparent',
        color: isSelected ? '#FFFFFF' : '#6e6e73',
        border: `1px solid ${isSelected ? '#0077B5' : 'rgba(0, 0, 0, 0.12)'}`,
        borderRadius: '20px',
        fontSize: '13px',
        fontWeight: '600',
        cursor: 'pointer',
        transition: 'all 150ms',
      }}
      onMouseEnter={(e) => {
        if (!isSelected) {
          e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.04)';
        }
      }}
      onMouseLeave={(e) => {
        if (!isSelected) {
          e.currentTarget.style.backgroundColor = 'transparent';
        }
      }}
    >
      {label}
    </button>
  );
}
