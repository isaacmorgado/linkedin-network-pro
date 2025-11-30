/**
 * Job Preferences Settings Component
 * Allows editing of job search preferences
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Save, RefreshCw, Trash2 } from 'lucide-react';
import type { JobPreferences, ExperienceLevel, WorkLocationType } from '../../../types/onboarding';
import { getOnboardingState, saveOnboardingState } from '../../../utils/storage';
import { useSettingsStore } from '../../../stores/settings';

interface JobPreferencesSettingsProps {
  panelWidth?: number;
}

export function JobPreferencesSettings({ panelWidth: _panelWidth = 400 }: JobPreferencesSettingsProps) {
  const [preferences, setPreferences] = useState<JobPreferences>({
    jobTitles: [],
    experienceLevel: [],
    workLocation: [],
    locations: [],
    industries: [],
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  // Input states
  const [jobTitleInput, setJobTitleInput] = useState('');
  const [locationInput, setLocationInput] = useState('');
  const [industryInput, setIndustryInput] = useState('');

  // Load preferences on mount
  useEffect(() => {
    async function loadPreferences() {
      try {
        const state = await getOnboardingState();
        if (state.preferences) {
          setPreferences(state.preferences);
        }
      } catch (error) {
        console.error('[Uproot] Error loading preferences:', error);
      } finally {
        setIsLoading(false);
      }
    }
    loadPreferences();
  }, []);

  // Save preferences
  const handleSave = useCallback(async () => {
    setIsSaving(true);
    setSaveMessage(null);
    try {
      const state = await getOnboardingState();
      await saveOnboardingState({
        ...state,
        preferences,
      });

      // NEW: Sync to feedPreferences.globalFilters
      const { updateFeedPreferences } = useSettingsStore.getState();
      await updateFeedPreferences({
        globalFilters: {
          keywords: preferences.jobTitles,
          experienceLevel: preferences.experienceLevel,
          remote: preferences.workLocation.includes('remote'),
          locations: preferences.locations,
        },
      });
      console.log('[Uproot] Synced job preferences to feedPreferences');

      setSaveMessage('✓ Preferences saved successfully!');
      setTimeout(() => setSaveMessage(null), 3000);
    } catch (error) {
      console.error('[Uproot] Error saving preferences:', error);
      setSaveMessage('✗ Failed to save preferences');
    } finally {
      setIsSaving(false);
    }
  }, [preferences]);

  // Job titles
  const addJobTitle = useCallback(() => {
    if (jobTitleInput.trim() && !preferences.jobTitles.includes(jobTitleInput.trim())) {
      setPreferences((prev) => ({
        ...prev,
        jobTitles: [...prev.jobTitles, jobTitleInput.trim()],
      }));
      setJobTitleInput('');
    }
  }, [jobTitleInput, preferences.jobTitles]);

  const removeJobTitle = useCallback((title: string) => {
    setPreferences((prev) => ({
      ...prev,
      jobTitles: prev.jobTitles.filter((t) => t !== title),
    }));
  }, []);

  // Experience levels
  const toggleExperienceLevel = useCallback((level: ExperienceLevel) => {
    setPreferences((prev) => ({
      ...prev,
      experienceLevel: prev.experienceLevel.includes(level)
        ? prev.experienceLevel.filter((l) => l !== level)
        : [...prev.experienceLevel, level],
    }));
  }, []);

  // Work locations
  const toggleWorkLocation = useCallback((location: WorkLocationType) => {
    setPreferences((prev) => ({
      ...prev,
      workLocation: prev.workLocation.includes(location)
        ? prev.workLocation.filter((l) => l !== location)
        : [...prev.workLocation, location],
    }));
  }, []);

  // Locations
  const addLocation = useCallback(() => {
    if (locationInput.trim() && !preferences.locations.includes(locationInput.trim())) {
      setPreferences((prev) => ({
        ...prev,
        locations: [...prev.locations, locationInput.trim()],
      }));
      setLocationInput('');
    }
  }, [locationInput, preferences.locations]);

  const removeLocation = useCallback((location: string) => {
    setPreferences((prev) => ({
      ...prev,
      locations: prev.locations.filter((l) => l !== location),
    }));
  }, []);

  // Industries
  const addIndustry = useCallback(() => {
    if (industryInput.trim() && !preferences.industries.includes(industryInput.trim())) {
      setPreferences((prev) => ({
        ...prev,
        industries: [...prev.industries, industryInput.trim()],
      }));
      setIndustryInput('');
    }
  }, [industryInput, preferences.industries]);

  const removeIndustry = useCallback((industry: string) => {
    setPreferences((prev) => ({
      ...prev,
      industries: prev.industries.filter((i) => i !== industry),
    }));
  }, []);

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

  if (isLoading) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          color: '#6e6e73',
        }}
      >
        <RefreshCw size={24} className="animate-spin" />
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
      {/* Scrollable Content */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '20px',
        }}
      >
        {/* Job Titles */}
        <Section title="Job Titles" description="What roles are you looking for?">
          <InputWithAdd
            value={jobTitleInput}
            onChange={setJobTitleInput}
            onAdd={addJobTitle}
            placeholder="e.g., Product Manager, Marketing Manager"
          />
          <PillList items={preferences.jobTitles} onRemove={removeJobTitle} />
        </Section>

        {/* Experience Level */}
        <Section title="Experience Level" description="Select all that apply">
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {experienceLevels.map(({ value, label }) => (
              <TogglePill
                key={value}
                label={label}
                isActive={preferences.experienceLevel.includes(value)}
                onClick={() => toggleExperienceLevel(value)}
              />
            ))}
          </div>
        </Section>

        {/* Work Location */}
        <Section title="Work Location" description="Where do you want to work?">
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {workLocations.map(({ value, label, icon }) => (
              <TogglePill
                key={value}
                label={`${icon} ${label}`}
                isActive={preferences.workLocation.includes(value)}
                onClick={() => toggleWorkLocation(value)}
              />
            ))}
          </div>
        </Section>

        {/* Locations */}
        <Section title="Locations" description="Cities or regions you're interested in">
          <InputWithAdd
            value={locationInput}
            onChange={setLocationInput}
            onAdd={addLocation}
            placeholder="e.g., New York, NY or Remote"
          />
          <PillList items={preferences.locations} onRemove={removeLocation} />
        </Section>

        {/* Industries */}
        <Section
          title="Industries"
          description="Which industries interest you? (Optional)"
        >
          <InputWithAdd
            value={industryInput}
            onChange={setIndustryInput}
            onAdd={addIndustry}
            placeholder="e.g., Technology, Healthcare"
          />
          <PillList items={preferences.industries} onRemove={removeIndustry} />
        </Section>

        {/* Spacer for save button */}
        <div style={{ height: '80px' }} />
      </div>

      {/* Fixed Save Button */}
      <div
        style={{
          padding: '16px 20px',
          borderTop: '1px solid rgba(0, 0, 0, 0.08)',
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(10px)',
        }}
      >
        {saveMessage && (
          <div
            style={{
              fontSize: '13px',
              color: saveMessage.startsWith('✓') ? '#34C759' : '#FF3B30',
              marginBottom: '12px',
              textAlign: 'center',
              fontWeight: '500',
            }}
          >
            {saveMessage}
          </div>
        )}
        <button
          onClick={handleSave}
          disabled={isSaving}
          style={{
            width: '100%',
            padding: '14px',
            backgroundColor: isSaving ? '#86868b' : '#0077B5',
            color: 'white',
            border: 'none',
            borderRadius: '12px',
            fontSize: '15px',
            fontWeight: '600',
            cursor: isSaving ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            transition: 'all 150ms',
            opacity: isSaving ? 0.6 : 1,
          }}
          onMouseEnter={(e) => {
            if (!isSaving) {
              e.currentTarget.style.backgroundColor = '#005885';
              e.currentTarget.style.transform = 'scale(1.01)';
            }
          }}
          onMouseLeave={(e) => {
            if (!isSaving) {
              e.currentTarget.style.backgroundColor = '#0077B5';
              e.currentTarget.style.transform = 'scale(1)';
            }
          }}
        >
          {isSaving ? (
            <>
              <RefreshCw size={16} className="animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save size={16} />
              Save Preferences
            </>
          )}
        </button>
      </div>
    </div>
  );
}

// Helper Components

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div style={{ marginBottom: '28px' }}>
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
      {description && (
        <p
          style={{
            fontSize: '13px',
            color: '#6e6e73',
            margin: '0 0 12px 0',
          }}
        >
          {description}
        </p>
      )}
      {children}
    </div>
  );
}

function InputWithAdd({
  value,
  onChange,
  onAdd,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  onAdd: () => void;
  placeholder: string;
}) {
  return (
    <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyPress={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            onAdd();
          }
        }}
        placeholder={placeholder}
        style={{
          flex: 1,
          padding: '10px 14px',
          border: '1px solid rgba(0, 0, 0, 0.1)',
          borderRadius: '8px',
          fontSize: '14px',
          outline: 'none',
          transition: 'border-color 150ms',
        }}
        onFocus={(e) => {
          e.currentTarget.style.borderColor = '#0077B5';
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = 'rgba(0, 0, 0, 0.1)';
        }}
      />
      <button
        onClick={onAdd}
        disabled={!value.trim()}
        style={{
          padding: '10px 18px',
          backgroundColor: value.trim() ? '#0077B5' : 'rgba(0, 0, 0, 0.05)',
          color: value.trim() ? 'white' : 'rgba(0, 0, 0, 0.3)',
          border: 'none',
          borderRadius: '8px',
          fontSize: '14px',
          fontWeight: '600',
          cursor: value.trim() ? 'pointer' : 'not-allowed',
          transition: 'all 150ms',
          whiteSpace: 'nowrap',
        }}
        onMouseEnter={(e) => {
          if (value.trim()) {
            e.currentTarget.style.backgroundColor = '#005885';
          }
        }}
        onMouseLeave={(e) => {
          if (value.trim()) {
            e.currentTarget.style.backgroundColor = '#0077B5';
          }
        }}
      >
        Add
      </button>
    </div>
  );
}

function PillList({
  items,
  onRemove,
}: {
  items: string[];
  onRemove: (item: string) => void;
}) {
  if (items.length === 0) {
    return (
      <p
        style={{
          fontSize: '13px',
          color: '#86868b',
          fontStyle: 'italic',
          margin: 0,
        }}
      >
        No items added yet
      </p>
    );
  }

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
      {items.map((item) => (
        <div
          key={item}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '6px 10px 6px 12px',
            backgroundColor: 'rgba(0, 119, 181, 0.1)',
            borderRadius: '20px',
            fontSize: '13px',
            color: '#0077B5',
            fontWeight: '500',
          }}
        >
          <span>{item}</span>
          <button
            onClick={() => onRemove(item)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '2px',
              display: 'flex',
              alignItems: 'center',
              borderRadius: '50%',
              transition: 'background-color 150ms',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            <Trash2 size={12} />
          </button>
        </div>
      ))}
    </div>
  );
}

function TogglePill({
  label,
  isActive,
  onClick,
}: {
  label: string;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '10px 16px',
        backgroundColor: isActive ? '#0077B5' : 'rgba(0, 0, 0, 0.05)',
        color: isActive ? 'white' : '#1d1d1f',
        border: isActive ? '2px solid #0077B5' : '2px solid transparent',
        borderRadius: '20px',
        fontSize: '14px',
        fontWeight: '500',
        cursor: 'pointer',
        transition: 'all 150ms',
        whiteSpace: 'nowrap',
      }}
      onMouseEnter={(e) => {
        if (!isActive) {
          e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.08)';
        } else {
          e.currentTarget.style.backgroundColor = '#005885';
        }
      }}
      onMouseLeave={(e) => {
        if (!isActive) {
          e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.05)';
        } else {
          e.currentTarget.style.backgroundColor = '#0077B5';
        }
      }}
    >
      {label}
    </button>
  );
}
