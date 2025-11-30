/**
 * Intermediary Scorer Types
 * Type definitions for intermediary-based connection strategies
 */

import type { UserProfile } from '../../../types/resume-tailoring';
import type { ProfileSimilarity } from '../profile-similarity/types';

/**
 * Intermediary candidate with scoring metadata
 */
export interface IntermediaryCandidate {
  /** The intermediary person */
  person: UserProfile;

  /** Overall score (0-1) - path strength * direction multiplier */
  score: number;

  /** Path strength - geometric mean of both similarity links */
  pathStrength: number;

  /** Bridge quality - betweenness centrality (future enhancement) */
  bridgeQuality: number;

  /** Estimated acceptance rate (0-1) */
  estimatedAcceptance: number;

  /** Human-readable reasoning */
  reasoning: string;

  /** Direction of path */
  direction: 'outbound' | 'inbound';

  /** Similarity: source → intermediary */
  sourceToIntermediary: number;

  /** Similarity: intermediary → target */
  intermediaryToTarget: number;
}

/**
 * Connection sampling result
 */
export interface ConnectionSample {
  /** Sampled connections */
  sampled: UserProfile[];

  /** Sampling strategy used */
  strategy: 'all' | 'mixed';

  /** Original connection count */
  originalCount: number;

  /** Sampled connection count */
  sampledCount: number;
}

/**
 * Parsed location with hierarchical components
 */
export interface ParsedLocation {
  city?: string;
  state?: string;
  country?: string;
  region?: string;
}

// Re-export ProfileSimilarity for convenience
export type { ProfileSimilarity };
