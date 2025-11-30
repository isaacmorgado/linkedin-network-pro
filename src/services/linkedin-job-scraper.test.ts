/**
 * Tests for LinkedIn Job Scraper
 * Bug #6: All-or-Nothing Extraction
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { JSDOM } from 'jsdom';
import { scrapeJobData } from './linkedin-job-scraper';

// Mock the logger module to avoid errors in tests
vi.mock('../utils/logger', () => ({
  log: {
    trace: vi.fn(() => vi.fn()),
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    trackAsync: vi.fn((_category, _name, fn) => fn()),
  },
  LogCategory: {
    SERVICE: 'SERVICE',
  },
}));

describe('LinkedIn Job Scraper - Bug #6: All-or-Nothing Extraction', () => {
  beforeEach(() => {
    // Reset DOM before each test
    const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', {
      url: 'https://www.linkedin.com/jobs/view/12345/',
    });
    global.window = dom.window as any;
    global.document = dom.window.document;
    global.console.log = vi.fn();
    global.console.error = vi.fn();
  });

  describe('Partial Data Extraction', () => {
    it('should return partial data when description is missing but other fields are available', () => {
      // Setup: Create a job page with title and company but NO description
      const jobPageHTML = `
        <div class="jobs-unified-top-card">
          <h1 class="jobs-unified-top-card__job-title">Senior Software Engineer</h1>
          <a class="jobs-unified-top-card__company-name" href="/company/test-company/">
            Test Company Inc.
          </a>
          <span class="jobs-unified-top-card__bullet">San Francisco, CA</span>
        </div>
        <!-- No description element present -->
      `;

      document.body.innerHTML = jobPageHTML;

      // Act: Try to scrape job data
      const result = scrapeJobData();

      // Assert: Should return partial data, not null
      expect(result).not.toBeNull();
      expect(result).toMatchObject({
        jobTitle: 'Senior Software Engineer',
        company: 'Test Company Inc.',
        location: 'San Francisco, CA',
        jobId: '12345',
        url: 'https://www.linkedin.com/jobs/view/12345/',
      });
      // Description should be empty string or marked as unavailable
      expect(result?.description).toBeDefined();
      expect(result?.description).toBe('');
    });

    it('should return partial data when description is empty but other fields are available', () => {
      // Setup: Create a job page with title and company but EMPTY description
      const jobPageHTML = `
        <div class="jobs-unified-top-card">
          <h1 class="jobs-unified-top-card__job-title">Product Manager</h1>
          <a class="jobs-unified-top-card__company-name" href="/company/another-company/">
            Another Company LLC
          </a>
          <span class="jobs-unified-top-card__bullet">Remote</span>
        </div>
        <div class="jobs-description__content">
          <!-- Too short description -->
          <p>TBD</p>
        </div>
      `;

      document.body.innerHTML = jobPageHTML;

      // Act: Try to scrape job data
      const result = scrapeJobData();

      // Assert: Should return partial data, not null
      expect(result).not.toBeNull();
      expect(result).toMatchObject({
        jobTitle: 'Product Manager',
        company: 'Another Company LLC',
        location: 'Remote',
        jobId: '12345',
        url: 'https://www.linkedin.com/jobs/view/12345/',
      });
      // Description should be empty string or marked as unavailable
      expect(result?.description).toBeDefined();
    });

    it('should still return full data when all fields including description are available', () => {
      // Setup: Create a complete job page with all data
      const jobPageHTML = `
        <div class="jobs-unified-top-card">
          <h1 class="jobs-unified-top-card__job-title">Full Stack Developer</h1>
          <a class="jobs-unified-top-card__company-name" href="/company/great-company/">
            Great Company Corp
          </a>
          <span class="jobs-unified-top-card__bullet">New York, NY</span>
        </div>
        <div class="jobs-description__content">
          <p>We are looking for an experienced Full Stack Developer to join our team.
          You will work on cutting-edge technologies and collaborate with talented engineers.
          Must have 5+ years of experience with React, Node.js, and TypeScript.
          This is a great opportunity to make an impact in a growing startup.</p>
        </div>
      `;

      document.body.innerHTML = jobPageHTML;

      // Act: Scrape job data
      const result = scrapeJobData();

      // Assert: Should return complete data
      expect(result).not.toBeNull();
      expect(result).toMatchObject({
        jobTitle: 'Full Stack Developer',
        company: 'Great Company Corp',
        location: 'New York, NY',
        jobId: '12345',
        url: 'https://www.linkedin.com/jobs/view/12345/',
      });
      expect(result?.description).toBeTruthy();
      expect(result?.description.length).toBeGreaterThan(100);
    });
  });

  describe('Edge Cases', () => {
    it('should still return null when critical fields (jobTitle and company) are missing', () => {
      // Setup: Create a job page with ONLY description
      const jobPageHTML = `
        <div class="jobs-description__content">
          <p>This is a job description without any job title or company information.
          We still need at least the job title and company to make sense of the data.
          Description alone is not enough to identify a job posting.</p>
        </div>
      `;

      document.body.innerHTML = jobPageHTML;

      // Act: Try to scrape job data
      const result = scrapeJobData();

      // Assert: Should return null because critical fields are missing
      expect(result).toBeNull();
    });
  });
});
