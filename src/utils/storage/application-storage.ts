/**
 * Application Tracking Storage Module
 * Handles storage operations for job applications
 */

import { log, LogCategory } from '../logger';
import type { Application, ApplicationStatus } from '../../types/resume';
import { APPLICATIONS_KEY } from '../../types/resume';


/**
 * Add new application
 */
export async function addApplication(app: Omit<Application, 'id' | 'createdAt' | 'updatedAt' | 'statusHistory'>): Promise<Application> {
  try {
    const result = await chrome.storage.local.get(APPLICATIONS_KEY);
    const applications: Application[] = result[APPLICATIONS_KEY] || [];

    const newApp: Application = {
      ...app,
      id: `app_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      statusHistory: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    applications.unshift(newApp);
    await chrome.storage.local.set({ [APPLICATIONS_KEY]: applications });

    console.log('[Uproot] Added application:', newApp.jobTitle, 'at', newApp.company);
    return newApp;
  } catch (error) {
    console.error('[Uproot] Error adding application:', error);
    throw error;
  }
}

/**
 * Get all applications
 */
export async function getApplications(): Promise<Application[]> {
  return log.trackAsync(LogCategory.STORAGE, 'getApplications', async () => {
    log.debug(LogCategory.STORAGE, 'Fetching all applications from storage');

    try {
      const result = await chrome.storage.local.get(APPLICATIONS_KEY);
      const apps = result[APPLICATIONS_KEY] || [];
      // Sort by most recent
      const sorted = apps.sort((a: Application, b: Application) => b.appliedDate - a.appliedDate);
      log.info(LogCategory.STORAGE, 'Applications retrieved', { count: sorted.length });
      return sorted;
    } catch (error) {
      log.error(LogCategory.STORAGE, 'Failed to get applications', error as Error);
      console.error('[Uproot] Error getting applications:', error);
      return [];
    }
  });
}

/**
 * Update application status with history tracking
 */
export async function updateApplicationStatus(
  id: string,
  newStatus: ApplicationStatus,
  notes?: string
): Promise<void> {
  return log.trackAsync(LogCategory.STORAGE, 'updateApplicationStatus', async () => {
    log.debug(LogCategory.STORAGE, 'Updating application status', { id, newStatus, notes });

    try {
      const applications = await getApplications();
      const index = applications.findIndex((a) => a.id === id);

      if (index === -1) {
        log.error(LogCategory.STORAGE, 'Application not found', new Error('Application not found'), { id });
        throw new Error('Application not found');
      }

      const oldStatus = applications[index].status;

      // Add to status history
      applications[index].statusHistory.push({
        from: oldStatus,
        to: newStatus,
        date: Date.now(),
        notes,
      });

      applications[index].status = newStatus;
      applications[index].updatedAt = Date.now();

      if (notes) {
        applications[index].notes = notes;
      }

      await chrome.storage.local.set({ [APPLICATIONS_KEY]: applications });
      log.change(LogCategory.STORAGE, 'application', 'update', { id, statusChange: `${oldStatus} → ${newStatus}` });
      console.log('[Uproot] Updated application status:', id, oldStatus, '→', newStatus);
    } catch (error) {
      log.error(LogCategory.STORAGE, 'Failed to update application status', error as Error, { id, newStatus });
      console.error('[Uproot] Error updating application status:', error);
      throw error;
    }
  });
}

/**
 * Delete application
 */
export async function deleteApplication(id: string): Promise<void> {
  return log.trackAsync(LogCategory.STORAGE, 'deleteApplication', async () => {
    log.debug(LogCategory.STORAGE, 'Deleting application', { id });

    try {
      const applications = await getApplications();
      const filtered = applications.filter((a) => a.id !== id);
      await chrome.storage.local.set({ [APPLICATIONS_KEY]: filtered });

      log.change(LogCategory.STORAGE, 'application', 'delete', { id });
      console.log('[Uproot] Deleted application:', id);
    } catch (error) {
      log.error(LogCategory.STORAGE, 'Failed to delete application', error as Error, { id });
      console.error('[Uproot] Error deleting application:', error);
      throw error;
    }
  });
}

