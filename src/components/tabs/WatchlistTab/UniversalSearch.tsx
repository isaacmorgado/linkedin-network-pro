/**
 * Universal Search Component
 * Natural language search input for network exploration
 */

import { useState, useRef, useEffect } from 'react';
import { Search, Loader2, X } from 'lucide-react';
import { chatAgent } from '../../../services/universal-connection/chat';
import type { SearchResult } from '../../../services/universal-connection/universal-connection-types';

interface UniversalSearchProps {
  onSearchResults: (results: SearchResult[]) => void;
  onError?: (error: Error) => void;
}

export function UniversalSearch({ onSearchResults, onError }: UniversalSearchProps) {
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSearch = async (searchQuery: string) => {
    if (!searchQuery.trim() || isSearching) return;

    setIsSearching(true);

    try {
      const response = await chatAgent.chat(searchQuery);

      // Extract search results from metadata and convert format
      const rawResults = response.metadata?.searchResults || [];
      // Convert from chat SearchResult to universal-connection SearchResult
      const results = rawResults.map((r: any) => ({
        profile: {
          id: r.profileId,
          name: r.name,
          headline: r.headline,
          profileUrl: r.profileId,
          company: r.company,
          role: r.role,
          connectionDegree: r.connectionDegree,
        },
        matchScore: r.matchScore,
        reasoning: r.reasoning,
        pathAvailable: r.pathAvailable,
      }));
      onSearchResults(results);
    } catch (error) {
      console.error('[UniversalSearch] Search failed:', error);
      if (onError) {
        onError(error as Error);
      }
    } finally {
      setIsSearching(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSearch(query);
  };

  const handleClear = () => {
    setQuery('');
    inputRef.current?.focus();
  };

  return (
    <div
      style={{
        padding: '16px',
        borderBottom: '1px solid rgba(0, 0, 0, 0.08)',
      }}
    >
      <form onSubmit={handleSubmit} style={{ position: 'relative' }}>
        <div
          style={{
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          {/* Search Icon */}
          <div
            style={{
              position: 'absolute',
              left: '12px',
              display: 'flex',
              alignItems: 'center',
              pointerEvents: 'none',
            }}
          >
            {isSearching ? (
              <Loader2
                size={18}
                color="#0077B5"
                style={{
                  animation: 'spin 1s linear infinite',
                }}
              />
            ) : (
              <Search size={18} color="#6e6e73" />
            )}
          </div>

          {/* Input Field */}
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search your network..."
            disabled={isSearching}
            style={{
              width: '100%',
              height: '44px',
              padding: '0 44px 0 44px',
              border: '1px solid rgba(0, 0, 0, 0.12)',
              borderRadius: '12px',
              fontSize: '14px',
              backgroundColor: '#FFFFFF',
              transition: 'all 150ms',
              outline: 'none',
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

          {/* Clear Button */}
          {query && !isSearching && (
            <button
              type="button"
              onClick={handleClear}
              style={{
                position: 'absolute',
                right: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '24px',
                height: '24px',
                border: 'none',
                borderRadius: '50%',
                backgroundColor: 'transparent',
                cursor: 'pointer',
                transition: 'background-color 150ms',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.05)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              <X size={16} color="#6e6e73" />
            </button>
          )}

          {/* Spinner Animation */}
          <style>
            {`
              @keyframes spin {
                from { transform: rotate(0deg); }
                to { transform: rotate(360deg); }
              }
            `}
          </style>
        </div>
      </form>

      {/* Helper Text */}
      <p
        style={{
          fontSize: '12px',
          color: '#6e6e73',
          margin: '8px 0 0 0',
          paddingLeft: '4px',
        }}
      >
        Try: "Find ML engineers at Google" or "Who works in AI Ethics?"
      </p>
    </div>
  );
}
