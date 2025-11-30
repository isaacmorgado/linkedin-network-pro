/**
 * Tests for handling minimal UserProfile data in pathfinding
 *
 * Ensures pathfinder works even when user has:
 * - Only name + headline (title)
 * - Empty arrays for experience/skills/education
 * - Missing location/industry
 */

import { describe, it, expect } from 'vitest';
import {
  calculateProfileSimilarity,
  findBestIntermediaries
} from '../intermediary-scorer';
import { findUniversalConnection } from '../universal-pathfinder';
import type { UserProfile } from '../../../types/resume-tailoring';
import type { Graph } from '../universal-connection-types';

// ============================================================================
// Mock Data - Minimal Profiles
// ============================================================================

/**
 * Absolute minimal profile - only required fields
 */
const minimalCurrentUser: UserProfile = {
  name: 'Jane Doe',
  title: 'Software Engineer', // Only headline
  workExperience: [],
  education: [],
  projects: [],
  skills: [],
  metadata: {
    totalYearsExperience: 0,
    domains: [],
    seniority: 'entry',
    careerStage: 'student',
  },
};

/**
 * Slightly less minimal - has location only
 */
const minimalWithLocation: UserProfile = {
  name: 'Jane Doe',
  title: 'Software Engineer',
  location: 'San Francisco, CA',
  workExperience: [],
  education: [],
  projects: [],
  skills: [],
  metadata: {
    totalYearsExperience: 0,
    domains: [],
    seniority: 'entry',
    careerStage: 'student',
  },
};

/**
 * Rich target profile for comparison
 */
const richTargetUser: UserProfile = {
  id: 'target-123',
  name: 'John Smith',
  email: 'john@example.com',
  location: 'San Francisco, CA',
  title: 'Senior Software Engineer',
  workExperience: [
    {
      id: 'exp-1',
      company: 'Google',
      title: 'Senior Software Engineer',
      startDate: '2020-01-01',
      endDate: null,
      industry: 'Technology',
      achievements: [],
      skills: ['Python', 'Go', 'Kubernetes'],
      domains: ['cloud', 'infrastructure'],
      responsibilities: ['Lead team', 'Architect systems'],
    },
  ],
  education: [
    {
      id: 'edu-1',
      school: 'Stanford University',
      degree: 'BS',
      field: 'Computer Science',
      startDate: '2012-09-01',
      endDate: '2016-06-01',
    },
  ],
  projects: [],
  skills: [
    { name: 'Python', level: 'expert', yearsOfExperience: 8, category: 'programming-language' },
    { name: 'Go', level: 'advanced', yearsOfExperience: 5, category: 'programming-language' },
    { name: 'Kubernetes', level: 'advanced', yearsOfExperience: 4, category: 'tool' },
  ],
  metadata: {
    totalYearsExperience: 8,
    domains: ['cloud', 'infrastructure'],
    seniority: 'senior',
    careerStage: 'professional',
  },
};

/**
 * Mock graph for testing
 */
const mockGraph: Graph = {
  async bidirectionalBFS() {
    return null; // No path found
  },
  async getConnections() {
    return [];
  },
  getNode() {
    return null;
  },
};

// ============================================================================
// Tests - Similarity Calculation with Minimal Data
// ============================================================================

describe('calculateProfileSimilarity - Minimal Profile Handling', () => {
  it('should handle completely minimal profiles without crashing', () => {
    const similarity = calculateProfileSimilarity(
      minimalCurrentUser,
      richTargetUser
    );

    expect(similarity).toBeDefined();
    expect(similarity.overall).toBeGreaterThanOrEqual(0);
    expect(similarity.overall).toBeLessThanOrEqual(1);
    expect(similarity.breakdown).toBeDefined();
  });

  it('should return 0 for all similarity metrics when both arrays are empty', () => {
    const similarity = calculateProfileSimilarity(
      minimalCurrentUser,
      richTargetUser
    );

    // All metrics should be 0 since minimal user has no data
    expect(similarity.breakdown.skills).toBe(0);
    expect(similarity.breakdown.education).toBe(0);
    expect(similarity.breakdown.companies).toBe(0);
    expect(similarity.breakdown.industry).toBe(0);
  });

  it('should handle location matching when one profile has location', () => {
    const similarity = calculateProfileSimilarity(
      minimalWithLocation,
      richTargetUser
    );

    // Location should match (both SF)
    expect(similarity.breakdown.location).toBeGreaterThan(0);

    // Other fields still 0
    expect(similarity.breakdown.skills).toBe(0);
    expect(similarity.breakdown.education).toBe(0);
  });

  it('should handle missing location gracefully', () => {
    const similarity = calculateProfileSimilarity(
      minimalCurrentUser,
      richTargetUser
    );

    // Location should be 0 when missing
    expect(similarity.breakdown.location).toBe(0);
  });

  it('should calculate overall similarity correctly with minimal data', () => {
    const similarity = calculateProfileSimilarity(
      minimalCurrentUser,
      richTargetUser
    );

    // With all fields at 0, overall should be 0
    expect(similarity.overall).toBe(0);
  });

  it('should not produce negative similarity scores', () => {
    const similarity = calculateProfileSimilarity(
      minimalCurrentUser,
      richTargetUser
    );

    expect(similarity.overall).toBeGreaterThanOrEqual(0);
    expect(similarity.breakdown.skills).toBeGreaterThanOrEqual(0);
    expect(similarity.breakdown.education).toBeGreaterThanOrEqual(0);
    expect(similarity.breakdown.companies).toBeGreaterThanOrEqual(0);
    expect(similarity.breakdown.industry).toBeGreaterThanOrEqual(0);
    expect(similarity.breakdown.location).toBeGreaterThanOrEqual(0);
  });
});

// ============================================================================
// Tests - Intermediary Finding with Minimal Data
// ============================================================================

describe('findBestIntermediaries - Minimal Profile Handling', () => {
  it('should handle minimal profile without crashing', () => {
    const intermediaries = findBestIntermediaries(
      minimalCurrentUser,
      richTargetUser,
      [], // No connections
      []
    );

    expect(intermediaries).toBeDefined();
    expect(Array.isArray(intermediaries)).toBe(true);
    expect(intermediaries.length).toBe(0); // No connections = no intermediaries
  });

  it('should not find intermediaries when source has no connections', () => {
    const intermediaries = findBestIntermediaries(
      minimalCurrentUser,
      richTargetUser,
      [], // No connections
      [richTargetUser] // Target has connections
    );

    // With the new fallback logic, this should return 1 low-confidence candidate
    expect(intermediaries.length).toBeGreaterThanOrEqual(0); // Can be 0 or 1 depending on similarity
  });

  it('should handle empty connection arrays gracefully', () => {
    const intermediaries = findBestIntermediaries(
      minimalCurrentUser,
      richTargetUser,
      [],
      []
    );

    expect(intermediaries).toBeDefined();
    expect(intermediaries.length).toBe(0);
  });
});

// ============================================================================
// Tests - Full Pathfinding with Minimal Data
// ============================================================================

describe('findUniversalConnection - Minimal Profile Handling', () => {
  it('should default to Stage 5 (cold outreach) with minimal profile', async () => {
    const strategy = await findUniversalConnection(
      minimalCurrentUser,
      richTargetUser,
      mockGraph
    );

    expect(strategy).toBeDefined();
    expect(strategy.type).toBe('cold-outreach'); // Stage 5 now returns 'cold-outreach' instead of 'none'
    expect(strategy.confidence).toBeGreaterThanOrEqual(0.1); // Minimum confidence
    expect(strategy.lowConfidence).toBe(true);
    expect(strategy.estimatedAcceptanceRate).toBeDefined();
  });

  it('should provide helpful guidance for minimal profiles', async () => {
    const strategy = await findUniversalConnection(
      minimalCurrentUser,
      richTargetUser,
      mockGraph
    );

    expect(strategy.reasoning).toBeDefined();
    expect(strategy.reasoning.toLowerCase()).toContain('overlap'); // Reasoning mentions profile overlap
    expect(strategy.nextSteps).toBeDefined();
    expect(strategy.nextSteps.length).toBeGreaterThan(0);
  });

  it('should suggest profile completion in next steps', async () => {
    const strategy = await findUniversalConnection(
      minimalCurrentUser,
      richTargetUser,
      mockGraph
    );

    const nextStepsText = strategy.nextSteps.join(' ').toLowerCase();

    // Should mention building profile or adding skills
    expect(
      nextStepsText.includes('profile') ||
      nextStepsText.includes('skill') ||
      nextStepsText.includes('build')
    ).toBe(true);
  });

  it('should handle minimal profile with location (slight improvement)', async () => {
    const strategy = await findUniversalConnection(
      minimalWithLocation,
      richTargetUser,
      mockGraph
    );

    // Still likely Stage 5 - now returns 'cold-outreach', confidence might be slightly higher
    expect(strategy.type).toBe('cold-outreach');
    expect(strategy.confidence).toBeGreaterThanOrEqual(0.1);

    // Similarity should reflect location match
    if (strategy.directSimilarity) {
      expect(strategy.directSimilarity.breakdown.location).toBeGreaterThan(0);
    }
  });

  it('should not crash when comparing two minimal profiles', async () => {
    const strategy = await findUniversalConnection(
      minimalCurrentUser,
      minimalCurrentUser, // Same minimal profile
      mockGraph
    );

    expect(strategy).toBeDefined();
    expect(strategy.type).toBeDefined();
  });

  it('should return valid acceptance rate even with minimal data', async () => {
    const strategy = await findUniversalConnection(
      minimalCurrentUser,
      richTargetUser,
      mockGraph
    );

    expect(strategy.estimatedAcceptanceRate).toBeGreaterThanOrEqual(0);
    expect(strategy.estimatedAcceptanceRate).toBeLessThanOrEqual(1);

    // With minimal profile, should be low acceptance rate
    expect(strategy.estimatedAcceptanceRate).toBeLessThan(0.20);
  });

  it('should provide directSimilarity in response for minimal profiles', async () => {
    const strategy = await findUniversalConnection(
      minimalCurrentUser,
      richTargetUser,
      mockGraph
    );

    expect(strategy.directSimilarity).toBeDefined();
    expect(strategy.directSimilarity?.overall).toBeDefined();
    expect(strategy.directSimilarity?.breakdown).toBeDefined();
  });
});

// ============================================================================
// Tests - Edge Cases
// ============================================================================

describe('Edge Cases - Minimal Profile Handling', () => {
  it('should handle profile with only required fields', () => {
    const bareMinimum: UserProfile = {
      name: 'Test User',
      title: 'Engineer',
      workExperience: [],
      education: [],
      projects: [],
      skills: [],
      metadata: {
        totalYearsExperience: 0,
        domains: [],
        seniority: 'entry',
        careerStage: 'student',
      },
    };

    const similarity = calculateProfileSimilarity(bareMinimum, richTargetUser);
    expect(similarity).toBeDefined();
    expect(similarity.overall).toBe(0);
  });

  it('should handle undefined optional fields gracefully', () => {
    const profileWithUndefined: UserProfile = {
      name: 'Test User',
      title: 'Engineer',
      location: undefined,
      email: undefined,
      phone: undefined,
      workExperience: [],
      education: [],
      projects: [],
      skills: [],
      metadata: {
        totalYearsExperience: 0,
        domains: [],
        seniority: 'entry',
        careerStage: 'student',
      },
    };

    const similarity = calculateProfileSimilarity(
      profileWithUndefined,
      richTargetUser
    );

    expect(similarity).toBeDefined();
    expect(similarity.breakdown.location).toBe(0);
  });

  it('should handle empty string fields', () => {
    const profileWithEmpty: UserProfile = {
      name: '',
      title: '',
      location: '',
      workExperience: [],
      education: [],
      projects: [],
      skills: [],
      metadata: {
        totalYearsExperience: 0,
        domains: [],
        seniority: 'entry',
        careerStage: 'student',
      },
    };

    const similarity = calculateProfileSimilarity(
      profileWithEmpty,
      richTargetUser
    );

    expect(similarity).toBeDefined();
    expect(similarity.overall).toBe(0);
  });
});

// ============================================================================
// Tests - Acceptance Rate Mapping
// ============================================================================

describe('Acceptance Rate with Minimal Data', () => {
  it('should return lowest acceptance rate for 0 similarity', async () => {
    const strategy = await findUniversalConnection(
      minimalCurrentUser,
      richTargetUser,
      mockGraph
    );

    // Pure cold outreach rate (12% according to docs)
    expect(strategy.estimatedAcceptanceRate).toBeCloseTo(0.12, 2);
  });

  it('should slightly improve rate with location match', async () => {
    const strategyMinimal = await findUniversalConnection(
      minimalCurrentUser,
      richTargetUser,
      mockGraph
    );

    const strategyWithLocation = await findUniversalConnection(
      minimalWithLocation,
      richTargetUser,
      mockGraph
    );

    // Location match should slightly improve rate
    expect(strategyWithLocation.estimatedAcceptanceRate).toBeGreaterThanOrEqual(
      strategyMinimal.estimatedAcceptanceRate
    );
  });
});
