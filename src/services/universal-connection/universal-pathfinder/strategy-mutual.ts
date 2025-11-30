/**
 * Mutual Connection Strategy (Stage 1)
 * Uses existing A* or BFS algorithm to find paths via mutual connections
 */

import type { UserProfile } from '../../../types/resume-tailoring';
import type { ConnectionStrategy, Graph } from '../universal-connection-types';
import { calculateMutualConnectionAcceptanceRate } from './acceptance-rates';

/**
 * Find node ID in graph by trying multiple ID formats
 *
 * Tries in order: id, email, name, publicId
 * Returns null if not found in graph
 *
 * @param graph Network graph
 * @param user User profile to find
 * @returns Node ID string or null if not found
 */
export function findNodeIdInGraph(graph: Graph, user: UserProfile): string | null {
  // Try multiple ID formats in order of preference
  const possibleIds = [
    user.id,
    user.email,
    user.name,
    (user as any).publicId, // Some profiles may have publicId
  ].filter(Boolean);

  // Try each ID to see if it exists in the graph
  for (const id of possibleIds) {
    if (id && graph.getNode?.(id)) {
      return id;
    }
  }

  // If getNode isn't available, return the most likely ID
  // (for backwards compatibility with graphs that don't implement getNode)
  return user.id || user.email || user.name || null;
}

/**
 * Generate action items for mutual connection strategy
 */
export function generateMutualNextSteps(
  path: UserProfile[],
  target: UserProfile
): string[] {
  if (path.length < 2) {
    return ['Error: Invalid path'];
  }

  const firstIntermediary = path[1];
  const steps: string[] = [];

  steps.push(
    `Message ${firstIntermediary.name} (mutual connection)`
  );
  steps.push(`Ask for introduction to ${target.name}`);
  steps.push(`Mention shared connections in your outreach`);

  if (path.length > 2) {
    steps.push(`Consider multiple paths to increase success probability`);
  }

  return steps;
}

/**
 * Attempt to find mutual connection via A* or BFS
 */
export async function tryMutualConnectionStrategy(
  sourceUser: UserProfile,
  targetUser: UserProfile,
  graph: Graph
): Promise<ConnectionStrategy | null> {
  // Try existing A* or BFS algorithm if available
  if (!graph.bidirectionalBFS) {
    return null;
  }

  try {
    // Find node IDs in graph
    const sourceId = findNodeIdInGraph(graph, sourceUser);
    const targetId = findNodeIdInGraph(graph, targetUser);

    if (!sourceId || !targetId) {
      throw new Error(
        'Unable to find profile in your network. Please visit some LinkedIn profiles to build your network graph, then try again.'
      );
    }

    const astarResult = await graph.bidirectionalBFS(sourceId, targetId);

    if (astarResult && astarResult.path.length > 0) {
      // Found path via mutual connections
      const intermediaryCount = astarResult.path.length - 2;
      const hopCount = astarResult.path.length - 1; // Number of edges/hops in path
      const acceptanceRate = calculateMutualConnectionAcceptanceRate(hopCount);

      console.log(
        `[Uproot] [PATH] Found ${hopCount}-hop mutual connection path with ${(acceptanceRate * 100).toFixed(0)}% estimated acceptance`
      );

      return {
        type: 'mutual',
        confidence: astarResult.probability,
        path: {
          nodes: astarResult.path,
          edges: [], // Would be populated by actual graph
          totalWeight: 1 - astarResult.probability,
          successProbability: astarResult.probability,
          mutualConnections: astarResult.mutualConnections,
        },
        estimatedAcceptanceRate: acceptanceRate, // Hop-based: 85% (1-hop), 65% (2-hop), 45% (3-hop)
        reasoning: `Found path via ${intermediaryCount} ${intermediaryCount === 1 ? 'intermediary' : 'intermediaries'} with ${astarResult.mutualConnections} mutual connections`,
        nextSteps: generateMutualNextSteps(astarResult.path, targetUser),
      };
    }
  } catch (error) {
    console.warn('A* pathfinding failed, falling back to similarity-based strategies:', error);
  }

  return null;
}
