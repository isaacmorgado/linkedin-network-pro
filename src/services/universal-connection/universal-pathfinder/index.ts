/**
 * Universal Pathfinder
 * Main orchestrator for LinkedIn universal connection pathfinding
 *
 * Multi-stage algorithm that tries strategies in order of preference:
 * 1. Mutual connections (existing A* algorithm)
 * 2. Direct similarity (> 0.65)
 * 3. Engagement bridge (who target engages with) - NEW
 * 4. Company bridge (colleagues at target's company) - NEW
 * 5. Intermediary matching (score > 0.35)
 * 6. Cold similarity (> 0.45)
 * 7. Cold outreach (< 0.45)
 * 8. Semantic fallback (AI-based when no path exists) - NEW
 *
 * GUARANTEE: NEVER returns 'none' - every target gets a viable next step
 *
 * Research Foundation:
 * - LinkedIn PYMK algorithm
 * - Academic link prediction research
 * - B2B outreach benchmarks
 */

import type { UserProfile } from '../../../types/resume-tailoring';
import type { ConnectionStrategy, Graph } from '../universal-connection-types';
import { calculateProfileSimilarity } from '../intermediary-scorer';
import { tryMutualConnectionStrategy } from './strategy-mutual';
import { tryDirectSimilarityStrategy } from './strategy-direct';
import { tryEngagementBridgeStrategy } from './strategy-engagement-bridge';
import { tryCompanyBridgeStrategy } from './strategy-company-bridge';
import { tryIntermediaryStrategy } from './strategy-intermediary';
import { tryColdSimilarityStrategy } from './strategy-cold';
import { trySemanticFallbackStrategy } from './strategy-semantic-fallback';

/**
 * Find universal connection path to anyone on LinkedIn
 *
 * Tries multiple strategies in order:
 * 1. Mutual connections via A* (best option)
 * 2. Direct high similarity (> 0.65)
 * 3. Engagement bridge (who target engages with)
 * 4. Company bridge (colleagues at target's company)
 * 5. Intermediary matching via similarity
 * 6. Cold similarity-based outreach (> 0.45)
 * 7. Cold outreach with fallback candidate (< 0.45)
 * 8. Semantic fallback (AI-based similarity)
 *
 * GUARANTEE: ALWAYS returns a viable strategy - NEVER returns type 'none'
 *
 * @param sourceUser Your profile
 * @param targetUser Target person's profile
 * @param graph Network graph with connections
 * @returns ConnectionStrategy with type, confidence, acceptance rate, and next steps
 */
export async function findUniversalConnection(
  sourceUser: UserProfile,
  targetUser: UserProfile,
  graph: Graph
): Promise<ConnectionStrategy> {
  // ========================================================================
  // STAGE 1: Mutual Connections (Use Existing A* Algorithm)
  // ========================================================================

  const mutualStrategy = await tryMutualConnectionStrategy(sourceUser, targetUser, graph);
  if (mutualStrategy) {
    return mutualStrategy;
  }

  // ========================================================================
  // STAGE 2: Direct High Similarity (> 0.65)
  // ========================================================================

  const directSimilarity = calculateProfileSimilarity(sourceUser, targetUser);

  const directStrategy = tryDirectSimilarityStrategy(sourceUser, targetUser, directSimilarity);
  if (directStrategy) {
    return directStrategy;
  }

  // ========================================================================
  // STAGE 3: Engagement Bridge (NEW - Week 2)
  // Find paths through people who actively engage with target
  // ========================================================================

  const engagementStrategy = await tryEngagementBridgeStrategy(sourceUser, targetUser, graph);
  if (engagementStrategy) {
    return engagementStrategy;
  }

  // ========================================================================
  // STAGE 4: Company Bridge (NEW - Week 2)
  // Find paths through colleagues at target's company
  // ========================================================================

  const companyStrategy = await tryCompanyBridgeStrategy(sourceUser, targetUser, graph);
  if (companyStrategy) {
    return companyStrategy;
  }

  // ========================================================================
  // STAGE 5: Intermediary Matching
  // ========================================================================

  const intermediaryStrategy = await tryIntermediaryStrategy(sourceUser, targetUser, graph);
  if (intermediaryStrategy) {
    return intermediaryStrategy;
  }

  // ========================================================================
  // STAGE 6: Cold Similarity (0.45-0.65) or Cold Outreach (< 0.45)
  // GUARANTEE: This stage NEVER returns null - always provides a strategy
  // ========================================================================

  const coldStrategy = await tryColdSimilarityStrategy(sourceUser, targetUser, directSimilarity, graph);

  // Cold strategy always returns, but try semantic fallback if it's low confidence
  if (coldStrategy.lowConfidence) {
    // ========================================================================
    // STAGE 7: Semantic Fallback (NEW - Week 2)
    // AI-based similarity when no good graph path exists
    // ========================================================================

    try {
      const semanticStrategy = await trySemanticFallbackStrategy(sourceUser, targetUser);
      // If semantic has higher confidence, use it
      if (semanticStrategy.confidence > coldStrategy.confidence) {
        return semanticStrategy;
      }
    } catch (error) {
      console.log('[Pathfinder] Semantic fallback unavailable, using cold strategy');
    }
  }

  return coldStrategy;
}

// Re-export all public functions and utilities
export { findNodeIdInGraph } from './strategy-mutual';
export { getTopSimilarities } from './strategy-direct';
export { mapSimilarityToAcceptanceRate, trackConnectionResult, calculateCalibrationMetrics } from './acceptance-rates';
export { batchDiscoverConnections, compareStrategies } from './batch-processor';
