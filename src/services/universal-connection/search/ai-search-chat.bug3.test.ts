/**
 * Bug #3 Fix Validation Tests
 * Tests parser consolidation - AI chat parser now uses main query extractors
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { AISearchChat } from './ai-search-chat';

describe('Bug #3: Parser Consolidation', () => {
  let aiChat: AISearchChat;

  beforeEach(() => {
    aiChat = new AISearchChat();
  });

  describe('Scenario 1: EASY - "from" pattern extraction', () => {
    it('should extract company using "from" pattern', () => {
      const query = 'engineers from Google';

      // Access private method via type assertion for testing
      const result = (aiChat as any).parseSearchQuery(query);

      expect(result.filters.company).toBe('Google');
      expect(result.query).toContain('engineers');
    });

    it('should extract company using "from" with location', () => {
      const query = 'people from Netflix in Los Angeles';

      const result = (aiChat as any).parseSearchQuery(query);

      expect(result.filters.company).toBe('Netflix');
      expect(result.filters.location).toBe('Los Angeles');
    });

    it('should extract company using "from" with stopwords', () => {
      const query = 'developers from Amazon who work in Seattle';

      const result = (aiChat as any).parseSearchQuery(query);

      expect(result.filters.company).toBe('Amazon');
      expect(result.filters.location).toBe('Seattle');
    });
  });

  describe('Scenario 2: MEDIUM - "works at" and multiple patterns', () => {
    it('should extract company using "works at" pattern', () => {
      const query = 'people works at Microsoft';

      const result = (aiChat as any).parseSearchQuery(query);

      expect(result.filters.company).toBe('Microsoft');
    });

    it('should extract company using "working at" pattern', () => {
      const query = 'engineers working at Apple';

      const result = (aiChat as any).parseSearchQuery(query);

      expect(result.filters.company).toBe('Apple');
    });

    it('should handle all company patterns consistently', () => {
      const patterns = [
        { query: 'people at Google', expected: 'Google' },
        { query: 'people from Google', expected: 'Google' },
        { query: 'people works at Google', expected: 'Google' },
        { query: 'people working at Google', expected: 'Google' },
      ];

      for (const { query, expected } of patterns) {
        const result = (aiChat as any).parseSearchQuery(query);
        expect(result.filters.company).toBe(expected);
      }
    });

    it('should extract years of experience (new extractor)', () => {
      const query = 'engineers with 5+ years experience at Meta';

      const result = (aiChat as any).parseSearchQuery(query);

      expect(result.filters.company).toBe('Meta');
      expect(result.filters.yearsExperience).toEqual({ min: 5 });
    });

    it('should extract years range', () => {
      const query = 'developers with 3-5 years at Stripe';

      const result = (aiChat as any).parseSearchQuery(query);

      expect(result.filters.company).toBe('Stripe');
      expect(result.filters.yearsExperience).toEqual({ min: 3, max: 5 });
    });
  });

  describe('Scenario 3: HARD - Complex queries and edge cases', () => {
    it('should handle complex query with all filter types', () => {
      const query = 'senior engineers from Tesla in San Francisco with 5+ years experience';

      const result = (aiChat as any).parseSearchQuery(query);

      expect(result.filters.company).toBe('Tesla');
      expect(result.filters.location).toBe('San Francisco');
      expect(result.filters.role).toContain('senior');
      expect(result.filters.yearsExperience).toEqual({ min: 5 });
      expect(result.query).toContain('engineers');
    });

    it('should handle "from" with company names containing spaces', () => {
      const query = 'people from Goldman Sachs in NYC';

      const result = (aiChat as any).parseSearchQuery(query);

      expect(result.filters.company).toBe('Goldman Sachs');
      expect(result.filters.location).toBe('NYC');
    });

    it('should handle "works at" with special characters in company name', () => {
      const query = 'engineers works at AT&T';

      const result = (aiChat as any).parseSearchQuery(query);

      // Formatter capitalizes company names
      expect(result.filters.company).toBe('At&t');
    });

    it('should clean query after removing filters', () => {
      const query = 'find senior engineers from Google in Mountain View with 5+ years';

      const result = (aiChat as any).parseSearchQuery(query);

      // Check filters extracted correctly
      expect(result.filters.company).toBe('Google');
      expect(result.filters.location).toBe('Mountain View');
      expect(result.filters.role).toContain('senior');
      expect(result.filters.yearsExperience).toEqual({ min: 5 });

      // Check that query is cleaned (filter keywords removed)
      expect(result.query.toLowerCase()).not.toContain('from');
      expect(result.query.toLowerCase()).not.toContain('google');
      expect(result.query.toLowerCase()).not.toContain('mountain view');
    });

    it('should handle filter-only queries (empty query string)', () => {
      const query = 'from Salesforce in San Francisco';

      const result = (aiChat as any).parseSearchQuery(query);

      expect(result.filters.company).toBe('Salesforce');
      expect(result.filters.location).toBe('San Francisco');
      // Query might be empty or contain minimal text after filter removal
      expect(result.query).toBeDefined();
    });

    it('should handle ambiguous patterns gracefully', () => {
      // "in" could be location or part of company name
      const query = 'people at LinkedIn in Sunnyvale';

      const result = (aiChat as any).parseSearchQuery(query);

      // Should extract "LinkedIn" as company and "Sunnyvale" as location
      expect(result.filters.company).toBe('LinkedIn');
      expect(result.filters.location).toBe('Sunnyvale');
    });

    it('should handle "based in" location pattern', () => {
      // Test location extraction with "based in" pattern
      const query = 'engineers based in San Francisco';

      const result = (aiChat as any).parseSearchQuery(query);

      // Location should be extracted correctly
      expect(result.filters.location).toBe('San Francisco');
      expect(result.query).toContain('engineers');
    });

    it('should handle connection degree filters', () => {
      const query = '1st degree connections from Airbnb';

      const result = (aiChat as any).parseSearchQuery(query);

      expect(result.filters.company).toBe('Airbnb');
      expect(result.filters.connectionDegree).toEqual([1]);
    });

    it('should handle multiple seniority keywords', () => {
      const query = 'lead or principal engineers from Snap';

      const result = (aiChat as any).parseSearchQuery(query);

      expect(result.filters.company).toBe('Snap');
      // Role extractor picks first match
      expect(result.filters.role).toBeTruthy();
    });

    it('should NOT regress on "at" pattern (existing functionality)', () => {
      // Regression test: ensure old "at" pattern still works
      const query = 'engineers at Facebook in Menlo Park';

      const result = (aiChat as any).parseSearchQuery(query);

      expect(result.filters.company).toBe('Facebook');
      expect(result.filters.location).toBe('Menlo Park');
    });
  });
});
