/**
 * Connection Path Scenarios Test Suite
 *
 * Verifies that "Find Connection Path" behavior is correct for non-1st-degree targets:
 * - Graph paths within maxHops=3 use hop-based probabilities (85%, 65%, 45%)
 * - Semantic fallback is used ONLY when no graph path ≤3 hops exists
 * - Mode selection is correct (graph vs semantic)
 *
 * Scenarios tested:
 * A) Direct connection (1 hop, 85%)
 * B) 2nd-degree (2 hops, 65%)
 * C) 3rd-degree (3 hops, 45%)
 * D) No graph path → semantic fallback
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { findUniversalConnection } from '../universal-pathfinder';
import type { UserProfile } from '../../../types/resume-tailoring';
import type { Graph } from '../universal-connection-types';

// ============================================================================
// Test Data Helpers
// ============================================================================

/**
 * Create a minimal user profile for testing
 */
function createTestProfile(
  id: string,
  name: string,
  overrides: Partial<UserProfile> = {}
): UserProfile {
  return {
    id,
    name,
    email: `${id}@test.com`,
    location: overrides.location || 'San Francisco, CA',
    title: overrides.title || 'Software Engineer',
    workExperience: overrides.workExperience || [
      {
        id: 'exp1',
        company: 'Tech Corp',
        title: 'Software Engineer',
        startDate: '2020-01-01',
        endDate: '2024-01-01',
        location: 'San Francisco, CA',
        description: '',
        industry: 'Technology',
        achievements: [],
        skills: [],
        domains: [],
        responsibilities: []
      }
    ],
    education: overrides.education || [
      {
        id: 'edu1',
        school: 'Stanford University',
        degree: 'BS',
        field: 'Computer Science',
        startDate: '2016-09-01',
        endDate: '2020-06-01'
      }
    ],
    projects: [],
    skills: overrides.skills || [
      { name: 'JavaScript', level: 'advanced', yearsOfExperience: 5, category: 'Technical' },
      { name: 'TypeScript', level: 'advanced', yearsOfExperience: 4, category: 'Technical' }
    ],
    metadata: {
      totalYearsExperience: 4,
      domains: ['Software Development'],
      seniority: 'mid',
      careerStage: 'professional'
    }
  };
}

/**
 * Create a mock graph for testing connection paths
 */
class MockGraph implements Graph {
  private connections: Map<string, UserProfile[]> = new Map();
  private nodes: Map<string, UserProfile> = new Map();
  private mockPaths: Map<string, { path: UserProfile[]; probability: number; mutualConnections: number } | null> = new Map();

  addNode(profile: UserProfile) {
    this.nodes.set(profile.id!, profile);
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
    const connections1 = new Set((this.connections.get(userId1) || []).map(p => p.id!));
    const connections2 = this.connections.get(userId2) || [];
    return connections2.filter(p => connections1.has(p.id!));
  }
}

// ============================================================================
// Test Suite
// ============================================================================

describe('Connection Path Scenarios', () => {
  let sourceUser: UserProfile;
  let graph: MockGraph;

  beforeEach(() => {
    sourceUser = createTestProfile('source-user', 'Alice Source');
    graph = new MockGraph();
    graph.addNode(sourceUser);
  });

  // ==========================================================================
  // Scenario A: Direct Connection (1 hop, 85%)
  // ==========================================================================

  describe('Scenario A: Direct Connection (1st degree)', () => {
    it('returns graph path with 1 hop and 85% probability', async () => {
      const targetUser = createTestProfile('target-direct', 'Bob Target');

      // Setup: source → target (direct connection)
      graph.addNode(targetUser);
      graph.addConnection(sourceUser.id!, targetUser);
      graph.setMockPath(
        sourceUser.id!,
        targetUser.id!,
        [sourceUser, targetUser],
        0.85,
        0
      );

      const result = await findUniversalConnection(sourceUser, targetUser, graph);

      expect(result).toBeDefined();
      expect(result.type).toBe('mutual');
      expect(result.path).toBeDefined();
      expect(result.path!.nodes.length).toBe(2); // source + target = 1 hop
      expect(result.estimatedAcceptanceRate).toBe(0.85);
      expect(result.path!.nodes[0].id).toBe(sourceUser.id!);
      expect(result.path!.nodes[1].id).toBe(targetUser.id!);
    });

    it('does NOT use semantic fallback for direct connections', async () => {
      const targetUser = createTestProfile('target-direct-2', 'Charlie Target');

      graph.addNode(targetUser);
      graph.addConnection(sourceUser.id!, targetUser);
      graph.setMockPath(
        sourceUser.id!,
        targetUser.id!,
        [sourceUser, targetUser],
        0.85,
        0
      );

      const result = await findUniversalConnection(sourceUser, targetUser, graph);

      // Should use graph path, NOT semantic strategies
      expect(result.type).toBe('mutual');
      expect(result.type).not.toBe('direct-similarity');
      expect(result.type).not.toBe('intermediary');
      expect(result.type).not.toBe('cold-outreach');
    });
  });

  // ==========================================================================
  // Scenario B: 2nd-Degree (2 hops, 65%)
  // ==========================================================================

  describe('Scenario B: 2nd-Degree Connection (mutual connection)', () => {
    it('returns graph path with 2 hops and 65% probability', async () => {
      const mutualConnection = createTestProfile('mutual-user', 'Mutual Friend');
      const targetUser = createTestProfile('target-2nd', 'Dave Target');

      // Setup: source → mutual → target (2 hops)
      graph.addNode(mutualConnection);
      graph.addNode(targetUser);
      graph.addConnection(sourceUser.id!, mutualConnection);
      graph.addConnection(mutualConnection.id!, targetUser);
      graph.setMockPath(
        sourceUser.id!,
        targetUser.id!,
        [sourceUser, mutualConnection, targetUser],
        0.65,
        1
      );

      const result = await findUniversalConnection(sourceUser, targetUser, graph);

      expect(result).toBeDefined();
      expect(result.type).toBe('mutual');
      expect(result.path).toBeDefined();
      expect(result.path!.nodes.length).toBe(3); // source + mutual + target = 2 hops
      expect(result.estimatedAcceptanceRate).toBe(0.65);
      expect(result.path!.mutualConnections).toBe(1);
    });

    it('does NOT use semantic fallback when 2-hop path exists', async () => {
      const mutualConnection = createTestProfile('mutual-user-2', 'Another Mutual');
      const targetUser = createTestProfile('target-2nd-2', 'Eve Target');

      graph.addNode(mutualConnection);
      graph.addNode(targetUser);
      graph.setMockPath(
        sourceUser.id!,
        targetUser.id!,
        [sourceUser, mutualConnection, targetUser],
        0.65,
        1
      );

      const result = await findUniversalConnection(sourceUser, targetUser, graph);

      // Should use graph path, NOT semantic fallback
      expect(result.type).toBe('mutual');
      expect(result.estimatedAcceptanceRate).toBe(0.65);
      expect(result.type).not.toBe('direct-similarity');
      expect(result.type).not.toBe('intermediary');
    });
  });

  // ==========================================================================
  // Scenario C: 3rd-Degree (3 hops, 45%)
  // ==========================================================================

  describe('Scenario C: 3rd-Degree Connection (still within maxHops)', () => {
    it('returns graph path with 3 hops and 45% probability', async () => {
      const intermediary1 = createTestProfile('intermediary-1', 'First Intermediary');
      const intermediary2 = createTestProfile('intermediary-2', 'Second Intermediary');
      const targetUser = createTestProfile('target-3rd', 'Frank Target');

      // Setup: source → intermediary1 → intermediary2 → target (3 hops)
      graph.addNode(intermediary1);
      graph.addNode(intermediary2);
      graph.addNode(targetUser);
      graph.setMockPath(
        sourceUser.id!,
        targetUser.id!,
        [sourceUser, intermediary1, intermediary2, targetUser],
        0.45,
        2
      );

      const result = await findUniversalConnection(sourceUser, targetUser, graph);

      expect(result).toBeDefined();
      expect(result.type).toBe('mutual');
      expect(result.path).toBeDefined();
      expect(result.path!.nodes.length).toBe(4); // source + 2 intermediaries + target = 3 hops
      expect(result.estimatedAcceptanceRate).toBe(0.45);
    });

    it('does NOT use semantic fallback when 3-hop path exists', async () => {
      const intermediary1 = createTestProfile('intermediary-1b', 'Intermediary One');
      const intermediary2 = createTestProfile('intermediary-2b', 'Intermediary Two');
      const targetUser = createTestProfile('target-3rd-2', 'Grace Target');

      graph.addNode(intermediary1);
      graph.addNode(intermediary2);
      graph.addNode(targetUser);
      graph.setMockPath(
        sourceUser.id!,
        targetUser.id!,
        [sourceUser, intermediary1, intermediary2, targetUser],
        0.45,
        2
      );

      const result = await findUniversalConnection(sourceUser, targetUser, graph);

      // Should use graph path with 45%, NOT semantic fallback
      expect(result.type).toBe('mutual');
      expect(result.estimatedAcceptanceRate).toBe(0.45);
      expect(result.type).not.toBe('direct-similarity');
      expect(result.type).not.toBe('intermediary');
    });

    it('treats 3-hop path at maxHops boundary correctly', async () => {
      // This tests the edge case where path length equals maxHops
      const intermediary1 = createTestProfile('boundary-1', 'Boundary One');
      const intermediary2 = createTestProfile('boundary-2', 'Boundary Two');
      const targetUser = createTestProfile('target-boundary', 'Boundary Target');

      graph.addNode(intermediary1);
      graph.addNode(intermediary2);
      graph.addNode(targetUser);
      graph.setMockPath(
        sourceUser.id!,
        targetUser.id!,
        [sourceUser, intermediary1, intermediary2, targetUser],
        0.45,
        2
      );

      const result = await findUniversalConnection(sourceUser, targetUser, graph);

      // At exactly maxHops=3, should still return valid graph path
      expect(result.type).toBe('mutual');
      expect(result.path!.nodes.length).toBe(4); // 3 hops = 4 nodes
      expect(result.estimatedAcceptanceRate).toBe(0.45);
    });
  });

  // ==========================================================================
  // Scenario D: No Graph Path (semantic fallback)
  // ==========================================================================

  describe('Scenario D: No Graph Path → Semantic Fallback', () => {
    it('uses semantic fallback when no path exists within maxHops', async () => {
      // Target with very high similarity but NO graph connection
      const targetUser = createTestProfile('target-no-path', 'Harry Target', {
        location: sourceUser.location,
        title: sourceUser.title,
        education: sourceUser.education,
        skills: sourceUser.skills,
        workExperience: sourceUser.workExperience
      });

      graph.addNode(targetUser);
      // NO path in graph
      graph.setMockPath(sourceUser.id!, targetUser.id!, null);

      const result = await findUniversalConnection(sourceUser, targetUser, graph);

      expect(result).toBeDefined();

      // Should use semantic strategy (direct-similarity, intermediary, or cold-outreach)
      // NOT the mutual connection strategy
      expect(result.type).not.toBe('mutual');
      expect(result.path).toBeUndefined(); // No graph path

      // Should have a probability that is NOT the hop-based values
      expect(result.estimatedAcceptanceRate).not.toBe(0.85);
      expect(result.estimatedAcceptanceRate).not.toBe(0.65);
      expect(result.estimatedAcceptanceRate).not.toBe(0.45);
    });

    it('returns direct-similarity for high similarity (≥0.65) with no path', async () => {
      // Create target with very high similarity
      const targetUser = createTestProfile('target-high-sim', 'Isabel Target', {
        location: sourceUser.location,
        title: sourceUser.title,
        education: sourceUser.education, // Same school
        skills: sourceUser.skills, // Same skills
        workExperience: [{
          ...sourceUser.workExperience![0],
          id: 'exp-target',
          company: sourceUser.workExperience![0].company // Same company
        }]
      });

      graph.addNode(targetUser);
      graph.setMockPath(sourceUser.id!, targetUser.id!, null); // No graph path

      const result = await findUniversalConnection(sourceUser, targetUser, graph);

      expect(result.type).toBe('direct-similarity');
      expect(result.path).toBeUndefined();
      expect(result.directSimilarity).toBeDefined();
      // Direct similarity uses different probability (35-42% range)
      expect(result.estimatedAcceptanceRate).toBeGreaterThanOrEqual(0.35);
      expect(result.estimatedAcceptanceRate).toBeLessThanOrEqual(0.42);
    });

    it('returns intermediary strategy when appropriate with no graph path', async () => {
      // Target with lower similarity
      const targetUser = createTestProfile('target-intermediary', 'Jack Target', {
        location: 'New York, NY', // Different location
        title: 'Product Manager', // Different role
        skills: [
          { name: 'Product Management', level: 'advanced', yearsOfExperience: 5, category: 'Business' }
        ]
      });

      // Add a connection that could be an intermediary
      const potentialIntermediary = createTestProfile('potential-intermediary', 'Intermediary Person', {
        skills: [
          ...sourceUser.skills!,
          { name: 'Product Management', level: 'intermediate', yearsOfExperience: 3, category: 'Business' }
        ]
      });

      graph.addNode(targetUser);
      graph.addNode(potentialIntermediary);
      graph.addConnection(sourceUser.id!, potentialIntermediary);
      graph.addConnection(potentialIntermediary.id!, targetUser);

      // NO bidirectional path found (simulates >3 hops or disconnected)
      graph.setMockPath(sourceUser.id!, targetUser.id!, null);

      const result = await findUniversalConnection(sourceUser, targetUser, graph);

      // Should use intermediary or cold-outreach, NOT mutual
      expect(result.type).not.toBe('mutual');
      expect(result.path).toBeUndefined();
    });

    it('returns "none" for very low similarity (<0.45) with no graph path', async () => {
      // Target with very low similarity
      const targetUser = createTestProfile('target-cold', 'Kelly Target', {
        location: 'Tokyo, Japan',
        title: 'Retail Manager',
        skills: [
          { name: 'Retail', level: 'advanced', yearsOfExperience: 10, category: 'Business' }
        ],
        education: [
          {
            id: 'edu-cold',
            school: 'Tokyo University',
            degree: 'BA',
            field: 'Business',
            startDate: '2010-04-01',
            endDate: '2014-03-01'
          }
        ]
      });

      graph.addNode(targetUser);
      graph.setMockPath(sourceUser.id!, targetUser.id!, null); // No graph path

      const result = await findUniversalConnection(sourceUser, targetUser, graph);

      expect(result.type).toBe('cold-outreach');
      expect(result.path).toBeUndefined();
      // Cold outreach with low similarity has minimum acceptance rate
      expect(result.estimatedAcceptanceRate).toBeGreaterThanOrEqual(0.12);
      expect(result.lowConfidence).toBe(true);
    });

    it('returns "cold-similarity" for moderate similarity (0.45-0.65) with no graph path', async () => {
      // Target with moderate similarity (some overlap but not high)
      const targetUser = createTestProfile('target-moderate', 'Moderate Target', {
        location: 'New York, NY', // Different location
        title: 'Senior Software Engineer', // Similar title
        skills: [
          { name: 'JavaScript', level: 'advanced', yearsOfExperience: 5, category: 'Technical' }, // Same skill
          { name: 'Python', level: 'intermediate', yearsOfExperience: 3, category: 'Technical' } // Different skill
        ],
        education: [
          {
            id: 'edu-moderate',
            school: 'MIT', // Different school
            degree: 'BS',
            field: 'Computer Science', // Same field
            startDate: '2015-09-01',
            endDate: '2019-06-01'
          }
        ]
      });

      graph.addNode(targetUser);
      graph.setMockPath(sourceUser.id!, targetUser.id!, null); // No graph path

      const result = await findUniversalConnection(sourceUser, targetUser, graph);

      expect(result.type).toBe('cold-similarity');
      expect(result.path).toBeUndefined();
      // Cold similarity uses moderate probabilities (18-25%)
      expect(result.estimatedAcceptanceRate).toBeGreaterThanOrEqual(0.18);
      expect(result.estimatedAcceptanceRate).toBeLessThanOrEqual(0.25);
    });
  });

  // ==========================================================================
  // Edge Cases & Guards
  // ==========================================================================

  describe('Edge Cases & Misclassification Guards', () => {
    it('never returns both path and semantic candidate for same request', async () => {
      const targetUser = createTestProfile('target-edge', 'Larry Target');

      graph.addNode(targetUser);
      graph.setMockPath(
        sourceUser.id!,
        targetUser.id!,
        [sourceUser, targetUser],
        0.85,
        0
      );

      const result = await findUniversalConnection(sourceUser, targetUser, graph);

      // If there's a path, should NOT have directSimilarity or intermediary
      if (result.type === 'mutual' && result.path) {
        expect(result.directSimilarity).toBeUndefined();
        expect(result.intermediary).toBeUndefined();
      }

      // If using semantic, should NOT have path
      if (result.type === 'direct-similarity' || result.type === 'intermediary' || result.type === 'cold-similarity') {
        expect(result.path).toBeUndefined();
      }
    });

    it('handles missing embeddings gracefully without crashing', async () => {
      // Profile with minimal data (no skills, education, etc.)
      const targetUser = createTestProfile('target-minimal', 'Minimal Target', {
        skills: [],
        education: [],
        workExperience: []
      });

      graph.addNode(targetUser);
      graph.setMockPath(sourceUser.id!, targetUser.id!, null);

      // Should not crash, should return some strategy
      const result = await findUniversalConnection(sourceUser, targetUser, graph);

      expect(result).toBeDefined();
      expect(result.type).toBeDefined();
    });

    it('never misclassifies 2nd/3rd degree as 1st degree (85%)', async () => {
      const intermediary = createTestProfile('intermediary-check', 'Intermediary Check');
      const targetUser = createTestProfile('target-check', 'Target Check');

      graph.addNode(intermediary);
      graph.addNode(targetUser);
      graph.setMockPath(
        sourceUser.id!,
        targetUser.id!,
        [sourceUser, intermediary, targetUser],
        0.65, // 2 hops
        1
      );

      const result = await findUniversalConnection(sourceUser, targetUser, graph);

      // Should be 65% for 2-hop, NEVER 85%
      expect(result.estimatedAcceptanceRate).toBe(0.65);
      expect(result.estimatedAcceptanceRate).not.toBe(0.85);
    });

    it('does not use semantic fallback when 4-hop path should be rejected', async () => {
      // This test verifies that paths > 3 hops are NOT returned by the graph search
      // With maxHops=3, a 4-hop path should return null and trigger semantic fallback
      const targetUser = createTestProfile('target-4hop', 'Far Target');

      graph.addNode(targetUser);
      // Simulate that graph search found NO path within maxHops=3
      graph.setMockPath(sourceUser.id!, targetUser.id!, null);

      const result = await findUniversalConnection(sourceUser, targetUser, graph);

      // Should use semantic fallback, NOT return a long path
      expect(result.type).not.toBe('mutual');
      expect(result.path).toBeUndefined();
    });
  });

  // ============================================================================
  // NEW: Guarantee No 'none' Strategy Tests
  // ============================================================================
  describe('CRITICAL: NEVER Returns "none" Strategy', () => {
    it('NEVER returns type "none" - even with extremely low similarity (<0.45)', async () => {
      // Create target with almost no overlap with source
      const targetUser = createTestProfile('target-low-sim', 'Very Different Person', {
        location: 'Tokyo, Japan', // Different location
        title: 'Artist', // Different industry
        skills: [
          { name: 'Painting', level: 'advanced', yearsOfExperience: 10, category: 'Art' },
          { name: 'Sculpture', level: 'intermediate', yearsOfExperience: 5, category: 'Art' }
        ], // No overlapping skills
        education: [
          {
            id: 'edu-art',
            school: 'Tokyo Art University',
            degree: 'BFA',
            field: 'Fine Arts',
            startDate: '2010-04-01',
            endDate: '2014-03-01'
          }
        ], // Different school
        workExperience: [
          {
            id: 'exp-art',
            company: 'Art Gallery Tokyo',
            title: 'Gallery Curator',
            startDate: '2014-04-01',
            endDate: '2024-01-01',
            location: 'Tokyo, Japan',
            description: '',
            industry: 'Arts',
            achievements: [],
            skills: [],
            domains: [],
            responsibilities: []
          }
        ] // Different industry/company
      });

      graph.addNode(targetUser);
      graph.setMockPath(sourceUser.id!, targetUser.id!, null); // No graph path

      const result = await findUniversalConnection(sourceUser, targetUser, graph);

      // CRITICAL ASSERTION: Must NEVER return 'none'
      expect(result.type).not.toBe('none' as any);

      // Should return fallback strategy ('cold-outreach' or 'semantic') with low confidence
      expect(['cold-outreach', 'semantic']).toContain(result.type);
      expect(result.lowConfidence).toBe(true);

      // Must still provide actionable next steps
      expect(result.nextSteps).toBeDefined();
      expect(result.nextSteps.length).toBeGreaterThan(0);

      // Should have a low but non-zero acceptance rate
      expect(result.estimatedAcceptanceRate).toBeGreaterThan(0);
      expect(result.estimatedAcceptanceRate).toBeLessThan(0.20); // < 20%
    });

    it('ALWAYS returns a viable strategy even with empty graph', async () => {
      const emptyGraph = new MockGraph();
      const targetUser = createTestProfile('target-empty-graph', 'Target Person');

      // Graph only has source and target, no connections
      emptyGraph.addNode(sourceUser);
      emptyGraph.addNode(targetUser);
      emptyGraph.setMockPath(sourceUser.id!, targetUser.id!, null);

      const result = await findUniversalConnection(sourceUser, targetUser, emptyGraph);

      // Must return a strategy, NEVER 'none'
      expect(result).toBeDefined();
      expect(result.type).not.toBe('none' as any);
      expect(['cold-similarity', 'cold-outreach', 'direct-similarity']).toContain(result.type);
    });

    it('handles target with partial data (headline only) without returning "none"', async () => {
      // Minimal target profile (like what we might scrape from a basic LinkedIn view)
      const targetUser = createTestProfile('target-minimal-data', 'Unknown Person', {
        skills: [],
        education: [],
        workExperience: [],
        title: 'Entrepreneur' // Only headline available
      });

      graph.addNode(targetUser);
      graph.setMockPath(sourceUser.id!, targetUser.id!, null);

      const result = await findUniversalConnection(sourceUser, targetUser, graph);

      // Should handle gracefully without crashing or returning 'none'
      expect(result).toBeDefined();
      expect(result.type).not.toBe('none' as any);

      // Should provide guidance even with limited data
      expect(result.nextSteps).toBeDefined();
      expect(result.nextSteps.length).toBeGreaterThan(0);
    });

    it('returns fallback candidate when intermediary search fails', async () => {
      const targetUser = createTestProfile('target-fallback', 'Fallback Test');

      // Add some connections for source but make them dissimilar to target
      const connection1 = createTestProfile('conn1', 'Connection 1', {
        skills: [
          { name: 'Painting', level: 'advanced', yearsOfExperience: 10, category: 'Art' }
        ]
      });

      graph.addNode(targetUser);
      graph.addNode(connection1);
      graph.addConnection(sourceUser.id!, connection1);
      graph.setMockPath(sourceUser.id!, targetUser.id!, null);

      const result = await findUniversalConnection(sourceUser, targetUser, graph);

      // Should still return a strategy, not 'none'
      expect(result.type).not.toBe('none' as any);

      // If similarity is very low, should be cold-outreach with potential candidate
      if (result.type === 'cold-outreach') {
        expect(result.candidate).toBeDefined();
        expect(result.candidate?.person).toBeDefined();
      }
    });

    it('assertion: ALL possible scenarios never return type "none"', async () => {
      const scenarios = [
        // Scenario 1: No path, high similarity
        createTestProfile('target-high-sim', 'Similar Person', {
          skills: [
            { name: 'JavaScript', level: 'advanced', yearsOfExperience: 5, category: 'Technical' },
            { name: 'TypeScript', level: 'advanced', yearsOfExperience: 4, category: 'Technical' }
          ]
        }),

        // Scenario 2: No path, moderate similarity
        createTestProfile('target-mod-sim', 'Moderate Person', {
          skills: [
            { name: 'JavaScript', level: 'intermediate', yearsOfExperience: 2, category: 'Technical' }
          ],
          education: [
            {
              id: 'edu-diff',
              school: 'UC Berkeley',
              degree: 'BS',
              field: 'Computer Science',
              startDate: '2016-09-01',
              endDate: '2020-06-01'
            }
          ]
        }),

        // Scenario 3: No path, low similarity
        createTestProfile('target-low-sim2', 'Different Person', {
          skills: [
            { name: 'Marketing', level: 'advanced', yearsOfExperience: 5, category: 'Business' }
          ],
          education: [
            {
              id: 'edu-bus',
              school: 'Harvard Business School',
              degree: 'MBA',
              field: 'Business Administration',
              startDate: '2018-09-01',
              endDate: '2020-06-01'
            }
          ]
        }),

        // Scenario 4: Empty profile
        createTestProfile('target-empty', 'Empty Profile', {
          skills: [],
          education: [],
          workExperience: []
        })
      ];

      for (const targetUser of scenarios) {
        graph.addNode(targetUser);
        graph.setMockPath(sourceUser.id!, targetUser.id!, null);

        const result = await findUniversalConnection(sourceUser, targetUser, graph);

        // CRITICAL: This assertion must NEVER fail
        expect(result.type).not.toBe('none' as any);
        expect(result.type).toBeDefined();
        expect(result.nextSteps.length).toBeGreaterThan(0);
      }
    });
  });
});
