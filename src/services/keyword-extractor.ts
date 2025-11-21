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
      // Check if skill appears in job description (case-insensitive)
      const skillPattern = new RegExp(`\\b${escapeRegex(skill.id)}\\b`, 'i');

      // Also check synonyms
      const termsToCheck = [skill.id, skill.name, ...skill.synonyms];

      for (const term of termsToCheck) {
        const termPattern = new RegExp(`\\b${escapeRegex(term)}\\b`, 'i');

        if (termPattern.test(jobDescription)) {
          // Found this skill! Add it with canonical name
          const canonicalTerm = skill.name;
          const frequency = (jobDescription.match(termPattern) || []).length;
          const required = isRequiredSkill(canonicalTerm, jobDescription);
          const weight = calculateKeywordWeight(canonicalTerm, frequency, jobDescription, required) + 10; // +10 bonus for known skills

          if (weight >= 20) {
            keywords.set(canonicalTerm.toLowerCase(), {
              term: canonicalTerm,
              category: skill.category as KeywordCategory,
              required,
              frequency,
              weight,
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

    // STEP 2: Extract n-grams for unknown terms (LOWER PRIORITY)
    log.debug(LogCategory.SERVICE, 'Tokenizing text');
    const tokens = tokenize(jobDescription);
    log.info(LogCategory.SERVICE, `Tokenized into ${tokens.length} tokens`);

    log.debug(LogCategory.SERVICE, 'Extracting n-grams for unknown terms (1-3 words)');
    const unigrams = extractNGrams(tokens, 1);
    const bigrams = extractNGrams(tokens, 2);
    const trigrams = extractNGrams(tokens, 3);
    log.info(LogCategory.SERVICE, 'N-grams extracted', {
      unigrams: unigrams.length,
      bigrams: bigrams.length,
      trigrams: trigrams.length,
    });

    // Combine all n-grams
    const allNGrams = [...unigrams, ...bigrams, ...trigrams];
    log.debug(LogCategory.SERVICE, `Total n-grams to analyze: ${allNGrams.length}`);

    // Calculate frequency for each n-gram
    log.debug(LogCategory.SERVICE, 'Calculating term frequency');
    const frequencyMap = calculateFrequency(allNGrams);
    log.info(LogCategory.SERVICE, `Found ${frequencyMap.size} unique terms`);

    // Filter and score keywords
    log.debug(LogCategory.SERVICE, 'Filtering and scoring keywords');
    let filtered = 0;
    for (const [term, frequency] of frequencyMap.entries()) {
      // Skip common words and short terms
      if (isCommonWord(term) || term.length < 2) {
        filtered++;
        continue;
      }

      // Skip if already found as known skill
      if (keywords.has(term.toLowerCase())) {
        filtered++;
        continue;
      }

      // Determine if required or preferred based on context
      const required = isRequiredSkill(term, jobDescription);

      // Calculate weight (importance score 0-100)
      const weight = calculateKeywordWeight(term, frequency, jobDescription, required);

      // Only include keywords with sufficient weight
      if (weight >= 20) {
        const category = categorizeKeyword(term);
        const context = findKeywordContext(term, jobDescription);

        keywords.set(term, {
          term,
          category,
          required,
          frequency,
          weight,
          context,
          synonyms: generateSynonyms(term, category),
        });
      }
    }

    log.info(LogCategory.SERVICE, 'Keyword filtering complete', {
      filtered,
      remaining: keywords.size,
    });

    // Sort by weight (most important first)
    log.debug(LogCategory.SERVICE, 'Sorting keywords by weight');
    const sortedKeywords = Array.from(keywords.values()).sort((a, b) => b.weight - a.weight);

    // Return all keywords (already filtered by weight >= 20 threshold)
    log.info(LogCategory.SERVICE, 'Keyword extraction completed', {
      totalExtracted: sortedKeywords.length,
      requiredCount: sortedKeywords.filter((k) => k.required).length,
      preferredCount: sortedKeywords.filter((k) => !k.required).length,
      topKeywords: sortedKeywords.slice(0, 10).map((k) => k.term),
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
 * Tokenize text into words
 */
function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\w\s\-+#.]/g, ' ') // Keep hyphens, plus, hash, dot for tech terms
    .split(/\s+/)
    .filter((word) => word.length > 0);
}

/**
 * Extract n-grams (sequences of n words)
 */
function extractNGrams(tokens: string[], n: number): string[] {
  const ngrams: string[] = [];

  for (let i = 0; i <= tokens.length - n; i++) {
    const ngram = tokens.slice(i, i + n).join(' ');
    ngrams.push(ngram);
  }

  return ngrams;
}

/**
 * Calculate frequency of each term
 */
function calculateFrequency(terms: string[]): Map<string, number> {
  const frequency = new Map<string, number>();

  for (const term of terms) {
    frequency.set(term, (frequency.get(term) || 0) + 1);
  }

  return frequency;
}

/**
 * Check if term is a common word that should be filtered out
 */
function isCommonWord(term: string): boolean {
  const commonWords = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
    'of', 'with', 'by', 'from', 'up', 'about', 'into', 'through', 'during',
    'before', 'after', 'above', 'below', 'between', 'under', 'again', 'further',
    'then', 'once', 'here', 'there', 'when', 'where', 'why', 'how', 'all',
    'each', 'other', 'some', 'such', 'only', 'own', 'same', 'so', 'than',
    'too', 'very', 'can', 'will', 'just', 'should', 'now', 'is', 'are',
    'was', 'were', 'been', 'being', 'have', 'has', 'had', 'do', 'does',
    'did', 'doing', 'would', 'could', 'this', 'that', 'these', 'those',
  ]);

  return commonWords.has(term);
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
 * Extract a specific section from job description
 */
function extractSection(text: string, sectionHeaders: string[]): string {
  const lines = text.split('\n');
  let inSection = false;
  let sectionText = '';

  for (const line of lines) {
    const lowerLine = line.toLowerCase();

    // Check if this line is a section header
    const isHeader = sectionHeaders.some((header) => lowerLine.includes(header));

    if (isHeader) {
      inSection = true;
      continue;
    }

    // Check if we hit a new section (line ends with colon or is all caps)
    const isNewSection = line.trim().endsWith(':') || line === line.toUpperCase();

    if (inSection && isNewSection) {
      break;
    }

    if (inSection) {
      sectionText += line + ' ';
    }
  }

  return sectionText;
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

  // Generic term penalty (filter out overly broad terms)
  const genericTerms = new Set([
    'experience', 'software', 'data', 'design', 'development',
    'engineer', 'system', 'work', 'team', 'project', 'build',
    'implement', 'create', 'manage', 'lead', 'support',
    'maintain', 'infrastructure', 'services', 'applications',
  ]);

  if (genericTerms.has(term.toLowerCase())) {
    // Heavily penalize generic terms unless they're in a compound skill
    if (wordCount === 1) {
      weight -= 25; // Single generic word: major penalty
    } else {
      weight -= 10; // Generic word in phrase: minor penalty
    }
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
  // Technical skills
  if (isTechnicalTerm(term)) {
    return 'technical-skill';
  }

  // Tools (ends with common tool suffixes)
  if (/tool|software|platform|system|suite/.test(term)) {
    return 'tool';
  }

  // Certifications
  if (/certified|certification|certificate|license/.test(term)) {
    return 'certification';
  }

  // Methodologies
  if (/agile|scrum|kanban|waterfall|lean|devops|cicd/.test(term)) {
    return 'methodology';
  }

  // Soft skills
  const softSkills = [
    'communication', 'leadership', 'teamwork', 'collaboration',
    'problem solving', 'analytical', 'creative', 'detail oriented',
    'time management', 'adaptable', 'flexible',
  ];
  if (softSkills.some((skill) => term.includes(skill))) {
    return 'soft-skill';
  }

  // Responsibilities
  const responsibilityKeywords = [
    'manage', 'lead', 'develop', 'design', 'implement', 'coordinate',
    'analyze', 'create', 'maintain', 'support', 'oversee',
  ];
  if (responsibilityKeywords.some((keyword) => term.includes(keyword))) {
    return 'responsibility';
  }

  // Achievements
  if (/improve|increase|reduce|optimize|enhance/.test(term)) {
    return 'achievement';
  }

  // Default to technical skill
  return 'technical-skill';
}

/**
 * Generate common synonyms for keyword
 */
function generateSynonyms(term: string, category: KeywordCategory): string[] {
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
      .map((k) => k.term);

    const preferred = keywords
      .filter((k) => !k.required)
      .map((k) => k.term);

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
