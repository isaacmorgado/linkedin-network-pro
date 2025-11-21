/**
 * Profile Actions Tab
 * Shown only on LinkedIn person profile pages
 *
 * Features:
 * 1. Find Best Route - Calculate shortest connection path
 * 2. Generate Connection Message - AI-powered personalized intro
 * 3. Add to Watchlist - Save person for tracking
 */

import React, { useState } from 'react';
import { GitBranch, MessageSquare, BookmarkPlus, User, Briefcase, Loader2 } from 'lucide-react';
import { usePageContext } from '../../hooks/usePageContext';
import { useWatchlist } from '../../hooks/useWatchlist';
import { NetworkGraph, findConnectionRoute } from '../../lib/graph';
import type { ConnectionRoute } from '../../types';
import { RouteResultCard } from '../shared/RouteResultCard';

interface ProfileTabProps {
  panelWidth?: number;
}

export function ProfileTab({ panelWidth = 400 }: ProfileTabProps) {
  const pageContext = usePageContext();
  const { addPerson, addPath } = useWatchlist();
  const [isLoadingRoute, setIsLoadingRoute] = useState(false);
  const [isLoadingMessage, setIsLoadingMessage] = useState(false);
  const [isAddingToWatchlist, setIsAddingToWatchlist] = useState(false);
  const [isSavingPath, setIsSavingPath] = useState(false);
  const [routeResult, setRouteResult] = useState<ConnectionRoute | null>(null);
  const [routeError, setRouteError] = useState<string | null>(null);

  // Extract profile data from context
  const profileData = pageContext.profileData;
  const name = profileData?.name || 'Unknown Person';
  const headline = profileData?.headline || '';
  const profileImage = profileData?.profileImage;

  const handleFindRoute = async () => {
    if (!profileData) {
      console.error('[Uproot] No profile data available');
      return;
    }

    setIsLoadingRoute(true);
    setRouteError(null);
    setRouteResult(null);

    try {
      // For demo purposes, we'll create a sample network graph
      // In production, this would come from:
      // 1. User's actual LinkedIn connections
      // 2. Scraped network data
      // 3. Backend API with network graph

      const currentUserId = 'current-user'; // In production: from auth
      const targetUserId = profileData.profileUrl;

      // Create sample network for demonstration
      // In production: Load from storage or API
      const graph = new NetworkGraph();

      // Add current user
      graph.addNode({
        id: currentUserId,
        profile: {
          name: 'You',
          headline: 'Your current role',
          profileUrl: currentUserId,
        } as any,
        status: 'connected' as any,
        degree: 0,
        matchScore: 100,
      });

      // Add target person
      graph.addNode({
        id: targetUserId,
        profile: {
          name: profileData.name,
          headline: profileData.headline || '',
          profileUrl: targetUserId,
        } as any,
        status: 'not_contacted' as any,
        degree: 2, // Example: 2nd degree connection
        matchScore: 85,
      });

      // Add intermediate connections (sample data)
      const intermediateId = `connection-1-${Date.now()}`;
      graph.addNode({
        id: intermediateId,
        profile: {
          name: 'Mutual Connection',
          headline: 'Connector role',
          profileUrl: intermediateId,
        } as any,
        status: 'connected' as any,
        degree: 1,
        matchScore: 92,
      });

      // Add edges (connections)
      graph.addEdge({
        from: currentUserId,
        to: intermediateId,
        weight: 0.3, // Strong connection
        relationshipType: 'mutual',
      });

      graph.addEdge({
        from: intermediateId,
        to: targetUserId,
        weight: 0.5, // Medium connection
        relationshipType: 'colleague',
      });

      // Find the path
      const route = graph.findWeightedPath(currentUserId, targetUserId);

      if (route) {
        setRouteResult(route);
        console.log('[Uproot] Found connection route:', route);
      } else {
        setRouteError('No connection path found. Try expanding your network!');
        console.log('[Uproot] No route found to', name);
      }
    } catch (error) {
      console.error('[Uproot] Error finding route:', error);
      setRouteError('Failed to calculate connection path. Please try again.');
    } finally {
      setIsLoadingRoute(false);
    }
  };

  const handleSavePathToWatchlist = async () => {
    if (!routeResult || !profileData) {
      console.error('[Uproot] No route result or profile data');
      return;
    }

    setIsSavingPath(true);
    try {
      // Convert ConnectionRoute to watchlist ConnectionPath format
      await addPath({
        targetName: profileData.name,
        targetProfileUrl: profileData.profileUrl,
        targetProfileImage: profileData.profileImage,
        targetHeadline: profileData.headline,
        path: routeResult.nodes.slice(1).map((node, index) => ({
          name: node.profile.name || 'Connection',
          profileUrl: node.profile.profileUrl || node.id,
          profileImage: node.profile.profileImage,
          degree: node.degree,
          connected: false,
        })),
        totalSteps: routeResult.nodes.length - 1,
        completedSteps: 0,
        isComplete: false,
      });

      console.log('[Uproot] Saved connection path to watchlist');
      // Optionally: Show success message or close the result card
    } catch (error) {
      console.error('[Uproot] Failed to save path to watchlist:', error);
    } finally {
      setIsSavingPath(false);
    }
  };

  const handleGenerateMessage = async () => {
    setIsLoadingMessage(true);
    // TODO: Implement AI message generation
    setTimeout(() => {
      setIsLoadingMessage(false);
      console.log('Generating message for', name);
    }, 2000);
  };

  const handleAddToWatchlist = async () => {
    if (!profileData) {
      console.error('[Uproot] No profile data available');
      return;
    }

    setIsAddingToWatchlist(true);
    try {
      await addPerson({
        name,
        headline,
        profileUrl: profileData.profileUrl,
        profileImage,
      });

      console.log('[Uproot] Added to watchlist:', name);
    } catch (error) {
      console.error('[Uproot] Failed to add to watchlist:', error);
    } finally {
      setIsAddingToWatchlist(false);
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
      {/* Profile Header */}
      <div
        style={{
          padding: '20px',
          borderBottom: '1px solid rgba(0, 0, 0, 0.08)',
          backgroundColor: 'rgba(0, 119, 181, 0.03)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '8px' }}>
          {/* Profile Image or Fallback Icon */}
          {profileImage ? (
            <img
              src={profileImage}
              alt={name}
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                objectFit: 'cover',
                border: '2px solid rgba(0, 119, 181, 0.2)',
                flexShrink: 0,
              }}
              onError={(e) => {
                // If image fails to load, hide it and show fallback
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
            {headline && (
              <p
                style={{
                  fontSize: '13px',
                  color: '#6e6e73',
                  margin: 0,
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '6px',
                  lineHeight: '1.4',
                  wordBreak: 'break-word',
                  whiteSpace: 'normal',
                }}
              >
                <Briefcase size={14} style={{ marginTop: '2px', flexShrink: 0 }} />
                <span style={{ flex: 1 }}>{headline}</span>
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
        {/* Find Best Route Card */}
        <ActionCard
          icon={GitBranch}
          title="Find Best Route"
          description="See the shortest connection path to reach this person"
          buttonText={isLoadingRoute ? 'Finding...' : 'Calculate Route'}
          buttonColor="#0077B5"
          isLoading={isLoadingRoute}
          onClick={handleFindRoute}
        />

        {/* Generate Connection Message Card */}
        <ActionCard
          icon={MessageSquare}
          title="Generate Connection Message"
          description="AI-powered personalized introduction message"
          buttonText={isLoadingMessage ? 'Generating...' : 'Generate Message'}
          buttonColor="#30D158"
          isLoading={isLoadingMessage}
          onClick={handleGenerateMessage}
        />

        {/* Add to Watchlist Card */}
        <ActionCard
          icon={BookmarkPlus}
          title="Add to Watchlist"
          description="Track this person's activity and connection status"
          buttonText={isAddingToWatchlist ? 'Adding...' : 'Add to Watchlist'}
          buttonColor="#FF9500"
          isLoading={isAddingToWatchlist}
          onClick={handleAddToWatchlist}
        />

        {/* Route Result Display */}
        {routeResult && (
          <RouteResultCard
            route={routeResult}
            onSaveToWatchlist={handleSavePathToWatchlist}
            onClose={() => setRouteResult(null)}
            isSaving={isSavingPath}
          />
        )}

        {/* Error Message */}
        {routeError && (
          <div
            style={{
              padding: '16px',
              backgroundColor: '#FFEBEE',
              border: '1px solid #FFCDD2',
              borderRadius: '12px',
              marginTop: '12px',
            }}
          >
            <p
              style={{
                fontSize: '13px',
                color: '#C62828',
                margin: 0,
              }}
            >
              ❌ {routeError}
            </p>
          </div>
        )}
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
          💡 Tip: Use Alt+6 to quickly access Profile Actions
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
