/**
 * Bidirectional BFS
 * Fast shortest path algorithm using graphology's bidirectional search
 */

import Graph from 'graphology';
import { bidirectional } from 'graphology-shortest-path';

/**
 * Find shortest path using bidirectional BFS
 *
 * @param graph The graphology instance
 * @param sourceId Source node ID
 * @param targetId Target node ID
 * @returns Array of node IDs representing the path, or null if no path found
 */
export function findShortestPath(
  graph: Graph,
  sourceId: string,
  targetId: string
): string[] | null {
  try {
    const path = bidirectional(graph, sourceId, targetId);
    return path;
  } catch (error) {
    console.error('Shortest path error:', error);
    return null;
  }
}
