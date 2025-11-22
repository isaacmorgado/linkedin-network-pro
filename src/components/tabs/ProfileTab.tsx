/**
 * Profile Actions Tab
 * Shown only on LinkedIn person profile pages
 *
 * Features:
 * 1. Find Connection Path - Universal pathfinder (works with or without mutuals)
 * 2. Generate Connection Message - AI-powered personalized intro
 * 3. Add to Watchlist - Save person for tracking
 */

import React, { useState } from 'react';
import { MessageSquare, BookmarkPlus, User, Briefcase, Loader2, Search, RefreshCw } from 'lucide-react';
import { usePageContext } from '../../hooks/usePageContext';
import { useWatchlist } from '../../hooks/useWatchlist';
import { findUniversalConnection } from '../../services/universal-connection/universal-pathfinder';
import type { ConnectionStrategy } from '../../services/universal-connection/universal-connection-types';
import type { UserProfile } from '../../types/resume-tailoring';
import { NetworkGraph } from '../../lib/graph';
import { scrapePersonProfile, getCurrentLinkedInUser, scrapeOwnProfile } from '../../utils/linkedin-scraper';
import { RouteResultCard } from '../shared/RouteResultCard';
import { refreshCurrentUser } from '../../services/current-user-service';

interface ProfileTabProps {
  panelWidth?: number;
}

export function ProfileTab({ panelWidth = 400 }: ProfileTabProps) {
  const pageContext = usePageContext();
  const { addPerson, addPath } = useWatchlist();
  const [isLoadingMessage, setIsLoadingMessage] = useState(false);
  const [isAddingToWatchlist, setIsAddingToWatchlist] = useState(false);
  const [isSavingPath, setIsSavingPath] = useState(false);

  // Universal pathfinding state (the ONLY pathfinding method)
  const [isSearchingPath, setIsSearchingPath] = useState(false);
  const [connectionPath, setConnectionPath] = useState<ConnectionStrategy | null>(null);
  const [pathError, setPathError] = useState<string | null>(null);
  const [isDetectingUser, setIsDetectingUser] = useState(false);
  const [isRefreshingProfile, setIsRefreshingProfile] = useState(false);

  // Extract profile data from context
  const profileData = pageContext.profileData;
  const name = profileData?.name || 'Unknown Person';
  const headline = profileData?.headline || '';
  const profileImage = profileData?.profileImage;

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
   * Convert LinkedInPersonProfile to UserProfile format
   */
  const convertLinkedInToUserProfile = (linkedInProfile: any): UserProfile => {
    return {
      id: linkedInProfile.profileUrl, // CRITICAL: Use full URL as ID to match graph nodes
      name: linkedInProfile.name || 'LinkedIn User',
      email: linkedInProfile.profileUrl,
      location: linkedInProfile.location || '',
      title: linkedInProfile.headline || linkedInProfile.currentRole?.title || '',
      avatarUrl: linkedInProfile.photoUrl,
      publicId: linkedInProfile.publicId,
      url: linkedInProfile.profileUrl,
      workExperience: linkedInProfile.currentRole?.title
        ? [
            {
              id: 'current-role',
              company: linkedInProfile.currentRole.company || '',
              title: linkedInProfile.currentRole.title,
              startDate: linkedInProfile.currentRole.startDate || new Date().toISOString(),
              endDate: null,
              location: linkedInProfile.location || '',
              description: '',
              industry: '',
              achievements: [],
              skills: [],
              domains: [],
              responsibilities: [],
            },
          ]
        : [],
      education: [],
      projects: [],
      skills: [],
      metadata: {
        totalYearsExperience: 0,
        domains: [],
        seniority: 'entry' as const,
        careerStage: 'professional' as const,
      },
    };
  };

  /**
   * Get current LinkedIn user profile with fallback chain
   * Priority:
   * 1. Try chrome.storage.local for 'userProfile' (Resume tab)
   * 2. If not found, call getCurrentLinkedInUser() from linkedin-scraper
   * 3. If that fails, call scrapeOwnProfile() from linkedin-scraper
   * 4. Only throw error if all 3 methods fail
   */
  const getCurrentUser = async (): Promise<UserProfile | null> => {
    try {
      // Method 1: Try Resume tab storage first
      const currentUserData = await chrome.storage.local.get(['userProfile']);
      if (currentUserData.userProfile) {
        const profile = currentUserData.userProfile;

        // Normalize old profile format (publicId-only) to full URL
        if (profile.email && !profile.email.startsWith('http')) {
          console.warn('[Uproot] Normalizing old profile format:', profile.email);
          profile.email = `https://www.linkedin.com/in/${profile.email}`;

          // Save normalized version back to storage
          await chrome.storage.local.set({ userProfile: profile });
        }

        console.log('[Uproot] Using current user from Resume tab:', profile.email);
        return profile;
      }

      console.log('[Uproot] No Resume tab data, trying LinkedIn detection...');

      // Method 2: Try getCurrentLinkedInUser() - detects user from any LinkedIn page
      const linkedInUser = getCurrentLinkedInUser();
      if (linkedInUser) {
        console.log('[Uproot] Detected LinkedIn user from page:', linkedInUser.name);
        return convertLinkedInToUserProfile(linkedInUser);
      }

      console.log('[Uproot] LinkedIn detection failed, trying profile scraping...');

      // Method 3: Try scrapeOwnProfile() - navigates to /me and scrapes
      const scrapedProfile = await scrapeOwnProfile();
      if (scrapedProfile && scrapedProfile.name !== 'LinkedIn User') {
        console.log('[Uproot] Scraped own profile:', scrapedProfile.name);
        return scrapedProfile;
      }

      // All methods failed
      console.error('[Uproot] All profile detection methods failed');
      return null;
    } catch (error) {
      console.error('[Uproot] Error getting current user:', error);
      return null;
    }
  };

  /**
   * Manually refresh current user profile from LinkedIn
   * Used when auto-detection fails in profile pathfinding
   */
  const handleRefreshProfile = async () => {
    setIsRefreshingProfile(true);
    setPathError(null);

    try {
      // Call refreshCurrentUser from current-user-service
      // This will scrape fresh profile data and cache it
      const freshProfile = await refreshCurrentUser();

      if (!freshProfile) {
        throw new Error('Failed to refresh profile. Please ensure you are logged into LinkedIn.');
      }

      console.log('[Uproot] Profile refreshed successfully:', freshProfile.name);

      // Convert to UserProfile format and store in chrome.storage
      // so it's available for the next pathfinding attempt
      const profileUrl = `https://www.linkedin.com/in/${freshProfile.publicId || freshProfile.id || ''}`;
      const userProfile: UserProfile = {
        name: freshProfile.name || 'LinkedIn User',
        email: profileUrl, // Use full URL as email/ID for graph consistency
        location: freshProfile.location || '',
        title: freshProfile.headline || '',
        avatarUrl: freshProfile.avatarUrl,
        url: profileUrl,
        workExperience: (freshProfile.experience || []).map(exp => ({
          id: `${exp.company}-${exp.title}`,
          company: exp.company || '',
          title: exp.title || '',
          startDate: '',
          endDate: null,
          location: exp.location || '',
          description: '',
          industry: '',
          achievements: [],
          skills: [],
          domains: [],
          responsibilities: []
        })),
        education: (freshProfile.education || []).map(edu => ({
          id: `${edu.school}-${edu.degree || 'degree'}`,
          school: edu.school || '',
          degree: edu.degree || '',
          field: edu.field || '',
          startDate: '',
          endDate: null
        })),
        projects: [],
        skills: (freshProfile.skills || []).map(skill => ({
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
      };

      await chrome.storage.local.set({ userProfile });

      // Automatically retry the pathfinding now that profile is refreshed
      handleFindConnectionPath();

    } catch (error) {
      console.error('[Uproot] Error refreshing profile:', error);
      setPathError(error instanceof Error ? error.message : 'Failed to refresh profile');
    } finally {
      setIsRefreshingProfile(false);
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
    setIsDetectingUser(true);
    setPathError(null);
    setConnectionPath(null);

    try {
      // Get current user profile with fallback chain:
      // 1. Resume tab -> 2. LinkedIn page detection -> 3. Profile scraping
      const currentUser = await getCurrentUser();

      setIsDetectingUser(false);

      if (!currentUser) {
        throw new Error('Unable to detect your LinkedIn profile. Please ensure you are logged into LinkedIn or complete your profile in the Resume tab.');
      }

      // Initialize network graph
      const networkGraph = new NetworkGraph();

      // Load network data from storage
      const networkData = await chrome.storage.local.get(['networkGraph']);
      if (networkData.networkGraph) {
        networkGraph.import(networkData.networkGraph);
      }

      // Ensure current user is in graph (auto-add if missing)
      const currentUserNode = networkGraph.getNode(currentUser.email);
      if (!currentUserNode) {
        console.log('[Uproot] Current user not in graph, adding minimal node');

        // Convert currentUser to LinkedInProfile format for NetworkNode
        const currentUserLinkedInProfile = {
          id: currentUser.email,
          name: currentUser.name,
          headline: currentUser.title || '',
          location: currentUser.location || '',
          avatarUrl: currentUser.avatarUrl,
          experience: currentUser.workExperience?.slice(0, 1).map(exp => ({
            company: exp.company,
            title: exp.title,
            location: exp.location || ''
          })) || [],
          education: [],
          skills: [],
          scrapedAt: new Date().toISOString()
        };

        const currentUserNetworkNode = {
          id: currentUser.email,
          profile: currentUserLinkedInProfile,
          status: 'not_contacted' as const,
          degree: 0 as const,
          matchScore: 0
        };

        networkGraph.addNode(currentUserNetworkNode);

        // Save updated graph
        await chrome.storage.local.set({ networkGraph: networkGraph.export() });
        console.log('[Uproot] Added current user to graph');
      }

      // Check if graph has data - if not, try to add current profile to bootstrap it
      if (networkGraph.getAllNodes().length === 0) {
        throw new Error(
          'Network graph is empty. The extension will automatically build your network as you visit LinkedIn profiles. ' +
          'Please visit a few LinkedIn profiles first, then try again. ' +
          'Tip: Visit profiles of your connections to build your network graph.'
        );
      }

      // Create adapter for universal pathfinder Graph interface
      const graphAdapter = {
        async getConnections(userId: string): Promise<UserProfile[]> {
          const nodes = networkGraph.getConnections(userId);
          // Convert NetworkNode[] to UserProfile[]
          return nodes.map(node => ({
            id: node.id,
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
              id: node.id,
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
        id: profileData.profileUrl, // CRITICAL: Use full URL as ID to match graph nodes
        name: profileData.name || 'Unknown',
        email: profileData.profileUrl,
        location: '',
        title: profileData.headline || '',
        publicId: profileData.publicId,
        url: profileData.profileUrl,
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

      // Log source and target for debugging
      console.log('[Uproot] Pathfinding Setup:', {
        source: {
          name: currentUser.name,
          email: currentUser.email,
          description: 'YOU (logged-in user)'
        },
        target: {
          name: targetProfile.name,
          email: targetProfile.email,
          description: 'Profile you are viewing'
        }
      });

      // CRITICAL: Validate we're not searching for ourselves
      if (currentUser.email === targetProfile.email) {
        throw new Error(
          `You are viewing your own profile (${currentUser.name}). ` +
          'Please navigate to another LinkedIn profile to find connection paths.'
        );
      }

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
      setIsDetectingUser(false);
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
      // Convert ConnectionStrategy to ConnectionPath format
      const pathNodes = connectionPath.path?.nodes || [];

      await addPath({
        targetName: profileData.name || '',
        targetProfileUrl: profileData.profileUrl || '',
        targetProfileImage: profileData.profileImage || null,
        targetHeadline: profileData.headline || '',
        path: pathNodes.map((node, index) => ({
          name: node.name || '',
          profileUrl: node.url || node.id || '',
          profileImage: node.avatarUrl || null,
          degree: index + 1,
          connected: false,
        })),
        totalSteps: pathNodes.length,
        completedSteps: 0,
        isComplete: false,
        notes: `Strategy: ${connectionPath.type}, Estimated acceptance: ${Math.round(connectionPath.estimatedAcceptanceRate * 100)}%`,
      });

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
        {/* Universal Pathfinding Card - THE ONLY pathfinding method */}
        <ActionCard
          icon={Search}
          title="Find Connection Path"
          description="Universal pathfinder - works even without mutual connections"
          buttonText={
            isDetectingUser
              ? 'Detecting your profile...'
              : isSearchingPath
              ? 'Searching...'
              : 'Find Connection Path'
          }
          buttonColor="#0077B5"
          isLoading={isSearchingPath || isDetectingUser}
          onClick={handleFindConnectionPath}
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

        {/* Connection Path Error Display */}
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
                margin: '0 0 12px 0',
              }}
            >
              <strong>Error:</strong> {pathError}
            </p>
            <div
              style={{
                display: 'flex',
                gap: '8px',
              }}
            >
              <button
                onClick={() => {
                  setPathError(null);
                  handleFindConnectionPath();
                }}
                disabled={isRefreshingProfile}
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  padding: '8px 12px',
                  backgroundColor: isRefreshingProfile ? '#8e8e93' : '#991B1B',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: '600',
                  cursor: isRefreshingProfile ? 'not-allowed' : 'pointer',
                  transition: 'background-color 150ms',
                  opacity: isRefreshingProfile ? 0.7 : 1,
                }}
                onMouseEnter={(e) => {
                  if (!isRefreshingProfile) {
                    e.currentTarget.style.backgroundColor = '#7F1D1D';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isRefreshingProfile) {
                    e.currentTarget.style.backgroundColor = '#991B1B';
                  }
                }}
              >
                <RefreshCw size={14} />
                Try Again
              </button>
              <button
                onClick={handleRefreshProfile}
                disabled={isRefreshingProfile}
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  padding: '8px 12px',
                  backgroundColor: isRefreshingProfile ? '#8e8e93' : '#0077B5',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: '600',
                  cursor: isRefreshingProfile ? 'not-allowed' : 'pointer',
                  transition: 'background-color 150ms',
                  opacity: isRefreshingProfile ? 0.7 : 1,
                }}
                onMouseEnter={(e) => {
                  if (!isRefreshingProfile) {
                    e.currentTarget.style.backgroundColor = '#005582';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isRefreshingProfile) {
                    e.currentTarget.style.backgroundColor = '#0077B5';
                  }
                }}
              >
                {isRefreshingProfile ? (
                  <>
                    <Loader2
                      size={14}
                      style={{
                        animation: 'spin 1s linear infinite',
                      }}
                    />
                    Refreshing...
                  </>
                ) : (
                  <>
                    <RefreshCw size={14} />
                    Refresh Profile
                  </>
                )}
              </button>
            </div>
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
