/**
 * Configuration Types
 * Configuration options and detailed result types
 */

import type { ProfileSimilarity, SimilarityWeights } from './core-types';
import type { LocationSimilarityThresholds, EducationSimilarityThresholds, IndustrySimilarityThresholds, Location } from './threshold-types';

/**
 * Configuration options for profile similarity calculation
 */
export interface ProfileSimilarityConfig {
  /** Custom weights (optional) - uses DEFAULT_SIMILARITY_WEIGHTS if not provided */
  weights?: Partial<SimilarityWeights>;

  /** Custom location thresholds (optional) */
  locationThresholds?: Partial<LocationSimilarityThresholds>;

  /** Custom education thresholds (optional) */
  educationThresholds?: Partial<EducationSimilarityThresholds>;

  /** Custom industry thresholds (optional) */
  industryThresholds?: Partial<IndustrySimilarityThresholds>;

  /** Case-sensitive skill matching - Default: false */
  caseSensitiveSkills?: boolean;

  /** Case-sensitive company matching - Default: false */
  caseSensitiveCompanies?: boolean;
}

/**
 * Detailed similarity calculation result with metadata
 * Used for debugging and advanced use cases
 */
export interface DetailedSimilarityResult extends ProfileSimilarity {
  /** Metadata about the calculation */
  metadata: {
    /** Timestamp of calculation */
    calculatedAt: Date;

    /** Configuration used for calculation */
    config: ProfileSimilarityConfig;

    /** Number of skills compared */
    skillsCompared: {
      profile1Count: number;
      profile2Count: number;
      intersectionCount: number;
      unionCount: number;
    };

    /** Number of companies compared */
    companiesCompared: {
      profile1Count: number;
      profile2Count: number;
      intersectionCount: number;
      unionCount: number;
    };

    /** Education comparison details */
    educationDetails: {
      profile1Schools: string[];
      profile2Schools: string[];
      matchedSchools: string[];
      matchedFields: string[];
    };

    /** Industry comparison details */
    industryDetails: {
      profile1Industries: string[];
      profile2Industries: string[];
      exactMatches: string[];
      relatedMatches: Array<{ industry1: string; industry2: string }>;
    };

    /** Location comparison details */
    locationDetails: {
      profile1Location: Location;
      profile2Location: Location;
      matchLevel: 'city' | 'state' | 'country' | 'region' | 'none';
    };
  };
}

/**
 * Acceptance rate estimation based on similarity score
 * Research-backed mapping from similarity to connection acceptance probability
 */
export interface AcceptanceRateEstimate {
  /** Similarity score that generated this estimate */
  similarityScore: number;

  /** Estimated acceptance rate (0-1) */
  acceptanceRate: number;

  /** Lower bound of confidence interval */
  lowerBound: number;

  /** Upper bound of confidence interval */
  upperBound: number;

  /** Connection quality tier */
  quality: 'excellent' | 'good' | 'moderate' | 'low' | 'very-low';

  /** Comparable connection type for context */
  comparableTo: string;

  /** Research source for this estimate */
  researchBasis: string;
}

/**
 * Similarity score thresholds for connection strategies
 * Maps similarity scores to recommended outreach approaches
 */
export const SIMILARITY_STRATEGY_THRESHOLDS = {
  /** Direct high similarity (>= 0.65) - "Same school" quality */
  DIRECT_HIGH: 0.65,

  /** Cold with personalization (>= 0.45) - Above "same industry" */
  COLD_WITH_PERSONALIZATION: 0.45,

  /** Intermediary threshold (>= 0.35) - Viable two-hop path */
  INTERMEDIARY_VIABLE: 0.35,

  /** Not recommended (< 0.25) - Too low similarity */
  NOT_RECOMMENDED: 0.25,
} as const;
