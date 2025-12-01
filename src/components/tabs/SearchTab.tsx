/**
 * Search Tab
 * Universal network search - AI-powered profile search
 */

import { useState } from 'react';
import { Search } from 'lucide-react';
import { UniversalSearch } from './WatchlistTab/UniversalSearch';
import { SearchResults } from './WatchlistTab/SearchResults';
import { ConnectionPathView } from './WatchlistTab/ConnectionPathView';
import { MessageComposer } from './WatchlistTab/MessageComposer';
import { apiClient } from '../../services/api';
import type { SearchResult, EnhancedConnectionRoute } from '../../services/universal-connection/universal-connection-types';

interface SearchTabProps {
  panelWidth?: number;
}

export function SearchTab({ panelWidth: _panelWidth }: SearchTabProps) {
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

  // Search handlers
  const handleSearchResults = (results: SearchResult[]) => {
    setSearchResults(results);
    setSearchError(null);
  };

  const handleSearchError = (error: Error) => {
    console.error('[SearchTab] Search error:', error);
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
      console.error('[SearchTab] Failed to find path:', error);
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
      console.error('[SearchTab] Failed to generate message:', error);
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
      console.error('[SearchTab] Failed to generate message:', error);
      setSearchError('Failed to generate message');
    } finally {
      setIsSearching(false);
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
      {/* Search Input */}
      <UniversalSearch onSearchResults={handleSearchResults} onError={handleSearchError} />

      {/* Search Results */}
      {searchResults.length > 0 ? (
        <SearchResults
          results={searchResults}
          onFindPath={handleFindPath}
          onGenerateMessage={handleGenerateMessage}
          isLoading={isSearching}
        />
      ) : (
        /* Empty State */
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
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              backgroundColor: 'rgba(0, 119, 181, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '16px',
            }}
          >
            <Search size={32} color="#0077B5" strokeWidth={1.5} />
          </div>
          <h3
            style={{
              fontSize: '18px',
              fontWeight: '600',
              margin: '0 0 8px 0',
              color: '#1d1d1f',
            }}
          >
            Search your network
          </h3>
          <p
            style={{
              fontSize: '14px',
              color: '#6e6e73',
              margin: 0,
              maxWidth: '280px',
            }}
          >
            Use natural language to find people, companies, and connections in your LinkedIn network
          </p>
        </div>
      )}

      {/* Error Message */}
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
