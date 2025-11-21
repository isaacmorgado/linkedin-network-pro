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

import type { Achievement, RewrittenBullet, Change, FactVerification } from '../types/resume-tailoring';
import { log, LogCategory } from '../utils/logger';
import Anthropic from '@anthropic-ai/sdk';

// ============================================================================
// TYPES
// ============================================================================

export interface RewriteConfig {
  /** Target keywords to emphasize */
  targetKeywords: string[];

  /** Anthropic API key (optional - falls back to env var) */
  apiKey?: string;

  /** Maximum keywords to inject per bullet */
  maxKeywordsPerBullet?: number;

  /** Tone of the rewrite */
  tone?: 'professional' | 'technical' | 'casual';

  /** Whether to allow implied keywords (e.g., "e-commerce" implies "REST APIs") */
  allowImpliedKeywords?: boolean;

  /** Maximum number of retry attempts if hallucination detected */
  maxRetries?: number;
}

export interface ExtractedFacts {
  /** Core action verb (e.g., "Built", "Led", "Optimized") */
  action: string;

  /** Object of the action (e.g., "microservices platform") */
  object: string;

  /** Result or outcome (e.g., "reducing latency by 40%") */
  result?: string;

  /** All metrics mentioned (numbers, percentages, scales) */
  metrics: string[];

  /** Technologies/tools mentioned */
  technologies: string[];

  /** Team sizes or organizational scope */
  teamScopes: string[];

  /** Any other specific claims */
  specificClaims: string[];
}

// ============================================================================
// MAIN REWRITE FUNCTION
// ============================================================================

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

// ============================================================================
// FACT EXTRACTION
// ============================================================================

/**
 * Extract verifiable facts from the original bullet
 */
function extractFacts(achievement: Achievement): ExtractedFacts {
  const bullet = achievement.bullet;

  // Extract action (first verb-like word)
  const action = achievement.action || extractAction(bullet);

  // Extract object (main thing being acted upon)
  const object = achievement.object || extractObject(bullet);

  // Extract result/outcome
  const result = achievement.result;

  // Extract all metrics (numbers, percentages, scales)
  const metrics = extractMetrics(bullet, achievement.metrics);

  // Extract technologies
  const technologies = achievement.skills.filter(skill =>
    isTechnology(skill)
  );

  // Extract team scopes (e.g., "team of 5", "10 engineers")
  const teamScopes = extractTeamScopes(bullet);

  // Extract other specific claims
  const specificClaims = extractSpecificClaims(bullet);

  return {
    action,
    object,
    result,
    metrics,
    technologies,
    teamScopes,
    specificClaims,
  };
}

function extractAction(bullet: string): string {
  // Common action verbs in resume bullets
  const actionVerbs = [
    'built', 'developed', 'created', 'designed', 'implemented', 'led', 'managed',
    'optimized', 'improved', 'increased', 'reduced', 'launched', 'established',
    'architected', 'engineered', 'delivered', 'shipped', 'deployed', 'migrated',
    'refactored', 'maintained', 'collaborated', 'coordinated', 'analyzed',
  ];

  const lowerBullet = bullet.toLowerCase();
  for (const verb of actionVerbs) {
    if (lowerBullet.startsWith(verb) || lowerBullet.includes(` ${verb} `)) {
      return verb.charAt(0).toUpperCase() + verb.slice(1);
    }
  }

  // Fallback: first word
  return bullet.split(' ')[0];
}

function extractObject(bullet: string): string {
  // Remove action verb and extract the main object phrase
  const words = bullet.split(' ');

  // Skip first word (action) and take next 3-5 words
  const objectPhrase = words.slice(1, 6).join(' ');

  // Remove trailing punctuation
  return objectPhrase.replace(/[,;:]$/, '');
}

function extractMetrics(bullet: string, achievementMetrics?: any[]): string[] {
  const metrics: string[] = [];

  // Extract from achievement.metrics if available
  if (achievementMetrics && achievementMetrics.length > 0) {
    for (const metric of achievementMetrics) {
      metrics.push(`${metric.value}${metric.unit}`);
    }
  }

  // Extract percentages (e.g., "40%", "100%")
  const percentageMatches = bullet.match(/\d+%/g);
  if (percentageMatches) {
    metrics.push(...percentageMatches);
  }

  // Extract numbers with context (e.g., "5 engineers", "10,000 users")
  const numberMatches = bullet.match(/\d+[,\d]*\s+\w+/g);
  if (numberMatches) {
    metrics.push(...numberMatches);
  }

  // Extract multipliers (e.g., "2x", "10x")
  const multiplierMatches = bullet.match(/\d+x/gi);
  if (multiplierMatches) {
    metrics.push(...multiplierMatches);
  }

  return [...new Set(metrics)]; // Remove duplicates
}

function extractTeamScopes(bullet: string): string[] {
  const scopes: string[] = [];

  // Match patterns like "team of X", "X engineers", "X developers"
  const teamPatterns = [
    /team of \d+/gi,
    /\d+[\s-](?:person|people|member|engineer|developer|designer)s?/gi,
    /(?:led|managed|coordinated)\s+\d+/gi,
  ];

  for (const pattern of teamPatterns) {
    const matches = bullet.match(pattern);
    if (matches) {
      scopes.push(...matches);
    }
  }

  return scopes;
}

function extractSpecificClaims(bullet: string): string[] {
  const claims: string[] = [];

  // Extract time periods (e.g., "in 6 months", "within 3 weeks")
  const timeMatches = bullet.match(/(?:in|within)\s+\d+\s+(?:days?|weeks?|months?|years?)/gi);
  if (timeMatches) {
    claims.push(...timeMatches);
  }

  // Extract scales (e.g., "enterprise-scale", "production-level")
  const scaleMatches = bullet.match(/\b(?:enterprise|production|large-scale|high-traffic)\b/gi);
  if (scaleMatches) {
    claims.push(...scaleMatches);
  }

  return claims;
}

function isTechnology(skill: string): boolean {
  // Simple heuristic: technology names are usually capitalized or well-known
  const knownTechs = new Set([
    'react', 'angular', 'vue', 'node', 'python', 'java', 'javascript', 'typescript',
    'aws', 'azure', 'gcp', 'docker', 'kubernetes', 'postgresql', 'mongodb', 'redis',
    'graphql', 'rest', 'api', 'sql', 'nosql', 'git', 'jenkins', 'terraform',
  ]);

  return knownTechs.has(skill.toLowerCase()) || /^[A-Z]/.test(skill);
}

// ============================================================================
// KEYWORD FILTERING
// ============================================================================

/**
 * Filter target keywords to only those that are relevant to the achievement
 */
function filterRelevantKeywords(
  targetKeywords: string[],
  achievement: Achievement,
  facts: ExtractedFacts,
  allowImplied: boolean
): string[] {
  const relevant: string[] = [];
  const bullet = achievement.bullet.toLowerCase();

  for (const keyword of targetKeywords) {
    const lowerKeyword = keyword.toLowerCase();

    // RULE 1: Already mentioned in bullet (direct match)
    if (bullet.includes(lowerKeyword)) {
      relevant.push(keyword);
      continue;
    }

    // RULE 2: Already in achievement's skills
    if (achievement.skills.some(s => s.toLowerCase() === lowerKeyword)) {
      relevant.push(keyword);
      continue;
    }

    // RULE 3: Implied by the context (if allowed)
    if (allowImplied && isImpliedByContext(keyword, achievement, facts)) {
      relevant.push(keyword);
      continue;
    }
  }

  return relevant;
}

/**
 * Check if a keyword is implied by the achievement's context
 */
function isImpliedByContext(
  keyword: string,
  achievement: Achievement,
  _facts: ExtractedFacts
): boolean {
  const lowerKeyword = keyword.toLowerCase();
  const bullet = achievement.bullet.toLowerCase();

  // E-commerce implies certain technologies
  if (bullet.includes('e-commerce') || bullet.includes('ecommerce')) {
    if (['rest api', 'api', 'payment processing', 'checkout'].includes(lowerKeyword)) {
      return true;
    }
  }

  // Web development implies certain tech
  if (bullet.includes('web') || bullet.includes('website')) {
    if (['html', 'css', 'javascript', 'responsive design'].includes(lowerKeyword)) {
      return true;
    }
  }

  // Full-stack implies both frontend and backend
  if (bullet.includes('full-stack') || bullet.includes('fullstack')) {
    if (['frontend', 'backend', 'database', 'api'].includes(lowerKeyword)) {
      return true;
    }
  }

  // Microservices implies certain patterns
  if (bullet.includes('microservice')) {
    if (['docker', 'kubernetes', 'rest', 'api', 'distributed systems'].includes(lowerKeyword)) {
      return true;
    }
  }

  // Data science projects imply tools
  if (bullet.includes('machine learning') || bullet.includes('data analysis')) {
    if (['python', 'data visualization', 'statistics'].includes(lowerKeyword)) {
      return true;
    }
  }

  return false;
}

// ============================================================================
// AI REWRITE
// ============================================================================

/**
 * Attempt to rewrite the bullet using AI
 */
async function attemptRewrite(
  achievement: Achievement,
  relevantKeywords: string[],
  facts: ExtractedFacts,
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
 * Build prompt for AI rewrite with strict anti-hallucination constraints
 */
function buildRewritePrompt(
  achievement: Achievement,
  relevantKeywords: string[],
  facts: ExtractedFacts,
  config: RewriteConfig
): string {
  const tone = config.tone || 'professional';
  const maxKeywords = config.maxKeywordsPerBullet || 3;

  return `You are a resume bullet point rewriter. Your task is to rewrite a resume bullet to include relevant keywords WITHOUT adding fake information.

**STRICT RULES - YOU MUST FOLLOW THESE:**

1. **PRESERVE ALL FACTS**: Every number, metric, team size, timeframe, and specific claim in the original MUST be preserved exactly.

2. **NO HALLUCINATION**: DO NOT add:
   - Fake metrics or numbers
   - Team sizes that weren't mentioned
   - Technologies not used
   - Responsibilities not performed
   - Timeframes not specified
   - Achievements not claimed

3. **ALLOWED CHANGES**:
   - Rephrase to emphasize relevant skills
   - Add keywords that are CLEARLY IMPLIED by the context (e.g., "e-commerce platform" implies "REST APIs")
   - Use more professional/ATS-friendly language
   - Restructure for clarity and impact

4. **KEYWORD INJECTION**: You may naturally incorporate ${maxKeywords} of these keywords: ${relevantKeywords.join(', ')}
   - ONLY if they are truly relevant to the achievement
   - ONLY if they don't contradict the original facts
   - Prefer keywords that are implied by the context

**ORIGINAL BULLET:**
${achievement.bullet}

**VERIFIED FACTS (MUST ALL BE PRESERVED):**
- Action: ${facts.action}
- Object: ${facts.object}
${facts.result ? `- Result: ${facts.result}` : ''}
${facts.metrics.length > 0 ? `- Metrics: ${facts.metrics.join(', ')}` : ''}
${facts.technologies.length > 0 ? `- Technologies: ${facts.technologies.join(', ')}` : ''}
${facts.teamScopes.length > 0 ? `- Team Scopes: ${facts.teamScopes.join(', ')}` : ''}

**TONE:** ${tone}

**OUTPUT FORMAT:**
Return ONLY the rewritten bullet point. Do not include explanations, metadata, or additional text.

**EXAMPLE:**
Original: "Built e-commerce website with React"
Target Keywords: ["React", "REST APIs", "TypeScript"]
Rewritten: "Developed full-stack e-commerce platform using React and REST APIs"
(This is GOOD because e-commerce platforms naturally use REST APIs - it's implied)

Bad Example: "Led team of 10 to build e-commerce platform using React and TypeScript, increasing sales by 50%"
(This is BAD because it adds fake team size, fake TypeScript usage, and fake metrics)

Now rewrite the bullet:`;
}

// ============================================================================
// CHANGE ANALYSIS
// ============================================================================

/**
 * Analyze what changed between original and rewritten
 */
function analyzeChanges(original: string, rewritten: string): Change[] {
  const changes: Change[] = [];

  // Simple diff: if significantly different, mark as rephrasing
  if (original !== rewritten) {
    const similarity = calculateSimilarity(original, rewritten);

    if (similarity < 0.7) {
      changes.push({
        type: 'rephrasing',
        from: original,
        to: rewritten,
        justification: 'Rephrased for ATS optimization and keyword inclusion',
      });
    } else {
      changes.push({
        type: 'keyword-injection',
        justification: 'Added relevant keywords while preserving facts',
      });
    }
  }

  return changes;
}

function calculateSimilarity(str1: string, str2: string): number {
  const words1 = new Set(str1.toLowerCase().split(/\s+/));
  const words2 = new Set(str2.toLowerCase().split(/\s+/));

  const intersection = new Set([...words1].filter(w => words2.has(w)));
  const union = new Set([...words1, ...words2]);

  return intersection.size / union.size;
}

/**
 * Find which keywords were added in the rewrite
 */
function findAddedKeywords(original: string, rewritten: string, targetKeywords: string[]): string[] {
  const added: string[] = [];
  const lowerOriginal = original.toLowerCase();
  const lowerRewritten = rewritten.toLowerCase();

  for (const keyword of targetKeywords) {
    const lowerKeyword = keyword.toLowerCase();

    // If keyword wasn't in original but is in rewritten
    if (!lowerOriginal.includes(lowerKeyword) && lowerRewritten.includes(lowerKeyword)) {
      added.push(keyword);
    }
  }

  return added;
}

// ============================================================================
// HALLUCINATION VERIFICATION
// ============================================================================

/**
 * Verify that no hallucination occurred in the rewrite
 */
function verifyNoHallucination(facts: ExtractedFacts, rewritten: string): FactVerification {
  const addedFacts: string[] = [];
  const removedFacts: string[] = [];
  let confidence = 1.0;

  // CHECK 1: All metrics must be preserved
  for (const metric of facts.metrics) {
    if (!rewritten.includes(metric)) {
      removedFacts.push(`Metric: ${metric}`);
      confidence -= 0.2;
    }
  }

  // CHECK 2: No new metrics added
  const rewrittenMetrics = extractMetrics(rewritten, undefined);
  for (const metric of rewrittenMetrics) {
    if (!facts.metrics.includes(metric)) {
      addedFacts.push(`New metric: ${metric}`);
      confidence -= 0.3;
    }
  }

  // CHECK 3: No new team scopes added
  const rewrittenTeamScopes = extractTeamScopes(rewritten);
  for (const scope of rewrittenTeamScopes) {
    if (!facts.teamScopes.includes(scope)) {
      addedFacts.push(`New team scope: ${scope}`);
      confidence -= 0.4; // This is serious hallucination
    }
  }

  // CHECK 4: Core action and object should be preserved (or semantically equivalent)
  const lowerRewritten = rewritten.toLowerCase();
  if (!lowerRewritten.includes(facts.action.toLowerCase())) {
    // Check for synonyms
    const actionSynonyms = getActionSynonyms(facts.action);
    const hasSynonym = actionSynonyms.some(syn => lowerRewritten.includes(syn.toLowerCase()));

    if (!hasSynonym) {
      removedFacts.push(`Action: ${facts.action}`);
      confidence -= 0.1;
    }
  }

  // CHECK 5: Technologies mentioned should still be there
  for (const tech of facts.technologies) {
    if (!lowerRewritten.includes(tech.toLowerCase())) {
      removedFacts.push(`Technology: ${tech}`);
      confidence -= 0.1;
    }
  }

  const allFactsPreserved = addedFacts.length === 0 && removedFacts.length === 0;

  return {
    allFactsPreserved,
    addedFacts,
    removedFacts,
    confidence: Math.max(0, Math.min(1, confidence)),
  };
}

/**
 * Get synonyms for action verbs
 */
function getActionSynonyms(action: string): string[] {
  const synonymMap: Record<string, string[]> = {
    'built': ['developed', 'created', 'constructed', 'engineered'],
    'developed': ['built', 'created', 'engineered', 'implemented'],
    'created': ['built', 'developed', 'designed', 'established'],
    'led': ['managed', 'directed', 'headed', 'coordinated'],
    'optimized': ['improved', 'enhanced', 'refined', 'streamlined'],
    'implemented': ['deployed', 'executed', 'established', 'introduced'],
  };

  return synonymMap[action.toLowerCase()] || [];
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

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

// ============================================================================
// BATCH PROCESSING
// ============================================================================

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
