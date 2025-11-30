/**
 * Performance Test for Lexicon-Based Keyword Extraction
 * Tests extraction speed and quality
 */

import { extractKeywordsFromJobDescription } from './src/services/keyword-extractor';

// Test job descriptions of varying lengths
const testCases = [
  {
    name: 'Short Description (373 chars)',
    description: `We are seeking talented individuals at all experience levels to work on cutting-edge cloud technologies.
    This position requires strong software engineering skills and experience with modern cloud platforms.
    Candidates should be comfortable working with U.S. government clients and have excellent communication skills.`,
  },
  {
    name: 'Medium Description (800 chars)',
    description: `Senior Software Engineer - Full Stack Development

    We are looking for a Senior Software Engineer with 5+ years of experience in full-stack development.

    Required Skills:
    - Python, JavaScript, TypeScript
    - React, Node.js, Express
    - PostgreSQL, MongoDB, Redis
    - AWS, Docker, Kubernetes
    - CI/CD, Git, Agile

    Preferred Skills:
    - Machine Learning, AI
    - GraphQL, REST APIs
    - Microservices architecture
    - Performance optimization

    Responsibilities:
    - Design and implement scalable web applications
    - Collaborate with cross-functional teams
    - Mentor junior developers
    - Code review and documentation

    Benefits:
    - Competitive salary
    - Remote work options
    - Health insurance
    - Professional development budget`,
  },
  {
    name: 'Long Description (1500 chars)',
    description: `DevOps Engineer - Cloud Infrastructure

    About the Role:
    We are seeking an experienced DevOps Engineer to join our growing infrastructure team. You will be responsible for managing our AWS cloud infrastructure, implementing CI/CD pipelines, and ensuring high availability and performance of our applications.

    Required Qualifications:
    - 5+ years of experience in DevOps/SRE roles
    - Strong expertise in AWS services (EC2, S3, RDS, Lambda, CloudFormation)
    - Proficiency in infrastructure as code (Terraform, Pulumi)
    - Experience with containerization (Docker, Kubernetes, ECS)
    - Deep understanding of CI/CD tools (Jenkins, GitHub Actions, GitLab CI)
    - Scripting skills (Python, Bash, PowerShell)
    - Monitoring and observability (Datadog, New Relic, Prometheus)
    - Security best practices and compliance (SOC 2, ISO 27001)

    Preferred Qualifications:
    - AWS certifications (Solutions Architect, DevOps Engineer)
    - Experience with serverless architectures
    - Knowledge of GraphQL, gRPC, REST APIs
    - Familiarity with Agile/Scrum methodologies
    - Experience with performance optimization and cost management

    Key Responsibilities:
    - Design and maintain AWS infrastructure using IaC
    - Implement and optimize CI/CD pipelines
    - Monitor system performance and ensure SLA compliance
    - Troubleshoot production issues and reduce MTTR
    - Collaborate with development teams on architecture decisions
    - Document processes and create runbooks
    - Participate in on-call rotation

    Technical Stack:
    AWS, Terraform, Docker, Kubernetes, Python, Go, Jenkins, Datadog, PostgreSQL, Redis, Kafka, Airflow

    Benefits:
    - Competitive salary ($150K-$200K)
    - Equity/stock options
    - Full health, dental, vision insurance
    - 401(k) matching
    - Unlimited PTO
    - Remote work flexibility
    - Professional development budget ($5K/year)`,
  },
  {
    name: 'Healthcare Industry (with HIPAA)',
    description: `Senior Backend Engineer - Healthcare Platform

    We are building a HIPAA-compliant electronic health records (EHR) system using modern cloud technologies.

    Required:
    - Python, Java, or Go
    - FHIR, HL7 standards
    - HIPAA compliance knowledge
    - AWS or Azure
    - SQL databases (PostgreSQL, MySQL)
    - RESTful API design
    - Security best practices

    Preferred:
    - Healthcare industry experience
    - OAuth 2.0, JWT
    - Microservices architecture
    - Test-driven development (TDD)

    KPIs:
    - API response time < 200ms
    - 99.9% uptime SLA
    - Zero data breaches
    - MTTR < 30 minutes`,
  },
];

interface TestResult {
  name: string;
  keywordCount: number;
  extractionTime: number;
  keywords: string[];
  passed: boolean;
  reason?: string;
}

function runPerformanceTest(): TestResult[] {
  const results: TestResult[] = [];

  console.log('╔════════════════════════════════════════════════════════════════╗');
  console.log('║   LEXICON-BASED KEYWORD EXTRACTION PERFORMANCE TEST           ║');
  console.log('╚════════════════════════════════════════════════════════════════╝\n');

  for (const testCase of testCases) {
    const startTime = performance.now();
    const keywords = extractKeywordsFromJobDescription(testCase.description);
    const endTime = performance.now();
    const extractionTime = endTime - startTime;

    const keywordPhrases = keywords.map(k => k.phrase);
    const keywordCount = keywords.length;

    // Quality checks
    const hasFillerWords = keywordPhrases.some(kw =>
      ['position', 'candidate', 'requirements', 'required', 'experience', 'level'].includes(kw.toLowerCase())
    );

    const hasReasonableCount = keywordCount >= 5 && keywordCount <= 50;
    const isFastEnough = extractionTime < 300;

    const passed = !hasFillerWords && hasReasonableCount && isFastEnough;
    const reason = !passed
      ? `${hasFillerWords ? 'Has filler words. ' : ''}${!hasReasonableCount ? `Wrong count (${keywordCount}). ` : ''}${!isFastEnough ? 'Too slow. ' : ''}`
      : undefined;

    results.push({
      name: testCase.name,
      keywordCount,
      extractionTime,
      keywords: keywordPhrases,
      passed,
      reason,
    });

    // Print results
    const status = passed ? '✅' : '❌';
    console.log(`${status} ${testCase.name}`);
    console.log(`   ${keywordCount} keywords in ${extractionTime.toFixed(2)}ms`);
    if (reason) {
      console.log(`   ⚠️  ${reason}`);
    }
    console.log(`   Top 10: ${keywordPhrases.slice(0, 10).join(', ')}`);
    console.log('');
  }

  // Summary
  const totalPassed = results.filter(r => r.passed).length;
  const totalTests = results.length;
  const avgTime = results.reduce((sum, r) => sum + r.extractionTime, 0) / results.length;
  const totalKeywords = results.reduce((sum, r) => sum + r.keywordCount, 0);

  console.log('╔════════════════════════════════════════════════════════════════╗');
  console.log('║   PERFORMANCE TEST SUMMARY                                     ║');
  console.log('╚════════════════════════════════════════════════════════════════╝\n');
  console.log(`Total Tests:       ${totalTests}`);
  console.log(`✅ Passed:         ${totalPassed} (${((totalPassed / totalTests) * 100).toFixed(1)}%)`);
  console.log(`❌ Failed:         ${totalTests - totalPassed} (${(((totalTests - totalPassed) / totalTests) * 100).toFixed(1)}%)`);
  console.log('');
  console.log('⏱️  Performance:');
  console.log(`   Average duration:   ${avgTime.toFixed(2)}ms`);
  console.log(`   Total keywords:     ${totalKeywords}`);
  console.log(`   Average keywords:   ${(totalKeywords / totalTests).toFixed(1)} per job`);
  console.log('');

  return results;
}

// Run the test
const results = runPerformanceTest();

// Exit with code 0 if all passed, 1 if any failed
const allPassed = results.every(r => r.passed);
process.exit(allPassed ? 0 : 1);
