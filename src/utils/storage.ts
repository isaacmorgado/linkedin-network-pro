/**
 * Chrome Storage Utilities
 * Central barrel file that re-exports all storage functions from their respective modules
 */

// ============================================================================
// WATCHLIST PEOPLE FUNCTIONS
// ============================================================================
export {
  getWatchlist,
  saveWatchlist,
  addToWatchlist,
  removeFromWatchlist,
  updateWatchlistPerson,
  isInWatchlist,
} from './storage/watchlist-storage';

// ============================================================================
// COMPANY WATCHLIST FUNCTIONS
// ============================================================================
export {
  getCompanyWatchlist,
  saveCompanyWatchlist,
  addCompanyToWatchlist,
  removeCompanyFromWatchlist,
  updateWatchlistCompany,
  isCompanyInWatchlist,
} from './storage/company-watchlist-storage';

// ============================================================================
// CONNECTION PATH FUNCTIONS
// ============================================================================
export {
  getConnectionPaths,
  saveConnectionPaths,
  addConnectionPath,
  removeConnectionPath,
  updateConnectionPath,
  markStepConnected,
  isConnectionPathSaved,
} from './storage/connection-path-storage';

// ============================================================================
// ONBOARDING FUNCTIONS
// ============================================================================
export {
  getOnboardingState,
  saveOnboardingState,
  completeOnboarding,
  isOnboardingComplete,
} from './storage/onboarding-storage';

// ============================================================================
// FEED FUNCTIONS
// ============================================================================
export {
  getFeedItems,
  saveFeedItems,
  addFeedItem,
  updateFeedItem,
  toggleFeedItemRead,
  markAllFeedItemsAsRead,
  deleteFeedItem,
  getFeedStats,
  clearFeed,
} from './storage/feed-storage';

// ============================================================================
// PROFESSIONAL PROFILE FUNCTIONS
// ============================================================================
export {
  getProfessionalProfile,
  saveProfessionalProfile,
  updatePersonalInfo,
  getProfileStats,
  createProfessionalProfile,
} from './storage/profile-storage';

// ============================================================================
// WORK EXPERIENCE FUNCTIONS
// ============================================================================
export {
  addJobExperience,
  updateJobExperience,
  deleteJobExperience,
  addInternshipExperience,
  updateInternshipExperience,
  deleteInternshipExperience,
  addVolunteerExperience,
  updateVolunteerExperience,
  deleteVolunteerExperience,
} from './storage/experience-storage';

// ============================================================================
// SKILLS & TOOLS FUNCTIONS
// ============================================================================
export {
  addTechnicalSkill,
  updateTechnicalSkill,
  deleteTechnicalSkill,
  addSoftSkill,
  addTool,
  updateTool,
  deleteTool,
  addCertification,
  deleteCertification,
} from './storage/skills-storage';

// ============================================================================
// EDUCATION & PROJECTS FUNCTIONS
// ============================================================================
export {
  addEducation,
  updateEducation,
  deleteEducation,
  addProject,
  updateProject,
  deleteProject,
} from './storage/education-storage';

// ============================================================================
// JOB ANALYSIS FUNCTIONS
// ============================================================================
export {
  getJobDescriptions,
  saveJobDescription,
  getJobDescriptionById,
  deleteJobDescription,
  getJobDescriptionAnalyses,
  getJobDescriptionAnalysis,
  saveJobDescriptionAnalysis,
  deleteJobDescriptionAnalysis,
} from './storage/job-analysis-storage';

// ============================================================================
// GENERATED RESUME FUNCTIONS
// ============================================================================
export {
  getGeneratedResumes,
  saveGeneratedResume,
  getGeneratedResumeById,
  deleteGeneratedResume,
} from './storage/generated-resume-storage';

// ============================================================================
// APPLICATION TRACKING FUNCTIONS
// ============================================================================
export {
  getApplications,
  addApplication,
  updateApplicationStatus,
  deleteApplication,
} from './storage/application-storage';

// ============================================================================
// COVER LETTER FUNCTIONS
// ============================================================================
export {
  getCoverLetters,
  getCoverLetter,
  getCoverLettersForJob,
  createCoverLetter,
  saveCoverLetter,
  updateCoverLetter,
  deleteCoverLetter,
  markCoverLetterAsSent,
  updateCoverLetterOutcome,
  getCoverLetterTemplates,
  getCoverLetterTemplate,
  saveCoverLetterTemplate,
  deleteCoverLetterTemplate,
  getCoverLetterComponents,
  saveCoverLetterComponent,
  getCoverLetterPreferences,
  saveCoverLetterPreferences,
  getCoverLetterAnalytics,
  updateCoverLetterAnalytics,
  recalculateCoverLetterAnalytics,
} from './storage/cover-letter-storage';
