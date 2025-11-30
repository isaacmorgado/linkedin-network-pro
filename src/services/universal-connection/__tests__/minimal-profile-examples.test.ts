/**
 * Minimal Profile Examples
 *
 * Reference examples showing exact behavior with minimal user data.
 * Run with: npm test -- minimal-profile-examples
 */

import { describe, it, expect } from 'vitest';
import { findUniversalConnection } from '../universal-pathfinder';
import { calculateProfileSimilarity } from '../intermediary-scorer';
import type { UserProfile } from '../../../types/resume-tailoring';
import type { Graph } from '../universal-connection-types';

// Mock graph
const mockGraph: Graph = {
  async bidirectionalBFS() {
    return null;
  },
  async getConnections() {
    return [];
  },
  getNode() {
    return null;
  },
};

describe('Minimal Profile Examples - Real World Scenarios', () => {
  it('Example 1: New User (only name + title)', async () => {
    // User just signed up, only has basic info
    const newUser: UserProfile = {
      name: 'Alice Johnson',
      title: 'Marketing Coordinator',
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

    // Trying to connect with senior marketer
    const targetUser: UserProfile = {
      name: 'Sarah Williams',
      title: 'Senior Marketing Manager',
      location: 'New York, NY',
      workExperience: [
        {
          id: '1',
          company: 'HubSpot',
          title: 'Senior Marketing Manager',
          startDate: '2019-01-01',
          endDate: null,
          industry: 'Marketing & Advertising',
          achievements: [],
          skills: ['SEO', 'Content Marketing', 'Analytics'],
          domains: ['digital-marketing'],
          responsibilities: [],
        },
      ],
      education: [
        {
          id: '1',
          school: 'NYU',
          degree: 'MBA',
          field: 'Marketing',
          startDate: '2015-09-01',
          endDate: '2017-05-01',
        },
      ],
      projects: [],
      skills: [
        { name: 'SEO', level: 'expert', yearsOfExperience: 8, category: 'marketing' },
        { name: 'Content Marketing', level: 'expert', yearsOfExperience: 10, category: 'marketing' },
      ],
      metadata: {
        totalYearsExperience: 10,
        domains: ['digital-marketing'],
        seniority: 'senior',
        careerStage: 'professional',
      },
    };

    const result = await findUniversalConnection(newUser, targetUser, mockGraph);

    // Verify expected behavior - now returns 'cold-outreach' instead of 'none'
    expect(result.type).toBe('cold-outreach');
    expect(result.confidence).toBeGreaterThanOrEqual(0.1); // Minimum confidence for cold outreach
    expect(result.estimatedAcceptanceRate).toBeGreaterThanOrEqual(0.12); // Minimum acceptance rate
    expect(result.lowConfidence).toBe(true);
    expect(result.reasoning.toLowerCase()).toContain('overlap'); // Updated reasoning text

    // Verify helpful next steps
    expect(result.nextSteps.some((step) => step.toLowerCase().includes('profile'))).toBe(true);

    console.log('Example 1 Results:', {
      type: result.type,
      confidence: result.confidence,
      acceptanceRate: result.estimatedAcceptanceRate,
      reasoning: result.reasoning,
      nextSteps: result.nextSteps,
    });
  });

  it('Example 2: Student with location only', async () => {
    // Student who added location but no experience yet
    const studentUser: UserProfile = {
      name: 'Bob Chen',
      title: 'Computer Science Student',
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

    // Connecting with local engineer
    const localEngineer: UserProfile = {
      name: 'Mike Davis',
      title: 'Software Engineer',
      location: 'San Francisco, CA',
      workExperience: [
        {
          id: '1',
          company: 'Stripe',
          title: 'Software Engineer',
          startDate: '2020-01-01',
          endDate: null,
          industry: 'Technology',
          achievements: [],
          skills: ['Python', 'React', 'PostgreSQL'],
          domains: ['web-development', 'fintech'],
          responsibilities: [],
        },
      ],
      education: [
        {
          id: '1',
          school: 'UC Berkeley',
          degree: 'BS',
          field: 'Computer Science',
          startDate: '2012-09-01',
          endDate: '2016-05-01',
        },
      ],
      projects: [],
      skills: [
        { name: 'Python', level: 'expert', yearsOfExperience: 8, category: 'programming-language' },
        { name: 'React', level: 'advanced', yearsOfExperience: 5, category: 'framework' },
      ],
      metadata: {
        totalYearsExperience: 8,
        domains: ['web-development', 'fintech'],
        seniority: 'mid',
        careerStage: 'professional',
      },
    };

    const result = await findUniversalConnection(studentUser, localEngineer, mockGraph);

    // Location should contribute to similarity
    const similarity = calculateProfileSimilarity(studentUser, localEngineer);

    // Verify location match
    expect(similarity.breakdown.location).toBe(1.0); // Exact match: SF, CA

    // Overall still low (only location contributes 15% weight)
    expect(similarity.overall).toBeCloseTo(0.15, 2);

    // Still Stage 5 (15% < 45% threshold) - now returns 'cold-outreach' instead of 'none'
    expect(result.type).toBe('cold-outreach');

    console.log('Example 2 Results:', {
      similarityBreakdown: similarity.breakdown,
      overallSimilarity: similarity.overall,
      type: result.type,
      acceptanceRate: result.estimatedAcceptanceRate,
    });
  });

  it('Example 3: Career Changer with minimal skills added', async () => {
    // Someone transitioning careers, added a few skills
    const careerChanger: UserProfile = {
      name: 'Emma Rodriguez',
      title: 'Aspiring Data Analyst',
      location: 'Austin, TX',
      workExperience: [],
      education: [],
      projects: [],
      skills: [
        { name: 'Python', level: 'beginner', yearsOfExperience: 1, category: 'programming-language' },
        { name: 'SQL', level: 'beginner', yearsOfExperience: 1, category: 'programming-language' },
      ],
      metadata: {
        totalYearsExperience: 0,
        domains: ['data-analysis'],
        seniority: 'entry',
        careerStage: 'career-changer',
      },
    };

    const seniorAnalyst: UserProfile = {
      name: 'David Kim',
      title: 'Senior Data Analyst',
      location: 'Austin, TX',
      workExperience: [
        {
          id: '1',
          company: 'Amazon',
          title: 'Senior Data Analyst',
          startDate: '2018-01-01',
          endDate: null,
          industry: 'Technology',
          achievements: [],
          skills: ['Python', 'SQL', 'Tableau', 'R'],
          domains: ['data-analysis', 'business-intelligence'],
          responsibilities: [],
        },
      ],
      education: [
        {
          id: '1',
          school: 'UT Austin',
          degree: 'MS',
          field: 'Statistics',
          startDate: '2014-09-01',
          endDate: '2016-05-01',
        },
      ],
      projects: [],
      skills: [
        { name: 'Python', level: 'expert', yearsOfExperience: 9, category: 'programming-language' },
        { name: 'SQL', level: 'expert', yearsOfExperience: 10, category: 'programming-language' },
        { name: 'Tableau', level: 'advanced', yearsOfExperience: 7, category: 'tool' },
        { name: 'R', level: 'advanced', yearsOfExperience: 6, category: 'programming-language' },
      ],
      metadata: {
        totalYearsExperience: 10,
        domains: ['data-analysis', 'business-intelligence'],
        seniority: 'senior',
        careerStage: 'professional',
      },
    };

    const similarity = calculateProfileSimilarity(careerChanger, seniorAnalyst);
    const result = await findUniversalConnection(careerChanger, seniorAnalyst, mockGraph);

    // Calculate expected similarity:
    // - Skills: 2 common (Python, SQL) out of union of 4 = 0.5 (Jaccard)
    // - Location: 1.0 (exact match)
    // - Education: 0 (missing)
    // - Companies: 0 (missing)
    // - Industry: 0 (missing)
    //
    // Overall = 0.5 * 0.25 (skills) + 1.0 * 0.15 (location) = 0.125 + 0.15 = 0.275

    expect(similarity.breakdown.skills).toBeCloseTo(0.5, 2);
    expect(similarity.breakdown.location).toBe(1.0);
    expect(similarity.overall).toBeCloseTo(0.275, 2);

    // Still Stage 5 (27.5% < 45%) - now returns fallback strategy instead of 'none'
    expect(['cold-outreach', 'semantic']).toContain(result.type);

    // Acceptance rate is still 0.12 because Stage 5 with similarity < 0.45
    // uses the formula: 0.12 + similarity * (0.03 / 0.25)
    // This only improves above 0.12 when similarity is very close to 0.45
    expect(result.estimatedAcceptanceRate).toBeGreaterThanOrEqual(0.12);

    console.log('Example 3 Results:', {
      skillMatch: similarity.breakdown.skills,
      locationMatch: similarity.breakdown.location,
      overallSimilarity: similarity.overall,
      type: result.type,
      acceptanceRate: result.estimatedAcceptanceRate,
      reasoning: result.reasoning,
    });
  });

  it('Example 4: Comparing minimal vs complete profile (same person)', async () => {
    // Minimal profile
    const minimalProfile: UserProfile = {
      name: 'Jessica Taylor',
      title: 'Product Manager',
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

    // Complete profile (same person after completion)
    const completeProfile: UserProfile = {
      name: 'Jessica Taylor',
      title: 'Product Manager',
      location: 'Seattle, WA',
      workExperience: [
        {
          id: '1',
          company: 'Microsoft',
          title: 'Product Manager',
          startDate: '2021-01-01',
          endDate: null,
          industry: 'Technology',
          achievements: [],
          skills: ['Product Strategy', 'User Research', 'Agile'],
          domains: ['enterprise-software'],
          responsibilities: [],
        },
      ],
      education: [
        {
          id: '1',
          school: 'University of Washington',
          degree: 'BS',
          field: 'Business',
          startDate: '2016-09-01',
          endDate: '2020-05-01',
        },
      ],
      projects: [],
      skills: [
        { name: 'Product Strategy', level: 'advanced', yearsOfExperience: 4, category: 'product' },
        { name: 'User Research', level: 'advanced', yearsOfExperience: 4, category: 'product' },
        { name: 'Agile', level: 'intermediate', yearsOfExperience: 3, category: 'methodology' },
      ],
      metadata: {
        totalYearsExperience: 4,
        domains: ['enterprise-software'],
        seniority: 'mid',
        careerStage: 'professional',
      },
    };

    // Target: Similar PM at different company
    const targetPM: UserProfile = {
      name: 'Chris Anderson',
      title: 'Senior Product Manager',
      location: 'San Francisco, CA',
      workExperience: [
        {
          id: '1',
          company: 'Google',
          title: 'Senior Product Manager',
          startDate: '2017-01-01',
          endDate: null,
          industry: 'Technology',
          achievements: [],
          skills: ['Product Strategy', 'User Research', 'Agile', 'Data Analytics'],
          domains: ['enterprise-software', 'cloud'],
          responsibilities: [],
        },
      ],
      education: [
        {
          id: '1',
          school: 'Stanford University',
          degree: 'MBA',
          field: 'Business',
          startDate: '2013-09-01',
          endDate: '2015-05-01',
        },
      ],
      projects: [],
      skills: [
        { name: 'Product Strategy', level: 'expert', yearsOfExperience: 8, category: 'product' },
        { name: 'User Research', level: 'expert', yearsOfExperience: 7, category: 'product' },
        { name: 'Agile', level: 'expert', yearsOfExperience: 8, category: 'methodology' },
      ],
      metadata: {
        totalYearsExperience: 8,
        domains: ['enterprise-software', 'cloud'],
        seniority: 'senior',
        careerStage: 'professional',
      },
    };

    const minimalResult = await findUniversalConnection(minimalProfile, targetPM, mockGraph);
    const completeResult = await findUniversalConnection(completeProfile, targetPM, mockGraph);

    const minimalSimilarity = calculateProfileSimilarity(minimalProfile, targetPM);
    const completeSimilarity = calculateProfileSimilarity(completeProfile, targetPM);

    // Compare results
    console.log('Example 4 Comparison:', {
      minimal: {
        similarity: minimalSimilarity.overall,
        type: minimalResult.type,
        acceptanceRate: minimalResult.estimatedAcceptanceRate,
      },
      complete: {
        similarity: completeSimilarity.overall,
        type: completeResult.type,
        acceptanceRate: completeResult.estimatedAcceptanceRate,
      },
      improvement: {
        similarityGain: completeSimilarity.overall - minimalSimilarity.overall,
        acceptanceRateGain: completeResult.estimatedAcceptanceRate - minimalResult.estimatedAcceptanceRate,
        stageChange: `${minimalResult.type} → ${completeResult.type}`,
      },
    });

    // Minimal should be Stage 5 - now returns 'cold-outreach' instead of 'none'
    expect(minimalResult.type).toBe('cold-outreach');
    expect(minimalSimilarity.overall).toBe(0);

    // Complete should be much better
    expect(completeSimilarity.overall).toBeGreaterThan(0.5);

    // Could reach Stage 2 (direct-similarity) if > 0.65
    // Or Stage 4 (cold-similarity) if 0.45-0.65
    expect(completeResult.type).toMatch(/direct-similarity|cold-similarity/);

    // Acceptance rate should significantly improve
    expect(completeResult.estimatedAcceptanceRate).toBeGreaterThan(minimalResult.estimatedAcceptanceRate * 2);
  });

  it('Example 5: Two minimal profiles compared', async () => {
    const minimal1: UserProfile = {
      name: 'User A',
      title: 'Designer',
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

    const minimal2: UserProfile = {
      name: 'User B',
      title: 'Designer',
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

    const result = await findUniversalConnection(minimal1, minimal2, mockGraph);
    const similarity = calculateProfileSimilarity(minimal1, minimal2);

    // Both minimal = 0% similarity - now returns 'cold-outreach' instead of 'none'
    expect(similarity.overall).toBe(0);
    expect(result.type).toBe('cold-outreach');

    console.log('Example 5 Results:', {
      similarity: similarity.overall,
      type: result.type,
      message: 'Two minimal profiles have 0% similarity (no data to compare)',
    });
  });
});
