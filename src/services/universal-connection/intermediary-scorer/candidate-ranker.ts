/**
 * Candidate Ranking
 * Scores and ranks intermediary candidates
 *
 * Uses geometric mean for path strength to ensure both links are strong:
 * - Path (0.9, 0.6) gets sqrt(0.54) = 0.73
 * - Path (0.75, 0.75) gets sqrt(0.56) = 0.75 (better!)
 */

import type { UserProfile } from '../../../types/resume-tailoring';
import type { IntermediaryCandidate } from './types';
import { calculateProfileSimilarity } from '../profile-similarity';

/**
 * Score a single intermediary candidate
 *
 * Uses geometric mean for path strength to ensure both links are strong:
 * - Path (0.9, 0.6) gets sqrt(0.54) = 0.73
 * - Path (0.75, 0.75) gets sqrt(0.56) = 0.75 (better!)
 *
 * @param source Source user
 * @param intermediary Intermediary candidate
 * @param target Target user
 * @param direction 'outbound' (easier) or 'inbound' (harder)
 * @param simFromSource Similarity: source → intermediary
 * @param simToTarget Similarity: intermediary → target
 * @returns IntermediaryCandidate with score and metadata
 */
export function scoreIntermediary(
  source: UserProfile,
  intermediary: UserProfile,
  target: UserProfile,
  direction: 'outbound' | 'inbound',
  simFromSource?: number,
  simToTarget?: number
): IntermediaryCandidate {
  // Calculate similarities if not provided
  const simFrom =
    simFromSource ?? calculateProfileSimilarity(source, intermediary).overall;
  const simTo =
    simToTarget ?? calculateProfileSimilarity(intermediary, target).overall;

  // Path strength: geometric mean (ensures both links are strong)
  const pathStrength = Math.sqrt(simFrom * simTo);

  // Direction weighting:
  // - Outbound (your connections): 0.8x (easier - you control outreach)
  // - Inbound (target's connections): 0.6x (harder - need to reach their connections first)
  const directionMultiplier = direction === 'outbound' ? 0.8 : 0.6;
  const score = pathStrength * directionMultiplier;

  // Estimate acceptance rate
  const estimatedAcceptance = estimateAcceptanceRate(pathStrength, direction);

  // Generate reasoning
  const reasoning =
    direction === 'outbound'
      ? `${intermediary.name} is similar to ${target.name} (${(simTo * 100).toFixed(0)}% match). You can introduce them!`
      : `${intermediary.name} is similar to you (${(simFrom * 100).toFixed(0)}% match) and connected to ${target.name}. Connect with them first!`;

  return {
    person: intermediary,
    score,
    pathStrength,
    bridgeQuality: 0, // Future enhancement: betweenness centrality
    estimatedAcceptance,
    reasoning,
    direction,
    sourceToIntermediary: simFrom,
    intermediaryToTarget: simTo,
  };
}

/**
 * Estimate acceptance rate based on path strength
 *
 * Research-backed formula:
 * - 0.75+ path strength → 40% acceptance (near "same school" quality)
 * - 0.60-0.75 → 32% acceptance (between "same industry" and "same school")
 * - 0.50-0.60 → 25% acceptance (slightly above "same industry")
 * - <0.50 → 18% acceptance (near "no commonalities")
 *
 * Direction adjustment:
 * - Inbound paths: 75% of base rate (harder to reach target's connections first)
 *
 * @param pathStrength Geometric mean of both similarity links (0-1)
 * @param direction 'outbound' or 'inbound'
 * @returns Acceptance rate (0-1)
 */
export function estimateAcceptanceRate(
  pathStrength: number,
  direction: 'outbound' | 'inbound'
): number {
  let baseRate: number;

  if (pathStrength >= 0.75) {
    baseRate = 0.40; // Near "same school" quality
  } else if (pathStrength >= 0.60) {
    baseRate = 0.32; // Between "same industry" and "same school"
  } else if (pathStrength >= 0.50) {
    baseRate = 0.25; // Slightly above "same industry"
  } else {
    baseRate = 0.18; // Near "no commonalities"
  }

  // Adjust for direction
  if (direction === 'inbound') {
    baseRate *= 0.75; // Harder to reach target's connections first
  }

  return baseRate;
}
