/**
 * Intermediary Scorer
 * Find and score best intermediaries when no mutual connections exist
 *
 * Strategy:
 * 1. Outbound: Your connections who are SIMILAR to target
 * 2. Inbound: Target's connections who are SIMILAR to you
 *
 * Research Foundation:
 * - Uses geometric mean for path strength (ensures both links are strong)
 * - Limits to 500 connections per user for performance
 * - Returns top 5 intermediaries sorted by score
 */

import type { UserProfile } from '../../types/resume-tailoring';
import type {
  IntermediaryCandidate,
  ProfileSimilarity,
  ConnectionSample,
  ParsedLocation,
} from './universal-connection-types';

// ============================================================================
// Profile Similarity Calculator
// ============================================================================

/**
 * Calculate multi-attribute similarity between two profiles
 *
 * Weighted composite formula (research-backed):
 * - Industry: 30% (LinkedIn PYMK primary signal)
 * - Skills: 25% (direct relevance)
 * - Education: 20% (strong predictor)
 * - Location: 15% (practical collaboration)
 * - Companies: 10% (tertiary signal)
 *
 * @param profile1 First user profile
 * @param profile2 Second user profile
 * @returns ProfileSimilarity with overall score (0-1) and breakdown
 */
export function calculateProfileSimilarity(
  profile1: UserProfile,
  profile2: UserProfile
): ProfileSimilarity {
  const industryMatch = calculateIndustryOverlap(profile1, profile2);
  const skillMatch = calculateSkillJaccardSimilarity(profile1, profile2);
  const educationMatch = calculateEducationOverlap(profile1, profile2);
  const locationMatch = calculateLocationSimilarity(profile1, profile2);
  const companyMatch = calculateCompanyHistoryJaccard(profile1, profile2);

  // Weighted composite score (research-backed weights)
  const overall =
    industryMatch * 0.30 + // 30% - Primary signal
    skillMatch * 0.25 + // 25% - Direct relevance
    educationMatch * 0.20 + // 20% - Strong predictor
    locationMatch * 0.15 + // 15% - Practical collaboration
    companyMatch * 0.10; // 10% - Tertiary signal

  return {
    overall: Math.min(Math.max(overall, 0), 1),
    breakdown: {
      industry: industryMatch,
      skills: skillMatch,
      education: educationMatch,
      location: locationMatch,
      companies: companyMatch,
    },
  };
}

/**
 * Calculate skill similarity using Jaccard Index
 *
 * Jaccard Index: |A ∩ B| / |A ∪ B|
 * Measures overlap between two skill sets
 */
function calculateSkillJaccardSimilarity(
  p1: UserProfile,
  p2: UserProfile
): number {
  if (!p1.skills || !p2.skills || p1.skills.length === 0 || p2.skills.length === 0) {
    return 0;
  }

  const skills1 = new Set(p1.skills.map((s) => s.name.toLowerCase().trim()));
  const skills2 = new Set(p2.skills.map((s) => s.name.toLowerCase().trim()));

  const intersection = Array.from(skills1).filter((s) => skills2.has(s)).length;
  const union = new Set([...skills1, ...skills2]).size;

  return union === 0 ? 0 : intersection / union;
}

/**
 * Calculate education overlap
 *
 * Scoring:
 * - Same school: 1.0 (alumni connection - 35-42% acceptance rate)
 * - Same field of study: 0.5
 * - No overlap: 0
 */
function calculateEducationOverlap(p1: UserProfile, p2: UserProfile): number {
  if (!p1.education || !p2.education || p1.education.length === 0 || p2.education.length === 0) {
    return 0;
  }

  // Check for exact school match
  const schoolMatch = p1.education.some((e1) =>
    p2.education.some((e2) => e1.school.toLowerCase() === e2.school.toLowerCase())
  );

  if (schoolMatch) return 1.0; // Alumni connection

  // Check for same field of study
  const fieldMatch = p1.education.some((e1) =>
    p2.education.some((e2) => e1.field && e2.field && e1.field.toLowerCase() === e2.field.toLowerCase())
  );

  return fieldMatch ? 0.5 : 0;
}

/**
 * Calculate company history overlap using Jaccard Index
 *
 * Measures shared work history
 */
function calculateCompanyHistoryJaccard(
  p1: UserProfile,
  p2: UserProfile
): number {
  if (!p1.workExperience || !p2.workExperience || p1.workExperience.length === 0 || p2.workExperience.length === 0) {
    return 0;
  }

  const companies1 = new Set(
    p1.workExperience.map((e) => e.company.toLowerCase().trim())
  );
  const companies2 = new Set(
    p2.workExperience.map((e) => e.company.toLowerCase().trim())
  );

  const intersection = Array.from(companies1).filter((c) =>
    companies2.has(c)
  ).length;
  const union = new Set([...companies1, ...companies2]).size;

  return union === 0 ? 0 : intersection / union;
}

/**
 * Calculate location similarity
 *
 * Scoring:
 * - Same exact location: 1.0
 * - Same state/region: 0.7
 * - Same country: 0.4
 * - Same continent: 0.2
 * - Different continents: 0
 */
function calculateLocationSimilarity(p1: UserProfile, p2: UserProfile): number {
  if (!p1.location || !p2.location) return 0;

  // Exact match
  if (p1.location.toLowerCase() === p2.location.toLowerCase()) {
    return 1.0;
  }

  // Parse locations
  const loc1 = parseLocation(p1.location);
  const loc2 = parseLocation(p2.location);

  // Same country
  if (loc1.country && loc2.country && loc1.country === loc2.country) {
    // Same state
    if (loc1.state && loc2.state && loc1.state === loc2.state) {
      return 0.7;
    }
    return 0.4;
  }

  // Same region (continent)
  if (loc1.region && loc2.region && loc1.region === loc2.region) {
    return 0.2;
  }

  return 0;
}

/**
 * Parse location string into components
 *
 * Expected formats:
 * - "San Francisco, CA"
 * - "New York, NY, USA"
 * - "London, United Kingdom"
 * - "Toronto, Ontario, Canada"
 */
function parseLocation(location: string): ParsedLocation {
  const parts = location.split(',').map((p) => p.trim());

  const parsed: ParsedLocation = {};

  if (parts.length >= 1) {
    parsed.city = parts[0];
  }

  if (parts.length >= 2) {
    // Could be state or country
    const secondPart = parts[1];

    // If it's a 2-letter code, it's likely a state
    if (secondPart.length === 2) {
      parsed.state = secondPart;
      parsed.country = 'United States'; // Assume US for state codes
    } else {
      parsed.country = secondPart;
    }
  }

  if (parts.length >= 3) {
    parsed.country = parts[2];
  }

  // Infer region from country
  if (parsed.country) {
    parsed.region = inferRegion(parsed.country);
  }

  return parsed;
}

/**
 * Infer continent/region from country name
 */
function inferRegion(country: string): string {
  const normalized = country.toLowerCase();

  // North America
  if (['united states', 'canada', 'mexico', 'us', 'usa'].includes(normalized)) {
    return 'North America';
  }

  // Europe
  if (
    [
      'united kingdom',
      'uk',
      'germany',
      'france',
      'spain',
      'italy',
      'netherlands',
      'belgium',
      'sweden',
      'norway',
      'denmark',
      'finland',
      'poland',
      'portugal',
      'ireland',
      'switzerland',
      'austria',
    ].includes(normalized)
  ) {
    return 'Europe';
  }

  // Asia
  if (
    [
      'china',
      'india',
      'japan',
      'south korea',
      'singapore',
      'hong kong',
      'taiwan',
      'thailand',
      'vietnam',
      'indonesia',
      'malaysia',
      'philippines',
    ].includes(normalized)
  ) {
    return 'Asia';
  }

  // Oceania
  if (['australia', 'new zealand'].includes(normalized)) {
    return 'Oceania';
  }

  // South America
  if (
    ['brazil', 'argentina', 'chile', 'colombia', 'peru'].includes(normalized)
  ) {
    return 'South America';
  }

  // Africa
  if (['south africa', 'nigeria', 'kenya', 'egypt'].includes(normalized)) {
    return 'Africa';
  }

  return 'Unknown';
}

/**
 * Calculate industry overlap
 *
 * Scoring:
 * - Exact industry match: 1.0
 * - Related industries: 0.6
 * - No overlap: 0
 */
function calculateIndustryOverlap(p1: UserProfile, p2: UserProfile): number {
  if (!p1.workExperience || !p2.workExperience || p1.workExperience.length === 0 || p2.workExperience.length === 0) {
    return 0;
  }

  const industries1 = new Set(
    p1.workExperience
      .map((e) => e.industry)
      .filter(Boolean)
      .map((i) => i!.toLowerCase().trim())
  );
  const industries2 = new Set(
    p2.workExperience
      .map((e) => e.industry)
      .filter(Boolean)
      .map((i) => i!.toLowerCase().trim())
  );

  // Exact match
  const intersection = Array.from(industries1).filter((i) =>
    industries2.has(i)
  );
  if (intersection.length > 0) return 1.0;

  // Related industries
  const relatedCount = Array.from(industries1).filter((i1) =>
    Array.from(industries2).some((i2) => areIndustriesRelated(i1, i2))
  ).length;

  return relatedCount > 0 ? 0.6 : 0;
}

/**
 * Check if two industries are related
 *
 * Simple heuristic based on common keywords
 */
function areIndustriesRelated(industry1: string, industry2: string): boolean {
  const i1 = industry1.toLowerCase();
  const i2 = industry2.toLowerCase();

  // Technology-related
  const techKeywords = [
    'software',
    'technology',
    'tech',
    'it',
    'information',
    'computer',
    'data',
    'ai',
    'machine learning',
    'engineering',
  ];

  const isTech1 = techKeywords.some((kw) => i1.includes(kw));
  const isTech2 = techKeywords.some((kw) => i2.includes(kw));

  if (isTech1 && isTech2) return true;

  // Finance-related
  const financeKeywords = [
    'finance',
    'banking',
    'investment',
    'capital',
    'financial',
  ];
  const isFinance1 = financeKeywords.some((kw) => i1.includes(kw));
  const isFinance2 = financeKeywords.some((kw) => i2.includes(kw));

  if (isFinance1 && isFinance2) return true;

  // Healthcare-related
  const healthKeywords = [
    'health',
    'medical',
    'pharma',
    'biotech',
    'clinical',
  ];
  const isHealth1 = healthKeywords.some((kw) => i1.includes(kw));
  const isHealth2 = healthKeywords.some((kw) => i2.includes(kw));

  if (isHealth1 && isHealth2) return true;

  return false;
}

// ============================================================================
// Intermediary Scoring
// ============================================================================

/**
 * Find best intermediaries between source and target
 *
 * Two strategies:
 * 1. Outbound: Your connections who are SIMILAR to target (you reach out)
 * 2. Inbound: Target's connections who are SIMILAR to you (requires reaching their connections first)
 *
 * @param sourceUser Your profile
 * @param targetUser Target person's profile
 * @param sourceConnections Your 1st-degree connections
 * @param targetConnections Target's 1st-degree connections
 * @returns Top 5 intermediary candidates sorted by score
 */
export function findBestIntermediaries(
  sourceUser: UserProfile,
  targetUser: UserProfile,
  sourceConnections: UserProfile[],
  targetConnections: UserProfile[]
): IntermediaryCandidate[] {
  const candidates: IntermediaryCandidate[] = [];

  // Sample connections for performance (limit to 500)
  const sampledSourceConnections = sampleConnections(sourceConnections, 500);
  const sampledTargetConnections = sampleConnections(targetConnections, 500);

  // Strategy 1: Your connections who are SIMILAR to target (Outbound)
  for (const yourConnection of sampledSourceConnections.sampled) {
    const simToTarget = calculateProfileSimilarity(yourConnection, targetUser);

    // Only consider strong matches (> 0.50)
    if (simToTarget.overall > 0.50) {
      const simFromYou = calculateProfileSimilarity(sourceUser, yourConnection);

      const candidate = scoreIntermediary(
        sourceUser,
        yourConnection,
        targetUser,
        'outbound',
        simFromYou.overall,
        simToTarget.overall
      );

      candidates.push(candidate);
    }
  }

  // Strategy 2: Target's connections who are SIMILAR to you (Inbound)
  for (const theirConnection of sampledTargetConnections.sampled) {
    const simToYou = calculateProfileSimilarity(theirConnection, sourceUser);

    // Only consider strong matches (> 0.50)
    if (simToYou.overall > 0.50) {
      const simToTarget = calculateProfileSimilarity(
        theirConnection,
        targetUser
      );

      const candidate = scoreIntermediary(
        sourceUser,
        theirConnection,
        targetUser,
        'inbound',
        simToYou.overall,
        simToTarget.overall
      );

      candidates.push(candidate);
    }
  }

  // Sort by score, return top 5
  return candidates.sort((a, b) => b.score - a.score).slice(0, 5);
}

/**
 * Score a single intermediary candidate
 *
 * Uses geometric mean for path strength to ensure both links are strong:
 * - Path (0.9, 0.6) gets sqrt(0.54) = 0.73
 * - Path (0.75, 0.75) gets sqrt(0.56) = 0.75 (better!)
 *
 * @param source Source user
 * @param intermediary Intermediary candidate
 * @param target Target user
 * @param direction 'outbound' (easier) or 'inbound' (harder)
 * @param simFromSource Similarity: source → intermediary
 * @param simToTarget Similarity: intermediary → target
 * @returns IntermediaryCandidate with score and metadata
 */
export function scoreIntermediary(
  source: UserProfile,
  intermediary: UserProfile,
  target: UserProfile,
  direction: 'outbound' | 'inbound',
  simFromSource?: number,
  simToTarget?: number
): IntermediaryCandidate {
  // Calculate similarities if not provided
  const simFrom =
    simFromSource ?? calculateProfileSimilarity(source, intermediary).overall;
  const simTo =
    simToTarget ?? calculateProfileSimilarity(intermediary, target).overall;

  // Path strength: geometric mean (ensures both links are strong)
  const pathStrength = Math.sqrt(simFrom * simTo);

  // Direction weighting:
  // - Outbound (your connections): 0.8x (easier - you control outreach)
  // - Inbound (target's connections): 0.6x (harder - need to reach their connections first)
  const directionMultiplier = direction === 'outbound' ? 0.8 : 0.6;
  const score = pathStrength * directionMultiplier;

  // Estimate acceptance rate
  const estimatedAcceptance = estimateAcceptanceRate(pathStrength, direction);

  // Generate reasoning
  const reasoning =
    direction === 'outbound'
      ? `${intermediary.name} is similar to ${target.name} (${(simTo * 100).toFixed(0)}% match). You can introduce them!`
      : `${intermediary.name} is similar to you (${(simFrom * 100).toFixed(0)}% match) and connected to ${target.name}. Connect with them first!`;

  return {
    person: intermediary,
    score,
    pathStrength,
    bridgeQuality: 0, // Future enhancement: betweenness centrality
    estimatedAcceptance,
    reasoning,
    direction,
    sourceToIntermediary: simFrom,
    intermediaryToTarget: simTo,
  };
}

/**
 * Estimate acceptance rate based on path strength
 *
 * Research-backed formula:
 * - 0.75+ path strength → 40% acceptance (near "same school" quality)
 * - 0.60-0.75 → 32% acceptance (between "same industry" and "same school")
 * - 0.50-0.60 → 25% acceptance (slightly above "same industry")
 * - <0.50 → 18% acceptance (near "no commonalities")
 *
 * Direction adjustment:
 * - Inbound paths: 75% of base rate (harder to reach target's connections first)
 *
 * @param pathStrength Geometric mean of both similarity links (0-1)
 * @param direction 'outbound' or 'inbound'
 * @returns Acceptance rate (0-1)
 */
export function estimateAcceptanceRate(
  pathStrength: number,
  direction: 'outbound' | 'inbound'
): number {
  let baseRate: number;

  if (pathStrength >= 0.75) {
    baseRate = 0.40; // Near "same school" quality
  } else if (pathStrength >= 0.60) {
    baseRate = 0.32; // Between "same industry" and "same school"
  } else if (pathStrength >= 0.50) {
    baseRate = 0.25; // Slightly above "same industry"
  } else {
    baseRate = 0.18; // Near "no commonalities"
  }

  // Adjust for direction
  if (direction === 'inbound') {
    baseRate *= 0.75; // Harder to reach target's connections first
  }

  return baseRate;
}

/**
 * Sample connections for performance
 *
 * Strategy:
 * - If ≤ maxConnections: return all
 * - If > maxConnections: take 50% most recent + 50% most active
 *
 * @param connections Full list of connections
 * @param maxConnections Maximum connections to sample (default: 500)
 * @returns ConnectionSample with sampled connections and metadata
 */
export function sampleConnections(
  connections: UserProfile[],
  maxConnections: number = 500
): ConnectionSample {
  if (connections.length <= maxConnections) {
    return {
      sampled: connections,
      strategy: 'all',
      originalCount: connections.length,
      sampledCount: connections.length,
    };
  }

  const halfSize = Math.floor(maxConnections / 2);

  // Sort by connection date (most recent first)
  // Note: connectionDate is a metadata field we'd need to add to UserProfile
  const byRecent = [...connections].sort((_a, _b) => {
    // If connectionDate is available, use it
    // Otherwise, use a heuristic (e.g., more recent work experience)
    return 0; // Placeholder - would need actual dates
  });

  // Sort by activity score (most active first)
  // Note: activityScore is a metadata field we'd need to add to UserProfile
  const byActive = [...connections].sort((_a, _b) => {
    // If activityScore is available, use it
    // Otherwise, default to 0
    return 0; // Placeholder - would need actual scores
  });

  // Combine: 50% most recent + 50% most active
  const recentSet = new Set(byRecent.slice(0, halfSize).map((c) => c.email || c.name));
  const sampled = [
    ...byRecent.slice(0, halfSize),
    ...byActive.slice(0, halfSize).filter((c) => !recentSet.has(c.email || c.name)),
  ];

  return {
    sampled: sampled.slice(0, maxConnections),
    strategy: 'mixed',
    originalCount: connections.length,
    sampledCount: Math.min(sampled.length, maxConnections),
  };
}

// ============================================================================
// Similarity Cache (Performance Optimization)
// ============================================================================

/**
 * Simple in-memory cache for similarity calculations
 *
 * Reduces computation for frequently compared profiles
 * Expires after 7 days
 */
export class ProfileSimilarityCache {
  private cache = new Map<string, { similarity: ProfileSimilarity; expiresAt: Date }>();

  /**
   * Get cached similarity (if exists and not expired)
   */
  getCached(id1: string, id2: string): ProfileSimilarity | null {
    const key = [id1, id2].sort().join(':');
    const entry = this.cache.get(key);

    if (!entry) return null;

    // Check expiration
    if (new Date() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return entry.similarity;
  }

  /**
   * Cache similarity calculation
   */
  setCached(id1: string, id2: string, similarity: ProfileSimilarity): void {
    const key = [id1, id2].sort().join(':');

    // Expire after 7 days
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    this.cache.set(key, { similarity, expiresAt });
  }

  /**
   * Clear expired entries
   */
  clearExpired(): void {
    const now = new Date();
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Clear all cache
   */
  clearAll(): void {
    this.cache.clear();
  }
}
