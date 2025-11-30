/**
 * Context-Aware UI Test (Phase 5)
 *
 * Tests page context detection and panel type selection:
 * - LinkedIn → Full FloatingPanel
 * - Job application site → MinimalAutofillPanel
 * - Other → No panel
 *
 * Run: npx tsx test-context-aware-ui.ts
 */

import { detectPageContext, getPanelType, shouldShowExtension } from './src/utils/page-context';

// Mock window.location
(global as any).window = {
  location: {
    href: '',
    hostname: '',
    pathname: '',
  },
};

// Mock document
(global as any).document = {
  readyState: 'loading',
  querySelectorAll: () => [],
};

// ============================================================================
// Test Cases
// ============================================================================

interface TestCase {
  name: string;
  url: string;
  expectedContext: 'linkedin' | 'job-application' | 'other';
  expectedPanelType: 'full' | 'minimal' | 'none';
  expectedATS?: string | null;
}

const testCases: TestCase[] = [
  // LinkedIn URLs
  {
    name: 'LinkedIn Feed',
    url: 'https://www.linkedin.com/feed/',
    expectedContext: 'linkedin',
    expectedPanelType: 'full',
  },
  {
    name: 'LinkedIn Jobs',
    url: 'https://www.linkedin.com/jobs/view/123456/',
    expectedContext: 'linkedin',
    expectedPanelType: 'full',
  },
  {
    name: 'LinkedIn Profile',
    url: 'https://www.linkedin.com/in/johndoe/',
    expectedContext: 'linkedin',
    expectedPanelType: 'full',
  },

  // Greenhouse
  {
    name: 'Greenhouse Job Application',
    url: 'https://boards.greenhouse.io/company/jobs/123456',
    expectedContext: 'job-application',
    expectedPanelType: 'minimal',
    expectedATS: 'greenhouse',
  },

  // Lever
  {
    name: 'Lever Job Application',
    url: 'https://jobs.lever.co/company/position-123',
    expectedContext: 'job-application',
    expectedPanelType: 'minimal',
    expectedATS: 'lever',
  },

  // Workday
  {
    name: 'Workday Job Application',
    url: 'https://myworkdayjobs.com/en-US/Company/job/Software-Engineer_R123456',
    expectedContext: 'job-application',
    expectedPanelType: 'minimal',
    expectedATS: 'workday',
  },

  // Indeed
  {
    name: 'Indeed Job Posting',
    url: 'https://www.indeed.com/viewjob?jk=abc123',
    expectedContext: 'job-application',
    expectedPanelType: 'minimal',
    expectedATS: 'indeed',
  },

  // Generic job sites
  {
    name: 'Generic Careers Page',
    url: 'https://example.com/careers/software-engineer',
    expectedContext: 'job-application',
    expectedPanelType: 'minimal',
    expectedATS: null,
  },
  {
    name: 'Generic Jobs Page',
    url: 'https://company.com/jobs/apply/123',
    expectedContext: 'job-application',
    expectedPanelType: 'minimal',
    expectedATS: null,
  },

  // Other URLs (should not show extension)
  {
    name: 'Google Search',
    url: 'https://www.google.com/search?q=software+engineer',
    expectedContext: 'other',
    expectedPanelType: 'none',
  },
  {
    name: 'GitHub Repository',
    url: 'https://github.com/company/repo',
    expectedContext: 'other',
    expectedPanelType: 'none',
  },
  {
    name: 'News Website',
    url: 'https://www.nytimes.com/article',
    expectedContext: 'other',
    expectedPanelType: 'none',
  },
];

// ============================================================================
// Test Runner
// ============================================================================

async function runTests() {
  console.log('╔════════════════════════════════════════════════════════════════════╗');
  console.log('║  CONTEXT-AWARE UI TEST (Phase 5)                                   ║');
  console.log('╚════════════════════════════════════════════════════════════════════╝\n');

  let passed = 0;
  let failed = 0;

  for (const testCase of testCases) {
    console.log(`Test: ${testCase.name}`);
    console.log(`  URL: ${testCase.url}`);

    try {
      // Mock window.location
      const parsedUrl = new URL(testCase.url);
      (global as any).window.location = {
        href: testCase.url,
        hostname: parsedUrl.hostname,
        pathname: parsedUrl.pathname,
      };

      // Detect page context
      const pageInfo = detectPageContext();
      const panelType = getPanelType(pageInfo);
      const shouldShow = shouldShowExtension(pageInfo);

      // Validate results
      const contextMatch = pageInfo.context === testCase.expectedContext;
      const panelTypeMatch = panelType === testCase.expectedPanelType;
      const atsMatch = testCase.expectedATS === undefined || pageInfo.atsSystem === testCase.expectedATS;
      const shouldShowMatch = shouldShow === (testCase.expectedPanelType !== 'none');

      const allPassed = contextMatch && panelTypeMatch && atsMatch && shouldShowMatch;

      if (allPassed) {
        console.log(`  ✅ PASS`);
        console.log(`    Context: ${pageInfo.context}`);
        console.log(`    Panel Type: ${panelType}`);
        if (pageInfo.atsSystem) {
          console.log(`    ATS System: ${pageInfo.atsSystem}`);
        }
        console.log('');
        passed++;
      } else {
        console.log(`  ❌ FAIL`);
        if (!contextMatch) {
          console.log(`    Context: expected "${testCase.expectedContext}", got "${pageInfo.context}"`);
        }
        if (!panelTypeMatch) {
          console.log(`    Panel Type: expected "${testCase.expectedPanelType}", got "${panelType}"`);
        }
        if (!atsMatch) {
          console.log(`    ATS System: expected "${testCase.expectedATS}", got "${pageInfo.atsSystem}"`);
        }
        if (!shouldShowMatch) {
          console.log(`    Should Show: expected ${testCase.expectedPanelType !== 'none'}, got ${shouldShow}`);
        }
        console.log('');
        failed++;
      }
    } catch (error) {
      console.log(`  ❌ FAIL: ${(error as Error).message}\n`);
      failed++;
    }
  }

  // Summary
  console.log('╔════════════════════════════════════════════════════════════════════╗');
  console.log('║  SUMMARY                                                           ║');
  console.log('╚════════════════════════════════════════════════════════════════════╝\n');

  const total = passed + failed;
  const percentage = ((passed / total) * 100).toFixed(1);

  console.log(`Total Tests: ${total}`);
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`Success Rate: ${percentage}%\n`);

  if (failed === 0) {
    console.log('🎉 ALL TESTS PASSED! Phase 5 is production-ready.\n');
    console.log('Context-Aware UI Features:');
    console.log('  ✅ LinkedIn → Full FloatingPanel with all tabs');
    console.log('  ✅ Job applications → MinimalAutofillPanel (Generate only)');
    console.log('  ✅ Other sites → Extension hidden');
    console.log('  ✅ ATS system detection (Greenhouse, Lever, Workday, Indeed, etc.)');
    console.log('  ✅ URL pattern matching for generic job sites\n');
  } else {
    console.log('⚠️  Some tests failed. Review errors above.\n');
  }
}

// Run tests
runTests().catch(console.error);
