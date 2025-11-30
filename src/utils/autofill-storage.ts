/**
 * Autofill Storage Functions
 *
 * Chrome storage operations for autofill profile and question bank.
 * These will be imported into storage.ts or used directly.
 */

import { log, LogCategory } from './logger';
import type {
  AutofillProfile,
  SavedQuestion,
  QuestionBank,
  AutofillProfileUpdate,
  QuestionUpdate,
  QuestionFilters,
} from '../types/autofill';
import {
  AUTOFILL_PROFILE_KEY,
  QUESTION_BANK_KEY,
  DEFAULT_AUTOFILL_PROFILE,
  DEFAULT_QUESTION_BANK,
} from '../types/autofill';
import { getProfessionalProfile } from './storage/profile-storage';
import type { JobExperience } from '../types/resume';
import { isContextInvalidatedError } from './storage/helpers';

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Calculate total years of experience from job history
 */
function calculateTotalYears(jobs: JobExperience[]): number {
  if (jobs.length === 0) return 0;

  let totalMonths = 0;
  for (const job of jobs) {
    const startMatch = job.startDate.match(/^(\d{4})-(\d{2})$/);
    if (!startMatch) continue;

    const startYear = parseInt(startMatch[1]);
    const startMonth = parseInt(startMatch[2]) - 1; // JS months are 0-indexed
    const start = new Date(startYear, startMonth, 1);

    let end: Date;
    if (job.current || !job.endDate) {
      end = new Date(); // Current job
    } else {
      const endMatch = job.endDate.match(/^(\d{4})-(\d{2})$/);
      if (!endMatch) continue;
      const endYear = parseInt(endMatch[1]);
      const endMonth = parseInt(endMatch[2]) - 1;
      end = new Date(endYear, endMonth, 1);
    }

    const months = (end.getFullYear() - start.getFullYear()) * 12 +
                   (end.getMonth() - start.getMonth());
    totalMonths += Math.max(0, months);
  }

  return Math.round(totalMonths / 12);
}

// ============================================================================
// AUTOFILL PROFILE FUNCTIONS
// ============================================================================

/**
 * Get autofill profile
 */
export async function getAutofillProfile(): Promise<AutofillProfile> {
  return log.trackAsync(LogCategory.STORAGE, 'getAutofillProfile', async () => {
    try {
      log.debug(LogCategory.STORAGE, 'Fetching autofill profile from storage');
      const result = await chrome.storage.local.get(AUTOFILL_PROFILE_KEY);
      const profile = result[AUTOFILL_PROFILE_KEY] || DEFAULT_AUTOFILL_PROFILE;
      log.info(LogCategory.STORAGE, 'Autofill profile retrieved', {
        hasData: !!profile.email,
        skillsCount: profile.skills?.length || 0
      });
      return profile;
    } catch (error) {
      // Silently handle extension context invalidation during reloads
      if (isContextInvalidatedError(error)) {
        return DEFAULT_AUTOFILL_PROFILE;
      }
      log.error(LogCategory.STORAGE, 'Error getting autofill profile', error as Error);
      console.error('[Uproot] Error getting autofill profile:', error instanceof Error ? error.message : String(error), error);
      return DEFAULT_AUTOFILL_PROFILE;
    }
  });
}

/**
 * Save autofill profile
 */
export async function saveAutofillProfile(profile: AutofillProfileUpdate): Promise<AutofillProfile> {
  return log.trackAsync(LogCategory.STORAGE, 'saveAutofillProfile', async () => {
    try {
      log.debug(LogCategory.STORAGE, 'Saving autofill profile', {
        hasEmail: !!profile.email,
        hasPhone: !!profile.phone
      });

      const existing = await getAutofillProfile();

      // Extract professional summary fields from ProfessionalProfile if available
      let professionalData = {};
      try {
        const professionalProfile = await getProfessionalProfile();
        if (professionalProfile && professionalProfile.jobs && professionalProfile.jobs.length > 0) {
          const currentJob = professionalProfile.jobs[0]; // Most recent job (assumed sorted)
          professionalData = {
            currentJobTitle: currentJob.title,
            currentCompany: currentJob.company,
            totalYearsExperience: calculateTotalYears(professionalProfile.jobs),
          };
          log.debug(LogCategory.STORAGE, 'Extracted professional data from profile', professionalData);
        }
      } catch (error) {
        // Gracefully handle if ProfessionalProfile doesn't exist yet
        log.debug(LogCategory.STORAGE, 'No professional profile found, skipping professional data extraction');
      }

      const updated: AutofillProfile = {
        ...existing,
        ...professionalData, // Apply professional data first (can be overridden)
        ...profile, // User-provided updates take precedence
        fullName: profile.firstName && profile.lastName
          ? `${profile.firstName} ${profile.lastName}`
          : profile.fullName || existing.fullName,
        updatedAt: Date.now(),
      };

      await chrome.storage.local.set({ [AUTOFILL_PROFILE_KEY]: updated });
      log.change(LogCategory.STORAGE, 'autofillProfile', 'update', {
        fields: Object.keys(profile)
      });
      console.log('[Uproot] Autofill profile saved');
      return updated;
    } catch (error) {
      // Silently handle extension context invalidation during reloads
      if (isContextInvalidatedError(error)) {
        throw error; // Re-throw but don't log
      }
      log.error(LogCategory.STORAGE, 'Error saving autofill profile', error as Error);
      console.error('[Uproot] Error saving autofill profile:', error instanceof Error ? error.message : String(error), error);
      throw error;
    }
  });
}

/**
 * Clear autofill profile (reset to default)
 */
export async function clearAutofillProfile(): Promise<void> {
  return log.trackAsync(LogCategory.STORAGE, 'clearAutofillProfile', async () => {
    try {
      log.debug(LogCategory.STORAGE, 'Clearing autofill profile');
      await chrome.storage.local.set({ [AUTOFILL_PROFILE_KEY]: DEFAULT_AUTOFILL_PROFILE });
      log.change(LogCategory.STORAGE, 'autofillProfile', 'delete', {});
      console.log('[Uproot] Autofill profile cleared');
    } catch (error) {
      // Silently handle extension context invalidation during reloads
      if (isContextInvalidatedError(error)) {
        return; // Silently ignore during reload
      }
      log.error(LogCategory.STORAGE, 'Error clearing autofill profile', error as Error);
      console.error('[Uproot] Error clearing autofill profile:', error instanceof Error ? error.message : String(error), error);
      throw error;
    }
  });
}

// ============================================================================
// QUESTION BANK FUNCTIONS
// ============================================================================

/**
 * Get question bank
 */
export async function getQuestionBank(): Promise<QuestionBank> {
  return log.trackAsync(LogCategory.STORAGE, 'getQuestionBank', async () => {
    try {
      log.debug(LogCategory.STORAGE, 'Fetching question bank from storage');
      const result = await chrome.storage.local.get(QUESTION_BANK_KEY);
      const bank = result[QUESTION_BANK_KEY] || DEFAULT_QUESTION_BANK;
      log.info(LogCategory.STORAGE, 'Question bank retrieved', {
        questionCount: bank.questions?.length || 0
      });
      return bank;
    } catch (error) {
      // Silently handle extension context invalidation during reloads
      if (isContextInvalidatedError(error)) {
        return DEFAULT_QUESTION_BANK;
      }
      log.error(LogCategory.STORAGE, 'Error getting question bank', error as Error);
      console.error('[Uproot] Error getting question bank:', error instanceof Error ? error.message : String(error), error);
      return DEFAULT_QUESTION_BANK;
    }
  });
}

/**
 * Save question to bank
 */
export async function saveQuestion(
  question: string,
  answer: string = '',
  jobId?: string,
  keywords: string[] = []
): Promise<SavedQuestion> {
  return log.trackAsync(LogCategory.STORAGE, 'saveQuestion', async () => {
    try {
      log.debug(LogCategory.STORAGE, 'Saving question to bank', {
        questionLength: question.length,
        hasAnswer: !!answer,
        hasJobId: !!jobId
      });

      const bank = await getQuestionBank();
      const newQuestion: SavedQuestion = {
        id: `question-${Date.now()}`,
        question,
        answer,
        jobId,
        keywords,
        savedAt: Date.now(),
        updatedAt: Date.now(),
        usageCount: 0,
        wasEdited: false,
      };

      bank.questions.unshift(newQuestion);
      await chrome.storage.local.set({ [QUESTION_BANK_KEY]: bank });
      log.change(LogCategory.STORAGE, 'questionBank', 'create', {
        id: newQuestion.id,
        questionPreview: question.substring(0, 50)
      });
      console.log('[Uproot] Question saved:', question.substring(0, 50) + '...');
      return newQuestion;
    } catch (error) {
      // Silently handle extension context invalidation during reloads
      if (isContextInvalidatedError(error)) {
        throw error; // Re-throw but don't log
      }
      log.error(LogCategory.STORAGE, 'Error saving question', error as Error);
      console.error('[Uproot] Error saving question:', error instanceof Error ? error.message : String(error), error);
      throw error;
    }
  });
}

/**
 * Update question
 */
export async function updateQuestion(id: string, updates: QuestionUpdate): Promise<SavedQuestion> {
  return log.trackAsync(LogCategory.STORAGE, 'updateQuestion', async () => {
    try {
      log.debug(LogCategory.STORAGE, 'Updating question', { id, updates: Object.keys(updates) });

      const bank = await getQuestionBank();
      const index = bank.questions.findIndex((q) => q.id === id);

      if (index === -1) {
        throw new Error(`Question not found: ${id}`);
      }

      const updated: SavedQuestion = {
        ...bank.questions[index],
        ...updates,
        updatedAt: Date.now(),
        wasEdited: updates.answer !== undefined ? true : bank.questions[index].wasEdited,
      };

      bank.questions[index] = updated;
      await chrome.storage.local.set({ [QUESTION_BANK_KEY]: bank });
      log.change(LogCategory.STORAGE, 'questionBank', 'update', {
        id,
        fields: Object.keys(updates)
      });
      console.log('[Uproot] Question updated:', id);
      return updated;
    } catch (error) {
      // Silently handle extension context invalidation during reloads
      if (isContextInvalidatedError(error)) {
        throw error; // Re-throw but don't log
      }
      log.error(LogCategory.STORAGE, 'Error updating question', error as Error, { id });
      console.error('[Uproot] Error updating question:', error instanceof Error ? error.message : String(error), error);
      throw error;
    }
  });
}

/**
 * Delete question
 */
export async function deleteQuestion(id: string): Promise<void> {
  return log.trackAsync(LogCategory.STORAGE, 'deleteQuestion', async () => {
    try {
      log.debug(LogCategory.STORAGE, 'Deleting question', { id });

      const bank = await getQuestionBank();
      bank.questions = bank.questions.filter((q) => q.id !== id);
      await chrome.storage.local.set({ [QUESTION_BANK_KEY]: bank });
      log.change(LogCategory.STORAGE, 'questionBank', 'delete', { id });
      console.log('[Uproot] Question deleted:', id);
    } catch (error) {
      // Silently handle extension context invalidation during reloads
      if (isContextInvalidatedError(error)) {
        return; // Silently ignore during reload
      }
      log.error(LogCategory.STORAGE, 'Error deleting question', error as Error, { id });
      console.error('[Uproot] Error deleting question:', error instanceof Error ? error.message : String(error), error);
      throw error;
    }
  });
}

/**
 * Get questions with filters
 */
export async function getQuestions(filters?: QuestionFilters): Promise<SavedQuestion[]> {
  return log.trackAsync(LogCategory.STORAGE, 'getQuestions', async () => {
    try {
      log.debug(LogCategory.STORAGE, 'Getting questions with filters', { filters });

      const bank = await getQuestionBank();
      let questions = [...bank.questions];

      // Apply filters
      if (filters?.search) {
        const searchLower = filters.search.toLowerCase();
        questions = questions.filter((q) =>
          q.question.toLowerCase().includes(searchLower) ||
          q.answer.toLowerCase().includes(searchLower)
        );
      }

      if (filters?.jobId) {
        questions = questions.filter((q) => q.jobId === filters.jobId);
      }

      if (filters?.minRating) {
        questions = questions.filter((q) => (q.userRating || 0) >= filters.minRating!);
      }

      // Apply sorting
      if (filters?.sortBy === 'recent') {
        questions.sort((a, b) => b.savedAt - a.savedAt);
      } else if (filters?.sortBy === 'mostUsed') {
        questions.sort((a, b) => b.usageCount - a.usageCount);
      } else if (filters?.sortBy === 'rating') {
        questions.sort((a, b) => (b.userRating || 0) - (a.userRating || 0));
      }

      // Apply limit
      if (filters?.limit) {
        questions = questions.slice(0, filters.limit);
      }

      log.info(LogCategory.STORAGE, 'Questions retrieved', {
        total: questions.length,
        filters: filters ? Object.keys(filters) : []
      });
      return questions;
    } catch (error) {
      // Silently handle extension context invalidation during reloads
      if (isContextInvalidatedError(error)) {
        return [];
      }
      log.error(LogCategory.STORAGE, 'Error getting questions', error as Error, { filters });
      console.error('[Uproot] Error getting questions:', error instanceof Error ? error.message : String(error), error);
      return [];
    }
  });
}

/**
 * Increment question usage count
 */
export async function incrementQuestionUsage(id: string): Promise<void> {
  return log.trackAsync(LogCategory.STORAGE, 'incrementQuestionUsage', async () => {
    try {
      const bank = await getQuestionBank();
      const question = bank.questions.find((q) => q.id === id);

      if (question) {
        question.usageCount++;
        question.lastUsedAt = Date.now();
        await chrome.storage.local.set({ [QUESTION_BANK_KEY]: bank });
        log.change(LogCategory.STORAGE, 'questionBank', 'update', {
          id,
          usageCount: question.usageCount
        });
      }
    } catch (error) {
      // Silently handle extension context invalidation during reloads
      if (isContextInvalidatedError(error)) {
        return;
      }
      log.error(LogCategory.STORAGE, 'Error incrementing question usage', error as Error, { id });
      console.error('[Uproot] Error incrementing question usage:', error instanceof Error ? error.message : String(error), error);
    }
  });
}

/**
 * Clear all questions (reset to default)
 */
export async function clearQuestionBank(): Promise<void> {
  return log.trackAsync(LogCategory.STORAGE, 'clearQuestionBank', async () => {
    try {
      log.debug(LogCategory.STORAGE, 'Clearing question bank');
      await chrome.storage.local.set({ [QUESTION_BANK_KEY]: DEFAULT_QUESTION_BANK });
      log.change(LogCategory.STORAGE, 'questionBank', 'delete', {});
      console.log('[Uproot] Question bank cleared');
    } catch (error) {
      // Silently handle extension context invalidation during reloads
      if (isContextInvalidatedError(error)) {
        return;
      }
      log.error(LogCategory.STORAGE, 'Error clearing question bank', error as Error);
      console.error('[Uproot] Error clearing question bank:', error instanceof Error ? error.message : String(error), error);
      throw error;
    }
  });
}
