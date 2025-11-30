/**
 * Generated Resume Storage Module
 * Handles storage operations for generated resumes
 */

import { log, LogCategory } from '../logger';
import type { GeneratedResume } from '../../types/resume';
import { GENERATED_RESUMES_KEY } from '../../types/resume';


/**
 * Save generated resume
 */
export async function saveGeneratedResume(resume: GeneratedResume): Promise<void> {
  return log.trackAsync(LogCategory.STORAGE, 'saveGeneratedResume', async () => {
    log.debug(LogCategory.STORAGE, 'Saving generated resume', { id: resume.id, jobTitle: resume.jobTitle, company: resume.company });

    try {
      const result = await chrome.storage.local.get(GENERATED_RESUMES_KEY);
      const resumes: GeneratedResume[] = result[GENERATED_RESUMES_KEY] || [];

      resumes.unshift(resume);
      await chrome.storage.local.set({ [GENERATED_RESUMES_KEY]: resumes });

      log.change(LogCategory.STORAGE, 'generatedResume', 'create', { id: resume.id, jobTitle: resume.jobTitle, company: resume.company });
      console.log('[Uproot] Saved generated resume for:', resume.jobTitle, 'at', resume.company);
    } catch (error) {
      log.error(LogCategory.STORAGE, 'Failed to save generated resume', error as Error, { id: resume.id });
      console.error('[Uproot] Error saving generated resume:', error);
      throw error;
    }
  });
}

/**
 * Get all generated resumes
 */
export async function getGeneratedResumes(): Promise<GeneratedResume[]> {
  return log.trackAsync(LogCategory.STORAGE, 'getGeneratedResumes', async () => {
    log.debug(LogCategory.STORAGE, 'Fetching all generated resumes from storage');

    try {
      const result = await chrome.storage.local.get(GENERATED_RESUMES_KEY);
      const resumes = result[GENERATED_RESUMES_KEY] || [];
      log.info(LogCategory.STORAGE, 'Generated resumes retrieved', { count: resumes.length });
      return resumes;
    } catch (error) {
      log.error(LogCategory.STORAGE, 'Failed to get generated resumes', error as Error);
      console.error('[Uproot] Error getting generated resumes:', error);
      return [];
    }
  });
}

/**
 * Get generated resume by ID
 */
export async function getGeneratedResumeById(id: string): Promise<GeneratedResume | null> {
  const resumes = await getGeneratedResumes();
  return resumes.find((r) => r.id === id) || null;
}

/**
 * Delete generated resume
 */
export async function deleteGeneratedResume(id: string): Promise<void> {
  return log.trackAsync(LogCategory.STORAGE, 'deleteGeneratedResume', async () => {
    log.debug(LogCategory.STORAGE, 'Deleting generated resume', { id });

    try {
      const resumes = await getGeneratedResumes();
      const filtered = resumes.filter((r) => r.id !== id);
      await chrome.storage.local.set({ [GENERATED_RESUMES_KEY]: filtered });

      log.change(LogCategory.STORAGE, 'generatedResume', 'delete', { id });
      console.log('[Uproot] Deleted generated resume:', id);
    } catch (error) {
      log.error(LogCategory.STORAGE, 'Failed to delete generated resume', error as Error, { id });
      console.error('[Uproot] Error deleting generated resume:', error);
      throw error;
    }
  });
}

