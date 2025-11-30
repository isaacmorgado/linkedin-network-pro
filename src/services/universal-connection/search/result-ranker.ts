/**
 * Search Result Ranker
 * Intelligent ranking algorithm for search results
 *
 * Scoring Formula:
 * matchScore = (connectionWeight * 0.4) + (keywordWeight * 0.3) +
 *              (completenessWeight * 0.2) + (activityWeight * 0.1)
 *
 * Features:
 * - Multi-factor scoring
 * - Detailed reasoning generation
 * - Activity-based boosting
 * - Path availability consideration
 */

import type { SearchQuery, SearchResult } from '@/types/search';
import { calculateEnhancedScore, type ScoreBreakdown } from './result-ranker-scoring';
import { generateDetailedReasoning } from './result-ranker-reasoning';

/**
 * Ranking weights configuration
 */
export interface RankingWeights {
  connection: number; // 0.0 - 1.0
  keyword: number;    // 0.0 - 1.0
  completeness: number; // 0.0 - 1.0
  activity: number;   // 0.0 - 1.0
}

const DEFAULT_WEIGHTS: RankingWeights = {
  connection: 0.4,
  keyword: 0.3,
  completeness: 0.2,
  activity: 0.1,
};

/**
 * Rank search results by relevance
 * Returns sorted results with enhanced match scores and reasoning
 */
export async function rankResults(
  results: SearchResult[],
  query: SearchQuery
): Promise<SearchResult[]> {
  // Enhance each result with detailed scoring
  const enhancedResults = await Promise.all(
    results.map(async (result) => {
      const score = await calculateEnhancedScore(result, query.query);
      const reasoning = generateDetailedReasoning(result, query, score);

      return {
        ...result,
        matchScore: score.total,
        reasoning,
      };
    })
  );

  // Sort by match score (descending), then by connection degree (ascending)
  enhancedResults.sort((a, b) => {
    if (b.matchScore !== a.matchScore) {
      return b.matchScore - a.matchScore;
    }
    return a.connectionDegree - b.connectionDegree;
  });

  return enhancedResults;
}

/**
 * Rank results with custom weights
 * Allows tuning the scoring formula
 */
export async function rankResultsWithWeights(
  results: SearchResult[],
  query: SearchQuery,
  weights: RankingWeights = DEFAULT_WEIGHTS
): Promise<SearchResult[]> {
  const enhancedResults = await Promise.all(
    results.map(async (result) => {
      const baseScore = await calculateEnhancedScore(result, query.query);

      // Apply custom weights
      const total = Math.round(
        baseScore.connectionWeight * weights.connection +
        baseScore.keywordWeight * weights.keyword +
        baseScore.completenessWeight * weights.completeness +
        baseScore.activityWeight * weights.activity
      );

      const reasoning = generateDetailedReasoning(result, query, baseScore);

      return {
        ...result,
        matchScore: Math.min(total, 100),
        reasoning,
      };
    })
  );

  // Sort by match score descending
  enhancedResults.sort((a, b) => {
    if (b.matchScore !== a.matchScore) {
      return b.matchScore - a.matchScore;
    }
    return a.connectionDegree - b.connectionDegree;
  });

  return enhancedResults;
}

/**
 * Get score breakdown for a single result (for debugging/UI)
 */
export async function getScoreBreakdown(
  result: SearchResult,
  query: SearchQuery
): Promise<ScoreBreakdown> {
  return await calculateEnhancedScore(result, query.query);
}

// Export types
export type { ScoreBreakdown };
