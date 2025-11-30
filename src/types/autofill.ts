/**
 * Autofill Type Definitions
 *
 * Data structures for NordPass-style autofill functionality
 * on third-party job application sites.
 */

// ============================================================================
// AUTOFILL PROFILE
// ============================================================================

/**
 * Autofill profile - stored in Account Settings
 *
 * Contains user's personal information for auto-filling job applications.
 * Reuses some fields from ProfessionalProfile but keeps it separate for clarity.
 */
export interface AutofillProfile {
  // Personal Information
  firstName: string;
  lastName: string;
  fullName: string; // Auto-generated from firstName + lastName
  email: string;
  phone: string;
  location: string; // "San Francisco, CA" or "Remote"
  birthday?: string; // "1995-06-15" (ISO format, optional)

  // Address (optional - some sites ask for full address)
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
  };

  // Professional URLs
  linkedinUrl?: string;
  githubUrl?: string;
  portfolioUrl?: string;
  websiteUrl?: string;

  // Professional Summary Fields
  currentJobTitle?: string; // Current or most recent job title
  currentCompany?: string; // Current or most recent company
  totalYearsExperience?: number; // Total years of professional experience

  // Skills (for auto-selection based on JD keywords)
  skills: string[]; // Full list of all skills user has

  // Work Authorization & EEO (optional)
  workAuthorization?: 'us_citizen' | 'green_card' | 'visa' | 'need_sponsorship' | 'prefer_not_to_say';
  veteranStatus?: 'not_veteran' | 'veteran' | 'disabled_veteran' | 'prefer_not_to_say';
  disabilityStatus?: 'yes' | 'no' | 'prefer_not_to_say';
  gender?: 'male' | 'female' | 'non_binary' | 'prefer_not_to_say' | 'self_describe';
  raceEthnicity?: string; // Free-form or specific options depending on site

  // Metadata
  createdAt: number;
  updatedAt: number;
  version: number; // For future migrations
}

/**
 * Default autofill profile (empty)
 */
export const DEFAULT_AUTOFILL_PROFILE: AutofillProfile = {
  firstName: '',
  lastName: '',
  fullName: '',
  email: '',
  phone: '',
  location: '',
  skills: [],
  createdAt: Date.now(),
  updatedAt: Date.now(),
  version: 1,
};

// ============================================================================
// QUESTION BANK
// ============================================================================

/**
 * Saved question with AI-generated answer
 *
 * Users can save common application questions and get AI-generated
 * answers based on their profile and the specific job description.
 */
export interface SavedQuestion {
  id: string; // Unique ID (e.g., "question-1234567890")
  question: string; // The actual question text
  answer: string; // AI-generated answer (or manually edited)

  // Context
  jobId?: string; // Associated job description ID (if generated for specific job)
  keywords: string[]; // Extracted keywords from JD (used for answer generation)

  // Metadata
  savedAt: number;
  updatedAt: number;
  lastUsedAt?: number; // Track when question was last used
  usageCount: number; // How many times this question was used

  // Answer quality (optional - for future ML improvements)
  userRating?: 1 | 2 | 3 | 4 | 5; // User can rate answer quality
  wasEdited: boolean; // Did user manually edit the AI-generated answer?
}

/**
 * Question bank - collection of saved questions
 */
export interface QuestionBank {
  questions: SavedQuestion[];

  // Stats (optional - for UI display)
  totalQuestions?: number;
  mostUsedQuestions?: SavedQuestion[];
  recentQuestions?: SavedQuestion[];
}

/**
 * Default question bank (empty)
 */
export const DEFAULT_QUESTION_BANK: QuestionBank = {
  questions: [],
};

// ============================================================================
// AUTOFILL SESSION
// ============================================================================

/**
 * Autofill session - tracks current autofill operation
 *
 * Used to remember which fields were filled, what values were used,
 * and provide undo functionality.
 */
export interface AutofillSession {
  id: string; // Session ID (e.g., "session-1234567890")
  url: string; // URL of the job application
  atsSystem: string | null; // Detected ATS system (greenhouse, lever, etc.)

  // Fields that were filled
  filledFields: Array<{
    fieldType: string; // FormFieldType
    value: string;
    element: {
      id: string;
      name: string;
      label: string | null;
    };
    filledAt: number;
  }>;

  // Session metadata
  startedAt: number;
  completedAt?: number;
  wasSuccessful?: boolean; // Did user submit the form?
}

// ============================================================================
// STORAGE KEYS
// ============================================================================

/**
 * Chrome storage keys for autofill data
 */
export const AUTOFILL_PROFILE_KEY = 'uproot_autofill_profile';
export const QUESTION_BANK_KEY = 'uproot_question_bank';
export const AUTOFILL_SESSIONS_KEY = 'uproot_autofill_sessions';

// ============================================================================
// HELPER TYPES
// ============================================================================

/**
 * Autofill profile update (partial)
 */
export type AutofillProfileUpdate = Partial<Omit<AutofillProfile, 'createdAt' | 'version'>>;

/**
 * Question update (partial)
 */
export type QuestionUpdate = Partial<Omit<SavedQuestion, 'id' | 'savedAt'>>;

/**
 * Question filter options
 */
export interface QuestionFilters {
  search?: string; // Search in question text
  jobId?: string; // Filter by job ID
  minRating?: number; // Minimum user rating
  sortBy?: 'recent' | 'mostUsed' | 'rating'; // Sort order
  limit?: number; // Max results
}
