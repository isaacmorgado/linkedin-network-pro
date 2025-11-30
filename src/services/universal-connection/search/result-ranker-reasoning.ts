/**
 * Result Ranker Reasoning Generation
 * Generates detailed explanations for result rankings
 */

import type { SearchResult, SearchQuery } from '@/types/search';
import type { ScoreBreakdown } from './result-ranker-scoring';

/**
 * Generate detailed reasoning for why this result ranks as it does
 */
export function generateDetailedReasoning(
  result: SearchResult,
  query: SearchQuery,
  score: ScoreBreakdown
): string {
  const reasons: string[] = [];

  // Connection degree reasoning
  if (result.connectionDegree === 1) {
    reasons.push('direct connection');
  } else if (result.connectionDegree === 2) {
    reasons.push('2nd-degree connection');
  } else {
    reasons.push('3rd-degree connection');
  }

  // Keyword match reasoning
  if (query.query) {
    const queryLower = query.query.toLowerCase();
    if (result.name.toLowerCase().includes(queryLower)) {
      reasons.push('name matches query');
    }
    if (result.headline?.toLowerCase().includes(queryLower)) {
      reasons.push('headline matches');
    }
    if (result.company?.toLowerCase().includes(queryLower)) {
      reasons.push(`works at ${result.company}`);
    }
  }

  // Filter-based reasoning
  if (query.filters?.company && result.company) {
    reasons.push(`at ${result.company}`);
  }
  if (query.filters?.location) {
    reasons.push(`in ${query.filters.location}`);
  }
  if (query.filters?.role && result.role) {
    reasons.push(`${query.filters.role} role`);
  }

  // Completeness reasoning
  if (score.completenessWeight >= 80) {
    reasons.push('complete profile');
  }

  // Activity reasoning
  if (score.activityWeight >= 60) {
    reasons.push('active user');
  } else if (score.activityWeight <= 40) {
    reasons.push('limited recent activity');
  }

  // Path availability
  if (result.pathAvailable) {
    reasons.push('connection path available');
  }

  // Score-based summary
  if (score.total >= 80) {
    reasons.push('strong match');
  } else if (score.total >= 60) {
    reasons.push('good match');
  } else if (score.total >= 40) {
    reasons.push('moderate match');
  }

  return reasons.join(', ');
}
