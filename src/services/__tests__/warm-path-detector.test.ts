/**
 * Warm Path Detector Service Tests
 * Tests for detecting warm paths into watchlisted companies via new connections
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { LinkedInProfile } from '../../types';
import type { WatchlistCompany } from '../../types/watchlist';
import type { WarmPathDescriptor } from '../warm-path-detector';

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
    error: vi.fn(),
  },
  LogCategory: {
    MONITORING: 'MONITORING',
  },
}));

// Import actual service functions AFTER mocking
import {
  detectWarmPathForConnection,
  shouldCreateWarmPathItem,
  generateWarmPathFeedItem,
} from '../warm-path-detector';

// ============================================================================
// Helper Functions
// ============================================================================

function createLinkedInProfile(
  name: string,
  company: string,
  title: string,
  profileUrl: string
): LinkedInProfile {
  return {
    id: profileUrl,
    name,
    profileUrl,
    headline: title,
    currentRole: {
      title,
      company,
    },
    location: 'San Francisco, CA',
    photoUrl: `https://example.com/photo/${name.toLowerCase().replace(' ', '-')}.jpg`,
    education: [],
    experience: [
      {
        company,
        title,
        location: 'San Francisco, CA',
      },
    ],
    certifications: [],
    skills: [],
    connections: 500,
    mutualConnections: [],
    recentPosts: [],
    userPosts: [],
    engagedPosts: [],
    recentActivity: [],
    scrapedAt: new Date().toISOString(),
  };
}

function setupWatchlistCompanies(companies: Array<{ name: string; url: string }>) {
  const watchlistCompanies: WatchlistCompany[] = companies.map((company) => ({
    id: company.url, // ID should match companyUrl for isCompanyInWatchlist to work
    name: company.name,
    industry: 'Technology',
    companyUrl: company.url,
    addedAt: Date.now(),
    jobAlertEnabled: true,
    companyLogo: `https://example.com/logo/${company.name.toLowerCase()}.jpg`,
  }));

  mockStorage['uproot_watchlist_companies'] = watchlistCompanies;
}

// ============================================================================
// Tests
// ============================================================================

describe('Warm Path Detector', () => {
  beforeEach(() => {
    mockStorage = {};
    vi.clearAllMocks();
  });

  describe('detectWarmPathForConnection', () => {
    it('should detect direct warm path when connection works at watchlisted company', async () => {
      setupWatchlistCompanies([
        { name: 'Anthropic', url: 'https://linkedin.com/company/anthropic' },
        { name: 'OpenAI', url: 'https://linkedin.com/company/openai' },
      ]);

      const profile = createLinkedInProfile(
        'Sarah Chen',
        'Anthropic',
        'Senior Engineer',
        'https://linkedin.com/in/sarah-chen'
      );

      const result = await detectWarmPathForConnection(
        'https://linkedin.com/in/sarah-chen',
        profile
      );

      expect(result).not.toBeNull();
      expect(result?.targetCompany).toBe('Anthropic');
      expect(result?.viaPersonName).toBe('Sarah Chen');
      expect(result?.viaPersonProfileUrl).toBe('https://linkedin.com/in/sarah-chen');
      expect(result?.pathLength).toBe(1);
    });

    it('should return null when connection does not work at watchlisted company', async () => {
      setupWatchlistCompanies([
        { name: 'Anthropic', url: 'https://linkedin.com/company/anthropic' },
      ]);

      const profile = createLinkedInProfile(
        'John Doe',
        'Random Startup',
        'Engineer',
        'https://linkedin.com/in/john-doe'
      );

      const result = await detectWarmPathForConnection(
        'https://linkedin.com/in/john-doe',
        profile
      );

      expect(result).toBeNull();
    });

    it('should return null when connection has no company info', async () => {
      setupWatchlistCompanies([
        { name: 'Anthropic', url: 'https://linkedin.com/company/anthropic' },
      ]);

      const profile = createLinkedInProfile(
        'Jane Smith',
        '',
        'Freelancer',
        'https://linkedin.com/in/jane-smith'
      );
      profile.currentRole = undefined;

      const result = await detectWarmPathForConnection(
        'https://linkedin.com/in/jane-smith',
        profile
      );

      expect(result).toBeNull();
    });

    it('should include person image and title in descriptor', async () => {
      setupWatchlistCompanies([
        { name: 'OpenAI', url: 'https://linkedin.com/company/openai' },
      ]);

      const profile = createLinkedInProfile(
        'Alice Wang',
        'OpenAI',
        'Research Scientist',
        'https://linkedin.com/in/alice-wang'
      );

      const result = await detectWarmPathForConnection(
        'https://linkedin.com/in/alice-wang',
        profile
      );

      expect(result).not.toBeNull();
      expect(result?.viaPersonImage).toBe('https://example.com/photo/alice-wang.jpg');
      expect(result?.viaPersonTitle).toBe('Research Scientist');
    });

    it('should include company logo from watchlist', async () => {
      setupWatchlistCompanies([
        { name: 'Stripe', url: 'https://linkedin.com/company/stripe' },
      ]);

      const profile = createLinkedInProfile(
        'Bob Lee',
        'Stripe',
        'Product Manager',
        'https://linkedin.com/in/bob-lee'
      );

      const result = await detectWarmPathForConnection(
        'https://linkedin.com/in/bob-lee',
        profile
      );

      expect(result).not.toBeNull();
      expect(result?.targetCompanyLogo).toBe('https://example.com/logo/stripe.jpg');
    });
  });

  describe('shouldCreateWarmPathItem', () => {
    it('should return true for new warm path (not duplicate)', async () => {
      mockStorage['uproot_warm_path_dedupe'] = [];

      const shouldCreate = await shouldCreateWarmPathItem(
        'https://linkedin.com/company/anthropic',
        'https://linkedin.com/in/sarah',
        1
      );

      expect(shouldCreate).toBe(true);
    });

    it('should return false for duplicate warm path (within 30-day window)', async () => {
      const targetCompanyUrl = 'https://linkedin.com/company/anthropic';
      const viaPersonProfileUrl = 'https://linkedin.com/in/sarah';
      const pathLength = 1;

      mockStorage['uproot_warm_path_dedupe'] = [
        {
          key: `${targetCompanyUrl}_${viaPersonProfileUrl}_${pathLength}`,
          targetCompanyUrl,
          viaPersonProfileUrl,
          pathLength,
          createdAt: Date.now() - 1000 * 60 * 60 * 24 * 10, // 10 days ago
        },
      ];

      const shouldCreate = await shouldCreateWarmPathItem(
        targetCompanyUrl,
        viaPersonProfileUrl,
        pathLength
      );

      expect(shouldCreate).toBe(false);
    });

    it('should return true for same person but different company', async () => {
      const targetCompanyUrl = 'https://linkedin.com/company/anthropic';
      const viaPersonProfileUrl = 'https://linkedin.com/in/sarah';
      const pathLength = 1;

      mockStorage['uproot_warm_path_dedupe'] = [
        {
          key: `${targetCompanyUrl}_${viaPersonProfileUrl}_${pathLength}`,
          targetCompanyUrl,
          viaPersonProfileUrl,
          pathLength,
          createdAt: Date.now() - 1000 * 60 * 60 * 24 * 5,
        },
      ];

      const shouldCreate = await shouldCreateWarmPathItem(
        'https://linkedin.com/company/openai', // Different company
        viaPersonProfileUrl,
        pathLength
      );

      expect(shouldCreate).toBe(true);
    });

    it('should return true for same company but different person', async () => {
      const targetCompanyUrl = 'https://linkedin.com/company/anthropic';
      const viaPersonProfileUrl = 'https://linkedin.com/in/sarah';
      const pathLength = 1;

      mockStorage['uproot_warm_path_dedupe'] = [
        {
          key: `${targetCompanyUrl}_${viaPersonProfileUrl}_${pathLength}`,
          targetCompanyUrl,
          viaPersonProfileUrl,
          pathLength,
          createdAt: Date.now() - 1000 * 60 * 60 * 24 * 5,
        },
      ];

      const shouldCreate = await shouldCreateWarmPathItem(
        targetCompanyUrl,
        'https://linkedin.com/in/mike', // Different person
        pathLength
      );

      expect(shouldCreate).toBe(true);
    });
  });

  describe('generateWarmPathFeedItem', () => {
    beforeEach(() => {
      mockStorage['uproot_feed'] = [];
      mockStorage['uproot_warm_path_dedupe'] = [];
    });

    it('should create feed item for path length 1 (direct connection)', async () => {
      const descriptor: WarmPathDescriptor = {
        targetCompany: 'Anthropic',
        targetCompanyUrl: 'https://linkedin.com/company/anthropic',
        targetCompanyLogo: 'https://example.com/logo/anthropic.jpg',
        viaPersonName: 'Sarah Chen',
        viaPersonProfileUrl: 'https://linkedin.com/in/sarah-chen',
        viaPersonImage: 'https://example.com/photo/sarah.jpg',
        viaPersonTitle: 'Senior Engineer',
        pathLength: 1,
      };

      await generateWarmPathFeedItem(descriptor);

      const feedItems = mockStorage['uproot_feed'];
      expect(feedItems).toHaveLength(1);

      const feedItem = feedItems[0];
      expect(feedItem.type).toBe('warm_path_opened');
      expect(feedItem.title).toBe('Warm path opened to Anthropic');
      expect(feedItem.description).toContain('Sarah Chen');
      expect(feedItem.description).toContain('Anthropic');
      expect(feedItem.actionUrl).toBe('https://linkedin.com/in/sarah-chen');
      expect(feedItem.actionLabel).toBe('View Profile');
      expect(feedItem.warmPath?.pathLength).toBe(1);
    });

    it('should add entry to dedupe storage after creating feed item', async () => {
      const descriptor: WarmPathDescriptor = {
        targetCompany: 'OpenAI',
        targetCompanyUrl: 'https://linkedin.com/company/openai',
        viaPersonName: 'Mike Ross',
        viaPersonProfileUrl: 'https://linkedin.com/in/mike-ross',
        pathLength: 1,
      };

      await generateWarmPathFeedItem(descriptor);

      const dedupeEntries = mockStorage['uproot_warm_path_dedupe'];
      expect(dedupeEntries).toHaveLength(1);
      expect(dedupeEntries[0].targetCompanyUrl).toBe('https://linkedin.com/company/openai');
      expect(dedupeEntries[0].viaPersonProfileUrl).toBe('https://linkedin.com/in/mike-ross');
      expect(dedupeEntries[0].pathLength).toBe(1);
    });

    it('should include all descriptor fields in warm path object', async () => {
      const descriptor: WarmPathDescriptor = {
        targetCompany: 'Stripe',
        targetCompanyUrl: 'https://linkedin.com/company/stripe',
        targetCompanyLogo: 'https://example.com/logo/stripe.jpg',
        viaPersonName: 'Alice Wang',
        viaPersonProfileUrl: 'https://linkedin.com/in/alice-wang',
        viaPersonImage: 'https://example.com/photo/alice.jpg',
        viaPersonTitle: 'Product Designer',
        pathLength: 1,
      };

      await generateWarmPathFeedItem(descriptor);

      const feedItem = mockStorage['uproot_feed'][0];
      expect(feedItem.warmPath).toEqual({
        targetCompany: 'Stripe',
        targetCompanyUrl: 'https://linkedin.com/company/stripe',
        targetCompanyLogo: 'https://example.com/logo/stripe.jpg',
        viaPersonName: 'Alice Wang',
        viaPersonProfileUrl: 'https://linkedin.com/in/alice-wang',
        viaPersonImage: 'https://example.com/photo/alice.jpg',
        viaPersonTitle: 'Product Designer',
        pathLength: 1,
        bridgeToName: undefined,
        bridgeToProfileUrl: undefined,
        bridgeToTitle: undefined,
      });
    });

    it('should handle path length 2 with bridge person (V2 feature)', async () => {
      const descriptor: WarmPathDescriptor = {
        targetCompany: 'Anthropic',
        targetCompanyUrl: 'https://linkedin.com/company/anthropic',
        viaPersonName: 'Sarah Chen',
        viaPersonProfileUrl: 'https://linkedin.com/in/sarah-chen',
        pathLength: 2,
        bridgeToName: 'John Bridge',
        bridgeToProfileUrl: 'https://linkedin.com/in/john-bridge',
        bridgeToTitle: 'Engineering Manager at Anthropic',
      };

      await generateWarmPathFeedItem(descriptor);

      const feedItem = mockStorage['uproot_feed'][0];
      expect(feedItem.title).toBe('New bridge into Anthropic');
      expect(feedItem.description).toContain('Sarah Chen');
      expect(feedItem.description).toContain('John Bridge');
      expect(feedItem.description).toContain('Ask');
      expect(feedItem.actionLabel).toBe('Ask for Intro');
      expect(feedItem.warmPath?.pathLength).toBe(2);
      expect(feedItem.warmPath?.bridgeToName).toBe('John Bridge');
    });

    it('should mark feed item as unread by default', async () => {
      const descriptor: WarmPathDescriptor = {
        targetCompany: 'Google',
        targetCompanyUrl: 'https://linkedin.com/company/google',
        viaPersonName: 'Eve Martinez',
        viaPersonProfileUrl: 'https://linkedin.com/in/eve-martinez',
        pathLength: 1,
      };

      await generateWarmPathFeedItem(descriptor);

      const feedItem = mockStorage['uproot_feed'][0];
      expect(feedItem.read).toBe(false);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty watchlist gracefully', async () => {
      mockStorage['uproot_watchlist_companies'] = [];

      const profile = createLinkedInProfile(
        'Test User',
        'Any Company',
        'Engineer',
        'https://linkedin.com/in/test'
      );

      const result = await detectWarmPathForConnection(
        'https://linkedin.com/in/test',
        profile
      );

      expect(result).toBeNull();
    });

    it('should handle missing photoUrl gracefully', async () => {
      setupWatchlistCompanies([
        { name: 'Meta', url: 'https://linkedin.com/company/meta' },
      ]);

      const profile = createLinkedInProfile(
        'No Photo User',
        'Meta',
        'Engineer',
        'https://linkedin.com/in/nophoto'
      );
      profile.photoUrl = undefined;

      const result = await detectWarmPathForConnection(
        'https://linkedin.com/in/nophoto',
        profile
      );

      expect(result).not.toBeNull();
      expect(result?.viaPersonImage).toBeUndefined();
    });

    it('should handle company without logo in watchlist', async () => {
      const watchlistCompanies: WatchlistCompany[] = [
        {
          id: 'company-1',
          name: 'Startup Inc',
          industry: 'Technology',
          companyUrl: 'https://linkedin.com/company/startup',
          addedAt: Date.now(),
          jobAlertEnabled: true,
          // No companyLogo field
        },
      ];

      mockStorage['uproot_watchlist_companies'] = watchlistCompanies;

      const profile = createLinkedInProfile(
        'Startup Employee',
        'Startup Inc',
        'Founder',
        'https://linkedin.com/in/founder'
      );

      const result = await detectWarmPathForConnection(
        'https://linkedin.com/in/founder',
        profile
      );

      expect(result).not.toBeNull();
      expect(result?.targetCompanyLogo).toBeUndefined();
    });
  });
});
