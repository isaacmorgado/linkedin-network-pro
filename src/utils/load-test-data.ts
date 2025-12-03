/**
 * Load Test Data Script
 * Run this in the browser console to populate test data
 *
 * Usage:
 * 1. Build extension: npm run build
 * 2. Load extension in Chrome
 * 3. Open extension panel
 * 4. Open browser console (F12)
 * 5. Run: await window.loadTestData()
 * 6. Test search queries!
 */

import { generateTestData, clearTestData } from './test-data-generator';

// Expose to window for console access
if (typeof window !== 'undefined') {
  (window as any).loadTestData = async () => {
    console.log('🚀 Loading test data...');
    await generateTestData();
    console.log('✅ Test data loaded! Try these queries:');
    console.log('   - "Who endorsed Alex Hormozi?"');
    console.log('   - "Who endorsed Alex Hormozi for leadership?"');
    console.log('   - "Find ML engineers at Google"');
    console.log('   - "Who do I know at Netflix?"');
    console.log('   - "Tell me about Sarah Chen"');
  };

  (window as any).clearTestData = async () => {
    console.log('🗑️  Clearing test data...');
    await clearTestData();
    console.log('✅ Test data cleared!');
  };

  console.log('📦 Test data utilities loaded!');
  console.log('   Run: await window.loadTestData()');
  console.log('   Or: await window.clearTestData()');
}
