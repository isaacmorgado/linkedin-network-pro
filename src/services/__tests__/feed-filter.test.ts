/**
 * Feed Filter Service Tests
 * Tests for filtering job alerts by user preferences
 */

import { describe, it, expect, beforeEach } from 'vitest';
import type { FeedItem } from '../../types/feed';
import type { WatchlistCompany } from '../../types/watchlist';
import type { WorkLocationType } from '../../types/onboarding';

// ============================================================================
// Service Functions (to be implemented)
// ============================================================================

/**
 * Filters job alert feed items based on user preferences
 */
export function filterJobAlertsByPreferences(
  feedItems: FeedItem[],
  companies: WatchlistCompany[],
  globalPreferences?: WatchlistCompany['jobPreferences']
): FeedItem[] {
  return feedItems.filter((item) => {
    // Only filter job alerts
    if (item.type !== 'job_alert') {
      return true;
    }

    // Find the company in watchlist
    const company = companies.find((c) => c.name === item.company);

    // If company not in watchlist or job alerts disabled, exclude
    if (!company || !company.jobAlertEnabled) {
      return false;
    }

    // Use company preferences or fall back to global preferences
    const preferences = company.jobPreferences || globalPreferences;

    // If no preferences set, include all job alerts from this company
    if (!preferences) {
      return true;
    }

    // Match against preferences
    return matchesJobPreferences(item, preferences);
  });
}

/**
 * Checks if a job alert matches the given preferences
 */
export function matchesJobPreferences(
  jobAlert: FeedItem,
  preferences: NonNullable<WatchlistCompany['jobPreferences']>
): boolean {
  // Check keywords (must match at least one if specified)
  if (preferences.keywords && preferences.keywords.length > 0) {
    const titleLower = jobAlert.jobTitle?.toLowerCase() || '';
    const hasKeywordMatch = preferences.keywords.some((keyword) =>
      titleLower.includes(keyword.toLowerCase())
    );

    if (!hasKeywordMatch) {
      return false;
    }
  }

  // Check location (must match at least one if specified)
  if (preferences.location && preferences.location.length > 0) {
    const jobLocation = jobAlert.location?.toLowerCase() || '';
    const hasLocationMatch = preferences.location.some((loc) =>
      jobLocation.includes(loc.toLowerCase())
    );

    if (!hasLocationMatch) {
      return false;
    }
  }

  // Check work location preference
  if (preferences.workLocation && preferences.workLocation.length > 0) {
    const location = jobAlert.location?.toLowerCase() || '';
    const title = jobAlert.jobTitle?.toLowerCase() || '';

    const isRemote = location.includes('remote') || title.includes('remote') || location.includes('work from home');
    const isHybrid = location.includes('hybrid');
    const isOnsite = !isRemote && !isHybrid;

    // Check if job matches any of the preferred work location types
    const matchesWorkLocation = preferences.workLocation.some((type) => {
      if (type === 'remote') return isRemote;
      if (type === 'hybrid') return isHybrid;
      if (type === 'onsite') return isOnsite;
      return false;
    });

    if (!matchesWorkLocation) {
      return false;
    }
  }

  // All checks passed
  return true;
}

// ============================================================================
// Mock Data - Feed Items
// ============================================================================

const mockJobAlertGoogle: FeedItem = {
  id: 'job-1',
  type: 'job_alert',
  timestamp: Date.now(),
  read: false,
  jobTitle: 'Senior Software Engineer',
  company: 'Google',
  companyLogo: 'https://example.com/google-logo.png',
  location: 'Mountain View, CA',
  jobUrl: 'https://linkedin.com/jobs/123',
  matchScore: 85,
  title: 'New Job at Google',
  description: 'Senior Software Engineer position available',
};

const mockJobAlertMicrosoft: FeedItem = {
  id: 'job-2',
  type: 'job_alert',
  timestamp: Date.now() - 1000,
  read: false,
  jobTitle: 'Product Manager',
  company: 'Microsoft',
  companyLogo: 'https://example.com/microsoft-logo.png',
  location: 'Redmond, WA',
  jobUrl: 'https://linkedin.com/jobs/456',
  matchScore: 75,
  title: 'New Job at Microsoft',
  description: 'Product Manager position available',
};

const mockJobAlertRemote: FeedItem = {
  id: 'job-3',
  type: 'job_alert',
  timestamp: Date.now() - 2000,
  read: false,
  jobTitle: 'Remote Marketing Manager',
  company: 'Stripe',
  companyLogo: 'https://example.com/stripe-logo.png',
  location: 'Remote',
  jobUrl: 'https://linkedin.com/jobs/789',
  matchScore: 90,
  title: 'New Job at Stripe',
  description: 'Remote Marketing Manager position available',
};

const mockJobAlertEntry: FeedItem = {
  id: 'job-4',
  type: 'job_alert',
  timestamp: Date.now() - 3000,
  read: false,
  jobTitle: 'Junior Software Engineer',
  company: 'Google',
  companyLogo: 'https://example.com/google-logo.png',
  location: 'New York, NY',
  jobUrl: 'https://linkedin.com/jobs/101',
  matchScore: 60,
  title: 'New Job at Google',
  description: 'Junior Software Engineer position available',
};

const mockCompanyUpdate: FeedItem = {
  id: 'update-1',
  type: 'company_update',
  timestamp: Date.now() - 4000,
  read: false,
  company: 'Google',
  updateText: 'Google just posted an update',
  title: 'Company Update',
  description: 'Google posted a new update',
};

// ============================================================================
// Mock Data - Watchlist Companies
// ============================================================================

const mockCompanyGoogle: WatchlistCompany = {
  id: 'https://linkedin.com/company/google',
  name: 'Google',
  industry: 'Technology',
  companyUrl: 'https://linkedin.com/company/google',
  companyLogo: 'https://example.com/google-logo.png',
  addedAt: Date.now() - 86400000,
  jobAlertEnabled: true,
  jobPreferences: {
    keywords: ['senior', 'engineer'],
    experienceLevel: ['Senior', 'Staff'],
    workLocation: ['onsite'],
    location: ['Mountain View', 'San Francisco'],
  },
};

const mockCompanyMicrosoft: WatchlistCompany = {
  id: 'https://linkedin.com/company/microsoft',
  name: 'Microsoft',
  industry: 'Technology',
  companyUrl: 'https://linkedin.com/company/microsoft',
  companyLogo: 'https://example.com/microsoft-logo.png',
  addedAt: Date.now() - 86400000,
  jobAlertEnabled: true,
  jobPreferences: {
    keywords: ['product', 'manager'],
    experienceLevel: ['Mid', 'Senior'],
    workLocation: ['onsite'],
    location: ['Redmond', 'Seattle'],
  },
};

const mockCompanyStripe: WatchlistCompany = {
  id: 'https://linkedin.com/company/stripe',
  name: 'Stripe',
  industry: 'Finance',
  companyUrl: 'https://linkedin.com/company/stripe',
  companyLogo: 'https://example.com/stripe-logo.png',
  addedAt: Date.now() - 86400000,
  jobAlertEnabled: true,
  jobPreferences: {
    keywords: ['marketing'],
    workLocation: ['remote'],
  },
};

const mockCompanyNoPreferences: WatchlistCompany = {
  id: 'https://linkedin.com/company/amazon',
  name: 'Amazon',
  industry: 'Technology',
  companyUrl: 'https://linkedin.com/company/amazon',
  companyLogo: 'https://example.com/amazon-logo.png',
  addedAt: Date.now() - 86400000,
  jobAlertEnabled: true,
  // No jobPreferences set
};

const mockCompanyDisabled: WatchlistCompany = {
  id: 'https://linkedin.com/company/apple',
  name: 'Apple',
  industry: 'Technology',
  companyUrl: 'https://linkedin.com/company/apple',
  companyLogo: 'https://example.com/apple-logo.png',
  addedAt: Date.now() - 86400000,
  jobAlertEnabled: false, // Disabled
  jobPreferences: {
    keywords: ['engineer'],
  },
};

// ============================================================================
// Tests - filterJobAlertsByPreferences
// ============================================================================

describe('filterJobAlertsByPreferences', () => {
  let feedItems: FeedItem[];
  let companies: WatchlistCompany[];

  beforeEach(() => {
    feedItems = [
      mockJobAlertGoogle,
      mockJobAlertMicrosoft,
      mockJobAlertRemote,
      mockJobAlertEntry,
      mockCompanyUpdate,
    ];

    companies = [
      mockCompanyGoogle,
      mockCompanyMicrosoft,
      mockCompanyStripe,
      mockCompanyNoPreferences,
    ];
  });

  it('should filter job alerts by company keywords', () => {
    const filtered = filterJobAlertsByPreferences(feedItems, companies);

    // Should include Google senior engineer (matches "senior" + "engineer")
    expect(filtered.some((item) => item.id === 'job-1')).toBe(true);

    // Should include Microsoft product manager (matches "product" + "manager")
    expect(filtered.some((item) => item.id === 'job-2')).toBe(true);

    // Should include Stripe marketing (matches "marketing")
    expect(filtered.some((item) => item.id === 'job-3')).toBe(true);

    // Should NOT include Google junior engineer (doesn't match "senior")
    expect(filtered.some((item) => item.id === 'job-4')).toBe(false);
  });

  it('should filter by remote preference', () => {
    const filtered = filterJobAlertsByPreferences(feedItems, companies);

    // Stripe requires remote - should include remote job
    const stripeJob = filtered.find((item) => item.company === 'Stripe');
    expect(stripeJob).toBeDefined();
    expect(stripeJob?.location).toContain('Remote');
  });

  it('should filter by location', () => {
    const filtered = filterJobAlertsByPreferences(feedItems, companies);

    // Google prefers Mountain View/SF - should include Mountain View job
    const googleJob = filtered.find((item) => item.id === 'job-1');
    expect(googleJob).toBeDefined();
    expect(googleJob?.location).toContain('Mountain View');

    // Microsoft prefers Redmond/Seattle - should include Redmond job
    const microsoftJob = filtered.find((item) => item.id === 'job-2');
    expect(microsoftJob).toBeDefined();
    expect(microsoftJob?.location).toContain('Redmond');
  });

  it('should apply global filters when company has no specific preferences', () => {
    const globalPreferences = {
      keywords: ['engineer', 'developer'],
      experienceLevel: ['Senior'],
    };

    const amazonJob: FeedItem = {
      id: 'job-5',
      type: 'job_alert',
      timestamp: Date.now(),
      read: false,
      jobTitle: 'Senior Software Engineer',
      company: 'Amazon',
      location: 'Seattle, WA',
      title: 'New Job at Amazon',
      description: 'Senior Software Engineer position',
    };

    const itemsWithAmazon = [...feedItems, amazonJob];
    const filtered = filterJobAlertsByPreferences(
      itemsWithAmazon,
      companies,
      globalPreferences
    );

    // Should include Amazon job using global preferences
    expect(filtered.some((item) => item.id === 'job-5')).toBe(true);
  });

  it('should return all items when company not in enabled list', () => {
    const appleJob: FeedItem = {
      id: 'job-6',
      type: 'job_alert',
      timestamp: Date.now(),
      read: false,
      jobTitle: 'Software Engineer',
      company: 'Apple',
      location: 'Cupertino, CA',
      title: 'New Job at Apple',
      description: 'Software Engineer position',
    };

    const itemsWithApple = [...feedItems, appleJob];
    const companiesWithDisabled = [...companies, mockCompanyDisabled];
    const filtered = filterJobAlertsByPreferences(
      itemsWithApple,
      companiesWithDisabled
    );

    // Should NOT include Apple job (job alerts disabled)
    expect(filtered.some((item) => item.id === 'job-6')).toBe(false);
  });

  it('should handle empty preferences gracefully', () => {
    const companiesWithEmpty = [mockCompanyNoPreferences];
    const amazonJob: FeedItem = {
      id: 'job-7',
      type: 'job_alert',
      timestamp: Date.now(),
      read: false,
      jobTitle: 'Any Job Title',
      company: 'Amazon',
      location: 'Any Location',
      title: 'New Job at Amazon',
      description: 'Job description',
    };

    const filtered = filterJobAlertsByPreferences(
      [amazonJob],
      companiesWithEmpty
    );

    // Should include job when no preferences are set (all jobs allowed)
    expect(filtered.length).toBe(1);
    expect(filtered[0].id).toBe('job-7');
  });

  it('should handle multiple companies with different preferences', () => {
    const filtered = filterJobAlertsByPreferences(feedItems, companies);

    // Should include matching jobs from multiple companies
    expect(filtered.length).toBeGreaterThan(1);

    // Check that non-job alerts are included
    expect(filtered.some((item) => item.type === 'company_update')).toBe(true);
  });

  it('should preserve non-job-alert feed items', () => {
    const filtered = filterJobAlertsByPreferences(feedItems, companies);

    // Company update should always be included
    expect(filtered.some((item) => item.id === 'update-1')).toBe(true);
  });

  it('should handle empty feed items array', () => {
    const filtered = filterJobAlertsByPreferences([], companies);
    expect(filtered.length).toBe(0);
  });

  it('should handle empty companies array', () => {
    const filtered = filterJobAlertsByPreferences(feedItems, []);

    // Should only include non-job-alert items
    expect(filtered.every((item) => item.type !== 'job_alert')).toBe(true);
  });
});

// ============================================================================
// Tests - matchesJobPreferences
// ============================================================================

describe('matchesJobPreferences', () => {
  it('should match when all criteria met', () => {
    const preferences = {
      keywords: ['engineer'],
      location: ['Mountain View'],
      remote: false,
    };

    const matches = matchesJobPreferences(mockJobAlertGoogle, preferences);
    expect(matches).toBe(true);
  });

  it('should reject when keyword mismatch', () => {
    const preferences = {
      keywords: ['marketing'],
    };

    const matches = matchesJobPreferences(mockJobAlertGoogle, preferences);
    expect(matches).toBe(false);
  });

  it('should reject when location mismatch', () => {
    const preferences = {
      location: ['Seattle'],
    };

    const matches = matchesJobPreferences(mockJobAlertGoogle, preferences);
    expect(matches).toBe(false);
  });

  it('should handle missing job fields gracefully', () => {
    const jobWithMissingFields: FeedItem = {
      id: 'job-8',
      type: 'job_alert',
      timestamp: Date.now(),
      read: false,
      // Missing jobTitle and location
      company: 'Test Company',
      title: 'Test Job',
      description: 'Test description',
    };

    const preferences = {
      keywords: ['engineer'],
      location: ['San Francisco'],
    };

    const matches = matchesJobPreferences(jobWithMissingFields, preferences);
    // Should not match because fields are missing
    expect(matches).toBe(false);
  });

  it('should match remote jobs when remote preference is true', () => {
    const preferences = {
      workLocation: ['remote'] as WorkLocationType[],
    };

    const matches = matchesJobPreferences(mockJobAlertRemote, preferences);
    expect(matches).toBe(true);
  });

  it('should reject non-remote jobs when remote preference is true', () => {
    const preferences = {
      workLocation: ['remote'] as WorkLocationType[],
    };

    const matches = matchesJobPreferences(mockJobAlertGoogle, preferences);
    expect(matches).toBe(false);
  });

  it('should match when preferences are empty', () => {
    const preferences = {};

    const matches = matchesJobPreferences(mockJobAlertGoogle, preferences);
    expect(matches).toBe(true);
  });

  it('should be case insensitive for keywords', () => {
    const preferences = {
      keywords: ['ENGINEER'],
    };

    const matches = matchesJobPreferences(mockJobAlertGoogle, preferences);
    expect(matches).toBe(true);
  });

  it('should be case insensitive for locations', () => {
    const preferences = {
      location: ['MOUNTAIN VIEW'],
    };

    const matches = matchesJobPreferences(mockJobAlertGoogle, preferences);
    expect(matches).toBe(true);
  });

  it('should match partial keywords', () => {
    const preferences = {
      keywords: ['eng'], // Partial match for "engineer"
    };

    const matches = matchesJobPreferences(mockJobAlertGoogle, preferences);
    expect(matches).toBe(true);
  });

  it('should match multiple keywords (OR logic)', () => {
    const preferences = {
      keywords: ['marketing', 'engineer'], // Should match either
    };

    const matches = matchesJobPreferences(mockJobAlertGoogle, preferences);
    expect(matches).toBe(true);
  });

  it('should match multiple locations (OR logic)', () => {
    const preferences = {
      location: ['Seattle', 'Mountain View'], // Should match either
    };

    const matches = matchesJobPreferences(mockJobAlertGoogle, preferences);
    expect(matches).toBe(true);
  });
});
