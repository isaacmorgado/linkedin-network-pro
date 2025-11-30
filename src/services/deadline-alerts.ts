/**
 * Deadline Alerts Service
 * Generates aging/deadline alerts for saved jobs and applications
 */

import type { FeedItem } from '../types/feed';
import type { Application } from '../types/resume';
import type { SavedJob } from '../types';
import { log, LogCategory } from '../utils/logger';
import { getFeedItems } from '../utils/storage/feed-storage';

// V1 Constants - Days thresholds
export const DEADLINE_THRESHOLDS = {
  SAVED_NOT_APPLIED_DAYS: 7, // Alert if job saved for 7+ days without applying
  NO_FOLLOW_UP_DAYS: 7, // Alert if application 7+ days old with no follow-up
  HIGH_URGENCY_DAYS: 14, // High urgency if 14+ days (for saved jobs or no follow-up)
} as const;

/**
 * Check if an alert already exists for a specific job/application
 */
async function alertAlreadyExists(
  alertType: 'saved_not_applied' | 'application_deadline' | 'no_follow_up',
  jobId?: string,
  applicationId?: string
): Promise<boolean> {
  const feedItems = await getFeedItems();

  return feedItems.some(
    (item) =>
      item.type === 'deadline_alert' &&
      item.alertType === alertType &&
      (jobId ? item.savedJobId === jobId : item.applicationId === applicationId)
  );
}

/**
 * Generate deadline alerts for saved jobs (not yet applied)
 */
export async function generateSavedJobAlerts(savedJobs: SavedJob[]): Promise<FeedItem[]> {
  const now = Date.now();
  const alerts: FeedItem[] = [];

  log.debug(LogCategory.SERVICE, 'Generating saved job alerts', { count: savedJobs.length });

  for (const savedJob of savedJobs) {
    // Skip if already applied
    if (savedJob.applicationStatus !== 'saved') {
      continue;
    }

    // Calculate days since saved
    const savedDate = new Date(savedJob.savedAt).getTime();
    const daysSinceSaved = Math.floor((now - savedDate) / (1000 * 60 * 60 * 24));

    // Check threshold
    if (daysSinceSaved < DEADLINE_THRESHOLDS.SAVED_NOT_APPLIED_DAYS) {
      continue;
    }

    // Check for duplicates
    if (await alertAlreadyExists('saved_not_applied', savedJob.id)) {
      log.debug(LogCategory.SERVICE, 'Alert already exists, skipping', {
        jobId: savedJob.id,
        alertType: 'saved_not_applied',
      });
      continue;
    }

    // Determine urgency
    const urgency = daysSinceSaved >= DEADLINE_THRESHOLDS.HIGH_URGENCY_DAYS ? 'high' : 'medium';

    const alert: FeedItem = {
      id: `deadline_alert_${savedJob.id}_${Date.now()}`,
      type: 'deadline_alert',
      timestamp: now,
      read: false,

      // Job details
      jobTitle: savedJob.job.title,
      company: savedJob.job.company,
      jobUrl: savedJob.job.url,

      // Alert details
      alertType: 'saved_not_applied',
      urgency,
      daysSinceAction: daysSinceSaved,
      lastActionDate: savedDate,
      lastActionType: 'saved',
      savedJobId: savedJob.id,

      // Metadata
      title: urgency === 'high' ? `⚠️ Urgent: Apply to ${savedJob.job.company}` : `Reminder: ${savedJob.job.company} Job`,
      description: `You saved "${savedJob.job.title}" ${daysSinceSaved} days ago. ${urgency === 'high' ? 'Don\'t miss this opportunity!' : 'Consider applying soon!'}`,
      actionUrl: savedJob.job.url,
      actionLabel: 'Apply Now',
    };

    alerts.push(alert);
    log.info(LogCategory.SERVICE, 'Created saved_not_applied alert', {
      jobTitle: savedJob.job.title,
      company: savedJob.job.company,
      daysSinceSaved,
      urgency,
    });
  }

  return alerts;
}

/**
 * Generate follow-up alerts for applications
 */
export async function generateApplicationAlerts(applications: Application[]): Promise<FeedItem[]> {
  const now = Date.now();
  const alerts: FeedItem[] = [];

  log.debug(LogCategory.SERVICE, 'Generating application alerts', { count: applications.length });

  for (const app of applications) {
    // Only alert for early-stage applications (applied, screening, phone-screen)
    const earlyStageStatuses = ['applied', 'screening', 'phone-screen'];
    if (!earlyStageStatuses.includes(app.status)) {
      continue;
    }

    // Calculate days since last update
    const daysSinceUpdate = Math.floor((now - app.updatedAt) / (1000 * 60 * 60 * 24));

    // Check threshold
    if (daysSinceUpdate < DEADLINE_THRESHOLDS.NO_FOLLOW_UP_DAYS) {
      continue;
    }

    // Check for duplicates
    if (await alertAlreadyExists('no_follow_up', undefined, app.id)) {
      log.debug(LogCategory.SERVICE, 'Alert already exists, skipping', {
        applicationId: app.id,
        alertType: 'no_follow_up',
      });
      continue;
    }

    // Determine urgency
    const urgency = daysSinceUpdate >= DEADLINE_THRESHOLDS.HIGH_URGENCY_DAYS ? 'high' : 'medium';

    // Map status to action type
    const lastActionType = (['applied', 'screening', 'interview'].includes(app.status)
      ? app.status
      : 'applied') as 'applied' | 'screening' | 'interview';

    const alert: FeedItem = {
      id: `deadline_alert_${app.id}_${Date.now()}`,
      type: 'deadline_alert',
      timestamp: now,
      read: false,

      // Job details
      jobTitle: app.jobTitle,
      company: app.company,
      jobUrl: app.jobUrl,

      // Alert details
      alertType: 'no_follow_up',
      urgency,
      daysSinceAction: daysSinceUpdate,
      lastActionDate: app.updatedAt,
      lastActionType,
      applicationId: app.id,

      // Metadata
      title: urgency === 'high' ? `⚠️ Follow up with ${app.company}` : `Consider following up: ${app.company}`,
      description: `It's been ${daysSinceUpdate} days since your ${app.status} status for "${app.jobTitle}". ${urgency === 'high' ? 'A follow-up could help!' : 'Consider sending a follow-up.'}`,
      actionUrl: app.jobUrl || undefined,
      actionLabel: 'Follow Up',
    };

    alerts.push(alert);
    log.info(LogCategory.SERVICE, 'Created no_follow_up alert', {
      jobTitle: app.jobTitle,
      company: app.company,
      daysSinceUpdate,
      urgency,
      status: app.status,
    });
  }

  return alerts;
}

/**
 * Main function: Generate all deadline alerts for user
 * Returns list of alert feed items to add to the feed
 */
export async function generateDeadlineAlertsForUser(
  savedJobs: SavedJob[],
  applications: Application[]
): Promise<FeedItem[]> {
  return log.trackAsync(LogCategory.SERVICE, 'generateDeadlineAlertsForUser', async () => {
    log.info(LogCategory.SERVICE, 'Starting deadline alert generation', {
      savedJobsCount: savedJobs.length,
      applicationsCount: applications.length,
    });

    const savedJobAlerts = await generateSavedJobAlerts(savedJobs);
    const applicationAlerts = await generateApplicationAlerts(applications);

    const allAlerts = [...savedJobAlerts, ...applicationAlerts];

    log.info(LogCategory.SERVICE, 'Deadline alert generation complete', {
      totalAlerts: allAlerts.length,
      savedJobAlerts: savedJobAlerts.length,
      applicationAlerts: applicationAlerts.length,
    });

    return allAlerts;
  });
}
