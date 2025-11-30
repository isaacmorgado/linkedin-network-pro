/**
 * Strategy Types
 * Types related to connection strategies and pathfinding results
 */

import type { UserProfile } from '../../../types/resume-tailoring';
import type { ProfileSimilarity } from './similarity-types';
import type { SteppingStoneBridge } from './bridge-types';

/**
 * Intermediary candidate when no mutual connections exist
 *
 * An intermediary is someone who bridges the gap between you and your target:
 * - Strategy 1 (Outbound): Your connections who are similar to target
 * - Strategy 2 (Inbound): Target's connections who are similar to you
 */
export interface IntermediaryCandidate {
  person: UserProfile;
  score: number; // 0-1 (overall quality of intermediary)
  pathStrength: number; // Geometric mean of both similarity links
  bridgeQuality: number; // Betweenness bonus (future enhancement)
  estimatedAcceptance: number; // Research-backed acceptance rate estimate
  reasoning: string; // Human-readable explanation
  direction: 'outbound' | 'inbound';

  // Detailed breakdown for UI display
  sourceToIntermediary: number; // Similarity score (0-1)
  intermediaryToTarget: number; // Similarity score (0-1)
}

/**
 * Connection strategy result from universal pathfinding
 *
 * Multi-stage algorithm tries different approaches in order:
 * 1. Mutual connections (use existing A* algorithm)
 * 2. Direct high similarity (> 0.65)
 * 3. Engagement bridge (who target engages with) - NEW Week 2
 * 4. Company bridge (colleagues at target's company) - NEW Week 2
 * 5. Intermediary matching (score > 0.35)
 * 6. Cold similarity-based outreach (> 0.45)
 * 7. Cold outreach (< 0.45)
 * 8. Semantic fallback (AI-based similarity) - NEW Week 2
 */
export interface ConnectionStrategy {
  type: 'mutual' | 'direct-similarity' | 'engagement_bridge' | 'company_bridge' | 'intermediary' | 'cold-similarity' | 'cold-outreach' | 'semantic';
  confidence: number; // 0-1 (overall confidence in strategy)

  // Path information (for mutual connections)
  path?: ConnectionPath;

  // Intermediary information (for intermediary strategy)
  intermediary?: IntermediaryCandidate;

  // Fallback semantic candidate (for cold-outreach when no better option exists)
  candidate?: IntermediaryCandidate;

  // Direct similarity information
  directSimilarity?: ProfileSimilarity;

  // Stepping stones (for engagement_bridge strategy)
  steppingStones?: SteppingStoneBridge[];

  // Indicates low confidence in recommendation (but still actionable)
  lowConfidence?: boolean;

  // Research-backed acceptance rate estimate
  estimatedAcceptanceRate: number;

  // Human-readable explanation
  reasoning: string;

  // Action items for user
  nextSteps: string[];
}

/**
 * Connection path from A* algorithm
 */
export interface ConnectionPath {
  nodes: UserProfile[];
  edges: ConnectionEdge[];
  totalWeight: number;
  successProbability: number;
  mutualConnections: number;
}

/**
 * Edge in connection path
 */
export interface ConnectionEdge {
  from: string; // User ID
  to: string; // User ID
  weight: number; // 0-1 (lower = stronger connection)
  probability: number; // 0-1 (acceptance probability)
  mutualConnections: number;
  matchScore: number; // 0-100
}
