/**
 * Similarity Types
 * Types related to profile similarity and acceptance thresholds
 */

import type { UserProfile } from '../../../types/resume-tailoring';

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
