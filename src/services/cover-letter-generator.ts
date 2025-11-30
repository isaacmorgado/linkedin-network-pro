/**
 * AI-Powered Cover Letter Generator (Kenkai Framework)
 *
 * Advanced cover letter generation using:
 * - Claude 3.5 Sonnet API with anti-hallucination prompts
 * - STAR method (60% Action focus)
 * - Strict fact verification
 * - 250-400 word optimization
 * - Temperature 0.4 (balanced)
 *
 * Pipeline:
 * 1. Extract job context from posting
 * 2. Detect company culture for tone
 * 3. Match user to job requirements
 * 4. Select best stories for narrative
 * 5. Build narrative structure
 * 6. Generate sections with AI
 * 7. Assemble full letter
 * 8. Verify no hallucination
 * 9. Calculate ATS score
 */

import Anthropic from '@anthropic-ai/sdk';
import type { UserProfile } from '../types/resume-tailoring';
import type {
  GeneratedCoverLetter,
  CoverLetterConfig,
  JobContext,
  ToneProfile,
  AchievementStory,
  CoverLetterNarrative,
  CoverLetterSections,
  CoverLetterVerification,
} from '../../docs/examples/cover-letter-generation-types';
import type { ExtractedKeyword } from '../types/resume';
import { extractKeywordsFromJobDescription } from './keyword-extractor';
import { matchUserToJob } from './resume-matcher';
import { extractFacts } from './hallucination-detector';
import { log, LogCategory } from '../utils/logger';

// ============================================================================
// MAIN GENERATION FUNCTION
// ============================================================================

/**
 * Generate AI-powered cover letter with anti-hallucination constraints
 *
 * @param profile - User's complete professional profile (SINGLE SOURCE OF TRUTH)
 * @param jobPosting - Full job posting text
 * @param config - Optional configuration (tone, length, temperature)
 * @returns Complete generated cover letter with verification and ATS score
 */
export async function generateCoverLetter(
  profile: UserProfile,
  jobPosting: string,
  config?: CoverLetterConfig
): Promise<GeneratedCoverLetter> {
  const endTrace = log.trace(LogCategory.SERVICE, 'generateCoverLetter', {
    profileName: profile.name,
    jobPostingLength: jobPosting.length,
  });

  try {
    log.info(LogCategory.SERVICE, 'Starting AI cover letter generation', {
      name: profile.name,
      targetLength: config?.targetLength || 300,
      temperature: config?.temperature || 0.4,
    });

    // STEP 1: Extract job context
    log.debug(LogCategory.SERVICE, 'Extracting job context');
    const jobContext = extractJobContext(jobPosting);
    log.info(LogCategory.SERVICE, 'Job context extracted', {
      company: jobContext.company,
      role: jobContext.role,
      culture: jobContext.culture,
      keyRequirements: jobContext.keyRequirements.length,
    });

    // STEP 2: Detect company culture for tone
    log.debug(LogCategory.SERVICE, 'Detecting company culture');
    const tone = detectCompanyCulture(jobPosting, config?.tone);
    log.info(LogCategory.SERVICE, 'Tone profile determined', {
      style: tone.style,
      formality: tone.formality,
      enthusiasm: tone.enthusiasm,
    });

    // STEP 3: Match user to job
    log.debug(LogCategory.SERVICE, 'Matching user to job requirements');
    const jobRequirements = {
      required: jobContext.keyRequirements.filter((k: ExtractedKeyword) => k.required),
      preferred: jobContext.keyRequirements.filter((k: ExtractedKeyword) => !k.required),
    };
    const matchReport = matchUserToJob(profile, jobRequirements);
    log.info(LogCategory.SERVICE, 'User-job matching complete', {
      matchScore: matchReport.matchScore,
      matches: matchReport.matches.length,
    });

    // STEP 4: Select best stories
    log.debug(LogCategory.SERVICE, 'Selecting best achievement stories');
    const stories = selectBestStories(profile, matchReport, jobContext);
    log.info(LogCategory.SERVICE, 'Stories selected', {
      primaryStory: stories.primary ? stories.primary.achievement.id : 'none',
      secondaryStory: stories.secondary ? stories.secondary.achievement.id : 'none',
    });

    // STEP 5: Build narrative
    log.debug(LogCategory.SERVICE, 'Building cover letter narrative');
    const narrative = buildNarrative(profile, matchReport, stories, jobContext);
    log.info(LogCategory.SERVICE, 'Narrative structure created', {
      hook: narrative.hook.substring(0, 50),
      theme: narrative.closingTheme,
    });

    // STEP 6: Generate sections with AI
    log.debug(LogCategory.SERVICE, 'Generating sections with Claude API');
    const sections = await generateSectionsWithAI(narrative, jobContext, tone, config);
    log.info(LogCategory.SERVICE, 'AI generation complete');

    // STEP 7: Assemble full letter
    log.debug(LogCategory.SERVICE, 'Assembling full cover letter');
    const fullText = assembleCoverLetter(sections, profile, jobContext, config);
    const htmlFormatted = formatAsHTML(fullText);
    const wordCount = countWords(fullText);
    log.info(LogCategory.SERVICE, 'Cover letter assembled', {
      wordCount,
      targetRange: '250-400',
    });

    // STEP 8: Verify no hallucination
    log.debug(LogCategory.SERVICE, 'Verifying no hallucination');
    const verification = verifyNoHallucinationInCoverLetter(
      fullText,
      profile,
      sections,
      jobContext
    );
    log.info(LogCategory.SERVICE, 'Hallucination check complete', {
      noHallucination: verification.noHallucination,
      confidence: verification.confidence,
      addedFacts: verification.addedFacts.length,
    });

    // STEP 9: Calculate ATS score
    log.debug(LogCategory.SERVICE, 'Calculating ATS score');
    const matchAnalysis = calculateCoverLetterATSScore(
      fullText,
      jobContext,
      matchReport
    );
    log.info(LogCategory.SERVICE, 'ATS score calculated', {
      atsScore: matchAnalysis.atsScore,
      keywordCoverage: verification.keywordCoverage,
    });

    // Build result
    const result: GeneratedCoverLetter = {
      fullText,
      htmlFormatted,
      sections,
      narrative,
      tone,
      wordCount,
      verification,
      matchAnalysis,
    };

    log.info(LogCategory.SERVICE, 'Cover letter generation complete', {
      wordCount,
      atsScore: matchAnalysis.atsScore,
      noHallucination: verification.noHallucination,
    });

    endTrace();
    return result;

  } catch (error) {
    log.error(LogCategory.SERVICE, 'Cover letter generation failed', error as Error);
    endTrace();
    throw error;
  }
}

// ============================================================================
// JOB CONTEXT EXTRACTION (NO API)
// ============================================================================

/**
 * Extract job context from posting
 * Identifies company, role, hiring manager, key requirements, culture
 */
function extractJobContext(jobPosting: string): JobContext {

  // Extract company name - look for common patterns
  let company = 'Hiring Company';
  const companyPatterns = [
    /(?:at|@)\s+([A-Z][A-Za-z0-9\s&.,-]+?)(?:\s+is|,|\.|$)/,
    /([A-Z][A-Za-z0-9\s&.,-]+?)\s+is\s+(?:hiring|looking|seeking)/i,
    /Company:\s*([A-Z][A-Za-z0-9\s&.,-]+)/,
  ];

  for (const pattern of companyPatterns) {
    const match = jobPosting.match(pattern);
    if (match && match[1]) {
      company = match[1].trim();
      break;
    }
  }

  // Extract role/job title - usually first line or after "Position:"
  let role = 'Position';
  const rolePatterns = [
    /(?:Position|Role|Job Title|Title):\s*(.+)/i,
    /^([A-Z][A-Za-z\s-]+(?:Engineer|Developer|Manager|Designer|Analyst|Specialist))/m,
  ];

  for (const pattern of rolePatterns) {
    const match = jobPosting.match(pattern);
    if (match && match[1]) {
      role = match[1].trim();
      break;
    }
  }

  // Extract hiring manager if mentioned
  let hiringManager: string | undefined;
  const managerPatterns = [
    /(?:Dear|Contact|Hiring Manager):\s*([A-Z][a-z]+\s+[A-Z][a-z]+)/,
    /(?:reach out to|contact)\s+([A-Z][a-z]+\s+[A-Z][a-z]+)/,
  ];

  for (const pattern of managerPatterns) {
    const match = jobPosting.match(pattern);
    if (match && match[1]) {
      hiringManager = match[1].trim();
      break;
    }
  }

  // Extract key requirements using keyword extractor
  const keyRequirements = extractKeywordsFromJobDescription(jobPosting);

  // Determine culture
  const culture = detectCultureLevel(jobPosting);

  return {
    company,
    role,
    hiringManager,
    keyRequirements,
    culture,
  };
}

/**
 * Detect company culture level from job posting
 */
function detectCultureLevel(jobPosting: string): 'formal' | 'business-casual' | 'casual' {
  const lowerPosting = jobPosting.toLowerCase();

  // Formal indicators
  const formalKeywords = [
    'professional', 'corporate', 'established', 'traditional',
    'conservative', 'enterprise', 'fortune', 'institutional'
  ];
  const formalCount = formalKeywords.filter(kw => lowerPosting.includes(kw)).length;

  // Casual indicators
  const casualKeywords = [
    'startup', 'fast-paced', 'fun', 'innovative', 'disruptive',
    'cutting-edge', 'dynamic', 'flexible', 'remote-first', 'async'
  ];
  const casualCount = casualKeywords.filter(kw => lowerPosting.includes(kw)).length;

  // Decide based on counts
  if (formalCount > casualCount && formalCount >= 2) {
    return 'formal';
  } else if (casualCount > formalCount && casualCount >= 2) {
    return 'casual';
  } else {
    return 'business-casual'; // Default
  }
}

/**
 * Detect company culture and build tone profile
 */
function detectCompanyCulture(
  jobPosting: string,
  toneOverride?: Partial<ToneProfile>
): ToneProfile {
  const culture = detectCultureLevel(jobPosting);

  // Base tone on culture
  let baseTone: ToneProfile;

  switch (culture) {
    case 'formal':
      baseTone = {
        style: 'professional',
        enthusiasm: 'reserved',
        formality: 'formal',
        personalityLevel: 0.2,
      };
      break;
    case 'casual':
      baseTone = {
        style: 'conversational',
        enthusiasm: 'high',
        formality: 'casual',
        personalityLevel: 0.8,
      };
      break;
    default: // business-casual
      baseTone = {
        style: 'balanced',
        enthusiasm: 'moderate',
        formality: 'business-casual',
        personalityLevel: 0.5,
      };
  }

  // Apply overrides if provided
  return {
    ...baseTone,
    ...toneOverride,
  };
}

// ============================================================================
// STORY SELECTION
// ============================================================================

/**
 * Select best achievement stories for cover letter
 * Primary story: highest relevance to job
 * Secondary story: complementary skill/aspect
 */
function selectBestStories(
  profile: UserProfile,
  matchReport: any,
  jobContext: JobContext
): { primary: AchievementStory | null; secondary: AchievementStory | null } {
  const allAchievements: any[] = [];

  // Collect all achievements from work experience
  profile.workExperience.forEach((exp: any) => {
    exp.achievements.forEach((achievement: any) => {
      allAchievements.push({
        achievement,
        source: 'work',
        company: exp.company,
        title: exp.title,
      });
    });
  });

  // Collect from projects
  profile.projects.forEach((project: any) => {
    project.achievements.forEach((achievement: any) => {
      allAchievements.push({
        achievement,
        source: 'project',
        company: project.name,
        title: 'Project',
      });
    });
  });

  // Score each achievement based on relevance
  const scoredAchievements = allAchievements.map(item => {
    const score = scoreAchievementRelevance(
      item.achievement,
      jobContext.keyRequirements,
      matchReport
    );

    return {
      ...item,
      relevanceScore: score,
      starFramework: extractSTARFramework(item.achievement),
      keywords: item.achievement.keywords,
      estimatedWordCount: estimateWordCount(item.achievement),
    };
  });

  // Sort by relevance
  scoredAchievements.sort((a, b) => b.relevanceScore - a.relevanceScore);

  // Select primary (highest score)
  const primary = scoredAchievements.length > 0 ? scoredAchievements[0] : null;

  // Select secondary (different skill focus than primary)
  let secondary: AchievementStory | null = null;
  if (scoredAchievements.length > 1 && primary) {
    for (const story of scoredAchievements.slice(1)) {
      // Check if skills are complementary (not too similar)
      const skillOverlap = calculateSkillOverlap(
        primary.achievement.skills,
        story.achievement.skills
      );

      if (skillOverlap < 0.6) { // Less than 60% overlap
        secondary = story;
        break;
      }
    }
  }

  return { primary, secondary };
}

/**
 * Score achievement relevance to job (0-1)
 */
function scoreAchievementRelevance(
  achievement: any,
  jobRequirements: ExtractedKeyword[],
  _matchReport: any
): number {
  let score = 0;

  // Keyword match (50%)
  const achievementKeywords = new Set(
    [...achievement.skills, ...achievement.keywords].map(k => k.toLowerCase())
  );
  const jobKeywords = new Set(
    jobRequirements.map(r => r.phrase.toLowerCase())
  );

  let matchCount = 0;
  for (const keyword of achievementKeywords) {
    if (jobKeywords.has(keyword)) {
      matchCount++;
    }
  }

  const keywordScore = jobKeywords.size > 0
    ? matchCount / jobKeywords.size
    : 0;
  score += keywordScore * 0.5;

  // Has metrics (20%)
  if (achievement.metrics && achievement.metrics.length > 0) {
    score += 0.2;
  }

  // Recency (15%) - more recent = better
  // This would need date info, using placeholder
  score += 0.1; // Assume relatively recent

  // Impact level (15%) - based on action verbs
  const impactVerbs = ['led', 'built', 'architected', 'launched', 'transformed', 'established'];
  const hasImpact = impactVerbs.some(verb =>
    achievement.bullet.toLowerCase().includes(verb)
  );
  if (hasImpact) {
    score += 0.15;
  }

  return Math.min(1.0, score);
}

/**
 * Extract STAR framework from achievement
 */
function extractSTARFramework(achievement: any): {
  situation: string;
  task: string;
  action: string;
  result: string;
} {
  const bullet = achievement.bullet;

  // Simple extraction based on structure
  // In production, this would use NLP/AI

  return {
    situation: extractSituation(bullet, achievement),
    task: extractTask(bullet, achievement),
    action: extractAction(bullet, achievement),
    result: extractResult(bullet, achievement),
  };
}

function extractSituation(bullet: string, achievement: any): string {
  // Extract context/setting (10% focus)
  // Look for "At [Company]" or context clues
  const contextMatch = bullet.match(/(?:At|In|During)\s+([^,]+)/);
  return contextMatch
    ? contextMatch[1]
    : `In ${achievement.action || 'role'}`;
}

function extractTask(_bullet: string, achievement: any): string {
  // Extract what needed to be done (10% focus)
  return achievement.object || 'the objective';
}

function extractAction(_bullet: string, achievement: any): string {
  // Extract what user DID (60% focus) - this is the key
  return achievement.bullet; // Full bullet for now, AI will focus on this
}

function extractResult(_bullet: string, achievement: any): string {
  // Extract outcome (20% focus)
  if (achievement.result) {
    return achievement.result;
  }

  // Try to extract metrics
  if (achievement.metrics && achievement.metrics.length > 0) {
    const metric = achievement.metrics[0];
    return `${metric.type} by ${metric.value}${metric.unit}`;
  }

  return 'successful outcome';
}

function estimateWordCount(achievement: any): number {
  return achievement.bullet.split(/\s+/).length;
}

function calculateSkillOverlap(skills1: string[], skills2: string[]): number {
  const set1 = new Set(skills1.map(s => s.toLowerCase()));
  const set2 = new Set(skills2.map(s => s.toLowerCase()));

  let overlap = 0;
  for (const skill of set1) {
    if (set2.has(skill)) {
      overlap++;
    }
  }

  return Math.max(set1.size, set2.size) > 0
    ? overlap / Math.max(set1.size, set2.size)
    : 0;
}

// ============================================================================
// NARRATIVE BUILDER
// ============================================================================

/**
 * Build cover letter narrative structure
 */
function buildNarrative(
  profile: UserProfile,
  matchReport: any,
  stories: { primary: AchievementStory | null; secondary: AchievementStory | null },
  jobContext: JobContext
): CoverLetterNarrative {
  // Build hook (why excited about this role)
  const hook = buildHook(profile, jobContext, matchReport);

  // Build value proposition
  const valueProposition = buildValueProposition(profile, jobContext, matchReport);

  // Connection to role
  const connectionToRole = buildConnectionToRole(profile, jobContext, stories);

  // Closing theme
  const closingTheme = buildClosingTheme(profile, jobContext);

  return {
    hook,
    valueProposition,
    primaryStory: stories.primary!,
    secondaryStory: stories.secondary || undefined,
    connectionToRole,
    closingTheme,
  };
}

function buildHook(_profile: UserProfile, _jobContext: JobContext, _matchReport: any): string {
  const topMatch = _matchReport.matches[0];
  const skill = topMatch ? topMatch.requirement.phrase : _jobContext.keyRequirements[0].phrase;

  return `${_profile.metadata.totalYearsExperience}+ years of ${skill} experience, passionate about ${_jobContext.company}'s mission`;
}

function buildValueProposition(_profile: UserProfile, _jobContext: JobContext, _matchReport: any): string {
  const strengths = _matchReport.matches.slice(0, 3).map((m: any) => m.requirement.phrase);
  return `Proven track record in ${strengths.join(', ')}`;
}

function buildConnectionToRole(
  _profile: UserProfile,
  _jobContext: JobContext,
  _stories: any
): string {
  return `My experience aligns closely with ${_jobContext.role} requirements`;
}

function buildClosingTheme(_profile: UserProfile, _jobContext: JobContext): string {
  return `eager to contribute to ${_jobContext.company}'s continued success`;
}

// ============================================================================
// AI GENERATION FUNCTIONS (Claude API)
// ============================================================================

/**
 * Generate all sections using Claude API
 */
async function generateSectionsWithAI(
  narrative: CoverLetterNarrative,
  jobContext: JobContext,
  tone: ToneProfile,
  config?: CoverLetterConfig
): Promise<CoverLetterSections> {
  // Initialize Anthropic client
  const apiKey = process.env.VITE_ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error('VITE_ANTHROPIC_API_KEY environment variable not set');
  }

  const anthropic = new Anthropic({ apiKey });

  // Generate opening
  const opening = await generateOpening(anthropic, narrative, jobContext, tone, config);

  // Generate body paragraph 1 (primary story)
  const paragraph1 = await generateBodyParagraph(
    anthropic,
    narrative.primaryStory,
    jobContext,
    tone,
    config
  );

  // Generate body paragraph 2 if secondary story exists
  let paragraph2: string | undefined;
  if (narrative.secondaryStory) {
    paragraph2 = await generateBodyParagraph(
      anthropic,
      narrative.secondaryStory,
      jobContext,
      tone,
      config
    );
  }

  // Generate closing
  const closing = await generateClosing(anthropic, narrative, jobContext, tone, config);

  return {
    opening,
    body: {
      paragraph1,
      paragraph2,
    },
    closing,
  };
}

/**
 * Generate opening paragraph with AI
 */
async function generateOpening(
  anthropic: Anthropic,
  narrative: CoverLetterNarrative,
  jobContext: JobContext,
  tone: ToneProfile,
  config?: CoverLetterConfig
): Promise<{ greeting: string; hook: string; valueProposition: string }> {
  const prompt = `You are writing the opening paragraph of a cover letter.

STRICT RULES:
1. DO NOT invent experiences, achievements, or skills not provided
2. DO reference the company by name: "${jobContext.company}"
3. DO show genuine enthusiasm (not generic)
4. DO keep it 2-3 sentences max
5. DO use ${tone.style} tone
6. DO NOT add fake metrics or team sizes

USER INFO:
- Name: ${narrative.primaryStory.achievement.action}
- Years Experience: Not specified (DO NOT INVENT)

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

  const message = await anthropic.messages.create({
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 200,
    temperature: config?.temperature || 0.4,
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

  // Parse response
  const lines = responseText.split('\n\n');
  const greeting = lines[0] || 'Dear Hiring Manager,';
  const body = lines.slice(1).join(' ').trim();

  // Split into hook and value prop (simple heuristic)
  const sentences = body.split(/\.\s+/);
  const hook = sentences[0] + '.' || body;
  const valueProposition = sentences.slice(1).join('. ').trim() || '';

  return {
    greeting,
    hook,
    valueProposition: valueProposition || narrative.valueProposition,
  };
}

/**
 * Generate body paragraph using STAR method (60% Action focus)
 */
async function generateBodyParagraph(
  anthropic: Anthropic,
  story: AchievementStory,
  jobContext: JobContext,
  tone: ToneProfile,
  config?: CoverLetterConfig
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

  const message = await anthropic.messages.create({
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 250,
    temperature: config?.temperature || 0.4,
    messages: [
      {
        role: 'user',
        content: prompt,
      },
    ],
  });

  const paragraph = message.content[0].type === 'text'
    ? message.content[0].text.trim()
    : '';

  return paragraph;
}

/**
 * Generate closing paragraph with AI
 */
async function generateClosing(
  anthropic: Anthropic,
  narrative: CoverLetterNarrative,
  jobContext: JobContext,
  tone: ToneProfile,
  config?: CoverLetterConfig
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

  const message = await anthropic.messages.create({
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 200,
    temperature: config?.temperature || 0.4,
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

  // Parse into components
  const sentences = responseText.split(/\.\s+/);
  const reiterateInterest = sentences[0] + '.' || responseText;
  const callToAction = sentences[1] + '.' || 'I look forward to discussing this opportunity.';
  const signOff = sentences.length > 2
    ? sentences.slice(2).join('. ').trim()
    : 'Sincerely';

  return {
    reiterateInterest,
    callToAction,
    signOff: signOff || 'Sincerely',
  };
}

// ============================================================================
// ASSEMBLY AND FORMATTING
// ============================================================================

/**
 * Assemble full cover letter from sections
 */
function assembleCoverLetter(
  sections: CoverLetterSections,
  profile: UserProfile,
  jobContext: JobContext,
  config?: CoverLetterConfig
): string {
  const lines: string[] = [];

  // Header - candidate info
  lines.push(profile.name);
  if (profile.email) lines.push(profile.email);
  if (profile.phone) lines.push(profile.phone);
  if (profile.location) lines.push(profile.location);
  lines.push(''); // Blank line

  // Date
  const date = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  lines.push(date);
  lines.push(''); // Blank line

  // Recipient
  if (config?.includeHiringManager && jobContext.hiringManager) {
    lines.push(jobContext.hiringManager);
  }
  lines.push(jobContext.company);
  lines.push(''); // Blank line

  // Opening
  lines.push(sections.opening.greeting);
  lines.push(''); // Blank line
  lines.push(sections.opening.hook);
  if (sections.opening.valueProposition) {
    lines.push(sections.opening.valueProposition);
  }
  lines.push(''); // Blank line

  // Body
  lines.push(sections.body.paragraph1);
  lines.push(''); // Blank line

  if (sections.body.paragraph2) {
    lines.push(sections.body.paragraph2);
    lines.push(''); // Blank line
  }

  // Closing
  lines.push(sections.closing.reiterateInterest);
  lines.push(sections.closing.callToAction);
  lines.push(''); // Blank line

  // Signature
  lines.push(sections.closing.signOff);
  lines.push(profile.name);

  return lines.join('\n');
}

/**
 * Format as HTML for display
 */
function formatAsHTML(text: string): string {
  // Convert line breaks to paragraphs
  const paragraphs = text.split('\n\n').filter(p => p.trim());

  const htmlParts = paragraphs.map(p => {
    const trimmed = p.trim().replace(/\n/g, '<br>');
    return `<p>${trimmed}</p>`;
  });

  return htmlParts.join('\n');
}

/**
 * Count words in text
 */
function countWords(text: string): number {
  return text.trim().split(/\s+/).length;
}

// ============================================================================
// VERIFICATION
// ============================================================================

/**
 * Verify no hallucination in generated cover letter
 * Adapts hallucination-detector for cover letter context
 */
function verifyNoHallucinationInCoverLetter(
  fullText: string,
  profile: UserProfile,
  sections: CoverLetterSections,
  jobContext: JobContext
): CoverLetterVerification {
  const addedFacts: string[] = [];
  let confidence = 1.0;

  // Check body paragraphs for hallucination
  const bodyTexts = [
    sections.body.paragraph1,
    sections.body.paragraph2 || '',
  ].filter(t => t);

  for (const bodyText of bodyTexts) {
    // Extract facts from body
    const extractedFacts = extractFacts(bodyText);

    // Check for unauthorized additions
    // 1. Check team involvement claims
    if (extractedFacts.teamInvolvement) {
      // Verify user actually has team leadership experience
      const hasTeamExp = profile.workExperience.some((exp: any) =>
        exp.achievements.some((a: any) =>
          a.bullet.toLowerCase().includes('led') ||
          a.bullet.toLowerCase().includes('team') ||
          a.bullet.toLowerCase().includes('managed')
        )
      );

      if (!hasTeamExp) {
        addedFacts.push('Added team leadership claim without evidence');
        confidence -= 0.25;
      }
    }

    // 2. Check for specific team sizes
    if (extractedFacts.teamSize !== undefined) {
      const hasTeamSize = profile.workExperience.some((exp: any) =>
        exp.achievements.some((a: any) => /team\s+of\s+\d+/i.test(a.bullet))
      );

      if (!hasTeamSize) {
        addedFacts.push(`Added specific team size: ${extractedFacts.teamSize}`);
        confidence -= 0.25;
      }
    }

    // 3. Check for added metrics
    if (extractedFacts.metrics.length > 0) {
      const allProfileMetrics = profile.workExperience.flatMap((exp: any) =>
        exp.achievements.flatMap((a: any) => a.metrics || [])
      );

      for (const metric of extractedFacts.metrics) {
        const hasMetric = allProfileMetrics.some((m: any) =>
          Math.abs(m.value - metric.value) < 0.1 &&
          m.unit === metric.unit
        );

        if (!hasMetric) {
          addedFacts.push(`Added metric: ${metric.value}${metric.unit}`);
          confidence -= 0.2;
        }
      }
    }
  }

  // Word count validation
  const wordCount = countWords(fullText);
  const wordCountValid = wordCount >= 200 && wordCount <= 450;

  // Check spelling (basic - production would use spell checker)
  const spellingErrors: string[] = [];

  // Calculate sentiment (basic)
  const sentimentScore = 0.7; // Placeholder

  // Extract keywords used
  const keywordsUsed = jobContext.keyRequirements
    .filter((kw: ExtractedKeyword) => fullText.toLowerCase().includes(kw.phrase.toLowerCase()))
    .map((kw: ExtractedKeyword) => kw.phrase);

  const keywordCoverage = jobContext.keyRequirements.length > 0
    ? keywordsUsed.length / jobContext.keyRequirements.length
    : 0;

  // Determine if all facts are from profile
  const allFactsFromProfile = profile.workExperience.flatMap((exp: any) =>
    exp.achievements.map((a: any) => a.bullet)
  );

  return {
    noHallucination: addedFacts.length === 0,
    allFactsFromProfile,
    addedFacts,
    confidence: Math.max(0, confidence),
    wordCount,
    wordCountValid,
    spellingErrors,
    sentimentScore,
    keywordsUsed,
    keywordCoverage,
  };
}

// ============================================================================
// ATS SCORING
// ============================================================================

/**
 * Calculate ATS score for cover letter
 * Adapts resume-generator ATS logic
 */
function calculateCoverLetterATSScore(
  fullText: string,
  jobContext: JobContext,
  _matchReport: any
): {
  requirementsAddressed: string[];
  requirementsMissed: string[];
  atsScore: number;
} {
  const lowerText = fullText.toLowerCase();
  const requirements = jobContext.keyRequirements;

  // Check which requirements are addressed
  const requirementsAddressed: string[] = [];
  const requirementsMissed: string[] = [];

  for (const req of requirements) {
    if (lowerText.includes(req.phrase.toLowerCase())) {
      requirementsAddressed.push(req.phrase);
    } else {
      requirementsMissed.push(req.phrase);
    }
  }

  let score = 0;

  // Keyword coverage (50 points)
  const keywordScore = requirements.length > 0
    ? (requirementsAddressed.length / requirements.length) * 50
    : 0;
  score += keywordScore;

  // Word count optimization (15 points)
  const wordCount = countWords(fullText);
  if (wordCount >= 250 && wordCount <= 400) {
    score += 15;
  } else if (wordCount >= 200 && wordCount < 250) {
    score += 10;
  } else if (wordCount > 400 && wordCount <= 450) {
    score += 10;
  } else {
    score += 5;
  }

  // Structure (20 points)
  if (lowerText.includes('dear')) score += 5; // Has greeting
  if (lowerText.includes('sincerely') || lowerText.includes('best')) score += 5; // Has closing
  if (lowerText.includes(jobContext.company.toLowerCase())) score += 5; // Mentions company
  if (lowerText.includes(jobContext.role.toLowerCase())) score += 5; // Mentions role

  // Specificity (15 points)
  if (requirementsAddressed.length >= 5) score += 8; // Good keyword density
  if (/\d+%|\d+\s*(?:users|hours|days)/.test(fullText)) score += 7; // Has metrics

  return {
    requirementsAddressed,
    requirementsMissed,
    atsScore: Math.min(100, Math.round(score)),
  };
}
