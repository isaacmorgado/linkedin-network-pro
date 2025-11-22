/**
 * Universal Connection Types
 * Type definitions for LinkedIn universal connection system
 *
 * Enables connection pathfinding to ANYONE on LinkedIn, even without mutual connections,
 * using profile similarity and intermediary matching.
 */

import type { UserProfile } from '../chat-abc62d98/linkedin-network-pro/src/types/resume-tailoring';

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
 * 3. Intermediary matching (score > 0.35)
 * 4. Cold similarity-based outreach (> 0.45)
 * 5. No recommendation (< 0.45)
 */
export interface ConnectionStrategy {
  type: 'mutual' | 'direct-similarity' | 'intermediary' | 'cold-similarity' | 'none';
  confidence: number; // 0-1 (overall confidence in strategy)

  // Path information (for mutual connections)
  path?: ConnectionPath;

  // Intermediary information (for intermediary strategy)
  intermediary?: IntermediaryCandidate;

  // Direct similarity information
  directSimilarity?: ProfileSimilarity;

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

/**
 * Profile similarity breakdown
 *
 * Multi-attribute similarity calculation based on:
 * - LinkedIn PYMK algorithm
 * - Academic research on link prediction
 */
export interface ProfileSimilarity {
  overall: number; // 0-1 (weighted composite score)

  breakdown: {
    industry: number; // 0-1
    skills: number; // 0-1 (Jaccard similarity)
    education: number; // 0-1
    location: number; // 0-1
    companies: number; // 0-1 (Jaccard similarity)
  };
}

/**
 * Research-backed acceptance rate thresholds
 *
 * Based on:
 * - LinkedIn Outreach 2025: Mutual connections (45-55%)
 * - Liben-Nowell & Kleinberg: Same school (35-42%)
 * - LinkedIn PYMK: Same company (28-35%)
 * - B2B benchmarks: Same industry (22-28%)
 * - Cold outreach studies: No commonalities (12-18%)
 */
export interface AcceptanceThresholds {
  DIRECT_HIGH: { minSimilarity: number; acceptanceRate: number };
  INTERMEDIARY_GOOD: { minSimilarity: number; acceptanceRate: number };
  COLD_WITH_PERSONALIZATION: { minSimilarity: number; acceptanceRate: number };
  PURE_COLD: { minSimilarity: number; acceptanceRate: number };
}

/**
 * Default research-backed thresholds
 */
export const DEFAULT_THRESHOLDS: AcceptanceThresholds = {
  // High similarity = "same school" quality
  DIRECT_HIGH: {
    minSimilarity: 0.65,
    acceptanceRate: 0.40
  },

  // Good intermediary path
  INTERMEDIARY_GOOD: {
    minSimilarity: 0.35,
    acceptanceRate: 0.25
  },

  // Cold outreach with personalization
  COLD_WITH_PERSONALIZATION: {
    minSimilarity: 0.45,
    acceptanceRate: 0.20
  },

  // Pure cold outreach (baseline)
  PURE_COLD: {
    minSimilarity: 0,
    acceptanceRate: 0.15
  },
};

/**
 * Location parsing result
 */
export interface ParsedLocation {
  city?: string;
  state?: string;
  country?: string;
  region?: string; // 'North America', 'Europe', 'Asia', etc.
}

/**
 * Industry relationship mapping
 * Used for calculating industry overlap
 */
export interface IndustryRelationship {
  industry1: string;
  industry2: string;
  related: boolean;
  similarity: number; // 0-1
}

/**
 * Connection sampling strategy result
 */
export interface ConnectionSample {
  sampled: UserProfile[];
  strategy: 'all' | 'recent' | 'active' | 'mixed';
  originalCount: number;
  sampledCount: number;
}

/**
 * Similarity calculation cache entry
 */
export interface SimilarityCacheEntry {
  profileId1: string;
  profileId2: string;
  similarity: ProfileSimilarity;
  calculatedAt: Date;
  expiresAt: Date;
}

/**
 * Graph interface for universal pathfinding
 *
 * Minimal interface required by universal pathfinder
 */
export interface Graph {
  // Get user connections (1st degree)
  getConnections(userId: string): Promise<UserProfile[]>;

  // Try existing A* or BFS algorithm
  bidirectionalBFS?(sourceId: string, targetId: string): Promise<{
    path: UserProfile[];
    probability: number;
    mutualConnections: number;
  } | null>;

  // Get node by ID
  getNode?(nodeId: string): UserProfile | null;

  // Get mutual connections between two users
  getMutualConnections?(userId1: string, userId2: string): UserProfile[];
}

/**
 * Performance metrics for universal connection system
 */
export interface ConnectionMetrics {
  // Acceptance rate tracking
  acceptanceRateByStrategy: {
    mutual: number; // Target: 45-55%
    directSimilarity: number; // Target: 35-42%
    intermediary: number; // Target: 25-32%
    coldSimilarity: number; // Target: 18-25%
  };

  // Calibration metrics
  predictedVsActual: Array<{
    predicted: number;
    actual: number;
    strategy: string;
  }>;

  // Performance metrics
  avgLatency: number; // Target: < 500ms
  cacheHitRate: number; // Target: > 70%
  recommendationsPerUser: number; // Target: 5-10/day
}

/**
 * Configuration for universal pathfinding
 */
export interface UniversalPathfindingConfig {
  // Performance
  maxConnectionsToSample: number; // Default: 500
  enableCaching: boolean; // Default: true
  cacheExpirationDays: number; // Default: 7

  // Thresholds
  thresholds: AcceptanceThresholds;

  // Features
  enableIntermediarySearch: boolean; // Default: true
  enableDirectSimilarity: boolean; // Default: true

  // Timeouts
  maxSearchTimeMs: number; // Default: 5000 (5 seconds)
}

/**
 * Default configuration
 */
export const DEFAULT_CONFIG: UniversalPathfindingConfig = {
  maxConnectionsToSample: 500,
  enableCaching: true,
  cacheExpirationDays: 7,
  thresholds: DEFAULT_THRESHOLDS,
  enableIntermediarySearch: true,
  enableDirectSimilarity: true,
  maxSearchTimeMs: 5000,
};
