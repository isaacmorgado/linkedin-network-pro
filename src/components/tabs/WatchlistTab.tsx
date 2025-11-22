/**
 * Watchlist Tab
 * Shows saved connection paths, people, and companies for tracking
 */

import { useState } from 'react';
import { User, Briefcase, Trash2, ExternalLink, Loader2, Building2, Bell, GitBranch, CheckCircle2, Circle } from 'lucide-react';
import { useWatchlist } from '../../hooks/useWatchlist';
import type { WatchlistPerson, WatchlistCompany, ConnectionPath } from '../../types/watchlist';

type WatchlistView = 'network' | 'people' | 'companies';

interface WatchlistTabProps {
  panelWidth?: number;
}

export function WatchlistTab({ panelWidth = 400 }: WatchlistTabProps) {
  const {
    connectionPaths,
    watchlist,
    companyWatchlist,
    isLoading,
    removePath,
    removePerson,
    removeCompany,
    updateCompany,
    markStepConnected,
  } = useWatchlist();
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<WatchlistView>('network');

  const handleRemovePerson = async (id: string, name: string) => {
    if (!confirm(`Remove ${name} from watchlist?`)) return;

    setRemovingId(id);
    try {
      await removePerson(id);
      console.log('[Uproot] Removed from watchlist:', name);
    } catch (error) {
      console.error('[Uproot] Failed to remove from watchlist:', error);
    } finally {
      setRemovingId(null);
    }
  };

  const handleRemoveCompany = async (id: string, name: string) => {
    if (!confirm(`Remove ${name} from watchlist?`)) return;

    setRemovingId(id);
    try {
      await removeCompany(id);
      console.log('[Uproot] Removed company from watchlist:', name);
    } catch (error) {
      console.error('[Uproot] Failed to remove company from watchlist:', error);
    } finally {
      setRemovingId(null);
    }
  };

  const handleToggleJobAlerts = async (company: WatchlistCompany) => {
    try {
      await updateCompany(company.id, {
        jobAlertEnabled: !company.jobAlertEnabled,
      });
      console.log('[Uproot] Toggled job alerts for:', company.name, !company.jobAlertEnabled);
    } catch (error) {
      console.error('[Uproot] Failed to toggle job alerts:', error);
    }
  };

  const handleRemovePath = async (id: string, name: string) => {
    if (!confirm(`Remove connection path to ${name}?`)) return;

    setRemovingId(id);
    try {
      await removePath(id);
      console.log('[Uproot] Removed connection path:', name);
    } catch (error) {
      console.error('[Uproot] Failed to remove connection path:', error);
    } finally {
      setRemovingId(null);
    }
  };

  const handleMarkStepConnected = async (pathId: string, stepIndex: number) => {
    try {
      await markStepConnected(pathId, stepIndex);
      console.log('[Uproot] Marked step as connected:', pathId, stepIndex);
    } catch (error) {
      console.error('[Uproot] Failed to mark step as connected:', error);
    }
  };

  const handleViewProfile = (url: string) => {
    window.open(url, '_blank');
  };

  if (isLoading) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          padding: '40px 20px',
        }}
      >
        <Loader2
          size={32}
          color="#0077B5"
          style={{
            animation: 'spin 1s linear infinite',
          }}
        />
        <p
          style={{
            fontSize: '14px',
            color: '#6e6e73',
            margin: '16px 0 0 0',
          }}
        >
          Loading watchlist...
        </p>
        <style>
          {`
            @keyframes spin {
              from { transform: rotate(0deg); }
              to { transform: rotate(360deg); }
            }
          `}
        </style>
      </div>
    );
  }

  const currentList = activeView === 'network' ? connectionPaths : activeView === 'people' ? watchlist : companyWatchlist;
  const isEmpty = currentList.length === 0;

  if (isEmpty) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          overflow: 'auto',
        }}
      >
        {/* Tab Switcher */}
        <TabSwitcher
          activeView={activeView}
          onViewChange={setActiveView}
          pathCount={connectionPaths.length}
          peopleCount={watchlist.length}
          companyCount={companyWatchlist.length}
          panelWidth={panelWidth}
        />

        {/* Empty State */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            flex: 1,
            padding: '40px 20px',
            textAlign: 'center',
          }}
        >
          {activeView === 'network' ? (
            <>
              <GitBranch size={48} color="#0077B5" strokeWidth={1.5} />
              <h3
                style={{
                  fontSize: '18px',
                  fontWeight: '600',
                  margin: '16px 0 8px 0',
                  color: '#1d1d1f',
                }}
              >
                No connection paths saved yet
              </h3>
              <p
                style={{
                  fontSize: '14px',
                  color: '#6e6e73',
                  margin: 0,
                  maxWidth: '280px',
                }}
              >
                Find a connection path to someone and save it to track your progress
              </p>
            </>
          ) : activeView === 'people' ? (
            <>
              <User size={48} color="#0077B5" strokeWidth={1.5} />
              <h3
                style={{
                  fontSize: '18px',
                  fontWeight: '600',
                  margin: '16px 0 8px 0',
                  color: '#1d1d1f',
                }}
              >
                No people saved yet
              </h3>
              <p
                style={{
                  fontSize: '14px',
                  color: '#6e6e73',
                  margin: 0,
                  maxWidth: '280px',
                }}
              >
                Visit a LinkedIn profile and click "Add to Watchlist" to start tracking people
              </p>
            </>
          ) : (
            <>
              <Building2 size={48} color="#0077B5" strokeWidth={1.5} />
              <h3
                style={{
                  fontSize: '18px',
                  fontWeight: '600',
                  margin: '16px 0 8px 0',
                  color: '#1d1d1f',
                }}
              >
                No companies saved yet
              </h3>
              <p
                style={{
                  fontSize: '14px',
                  color: '#6e6e73',
                  margin: 0,
                  maxWidth: '280px',
                }}
              >
                Visit a LinkedIn company page and click "Add to Watchlist" to start tracking companies and job openings
              </p>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        overflow: 'auto',
      }}
    >
      {/* Tab Switcher */}
      <TabSwitcher
        activeView={activeView}
        onViewChange={setActiveView}
        pathCount={connectionPaths.length}
        peopleCount={watchlist.length}
        companyCount={companyWatchlist.length}
        panelWidth={panelWidth}
      />

      {/* List */}
      <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {activeView === 'network' ? (
          connectionPaths.map((path) => (
            <PathCard
              key={path.id}
              path={path}
              onRemove={() => handleRemovePath(path.id, path.targetName)}
              onViewProfile={() => handleViewProfile(path.targetProfileUrl)}
              onMarkStepConnected={handleMarkStepConnected}
              isRemoving={removingId === path.id}
            />
          ))
        ) : activeView === 'people' ? (
          watchlist.map((person) => (
            <PersonCard
              key={person.id}
              person={person}
              onRemove={() => handleRemovePerson(person.id, person.name)}
              onViewProfile={() => handleViewProfile(person.profileUrl)}
              isRemoving={removingId === person.id}
            />
          ))
        ) : (
          companyWatchlist.map((company) => (
            <CompanyCard
              key={company.id}
              company={company}
              onRemove={() => handleRemoveCompany(company.id, company.name)}
              onViewCompany={() => handleViewProfile(company.companyUrl)}
              onToggleJobAlerts={() => handleToggleJobAlerts(company)}
              isRemoving={removingId === company.id}
            />
          ))
        )}
      </div>
    </div>
  );
}

// Person Card Component
interface PersonCardProps {
  person: WatchlistPerson;
  onRemove: () => void;
  onViewProfile: () => void;
  isRemoving: boolean;
}

function PersonCard({ person, onRemove, onViewProfile, isRemoving }: PersonCardProps) {
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
        {/* Profile Image or Fallback */}
        {person.profileImage ? (
          <img
            src={person.profileImage}
            alt={person.name}
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              objectFit: 'cover',
              border: '2px solid rgba(0, 119, 181, 0.2)',
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
              borderRadius: '50%',
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
            <User size={24} strokeWidth={2} />
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
            {person.name}
          </h3>
          {person.headline && (
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
              <span style={{ flex: 1 }}>{person.headline}</span>
            </p>
          )}

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
            <button
              onClick={onViewProfile}
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
              View Profile
            </button>

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

// Tab Switcher Component
interface TabSwitcherProps {
  activeView: WatchlistView;
  onViewChange: (view: WatchlistView) => void;
  pathCount: number;
  peopleCount: number;
  companyCount: number;
  panelWidth?: number;
}

function TabSwitcher({ activeView, onViewChange, pathCount, peopleCount, companyCount, panelWidth = 400 }: TabSwitcherProps) {
  // Responsive sizing based on panel width
  const isNarrow = panelWidth < 360;
  const isCompact = panelWidth < 400;
  const showIcons = !isNarrow;
  const fontSize = isNarrow ? '12px' : '14px';
  const padding = isNarrow ? '8px 12px' : isCompact ? '9px 14px' : '10px 16px';
  const gap = isNarrow ? '4px' : '8px';
  const iconSize = isNarrow ? 14 : 16;
  return (
    <div
      style={{
        padding: '16px',
        borderBottom: '1px solid rgba(0, 0, 0, 0.08)',
        backgroundColor: 'rgba(255, 149, 0, 0.03)',
      }}
    >
      <div style={{ display: 'flex', gap }}>
        <button
          onClick={() => onViewChange('network')}
          style={{
            flex: 1,
            padding,
            backgroundColor: activeView === 'network' ? '#0077B5' : 'transparent',
            color: activeView === 'network' ? '#FFFFFF' : '#6e6e73',
            border: activeView === 'network' ? 'none' : '1px solid rgba(0, 0, 0, 0.12)',
            borderRadius: '8px',
            fontSize,
            fontWeight: '600',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            transition: 'all 150ms',
          }}
          onMouseEnter={(e) => {
            if (activeView !== 'network') {
              e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.04)';
            }
          }}
          onMouseLeave={(e) => {
            if (activeView !== 'network') {
              e.currentTarget.style.backgroundColor = 'transparent';
            }
          }}
        >
          {showIcons && <GitBranch size={iconSize} strokeWidth={2} />}
          Network
          {pathCount > 0 && (
            <span
              style={{
                padding: '2px 6px',
                backgroundColor: activeView === 'network' ? 'rgba(255, 255, 255, 0.25)' : 'rgba(0, 0, 0, 0.08)',
                borderRadius: '10px',
                fontSize: '12px',
                fontWeight: '700',
              }}
            >
              {pathCount}
            </span>
          )}
        </button>

        <button
          onClick={() => onViewChange('people')}
          style={{
            flex: 1,
            padding,
            backgroundColor: activeView === 'people' ? '#0077B5' : 'transparent',
            color: activeView === 'people' ? '#FFFFFF' : '#6e6e73',
            border: activeView === 'people' ? 'none' : '1px solid rgba(0, 0, 0, 0.12)',
            borderRadius: '8px',
            fontSize,
            fontWeight: '600',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            transition: 'all 150ms',
          }}
          onMouseEnter={(e) => {
            if (activeView !== 'people') {
              e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.04)';
            }
          }}
          onMouseLeave={(e) => {
            if (activeView !== 'people') {
              e.currentTarget.style.backgroundColor = 'transparent';
            }
          }}
        >
          {showIcons && <User size={iconSize} strokeWidth={2} />}
          People
          {peopleCount > 0 && (
            <span
              style={{
                padding: '2px 6px',
                backgroundColor: activeView === 'people' ? 'rgba(255, 255, 255, 0.25)' : 'rgba(0, 0, 0, 0.08)',
                borderRadius: '10px',
                fontSize: '12px',
                fontWeight: '700',
              }}
            >
              {peopleCount}
            </span>
          )}
        </button>

        <button
          onClick={() => onViewChange('companies')}
          style={{
            flex: 1,
            padding,
            backgroundColor: activeView === 'companies' ? '#0077B5' : 'transparent',
            color: activeView === 'companies' ? '#FFFFFF' : '#6e6e73',
            border: activeView === 'companies' ? 'none' : '1px solid rgba(0, 0, 0, 0.12)',
            borderRadius: '8px',
            fontSize,
            fontWeight: '600',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            transition: 'all 150ms',
          }}
          onMouseEnter={(e) => {
            if (activeView !== 'companies') {
              e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.04)';
            }
          }}
          onMouseLeave={(e) => {
            if (activeView !== 'companies') {
              e.currentTarget.style.backgroundColor = 'transparent';
            }
          }}
        >
          {showIcons && <Building2 size={iconSize} strokeWidth={2} />}
          Companies
          {companyCount > 0 && (
            <span
              style={{
                padding: '2px 6px',
                backgroundColor: activeView === 'companies' ? 'rgba(255, 255, 255, 0.25)' : 'rgba(0, 0, 0, 0.08)',
                borderRadius: '10px',
                fontSize: '12px',
                fontWeight: '700',
              }}
            >
              {companyCount}
            </span>
          )}
        </button>
      </div>
    </div>
  );
}

// Company Card Component
interface CompanyCardProps {
  company: WatchlistCompany;
  onRemove: () => void;
  onViewCompany: () => void;
  onToggleJobAlerts: () => void;
  isRemoving: boolean;
}

function CompanyCard({ company, onRemove, onViewCompany, onToggleJobAlerts, isRemoving }: CompanyCardProps) {
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

// Path Card Component
interface PathCardProps {
  path: ConnectionPath;
  onRemove: () => void;
  onViewProfile: () => void;
  onMarkStepConnected: (pathId: string, stepIndex: number) => void;
  isRemoving: boolean;
}

function PathCard({ path, onRemove, onViewProfile, onMarkStepConnected, isRemoving }: PathCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const progressPercentage = path.totalSteps > 0 ? (path.completedSteps / path.totalSteps) * 100 : 0;

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
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '12px' }}>
        {/* Target Profile Image or Fallback */}
        {path.targetProfileImage ? (
          <img
            src={path.targetProfileImage}
            alt={path.targetName}
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              objectFit: 'cover',
              border: '2px solid rgba(0, 119, 181, 0.2)',
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
              borderRadius: '50%',
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
            <User size={24} strokeWidth={2} />
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
            {path.targetName}
          </h3>
          {path.targetHeadline && (
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
              <span style={{ flex: 1 }}>{path.targetHeadline}</span>
            </p>
          )}

          {/* Progress */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <div
              style={{
                flex: 1,
                height: '6px',
                backgroundColor: 'rgba(0, 0, 0, 0.08)',
                borderRadius: '3px',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  width: `${progressPercentage}%`,
                  height: '100%',
                  backgroundColor: path.isComplete ? '#30D158' : '#0077B5',
                  transition: 'width 300ms',
                }}
              />
            </div>
            <span style={{ fontSize: '12px', fontWeight: '600', color: '#6e6e73', minWidth: '60px', textAlign: 'right' }}>
              {path.completedSteps}/{path.totalSteps} steps
            </span>
          </div>

          {/* Status Badge */}
          {path.isComplete && (
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                padding: '4px 8px',
                backgroundColor: 'rgba(48, 209, 88, 0.1)',
                borderRadius: '6px',
                fontSize: '12px',
                color: '#30D158',
                fontWeight: '600',
                marginBottom: '12px',
              }}
            >
              <CheckCircle2 size={12} />
              Path Complete!
            </div>
          )}
        </div>
      </div>

      {/* Connection Steps */}
      <div style={{ marginBottom: '12px', paddingLeft: '12px', borderLeft: '2px solid rgba(0, 119, 181, 0.2)' }}>
        {path.path.map((step, index) => (
          <div
            key={index}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 0',
              opacity: step.connected ? 0.6 : 1,
            }}
          >
            <button
              onClick={() => onMarkStepConnected(path.id, index)}
              disabled={step.connected}
              style={{
                width: '20px',
                height: '20px',
                borderRadius: '50%',
                border: step.connected ? 'none' : '2px solid rgba(0, 119, 181, 0.4)',
                backgroundColor: step.connected ? '#30D158' : 'transparent',
                color: 'white',
                cursor: step.connected ? 'default' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 0,
                transition: 'all 150ms',
                flexShrink: 0,
              }}
              onMouseEnter={(e) => {
                if (!step.connected) {
                  e.currentTarget.style.backgroundColor = 'rgba(0, 119, 181, 0.1)';
                }
              }}
              onMouseLeave={(e) => {
                if (!step.connected) {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }
              }}
            >
              {step.connected ? <CheckCircle2 size={12} /> : <Circle size={12} />}
            </button>
            <span style={{ fontSize: '13px', color: step.connected ? '#6e6e73' : '#1d1d1f' }}>
              {step.name}
            </span>
            {step.connected && (
              <span style={{ fontSize: '11px', color: '#30D158', marginLeft: 'auto' }}>✓ Connected</span>
            )}
          </div>
        ))}
      </div>

      {/* Action Buttons */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        <button
          onClick={onViewProfile}
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
          View Profile
        </button>

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
  );
}
