/**
 * Test Script: Healthcare Industry Keyword Extraction
 * Tests ATS keyword extraction for a Registered Nurse position
 */

import { extractKeywordsFromJobDescription } from './src/services/keyword-extractor';
import { skillsDatabase } from './src/types/skills';

const HEALTHCARE_JOB_DESCRIPTION = `
Registered Nurse (RN) - Medical-Surgical Unit

Join our growing healthcare team! We are seeking an experienced Registered Nurse to work in our Medical-Surgical unit.

REQUIREMENTS:
- Active RN license in good standing
- BLS and ACLS certification required
- PALS certification preferred
- 2+ years of Med-Surg experience
- Experience with Epic EHR system strongly preferred
- Cerner experience a plus

KEY RESPONSIBILITIES:
- Provide direct patient care and bedside nursing
- Monitor vital signs and patient status
- Administer medications and IV therapy
- Perform wound care and dressing changes
- Phlebotomy and blood draws
- Document in electronic medical records (Epic/Cerner)
- Collaborate with interdisciplinary healthcare team
- Ensure HIPAA compliance and patient confidentiality
- Maintain infection control standards
- Patient education and discharge planning

REQUIRED SKILLS:
- Strong patient assessment skills
- Excellent communication and interpersonal skills
- Critical thinking and problem-solving abilities
- Attention to detail
- Ability to work in fast-paced environment
- Team collaboration

CERTIFICATIONS REQUIRED:
- RN License
- BLS Certification
- ACLS Certification

CERTIFICATIONS PREFERRED:
- PALS
- TNCC (Trauma Nursing Core Course)

BENEFITS:
- Competitive salary
- Health insurance
- 401(k) matching
- Continuing education support
- Tuition reimbursement
`;

console.log('='.repeat(80));
console.log('HEALTHCARE INDUSTRY TEST: Registered Nurse Position');
console.log('='.repeat(80));
console.log();

console.log('Job Description Preview:');
console.log(HEALTHCARE_JOB_DESCRIPTION.substring(0, 300) + '...');
console.log();

console.log('Extracting keywords...');
console.log();

const keywords = extractKeywordsFromJobDescription(HEALTHCARE_JOB_DESCRIPTION);

console.log(`Total keywords extracted: ${keywords.length}`);
console.log();

// Group keywords by category
const keywordsByCategory: Record<string, typeof keywords> = {};
keywords.forEach(kw => {
  if (!keywordsByCategory[kw.category]) {
    keywordsByCategory[kw.category] = [];
  }
  keywordsByCategory[kw.category].push(kw);
});

console.log('RESULTS BY CATEGORY:');
console.log('='.repeat(80));

Object.entries(keywordsByCategory).forEach(([category, kws]) => {
  console.log();
  console.log(`${category.toUpperCase()} (${kws.length} keywords):`);
  console.log('-'.repeat(40));
  kws.slice(0, 10).forEach(kw => {
    console.log(`  ✓ ${kw.phrase} (score: ${kw.score}, occurrences: ${kw.occurrences})${kw.required ? ' [REQUIRED]' : ''}`);
  });
  if (kws.length > 10) {
    console.log(`  ... and ${kws.length - 10} more`);
  }
});

console.log();
console.log('='.repeat(80));
console.log('TOP 20 MOST IMPORTANT KEYWORDS:');
console.log('='.repeat(80));

keywords.slice(0, 20).forEach((kw, index) => {
  console.log(`${index + 1}. ${kw.phrase}`);
  console.log(`   Category: ${kw.category}`);
  console.log(`   Score: ${kw.score} | Occurrences: ${kw.occurrences}${kw.required ? ' | REQUIRED' : ''}`);
  if (kw.synonyms && kw.synonyms.length > 0) {
    console.log(`   Synonyms: ${kw.synonyms.join(', ')}`);
  }
  console.log();
});

// Validate critical healthcare keywords were found
console.log('='.repeat(80));
console.log('VALIDATION: Critical Healthcare Keywords');
console.log('='.repeat(80));

const criticalKeywords = [
  'RN',
  'BLS',
  'ACLS',
  'Epic',
  'Patient Care',
  'HIPAA',
  'Vital Signs',
  'Medication Administration'
];

criticalKeywords.forEach(term => {
  const found = keywords.find(kw =>
    kw.phrase.toLowerCase() === term.toLowerCase() ||
    (kw.synonyms && kw.synonyms.some(s => s.toLowerCase() === term.toLowerCase()))
  );
  console.log(`${found ? '✓' : '✗'} ${term}${found ? ` (score: ${found.score})` : ' [NOT FOUND]'}`);
});

console.log();
console.log('='.repeat(80));
console.log('TEST COMPLETE');
console.log('='.repeat(80));
