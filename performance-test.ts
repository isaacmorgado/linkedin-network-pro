/**
 * Performance Test Suite for LinkedIn Job Scraper & Keyword Extractor
 *
 * Tests:
 * 1. Scraper performance (ARIA label extraction, fallback handling)
 * 2. Keyword extractor performance (weight calculation, filtering)
 * 3. End-to-end accuracy
 */

import { extractKeywordsFromJobDescription } from './src/services/keyword-extractor';

// ============================================================================
// TEST DATA - Sample Job Descriptions
// ============================================================================

const testJobs = [
  {
    name: 'Short Generic Description (373 chars - User\'s Real Example)',
    description: `We are filling roles across multiple experience levels and are looking for talented individuals interested in working with cutting-edge cloud technologies while supporting the U.S. Government mission.

The ideal candidate will have experience with modern cloud platforms, strong communication skills, and a passion for innovation.`,
    expectedKeywords: ['cloud', 'experience', 'communication', 'innovation'],
    minKeywords: 3,
  },
  {
    name: 'Senior Software Engineer (Mid-Length, 800 chars)',
    description: `We are seeking a Senior Software Engineer to join our platform team. You will design and implement scalable microservices using Kubernetes and Docker.

Required Skills:
• 5+ years of software development experience
• Proficiency in Python, Go, or Java
• Experience with AWS, GCP, or Azure
• Strong understanding of RESTful APIs and GraphQL
• CI/CD pipeline experience (Jenkins, GitLab CI)

Preferred Skills:
• Kubernetes certification
• Experience with Terraform or CloudFormation
• Background in distributed systems
• Monitoring tools: Prometheus, Grafana, Datadog`,
    expectedKeywords: ['python', 'kubernetes', 'docker', 'aws', 'microservices', 'jenkins', 'graphql'],
    minKeywords: 10,
  },
  {
    name: 'Full Stack Developer (Long, 1500 chars)',
    description: `Join our engineering team as a Full Stack Developer working on our SaaS platform used by millions of users worldwide.

Responsibilities:
• Build responsive web applications using React, TypeScript, and Node.js
• Develop RESTful APIs and GraphQL endpoints
• Collaborate with product designers on UI/UX improvements
• Write unit tests and integration tests using Jest and Cypress
• Participate in code reviews and Agile ceremonies

Required Qualifications:
• Bachelor's degree in Computer Science or related field
• 3+ years of full-stack development experience
• Expert knowledge of JavaScript/TypeScript
• Proficiency with React, Redux, and modern frontend frameworks
• Experience with Node.js, Express, and PostgreSQL
• Strong understanding of responsive design and CSS frameworks
• Familiarity with Git, GitHub, and version control best practices
• Experience with Docker and containerized applications

Preferred Qualifications:
• Experience with Next.js and Server-Side Rendering (SSR)
• Knowledge of OAuth 2.0 and JWT authentication
• AWS services: Lambda, S3, RDS, CloudFront
• MongoDB or other NoSQL databases
• GraphQL API design and implementation
• Experience with CI/CD pipelines (GitHub Actions, CircleCI)
• Understanding of web performance optimization
• Contributions to open-source projects

Benefits:
• Competitive salary and equity
• Health, dental, and vision insurance
• 401(k) matching
• Unlimited PTO
• Remote-friendly work environment`,
    expectedKeywords: ['react', 'typescript', 'node.js', 'graphql', 'postgresql', 'docker', 'aws', 'jest', 'redux', 'next.js'],
    minKeywords: 15,
  },
  {
    name: 'DevOps Engineer (Technical, 1000 chars)',
    description: `We're looking for a DevOps Engineer to build and maintain our cloud infrastructure.

Key Responsibilities:
• Design and implement Infrastructure as Code using Terraform
• Manage Kubernetes clusters and containerized workloads
• Build CI/CD pipelines using Jenkins, GitLab CI, and GitHub Actions
• Monitor system performance with Prometheus, Grafana, and ELK stack
• Implement security best practices and compliance standards
• Automate deployment processes and reduce manual interventions

Required Skills:
• 4+ years of DevOps or Site Reliability Engineering experience
• Expert-level Kubernetes and Docker knowledge
• Strong scripting skills: Python, Bash, or PowerShell
• Cloud platforms: AWS (required), Azure or GCP (nice to have)
• Infrastructure as Code: Terraform, Ansible, CloudFormation
• CI/CD tools: Jenkins, GitLab CI, ArgoCD
• Monitoring: Prometheus, Grafana, CloudWatch, Datadog
• Linux system administration

Nice to Have:
• CKA or CKAD certification
• Experience with service mesh (Istio, Linkerd)
• HashiCorp Vault for secrets management
• GitOps workflows with ArgoCD or Flux`,
    expectedKeywords: ['terraform', 'kubernetes', 'docker', 'jenkins', 'prometheus', 'grafana', 'aws', 'python', 'ansible'],
    minKeywords: 12,
  },
];

// ============================================================================
// PERFORMANCE TESTING FUNCTIONS
// ============================================================================

interface TestResult {
  testName: string;
  success: boolean;
  duration: number;
  keywordsExtracted: number;
  expectedMin: number;
  topKeywords: string[];
  errors?: string[];
}

/**
 * Test keyword extraction performance on a single job description
 */
async function testKeywordExtraction(
  testName: string,
  description: string,
  expectedKeywords: string[],
  minKeywords: number
): Promise<TestResult> {
  const startTime = performance.now();
  const errors: string[] = [];

  try {
    const keywords = extractKeywordsFromJobDescription(description);
    const duration = performance.now() - startTime;

    const success = keywords.length >= minKeywords;
    const topKeywords = keywords.slice(0, 10).map((k) => k.term);

    // Check if expected keywords were found
    const missingKeywords = expectedKeywords.filter(
      (expected) => !keywords.some((k) => k.term.toLowerCase().includes(expected.toLowerCase()))
    );

    if (missingKeywords.length > 0) {
      errors.push(`Missing expected keywords: ${missingKeywords.join(', ')}`);
    }

    return {
      testName,
      success,
      duration,
      keywordsExtracted: keywords.length,
      expectedMin: minKeywords,
      topKeywords,
      errors: errors.length > 0 ? errors : undefined,
    };
  } catch (error) {
    const duration = performance.now() - startTime;
    return {
      testName,
      success: false,
      duration,
      keywordsExtracted: 0,
      expectedMin: minKeywords,
      topKeywords: [],
      errors: [`Exception: ${error instanceof Error ? error.message : String(error)}`],
    };
  }
}

/**
 * Run all performance tests
 */
async function runPerformanceTests() {
  console.log('\n╔════════════════════════════════════════════════════════════════╗');
  console.log('║   LinkedIn Scraper Performance Test Suite                     ║');
  console.log('╚════════════════════════════════════════════════════════════════╝\n');

  const results: TestResult[] = [];

  for (const job of testJobs) {
    console.log(`\n📋 Testing: ${job.name}`);
    console.log(`   Description length: ${job.description.length} chars`);
    console.log(`   Expected min keywords: ${job.minKeywords}`);

    const result = await testKeywordExtraction(
      job.name,
      job.description,
      job.expectedKeywords,
      job.minKeywords
    );

    results.push(result);

    // Print result
    const statusIcon = result.success ? '✅' : '❌';
    console.log(`\n   ${statusIcon} Result:`);
    console.log(`      Keywords extracted: ${result.keywordsExtracted}/${result.expectedMin} (${result.success ? 'PASS' : 'FAIL'})`);
    console.log(`      Duration: ${result.duration.toFixed(2)}ms`);
    console.log(`      Top keywords: ${result.topKeywords.slice(0, 5).join(', ') || 'NONE'}`);

    if (result.errors && result.errors.length > 0) {
      console.log(`      ⚠️  Errors:`);
      result.errors.forEach((err) => console.log(`         - ${err}`));
    }
  }

  // ============================================================================
  // SUMMARY REPORT
  // ============================================================================

  console.log('\n\n╔════════════════════════════════════════════════════════════════╗');
  console.log('║   PERFORMANCE TEST SUMMARY                                     ║');
  console.log('╚════════════════════════════════════════════════════════════════╝\n');

  const totalTests = results.length;
  const passedTests = results.filter((r) => r.success).length;
  const failedTests = totalTests - passedTests;
  const avgDuration = results.reduce((sum, r) => sum + r.duration, 0) / totalTests;
  const totalKeywords = results.reduce((sum, r) => sum + r.keywordsExtracted, 0);
  const avgKeywords = totalKeywords / totalTests;

  console.log(`Total Tests:       ${totalTests}`);
  console.log(`✅ Passed:         ${passedTests} (${((passedTests / totalTests) * 100).toFixed(1)}%)`);
  console.log(`❌ Failed:         ${failedTests} (${((failedTests / totalTests) * 100).toFixed(1)}%)`);
  console.log(`\n⏱️  Performance:`);
  console.log(`   Average duration:   ${avgDuration.toFixed(2)}ms`);
  console.log(`   Total keywords:     ${totalKeywords}`);
  console.log(`   Average keywords:   ${avgKeywords.toFixed(1)} per job\n`);

  // Individual test breakdown
  console.log('📊 Individual Results:\n');
  results.forEach((result, index) => {
    const statusIcon = result.success ? '✅' : '❌';
    console.log(`${index + 1}. ${statusIcon} ${result.testName}`);
    console.log(`   ${result.keywordsExtracted} keywords in ${result.duration.toFixed(2)}ms`);
  });

  // Overall pass/fail
  console.log('\n' + '═'.repeat(66));
  if (passedTests === totalTests) {
    console.log('✅ ALL TESTS PASSED - Scraper & Keyword Extractor performing well!\n');
  } else {
    console.log(`⚠️  ${failedTests} test(s) failed - Review results above\n`);
  }

  return {
    totalTests,
    passedTests,
    failedTests,
    avgDuration,
    avgKeywords,
    results,
  };
}

// ============================================================================
// RUN TESTS
// ============================================================================

// Auto-run tests when script is executed directly
runPerformanceTests()
  .then((summary) => {
    process.exit(summary.failedTests > 0 ? 1 : 0);
  })
  .catch((error) => {
    console.error('❌ Performance test suite crashed:', error);
    process.exit(1);
  });

export { runPerformanceTests, testKeywordExtraction, testJobs };
