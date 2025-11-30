/**
 * Composite Similarity Scoring
 * Combines all similarity metrics with detailed metadata
 */

import type { UserProfile } from '../../../types/resume-tailoring';
import type { ProfileSimilarityConfig, DetailedSimilarityResult } from './config-types';
import { calculateProfileSimilarity } from './index';
import { parseLocation } from './location-matcher';
import { areIndustriesRelated } from '../../../lib/industry-mapping';

/**
 * Calculate detailed profile similarity with metadata
 * Useful for debugging and understanding the calculation
 *
 * @param profile1 - First user profile
 * @param profile2 - Second user profile
 * @param config - Optional configuration
 * @returns Detailed similarity result with metadata
 */
export function calculateDetailedSimilarity(
  profile1: UserProfile,
  profile2: UserProfile,
  config?: ProfileSimilarityConfig
): DetailedSimilarityResult {
  const basicResult = calculateProfileSimilarity(profile1, profile2, config);

  // Extract skills for metadata
  const skills1 = new Set(
    (profile1.skills || [])
      .filter((s) => s && s.name) // Filter out undefined/null skills
      .map((s) =>
        config?.caseSensitiveSkills ? s.name : s.name.toLowerCase()
      )
  );
  const skills2 = new Set(
    (profile2.skills || [])
      .filter((s) => s && s.name) // Filter out undefined/null skills
      .map((s) =>
        config?.caseSensitiveSkills ? s.name : s.name.toLowerCase()
      )
  );
  const skillIntersection = new Set([...skills1].filter((s) => skills2.has(s)));
  const skillUnion = new Set([...skills1, ...skills2]);

  // Extract companies for metadata
  const companies1 = new Set(
    (profile1.workExperience || [])
      .filter((e) => e && e.company) // Filter out undefined/null entries
      .map((e) =>
        config?.caseSensitiveCompanies ? e.company : e.company.toLowerCase()
      )
  );
  const companies2 = new Set(
    (profile2.workExperience || [])
      .filter((e) => e && e.company) // Filter out undefined/null entries
      .map((e) =>
        config?.caseSensitiveCompanies ? e.company : e.company.toLowerCase()
    )
  );
  const companyIntersection = new Set([...companies1].filter((c) => companies2.has(c)));
  const companyUnion = new Set([...companies1, ...companies2]);

  // Extract education details
  const schools1 = (profile1.education || []).map((e) => e.school);
  const schools2 = (profile2.education || []).map((e) => e.school);
  const matchedSchools = schools1.filter((s1) =>
    schools2.some((s2) => s1.toLowerCase() === s2.toLowerCase())
  );
  const fields1 = (profile1.education || [])
    .map((e) => e.field)
    .filter(Boolean) as string[];
  const fields2 = (profile2.education || [])
    .map((e) => e.field)
    .filter(Boolean) as string[];
  const matchedFields = fields1.filter((f1) =>
    fields2.some((f2) => f1.toLowerCase() === f2.toLowerCase())
  );

  // Extract industry details
  const industries1 = [
    ...new Set(
      (profile1.workExperience || [])
        .map((e) => (e as any).industry)
        .filter(Boolean)
    ),
  ];
  const industries2 = [
    ...new Set(
      (profile2.workExperience || [])
        .map((e) => (e as any).industry)
        .filter(Boolean)
    ),
  ];
  const exactIndustryMatches = industries1.filter((i1) =>
    industries2.some((i2) => i1.toLowerCase() === i2.toLowerCase())
  );
  const relatedMatches: Array<{ industry1: string; industry2: string }> = [];
  for (const i1 of industries1) {
    for (const i2 of industries2) {
      if (
        i1.toLowerCase() !== i2.toLowerCase() &&
        areIndustriesRelated(i1, i2)
      ) {
        relatedMatches.push({ industry1: i1, industry2: i2 });
      }
    }
  }

  // Parse locations
  const loc1 = parseLocation(profile1.location || '');
  const loc2 = parseLocation(profile2.location || '');
  let matchLevel: 'city' | 'state' | 'country' | 'region' | 'none' = 'none';
  if (loc1.city === loc2.city && loc1.city !== 'Unknown') {
    matchLevel = 'city';
  } else if (loc1.state === loc2.state && loc1.state) {
    matchLevel = 'state';
  } else if (loc1.country === loc2.country && loc1.country !== 'Unknown') {
    matchLevel = 'country';
  } else if (loc1.region === loc2.region && loc1.region !== 'Unknown') {
    matchLevel = 'region';
  }

  return {
    ...basicResult,
    metadata: {
      calculatedAt: new Date(),
      config: config || {},
      skillsCompared: {
        profile1Count: skills1.size,
        profile2Count: skills2.size,
        intersectionCount: skillIntersection.size,
        unionCount: skillUnion.size,
      },
      companiesCompared: {
        profile1Count: companies1.size,
        profile2Count: companies2.size,
        intersectionCount: companyIntersection.size,
        unionCount: companyUnion.size,
      },
      educationDetails: {
        profile1Schools: schools1,
        profile2Schools: schools2,
        matchedSchools,
        matchedFields,
      },
      industryDetails: {
        profile1Industries: industries1,
        profile2Industries: industries2,
        exactMatches: exactIndustryMatches,
        relatedMatches,
      },
      locationDetails: {
        profile1Location: loc1,
        profile2Location: loc2,
        matchLevel,
      },
    },
  };
}
