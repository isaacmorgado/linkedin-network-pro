/**
 * Automated Form Detection Validation
 *
 * Tests FormDetector against real HTML patterns from popular ATS systems.
 * Runs automatically without browser - gets immediate feedback.
 *
 * Run: npx tsx test-form-detection-automated.ts
 */

import { JSDOM } from 'jsdom';
import { FormDetector, FormFieldType } from './src/services/autofill/form-detector';

// ============================================================================
// Real HTML Patterns from ATS Systems
// ============================================================================

/**
 * Test case with expected detection results
 */
interface TestCase {
  name: string;
  ats: string;
  html: string;
  expectedFields: Array<{
    selector: string;
    expectedType: FormFieldType;
    minConfidence: number;
  }>;
}

/**
 * Real HTML patterns from job application sites
 */
const TEST_CASES: TestCase[] = [
  // ========================================================================
  // GREENHOUSE (Most Common)
  // ========================================================================
  {
    name: 'Greenhouse - Basic Application',
    ats: 'greenhouse',
    html: `
      <form id="application_form" action="https://boards.greenhouse.io/apply" method="post">
        <div class="field">
          <label for="first_name">First Name *</label>
          <input type="text" id="first_name" name="first_name" required>
        </div>
        <div class="field">
          <label for="last_name">Last Name *</label>
          <input type="text" id="last_name" name="last_name" required>
        </div>
        <div class="field">
          <label for="email">Email *</label>
          <input type="email" id="email" name="email" autocomplete="email" required>
        </div>
        <div class="field">
          <label for="phone">Phone *</label>
          <input type="tel" id="phone" name="phone" autocomplete="tel" required>
        </div>
        <div class="field">
          <label for="resume">Resume/CV *</label>
          <input type="file" id="resume" name="resume" accept=".pdf,.doc,.docx" required>
        </div>
        <div class="field">
          <label for="cover_letter">Cover Letter</label>
          <textarea id="cover_letter" name="cover_letter" rows="5"></textarea>
        </div>
        <div class="field">
          <label for="linkedin_url">LinkedIn Profile</label>
          <input type="url" id="linkedin_url" name="linkedin_url">
        </div>
      </form>
    `,
    expectedFields: [
      { selector: '#first_name', expectedType: FormFieldType.FIRST_NAME, minConfidence: 0.9 },
      { selector: '#last_name', expectedType: FormFieldType.LAST_NAME, minConfidence: 0.9 },
      { selector: '#email', expectedType: FormFieldType.EMAIL, minConfidence: 1.0 },
      { selector: '#phone', expectedType: FormFieldType.PHONE, minConfidence: 1.0 },
      { selector: '#resume', expectedType: FormFieldType.RESUME_UPLOAD, minConfidence: 0.9 },
      { selector: '#cover_letter', expectedType: FormFieldType.COVER_LETTER_TEXT, minConfidence: 0.8 },
      { selector: '#linkedin_url', expectedType: FormFieldType.LINKEDIN_URL, minConfidence: 0.9 },
    ],
  },

  // ========================================================================
  // LEVER
  // ========================================================================
  {
    name: 'Lever - Standard Form',
    ats: 'lever',
    html: `
      <form class="lever-form" action="https://jobs.lever.co/submit" method="post">
        <div class="application-question">
          <label>Full name</label>
          <input type="text" name="name" class="application-input" placeholder="Enter your full name">
        </div>
        <div class="application-question">
          <label>Email</label>
          <input type="email" name="email" class="application-input" placeholder="your.email@example.com">
        </div>
        <div class="application-question">
          <label>Phone</label>
          <input type="tel" name="phone" class="application-input" placeholder="+1 (555) 000-0000">
        </div>
        <div class="application-question">
          <label>Current location</label>
          <input type="text" name="location" class="application-input" placeholder="City, State">
        </div>
        <div class="application-question">
          <label>Resume</label>
          <input type="file" name="resume" accept=".pdf,.doc,.docx">
        </div>
        <div class="application-question">
          <label>GitHub URL</label>
          <input type="url" name="urls[GitHub]" class="application-input" placeholder="https://github.com/username">
        </div>
      </form>
    `,
    expectedFields: [
      { selector: 'input[name="name"]', expectedType: FormFieldType.FULL_NAME, minConfidence: 0.7 },
      { selector: 'input[name="email"]', expectedType: FormFieldType.EMAIL, minConfidence: 1.0 },
      { selector: 'input[name="phone"]', expectedType: FormFieldType.PHONE, minConfidence: 1.0 },
      { selector: 'input[name="location"]', expectedType: FormFieldType.LOCATION, minConfidence: 0.8 },
      { selector: 'input[name="resume"]', expectedType: FormFieldType.RESUME_UPLOAD, minConfidence: 0.9 },
      { selector: 'input[name="urls[GitHub]"]', expectedType: FormFieldType.GITHUB_URL, minConfidence: 0.9 },
    ],
  },

  // ========================================================================
  // WORKDAY
  // ========================================================================
  {
    name: 'Workday - Application Form',
    ats: 'workday',
    html: `
      <form data-automation-id="applyForm">
        <div class="css-form-control">
          <label data-automation-id="formField-name">Legal First Name</label>
          <input type="text" data-automation-id="legalNameSection_firstName" name="firstName">
        </div>
        <div class="css-form-control">
          <label data-automation-id="formField-name">Legal Last Name</label>
          <input type="text" data-automation-id="legalNameSection_lastName" name="lastName">
        </div>
        <div class="css-form-control">
          <label>Email Address</label>
          <input type="email" data-automation-id="email" name="email">
        </div>
        <div class="css-form-control">
          <label>Phone Number</label>
          <input type="tel" data-automation-id="phone" name="phone">
        </div>
        <div class="css-form-control">
          <label>City</label>
          <input type="text" data-automation-id="city" name="city">
        </div>
        <div class="css-form-control">
          <label>Are you legally authorized to work in the United States?</label>
          <select data-automation-id="workAuthorization" name="workAuth">
            <option value="">Select...</option>
            <option value="yes">Yes</option>
            <option value="no">No</option>
          </select>
        </div>
      </form>
    `,
    expectedFields: [
      { selector: 'input[data-automation-id="legalNameSection_firstName"]', expectedType: FormFieldType.FIRST_NAME, minConfidence: 0.9 },
      { selector: 'input[data-automation-id="legalNameSection_lastName"]', expectedType: FormFieldType.LAST_NAME, minConfidence: 0.9 },
      { selector: 'input[data-automation-id="email"]', expectedType: FormFieldType.EMAIL, minConfidence: 1.0 },
      { selector: 'input[data-automation-id="phone"]', expectedType: FormFieldType.PHONE, minConfidence: 1.0 },
      { selector: 'input[data-automation-id="city"]', expectedType: FormFieldType.CITY, minConfidence: 0.9 },
      { selector: 'select[data-automation-id="workAuthorization"]', expectedType: FormFieldType.WORK_AUTHORIZATION, minConfidence: 0.9 },
    ],
  },

  // ========================================================================
  // INDEED
  // ========================================================================
  {
    name: 'Indeed - Quick Apply',
    ats: 'indeed',
    html: `
      <form id="indeed-apply-form">
        <div class="ia-BasePage-field">
          <label for="input-applicant.name">Full Name</label>
          <input type="text" id="input-applicant.name" name="applicant.name" autocomplete="name">
        </div>
        <div class="ia-BasePage-field">
          <label for="input-applicant.email">Email</label>
          <input type="email" id="input-applicant.email" name="applicant.email" autocomplete="email">
        </div>
        <div class="ia-BasePage-field">
          <label for="input-applicant.phoneNumber">Phone Number</label>
          <input type="tel" id="input-applicant.phoneNumber" name="applicant.phoneNumber" autocomplete="tel">
        </div>
        <div class="ia-BasePage-field">
          <label>Resume</label>
          <input type="file" name="resume" accept=".pdf,.doc,.docx">
        </div>
      </form>
    `,
    expectedFields: [
      { selector: '#input-applicant\\.name', expectedType: FormFieldType.FULL_NAME, minConfidence: 0.7 },
      { selector: '#input-applicant\\.email', expectedType: FormFieldType.EMAIL, minConfidence: 1.0 },
      { selector: '#input-applicant\\.phoneNumber', expectedType: FormFieldType.PHONE, minConfidence: 1.0 },
      { selector: 'input[name="resume"]', expectedType: FormFieldType.RESUME_UPLOAD, minConfidence: 0.9 },
    ],
  },

  // ========================================================================
  // GENERIC / NATIVE
  // ========================================================================
  {
    name: 'Generic - Common Patterns',
    ats: null,
    html: `
      <form id="job-application">
        <input type="text" id="fname" placeholder="First Name">
        <input type="text" id="lname" placeholder="Last Name">
        <input type="email" id="email-address" placeholder="your.email@example.com">
        <input type="tel" id="mobile" placeholder="Mobile Phone">
        <input type="text" id="current-location" placeholder="Where do you live?">
        <input type="date" id="dob" aria-label="Date of Birth">
        <textarea id="why-join" placeholder="Why do you want to work here?"></textarea>
        <input type="file" id="cv-upload" accept=".pdf">
        <select id="how-hear">
          <option>How did you hear about us?</option>
          <option>LinkedIn</option>
          <option>Referral</option>
        </select>
      </form>
    `,
    expectedFields: [
      { selector: '#fname', expectedType: FormFieldType.FIRST_NAME, minConfidence: 0.8 },
      { selector: '#lname', expectedType: FormFieldType.LAST_NAME, minConfidence: 0.8 },
      { selector: '#email-address', expectedType: FormFieldType.EMAIL, minConfidence: 1.0 },
      { selector: '#mobile', expectedType: FormFieldType.PHONE, minConfidence: 0.9 },
      { selector: '#current-location', expectedType: FormFieldType.LOCATION, minConfidence: 0.8 },
      { selector: '#dob', expectedType: FormFieldType.BIRTHDAY, minConfidence: 0.9 },
      { selector: '#why-join', expectedType: FormFieldType.QUESTION, minConfidence: 0.7 },
      { selector: '#cv-upload', expectedType: FormFieldType.RESUME_UPLOAD, minConfidence: 0.9 },
      { selector: '#how-hear', expectedType: FormFieldType.REFERRAL, minConfidence: 0.8 },
    ],
  },
];

// ============================================================================
// Test Runner
// ============================================================================

interface TestResult {
  testCase: string;
  total: number;
  correct: number;
  accuracy: number;
  failures: Array<{
    selector: string;
    expected: FormFieldType;
    actual: FormFieldType | null;
    confidence: number;
  }>;
}

/**
 * Run all automated tests
 */
function runAutomatedTests(): void {
  console.log('╔════════════════════════════════════════════════════════════════════╗');
  console.log('║  AUTOMATED FORM DETECTION VALIDATION                               ║');
  console.log('╚════════════════════════════════════════════════════════════════════╝\n');

  const results: TestResult[] = [];
  let totalFields = 0;
  let totalCorrect = 0;

  TEST_CASES.forEach((testCase) => {
    console.log(`\n🧪 Testing: ${testCase.name}`);
    console.log('─'.repeat(70));

    // Create DOM from HTML
    const dom = new JSDOM(testCase.html, {
      url: testCase.ats === 'greenhouse'
        ? 'https://boards.greenhouse.io/test/jobs/123'
        : testCase.ats === 'lever'
        ? 'https://jobs.lever.co/test/123'
        : testCase.ats === 'workday'
        ? 'https://myworkdayjobs.com/test'
        : 'https://example.com/careers/apply',
    });

    // Set global document for FormDetector
    global.document = dom.window.document as any;
    global.window = dom.window as any;
    global.Node = dom.window.Node as any;
    global.Element = dom.window.Element as any;
    global.HTMLElement = dom.window.HTMLElement as any;
    global.HTMLInputElement = dom.window.HTMLInputElement as any;
    global.HTMLTextAreaElement = dom.window.HTMLTextAreaElement as any;
    global.HTMLSelectElement = dom.window.HTMLSelectElement as any;
    global.HTMLLabelElement = dom.window.HTMLLabelElement as any;

    // Run detection
    const detector = new FormDetector();
    const detectionResult = detector.detectFields();

    // Validate each expected field
    const failures: TestResult['failures'] = [];
    let correct = 0;

    testCase.expectedFields.forEach((expected) => {
      const element = dom.window.document.querySelector(expected.selector);
      if (!element) {
        console.log(`  ❌ SKIP: Selector not found: ${expected.selector}`);
        return;
      }

      // Find detected field
      const detected = detectionResult.fields.find((f) => f.element === element);

      if (!detected) {
        failures.push({
          selector: expected.selector,
          expected: expected.expectedType,
          actual: null,
          confidence: 0,
        });
        console.log(`  ❌ FAIL: ${expected.expectedType} (not detected)`);
        console.log(`     Selector: ${expected.selector}`);
        return;
      }

      // Check if type matches and confidence is sufficient
      const typeMatch = detected.type === expected.expectedType;
      const confidenceOk = detected.confidence >= expected.minConfidence;

      if (typeMatch && confidenceOk) {
        correct++;
        console.log(`  ✅ PASS: ${expected.expectedType} (${(detected.confidence * 100).toFixed(1)}%)`);
      } else {
        failures.push({
          selector: expected.selector,
          expected: expected.expectedType,
          actual: detected.type,
          confidence: detected.confidence,
        });

        if (!typeMatch) {
          console.log(`  ❌ FAIL: Expected ${expected.expectedType}, got ${detected.type}`);
        } else {
          console.log(`  ❌ FAIL: ${expected.expectedType} - confidence too low (${(detected.confidence * 100).toFixed(1)}% < ${expected.minConfidence * 100}%)`);
        }
        console.log(`     Selector: ${expected.selector}`);
      }
    });

    const accuracy = (correct / testCase.expectedFields.length) * 100;
    console.log(`\n  📊 Result: ${correct}/${testCase.expectedFields.length} (${accuracy.toFixed(1)}%)`);

    results.push({
      testCase: testCase.name,
      total: testCase.expectedFields.length,
      correct,
      accuracy,
      failures,
    });

    totalFields += testCase.expectedFields.length;
    totalCorrect += correct;
  });

  // Print summary
  console.log('\n\n╔════════════════════════════════════════════════════════════════════╗');
  console.log('║  SUMMARY                                                           ║');
  console.log('╚════════════════════════════════════════════════════════════════════╝\n');

  results.forEach((result) => {
    const emoji = result.accuracy >= 90 ? '🟢' : result.accuracy >= 80 ? '🟡' : '🔴';
    console.log(`${emoji} ${result.testCase}: ${result.accuracy.toFixed(1)}%`);
  });

  const overallAccuracy = (totalCorrect / totalFields) * 100;
  console.log(`\n📊 Overall Accuracy: ${totalCorrect}/${totalFields} (${overallAccuracy.toFixed(1)}%)\n`);

  // Verdict
  if (overallAccuracy >= 90) {
    console.log('🎉 EXCELLENT! Ready to proceed with Phase 3 (Storage Layer)');
  } else if (overallAccuracy >= 80) {
    console.log('✅ GOOD! Minor pattern improvements recommended');
    console.log('\nFailed detections to review:');
    results.forEach((result) => {
      if (result.failures.length > 0) {
        console.log(`\n${result.testCase}:`);
        result.failures.forEach((f) => {
          console.log(`  - Expected: ${f.expected}, Got: ${f.actual || 'not detected'} (${(f.confidence * 100).toFixed(1)}%)`);
        });
      }
    });
  } else {
    console.log('❌ NEEDS WORK! Pattern matching needs significant improvements');
    console.log('\nFailed detections:');
    results.forEach((result) => {
      if (result.failures.length > 0) {
        console.log(`\n${result.testCase}:`);
        result.failures.forEach((f) => {
          console.log(`  - Expected: ${f.expected}, Got: ${f.actual || 'not detected'} (${(f.confidence * 100).toFixed(1)}%)`);
        });
      }
    });
  }

  console.log('\n');
}

// Run tests
runAutomatedTests();
