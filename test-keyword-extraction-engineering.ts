/**
 * Test Script: Engineering Industry Keyword Extraction
 * Tests ATS keyword extraction for a Mechanical Engineer position
 */

import { extractKeywordsFromJobDescription } from './src/services/keyword-extractor';

const ENGINEERING_JOB_DESCRIPTION = `
Mechanical Engineer - Product Development

Innovative manufacturing company seeks a creative Mechanical Engineer to join our product development team.

REQUIREMENTS:
- Bachelor's degree in Mechanical Engineering
- PE License or EIT certification preferred
- 3-5 years of product design experience
- Proficiency in SolidWorks (required) and AutoCAD
- Experience with 3D printing and rapid prototyping
- Strong understanding of GD&T and manufacturing processes

CORE RESPONSIBILITIES:
Design & Development:
- Design mechanical components and assemblies using SolidWorks
- Create detailed engineering drawings with GD&T callouts
- Develop 3D CAD models and 2D technical drawings
- Perform tolerance analysis and stack-up studies
- Design for manufacturing (DFM) and Design for Assembly (DFMA)
- Prototype development using 3D printing and CNC machining
- Collaborate with cross-functional teams (manufacturing, quality, supply chain)

Analysis & Testing:
- Conduct Finite Element Analysis (FEA) using ANSYS
- Perform stress analysis and structural calculations
- Complete thermal analysis for heat dissipation
- Validate designs through physical testing
- Failure analysis and root cause investigation
- Design verification and validation (DVT, PVT)

Documentation & Compliance:
- Prepare technical specifications and Bill of Materials (BOM)
- Create assembly instructions and work instructions
- Maintain design documentation and revision control
- Ensure compliance with industry standards (ASME, ASTM)
- Support patent applications and IP documentation

Manufacturing Support:
- Work with suppliers on part sourcing and manufacturing
- Conduct design reviews with manufacturing team
- Support production ramp and resolve manufacturing issues
- Implement continuous improvement initiatives (Lean, Six Sigma)
- Cost reduction projects while maintaining quality

REQUIRED SKILLS:
CAD Software:
- SolidWorks (expert level - required)
- AutoCAD (proficient)
- Creo or CATIA (preferred)
- Autodesk Inventor (plus)

Analysis Tools:
- ANSYS Workbench (FEA)
- SolidWorks Simulation
- MATLAB for calculations
- Thermal analysis software

Manufacturing Knowledge:
- CNC machining
- 3D printing / Additive manufacturing
- Injection molding
- Sheet metal fabrication
- Casting processes
- Surface finishing

Technical Knowledge:
- GD&T (Geometric Dimensioning and Tolerancing)
- Strength of materials
- Thermodynamics and heat transfer
- Fluid mechanics
- Materials science
- Tolerance analysis
- DFM and DFMA principles
- PLM (Product Lifecycle Management)

Methodologies:
- Six Sigma (Green Belt preferred)
- Lean Manufacturing
- Design for Six Sigma (DFSS)
- FMEA (Failure Mode and Effects Analysis)
- Root cause analysis (5 Why, Fishbone)

Soft Skills:
- Problem-solving and critical thinking
- Strong communication skills
- Team collaboration
- Project management
- Attention to detail
- Time management
- Creativity and innovation

CERTIFICATIONS PREFERRED:
- Professional Engineer (PE) License
- Engineer in Training (EIT) / FE Exam
- Certified SolidWorks Professional (CSWP)
- Six Sigma Green Belt or Black Belt
- PMP (Project Management Professional)

STANDARDS & CODES:
- ASME Y14.5 (GD&T)
- ASME B&PV Code
- ASTM standards
- ISO 9001
- AS9100 (aerospace)

TOOLS & SOFTWARE:
- SolidWorks Premium
- AutoCAD
- ANSYS
- MATLAB
- Microsoft Office (Excel for calculations)
- PDM/PLM systems
- Minitab (for statistical analysis)
`;

console.log('='.repeat(80));
console.log('ENGINEERING INDUSTRY TEST: Mechanical Engineer - Product Development');
console.log('='.repeat(80));
console.log();

console.log('Job Description Preview:');
console.log(ENGINEERING_JOB_DESCRIPTION.substring(0, 300) + '...');
console.log();

console.log('Extracting keywords...');
console.log();

const keywords = extractKeywordsFromJobDescription(ENGINEERING_JOB_DESCRIPTION);

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

// Validate critical engineering keywords were found
console.log('='.repeat(80));
console.log('VALIDATION: Critical Engineering Keywords');
console.log('='.repeat(80));

const criticalKeywords = [
  'SolidWorks',
  'AutoCAD',
  'FEA',
  'GD&T',
  'CAD',
  'Mechanical Design',
  '3D Printing',
  'CNC Machining',
  'Six Sigma',
  'ANSYS'
];

criticalKeywords.forEach(term => {
  const found = keywords.find(kw =>
    kw.phrase.toLowerCase() === term.toLowerCase() ||
    kw.phrase.toLowerCase().includes(term.toLowerCase()) ||
    (kw.synonyms && kw.synonyms.some(s => s.toLowerCase() === term.toLowerCase()))
  );
  console.log(`${found ? '✓' : '✗'} ${term}${found ? ` (${found.phrase}, score: ${found.score})` : ' [NOT FOUND]'}`);
});

console.log();
console.log('='.repeat(80));
console.log('TEST COMPLETE');
console.log('='.repeat(80));
