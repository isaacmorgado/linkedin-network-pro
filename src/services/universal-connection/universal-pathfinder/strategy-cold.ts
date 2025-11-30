/**
 * Cold Similarity Strategy (Stage 4 & 5)
 * - Stage 4: Moderate similarity (0.45-0.65) - cold outreach with personalization
 * - Stage 5: Low similarity (<0.45) - cold outreach with fallback candidate
 */

import type { UserProfile } from '../../../types/resume-tailoring';
import type { ConnectionStrategy, ProfileSimilarity, Graph, IntermediaryCandidate } from '../universal-connection-types';
import { getTopSimilarities } from './strategy-direct';

/**
 * Generate action items for cold similarity strategy
 */
export function generateColdSimilarityNextSteps(
  target: UserProfile,
  similarity: ProfileSimilarity
): string[] {
  const topSims = getTopSimilarities(similarity.breakdown);

  return [
    `Research ${target.name}'s recent posts and articles`,
    `Craft highly personalized message (200-250 characters)`,
    `Mention specific shared interests: ${topSims}`,
    `Include clear value proposition`,
    `Follow up with engagement on their content`,
  ];
}

/**
 * Generate action items for cold outreach strategy (low similarity)
 */
export function generateColdOutreachNextSteps(target: UserProfile, similarity: ProfileSimilarity): string[] {
  return [
    `Build your profile first (add relevant skills matching ${target.name}'s domain)`,
    `Engage with ${target.name}'s content regularly (comment thoughtfully, share)`,
    `Look for alternative paths via LinkedIn events, webinars, or mutual groups`,
    `Consider joining professional organizations in ${target.name}'s industry`,
    `Build credibility through content creation in shared interest areas`,
    similarity.breakdown.skills > 0.2
      ? `Highlight any technical overlaps in connection message`
      : `Focus on value proposition rather than commonalities`,
  ];
}

/**
 * Find a fallback semantic candidate for low-similarity cold outreach
 *
 * Strategy:
 * 1. If graph has nodes, return highest-degree connection as gateway suggestion
 * 2. Return undefined for direct outreach as last resort
 */
export async function findFallbackCandidate(
  sourceUser: UserProfile,
  _targetUser: UserProfile,
  graph: Graph
): Promise<IntermediaryCandidate | undefined> {
  try {
    // Get source user ID with fallbacks
    const sourceId = sourceUser.id || sourceUser.email || sourceUser.url;
    if (!sourceId) {
      return undefined;
    }

    // Try to get source's connections
    const connections = await graph.getConnections(sourceId);

    if (connections && connections.length > 0) {
      // Find connection with most connections (highest degree)
      // This is a heuristic for "most well-connected person you know"
      const mostConnected = connections.reduce((best, current) => {
        // Simple heuristic: prefer connections with more complete profiles
        const currentScore = (current.skills?.length || 0) +
                           (current.workExperience?.length || 0) * 2 +
                           (current.education?.length || 0);
        const bestScore = (best.skills?.length || 0) +
                         (best.workExperience?.length || 0) * 2 +
                         (best.education?.length || 0);
        return currentScore > bestScore ? current : best;
      });

      return {
        person: mostConnected,
        score: 0.15, // Low score to indicate fallback
        pathStrength: 0.15,
        bridgeQuality: 0,
        estimatedAcceptance: 0.12,
        reasoning: `Suggested gateway: ${mostConnected.name} (your most connected contact). Consider building relationship first.`,
        direction: 'outbound',
        sourceToIntermediary: 0.5, // Assuming you know your own connection
        intermediaryToTarget: 0.1, // Unknown similarity
      };
    }
  } catch (error) {
    console.warn('[Cold Strategy] Failed to find fallback candidate:', error);
  }

  // Absolute last resort: suggest direct approach
  return undefined;
}

/**
 * Attempt cold similarity strategy or cold outreach with fallback
 *
 * GUARANTEE: This function NEVER returns type 'none'
 * - Stage 4: Similarity >= 0.45 → 'cold-similarity'
 * - Stage 5: Similarity < 0.45 → 'cold-outreach' with fallback candidate
 */
export async function tryColdSimilarityStrategy(
  sourceUser: UserProfile,
  targetUser: UserProfile,
  directSimilarity: ProfileSimilarity,
  graph: Graph
): Promise<ConnectionStrategy> {
  if (directSimilarity.overall >= 0.45) {
    // Stage 4: Moderate similarity - cold outreach with personalization
    const acceptanceRate = 0.18 + (directSimilarity.overall - 0.45) * (0.07 / 0.20); // 18-25%

    return {
      type: 'cold-similarity',
      confidence: directSimilarity.overall,
      directSimilarity,
      estimatedAcceptanceRate: acceptanceRate,
      reasoning: `Moderate profile similarity (${(directSimilarity.overall * 100).toFixed(1)}%). Cold outreach with personalization recommended.`,
      nextSteps: generateColdSimilarityNextSteps(targetUser, directSimilarity),
    };
  }

  // Stage 5: Low similarity - ALWAYS provide cold outreach strategy (never return 'none')
  const fallbackCandidate = await findFallbackCandidate(sourceUser, targetUser, graph);

  // Calculate acceptance rate with slight boost if we have a fallback candidate
  const baseRate = 0.12; // Pure cold outreach baseline
  const similarityBoost = directSimilarity.overall * 0.08; // Up to +8% for any similarity
  const candidateBoost = fallbackCandidate ? 0.02 : 0; // +2% if we suggest a gateway
  const acceptanceRate = baseRate + similarityBoost + candidateBoost;

  return {
    type: 'cold-outreach',
    confidence: Math.max(0.1, directSimilarity.overall), // Minimum 10% confidence
    directSimilarity,
    candidate: fallbackCandidate,
    lowConfidence: true, // Flag for UI to show appropriate messaging
    estimatedAcceptanceRate: acceptanceRate,
    reasoning: fallbackCandidate
      ? `Limited profile overlap (${(directSimilarity.overall * 100).toFixed(1)}%). Consider indirect approach via ${fallbackCandidate.person.name} or value-first engagement.`
      : `Limited profile overlap (${(directSimilarity.overall * 100).toFixed(1)}%). Recommended approach: value-first cold outreach with strong personalization.`,
    nextSteps: generateColdOutreachNextSteps(targetUser, directSimilarity),
  };
}
