/**
 * Debug Graph Implementation
 * Mock graph for testing pathfinding logic
 */

import type { UserProfile } from '../../../types/resume-tailoring';
import type { Graph } from '../universal-connection-types';

export class DebugGraph implements Graph {
  private connections: Map<string, UserProfile[]> = new Map();
  private nodes: Map<string, UserProfile> = new Map();
  private mockPaths: Map<string, { path: UserProfile[]; probability: number; mutualConnections: number } | null> = new Map();

  addNode(profile: UserProfile) {
    if (profile.id) {
      this.nodes.set(profile.id, profile);
    }
  }

  addConnection(fromId: string, toProfile: UserProfile) {
    if (!this.connections.has(fromId)) {
      this.connections.set(fromId, []);
    }
    this.connections.get(fromId)!.push(toProfile);
  }

  setMockPath(
    sourceId: string,
    targetId: string,
    path: UserProfile[] | null,
    probability: number = 0.85,
    mutualConnections: number = 0
  ) {
    const key = `${sourceId}->${targetId}`;
    this.mockPaths.set(key, path ? { path, probability, mutualConnections } : null);
  }

  async getConnections(userId: string): Promise<UserProfile[]> {
    return this.connections.get(userId) || [];
  }

  async bidirectionalBFS(
    sourceId: string,
    targetId: string
  ): Promise<{ path: UserProfile[]; probability: number; mutualConnections: number } | null> {
    const key = `${sourceId}->${targetId}`;
    return this.mockPaths.get(key) || null;
  }

  getNode(nodeId: string): UserProfile | null {
    return this.nodes.get(nodeId) || null;
  }

  getMutualConnections(userId1: string, userId2: string): UserProfile[] {
    const connections1 = new Set((this.connections.get(userId1) || []).map(p => p.id));
    const connections2 = this.connections.get(userId2) || [];
    return connections2.filter(p => connections1.has(p.id));
  }
}
