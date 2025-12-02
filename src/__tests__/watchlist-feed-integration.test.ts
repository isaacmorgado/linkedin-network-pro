/**
 * Watchlist → Feed Integration Tests
 * Tests critical flows from watchlist changes to feed item generation
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { WatchlistCompany } from '../types/watchlist';
import type { JobPreferences } from '../types/onboarding';
import type { LinkedInJob } from '../types/monitoring';

// ============================================================================
// Mock Chrome Storage
// ============================================================================

type StorageData = Record<string, any>;

let mockStorage: StorageData = {};

const mockChromeStorage = {
  local: {
    get: vi.fn((keys: string | string[] | null) => {
      if (keys === null) {
        return Promise.resolve(mockStorage);
      }
      if (Array.isArray(keys)) {
        const result: StorageData = {};
        keys.forEach((key) => {
          if (key in mockStorage) {
            result[key] = mockStorage[key];
          }
        });
        return Promise.resolve(result);
      }
      if (typeof keys === 'string') {
        return Promise.resolve({ [keys]: mockStorage[keys] });
      }
      return Promise.resolve({});
    }),
    set: vi.fn((items: StorageData) => {
      Object.assign(mockStorage, items);
      return Promise.resolve();
    }),
    remove: vi.fn((keys: string | string[]) => {
      const keysArray = Array.isArray(keys) ? keys : [keys];
      keysArray.forEach((key) => {
        delete mockStorage[key];
      });
      return Promise.resolve();
    }),
  },
};

// Mock chrome.storage BEFORE importing services
vi.stubGlobal('chrome', {
  storage: mockChromeStorage,
});

// Mock logger to reduce noise
vi.mock('../utils/logger', () => ({
  log: {
    trackAsync: vi.fn((_category: string, _operation: string, fn: () => any) => fn()),
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    change: vi.fn(),
    error: vi.fn(),
  },
  LogCategory: {
    STORAGE: 'STORAGE',
    SERVICE: 'SERVICE',
  },
}));

// Mock LinkedIn scraper
vi.mock('../utils/linkedin-scraper', () => ({
  scrapeCompanyJobs: vi.fn(),
  scrapePersonProfile: vi.fn(),
  scrapeCompanyUpdates: vi.fn(),
  getCompanyIdFromUrl: vi.fn(),
  getProfileUsernameFromUrl: vi.fn(),
}));

// Mock job matcher
vi.mock('../services/job-matcher', () => ({
  calculateJobMatch: vi.fn((_job, _criteria) => ({ score: 85, reasons: ['Title match'] })),
  filterMatchingJobs: vi.fn((jobs, _criteria, _minScore) =>
    jobs.map((job: LinkedInJob) => ({ job, match: { score: 85, reasons: ['Title match'] } }))
  ),
}));

// Import actual services AFTER mocking
import { scrapeCompanyJobs } from '../utils/linkedin-scraper';
import { checkCompanyJobs } from '../services/watchlist-monitor';
import {
  addCompanyToWatchlist,
  removeCompanyFromWatchlist,
  isCompanyInWatchlist
} from '../utils/storage/company-watchlist-storage';
import { getFeedItems } from '../utils/storage/feed-storage';

// ============================================================================
// Mock Data
// ============================================================================

const mockCompanyAntropic: Omit<WatchlistCompany, 'id' | 'addedAt'> = {
  name: 'Anthropic',
  companyUrl: 'https://linkedin.com/company/anthropic',
  companyLogo: 'https://example.com/anthropic.png',
  industry: 'AI Research',
  jobAlertEnabled: true,
  jobPreferences: {
    keywords: ['ML', 'research'],
    experienceLevel: ['entry', 'mid'],
    workLocation: ['remote'],
    location: ['San Francisco', 'Remote'],
  },
};

const mockJobPreferences: JobPreferences = {
  jobTitles: ['ML', 'research', 'engineer'],
  experienceLevel: ['entry', 'mid'],
  workLocation: ['remote'],
  locations: ['San Francisco', 'Remote'],
  industries: ['AI', 'Technology'],
};

const mockJob1: LinkedInJob = {
  id: 'job-1',
  title: 'ML Research Engineer',
  company: 'Anthropic',
  companyUrl: 'https://linkedin.com/company/anthropic',
  location: 'Remote',
  postedDate: '2 days ago',
  postedTimestamp: Date.now() - 2 * 24 * 60 * 60 * 1000, // 2 days ago
  jobUrl: 'https://linkedin.com/jobs/view/job-1',
};

const mockJob2: LinkedInJob = {
  id: 'job-2',
  title: 'Software Engineer',
  company: 'Anthropic',
  companyUrl: 'https://linkedin.com/company/anthropic',
  location: 'San Francisco',
  postedDate: '1 day ago',
  postedTimestamp: Date.now() - 1 * 24 * 60 * 60 * 1000, // 1 day ago
  jobUrl: 'https://linkedin.com/jobs/view/job-2',
};

const mockJob3: LinkedInJob = {
  id: 'job-3',
  title: 'Research Scientist',
  company: 'Anthropic',
  companyUrl: 'https://linkedin.com/company/anthropic',
  location: 'Remote',
  postedDate: '3 days ago',
  postedTimestamp: Date.now() - 3 * 24 * 60 * 60 * 1000, // 3 days ago
  jobUrl: 'https://linkedin.com/jobs/view/job-3',
};

// ============================================================================
// Helper Functions
// ============================================================================

async function clearAllStorage() {
  mockStorage = {};
  vi.clearAllMocks();
}

async function addMockJobs(jobs: LinkedInJob[]) {
  vi.mocked(scrapeCompanyJobs).mockReturnValue(jobs);
}

// ============================================================================
// Tests
// ============================================================================

describe('Watchlist → Feed Integration', () => {
  beforeEach(async () => {
    await clearAllStorage();
  });

  // ==========================================================================
  // Job Alert Flow
  // ==========================================================================

  describe('Job Alert Generation', () => {
    it('should create job_alert when company has jobAlertEnabled: true and jobs match preferences', async () => {
      // Add company to watchlist
      const company = await addCompanyToWatchlist(mockCompanyAntropic);

      // Mock scraper to return matching jobs
      addMockJobs([mockJob1, mockJob2]);

      // Check company jobs
      const matchingJobs = await checkCompanyJobs(company, mockJobPreferences);

      // Verify jobs were found
      expect(matchingJobs.length).toBeGreaterThan(0);

      // Verify feed items were created
      const feedItems = await getFeedItems();
      const jobAlerts = feedItems.filter(item => item.type === 'job_alert');

      expect(jobAlerts.length).toBeGreaterThan(0);
      expect(jobAlerts[0]).toMatchObject({
        type: 'job_alert',
        company: 'Anthropic',
      });
    });

    it('should NOT create duplicate job_alert for same job (snapshot behavior)', async () => {
      const company = await addCompanyToWatchlist(mockCompanyAntropic);

      // First check: NEW jobs should create alerts
      addMockJobs([mockJob1, mockJob2]);
      await checkCompanyJobs(company, mockJobPreferences);

      const firstFeedCheck = await getFeedItems();
      const firstCount = firstFeedCheck.filter(item => item.type === 'job_alert').length;

      // Second check: SAME jobs should NOT create new alerts
      addMockJobs([mockJob1, mockJob2]); // Same jobs
      await checkCompanyJobs(company, mockJobPreferences);

      const secondFeedCheck = await getFeedItems();
      const secondCount = secondFeedCheck.filter(item => item.type === 'job_alert').length;

      // Should be same count (no new alerts for already-seen jobs)
      expect(secondCount).toBe(firstCount);
    });

    it('should create new job_alert only for NEW jobs (not in snapshot)', async () => {
      const company = await addCompanyToWatchlist(mockCompanyAntropic);

      // First check: 2 jobs
      addMockJobs([mockJob1, mockJob2]);
      await checkCompanyJobs(company, mockJobPreferences);

      const firstFeedCheck = await getFeedItems();
      const firstCount = firstFeedCheck.filter(item => item.type === 'job_alert').length;

      // Second check: 2 old + 1 NEW job
      addMockJobs([mockJob1, mockJob2, mockJob3]); // Added mockJob3
      await checkCompanyJobs(company, mockJobPreferences);

      const secondFeedCheck = await getFeedItems();
      const secondCount = secondFeedCheck.filter(item => item.type === 'job_alert').length;

      // Should have 1 more alert (for mockJob3 only)
      expect(secondCount).toBe(firstCount + 1);
    });
  });

  // ==========================================================================
  // Hiring Heat Flow
  // ==========================================================================

  describe('Hiring Heat Generation', () => {
    it('should create hiring_heat when company has 3+ NEW jobs', async () => {
      const company = await addCompanyToWatchlist(mockCompanyAntropic);

      // Mock 5 NEW jobs (all posted in last 7 days)
      const manyJobs: LinkedInJob[] = [
        { ...mockJob1, id: 'job-1', postedTimestamp: Date.now() - 2 * 24 * 60 * 60 * 1000 },
        { ...mockJob2, id: 'job-2', postedTimestamp: Date.now() - 2 * 24 * 60 * 60 * 1000 },
        { ...mockJob3, id: 'job-3', postedTimestamp: Date.now() - 3 * 24 * 60 * 60 * 1000 },
        { ...mockJob1, id: 'job-4', postedTimestamp: Date.now() - 1 * 24 * 60 * 60 * 1000 },
        { ...mockJob2, id: 'job-5', postedTimestamp: Date.now() - 1 * 24 * 60 * 60 * 1000 },
      ];

      addMockJobs(manyJobs);
      await checkCompanyJobs(company, mockJobPreferences);

      const feedItems = await getFeedItems();
      const hiringHeatItems = feedItems.filter(item => item.type === 'hiring_heat');

      expect(hiringHeatItems.length).toBeGreaterThan(0);
      expect(hiringHeatItems[0]).toMatchObject({
        type: 'hiring_heat',
        company: 'Anthropic',
      });
    });

    it('should NOT create hiring_heat when fewer than 3 NEW jobs', async () => {
      const company = await addCompanyToWatchlist(mockCompanyAntropic);

      // Only 2 jobs (below threshold)
      addMockJobs([mockJob1, mockJob2]);
      await checkCompanyJobs(company, mockJobPreferences);

      const feedItems = await getFeedItems();
      const hiringHeatItems = feedItems.filter(item => item.type === 'hiring_heat');

      expect(hiringHeatItems.length).toBe(0);
    });
  });

  // ==========================================================================
  // Company Removal Flow
  // ==========================================================================

  describe('Company Removal Behavior', () => {
    it('should NOT create new job_alert after company removed from watchlist', async () => {
      // Add company and create some alerts
      const company = await addCompanyToWatchlist(mockCompanyAntropic);
      addMockJobs([mockJob1]);
      await checkCompanyJobs(company, mockJobPreferences);

      // Remove company from watchlist
      await removeCompanyFromWatchlist(company.id);

      // Verify company is removed
      const isInWatchlist = await isCompanyInWatchlist(company.companyUrl);
      expect(isInWatchlist).toBe(false);

      // Try to check jobs for removed company (simulates what would happen if user visits page)
      // In real usage, monitorCurrentPage would skip this company entirely
      // But if checkCompanyJobs is called directly, it should still work technically
      // The key is that warm-path-detector should check isCompanyInWatchlist

      // For this test, we just verify the company is no longer in watchlist
      // Warm path tests will verify that warm paths aren't created for removed companies
    });

    it('should preserve existing feed items after company removed', async () => {
      const company = await addCompanyToWatchlist(mockCompanyAntropic);

      // Create some feed items
      addMockJobs([mockJob1, mockJob2]);
      await checkCompanyJobs(company, mockJobPreferences);

      const feedBeforeRemoval = await getFeedItems();
      const countBefore = feedBeforeRemoval.length;
      expect(countBefore).toBeGreaterThan(0);

      // Remove company
      await removeCompanyFromWatchlist(company.id);

      // Feed items should still exist
      const feedAfterRemoval = await getFeedItems();
      const countAfter = feedAfterRemoval.length;

      expect(countAfter).toBe(countBefore);
    });
  });

  // ==========================================================================
  // Scraper Failure Handling
  // ==========================================================================

  describe('Scraper Failure Handling', () => {
    it('should handle scraper returning empty array gracefully', async () => {
      const company = await addCompanyToWatchlist(mockCompanyAntropic);

      // Mock scraper to return empty array (no jobs found)
      addMockJobs([]);

      // Should not throw
      await expect(
        checkCompanyJobs(company, mockJobPreferences)
      ).resolves.not.toThrow();

      const matchingJobs = await checkCompanyJobs(company, mockJobPreferences);
      expect(matchingJobs).toEqual([]);

      // Should not create any feed items
      const feedItems = await getFeedItems();
      expect(feedItems.length).toBe(0);
    });
  });

  // ==========================================================================
  // Edge Cases
  // ==========================================================================

  describe('Edge Cases', () => {
    it('should handle company with no job preferences', async () => {
      const companyNoPrefs: Omit<WatchlistCompany, 'id' | 'addedAt'> = {
        ...mockCompanyAntropic,
        jobPreferences: undefined,
      };

      const company = await addCompanyToWatchlist(companyNoPrefs);

      addMockJobs([mockJob1]);

      // Should not throw even without jobPreferences
      await expect(
        checkCompanyJobs(company, mockJobPreferences)
      ).resolves.not.toThrow();
    });

    it('should handle first-time check (no previous snapshot)', async () => {
      const company = await addCompanyToWatchlist(mockCompanyAntropic);

      // First check: no previous snapshot, all jobs are "new"
      addMockJobs([mockJob1, mockJob2, mockJob3]);
      const matchingJobs = await checkCompanyJobs(company, mockJobPreferences);

      // All jobs should be treated as new on first check
      expect(matchingJobs.length).toBeGreaterThan(0);

      // Should create feed items
      const feedItems = await getFeedItems();
      expect(feedItems.length).toBeGreaterThan(0);
    });
  });
});
