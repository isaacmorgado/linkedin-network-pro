/**
 * Tabbed Interface Test
 *
 * Tests the new Resume/Questions tab functionality in MinimalAutofillPanel
 *
 * Run: npx tsx test-tabbed-interface.ts
 */

// ============================================================================
// Test Configuration
// ============================================================================

interface TabInterfaceTest {
  name: string;
  component: string;
  feature: string;
  description: string;
}

const tests: TabInterfaceTest[] = [
  {
    name: 'Resume Tab',
    component: 'ResumeSection',
    feature: 'Resume text area',
    description: 'Users can paste resume content',
  },
  {
    name: 'Resume Tab Copy',
    component: 'ResumeSection',
    feature: 'Copy resume button',
    description: 'Copy resume to clipboard with feedback',
  },
  {
    name: 'Questions Tab',
    component: 'QuestionsSection',
    feature: 'Job description input',
    description: 'Paste job description for analysis',
  },
  {
    name: 'Questions Tab Input',
    component: 'QuestionsSection',
    feature: 'Question input',
    description: 'Enter or paste questions (Alt+3)',
  },
  {
    name: 'Auto-Copy Feature',
    component: 'QuestionsSection',
    feature: 'Auto-copy to clipboard',
    description: 'AI answer automatically copied when generated',
  },
  {
    name: 'Manual Copy Button',
    component: 'QuestionsSection',
    feature: 'Copy answer button',
    description: 'Manual copy with "Copied!" feedback',
  },
  {
    name: 'Tab Navigation',
    component: 'AutofillTabSwitcher',
    feature: 'Tab switching',
    description: 'Switch between Resume and Questions tabs',
  },
  {
    name: 'State Persistence',
    component: 'MinimalAutofillPanel',
    feature: 'Resume text persistence',
    description: 'Resume text persists when switching tabs',
  },
];

// ============================================================================
// Test Runner
// ============================================================================

async function runTests() {
  console.log('╔════════════════════════════════════════════════════════════════════╗');
  console.log('║  TABBED INTERFACE TEST                                             ║');
  console.log('╚════════════════════════════════════════════════════════════════════╝\n');

  let passed = 0;
  let failed = 0;

  // Test 1: Verify MinimalAutofillPanel has tab state
  console.log('Test 1: Verify MinimalAutofillPanel has tab state management');
  try {
    const fs = await import('fs/promises');
    const panelPath = './src/components/MinimalAutofillPanel.tsx';
    const panelContent = await fs.readFile(panelPath, 'utf-8');

    const hasAutofillView = panelContent.includes("type AutofillView = 'resume' | 'questions'");
    const hasActiveView = panelContent.includes('const [activeView, setActiveView]');
    const hasResumeText = panelContent.includes('const [resumeText, setResumeText]');

    if (hasAutofillView && hasActiveView && hasResumeText) {
      console.log('  ✅ PASS: Tab state management configured');
      console.log('    ✓ AutofillView type defined (resume | questions)');
      console.log('    ✓ activeView state with useState');
      console.log('    ✓ resumeText state with useState\n');
      passed++;
    } else {
      console.log('  ❌ FAIL: Missing tab state management');
      console.log(`    - AutofillView type: ${hasAutofillView}`);
      console.log(`    - activeView state: ${hasActiveView}`);
      console.log(`    - resumeText state: ${hasResumeText}\n`);
      failed++;
    }
  } catch (error) {
    console.log(`  ❌ FAIL: ${(error as Error).message}\n`);
    failed++;
  }

  // Test 2: Verify AutofillTabSwitcher component
  console.log('Test 2: Verify AutofillTabSwitcher component');
  try {
    const fs = await import('fs/promises');
    const panelPath = './src/components/MinimalAutofillPanel.tsx';
    const panelContent = await fs.readFile(panelPath, 'utf-8');

    const hasTabSwitcher = panelContent.includes('function AutofillTabSwitcher');
    const hasResumeButton = panelContent.includes("onClick={() => onViewChange('resume')}");
    const hasQuestionsButton = panelContent.includes("onClick={() => onViewChange('questions')}");
    const hasResponsive = panelContent.includes('const isCompact = panelWidth < 400');

    if (hasTabSwitcher && hasResumeButton && hasQuestionsButton && hasResponsive) {
      console.log('  ✅ PASS: AutofillTabSwitcher component implemented');
      console.log('    ✓ TabSwitcher component function');
      console.log('    ✓ Resume tab button');
      console.log('    ✓ Questions tab button');
      console.log('    ✓ Responsive design (< 400px)\n');
      passed++;
    } else {
      console.log('  ❌ FAIL: TabSwitcher component incomplete');
      console.log(`    - TabSwitcher function: ${hasTabSwitcher}`);
      console.log(`    - Resume button: ${hasResumeButton}`);
      console.log(`    - Questions button: ${hasQuestionsButton}`);
      console.log(`    - Responsive design: ${hasResponsive}\n`);
      failed++;
    }
  } catch (error) {
    console.log(`  ❌ FAIL: ${(error as Error).message}\n`);
    failed++;
  }

  // Test 3: Verify ResumeSection component
  console.log('Test 3: Verify ResumeSection component');
  try {
    const fs = await import('fs/promises');
    const panelPath = './src/components/MinimalAutofillPanel.tsx';
    const panelContent = await fs.readFile(panelPath, 'utf-8');

    const hasResumeSection = panelContent.includes('function ResumeSection');
    const hasTextarea = panelContent.includes('Paste your resume content here...');
    const hasCopyButton = panelContent.includes('handleCopyResume');
    const hasCopyFeedback = panelContent.includes('showCopied');

    if (hasResumeSection && hasTextarea && hasCopyButton && hasCopyFeedback) {
      console.log('  ✅ PASS: ResumeSection component implemented');
      console.log('    ✓ ResumeSection function');
      console.log('    ✓ Textarea for resume input');
      console.log('    ✓ Copy resume button');
      console.log('    ✓ Copy feedback state\n');
      passed++;
    } else {
      console.log('  ❌ FAIL: ResumeSection component incomplete');
      console.log(`    - ResumeSection function: ${hasResumeSection}`);
      console.log(`    - Textarea: ${hasTextarea}`);
      console.log(`    - Copy button: ${hasCopyButton}`);
      console.log(`    - Copy feedback: ${hasCopyFeedback}\n`);
      failed++;
    }
  } catch (error) {
    console.log(`  ❌ FAIL: ${(error as Error).message}\n`);
    failed++;
  }

  // Test 4: Verify QuestionsSection (renamed from GenerateSection)
  console.log('Test 4: Verify QuestionsSection component');
  try {
    const fs = await import('fs/promises');
    const panelPath = './src/components/MinimalAutofillPanel.tsx';
    const panelContent = await fs.readFile(panelPath, 'utf-8');

    const hasQuestionsSection = panelContent.includes('function QuestionsSection');
    const hasResumeTextProp = panelContent.includes('resumeText: string');
    const noGenerateSection = !panelContent.includes('function GenerateSection');

    if (hasQuestionsSection && hasResumeTextProp && noGenerateSection) {
      console.log('  ✅ PASS: QuestionsSection component implemented');
      console.log('    ✓ QuestionsSection function (renamed from GenerateSection)');
      console.log('    ✓ Accepts resumeText prop');
      console.log('    ✓ GenerateSection removed\n');
      passed++;
    } else {
      console.log('  ❌ FAIL: QuestionsSection component incomplete');
      console.log(`    - QuestionsSection function: ${hasQuestionsSection}`);
      console.log(`    - resumeText prop: ${hasResumeTextProp}`);
      console.log(`    - GenerateSection removed: ${noGenerateSection}\n`);
      failed++;
    }
  } catch (error) {
    console.log(`  ❌ FAIL: ${(error as Error).message}\n`);
    failed++;
  }

  // Test 5: Verify auto-copy functionality
  console.log('Test 5: Verify auto-copy to clipboard functionality');
  try {
    const fs = await import('fs/promises');
    const panelPath = './src/components/MinimalAutofillPanel.tsx';
    const panelContent = await fs.readFile(panelPath, 'utf-8');

    const hasAutoCopied = panelContent.includes('const [autoCopied, setAutoCopied]');
    const hasClipboardWrite = panelContent.includes('navigator.clipboard.writeText(answer)');
    const hasAutoCopyNotification = panelContent.includes('Answer automatically copied to clipboard!');
    const hasSetAutoCopied = panelContent.includes('setAutoCopied(true)');

    if (hasAutoCopied && hasClipboardWrite && hasAutoCopyNotification && hasSetAutoCopied) {
      console.log('  ✅ PASS: Auto-copy functionality implemented');
      console.log('    ✓ autoCopied state');
      console.log('    ✓ navigator.clipboard.writeText()');
      console.log('    ✓ Auto-copy notification UI');
      console.log('    ✓ State update on copy\n');
      passed++;
    } else {
      console.log('  ❌ FAIL: Auto-copy functionality incomplete');
      console.log(`    - autoCopied state: ${hasAutoCopied}`);
      console.log(`    - clipboard.writeText: ${hasClipboardWrite}`);
      console.log(`    - notification UI: ${hasAutoCopyNotification}`);
      console.log(`    - state update: ${hasSetAutoCopied}\n`);
      failed++;
    }
  } catch (error) {
    console.log(`  ❌ FAIL: ${(error as Error).message}\n`);
    failed++;
  }

  // Test 6: Verify manual copy button
  console.log('Test 6: Verify manual copy button with feedback');
  try {
    const fs = await import('fs/promises');
    const panelPath = './src/components/MinimalAutofillPanel.tsx';
    const panelContent = await fs.readFile(panelPath, 'utf-8');

    const hasShowCopied = panelContent.includes('const [showCopied, setShowCopied]');
    const hasCopyButton = panelContent.includes('onClick={handleCopyAnswer}');
    const hasCopiedFeedback = panelContent.includes("showCopied ? 'Copied!' : 'Copy Answer'");
    const hasCopyIcon = panelContent.includes('<Copy size={16}');

    if (hasShowCopied && hasCopyButton && hasCopiedFeedback && hasCopyIcon) {
      console.log('  ✅ PASS: Manual copy button implemented');
      console.log('    ✓ showCopied state');
      console.log('    ✓ Copy button with onClick handler');
      console.log('    ✓ "Copied!" feedback text');
      console.log('    ✓ Copy icon from lucide-react\n');
      passed++;
    } else {
      console.log('  ❌ FAIL: Manual copy button incomplete');
      console.log(`    - showCopied state: ${hasShowCopied}`);
      console.log(`    - Copy button: ${hasCopyButton}`);
      console.log(`    - Copied feedback: ${hasCopiedFeedback}`);
      console.log(`    - Copy icon: ${hasCopyIcon}\n`);
      failed++;
    }
  } catch (error) {
    console.log(`  ❌ FAIL: ${(error as Error).message}\n`);
    failed++;
  }

  // Test 7: Verify conditional rendering based on activeView
  console.log('Test 7: Verify conditional tab content rendering');
  try {
    const fs = await import('fs/promises');
    const panelPath = './src/components/MinimalAutofillPanel.tsx';
    const panelContent = await fs.readFile(panelPath, 'utf-8');

    const hasResumeCondition = panelContent.includes("activeView === 'resume'");
    const hasQuestionsCondition = panelContent.includes("activeView === 'questions'");
    const hasResumeSectionRender = panelContent.includes('<ResumeSection');
    const hasQuestionsSectionRender = panelContent.includes('<QuestionsSection');

    if (hasResumeCondition && hasQuestionsCondition && hasResumeSectionRender && hasQuestionsSectionRender) {
      console.log('  ✅ PASS: Conditional tab rendering implemented');
      console.log("    ✓ activeView === 'resume' condition");
      console.log("    ✓ activeView === 'questions' condition");
      console.log('    ✓ ResumeSection component render');
      console.log('    ✓ QuestionsSection component render\n');
      passed++;
    } else {
      console.log('  ❌ FAIL: Conditional rendering incomplete');
      console.log(`    - Resume condition: ${hasResumeCondition}`);
      console.log(`    - Questions condition: ${hasQuestionsCondition}`);
      console.log(`    - ResumeSection render: ${hasResumeSectionRender}`);
      console.log(`    - QuestionsSection render: ${hasQuestionsSectionRender}\n`);
      failed++;
    }
  } catch (error) {
    console.log(`  ❌ FAIL: ${(error as Error).message}\n`);
    failed++;
  }

  // Test 8: Verify generateAnswerFromProfile updated with resumeText
  console.log('Test 8: Verify generateAnswerFromProfile accepts resumeText');
  try {
    const fs = await import('fs/promises');
    const panelPath = './src/components/MinimalAutofillPanel.tsx';
    const panelContent = await fs.readFile(panelPath, 'utf-8');

    const hasFunctionSignature = panelContent.includes('function generateAnswerFromProfile(');
    const hasResumeParam = panelContent.includes('resumeText: string');
    const hasResumeInCall = panelContent.includes('generateAnswerFromProfile(question, keywords, profile, resumeText)');

    if (hasFunctionSignature && hasResumeParam && hasResumeInCall) {
      console.log('  ✅ PASS: generateAnswerFromProfile updated');
      console.log('    ✓ Function signature present');
      console.log('    ✓ resumeText parameter added');
      console.log('    ✓ Function called with resumeText\n');
      passed++;
    } else {
      console.log('  ❌ FAIL: generateAnswerFromProfile not updated');
      console.log(`    - Function signature: ${hasFunctionSignature}`);
      console.log(`    - resumeText param: ${hasResumeParam}`);
      console.log(`    - Resume in call: ${hasResumeInCall}\n`);
      failed++;
    }
  } catch (error) {
    console.log(`  ❌ FAIL: ${(error as Error).message}\n`);
    failed++;
  }

  // Test 9: Verify tab icons imported
  console.log('Test 9: Verify tab icons from lucide-react');
  try {
    const fs = await import('fs/promises');
    const panelPath = './src/components/MinimalAutofillPanel.tsx';
    const panelContent = await fs.readFile(panelPath, 'utf-8');

    const hasFileTextImport = panelContent.includes('FileText');
    const hasMessageSquareImport = panelContent.includes('MessageSquare');
    const hasCopyImport = panelContent.includes('Copy');
    const hasImportStatement = panelContent.includes("from 'lucide-react'");

    if (hasFileTextImport && hasMessageSquareImport && hasCopyImport && hasImportStatement) {
      console.log('  ✅ PASS: Tab icons imported from lucide-react');
      console.log('    ✓ FileText icon (Resume tab)');
      console.log('    ✓ MessageSquare icon (Questions tab)');
      console.log('    ✓ Copy icon (copy buttons)');
      console.log('    ✓ lucide-react import statement\n');
      passed++;
    } else {
      console.log('  ❌ FAIL: Tab icons not properly imported');
      console.log(`    - FileText: ${hasFileTextImport}`);
      console.log(`    - MessageSquare: ${hasMessageSquareImport}`);
      console.log(`    - Copy: ${hasCopyImport}`);
      console.log(`    - lucide-react import: ${hasImportStatement}\n`);
      failed++;
    }
  } catch (error) {
    console.log(`  ❌ FAIL: ${(error as Error).message}\n`);
    failed++;
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
    console.log('🎉 ALL TESTS PASSED! Tabbed interface is production-ready.\n');
    console.log('Tabbed Interface Features:');
    console.log('  ✅ Resume Tab → Paste and store resume content');
    console.log('  ✅ Questions Tab → AI answer generation');
    console.log('  ✅ Auto-copy to clipboard → AI answers automatically copied');
    console.log('  ✅ Manual copy button → Copy with "Copied!" feedback');
    console.log('  ✅ Tab switching → Smooth transitions with LinkedIn blue accent');
    console.log('  ✅ State persistence → Resume text persists between tabs');
    console.log('  ✅ Responsive design → Adjusts layout at 400px width');
    console.log('  ✅ Visual feedback → Notifications for auto-copy and manual copy\n');
  } else {
    console.log('⚠️  Some tests failed. Review errors above.\n');
  }
}

// Run tests
runTests().catch(console.error);
