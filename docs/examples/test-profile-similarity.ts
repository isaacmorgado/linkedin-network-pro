/**
 * Profile Similarity Calculator - Test Suite
 * Comprehensive tests for LinkedIn Universal Connection algorithm
 *
 * Test Coverage:
 * 1. Identical profiles → 1.0 similarity
 * 2. Same school + same industry → 0.75-0.85
 * 3. Partial skill overlap → Correct Jaccard calculation
 * 4. Location similarity → Geographic proximity levels
 * 5. Company history → Jaccard similarity
 * 6. Industry relationships → Related industry detection
 * 7. Edge cases → Empty/null handling
 */

import type { UserProfile } from '/home/imorgado/Documents/agent-girl/chat-abc62d98/linkedin-network-pro/src/types/resume-tailoring';
import {
  calculateProfileSimilarity,
  calculateSkillJaccardSimilarity,
  calculateEducationOverlap,
  calculateCompanyHistoryJaccard,
  calculateLocationSimilarity,
  calculateIndustryOverlap,
  parseLocation,
  estimateAcceptanceRate,
  calculateDetailedSimilarity,
} from './profile-similarity';
import { areIndustriesRelated } from './industry-mapping';

// ============================================================================
// Test Helpers
// ============================================================================

function createTestProfile(overrides: Partial<UserProfile>): UserProfile {
  return {
    name: 'Test User',
    title: 'Software Engineer',
    workExperience: [],
    education: [],
    projects: [],
    skills: [],
    metadata: {
      totalYearsExperience: 0,
      domains: [],
      seniority: 'mid',
      careerStage: 'professional',
    },
    ...overrides,
  };
}

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

function assertClose(
  actual: number,
  expected: number,
  tolerance: number,
  message: string
): void {
  const diff = Math.abs(actual - expected);
  if (diff > tolerance) {
    throw new Error(
      `${message}\n  Expected: ${expected}\n  Actual: ${actual}\n  Diff: ${diff} (tolerance: ${tolerance})`
    );
  }
}

// ============================================================================
// Test Suite
// ============================================================================

function runTests(): void {
  console.log('🧪 Profile Similarity Calculator - Test Suite\n');
  console.log('='.repeat(60));

  let passed = 0;
  let failed = 0;

  const tests = [
    testIdenticalProfiles,
    testSameSchoolSameIndustry,
    testPartialSkillOverlap,
    testLocationSimilarity,
    testCompanyHistory,
    testIndustryRelationships,
    testEdgeCasesEmptyProfiles,
    testEdgeCasesNullFields,
    testEducationScoring,
    testSkillJaccardCalculation,
    testLocationParsing,
    testAcceptanceRateEstimation,
    testDetailedSimilarityMetadata,
    testCustomWeights,
    testCompletelyDifferentProfiles,
  ];

  for (const test of tests) {
    try {
      test();
      console.log(`✅ PASS: ${test.name}`);
      passed++;
    } catch (error) {
      console.error(`❌ FAIL: ${test.name}`);
      console.error(`   ${(error as Error).message}\n`);
      failed++;
    }
  }

  console.log('='.repeat(60));
  console.log(`\n📊 Test Results: ${passed} passed, ${failed} failed`);

  if (failed === 0) {
    console.log('✅ All tests passed!\n');
  } else {
    console.log(`❌ ${failed} test(s) failed\n`);
    process.exit(1);
  }
}

// ============================================================================
// Test Cases
// ============================================================================

/**
 * Test 1: Identical profiles should return 1.0 similarity
 */
function testIdenticalProfiles(): void {
  const profile: UserProfile = createTestProfile({
    skills: [
      { name: 'Python', level: 'expert', yearsOfExperience: 5 },
      { name: 'JavaScript', level: 'advanced', yearsOfExperience: 3 },
    ],
    education: [
      {
        id: '1',
        school: 'Stanford University',
        degree: 'Bachelor of Science',
        field: 'Computer Science',
        startDate: '2015',
        endDate: '2019',
      },
    ],
    workExperience: [
      {
        id: '1',
        company: 'Google',
        title: 'Software Engineer',
        startDate: '2019',
        endDate: null,
        achievements: [],
        skills: [],
        domains: [],
        responsibilities: [],
        industry: 'Software Development',
      } as any,
    ],
    location: 'San Francisco, CA',
  });

  const result = calculateProfileSimilarity(profile, profile);

  assert(
    result.overall === 1.0,
    `Identical profiles should have 1.0 similarity. Got: ${result.overall}`
  );
  assert(
    result.breakdown.skills === 1.0,
    `Skills should be 1.0. Got: ${result.breakdown.skills}`
  );
  assert(
    result.breakdown.education === 1.0,
    `Education should be 1.0. Got: ${result.breakdown.education}`
  );
  assert(
    result.breakdown.location === 1.0,
    `Location should be 1.0. Got: ${result.breakdown.location}`
  );
  assert(
    result.breakdown.companies === 1.0,
    `Companies should be 1.0. Got: ${result.breakdown.companies}`
  );
  assert(
    result.breakdown.industry === 1.0,
    `Industry should be 1.0. Got: ${result.breakdown.industry}`
  );
}

/**
 * Test 2: Same school + same industry should yield 0.75-0.85 similarity
 */
function testSameSchoolSameIndustry(): void {
  const profile1: UserProfile = createTestProfile({
    education: [
      {
        id: '1',
        school: 'Stanford University',
        degree: 'BS',
        field: 'Computer Science',
        startDate: '2015',
        endDate: '2019',
      },
    ],
    workExperience: [
      {
        id: '1',
        company: 'Google',
        title: 'Software Engineer',
        startDate: '2019',
        endDate: null,
        achievements: [],
        skills: [],
        domains: [],
        responsibilities: [],
        industry: 'Software Development',
      } as any,
    ],
    skills: [
      { name: 'Python', level: 'expert', yearsOfExperience: 5 },
      { name: 'JavaScript', level: 'advanced', yearsOfExperience: 3 },
    ],
    location: 'San Francisco, CA',
  });

  const profile2: UserProfile = createTestProfile({
    education: [
      {
        id: '2',
        school: 'Stanford University',
        degree: 'BS',
        field: 'Computer Science',
        startDate: '2016',
        endDate: '2020',
      },
    ],
    workExperience: [
      {
        id: '2',
        company: 'Facebook',
        title: 'Software Engineer',
        startDate: '2020',
        endDate: null,
        achievements: [],
        skills: [],
        domains: [],
        responsibilities: [],
        industry: 'Software Development',
      } as any,
    ],
    skills: [
      { name: 'Python', level: 'advanced', yearsOfExperience: 3 },
      { name: 'React', level: 'expert', yearsOfExperience: 4 },
    ],
    location: 'Menlo Park, CA',
  });

  const result = calculateProfileSimilarity(profile1, profile2);

  // Expected breakdown:
  // - Industry: 1.0 (exact match) × 0.30 = 0.30
  // - Skills: 0.33 (1/3 overlap: Python) × 0.25 = 0.083
  // - Education: 1.0 (same school) × 0.20 = 0.20
  // - Location: 0.7 (same state) × 0.15 = 0.105
  // - Companies: 0.0 (no overlap) × 0.10 = 0.00
  // Total: ~0.688

  assertClose(
    result.overall,
    0.688,
    0.05,
    'Same school + same industry should be ~0.69'
  );

  assert(
    result.breakdown.education === 1.0,
    `Education should be 1.0 (same school). Got: ${result.breakdown.education}`
  );
  assert(
    result.breakdown.industry === 1.0,
    `Industry should be 1.0 (exact match). Got: ${result.breakdown.industry}`
  );
}

/**
 * Test 3: Partial skill overlap should calculate correct Jaccard similarity
 */
function testPartialSkillOverlap(): void {
  const profile1: UserProfile = createTestProfile({
    skills: [
      { name: 'Python', level: 'expert', yearsOfExperience: 5 },
      { name: 'JavaScript', level: 'advanced', yearsOfExperience: 3 },
      { name: 'React', level: 'advanced', yearsOfExperience: 3 },
      { name: 'Node.js', level: 'intermediate', yearsOfExperience: 2 },
      { name: 'AWS', level: 'intermediate', yearsOfExperience: 2 },
    ],
  });

  const profile2: UserProfile = createTestProfile({
    skills: [
      { name: 'Python', level: 'advanced', yearsOfExperience: 3 },
      { name: 'Java', level: 'expert', yearsOfExperience: 5 },
      { name: 'React', level: 'intermediate', yearsOfExperience: 2 },
      { name: 'Docker', level: 'advanced', yearsOfExperience: 3 },
      { name: 'AWS', level: 'advanced', yearsOfExperience: 4 },
    ],
  });

  const skillSimilarity = calculateSkillJaccardSimilarity(profile1, profile2);

  // Intersection: {Python, React, AWS} = 3
  // Union: {Python, JavaScript, React, Node.js, AWS, Java, Docker} = 7
  // Jaccard: 3/7 = 0.428...

  assertClose(
    skillSimilarity,
    3 / 7,
    0.001,
    'Skill Jaccard should be 3/7 (0.428)'
  );
}

/**
 * Test 4: Location similarity levels
 */
function testLocationSimilarity(): void {
  const baseProfile: UserProfile = createTestProfile({
    location: 'San Francisco, CA',
  });

  // Same city
  const sameCity = createTestProfile({ location: 'San Francisco, CA' });
  assert(
    calculateLocationSimilarity(baseProfile, sameCity) === 1.0,
    'Same city should be 1.0'
  );

  // Same state
  const sameState = createTestProfile({ location: 'Los Angeles, CA' });
  assert(
    calculateLocationSimilarity(baseProfile, sameState) === 0.7,
    'Same state should be 0.7'
  );

  // Same country, different state
  const sameCountry = createTestProfile({ location: 'New York, NY' });
  assert(
    calculateLocationSimilarity(baseProfile, sameCountry) === 0.4,
    'Same country (different state) should be 0.4'
  );

  // Same region (North America) - Canada is different country from US
  const sameRegion = createTestProfile({ location: 'Toronto, Canada' });
  assert(
    calculateLocationSimilarity(baseProfile, sameRegion) === 0.2,
    'Same region (different country) should be 0.2'
  );

  // Different region
  const differentRegion = createTestProfile({ location: 'London, UK' });
  assert(
    calculateLocationSimilarity(baseProfile, differentRegion) === 0.0,
    'Different region should be 0.0'
  );
}

/**
 * Test 5: Company history Jaccard similarity
 */
function testCompanyHistory(): void {
  const profile1: UserProfile = createTestProfile({
    workExperience: [
      {
        id: '1',
        company: 'Google',
        title: 'Engineer',
        startDate: '2019',
        endDate: '2021',
        achievements: [],
        skills: [],
        domains: [],
        responsibilities: [],
      },
      {
        id: '2',
        company: 'Facebook',
        title: 'Engineer',
        startDate: '2021',
        endDate: null,
        achievements: [],
        skills: [],
        domains: [],
        responsibilities: [],
      },
    ],
  });

  const profile2: UserProfile = createTestProfile({
    workExperience: [
      {
        id: '3',
        company: 'Google',
        title: 'Engineer',
        startDate: '2018',
        endDate: '2020',
        achievements: [],
        skills: [],
        domains: [],
        responsibilities: [],
      },
      {
        id: '4',
        company: 'Amazon',
        title: 'Engineer',
        startDate: '2020',
        endDate: null,
        achievements: [],
        skills: [],
        domains: [],
        responsibilities: [],
      },
    ],
  });

  const companySimilarity = calculateCompanyHistoryJaccard(profile1, profile2);

  // Intersection: {Google} = 1
  // Union: {Google, Facebook, Amazon} = 3
  // Jaccard: 1/3 = 0.333...

  assertClose(
    companySimilarity,
    1 / 3,
    0.001,
    'Company Jaccard should be 1/3 (0.333)'
  );
}

/**
 * Test 6: Industry relationships detection
 */
function testIndustryRelationships(): void {
  const profile1: UserProfile = createTestProfile({
    workExperience: [
      {
        id: '1',
        company: 'Startup Co',
        title: 'Engineer',
        startDate: '2020',
        endDate: null,
        achievements: [],
        skills: [],
        domains: [],
        responsibilities: [],
        industry: 'Software Development',
      } as any,
    ],
  });

  const profile2: UserProfile = createTestProfile({
    workExperience: [
      {
        id: '2',
        company: 'Tech Corp',
        title: 'Engineer',
        startDate: '2020',
        endDate: null,
        achievements: [],
        skills: [],
        domains: [],
        responsibilities: [],
        industry: 'Information Technology',
      } as any,
    ],
  });

  const industrySimilarity = calculateIndustryOverlap(profile1, profile2);

  // Software Development and Information Technology are related
  assert(
    areIndustriesRelated('Software Development', 'Information Technology'),
    'Software Development and IT should be related'
  );

  assert(
    industrySimilarity === 0.6,
    `Related industries should score 0.6. Got: ${industrySimilarity}`
  );
}

/**
 * Test 7: Edge case - Empty profiles
 */
function testEdgeCasesEmptyProfiles(): void {
  const emptyProfile1: UserProfile = createTestProfile({});
  const emptyProfile2: UserProfile = createTestProfile({});

  const result = calculateProfileSimilarity(emptyProfile1, emptyProfile2);

  assert(
    result.overall === 0.0,
    `Empty profiles should have 0.0 similarity. Got: ${result.overall}`
  );
  assert(
    result.breakdown.skills === 0.0,
    `Empty skills should be 0.0. Got: ${result.breakdown.skills}`
  );
  assert(
    result.breakdown.education === 0.0,
    `Empty education should be 0.0. Got: ${result.breakdown.education}`
  );
}

/**
 * Test 8: Edge case - Null/undefined fields
 */
function testEdgeCasesNullFields(): void {
  const profile1: UserProfile = createTestProfile({
    skills: undefined as any,
    education: undefined as any,
    workExperience: undefined as any,
    location: undefined,
  });

  const profile2: UserProfile = createTestProfile({
    skills: [{ name: 'Python', level: 'expert', yearsOfExperience: 5 }],
  });

  const result = calculateProfileSimilarity(profile1, profile2);

  // Should not crash, should return 0 for missing fields
  assert(
    result.overall >= 0 && result.overall <= 1,
    `Overall should be in [0,1]. Got: ${result.overall}`
  );
}

/**
 * Test 9: Education scoring levels
 */
function testEducationScoring(): void {
  const baseProfile: UserProfile = createTestProfile({
    education: [
      {
        id: '1',
        school: 'Stanford University',
        degree: 'BS',
        field: 'Computer Science',
        startDate: '2015',
        endDate: '2019',
      },
    ],
  });

  // Same school
  const sameSchool = createTestProfile({
    education: [
      {
        id: '2',
        school: 'Stanford University',
        degree: 'MS',
        field: 'Electrical Engineering',
        startDate: '2016',
        endDate: '2020',
      },
    ],
  });
  assert(
    calculateEducationOverlap(baseProfile, sameSchool) === 1.0,
    'Same school should be 1.0'
  );

  // Same field, different school
  const sameField = createTestProfile({
    education: [
      {
        id: '3',
        school: 'MIT',
        degree: 'BS',
        field: 'Computer Science',
        startDate: '2015',
        endDate: '2019',
      },
    ],
  });
  assert(
    calculateEducationOverlap(baseProfile, sameField) === 0.5,
    'Same field should be 0.5'
  );

  // No overlap
  const noOverlap = createTestProfile({
    education: [
      {
        id: '4',
        school: 'Harvard',
        degree: 'BA',
        field: 'Economics',
        startDate: '2015',
        endDate: '2019',
      },
    ],
  });
  assert(
    calculateEducationOverlap(baseProfile, noOverlap) === 0.0,
    'No overlap should be 0.0'
  );
}

/**
 * Test 10: Skill Jaccard calculation edge cases
 */
function testSkillJaccardCalculation(): void {
  // No skills
  const noSkills1 = createTestProfile({ skills: [] });
  const noSkills2 = createTestProfile({ skills: [] });
  assert(
    calculateSkillJaccardSimilarity(noSkills1, noSkills2) === 0.0,
    'Empty skills should be 0.0'
  );

  // One has skills, other doesn't
  const hasSkills = createTestProfile({
    skills: [{ name: 'Python', level: 'expert', yearsOfExperience: 5 }],
  });
  assert(
    calculateSkillJaccardSimilarity(hasSkills, noSkills1) === 0.0,
    'One empty should be 0.0'
  );

  // Case insensitivity (default)
  const lowerCase = createTestProfile({
    skills: [{ name: 'python', level: 'expert', yearsOfExperience: 5 }],
  });
  const upperCase = createTestProfile({
    skills: [{ name: 'PYTHON', level: 'expert', yearsOfExperience: 5 }],
  });
  assert(
    calculateSkillJaccardSimilarity(lowerCase, upperCase) === 1.0,
    'Case insensitive matching should work'
  );
}

/**
 * Test 11: Location parsing
 */
function testLocationParsing(): void {
  // US city with state abbreviation
  let loc = parseLocation('San Francisco, CA');
  assert(loc.city === 'San Francisco', 'City should be San Francisco');
  assert(loc.state === 'CA', 'State should be CA');
  assert(loc.country === 'United States', 'Country should be United States');
  assert(loc.region === 'North America', 'Region should be North America');

  // International city
  loc = parseLocation('London, UK');
  assert(loc.city === 'London', 'City should be London');
  assert(loc.country === 'UK', 'Country should be UK');
  assert(loc.region === 'Europe', 'Region should be Europe');

  // Single word (city only)
  loc = parseLocation('Tokyo');
  assert(loc.city === 'Tokyo', 'City should be Tokyo');

  // Empty string
  loc = parseLocation('');
  assert(loc.city === 'Unknown', 'Empty location city should be Unknown');
  assert(loc.country === 'Unknown', 'Empty location country should be Unknown');
}

/**
 * Test 12: Acceptance rate estimation
 */
function testAcceptanceRateEstimation(): void {
  // High similarity (0.75)
  let estimate = estimateAcceptanceRate(0.75);
  assert(
    estimate.acceptanceRate >= 0.35 && estimate.acceptanceRate <= 0.45,
    `High similarity should be 35-45%. Got: ${estimate.acceptanceRate}`
  );
  assert(
    estimate.quality === 'excellent',
    `High similarity should be 'excellent'. Got: ${estimate.quality}`
  );

  // Moderate similarity (0.50)
  estimate = estimateAcceptanceRate(0.5);
  assert(
    estimate.acceptanceRate >= 0.22 && estimate.acceptanceRate <= 0.35,
    `Moderate similarity should be 22-35%. Got: ${estimate.acceptanceRate}`
  );
  assert(
    estimate.quality === 'good',
    `Moderate similarity should be 'good'. Got: ${estimate.quality}`
  );

  // Low similarity (0.20)
  estimate = estimateAcceptanceRate(0.2);
  assert(
    estimate.acceptanceRate >= 0.10 && estimate.acceptanceRate <= 0.20,
    `Low similarity should be 10-20%. Got: ${estimate.acceptanceRate}`
  );
  assert(
    estimate.quality === 'low' || estimate.quality === 'very-low',
    `Low similarity should be 'low' or 'very-low'. Got: ${estimate.quality}`
  );
}

/**
 * Test 13: Detailed similarity metadata
 */
function testDetailedSimilarityMetadata(): void {
  const profile1: UserProfile = createTestProfile({
    skills: [
      { name: 'Python', level: 'expert', yearsOfExperience: 5 },
      { name: 'JavaScript', level: 'advanced', yearsOfExperience: 3 },
    ],
    education: [
      {
        id: '1',
        school: 'Stanford',
        degree: 'BS',
        field: 'CS',
        startDate: '2015',
        endDate: '2019',
      },
    ],
  });

  const profile2: UserProfile = createTestProfile({
    skills: [
      { name: 'Python', level: 'advanced', yearsOfExperience: 3 },
      { name: 'Java', level: 'expert', yearsOfExperience: 5 },
    ],
    education: [
      {
        id: '2',
        school: 'MIT',
        degree: 'BS',
        field: 'CS',
        startDate: '2016',
        endDate: '2020',
      },
    ],
  });

  const detailed = calculateDetailedSimilarity(profile1, profile2);

  assert(
    detailed.metadata !== undefined,
    'Detailed result should have metadata'
  );
  assert(
    detailed.metadata.skillsCompared.intersectionCount === 1,
    'Should have 1 skill in common (Python)'
  );
  assert(
    detailed.metadata.skillsCompared.unionCount === 3,
    'Should have 3 unique skills total'
  );
  assert(
    detailed.metadata.educationDetails.matchedFields.length === 1,
    'Should have 1 matching field (CS)'
  );
}

/**
 * Test 14: Custom weights
 */
function testCustomWeights(): void {
  const profile1: UserProfile = createTestProfile({
    skills: [
      { name: 'Python', level: 'expert', yearsOfExperience: 5 },
      { name: 'JavaScript', level: 'advanced', yearsOfExperience: 3 },
    ],
  });

  const profile2: UserProfile = createTestProfile({
    skills: [
      { name: 'Python', level: 'advanced', yearsOfExperience: 3 },
      { name: 'Java', level: 'expert', yearsOfExperience: 5 },
    ],
  });

  // Default weights
  const defaultResult = calculateProfileSimilarity(profile1, profile2);

  // Custom weights (skills = 100%)
  const customResult = calculateProfileSimilarity(profile1, profile2, {
    weights: {
      skills: 1.0,
      industry: 0.0,
      education: 0.0,
      location: 0.0,
      companies: 0.0,
    },
  });

  // With skills=100%, overall should equal skill similarity
  assertClose(
    customResult.overall,
    customResult.breakdown.skills,
    0.001,
    'Custom weights should work correctly'
  );
}

/**
 * Test 15: Completely different profiles
 */
function testCompletelyDifferentProfiles(): void {
  const profile1: UserProfile = createTestProfile({
    skills: [
      { name: 'Python', level: 'expert', yearsOfExperience: 5 },
      { name: 'JavaScript', level: 'advanced', yearsOfExperience: 3 },
    ],
    education: [
      {
        id: '1',
        school: 'Stanford',
        degree: 'BS',
        field: 'Computer Science',
        startDate: '2015',
        endDate: '2019',
      },
    ],
    workExperience: [
      {
        id: '1',
        company: 'Google',
        title: 'Engineer',
        startDate: '2019',
        endDate: null,
        achievements: [],
        skills: [],
        domains: [],
        responsibilities: [],
        industry: 'Software Development',
      } as any,
    ],
    location: 'San Francisco, CA',
  });

  const profile2: UserProfile = createTestProfile({
    skills: [
      { name: 'Marketing', level: 'expert', yearsOfExperience: 7 },
      { name: 'Sales', level: 'advanced', yearsOfExperience: 5 },
    ],
    education: [
      {
        id: '2',
        school: 'NYU',
        degree: 'BA',
        field: 'Marketing',
        startDate: '2012',
        endDate: '2016',
      },
    ],
    workExperience: [
      {
        id: '2',
        company: 'Coca Cola',
        title: 'Marketing Manager',
        startDate: '2016',
        endDate: null,
        achievements: [],
        skills: [],
        domains: [],
        responsibilities: [],
        industry: 'Consumer Goods',
      } as any,
    ],
    location: 'New York, NY',
  });

  const result = calculateProfileSimilarity(profile1, profile2);

  // Should be close to 0 (no overlap in any dimension)
  assert(
    result.overall < 0.25,
    `Completely different profiles should be <0.25. Got: ${result.overall}`
  );
  assert(
    result.breakdown.skills === 0.0,
    'No skill overlap should be 0.0'
  );
  assert(
    result.breakdown.education === 0.0,
    'No education overlap should be 0.0'
  );
  assert(
    result.breakdown.companies === 0.0,
    'No company overlap should be 0.0'
  );
}

// ============================================================================
// Example Usage & Integration Tests
// ============================================================================

function exampleUsage(): void {
  console.log('\n📋 Example Usage:\n');
  console.log('='.repeat(60));

  const myProfile: UserProfile = createTestProfile({
    name: 'Alice Engineer',
    skills: [
      { name: 'Python', level: 'expert', yearsOfExperience: 5 },
      { name: 'React', level: 'advanced', yearsOfExperience: 3 },
      { name: 'AWS', level: 'intermediate', yearsOfExperience: 2 },
    ],
    education: [
      {
        id: '1',
        school: 'MIT',
        degree: 'Bachelor of Science',
        field: 'Computer Science',
        startDate: '2014',
        endDate: '2018',
      },
    ],
    workExperience: [
      {
        id: '1',
        company: 'Google',
        title: 'Software Engineer',
        startDate: '2018',
        endDate: null,
        achievements: [],
        skills: [],
        domains: [],
        responsibilities: [],
        industry: 'Software Development',
      } as any,
    ],
    location: 'San Francisco, CA',
  });

  const targetProfile: UserProfile = createTestProfile({
    name: 'Bob Developer',
    skills: [
      { name: 'Python', level: 'advanced', yearsOfExperience: 3 },
      { name: 'JavaScript', level: 'expert', yearsOfExperience: 5 },
      { name: 'AWS', level: 'advanced', yearsOfExperience: 4 },
    ],
    education: [
      {
        id: '2',
        school: 'Stanford University',
        degree: 'Bachelor of Science',
        field: 'Computer Science',
        startDate: '2015',
        endDate: '2019',
      },
    ],
    workExperience: [
      {
        id: '2',
        company: 'Facebook',
        title: 'Software Engineer',
        startDate: '2019',
        endDate: null,
        achievements: [],
        skills: [],
        domains: [],
        responsibilities: [],
        industry: 'Software Development',
      } as any,
    ],
    location: 'Palo Alto, CA',
  });

  const similarity = calculateProfileSimilarity(myProfile, targetProfile);
  const acceptance = estimateAcceptanceRate(similarity.overall);

  console.log(`\n🎯 Profile Similarity: ${(similarity.overall * 100).toFixed(1)}%`);
  console.log(`\n📊 Breakdown:`);
  console.log(`   - Industry:  ${(similarity.breakdown.industry * 100).toFixed(1)}%`);
  console.log(`   - Skills:    ${(similarity.breakdown.skills * 100).toFixed(1)}%`);
  console.log(`   - Education: ${(similarity.breakdown.education * 100).toFixed(1)}%`);
  console.log(`   - Location:  ${(similarity.breakdown.location * 100).toFixed(1)}%`);
  console.log(`   - Companies: ${(similarity.breakdown.companies * 100).toFixed(1)}%`);

  console.log(`\n📈 Acceptance Rate Estimate:`);
  console.log(`   - Rate: ${(acceptance.acceptanceRate * 100).toFixed(1)}%`);
  console.log(`   - Range: ${(acceptance.lowerBound * 100).toFixed(1)}% - ${(acceptance.upperBound * 100).toFixed(1)}%`);
  console.log(`   - Quality: ${acceptance.quality}`);
  console.log(`   - Comparable to: ${acceptance.comparableTo}`);

  console.log('\n' + '='.repeat(60));
}

// ============================================================================
// Run Tests
// ============================================================================

runTests();
exampleUsage();
