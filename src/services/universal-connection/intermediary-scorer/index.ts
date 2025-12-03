/**
 * Intermediary Scorer
 * Find and score best intermediaries when no mutual connections exist
 *
 * Strategy:
 * 1. Outbound: Your connections who are SIMILAR to target
 * 2. Inbound: Target's connections who are SIMILAR to you
 *
 * GUARANTEE: Always returns at least one candidate (never empty array)
 *
 * Research Foundation:
 * - Uses geometric mean for path strength (ensures both links are strong)
 * - Limits to 500 connections per user for performance
 * - Returns top 5 intermediaries sorted by score
 * - Falls back to best available candidate if no strong matches found
 */

import type { UserProfile } from '../../../types/resume-tailoring';
import type { IntermediaryCandidate } from './types';
import { calculateProfileSimilarity } from '../profile-similarity';
import { sampleConnections } from './connection-sampler';
import { scoreIntermediary } from './candidate-ranker';

/**
 * Find best intermediaries between source and target
 *
 * Two strategies:
 * 1. Outbound: Your connections who are SIMILAR to target (you reach out)
 * 2. Inbound: Target's connections who are SIMILAR to you (requires reaching their connections first)
 *
 * GUARANTEE: Always returns at least one candidate if any connections exist
 *
 * @param sourceUser Your profile
 * @param targetUser Target person's profile
 * @param sourceConnections Your 1st-degree connections
 * @param targetConnections Target's 1st-degree connections
 * @returns Top 5 intermediary candidates sorted by score (guaranteed non-empty if connections exist)
 */
export function findBestIntermediaries(
  sourceUser: UserProfile,
  targetUser: UserProfile,
  sourceConnections: UserProfile[],
  targetConnections: UserProfile[]
): IntermediaryCandidate[] {
  const goodCandidates: IntermediaryCandidate[] = []; // Candidates with similarity > 0.35
  const allCandidates: IntermediaryCandidate[] = []; // All candidates for fallback

  // Sample connections for performance (limit to 500)
  const sampledSourceConnections = sampleConnections(sourceConnections, 500);
  const sampledTargetConnections = sampleConnections(targetConnections, 500);

  // Strategy 1: Your connections who are SIMILAR to target (Outbound)
  for (const yourConnection of sampledSourceConnections.sampled) {
    // Skip if this connection is the target person themselves
    if (yourConnection.id === targetUser.id || yourConnection.email === targetUser.email) {
      continue;
    }

    const simToTarget = calculateProfileSimilarity(yourConnection, targetUser);
    const simFromYou = calculateProfileSimilarity(sourceUser, yourConnection);

    const candidate = scoreIntermediary(
      sourceUser,
      yourConnection,
      targetUser,
      'outbound',
      simFromYou.overall,
      simToTarget.overall
    );

    allCandidates.push(candidate);

    // Prefer candidates with good similarity to target (> 0.35)
    if (simToTarget.overall > 0.35) {
      goodCandidates.push(candidate);
    }
  }

  // Strategy 2: Target's connections who are SIMILAR to you (Inbound)
  for (const theirConnection of sampledTargetConnections.sampled) {
    // Skip if this connection is the source person themselves
    if (theirConnection.id === sourceUser.id || theirConnection.email === sourceUser.email) {
      continue;
    }

    const simToYou = calculateProfileSimilarity(theirConnection, sourceUser);
    const simToTarget = calculateProfileSimilarity(theirConnection, targetUser);

    const candidate = scoreIntermediary(
      sourceUser,
      theirConnection,
      targetUser,
      'inbound',
      simToYou.overall,
      simToTarget.overall
    );

    allCandidates.push(candidate);

    // Prefer candidates with good similarity to you (> 0.35)
    if (simToYou.overall > 0.35) {
      goodCandidates.push(candidate);
    }
  }

  // Sort by score
  goodCandidates.sort((a, b) => b.score - a.score);
  allCandidates.sort((a, b) => b.score - a.score);

  // Return top 5 good candidates if we have any
  if (goodCandidates.length > 0) {
    return goodCandidates.slice(0, 5);
  }

  // Fallback: Return top candidate from all candidates (even if low similarity)
  // This ensures we ALWAYS return at least one option if any connections exist
  if (allCandidates.length > 0) {
    console.log('[IntermediaryScorer] No strong candidates found, returning best available (low confidence)');
    return [allCandidates[0]]; // Return just the top 1 to indicate low confidence
  }

  // Absolutely no connections available - return empty array
  // (This will trigger the cold outreach fallback)
  return [];
}

// Re-export all public functions and types
export { sampleConnections } from './connection-sampler';
export { scoreIntermediary, estimateAcceptanceRate } from './candidate-ranker';
export { ProfileSimilarityCache } from './cache';
export * from './types';

// Note: This file intentionally does NOT re-export the duplicate similarity calculation
// functions that were in the original file. Users should import from '../profile-similarity'
// for all similarity calculations to maintain a single source of truth.
