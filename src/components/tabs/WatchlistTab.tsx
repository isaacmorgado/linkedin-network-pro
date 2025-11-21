/**
 * Watchlist Tab
 * Shows saved connection paths, people, and companies for tracking
 */

import { useState, useEffect } from 'react';
import { User, Briefcase, Trash2, ExternalLink, Loader2, Building2, Bell, GitBranch, CheckCircle2, Circle, Network } from 'lucide-react';
import { useWatchlist } from '../../hooks/useWatchlist';
import type { WatchlistPerson, WatchlistCompany, ConnectionPath, SavedNetwork } from '../../types/watchlist';

type WatchlistView = 'network' | 'people' | 'companies' | 'networks';

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
  const [savedNetworks, setSavedNetworks] = useState<SavedNetwork[]>([]);
  const [isLoadingNetworks, setIsLoadingNetworks] = useState(false);

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

  /**
   * Load saved network paths from Chrome storage
   */
  const loadSavedNetworks = async () => {
    setIsLoadingNetworks(true);
    try {
      const data = await chrome.storage.local.get(['savedNetworks']);
      const networks = data.savedNetworks || [];

      // Sort by most recently saved
      networks.sort((a: SavedNetwork, b: SavedNetwork) =>
        new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime()
      );

      setSavedNetworks(networks);
    } catch (error) {
      console.error('[Uproot] Error loading saved networks:', error);
    } finally {
      setIsLoadingNetworks(false);
    }
  };

  /**
   * Remove a saved network from watchlist
   */
  const handleRemoveNetwork = async (networkId: string) => {
    try {
      // Filter out the network to remove
      const updatedNetworks = savedNetworks.filter(n => n.id !== networkId);

      // Update state
      setSavedNetworks(updatedNetworks);

      // Update storage
      await chrome.storage.local.set({ savedNetworks: updatedNetworks });

      console.log('[Uproot] Network removed successfully');
    } catch (error) {
      console.error('[Uproot] Error removing network:', error);
    }
  };

  // Load saved networks on mount
  useEffect(() => {
    loadSavedNetworks();
  }, []);

  // Listen for storage changes for real-time updates
  useEffect(() => {
    const handleStorageChange = (changes: any, areaName: string) => {
      if (areaName === 'local' && changes.savedNetworks) {
        const newNetworks = changes.savedNetworks.newValue || [];
        newNetworks.sort((a: SavedNetwork, b: SavedNetwork) =>
          new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime()
        );
        setSavedNetworks(newNetworks);
      }
    };

    chrome.storage.onChanged.addListener(handleStorageChange);

    return () => {
      chrome.storage.onChanged.removeListener(handleStorageChange);
    };
  }, []);

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

  const currentList = activeView === 'network' ? connectionPaths : activeView === 'people' ? watchlist : activeView === 'companies' ? companyWatchlist : savedNetworks;
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
          networksCount={savedNetworks.length}
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
          ) : activeView === 'networks' ? (
            <>
              <Network size={48} color="#0077B5" strokeWidth={1.5} />
              <h3
                style={{
                  fontSize: '18px',
                  fontWeight: '600',
                  margin: '16px 0 8px 0',
                  color: '#1d1d1f',
                }}
              >
                No saved networks yet
              </h3>
              <p
                style={{
                  fontSize: '14px',
                  color: '#6e6e73',
                  margin: 0,
                  maxWidth: '280px',
                }}
              >
                Visit profiles and click "Find Connection Path" to save network routes
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
        networksCount={savedNetworks.length}
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
        ) : activeView === 'networks' ? (
          savedNetworks.map((network) => (
            <NetworkCard
              key={network.id}
              network={network}
              onRemove={handleRemoveNetwork}
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
  networksCount: number;
  panelWidth?: number;
}

function TabSwitcher({ activeView, onViewChange, pathCount, peopleCount, companyCount, networksCount, panelWidth = 400 }: TabSwitcherProps) {
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

        <button
          onClick={() => onViewChange('networks')}
          style={{
            flex: 1,
            padding,
            backgroundColor: activeView === 'networks' ? '#0077B5' : 'transparent',
            color: activeView === 'networks' ? '#FFFFFF' : '#6e6e73',
            border: activeView === 'networks' ? 'none' : '1px solid rgba(0, 0, 0, 0.12)',
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
            if (activeView !== 'networks') {
              e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.04)';
            }
          }}
          onMouseLeave={(e) => {
            if (activeView !== 'networks') {
              e.currentTarget.style.backgroundColor = 'transparent';
            }
          }}
        >
          {showIcons && <Network size={iconSize} strokeWidth={2} />}
          Networks
          {networksCount > 0 && (
            <span
              style={{
                padding: '2px 6px',
                backgroundColor: activeView === 'networks' ? 'rgba(255, 255, 255, 0.25)' : 'rgba(0, 0, 0, 0.08)',
                borderRadius: '10px',
                fontSize: '12px',
                fontWeight: '700',
              }}
            >
              {networksCount}
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

// Network Card Component
interface NetworkCardProps {
  network: SavedNetwork;
  onRemove: (id: string) => void;
}

/**
 * NetworkCard displays a saved network path with strategy details
 */
function NetworkCard({ network, onRemove }: NetworkCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const formatDate = (isoDate: string) => {
    const date = new Date(isoDate);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getStrategyLabel = (strategy: string) => {
    switch (strategy) {
      case 'mutual': return 'Mutual Connections';
      case 'direct-similarity': return 'High Similarity';
      case 'intermediary': return 'Via Intermediary';
      case 'cold-similarity': return 'Cold Outreach';
      default: return 'Unknown';
    }
  };

  const getStrategyColor = (strategy: string) => {
    switch (strategy) {
      case 'mutual': return '#10B981'; // green
      case 'direct-similarity': return '#3B82F6'; // blue
      case 'intermediary': return '#F59E0B'; // amber
      case 'cold-similarity': return '#EF4444'; // red
      default: return '#6B7280'; // gray
    }
  };

  return (
    <div
      style={{
        padding: '16px',
        backgroundColor: 'white',
        border: '1px solid rgba(0, 0, 0, 0.08)',
        borderRadius: '12px',
        marginBottom: '12px',
        transition: 'all 200ms cubic-bezier(0.4, 0.0, 0.2, 1)',
        cursor: 'pointer',
      }}
      onClick={() => setIsExpanded(!isExpanded)}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {/* Avatar */}
        {network.targetPerson.avatarUrl ? (
          <img
            src={network.targetPerson.avatarUrl}
            alt={network.targetPerson.name}
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              objectFit: 'cover',
              border: '2px solid rgba(0, 119, 181, 0.2)',
              flexShrink: 0,
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
              fontSize: '20px',
              color: '#FFFFFF',
              fontWeight: 'bold',
              flexShrink: 0,
            }}
          >
            {network.targetPerson.name.charAt(0).toUpperCase()}
          </div>
        )}

        {/* Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <h4 style={{ margin: '0 0 4px 0', fontSize: '15px', fontWeight: '600', color: '#1d1d1f' }}>
            {network.targetPerson.name}
          </h4>
          <p style={{ margin: '0', fontSize: '13px', color: '#6e6e73', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {network.targetPerson.headline || 'No headline'}
          </p>
        </div>

        {/* Strategy Badge */}
        <div
          style={{
            padding: '4px 12px',
            backgroundColor: `${getStrategyColor(network.strategy)}20`,
            color: getStrategyColor(network.strategy),
            borderRadius: '12px',
            fontSize: '12px',
            fontWeight: '600',
            flexShrink: 0,
          }}
        >
          {getStrategyLabel(network.strategy)}
        </div>

        {/* Delete Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove(network.id);
          }}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '8px',
            borderRadius: '6px',
            transition: 'background-color 150ms',
            flexShrink: 0,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(255, 59, 48, 0.1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
          }}
        >
          <Trash2 size={16} color="#FF3B30" />
        </button>
      </div>

      {/* Stats Row */}
      <div
        style={{
          display: 'flex',
          gap: '16px',
          marginTop: '12px',
          fontSize: '13px',
          color: '#6e6e73',
        }}
      >
        <div>
          <strong style={{ color: '#1d1d1f' }}>
            {network.targetPerson.degree}
          </strong>{' '}
          degree
        </div>
        <div>
          <strong style={{ color: '#1d1d1f' }}>
            {(network.estimatedAcceptance * 100).toFixed(0)}%
          </strong>{' '}
          acceptance
        </div>
        <div>Saved {formatDate(network.savedAt)}</div>
      </div>

      {/* Expanded Details */}
      {isExpanded && network.path && (
        <div
          style={{
            marginTop: '16px',
            paddingTop: '16px',
            borderTop: '1px solid rgba(0, 0, 0, 0.08)',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {network.path.path ? (
            <div
              style={{
                padding: '12px',
                backgroundColor: '#F9FAFB',
                borderRadius: '6px',
                fontSize: '14px',
                color: '#1d1d1f',
              }}
            >
              <strong>Connection Path:</strong>
              <div style={{ marginTop: '8px' }}>
                {network.path.path.nodes.map((node, i) => (
                  <div key={i} style={{ marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '16px' }}>{i === 0 ? '👤' : i === network.path.path!.nodes.length - 1 ? '🎯' : '🔗'}</span>
                    <span>{node.name || 'Unknown'}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div
              style={{
                padding: '12px',
                backgroundColor: '#F9FAFB',
                borderRadius: '6px',
                fontSize: '14px',
                color: '#1d1d1f',
              }}
            >
              <strong>Strategy:</strong> {network.path.reasoning}
              <div style={{ marginTop: '8px' }}>
                <strong>Next Steps:</strong>
                <ul style={{ margin: '8px 0 0 0', paddingLeft: '20px' }}>
                  {network.path.nextSteps.map((step, i) => (
                    <li key={i} style={{ marginBottom: '4px' }}>
                      {step}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
