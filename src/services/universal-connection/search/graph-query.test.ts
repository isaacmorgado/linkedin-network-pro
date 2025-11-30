/**
 * Graph Query Engine Tests
 * Comprehensive test suite for local IndexedDB search functionality
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  searchGraph,
  searchByCompany,
  searchByDegree,
  getNodeCount,
  getGraphStats,
} from './graph-query';
import { networkDB, clearAllData } from '@/lib/storage/network-db';
import type { NetworkNode } from '@/types';
import type { SearchQuery } from '@/types/search';

// ============================================================================
// TEST DATA
// ============================================================================

const mockNodes: NetworkNode[] = [
  {
    id: 'node-1',
    profile: {
      id: 'profile-1',
      name: 'Jane Smith',
      headline: 'Senior Software Engineer at Google',
      location: 'San Francisco, CA',
      industry: 'Technology',
      avatarUrl: 'https://example.com/avatar1.jpg',
      about: 'Passionate software engineer with 8 years of experience',
      experience: [
        { company: 'Google', title: 'Senior Software Engineer', duration: '3 years' },
        { company: 'Microsoft', title: 'Software Engineer', duration: '2 years' },
      ],
      education: [
        { school: 'Stanford University', degree: 'BS', field: 'Computer Science' },
      ],
      skills: [
        { name: 'JavaScript', endorsementCount: 0, endorsedBy: [] },
        { name: 'TypeScript', endorsementCount: 0, endorsedBy: [] },
        { name: 'React', endorsementCount: 0, endorsedBy: [] },
        { name: 'Node.js', endorsementCount: 0, endorsedBy: [] },
      ],
      connections: 500,
      mutualConnections: ['user-1', 'user-2'],
      recentPosts: [],
      certifications: [],
      userPosts: [],
      engagedPosts: [],
      recentActivity: [],
      scrapedAt: new Date().toISOString(),
    },
    status: 'connected',
    degree: 1,
    matchScore: 85,
    activityScore: 75,
  },
  {
    id: 'node-2',
    profile: {
      id: 'profile-2',
      name: 'John Doe',
      headline: 'Product Manager at Netflix',
      location: 'Los Angeles, CA',
      industry: 'Entertainment',
      experience: [
        { company: 'Netflix', title: 'Product Manager', duration: '2 years' },
      ],
      education: [],
      skills: [

        { name: 'Product Management', endorsementCount: 0, endorsedBy: [] },

        { name: 'Strategy', endorsementCount: 0, endorsedBy: [] },

      ],
      connections: 300,
      mutualConnections: [],
      recentPosts: [],
      certifications: [],
      userPosts: [],
      engagedPosts: [],
      recentActivity: [],
      scrapedAt: new Date().toISOString(),
    },
    status: 'connected',
    degree: 2,
    matchScore: 70,
  },
  {
    id: 'node-3',
    profile: {
      id: 'profile-3',
      name: 'Alice Johnson',
      headline: 'HR Manager at Netflix',
      location: 'Los Angeles, CA',
      industry: 'Entertainment',
      experience: [
        { company: 'Netflix', title: 'HR Manager', duration: '4 years' },
        { company: 'Hulu', title: 'HR Specialist', duration: '2 years' },
      ],
      education: [
        { school: 'UCLA', degree: 'MBA' },
      ],
      skills: [

        { name: 'Human Resources', endorsementCount: 0, endorsedBy: [] },

        { name: 'Recruiting', endorsementCount: 0, endorsedBy: [] },

        { name: 'Employee Relations', endorsementCount: 0, endorsedBy: [] },

      ],
      connections: 1000,
      mutualConnections: ['user-3'],
      recentPosts: [],
      certifications: [],
      userPosts: [],
      engagedPosts: [],
      recentActivity: [],
      scrapedAt: new Date().toISOString(),
    },
    status: 'connected',
    degree: 2,
    matchScore: 80,
    activityScore: 60,
  },
  {
    id: 'node-4',
    profile: {
      id: 'profile-4',
      name: 'Bob Wilson',
      headline: 'Senior Product Manager at Google',
      location: 'Mountain View, CA',
      industry: 'Technology',
      experience: [
        { company: 'Google', title: 'Senior Product Manager', duration: '5 years' },
      ],
      education: [
        { school: 'MIT', degree: 'MS', field: 'Engineering' },
      ],
      skills: [

        { name: 'Product Strategy', endorsementCount: 0, endorsedBy: [] },

        { name: 'Analytics', endorsementCount: 0, endorsedBy: [] },

      ],
      connections: 750,
      mutualConnections: ['user-1'],
      recentPosts: [],
      certifications: [],
      userPosts: [],
      engagedPosts: [],
      recentActivity: [],
      scrapedAt: new Date().toISOString(),
    },
    status: 'connected',
    degree: 1,
    matchScore: 90,
  },
  {
    id: 'node-5',
    profile: {
      id: 'profile-5',
      name: 'Carol Martinez',
      headline: 'Junior Engineer at Startup',
      location: 'Austin, TX',
      industry: 'Technology',
      experience: [
        { company: 'Startup Inc', title: 'Junior Engineer', duration: '1 year' },
      ],
      education: [],
      skills: [

        { name: 'Python', endorsementCount: 0, endorsedBy: [] },

        { name: 'JavaScript', endorsementCount: 0, endorsedBy: [] },

      ],
      connections: 50,
      mutualConnections: [],
      recentPosts: [],
      certifications: [],
      userPosts: [],
      engagedPosts: [],
      recentActivity: [],
      scrapedAt: new Date().toISOString(),
    },
    status: 'not_contacted',
    degree: 3,
    matchScore: 40,
  },
];

// ============================================================================
// SETUP & TEARDOWN
// ============================================================================

beforeEach(async () => {
  // Clear database and insert test data
  await clearAllData();
  await networkDB.nodes.bulkAdd(mockNodes);
});

afterEach(async () => {
  // Clean up after each test
  await clearAllData();
});

// ============================================================================
// BASIC SEARCH TESTS
// ============================================================================

describe('searchGraph - Basic Functionality', () => {
  it('should return all nodes when query is empty', async () => {
    const query: SearchQuery = { query: '', filters: undefined };
    const results = await searchGraph(query);

    expect(results.length).toBe(5);
  });

  it('should search by name', async () => {
    const query: SearchQuery = { query: 'Jane Smith', filters: undefined };
    const results = await searchGraph(query);

    expect(results.length).toBeGreaterThan(0);
    expect(results[0]?.name).toBe('Jane Smith');
  });

  it('should search by partial name', async () => {
    const query: SearchQuery = { query: 'Smith', filters: undefined };
    const results = await searchGraph(query);

    expect(results.length).toBeGreaterThan(0);
    expect(results.some(r => r.name.includes('Smith'))).toBe(true);
  });

  it('should search by company in headline', async () => {
    const query: SearchQuery = { query: 'Google', filters: undefined };
    const results = await searchGraph(query);

    expect(results.length).toBeGreaterThan(0);
    expect(results.some(r => r.company?.includes('Google'))).toBe(true);
  });

  it('should search by role', async () => {
    const query: SearchQuery = { query: 'engineer', filters: undefined };
    const results = await searchGraph(query);

    expect(results.length).toBeGreaterThan(0);
    expect(results.some(r => r.headline?.toLowerCase().includes('engineer'))).toBe(true);
  });

  it('should be case insensitive', async () => {
    const query: SearchQuery = { query: 'JANE SMITH', filters: undefined };
    const results = await searchGraph(query);

    expect(results.length).toBeGreaterThan(0);
    expect(results[0]?.name).toBe('Jane Smith');
  });
});

// ============================================================================
// FILTER TESTS
// ============================================================================

describe('searchGraph - Company Filter', () => {
  it('should filter by company', async () => {
    const query: SearchQuery = {
      query: '',
      filters: { company: 'Google' },
    };
    const results = await searchGraph(query);

    expect(results.length).toBe(2); // Jane and Bob
    expect(results.every(r => r.company?.includes('Google'))).toBe(true);
  });

  it('should filter by company case insensitive', async () => {
    const query: SearchQuery = {
      query: '',
      filters: { company: 'netflix' },
    };
    const results = await searchGraph(query);

    expect(results.length).toBe(2); // John and Alice
    expect(results.every(r => r.company?.toLowerCase().includes('netflix'))).toBe(true);
  });

  it('should combine query and company filter', async () => {
    const query: SearchQuery = {
      query: 'HR',
      filters: { company: 'Netflix' },
    };
    const results = await searchGraph(query);

    expect(results.length).toBe(1);
    expect(results[0]?.name).toBe('Alice Johnson');
    expect(results[0]?.company).toBe('Netflix');
  });
});

describe('searchGraph - Location Filter', () => {
  it('should filter by location', async () => {
    const query: SearchQuery = {
      query: '',
      filters: { location: 'Los Angeles' },
    };
    const results = await searchGraph(query);

    expect(results.length).toBe(2); // John and Alice
    expect(results.every(r => r.name === 'John Doe' || r.name === 'Alice Johnson')).toBe(true);
  });

  it('should filter by location abbreviation', async () => {
    const query: SearchQuery = {
      query: '',
      filters: { location: 'CA' },
    };
    const results = await searchGraph(query);

    expect(results.length).toBeGreaterThan(0);
    expect(results.every(r => r.name !== 'Carol Martinez')).toBe(true); // Carol is in TX
  });
});

describe('searchGraph - Role Filter', () => {
  it('should filter by role', async () => {
    const query: SearchQuery = {
      query: '',
      filters: { role: 'senior' },
    };
    const results = await searchGraph(query);

    expect(results.length).toBe(2); // Jane (Senior SWE) and Bob (Senior PM)
    expect(results.every(r => r.headline?.toLowerCase().includes('senior'))).toBe(true);
  });

  it('should filter by role: junior', async () => {
    const query: SearchQuery = {
      query: '',
      filters: { role: 'junior' },
    };
    const results = await searchGraph(query);

    expect(results.length).toBe(1);
    expect(results[0]?.name).toBe('Carol Martinez');
  });

  it('should filter by role: manager', async () => {
    const query: SearchQuery = {
      query: '',
      filters: { role: 'manager' },
    };
    const results = await searchGraph(query);

    expect(results.length).toBe(3); // John (PM), Alice (HR Manager), Bob (Senior PM)
  });
});

describe('searchGraph - Connection Degree Filter', () => {
  it('should filter by 1st degree connections', async () => {
    const query: SearchQuery = {
      query: '',
      filters: { connectionDegree: [1] },
    };
    const results = await searchGraph(query);

    expect(results.length).toBe(2); // Jane and Bob
    expect(results.every(r => r.connectionDegree === 1)).toBe(true);
  });

  it('should filter by 2nd degree connections', async () => {
    const query: SearchQuery = {
      query: '',
      filters: { connectionDegree: [2] },
    };
    const results = await searchGraph(query);

    expect(results.length).toBe(2); // John and Alice
    expect(results.every(r => r.connectionDegree === 2)).toBe(true);
  });

  it('should filter by multiple degrees', async () => {
    const query: SearchQuery = {
      query: '',
      filters: { connectionDegree: [1, 2] },
    };
    const results = await searchGraph(query);

    expect(results.length).toBe(4); // All except Carol (3rd degree)
    expect(results.every(r => r.connectionDegree === 1 || r.connectionDegree === 2)).toBe(true);
  });

  it('should filter by 3rd degree connections', async () => {
    const query: SearchQuery = {
      query: '',
      filters: { connectionDegree: [3] },
    };
    const results = await searchGraph(query);

    expect(results.length).toBe(1); // Only Carol
    expect(results[0]?.name).toBe('Carol Martinez');
  });
});

describe('searchGraph - Years of Experience Filter', () => {
  it('should filter by minimum years of experience', async () => {
    const query: SearchQuery = {
      query: '',
      filters: { yearsExperience: { min: 2 } },
    };
    const results = await searchGraph(query);

    // Jane (2 experiences), Alice (2 experiences)
    expect(results.length).toBeGreaterThanOrEqual(2);
  });

  it('should filter by exact years of experience', async () => {
    const query: SearchQuery = {
      query: '',
      filters: { yearsExperience: { min: 1, max: 1 } },
    };
    const results = await searchGraph(query);

    // John (1 experience), Bob (1 experience), Carol (1 experience)
    expect(results.length).toBeGreaterThanOrEqual(1);
  });
});

// ============================================================================
// SCORING & SORTING TESTS
// ============================================================================

describe('searchGraph - Match Scoring', () => {
  it('should score 1st degree connections higher than 2nd', async () => {
    const query: SearchQuery = { query: '', filters: undefined };
    const results = await searchGraph(query);

    // Jane and Bob (1st degree) should rank higher than John and Alice (2nd degree)
    const firstDegreeResults = results.filter(r => r.connectionDegree === 1);
    const secondDegreeResults = results.filter(r => r.connectionDegree === 2);

    if (firstDegreeResults.length > 0 && secondDegreeResults.length > 0) {
      expect(firstDegreeResults[0]!.matchScore).toBeGreaterThan(secondDegreeResults[0]!.matchScore);
    }
  });

  it('should include match scores between 0-100', async () => {
    const query: SearchQuery = { query: 'engineer', filters: undefined };
    const results = await searchGraph(query);

    expect(results.every(r => r.matchScore >= 0 && r.matchScore <= 100)).toBe(true);
  });

  it('should sort results by match score descending', async () => {
    const query: SearchQuery = { query: 'Google', filters: undefined };
    const results = await searchGraph(query);

    for (let i = 1; i < results.length; i++) {
      expect(results[i - 1]!.matchScore).toBeGreaterThanOrEqual(results[i]!.matchScore);
    }
  });

  it('should include reasoning for each match', async () => {
    const query: SearchQuery = { query: 'engineer', filters: undefined };
    const results = await searchGraph(query);

    expect(results.every(r => r.reasoning.length > 0)).toBe(true);
  });
});

// ============================================================================
// RESULT LIMITING TESTS
// ============================================================================

describe('searchGraph - Result Limiting', () => {
  it('should limit results to 50', async () => {
    // Add more nodes to test limit
    const extraNodes: NetworkNode[] = [];
    for (let i = 6; i <= 60; i++) {
      extraNodes.push({
        id: `node-${i}`,
        profile: {
          id: `profile-${i}`,
          name: `Person ${i}`,
          headline: 'Engineer',
          experience: [],
          education: [],
          skills: [],
          connections: 100,
          mutualConnections: [],
          recentPosts: [],
          certifications: [],
          userPosts: [],
          engagedPosts: [],
          recentActivity: [],
          scrapedAt: new Date().toISOString(),
        },
        status: 'connected',
        degree: 2,
        matchScore: 50,
      });
    }
    await networkDB.nodes.bulkAdd(extraNodes);

    const query: SearchQuery = { query: '', filters: undefined };
    const results = await searchGraph(query);

    expect(results.length).toBeLessThanOrEqual(50);
  });
});

// ============================================================================
// SPECIALIZED SEARCH TESTS
// ============================================================================

describe('searchByCompany', () => {
  it('should search by company name', async () => {
    const results = await searchByCompany('Google');

    expect(results.length).toBe(2);
    expect(results.every(r => r.company?.includes('Google'))).toBe(true);
  });

  it('should limit results', async () => {
    const results = await searchByCompany('Google', 1);

    expect(results.length).toBe(1);
  });
});

describe('searchByDegree', () => {
  it('should search by 1st degree', async () => {
    const results = await searchByDegree(1);

    expect(results.length).toBe(2);
    expect(results.every(r => r.connectionDegree === 1)).toBe(true);
  });

  it('should search by 2nd degree', async () => {
    const results = await searchByDegree(2);

    expect(results.length).toBe(2);
    expect(results.every(r => r.connectionDegree === 2)).toBe(true);
  });

  it('should limit results', async () => {
    const results = await searchByDegree(1, 1);

    expect(results.length).toBe(1);
  });
});

// ============================================================================
// STATISTICS TESTS
// ============================================================================

describe('getNodeCount', () => {
  it('should return total node count', async () => {
    const count = await getNodeCount();

    expect(count).toBe(5);
  });
});

describe('getGraphStats', () => {
  it('should return graph statistics', async () => {
    const stats = await getGraphStats();

    expect(stats.totalNodes).toBe(5);
    expect(stats.firstDegree).toBe(2);
    expect(stats.secondDegree).toBe(2);
    expect(stats.thirdDegree).toBe(1);
  });
});

// ============================================================================
// ERROR HANDLING TESTS
// ============================================================================

describe('searchGraph - Error Handling', () => {
  it('should handle empty database gracefully', async () => {
    await clearAllData();

    const query: SearchQuery = { query: 'test', filters: undefined };
    const results = await searchGraph(query);

    expect(results).toEqual([]);
  });

  it('should handle invalid filters gracefully', async () => {
    const query: SearchQuery = {
      query: '',
      filters: { company: 'NonexistentCompany' },
    };
    const results = await searchGraph(query);

    expect(results).toEqual([]);
  });
});

// ============================================================================
// INTEGRATION TESTS
// ============================================================================

describe('searchGraph - Integration Tests', () => {
  it('should handle complex multi-filter query', async () => {
    const query: SearchQuery = {
      query: 'manager',
      filters: {
        company: 'Netflix',
        location: 'Los Angeles',
        connectionDegree: [2],
      },
    };
    const results = await searchGraph(query);

    expect(results.length).toBeGreaterThan(0);
    expect(results.every(r => r.connectionDegree === 2)).toBe(true);
    expect(results.some(r => r.company?.includes('Netflix'))).toBe(true);
  });

  it('should return results sorted by relevance', async () => {
    const query: SearchQuery = {
      query: 'engineer',
      filters: undefined,
    };
    const results = await searchGraph(query);

    // Should have engineers in results
    expect(results.length).toBeGreaterThan(0);

    // Results should be sorted (descending match score or ascending degree)
    for (let i = 1; i < results.length; i++) {
      const prev = results[i - 1]!;
      const curr = results[i]!;

      if (prev.matchScore === curr.matchScore) {
        // If scores equal, should be sorted by degree (lower = better)
        expect(prev.connectionDegree).toBeLessThanOrEqual(curr.connectionDegree);
      } else {
        // Otherwise sorted by score (higher = better)
        expect(prev.matchScore).toBeGreaterThan(curr.matchScore);
      }
    }
  });

  it('should handle query similar to real user input', async () => {
    const query: SearchQuery = {
      query: 'HR',
      filters: {
        company: 'Netflix',
      },
    };
    const results = await searchGraph(query);

    expect(results.length).toBe(1);
    expect(results[0]?.name).toBe('Alice Johnson');
    expect(results[0]?.matchScore).toBeGreaterThan(0);
    expect(results[0]?.reasoning).toContain('at Netflix');
  });
});
