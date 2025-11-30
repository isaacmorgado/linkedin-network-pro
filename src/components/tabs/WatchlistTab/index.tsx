/**
 * Watchlist Tab
 * Shows saved connection paths, people, and companies for tracking
 */

import { useState } from 'react';
import { User, Loader2, Building2, GitBranch } from 'lucide-react';
import { useWatchlist } from '../../../hooks/useWatchlist';
import { PersonCard } from './PersonCard';
import { CompanyCard } from './CompanyCard';
import { PathCard } from './PathCard';
import { TabSwitcher } from './TabSwitcher';
import { UniversalSearch } from './UniversalSearch';
import { SearchResults } from './SearchResults';
import { ConnectionPathView } from './ConnectionPathView';
import { MessageComposer } from './MessageComposer';
import { CompanyJobPreferences } from './CompanyJobPreferences';
import { apiClient } from '../../../services/api';
import type { WatchlistView } from './types';
import type { SearchResult, EnhancedConnectionRoute } from '../../../services/universal-connection/universal-connection-types';
import type { WatchlistCompany } from '../../../types/watchlist';

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
  const [editingPreferencesId, setEditingPreferencesId] = useState<string | null>(null);

  // Search state
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedPath, setSelectedPath] = useState<EnhancedConnectionRoute | null>(null);
  const [generatedMessage, setGeneratedMessage] = useState<{
    message: string;
    alternatives: string[];
    reasoning: string[];
  } | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);

  const handleRemovePerson = async (id: string, name: string) => {
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

  const handleToggleJobAlerts = async (company: any) => {
    try {
      await updateCompany(company.id, {
        jobAlertEnabled: !company.jobAlertEnabled,
      });
      console.log('[Uproot] Toggled job alerts for:', company.name, !company.jobAlertEnabled);
    } catch (error) {
      console.error('[Uproot] Failed to toggle job alerts:', error);
    }
  };

  const handleSavePreferences = async (
    companyId: string,
    preferences: WatchlistCompany['jobPreferences'] | null
  ) => {
    try {
      await updateCompany(companyId, {
        jobPreferences: preferences || undefined,
      });
      console.log('[Uproot] Updated job preferences for company:', companyId);
      setEditingPreferencesId(null);
    } catch (error) {
      console.error('[Uproot] Failed to update job preferences:', error);
    }
  };

  const handleRemovePath = async (id: string, name: string) => {
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

  // Search handlers
  const handleSearchResults = (results: SearchResult[]) => {
    setSearchResults(results);
    setSearchError(null);
    setActiveView('search');
  };

  const handleSearchError = (error: Error) => {
    console.error('[WatchlistTab] Search error:', error);
    setSearchError(error.message || 'Failed to search network');
  };

  const handleFindPath = async (result: SearchResult) => {
    try {
      setIsSearching(true);
      // TODO: Get current user ID from storage
      const userId = 'current-user-id'; // Replace with actual user ID

      const route = await apiClient.findPath({
        userId,
        sourceProfileId: userId,
        targetProfileId: result.profile.id,
      });

      setSelectedPath(route);
    } catch (error) {
      console.error('[WatchlistTab] Failed to find path:', error);
      setSearchError('Failed to find connection path');
    } finally {
      setIsSearching(false);
    }
  };

  const handleGenerateMessage = async (result: SearchResult) => {
    try {
      setIsSearching(true);
      // TODO: Get current user profile from storage
      const userId = 'current-user-id';
      const currentUserProfile = {
        id: userId,
        name: 'Current User',
        // Add other profile fields
      };

      const response = await apiClient.generateMessage({
        userId,
        targetProfile: result.profile,
        sourceProfile: currentUserProfile as any,
        context: {
          purpose: 'networking',
        },
        tone: 'professional',
      });

      setGeneratedMessage({
        message: response.message,
        alternatives: response.alternatives || [],
        reasoning: response.reasoning || [],
      });
    } catch (error) {
      console.error('[WatchlistTab] Failed to generate message:', error);
      setSearchError('Failed to generate message');
    } finally {
      setIsSearching(false);
    }
  };

  const handleGenerateMessageFromPath = async () => {
    if (!selectedPath) return;

    try {
      setIsSearching(true);
      const userId = 'current-user-id';
      const currentUserProfile = {
        id: userId,
        name: 'Current User',
      };

      const targetProfile = selectedPath.path[selectedPath.path.length - 1];

      const response = await apiClient.generateMessage({
        userId,
        targetProfile,
        sourceProfile: currentUserProfile as any,
        context: {
          purpose: 'networking',
          pathInfo: selectedPath as any,
        },
        tone: 'professional',
      });

      setGeneratedMessage({
        message: response.message,
        alternatives: response.alternatives || [],
        reasoning: response.reasoning || [],
      });

      // Close path view
      setSelectedPath(null);
    } catch (error) {
      console.error('[WatchlistTab] Failed to generate message:', error);
      setSearchError('Failed to generate message');
    } finally {
      setIsSearching(false);
    }
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

  // Don't show empty state for search view - it has its own UI
  if (isEmpty && activeView !== 'search') {
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
          searchCount={searchResults.length}
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
        searchCount={searchResults.length}
        panelWidth={panelWidth}
      />

      {/* Content by View */}
      {activeView === 'search' ? (
        <>
          <UniversalSearch onSearchResults={handleSearchResults} onError={handleSearchError} />
          <SearchResults
            results={searchResults}
            onFindPath={handleFindPath}
            onGenerateMessage={handleGenerateMessage}
            isLoading={isSearching}
          />
          {searchError && (
            <div
              style={{
                margin: '16px',
                padding: '12px 16px',
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                color: '#EF4444',
                borderRadius: '8px',
                fontSize: '13px',
              }}
            >
              {searchError}
            </div>
          )}
        </>
      ) : (
        /* List */
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
              <div key={company.id}>
                <CompanyCard
                  company={company}
                  onRemove={() => handleRemoveCompany(company.id, company.name)}
                  onViewCompany={() => handleViewProfile(company.companyUrl)}
                  onToggleJobAlerts={() => handleToggleJobAlerts(company)}
                  onEditPreferences={() => setEditingPreferencesId(company.id)}
                  isRemoving={removingId === company.id}
                />
                {editingPreferencesId === company.id && (
                  <CompanyJobPreferences
                    company={company}
                    onSave={(prefs) => handleSavePreferences(company.id, prefs)}
                    onCancel={() => setEditingPreferencesId(null)}
                  />
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* Modals */}
      {selectedPath && (
        <ConnectionPathView
          path={selectedPath}
          onGenerateMessage={handleGenerateMessageFromPath}
          onClose={() => setSelectedPath(null)}
        />
      )}

      {generatedMessage && (
        <MessageComposer
          message={generatedMessage.message}
          alternatives={generatedMessage.alternatives}
          reasoning={generatedMessage.reasoning}
          onClose={() => setGeneratedMessage(null)}
        />
      )}
    </div>
  );
}
