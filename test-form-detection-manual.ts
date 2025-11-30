/**
 * Manual Form Detection Test
 *
 * This script tests the FormDetector on real job application sites.
 *
 * HOW TO USE:
 * 1. Build the extension: npm run dev
 * 2. Navigate to a job application page
 * 3. Open browser console
 * 4. Copy/paste this entire file into console
 * 5. Run: testFormDetection()
 * 6. Review the results
 *
 * RECOMMENDED TEST SITES:
 * - Greenhouse: https://boards.greenhouse.io/anthropic/jobs/...
 * - Lever: https://jobs.lever.co/netflix/...
 * - Workday: https://amazon.jobs/...
 * - Indeed: https://www.indeed.com/viewjob?jk=...
 * - Native: https://www.metacareers.com/...
 */

import { FormDetector } from './src/services/autofill/form-detector';

// ============================================================================
// Test Runner
// ============================================================================

/**
 * Main test function - run this in browser console
 */
async function testFormDetection() {
  console.clear();
  console.log('%c🔍 FORM DETECTION TEST', 'font-size: 20px; font-weight: bold; color: #0077B5;');
  console.log('');

  // Initialize detector
  const detector = new FormDetector();

  // Run detection
  console.log('⏳ Detecting form fields...');
  const result = detector.detectFields();

  // Print debug summary
  console.log(detector.getDebugSummary(result));

  // Print statistics
  printStatistics(result);

  // Print field examples
  printFieldExamples(result);

  // Return result for inspection
  return result;
}

/**
 * Print detection statistics
 */
function printStatistics(result: any) {
  console.log('\n📊 STATISTICS');
  console.log('━'.repeat(80));

  const typeCount: Record<string, number> = {};
  const confidenceBuckets = { high: 0, medium: 0, low: 0, unknown: 0 };

  result.fields.forEach((field: any) => {
    // Count by type
    typeCount[field.type] = (typeCount[field.type] || 0) + 1;

    // Count by confidence
    if (field.confidence >= 0.8) confidenceBuckets.high++;
    else if (field.confidence >= 0.5) confidenceBuckets.medium++;
    else if (field.confidence > 0) confidenceBuckets.low++;
    else confidenceBuckets.unknown++;
  });

  console.log(`Total Fields: ${result.fields.length}`);
  console.log('');
  console.log('Confidence Distribution:');
  console.log(`  🟢 High (≥80%):   ${confidenceBuckets.high} fields`);
  console.log(`  🟡 Medium (50-79%): ${confidenceBuckets.medium} fields`);
  console.log(`  🟠 Low (1-49%):   ${confidenceBuckets.low} fields`);
  console.log(`  ⚪ Unknown (0%):  ${confidenceBuckets.unknown} fields`);
  console.log('');
  console.log('Fields by Type:');
  Object.entries(typeCount)
    .sort(([, a], [, b]) => (b as number) - (a as number))
    .forEach(([type, count]) => {
      console.log(`  ${type}: ${count}`);
    });
  console.log('');
}

/**
 * Print example fields for manual verification
 */
function printFieldExamples(result: any) {
  console.log('\n🎯 FIELD EXAMPLES (for manual verification)');
  console.log('━'.repeat(80));

  const exampleTypes = [
    'firstName',
    'lastName',
    'email',
    'phone',
    'resumeUpload',
    'coverLetterText',
  ];

  exampleTypes.forEach((type) => {
    const field = result.fields.find((f: any) => f.type === type && f.confidence > 0.5);
    if (field) {
      console.log(`\n${type}:`);
      console.log(`  Label: ${field.label || '(no label)'}`);
      console.log(`  Placeholder: ${field.placeholder || '(no placeholder)'}`);
      console.log(`  Confidence: ${(field.confidence * 100).toFixed(1)}%`);
      console.log(`  Name attribute: ${field.debugInfo?.name || '(none)'}`);
      console.log(`  ID attribute: ${field.debugInfo?.id || '(none)'}`);
    }
  });

  console.log('\n');
}

// ============================================================================
// Accuracy Validation Helpers
// ============================================================================

/**
 * Manually validate detection accuracy
 * User should inspect the page and mark each detection as correct/incorrect
 */
function validateAccuracy(result: any): void {
  console.log('\n✅ MANUAL ACCURACY VALIDATION');
  console.log('━'.repeat(80));
  console.log('For each field below, check if the classification is CORRECT:');
  console.log('');

  const validationResults: Array<{ field: any; isCorrect: boolean | null }> = [];

  result.fields
    .filter((f: any) => f.confidence > 0.5)
    .forEach((field: any, index: number) => {
      console.log(`\n[${index + 1}] ${field.type} (${(field.confidence * 100).toFixed(1)}%)`);
      console.log(`    Label: ${field.label || '(no label)'}`);
      console.log(`    Element:`, field.element);

      // Highlight element on page
      field.element.style.outline = '3px solid orange';
      field.element.style.outlineOffset = '2px';

      validationResults.push({ field, isCorrect: null });
    });

  console.log('\n');
  console.log('✏️  To mark results, run:');
  console.log('    markCorrect([0, 1, 2, ...])  // indices of correct detections');
  console.log('    markIncorrect([3, 4, ...])   // indices of incorrect detections');
  console.log('    calculateAccuracy()          // get final accuracy %');
  console.log('');

  // Store in global scope for manual marking
  (window as any).__validationResults = validationResults;
}

/**
 * Mark fields as correct
 */
function markCorrect(indices: number[]): void {
  const results = (window as any).__validationResults;
  indices.forEach((i) => {
    if (results[i]) {
      results[i].isCorrect = true;
      results[i].field.element.style.outline = '3px solid green';
    }
  });
  console.log(`✅ Marked ${indices.length} fields as CORRECT`);
}

/**
 * Mark fields as incorrect
 */
function markIncorrect(indices: number[]): void {
  const results = (window as any).__validationResults;
  indices.forEach((i) => {
    if (results[i]) {
      results[i].isCorrect = false;
      results[i].field.element.style.outline = '3px solid red';
    }
  });
  console.log(`❌ Marked ${indices.length} fields as INCORRECT`);
}

/**
 * Calculate final accuracy percentage
 */
function calculateAccuracy(): void {
  const results = (window as any).__validationResults;

  const total = results.filter((r: any) => r.isCorrect !== null).length;
  const correct = results.filter((r: any) => r.isCorrect === true).length;

  const accuracy = total > 0 ? (correct / total) * 100 : 0;

  console.log('\n📊 ACCURACY RESULTS');
  console.log('━'.repeat(80));
  console.log(`Total Validated: ${total}`);
  console.log(`Correct: ${correct}`);
  console.log(`Incorrect: ${total - correct}`);
  console.log(`Accuracy: ${accuracy.toFixed(1)}%`);
  console.log('');

  if (accuracy >= 90) {
    console.log('🎉 EXCELLENT! Accuracy ≥90% - Ready to proceed');
  } else if (accuracy >= 80) {
    console.log('✅ GOOD! Accuracy ≥80% - Minor improvements needed');
  } else if (accuracy >= 70) {
    console.log('⚠️  FAIR! Accuracy ≥70% - Significant improvements needed');
  } else {
    console.log('❌ POOR! Accuracy <70% - Major rework required');
  }
}

// ============================================================================
// Test Dataset (Real Job URLs)
// ============================================================================

/**
 * Recommended job application URLs for testing
 */
const TEST_URLS = {
  greenhouse: [
    'https://boards.greenhouse.io/anthropic/jobs/4009518008',
    'https://boards.greenhouse.io/stripe/jobs/5933428',
    'https://boards.greenhouse.io/reddit/jobs/5869750',
  ],
  lever: [
    'https://jobs.lever.co/netflix/12345', // Update with real URL
    'https://jobs.lever.co/spotify/12345', // Update with real URL
  ],
  workday: [
    'https://amazon.jobs/en/jobs/...', // Update with real URL
    'https://careers.google.com/jobs/...', // Update with real URL
  ],
  indeed: [
    'https://www.indeed.com/viewjob?jk=...', // Update with real URL
  ],
  native: [
    'https://www.metacareers.com/jobs/...', // Update with real URL
  ],
};

/**
 * Print test URLs
 */
function printTestUrls(): void {
  console.log('📋 RECOMMENDED TEST URLS');
  console.log('━'.repeat(80));
  console.log('Copy these URLs to test the form detector:\n');

  Object.entries(TEST_URLS).forEach(([ats, urls]) => {
    console.log(`\n${ats.toUpperCase()}:`);
    urls.forEach((url, i) => {
      console.log(`  ${i + 1}. ${url}`);
    });
  });

  console.log('\n');
}

// ============================================================================
// Export for Browser Console
// ============================================================================

// Make functions globally available in browser console
if (typeof window !== 'undefined') {
  (window as any).testFormDetection = testFormDetection;
  (window as any).validateAccuracy = validateAccuracy;
  (window as any).markCorrect = markCorrect;
  (window as any).markIncorrect = markIncorrect;
  (window as any).calculateAccuracy = calculateAccuracy;
  (window as any).printTestUrls = printTestUrls;

  console.log('%c📌 Form Detection Test Loaded!', 'font-size: 16px; font-weight: bold; color: #00A67E;');
  console.log('');
  console.log('Available commands:');
  console.log('  testFormDetection()  - Run form detection on current page');
  console.log('  validateAccuracy()   - Start manual accuracy validation');
  console.log('  printTestUrls()      - Show recommended test URLs');
  console.log('');
}

// Export for TypeScript
export { testFormDetection, validateAccuracy, markCorrect, markIncorrect, calculateAccuracy, printTestUrls };
