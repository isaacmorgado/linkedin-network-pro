/**
 * Enhanced Cover Letter Generator with Deep Research Mode
 *
 * Integrates the research service with the existing cover letter generator
 * to produce higher-quality, industry-specific cover letters informed by
 * current best practices.
 */

import type {
  GeneratedCoverLetterInternal,
  CoverLetterConfig,
} from '../types/cover-letter';
import type { ProfessionalProfile } from '../types/resume';
import { generateCoverLetter as baseGenerateCoverLetter } from './cover-letter-generator';
import {
  researchCoverLetterTechniques,
  type CoverLetterResearchResult,
} from './cover-letter-research';
import { log, LogCategory } from '../utils/logger';

// ============================================================================
// ENHANCED GENERATION FUNCTION
// ============================================================================

/**
 * Generate cover letter with deep research mode
 *
 * This function:
 * 1. Detects the industry from the job posting
 * 2. Performs deep research on current best practices
 * 3. Applies research findings to generation config
 * 4. Generates the cover letter with enhanced context
 *
 * @param profile - User's professional profile
 * @param jobPosting - Full job posting text
 * @param config - Optional configuration
 * @param enableResearch - Whether to use deep research mode (default: true)
 * @returns Generated cover letter with research-informed improvements
 */
export async function generateCoverLetterWithResearch(
  profile: ProfessionalProfile,
  jobPosting: string,
  config?: CoverLetterConfig,
  enableResearch = true
): Promise<GeneratedCoverLetterInternal & { research?: CoverLetterResearchResult }> {
  const endTrace = log.trace(LogCategory.SERVICE, 'generateCoverLetterWithResearch', {
    profileName: profile.personalInfo.fullName,
    jobPostingLength: jobPosting.length,
    enableResearch,
  });

  try {
    log.info(LogCategory.SERVICE, 'Starting enhanced cover letter generation with research mode', {
      enableResearch,
    });

    let research: CoverLetterResearchResult | undefined;

    if (enableResearch) {
      // STEP 1: Detect industry and company from job posting
      log.debug(LogCategory.SERVICE, 'Detecting industry and company');
      const { industry, company } = detectIndustryAndCompany(jobPosting);
      log.info(LogCategory.SERVICE, 'Detected industry and company', { industry, company });

      // STEP 2: Perform deep research
      log.debug(LogCategory.SERVICE, 'Performing deep research on cover letter techniques');
      research = await researchCoverLetterTechniques(industry, company);
      log.info(LogCategory.SERVICE, 'Deep research completed', {
        trendsFound: research.industryTrends.length,
        tipsFound: research.atsOptimizationTips.length,
      });

      // STEP 3: Enhance config with research findings
      log.debug(LogCategory.SERVICE, 'Applying research findings to generation config');
      config = enhanceConfigWithResearch(config || {}, research);
    }

    // STEP 4: Generate cover letter with enhanced config
    log.debug(LogCategory.SERVICE, 'Generating cover letter with enhanced config');
    const result = await baseGenerateCoverLetter(profile as any, jobPosting, config);

    // Add research to result
    const enhancedResult = {
      ...result,
      research,
    } as GeneratedCoverLetterInternal & { research?: CoverLetterResearchResult };

    log.info(LogCategory.SERVICE, 'Enhanced cover letter generation complete', {
      wordCount: (result as any).wordCount,
      atsScore: (result as any).matchAnalysis?.atsScore,
      hadResearch: !!research,
    });

    endTrace();
    return enhancedResult;
  } catch (error) {
    log.error(LogCategory.SERVICE, 'Enhanced cover letter generation failed', error as Error);
    endTrace();
    throw error;
  }
}

// ============================================================================
// INDUSTRY DETECTION
// ============================================================================

/**
 * Detect industry and company from job posting
 */
function detectIndustryAndCompany(jobPosting: string): {
  industry: string;
  company: string;
} {
  const lowerPosting = jobPosting.toLowerCase();

  // Industry detection patterns
  const industryPatterns = {
    technology: ['software', 'tech', 'engineer', 'developer', 'programming', 'data science', 'AI', 'ML', 'cloud'],
    healthcare: ['healthcare', 'medical', 'hospital', 'clinical', 'physician', 'nurse', 'patient'],
    finance: ['finance', 'banking', 'investment', 'accounting', 'financial', 'trading', 'analyst'],
    marketing: ['marketing', 'advertising', 'brand', 'campaign', 'digital marketing', 'SEO', 'content'],
    education: ['education', 'teaching', 'professor', 'academic', 'university', 'school', 'curriculum'],
    consulting: ['consulting', 'consultant', 'advisory', 'strategy', 'management consulting'],
    retail: ['retail', 'sales', 'store', 'merchandise', 'customer service', 'ecommerce'],
    manufacturing: ['manufacturing', 'production', 'factory', 'supply chain', 'operations'],
    legal: ['legal', 'law', 'attorney', 'paralegal', 'litigation', 'compliance'],
    nonprofit: ['nonprofit', 'NGO', 'charity', 'foundation', 'social impact', 'community'],
  };

  let detectedIndustry = 'general';
  let maxMatches = 0;

  for (const [industry, keywords] of Object.entries(industryPatterns)) {
    let matches = 0;
    for (const keyword of keywords) {
      if (lowerPosting.includes(keyword.toLowerCase())) {
        matches++;
      }
    }

    if (matches > maxMatches) {
      maxMatches = matches;
      detectedIndustry = industry;
    }
  }

  // Company detection
  let company = 'company';
  const companyPatterns = [
    /(?:at|@)\s+([A-Z][A-Za-z0-9\s&.,-]+?)(?:\s+is|,|\.|$)/,
    /([A-Z][A-Za-z0-9\s&.,-]+?)\s+is\s+(?:hiring|looking|seeking)/i,
    /Company:\s*([A-Z][A-Za-z0-9\s&.,-]+)/,
    /About\s+([A-Z][A-Za-z0-9\s&.,-]+)/i,
  ];

  for (const pattern of companyPatterns) {
    const match = jobPosting.match(pattern);
    if (match && match[1]) {
      company = match[1].trim();
      break;
    }
  }

  return { industry: detectedIndustry, company };
}

// ============================================================================
// CONFIG ENHANCEMENT
// ============================================================================

/**
 * Enhance generation config with research findings
 */
function enhanceConfigWithResearch(
  config: CoverLetterConfig,
  research: CoverLetterResearchResult
): CoverLetterConfig {
  // Apply tone recommendations
  if (research.toneBestPractices.length > 0) {
    // Detect if research suggests formal, casual, or balanced tone
    const toneText = research.toneBestPractices.join(' ').toLowerCase();

    if (toneText.includes('formal') || toneText.includes('professional') || toneText.includes('conservative')) {
      config.tone = {
        ...config.tone,
        style: 'professional',
        formality: 'formal',
        enthusiasm: 'reserved',
        personalityLevel: 0.3,
      };
    } else if (toneText.includes('casual') || toneText.includes('conversational') || toneText.includes('friendly')) {
      config.tone = {
        ...config.tone,
        style: 'conversational',
        formality: 'casual',
        enthusiasm: 'high',
        personalityLevel: 0.7,
      };
    } else {
      config.tone = {
        ...config.tone,
        style: 'balanced',
        formality: 'business-casual',
        enthusiasm: 'moderate',
        personalityLevel: 0.5,
      };
    }
  }

  // Apply length recommendations
  if (research.exampleStructures.length > 0) {
    const structureText = research.exampleStructures.join(' ').toLowerCase();

    if (structureText.includes('concise') || structureText.includes('brief') || structureText.includes('short')) {
      config.targetLength = 250;
    } else if (structureText.includes('detailed') || structureText.includes('comprehensive')) {
      config.targetLength = 400;
    } else {
      config.targetLength = 300; // Default
    }
  }

  // Add research context to config for AI to reference
  // This allows the AI to incorporate specific recommendations
  config.researchContext = {
    industryTrends: research.industryTrends,
    atsOptimizationTips: research.atsOptimizationTips,
    commonMistakesToAvoid: research.commonMistakes,
    companySpecificAdvice: research.companySpecificAdvice,
  };

  return config;
}
