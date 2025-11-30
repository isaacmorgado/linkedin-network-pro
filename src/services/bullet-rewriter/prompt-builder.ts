/**
 * Prompt Builder
 * Constructs AI prompts for bullet rewriting
 */

import type { Achievement } from '../../types/resume-tailoring';
import type { ExtractedFacts, RewriteConfig } from './types';

/**
 * Build prompt for AI rewrite with strict anti-hallucination constraints
 */
export function buildRewritePrompt(
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
