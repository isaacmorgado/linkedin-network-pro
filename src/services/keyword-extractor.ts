/**
 * Keyword Extraction Service
 * Extracts keywords from job descriptions for ATS optimization
 * Based on keyword_extraction_resume_optimization_research.md
 */

import type { ExtractedKeyword, KeywordCategory } from '../types/resume';

/**
 * Extract keywords from job description
 * Uses frequency analysis, position weighting, and contextual analysis
 */
export function extractKeywordsFromJobDescription(jobDescription: string): ExtractedKeyword[] {
  const keywords: Map<string, ExtractedKeyword> = new Map();

  // Clean and tokenize text
  const tokens = tokenize(jobDescription);

  // Extract n-grams (1-3 words)
  const unigrams = extractNGrams(tokens, 1);
  const bigrams = extractNGrams(tokens, 2);
  const trigrams = extractNGrams(tokens, 3);

  // Combine all n-grams
  const allNGrams = [...unigrams, ...bigrams, ...trigrams];

  // Calculate frequency for each n-gram
  const frequencyMap = calculateFrequency(allNGrams);

  // Filter and score keywords
  for (const [term, frequency] of frequencyMap.entries()) {
    // Skip common words and short terms
    if (isCommonWord(term) || term.length < 2) {
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

  // Sort by weight (most important first)
  const sortedKeywords = Array.from(keywords.values()).sort((a, b) => b.weight - a.weight);

  // Return top 50 keywords
  return sortedKeywords.slice(0, 50);
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
 * Determine if keyword is required vs preferred
 * Based on surrounding context in job description
 */
function isRequiredSkill(term: string, jobDescription: string): boolean {
  const requiredIndicators = [
    'required', 'must have', 'must possess', 'essential', 'mandatory',
    'necessary', 'require', 'requires', 'requiring',
  ];

  const preferredIndicators = [
    'preferred', 'nice to have', 'bonus', 'plus', 'desired',
    'ideal', 'would be great',
  ];

  // Find sentences containing the term
  const sentences = jobDescription.toLowerCase().split(/[.!?]+/);
  const relevantSentences = sentences.filter((s) => s.includes(term));

  // Check for required indicators
  const hasRequiredIndicator = relevantSentences.some((sentence) =>
    requiredIndicators.some((indicator) => sentence.includes(indicator))
  );

  const hasPreferredIndicator = relevantSentences.some((sentence) =>
    preferredIndicators.some((indicator) => sentence.includes(indicator))
  );

  // If in "requirements" section, more likely to be required
  const requirementsSection = extractSection(jobDescription, ['requirements', 'qualifications']);
  const inRequirementsSection = requirementsSection.toLowerCase().includes(term);

  // Scoring
  if (hasRequiredIndicator) return true;
  if (hasPreferredIndicator) return false;
  if (inRequirementsSection) return true;

  // Default to required if appears frequently (3+ times)
  const frequency = (jobDescription.toLowerCase().match(new RegExp(`\\b${term}\\b`, 'g')) || []).length;
  return frequency >= 3;
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

  // Length bonus for multi-word terms (15 points)
  const wordCount = term.split(/\s+/).length;
  if (wordCount >= 2) {
    weight += Math.min(15, wordCount * 5);
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
  const keywords = extractKeywordsFromJobDescription(jobDescription);

  const required = keywords
    .filter((k) => k.required)
    .map((k) => k.term);

  const preferred = keywords
    .filter((k) => !k.required)
    .map((k) => k.term);

  return { required, preferred };
}
