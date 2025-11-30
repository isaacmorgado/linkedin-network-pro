/**
 * Intermediary Scorer - Barrel Export
 * Re-exports all functionality from the refactored intermediary-scorer module
 *
 * This file maintains backward compatibility while keeping the codebase
 * organized according to the 300-line rule.
 *
 * IMPORTANT: The duplicate profile similarity calculation functions have been removed.
 * All similarity calculations should now use the functions from '../profile-similarity'.
 */

// Re-export everything from the refactored module
export * from './intermediary-scorer/index';

// Re-export similarity functions from the canonical source
export {
  calculateProfileSimilarity,
  calculateSkillJaccardSimilarity,
  calculateEducationOverlap,
  calculateCompanyHistoryJaccard,
  calculateLocationSimilarity,
  calculateIndustryOverlap,
} from './profile-similarity';
