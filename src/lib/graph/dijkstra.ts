/**
 * Dijkstra's Algorithm
 * Weighted shortest path using priority queue
 */

import Graph from 'graphology';
import { MinPriorityQueue } from '@datastructures-js/priority-queue';
import type { NetworkNode, NetworkEdge, ConnectionRoute } from '../../types';

/**
 * Calculate success probability based on hop count
 * For mutual connection paths, use research-backed hop-based values
 *
 * Hop-based probabilities (aligned with mutual connection strategy):
 * - 1-hop (direct): 85%
 * - 2-hop (one mutual): 65%
 * - 3-hop (two mutuals): 45%
 *
 * Note: Paths > 3 hops should not occur due to maxHops=3 limit.
 * If they do occur (for backward compatibility), use weight-based fallback.
 */
function calculateSuccessProbability(edges: NetworkEdge[]): number {
  if (edges.length === 0) return 100;

  const hopCount = edges.length;

  // Hop-based probability (matches mutual connection strategy)
  switch (hopCount) {
    case 1:
      return 85; // Direct connection
    case 2:
      return 65; // One mutual
    case 3:
      return 45; // Two mutuals
    default: {
      // This should not happen with maxHops=3, but included for backward compatibility
      console.warn(`[Uproot] Unexpected path length: ${hopCount} hops (maxHops should be 3)`);
      const avgWeight = edges.reduce((sum, e) => sum + e.weight, 0) / edges.length;
      const weightBasedProb = 100 - (avgWeight * 80);
      return Math.max(20, Math.min(30, weightBasedProb));
    }
  }
}

/**
 * Find weighted shortest path using Dijkstra's algorithm
 *
 * @param graph The graphology instance
 * @param sourceId Source node ID
 * @param targetId Target node ID
 * @param maxHops Maximum number of hops allowed (default: 3)
 * @returns ConnectionRoute with path details, or null if no path found within maxHops
 */
export function findWeightedPath(
  graph: Graph,
  sourceId: string,
  targetId: string,
  maxHops: number = 3
): ConnectionRoute | null {
  try {
    const distances = new Map<string, number>();
    const previous = new Map<string, string>();
    const visited = new Set<string>();
    const hopCounts = new Map<string, number>(); // Track hop count for each node

    // Initialize distances and hop counts
    graph.forEachNode((node) => {
      distances.set(node, Infinity);
      hopCounts.set(node, Infinity);
    });
    distances.set(sourceId, 0);
    hopCounts.set(sourceId, 0);

    // Priority queue: [node, distance]
    const queue = new MinPriorityQueue<{ node: string; distance: number }>(
      (item) => item.distance
    );
    queue.enqueue({ node: sourceId, distance: 0 });

    while (queue.size() > 0) {
      const current = queue.dequeue();
      if (!current) break;

      const currentNode = current.node;

      if (visited.has(currentNode)) continue;
      visited.add(currentNode);

      if (currentNode === targetId) break;

      const currentHops = hopCounts.get(currentNode) ?? 0;

      // Skip if we've reached maxHops (can't explore further)
      if (currentHops >= maxHops) continue;

      // Check all neighbors
      graph.forEachOutNeighbor(currentNode, (neighbor) => {
        if (visited.has(neighbor)) return;

        const edge = graph.getEdgeAttributes(currentNode, neighbor) as NetworkEdge;
        const weight = edge.weight || 1.0;
        const currentDistance = distances.get(currentNode) ?? Infinity;
        const neighborDistance = distances.get(neighbor) ?? Infinity;
        const newDistance = currentDistance + weight;
        const newHops = currentHops + 1;

        // Only update if within maxHops and better distance
        if (newHops <= maxHops && newDistance < neighborDistance) {
          distances.set(neighbor, newDistance);
          hopCounts.set(neighbor, newHops);
          previous.set(neighbor, currentNode);
          queue.enqueue({ node: neighbor, distance: newDistance });
        }
      });
    }

    // Reconstruct path
    if (!previous.has(targetId)) {
      return null; // No path found within maxHops
    }

    const path: string[] = [];
    let current = targetId;

    while (current !== sourceId) {
      path.unshift(current);
      current = previous.get(current)!;
    }
    path.unshift(sourceId);

    // Build route object
    const nodes: NetworkNode[] = path.map((id) =>
      graph.getNodeAttributes(id) as NetworkNode
    );

    const edges: NetworkEdge[] = [];
    for (let i = 0; i < path.length - 1; i++) {
      edges.push(
        graph.getEdgeAttributes(path[i], path[i + 1]) as NetworkEdge
      );
    }

    const totalWeight = distances.get(targetId) || 0;
    const successProbability = calculateSuccessProbability(edges);

    return {
      targetId,
      nodes,
      edges,
      totalWeight,
      successProbability,
      computedAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Dijkstra error:', error);
    return null;
  }
}
