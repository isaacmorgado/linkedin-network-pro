/**
 * Company Job Preferences Component
 * Allows users to customize job preferences per company
 */

import { useState } from 'react';
import { Settings, X } from 'lucide-react';
import type { WatchlistCompany } from '../../../types/watchlist';

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
      remote: false,
      location: [],
    }
  );

  const handleSave = () => {
    if (useCustom) {
      // Only save if at least one preference is set
      const hasPreferences =
        (preferences.keywords && preferences.keywords.length > 0) ||
        (preferences.experienceLevel && preferences.experienceLevel.length > 0) ||
        preferences.remote !== undefined ||
        (preferences.location && preferences.location.length > 0);

      onSave(hasPreferences ? preferences : null);
    } else {
      onSave(null); // Clear custom preferences, use global
    }
  };

  const handleKeywordsChange = (value: string) => {
    const keywords = value
      .split(',')
      .map((k) => k.trim())
      .filter(Boolean);
    setPreferences({ ...preferences, keywords });
  };

  const handleLocationsChange = (value: string) => {
    const locations = value
      .split(',')
      .map((l) => l.trim())
      .filter(Boolean);
    setPreferences({ ...preferences, location: locations });
  };

  const toggleExperienceLevel = (level: string) => {
    const current = preferences.experienceLevel || [];
    const updated = current.includes(level) ? current.filter((l) => l !== level) : [...current, level];
    setPreferences({ ...preferences, experienceLevel: updated });
  };

  return (
    <div
      style={{
        padding: '20px',
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
          marginBottom: '16px',
        }}
      >
        <h3
          style={{
            fontSize: '16px',
            fontWeight: '600',
            color: '#1d1d1f',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            margin: 0,
          }}
        >
          <Settings size={18} color="#0077B5" />
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

      {/* Use Custom Toggle */}
      <label
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          marginBottom: '20px',
          cursor: 'pointer',
          padding: '12px',
          backgroundColor: 'rgba(0, 119, 181, 0.05)',
          borderRadius: '8px',
        }}
      >
        <input
          type="checkbox"
          checked={useCustom}
          onChange={(e) => setUseCustom(e.target.checked)}
          style={{ width: '16px', height: '16px', cursor: 'pointer' }}
        />
        <span style={{ fontSize: '14px', color: '#1d1d1f', fontWeight: '500' }}>
          Use custom job preferences for {company.name}
        </span>
      </label>

      {!useCustom && (
        <div
          style={{
            padding: '16px',
            backgroundColor: 'rgba(0, 0, 0, 0.02)',
            borderRadius: '8px',
            fontSize: '13px',
            color: '#6e6e73',
            textAlign: 'center',
          }}
        >
          This company will use your global job preferences from Settings.
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
              value={preferences.keywords?.join(', ') || ''}
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

          {/* Remote Preference */}
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
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px',
                backgroundColor: 'rgba(0, 0, 0, 0.02)',
                borderRadius: '8px',
                cursor: 'pointer',
              }}
            >
              <input
                type="checkbox"
                checked={preferences.remote || false}
                onChange={(e) => setPreferences({ ...preferences, remote: e.target.checked })}
                style={{ width: '16px', height: '16px', cursor: 'pointer' }}
              />
              <span style={{ fontSize: '13px', color: '#1d1d1f' }}>Remote only</span>
            </label>
          </div>

          {/* Locations */}
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
              value={preferences.location?.join(', ') || ''}
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
        </div>
      )}

      {/* Actions */}
      <div
        style={{
          display: 'flex',
          gap: '12px',
          marginTop: '24px',
          paddingTop: '20px',
          borderTop: '1px solid rgba(0, 0, 0, 0.08)',
        }}
      >
        <button
          onClick={onCancel}
          style={{
            flex: 1,
            padding: '12px 16px',
            backgroundColor: 'rgba(0, 0, 0, 0.04)',
            color: '#1d1d1f',
            border: 'none',
            borderRadius: '8px',
            fontSize: '14px',
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
            padding: '12px 16px',
            backgroundColor: '#0077B5',
            color: '#FFFFFF',
            border: 'none',
            borderRadius: '8px',
            fontSize: '14px',
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
