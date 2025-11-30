/**
 * Company Tab
 * Shown only on LinkedIn company pages
 *
 * Features:
 * 1. Add to Watchlist - Save company for tracking
 * 2. Enable Job Alerts - Monitor for new job postings
 * 3. View Company Jobs - Quick link to company's job listings
 */

import React, { useState } from 'react';
import { Building2, Bell, Briefcase, BookmarkPlus, Loader2, ExternalLink } from 'lucide-react';
import { usePageContext } from '../../hooks/usePageContext';
import { useWatchlist } from '../../hooks/useWatchlist';

interface CompanyTabProps {
  panelWidth?: number;
}

export function CompanyTab({ panelWidth: _panelWidth = 400 }: CompanyTabProps) {
  const pageContext = usePageContext();
  const { addCompany } = useWatchlist();
  const [isAddingToWatchlist, setIsAddingToWatchlist] = useState(false);

  // Extract company data from context
  const companyData = pageContext.companyData;
  const name = companyData?.name || 'Unknown Company';
  const industry = companyData?.industry || '';
  const companyLogo = companyData?.companyLogo;
  const followerCount = companyData?.followerCount;
  const employeeCount = companyData?.employeeCount;

  const handleAddToWatchlist = async (enableJobAlerts: boolean = false) => {
    if (!companyData) {
      console.error('[Uproot] No company data available');
      return;
    }

    setIsAddingToWatchlist(true);
    try {
      await addCompany({
        name,
        industry,
        companyUrl: companyData.companyUrl,
        companyLogo,
        jobAlertEnabled: enableJobAlerts,
      });

      console.log('[Uproot] Added company to watchlist:', name, { jobAlerts: enableJobAlerts });
    } catch (error) {
      console.error('[Uproot] Failed to add company to watchlist:', error);
    } finally {
      setIsAddingToWatchlist(false);
    }
  };

  const handleViewJobs = () => {
    if (companyData) {
      // Navigate to company jobs page
      const jobsUrl = companyData.companyUrl.replace(/\/?$/, '/jobs/');
      window.open(jobsUrl, '_blank');
    }
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
      {/* Company Header */}
      <div
        style={{
          padding: '20px',
          borderBottom: '1px solid rgba(0, 0, 0, 0.08)',
          backgroundColor: 'rgba(0, 119, 181, 0.03)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '8px' }}>
          {/* Company Logo or Fallback Icon */}
          {companyLogo ? (
            <img
              src={companyLogo}
              alt={name}
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '12px',
                objectFit: 'contain',
                border: '2px solid rgba(0, 119, 181, 0.2)',
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
                width: '56px',
                height: '56px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #0077B5 0%, #00A0DC 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontSize: '20px',
                fontWeight: 'bold',
                flexShrink: 0,
              }}
            >
              <Building2 size={28} strokeWidth={2} />
            </div>
          )}

          <div style={{ flex: 1, minWidth: 0 }}>
            <h2
              style={{
                fontSize: '18px',
                fontWeight: '600',
                margin: '0 0 6px 0',
                color: '#1d1d1f',
                wordBreak: 'break-word',
              }}
            >
              {name}
            </h2>
            {industry && (
              <p
                style={{
                  fontSize: '13px',
                  color: '#6e6e73',
                  margin: '0 0 4px 0',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '6px',
                  lineHeight: '1.4',
                  wordBreak: 'break-word',
                  whiteSpace: 'normal',
                }}
              >
                <Briefcase size={14} style={{ marginTop: '2px', flexShrink: 0 }} />
                <span style={{ flex: 1 }}>{industry}</span>
              </p>
            )}
            {(followerCount || employeeCount) && (
              <p
                style={{
                  fontSize: '12px',
                  color: '#8e8e93',
                  margin: 0,
                }}
              >
                {followerCount && `${followerCount} followers`}
                {followerCount && employeeCount && ' � '}
                {employeeCount && `${employeeCount} employees`}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Action Cards */}
      <div
        style={{
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
        }}
      >
        {/* Add to Watchlist (Simple) */}
        <ActionCard
          icon={BookmarkPlus}
          title="Add to Watchlist"
          description="Track this company and monitor their updates"
          buttonText={isAddingToWatchlist ? 'Adding...' : 'Add to Watchlist'}
          buttonColor="#FF9500"
          isLoading={isAddingToWatchlist}
          onClick={() => handleAddToWatchlist(false)}
        />

        {/* Add with Job Alerts */}
        <ActionCard
          icon={Bell}
          title="Watch for Job Openings"
          description="Get notified when this company posts new jobs matching your preferences"
          buttonText={isAddingToWatchlist ? 'Adding...' : 'Enable Job Alerts'}
          buttonColor="#30D158"
          isLoading={isAddingToWatchlist}
          onClick={() => handleAddToWatchlist(true)}
        />

        {/* View Jobs */}
        <ActionCard
          icon={ExternalLink}
          title="View Open Positions"
          description="Browse current job listings at this company"
          buttonText="View Jobs"
          buttonColor="#0077B5"
          isLoading={false}
          onClick={handleViewJobs}
        />
      </div>

      {/* Help Text */}
      <div
        style={{
          padding: '20px',
          marginTop: 'auto',
          borderTop: '1px solid rgba(0, 0, 0, 0.08)',
          backgroundColor: 'rgba(0, 0, 0, 0.02)',
        }}
      >
        <p
          style={{
            fontSize: '12px',
            color: '#8e8e93',
            margin: 0,
            textAlign: 'center',
          }}
        >
          =� Tip: Enable job alerts to get notified of new openings
        </p>
      </div>
    </div>
  );
}

// Action Card Component
interface ActionCardProps {
  icon: React.ComponentType<any>;
  title: string;
  description: string;
  buttonText: string;
  buttonColor: string;
  isLoading: boolean;
  onClick: () => void;
}

function ActionCard({
  icon: Icon,
  title,
  description,
  buttonText,
  buttonColor,
  isLoading,
  onClick,
}: ActionCardProps) {
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
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '12px' }}>
        <div
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '10px',
            backgroundColor: `${buttonColor}15`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <Icon size={20} color={buttonColor} strokeWidth={2} />
        </div>
        <div style={{ flex: 1 }}>
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

      <button
        onClick={onClick}
        disabled={isLoading}
        style={{
          width: '100%',
          padding: '10px 16px',
          backgroundColor: isLoading ? '#8e8e93' : buttonColor,
          color: '#FFFFFF',
          border: 'none',
          borderRadius: '8px',
          fontSize: '14px',
          fontWeight: '600',
          cursor: isLoading ? 'not-allowed' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          transition: 'all 150ms cubic-bezier(0.4, 0.0, 0.2, 1)',
          opacity: isLoading ? 0.7 : 1,
        }}
        onMouseEnter={(e) => {
          if (!isLoading) {
            e.currentTarget.style.transform = 'scale(1.02)';
          }
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'scale(1)';
        }}
      >
        {isLoading && (
          <Loader2
            size={16}
            style={{
              animation: 'spin 1s linear infinite',
            }}
          />
        )}
        {buttonText}
        <style>
          {`
            @keyframes spin {
              from { transform: rotate(0deg); }
              to { transform: rotate(360deg); }
            }
          `}
        </style>
      </button>
    </div>
  );
}
