/**
 * Transform Utilities
 * Helper functions to transform data between different formats
 */

import type { UserProfile } from '../../../types/resume-tailoring';
import type { NetworkNode, ConnectionRoute } from '../../../types';
import type { ConnectionStrategy, ConnectionPath } from '../../../services/universal-connection/universal-connection-types';

/**
 * Transform UserProfile to NetworkNode
 * Converts a UserProfile (flat structure) to NetworkNode (with nested profile)
 */
export function userProfileToNetworkNode(
  profile: UserProfile,
  index: number = 0
): NetworkNode {
  // Extract LinkedIn profile ID from email or URL
  const profileId = profile.email || profile.url || profile.name || `profile-${index}`;

  return {
    id: profileId,
    profile: {
      id: profileId,
      publicId: profileId,
      name: profile.name || 'Unknown',
      headline: profile.title || '',
      location: profile.location || '',
      industry: profile.metadata?.domains?.[0] || '',
      avatarUrl: profile.avatarUrl,
      about: '',
      experience: (profile.workExperience || []).map(exp => ({
        company: exp.company || '',
        title: exp.title || '',
        duration: exp.startDate && exp.endDate ? `${exp.startDate} - ${exp.endDate}` : '',
        location: exp.location || '',
      })),
      education: (profile.education || []).map(edu => ({
        school: edu.school || '',
        degree: edu.degree || '',
        field: edu.field || '',
      })),
      skills: (profile.skills || []).map(s => ({
        name: s.name || '',
        endorsementCount: 0,
        endorsedBy: []
      })),
      connections: 0,
      mutualConnections: [],
      recentPosts: [],
      certifications: [],
      userPosts: [],
      engagedPosts: [],
      recentActivity: [],
      scrapedAt: new Date().toISOString(),
    },
    status: 'not_contacted' as const,
    degree: index === 0 ? 1 : index + 1,
    matchScore: 0,
  };
}

/**
 * Transform ConnectionPath to ConnectionRoute
 * Converts the path from ConnectionStrategy (with UserProfile[])
 * to the format expected by RouteResultCard (with NetworkNode[])
 */
export function connectionPathToRoute(
  path: ConnectionPath,
  targetId: string
): ConnectionRoute {
  console.log('[Uproot] [TRANSFORM] Converting ConnectionPath to ConnectionRoute', {
    inputNodesCount: path.nodes?.length || 0,
    hasNodes: !!path.nodes,
  });

  // Filter out null/undefined nodes and transform to NetworkNode[]
  const validNodes = (path.nodes || [])
    .filter((node): node is UserProfile => node != null)
    .map((profile, index) => userProfileToNetworkNode(profile, index));

  console.log('[Uproot] [TRANSFORM] Conversion complete', {
    outputNodesCount: validNodes.length,
    allNodesHaveProfile: validNodes.every(n => n.profile != null),
    allNodesHaveName: validNodes.every(n => n.profile?.name != null),
    allNodesHaveAvatar: validNodes.every(n => n.profile?.avatarUrl != null),
    avatarUrls: validNodes.map(n => ({ name: n.profile?.name, hasAvatar: !!n.profile?.avatarUrl })),
  });

  return {
    targetId,
    nodes: validNodes,
    edges: path.edges || [],
    totalWeight: path.totalWeight || 0,
    successProbability: path.successProbability * 100, // Convert 0-1 to 0-100
    computedAt: new Date().toISOString(),
  };
}

/**
 * Transform ConnectionStrategy to safe route for UI
 * Handles both path-based and non-path strategies
 */
export function transformConnectionStrategyForUI(
  strategy: ConnectionStrategy
): ConnectionRoute | null {
  if (!strategy.path) {
    console.log('[Uproot] [TRANSFORM] Strategy has no path, cannot create route');
    return null;
  }

  // Determine target ID
  const targetId =
    strategy.path.nodes?.[strategy.path.nodes.length - 1]?.email ||
    strategy.path.nodes?.[strategy.path.nodes.length - 1]?.url ||
    'unknown-target';

  return connectionPathToRoute(strategy.path, targetId);
}
