/**
 * Batch Processing
 * Processes multiple targets in parallel for "Discover Connections" feature
 */

import type { UserProfile } from '../../../types/resume-tailoring';
import type { ConnectionStrategy, Graph } from '../universal-connection-types';
import { findUniversalConnection } from './index';
import { calculateProfileSimilarity, findBestIntermediaries } from '../intermediary-scorer';
import { mapSimilarityToAcceptanceRate } from './acceptance-rates';
import { findNodeIdInGraph } from './strategy-mutual';
import { generateDirectSimilarityNextSteps, getTopSimilarities as _getTopSimilarities } from './strategy-direct';
import { generateColdSimilarityNextSteps } from './strategy-cold';
import { generateIntermediaryNextSteps } from './strategy-intermediary';

/**
 * Batch discover connections for multiple targets
 *
 * Processes targets in parallel batches of 100
 * Filters out low-confidence matches (< 0.45)
 *
 * @param sourceUser Your profile
 * @param targetUsers List of target profiles
 * @param graph Network graph
 * @returns Array of ConnectionStrategy sorted by confidence
 */
export async function batchDiscoverConnections(
  sourceUser: UserProfile,
  targetUsers: UserProfile[],
  graph: Graph
): Promise<ConnectionStrategy[]> {
  const BATCH_SIZE = 100;
  const results: ConnectionStrategy[] = [];

  for (let i = 0; i < targetUsers.length; i += BATCH_SIZE) {
    const batch = targetUsers.slice(i, i + BATCH_SIZE);

    const batchResults = await Promise.all(
      batch.map((target) => findUniversalConnection(sourceUser, target, graph))
    );

    results.push(...batchResults);
  }

  // Only recommend good matches (confidence > 0.45)
  return results
    .filter((r) => r.confidence > 0.45)
    .sort((a, b) => b.confidence - a.confidence);
}

/**
 * Compare multiple strategies for a given connection
 *
 * Useful for:
 * - A/B testing different approaches
 * - Showing alternative paths to user
 * - Validating acceptance rate predictions
 *
 * @param sourceUser Your profile
 * @param targetUser Target person's profile
 * @param graph Network graph
 * @returns Array of all valid strategies sorted by confidence
 */
export async function compareStrategies(
  sourceUser: UserProfile,
  targetUser: UserProfile,
  graph: Graph
): Promise<ConnectionStrategy[]> {
  const strategies: ConnectionStrategy[] = [];

  // Get the recommended strategy
  const recommended = await findUniversalConnection(sourceUser, targetUser, graph);
  strategies.push(recommended);

  // Calculate direct similarity (if not already tried)
  if (recommended.type !== 'direct-similarity' && recommended.type !== 'cold-similarity') {
    const directSimilarity = calculateProfileSimilarity(sourceUser, targetUser);

    if (directSimilarity.overall >= 0.45) {
      const acceptanceRate = mapSimilarityToAcceptanceRate(directSimilarity.overall);

      strategies.push({
        type: directSimilarity.overall >= 0.65 ? 'direct-similarity' : 'cold-similarity',
        confidence: directSimilarity.overall,
        directSimilarity,
        estimatedAcceptanceRate: acceptanceRate,
        reasoning: `Alternative: Direct outreach (${(directSimilarity.overall * 100).toFixed(1)}% similarity)`,
        nextSteps: directSimilarity.overall >= 0.65
          ? generateDirectSimilarityNextSteps(targetUser, directSimilarity)
          : generateColdSimilarityNextSteps(targetUser, directSimilarity),
      });
    }
  }

  // Try finding intermediaries (if not already recommended)
  if (recommended.type !== 'intermediary') {
    try {
      // Find node IDs in graph
      const sourceId = findNodeIdInGraph(graph, sourceUser);
      const targetId = findNodeIdInGraph(graph, targetUser);

      if (!sourceId || !targetId) {
        throw new Error(
          'Unable to find profiles in your network. Please visit more LinkedIn profiles to expand your network graph.'
        );
      }

      const sourceConnections = await graph.getConnections(sourceId);
      const targetConnections = await graph.getConnections(targetId);

      const intermediaries = findBestIntermediaries(
        sourceUser,
        targetUser,
        sourceConnections,
        targetConnections
      );

      if (intermediaries.length > 0 && intermediaries[0].score > 0.35) {
        const bestIntermediary = intermediaries[0];

        strategies.push({
          type: 'intermediary',
          confidence: bestIntermediary.score,
          intermediary: bestIntermediary,
          estimatedAcceptanceRate: bestIntermediary.estimatedAcceptance,
          reasoning: `Alternative: ${bestIntermediary.reasoning}`,
          nextSteps: generateIntermediaryNextSteps(
            bestIntermediary,
            sourceUser,
            targetUser
          ),
        });
      }
    } catch (error) {
      console.warn('Could not find alternative intermediary strategy:', error);
    }
  }

  // Sort by confidence (highest first)
  return strategies.sort((a, b) => b.confidence - a.confidence);
}
