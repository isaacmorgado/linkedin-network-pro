/**
 * Company Updates Detection Tests
 * Tests for detecting and generating company_update feed items
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { WatchlistCompany } from '../../types/watchlist';
import type { LinkedInCompanyUpdate } from '../../types/monitoring';

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

// Mock chrome.storage BEFORE importing service
vi.stubGlobal('chrome', {
  storage: mockChromeStorage,
});

// Mock logger to reduce noise
vi.mock('../../utils/logger', () => ({
  log: {
    trackAsync: vi.fn((_category: string, _operation: string, fn: () => any) => fn()),
    debug: vi.fn(),
    info: vi.fn(),
    change: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
  LogCategory: {
    SERVICE: 'SERVICE',
    STORAGE: 'STORAGE',
  },
}));

// Mock LinkedIn scraper
vi.mock('../../utils/linkedin-scraper', () => ({
  scrapeCompanyUpdates: vi.fn(),
  scrapeCompanyJobs: vi.fn(),
  scrapePersonProfile: vi.fn(),
  getCompanyIdFromUrl: vi.fn(),
  getProfileUsernameFromUrl: vi.fn(),
}));

// Import actual service functions AFTER mocking
import { checkCompanyUpdates } from '../watchlist-monitor';
import { scrapeCompanyUpdates } from '../../utils/linkedin-scraper';

// ============================================================================
// Helper Functions
// ============================================================================

function createCompany(name: string, url: string): WatchlistCompany {
  return {
    id: url,
    name,
    industry: 'Technology',
    companyUrl: url,
    addedAt: Date.now(),
    jobAlertEnabled: true,
    companyLogo: `https://example.com/logo/${name.toLowerCase()}.jpg`,
  };
}

function createCompanyUpdate(
  id: string,
  preview: string,
  timestamp: number = Date.now(),
  url?: string
): LinkedInCompanyUpdate {
  return {
    id,
    type: 'post',
    preview,
    timestamp,
    url: url || `https://linkedin.com/feed/update/${id}`,
  };
}

// ============================================================================
// Tests
// ============================================================================

describe('Company Updates Detection', () => {
  beforeEach(() => {
    mockStorage = {};
    mockStorage['uproot_feed'] = [] as any[];
    mockStorage['uproot_company_snapshots'] = [] as any[];
    vi.clearAllMocks();
    vi.mocked(scrapeCompanyUpdates).mockReturnValue([]);
  });

  describe('checkCompanyUpdates', () => {
    it('should create feed item for new company update', async () => {
      const company = createCompany('Anthropic', 'https://linkedin.com/company/anthropic');

      const previousUpdates = [
        createCompanyUpdate('update-1', 'Old update from last week', Date.now() - 7 * 24 * 60 * 60 * 1000),
      ];

      const currentUpdates = [
        createCompanyUpdate('update-1', 'Old update from last week', Date.now() - 7 * 24 * 60 * 60 * 1000),
        createCompanyUpdate('update-2', 'New product announcement!', Date.now() - 1 * 60 * 60 * 1000), // 1 hour ago
      ];

      // Set up previous snapshot
      mockStorage['uproot_company_snapshots'] = [
        {
          companyId: company.id,
          lastChecked: Date.now() - 1 * 60 * 60 * 1000,
          updates: previousUpdates,
        },
      ];

      vi.mocked(scrapeCompanyUpdates).mockReturnValue(currentUpdates);

      await checkCompanyUpdates(company);

      const feedItems = mockStorage['uproot_feed'];
      expect(feedItems).toHaveLength(1);
      expect(feedItems[0].type).toBe('company_update');
      expect(feedItems[0].company).toBe('Anthropic');
      expect(feedItems[0].description).toBe('New product announcement!');
    });

    it('should NOT create feed item on first visit (baseline establishment)', async () => {
      const company = createCompany('OpenAI', 'https://linkedin.com/company/openai');

      const currentUpdates = [
        createCompanyUpdate('update-1', 'First post', Date.now()),
        createCompanyUpdate('update-2', 'Second post', Date.now()),
      ];

      // No previous snapshot (first visit)
      vi.mocked(scrapeCompanyUpdates).mockReturnValue(currentUpdates);

      await checkCompanyUpdates(company);

      const feedItems = mockStorage['uproot_feed'];
      expect(feedItems).toHaveLength(0); // No feed items on first visit

      // But should save snapshot for future comparisons
      const snapshots = mockStorage['uproot_company_snapshots'];
      expect(snapshots).toHaveLength(1);
      expect(snapshots[0].companyId).toBe(company.id);
      expect(snapshots[0].updates).toHaveLength(2);
    });

    it('should filter out old updates (>7 days)', async () => {
      const company = createCompany('Stripe', 'https://linkedin.com/company/stripe');

      const previousUpdates: LinkedInCompanyUpdate[] = [
        createCompanyUpdate('update-1', 'Very old update', Date.now() - 30 * 24 * 60 * 60 * 1000),
      ];

      const currentUpdates = [
        createCompanyUpdate('update-1', 'Very old update', Date.now() - 30 * 24 * 60 * 60 * 1000),
        createCompanyUpdate('update-2', 'Old but new to snapshot', Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days old
      ];

      mockStorage['uproot_company_snapshots'] = [
        {
          companyId: company.id,
          lastChecked: Date.now() - 15 * 24 * 60 * 60 * 1000,
          updates: previousUpdates,
        },
      ];

      vi.mocked(scrapeCompanyUpdates).mockReturnValue(currentUpdates);

      await checkCompanyUpdates(company);

      const feedItems = mockStorage['uproot_feed'];
      expect(feedItems).toHaveLength(0); // Update is >7 days old, should be filtered
    });

    it('should handle multiple new updates', async () => {
      const company = createCompany('Google', 'https://linkedin.com/company/google');

      const previousUpdates = [
        createCompanyUpdate('update-1', 'Old update', Date.now() - 2 * 24 * 60 * 60 * 1000),
      ];

      const currentUpdates = [
        createCompanyUpdate('update-1', 'Old update', Date.now() - 2 * 24 * 60 * 60 * 1000),
        createCompanyUpdate('update-2', 'First new update', Date.now() - 1 * 60 * 60 * 1000),
        createCompanyUpdate('update-3', 'Second new update', Date.now() - 30 * 60 * 1000),
      ];

      mockStorage['uproot_company_snapshots'] = [
        {
          companyId: company.id,
          lastChecked: Date.now() - 2 * 24 * 60 * 60 * 1000,
          updates: previousUpdates,
        },
      ];

      vi.mocked(scrapeCompanyUpdates).mockReturnValue(currentUpdates);

      await checkCompanyUpdates(company);

      const feedItems = mockStorage['uproot_feed'];
      expect(feedItems).toHaveLength(2);
      // Feed items are added in reverse order (most recent first)
      expect(feedItems[0].description).toBe('Second new update');
      expect(feedItems[1].description).toBe('First new update');
    });

    it('should deduplicate updates already in feed', async () => {
      const company = createCompany('Meta', 'https://linkedin.com/company/meta');
      const updateUrl = 'https://linkedin.com/feed/update/test-123';

      const previousUpdates: LinkedInCompanyUpdate[] = [];
      const currentUpdates = [
        createCompanyUpdate('update-1', 'New update', Date.now(), updateUrl),
      ];

      // Add to previous snapshot (new since last check)
      mockStorage['uproot_company_snapshots'] = [
        {
          companyId: company.id,
          lastChecked: Date.now() - 1 * 60 * 60 * 1000,
          updates: previousUpdates,
        },
      ];

      // But this update is already in feed
      mockStorage['uproot_feed'] = [
        {
          id: 'feed-1',
          type: 'company_update' as const,
          timestamp: Date.now(),
          read: false,
          title: 'Company Update',
          description: 'New update',
          company: 'Meta',
          actionUrl: updateUrl,
          actionLabel: 'See Post',
        },
      ];

      vi.mocked(scrapeCompanyUpdates).mockReturnValue(currentUpdates);

      await checkCompanyUpdates(company);

      const feedItems = mockStorage['uproot_feed'];
      expect(feedItems).toHaveLength(1); // Should NOT add duplicate
    });

    it('should handle no updates scraped', async () => {
      const company = createCompany('Tesla', 'https://linkedin.com/company/tesla');

      vi.mocked(scrapeCompanyUpdates).mockReturnValue([]);

      await checkCompanyUpdates(company);

      const feedItems = mockStorage['uproot_feed'];
      expect(feedItems).toHaveLength(0);
    });

    it('should update snapshot after checking', async () => {
      const company = createCompany('Apple', 'https://linkedin.com/company/apple');

      const currentUpdates = [
        createCompanyUpdate('update-1', 'Latest update', Date.now()),
      ];

      vi.mocked(scrapeCompanyUpdates).mockReturnValue(currentUpdates);

      await checkCompanyUpdates(company);

      const snapshots = mockStorage['uproot_company_snapshots'];
      expect(snapshots).toHaveLength(1);
      expect(snapshots[0].companyId).toBe(company.id);
      expect(snapshots[0].updates).toEqual(currentUpdates);
      expect(snapshots[0].lastChecked).toBeGreaterThan(Date.now() - 1000);
    });
  });

  describe('Feed Item Structure', () => {
    it('should create properly structured feed items', async () => {
      const company = createCompany('Netflix', 'https://linkedin.com/company/netflix');

      const currentUpdates = [
        createCompanyUpdate(
          'update-1',
          'We are hiring engineers for our new platform!',
          Date.now() - 2 * 60 * 60 * 1000,
          'https://linkedin.com/feed/update/netflix-123'
        ),
      ];

      mockStorage['uproot_company_snapshots'] = [
        {
          companyId: company.id,
          lastChecked: Date.now() - 1 * 24 * 60 * 60 * 1000,
          updates: [],
        },
      ];

      vi.mocked(scrapeCompanyUpdates).mockReturnValue(currentUpdates);

      await checkCompanyUpdates(company);

      const feedItems = mockStorage['uproot_feed'];
      expect(feedItems).toHaveLength(1);

      const feedItem = feedItems[0];
      expect(feedItem.type).toBe('company_update');
      expect(feedItem.title).toBe('Company Update');
      expect(feedItem.description).toBe('We are hiring engineers for our new platform!');
      expect(feedItem.company).toBe('Netflix');
      expect(feedItem.companyLogo).toBe('https://example.com/logo/netflix.jpg');
      expect(feedItem.actionUrl).toBe('https://linkedin.com/feed/update/netflix-123');
      expect(feedItem.actionLabel).toBe('See Post');
      expect(feedItem.read).toBe(false);
      expect(feedItem.timestamp).toBeGreaterThan(0);
    });
  });
});
