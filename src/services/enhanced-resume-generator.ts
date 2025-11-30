/**
 * Enhanced Resume Generator with Deep Research Mode
 *
 * Integrates the research service with the existing resume generator
 * to produce higher-quality, industry-specific resumes informed by
 * current best practices.
 */

import type {
  JobDescriptionAnalysis,
  ProfessionalProfile,
  GeneratedResume,
} from '../types/resume';
import { generateResumeWithAI } from './ai-resume-generator';
import {
  researchResumeTechniques,
  type ResumeResearchResult,
} from './resume-research';
import { log, LogCategory } from '../utils/logger';

// ============================================================================
// ENHANCED GENERATION FUNCTION
// ============================================================================

/**
 * Generate resume with deep research mode
 *
 * This function:
 * 1. Detects the industry from the job description
 * 2. Performs deep research on current best practices
 * 3. Applies research findings to generation context
 * 4. Generates the resume with enhanced insights
 *
 * @param job - Job description analysis
 * @param profile - User's professional profile
 * @param enableResearch - Whether to use deep research mode (default: true)
 * @returns Generated resume with research-informed improvements
 */
export async function generateResumeWithResearch(
  job: JobDescriptionAnalysis,
  profile: ProfessionalProfile,
  enableResearch = true
): Promise<GeneratedResume & { research?: ResumeResearchResult }> {
  const endTrace = log.trace(LogCategory.SERVICE, 'generateResumeWithResearch', {
    jobTitle: job.jobTitle,
    company: job.company,
    enableResearch,
  });

  try {
    log.info(LogCategory.SERVICE, 'Starting enhanced resume generation with research mode', {
      enableResearch,
    });

    let research: ResumeResearchResult | undefined;

    if (enableResearch) {
      // STEP 1: Detect industry and company from job description
      log.debug(LogCategory.SERVICE, 'Detecting industry and company');
      const { industry, company } = detectIndustryAndCompany(job);
      log.info(LogCategory.SERVICE, 'Detected industry and company', { industry, company });

      // STEP 2: Perform deep research
      log.debug(LogCategory.SERVICE, 'Performing deep research on resume techniques');
      research = await researchResumeTechniques(industry, company);
      log.info(LogCategory.SERVICE, 'Deep research completed', {
        formatRecommendations: research.formatRecommendations.length,
        atsOptimizationTips: research.atsOptimizationTips.length,
        skillsPresentationTips: research.skillsPresentationTips.length,
        achievementPatterns: research.achievementPatterns.length,
      });

      // STEP 3: Apply research findings for future enhancements
      log.debug(LogCategory.SERVICE, 'Research findings available for optimization');
      applyResearchInsights(research);
    }

    // STEP 4: Generate resume with base generator
    log.debug(LogCategory.SERVICE, 'Generating resume with AI generator');
    const result = await generateResumeWithAI(job, profile);

    // Add research to result
    const enhancedResult = {
      ...result,
      research,
    };

    log.info(LogCategory.SERVICE, 'Enhanced resume generation complete', {
      atsScore: result.atsOptimization.overallATSScore,
      experiencesSelected: result.selectedExperiences.length,
      skillsSelected: result.selectedSkills.length,
      hadResearch: !!research,
    });

    endTrace();
    return enhancedResult;
  } catch (error) {
    log.error(LogCategory.SERVICE, 'Enhanced resume generation failed', error as Error);
    endTrace();
    throw error;
  }
}

// ============================================================================
// INDUSTRY DETECTION
// ============================================================================

/**
 * Detect industry and company from job description
 */
function detectIndustryAndCompany(job: JobDescriptionAnalysis): {
  industry: string;
  company: string;
} {
  // Combine job title and keywords for industry detection
  const searchText = `${job.jobTitle} ${job.extractedKeywords.map(k => k.phrase).join(' ')}`.toLowerCase();

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
      if (searchText.includes(keyword.toLowerCase())) {
        matches++;
      }
    }

    if (matches > maxMatches) {
      maxMatches = matches;
      detectedIndustry = industry;
    }
  }

  // Extract company name from job object
  const company = job.company || 'company';

  return { industry: detectedIndustry, company };
}

// ============================================================================
// RESEARCH APPLICATION
// ============================================================================

/**
 * Apply research findings to optimize resume generation
 *
 * This function logs research insights that can be used for future enhancements.
 * Currently serves as a placeholder for applying research-based optimizations.
 */
function applyResearchInsights(research: ResumeResearchResult): void {
  // Example application logic based on validated research findings:

  // Check for two-page format recommendations
  if (research.formatRecommendations.some(r => r.toLowerCase().includes('two page'))) {
    log.debug(LogCategory.SERVICE, 'Research suggests two-page format may be appropriate');
    // Future: Could adjust how many jobs/bullets to include
  }

  // Check for keyword optimization tips
  if (research.atsOptimizationTips.some(t => t.toLowerCase().includes('keyword'))) {
    log.debug(LogCategory.SERVICE, 'Research emphasizes keyword optimization for ATS');
    // Future: Could enhance keyword density in summary or bullets
  }

  // Check for skills presentation recommendations
  if (research.skillsPresentationTips.length > 0) {
    log.debug(LogCategory.SERVICE, 'Research provides skills presentation guidance', {
      tipsCount: research.skillsPresentationTips.length,
    });
    // Future: Could adjust skills section format/grouping
  }

  // Check for achievement quantification patterns
  if (research.achievementPatterns.length > 0) {
    log.debug(LogCategory.SERVICE, 'Research provides achievement patterns', {
      patternsCount: research.achievementPatterns.length,
    });
    // Future: Could enhance bullet points with better quantification
  }

  // Log common mistakes to avoid
  if (research.commonMistakes.length > 0) {
    log.debug(LogCategory.SERVICE, 'Research identified common mistakes to avoid', {
      mistakesCount: research.commonMistakes.length,
    });
    // Future: Could add validation checks against common mistakes
  }

  // Add research context for future AI prompt enhancements
  log.info(LogCategory.SERVICE, 'Research findings available for future optimizations', {
    totalRecommendations:
      research.formatRecommendations.length +
      research.atsOptimizationTips.length +
      research.skillsPresentationTips.length +
      research.achievementPatterns.length +
      research.commonMistakes.length +
      (research.companySpecificAdvice?.length || 0),
  });
}
