/**
 * Graph Algorithms for LinkedIn Network Pathfinding
 *
 * Implements:
 * - Bidirectional BFS (500x faster than regular BFS)
 * - Dijkstra's Algorithm with priority queue
 * - Match score calculation
 * - Edge weight computation
 */

import Graph from 'graphology';
import { bidirectional } from 'graphology-shortest-path';
import { MinPriorityQueue } from '@datastructures-js/priority-queue';
import type { NetworkNode, NetworkEdge, ConnectionRoute, LinkedInProfile } from '@/types';

// ============================================================================
// Graph Construction
// ============================================================================

export class NetworkGraph {
  private graph: Graph;

  constructor() {
    this.graph = new Graph({ type: 'directed' });
  }

  /**
   * Add a node to the graph
   */
  addNode(node: NetworkNode): void {
    if (!this.graph.hasNode(node.id)) {
      this.graph.addNode(node.id, node);
    } else {
      this.graph.setNodeAttributes(node.id, node);
    }
  }

  /**
   * Add an edge to the graph
   */
  addEdge(edge: NetworkEdge): void {
    if (!this.graph.hasEdge(edge.from, edge.to)) {
      this.graph.addEdge(edge.from, edge.to, edge);
    }
  }

  /**
   * Find shortest path using bidirectional BFS
   */
  findShortestPath(sourceId: string, targetId: string): string[] | null {
    try {
      const path = bidirectional(this.graph, sourceId, targetId);
      return path;
    } catch (error) {
      console.error('Shortest path error:', error);
      return null;
    }
  }

  /**
   * Find weighted shortest path using Dijkstra's algorithm
   */
  findWeightedPath(sourceId: string, targetId: string): ConnectionRoute | null {
    try {
      const distances = new Map<string, number>();
      const previous = new Map<string, string>();
      const visited = new Set<string>();

      // Initialize distances
      this.graph.forEachNode((node) => {
        distances.set(node, Infinity);
      });
      distances.set(sourceId, 0);

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

        // Check all neighbors
        this.graph.forEachOutNeighbor(currentNode, (neighbor) => {
          if (visited.has(neighbor)) return;

          const edge = this.graph.getEdgeAttributes(currentNode, neighbor) as NetworkEdge;
          const weight = edge.weight || 1.0;
          const newDistance = (distances.get(currentNode) || Infinity) + weight;

          if (newDistance < (distances.get(neighbor) || Infinity)) {
            distances.set(neighbor, newDistance);
            previous.set(neighbor, currentNode);
            queue.enqueue({ node: neighbor, distance: newDistance });
          }
        });
      }

      // Reconstruct path
      if (!previous.has(targetId)) {
        return null; // No path found
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
        this.graph.getNodeAttributes(id) as NetworkNode
      );

      const edges: NetworkEdge[] = [];
      for (let i = 0; i < path.length - 1; i++) {
        edges.push(
          this.graph.getEdgeAttributes(path[i], path[i + 1]) as NetworkEdge
        );
      }

      const totalWeight = distances.get(targetId) || 0;
      const successProbability = this.calculateSuccessProbability(edges);

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

  /**
   * Calculate success probability based on edge weights
   * Lower weight = higher probability
   */
  private calculateSuccessProbability(edges: NetworkEdge[]): number {
    if (edges.length === 0) return 100;

    // Average weight
    const avgWeight = edges.reduce((sum, e) => sum + e.weight, 0) / edges.length;

    // Convert to probability (lower weight = higher probability)
    // Weight range: 0.1 to 1.0
    // Probability range: 90% to 10%
    const probability = 100 - (avgWeight * 80);

    return Math.max(10, Math.min(90, probability));
  }

  /**
   * Get all nodes
   */
  getAllNodes(): NetworkNode[] {
    const nodes: NetworkNode[] = [];
    this.graph.forEachNode((_, attrs) => {
      nodes.push(attrs as NetworkNode);
    });
    return nodes;
  }

  /**
   * Export graph for storage
   */
  export(): { nodes: NetworkNode[]; edges: NetworkEdge[] } {
    const nodes: NetworkNode[] = [];
    const edges: NetworkEdge[] = [];

    this.graph.forEachNode((_, attrs) => {
      nodes.push(attrs as NetworkNode);
    });

    this.graph.forEachEdge((_, attrs) => {
      edges.push(attrs as NetworkEdge);
    });

    return { nodes, edges };
  }

  /**
   * Import graph from storage
   */
  import(data: { nodes: NetworkNode[]; edges: NetworkEdge[] }): void {
    this.graph.clear();

    data.nodes.forEach((node) => this.addNode(node));
    data.edges.forEach((edge) => this.addEdge(edge));
  }
}

// ============================================================================
// Match Score Calculation
// ============================================================================

export function calculateMatchScore(
  profile1: LinkedInProfile,
  profile2: LinkedInProfile
): number {
  let score = 0;
  let maxScore = 0;

  // Mutual connections (40 points max)
  maxScore += 40;
  const mutualCount = profile1.mutualConnections?.length || 0;
  score += Math.min(40, mutualCount * 4);

  // Shared education (20 points max)
  maxScore += 20;
  const sharedSchools = profile1.education?.filter((edu1) =>
    profile2.education?.some((edu2) => edu2.school === edu1.school)
  ).length || 0;
  score += Math.min(20, sharedSchools * 10);

  // Shared previous companies (20 points max)
  maxScore += 20;
  const sharedCompanies = profile1.experience?.filter((exp1) =>
    profile2.experience?.some((exp2) => exp2.company === exp1.company)
  ).length || 0;
  score += Math.min(20, sharedCompanies * 10);

  // Shared skills (10 points max)
  maxScore += 10;
  const sharedSkills = profile1.skills?.filter((skill) =>
    profile2.skills?.includes(skill)
  ).length || 0;
  score += Math.min(10, sharedSkills * 2);

  // Same location (10 points max)
  maxScore += 10;
  if (profile1.location && profile2.location) {
    const loc1 = profile1.location.toLowerCase();
    const loc2 = profile2.location.toLowerCase();

    if (loc1 === loc2) {
      score += 10;
    } else if (loc1.includes(loc2) || loc2.includes(loc1)) {
      score += 5;
    }
  }

  // Convert to percentage
  return maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;
}

// ============================================================================
// Edge Weight Calculation
// ============================================================================

/**
 * Calculate edge weight for connection
 * Lower weight = stronger connection = more likely to help
 */
export function calculateEdgeWeight(
  from: LinkedInProfile,
  to: LinkedInProfile,
  matchScore: number
): number {
  let weight = 1.0; // Base weight

  // Match score reduces weight
  weight -= (matchScore / 100) * 0.3;

  // Same company gives strong boost
  const sameCompany = from.experience?.[0]?.company === to.experience?.[0]?.company;
  if (sameCompany) {
    weight -= 0.2;
  }

  // Same school
  const sameSchool = from.education?.some((edu1) =>
    to.education?.some((edu2) => edu2.school === edu1.school)
  );
  if (sameSchool) {
    weight -= 0.15;
  }

  // Recent activity (if available)
  const hasRecentActivity = to.recentPosts && to.recentPosts.length > 0;
  if (hasRecentActivity) {
    weight -= 0.1; // More likely to respond if active
  }

  // Ensure weight stays in valid range
  return Math.max(0.1, Math.min(1.0, weight));
}

// ============================================================================
// Example Usage
// ============================================================================

/**
 * Example: Build graph and find route
 */
export async function findConnectionRoute(
  currentUserId: string,
  targetUserId: string,
  networkData: { nodes: NetworkNode[]; edges: NetworkEdge[] }
): Promise<ConnectionRoute | null> {
  const graph = new NetworkGraph();

  // Import network data
  graph.import(networkData);

  // Find weighted path
  const route = graph.findWeightedPath(currentUserId, targetUserId);

  return route;
}
