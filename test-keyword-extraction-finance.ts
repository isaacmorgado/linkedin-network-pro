/**
 * Test Script: Finance Industry Keyword Extraction
 * Tests ATS keyword extraction for a Financial Analyst position
 */

import { extractKeywordsFromJobDescription } from './src/services/keyword-extractor';

const FINANCE_JOB_DESCRIPTION = `
Financial Analyst - Investment Banking

Leading investment bank seeks an experienced Financial Analyst to join our M&A team.

REQUIREMENTS:
- Bachelor's degree in Finance, Accounting, or related field
- CFA Level 2 or CPA strongly preferred
- 3-5 years of investment banking or corporate finance experience
- Expert proficiency in financial modeling and valuation
- Strong Excel skills (advanced functions, macros, VBA)
- Bloomberg Terminal experience required

CORE RESPONSIBILITIES:
- Build complex financial models (DCF, LBO, comparable company analysis)
- Conduct company valuations and merger & acquisition analysis
- Prepare pitch books and client presentations
- Perform due diligence and financial statement analysis
- Create detailed financial reports and forecasts
- Support M&A deal execution from start to finish
- Analyze market trends and competitive landscapes
- Present findings to senior management and clients

REQUIRED SKILLS:
Technical Skills:
- Financial modeling (DCF, LBO, M&A models)
- Valuation methodologies
- Excel (pivot tables, VLOOKUPs, macros)
- PowerPoint presentation design
- Bloomberg Terminal
- FactSet or Capital IQ
- Financial statement analysis (GAAP/IFRS)

Business Skills:
- Strong analytical and quantitative skills
- Attention to detail
- Excellent communication (written and verbal)
- Project management
- Ability to work under pressure
- Team collaboration
- Problem-solving

PREFERRED QUALIFICATIONS:
- CFA Charter or Level 3 candidate
- CPA license
- MBA from top-tier program
- Experience with SAP or Oracle Financials
- Knowledge of IFRS standards
- Tableau or Power BI for data visualization

TOOLS & SYSTEMS:
- Microsoft Office Suite (Excel, PowerPoint, Word)
- Bloomberg Terminal
- FactSet
- Capital IQ
- QuickBooks (basic understanding)
- SAP ERP
- Tableau

CERTIFICATIONS:
- CFA (Level 2 minimum)
- CPA (preferred)
`;

console.log('='.repeat(80));
console.log('FINANCE INDUSTRY TEST: Financial Analyst - Investment Banking');
console.log('='.repeat(80));
console.log();

console.log('Job Description Preview:');
console.log(FINANCE_JOB_DESCRIPTION.substring(0, 300) + '...');
console.log();

console.log('Extracting keywords...');
console.log();

const keywords = extractKeywordsFromJobDescription(FINANCE_JOB_DESCRIPTION);

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
    console.log(`   Synonyms: ${kw.synonyms.slice(0, 3).join(', ')}${kw.synonyms.length > 3 ? '...' : ''}`);
  }
  console.log();
});

// Validate critical finance keywords were found
console.log('='.repeat(80));
console.log('VALIDATION: Critical Finance Keywords');
console.log('='.repeat(80));

const criticalKeywords = [
  'Financial Modeling',
  'DCF',
  'LBO',
  'M&A',
  'Valuation',
  'CFA',
  'Bloomberg Terminal',
  'Excel',
  'GAAP',
  'Financial Statement Analysis'
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
