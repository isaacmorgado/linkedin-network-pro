/**
 * Universal Connection Search Module
 * Exports all search-related functionality
 */

// Query Parser
export { parseQuery, parseQueries } from './query-parser';

// Graph Query Engine
export {
  searchGraph,
  searchByCompany,
  searchByDegree,
  getNodeCount,
  getGraphStats,
} from './graph-query';

// Result Ranker
export {
  rankResults,
  rankResultsWithWeights,
  getScoreBreakdown,
  type RankingWeights,
  type ScoreBreakdown,
} from './result-ranker';

// Types
export type { SearchQuery, SearchResult } from '@/types/search';
