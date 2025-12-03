/**
 * Bug #1 Fix Validation Tests
 * Tests schema validation allowing empty query strings for filter-only searches
 */

import { describe, it, expect } from 'vitest';
import { SearchQuerySchema } from './search';

describe('Bug #1: Schema Validation - Empty Query Strings', () => {
  describe('Scenario 1: EASY - Simple company filter only', () => {
    it('should accept empty query with company filter', () => {
      const result = SearchQuerySchema.safeParse({
        query: '',
        filters: {
          company: 'Google',
        },
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.query).toBe('');
        expect(result.data.filters?.company).toBe('Google');
      }
    });
  });

  describe('Scenario 2: MEDIUM - Multiple filters, no keywords', () => {
    it('should accept empty query with location and experience filters', () => {
      const result = SearchQuerySchema.safeParse({
        query: '',
        filters: {
          location: 'San Francisco',
          yearsExperience: {
            min: 5,
          },
        },
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.query).toBe('');
        expect(result.data.filters?.location).toBe('San Francisco');
        expect(result.data.filters?.yearsExperience?.min).toBe(5);
      }
    });

    it('should accept empty query with all filter types', () => {
      const result = SearchQuerySchema.safeParse({
        query: '',
        filters: {
          company: 'Netflix',
          location: 'Los Angeles',
          role: 'senior',
          connectionDegree: [1, 2],
          yearsExperience: {
            min: 3,
            max: 10,
          },
        },
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.query).toBe('');
        expect(result.data.filters?.company).toBe('Netflix');
        expect(result.data.filters?.connectionDegree).toEqual([1, 2]);
      }
    });
  });

  describe('Scenario 3: HARD - Edge cases and complex scenarios', () => {
    it('should accept whitespace-only query (trimmed to empty)', () => {
      const result = SearchQuerySchema.safeParse({
        query: '   ',
        filters: {
          company: 'Microsoft',
        },
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.query).toBe('   '); // Schema doesn't trim, that's parser's job
      }
    });

    it('should accept empty query with no filters (match all)', () => {
      const result = SearchQuerySchema.safeParse({
        query: '',
        filters: {},
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.query).toBe('');
        expect(result.data.filters).toEqual({});
      }
    });

    it('should accept query with undefined filters object', () => {
      const result = SearchQuerySchema.safeParse({
        query: '',
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.query).toBe('');
      }
    });

    it('should still accept non-empty queries (backward compatibility)', () => {
      const result = SearchQuerySchema.safeParse({
        query: 'engineers',
        filters: {
          company: 'Amazon',
        },
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.query).toBe('engineers');
        expect(result.data.filters?.company).toBe('Amazon');
      }
    });

    it('should reject invalid filter values', () => {
      const result = SearchQuerySchema.safeParse({
        query: '',
        filters: {
          connectionDegree: [0, 4], // Invalid: must be 1-3
        },
      });

      expect(result.success).toBe(false);
    });
  });
});
