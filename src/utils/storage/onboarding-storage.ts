/**
 * Onboarding Storage Module
 * Handles storage operations for onboarding state
 */

import { log, LogCategory } from '../logger';
import type { OnboardingState, JobPreferences } from '../../types/onboarding';
import { ONBOARDING_STORAGE_KEY } from '../../types/onboarding';
import { isContextInvalidatedError } from './helpers';

// Get onboarding state
export async function getOnboardingState(): Promise<OnboardingState> {
  return log.trackAsync(LogCategory.STORAGE, 'getOnboardingState', async () => {
    try {
      log.debug(LogCategory.STORAGE, 'Fetching onboarding state from storage');
      const result = await chrome.storage.local.get(ONBOARDING_STORAGE_KEY);
      const state = result[ONBOARDING_STORAGE_KEY] || {
        isComplete: false,
        currentStep: 0,
      };
      log.info(LogCategory.STORAGE, 'Onboarding state retrieved', { isComplete: state.isComplete, currentStep: state.currentStep });
      console.log('[Uproot] Retrieved onboarding state:', state);
      return state;
    } catch (error) {
      // Silently handle extension context invalidation during reloads
      if (isContextInvalidatedError(error)) {
        return {
          isComplete: false,
          currentStep: 0,
        };
      }
      // Log other errors normally
      log.error(LogCategory.STORAGE, 'Error getting onboarding state', { error });
      console.error('[Uproot] Error getting onboarding state:', error);
      return {
        isComplete: false,
        currentStep: 0,
      };
    }
  });
}

// Save onboarding state
export async function saveOnboardingState(state: OnboardingState): Promise<void> {
  return log.trackAsync(LogCategory.STORAGE, 'saveOnboardingState', async () => {
    try {
      log.debug(LogCategory.STORAGE, 'Saving onboarding state to storage', { isComplete: state.isComplete, currentStep: state.currentStep });
      await chrome.storage.local.set({ [ONBOARDING_STORAGE_KEY]: state });
      log.change(LogCategory.STORAGE, 'onboarding', 'update', { isComplete: state.isComplete, currentStep: state.currentStep });
      console.log('[Uproot] Onboarding state saved:', state);
    } catch (error) {
      // Silently handle extension context invalidation during reloads
      if (isContextInvalidatedError(error)) {
        return;
      }
      // Log and throw other errors normally
      log.error(LogCategory.STORAGE, 'Error saving onboarding state', { error, state });
      console.error('[Uproot] Error saving onboarding state:', error);
      throw error;
    }
  });
}

// Complete onboarding with preferences
export async function completeOnboarding(preferences: JobPreferences): Promise<void> {
  return log.trackAsync(LogCategory.STORAGE, 'completeOnboarding', async () => {
    log.debug(LogCategory.STORAGE, 'Completing onboarding', { preferences });
    const state: OnboardingState = {
      isComplete: true,
      completedAt: Date.now(),
      currentStep: 3, // Final step
      preferences,
    };
    await saveOnboardingState(state);
    log.change(LogCategory.STORAGE, 'onboarding', 'complete', { preferences });
    console.log('[Uproot] Onboarding completed with preferences');
  });
}

// Check if onboarding is complete
export async function isOnboardingComplete(): Promise<boolean> {
  return log.trackAsync(LogCategory.STORAGE, 'isOnboardingComplete', async () => {
    log.debug(LogCategory.STORAGE, 'Checking if onboarding is complete');
    const state = await getOnboardingState();
    log.info(LogCategory.STORAGE, 'Onboarding completion check', { isComplete: state.isComplete });
    return state.isComplete;
  });
}
