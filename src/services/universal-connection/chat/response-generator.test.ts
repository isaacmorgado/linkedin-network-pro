/**
 * Response Generator Tests
 * Validates response generation for all intent types
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generateResponse } from './response-generator';
import type { Intent } from './intent-classifier';
import type { SearchResult } from '@/types/search';
import type { UserProfile } from '@/types/resume-tailoring';
import type { Graph, ConnectionStrategy } from '../universal-connection-types';

// Mock searchGraph
vi.mock('../search/graph-query', () => ({
  searchGraph: vi.fn(),
}));

// Mock findUniversalConnection
vi.mock('../universal-pathfinder', () => ({
  findUniversalConnection: vi.fn(),
}));

import { searchGraph } from '../search/graph-query';
import { findUniversalConnection } from '../universal-pathfinder';

// ========================================================================
// Mock Data
// ========================================================================

const mockSearchResults: SearchResult[] = [
  {
    profileId: '1',
    name: 'Alice Johnson',
    headline: 'Senior Software Engineer',
    company: 'Google',
    role: 'Engineer',
    connectionDegree: 2,
    matchScore: 85,
    pathAvailable: true,
    reasoning: 'Strong match',
  },
  {
    profileId: '2',
    name: 'Bob Smith',
    headline: 'Product Manager',
    company: 'Meta',
    role: 'Manager',
    connectionDegree: 1,
    matchScore: 75,
    pathAvailable: true,
    reasoning: 'Good match',
  },
];

const mockSourceUser: UserProfile = {
  id: 'test-user',
  name: 'Test User',
  email: 'test@example.com',
  title: 'Software Engineer',
  workExperience: [],
  education: [],
  projects: [],
  skills: [],
  metadata: {
    totalYearsExperience: 3,
    domains: [],
    seniority: 'mid',
    careerStage: 'professional',
  },
};

const mockTargetUser: UserProfile = {
  id: 'alice-user',
  name: 'Alice Johnson',
  email: 'alice@google.com',
  title: 'Senior Software Engineer',
  workExperience: [
    {
      id: 'exp-1',
      title: 'Senior Software Engineer',
      company: 'Google',
      startDate: '2020-01',
      endDate: null,
      achievements: [],
      skills: [],
      domains: [],
      responsibilities: [],
    },
  ],
  education: [],
  projects: [],
  skills: [
    { name: 'TypeScript', level: 'advanced', yearsOfExperience: 5 },
    { name: 'React', level: 'advanced', yearsOfExperience: 5 },
  ],
  metadata: {
    totalYearsExperience: 8,
    domains: [],
    seniority: 'senior',
    careerStage: 'professional',
  },
};

const mockGraph: Graph = {
  getConnections: async () => [],
  getNode: () => null,
  getMutualConnections: () => [],
  // Add nodes for findUserByName to search through
  'alice-user': {
    id: 'alice-user',
    profile: mockTargetUser,
    status: 'not_contacted' as const,
    degree: 2,
    matchScore: 0,
  },
} as any;

const mockMutualStrategy: ConnectionStrategy = {
  type: 'mutual',
  confidence: 0.9,
  path: {
    nodes: [
      mockSourceUser,
      {
        id: 'intermediary',
        name: 'Intermediary Person',
        email: 'inter@example.com',
        title: 'Engineer',
        workExperience: [],
        education: [],
        projects: [],
        skills: [],
        metadata: {
          totalYearsExperience: 5,
          domains: [],
          seniority: 'mid',
          careerStage: 'professional',
        },
      },
      mockTargetUser,
    ],
    edges: [],
    totalWeight: 0.5,
    successProbability: 0.75,
    mutualConnections: 3,
  },
  estimatedAcceptanceRate: 0.55,
  reasoning: 'Strong mutual connection path',
  nextSteps: ['Reach out to Intermediary Person', 'Ask for introduction'],
};

const mockDirectStrategy: ConnectionStrategy = {
  type: 'direct-similarity',
  confidence: 0.8,
  directSimilarity: {
    overall: 0.72,
    breakdown: {
      industry: 0.8,
      skills: 0.65,
      education: 0.7,
      location: 0.6,
      companies: 0.75,
    },
  },
  estimatedAcceptanceRate: 0.42,
  reasoning: 'High profile similarity',
  nextSteps: ['Send personalized connection request'],
};

beforeEach(() => {
  vi.clearAllMocks();
});

// ========================================================================
// SEARCH Intent Tests
// ========================================================================

describe('Response Generator - SEARCH Intent', () => {
  it('should handle empty search results', async () => {
    const intent: Intent = {
      type: 'SEARCH',
      confidence: 0.9,
      entities: {
        query: 'engineers',
        company: 'Netflix',
      },
      reasoning: 'Search intent',
      rawMessage: 'Find engineers at Netflix',
    };

    vi.mocked(searchGraph).mockResolvedValue([]);

    const response = await generateResponse(intent, mockGraph);

    expect(response.role).toBe('assistant');
    expect(response.content).toContain('couldn\'t find anyone');
    expect(response.content).toContain('Netflix');
    expect(response.metadata?.searchResults).toEqual([]);
  });

  it('should handle single search result', async () => {
    const intent: Intent = {
      type: 'SEARCH',
      confidence: 0.9,
      entities: {
        query: 'product manager',
      },
      reasoning: 'Search intent',
      rawMessage: 'Find product managers',
    };

    vi.mocked(searchGraph).mockResolvedValue([mockSearchResults[0]]);

    const response = await generateResponse(intent, mockGraph);

    expect(response.role).toBe('assistant');
    expect(response.content).toContain('Alice Johnson');
    expect(response.content).toContain('Google');
    expect(response.metadata?.searchResults).toHaveLength(1);
  });

  it('should handle multiple search results (2-5)', async () => {
    const intent: Intent = {
      type: 'SEARCH',
      confidence: 0.9,
      entities: {
        query: 'engineers',
      },
      reasoning: 'Search intent',
      rawMessage: 'Find engineers',
    };

    vi.mocked(searchGraph).mockResolvedValue(mockSearchResults);

    const response = await generateResponse(intent, mockGraph);

    expect(response.role).toBe('assistant');
    expect(response.content).toContain('2 people');
    expect(response.content).toContain('Alice Johnson');
    expect(response.content).toContain('Bob Smith');
    expect(response.metadata?.searchResults).toHaveLength(2);
  });

  it('should handle many search results (6+)', async () => {
    const intent: Intent = {
      type: 'SEARCH',
      confidence: 0.9,
      entities: {
        query: 'engineers',
      },
      reasoning: 'Search intent',
      rawMessage: 'Find engineers',
    };

    const manyResults = Array(10).fill(null).map((_, i) => ({
      ...mockSearchResults[0],
      profileId: `person-${i}`,
      name: `Person ${i}`,
    }));

    vi.mocked(searchGraph).mockResolvedValue(manyResults);

    const response = await generateResponse(intent, mockGraph);

    expect(response.role).toBe('assistant');
    expect(response.content).toContain('10 professionals');
    expect(response.content).toContain('top 5');
    expect(response.metadata?.searchResults).toHaveLength(10);
  });

  it('should handle search without graph', async () => {
    const intent: Intent = {
      type: 'SEARCH',
      confidence: 0.9,
      entities: {},
      reasoning: 'Search intent',
      rawMessage: 'Find people',
    };

    const response = await generateResponse(intent); // No graph provided

    expect(response.role).toBe('assistant');
    expect(response.content).toContain('network graph');
    expect(response.content).toContain('LinkedIn data');
  });

  it('should include connection degree in results', async () => {
    const intent: Intent = {
      type: 'SEARCH',
      confidence: 0.9,
      entities: {
        connectionDegree: [2],
      },
      reasoning: 'Search intent',
      rawMessage: '2nd degree connections',
    };

    vi.mocked(searchGraph).mockResolvedValue([mockSearchResults[0]]);

    const response = await generateResponse(intent, mockGraph);

    expect(response.content).toContain('2nd degree');
  });
});

// ========================================================================
// FIND_PATH Intent Tests
// ========================================================================

describe('Response Generator - FIND_PATH Intent', () => {
  it('should handle mutual connection strategy', async () => {
    const intent: Intent = {
      type: 'FIND_PATH',
      confidence: 0.9,
      entities: {
        target: 'Alice Johnson',
      },
      reasoning: 'Path intent',
      rawMessage: 'How can I reach Alice Johnson?',
    };

    vi.mocked(findUniversalConnection).mockResolvedValue(mockMutualStrategy);

    const response = await generateResponse(intent, mockGraph, mockSourceUser);

    expect(response.role).toBe('assistant');
    expect(response.content).toContain('Alice Johnson');
    expect(response.content).toContain('Intermediary Person');
    expect(response.content).toContain('mutual');
    expect(response.metadata?.paths).toHaveLength(1);
  });

  it('should handle direct similarity strategy', async () => {
    const intent: Intent = {
      type: 'FIND_PATH',
      confidence: 0.9,
      entities: {
        target: 'Alice Johnson',
      },
      reasoning: 'Path intent',
      rawMessage: 'How can I reach Alice Johnson?',
    };

    vi.mocked(findUniversalConnection).mockResolvedValue(mockDirectStrategy);

    const response = await generateResponse(intent, mockGraph, mockSourceUser);

    expect(response.role).toBe('assistant');
    expect(response.content).toContain('profile similarity');
    expect(response.content).toContain('72%');
    expect(response.metadata?.paths).toHaveLength(1);
  });

  it('should handle target not found', async () => {
    const intent: Intent = {
      type: 'FIND_PATH',
      confidence: 0.9,
      entities: {
        target: 'Unknown Person',
      },
      reasoning: 'Path intent',
      rawMessage: 'How can I reach Unknown Person?',
    };

    const response = await generateResponse(intent, mockGraph, mockSourceUser);

    expect(response.role).toBe('assistant');
    expect(response.content).toContain('couldn\'t find');
    expect(response.content).toContain('Unknown Person');
  });

  it('should handle missing graph', async () => {
    const intent: Intent = {
      type: 'FIND_PATH',
      confidence: 0.9,
      entities: {
        target: 'Alice Johnson',
      },
      reasoning: 'Path intent',
      rawMessage: 'How can I reach Alice Johnson?',
    };

    const response = await generateResponse(intent, undefined, mockSourceUser);

    expect(response.role).toBe('assistant');
    expect(response.content).toContain('network graph');
  });

  it('should handle missing source user', async () => {
    const intent: Intent = {
      type: 'FIND_PATH',
      confidence: 0.9,
      entities: {
        target: 'Alice Johnson',
      },
      reasoning: 'Path intent',
      rawMessage: 'How can I reach Alice Johnson?',
    };

    const response = await generateResponse(intent, mockGraph);

    expect(response.role).toBe('assistant');
    expect(response.content).toContain('profile information');
  });

  it('should include estimated acceptance rate', async () => {
    const intent: Intent = {
      type: 'FIND_PATH',
      confidence: 0.9,
      entities: {
        target: 'Alice Johnson',
      },
      reasoning: 'Path intent',
      rawMessage: 'How can I reach Alice Johnson?',
    };

    vi.mocked(findUniversalConnection).mockResolvedValue(mockMutualStrategy);

    const response = await generateResponse(intent, mockGraph, mockSourceUser);

    expect(response.content).toContain('55%');
    expect(response.content).toContain('acceptance rate');
  });

  it('should include next steps', async () => {
    const intent: Intent = {
      type: 'FIND_PATH',
      confidence: 0.9,
      entities: {
        target: 'Alice Johnson',
      },
      reasoning: 'Path intent',
      rawMessage: 'How can I reach Alice Johnson?',
    };

    vi.mocked(findUniversalConnection).mockResolvedValue(mockMutualStrategy);

    const response = await generateResponse(intent, mockGraph, mockSourceUser);

    expect(response.content).toContain('Next steps');
    expect(response.content).toContain('Reach out to Intermediary Person');
  });
});

// ========================================================================
// GENERATE_MESSAGE Intent Tests
// ========================================================================

describe('Response Generator - GENERATE_MESSAGE Intent', () => {
  it('should return placeholder for message generation', async () => {
    const intent: Intent = {
      type: 'GENERATE_MESSAGE',
      confidence: 0.9,
      entities: {
        target: 'Alice Johnson',
      },
      reasoning: 'Message intent',
      rawMessage: 'Draft a message to Alice Johnson',
    };

    const response = await generateResponse(intent);

    expect(response.role).toBe('assistant');
    expect(response.content).toContain('Week 4');
    expect(response.content).toContain('Alice Johnson');
    expect(response.content).toContain('template');
  });

  it('should handle message generation without target', async () => {
    const intent: Intent = {
      type: 'GENERATE_MESSAGE',
      confidence: 0.9,
      entities: {},
      reasoning: 'Message intent',
      rawMessage: 'Draft a message',
    };

    const response = await generateResponse(intent);

    expect(response.role).toBe('assistant');
    expect(response.content).toContain('this person');
  });
});

// ========================================================================
// GENERAL Intent Tests
// ========================================================================

describe('Response Generator - GENERAL Intent', () => {
  it('should handle greeting', async () => {
    const intent: Intent = {
      type: 'GENERAL',
      confidence: 0.9,
      entities: {},
      reasoning: 'General intent',
      rawMessage: 'Hello!',
    };

    const response = await generateResponse(intent);

    expect(response.role).toBe('assistant');
    expect(response.content).toContain('Hello');
    expect(response.content).toContain('find people');
  });

  it('should handle thanks', async () => {
    const intent: Intent = {
      type: 'GENERAL',
      confidence: 0.9,
      entities: {},
      reasoning: 'General intent',
      rawMessage: 'Thanks!',
    };

    const response = await generateResponse(intent);

    expect(response.role).toBe('assistant');
    expect(response.content).toContain('welcome');
  });

  it('should handle help request', async () => {
    const intent: Intent = {
      type: 'GENERAL',
      confidence: 0.9,
      entities: {},
      reasoning: 'General intent',
      rawMessage: 'What can you do?',
    };

    const response = await generateResponse(intent);

    expect(response.role).toBe('assistant');
    expect(response.content).toContain('Search your network');
    expect(response.content).toContain('Discover connection paths');
    expect(response.content).toContain('Draft outreach messages');
  });

  it('should handle unknown general message', async () => {
    const intent: Intent = {
      type: 'GENERAL',
      confidence: 0.5,
      entities: {},
      reasoning: 'General intent',
      rawMessage: 'Random message',
    };

    const response = await generateResponse(intent);

    expect(response.role).toBe('assistant');
    expect(response.content).toContain('not sure');
    expect(response.content).toContain('Search your network');
  });

  it('should handle context reference', async () => {
    const intent: Intent = {
      type: 'GENERAL',
      confidence: 0.6,
      entities: {
        contextReference: 'that',
      },
      reasoning: 'General intent',
      rawMessage: 'Tell me more about that',
    };

    const response = await generateResponse(intent);

    expect(response.role).toBe('assistant');
    expect(response.content).toContain('more specific');
  });
});

// ========================================================================
// Edge Cases
// ========================================================================

describe('Response Generator - Edge Cases', () => {
  it('should handle errors gracefully', async () => {
    const intent: Intent = {
      type: 'SEARCH',
      confidence: 0.9,
      entities: {},
      reasoning: 'Search intent',
      rawMessage: 'Find people',
    };

    vi.mocked(searchGraph).mockRejectedValue(new Error('Database error'));

    const response = await generateResponse(intent, mockGraph);

    expect(response.role).toBe('assistant');
    expect(response.content).toContain('error');
    expect(response.content).toContain('try again');
  });

  it('should include message ID and timestamp', async () => {
    const intent: Intent = {
      type: 'GENERAL',
      confidence: 0.9,
      entities: {},
      reasoning: 'General intent',
      rawMessage: 'Hello',
    };

    const response = await generateResponse(intent);

    expect(response.id).toBeTruthy();
    expect(response.timestamp).toBeTruthy();
    expect(new Date(response.timestamp)).toBeInstanceOf(Date);
  });

  it('should limit metadata size for large result sets', async () => {
    const intent: Intent = {
      type: 'SEARCH',
      confidence: 0.9,
      entities: {},
      reasoning: 'Search intent',
      rawMessage: 'Find people',
    };

    const manyResults = Array(50).fill(null).map((_, i) => ({
      ...mockSearchResults[0],
      profileId: `person-${i}`,
      name: `Person ${i}`,
    }));

    vi.mocked(searchGraph).mockResolvedValue(manyResults);

    const response = await generateResponse(intent, mockGraph);

    // Should limit to 20 results in metadata
    expect(response.metadata?.searchResults?.length).toBe(20);
  });
});
