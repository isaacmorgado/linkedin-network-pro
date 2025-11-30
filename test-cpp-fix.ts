/**
 * Unit Test: C++ Skills Database Matching
 */

import { extractKeywordsFromJobDescription } from './src/services/keyword-extractor';

const testDescription = `
You will be a member of a team that will be developing highly complex software systems
for semiconductor assembly equipment. You will work on the full development cycle,
from new features, through product enhancement and debugging both in simulation as well
as on actual machines.

Required qualifications:
- Bachelor's degree required
- Proficiency in C++ required
- Object oriented analysis and design methodologies knowledge
- Experience with existing C++ software project
- Multi-threaded programming strong ability
`;

console.log('🧪 Testing C++ Skills Database Matching\n');
console.log('Test Description:');
console.log(testDescription);
console.log('\n' + '='.repeat(60) + '\n');

const keywords = extractKeywordsFromJobDescription(testDescription);

console.log(`\n✅ Total keywords extracted: ${keywords.length}\n`);

// Check if C++ was found
const cppKeyword = keywords.find(k =>
  k.term.toLowerCase().includes('c++') ||
  k.term.toLowerCase() === 'c++' ||
  k.term.toLowerCase() === 'cpp'
);

if (cppKeyword) {
  console.log('✅ SUCCESS: C++ found in keywords!');
  console.log(`   Term: "${cppKeyword.term}"`);
  console.log(`   Weight: ${cppKeyword.weight}`);
  console.log(`   Category: ${cppKeyword.category}`);
  console.log(`   Frequency: ${cppKeyword.frequency}`);
} else {
  console.log('❌ FAIL: C++ NOT found in keywords');
  console.log('\nTop 20 keywords extracted:');
  keywords.slice(0, 20).forEach((k, i) => {
    console.log(`   ${i + 1}. "${k.term}" (weight: ${k.weight})`);
  });
}

// Check for other technical skills
console.log('\n📊 Technical Skills Found:');
const technicalSkills = keywords.filter(k =>
  k.category === 'programming-language' ||
  k.category === 'technical-skill' &&
  k.weight >= 50
);

if (technicalSkills.length > 0) {
  technicalSkills.forEach(k => {
    console.log(`   - ${k.term} (weight: ${k.weight}, category: ${k.category})`);
  });
} else {
  console.log('   (None found)');
}

// Performance check
console.log('\n⏱️  Performance:');
const startTime = performance.now();
extractKeywordsFromJobDescription(testDescription);
const duration = performance.now() - startTime;
console.log(`   Extraction time: ${duration.toFixed(2)}ms`);

process.exit(cppKeyword ? 0 : 1);
