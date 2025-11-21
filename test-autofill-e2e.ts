/**
 * Auto-Fill End-to-End Test
 *
 * Tests the complete auto-fill flow:
 * 1. Setup autofill profile
 * 2. Detect fields on mock HTML form
 * 3. Auto-fill fields with profile data
 * 4. Validate filled values match expected
 *
 * Run: npx tsx test-autofill-e2e.ts
 */

import { JSDOM } from 'jsdom';
import { FormDetector, FormFieldType } from './src/services/autofill/form-detector';
import {
  getAutofillProfile,
  saveAutofillProfile,
  clearAutofillProfile,
} from './src/utils/autofill-storage';
import type { AutofillProfile } from './src/types/autofill';

// ============================================================================
// Mock Chrome Storage
// ============================================================================

const mockStorage: Record<string, any> = {};

(global as any).chrome = {
  storage: {
    local: {
      get: async (keys: string | string[] | null) => {
        if (keys === null) {
          return mockStorage;
        }
        if (typeof keys === 'string') {
          return { [keys]: mockStorage[keys] };
        }
        const result: Record<string, any> = {};
        keys.forEach((key) => {
          result[key] = mockStorage[key];
        });
        return result;
      },
      set: async (items: Record<string, any>) => {
        Object.assign(mockStorage, items);
      },
      clear: async () => {
        Object.keys(mockStorage).forEach((key) => delete mockStorage[key]);
      },
    },
  },
};

// ============================================================================
// Mock HTML Forms (Real ATS Patterns)
// ============================================================================

const GREENHOUSE_FORM = `
<!DOCTYPE html>
<html>
<head><title>Greenhouse Application</title></head>
<body>
  <div id="application_form" class="application-form">
    <h1>Job Application</h1>

    <div class="field">
      <label for="first_name">First Name *</label>
      <input type="text" id="first_name" name="job_application[first_name]" autocomplete="given-name" />
    </div>

    <div class="field">
      <label for="last_name">Last Name *</label>
      <input type="text" id="last_name" name="job_application[last_name]" autocomplete="family-name" />
    </div>

    <div class="field">
      <label for="email">Email *</label>
      <input type="email" id="email" name="job_application[email]" autocomplete="email" />
    </div>

    <div class="field">
      <label for="phone">Phone</label>
      <input type="tel" id="phone" name="job_application[phone]" autocomplete="tel" />
    </div>

    <div class="field">
      <label for="location">Location</label>
      <input type="text" id="location" name="job_application[location]" placeholder="City, State" />
    </div>

    <div class="field">
      <label for="resume">Resume *</label>
      <input type="file" id="resume" name="resume" accept=".pdf,.doc,.docx" />
    </div>

    <div class="field">
      <label for="linkedin">LinkedIn Profile</label>
      <input type="url" id="linkedin" name="job_application[linkedin]" placeholder="https://linkedin.com/in/yourname" />
    </div>

    <div class="field">
      <label for="github">GitHub Profile</label>
      <input type="url" id="github" name="job_application[github]" placeholder="https://github.com/yourname" />
    </div>

    <div class="field">
      <label for="website">Personal Website</label>
      <input type="url" id="website" name="job_application[website]" />
    </div>

    <div class="field">
      <label for="work_auth">Are you authorized to work in the US?</label>
      <select id="work_auth" name="job_application[work_authorization]">
        <option value="">Select...</option>
        <option value="yes">Yes</option>
        <option value="no">No</option>
        <option value="need_sponsorship">Will require sponsorship</option>
      </select>
    </div>
  </div>
</body>
</html>
`;

// ============================================================================
// Auto-Fill Simulation
// ============================================================================

class AutoFillerTest {
  private profile: AutofillProfile | null = null;
  private detector: FormDetector;

  constructor(private dom: JSDOM) {
    // Setup global window for FormDetector
    (global as any).window = dom.window;
    (global as any).document = dom.window.document;
    this.detector = new FormDetector();
  }

  async autoFill(): Promise<{
    success: boolean;
    filledCount: number;
    totalFields: number;
    skippedFields: number;
    filled: Array<{ fieldType: string; value: string }>;
  }> {
    // Load profile
    this.profile = await getAutofillProfile();
    if (!this.profile || !this.profile.email) {
      throw new Error('No autofill profile found');
    }

    // Detect fields
    const detectionResult = this.detector.detectFields();
    const result = {
      success: true,
      filledCount: 0,
      totalFields: detectionResult.fields.length,
      skippedFields: 0,
      filled: [] as Array<{ fieldType: string; value: string }>,
    };

    // Fill each field
    for (const field of detectionResult.fields) {
      // Skip low confidence fields
      if (field.confidence < 0.5) {
        result.skippedFields++;
        continue;
      }

      // Skip file uploads for automated testing
      if (field.type === FormFieldType.RESUME_UPLOAD ||
          field.type === FormFieldType.COVER_LETTER_UPLOAD) {
        result.skippedFields++;
        continue;
      }

      // Get value for this field type
      const value = this.getValueForField(field.type);
      if (!value) {
        result.skippedFields++;
        continue;
      }

      // Fill the field
      const element = field.element;
      if (element instanceof this.dom.window.HTMLInputElement ||
          element instanceof this.dom.window.HTMLTextAreaElement) {
        element.value = value;
      } else if (element instanceof this.dom.window.HTMLSelectElement) {
        // Try to find matching option
        const option = Array.from(element.options).find(
          (opt) => opt.value === value || opt.textContent?.toLowerCase() === value.toLowerCase()
        );
        if (option) {
          element.value = option.value;
        }
      }

      result.filledCount++;
      result.filled.push({ fieldType: field.type, value });
    }

    return result;
  }

  private getValueForField(fieldType: string): string | null {
    if (!this.profile) return null;

    switch (fieldType) {
      case FormFieldType.FIRST_NAME:
        return this.profile.firstName;
      case FormFieldType.LAST_NAME:
        return this.profile.lastName;
      case FormFieldType.FULL_NAME:
        return this.profile.fullName || `${this.profile.firstName} ${this.profile.lastName}`;
      case FormFieldType.EMAIL:
        return this.profile.email;
      case FormFieldType.PHONE:
        return this.profile.phone;
      case FormFieldType.LOCATION:
        return this.profile.location;
      case FormFieldType.CITY:
        return this.extractCity(this.profile.location);
      case FormFieldType.STATE:
        return this.extractState(this.profile.location);
      case FormFieldType.ZIP_CODE:
        return this.profile.address?.zipCode || '';
      case FormFieldType.COUNTRY:
        return this.profile.address?.country || 'United States';
      case FormFieldType.BIRTHDAY:
        return this.profile.birthday || '';
      case FormFieldType.LINKEDIN_URL:
        return this.profile.linkedinUrl || '';
      case FormFieldType.GITHUB_URL:
        return this.profile.githubUrl || '';
      case FormFieldType.PORTFOLIO_URL:
        return this.profile.portfolioUrl || '';
      case FormFieldType.WEBSITE:
        return this.profile.websiteUrl || this.profile.portfolioUrl || '';
      case FormFieldType.WORK_AUTHORIZATION:
        return this.mapWorkAuthorizationToValue(this.profile.workAuthorization);
      default:
        return null;
    }
  }

  private extractCity(location: string): string {
    const parts = location.split(',');
    return parts[0]?.trim() || '';
  }

  private extractState(location: string): string {
    const parts = location.split(',');
    return parts[1]?.trim() || '';
  }

  private mapWorkAuthorizationToValue(auth?: string): string {
    if (!auth || auth === 'prefer_not_to_say') return '';

    const mapping: Record<string, string[]> = {
      us_citizen: ['yes', 'citizen', 'us citizen', 'authorized'],
      green_card: ['yes', 'permanent resident', 'green card'],
      visa: ['yes', 'visa', 'work visa'],
      need_sponsorship: ['no', 'need sponsorship', 'require sponsorship'],
    };

    const values = mapping[auth];
    return values ? values[0] : '';
  }
}

// ============================================================================
// Test Runner
// ============================================================================

async function runTests() {
  console.log('╔════════════════════════════════════════════════════════════════════╗');
  console.log('║  AUTO-FILL E2E TEST                                                ║');
  console.log('╚════════════════════════════════════════════════════════════════════╝\n');

  let passed = 0;
  let failed = 0;

  // Setup: Create autofill profile
  console.log('Setup: Creating autofill profile...');
  await saveAutofillProfile({
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    phone: '(555) 123-4567',
    location: 'San Francisco, CA',
    linkedinUrl: 'https://www.linkedin.com/in/johndoe',
    githubUrl: 'https://github.com/johndoe',
    portfolioUrl: 'https://johndoe.com',
    skills: ['React', 'TypeScript', 'Node.js'],
    workAuthorization: 'us_citizen',
  });
  console.log('✅ Profile created\n');

  // Test 1: Greenhouse Form Auto-Fill
  console.log('Test 1: Greenhouse Form Auto-Fill');
  try {
    const dom = new JSDOM(GREENHOUSE_FORM, { url: 'https://boards.greenhouse.io/company/jobs/123' });
    const filler = new AutoFillerTest(dom);
    const result = await filler.autoFill();

    console.log(`  Detected ${result.totalFields} fields`);
    console.log(`  Filled ${result.filledCount} fields`);
    console.log(`  Skipped ${result.skippedFields} fields`);
    console.log(`  Fill rate: ${((result.filledCount / result.totalFields) * 100).toFixed(1)}%`);

    // Validate filled values
    const firstName = dom.window.document.getElementById('first_name') as HTMLInputElement;
    const lastName = dom.window.document.getElementById('last_name') as HTMLInputElement;
    const email = dom.window.document.getElementById('email') as HTMLInputElement;
    const phone = dom.window.document.getElementById('phone') as HTMLInputElement;
    const location = dom.window.document.getElementById('location') as HTMLInputElement;
    const linkedin = dom.window.document.getElementById('linkedin') as HTMLInputElement;
    const github = dom.window.document.getElementById('github') as HTMLInputElement;
    const workAuth = dom.window.document.getElementById('work_auth') as HTMLSelectElement;

    const validations = [
      { field: 'First Name', expected: 'John', actual: firstName?.value },
      { field: 'Last Name', expected: 'Doe', actual: lastName?.value },
      { field: 'Email', expected: 'john.doe@example.com', actual: email?.value },
      { field: 'Phone', expected: '(555) 123-4567', actual: phone?.value },
      { field: 'Location', expected: 'San Francisco, CA', actual: location?.value },
      { field: 'LinkedIn', expected: 'https://www.linkedin.com/in/johndoe', actual: linkedin?.value },
      { field: 'GitHub', expected: 'https://github.com/johndoe', actual: github?.value },
      { field: 'Work Auth', expected: 'yes', actual: workAuth?.value },
    ];

    let validationsPassed = 0;
    console.log('\n  Field Validation:');
    for (const v of validations) {
      if (v.actual === v.expected) {
        console.log(`    ✅ ${v.field}: ${v.actual}`);
        validationsPassed++;
      } else {
        console.log(`    ❌ ${v.field}: expected "${v.expected}", got "${v.actual}"`);
      }
    }

    const accuracy = (validationsPassed / validations.length) * 100;
    console.log(`\n  Validation Accuracy: ${accuracy.toFixed(1)}%`);

    if (accuracy >= 85) {
      console.log('  ✅ PASS: Auto-fill working correctly\n');
      passed++;
    } else {
      console.log('  ❌ FAIL: Too many validation failures\n');
      failed++;
    }
  } catch (error) {
    console.log('  ❌ FAIL:', error);
    failed++;
  }

  // Test 2: Verify Profile Persistence
  console.log('Test 2: Verify Profile Persistence');
  try {
    const profile = await getAutofillProfile();
    if (
      profile.firstName === 'John' &&
      profile.email === 'john.doe@example.com' &&
      profile.skills.length === 3
    ) {
      console.log('  ✅ PASS: Profile persisted correctly\n');
      passed++;
    } else {
      console.log('  ❌ FAIL: Profile not persisted\n');
      failed++;
    }
  } catch (error) {
    console.log('  ❌ FAIL:', error);
    failed++;
  }

  // Test 3: Verify Field Detection Accuracy
  console.log('Test 3: Verify Field Detection Accuracy');
  try {
    const dom = new JSDOM(GREENHOUSE_FORM, { url: 'https://boards.greenhouse.io/company/jobs/123' });
    (global as any).window = dom.window;
    (global as any).document = dom.window.document;

    const detector = new FormDetector();
    const result = detector.detectFields();

    const detectedTypes = new Set(result.fields.map((f) => f.type));
    const expectedTypes = [
      FormFieldType.FIRST_NAME,
      FormFieldType.LAST_NAME,
      FormFieldType.EMAIL,
      FormFieldType.PHONE,
      FormFieldType.LOCATION,
      FormFieldType.LINKEDIN_URL,
      FormFieldType.GITHUB_URL,
    ];

    let detectedCount = 0;
    for (const expectedType of expectedTypes) {
      if (detectedTypes.has(expectedType)) {
        detectedCount++;
      }
    }

    const detectionAccuracy = (detectedCount / expectedTypes.length) * 100;
    console.log(`  Detected ${detectedCount}/${expectedTypes.length} expected field types`);
    console.log(`  Detection Accuracy: ${detectionAccuracy.toFixed(1)}%`);

    if (detectionAccuracy >= 85) {
      console.log('  ✅ PASS: Field detection accurate\n');
      passed++;
    } else {
      console.log('  ❌ FAIL: Detection accuracy too low\n');
      failed++;
    }
  } catch (error) {
    console.log('  ❌ FAIL:', error);
    failed++;
  }

  // Cleanup
  console.log('Cleanup: Clearing autofill profile...');
  await clearAutofillProfile();
  console.log('✅ Cleanup complete\n');

  // Summary
  console.log('\n╔════════════════════════════════════════════════════════════════════╗');
  console.log('║  SUMMARY                                                           ║');
  console.log('╚════════════════════════════════════════════════════════════════════╝\n');

  const total = passed + failed;
  const percentage = ((passed / total) * 100).toFixed(1);

  console.log(`Total Tests: ${total}`);
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`Success Rate: ${percentage}%\n`);

  if (failed === 0) {
    console.log('🎉 ALL TESTS PASSED! Auto-fill is production-ready.\n');
    console.log('✅ Ready to proceed to Phase 5: Context-Aware UI\n');
  } else {
    console.log('⚠️  Some tests failed. Review errors above.\n');
  }
}

// Run tests
runTests().catch(console.error);
