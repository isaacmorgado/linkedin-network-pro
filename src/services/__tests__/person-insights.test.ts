/**
 * Person Insights Detection Tests
 * Tests for opportunity-relevant insights from watchlisted people
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { detectPersonInsights } from '../person-insights';
import type { LinkedInProfile } from '../../types';
import type { WatchlistPerson, WatchlistCompany } from '../../types/watchlist';

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

// Helper to create test profiles
function createProfile(
  name: string,
  company: string,
  title: string,
  profileUrl: string = `https://linkedin.com/in/${name.toLowerCase().replace(' ', '-')}`,
  activity: Array<{ preview: string; timestamp: string; type?: string; url?: string }> = []
): LinkedInProfile {
  return {
    id: `profile-${name.toLowerCase().replace(' ', '-')}`,
    name,
    headline: title,
    currentRole: {
      title,
      company,
    },
    location: 'San Francisco, CA',
    profileUrl,
    photoUrl: `https://example.com/photo/${name}.jpg`,
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
    recentActivity: activity,
    scrapedAt: new Date().toISOString(),
  };
}

// Helper to create watchlisted person
function createWatchlistPerson(
  id: string,
  name: string,
  profileUrl: string
): WatchlistPerson {
  return {
    id,
    name,
    headline: 'Software Engineer',
    profileUrl,
    addedAt: Date.now(),
  };
}

// Helper to setup watchlist companies
function setupWatchlistCompanies(companies: string[]) {
  const watchlistCompanies: WatchlistCompany[] = companies.map((name, index) => ({
    id: `company-${index}`,
    name,
    industry: 'Technology',
    companyUrl: `https://linkedin.com/company/${name.toLowerCase()}`,
    addedAt: Date.now(),
    jobAlertEnabled: true,
  }));

  mockStorage.set('uproot_watchlist_companies', watchlistCompanies);
}

describe('Person Insights Detection', () => {
  beforeEach(() => {
    mockStorage.clear();
    vi.clearAllMocks();
  });

  describe('Job Change to Watchlisted Company', () => {
    it('should create feed item when person joins watchlisted company', async () => {
      setupWatchlistCompanies(['Google', 'Meta', 'Stripe']);

      const person = createWatchlistPerson('person-1', 'Alice Chen', 'https://linkedin.com/in/alice');
      const previousProfile = createProfile('Alice Chen', 'Startup Inc', 'Software Engineer');
      const currentProfile = createProfile('Alice Chen', 'Google', 'Senior Software Engineer');

      const result = await detectPersonInsights(currentProfile, previousProfile, person);

      expect(result).not.toBeNull();
      expect(result?.type).toBe('person_update');
      expect(result?.insightType).toBe('job_change');
      expect(result?.isTargetCompany).toBe(true);
      expect(result?.newCompany).toBe('Google');
      expect(result?.newRole).toBe('Senior Software Engineer');
      expect(result?.title).toContain('Alice Chen joined Google');
      expect(result?.description).toContain('Watchlisted Company!');
    });

    it('should create feed item for senior role change even if company not watchlisted', async () => {
      setupWatchlistCompanies(['Google']);

      const person = createWatchlistPerson('person-1', 'Bob Smith', 'https://linkedin.com/in/bob');
      const previousProfile = createProfile('Bob Smith', 'Company A', 'Software Engineer');
      const currentProfile = createProfile('Bob Smith', 'Company B', 'Engineering Manager');

      const result = await detectPersonInsights(currentProfile, previousProfile, person);

      expect(result).not.toBeNull();
      expect(result?.type).toBe('person_update');
      expect(result?.insightType).toBe('job_change');
      expect(result?.isTargetCompany).toBe(false);
      expect(result?.newRole).toBe('Engineering Manager');
      expect(result?.title).toContain('Bob Smith changed jobs');
    });

    it('should NOT create feed item for non-senior, non-watchlisted job change', async () => {
      setupWatchlistCompanies(['Google']);

      const person = createWatchlistPerson('person-1', 'Carol Lee', 'https://linkedin.com/in/carol');
      const previousProfile = createProfile('Carol Lee', 'Company A', 'Junior Developer');
      const currentProfile = createProfile('Carol Lee', 'Company B', 'Software Engineer');

      const result = await detectPersonInsights(currentProfile, previousProfile, person);

      expect(result).toBeNull();
    });

    it('should handle case-insensitive company matching', async () => {
      setupWatchlistCompanies(['google', 'STRIPE']);

      const person = createWatchlistPerson('person-1', 'Dave Wang', 'https://linkedin.com/in/dave');
      const previousProfile = createProfile('Dave Wang', 'Startup', 'Engineer');
      const currentProfile = createProfile('Dave Wang', 'Google', 'Engineer'); // Capital G

      const result = await detectPersonInsights(currentProfile, previousProfile, person);

      expect(result).not.toBeNull();
      expect(result?.isTargetCompany).toBe(true);
    });
  });

  describe('Promotion at Watchlisted Company', () => {
    it('should create feed item for promotion to senior role at watchlisted company', async () => {
      setupWatchlistCompanies(['Google']);

      const person = createWatchlistPerson('person-1', 'Eve Martinez', 'https://linkedin.com/in/eve');
      const previousProfile = createProfile('Eve Martinez', 'Google', 'Software Engineer');
      const currentProfile = createProfile('Eve Martinez', 'Google', 'Senior Engineering Manager');

      const result = await detectPersonInsights(currentProfile, previousProfile, person);

      expect(result).not.toBeNull();
      expect(result?.type).toBe('person_update');
      expect(result?.insightType).toBe('job_change'); // V1 treats promotion as job_change
      expect(result?.isTargetCompany).toBe(true);
      expect(result?.newRole).toBe('Senior Engineering Manager');
      expect(result?.title).toContain('promoted at Google');
    });

    it('should NOT create feed item for promotion to non-senior role', async () => {
      setupWatchlistCompanies(['Google']);

      const person = createWatchlistPerson('person-1', 'Frank Lopez', 'https://linkedin.com/in/frank');
      const previousProfile = createProfile('Frank Lopez', 'Google', 'Junior Engineer');
      const currentProfile = createProfile('Frank Lopez', 'Google', 'Software Engineer');

      const result = await detectPersonInsights(currentProfile, previousProfile, person);

      expect(result).toBeNull();
    });

    it('should NOT create feed item for promotion at non-watchlisted company', async () => {
      setupWatchlistCompanies(['Google']);

      const person = createWatchlistPerson('person-1', 'Grace Kim', 'https://linkedin.com/in/grace');
      const previousProfile = createProfile('Grace Kim', 'Startup', 'Engineer');
      const currentProfile = createProfile('Grace Kim', 'Startup', 'Senior Engineer');

      const result = await detectPersonInsights(currentProfile, previousProfile, person);

      expect(result).toBeNull();
    });
  });

  describe('Hiring-Related Activity', () => {
    it('should create feed item when person posts about hiring', async () => {
      setupWatchlistCompanies([]);

      const person = createWatchlistPerson('person-1', 'Hannah Park', 'https://linkedin.com/in/hannah');
      const currentProfile = createProfile(
        'Hannah Park',
        'Tech Corp',
        'Engineering Manager',
        'https://linkedin.com/in/hannah',
        [
          {
            preview: "We're hiring! Looking for talented software engineers to join our team. Internships available!",
            timestamp: new Date().toISOString(),
            type: 'post',
            url: 'https://linkedin.com/feed/update/123',
          },
        ]
      );

      const result = await detectPersonInsights(currentProfile, undefined, person);

      expect(result).not.toBeNull();
      expect(result?.type).toBe('person_update');
      expect(result?.insightType).toBe('new_activity');
      expect(result?.title).toContain('posted about hiring');
      expect(result?.updateText).toContain("We're hiring");
      expect(result?.actionLabel).toBe('View Post');
    });

    it('should detect various hiring keywords', async () => {
      setupWatchlistCompanies([]);

      const person = createWatchlistPerson('person-1', 'Ian Chen', 'https://linkedin.com/in/ian');

      const testCases = [
        "We're hiring for multiple roles!",
        'Looking for a talented intern to join us',
        'Seeking experienced engineers',
        'Open position: Software Engineer',
        'Join our team as a developer',
        'We are looking for candidates',
        'Recruiting for summer internships',
        'Applications now open for new grads',
      ];

      for (const preview of testCases) {
        const profile = createProfile('Ian Chen', 'Tech Corp', 'Manager', 'https://linkedin.com/in/ian', [
          {
            preview,
            timestamp: new Date().toISOString(),
            type: 'post',
            url: 'https://linkedin.com/feed/update/123',
          },
        ]);

        const result = await detectPersonInsights(profile, undefined, person);
        expect(result).not.toBeNull();
        expect(result?.insightType).toBe('new_activity');
      }
    });

    it('should NOT create feed item for generic posts', async () => {
      setupWatchlistCompanies([]);

      const person = createWatchlistPerson('person-1', 'Jane Doe', 'https://linkedin.com/in/jane');
      const currentProfile = createProfile(
        'Jane Doe',
        'Tech Corp',
        'Engineer',
        'https://linkedin.com/in/jane',
        [
          {
            preview: 'Great conference today! Learned a lot about AI.',
            timestamp: new Date().toISOString(),
            type: 'post',
            url: 'https://linkedin.com/feed/update/123',
          },
        ]
      );

      const result = await detectPersonInsights(currentProfile, undefined, person);

      expect(result).toBeNull();
    });

    it('should NOT create feed item when no recent activity', async () => {
      setupWatchlistCompanies([]);

      const person = createWatchlistPerson('person-1', 'Ken Lee', 'https://linkedin.com/in/ken');
      const currentProfile = createProfile('Ken Lee', 'Tech Corp', 'Engineer', 'https://linkedin.com/in/ken', []);

      const result = await detectPersonInsights(currentProfile, undefined, person);

      expect(result).toBeNull();
    });
  });

  describe('Non-Watchlisted Person', () => {
    it('should work for any watchlisted person regardless of their watchlist status', async () => {
      // Note: person-insights.ts doesn't check if person is watchlisted
      // because it's only called for watchlisted people by watchlist-monitor
      setupWatchlistCompanies(['Google']);

      const nonWatchlistedPerson = createWatchlistPerson(
        'person-999',
        'Random Person',
        'https://linkedin.com/in/random'
      );
      const previousProfile = createProfile('Random Person', 'Startup', 'Engineer');
      const currentProfile = createProfile('Random Person', 'Google', 'Engineer');

      const result = await detectPersonInsights(currentProfile, previousProfile, nonWatchlistedPerson);

      // Should still create feed item because Google is watchlisted
      expect(result).not.toBeNull();
      expect(result?.isTargetCompany).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('should handle missing photoUrl gracefully', async () => {
      setupWatchlistCompanies(['Google']);

      const person = createWatchlistPerson('person-1', 'Lisa Wang', 'https://linkedin.com/in/lisa');
      const previousProfile = createProfile('Lisa Wang', 'Startup', 'Engineer');
      const currentProfile = createProfile('Lisa Wang', 'Google', 'Engineer');
      currentProfile.photoUrl = undefined;

      const result = await detectPersonInsights(currentProfile, previousProfile, person);

      expect(result).not.toBeNull();
      expect(result?.personImage).toBeUndefined();
    });

    it('should handle empty watchlist companies', async () => {
      setupWatchlistCompanies([]);

      const person = createWatchlistPerson('person-1', 'Mike Brown', 'https://linkedin.com/in/mike');
      const previousProfile = createProfile('Mike Brown', 'Company A', 'Engineer');
      const currentProfile = createProfile('Mike Brown', 'Company B', 'Senior Director');

      const result = await detectPersonInsights(currentProfile, previousProfile, person);

      // Should still create item because it's a senior role change
      expect(result).not.toBeNull();
      expect(result?.isTargetCompany).toBe(false);
    });

    it('should handle no previous snapshot (first check)', async () => {
      setupWatchlistCompanies(['Google']);

      const person = createWatchlistPerson('person-1', 'Nancy Liu', 'https://linkedin.com/in/nancy');
      const currentProfile = createProfile('Nancy Liu', 'Google', 'Engineer');

      const result = await detectPersonInsights(currentProfile, undefined, person);

      // First check should only detect hiring activity, not job changes
      expect(result).toBeNull();
    });
  });
});
