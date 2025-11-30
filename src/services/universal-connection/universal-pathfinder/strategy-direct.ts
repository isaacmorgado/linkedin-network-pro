/**
 * Direct Similarity Strategy (Stage 2)
 * High similarity connections (>= 0.65) - "same school" quality
 */

import type { UserProfile } from '../../../types/resume-tailoring';
import type { ConnectionStrategy, ProfileSimilarity } from '../universal-connection-types';

/**
 * Get top similarities from breakdown (for UI display)
 *
 * Returns human-readable string like:
 * - "industry and skills"
 * - "education and location"
 * - "skills"
 *
 * @param breakdown Similarity breakdown by attribute
 * @returns Human-readable similarity description
 */
export function getTopSimilarities(
  breakdown: ProfileSimilarity['breakdown']
): string {
  const sorted = Object.entries(breakdown)
    .filter(([_, score]) => score > 0.5)
    .sort(([_, a], [__, b]) => b - a)
    .map(([attr]) => attr);

  if (sorted.length === 0) return 'background';
  if (sorted.length === 1) return sorted[0];
  return `${sorted[0]} and ${sorted[1]}`;
}

/**
 * Generate action items for direct similarity strategy
 */
export function generateDirectSimilarityNextSteps(
  target: UserProfile,
  similarity: ProfileSimilarity
): string[] {
  const topSims = getTopSimilarities(similarity.breakdown);

  return [
    `Direct message ${target.name}`,
    `Mention shared ${topSims} in your message`,
    `Reference specific recent posts or achievements`,
    `Keep message concise (200-250 characters)`,
    `Include clear value proposition`,
  ];
}

/**
 * Attempt direct high similarity strategy
 */
export function tryDirectSimilarityStrategy(
  _sourceUser: UserProfile,
  targetUser: UserProfile,
  directSimilarity: ProfileSimilarity
): ConnectionStrategy | null {
  if (directSimilarity.overall < 0.65) {
    return null;
  }

  // High similarity = "same school" quality connection
  const acceptanceRate = 0.35 + (directSimilarity.overall - 0.65) * (0.07 / 0.35); // 35-42%

  return {
    type: 'direct-similarity',
    confidence: directSimilarity.overall,
    directSimilarity,
    estimatedAcceptanceRate: acceptanceRate,
    reasoning: `Very high profile similarity (${(directSimilarity.overall * 100).toFixed(1)}%): ${getTopSimilarities(directSimilarity.breakdown)}`,
    nextSteps: generateDirectSimilarityNextSteps(
      targetUser,
      directSimilarity
    ),
  };
}
