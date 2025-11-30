/**
 * Keyword Extraction Service
 * Extracts keywords from job descriptions for ATS optimization
 * Based on keyword_extraction_resume_optimization_research.md
 */

import type { ExtractedKeyword, KeywordCategory } from '../types/resume';
import { log, LogCategory } from '../utils/logger';
import { skillsDatabase } from '../types/skills';

/**
 * Extract keywords from job description
 * Uses frequency analysis, position weighting, and contextual analysis
 */
export function extractKeywordsFromJobDescription(jobDescription: string): ExtractedKeyword[] {
  // Handle null/undefined input
  if (!jobDescription || typeof jobDescription !== 'string') {
    log.warn(LogCategory.SERVICE, 'Invalid job description input', { jobDescription });
    return [];
  }

  const endTrace = log.trace(LogCategory.SERVICE, 'extractKeywordsFromJobDescription', {
    descriptionLength: jobDescription.length,
  });

  try {
    log.debug(LogCategory.SERVICE, 'Starting keyword extraction', {
      textLength: jobDescription.length,
      wordCount: jobDescription.split(/\s+/).length,
    });

    const keywords: Map<string, ExtractedKeyword> = new Map();

    // STEP 1: Extract known skills from database (HIGH PRIORITY)
    log.debug(LogCategory.SERVICE, 'Extracting known skills from skills database');
    const allSkills = skillsDatabase.getAllSkills();
    let knownSkillsFound = 0;

    for (const skill of allSkills) {
      if (!skill || !skill.name) continue;

      // Also check synonyms
      const termsToCheck = [skill.id, skill.name, ...skill.synonyms];

      for (const term of termsToCheck) {
        const termPattern = new RegExp(`\\b${escapeRegex(term)}\\b`, 'i');

        if (termPattern.test(jobDescription)) {
          // Found this skill! Add it with canonical name
          const canonicalTerm = skill.name;
          const frequency = (jobDescription.match(termPattern) || []).length;
          const required = isRequiredSkill(canonicalTerm, jobDescription);
          const weight = calculateKeywordWeight(canonicalTerm, frequency, jobDescription, required) + 20; // +20 bonus for known skills

          if (weight >= 30) {
            keywords.set(canonicalTerm.toLowerCase(), {
              phrase: canonicalTerm,
              score: weight,
              occurrences: frequency,
              category: skill.category as KeywordCategory,
              required,
              frequency, // Optional, for backwards compatibility
              context: findKeywordContext(canonicalTerm, jobDescription),
              synonyms: skill.synonyms,
            });

            log.debug(LogCategory.SERVICE, `Added keyword: "${canonicalTerm}"`, {
              required,
              weight,
              frequency,
            });

            knownSkillsFound++;
          } else {
            log.debug(LogCategory.SERVICE, `Filtered out "${canonicalTerm}" (weight too low)`, {
              required,
              weight,
              threshold: 20,
            });
          }

          break; // Found this skill, move to next skill
        }
      }
    }

    log.info(LogCategory.SERVICE, `Found ${knownSkillsFound} known skills from database`);

    // STEP 2: Extract acronyms and technical patterns (MEDIUM PRIORITY)
    log.debug(LogCategory.SERVICE, 'Extracting acronyms and technical patterns');
    const acronyms = extractAcronyms(jobDescription);

    for (const acronym of acronyms) {
      // Skip if already found as known skill
      if (keywords.has(acronym.toLowerCase())) {
        continue;
      }

      const frequency = (jobDescription.match(new RegExp(`\\b${escapeRegex(acronym)}\\b`, 'gi')) || []).length;
      const required = isRequiredSkill(acronym, jobDescription);
      const weight = calculateKeywordWeight(acronym, frequency, jobDescription, required) + 10; // +10 bonus for acronyms

      if (weight >= 30) {
        const category = categorizeKeyword(acronym);

        keywords.set(acronym.toLowerCase(), {
          phrase: acronym,
          score: weight,
          occurrences: frequency,
          category,
          required,
          frequency,
          context: [],
          synonyms: [],
        });
      }
    }

    log.info(LogCategory.SERVICE, `Found ${acronyms.length} acronyms/technical patterns`);

    // Sort by score (most important first)
    log.debug(LogCategory.SERVICE, 'Sorting keywords by score');
    const sortedKeywords = Array.from(keywords.values()).sort((a, b) => b.score - a.score);

    // Performance: Add context only for top 30 keywords (lazy evaluation)
    const topN = Math.min(30, sortedKeywords.length);
    for (let i = 0; i < topN; i++) {
      sortedKeywords[i].context = findKeywordContext(sortedKeywords[i].phrase, jobDescription);
    }
    // Remaining keywords have empty context array (saves time)

    // Return all keywords (already filtered by score >= 40 threshold)
    log.info(LogCategory.SERVICE, 'Keyword extraction completed', {
      totalExtracted: sortedKeywords.length,
      requiredCount: sortedKeywords.filter((k) => k.required).length,
      preferredCount: sortedKeywords.filter((k) => !k.required).length,
      topKeywords: sortedKeywords.slice(0, 10).map((k) => k.phrase),
    });

    endTrace(sortedKeywords);
    return sortedKeywords;
  } catch (error) {
    log.error(LogCategory.SERVICE, 'Keyword extraction failed', error as Error);
    endTrace();
    throw error;
  }
}

/**
 * Extract acronyms and technical patterns from job description
 * Finds all-caps terms (AWS, CI/CD, REST) and common technical acronyms
 */
function extractAcronyms(text: string): string[] {
  const acronyms = new Set<string>();

  // Pattern 1: All-caps words (2-6 characters) - AWS, REST, API, SQL, GCP
  const allCapsPattern = /\b[A-Z]{2,6}\b/g;
  const allCapsMatches = text.match(allCapsPattern) || [];

  // Expanded non-technical filter
  const nonTechnical = new Set([
    // Geography
    'US', 'USA', 'UK', 'EU', 'CA', 'AU', 'NZ', 'JP', 'CN', 'IN',
    // Time zones
    'PM', 'AM', 'EST', 'PST', 'CST', 'MST', 'UTC', 'GMT',
    // Common words
    'IT', 'OR', 'AND', 'NOT', 'FOR', 'THE', 'WE', 'OUR', 'YOU', 'ALL',
    // Business fluff
    'LLC', 'INC', 'LTD', 'CORP', 'CO', 'PLC', 'EOE',
    // Months
    'JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC',
  ]);

  for (const match of allCapsMatches) {
    if (!nonTechnical.has(match)) {
      acronyms.add(match);
    }
  }

  // Pattern 2: Technical acronyms with special chars - CI/CD, C++, C#, .NET, Node.js
  const specialPatterns = [
    /\bCI\/CD\b/gi,
    /\bC\+\+\b/gi,
    /\bC#\b/gi,
    /\bF#\b/gi,
    /\b\.NET\b/gi,
    /\bNode\.js\b/gi,
    /\bReact\.js\b/gi,
    /\bVue\.js\b/gi,
    /\bNext\.js\b/gi,
    /\bExpress\.js\b/gi,
    /\bAngular\.js\b/gi,
  ];

  for (const pattern of specialPatterns) {
    const matches = text.match(pattern) || [];
    for (const match of matches) {
      acronyms.add(match);
    }
  }

  // Pattern 3: Multi-word technical phrases
  const compoundPatterns = [
    // AI/ML
    /\bMachine Learning\b/gi,
    /\bArtificial Intelligence\b/gi,
    /\bNatural Language Processing\b/gi,
    /\bDeep Learning\b/gi,
    /\bComputer Vision\b/gi,
    /\bData Science\b/gi,
    /\bLarge Language Model(s)?\b/gi,
    // Development
    /\bWeb Development\b/gi,
    /\bFull[- ]?Stack\b/gi,
    /\bFront[- ]?End\b/gi,
    /\bBack[- ]?End\b/gi,
    /\bMobile Development\b/gi,
    /\bSoftware Engineering\b/gi,
    // DevOps & Cloud
    /\bDevOps\b/gi,
    /\bCloud Computing\b/gi,
    /\bInfrastructure as Code\b/gi,
    /\bContinuous Integration\b/gi,
    /\bContinuous Deployment\b/gi,
    /\bContinuous Delivery\b/gi,
    // Architecture
    /\bMicroservices\b/gi,
    /\bServerless\b/gi,
    /\bEvent[- ]?Driven\b/gi,
    /\bService[- ]?Oriented Architecture\b/gi,
    // Methodologies
    /\bAgile Development\b/gi,
    /\bTest[- ]?Driven Development\b/gi,
    /\bBehavior[- ]?Driven Development\b/gi,
  ];

  for (const pattern of compoundPatterns) {
    const matches = text.match(pattern) || [];
    for (const match of matches) {
      acronyms.add(match);
    }
  }

  // Pattern 4: Technical KPIs and metrics (commonly used in job descriptions)
  const kpiPatterns = [
    /\bMTTR\b/g,  // Mean Time To Recovery
    /\bMTBF\b/g,  // Mean Time Between Failures
    /\bSLA\b/g,   // Service Level Agreement
    /\bSLO\b/g,   // Service Level Objective
    /\bSLI\b/g,   // Service Level Indicator
    /\bKPI(s)?\b/gi, // Key Performance Indicator
    /\bOKR(s)?\b/gi, // Objectives and Key Results
    /\bROI\b/g,   // Return on Investment
    /\bRPO\b/g,   // Recovery Point Objective
    /\bRTO\b/g,   // Recovery Time Objective
  ];

  for (const pattern of kpiPatterns) {
    const matches = text.match(pattern) || [];
    for (const match of matches) {
      acronyms.add(match);
    }
  }

  // Pattern 5: Industry-specific acronyms
  const industryPatterns = [
    // Healthcare
    /\bHIPAA\b/g,
    /\bHL7\b/g,
    /\bFHIR\b/g,
    /\bEHR\b/g,
    /\bEMR\b/g,
    // Finance
    /\bPCI[- ]?DSS\b/gi,
    /\bGDPR\b/g,
    /\bSOX\b/g,
    /\bKYC\b/g,
    /\bAML\b/g,
    // Government/Defense
    /\bFedRAMP\b/g,
    /\bFISMA\b/g,
    /\bITAR\b/g,
    // Security
    /\bOWASP\b/g,
    /\bCVE\b/g,
    /\bSOC 2\b/g,
    /\bISO 27001\b/g,
  ];

  for (const pattern of industryPatterns) {
    const matches = text.match(pattern) || [];
    for (const match of matches) {
      acronyms.add(match);
    }
  }

  return Array.from(acronyms);
}

/**
 * Job description sections interface
 */
interface JobSections {
  responsibilities?: string;
  requiredQualifications?: string;
  preferredQualifications?: string;
  benefits?: string;
  rawText: string;
}

/**
 * Parse job description into structured sections
 * Separates required from preferred qualifications
 */
function parseJobSections(jobDescription: string): JobSections {
  const sections: JobSections = {
    rawText: jobDescription
  };

  // Section header patterns (order matters - most specific first!)
  const patterns: Record<string, RegExp[]> = {
    requiredQualifications: [
      /^\s*(required\s+qualifications?)\s*:?/im,
      /^\s*(requirements?)\s*:?/im,
      /^\s*(must\s+have)\s*:?/im,
      /^\s*(required\s+skills?)\s*:?/im,
      /^\s*(minimum\s+qualifications?)\s*:?/im,
    ],
    preferredQualifications: [
      /^\s*(preferred\s+qualifications?)\s*:?/im,
      /^\s*(nice\s+to\s+have)\s*:?/im,
      /^\s*(bonus)\s*:?/im,
      /^\s*(plus)\s*:?/im,
      /^\s*(ideal\s+candidate)\s*:?/im,
      /^\s*(preferred\s+skills?)\s*:?/im,
      /^\s*(optional)\s*:?/im,
    ],
    responsibilities: [
      /^\s*(responsibilities?)\s*:?/im,
      /^\s*(what\s+you'?ll\s+do)\s*:?/im,
      /^\s*(role\s+overview)\s*:?/im,
      /^\s*(your\s+role)\s*:?/im,
      /^\s*(duties)\s*:?/im,
    ],
    benefits: [
      /^\s*(benefits)\s*:?/im,
      /^\s*(what\s+we\s+offer)\s*:?/im,
      /^\s*(perks)\s*:?/im,
      /^\s*(compensation)\s*:?/im,
    ],
  };

  const lines = jobDescription.split('\n');
  let currentSection: keyof Omit<JobSections, 'rawText'> | null = null;
  let sectionText = '';

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Check if this line is a section header
    let matchedSection: keyof Omit<JobSections, 'rawText'> | null = null;

    for (const [section, regexes] of Object.entries(patterns)) {
      if (regexes.some(regex => regex.test(line))) {
        matchedSection = section as keyof Omit<JobSections, 'rawText'>;
        break;
      }
    }

    if (matchedSection) {
      // Save previous section
      if (currentSection && sectionText) {
        sections[currentSection] = sectionText.trim();
      }

      // Start new section
      currentSection = matchedSection;
      sectionText = '';
    } else if (currentSection) {
      // Add to current section
      sectionText += line + ' ';
    }
  }

  // Save last section
  if (currentSection && sectionText) {
    sections[currentSection] = sectionText.trim();
  }

  // Debug logging to see what sections were extracted
  log.debug(LogCategory.SERVICE, 'Job sections parsed', {
    hasRequired: !!sections.requiredQualifications,
    hasPreferred: !!sections.preferredQualifications,
    hasResponsibilities: !!sections.responsibilities,
    hasBenefits: !!sections.benefits,
    requiredLength: sections.requiredQualifications?.length || 0,
    preferredLength: sections.preferredQualifications?.length || 0,
  });

  return sections;
}

/**
 * Determine if keyword is required vs preferred
 * Based on surrounding context in job description
 */
function isRequiredSkill(term: string, jobDescription: string): boolean {
  // Parse job description into sections
  const sections = parseJobSections(jobDescription);
  const lowerTerm = term.toLowerCase();

  // Track which sections contain this term for debugging
  const regex = new RegExp(`\\b${escapeRegex(lowerTerm)}\\b`, 'i');
  const inRequired = sections.requiredQualifications && regex.test(sections.requiredQualifications);
  const inPreferred = sections.preferredQualifications && regex.test(sections.preferredQualifications);
  const inResponsibilities = sections.responsibilities && regex.test(sections.responsibilities);

  // PRIORITY 1: Check if in required qualifications section
  if (inRequired) {
    log.debug(LogCategory.SERVICE, `[isRequiredSkill] "${term}" → REQUIRED (Priority 1: in required section)`, {
      inRequired,
      inPreferred,
      inResponsibilities,
    });
    return true;
  }

  // PRIORITY 2: Check if in preferred qualifications section (explicitly NOT required)
  if (inPreferred) {
    log.debug(LogCategory.SERVICE, `[isRequiredSkill] "${term}" → PREFERRED (Priority 2: in preferred section)`, {
      inRequired,
      inPreferred,
      inResponsibilities,
    });
    return false;
  }

  // PRIORITY 2.5: Check if in responsibilities section (treat as required but lower priority than explicit required)
  if (inResponsibilities) {
    log.debug(LogCategory.SERVICE, `[isRequiredSkill] "${term}" → REQUIRED (Priority 2.5: in responsibilities section)`, {
      inRequired,
      inPreferred,
      inResponsibilities,
    });
    return true;
  }

  // PRIORITY 3: Check for indicator words as fallback
  const requiredIndicators = [
    'required', 'must have', 'must possess', 'essential', 'mandatory',
    'necessary', 'require', 'requires', 'requiring',
  ];

  const preferredIndicators = [
    'preferred', 'nice to have', 'bonus', 'plus', 'desired',
    'ideal', 'would be great',
  ];

  const sentences = jobDescription.toLowerCase().split(/[.!?]+/);
  const relevantSentences = sentences.filter((s) => s.includes(lowerTerm));

  const hasRequiredIndicator = relevantSentences.some((sentence) =>
    requiredIndicators.some((indicator) => sentence.includes(indicator))
  );

  const hasPreferredIndicator = relevantSentences.some((sentence) =>
    preferredIndicators.some((indicator) => sentence.includes(indicator))
  );

  if (hasRequiredIndicator) {
    log.debug(LogCategory.SERVICE, `[isRequiredSkill] "${term}" → REQUIRED (Priority 3: has required indicator)`, {
      inRequired,
      inPreferred,
      inResponsibilities,
      hasRequiredIndicator,
    });
    return true;
  }

  if (hasPreferredIndicator) {
    log.debug(LogCategory.SERVICE, `[isRequiredSkill] "${term}" → PREFERRED (Priority 3: has preferred indicator)`, {
      inRequired,
      inPreferred,
      inResponsibilities,
      hasPreferredIndicator,
    });
    return false;
  }

  // PRIORITY 4: Default to required if appears frequently (3+ times)
  const frequency = (jobDescription.toLowerCase().match(new RegExp(`\\b${escapeRegex(lowerTerm)}\\b`, 'g')) || []).length;
  const isFrequent = frequency >= 3;

  log.debug(LogCategory.SERVICE, `[isRequiredSkill] "${term}" → ${isFrequent ? 'REQUIRED' : 'PREFERRED'} (Priority 4: frequency=${frequency})`, {
    inRequired,
    inPreferred,
    inResponsibilities,
    frequency,
    isFrequent,
  });

  return isFrequent;
}

/**
 * Escape special regex characters
 */
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Calculate keyword importance weight (0-100)
 */
function calculateKeywordWeight(
  term: string,
  frequency: number,
  jobDescription: string,
  required: boolean
): number {
  let weight = 0;

  // Frequency scoring (max 30 points)
  weight += Math.min(30, frequency * 5);

  // Required vs preferred (20 points)
  if (required) {
    weight += 20;
  } else {
    weight += 10;
  }

  // Position in document (max 20 points)
  const positionScore = calculatePositionScore(term, jobDescription);
  weight += positionScore;

  // Technical term bonus (15 points)
  if (isTechnicalTerm(term)) {
    weight += 15;
  }

  // Multi-word term weighting (smarter approach)
  const wordCount = term.split(/\s+/).length;
  const isKnownSkill = skillsDatabase.isKnownSkill(term);
  const hasStopWords = /\b(with|using|and|or|the|a|an|in|on|at|for|of|to|from)\b/i.test(term);

  // FILLER WORD FILTER - Job posting meta words (automatic rejection)
  const fillerWords = new Set([
    // Job posting meta words
    'position', 'candidate', 'requirements', 'required', 'preferred',
    'responsibilities', 'qualifications', 'opportunity', 'role', 'job',
    // Generic experience words
    'experience', 'experienced', 'years', 'level', 'senior', 'junior',
    'associate', 'entry', 'mid', 'range', 'background',
    // Generic action words (not specific skills)
    'ability', 'knowledge', 'understanding', 'familiarity', 'proficiency',
    // Company/team words
    'company', 'team', 'organization', 'department', 'group', 'culture',
    // Generic nouns
    'skills', 'degree', 'education', 'certification', 'training',
  ]);

  if (wordCount === 1 && fillerWords.has(term.toLowerCase())) {
    return 0; // Automatic rejection
  }

  // GENERIC TECHNICAL TERMS - Allow in compounds, penalize alone
  const genericTechTerms = new Set([
    'software', 'data', 'design', 'development', 'engineer', 'engineering',
    'system', 'project', 'code', 'build', 'implement', 'create',
  ]);

  if (genericTechTerms.has(term.toLowerCase())) {
    if (wordCount === 1) {
      weight -= 20; // Heavy penalty but not automatic rejection
    } else if (!isKnownSkill) {
      weight -= 10; // Moderate penalty for unknown phrases
    }
  }

  if (isKnownSkill && wordCount >= 2) {
    // Reward legitimate compound skills: "machine learning", "react native"
    weight += 15;
  } else if (hasStopWords) {
    // Penalize sentence fragments with stop words: "with react and", "using jenkins"
    weight -= 20;
  } else if (wordCount >= 2) {
    // Neutral for unknown multi-word terms
    weight += 5;
  }

  return Math.min(100, weight);
}

/**
 * Calculate position-based score
 * Keywords appearing earlier are more important
 */
function calculatePositionScore(term: string, jobDescription: string): number {
  const index = jobDescription.toLowerCase().indexOf(term);
  if (index === -1) return 0;

  const docLength = jobDescription.length;
  const relativePosition = index / docLength;

  // Score decreases as position gets further from start
  // First 25%: 20 points
  // Next 25%: 15 points
  // Next 25%: 10 points
  // Last 25%: 5 points
  if (relativePosition < 0.25) return 20;
  if (relativePosition < 0.5) return 15;
  if (relativePosition < 0.75) return 10;
  return 5;
}

/**
 * Check if term is a technical skill/tool
 */
function isTechnicalTerm(term: string): boolean {
  const technicalPatterns = [
    /^[a-z]+\.js$/i,        // JavaScript frameworks: react.js, vue.js
    /^[a-z]+#$/,            // Languages with #: c#, f#
    /\+\+$/,                // C++
    /^aws|azure|gcp/i,      // Cloud platforms
    /sql|nosql|database/i,  // Databases
    /python|java|ruby|php|go|rust|swift|kotlin/i, // Languages
    /react|angular|vue|svelte/i, // Frontend frameworks
    /node|express|django|flask|spring/i, // Backend frameworks
    /docker|kubernetes|jenkins|ci\/cd/i, // DevOps
    /api|rest|graphql|grpc/i, // API technologies
  ];

  return technicalPatterns.some((pattern) => pattern.test(term));
}

/**
 * Find context sentences where keyword appears
 */
function findKeywordContext(term: string, jobDescription: string): string[] {
  const sentences = jobDescription.split(/[.!?]+/);
  const contexts: string[] = [];

  for (const sentence of sentences) {
    if (sentence.toLowerCase().includes(term)) {
      contexts.push(sentence.trim());
      if (contexts.length >= 3) break; // Max 3 context sentences
    }
  }

  return contexts;
}

/**
 * Categorize keyword into a category
 */
function categorizeKeyword(term: string): KeywordCategory {
  // Programming languages
  if (/python|java|ruby|php|go|rust|swift|kotlin|javascript|typescript|c\+\+|c#/i.test(term)) {
    return 'language';
  }

  // Frameworks
  if (/react|angular|vue|svelte|node|express|django|flask|spring|rails/i.test(term)) {
    return 'framework';
  }

  // Cloud platforms
  if (/aws|azure|gcp|google cloud|amazon web services/i.test(term)) {
    return 'cloud';
  }

  // DevOps tools
  if (/docker|kubernetes|jenkins|ci\/cd|terraform|ansible|cicd/i.test(term)) {
    return 'devops';
  }

  // Databases
  if (/sql|mongodb|postgres|mysql|redis|elasticsearch|database/i.test(term)) {
    return 'db';
  }

  // Protocols
  if (/rest|graphql|grpc|http|snmp|api/i.test(term)) {
    return 'protocol';
  }

  // Methodologies
  if (/agile|scrum|kanban|waterfall|lean|tdd/i.test(term)) {
    return 'methodology';
  }

  // Soft skills
  const softSkills = [
    'communication', 'leadership', 'teamwork', 'collaboration',
    'problem solving', 'analytical', 'creative', 'detail oriented',
    'time management', 'adaptable', 'flexible',
  ];
  if (softSkills.some((skill) => term.toLowerCase().includes(skill))) {
    return 'soft';
  }

  // Job roles
  if (/engineer|developer|architect|manager|lead|analyst/i.test(term)) {
    return 'role';
  }

  // Tools (ends with common tool suffixes)
  if (/tool|software|platform|system|suite/.test(term)) {
    return 'tool';
  }

  // Default to other
  return 'other';
}

/**
 * Generate common synonyms for keyword
 */
function generateSynonyms(term: string): string[] {
  const synonyms: string[] = [term];

  // Technical skill synonyms
  const techSynonyms: Record<string, string[]> = {
    'react': ['react.js', 'reactjs', 'react js'],
    'node': ['node.js', 'nodejs', 'node js'],
    'javascript': ['js', 'javascript', 'ecmascript'],
    'typescript': ['ts', 'typescript'],
    'python': ['py', 'python'],
    'c++': ['cpp', 'c++', 'c plus plus'],
    'c#': ['csharp', 'c#', 'c sharp'],
    'sql': ['sql', 'structured query language'],
    'nosql': ['nosql', 'no sql', 'non-relational'],
    'aws': ['amazon web services', 'aws'],
    'gcp': ['google cloud platform', 'gcp', 'google cloud'],
    'azure': ['microsoft azure', 'azure'],
  };

  const lowerTerm = term.toLowerCase();
  for (const [key, syns] of Object.entries(techSynonyms)) {
    if (lowerTerm.includes(key) || key.includes(lowerTerm)) {
      synonyms.push(...syns);
    }
  }

  // Remove duplicates and return
  return Array.from(new Set(synonyms));
}

/**
 * Extract required vs preferred skills from job description
 * Returns categorized lists
 */
export function categorizeJobRequirements(jobDescription: string): {
  required: string[];
  preferred: string[];
} {
  const endTrace = log.trace(LogCategory.SERVICE, 'categorizeJobRequirements', {
    descriptionLength: jobDescription.length,
  });

  try {
    log.debug(LogCategory.SERVICE, 'Categorizing job requirements into required vs preferred');
    const keywords = extractKeywordsFromJobDescription(jobDescription);

    const required = keywords
      .filter((k) => k.required)
      .map((k) => k.phrase);

    const preferred = keywords
      .filter((k) => !k.required)
      .map((k) => k.phrase);

    const result = { required, preferred };
    log.info(LogCategory.SERVICE, 'Job requirements categorized', {
      requiredCount: required.length,
      preferredCount: preferred.length,
      topRequired: required.slice(0, 5),
      topPreferred: preferred.slice(0, 5),
    });

    endTrace(result);
    return result;
  } catch (error) {
    log.error(LogCategory.SERVICE, 'Job requirements categorization failed', error as Error);
    endTrace();
    throw error;
  }
}
