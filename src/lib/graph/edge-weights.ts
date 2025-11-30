/**
 * Edge Weight Calculation
 * Computes connection strength between two profiles
 */

import type { LinkedInProfile } from '../../types';

/**
 * Calculate match score between two profiles
 *
 * Scoring breakdown:
 * - Mutual connections: 40 points max
 * - Shared education: 20 points max
 * - Shared companies: 20 points max
 * - Shared skills: 10 points max
 * - Same location: 10 points max
 *
 * @param profile1 First LinkedIn profile
 * @param profile2 Second LinkedIn profile
 * @returns Match score (0-100)
 */
export function getMatchScore(
  profile1: LinkedInProfile,
  profile2: LinkedInProfile
): number {
  let score = 0;
  let maxScore = 0;

  // Mutual connections (40 points max)
  maxScore += 40;
  const mutualCount = profile1.mutualConnections?.length || 0;
  score += Math.min(40, mutualCount * 4);

  // Shared education (20 points max)
  maxScore += 20;
  const sharedSchools = profile1.education?.filter((edu1) =>
    profile2.education?.some((edu2) => edu2.school === edu1.school)
  ).length || 0;
  score += Math.min(20, sharedSchools * 10);

  // Shared previous companies (20 points max)
  maxScore += 20;
  const sharedCompanies = profile1.experience?.filter((exp1) =>
    profile2.experience?.some((exp2) => exp2.company === exp1.company)
  ).length || 0;
  score += Math.min(20, sharedCompanies * 10);

  // Shared skills (10 points max)
  maxScore += 10;
  const sharedSkills = profile1.skills?.filter((skill) =>
    profile2.skills?.includes(skill)
  ).length || 0;
  score += Math.min(10, sharedSkills * 2);

  // Same location (10 points max)
  maxScore += 10;
  if (profile1.location && profile2.location) {
    const loc1 = profile1.location.toLowerCase();
    const loc2 = profile2.location.toLowerCase();

    if (loc1 === loc2) {
      score += 10;
    } else if (loc1.includes(loc2) || loc2.includes(loc1)) {
      score += 5;
    }
  }

  // Convert to percentage
  return maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;
}

/**
 * Calculate edge weight for connection
 * Lower weight = stronger connection = more likely to help
 *
 * @param from Source profile
 * @param to Target profile
 * @param matchScore Pre-calculated match score (0-100)
 * @returns Edge weight (0.1 to 1.0)
 */
export function calculateEdgeWeight(
  from: LinkedInProfile,
  to: LinkedInProfile,
  matchScore: number
): number {
  let weight = 1.0; // Base weight

  // Match score reduces weight
  weight -= (matchScore / 100) * 0.3;

  // Same company gives strong boost
  const sameCompany = from.experience?.[0]?.company === to.experience?.[0]?.company;
  if (sameCompany) {
    weight -= 0.2;
  }

  // Same school
  const sameSchool = from.education?.some((edu1) =>
    to.education?.some((edu2) => edu2.school === edu1.school)
  );
  if (sameSchool) {
    weight -= 0.15;
  }

  // Recent activity (if available)
  const hasRecentActivity = to.recentPosts && to.recentPosts.length > 0;
  if (hasRecentActivity) {
    weight -= 0.1; // More likely to respond if active
  }

  // Ensure weight stays in valid range
  return Math.max(0.1, Math.min(1.0, weight));
}
