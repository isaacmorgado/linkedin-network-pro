/**
 * Job Analysis Storage Module
 * Handles storage operations for job description analysis
 */

import { log, LogCategory } from '../logger';
import type { JobDescriptionAnalysis } from '../../types/resume';
import { JOB_DESCRIPTIONS_KEY } from '../../types/resume';


/**
 * Save analyzed job description
 */
export async function saveJobDescription(analysis: Omit<JobDescriptionAnalysis, 'id'>): Promise<string> {
  try {
    const result = await chrome.storage.local.get(JOB_DESCRIPTIONS_KEY);
    const descriptions: JobDescriptionAnalysis[] = result[JOB_DESCRIPTIONS_KEY] || [];

    const newDescription: JobDescriptionAnalysis = {
      ...analysis,
      id: `jobdesc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    };

    descriptions.unshift(newDescription);
    await chrome.storage.local.set({ [JOB_DESCRIPTIONS_KEY]: descriptions });

    console.log('[Uproot] Saved job description:', newDescription.jobTitle, 'at', newDescription.company);
    return newDescription.id;
  } catch (error) {
    console.error('[Uproot] Error saving job description:', error);
    throw error;
  }
}

/**
 * Get all job descriptions
 */
export async function getJobDescriptions(): Promise<JobDescriptionAnalysis[]> {
  try {
    const result = await chrome.storage.local.get(JOB_DESCRIPTIONS_KEY);
    return result[JOB_DESCRIPTIONS_KEY] || [];
  } catch (error) {
    console.error('[Uproot] Error getting job descriptions:', error);
    return [];
  }
}

/**
 * Get job description by ID
 */
export async function getJobDescriptionById(id: string): Promise<JobDescriptionAnalysis | null> {
  const descriptions = await getJobDescriptions();
  return descriptions.find((d) => d.id === id) || null;
}

/**
 * Delete job description
 */
export async function deleteJobDescription(id: string): Promise<void> {
  try {
    const descriptions = await getJobDescriptions();
    const filtered = descriptions.filter((d) => d.id !== id);
    await chrome.storage.local.set({ [JOB_DESCRIPTIONS_KEY]: filtered });
    console.log('[Uproot] Deleted job description:', id);
  } catch (error) {
    console.error('[Uproot] Error deleting job description:', error);
    throw error;
  }
}


/**
 * Get all job description analyses from storage
 */
export async function getJobDescriptionAnalyses(): Promise<JobDescriptionAnalysis[]> {
  return log.trackAsync(LogCategory.STORAGE, 'getJobDescriptionAnalyses', async () => {
    log.debug(LogCategory.STORAGE, 'Fetching all job description analyses from storage');

    try {
      const result = await chrome.storage.local.get(JOB_DESCRIPTIONS_KEY);
      const analyses = result[JOB_DESCRIPTIONS_KEY] || [];
      // Sort by analyzed date, newest first
      const sorted = analyses.sort((a: JobDescriptionAnalysis, b: JobDescriptionAnalysis) => b.analyzedAt - a.analyzedAt);
      log.info(LogCategory.STORAGE, 'Job description analyses retrieved', { count: sorted.length });
      return sorted;
    } catch (error) {
      log.error(LogCategory.STORAGE, 'Failed to get job description analyses', error as Error);
      console.error('[Uproot] Error getting job description analyses:', error);
      return [];
    }
  });
}

/**
 * Save job description analysis to storage
 */
export async function saveJobDescriptionAnalysis(analysis: JobDescriptionAnalysis): Promise<void> {
  return log.trackAsync(LogCategory.STORAGE, 'saveJobDescriptionAnalysis', async () => {
    log.debug(LogCategory.STORAGE, 'Saving job description analysis', { id: analysis.id, jobTitle: analysis.jobTitle, company: analysis.company });

    try {
      const analyses = await getJobDescriptionAnalyses();

      // Check if analysis with same ID exists
      const existingIndex = analyses.findIndex((a) => a.id === analysis.id);

      if (existingIndex !== -1) {
        // Update existing
        analyses[existingIndex] = analysis;
        log.change(LogCategory.STORAGE, 'jobDescriptionAnalysis', 'update', { id: analysis.id, jobTitle: analysis.jobTitle });
      } else {
        // Add new
        analyses.push(analysis);
        log.change(LogCategory.STORAGE, 'jobDescriptionAnalysis', 'create', { id: analysis.id, jobTitle: analysis.jobTitle });
      }

      await chrome.storage.local.set({ [JOB_DESCRIPTIONS_KEY]: analyses });
      console.log('[Uproot] Job description analysis saved:', analysis.jobTitle);
    } catch (error) {
      log.error(LogCategory.STORAGE, 'Failed to save job description analysis', error as Error, { id: analysis.id });
      console.error('[Uproot] Error saving job description analysis:', error);
      throw error;
    }
  });
}

/**
 * Delete job description analysis
 */
export async function deleteJobDescriptionAnalysis(id: string): Promise<void> {
  return log.trackAsync(LogCategory.STORAGE, 'deleteJobDescriptionAnalysis', async () => {
    log.debug(LogCategory.STORAGE, 'Deleting job description analysis', { id });

    try {
      const analyses = await getJobDescriptionAnalyses();
      const filtered = analyses.filter((a) => a.id !== id);
      await chrome.storage.local.set({ [JOB_DESCRIPTIONS_KEY]: filtered });

      log.change(LogCategory.STORAGE, 'jobDescriptionAnalysis', 'delete', { id });
      console.log('[Uproot] Job description analysis deleted:', id);
    } catch (error) {
      log.error(LogCategory.STORAGE, 'Failed to delete job description analysis', error as Error, { id });
      console.error('[Uproot] Error deleting job description analysis:', error);
      throw error;
    }
  });
}

/**
 * Get job description analysis by ID
 */
export async function getJobDescriptionAnalysis(id: string): Promise<JobDescriptionAnalysis | null> {
  return log.trackAsync(LogCategory.STORAGE, 'getJobDescriptionAnalysis', async () => {
    log.debug(LogCategory.STORAGE, 'Fetching job description analysis by ID', { id });

    try {
      const analyses = await getJobDescriptionAnalyses();
      const analysis = analyses.find((a) => a.id === id) || null;
      log.info(LogCategory.STORAGE, 'Job description analysis lookup complete', { id, found: !!analysis });
      return analysis;
    } catch (error) {
      log.error(LogCategory.STORAGE, 'Failed to get job description analysis', error as Error, { id });
      console.error('[Uproot] Error getting job description analysis:', error);
      return null;
    }
  });
}

// Note: Generated resume functions are defined earlier in this file (lines 1055-1105)

