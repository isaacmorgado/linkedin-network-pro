/**
 * Unified Cover Letter Generator
 * Supports both OpenAI (GPT-4o-mini/GPT-4o) and Anthropic (Claude)
 *
 * This is a wrapper around the original cover-letter-generator.ts
 * that uses the AI provider abstraction layer.
 */

import type { AIProviderConfig } from './ai-provider';
import type { UserProfile } from '../types/resume-tailoring';
import type {
  GeneratedCoverLetter,
  CoverLetterConfig,
} from '../../docs/examples/cover-letter-generation-types';

// Note: These functions are internal to cover-letter-generator.ts
// We'll need to either export them or duplicate the logic here

/**
 * Generate cover letter using current AI provider (OpenAI or Claude)
 *
 * NOTE: This function is currently disabled because it depends on helper functions
 * from cover-letter-generator.ts that are not exported. To enable this function,
 * export the required functions from cover-letter-generator.ts first.
 */
export async function generateCoverLetterUnified(
  _profile: UserProfile,
  _jobPosting: string,
  _config?: CoverLetterConfig & Partial<AIProviderConfig>
): Promise<GeneratedCoverLetter> {
  throw new Error('generateCoverLetterUnified is currently disabled. Required helper functions are not exported from cover-letter-generator.ts');
}

/**
 * Generate all sections using unified AI provider
 * NOTE: Disabled - see generateCoverLetterUnified
 */
/* async function generateSectionsWithUnifiedAI(
  narrative: CoverLetterNarrative,
  jobContext: JobContext,
  tone: ToneProfile,
  config?: CoverLetterConfig & Partial<AIProviderConfig>
): Promise<CoverLetterSections> {

  // Generate opening
  const opening = await generateOpeningUnified(narrative, jobContext, tone, config);

  // Generate body paragraph 1
  const paragraph1 = await generateBodyParagraphUnified(
    narrative.primaryStory!,
    jobContext,
    tone,
    config
  );

  // Generate body paragraph 2 if exists
  let paragraph2: string | undefined;
  if (narrative.secondaryStory) {
    paragraph2 = await generateBodyParagraphUnified(
      narrative.secondaryStory,
      jobContext,
      tone,
      config
    );
  }

  // Generate closing
  const closing = await generateClosingUnified(narrative, jobContext, tone, config);

  return {
    opening,
    body: {
      paragraph1,
      paragraph2,
    },
    closing,
  };
} */

/**
 * Generate opening with unified AI
 * NOTE: Disabled - see generateCoverLetterUnified
 */
/* async function generateOpeningUnified(
  narrative: CoverLetterNarrative,
  jobContext: JobContext,
  tone: ToneProfile,
  config?: CoverLetterConfig & Partial<AIProviderConfig>
): Promise<{ greeting: string; hook: string; valueProposition: string }> {

  const prompt = `You are writing the opening paragraph of a cover letter.

STRICT RULES:
1. DO NOT invent experiences, achievements, or skills not provided
2. DO reference the company by name: "${jobContext.company}"
3. DO show genuine enthusiasm (not generic)
4. DO keep it 2-3 sentences max
5. DO use ${tone.style} tone
6. DO NOT add fake metrics or team sizes

JOB INFO:
- Company: ${jobContext.company}
- Role: ${jobContext.role}
- Key requirement: ${jobContext.keyRequirements[0]?.phrase || 'relevant skills'}

NARRATIVE:
Hook: "${narrative.hook}"
Value Proposition: "${narrative.valueProposition}"

Write ONLY the opening paragraph (2-3 sentences).
Format: "Dear [Name or Hiring Team],\\n\\n[Hook sentence]. [Value proposition]."

Begin:`;

  const response = await aiProvider.sendMessage(
    [{ role: 'user', content: prompt }],
    {
      provider: config?.provider,
      model: config?.model,
      temperature: config?.temperature || 0.4,
      maxTokens: 200,
    }
  );

  // Parse response
  const lines = response.content.split('\n\n');
  const greeting = lines[0] || 'Dear Hiring Manager,';
  const body = lines.slice(1).join(' ').trim();

  const sentences = body.split(/\.\s+/);
  const hook = sentences[0] + '.' || body;
  const valueProposition = sentences.slice(1).join('. ').trim() || '';

  return {
    greeting,
    hook,
    valueProposition: valueProposition || narrative.valueProposition,
  };
} */

/**
 * Generate body paragraph using unified AI
 * NOTE: Disabled - see generateCoverLetterUnified
 */
/* async function generateBodyParagraphUnified(
  story: AchievementStory,
  jobContext: JobContext,
  tone: ToneProfile,
  config?: CoverLetterConfig & Partial<AIProviderConfig>
): Promise<string> {

  const prompt = `You are writing a body paragraph using the STAR method.

STRICT RULES:
1. ONLY use facts from the achievement provided below
2. DO NOT add fake metrics, team sizes, or accomplishments
3. DO quantify results if metrics are provided
4. DO emphasize the ACTION (60% of paragraph)
5. DO connect to job requirement: "${jobContext.keyRequirements[0]?.phrase || 'role'}"
6. DO use ${tone.style} tone
7. DO keep it 100-150 words
8. DO write in narrative form (NOT bullet points)
9. DO NOT invent company names, technologies, or team details

ACHIEVEMENT (VERIFIED FACTS):
${JSON.stringify(story.achievement, null, 2)}

STAR BREAKDOWN:
Situation (10%): ${story.starFramework.situation}
Task (10%): ${story.starFramework.task}
Action (60%): ${story.starFramework.action} ← FOCUS HERE
Result (20%): ${story.starFramework.result}

Write the body paragraph focusing on what the user DID.
Example structure: "In [context], I [action verb] [object] [details]. [More action]. This resulted in [outcome]."

DO NOT start with "At [Company]" unless company is in the verified facts above.

Begin:`;

  const response = await aiProvider.sendMessage(
    [{ role: 'user', content: prompt }],
    {
      provider: config?.provider,
      model: config?.model,
      temperature: config?.temperature || 0.4,
      maxTokens: 250,
    }
  );

  return response.content.trim();
} */

/**
 * Generate closing with unified AI
 * NOTE: Disabled - see generateCoverLetterUnified
 */
/* async function generateClosingUnified(
  narrative: CoverLetterNarrative,
  jobContext: JobContext,
  tone: ToneProfile,
  config?: CoverLetterConfig & Partial<AIProviderConfig>
): Promise<{ reiterateInterest: string; callToAction: string; signOff: string }> {

  const prompt = `You are writing the closing paragraph of a cover letter.

STRICT RULES:
1. DO reiterate interest in the role
2. DO include a call to action ("I'd love to discuss...")
3. DO keep it 2-3 sentences
4. DO use ${tone.style} tone
5. DO NOT be generic or overly formal
6. DO NOT invent availability or specific dates

CONTEXT:
Company: ${jobContext.company}
Role: ${jobContext.role}
Theme: ${narrative.closingTheme}

Write the closing paragraph (interest + call to action).
Format: "[Interest statement]. [Call to action]. [Sign-off]"

Begin:`;

  const response = await aiProvider.sendMessage(
    [{ role: 'user', content: prompt }],
    {
      provider: config?.provider,
      model: config?.model,
      temperature: config?.temperature || 0.4,
      maxTokens: 200,
    }
  );

  // Parse response
  const sentences = response.content.split(/\.\s+/);
  const reiterateInterest = sentences[0] + '.' || response.content;
  const callToAction = sentences[1] + '.' || 'I look forward to discussing this opportunity.';
  const signOff = sentences.length > 2
    ? sentences.slice(2).join('. ').trim()
    : 'Sincerely';

  return {
    reiterateInterest,
    callToAction,
    signOff: signOff || 'Sincerely',
  };
} */

// Note: Helper functions are not exported from cover-letter-generator.ts
// If needed, they should be exported from the original file first
