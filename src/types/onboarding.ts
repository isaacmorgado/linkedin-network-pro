/**
 * Onboarding Type Definitions
 * For first-run setup and job preferences
 */

export interface JobPreferences {
  // Job titles or keywords they're looking for
  jobTitles: string[]; // e.g., ["Marketing Manager", "Product Manager"]

  // Experience level
  experienceLevel: ExperienceLevel[];

  // Work location preference
  workLocation: WorkLocationType[];

  // Preferred locations (cities/regions)
  locations: string[]; // e.g., ["New York, NY", "Remote"]

  // Industries of interest (optional)
  industries: string[]; // e.g., ["Technology", "Healthcare"]

  // Salary range (optional)
  salaryRange?: {
    min?: number;
    max?: number;
    currency: 'USD' | 'EUR' | 'GBP' | 'CAD';
  };
}

export type ExperienceLevel =
  | 'internship'
  | 'entry'
  | 'mid'
  | 'senior'
  | 'director'
  | 'executive';

export type WorkLocationType =
  | 'remote'
  | 'hybrid'
  | 'onsite';

export interface OnboardingState {
  isComplete: boolean;
  completedAt?: number; // Timestamp
  currentStep: number; // For resuming onboarding
  preferences?: JobPreferences;
}

// Storage key
export const ONBOARDING_STORAGE_KEY = 'uproot_onboarding';
