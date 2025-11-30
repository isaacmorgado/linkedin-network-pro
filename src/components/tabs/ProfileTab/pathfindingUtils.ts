/**
 * Pathfinding Utility Functions
 * Handles connection path finding logic
 */

import type { UserProfile } from '../../../types/resume-tailoring';
import type { ConnectionStrategy } from '../../../services/universal-connection/universal-connection-types';
import { NetworkGraph } from '../../../lib/graph';
import { findUniversalConnection } from '../../../services/universal-connection/universal-pathfinder';

/**
 * Create graph adapter for universal pathfinder
 */
export function createGraphAdapter(networkGraph: NetworkGraph) {
  return {
    async getConnections(userId: string): Promise<UserProfile[]> {
      const nodes = networkGraph.getConnections(userId);
      // Convert NetworkNode[] to UserProfile[]
      return ((nodes || []).map(node => ({
        id: node.id,
        name: node.profile.name || 'Unknown',
        email: node.id,
        location: node.profile.location || '',
        title: node.profile.headline || '',
        avatarUrl: node.profile.avatarUrl || undefined,
        url: node.id,
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
        skills: (node.profile.skills || []).filter(skill => skill).map(skill => ({
          name: typeof skill === 'string' ? skill : skill.name,
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
      }))) as UserProfile[];
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
          avatarUrl: node.profile.avatarUrl || undefined,
          url: node.id,
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
        id: node.id,
        name: node.profile.name || 'Unknown',
        email: node.id,
        location: node.profile.location || '',
        title: node.profile.headline || '',
        avatarUrl: node.profile.avatarUrl || undefined,
        url: node.id,
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
        id: node.id,
        name: node.profile.name || 'Unknown',
        email: node.id,
        location: node.profile.location || '',
        title: node.profile.headline || '',
        avatarUrl: node.profile.avatarUrl || undefined,
        url: node.id,
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
}

/**
 * Add current user to network graph if missing
 */
export async function ensureCurrentUserInGraph(
  networkGraph: NetworkGraph,
  currentUser: UserProfile
): Promise<void> {
  const userId = currentUser.email || currentUser.id || currentUser.url || currentUser.name;
  if (!userId) {
    console.warn('[Uproot] Cannot add current user to graph: no ID available');
    return;
  }

  const currentUserNode = networkGraph.getNode(userId);
  if (!currentUserNode) {
    console.log('[Uproot] Current user not in graph, adding minimal node');

    // Convert currentUser to LinkedInProfile format for NetworkNode
    const currentUserLinkedInProfile = {
      id: userId,
      profileUrl: userId,
      name: currentUser.name,
      headline: currentUser.title || '',
      location: currentUser.location || '',
      avatarUrl: currentUser.avatarUrl,
      photoUrl: currentUser.avatarUrl,
      currentRole: currentUser.workExperience?.[0] ? {
        title: currentUser.workExperience[0].title,
        company: currentUser.workExperience[0].company,
      } : undefined,
      experience: currentUser.workExperience?.slice(0, 1).map(exp => ({
        company: exp.company,
        title: exp.title,
        location: exp.location || ''
      })) || [],
      education: currentUser.education?.map(edu => ({
        school: edu.school,
        degree: edu.degree,
        field: edu.field,
      })) || [],
      certifications: [],
      skills: currentUser.skills?.map(s => ({
        name: s.name,
        endorsementCount: 0,
        endorsedBy: []
      })) || [],
      connections: undefined,
      mutualConnections: [],
      recentPosts: [],
      userPosts: [],
      engagedPosts: [],
      recentActivity: [],
      scrapedAt: new Date().toISOString()
    };

    const currentUserNetworkNode = {
      id: userId,
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
}

/**
 * Add target profile to network graph if missing or update if avatarUrl changed
 *
 * Enhanced to preserve all available profile data for better similarity calculation
 */
export async function ensureTargetInGraph(
  networkGraph: NetworkGraph,
  targetProfile: UserProfile
): Promise<void> {
  const targetId = targetProfile.email || targetProfile.id || targetProfile.url || targetProfile.name;
  if (!targetId) {
    console.warn('[Uproot] Cannot add target to graph: no ID available');
    return;
  }

  const targetNode = networkGraph.getNode(targetId);

  if (!targetNode || !targetNode.profile.avatarUrl) {
    console.log('[Uproot] Target not in graph or missing avatar, adding/updating node');

    // Extract skills from profile if available (for semantic matching)
    const skills = targetProfile.skills?.map(s => typeof s === 'string' ? s : s.name).filter(Boolean) || [];

    // Extract industry/domain from metadata or work experience
    const industry = targetProfile.metadata?.domains?.[0] ||
                    targetProfile.workExperience?.[0]?.industry ||
                    '';

    // Convert targetProfile to LinkedInProfile format for NetworkNode
    // Preserve all available data for similarity calculation
    const targetLinkedInProfile = {
      id: targetId,
      profileUrl: targetId,
      publicId: (targetProfile as any).publicId || undefined,
      name: targetProfile.name,
      headline: targetProfile.title || '',
      location: targetProfile.location || '',
      industry: industry || undefined,
      avatarUrl: targetProfile.avatarUrl,
      photoUrl: targetProfile.avatarUrl,
      about: undefined, // Not available from current scraping
      currentRole: targetProfile.workExperience?.[0] ? {
        title: targetProfile.workExperience[0].title,
        company: targetProfile.workExperience[0].company,
      } : undefined,
      experience: targetProfile.workExperience?.slice(0, 3).map(exp => ({
        company: exp.company,
        title: exp.title,
        location: exp.location || '',
        duration: exp.startDate && exp.endDate
          ? `${exp.startDate} - ${exp.endDate}`
          : undefined
      })) || [],
      education: targetProfile.education?.slice(0, 3).map(edu => ({
        school: edu.school,
        degree: edu.degree || undefined,
        field: edu.field || undefined
      })) || [],
      skills: skills.map(name => ({
        name,
        endorsementCount: 0,
        endorsedBy: []
      })),
      certifications: [],
      connections: undefined,
      mutualConnections: [],
      recentPosts: [],
      userPosts: [],
      engagedPosts: [],
      recentActivity: [],
      scrapedAt: new Date().toISOString()
    };

    const targetNetworkNode = {
      id: targetId,
      profile: targetLinkedInProfile,
      status: 'not_contacted' as const,
      degree: 1 as const,
      matchScore: 0
    };

    networkGraph.addNode(targetNetworkNode);

    // Save updated graph
    await chrome.storage.local.set({ networkGraph: networkGraph.export() });
    console.log('[Uproot] Added/updated target in graph:', {
      name: targetProfile.name,
      hasAvatar: !!targetProfile.avatarUrl,
      skillsCount: skills.length,
      experienceCount: targetLinkedInProfile.experience.length,
      educationCount: targetLinkedInProfile.education.length,
      industry: industry || '(none)'
    });
  }
}

/**
 * Find connection path using universal pathfinder
 */
export async function findConnectionPath(
  currentUser: UserProfile,
  targetProfile: UserProfile,
  networkGraph: NetworkGraph
): Promise<ConnectionStrategy | null> {
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
      avatarUrl: targetProfile.avatarUrl,
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

  // Ensure both current user and target are in the graph with avatarUrls
  await ensureCurrentUserInGraph(networkGraph, currentUser);
  await ensureTargetInGraph(networkGraph, targetProfile);

  // Create graph adapter
  const graphAdapter = createGraphAdapter(networkGraph);

  // Find universal connection
  const result = await findUniversalConnection(
    currentUser,
    targetProfile,
    graphAdapter
  );

  return result;
}
