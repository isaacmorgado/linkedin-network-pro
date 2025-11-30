/**
 * Industry Matching Logic
 * Calculates industry overlap scores with exact and related matching
 *
 * Research Foundation:
 * - Organization overlap is primary signal (LinkedIn PYMK algorithm)
 * - Same industry connections: 22-28% acceptance rate
 * - Based on B2B outreach benchmarks and LinkedIn PYMK analysis
 */

import type { UserProfile } from '../../../types/resume-tailoring';
import type { ProfileSimilarityConfig } from './config-types';
import { DEFAULT_INDUSTRY_THRESHOLDS } from './threshold-types';
import { areIndustriesRelated } from '../../../lib/industry-mapping';

/**
 * Calculate industry overlap score
 *
 * Scoring (research-backed):
 * - Exact industry match → 1.0
 * - Related industries (from mapping) → 0.6
 * - No overlap → 0.0
 *
 * Research: Same industry connections have 22-28% acceptance rate
 * (B2B outreach benchmarks, LinkedIn PYMK analysis)
 *
 * @param p1 - First user profile
 * @param p2 - Second user profile
 * @param config - Optional configuration
 * @returns Industry similarity score (0-1)
 */
export function calculateIndustryOverlap(
  p1: UserProfile,
  p2: UserProfile,
  config?: ProfileSimilarityConfig
): number {
  // Handle missing work experience
  if (
    !p1.workExperience ||
    !p2.workExperience ||
    p1.workExperience.length === 0 ||
    p2.workExperience.length === 0
  ) {
    return 0;
  }

  const thresholds = {
    ...DEFAULT_INDUSTRY_THRESHOLDS,
    ...config?.industryThresholds,
  };

  // Extract industries (some WorkExperience entries may not have industry field)
  const industries1 = new Set(
    p1.workExperience
      .map((e) => (e as any).industry)
      .filter(Boolean)
      .map((i: string) => i)
  );
  const industries2 = new Set(
    p2.workExperience
      .map((e) => (e as any).industry)
      .filter(Boolean)
      .map((i: string) => i)
  );

  // No industries to compare
  if (industries1.size === 0 || industries2.size === 0) {
    return 0;
  }

  // Check for exact match (case-insensitive)
  const exactMatch = [...industries1].some((i1) =>
    [...industries2].some((i2) => i1.toLowerCase() === i2.toLowerCase())
  );

  if (exactMatch) {
    return thresholds.exactMatch; // 1.0
  }

  // Check for related industries
  const relatedMatch = [...industries1].some((i1) =>
    [...industries2].some((i2) => areIndustriesRelated(i1, i2))
  );

  if (relatedMatch) {
    return thresholds.relatedIndustries; // 0.6
  }

  return thresholds.noOverlap; // 0.0
}
