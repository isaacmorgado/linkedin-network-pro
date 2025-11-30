/**
 * Autofill Storage Test
 *
 * Tests autofill profile and question bank CRUD operations.
 *
 * Run: npx tsx test-autofill-storage.ts
 */

import {
  getAutofillProfile,
  saveAutofillProfile,
  clearAutofillProfile,
  getQuestionBank,
  saveQuestion,
  updateQuestion,
  deleteQuestion,
  getQuestions,
  incrementQuestionUsage,
  clearQuestionBank,
} from './src/utils/autofill-storage';

// Mock chrome.storage.local
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
// Test Runner
// ============================================================================

async function runTests() {
  console.log('╔════════════════════════════════════════════════════════════════════╗');
  console.log('║  AUTOFILL STORAGE TESTS                                            ║');
  console.log('╚════════════════════════════════════════════════════════════════════╝\n');

  let passed = 0;
  let failed = 0;

  // Test 1: Get empty autofill profile
  console.log('Test 1: Get empty autofill profile');
  try {
    const profile = await getAutofillProfile();
    if (profile.firstName === '' && profile.email === '') {
      console.log('  ✅ PASS: Default profile returned\n');
      passed++;
    } else {
      console.log('  ❌ FAIL: Expected empty profile\n');
      failed++;
    }
  } catch (error) {
    console.log('  ❌ FAIL:', error);
    failed++;
  }

  // Test 2: Save autofill profile
  console.log('Test 2: Save autofill profile');
  try {
    const saved = await saveAutofillProfile({
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      phone: '(555) 123-4567',
      location: 'San Francisco, CA',
      skills: ['React', 'TypeScript', 'Node.js'],
    });

    if (
      saved.firstName === 'John' &&
      saved.fullName === 'John Doe' &&
      saved.skills.length === 3
    ) {
      console.log('  ✅ PASS: Profile saved correctly\n');
      passed++;
    } else {
      console.log('  ❌ FAIL: Profile not saved correctly\n');
      failed++;
    }
  } catch (error) {
    console.log('  ❌ FAIL:', error);
    failed++;
  }

  // Test 3: Get saved profile
  console.log('Test 3: Get saved profile');
  try {
    const profile = await getAutofillProfile();
    if (profile.firstName === 'John' && profile.email === 'john.doe@example.com') {
      console.log('  ✅ PASS: Profile retrieved correctly\n');
      passed++;
    } else {
      console.log('  ❌ FAIL: Profile not retrieved correctly\n');
      failed++;
    }
  } catch (error) {
    console.log('  ❌ FAIL:', error);
    failed++;
  }

  // Test 4: Update profile
  console.log('Test 4: Update profile');
  try {
    const updated = await saveAutofillProfile({
      phone: '(555) 999-8888',
    });

    if (updated.phone === '(555) 999-8888' && updated.firstName === 'John') {
      console.log('  ✅ PASS: Profile updated correctly (partial update)\n');
      passed++;
    } else {
      console.log('  ❌ FAIL: Profile not updated correctly\n');
      failed++;
    }
  } catch (error) {
    console.log('  ❌ FAIL:', error);
    failed++;
  }

  // Test 5: Save question
  console.log('Test 5: Save question');
  try {
    const question = await saveQuestion(
      'Why do you want to work here?',
      'I am passionate about building great products...',
      'job-123',
      ['passion', 'products', 'team']
    );

    if (
      question.question.includes('Why do you want to work here?') &&
      question.keywords.length === 3 &&
      question.usageCount === 0
    ) {
      console.log('  ✅ PASS: Question saved correctly\n');
      passed++;
    } else {
      console.log('  ❌ FAIL: Question not saved correctly\n');
      failed++;
    }
  } catch (error) {
    console.log('  ❌ FAIL:', error);
    failed++;
  }

  // Test 6: Get question bank
  console.log('Test 6: Get question bank');
  try {
    const bank = await getQuestionBank();
    if (bank.questions.length === 1) {
      console.log('  ✅ PASS: Question bank retrieved correctly\n');
      passed++;
    } else {
      console.log(`  ❌ FAIL: Expected 1 question, got ${bank.questions.length}\n`);
      failed++;
    }
  } catch (error) {
    console.log('  ❌ FAIL:', error);
    failed++;
  }

  // Test 7: Save multiple questions
  console.log('Test 7: Save multiple questions');
  try {
    await saveQuestion(
      'Describe your experience with React',
      'I have 5 years of experience...',
      'job-456',
      ['react', 'experience']
    );
    await saveQuestion(
      'What are your salary expectations?',
      '',
      undefined,
      []
    );

    const bank = await getQuestionBank();
    if (bank.questions.length === 3) {
      console.log('  ✅ PASS: Multiple questions saved\n');
      passed++;
    } else {
      console.log(`  ❌ FAIL: Expected 3 questions, got ${bank.questions.length}\n`);
      failed++;
    }
  } catch (error) {
    console.log('  ❌ FAIL:', error);
    failed++;
  }

  // Test 8: Update question
  console.log('Test 8: Update question');
  try {
    const bank = await getQuestionBank();
    const questionId = bank.questions[0].id;

    const updated = await updateQuestion(questionId, {
      answer: 'Updated answer text',
      userRating: 5,
    });

    if (updated.answer === 'Updated answer text' && updated.wasEdited === true) {
      console.log('  ✅ PASS: Question updated correctly\n');
      passed++;
    } else {
      console.log('  ❌ FAIL: Question not updated correctly\n');
      failed++;
    }
  } catch (error) {
    console.log('  ❌ FAIL:', error);
    failed++;
  }

  // Test 9: Filter questions
  console.log('Test 9: Filter questions');
  try {
    const filtered = await getQuestions({
      jobId: 'job-456',
    });

    if (filtered.length === 1 && filtered[0].question.includes('React')) {
      console.log('  ✅ PASS: Questions filtered correctly\n');
      passed++;
    } else {
      console.log(`  ❌ FAIL: Expected 1 filtered question, got ${filtered.length}\n`);
      failed++;
    }
  } catch (error) {
    console.log('  ❌ FAIL:', error);
    failed++;
  }

  // Test 10: Sort questions
  console.log('Test 10: Sort questions by most used');
  try {
    const bank = await getQuestionBank();
    const questionId = bank.questions[1].id; // Second question

    // Increment usage
    await incrementQuestionUsage(questionId);
    await incrementQuestionUsage(questionId);
    await incrementQuestionUsage(questionId);

    const sorted = await getQuestions({ sortBy: 'mostUsed' });

    if (sorted[0].usageCount === 3) {
      console.log('  ✅ PASS: Questions sorted by usage\n');
      passed++;
    } else {
      console.log(`  ❌ FAIL: Expected usage count 3, got ${sorted[0].usageCount}\n`);
      failed++;
    }
  } catch (error) {
    console.log('  ❌ FAIL:', error);
    failed++;
  }

  // Test 11: Delete question
  console.log('Test 11: Delete question');
  try {
    const bank = await getQuestionBank();
    const questionId = bank.questions[0].id;

    await deleteQuestion(questionId);

    const updated = await getQuestionBank();
    if (updated.questions.length === 2) {
      console.log('  ✅ PASS: Question deleted\n');
      passed++;
    } else {
      console.log(`  ❌ FAIL: Expected 2 questions, got ${updated.questions.length}\n`);
      failed++;
    }
  } catch (error) {
    console.log('  ❌ FAIL:', error);
    failed++;
  }

  // Test 12: Clear profile
  console.log('Test 12: Clear autofill profile');
  try {
    await clearAutofillProfile();
    const profile = await getAutofillProfile();

    if (profile.firstName === '' && profile.email === '') {
      console.log('  ✅ PASS: Profile cleared\n');
      passed++;
    } else {
      console.log('  ❌ FAIL: Profile not cleared\n');
      failed++;
    }
  } catch (error) {
    console.log('  ❌ FAIL:', error);
    failed++;
  }

  // Test 13: Clear question bank
  console.log('Test 13: Clear question bank');
  try {
    await clearQuestionBank();
    const bank = await getQuestionBank();

    if (bank.questions.length === 0) {
      console.log('  ✅ PASS: Question bank cleared\n');
      passed++;
    } else {
      console.log(`  ❌ FAIL: Expected 0 questions, got ${bank.questions.length}\n`);
      failed++;
    }
  } catch (error) {
    console.log('  ❌ FAIL:', error);
    failed++;
  }

  // Summary
  console.log('\n╔════════════════════════════════════════════════════════════════════╗');
  console.log('║  SUMMARY                                                           ║');
  console.log('╚════════════════════════════════════════════════════════════════════╝\n');

  const total = passed + failed;
  const percentage = ((passed / total) * 100).toFixed(1);

  console.log(`Total Tests: ${total}`);
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`Accuracy: ${percentage}%\n`);

  if (failed === 0) {
    console.log('🎉 ALL TESTS PASSED! Storage layer is production-ready.\n');
  } else {
    console.log('⚠️  Some tests failed. Review errors above.\n');
  }
}

// Run tests
runTests().catch(console.error);
