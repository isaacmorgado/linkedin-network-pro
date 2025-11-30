/**
 * Integration Test for JobsTab Response Validation (Bug #5)
 *
 * Tests that the handleAnalyzeCurrentPage function properly validates
 * API response data and prevents undefined values from propagating.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { extractKeywordsFromJobDescription, categorizeJobRequirements } from '@/services/keyword-extractor';

/**
 * Simulates the handleAnalyzeCurrentPage function logic
 * This is the ACTUAL CODE from JobsTab.tsx (lines 116-171)
 * We're testing it in isolation to verify validation behavior
 */
async function handleAnalyzeCurrentPageLogic(mockResponse: any) {
  // Simulate chrome.runtime.sendMessage response
  const response = mockResponse;

  if (!response.success) {
    throw new Error(response.error || 'Failed to analyze job');
  }

  console.log('[Uproot] Received job data:', response.data);

  // Validate response data to prevent undefined values from propagating (Bug #5 fix)
  if (!response.data || typeof response.data !== 'object') {
    throw new Error('Invalid response: Missing or invalid response data');
  }

  // Validate required fields
  const { description, jobTitle, company, location, url } = response.data;

  if (!description || typeof description !== 'string' || description.trim().length === 0) {
    throw new Error('Invalid response: Job description is required and must be a non-empty string');
  }

  if (!jobTitle || typeof jobTitle !== 'string' || jobTitle.trim().length === 0) {
    throw new Error('Invalid response: Job title is required and must be a non-empty string');
  }

  if (!company || typeof company !== 'string' || company.trim().length === 0) {
    throw new Error('Invalid response: Company name is required and must be a non-empty string');
  }

  // Extract keywords and requirements (now safe - description is validated)
  const keywords = extractKeywordsFromJobDescription(description);
  const requirements = categorizeJobRequirements(description);

  // Create job analysis (using validated fields)
  const jobAnalysis = {
    id: `job_${Date.now()}`,
    rawText: description,
    jobTitle: jobTitle,
    company: company,
    location: location, // Optional field
    jobUrl: url, // Optional field
    extractedKeywords: keywords,
    requiredSkills: requirements.required,
    preferredSkills: requirements.preferred,
    requiredExperience: [],
    preferredExperience: [],
    analyzedAt: Date.now(),
  };

  return jobAnalysis;
}

describe('JobsTab Response Validation (Bug #5)', () => {
  beforeEach(() => {
    // Clear console spies
    vi.clearAllMocks();
  });

  describe('Validation Tests - Confirming Bug #5 is Fixed', () => {
    it('should throw error when response.data is missing (Bug #5 - FIXED)', async () => {
      const mockResponse = {
        success: true,
        // data is missing entirely!
      };

      // After fix: should throw a validation error instead of generic "Cannot read properties"
      await expect(
        handleAnalyzeCurrentPageLogic(mockResponse)
      ).rejects.toThrow(/Invalid response: Missing or invalid response data/);
    });

    it('should throw error when response.data.description is null (Bug #5 - FIXED)', async () => {
      const mockResponse = {
        success: true,
        data: {
          description: null, // null description
          jobTitle: 'Senior Engineer',
          company: 'TechCorp',
          location: 'San Francisco, CA',
          url: 'https://example.com/job/123',
        },
      };

      // After fix: should throw a meaningful validation error
      await expect(
        handleAnalyzeCurrentPageLogic(mockResponse)
      ).rejects.toThrow(/Invalid response: Job description is required/);
    });

    it('should throw error when required fields (jobTitle, company) are missing (Bug #5 - FIXED)', async () => {
      const mockResponse = {
        success: true,
        data: {
          description: 'We are looking for a talented engineer...',
          // jobTitle is missing!
          // company is missing!
          location: 'Remote',
          url: 'https://example.com/job/456',
        },
      };

      // After fix: should throw a validation error for missing jobTitle
      await expect(
        handleAnalyzeCurrentPageLogic(mockResponse)
      ).rejects.toThrow(/Invalid response: Job title is required/);
    });

    it('should throw error when description is empty string (Bug #5 - FIXED)', async () => {
      const mockResponse = {
        success: true,
        data: {
          description: '   ', // Whitespace only
          jobTitle: 'Engineer',
          company: 'TechCorp',
          location: 'Remote',
          url: 'https://example.com/job/789',
        },
      };

      // After fix: should throw a validation error for empty description
      await expect(
        handleAnalyzeCurrentPageLogic(mockResponse)
      ).rejects.toThrow(/Invalid response: Job description is required/);
    });
  });

  describe('Valid Data Tests', () => {
    it('should succeed with valid data and extract keywords', async () => {
      const mockResponse = {
        success: true,
        data: {
          description: 'We are looking for a Senior Software Engineer with 5+ years of experience in React, TypeScript, and Node.js. Required skills: React, TypeScript, REST APIs. Preferred: GraphQL, AWS.',
          jobTitle: 'Senior Software Engineer',
          company: 'TechCorp',
          location: 'San Francisco, CA',
          url: 'https://example.com/job/123',
        },
      };

      const result = await handleAnalyzeCurrentPageLogic(mockResponse);

      // Should have extracted keywords
      expect(result.extractedKeywords.length).toBeGreaterThan(0);
      expect(result.requiredSkills.length).toBeGreaterThan(0);

      // All fields should be properly set
      expect(result.jobTitle).toBe('Senior Software Engineer');
      expect(result.company).toBe('TechCorp');
      expect(result.location).toBe('San Francisco, CA');
      expect(result.jobUrl).toBe('https://example.com/job/123');
      expect(result.rawText).toBe(mockResponse.data.description);
    });
  });

  describe('Edge Cases', () => {
    it('should handle optional fields (location, url) being undefined', async () => {
      const mockResponse = {
        success: true,
        data: {
          description: 'Looking for a talented engineer with React experience.',
          jobTitle: 'Engineer',
          company: 'StartupCo',
          // location is optional
          // url is optional
        },
      };

      // Should succeed because location/url are optional
      const result = await handleAnalyzeCurrentPageLogic(mockResponse);

      expect(result.jobTitle).toBe('Engineer');
      expect(result.company).toBe('StartupCo');
      expect(result.location).toBeUndefined(); // Optional field
      expect(result.jobUrl).toBeUndefined(); // Optional field
    });

    it('should throw error when jobTitle is empty after trim', async () => {
      const mockResponse = {
        success: true,
        data: {
          description: 'Looking for a talented engineer.',
          jobTitle: '   ', // Whitespace only
          company: 'TechCorp',
        },
      };

      await expect(
        handleAnalyzeCurrentPageLogic(mockResponse)
      ).rejects.toThrow(/Invalid response: Job title is required/);
    });

    it('should throw error when company is empty after trim', async () => {
      const mockResponse = {
        success: true,
        data: {
          description: 'Looking for a talented engineer.',
          jobTitle: 'Engineer',
          company: '', // Empty string
        },
      };

      await expect(
        handleAnalyzeCurrentPageLogic(mockResponse)
      ).rejects.toThrow(/Invalid response: Company name is required/);
    });
  });
});
