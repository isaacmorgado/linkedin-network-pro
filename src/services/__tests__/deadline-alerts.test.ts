/**
 * Deadline Alerts Tests
 * Tests for aging/deadline alert generation
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  generateDeadlineAlertsForUser,
  generateSavedJobAlerts,
  generateApplicationAlerts,
  DEADLINE_THRESHOLDS,
} from '../deadline-alerts';
import type { SavedJob } from '../../types';
import type { Application, ApplicationStatus } from '../../types/resume';

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

// Helper to create saved job
function createSavedJob(
  id: string,
  title: string,
  company: string,
  savedDaysAgo: number,
  applicationStatus: 'saved' | 'applied' = 'saved'
): SavedJob {
  const savedDate = new Date();
  savedDate.setDate(savedDate.getDate() - savedDaysAgo);

  return {
    id,
    job: {
      id,
      title,
      company,
      url: `https://example.com/jobs/${id}`,
      location: 'San Francisco, CA',
      postedDate: new Date().toISOString(),
      description: 'Job description here',
      requirements: [],
      keywords: [],
      scrapedAt: new Date().toISOString(),
      source: 'manual' as const,
    },
    savedAt: savedDate.toISOString(),
    applicationStatus,
  };
}

// Helper to create application
function createApplication(
  id: string,
  title: string,
  company: string,
  appliedDaysAgo: number,
  status: ApplicationStatus = 'applied'
): Application {
  const appliedDate = new Date();
  appliedDate.setDate(appliedDate.getDate() - appliedDaysAgo);

  return {
    id,
    company,
    jobTitle: title,
    jobUrl: `https://example.com/jobs/${id}`,
    appliedDate: appliedDate.getTime(),
    appliedVia: 'linkedin',
    status,
    statusHistory: [],
    createdAt: appliedDate.getTime(),
    updatedAt: appliedDate.getTime(),
  };
}

describe('Deadline Alerts', () => {
  beforeEach(() => {
    mockStorage.clear();
    mockStorage.set('uproot_feed', []); // Empty feed
    vi.clearAllMocks();
  });

  describe('Saved Job Alerts (saved_not_applied)', () => {
    it('should create alert for job saved 7+ days ago with no application', async () => {
      const savedJobs = [createSavedJob('job-1', 'Software Engineer', 'Google', 8, 'saved')];

      const alerts = await generateSavedJobAlerts(savedJobs);

      expect(alerts.length).toBe(1);
      expect(alerts[0].type).toBe('deadline_alert');
      expect(alerts[0].alertType).toBe('saved_not_applied');
      expect(alerts[0].jobTitle).toBe('Software Engineer');
      expect(alerts[0].company).toBe('Google');
      expect(alerts[0].daysSinceAction).toBe(8);
      expect(alerts[0].urgency).toBe('medium');
      expect(alerts[0].lastActionType).toBe('saved');
      expect(alerts[0].title).toContain('Google');
      expect(alerts[0].description).toContain('8 days ago');
      expect(alerts[0].actionLabel).toBe('Apply Now');
    });

    it('should create high urgency alert for job saved 14+ days ago', async () => {
      const savedJobs = [createSavedJob('job-1', 'Product Manager', 'Meta', 15, 'saved')];

      const alerts = await generateSavedJobAlerts(savedJobs);

      expect(alerts.length).toBe(1);
      expect(alerts[0].urgency).toBe('high');
      expect(alerts[0].title).toContain('⚠️ Urgent');
      expect(alerts[0].description).toContain('Don\'t miss this opportunity!');
    });

    it('should NOT create alert for job saved less than 7 days ago', async () => {
      const savedJobs = [
        createSavedJob('job-1', 'Engineer', 'Stripe', 3, 'saved'),
        createSavedJob('job-2', 'Designer', 'Airbnb', 6, 'saved'),
      ];

      const alerts = await generateSavedJobAlerts(savedJobs);

      expect(alerts.length).toBe(0);
    });

    it('should NOT create alert for job that has already been applied to', async () => {
      const savedJobs = [
        createSavedJob('job-1', 'Engineer', 'Google', 10, 'saved'),
        createSavedJob('job-2', 'Engineer', 'Meta', 10, 'applied'), // Already applied
      ];

      const alerts = await generateSavedJobAlerts(savedJobs);

      expect(alerts.length).toBe(1);
      expect(alerts[0].jobTitle).toBe('Engineer');
      expect(alerts[0].company).toBe('Google');
    });

    it('should NOT create duplicate alerts for same job', async () => {
      const savedJobs = [createSavedJob('job-1', 'Engineer', 'Google', 10, 'saved')];

      // First generation
      const firstAlerts = await generateSavedJobAlerts(savedJobs);
      expect(firstAlerts.length).toBe(1);

      // Add alert to feed
      mockStorage.set('uproot_feed', [
        {
          ...firstAlerts[0],
          id: 'feed_123',
        },
      ]);

      // Second generation (should detect existing alert)
      const secondAlerts = await generateSavedJobAlerts(savedJobs);
      expect(secondAlerts.length).toBe(0);
    });

    it('should handle multiple jobs with different ages', async () => {
      const savedJobs = [
        createSavedJob('job-1', 'Engineer', 'Google', 5, 'saved'), // Too recent
        createSavedJob('job-2', 'Designer', 'Meta', 8, 'saved'), // Medium urgency
        createSavedJob('job-3', 'PM', 'Stripe', 15, 'saved'), // High urgency
        createSavedJob('job-4', 'Data', 'Apple', 10, 'applied'), // Already applied
      ];

      const alerts = await generateSavedJobAlerts(savedJobs);

      expect(alerts.length).toBe(2);
      expect(alerts.find((a) => a.company === 'Meta')?.urgency).toBe('medium');
      expect(alerts.find((a) => a.company === 'Stripe')?.urgency).toBe('high');
    });
  });

  describe('Application Alerts (no_follow_up)', () => {
    it('should create alert for application 7+ days old with no follow-up', async () => {
      const applications = [createApplication('app-1', 'Software Engineer', 'Google', 8, 'applied')];

      const alerts = await generateApplicationAlerts(applications);

      expect(alerts.length).toBe(1);
      expect(alerts[0].type).toBe('deadline_alert');
      expect(alerts[0].alertType).toBe('no_follow_up');
      expect(alerts[0].jobTitle).toBe('Software Engineer');
      expect(alerts[0].company).toBe('Google');
      expect(alerts[0].daysSinceAction).toBe(8);
      expect(alerts[0].urgency).toBe('medium');
      expect(alerts[0].lastActionType).toBe('applied');
      expect(alerts[0].title).toContain('following up');
      expect(alerts[0].description).toContain('8 days');
      expect(alerts[0].actionLabel).toBe('Follow Up');
    });

    it('should create high urgency alert for application 14+ days old', async () => {
      const applications = [createApplication('app-1', 'Product Manager', 'Meta', 15, 'screening')];

      const alerts = await generateApplicationAlerts(applications);

      expect(alerts.length).toBe(1);
      expect(alerts[0].urgency).toBe('high');
      expect(alerts[0].title).toContain('⚠️ Follow up');
      expect(alerts[0].description).toContain('A follow-up could help!');
    });

    it('should alert for early-stage applications (applied, screening, phone-screen)', async () => {
      const applications = [
        createApplication('app-1', 'Eng 1', 'Google', 8, 'applied'),
        createApplication('app-2', 'Eng 2', 'Meta', 8, 'screening'),
        createApplication('app-3', 'Eng 3', 'Stripe', 8, 'phone-screen'),
      ];

      const alerts = await generateApplicationAlerts(applications);

      expect(alerts.length).toBe(3);
      expect(alerts[0].lastActionType).toBe('applied');
      expect(alerts[1].lastActionType).toBe('screening');
      expect(alerts[2].lastActionType).toBe('applied'); // phone-screen maps to 'applied'
    });

    it('should NOT alert for late-stage applications', async () => {
      const applications = [
        createApplication('app-1', 'Eng 1', 'Google', 10, 'technical-interview'),
        createApplication('app-2', 'Eng 2', 'Meta', 10, 'onsite-interview'),
        createApplication('app-3', 'Eng 3', 'Stripe', 10, 'final-round'),
        createApplication('app-4', 'Eng 4', 'Apple', 10, 'offer'),
        createApplication('app-5', 'Eng 5', 'Amazon', 10, 'accepted'),
        createApplication('app-6', 'Eng 6', 'Netflix', 10, 'rejected'),
        createApplication('app-7', 'Eng 7', 'Uber', 10, 'withdrawn'),
      ];

      const alerts = await generateApplicationAlerts(applications);

      expect(alerts.length).toBe(0);
    });

    it('should NOT create alert for application less than 7 days old', async () => {
      const applications = [
        createApplication('app-1', 'Engineer', 'Google', 3, 'applied'),
        createApplication('app-2', 'Designer', 'Meta', 6, 'screening'),
      ];

      const alerts = await generateApplicationAlerts(applications);

      expect(alerts.length).toBe(0);
    });

    it('should NOT create duplicate alerts for same application', async () => {
      const applications = [createApplication('app-1', 'Engineer', 'Google', 10, 'applied')];

      // First generation
      const firstAlerts = await generateApplicationAlerts(applications);
      expect(firstAlerts.length).toBe(1);

      // Add alert to feed
      mockStorage.set('uproot_feed', [
        {
          ...firstAlerts[0],
          id: 'feed_456',
        },
      ]);

      // Second generation (should detect existing alert)
      const secondAlerts = await generateApplicationAlerts(applications);
      expect(secondAlerts.length).toBe(0);
    });
  });

  describe('Combined Alerts', () => {
    it('should generate both saved job and application alerts', async () => {
      const savedJobs = [
        createSavedJob('job-1', 'Engineer', 'Google', 10, 'saved'),
        createSavedJob('job-2', 'Designer', 'Meta', 8, 'saved'),
      ];

      const applications = [
        createApplication('app-1', 'PM', 'Stripe', 9, 'applied'),
        createApplication('app-2', 'Data Analyst', 'Apple', 12, 'screening'),
      ];

      const alerts = await generateDeadlineAlertsForUser(savedJobs, applications);

      expect(alerts.length).toBe(4);

      const savedJobAlerts = alerts.filter((a) => a.alertType === 'saved_not_applied');
      const appAlerts = alerts.filter((a) => a.alertType === 'no_follow_up');

      expect(savedJobAlerts.length).toBe(2);
      expect(appAlerts.length).toBe(2);
    });

    it('should return empty array when no alerts needed', async () => {
      const savedJobs = [
        createSavedJob('job-1', 'Engineer', 'Google', 2, 'saved'), // Too recent
        createSavedJob('job-2', 'Designer', 'Meta', 10, 'applied'), // Already applied
      ];

      const applications = [
        createApplication('app-1', 'PM', 'Stripe', 3, 'applied'), // Too recent
        createApplication('app-2', 'Analyst', 'Apple', 10, 'offer'), // Late stage
      ];

      const alerts = await generateDeadlineAlertsForUser(savedJobs, applications);

      expect(alerts.length).toBe(0);
    });

    it('should handle empty inputs', async () => {
      const alerts = await generateDeadlineAlertsForUser([], []);
      expect(alerts.length).toBe(0);
    });
  });

  describe('Threshold Constants', () => {
    it('should have correct threshold values', () => {
      expect(DEADLINE_THRESHOLDS.SAVED_NOT_APPLIED_DAYS).toBe(7);
      expect(DEADLINE_THRESHOLDS.NO_FOLLOW_UP_DAYS).toBe(7);
      expect(DEADLINE_THRESHOLDS.HIGH_URGENCY_DAYS).toBe(14);
    });
  });

  describe('Edge Cases', () => {
    it('should handle jobs with missing URLs', async () => {
      const savedJob = createSavedJob('job-1', 'Engineer', 'Google', 10, 'saved');
      savedJob.job.url = '';

      const alerts = await generateSavedJobAlerts([savedJob]);

      expect(alerts.length).toBe(1);
      expect(alerts[0].jobUrl).toBe('');
      expect(alerts[0].actionUrl).toBe('');
    });

    it('should handle applications with missing job URLs', async () => {
      const app = createApplication('app-1', 'Engineer', 'Google', 10, 'applied');
      app.jobUrl = undefined;

      const alerts = await generateApplicationAlerts([app]);

      expect(alerts.length).toBe(1);
      expect(alerts[0].jobUrl).toBeUndefined();
      expect(alerts[0].actionUrl).toBeUndefined();
    });

    it('should handle exact threshold boundaries', async () => {
      const savedJobExactly7Days = createSavedJob('job-1', 'Eng', 'Google', 7, 'saved');
      const savedJobExactly14Days = createSavedJob('job-2', 'PM', 'Meta', 14, 'saved');

      const alerts = await generateSavedJobAlerts([savedJobExactly7Days, savedJobExactly14Days]);

      expect(alerts.length).toBe(2);
      expect(alerts.find((a) => a.company === 'Google')?.urgency).toBe('medium');
      expect(alerts.find((a) => a.company === 'Meta')?.urgency).toBe('high');
    });
  });
});
