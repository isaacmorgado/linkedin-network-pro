/**
 * AI-Powered Bullet Point Rewriter
 *
 * Rewrites resume bullets to match job requirements WITHOUT hallucination.
 *
 * STRICT RULES:
 * - MUST preserve all facts from original
 * - MUST NOT add fake accomplishments
 * - CAN rephrase to emphasize relevant skills
 * - CAN add industry keywords that are IMPLIED
 * - MUST use professional ATS-friendly language
 */

import type { Achievement, RewrittenBullet } from '../../types/resume-tailoring';
import { log, LogCategory } from '../../utils/logger';
import Anthropic from '@anthropic-ai/sdk';
import { extractFacts } from './fact-extractor';
import { verifyNoHallucination } from './verifier';
import { buildRewritePrompt } from './prompt-builder';
import { filterRelevantKeywords } from './keyword-filter';
import { analyzeChanges, findAddedKeywords } from './analyzer';
import type { RewriteConfig } from './types';

// Re-export types for external use
export type { RewriteConfig, ExtractedFacts } from './types';

/**
 * Rewrite a bullet point to match target keywords without hallucination
 */
export async function rewriteBullet(
  achievement: Achievement,
  targetKeywords: string[],
  config: RewriteConfig
): Promise<RewrittenBullet> {
  const endTrace = log.trace(LogCategory.SERVICE, 'rewriteBullet', {
    originalBullet: achievement.bullet,
    targetKeywords: targetKeywords.slice(0, 5),
  });

  try {
    log.info(LogCategory.SERVICE, 'Starting bullet rewrite', {
      original: achievement.bullet,
      targetKeywordsCount: targetKeywords.length,
      allowImplied: config.allowImpliedKeywords !== false,
    });

    // STEP 1: Extract facts from original bullet
    const facts = extractFacts(achievement);
    log.debug(LogCategory.SERVICE, 'Facts extracted', {
      action: facts.action,
      object: facts.object,
      metricsCount: facts.metrics.length,
      technologiesCount: facts.technologies.length,
    });

    // STEP 2: Filter target keywords to only those that are relevant
    const relevantKeywords = filterRelevantKeywords(
      targetKeywords,
      achievement,
      facts,
      config.allowImpliedKeywords !== false
    );
    log.debug(LogCategory.SERVICE, 'Filtered relevant keywords', {
      original: targetKeywords.length,
      relevant: relevantKeywords.length,
      keywords: relevantKeywords,
    });

    // If no relevant keywords, return original
    if (relevantKeywords.length === 0) {
      log.info(LogCategory.SERVICE, 'No relevant keywords found, returning original');
      endTrace();
      return createOriginalResult(achievement);
    }

    // STEP 3: Attempt AI rewrite with retry logic
    const maxRetries = config.maxRetries || 2;
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        log.debug(LogCategory.SERVICE, `Rewrite attempt ${attempt + 1}/${maxRetries}`);

        const result = await attemptRewrite(
          achievement,
          relevantKeywords,
          facts,
          config
        );

        // STEP 4: Verify no hallucination
        const verification = verifyNoHallucination(facts, result.rewritten);

        if (!verification.allFactsPreserved || verification.addedFacts.length > 0) {
          log.warn(LogCategory.SERVICE, 'Hallucination detected in rewrite', {
            attempt: attempt + 1,
            addedFacts: verification.addedFacts,
            confidence: verification.confidence,
          });

          // If last attempt, return original
          if (attempt === maxRetries - 1) {
            log.warn(LogCategory.SERVICE, 'Max retries reached, returning original bullet');
            endTrace();
            return createOriginalResult(achievement);
          }

          // Otherwise, retry
          continue;
        }

        // Success - no hallucination detected
        log.info(LogCategory.SERVICE, 'Rewrite successful, no hallucination detected', {
          keywordsAdded: result.keywordsAdded.length,
          changesCount: result.changes.length,
        });

        endTrace();
        return {
          ...result,
          factVerification: verification,
        };

      } catch (error) {
        lastError = error as Error;
        log.warn(LogCategory.SERVICE, `Rewrite attempt ${attempt + 1} failed`, {
          error: (error as Error).message,
        });

        // If last attempt, throw
        if (attempt === maxRetries - 1) {
          throw error;
        }
      }
    }

    // Should not reach here, but handle anyway
    throw lastError || new Error('Rewrite failed after all retries');

  } catch (error) {
    log.error(LogCategory.SERVICE, 'Bullet rewrite failed', error as Error);
    endTrace();

    // On error, return original bullet
    return createOriginalResult(achievement);
  }
}

/**
 * Attempt to rewrite the bullet using AI
 */
async function attemptRewrite(
  achievement: Achievement,
  relevantKeywords: string[],
  facts: any,
  config: RewriteConfig
): Promise<Omit<RewrittenBullet, 'factVerification'>> {
  const apiKey = config.apiKey || import.meta.env.VITE_ANTHROPIC_API_KEY;

  if (!apiKey) {
    throw new Error('Anthropic API key not configured');
  }

  const anthropic = new Anthropic({
    apiKey,
  });

  // Build prompt with strict anti-hallucination instructions
  const prompt = buildRewritePrompt(achievement, relevantKeywords, facts, config);

  log.debug(LogCategory.SERVICE, 'Calling Claude API for rewrite');
  const startTime = Date.now();

  // Call Claude API with LOW temperature for less creativity = less hallucination
  const message = await anthropic.messages.create({
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 1024,
    temperature: 0.3, // LOW temperature to reduce hallucination
    messages: [
      {
        role: 'user',
        content: prompt,
      },
    ],
  });

  const duration = Date.now() - startTime;
  log.apiCall('POST', 'anthropic.com/v1/messages', 200, duration);

  // Extract text from response
  const rewrittenText = message.content[0].type === 'text'
    ? message.content[0].text.trim()
    : achievement.bullet;

  // Analyze changes
  const changes = analyzeChanges(achievement.bullet, rewrittenText);
  const keywordsAdded = findAddedKeywords(achievement.bullet, rewrittenText, relevantKeywords);

  return {
    original: achievement.bullet,
    rewritten: rewrittenText,
    changes,
    keywordsAdded,
  };
}

/**
 * Create result that returns original bullet (used on error or no changes needed)
 */
function createOriginalResult(achievement: Achievement): RewrittenBullet {
  return {
    original: achievement.bullet,
    rewritten: achievement.bullet,
    changes: [],
    keywordsAdded: [],
    factVerification: {
      allFactsPreserved: true,
      addedFacts: [],
      removedFacts: [],
      confidence: 1.0,
    },
  };
}

/**
 * Rewrite multiple bullets in batch
 */
export async function rewriteBulletsBatch(
  achievements: Achievement[],
  targetKeywords: string[],
  config: RewriteConfig,
  onProgress?: (completed: number, total: number) => void
): Promise<RewrittenBullet[]> {
  const endTrace = log.trace(LogCategory.SERVICE, 'rewriteBulletsBatch', {
    count: achievements.length,
    targetKeywordsCount: targetKeywords.length,
  });

  try {
    log.info(LogCategory.SERVICE, 'Starting batch bullet rewrite', {
      bulletsCount: achievements.length,
      targetKeywordsCount: targetKeywords.length,
    });

    const results: RewrittenBullet[] = [];

    for (let i = 0; i < achievements.length; i++) {
      const achievement = achievements[i];

      try {
        const result = await rewriteBullet(achievement, targetKeywords, config);
        results.push(result);

        if (onProgress) {
          onProgress(i + 1, achievements.length);
        }

        // Small delay between API calls to avoid rate limiting
        if (i < achievements.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      } catch (error) {
        log.error(LogCategory.SERVICE, `Failed to rewrite bullet ${i}`, error as Error, {
          bullet: achievement.bullet,
        });

        // On error, use original
        results.push(createOriginalResult(achievement));
      }
    }

    log.info(LogCategory.SERVICE, 'Batch rewrite complete', {
      total: results.length,
      modified: results.filter(r => r.original !== r.rewritten).length,
      keywordsInjected: results.reduce((sum, r) => sum + r.keywordsAdded.length, 0),
    });

    endTrace();
    return results;

  } catch (error) {
    log.error(LogCategory.SERVICE, 'Batch bullet rewrite failed', error as Error);
    endTrace();
    throw error;
  }
}
