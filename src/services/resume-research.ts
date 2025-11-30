/**
 * Deep Research Mode for Resume Techniques
 *
 * Researches and caches best practices for resume writing before AI generation.
 * This ensures the AI has up-to-date knowledge of:
 * - Industry-specific resume trends
 * - Format and structure recommendations
 * - ATS optimization techniques
 * - Skills presentation best practices
 * - Achievement quantification patterns
 * - 2025 resume best practices
 *
 * Research is cached for 30 days to avoid redundant API calls.
 */

import Anthropic from '@anthropic-ai/sdk';
import { log, LogCategory } from '../utils/logger';

// ============================================================================
// TYPES
// ============================================================================

export interface ResumeResearchResult {
  formatRecommendations: string[];
  atsOptimizationTips: string[];
  skillsPresentationTips: string[];
  achievementPatterns: string[];
  commonMistakes: string[];
  companySpecificAdvice?: string[];
  researchedAt: number;
  expiresAt: number;
}

export interface ResearchCache {
  [industryKey: string]: ResumeResearchResult;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const CACHE_DURATION_DAYS = 30;
const CACHE_STORAGE_KEY = 'uproot_resume_research_cache';

// ============================================================================
// MAIN RESEARCH FUNCTION
// ============================================================================

/**
 * Perform deep research on resume techniques for a specific industry/company
 *
 * @param industry - Industry to research (e.g., "technology", "healthcare", "finance")
 * @param companyName - Optional company name for company-specific research
 * @param useCache - Whether to use cached results (default: true)
 * @returns Research results with best practices and trends
 */
export async function researchResumeTechniques(
  industry: string,
  companyName?: string,
  useCache = true
): Promise<ResumeResearchResult> {
  const endTrace = log.trace(LogCategory.SERVICE, 'researchResumeTechniques', {
    industry,
    companyName,
    useCache,
  });

  try {
    // Generate cache key
    const cacheKey = generateCacheKey(industry, companyName);
    log.debug(LogCategory.SERVICE, 'Generated cache key', { cacheKey });

    // Check cache first
    if (useCache) {
      const cachedResult = await getCachedResearch(cacheKey);
      if (cachedResult) {
        log.info(LogCategory.SERVICE, 'Using cached research results', {
          cacheKey,
          age: Date.now() - cachedResult.researchedAt,
        });
        endTrace();
        return cachedResult;
      }
    }

    log.info(LogCategory.SERVICE, 'Cache miss - performing new research', { cacheKey });

    // Perform fresh research using Claude API
    const research = await performDeepResearch(industry, companyName);

    // Cache the results
    await cacheResearch(cacheKey, research);
    log.info(LogCategory.SERVICE, 'Research completed and cached', { cacheKey });

    endTrace();
    return research;
  } catch (error) {
    log.error(LogCategory.SERVICE, 'Resume research failed', error as Error);
    endTrace();
    throw error;
  }
}

// ============================================================================
// DEEP RESEARCH IMPLEMENTATION
// ============================================================================

/**
 * Perform deep research using Claude API
 */
async function performDeepResearch(
  industry: string,
  companyName?: string
): Promise<ResumeResearchResult> {
  const apiKey = process.env.VITE_ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error('VITE_ANTHROPIC_API_KEY environment variable not set');
  }

  const anthropic = new Anthropic({ apiKey });

  const prompt = buildResearchPrompt(industry, companyName);
  log.debug(LogCategory.SERVICE, 'Sending research prompt to Claude API');

  const message = await anthropic.messages.create({
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 2000,
    temperature: 0.3, // Lower temperature for more factual research
    messages: [
      {
        role: 'user',
        content: prompt,
      },
    ],
  });

  const responseText = message.content[0].type === 'text'
    ? message.content[0].text
    : '';

  log.debug(LogCategory.SERVICE, 'Received research response', {
    responseLength: responseText.length,
  });

  // Parse the structured response
  const research = parseResearchResponse(responseText);

  // Add metadata
  const now = Date.now();
  research.researchedAt = now;
  research.expiresAt = now + (CACHE_DURATION_DAYS * 24 * 60 * 60 * 1000);

  return research;
}

/**
 * Build research prompt for Claude
 */
function buildResearchPrompt(industry: string, companyName?: string): string {
  const basePrompt = `You are a career counseling expert specializing in resume optimization for 2025.

Research and provide comprehensive, actionable advice for writing effective resumes in the ${industry} industry${companyName ? ` for ${companyName}` : ''}.

Provide your response in the following structured format:

## Format Recommendations
[List 3-5 format recommendations including 1-page vs 2-page guidance, sections order, and design tips for ${industry} in 2025]

## ATS Optimization Tips
[List 3-5 current 2025 ATS techniques and keyword strategies specific to ${industry}]

## Skills Presentation Tips
[List 3-5 recommendations on how to present technical vs soft skills in ${industry}]

## Achievement Patterns
[List 3-5 patterns for quantifying and presenting achievements in ${industry}]

## Common Mistakes
[List 3-5 common resume mistakes to avoid in ${industry}]
${companyName ? `

## Company-Specific Advice
[List 3-5 resume tips specific to ${companyName} based on their culture, values, and hiring practices]` : ''}

IMPORTANT:
- Be specific and actionable
- Reference 2025 best practices
- Focus on data-driven insights
- Avoid generic advice
- Provide concrete examples where possible`;

  return basePrompt;
}

/**
 * Parse Claude's research response into structured format
 */
function parseResearchResponse(responseText: string): ResumeResearchResult {
  const sections = {
    formatRecommendations: [] as string[],
    atsOptimizationTips: [] as string[],
    skillsPresentationTips: [] as string[],
    achievementPatterns: [] as string[],
    commonMistakes: [] as string[],
    companySpecificAdvice: [] as string[],
  };

  // Split by section headers
  const formatMatch = responseText.match(/## Format Recommendations\s*([\s\S]*?)(?=##|$)/);
  const atsMatch = responseText.match(/## ATS Optimization Tips\s*([\s\S]*?)(?=##|$)/);
  const skillsMatch = responseText.match(/## Skills Presentation Tips\s*([\s\S]*?)(?=##|$)/);
  const achievementMatch = responseText.match(/## Achievement Patterns\s*([\s\S]*?)(?=##|$)/);
  const mistakesMatch = responseText.match(/## Common Mistakes\s*([\s\S]*?)(?=##|$)/);
  const companyMatch = responseText.match(/## Company-Specific Advice\s*([\s\S]*?)(?=##|$)/);

  // Extract bullet points from each section
  if (formatMatch) {
    sections.formatRecommendations = extractBulletPoints(formatMatch[1]);
  }
  if (atsMatch) {
    sections.atsOptimizationTips = extractBulletPoints(atsMatch[1]);
  }
  if (skillsMatch) {
    sections.skillsPresentationTips = extractBulletPoints(skillsMatch[1]);
  }
  if (achievementMatch) {
    sections.achievementPatterns = extractBulletPoints(achievementMatch[1]);
  }
  if (mistakesMatch) {
    sections.commonMistakes = extractBulletPoints(mistakesMatch[1]);
  }
  if (companyMatch) {
    sections.companySpecificAdvice = extractBulletPoints(companyMatch[1]);
  }

  return {
    ...sections,
    researchedAt: Date.now(),
    expiresAt: Date.now() + (CACHE_DURATION_DAYS * 24 * 60 * 60 * 1000),
  };
}

/**
 * Extract bullet points from section text
 */
function extractBulletPoints(sectionText: string): string[] {
  // Match lines starting with -, *, •, or numbers followed by .
  const bulletRegex = /^[\s]*[-*•][\s]+(.+)$/gm;
  const numberRegex = /^[\s]*\d+\.[\s]+(.+)$/gm;

  const bullets: string[] = [];

  let match;
  while ((match = bulletRegex.exec(sectionText)) !== null) {
    bullets.push(match[1].trim());
  }

  // If no bullet points found, try numbered list
  if (bullets.length === 0) {
    while ((match = numberRegex.exec(sectionText)) !== null) {
      bullets.push(match[1].trim());
    }
  }

  // If still no points found, split by newlines and filter
  if (bullets.length === 0) {
    const lines = sectionText
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 10 && !line.startsWith('#'));
    bullets.push(...lines);
  }

  return bullets;
}

// ============================================================================
// CACHE MANAGEMENT
// ============================================================================

/**
 * Generate cache key for industry/company combination
 */
function generateCacheKey(industry: string, companyName?: string): string {
  const normalized = industry.toLowerCase().replace(/\s+/g, '_');
  if (companyName) {
    const companyNormalized = companyName.toLowerCase().replace(/\s+/g, '_');
    return `${normalized}__${companyNormalized}`;
  }
  return normalized;
}

/**
 * Get cached research results
 */
async function getCachedResearch(cacheKey: string): Promise<ResumeResearchResult | null> {
  try {
    const cache = await loadCache();
    const result = cache[cacheKey];

    if (!result) {
      log.debug(LogCategory.SERVICE, 'Cache miss - no entry found', { cacheKey });
      return null;
    }

    // Check if expired
    if (Date.now() > result.expiresAt) {
      log.debug(LogCategory.SERVICE, 'Cache miss - entry expired', {
        cacheKey,
        expiresAt: result.expiresAt,
      });
      return null;
    }

    return result;
  } catch (error) {
    log.error(LogCategory.SERVICE, 'Failed to load cache', error as Error);
    return null;
  }
}

/**
 * Cache research results
 */
async function cacheResearch(
  cacheKey: string,
  research: ResumeResearchResult
): Promise<void> {
  try {
    const cache = await loadCache();
    cache[cacheKey] = research;
    await saveCache(cache);
    log.debug(LogCategory.SERVICE, 'Research cached successfully', { cacheKey });
  } catch (error) {
    log.error(LogCategory.SERVICE, 'Failed to save cache', error as Error);
    // Don't throw - caching failure shouldn't break research
  }
}

/**
 * Load cache from storage
 */
async function loadCache(): Promise<ResearchCache> {
  try {
    const result = await chrome.storage.local.get(CACHE_STORAGE_KEY);
    return result[CACHE_STORAGE_KEY] || {};
  } catch (error) {
    log.error(LogCategory.SERVICE, 'Failed to load cache from storage', error as Error);
    return {};
  }
}

/**
 * Save cache to storage
 */
async function saveCache(cache: ResearchCache): Promise<void> {
  try {
    await chrome.storage.local.set({ [CACHE_STORAGE_KEY]: cache });
  } catch (error) {
    log.error(LogCategory.SERVICE, 'Failed to save cache to storage', error as Error);
    throw error;
  }
}

/**
 * Clear all cached research
 */
export async function clearResumeResearchCache(): Promise<void> {
  log.info(LogCategory.SERVICE, 'Clearing resume research cache');
  await chrome.storage.local.remove(CACHE_STORAGE_KEY);
}

/**
 * Clear expired cache entries
 */
export async function clearExpiredResumeCache(): Promise<number> {
  const cache = await loadCache();
  const now = Date.now();
  let clearedCount = 0;

  for (const key in cache) {
    if (cache[key].expiresAt < now) {
      delete cache[key];
      clearedCount++;
    }
  }

  if (clearedCount > 0) {
    await saveCache(cache);
    log.info(LogCategory.SERVICE, 'Cleared expired cache entries', { count: clearedCount });
  }

  return clearedCount;
}
