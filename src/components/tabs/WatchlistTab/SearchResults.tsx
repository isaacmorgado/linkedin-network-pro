/**
 * Search Results Component
 * Displays ranked search results with action buttons
 */

import { useState } from 'react';
import { User, Briefcase, ExternalLink, GitBranch, MessageSquare, Loader2 } from 'lucide-react';
import type { SearchResult } from '../../../services/universal-connection/universal-connection-types';

interface SearchResultsProps {
  results: SearchResult[];
  onFindPath: (result: SearchResult) => void;
  onGenerateMessage: (result: SearchResult) => void;
  onViewProfile?: (result: SearchResult) => void;
  isLoading?: boolean;
}

export function SearchResults({ results, onFindPath, onGenerateMessage, onViewProfile, isLoading = false }: SearchResultsProps) {
  const [actioningId, setActioningId] = useState<string | null>(null);

  const handleFindPath = async (result: SearchResult) => {
    setActioningId(result.profile.id);
    try {
      await onFindPath(result);
    } finally {
      setActioningId(null);
    }
  };

  const handleGenerateMessage = async (result: SearchResult) => {
    setActioningId(`msg-${result.profile.id}`);
    try {
      await onGenerateMessage(result);
    } finally {
      setActioningId(null);
    }
  };

  const handleViewProfile = (result: SearchResult) => {
    if (onViewProfile) {
      onViewProfile(result);
    } else if (result.profile.profileUrl) {
      window.open(result.profile.profileUrl, '_blank');
    }
  };

  // Get connection degree badge
  const getDegreeBadge = (degree: number) => {
    const colors = {
      1: { bg: 'rgba(16, 185, 129, 0.1)', text: '#10B981', label: '1st' },
      2: { bg: 'rgba(59, 130, 246, 0.1)', text: '#3B82F6', label: '2nd' },
      3: { bg: 'rgba(245, 158, 11, 0.1)', text: '#F59E0B', label: '3rd' },
    };

    const badge = colors[degree as keyof typeof colors] || colors[3];

    return (
      <span
        style={{
          padding: '4px 8px',
          backgroundColor: badge.bg,
          color: badge.text,
          borderRadius: '6px',
          fontSize: '11px',
          fontWeight: '700',
        }}
      >
        {badge.label}
      </span>
    );
  };

  // Get match score stars
  const getMatchScore = (score: number) => {
    const percentage = Math.round(score * 100);
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          fontSize: '12px',
          color: '#6e6e73',
        }}
      >
        <span style={{ fontWeight: '600' }}>{percentage}%</span>
        <span>match</span>
      </div>
    );
  };

  // Loading state
  if (isLoading) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '60px 20px',
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
          Searching your network...
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

  // Empty state
  if (results.length === 0) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '60px 20px',
          textAlign: 'center',
        }}
      >
        <User size={48} color="#0077B5" strokeWidth={1.5} />
        <h3
          style={{
            fontSize: '18px',
            fontWeight: '600',
            margin: '16px 0 8px 0',
            color: '#1d1d1f',
          }}
        >
          No results found
        </h3>
        <p
          style={{
            fontSize: '14px',
            color: '#6e6e73',
            margin: 0,
            maxWidth: '280px',
          }}
        >
          Try a different search or explore your network
        </p>
      </div>
    );
  }

  // Results list
  return (
    <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {/* Results Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingBottom: '8px',
        }}
      >
        <p
          style={{
            fontSize: '13px',
            color: '#6e6e73',
            margin: 0,
          }}
        >
          Found {results.length} {results.length === 1 ? 'result' : 'results'}
        </p>
      </div>

      {/* Result Cards */}
      {results.map((result) => (
        <ResultCard
          key={result.profile.id}
          result={result}
          onFindPath={() => handleFindPath(result)}
          onGenerateMessage={() => handleGenerateMessage(result)}
          onViewProfile={() => handleViewProfile(result)}
          getDegreeBadge={getDegreeBadge}
          getMatchScore={getMatchScore}
          isActioning={actioningId === result.profile.id || actioningId === `msg-${result.profile.id}`}
        />
      ))}
    </div>
  );
}

interface ResultCardProps {
  result: SearchResult;
  onFindPath: () => void;
  onGenerateMessage: () => void;
  onViewProfile: () => void;
  getDegreeBadge: (degree: number) => JSX.Element;
  getMatchScore: (score: number) => JSX.Element;
  isActioning: boolean;
}

function ResultCard({ result, onFindPath, onGenerateMessage, onViewProfile, getDegreeBadge, getMatchScore, isActioning }: ResultCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const { profile, matchScore } = result;

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
        {/* Profile Image or Avatar */}
        {profile.profileImage ? (
          <img
            src={profile.profileImage}
            alt={profile.name}
            style={{
              width: '56px',
              height: '56px',
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
              width: '56px',
              height: '56px',
              borderRadius: '50%',
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
            <User size={28} strokeWidth={2} />
          </div>
        )}

        {/* Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
            <h3
              style={{
                fontSize: '15px',
                fontWeight: '600',
                margin: 0,
                color: '#1d1d1f',
                wordBreak: 'break-word',
              }}
            >
              {profile.name}
            </h3>
            {profile.connectionDegree && getDegreeBadge(profile.connectionDegree)}
            {getMatchScore(matchScore)}
          </div>

          {profile.headline && (
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
              }}
            >
              <Briefcase size={12} style={{ marginTop: '2px', flexShrink: 0 }} />
              <span style={{ flex: 1 }}>{profile.headline}</span>
            </p>
          )}

          {result.reasoning && (
            <p
              style={{
                fontSize: '12px',
                color: '#6e6e73',
                margin: '0 0 12px 0',
                fontStyle: 'italic',
              }}
            >
              {result.reasoning}
            </p>
          )}

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '8px', marginTop: '12px', flexWrap: 'wrap' }}>
            <button
              onClick={onViewProfile}
              style={{
                padding: '6px 12px',
                backgroundColor: 'rgba(0, 119, 181, 0.1)',
                color: '#0077B5',
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
                e.currentTarget.style.backgroundColor = 'rgba(0, 119, 181, 0.15)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(0, 119, 181, 0.1)';
              }}
            >
              <ExternalLink size={12} />
              View
            </button>

            {result.pathAvailable && (
              <button
                onClick={onFindPath}
                disabled={isActioning}
                style={{
                  padding: '6px 12px',
                  backgroundColor: '#0077B5',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: '600',
                  cursor: isActioning ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 150ms',
                  opacity: isActioning ? 0.6 : 1,
                }}
                onMouseEnter={(e) => {
                  if (!isActioning) {
                    e.currentTarget.style.backgroundColor = '#006399';
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#0077B5';
                }}
              >
                <GitBranch size={12} />
                Find Path
              </button>
            )}

            <button
              onClick={onGenerateMessage}
              disabled={isActioning}
              style={{
                padding: '6px 12px',
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                color: '#10B981',
                border: 'none',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: '600',
                cursor: isActioning ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 150ms',
                opacity: isActioning ? 0.6 : 1,
              }}
              onMouseEnter={(e) => {
                if (!isActioning) {
                  e.currentTarget.style.backgroundColor = 'rgba(16, 185, 129, 0.15)';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(16, 185, 129, 0.1)';
              }}
            >
              <MessageSquare size={12} />
              Message
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
