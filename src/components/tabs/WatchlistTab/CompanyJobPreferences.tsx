/**
 * Company Job Preferences Component
 * Allows users to customize job preferences per company
 */

import { useState } from 'react';
import { Settings, X } from 'lucide-react';
import type { WatchlistCompany } from '../../../types/watchlist';
import type { WorkLocationType } from '../../../types/onboarding';

interface CompanyJobPreferencesProps {
  company: WatchlistCompany;
  onSave: (preferences: WatchlistCompany['jobPreferences'] | null) => void;
  onCancel: () => void;
}

export function CompanyJobPreferences({
  company,
  onSave,
  onCancel,
}: CompanyJobPreferencesProps) {
  const [useCustom, setUseCustom] = useState(!!company.jobPreferences);
  const [preferences, setPreferences] = useState<NonNullable<WatchlistCompany['jobPreferences']>>(
    company.jobPreferences || {
      keywords: [],
      experienceLevel: [],
      workLocation: [],
      location: [],
    }
  );

  // Store raw input strings to preserve spaces while typing
  const [keywordsInput, setKeywordsInput] = useState(
    company.jobPreferences?.keywords?.join(', ') || ''
  );
  const [locationsInput, setLocationsInput] = useState(
    company.jobPreferences?.location?.join(', ') || ''
  );

  const handleSave = () => {
    if (useCustom) {
      // Process the raw inputs into arrays before saving
      const keywords = keywordsInput
        .split(',')
        .map((k) => k.trim())
        .filter(Boolean);
      const locations = locationsInput
        .split(',')
        .map((l) => l.trim())
        .filter(Boolean);

      const finalPreferences = {
        ...preferences,
        keywords,
        location: locations,
      };

      // Only save if at least one preference is set
      const hasPreferences =
        (keywords && keywords.length > 0) ||
        (finalPreferences.experienceLevel && finalPreferences.experienceLevel.length > 0) ||
        (finalPreferences.workLocation && finalPreferences.workLocation.length > 0) ||
        (locations && locations.length > 0);

      onSave(hasPreferences ? finalPreferences : null);
    } else {
      onSave(null); // Clear custom preferences, use global
    }
  };

  const handleKeywordsChange = (value: string) => {
    setKeywordsInput(value);
  };

  const handleLocationsChange = (value: string) => {
    setLocationsInput(value);
  };

  const toggleExperienceLevel = (level: string) => {
    const current = preferences.experienceLevel || [];
    const updated = current.includes(level) ? current.filter((l) => l !== level) : [...current, level];
    setPreferences({ ...preferences, experienceLevel: updated });
  };

  const toggleWorkLocation = (type: WorkLocationType) => {
    const current = preferences.workLocation || [];
    const updated = current.includes(type) ? current.filter((t) => t !== type) : [...current, type];
    setPreferences({ ...preferences, workLocation: updated });
  };

  return (
    <div
      style={{
        padding: '16px',
        backgroundColor: '#FFFFFF',
        borderRadius: '12px',
        border: '1px solid rgba(0, 0, 0, 0.08)',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.12)',
        marginTop: '12px',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '12px',
        }}
      >
        <h3
          style={{
            fontSize: '14px',
            fontWeight: '600',
            color: '#1d1d1f',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            margin: 0,
          }}
        >
          <Settings size={16} color="#0077B5" />
          Job Preferences for {company.name}
        </h3>
        <button
          onClick={onCancel}
          style={{
            width: '28px',
            height: '28px',
            border: 'none',
            borderRadius: '50%',
            backgroundColor: 'transparent',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'background-color 150ms',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.05)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
          }}
        >
          <X size={18} color="#6e6e73" />
        </button>
      </div>

      {/* Use Custom Toggle Switch */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '16px',
          padding: '12px',
          backgroundColor: 'rgba(0, 119, 181, 0.05)',
          borderRadius: '8px',
        }}
      >
        <span style={{ fontSize: '13px', color: '#1d1d1f', fontWeight: '500' }}>
          Use custom preferences for this company
        </span>
        <label
          style={{
            position: 'relative',
            display: 'inline-block',
            width: '44px',
            height: '24px',
            cursor: 'pointer',
          }}
        >
          <input
            type="checkbox"
            checked={useCustom}
            onChange={(e) => setUseCustom(e.target.checked)}
            style={{
              opacity: 0,
              width: 0,
              height: 0,
            }}
          />
          <span
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: useCustom ? '#0077B5' : 'rgba(0, 0, 0, 0.2)',
              borderRadius: '24px',
              transition: 'all 250ms cubic-bezier(0.4, 0, 0.2, 1)',
              cursor: 'pointer',
            }}
          >
            <span
              style={{
                position: 'absolute',
                content: '',
                height: '18px',
                width: '18px',
                left: useCustom ? '23px' : '3px',
                bottom: '3px',
                backgroundColor: '#FFFFFF',
                borderRadius: '50%',
                transition: 'all 250ms cubic-bezier(0.4, 0, 0.2, 1)',
                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
              }}
            />
          </span>
        </label>
      </div>

      {!useCustom && (
        <div
          style={{
            padding: '16px',
            backgroundColor: 'rgba(0, 119, 181, 0.08)',
            borderRadius: '8px',
            border: '1px solid rgba(0, 119, 181, 0.2)',
            marginBottom: '12px',
          }}
        >
          <div
            style={{
              fontSize: '13px',
              color: '#0077B5',
              fontWeight: '600',
              marginBottom: '6px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M8 0C6.41775 0 4.87103 0.469192 3.55544 1.34824C2.23985 2.22729 1.21447 3.47672 0.608967 4.93853C0.00346629 6.40034 -0.15496 8.00887 0.153721 9.56072C0.462403 11.1126 1.22433 12.538 2.34315 13.6569C3.46197 14.7757 4.88743 15.5376 6.43928 15.8463C7.99113 16.155 9.59966 15.9965 11.0615 15.391C12.5233 14.7855 13.7727 13.7602 14.6518 12.4446C15.5308 11.129 16 9.58225 16 8C16 5.87827 15.1571 3.84344 13.6569 2.34315C12.1566 0.842855 10.1217 0 8 0ZM8 14.4C6.69239 14.4 5.41457 14.0116 4.32721 13.2832C3.23986 12.5549 2.39289 11.5193 1.89771 10.2995C1.40253 9.07972 1.28306 7.73267 1.55585 6.43474C1.82864 5.13681 2.48178 3.94826 3.43045 3.00745C4.37913 2.06664 5.5759 1.42131 6.88182 1.15628C8.18774 0.891248 9.54197 1.01798 10.7682 1.51931C11.9944 2.02064 13.0344 2.87336 13.7619 3.96604C14.4895 5.05871 14.8743 6.34104 14.8743 7.65365C14.8726 9.42283 14.1686 11.1192 12.9178 12.3629C11.6669 13.6066 9.96283 14.3017 8.18665 14.2983L8 14.4Z"
                fill="#0077B5"
              />
              <path
                d="M8 3.99997C7.73478 3.99997 7.48043 4.10533 7.29289 4.29287C7.10536 4.4804 7 4.73475 7 4.99997V8.99997C7 9.26519 7.10536 9.51954 7.29289 9.70708C7.48043 9.89461 7.73478 9.99997 8 9.99997C8.26522 9.99997 8.51957 9.89461 8.70711 9.70708C8.89464 9.51954 9 9.26519 9 8.99997V4.99997C9 4.73475 8.89464 4.4804 8.70711 4.29287C8.51957 4.10533 8.26522 3.99997 8 3.99997ZM8 12C7.80222 12 7.60888 11.9414 7.44443 11.8315C7.27998 11.7216 7.15181 11.5654 7.07612 11.3827C7.00043 11.2 6.98063 10.999 7.01921 10.8049C7.0578 10.6108 7.15304 10.4327 7.29289 10.2929C7.43275 10.153 7.61093 10.0578 7.80491 10.0192C7.99889 9.9806 8.19996 10.0004 8.38268 10.0761C8.56541 10.1518 8.72159 10.28 8.83147 10.4444C8.94135 10.6089 9 10.8022 9 11C9 11.2652 8.89464 11.5195 8.70711 11.7071C8.51957 11.8946 8.26522 12 8 12Z"
                fill="#0077B5"
              />
            </svg>
            Using Global Preferences
          </div>
          <p style={{ fontSize: '12px', color: '#1d1d1f', margin: 0, lineHeight: '1.5' }}>
            This company will use your global job preferences from Settings.
            Toggle on to customize preferences specifically for {company.name}.
          </p>
        </div>
      )}

      {useCustom && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Keywords */}
          <div>
            <label
              style={{
                display: 'block',
                fontSize: '13px',
                fontWeight: '600',
                color: '#1d1d1f',
                marginBottom: '8px',
              }}
            >
              Job Title Keywords
            </label>
            <input
              type="text"
              value={keywordsInput}
              onChange={(e) => handleKeywordsChange(e.target.value)}
              placeholder="e.g., engineer, designer, manager"
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid rgba(0, 0, 0, 0.12)',
                borderRadius: '8px',
                fontSize: '13px',
                backgroundColor: '#FFFFFF',
                color: '#1d1d1f',
                outline: 'none',
                transition: 'all 150ms',
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = '#0077B5';
                e.currentTarget.style.boxShadow = '0 0 0 3px rgba(0, 119, 181, 0.1)';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = 'rgba(0, 0, 0, 0.12)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            />
            <p style={{ fontSize: '11px', color: '#8e8e93', margin: '4px 0 0 0' }}>
              Comma-separated keywords to match in job titles
            </p>
          </div>

          {/* Experience Level */}
          <div>
            <label
              style={{
                display: 'block',
                fontSize: '13px',
                fontWeight: '600',
                color: '#1d1d1f',
                marginBottom: '8px',
              }}
            >
              Experience Level
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {['Entry', 'Mid', 'Senior', 'Lead', 'Director', 'Executive'].map((level) => (
                <label
                  key={level}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 14px',
                    backgroundColor: preferences.experienceLevel?.includes(level)
                      ? '#0077B5'
                      : 'rgba(0, 0, 0, 0.04)',
                    color: preferences.experienceLevel?.includes(level) ? '#FFFFFF' : '#1d1d1f',
                    borderRadius: '8px',
                    fontSize: '12px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    transition: 'all 150ms',
                    border: 'none',
                  }}
                  onMouseEnter={(e) => {
                    if (!preferences.experienceLevel?.includes(level)) {
                      e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.08)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!preferences.experienceLevel?.includes(level)) {
                      e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.04)';
                    }
                  }}
                >
                  <input
                    type="checkbox"
                    checked={preferences.experienceLevel?.includes(level) || false}
                    onChange={() => toggleExperienceLevel(level)}
                    style={{ display: 'none' }}
                  />
                  {level}
                </label>
              ))}
            </div>
          </div>

          {/* Work Location Preference */}
          <div>
            <label
              style={{
                display: 'block',
                fontSize: '13px',
                fontWeight: '600',
                color: '#1d1d1f',
                marginBottom: '8px',
              }}
            >
              Work Location
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {(['remote', 'hybrid', 'onsite'] as WorkLocationType[]).map((type) => (
                <label
                  key={type}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 14px',
                    backgroundColor: preferences.workLocation?.includes(type)
                      ? '#0077B5'
                      : 'rgba(0, 0, 0, 0.04)',
                    color: preferences.workLocation?.includes(type) ? '#FFFFFF' : '#1d1d1f',
                    borderRadius: '8px',
                    fontSize: '12px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    transition: 'all 150ms',
                    border: 'none',
                  }}
                  onMouseEnter={(e) => {
                    if (!preferences.workLocation?.includes(type)) {
                      e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.08)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!preferences.workLocation?.includes(type)) {
                      e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.04)';
                    }
                  }}
                >
                  <input
                    type="checkbox"
                    checked={preferences.workLocation?.includes(type) || false}
                    onChange={() => toggleWorkLocation(type)}
                    style={{ display: 'none' }}
                  />
                  {type === 'remote' ? 'Remote' : type === 'hybrid' ? 'Hybrid' : 'On-site'}
                </label>
              ))}
            </div>
          </div>

          {/* Locations - Only show if Hybrid or On-site is selected */}
          {preferences.workLocation?.some((type) => type === 'hybrid' || type === 'onsite') && (
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '13px',
                  fontWeight: '600',
                  color: '#1d1d1f',
                  marginBottom: '8px',
                }}
              >
                Preferred Locations
              </label>
              <input
                type="text"
                value={locationsInput}
                onChange={(e) => handleLocationsChange(e.target.value)}
                placeholder="e.g., San Francisco, New York, Austin"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid rgba(0, 0, 0, 0.12)',
                  borderRadius: '8px',
                  fontSize: '13px',
                  backgroundColor: '#FFFFFF',
                  color: '#1d1d1f',
                  outline: 'none',
                  transition: 'all 150ms',
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = '#0077B5';
                  e.currentTarget.style.boxShadow = '0 0 0 3px rgba(0, 119, 181, 0.1)';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(0, 0, 0, 0.12)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              />
              <p style={{ fontSize: '11px', color: '#8e8e93', margin: '4px 0 0 0' }}>
                Comma-separated city or region names
              </p>
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      <div
        style={{
          display: 'flex',
          gap: '10px',
          marginTop: '16px',
          paddingTop: '16px',
          borderTop: '1px solid rgba(0, 0, 0, 0.08)',
        }}
      >
        <button
          onClick={onCancel}
          style={{
            flex: 1,
            padding: '10px 14px',
            backgroundColor: 'rgba(0, 0, 0, 0.04)',
            color: '#1d1d1f',
            border: 'none',
            borderRadius: '8px',
            fontSize: '13px',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 150ms',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.08)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.04)';
          }}
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          style={{
            flex: 1,
            padding: '10px 14px',
            backgroundColor: '#0077B5',
            color: '#FFFFFF',
            border: 'none',
            borderRadius: '8px',
            fontSize: '13px',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 150ms',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#006399';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#0077B5';
          }}
        >
          Save Preferences
        </button>
      </div>
    </div>
  );
}
