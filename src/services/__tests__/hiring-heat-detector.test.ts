/**
 * Hiring Heat Detector Tests
 * Tests for hiring heat detection and feed item generation
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  detectHiringHeat,
  shouldCreateHiringHeatItem,
  generateHiringHeatFeedItem,
  type HiringHeatIndicator,
} from '../hiring-heat-detector';
import type { LinkedInJob, JobSnapshot } from '../../types/monitoring';
import type { WatchlistCompany } from '../../types/watchlist';
import type { FeedItem } from '../../types/feed';

// Mock chrome.storage
const mockStorage = new Map<string, any>();
global.chrome = {
  storage: {
    local: {
      get: vi.fn((keys: string | string[]) => {
        const result: Record<string, any> = {};
        const keyArray = typeof keys === 'string' ? [keys] : keys;
        keyArray.forEach((key) => {
          if (mockStorage.has(key)) {
            result[key] = mockStorage.get(key);
          }
        });
        return Promise.resolve(result);
      }),
      set: vi.fn((items: Record<string, any>) => {
        Object.entries(items).forEach(([key, value]) => {
          mockStorage.set(key, value);
        });
        return Promise.resolve();
      }),
    },
  },
} as any;

// Helper to create a job
function createJob(
  id: string,
  title: string,
  postedDaysAgo: number = 0
): LinkedInJob {
  const postedDate = new Date();
  postedDate.setDate(postedDate.getDate() - postedDaysAgo);

  return {
    id,
    title,
    company: 'Test Company',
    companyUrl: 'https://linkedin.com/company/test-company',
    location: 'San Francisco, CA',
    postedDate: `${postedDaysAgo} days ago`,
    postedTimestamp: postedDate.getTime(),
    jobUrl: `https://linkedin.com/jobs/${id}`,
  };
}

// Helper to create a company
function createCompany(name: string = 'Test Company'): WatchlistCompany {
  return {
    id: 'company-1',
    name,
    companyUrl: 'https://linkedin.com/company/test-company',
    companyLogo: 'https://example.com/logo.png',
    addedAt: Date.now(),
    jobAlertEnabled: true,
  };
}

describe('Hiring Heat Detector', () => {
  beforeEach(() => {
    mockStorage.clear();
    mockStorage.set('uproot_feed', []); // Empty feed
    vi.clearAllMocks();
  });

  describe('detectHiringHeat', () => {
    it('should return null when fewer than MIN_NEW_JOBS_THRESHOLD new jobs', () => {
      const company = createCompany();
      const currentJobs = [
        createJob('job1', 'Software Engineer', 3),
        createJob('job2', 'Product Manager', 5),
      ];
      const previousSnapshot: JobSnapshot = {
        companyId: company.id,
        lastChecked: Date.now() - 10 * 24 * 60 * 60 * 1000,
        jobs: [],
      };

      const result = detectHiringHeat(currentJobs, previousSnapshot, company);
      expect(result).toBeNull();
    });

    it('should return null when jobs are outside detection window', () => {
      const company = createCompany();
      const currentJobs = [
        createJob('job1', 'Software Engineer', 10), // 10 days ago (outside 7-day window)
        createJob('job2', 'Product Manager', 12),
        createJob('job3', 'Designer', 15),
      ];
      const previousSnapshot: JobSnapshot = {
        companyId: company.id,
        lastChecked: Date.now() - 20 * 24 * 60 * 60 * 1000,
        jobs: [],
      };

      const result = detectHiringHeat(currentJobs, previousSnapshot, company);
      expect(result).toBeNull();
    });

    it('should detect "warming" heat level with 3-5 new jobs', () => {
      const company = createCompany();
      const currentJobs = [
        createJob('job1', 'Software Engineer', 2),
        createJob('job2', 'Product Manager', 3),
        createJob('job3', 'Designer', 4),
      ];
      const previousSnapshot: JobSnapshot = {
        companyId: company.id,
        lastChecked: Date.now() - 10 * 24 * 60 * 60 * 1000,
        jobs: [],
      };

      const result = detectHiringHeat(currentJobs, previousSnapshot, company);

      expect(result).not.toBeNull();
      expect(result!.heatLevel).toBe('warming');
      expect(result!.jobCount).toBe(3);
      expect(result!.company.name).toBe('Test Company');
    });

    it('should detect "hot" heat level with 6-9 new jobs', () => {
      const company = createCompany();
      const currentJobs = [
        createJob('job1', 'Software Engineer', 1),
        createJob('job2', 'Product Manager', 2),
        createJob('job3', 'Designer', 2),
        createJob('job4', 'Data Scientist', 3),
        createJob('job5', 'DevOps Engineer', 4),
        createJob('job6', 'QA Engineer', 5),
        createJob('job7', 'Technical Writer', 6),
      ];
      const previousSnapshot: JobSnapshot = {
        companyId: company.id,
        lastChecked: Date.now() - 10 * 24 * 60 * 60 * 1000,
        jobs: [],
      };

      const result = detectHiringHeat(currentJobs, previousSnapshot, company);

      expect(result).not.toBeNull();
      expect(result!.heatLevel).toBe('hot');
      expect(result!.jobCount).toBe(7);
    });

    it('should detect "very_hot" heat level with 10+ new jobs', () => {
      const company = createCompany();
      const currentJobs = Array.from({ length: 12 }, (_, i) =>
        createJob(`job${i}`, `Position ${i}`, Math.floor(i / 2))
      );
      const previousSnapshot: JobSnapshot = {
        companyId: company.id,
        lastChecked: Date.now() - 10 * 24 * 60 * 60 * 1000,
        jobs: [],
      };

      const result = detectHiringHeat(currentJobs, previousSnapshot, company);

      expect(result).not.toBeNull();
      expect(result!.heatLevel).toBe('very_hot');
      expect(result!.jobCount).toBe(12);
    });

    it('should prioritize intern/junior roles in topJobTitles', () => {
      const company = createCompany();
      const currentJobs = [
        createJob('job1', 'Software Engineering Intern', 1),
        createJob('job2', 'Junior Developer', 2),
        createJob('job3', 'Senior Engineer', 3),
        createJob('job4', 'Staff Engineer', 4),
      ];
      const previousSnapshot: JobSnapshot = {
        companyId: company.id,
        lastChecked: Date.now() - 10 * 24 * 60 * 60 * 1000,
        jobs: [],
      };

      const result = detectHiringHeat(currentJobs, previousSnapshot, company);

      expect(result).not.toBeNull();
      expect(result!.internshipCount).toBe(2);
      expect(result!.topJobTitles).toContain('Software Engineering Intern');
      expect(result!.topJobTitles).toContain('Junior Developer');
      expect(result!.topJobTitles[0]).toBe('Software Engineering Intern');
      expect(result!.topJobTitles[1]).toBe('Junior Developer');
    });

    it('should only count NEW jobs (not in previous snapshot)', () => {
      const company = createCompany();
      const existingJobs = [
        createJob('job1', 'Old Job 1', 15),
        createJob('job2', 'Old Job 2', 20),
      ];
      const currentJobs = [
        ...existingJobs,
        createJob('job3', 'New Job 1', 2),
        createJob('job4', 'New Job 2', 3),
        createJob('job5', 'New Job 3', 4),
      ];
      const previousSnapshot: JobSnapshot = {
        companyId: company.id,
        lastChecked: Date.now() - 10 * 24 * 60 * 60 * 1000,
        jobs: existingJobs,
      };

      const result = detectHiringHeat(currentJobs, previousSnapshot, company);

      expect(result).not.toBeNull();
      expect(result!.jobCount).toBe(3); // Only new jobs counted
      expect(result!.heatLevel).toBe('warming');
    });

    it('should handle no previous snapshot (first time check)', () => {
      const company = createCompany();
      const currentJobs = [
        createJob('job1', 'Software Engineer', 2),
        createJob('job2', 'Product Manager', 3),
        createJob('job3', 'Designer', 4),
      ];

      const result = detectHiringHeat(currentJobs, undefined, company);

      expect(result).not.toBeNull();
      expect(result!.jobCount).toBe(3);
    });

    it('should identify various junior/intern keywords', () => {
      const company = createCompany();
      const currentJobs = [
        createJob('job1', 'Summer Internship Program', 1),
        createJob('job2', 'Entry Level Developer', 2),
        createJob('job3', 'Co-op Software Engineer', 3),
        createJob('job4', 'New Graduate Program', 4),
      ];
      const previousSnapshot: JobSnapshot = {
        companyId: company.id,
        lastChecked: Date.now() - 10 * 24 * 60 * 60 * 1000,
        jobs: [],
      };

      const result = detectHiringHeat(currentJobs, previousSnapshot, company);

      expect(result).not.toBeNull();
      expect(result!.internshipCount).toBe(4);
    });
  });

  describe('shouldCreateHiringHeatItem', () => {
    it('should return true when no existing hiring_heat item for company', async () => {
      const company = createCompany();
      mockStorage.set('uproot_feed', []);

      const result = await shouldCreateHiringHeatItem(company, 7);

      expect(result).toBe(true);
    });

    it('should return false when recent hiring_heat item exists for same company', async () => {
      const company = createCompany();
      const existingItem: FeedItem = {
        id: 'feed_123',
        type: 'hiring_heat',
        timestamp: Date.now() - 2 * 24 * 60 * 60 * 1000, // 2 days ago
        read: false,
        title: 'Test Company is ramping up hiring 🔥',
        description: 'Test',
        company: 'Test Company',
        companyLogo: company.companyLogo || undefined,
        jobCount: 5,
        detectionWindow: 7,
        heatLevel: 'hot',
        topJobTitles: [],
        actionUrl: `${company.companyUrl}/jobs/`,
        actionLabel: 'View Open Roles',
      };
      mockStorage.set('uproot_feed', [existingItem]);

      const result = await shouldCreateHiringHeatItem(company, 7);

      expect(result).toBe(false);
    });

    it('should return true when existing hiring_heat item is outside detection window', async () => {
      const company = createCompany();
      const oldItem: FeedItem = {
        id: 'feed_123',
        type: 'hiring_heat',
        timestamp: Date.now() - 10 * 24 * 60 * 60 * 1000, // 10 days ago
        read: false,
        title: 'Test Company is ramping up hiring 🔥',
        description: 'Test',
        company: 'Test Company',
        companyLogo: company.companyLogo || undefined,
        jobCount: 5,
        detectionWindow: 7,
        heatLevel: 'hot',
        topJobTitles: [],
        actionUrl: `${company.companyUrl}/jobs/`,
        actionLabel: 'View Open Roles',
      };
      mockStorage.set('uproot_feed', [oldItem]);

      const result = await shouldCreateHiringHeatItem(company, 7);

      expect(result).toBe(true);
    });

    it('should return true when existing item is for a different company', async () => {
      const company1 = createCompany('Company A');
      const company2 = createCompany('Company B');
      const existingItem: FeedItem = {
        id: 'feed_123',
        type: 'hiring_heat',
        timestamp: Date.now() - 2 * 24 * 60 * 60 * 1000,
        read: false,
        title: 'Company B is ramping up hiring 🔥',
        description: 'Test',
        company: 'Company B',
        companyLogo: company2.companyLogo || undefined,
        jobCount: 5,
        detectionWindow: 7,
        heatLevel: 'hot',
        topJobTitles: [],
        actionUrl: `${company2.companyUrl}/jobs/`,
        actionLabel: 'View Open Roles',
      };
      mockStorage.set('uproot_feed', [existingItem]);

      const result = await shouldCreateHiringHeatItem(company1, 7);

      expect(result).toBe(true);
    });
  });

  describe('generateHiringHeatFeedItem', () => {
    it('should create feed item with correct structure', async () => {
      const company = createCompany();
      const indicator: HiringHeatIndicator = {
        company,
        jobCount: 5,
        internshipCount: 2,
        heatLevel: 'hot',
        topJobTitles: ['Software Engineer Intern', 'Product Manager', 'Designer'],
        detectionWindow: 7,
        actionUrl: `${company.companyUrl}/jobs/`,
      };
      mockStorage.set('uproot_feed', []);

      await generateHiringHeatFeedItem(indicator);

      const feedItems = mockStorage.get('uproot_feed');
      expect(feedItems).toHaveLength(1);

      const item = feedItems[0];
      expect(item.type).toBe('hiring_heat');
      expect(item.company).toBe('Test Company');
      expect(item.jobCount).toBe(5);
      expect(item.heatLevel).toBe('hot');
      expect(item.internshipCount).toBe(2);
      expect(item.topJobTitles).toEqual(['Software Engineer Intern', 'Product Manager', 'Designer']);
      expect(item.title).toContain('Test Company');
      expect(item.title).toContain('🔥🔥'); // Hot emoji
      expect(item.description).toContain('5 new');
      expect(item.description).toContain('7 days');
      expect(item.description).toContain('2 intern/junior');
      expect(item.actionLabel).toBe('View Open Roles');
      expect(item.read).toBe(false);
    });

    it('should use correct emoji for each heat level', async () => {
      const company = createCompany();
      mockStorage.set('uproot_feed', []);

      // Warming
      const warmingIndicator: HiringHeatIndicator = {
        company,
        jobCount: 3,
        internshipCount: 0,
        heatLevel: 'warming',
        topJobTitles: ['Job 1', 'Job 2', 'Job 3'],
        detectionWindow: 7,
        actionUrl: `${company.companyUrl}/jobs/`,
      };
      await generateHiringHeatFeedItem(warmingIndicator);

      let feedItems = mockStorage.get('uproot_feed');
      expect(feedItems[0].title).toContain('🔥');
      expect(feedItems[0].title).not.toContain('🔥🔥');

      // Reset
      mockStorage.set('uproot_feed', []);

      // Very hot
      const veryHotIndicator: HiringHeatIndicator = {
        company,
        jobCount: 15,
        internshipCount: 0,
        heatLevel: 'very_hot',
        topJobTitles: ['Job 1', 'Job 2', 'Job 3'],
        detectionWindow: 7,
        actionUrl: `${company.companyUrl}/jobs/`,
      };
      await generateHiringHeatFeedItem(veryHotIndicator);

      feedItems = mockStorage.get('uproot_feed');
      expect(feedItems[0].title).toContain('🔥🔥🔥');
    });

    it('should not create duplicate item if one exists', async () => {
      const company = createCompany();
      const existingItem: FeedItem = {
        id: 'feed_123',
        type: 'hiring_heat',
        timestamp: Date.now() - 2 * 24 * 60 * 60 * 1000,
        read: false,
        title: 'Test Company is ramping up hiring 🔥',
        description: 'Test',
        company: 'Test Company',
        companyLogo: company.companyLogo || undefined,
        jobCount: 5,
        detectionWindow: 7,
        heatLevel: 'hot',
        topJobTitles: [],
        actionUrl: `${company.companyUrl}/jobs/`,
        actionLabel: 'View Open Roles',
      };
      mockStorage.set('uproot_feed', [existingItem]);

      const indicator: HiringHeatIndicator = {
        company,
        jobCount: 6,
        internshipCount: 0,
        heatLevel: 'hot',
        topJobTitles: ['Job 1', 'Job 2', 'Job 3'],
        detectionWindow: 7,
        actionUrl: `${company.companyUrl}/jobs/`,
      };

      await generateHiringHeatFeedItem(indicator);

      const feedItems = mockStorage.get('uproot_feed');
      expect(feedItems).toHaveLength(1); // No new item created
    });

    it('should handle zero internship count', async () => {
      const company = createCompany();
      const indicator: HiringHeatIndicator = {
        company,
        jobCount: 4,
        internshipCount: 0,
        heatLevel: 'warming',
        topJobTitles: ['Senior Engineer', 'Staff Engineer', 'Principal Engineer'],
        detectionWindow: 7,
        actionUrl: `${company.companyUrl}/jobs/`,
      };
      mockStorage.set('uproot_feed', []);

      await generateHiringHeatFeedItem(indicator);

      const feedItems = mockStorage.get('uproot_feed');
      expect(feedItems[0].description).toContain('4 new position');
      expect(feedItems[0].description).not.toContain('intern/junior');
    });
  });
});
