/**
 * Profile Actions Tab
 * Shown only on LinkedIn person profile pages
 *
 * Features:
 * 1. Find Connection Path - Universal pathfinder (works with or without mutuals)
 * 2. Generate Connection Message - AI-powered personalized intro
 * 3. Add to Watchlist - Save person for tracking
 *
 * Refactored to separate concerns into smaller modules.
 */

import { useState, useEffect } from 'react';
import { MessageSquare, BookmarkPlus, Search } from 'lucide-react';
import { usePageContext } from '../../../hooks/usePageContext';
import { useWatchlist } from '../../../hooks/useWatchlist';
import { NetworkGraph } from '../../../lib/graph';
import type { UserProfile } from '../../../types/resume-tailoring';
import type { ConnectionStrategy } from '../../../services/universal-connection/universal-connection-types';
import { refreshCurrentUser } from '../../../services/current-user-service';
import { ProfileHeader } from './ProfileHeader';
import { ActionCard } from './ActionCard';
import { ErrorDisplay } from './ErrorDisplay';
import { ConnectionResult } from './ConnectionResult';
import { getCurrentUser } from './userProfileUtils';
import {
  findConnectionPath,
  ensureCurrentUserInGraph
} from './pathfindingUtils';

interface ProfileTabProps {
  panelWidth?: number;
}

export function ProfileTab({ panelWidth: _panelWidth = 400 }: ProfileTabProps) {
  const pageContext = usePageContext();
  const { addPerson, addPath } = useWatchlist();
  const [isLoadingMessage, setIsLoadingMessage] = useState(false);
  const [isAddingToWatchlist, setIsAddingToWatchlist] = useState(false);
  const [isSavingPath, setIsSavingPath] = useState(false);

  // Universal pathfinding state
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

  // Restore cached connection path on mount/profile change
  useEffect(() => {
    const loadCachedPath = async () => {
      if (!profileData?.profileUrl) return;

      try {
        const result = await chrome.storage.local.get('uproot_connection_path_cache');
        const cache = result.uproot_connection_path_cache || {};
        const cachedData = cache[profileData.profileUrl];

        if (cachedData) {
          // Validate cached data - reject 'none' strategies (should never exist)
          if (cachedData.path?.type === 'none') {
            console.warn('[Uproot] Invalid cached path (type: none) - removing from cache');
            delete cache[profileData.profileUrl];
            await chrome.storage.local.set({ uproot_connection_path_cache: cache });
            return;
          }

          // Check if cache is still valid (24 hour TTL)
          const now = Date.now();
          const cacheAge = now - cachedData.timestamp;
          const TTL = 24 * 60 * 60 * 1000; // 24 hours

          if (cacheAge < TTL) {
            console.log('[Uproot] Restored cached connection path for', profileData.name, `(cached ${Math.round(cacheAge / 1000 / 60)} minutes ago)`);
            setConnectionPath(cachedData.path);
          } else {
            console.log('[Uproot] Cache expired for', profileData.name, 'clearing...');
            // Remove expired cache
            delete cache[profileData.profileUrl];
            await chrome.storage.local.set({ uproot_connection_path_cache: cache });
          }
        } else {
          console.log('[Uproot] No cached path found for', profileData.name);
        }
      } catch (error) {
        console.warn('[Uproot] Failed to restore cached path:', error);
      }
    };

    loadCachedPath();
  }, [profileData?.profileUrl]);

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
   * Manually refresh current user profile from LinkedIn
   * Used when auto-detection fails in profile pathfinding
   */
  const handleRefreshProfile = async () => {
    setIsRefreshingProfile(true);
    setPathError(null);

    try {
      // Call refreshCurrentUser from current-user-service
      const freshProfile = await refreshCurrentUser();

      if (!freshProfile) {
        throw new Error('Failed to refresh profile. Please ensure you are logged into LinkedIn.');
      }

      console.log('[Uproot] Profile refreshed successfully:', freshProfile.name);

      // Convert to UserProfile format and store
      const profileUrl = `https://www.linkedin.com/in/${freshProfile.publicId || freshProfile.id || ''}`;
      const userProfile: UserProfile = {
        name: freshProfile.name || 'LinkedIn User',
        email: profileUrl,
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
        skills: (freshProfile.skills || []).filter(skill => skill).map((skill) => ({
          name: typeof skill === 'string' ? skill : skill.name,
          level: 'intermediate' as const,
          yearsOfExperience: 1,
          category: 'other'
        })),
        metadata: {
          totalYearsExperience: 0,
          domains: [],
          seniority: 'entry' as const,
          careerStage: 'professional' as const
        }
      };

      await chrome.storage.local.set({ userProfile });

      // Automatically retry pathfinding
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
      // Get current user profile with fallback chain
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

      // Ensure current user is in graph
      await ensureCurrentUserInGraph(networkGraph, currentUser);

      // Check if graph has data
      if (networkGraph.getAllNodes().length === 0) {
        throw new Error(
          'Network graph is empty. The extension will automatically build your network as you visit LinkedIn profiles. ' +
          'Please visit a few LinkedIn profiles first, then try again. ' +
          'Tip: Visit profiles of your connections to build your network graph.'
        );
      }

      // Convert profile to UserProfile format
      console.log('[ConnectionPath] Target profile data:', {
        name: profileData.name,
        profileImage: profileData.profileImage,
        hasImage: !!profileData.profileImage,
        publicId: profileData.publicId
      });

      const targetProfile: UserProfile = {
        id: profileData.profileUrl,
        name: profileData.name || 'Unknown',
        email: profileData.profileUrl,
        location: '',
        title: profileData.headline || '',
        avatarUrl: profileData.profileImage || undefined,
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

      // Find connection path
      const result = await findConnectionPath(currentUser, targetProfile, networkGraph);

      if (result) {
        setConnectionPath(result);
        console.log('[ConnectionPath] Strategy found:', {
          type: result.type,
          confidence: result.confidence,
          hasPath: !!result.path,
          hasCandidate: !!result.candidate,
          hasIntermediary: !!result.intermediary,
          lowConfidence: result.lowConfidence || false,
          acceptanceRate: `${(result.estimatedAcceptanceRate * 100).toFixed(1)}%`
        });

        // Validate: result should NEVER be 'none' and must have either path or candidate/intermediary
        if (result.type === 'none' as any) {
          console.error('[ConnectionPath] INVALID RESULT: Got type "none" - this should never happen!');
          setPathError('Internal error: Invalid connection strategy. Please report this issue.');
          return;
        }

        // Cache the result for this target (local storage with 24h TTL)
        try {
          const cacheResult = await chrome.storage.local.get('uproot_connection_path_cache');
          const cache = cacheResult.uproot_connection_path_cache || {};

          cache[profileData.profileUrl] = {
            path: result,
            timestamp: Date.now()
          };

          await chrome.storage.local.set({ uproot_connection_path_cache: cache });
          console.log('[Uproot] Cached connection path for', profileData.name);
        } catch (error) {
          console.warn('[Uproot] Failed to cache path:', error);
        }
      } else {
        // This should NEVER happen with the new implementation
        console.error('[ConnectionPath] CRITICAL: findConnectionPath returned null - this violates the guarantee!');
        setConnectionPath(null);
        setPathError('Internal error: No connection strategy returned. Please report this issue.');
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
   * Save universal connection path to watchlist
   */
  const handleSaveUniversalPathToWatchlist = async () => {
    if (!connectionPath || !profileData) return;

    setIsSavingPath(true);
    try {
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
      setPathError(null);

      // Show success feedback briefly
      setTimeout(() => {
        setIsSavingPath(false);
      }, 2000);

    } catch (error) {
      console.error('[Uproot] Error saving to watchlist:', error);
      setPathError('Failed to save to watchlist');
      setIsSavingPath(false);
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
      <ProfileHeader
        name={name}
        headline={headline}
        profileImage={profileImage ?? undefined}
      />

      {/* Action Cards */}
      <div
        style={{
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
        }}
      >
        {/* Universal Pathfinding Card */}
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
          <ErrorDisplay
            error={pathError}
            isRefreshingProfile={isRefreshingProfile}
            onRetry={() => {
              setPathError(null);
              handleFindConnectionPath();
            }}
            onRefresh={handleRefreshProfile}
          />
        )}

        {/* Universal Connection Path Result */}
        {/* Note: ALWAYS shows a result now - 'none' type no longer exists */}
        {connectionPath && (
          <ConnectionResult
            connectionPath={connectionPath}
            onSaveToWatchlist={handleSaveUniversalPathToWatchlist}
            isSaving={isSavingPath}
          />
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
          💡 Tip: M:control+6 / W:alt+6 to quickly access Profile Actions
        </p>
      </div>
    </div>
  );
}

// Re-export for backward compatibility
export default ProfileTab;
