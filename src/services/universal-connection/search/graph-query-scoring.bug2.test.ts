/**
 * Bug #2 Fix Validation Tests
 * Tests years of experience calculation with proper duration parsing
 */

import { describe, it, expect } from 'vitest';
import { calculateExperienceYears } from './graph-query-scoring';
import type { NetworkNode } from '@/types';

// Helper to create test node
function createTestNode(experiences: Array<{ duration?: string }>): NetworkNode {
  return {
    id: 'test-node',
    profile: {
      id: 'test-profile',
      name: 'Test User',
      experience: experiences.map((exp, i) => ({
        company: `Company ${i + 1}`,
        title: `Role ${i + 1}`,
        duration: exp.duration,
      })),
      education: [],
      skills: [],
      certifications: [],
      mutualConnections: [],
      recentPosts: [],
      userPosts: [],
      engagedPosts: [],
      recentActivity: [],
      scrapedAt: new Date().toISOString(),
    },
    status: 'not_contacted',
    degree: 1,
    matchScore: 0,
  } as NetworkNode;
}

describe('Bug #2: Years of Experience Calculation', () => {
  describe('Scenario 1: EASY - Single job with simple duration', () => {
    it('should parse "3 years" correctly', () => {
      const node = createTestNode([
        { duration: '3 years' }
      ]);

      const years = calculateExperienceYears(node);
      expect(years).toBe(3);
    });

    it('should parse "2 yrs" correctly', () => {
      const node = createTestNode([
        { duration: '2 yrs' }
      ]);

      const years = calculateExperienceYears(node);
      expect(years).toBe(2);
    });

    it('should parse "1 year" (singular) correctly', () => {
      const node = createTestNode([
        { duration: '1 year' }
      ]);

      const years = calculateExperienceYears(node);
      expect(years).toBe(1);
    });

    it('should parse "6 months" correctly', () => {
      const node = createTestNode([
        { duration: '6 months' }
      ]);

      const years = calculateExperienceYears(node);
      expect(years).toBe(0.5);
    });
  });

  describe('Scenario 2: MEDIUM - Multiple jobs with varying durations', () => {
    it('should sum multiple jobs correctly', () => {
      const node = createTestNode([
        { duration: '3 years' },
        { duration: '2 years' },
        { duration: '1 year' },
      ]);

      const years = calculateExperienceYears(node);
      expect(years).toBe(6);
    });

    it('should handle mixed year and month formats', () => {
      const node = createTestNode([
        { duration: '2 years' },
        { duration: '6 months' },
      ]);

      const years = calculateExperienceYears(node);
      expect(years).toBe(2.5);
    });

    it('should handle "1 year 6 months" format', () => {
      const node = createTestNode([
        { duration: '1 year 6 months' },
      ]);

      const years = calculateExperienceYears(node);
      expect(years).toBe(1.5);
    });

    it('should handle "3 years 3 months" format', () => {
      const node = createTestNode([
        { duration: '3 years 3 months' },
      ]);

      const years = calculateExperienceYears(node);
      expect(years).toBe(3.3); // 3.25 rounded to 1 decimal = 3.3
    });

    it('should use fallback (2 years) for missing duration', () => {
      const node = createTestNode([
        { duration: '3 years' },
        { duration: undefined }, // Missing duration
      ]);

      const years = calculateExperienceYears(node);
      expect(years).toBe(5); // 3 + 2 (fallback)
    });
  });

  describe('Scenario 3: HARD - Edge cases and mixed formats', () => {
    it('should handle abbreviated "mos" for months', () => {
      const node = createTestNode([
        { duration: '8 mos' },
      ]);

      const years = calculateExperienceYears(node);
      expect(years).toBeCloseTo(0.67, 1); // 8/12 ≈ 0.67
    });

    it('should handle "yr" (singular abbreviation)', () => {
      const node = createTestNode([
        { duration: '1 yr' },
      ]);

      const years = calculateExperienceYears(node);
      expect(years).toBe(1);
    });

    it('should handle complex mixed formats', () => {
      const node = createTestNode([
        { duration: '3 yrs 6 mos' },
        { duration: '2 years 3 months' },
        { duration: '1 year' },
      ]);

      const years = calculateExperienceYears(node);
      expect(years).toBeCloseTo(6.75, 1); // 3.5 + 2.25 + 1
    });

    it('should handle malformed/empty duration strings', () => {
      const node = createTestNode([
        { duration: '' },
        { duration: 'unknown' },
        { duration: '   ' },
      ]);

      const years = calculateExperienceYears(node);
      expect(years).toBe(6); // 3 jobs × 2 years fallback
    });

    it('should handle no experience array', () => {
      const node = createTestNode([]);

      const years = calculateExperienceYears(node);
      expect(years).toBe(0);
    });

    it('should round to 1 decimal place', () => {
      const node = createTestNode([
        { duration: '1 year 1 month' }, // 1.083...
      ]);

      const years = calculateExperienceYears(node);
      expect(years).toBe(1.1); // Rounded to 1 decimal
    });

    it('should handle real-world complex scenario', () => {
      const node = createTestNode([
        { duration: '5 years 3 months' }, // Current role
        { duration: '2 yrs 6 mos' },      // Previous role
        { duration: '1 year' },            // Earlier role
        { duration: undefined },           // Internship (no duration)
      ]);

      const years = calculateExperienceYears(node);
      expect(years).toBe(10.8); // 10.75 rounded to 1 decimal = 10.8
    });

    it('should NOT count jobs when durations exist (regression test)', () => {
      const node = createTestNode([
        { duration: '1 year' },
        { duration: '1 year' },
        { duration: '1 year' },
      ]);

      // Old bug: would return 3 (counting jobs)
      // Fixed: should return 3 (sum of durations)
      const years = calculateExperienceYears(node);
      expect(years).toBe(3);

      // But the count should NOT equal array length for different durations
      const node2 = createTestNode([
        { duration: '5 years' },
        { duration: '3 years' },
      ]);

      const years2 = calculateExperienceYears(node2);
      expect(years2).toBe(8); // NOT 2 (job count)
      expect(years2).not.toBe(node2.profile.experience.length);
    });
  });
});
