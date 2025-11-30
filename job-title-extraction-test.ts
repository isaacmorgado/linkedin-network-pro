/**
 * Job Title Extraction Test Suite
 * Simulates DOM structures to validate extraction logic
 */

// ============================================================================
// VALIDATION FUNCTION (copied from linkedin-job-scraper.ts)
// ============================================================================

function isValidJobTitle(title: string): boolean {
  const skipPatterns = [
    /^(WHAT|WHY|WHO|HOW|WHERE|WHEN)\s/i,
    /MAKES US DIFFERENT/i,
    /ABOUT (US|THE|THIS|THE JOB)/i,
    /^About the Job$/i,
    /OUR (MISSION|VISION|VALUES|CULTURE|TEAM)/i,
    /BENEFITS AND/i,
    /SIGN IN|LOG IN|JOIN NOW/i,
    /Skip to main content/i,
    /notification/i,
    /My Network/i,
    /Messaging/i,
    /For Business/i,
    /Premium/i,
    /GET STARTED/i,
    /LEARN MORE/i,
    /APPLY NOW/i,
    /^\d+\s*(years?|months?|days?)/i,
    /^\d+\s*applications?/i,
    /^\d+\s+notifications?/i,
    /notifications?\s+(total|unread)/i,
    /viewed|posted|reviewed|active/i,
    /applicants?|connections?|benefits?/i,
    /reactivate|cancel|upgrade/i,
    /\(verified\s+job\)/i,
    /^(on-site|remote|hybrid)$/i,
    /people you can reach out to/i,  // ⭐ Key pattern
    /meet the (hiring )?team/i,
    /^(skills?|qualifications?)$/i,
    /^(company|job) (highlights?|description)$/i,
    /^see (more|less)$/i,
    /^show (more|less|all)$/i,
    /^save( this)?( job)?$/i,
    /^share( this)?( job)?$/i,
    /^report( this)?( job)?$/i,
    /^(easy )?apply$/i,
    /^(save|share|report|apply|dismiss)$/i,
    /^\d+\s+(applicants?|views?)$/i,
    /be among the first/i,
    /^(you|your) (network|connections?|profile)$/i,
  ];

  if (!title || title.length < 3 || title.length > 150) {
    return false;
  }

  if (skipPatterns.some(pattern => pattern.test(title))) {
    return false;
  }

  return true;
}

// ============================================================================
// EXTRACTION SIMULATION (Strategy 1: expandable-text-box parent)
// ============================================================================

interface MockHeading {
  textContent: string;
  depth: number;
}

function simulateExpandableBoxParentExtraction(
  headingsByDepth: MockHeading[][]
): { found: boolean; title: string | null; depth: number | null } {
  console.log('\n🔍 STRATEGY 1: Expandable-text-box parent extraction');
  console.log('━'.repeat(80));

  for (let depth = 0; depth < Math.min(10, headingsByDepth.length); depth++) {
    const headings = headingsByDepth[depth] || [];
    console.log(`\n📊 Depth ${depth}: Found ${headings.length} h1/h2 element(s)`);

    for (const heading of headings) {
      const title = heading.textContent.trim();
      console.log(`   Checking: "${title}"`);

      if (isValidJobTitle(title)) {
        console.log(`   ✅ VALID - Job title found!`);
        return { found: true, title, depth };
      } else {
        console.log(`   ❌ INVALID - Skipping (matches skip pattern)`);
      }
    }
  }

  console.log('\n⚠️  Searched 10 parent levels, no valid job title found');
  return { found: false, title: null, depth: null };
}

// ============================================================================
// EXTRACTION SIMULATION (Strategy 2: h1/h2 in job containers)
// ============================================================================

interface MockContainer {
  name: string;
  headings: string[];
}

function simulateH1H2ContainerExtraction(
  containers: MockContainer[]
): { found: boolean; title: string | null; container: string | null } {
  console.log('\n🔍 STRATEGY 2: H1/H2 in job containers extraction');
  console.log('━'.repeat(80));

  for (const container of containers) {
    console.log(`\n📦 Container: ${container.name}`);
    console.log(`   Found ${container.headings.length} h1/h2 element(s)`);

    for (const headingText of container.headings) {
      const title = headingText.trim();
      console.log(`   Checking: "${title}"`);

      if (isValidJobTitle(title)) {
        console.log(`   ✅ VALID - Job title found!`);
        return { found: true, title, container: container.name };
      } else {
        console.log(`   ❌ INVALID - Skipping (matches skip pattern)`);
      }
    }
  }

  console.log('\n⚠️  No valid job title found in any container');
  return { found: false, title: null, container: null };
}

// ============================================================================
// TEST CASES
// ============================================================================

interface TestCase {
  name: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  description: string;
  expectedTitle: string;
  strategy1Data?: MockHeading[][];  // headings by depth
  strategy2Data?: MockContainer[];   // containers with headings
}

const testCases: TestCase[] = [
  // ========================================
  // TEST 1: User's Real Example (Comcast Job)
  // ========================================
  {
    name: 'Test 1: User\'s Real Example',
    difficulty: 'Easy',
    description: 'Comcast Software Engineer job with "About the job" and "People you can reach out to" as noise',
    expectedTitle: 'Software Engineer - Entertainment Metadata Platform',
    strategy1Data: [
      // Depth 0: No headings
      [],
      // Depth 1: "About the job" (invalid)
      [{ textContent: 'About the job', depth: 1 }],
      // Depth 2: "About the job" again (invalid)
      [{ textContent: 'About the job', depth: 2 }],
      // Depth 3: "About the job" again (invalid)
      [{ textContent: 'About the job', depth: 3 }],
      // Depth 4: "People you can reach out to" (invalid)
      [{ textContent: 'People you can reach out to', depth: 4 }],
      // Depth 5: Real job title (VALID!)
      [{ textContent: 'Software Engineer - Entertainment Metadata Platform', depth: 5 }],
    ],
  },

  // ========================================
  // TEST 2: Multiple Invalid Titles at Each Level (Medium Difficulty)
  // ========================================
  {
    name: 'Test 2: Multiple Invalid Titles Per Level',
    difficulty: 'Medium',
    description: 'Job title buried among multiple h1/h2 elements at each depth level',
    expectedTitle: 'Senior Full Stack Developer - Cloud Infrastructure',
    strategy1Data: [
      // Depth 0: Multiple invalid headings
      [
        { textContent: 'My Network', depth: 0 },
        { textContent: 'Messaging', depth: 0 },
      ],
      // Depth 1: More invalid headings
      [
        { textContent: 'About the Job', depth: 1 },
        { textContent: 'See more', depth: 1 },
      ],
      // Depth 2: Even more invalid headings
      [
        { textContent: 'Skills', depth: 2 },
        { textContent: 'Qualifications', depth: 2 },
        { textContent: 'Meet the hiring team', depth: 2 },
      ],
      // Depth 3: Mix of invalid and valid (valid should be picked)
      [
        { textContent: 'People you can reach out to', depth: 3 },
        { textContent: 'Senior Full Stack Developer - Cloud Infrastructure', depth: 3 },  // ✅ VALID
        { textContent: 'About the company', depth: 3 },
      ],
    ],
  },

  // ========================================
  // TEST 3: Deep Nesting with Fallback to Strategy 2 (Hard Difficulty)
  // ========================================
  {
    name: 'Test 3: Deep Nesting with Strategy 2 Fallback',
    difficulty: 'Hard',
    description: 'Strategy 1 fails completely, must fall back to Strategy 2 with multiple containers',
    expectedTitle: 'Principal Software Architect - Distributed Systems',
    strategy1Data: [
      // All depths have only invalid titles - Strategy 1 will fail
      [{ textContent: 'About the job', depth: 0 }],
      [{ textContent: 'People you can reach out to', depth: 1 }],
      [{ textContent: 'Meet the team', depth: 2 }],
      [{ textContent: 'Skills', depth: 3 }],
      [{ textContent: 'Benefits', depth: 4 }],
      [{ textContent: 'Apply now', depth: 5 }],
      [{ textContent: 'Save this job', depth: 6 }],
      [{ textContent: 'Share this job', depth: 7 }],
      [{ textContent: 'Report this job', depth: 8 }],
      [{ textContent: 'Be among the first', depth: 9 }],
    ],
    strategy2Data: [
      // Container 1: Only invalid headings
      {
        name: '.scaffold-layout__detail',
        headings: [
          'About the Job',
          'Meet the hiring team',
          'People you can reach out to',
        ],
      },
      // Container 2: Mix of invalid and valid (valid should be picked)
      {
        name: '.jobs-search__job-details',
        headings: [
          'Skills',
          'Qualifications',
          'Principal Software Architect - Distributed Systems',  // ✅ VALID
          'See more',
        ],
      },
      // Container 3: Only invalid headings (shouldn't reach here)
      {
        name: '.jobs-unified-top-card',
        headings: [
          'Apply',
          'Save',
        ],
      },
    ],
  },
];

// ============================================================================
// RUN TESTS
// ============================================================================

function runTests(): void {
  console.log('\n╔════════════════════════════════════════════════════════════════╗');
  console.log('║   JOB TITLE EXTRACTION TEST SUITE                             ║');
  console.log('╚════════════════════════════════════════════════════════════════╝\n');

  let passed = 0;
  let failed = 0;

  for (const testCase of testCases) {
    console.log('\n' + '═'.repeat(80));
    console.log(`📋 ${testCase.name} [${testCase.difficulty}]`);
    console.log('═'.repeat(80));
    console.log(`📝 Description: ${testCase.description}`);
    console.log(`🎯 Expected: "${testCase.expectedTitle}"\n`);

    let result: { found: boolean; title: string | null };

    // Try Strategy 1 first
    if (testCase.strategy1Data) {
      const strategy1Result = simulateExpandableBoxParentExtraction(testCase.strategy1Data);

      if (strategy1Result.found) {
        result = strategy1Result;
      } else if (testCase.strategy2Data) {
        // Strategy 1 failed, try Strategy 2
        console.log('\n⚠️  Strategy 1 failed, falling back to Strategy 2...');
        const strategy2Result = simulateH1H2ContainerExtraction(testCase.strategy2Data);
        result = strategy2Result;
      } else {
        result = strategy1Result;
      }
    } else if (testCase.strategy2Data) {
      // Only Strategy 2 provided
      result = simulateH1H2ContainerExtraction(testCase.strategy2Data);
    } else {
      console.log('❌ ERROR: No test data provided!');
      failed++;
      continue;
    }

    // Validate result
    console.log('\n' + '─'.repeat(80));
    console.log('📊 TEST RESULT:');
    console.log('─'.repeat(80));

    if (result.found && result.title === testCase.expectedTitle) {
      console.log(`✅ PASSED`);
      console.log(`   Found: "${result.title}"`);
      console.log(`   Expected: "${testCase.expectedTitle}"`);
      console.log(`   ✓ Match!`);
      passed++;
    } else if (result.found) {
      console.log(`❌ FAILED`);
      console.log(`   Found: "${result.title}"`);
      console.log(`   Expected: "${testCase.expectedTitle}"`);
      console.log(`   ✗ Mismatch!`);
      failed++;
    } else {
      console.log(`❌ FAILED`);
      console.log(`   Found: null`);
      console.log(`   Expected: "${testCase.expectedTitle}"`);
      console.log(`   ✗ No title extracted!`);
      failed++;
    }
  }

  // Summary
  console.log('\n\n╔════════════════════════════════════════════════════════════════╗');
  console.log('║   TEST SUMMARY                                                 ║');
  console.log('╚════════════════════════════════════════════════════════════════╝\n');
  console.log(`Total Tests:  ${testCases.length}`);
  console.log(`✅ Passed:     ${passed} (${((passed / testCases.length) * 100).toFixed(1)}%)`);
  console.log(`❌ Failed:     ${failed} (${((failed / testCases.length) * 100).toFixed(1)}%)`);
  console.log('');

  if (failed === 0) {
    console.log('🎉 ALL TESTS PASSED! Extension is ready for production.');
    process.exit(0);
  } else {
    console.log('⚠️  SOME TESTS FAILED! Fix issues before loading extension.');
    process.exit(1);
  }
}

// Run the tests
runTests();
