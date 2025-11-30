/**
 * Bridge Quality Analyzer
 * Scrapes stepping stone profiles and calculates 3-way bridge quality
 *
 * Core logic:
 * 1. Scrape stepping stone's full LinkedIn profile
 * 2. Calculate similarity: User → Stepping Stone
 * 3. Calculate similarity: Stepping Stone → Target
 * 4. Calculate overall bridge quality (geometric mean + multipliers)
 */

import type { UserProfile } from '@/types/resume-tailoring';
import type { LinkedInProfile } from '@/types';
import type { SteppingStone, BridgeQuality } from '../universal-connection-types';
import { calculateProfileSimilarity } from '../profile-similarity';

/**
 * Scrape a stepping stone's LinkedIn profile
 * Uses existing profile scraper from STEP 1
 *
 * @param steppingStoneId LinkedIn profile ID
 * @returns Full profile data
 *
 * NOTE: This should be rate-limited to avoid detection
 */
export async function scrapeSteppingStoneProfile(
  steppingStoneId: string
): Promise<LinkedInProfile | null> {
  try {
    // TODO: Import and use scrapeProfileData() from profile-scraper.ts
    // For now, return null (will be implemented when integrated)
    console.log(`[BridgeQualityAnalyzer] Would scrape profile: ${steppingStoneId}`);

    // In production:
    // const profileUrl = `https://www.linkedin.com/in/${steppingStoneId}`;
    // const profile = await scrapeProfileData({ includeActivity: false });
    // return profile;

    return null;
  } catch (error) {
    console.error('[BridgeQualityAnalyzer] Failed to scrape stepping stone profile:', error);
    return null;
  }
}

/**
 * Calculate 3-way bridge quality
 * Analyzes: User → Stepping Stone → Target
 *
 * @param sourceProfile User's profile
 * @param steppingStoneProfile Stepping stone's scraped profile
 * @param targetProfile Target's profile
 * @param steppingStone Stepping stone data (with engagement info)
 * @returns Bridge quality analysis
 */
export async function calculate3WayBridgeQuality(
  sourceProfile: UserProfile,
  steppingStoneProfile: LinkedInProfile,
  targetProfile: UserProfile,
  steppingStone: SteppingStone
): Promise<BridgeQuality> {
  try {
    // ========================================================================
    // ANALYSIS 1: User → Stepping Stone Similarity
    // ========================================================================

    const userToStone = calculateSimilarityScore(sourceProfile, steppingStoneProfile);

    // ========================================================================
    // ANALYSIS 2: Stepping Stone → Target Similarity
    // ========================================================================

    const stoneToTarget = calculateSimilarityScore(
      convertLinkedInProfileToUserProfile(steppingStoneProfile),
      targetProfile
    );

    // ========================================================================
    // ANALYSIS 3: Overall Bridge Quality
    // ========================================================================

    // Base score: Geometric mean of both similarities
    const geometricMean = Math.sqrt(userToStone * stoneToTarget);

    // Multiplier 1: Network proximity bonus (1st > 2nd > 3rd degree)
    const proximityMultiplier =
      steppingStone.connectionDegree === 1 ? 1.2 :
      steppingStone.connectionDegree === 2 ? 1.1 :
      1.0;

    // Multiplier 2: Engagement strength bonus
    const engagementMultiplier = 1 + (steppingStone.person.engagementStrength * 0.1);

    // Final quality (cap at 1.0)
    const overallBridgeQuality = Math.min(
      geometricMean * proximityMultiplier * engagementMultiplier,
      1.0
    );

    // ========================================================================
    // Shared Interests Analysis
    // ========================================================================

    const sharedInterests = findSharedInterests(
      sourceProfile,
      steppingStoneProfile,
      targetProfile
    );

    // ========================================================================
    // Engagement Frequency
    // ========================================================================

    const engagementFrequency = steppingStone.person.engagementStrength;

    // ========================================================================
    // Best Angle for Connection
    // ========================================================================

    const bestAngle = generateBestAngle(
      sourceProfile,
      steppingStoneProfile,
      targetProfile,
      sharedInterests
    );

    // ========================================================================
    // Estimated Acceptance Rate
    // ========================================================================

    // Base rate for engagement bridge
    const baseAcceptance = 0.28;

    // Bonus for high bridge quality
    const qualityBonus = overallBridgeQuality * 0.12; // Up to 12% bonus

    // Bonus for 1st degree connection
    const degreeBonus = steppingStone.connectionDegree === 1 ? 0.08 : 0;

    const estimatedAcceptanceRate = Math.min(
      baseAcceptance + qualityBonus + degreeBonus,
      0.48  // Cap at 48%
    );

    return {
      userToStone,
      stoneToTarget,
      overallBridgeQuality,
      sharedInterests,
      connectionDegree: steppingStone.connectionDegree,
      engagementFrequency,
      bestAngle,
      estimatedAcceptanceRate,
    };
  } catch (error) {
    console.error('[BridgeQualityAnalyzer] Error calculating bridge quality:', error);

    // Return fallback quality
    return {
      userToStone: 0.5,
      stoneToTarget: 0.5,
      overallBridgeQuality: 0.5,
      sharedInterests: [],
      connectionDegree: steppingStone.connectionDegree,
      engagementFrequency: steppingStone.person.engagementStrength,
      bestAngle: 'Shared professional interests',
      estimatedAcceptanceRate: 0.25,
    };
  }
}

/**
 * Calculate similarity score between user profile and LinkedIn profile
 * Uses existing profile similarity calculator
 */
function calculateSimilarityScore(
  profile1: UserProfile,
  profile2: LinkedInProfile | UserProfile
): number {
  try {
    // Convert LinkedInProfile to UserProfile format if needed
    // Check for properties unique to LinkedInProfile (scrapedAt, publicId, etc.)
    const isLinkedInProfile = 'scrapedAt' in profile2 || 'publicId' in profile2;
    const userProfile2 = isLinkedInProfile
      ? convertLinkedInProfileToUserProfile(profile2 as LinkedInProfile)
      : profile2 as UserProfile;

    const similarity = calculateProfileSimilarity(profile1, userProfile2);
    return similarity.overall;
  } catch (error) {
    console.error('[BridgeQualityAnalyzer] Error calculating similarity:', error);
    return 0.5; // Fallback
  }
}

/**
 * Convert LinkedInProfile to UserProfile format for similarity calculation
 */
function convertLinkedInProfileToUserProfile(linkedInProfile: LinkedInProfile): UserProfile {
  // Convert LinkedInProfile to UserProfile format for similarity calculation
  return {
    id: linkedInProfile.id || linkedInProfile.publicId || '',
    name: linkedInProfile.name || '',
    email: '',
    location: linkedInProfile.location,
    title: linkedInProfile.headline || linkedInProfile.currentRole?.title || '',
    workExperience: (linkedInProfile.experience || []).map(exp => ({
      id: `${exp.company}-${exp.title}`,
      company: exp.company,
      title: exp.title,
      startDate: '',
      endDate: '',
      location: exp.location || '',
      description: '',
      industry: '',
      achievements: [],
      skills: [],
      domains: [],
      responsibilities: [],
    })),
    education: (linkedInProfile.education || []).map(edu => ({
      id: `${edu.school}-${edu.degree || ''}`,
      school: edu.school,
      degree: edu.degree || '',
      field: edu.field || '',
      startDate: '',
      endDate: null,
    })),
    projects: [],
    skills: (linkedInProfile.skills || []).map(skill => ({
      name: typeof skill === 'string' ? skill : skill.name,
      level: 'intermediate' as const,
      yearsOfExperience: 1,
      category: 'Technical',
    })),
    metadata: {
      totalYearsExperience: 0,
      domains: [],
      seniority: 'entry' as const,
      careerStage: 'professional' as const,
    },
  };
}

/**
 * Find shared interests across all three profiles
 */
function findSharedInterests(
  sourceProfile: UserProfile,
  steppingStoneProfile: LinkedInProfile,
  targetProfile: UserProfile
): string[] {
  const sharedInterests: Set<string> = new Set();

  // Extract skills from all profiles
  const sourceSkills = new Set(sourceProfile.skills?.map(s => s.name) || []);
  const stoneSkills = new Set(
    steppingStoneProfile.skills?.map(s => typeof s === 'string' ? s : s.name) || []
  );
  const targetSkills = new Set(targetProfile.skills?.map(s => s.name) || []);

  // Find skills present in all three
  for (const skill of sourceSkills) {
    if (stoneSkills.has(skill) && targetSkills.has(skill)) {
      sharedInterests.add(skill);
    }
  }

  // Add industries if matching (from most recent work experience)
  const sourceIndustry = sourceProfile.workExperience?.[0]?.industry;
  const targetIndustry = targetProfile.workExperience?.[0]?.industry;
  if (sourceIndustry && targetIndustry && sourceIndustry === targetIndustry) {
    sharedInterests.add(sourceIndustry);
  }

  return Array.from(sharedInterests).slice(0, 5); // Top 5 interests
}

/**
 * Generate best angle for reaching out to stepping stone
 */
function generateBestAngle(
  sourceProfile: UserProfile,
  _steppingStoneProfile: LinkedInProfile,
  _targetProfile: UserProfile,
  sharedInterests: string[]
): string {
  if (sharedInterests.length > 0) {
    return `Shared interests: ${sharedInterests.slice(0, 3).join(', ')}`;
  }

  // Fallback to industry
  const sourceIndustry = sourceProfile.workExperience?.[0]?.industry;
  if (sourceIndustry) {
    return `Common industry: ${sourceIndustry}`;
  }

  return 'Professional networking opportunity';
}
