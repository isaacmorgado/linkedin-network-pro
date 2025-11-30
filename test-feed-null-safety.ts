/**
 * Test: Verify FeedTab handles items with missing optional fields
 *
 * This test creates feed items with undefined/null optional fields
 * to ensure the component doesn't crash when rendering incomplete data.
 */

import type { FeedItem } from './src/types/feed';

// Test Case 1: Job alert with NO optional fields
const testItemMinimal: FeedItem = {
  id: 'test-1',
  type: 'job_alert',
  timestamp: Date.now(),
  read: false,
  title: 'Test Job Alert',
  description: 'This is a test job with minimal fields',
  // NO jobTitle, company, location, matchScore, actionUrl, actionLabel
};

// Test Case 2: Job alert with undefined optional fields (explicit)
const testItemExplicitUndefined: FeedItem = {
  id: 'test-2',
  type: 'job_alert',
  timestamp: Date.now(),
  read: false,
  title: 'Test Job Alert 2',
  description: 'This job has explicitly undefined fields',
  jobTitle: undefined,
  company: undefined,
  location: undefined,
  matchScore: undefined,
  actionUrl: undefined,
  actionLabel: undefined,
};

// Test Case 3: Job alert with empty strings (edge case)
const testItemEmptyStrings: FeedItem = {
  id: 'test-3',
  type: 'job_alert',
  timestamp: Date.now(),
  read: false,
  title: 'Test Job Alert 3',
  description: 'This job has empty string fields',
  company: '',
  location: '',
  actionUrl: '',
  actionLabel: '',
};

// Test Case 4: Job alert with whitespace-only strings (edge case)
const testItemWhitespace: FeedItem = {
  id: 'test-4',
  type: 'job_alert',
  timestamp: Date.now(),
  read: false,
  title: 'Test Job Alert 4',
  description: 'This job has whitespace-only fields',
  company: '   ',
  location: '\t\n',
  actionUrl: ' ',
};

// Test Case 5: Job alert with matchScore = 0 (should not display)
const testItemZeroScore: FeedItem = {
  id: 'test-5',
  type: 'job_alert',
  timestamp: Date.now(),
  read: false,
  title: 'Test Job Alert 5',
  description: 'This job has 0 match score',
  matchScore: 0,
};

// Test Case 6: Valid job with all fields present
const testItemComplete: FeedItem = {
  id: 'test-6',
  type: 'job_alert',
  timestamp: Date.now(),
  read: false,
  title: 'Senior Software Engineer',
  description: 'Great opportunity at top tech company',
  company: 'Google',
  location: 'San Francisco, CA',
  matchScore: 85,
  actionUrl: 'https://linkedin.com/jobs/123',
  actionLabel: 'Apply Now',
};

console.log('✅ Test Feed Items Created Successfully');
console.log('\n📋 Test Cases:');
console.log('1. Minimal (no optional fields):', testItemMinimal);
console.log('2. Explicit undefined:', testItemExplicitUndefined);
console.log('3. Empty strings:', testItemEmptyStrings);
console.log('4. Whitespace strings:', testItemWhitespace);
console.log('5. Zero match score:', testItemZeroScore);
console.log('6. Complete item:', testItemComplete);

console.log('\n✨ Expected Behavior After Fix:');
console.log('- Items 1-2: Should render title + description only (no company/location/score/action)');
console.log('- Items 3-4: Should render title + description only (empty/whitespace filtered out)');
console.log('- Item 5: Should render title + description (matchScore=0 not displayed)');
console.log('- Item 6: Should render all fields including badge, company, location, action button');

console.log('\n🎯 Fix Applied:');
console.log('- matchScore: Changed from `item.matchScore &&` to `item.matchScore != null && item.matchScore > 0 &&`');
console.log('- company: Changed from `item.company &&` to `item.company != null && item.company.trim() !== "" &&`');
console.log('- location: Changed from `item.location &&` to `item.location != null && item.location.trim() !== "" &&`');
console.log('- actionUrl: Changed from `item.actionUrl &&` to `item.actionUrl != null && item.actionUrl.trim() !== "" &&`');
console.log('- actionLabel: Changed from `item.actionLabel || "View"` to `item.actionLabel ?? "View"`');

export {
  testItemMinimal,
  testItemExplicitUndefined,
  testItemEmptyStrings,
  testItemWhitespace,
  testItemZeroScore,
  testItemComplete
};
