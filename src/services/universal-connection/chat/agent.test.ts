/**
 * Chat Agent Tests
 * Validates conversation state management and multi-turn interactions
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ChatAgent } from './agent';
import type { SearchResult } from '@/types/search';
import type { UserProfile } from '@/types/resume-tailoring';
import type { Graph } from '../universal-connection-types';

// Mock dependencies
vi.mock('./intent-classifier', () => ({
  classifyIntent: vi.fn(),
}));

vi.mock('./response-generator', () => ({
  generateResponse: vi.fn(),
}));

import { classifyIntent } from './intent-classifier';
import { generateResponse } from './response-generator';

// ========================================================================
// Mock Data
// ========================================================================

const mockSearchResults: SearchResult[] = [
  {
    profileId: '1',
    name: 'Alice Johnson',
    headline: 'Senior Engineer',
    company: 'Google',
    role: 'Engineer',
    connectionDegree: 2,
    matchScore: 85,
    pathAvailable: true,
    reasoning: 'Match',
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
    reasoning: 'Match',
  },
];

const mockGraph: Graph = {
  getConnections: async () => [],
  getNode: () => null,
  getMutualConnections: () => [],
};

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

beforeEach(() => {
  vi.clearAllMocks();
});

// ========================================================================
// Basic Functionality Tests
// ========================================================================

describe('ChatAgent - Basic Functionality', () => {
  it('should process a chat message and return response', async () => {
    const agent = new ChatAgent();

    vi.mocked(classifyIntent).mockResolvedValue({
      type: 'SEARCH',
      confidence: 0.9,
      entities: { query: 'engineers' },
      reasoning: 'Search intent',
      rawMessage: 'Find engineers',
    });

    vi.mocked(generateResponse).mockResolvedValue({
      id: 'response-1',
      role: 'assistant',
      content: 'Found 2 engineers',
      timestamp: new Date().toISOString(),
    });

    const response = await agent.chat('Find engineers');

    expect(response.role).toBe('assistant');
    expect(response.content).toBe('Found 2 engineers');
    expect(classifyIntent).toHaveBeenCalledWith('Find engineers');
  });

  it('should add user message to history', async () => {
    const agent = new ChatAgent();

    vi.mocked(classifyIntent).mockResolvedValue({
      type: 'GENERAL',
      confidence: 0.9,
      entities: {},
      reasoning: 'General',
      rawMessage: 'Hello',
    });

    vi.mocked(generateResponse).mockResolvedValue({
      id: 'response-1',
      role: 'assistant',
      content: 'Hi!',
      timestamp: new Date().toISOString(),
    });

    await agent.chat('Hello');

    const history = agent.getHistory();
    expect(history).toHaveLength(2); // User message + assistant response
    expect(history[0].role).toBe('user');
    expect(history[0].content).toBe('Hello');
  });

  it('should set graph and source user', () => {
    const agent = new ChatAgent();

    agent.setGraph(mockGraph);
    agent.setSourceUser(mockSourceUser);

    // No error should be thrown
    expect(true).toBe(true);
  });
});

// ========================================================================
// Conversation History Tests
// ========================================================================

describe('ChatAgent - Conversation History', () => {
  it('should maintain conversation history', async () => {
    const agent = new ChatAgent();

    vi.mocked(classifyIntent).mockResolvedValue({
      type: 'GENERAL',
      confidence: 0.9,
      entities: {},
      reasoning: 'General',
      rawMessage: 'test',
    });

    vi.mocked(generateResponse).mockResolvedValue({
      id: 'response-1',
      role: 'assistant',
      content: 'Response',
      timestamp: new Date().toISOString(),
    });

    await agent.chat('Message 1');
    await agent.chat('Message 2');
    await agent.chat('Message 3');

    const history = agent.getHistory();
    expect(history.length).toBe(6); // 3 user + 3 assistant messages
  });

  it('should limit history to 10 messages', async () => {
    const agent = new ChatAgent();

    vi.mocked(classifyIntent).mockResolvedValue({
      type: 'GENERAL',
      confidence: 0.9,
      entities: {},
      reasoning: 'General',
      rawMessage: 'test',
    });

    vi.mocked(generateResponse).mockResolvedValue({
      id: 'response-1',
      role: 'assistant',
      content: 'Response',
      timestamp: new Date().toISOString(),
    });

    // Send 7 messages (14 total with responses)
    for (let i = 0; i < 7; i++) {
      await agent.chat(`Message ${i}`);
    }

    const history = agent.getHistory();
    expect(history.length).toBe(10); // Limited to max 10
    expect(history[0].content).toBe('Message 2'); // Oldest messages dropped
  });

  it('should clear history', async () => {
    const agent = new ChatAgent();

    vi.mocked(classifyIntent).mockResolvedValue({
      type: 'GENERAL',
      confidence: 0.9,
      entities: {},
      reasoning: 'General',
      rawMessage: 'test',
    });

    vi.mocked(generateResponse).mockResolvedValue({
      id: 'response-1',
      role: 'assistant',
      content: 'Response',
      timestamp: new Date().toISOString(),
    });

    await agent.chat('Message 1');
    await agent.chat('Message 2');

    agent.clearHistory();

    const history = agent.getHistory();
    expect(history).toHaveLength(0);
  });
});

// ========================================================================
// Context Management Tests
// ========================================================================

describe('ChatAgent - Context Management', () => {
  it('should remember search results', async () => {
    const agent = new ChatAgent();

    vi.mocked(classifyIntent).mockResolvedValue({
      type: 'SEARCH',
      confidence: 0.9,
      entities: { query: 'engineers' },
      reasoning: 'Search',
      rawMessage: 'Find engineers',
    });

    vi.mocked(generateResponse).mockResolvedValue({
      id: 'response-1',
      role: 'assistant',
      content: 'Found results',
      timestamp: new Date().toISOString(),
      metadata: {
        searchResults: mockSearchResults,
      },
    });

    await agent.chat('Find engineers');

    const lastResults = agent.getLastSearchResults();
    expect(lastResults).toEqual(mockSearchResults);
  });

  it('should handle "tell me about the first one"', async () => {
    const agent = new ChatAgent();

    // First: search
    vi.mocked(classifyIntent).mockResolvedValueOnce({
      type: 'SEARCH',
      confidence: 0.9,
      entities: { query: 'engineers' },
      reasoning: 'Search',
      rawMessage: 'Find engineers',
    });

    vi.mocked(generateResponse).mockResolvedValueOnce({
      id: 'response-1',
      role: 'assistant',
      content: 'Found results',
      timestamp: new Date().toISOString(),
      metadata: {
        searchResults: mockSearchResults,
      },
    });

    await agent.chat('Find engineers');

    // Second: ask about first result
    vi.mocked(classifyIntent).mockResolvedValueOnce({
      type: 'GENERAL',
      confidence: 0.6,
      entities: { contextReference: 'first one' },
      reasoning: 'Context reference',
      rawMessage: 'Tell me about the first one',
    });

    vi.mocked(generateResponse).mockResolvedValueOnce({
      id: 'response-2',
      role: 'assistant',
      content: 'About Alice Johnson',
      timestamp: new Date().toISOString(),
    });

    await agent.chat('Tell me about the first one');

    // Check that generateResponse was called with resolved intent
    expect(generateResponse).toHaveBeenLastCalledWith(
      expect.objectContaining({
        type: 'FIND_PATH',
        entities: expect.objectContaining({
          target: 'Alice Johnson',
          targetCompany: 'Google',
        }),
      }),
      undefined,
      undefined
    );
  });

  it('should handle "second person"', async () => {
    const agent = new ChatAgent();

    // First: search
    vi.mocked(classifyIntent).mockResolvedValueOnce({
      type: 'SEARCH',
      confidence: 0.9,
      entities: {},
      reasoning: 'Search',
      rawMessage: 'Find people',
    });

    vi.mocked(generateResponse).mockResolvedValueOnce({
      id: 'response-1',
      role: 'assistant',
      content: 'Found results',
      timestamp: new Date().toISOString(),
      metadata: {
        searchResults: mockSearchResults,
      },
    });

    await agent.chat('Find people');

    // Second: ask about second result
    vi.mocked(classifyIntent).mockResolvedValueOnce({
      type: 'GENERAL',
      confidence: 0.6,
      entities: {},
      reasoning: 'Context',
      rawMessage: 'How can I reach the second person?',
    });

    vi.mocked(generateResponse).mockResolvedValueOnce({
      id: 'response-2',
      role: 'assistant',
      content: 'Path to Bob Smith',
      timestamp: new Date().toISOString(),
    });

    await agent.chat('How can I reach the second person?');

    expect(generateResponse).toHaveBeenLastCalledWith(
      expect.objectContaining({
        type: 'FIND_PATH',
        entities: expect.objectContaining({
          target: 'Bob Smith',
        }),
      }),
      undefined,
      undefined
    );
  });

  it('should handle pronoun references "them"', async () => {
    const agent = new ChatAgent();

    // First: search
    vi.mocked(classifyIntent).mockResolvedValueOnce({
      type: 'SEARCH',
      confidence: 0.9,
      entities: {},
      reasoning: 'Search',
      rawMessage: 'Find engineers',
    });

    vi.mocked(generateResponse).mockResolvedValueOnce({
      id: 'response-1',
      role: 'assistant',
      content: 'Found results',
      timestamp: new Date().toISOString(),
      metadata: {
        searchResults: mockSearchResults,
      },
    });

    await agent.chat('Find engineers');

    // Second: refer with pronoun
    vi.mocked(classifyIntent).mockResolvedValueOnce({
      type: 'GENERATE_MESSAGE',
      confidence: 0.8,
      entities: {},
      reasoning: 'Message',
      rawMessage: 'Draft a message to them',
    });

    vi.mocked(generateResponse).mockResolvedValueOnce({
      id: 'response-2',
      role: 'assistant',
      content: 'Message template',
      timestamp: new Date().toISOString(),
    });

    await agent.chat('Draft a message to them');

    expect(generateResponse).toHaveBeenLastCalledWith(
      expect.objectContaining({
        entities: expect.objectContaining({
          target: 'Alice Johnson',
        }),
      }),
      undefined,
      undefined
    );
  });
});

// ========================================================================
// Command Tests
// ========================================================================

describe('ChatAgent - Commands', () => {
  it('should handle "start over" command', async () => {
    const agent = new ChatAgent();

    vi.mocked(classifyIntent).mockResolvedValue({
      type: 'GENERAL',
      confidence: 0.9,
      entities: {},
      reasoning: 'General',
      rawMessage: 'test',
    });

    vi.mocked(generateResponse).mockResolvedValue({
      id: 'response-1',
      role: 'assistant',
      content: 'Response',
      timestamp: new Date().toISOString(),
      metadata: {
        searchResults: mockSearchResults,
      },
    });

    await agent.chat('Find engineers');
    expect(agent.getHistory().length).toBe(2);

    const response = await agent.chat('start over');

    expect(response.content).toContain('Conversation cleared');
    expect(agent.getHistory().length).toBe(0); // History completely cleared
    expect(agent.getLastSearchResults()).toBeUndefined();
  });

  it('should handle "clear" command', async () => {
    const agent = new ChatAgent();

    vi.mocked(classifyIntent).mockResolvedValue({
      type: 'GENERAL',
      confidence: 0.9,
      entities: {},
      reasoning: 'General',
      rawMessage: 'test',
    });

    vi.mocked(generateResponse).mockResolvedValue({
      id: 'response-1',
      role: 'assistant',
      content: 'Response',
      timestamp: new Date().toISOString(),
    });

    await agent.chat('Hello');

    const response = await agent.chat('clear');

    expect(response.content).toContain('Conversation cleared');
  });

  it('should handle "reset" command', async () => {
    const agent = new ChatAgent();

    const response = await agent.chat('reset');

    expect(response.content).toContain('Conversation cleared');
  });
});

// ========================================================================
// Refinement Tests
// ========================================================================

describe('ChatAgent - Query Refinement', () => {
  it('should handle search refinement', async () => {
    const agent = new ChatAgent();

    // First: broad search
    vi.mocked(classifyIntent).mockResolvedValueOnce({
      type: 'SEARCH',
      confidence: 0.9,
      entities: { query: 'engineers', company: 'Google' },
      reasoning: 'Search',
      rawMessage: 'Find engineers at Google',
    });

    vi.mocked(generateResponse).mockResolvedValueOnce({
      id: 'response-1',
      role: 'assistant',
      content: 'Found results',
      timestamp: new Date().toISOString(),
      metadata: {
        searchResults: mockSearchResults,
      },
    });

    await agent.chat('Find engineers at Google');

    // Second: refine with degree filter
    vi.mocked(classifyIntent).mockResolvedValueOnce({
      type: 'SEARCH',
      confidence: 0.8,
      entities: { connectionDegree: [2] },
      reasoning: 'Search refinement',
      rawMessage: 'Only 2nd degree',
    });

    vi.mocked(generateResponse).mockResolvedValueOnce({
      id: 'response-2',
      role: 'assistant',
      content: 'Refined results',
      timestamp: new Date().toISOString(),
    });

    await agent.chat('Only 2nd degree');

    // Should merge with previous query
    expect(generateResponse).toHaveBeenLastCalledWith(
      expect.objectContaining({
        type: 'SEARCH',
        entities: expect.objectContaining({
          query: 'engineers',
          company: 'Google',
          connectionDegree: [2],
        }),
      }),
      undefined,
      undefined
    );
  });
});

// ========================================================================
// Integration Tests
// ========================================================================

describe('ChatAgent - Integration', () => {
  it('should handle multi-turn conversation flow', async () => {
    const agent = new ChatAgent();
    agent.setGraph(mockGraph);
    agent.setSourceUser(mockSourceUser);

    // Turn 1: Search
    vi.mocked(classifyIntent).mockResolvedValueOnce({
      type: 'SEARCH',
      confidence: 0.9,
      entities: { query: 'HR', company: 'Netflix' },
      reasoning: 'Search',
      rawMessage: 'Find HR at Netflix',
    });

    vi.mocked(generateResponse).mockResolvedValueOnce({
      id: 'response-1',
      role: 'assistant',
      content: 'Found 3 people',
      timestamp: new Date().toISOString(),
      metadata: {
        searchResults: mockSearchResults,
      },
    });

    await agent.chat('Find HR at Netflix');

    // Turn 2: Ask about first result
    vi.mocked(classifyIntent).mockResolvedValueOnce({
      type: 'GENERAL',
      confidence: 0.7,
      entities: {},
      reasoning: 'Context',
      rawMessage: 'Tell me about the first one',
    });

    vi.mocked(generateResponse).mockResolvedValueOnce({
      id: 'response-2',
      role: 'assistant',
      content: 'About Alice Johnson',
      timestamp: new Date().toISOString(),
    });

    await agent.chat('Tell me about the first one');

    // Turn 3: Find path
    vi.mocked(classifyIntent).mockResolvedValueOnce({
      type: 'FIND_PATH',
      confidence: 0.9,
      entities: {},
      reasoning: 'Path',
      rawMessage: 'How can I reach them?',
    });

    vi.mocked(generateResponse).mockResolvedValueOnce({
      id: 'response-3',
      role: 'assistant',
      content: 'Path found',
      timestamp: new Date().toISOString(),
    });

    await agent.chat('How can I reach them?');

    const history = agent.getHistory();
    expect(history.length).toBe(6); // 3 user + 3 assistant
    expect(history[history.length - 1].content).toBe('Path found');
  });
});
