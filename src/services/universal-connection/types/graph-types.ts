/**
 * Graph Types
 * Types related to network graphs and search results
 */

import type { UserProfile } from '../../../types/resume-tailoring';

/**
 * Graph interface for universal pathfinding
 *
 * Minimal interface required by universal pathfinder
 */
export interface Graph {
  // Get user connections (1st degree)
  getConnections(userId: string): Promise<UserProfile[]>;

  // Try existing A* or BFS algorithm
  bidirectionalBFS?(sourceId: string, targetId: string): Promise<{
    path: UserProfile[];
    probability: number;
    mutualConnections: number;
  } | null>;

  // Get node by ID
  getNode?(nodeId: string): UserProfile | null;

  // Get mutual connections between two users
  getMutualConnections?(userId1: string, userId2: string): UserProfile[];
}

/**
 * Network Node
 * Represents a person in the network graph
 */
export interface NetworkNode {
  id: string;
  name: string;
  headline?: string;
  profileUrl: string;
  profileImage?: string;
  connectionDegree?: number; // 1, 2, or 3
  degree?: number; // Alias for connectionDegree
  company?: string;
  role?: string;
  location?: string;
  connectionDate?: string;
}

/**
 * Enhanced Connection Route
 * Route with pathfinding strategy and action steps
 */
export interface EnhancedConnectionRoute {
  path: NetworkNode[];
  strategy: string;
  successProbability: number; // 0-1
  actionSteps: string[];
  reasoning: string;
}

/**
 * Search Result
 * Result from universal network search
 */
export interface SearchResult {
  profile: NetworkNode;
  matchScore: number; // 0-100
  reasoning: string;
  pathAvailable: boolean;
}
