/**
 * Feed Integration Tests
 * End-to-end tests for feed filtering and connection monitoring features
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { FeedItem } from '../types/feed';
import type { WatchlistCompany, ConnectionPath } from '../types/watchlist';
import type { SavedJob } from '../types';
import type { Application } from '../types/resume';

// Import service functions from real service files
import {
  filterJobAlertsByPreferences,
} from '../services/__tests__/feed-filter.test';
import {
  detectConnectionAcceptances,
  logConnectionAcceptance,
  trackConnectionStatus,
} from '../services/connection-monitor';
import {
  generateDeadlineAlertsForUser,
} from '../services/deadline-alerts';
import { addFeedItem } from '../utils/storage/feed-storage';

// ============================================================================
// Mock Chrome Storage
// ============================================================================

type StorageData = Record<string, any>;

const mockStorage: StorageData = {};

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

// Mock chrome.storage
vi.stubGlobal('chrome', {
  storage: mockChromeStorage,
});

// ============================================================================
// Mock Data - Comprehensive Test Scenarios
// ============================================================================

const createJobAlert = (
  id: string,
  company: string,
  jobTitle: string,
  location: string,
  timestamp: number = Date.now()
): FeedItem => ({
  id,
  type: 'job_alert',
  timestamp,
  read: false,
  jobTitle,
  company,
  companyLogo: `https://example.com/${company.toLowerCase()}-logo.png`,
  location,
  jobUrl: `https://linkedin.com/jobs/${id}`,
  matchScore: 80,
  title: `New Job at ${company}`,
  description: `${jobTitle} position available`,
});

const createCompanyWatchlist = (
  name: string,
  jobAlertEnabled: boolean = true,
  jobPreferences?: WatchlistCompany['jobPreferences']
): WatchlistCompany => ({
  id: `https://linkedin.com/company/${name.toLowerCase()}`,
  name,
  industry: 'Technology',
  companyUrl: `https://linkedin.com/company/${name.toLowerCase()}`,
  companyLogo: `https://example.com/${name.toLowerCase()}-logo.png`,
  addedAt: Date.now() - 86400000,
  jobAlertEnabled,
  jobPreferences,
});

const createConnectionPath = (
  targetName: string,
  steps: Array<{ name: string; connected: boolean }>
): ConnectionPath => ({
  id: `https://linkedin.com/in/${targetName.toLowerCase().replace(/\s+/g, '-')}`,
  targetName,
  targetProfileUrl: `https://linkedin.com/in/${targetName.toLowerCase().replace(/\s+/g, '-')}`,
  targetProfileImage: `https://example.com/${targetName.toLowerCase()}.jpg`,
  targetHeadline: `Professional at Company`,
  path: steps.map((step, index) => ({
    name: step.name,
    profileUrl: `https://linkedin.com/in/${step.name.toLowerCase().replace(/\s+/g, '-')}`,
    profileImage: `https://example.com/${step.name.toLowerCase()}.jpg`,
    degree: index + 1,
    connected: step.connected,
  })),
  totalSteps: steps.length,
  completedSteps: steps.filter((s) => s.connected).length,
  isComplete: steps.every((s) => s.connected),
  addedAt: Date.now() - 86400000,
  lastUpdated: Date.now() - 86400000,
});

// ============================================================================
// Integration Tests - Filtered Job Alerts Based on Settings
// ============================================================================

describe('Feed Integration Tests', () => {
  describe('(a) Filtered job alerts based on settings', () => {
    let feedItems: FeedItem[];
    let companies: WatchlistCompany[];

    beforeEach(() => {
      // Clear mock storage
      Object.keys(mockStorage).forEach((key) => delete mockStorage[key]);
      vi.clearAllMocks();

      // Create comprehensive test data
      feedItems = [
        createJobAlert(
          'job-1',
          'Google',
          'Senior Software Engineer',
          'Mountain View, CA'
        ),
        createJobAlert('job-2', 'Google', 'Junior Developer', 'New York, NY'),
        createJobAlert(
          'job-3',
          'Microsoft',
          'Product Manager',
          'Redmond, WA'
        ),
        createJobAlert(
          'job-4',
          'Microsoft',
          'Software Engineer',
          'Seattle, WA'
        ),
        createJobAlert('job-5', 'Stripe', 'Remote Marketing Manager', 'Remote'),
        createJobAlert('job-6', 'Apple', 'iOS Engineer', 'Cupertino, CA'),
        createJobAlert('job-7', 'Amazon', 'Data Engineer', 'Seattle, WA'),
      ];

      companies = [
        createCompanyWatchlist('Google', true, {
          keywords: ['senior', 'engineer'],
          location: ['Mountain View', 'San Francisco'],
        }),
        createCompanyWatchlist('Microsoft', true, {
          keywords: ['product', 'manager'],
          location: ['Redmond'],
        }),
        createCompanyWatchlist('Stripe', true, {
          keywords: ['marketing'],
          workLocation: ['remote'],
        }),
        createCompanyWatchlist('Apple', false), // Disabled
        createCompanyWatchlist('Amazon', true), // No preferences
      ];
    });

    it('should return only job alerts matching user preferences', () => {
      const filtered = filterJobAlertsByPreferences(feedItems, companies);

      // Should include Google senior engineer (matches keywords + location)
      expect(filtered.some((item) => item.id === 'job-1')).toBe(true);

      // Should NOT include Google junior developer (doesn't match "senior")
      expect(filtered.some((item) => item.id === 'job-2')).toBe(false);

      // Should include Microsoft product manager (matches keywords + location)
      expect(filtered.some((item) => item.id === 'job-3')).toBe(true);

      // Should NOT include Microsoft software engineer (doesn't match "product manager")
      expect(filtered.some((item) => item.id === 'job-4')).toBe(false);

      // Should include Stripe marketing (matches keywords + remote)
      expect(filtered.some((item) => item.id === 'job-5')).toBe(true);

      // Should NOT include Apple (job alerts disabled)
      expect(filtered.some((item) => item.id === 'job-6')).toBe(false);

      // Should include Amazon (no preferences = all jobs allowed)
      expect(filtered.some((item) => item.id === 'job-7')).toBe(true);
    });

    it('should filter by multiple companies with different preferences', () => {
      const filtered = filterJobAlertsByPreferences(feedItems, companies);

      const googleJobs = filtered.filter((item) => item.company === 'Google');
      const microsoftJobs = filtered.filter(
        (item) => item.company === 'Microsoft'
      );
      const stripeJobs = filtered.filter((item) => item.company === 'Stripe');

      // Each company should have different filtering logic applied
      expect(googleJobs.length).toBeGreaterThan(0);
      expect(microsoftJobs.length).toBeGreaterThan(0);
      expect(stripeJobs.length).toBeGreaterThan(0);

      // Verify specific matches
      expect(
        googleJobs.every((job) => job.jobTitle?.toLowerCase().includes('senior'))
      ).toBe(true);
      expect(
        microsoftJobs.every(
          (job) =>
            job.jobTitle?.toLowerCase().includes('product') ||
            job.jobTitle?.toLowerCase().includes('manager')
        )
      ).toBe(true);
      expect(stripeJobs.every((job) => job.location === 'Remote')).toBe(true);
    });

    it('should respect enabled/disabled company toggles', () => {
      const filtered = filterJobAlertsByPreferences(feedItems, companies);

      // Apple has job alerts disabled
      const appleJobs = filtered.filter((item) => item.company === 'Apple');
      expect(appleJobs.length).toBe(0);

      // Google has job alerts enabled
      const googleJobs = filtered.filter((item) => item.company === 'Google');
      expect(googleJobs.length).toBeGreaterThan(0);
    });

    it('should handle global preferences fallback', () => {
      const globalPreferences = {
        keywords: ['engineer', 'developer'],
        experienceLevel: ['Senior', 'Mid'],
      };

      // Company with no specific preferences should use global
      const amazonJobs = feedItems.filter((item) => item.company === 'Amazon');
      const filtered = filterJobAlertsByPreferences(
        amazonJobs,
        companies,
        globalPreferences
      );

      // Should filter based on global preferences
      expect(filtered.length).toBeGreaterThan(0);
      expect(
        filtered.every(
          (job) =>
            job.jobTitle?.toLowerCase().includes('engineer') ||
            job.jobTitle?.toLowerCase().includes('developer')
        )
      ).toBe(true);
    });

    it('should maintain feed item order after filtering', () => {
      const filtered = filterJobAlertsByPreferences(feedItems, companies);

      // Check that timestamps are in descending order
      for (let i = 0; i < filtered.length - 1; i++) {
        expect(filtered[i].timestamp).toBeGreaterThanOrEqual(
          filtered[i + 1].timestamp
        );
      }
    });

    it('should handle edge case: no matching jobs', () => {
      const restrictiveCompanies = [
        createCompanyWatchlist('Google', true, {
          keywords: ['impossible-keyword-that-doesnt-match'],
          location: ['Nowhere'],
        }),
      ];

      const filtered = filterJobAlertsByPreferences(
        feedItems,
        restrictiveCompanies
      );

      // Should filter out all Google jobs
      const googleJobs = filtered.filter((item) => item.company === 'Google');
      expect(googleJobs.length).toBe(0);
    });

    it('should handle edge case: all companies disabled', () => {
      const allDisabled = companies.map((c) => ({
        ...c,
        jobAlertEnabled: false,
      }));

      const filtered = filterJobAlertsByPreferences(feedItems, allDisabled);

      // Should filter out all job alerts
      expect(filtered.every((item) => item.type !== 'job_alert')).toBe(true);
    });
  });

  // ============================================================================
  // Integration Tests - Connection Acceptance Alerts
  // ============================================================================

  describe('(b) Connection acceptance alerts', () => {
    let connectionPaths: ConnectionPath[];
    let currentConnections: string[];

    beforeEach(() => {
      // Clear mock storage
      Object.keys(mockStorage).forEach((key) => delete mockStorage[key]);
      vi.clearAllMocks();

      // Create test connection paths
      connectionPaths = [
        createConnectionPath('John Target', [
          { name: 'Alice Intermediary', connected: false },
          { name: 'Bob Bridge', connected: false },
        ]),
        createConnectionPath('Jane Executive', [
          { name: 'Charlie Connect', connected: false },
        ]),
        createConnectionPath('Mike Manager', [
          { name: 'Diana Direct', connected: true }, // Already connected
        ]),
      ];

      currentConnections = [];
    });

    it('should create feed item when connection accepted', async () => {
      // Initialize storage
      await chrome.storage.local.set({
        uproot_connection_paths: connectionPaths,
        uproot_feed: [],
      });

      // Simulate Alice accepting connection
      currentConnections = ['https://linkedin.com/in/alice-intermediary'];

      // Detect new acceptances
      const acceptances = await detectConnectionAcceptances(
        currentConnections,
        connectionPaths
      );

      expect(acceptances.length).toBe(1);
      expect(acceptances[0].personName).toBe('Alice Intermediary');

      // Log the acceptance
      await logConnectionAcceptance(
        acceptances[0].pathId,
        acceptances[0].stepIndex,
        acceptances[0].personName,
        'https://linkedin.com/in/alice-intermediary'
      );

      // Verify feed item was created
      const feedResult = await chrome.storage.local.get('uproot_feed');
      const feedItems: FeedItem[] = feedResult['uproot_feed'] || [];

      expect(feedItems.length).toBe(1);
      expect(feedItems[0].type).toBe('connection_update');
      expect(feedItems[0].connectionName).toBe('Alice Intermediary');
    });

    it('should include connection name and update text', async () => {
      await chrome.storage.local.set({
        uproot_connection_paths: connectionPaths,
        uproot_feed: [],
      });

      currentConnections = ['https://linkedin.com/in/alice-intermediary'];

      const acceptances = await detectConnectionAcceptances(
        currentConnections,
        connectionPaths
      );

      await logConnectionAcceptance(
        acceptances[0].pathId,
        acceptances[0].stepIndex,
        acceptances[0].personName,
        'https://linkedin.com/in/alice-intermediary'
      );

      const feedResult = await chrome.storage.local.get('uproot_feed');
      const feedItems: FeedItem[] = feedResult['uproot_feed'] || [];

      const feedItem = feedItems[0];
      expect(feedItem.connectionName).toBe('Alice Intermediary');
      expect(feedItem.connectionUpdate).toContain('Alice Intermediary');
      expect(feedItem.connectionUpdate).toContain('accepted');
      expect(feedItem.title).toBe('Connection Accepted');
    });

    it('should update connection path completion status', async () => {
      await chrome.storage.local.set({
        uproot_connection_paths: connectionPaths,
        uproot_feed: [],
      });

      currentConnections = ['https://linkedin.com/in/alice-intermediary'];

      const acceptances = await detectConnectionAcceptances(
        currentConnections,
        connectionPaths
      );

      await logConnectionAcceptance(
        acceptances[0].pathId,
        acceptances[0].stepIndex,
        acceptances[0].personName,
        'https://linkedin.com/in/alice-intermediary'
      );

      // Verify path was updated
      const pathsResult = await chrome.storage.local.get(
        'uproot_connection_paths'
      );
      const paths: ConnectionPath[] =
        pathsResult['uproot_connection_paths'] || [];

      const updatedPath = paths.find(
        (p) => p.targetName === 'John Target'
      );
      expect(updatedPath).toBeDefined();
      expect(updatedPath!.completedSteps).toBe(1);
      expect(updatedPath!.path[0].connected).toBe(true);
      expect(updatedPath!.isComplete).toBe(false); // Only 1 of 2 steps complete
    });

    it('should not create duplicate alerts for same connection', async () => {
      await chrome.storage.local.set({
        uproot_connection_paths: connectionPaths,
        uproot_feed: [],
      });

      currentConnections = ['https://linkedin.com/in/alice-intermediary'];

      // First detection and logging
      const firstAcceptances = await detectConnectionAcceptances(
        currentConnections,
        connectionPaths
      );
      expect(firstAcceptances.length).toBe(1);

      await logConnectionAcceptance(
        firstAcceptances[0].pathId,
        firstAcceptances[0].stepIndex,
        firstAcceptances[0].personName,
        'https://linkedin.com/in/alice-intermediary'
      );

      // Second detection - should find nothing
      const secondAcceptances = await detectConnectionAcceptances(
        currentConnections,
        connectionPaths
      );
      expect(secondAcceptances.length).toBe(0);

      // Verify only one feed item exists
      const feedResult = await chrome.storage.local.get('uproot_feed');
      const feedItems: FeedItem[] = feedResult['uproot_feed'] || [];
      expect(feedItems.length).toBe(1);
    });

    it('should handle multiple connection acceptances in sequence', async () => {
      await chrome.storage.local.set({
        uproot_connection_paths: connectionPaths,
        uproot_feed: [],
      });

      // First acceptance: Alice
      currentConnections = ['https://linkedin.com/in/alice-intermediary'];
      let acceptances = await detectConnectionAcceptances(
        currentConnections,
        connectionPaths
      );
      await logConnectionAcceptance(
        acceptances[0].pathId,
        acceptances[0].stepIndex,
        acceptances[0].personName,
        'https://linkedin.com/in/alice-intermediary'
      );

      // Second acceptance: Charlie
      currentConnections = [
        'https://linkedin.com/in/alice-intermediary',
        'https://linkedin.com/in/charlie-connect',
      ];
      acceptances = await detectConnectionAcceptances(
        currentConnections,
        connectionPaths
      );
      expect(acceptances.length).toBe(1); // Only Charlie is new
      await logConnectionAcceptance(
        acceptances[0].pathId,
        acceptances[0].stepIndex,
        acceptances[0].personName,
        'https://linkedin.com/in/charlie-connect'
      );

      // Verify two feed items exist
      const feedResult = await chrome.storage.local.get('uproot_feed');
      const feedItems: FeedItem[] = feedResult['uproot_feed'] || [];
      expect(feedItems.length).toBe(2);

      // Verify different connections
      const connectionNames = feedItems.map((item) => item.connectionName);
      expect(connectionNames).toContain('Alice Intermediary');
      expect(connectionNames).toContain('Charlie Connect');
    });

    it('should mark path as complete when all steps connected', async () => {
      // Use a path with single step
      const singleStepPath = createConnectionPath('Single Step Target', [
        { name: 'Solo Connect', connected: false },
      ]);

      await chrome.storage.local.set({
        uproot_connection_paths: [singleStepPath],
        uproot_feed: [],
      });

      currentConnections = ['https://linkedin.com/in/solo-connect'];

      const acceptances = await detectConnectionAcceptances(
        currentConnections,
        [singleStepPath]
      );

      await logConnectionAcceptance(
        acceptances[0].pathId,
        acceptances[0].stepIndex,
        acceptances[0].personName,
        'https://linkedin.com/in/solo-connect'
      );

      // Verify path is complete
      const pathsResult = await chrome.storage.local.get(
        'uproot_connection_paths'
      );
      const paths: ConnectionPath[] =
        pathsResult['uproot_connection_paths'] || [];

      expect(paths[0].isComplete).toBe(true);
      expect(paths[0].completedSteps).toBe(1);
      expect(paths[0].totalSteps).toBe(1);
    });

    it('should track connection status correctly', () => {
      currentConnections = [
        'https://linkedin.com/in/alice-intermediary',
        'https://linkedin.com/in/bob-bridge',
      ];

      // Connected
      expect(
        trackConnectionStatus(
          'https://linkedin.com/in/alice-intermediary',
          currentConnections
        )
      ).toBe('connected');

      // Not connected
      expect(
        trackConnectionStatus(
          'https://linkedin.com/in/charlie-connect',
          currentConnections
        )
      ).toBe('not_connected');
    });
  });

  // ============================================================================
  // Integration Tests - Combined Scenarios
  // ============================================================================

  describe('(c) Combined feed filtering and connection monitoring', () => {
    it('should handle both job alerts and connection updates in feed', async () => {
      const companies = [
        createCompanyWatchlist('Google', true, {
          keywords: ['engineer'],
        }),
      ];

      const jobAlert = createJobAlert(
        'job-1',
        'Google',
        'Software Engineer',
        'Mountain View, CA'
      );

      const connectionPaths = [
        createConnectionPath('Test Target', [
          { name: 'Test Person', connected: false },
        ]),
      ];

      await chrome.storage.local.set({
        uproot_connection_paths: connectionPaths,
        uproot_feed: [jobAlert],
      });

      // Simulate connection acceptance
      const currentConnections = ['https://linkedin.com/in/test-person'];
      const acceptances = await detectConnectionAcceptances(
        currentConnections,
        connectionPaths
      );

      await logConnectionAcceptance(
        acceptances[0].pathId,
        acceptances[0].stepIndex,
        acceptances[0].personName,
        'https://linkedin.com/in/test-person'
      );

      // Get feed and filter
      const feedResult = await chrome.storage.local.get('uproot_feed');
      const allFeedItems: FeedItem[] = feedResult['uproot_feed'] || [];

      const filtered = filterJobAlertsByPreferences(allFeedItems, companies);

      // Should have both job alert and connection update
      expect(filtered.some((item) => item.type === 'job_alert')).toBe(true);
      expect(filtered.some((item) => item.type === 'connection_update')).toBe(
        true
      );
    });
  });

  // ============================================================================
  // Integration Tests - Deadline Alerts
  // ============================================================================

  describe('(d) Deadline alerts for saved jobs and applications', () => {
    // Helper to create saved job
    const createSavedJob = (
      id: string,
      title: string,
      company: string,
      daysAgo: number,
      status: 'saved' | 'applied' = 'saved'
    ): SavedJob => {
      const savedDate = new Date();
      savedDate.setDate(savedDate.getDate() - daysAgo);

      return {
        id,
        job: {
          id: `job-${id}`,
          title,
          company,
          description: 'Job description',
          requirements: [],
          keywords: [],
          postedDate: new Date().toISOString(),
          url: `https://linkedin.com/jobs/${id}`,
          source: 'linkedin' as const,
          scrapedAt: new Date().toISOString(),
        },
        savedAt: savedDate.toISOString(),
        applicationStatus: status,
      };
    };

    // Helper to create application
    const createApplication = (
      id: string,
      title: string,
      company: string,
      daysAgo: number,
      status: 'applied' | 'screening' | 'phone-screen' | 'technical-interview' | 'offer' = 'applied'
    ): Application => {
      const appliedDate = new Date();
      appliedDate.setDate(appliedDate.getDate() - daysAgo);

      return {
        id,
        company,
        jobTitle: title,
        jobUrl: `https://linkedin.com/jobs/${id}`,
        appliedDate: appliedDate.getTime(),
        appliedVia: 'linkedin',
        status,
        statusHistory: [],
        createdAt: appliedDate.getTime(),
        updatedAt: appliedDate.getTime(),
      };
    };

    beforeEach(() => {
      // Clear mock storage
      Object.keys(mockStorage).forEach((key) => delete mockStorage[key]);
      vi.clearAllMocks();
    });

    it('should create saved_not_applied alert when job saved 7+ days without application', async () => {
      const savedJobs = [
        createSavedJob('job-1', 'Software Engineer', 'Google', 8, 'saved'),
        createSavedJob('job-2', 'Product Manager', 'Meta', 5, 'saved'), // Too recent
      ];

      await chrome.storage.local.set({
        uproot_feed: [],
      });

      const alerts = await generateDeadlineAlertsForUser(savedJobs, []);

      expect(alerts.length).toBe(1);
      expect(alerts[0].type).toBe('deadline_alert');
      expect(alerts[0].alertType).toBe('saved_not_applied');
      expect(alerts[0].jobTitle).toBe('Software Engineer');
      expect(alerts[0].company).toBe('Google');
      expect(alerts[0].daysSinceAction).toBe(8);
      expect(alerts[0].urgency).toBe('medium');
    });

    it('should create no_follow_up alert when early-stage application 7+ days old', async () => {
      const applications = [
        createApplication('app-1', 'Engineer', 'Google', 9, 'applied'),
        createApplication('app-2', 'Designer', 'Meta', 3, 'screening'), // Too recent
        createApplication('app-3', 'PM', 'Stripe', 10, 'offer'), // Late stage, skip
      ];

      await chrome.storage.local.set({
        uproot_feed: [],
      });

      const alerts = await generateDeadlineAlertsForUser([], applications);

      expect(alerts.length).toBe(1);
      expect(alerts[0].type).toBe('deadline_alert');
      expect(alerts[0].alertType).toBe('no_follow_up');
      expect(alerts[0].jobTitle).toBe('Engineer');
      expect(alerts[0].company).toBe('Google');
      expect(alerts[0].daysSinceAction).toBe(9);
      expect(alerts[0].urgency).toBe('medium');
    });

    it('should NOT create duplicate alerts on subsequent runs', async () => {
      const savedJobs = [createSavedJob('job-1', 'Engineer', 'Google', 10, 'saved')];

      await chrome.storage.local.set({
        uproot_feed: [],
      });

      // First run - should create alert
      const firstAlerts = await generateDeadlineAlertsForUser(savedJobs, []);
      expect(firstAlerts.length).toBe(1);

      // Add alert to feed
      for (const alert of firstAlerts) {
        await addFeedItem(alert);
      }

      // Second run - should NOT create duplicate
      const secondAlerts = await generateDeadlineAlertsForUser(savedJobs, []);
      expect(secondAlerts.length).toBe(0);
    });

    it('should create both saved job and application alerts together', async () => {
      const savedJobs = [
        createSavedJob('job-1', 'Engineer', 'Google', 10, 'saved'),
        createSavedJob('job-2', 'Designer', 'Meta', 8, 'saved'),
      ];

      const applications = [
        createApplication('app-1', 'PM', 'Stripe', 12, 'screening'),
        createApplication('app-2', 'Analyst', 'Apple', 9, 'phone-screen'),
      ];

      await chrome.storage.local.set({
        uproot_feed: [],
      });

      const alerts = await generateDeadlineAlertsForUser(savedJobs, applications);

      expect(alerts.length).toBe(4);

      const savedJobAlerts = alerts.filter((a) => a.alertType === 'saved_not_applied');
      const appAlerts = alerts.filter((a) => a.alertType === 'no_follow_up');

      expect(savedJobAlerts.length).toBe(2);
      expect(appAlerts.length).toBe(2);
    });

    it('should set high urgency for 14+ days old items', async () => {
      const savedJobs = [
        createSavedJob('job-1', 'Engineer', 'Google', 15, 'saved'), // High urgency
        createSavedJob('job-2', 'Designer', 'Meta', 10, 'saved'), // Medium urgency
      ];

      await chrome.storage.local.set({
        uproot_feed: [],
      });

      const alerts = await generateDeadlineAlertsForUser(savedJobs, []);

      expect(alerts.length).toBe(2);

      const highUrgencyAlert = alerts.find((a) => a.company === 'Google');
      const mediumUrgencyAlert = alerts.find((a) => a.company === 'Meta');

      expect(highUrgencyAlert?.urgency).toBe('high');
      expect(highUrgencyAlert?.title).toContain('⚠️');
      expect(mediumUrgencyAlert?.urgency).toBe('medium');
    });
  });

  // ============================================================================
  // Integration Tests - Hiring Heat Detection
  // ============================================================================

  describe('(e) Hiring heat detection for watchlisted companies', () => {
    // Helper to create job
    const createLinkedInJob = (
      id: string,
      title: string,
      daysAgo: number
    ): any => {
      const postedDate = new Date();
      postedDate.setDate(postedDate.getDate() - daysAgo);

      return {
        id,
        title,
        company: 'Test Company',
        companyUrl: 'https://linkedin.com/company/test-company',
        location: 'San Francisco, CA',
        postedDate: `${daysAgo} days ago`,
        postedTimestamp: postedDate.getTime(),
        jobUrl: `https://linkedin.com/jobs/${id}`,
      };
    };

    beforeEach(() => {
      // Clear mock storage
      Object.keys(mockStorage).forEach((key) => delete mockStorage[key]);
      vi.clearAllMocks();
    });

    it('should create hiring_heat feed item when company posts 3+ new jobs', async () => {
      const company = createCompanyWatchlist('Test Company');
      const currentJobs = [
        createLinkedInJob('job-1', 'Software Engineer', 2),
        createLinkedInJob('job-2', 'Product Manager', 3),
        createLinkedInJob('job-3', 'Designer', 4),
      ];

      await chrome.storage.local.set({
        uproot_feed: [],
      });

      // Import and use detection functions
      const { detectHiringHeat, generateHiringHeatFeedItem } = await import(
        '../services/hiring-heat-detector'
      );

      const indicator = detectHiringHeat(currentJobs, undefined, company);
      expect(indicator).not.toBeNull();
      expect(indicator!.heatLevel).toBe('warming');

      await generateHiringHeatFeedItem(indicator!);

      const feedResult = await chrome.storage.local.get('uproot_feed');
      const feedItems: FeedItem[] = feedResult['uproot_feed'] || [];

      expect(feedItems.length).toBe(1);
      expect(feedItems[0].type).toBe('hiring_heat');
      expect(feedItems[0].company).toBe('Test Company');
      expect(feedItems[0].jobCount).toBe(3);
      expect(feedItems[0].heatLevel).toBe('warming');
      expect(feedItems[0].title).toContain('ramping up hiring');
      expect(feedItems[0].title).toContain('🔥');
    });

    it('should NOT create duplicate hiring_heat items within detection window', async () => {
      const company = createCompanyWatchlist('Test Company');
      const currentJobs = [
        createLinkedInJob('job-1', 'Engineer', 2),
        createLinkedInJob('job-2', 'PM', 3),
        createLinkedInJob('job-3', 'Designer', 4),
      ];

      // Create initial hiring_heat item
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

      await chrome.storage.local.set({
        uproot_feed: [existingItem],
      });

      const { detectHiringHeat, generateHiringHeatFeedItem } = await import(
        '../services/hiring-heat-detector'
      );

      const indicator = detectHiringHeat(currentJobs, undefined, company);
      expect(indicator).not.toBeNull();

      // Try to generate item - should be skipped due to existing item
      await generateHiringHeatFeedItem(indicator!);

      const feedResult = await chrome.storage.local.get('uproot_feed');
      const feedItems: FeedItem[] = feedResult['uproot_feed'] || [];

      // Should still only have the original item
      expect(feedItems.length).toBe(1);
      expect(feedItems[0].id).toBe('feed_123');
    });

    it('should prioritize intern/junior roles in hiring_heat description', async () => {
      const company = createCompanyWatchlist('Test Company');
      const currentJobs = [
        createLinkedInJob('job-1', 'Software Engineering Intern', 1),
        createLinkedInJob('job-2', 'Junior Developer', 2),
        createLinkedInJob('job-3', 'Senior Engineer', 3),
        createLinkedInJob('job-4', 'Staff Engineer', 4),
      ];

      await chrome.storage.local.set({
        uproot_feed: [],
      });

      const { detectHiringHeat, generateHiringHeatFeedItem } = await import(
        '../services/hiring-heat-detector'
      );

      const indicator = detectHiringHeat(currentJobs, undefined, company);
      expect(indicator).not.toBeNull();
      expect(indicator!.internshipCount).toBe(2);

      await generateHiringHeatFeedItem(indicator!);

      const feedResult = await chrome.storage.local.get('uproot_feed');
      const feedItems: FeedItem[] = feedResult['uproot_feed'] || [];

      expect(feedItems[0].description).toContain('2 intern/junior');
      expect(feedItems[0].internshipCount).toBe(2);
    });

    it('should escalate heat level based on job count', async () => {
      const company = createCompanyWatchlist('Test Company');

      await chrome.storage.local.set({
        uproot_feed: [],
      });

      const { detectHiringHeat } = await import('../services/hiring-heat-detector');

      // Test "warming" (3-5 jobs)
      const warmingJobs = Array.from({ length: 4 }, (_, i) =>
        createLinkedInJob(`job-${i}`, `Position ${i}`, Math.floor(i / 2))
      );
      const warmingIndicator = detectHiringHeat(warmingJobs, undefined, company);
      expect(warmingIndicator!.heatLevel).toBe('warming');

      // Test "hot" (6-9 jobs)
      const hotJobs = Array.from({ length: 7 }, (_, i) =>
        createLinkedInJob(`job-${i}`, `Position ${i}`, Math.floor(i / 2))
      );
      const hotIndicator = detectHiringHeat(hotJobs, undefined, company);
      expect(hotIndicator!.heatLevel).toBe('hot');

      // Test "very_hot" (10+ jobs)
      const veryHotJobs = Array.from({ length: 12 }, (_, i) =>
        createLinkedInJob(`job-${i}`, `Position ${i}`, Math.floor(i / 2))
      );
      const veryHotIndicator = detectHiringHeat(veryHotJobs, undefined, company);
      expect(veryHotIndicator!.heatLevel).toBe('very_hot');
    });

    it('should work alongside other feed item types', async () => {
      const company = createCompanyWatchlist('Test Company');
      const currentJobs = [
        createLinkedInJob('job-1', 'Engineer', 2),
        createLinkedInJob('job-2', 'PM', 3),
        createLinkedInJob('job-3', 'Designer', 4),
      ];

      // Add existing job_alert and deadline_alert items
      const existingItems: FeedItem[] = [
        createJobAlert('job-old', 'Test Company', 'Old Job', 'SF', Date.now() - 3600000),
        {
          id: 'deadline-1',
          type: 'deadline_alert',
          timestamp: Date.now() - 7200000,
          read: false,
          title: 'Follow up on application',
          description: 'Test',
          company: 'Other Company',
          alertType: 'no_follow_up',
          urgency: 'medium',
          daysSinceAction: 10,
        },
      ];

      await chrome.storage.local.set({
        uproot_feed: existingItems,
      });

      const { detectHiringHeat, generateHiringHeatFeedItem } = await import(
        '../services/hiring-heat-detector'
      );

      const indicator = detectHiringHeat(currentJobs, undefined, company);
      await generateHiringHeatFeedItem(indicator!);

      const feedResult = await chrome.storage.local.get('uproot_feed');
      const feedItems: FeedItem[] = feedResult['uproot_feed'] || [];

      // Should have all three types
      expect(feedItems.length).toBe(3);
      expect(feedItems.some((item) => item.type === 'job_alert')).toBe(true);
      expect(feedItems.some((item) => item.type === 'deadline_alert')).toBe(true);
      expect(feedItems.some((item) => item.type === 'hiring_heat')).toBe(true);
    });
  });
});
