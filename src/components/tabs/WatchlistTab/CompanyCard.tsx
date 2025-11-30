/**
 * Company Card Component
 * Displays a company from the watchlist
 */

import { useState } from 'react';
import { Building2, Briefcase, Trash2, ExternalLink, Loader2, Bell, Settings } from 'lucide-react';
import type { WatchlistCompany } from '../../../types/watchlist';

interface CompanyCardProps {
  company: WatchlistCompany;
  onRemove: () => void;
  onViewCompany: () => void;
  onToggleJobAlerts: () => void;
  onEditPreferences?: () => void;
  isRemoving: boolean;
}

export function CompanyCard({ company, onRemove, onViewCompany, onToggleJobAlerts, onEditPreferences, isRemoving }: CompanyCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      style={{
        padding: '16px',
        borderRadius: '12px',
        border: '1px solid rgba(0, 0, 0, 0.08)',
        backgroundColor: '#FFFFFF',
        boxShadow: isHovered ? '0 4px 12px rgba(0, 0, 0, 0.08)' : '0 2px 4px rgba(0, 0, 0, 0.04)',
        transition: 'all 200ms cubic-bezier(0.4, 0.0, 0.2, 1)',
        transform: isHovered ? 'translateY(-2px)' : 'translateY(0)',
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
        {/* Company Logo or Fallback */}
        {company.companyLogo ? (
          <img
            src={company.companyLogo}
            alt={company.name}
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '8px',
              objectFit: 'contain',
              border: '1px solid rgba(0, 0, 0, 0.08)',
              backgroundColor: '#FFFFFF',
              padding: '4px',
              flexShrink: 0,
            }}
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        ) : (
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, #0077B5 0%, #00A0DC 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: '18px',
              fontWeight: 'bold',
              flexShrink: 0,
            }}
          >
            <Building2 size={24} strokeWidth={2} />
          </div>
        )}

        {/* Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <h3
            style={{
              fontSize: '15px',
              fontWeight: '600',
              margin: '0 0 4px 0',
              color: '#1d1d1f',
              wordBreak: 'break-word',
            }}
          >
            {company.name}
          </h3>
          {company.industry && (
            <p
              style={{
                fontSize: '13px',
                color: '#6e6e73',
                margin: '0 0 8px 0',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '6px',
                lineHeight: '1.4',
                wordBreak: 'break-word',
                whiteSpace: 'normal',
              }}
            >
              <Briefcase size={12} style={{ marginTop: '2px', flexShrink: 0 }} />
              <span style={{ flex: 1 }}>{company.industry}</span>
            </p>
          )}

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '8px', marginTop: '8px', flexWrap: 'wrap' }}>
            <button
              onClick={onViewCompany}
              style={{
                padding: '6px 12px',
                backgroundColor: '#0077B5',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 150ms',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#006399';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#0077B5';
              }}
            >
              <ExternalLink size={12} />
              View Page
            </button>

            <button
              onClick={onToggleJobAlerts}
              style={{
                padding: '6px 12px',
                backgroundColor: company.jobAlertEnabled ? 'rgba(48, 209, 88, 0.1)' : 'rgba(0, 119, 181, 0.1)',
                color: company.jobAlertEnabled ? '#30D158' : '#0077B5',
                border: 'none',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 150ms',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = company.jobAlertEnabled
                  ? 'rgba(48, 209, 88, 0.15)'
                  : 'rgba(0, 119, 181, 0.15)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = company.jobAlertEnabled
                  ? 'rgba(48, 209, 88, 0.1)'
                  : 'rgba(0, 119, 181, 0.1)';
              }}
            >
              {company.jobAlertEnabled ? <Bell size={12} /> : <Bell size={12} />}
              {company.jobAlertEnabled ? 'Alerts Active' : 'Enable Alerts'}
            </button>

            {company.jobAlertEnabled && onEditPreferences && (
              <button
                onClick={onEditPreferences}
                style={{
                  padding: '6px 12px',
                  backgroundColor: company.jobPreferences ? 'rgba(255, 149, 0, 0.1)' : 'rgba(142, 142, 147, 0.1)',
                  color: company.jobPreferences ? '#FF9500' : '#8e8e93',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 150ms',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = company.jobPreferences
                    ? 'rgba(255, 149, 0, 0.15)'
                    : 'rgba(142, 142, 147, 0.15)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = company.jobPreferences
                    ? 'rgba(255, 149, 0, 0.1)'
                    : 'rgba(142, 142, 147, 0.1)';
                }}
              >
                <Settings size={12} />
                {company.jobPreferences ? 'Custom' : 'Preferences'}
              </button>
            )}

            <button
              onClick={onRemove}
              disabled={isRemoving}
              style={{
                padding: '6px 12px',
                backgroundColor: 'rgba(255, 59, 48, 0.1)',
                color: '#FF3B30',
                border: 'none',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: '600',
                cursor: isRemoving ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 150ms',
                opacity: isRemoving ? 0.6 : 1,
              }}
              onMouseEnter={(e) => {
                if (!isRemoving) {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 59, 48, 0.15)';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255, 59, 48, 0.1)';
              }}
            >
              {isRemoving ? <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} /> : <Trash2 size={12} />}
              Remove
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
