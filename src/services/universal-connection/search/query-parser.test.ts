/**
 * Query Parser Tests
 * Validates natural language query parsing
 */

import { describe, it, expect } from 'vitest';
import { parseQuery } from './query-parser';

describe('Query Parser', () => {
  describe('Company Extraction', () => {
    it('should extract company from "at [Company]" pattern', () => {
      const result = parseQuery('HR reps at Netflix');
      expect(result.filters?.company).toBe('Netflix');
      expect(result.query).toBe('hr reps');
    });

    it('should extract company from "works at [Company]" pattern', () => {
      const result = parseQuery('engineers works at Google');
      expect(result.filters?.company).toBe('Google');
    });

    it('should handle multiple word company names', () => {
      const result = parseQuery('developers at Amazon Web Services');
      expect(result.filters?.company).toBe('Amazon Web Services');
    });
  });

  describe('Location Extraction', () => {
    it('should extract location from "in [Location]" pattern', () => {
      const result = parseQuery('senior engineers in SF');
      expect(result.filters?.location).toBe('SF');
      expect(result.filters?.role).toBe('senior');
      expect(result.query).toBe('engineers');
    });

    it('should handle full city names', () => {
      const result = parseQuery('designers in San Francisco');
      expect(result.filters?.location).toBe('San Francisco');
    });

    it('should extract from "based in [Location]" pattern', () => {
      const result = parseQuery('managers based in NYC');
      expect(result.filters?.location).toBe('NYC');
    });
  });

  describe('Connection Degree Extraction', () => {
    it('should extract 2nd degree connections', () => {
      const result = parseQuery('2nd degree connections at Google');
      expect(result.filters?.connectionDegree).toEqual([2]);
      expect(result.filters?.company).toBe('Google');
    });

    it('should extract 1st degree connections', () => {
      const result = parseQuery('1st degree connections');
      expect(result.filters?.connectionDegree).toEqual([1]);
    });

    it('should extract "direct connections"', () => {
      const result = parseQuery('direct connections at Microsoft');
      expect(result.filters?.connectionDegree).toEqual([1]);
      expect(result.filters?.company).toBe('Microsoft');
    });

    it('should extract written out degrees', () => {
      const result = parseQuery('second degree connections');
      expect(result.filters?.connectionDegree).toEqual([2]);
    });
  });

  describe('Years of Experience Extraction', () => {
    it('should extract "5+ years" pattern', () => {
      const result = parseQuery('engineers with 5+ years experience');
      expect(result.filters?.yearsExperience?.min).toBe(5);
      expect(result.filters?.yearsExperience?.max).toBeUndefined();
    });

    it('should extract range "3-5 years" pattern', () => {
      const result = parseQuery('developers with 3-5 years experience');
      expect(result.filters?.yearsExperience?.min).toBe(3);
      expect(result.filters?.yearsExperience?.max).toBe(5);
    });

    it('should extract exact years', () => {
      const result = parseQuery('analysts with 2 years');
      expect(result.filters?.yearsExperience?.min).toBe(2);
      expect(result.filters?.yearsExperience?.max).toBe(2);
    });
  });

  describe('Role/Seniority Extraction', () => {
    it('should extract senior level', () => {
      const result = parseQuery('senior engineers at Tesla');
      expect(result.filters?.role).toBe('senior');
    });

    it('should extract junior level', () => {
      const result = parseQuery('junior developers');
      expect(result.filters?.role).toBe('junior');
    });

    it('should extract lead level', () => {
      const result = parseQuery('lead designers in NYC');
      expect(result.filters?.role).toBe('lead');
    });

    it('should extract principal level', () => {
      const result = parseQuery('principal engineers at Uber');
      expect(result.filters?.role).toBe('principal');
    });
  });

  describe('Complex Queries', () => {
    it('should handle multiple filters', () => {
      const result = parseQuery('senior engineers at Google in SF with 5+ years');
      expect(result.filters?.role).toBe('senior');
      expect(result.filters?.company).toBe('Google');
      expect(result.filters?.location).toBe('SF');
      expect(result.filters?.yearsExperience?.min).toBe(5);
      expect(result.query).toBe('engineers');
    });

    it('should handle degree + company + location', () => {
      const result = parseQuery('2nd degree HR reps at Netflix in Los Angeles');
      expect(result.filters?.connectionDegree).toEqual([2]);
      expect(result.filters?.company).toBe('Netflix');
      expect(result.filters?.location).toBe('Los Angeles');
      expect(result.query).toBe('hr reps');
    });

    it('should clean filler words', () => {
      const result = parseQuery('find senior engineers at Apple');
      expect(result.query).toBe('engineers');
      expect(result.filters?.role).toBe('senior');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty query', () => {
      const result = parseQuery('');
      expect(result.query).toBe('');
      expect(result.filters).toBeUndefined();
    });

    it('should handle query with no filters', () => {
      const result = parseQuery('software engineers');
      expect(result.query).toBe('software engineers');
      expect(result.filters).toBeUndefined();
    });

    it('should handle only filters (empty query)', () => {
      const result = parseQuery('at Google');
      expect(result.query).toBe('');
      expect(result.filters?.company).toBe('Google');
    });

    it('should preserve case in query', () => {
      const result = parseQuery('Product Managers at Facebook');
      expect(result.query).toBe('product managers');
      expect(result.filters?.company).toBe('Facebook');
    });
  });

  describe('Real-World Examples', () => {
    it('Example 1: HR reps at Netflix', () => {
      const result = parseQuery('HR reps at Netflix');
      expect(result).toEqual({
        query: 'hr reps',
        filters: {
          company: 'Netflix',
        },
      });
    });

    it('Example 2: senior engineers in SF', () => {
      const result = parseQuery('senior engineers in SF');
      expect(result).toEqual({
        query: 'engineers',
        filters: {
          role: 'senior',
          location: 'SF',
        },
      });
    });

    it('Example 3: 2nd degree connections at Google', () => {
      const result = parseQuery('2nd degree connections at Google');
      expect(result.query).toBe('');
      expect(result.filters?.company).toBe('Google');
      expect(result.filters?.connectionDegree).toEqual([2]);
    });

    it('Example 4: Data scientists with 3+ years at Amazon', () => {
      const result = parseQuery('data scientists with 3+ years at Amazon');
      expect(result.query).toBe('data scientists');
      expect(result.filters?.company).toBe('Amazon');
      expect(result.filters?.yearsExperience?.min).toBe(3);
    });
  });
});
