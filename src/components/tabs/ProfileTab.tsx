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
import { GitBranch, MessageSquare, BookmarkPlus, User, Briefcase, Loader2, Search } from 'lucide-react';
import { usePageContext } from '../../hooks/usePageContext';
import { useWatchlist } from '../../hooks/useWatchlist';
import { NetworkGraph, findConnectionRoute } from '../../lib/graph';
import type { ConnectionRoute } from '../../types';
import { RouteResultCard } from '../shared/RouteResultCard';
import { findUniversalConnection } from '../../services/universal-connection/universal-pathfinder';
import type { ConnectionStrategy } from '../../services/universal-connection/universal-connection-types';
import type { UserProfile } from '../../types/resume-tailoring';

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

  // Universal pathfinding state
  const [isSearchingPath, setIsSearchingPath] = useState(false);
  const [connectionPath, setConnectionPath] = useState<ConnectionStrategy | null>(null);
  const [pathError, setPathError] = useState<string | null>(null);

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

  const handleSaveOldRouteToWatchlist = async () => {
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
        targetProfileImage: profileData.profileImage || undefined,
        targetHeadline: profileData.headline,
        path: routeResult.nodes.slice(1).map((node, index) => ({
          name: node.profile.name || 'Connection',
          profileUrl: node.profile.id || node.id,
          profileImage: node.profile.avatarUrl,
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

  /**
   * Find connection path to this profile using universal pathfinder
   *
   * Finds the optimal connection path using multi-stage pathfinding:
   * 1. Mutual connections (via A* algorithm)
   * 2. Direct similarity (>65% match)
   * 3. Intermediary matching
   * 4. Cold outreach with personalization
   */
  const handleFindConnectionPath = async () => {
    if (!profileData) {
      setPathError('No profile loaded');
      return;
    }

    setIsSearchingPath(true);
    setPathError(null);
    setConnectionPath(null);

    try {
      // Get current user profile from storage
      const currentUserData = await chrome.storage.local.get(['userProfile']);
      const currentUser = currentUserData.userProfile;

      if (!currentUser) {
        throw new Error('Your profile not found. Please complete your Resume tab first to enable pathfinding.');
      }

      // Initialize network graph
      const networkGraph = new NetworkGraph();

      // Load network data from storage
      const networkData = await chrome.storage.local.get(['networkGraph']);
      if (networkData.networkGraph) {
        networkGraph.import(networkData.networkGraph);
      }

      // Check if graph has data
      if (networkGraph.getAllNodes().length === 0) {
        throw new Error('Network graph not built yet. Visit some LinkedIn profiles to build your network first.');
      }

      // Create adapter for universal pathfinder Graph interface
      const graphAdapter = {
        async getConnections(userId: string): Promise<UserProfile[]> {
          const nodes = networkGraph.getConnections(userId);
          // Convert NetworkNode[] to UserProfile[]
          return nodes.map(node => ({
            name: node.profile.name || 'Unknown',
            email: node.id,
            location: node.profile.location || '',
            title: node.profile.headline || '',
            workExperience: (node.profile.experience || []).map(exp => ({
              id: `${exp.company}-${exp.title}`,
              company: exp.company || '',
              title: exp.title || '',
              startDate: '',
              endDate: '',
              location: exp.location || '',
              description: '',
              industry: '',
              achievements: [],
              skills: [],
              domains: [],
              responsibilities: []
            })),
            education: (node.profile.education || []).map(edu => ({
              id: `${edu.school}-${edu.degree || ''}`,
              school: edu.school || '',
              degree: edu.degree || '',
              field: edu.field || '',
              startDate: '',
              endDate: null
            })),
            projects: [],
            skills: (node.profile.skills || []).map(skill => ({
              name: skill,
              level: 'intermediate' as const,
              yearsOfExperience: 1,
              category: 'Technical'
            })),
            metadata: {
              totalYearsExperience: 0,
              domains: [],
              seniority: 'entry' as const,
              careerStage: 'professional' as const
            }
          }));
        },
        async bidirectionalBFS(sourceId: string, targetId: string) {
          const result = await networkGraph.bidirectionalBFS(sourceId, targetId);
          if (!result) return null;

          // Convert NetworkNode[] to UserProfile[]
          return {
            path: result.path.map(node => ({
              name: node.profile.name || 'Unknown',
              email: node.id,
              location: node.profile.location || '',
              title: node.profile.headline || '',
              workExperience: [],
              education: [],
              projects: [],
              skills: [],
              metadata: {
                totalYearsExperience: 0,
                domains: [],
                seniority: 'entry' as const,
                careerStage: 'professional' as const
              }
            })),
            probability: result.probability,
            mutualConnections: result.mutualConnections
          };
        },
        getNode(nodeId: string) {
          const node = networkGraph.getNode(nodeId);
          if (!node) return null;
          return {
            name: node.profile.name || 'Unknown',
            email: node.id,
            location: node.profile.location || '',
            title: node.profile.headline || '',
            workExperience: [],
            education: [],
            projects: [],
            skills: [],
            metadata: {
              totalYearsExperience: 0,
              domains: [],
              seniority: 'entry' as const,
              careerStage: 'professional' as const
            }
          };
        },
        getMutualConnections(userId1: string, userId2: string) {
          const nodes = networkGraph.getMutualConnections(userId1, userId2);
          return nodes.map(node => ({
            name: node.profile.name || 'Unknown',
            email: node.id,
            location: node.profile.location || '',
            title: node.profile.headline || '',
            workExperience: [],
            education: [],
            projects: [],
            skills: [],
            metadata: {
              totalYearsExperience: 0,
              domains: [],
              seniority: 'entry' as const,
              careerStage: 'professional' as const
            }
          }));
        }
      };

      // Convert profile to UserProfile format expected by pathfinder
      // Note: LinkedIn's basic profileData doesn't include experience/education/skills
      // These would need to be scraped separately for full similarity matching
      const targetProfile: UserProfile = {
        name: profileData.name || 'Unknown',
        email: profileData.profileUrl,
        location: '',
        title: profileData.headline || '',
        workExperience: [],
        education: [],
        projects: [],
        skills: [],
        metadata: {
          totalYearsExperience: 0,
          domains: [],
          seniority: 'entry' as const,
          careerStage: 'professional' as const
        }
      };

      // Find universal connection
      const result = await findUniversalConnection(
        currentUser,
        targetProfile,
        graphAdapter
      );

      if (result) {
        setConnectionPath(result);
        console.log('[Uproot] Found connection strategy:', result.type);
      } else {
        setPathError('No connection path found. Try building your network first.');
      }

    } catch (error) {
      console.error('[Uproot] Pathfinding error:', error);
      setPathError(error instanceof Error ? error.message : 'Failed to find connection path');
    } finally {
      setIsSearchingPath(false);
    }
  };

  /**
   * Save universal connection path to watchlist under "Networks" section
   *
   * Stores the complete connection strategy including:
   * - Target person info
   * - Connection path/strategy
   * - Estimated acceptance rate
   * - Next steps
   */
  const handleSaveUniversalPathToWatchlist = async () => {
    if (!connectionPath || !profileData) return;

    try {
      // Get existing saved networks
      const data = await chrome.storage.local.get(['savedNetworks']);
      const savedNetworks = data.savedNetworks || [];

      // Create new saved network entry
      const newNetwork = {
        id: `network-${Date.now()}`,
        targetPerson: {
          id: profileData.profileUrl || profileData.name,
          name: profileData.name || '',
          headline: profileData.headline || '',
          profileImage: profileData.profileImage || '',
          location: '',
          status: 'target' as const,
          degree: connectionPath.path?.nodes.length || 0,
          matchScore: Math.round((connectionPath.confidence || 0) * 100)
        },
        path: connectionPath,
        savedAt: new Date().toISOString(),
        strategy: connectionPath.type,
        estimatedAcceptance: connectionPath.estimatedAcceptanceRate
      };

      // Add to saved networks
      savedNetworks.push(newNetwork);

      // Save to storage
      await chrome.storage.local.set({ savedNetworks });

      console.log('[Uproot] Path saved to watchlist!');

      // Show success feedback
      setPathError(null);

    } catch (error) {
      console.error('[Uproot] Error saving to watchlist:', error);
      setPathError('Failed to save to watchlist');
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

        {/* Universal Pathfinding Card */}
        <ActionCard
          icon={Search}
          title="Find Connection Path"
          description="Universal pathfinder - works even without mutual connections"
          buttonText={isSearchingPath ? 'Searching...' : 'Find Connection Path'}
          buttonColor="#8E44AD"
          isLoading={isSearchingPath}
          onClick={handleFindConnectionPath}
        />

        {/* Route Result Display */}
        {routeResult && (
          <RouteResultCard
            route={routeResult}
            onSaveToWatchlist={handleSaveOldRouteToWatchlist}
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

        {/* Universal Pathfinding Error Display */}
        {pathError && (
          <div
            style={{
              padding: '16px',
              backgroundColor: '#FEE2E2',
              border: '1px solid #F87171',
              borderRadius: '12px',
              marginTop: '12px',
            }}
          >
            <p
              style={{
                fontSize: '13px',
                color: '#991B1B',
                margin: 0,
              }}
            >
              <strong>Error:</strong> {pathError}
            </p>
          </div>
        )}

        {/* Universal Connection Path Result */}
        {connectionPath && connectionPath.type !== 'none' && (
          <div style={{ marginTop: '16px' }}>
            {connectionPath.path ? (
              <RouteResultCard
                route={connectionPath.path}
                onSaveToWatchlist={handleSaveUniversalPathToWatchlist}
              />
            ) : (
              // For strategies without full path (direct similarity, cold outreach)
              <div
                style={{
                  padding: '16px',
                  backgroundColor: '#F0F9FF',
                  border: '1px solid #3B82F6',
                  borderRadius: '12px',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                }}
              >
                <h4
                  style={{
                    margin: '0 0 8px 0',
                    color: '#1E40AF',
                    fontSize: '15px',
                    fontWeight: '600',
                  }}
                >
                  Connection Strategy: {connectionPath.type.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                </h4>
                <p
                  style={{
                    margin: '0 0 12px 0',
                    fontSize: '14px',
                    color: '#1E3A8A',
                    lineHeight: '1.5',
                  }}
                >
                  {connectionPath.reasoning}
                </p>

                {/* Estimated Acceptance Rate */}
                <div
                  style={{
                    padding: '10px 12px',
                    backgroundColor: '#DBEAFE',
                    borderRadius: '8px',
                    marginBottom: '12px',
                  }}
                >
                  <div style={{ fontSize: '12px', color: '#1E40AF', marginBottom: '4px' }}>
                    Estimated Acceptance Rate
                  </div>
                  <div style={{ fontSize: '18px', fontWeight: '600', color: '#1E40AF' }}>
                    {(connectionPath.estimatedAcceptanceRate * 100).toFixed(0)}%
                  </div>
                </div>

                {/* Next Steps */}
                <div style={{ fontSize: '13px', color: '#1E3A8A' }}>
                  <strong style={{ display: 'block', marginBottom: '8px' }}>Next Steps:</strong>
                  <ul style={{ margin: '0', paddingLeft: '20px' }}>
                    {connectionPath.nextSteps.map((step, i) => (
                      <li key={i} style={{ marginBottom: '6px', lineHeight: '1.4' }}>
                        {step}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Save Button */}
                <button
                  onClick={handleSaveUniversalPathToWatchlist}
                  style={{
                    width: '100%',
                    padding: '10px 16px',
                    marginTop: '16px',
                    backgroundColor: '#3B82F6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'background-color 150ms',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#2563EB';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#3B82F6';
                  }}
                >
                  Save to Watchlist
                </button>
              </div>
            )}
          </div>
        )}

        {/* No Path Found Message */}
        {connectionPath && connectionPath.type === 'none' && (
          <div
            style={{
              marginTop: '16px',
              padding: '16px',
              backgroundColor: '#FEF3C7',
              border: '1px solid #F59E0B',
              borderRadius: '12px',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
            }}
          >
            <h4
              style={{
                margin: '0 0 8px 0',
                color: '#92400E',
                fontSize: '15px',
                fontWeight: '600',
              }}
            >
              No Strong Connection Path
            </h4>
            <p
              style={{
                margin: '0 0 12px 0',
                fontSize: '14px',
                color: '#92400E',
                lineHeight: '1.5',
              }}
            >
              {connectionPath.reasoning}
            </p>
            <div style={{ fontSize: '13px', color: '#92400E' }}>
              <strong style={{ display: 'block', marginBottom: '8px' }}>Suggestions:</strong>
              <ul style={{ margin: '0', paddingLeft: '20px' }}>
                {connectionPath.nextSteps.map((step, i) => (
                  <li key={i} style={{ marginBottom: '6px', lineHeight: '1.4' }}>
                    {step}
                  </li>
                ))}
              </ul>
            </div>
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
