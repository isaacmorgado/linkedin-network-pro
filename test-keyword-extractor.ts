/**
 * Keyword Extractor Validation Test
 * Tests the keyword extractor with a real job posting
 */

import { readFileSync } from 'fs';
import { extractKeywordsFromJobDescription, categorizeJobRequirements } from './src/services/keyword-extractor';

console.log('================================================================================');
console.log('🔍 KEYWORD EXTRACTOR VALIDATION TEST');
console.log('================================================================================\n');

// Load test job posting
const jobText = readFileSync('../test-job-posting.txt', 'utf-8');

console.log('📄 Job Posting Details:');
console.log(`   Title: Senior Software Engineer - Full Stack`);
console.log(`   Company: Meta (Facebook)`);
console.log(`   Length: ${jobText.length} characters`);
console.log(`   Word Count: ${jobText.split(/\s+/).length} words\n`);

console.log('⚙️  Running Keyword Extraction...\n');
console.time('⏱️  Extraction Time');

// Extract keywords
const keywords = extractKeywordsFromJobDescription(jobText);
const { required, preferred } = categorizeJobRequirements(jobText);

console.timeEnd('⏱️  Extraction Time');

console.log('\n================================================================================');
console.log('📊 EXTRACTION RESULTS');
console.log('================================================================================\n');

console.log(`Total Keywords Extracted: ${keywords.length}`);
console.log(`Required Skills: ${required.length}`);
console.log(`Preferred Skills: ${preferred.length}\n`);

console.log('🏆 Top 20 Keywords by Weight:\n');
keywords.slice(0, 20).forEach((kw, i) => {
  const badge = kw.required ? '🔴 REQ' : '🟡 PREF';
  const category = kw.category.toUpperCase().padEnd(18);
  console.log(
    `${String(i + 1).padStart(2)}. ${badge} | ${category} | ` +
    `${kw.term.padEnd(30)} | Weight: ${String(kw.weight).padStart(3)} | ` +
    `Freq: ${kw.frequency}`
  );
});

console.log('\n📝 Keywords by Category:\n');

const byCategory = keywords.reduce((acc, kw) => {
  if (!acc[kw.category]) acc[kw.category] = [];
  acc[kw.category].push(kw.term);
  return acc;
}, {} as Record<string, string[]>);

Object.entries(byCategory).forEach(([category, terms]) => {
  console.log(`${category.toUpperCase()}:`);
  console.log(`   ${terms.slice(0, 10).join(', ')}`);
  if (terms.length > 10) {
    console.log(`   ... and ${terms.length - 10} more`);
  }
  console.log('');
});

console.log('================================================================================');
console.log('🔴 REQUIRED SKILLS (Top 15):');
console.log('================================================================================\n');
required.slice(0, 15).forEach((skill, i) => {
  console.log(`${String(i + 1).padStart(2)}. ${skill}`);
});

console.log('\n================================================================================');
console.log('🟡 PREFERRED SKILLS (Top 15):');
console.log('================================================================================\n');
preferred.slice(0, 15).forEach((skill, i) => {
  console.log(`${String(i + 1).padStart(2)}. ${skill}`);
});

console.log('\n================================================================================');
console.log('✅ TEST COMPLETE');
console.log('================================================================================\n');

console.log('📋 Next Steps:');
console.log('   1. Review extracted keywords above');
console.log('   2. Compare with manual ground truth list');
console.log('   3. Calculate precision, recall, F1 score');
console.log('   4. Identify false positives and false negatives');
console.log('   5. Recommend algorithm improvements\n');
