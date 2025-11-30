/**
 * Stepping Stone Analyzer
 * Cross-references engaged people against user's network to find stepping stones
 *
 * Core logic:
 * 1. Take list of people target engages with
 * 2. Check which of those people are in user's 1st/2nd/3rd degree network
 * 3. Calculate network overlap (how many mutual connections)
 * 4. Return all found stepping stones with connection degree
 */

import type { UserProfile } from '@/types/resume-tailoring';
import type { Graph, EngagedPerson, SteppingStone, OverlapAnalysis } from '../universal-connection-types';

/**
 * Find stepping stones: engaged people who are in source user's network
 *
 * @param sourceUser User profile
 * @param engagedPeople List of people target engages with
 * @param graph Network graph
 * @returns Array of stepping stones with connection degrees
 */
export async function findSteppingStones(
  sourceUser: UserProfile,
  engagedPeople: EngagedPerson[],
  graph: Graph
): Promise<SteppingStone[]> {
  try {
    const steppingStones: SteppingStone[] = [];

    // Find source user's ID in graph
    const sourceNodeId = findNodeIdInGraph(graph, sourceUser);
    if (!sourceNodeId) {
      console.log('[SteppingStoneAnalyzer] Source user not found in graph');
      return [];
    }

    // Get source user's 1st degree connections
    const firstDegreeConnections = await graph.getConnections(sourceNodeId);
    const firstDegreeIds = new Set(firstDegreeConnections.map(c => c.id).filter((id): id is string => id !== undefined));

    // Get 2nd degree connections (via 1st degree)
    const secondDegreeIds = new Set<string>();
    for (const connection of firstDegreeConnections) {
      if (!connection.id) continue;
      const secondDegree = await graph.getConnections(connection.id);
      secondDegree.forEach(c => {
        if (c.id && c.id !== sourceNodeId && !firstDegreeIds.has(c.id)) {
          secondDegreeIds.add(c.id);
        }
      });
    }

    // Check each engaged person against user's network
    for (const engagedPerson of engagedPeople) {
      const personId = engagedPerson.personId;

      // Check 1st degree
      if (firstDegreeIds.has(personId)) {
        const node = graph.getNode?.(personId);
        if (node) {
          steppingStones.push({
            person: engagedPerson,
            connectionDegree: 1,
            pathToSource: [sourceUser, node],
          });
        }
        continue;
      }

      // Check 2nd degree
      if (secondDegreeIds.has(personId)) {
        // Find path via which 1st degree connection
        const intermediary = firstDegreeConnections.find(async (c) => {
          const connections = await graph.getConnections(c.id || '');
          return connections.some(conn => conn.id === personId);
        });

        const node = graph.getNode?.(personId);
        if (node && intermediary) {
          steppingStones.push({
            person: engagedPerson,
            connectionDegree: 2,
            pathToSource: [sourceUser, intermediary, node],
          });
        }
        continue;
      }

      // TODO: 3rd degree check (can be expensive, skip for now)
    }

    console.log(`[SteppingStoneAnalyzer] Found ${steppingStones.length} stepping stones`);
    return steppingStones;
  } catch (error) {
    console.error('[SteppingStoneAnalyzer] Error finding stepping stones:', error);
    return [];
  }
}

/**
 * Analyze network overlap for a stepping stone
 * Shows how many people in user's network also know the stepping stone
 *
 * @param sourceUser User profile
 * @param steppingStone Stepping stone candidate
 * @param targetUser Target profile
 * @param graph Network graph
 * @returns Network overlap analysis
 */
export async function analyzeNetworkOverlap(
  sourceUser: UserProfile,
  steppingStone: SteppingStone,
  _targetUser: UserProfile,
  graph: Graph
): Promise<OverlapAnalysis> {
  try {
    // Find source user's ID in graph
    const sourceNodeId = findNodeIdInGraph(graph, sourceUser);
    if (!sourceNodeId) {
      return {
        steppingStoneName: steppingStone.person.personName,
        sourceConnectionsWhoKnowHer: [],
        overlapDensity: 0,
        networkStrength: 0,
      };
    }

    // Get all of source's 1st degree connections
    const sourceConnections = await graph.getConnections(sourceNodeId);

    // For each connection, check if they also connect to stepping stone
    const connectionsWhoKnowStone: Array<{
      name: string;
      engagementCount: number;
    }> = [];

    for (const connection of sourceConnections) {
      const connectionId = connection.id || '';
      if (!connectionId) continue;

      // Check if this connection is connected to stepping stone
      const connectionNetwork = await graph.getConnections(connectionId);
      const knowsStone = connectionNetwork.some(
        c => c.id === steppingStone.person.personId
      );

      if (knowsStone) {
        connectionsWhoKnowStone.push({
          name: connection.name || 'Unknown',
          engagementCount: 0, // TODO: Calculate actual engagement
        });
      }
    }

    // Calculate overlap density
    const overlapDensity = sourceConnections.length > 0
      ? connectionsWhoKnowStone.length / sourceConnections.length
      : 0;

    // Calculate network strength (based on stepping stone's engagement)
    const networkStrength = steppingStone.person.engagementStrength;

    return {
      steppingStoneName: steppingStone.person.personName,
      sourceConnectionsWhoKnowHer: connectionsWhoKnowStone,
      overlapDensity,
      networkStrength,
    };
  } catch (error) {
    console.error('[SteppingStoneAnalyzer] Error analyzing network overlap:', error);
    return {
      steppingStoneName: steppingStone.person.personName,
      sourceConnectionsWhoKnowHer: [],
      overlapDensity: 0,
      networkStrength: 0,
    };
  }
}

/**
 * Helper to find node ID in graph with fallback matching
 */
function findNodeIdInGraph(graph: Graph, user: UserProfile): string | null {
  // Try LinkedIn ID first
  if (user.id) {
    const node = graph.getNode?.(user.id);
    if (node) return user.id;
  }

  // Try email
  if (user.email) {
    const node = graph.getNode?.(user.email);
    if (node) return user.email;
  }

  // Try user ID
  if (user.id) {
    const node = graph.getNode?.(user.id);
    if (node) return user.id;
  }

  return null;
}
