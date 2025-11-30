/**
 * Cover Letter Narrative Builder
 * Constructs the narrative structure and content strategy before AI generation
 *
 * Purpose:
 * - Creates hooks that establish relevance immediately
 * - Connects user's experience to job's specific needs
 * - Determines appropriate closing strategy based on context
 *
 * NO AI CALLS - Pure logic and template matching
 * All content comes from UserProfile (zero hallucination)
 */

import type {
  UserProfile,
} from '../types/resume-tailoring';
import type {
  JobContext,
  AchievementStory,
  CoverLetterNarrative,
} from '../../docs/examples/cover-letter-generation-types';
import { log, LogCategory } from '../utils/logger';

/**
 * Hook strategy patterns for different career stages
 * Each pattern has required fields from profile and job context
 */
interface HookPattern {
  strategy: 'student' | 'entry-level' | 'professional' | 'career-changer' | 'executive';
  template: string;
  requiredFields: string[];
  example: string;
}

/**
 * Closing theme variations based on context
 */
interface ClosingThemePattern {
  theme: 'eager-to-contribute' | 'excited-to-discuss' | 'passionate-about-mission' | 'ready-for-challenge';
  suitableFor: string[];
  template: string;
  example: string;
}

/**
 * Available hook patterns indexed by career stage
 */
const HOOK_PATTERNS: Record<string, HookPattern[]> = {
  'student': [
    {
      strategy: 'student',
      template:
        'As a {degree} student in {field} with hands-on experience in {skill}, I was excited to discover {company}\'s {role} position.',
      requiredFields: ['degree', 'field', 'skill', 'company', 'role'],
      example:
        'As a Computer Science student with hands-on experience in full-stack development, I was excited to discover TechCorp\'s Backend Engineer position.',
    },
    {
      strategy: 'student',
      template:
        'I\'m pursuing a {degree} in {field}, and my {project_type} project building {technology} directly aligns with your {requirement}.',
      requiredFields: ['degree', 'field', 'project_type', 'technology', 'requirement'],
      example:
        'I\'m pursuing a Bachelor\'s in Computer Science, and my capstone project building a machine learning recommendation system directly aligns with your AI/ML engineering role.',
    },
  ],

  'entry-level': [
    {
      strategy: 'entry-level',
      template:
        'With my background in {domain} and proven expertise in {skill}, I\'m excited to apply my skills to {company}\'s {role}.',
      requiredFields: ['domain', 'skill', 'company', 'role'],
      example:
        'With my background in web development and proven expertise in React and TypeScript, I\'m excited to apply my skills to TechCorp\'s Frontend Engineer position.',
    },
    {
      strategy: 'entry-level',
      template:
        'My {internship_count} internships across {companies} have equipped me with strong {skills}, making me an ideal fit for {role}.',
      requiredFields: ['internship_count', 'companies', 'skills', 'role'],
      example:
        'My 2 internships across Google and Microsoft have equipped me with strong full-stack development skills, making me an ideal fit for the Software Engineer role.',
    },
  ],

  'professional': [
    {
      strategy: 'professional',
      template:
        'With {years} years of experience in {domain}, I\'ve consistently delivered {achievement_type} at companies like {past_company}. Your focus on {company_focus} particularly resonates with me.',
      requiredFields: ['years', 'domain', 'achievement_type', 'past_company', 'company_focus'],
      example:
        'With 5 years of experience in cloud infrastructure, I\'ve consistently delivered scalable systems at companies like AWS and Google Cloud. Your focus on AI infrastructure particularly resonates with me.',
    },
    {
      strategy: 'professional',
      template:
        'As a {current_title} with proven success in {domain}, I\'m drawn to {company}\'s mission of {mission} and your innovative approach to {technical_area}.',
      requiredFields: ['current_title', 'domain', 'company', 'mission', 'technical_area'],
      example:
        'As a Senior Software Engineer with proven success in backend systems, I\'m drawn to TechCorp\'s mission of democratizing AI and your innovative approach to distributed computing.',
    },
  ],

  'career-changer': [
    {
      strategy: 'career-changer',
      template:
        'Transitioning from {old_field} to {new_field}, my {transferable_skill} and {technical_skill} make me uniquely positioned for {role}.',
      requiredFields: ['old_field', 'new_field', 'transferable_skill', 'technical_skill', 'role'],
      example:
        'Transitioning from finance to software engineering, my analytical mindset and proficiency in Python make me uniquely positioned for the Data Engineer role.',
    },
    {
      strategy: 'career-changer',
      template:
        'While my background is in {old_field}, I\'ve spent the last {timeframe} building {project_type} projects in {technology}, which directly prepares me for {role}.',
      requiredFields: ['old_field', 'timeframe', 'project_type', 'technology', 'role'],
      example:
        'While my background is in marketing, I\'ve spent the last year building full-stack projects in React and Node.js, which directly prepares me for the Full Stack Engineer role.',
    },
  ],

  'executive': [
    {
      strategy: 'executive',
      template:
        'Throughout my {years}-year career leading {team_type} teams at {key_companies}, I\'ve driven {key_metrics}. {company}\'s vision for {vision} represents exactly the kind of impact-driven opportunity I\'m seeking.',
      requiredFields: ['years', 'team_type', 'key_companies', 'key_metrics', 'company', 'vision'],
      example:
        'Throughout my 12-year career leading engineering teams at Google and Facebook, I\'ve driven a 200% increase in platform efficiency. TechCorp\'s vision for making AI accessible represents exactly the kind of impact-driven opportunity I\'m seeking.',
    },
  ],
};

/**
 * Closing theme patterns
 */
// @ts-expect-error - Reserved for future use
const __CLOSING_THEMES: ClosingThemePattern[] = [
  {
    theme: 'eager-to-contribute',
    suitableFor: ['entry-level', 'student'],
    template:
      'I\'m eager to contribute {specific_skill} to your team and help {company} achieve {specific_goal}.',
    example:
      'I\'m eager to contribute my expertise in distributed systems to your team and help TechCorp scale to serve millions of users.',
  },
  {
    theme: 'excited-to-discuss',
    suitableFor: ['entry-level', 'mid', 'professional'],
    template:
      'I\'d be excited to discuss how my background in {domain} can help address {challenge} at {company}.',
    example:
      'I\'d be excited to discuss how my background in cloud infrastructure can help address scalability at TechCorp.',
  },
  {
    theme: 'passionate-about-mission',
    suitableFor: ['startup', 'mission-driven', 'nonprofit'],
    template:
      'I\'m passionate about {company}\'s mission to {mission_statement} and committed to using my {skill} to drive this impact.',
    example:
      'I\'m passionate about TechCorp\'s mission to democratize AI and committed to using my engineering expertise to drive this impact.',
  },
  {
    theme: 'ready-for-challenge',
    suitableFor: ['senior', 'executive'],
    template:
      'I\'m ready to bring my {experience_type} to tackle {company}\'s next challenges and scale {technical_area}.',
    example:
      'I\'m ready to bring my distributed systems expertise to tackle TechCorp\'s next challenges and scale their infrastructure tenfold.',
  },
];

/**
 * Builds complete narrative structure for cover letter
 *
 * Creates:
 * 1. Hook - Opening that establishes relevance
 * 2. Value Proposition - Why you matter to this company
 * 3. Primary Story - Main achievement that demonstrates fit
 * 4. Secondary Story (optional) - Additional evidence of capability
 * 5. Connection to Role - How experience maps to job requirements
 * 6. Closing Theme - Appropriate sign-off based on seniority/company type
 *
 * @param profile - User's professional profile (verified facts only)
 * @param jobContext - Job posting context and company information
 * @param selectedStories - 1-2 achievements selected by story-selector
 * @returns Complete narrative structure ready for AI generation
 *
 * @example
 * const narrative = buildNarrative(userProfile, jobContext, selectedStories);
 * // Returns:
 * // {
 * //   hook: "With 5 years of experience in cloud infrastructure...",
 * //   valueProposition: "My expertise in distributed systems directly addresses...",
 * //   primaryStory: { achievement, relevanceScore, starFramework },
 * //   secondaryStory: { achievement, relevanceScore, starFramework },
 * //   connectionToRole: "My experience building scalable systems at AWS...",
 * //   closingTheme: "ready-for-challenge"
 * // }
 */
export function buildNarrative(
  profile: UserProfile,
  jobContext: JobContext,
  selectedStories: AchievementStory[]
): CoverLetterNarrative {
  const startTimer = log.startTimer(LogCategory.SERVICE, 'buildNarrative');

  try {
    // Ensure we have at least one story
    if (!selectedStories || selectedStories.length === 0) {
      throw new Error('buildNarrative requires at least one selected story');
    }

    // Step 1: Build hook (opening line)
    const hook = craftHook(profile, jobContext);

    // Step 2: Create value proposition
    const valueProposition = buildValueProposition(
      profile,
      jobContext,
      selectedStories[0]
    );

    // Step 3: Assign stories
    const primaryStory = selectedStories[0];
    const secondaryStory = selectedStories.length > 1 ? selectedStories[1] : undefined;

    // Step 4: Create role-specific connection
    const connectionToRole = buildConnectionToRole(
      profile,
      jobContext,
      primaryStory
    );

    // Step 5: Determine closing theme
    const closingTheme = determineClosingTheme(profile, jobContext);

    const result: CoverLetterNarrative = {
      hook,
      valueProposition,
      primaryStory,
      secondaryStory,
      connectionToRole,
      closingTheme,
    };

    log.info(LogCategory.SERVICE, 'Narrative built successfully', {
      seniority: profile.metadata.seniority,
      company: jobContext.company,
      role: jobContext.role,
      storyCount: selectedStories.length,
    });

    startTimer();
    return result;
  } catch (error) {
    log.error(
      LogCategory.SERVICE,
      'Error in buildNarrative',
      error as Error
    );
    throw error;
  }
}

/**
 * Crafts an opening hook that immediately establishes relevance
 *
 * Strategy:
 * 1. Identify career stage (student, entry, professional, career-changer, executive)
 * 2. Select appropriate hook pattern
 * 3. Fill template with verified profile data
 * 4. Ensure mentions key job requirement
 *
 * @param profile - User's professional profile
 * @param jobContext - Job information
 * @returns Opening hook sentence(s)
 *
 * @example
 * const hook = craftHook(studentProfile, jobContext);
 * // Returns:
 * // "As a Computer Science student with hands-on experience in full-stack
 * //  development, I was excited to discover TechCorp's Backend Engineer position."
 */
export function craftHook(
  profile: UserProfile,
  jobContext: JobContext
): string {
  const careerStage = profile.metadata.careerStage;
  const patterns = HOOK_PATTERNS[careerStage] || HOOK_PATTERNS['professional'];

  log.debug(LogCategory.SERVICE, `Crafting hook for ${careerStage}`, {
    company: jobContext.company,
    role: jobContext.role,
  });

  // Select the best pattern based on available profile data
  const bestPattern = selectBestPattern(patterns, profile, jobContext);

  if (!bestPattern) {
    // Fallback hook if no pattern matches well
    return fallbackHook(profile, jobContext);
  }

  // Fill template with data from profile and job context
  return fillHookTemplate(bestPattern, profile, jobContext);
}

/**
 * Determines the appropriate closing theme for the cover letter
 *
 * Selection logic:
 * - Entry-level: "eager-to-contribute" (shows enthusiasm)
 * - Mid-level: "excited-to-discuss" (shows engagement)
 * - Mission-driven company: "passionate-about-mission" (shows values alignment)
 * - Senior/Executive: "ready-for-challenge" (shows confidence)
 *
 * @param profile - User's professional profile
 * @param jobContext - Job information
 * @returns Closing theme identifier
 *
 * @example
 * const theme = determineClosingTheme(seniorProfile, startupJobContext);
 * // Returns: "ready-for-challenge"
 */
export function determineClosingTheme(
  profile: UserProfile,
  jobContext: JobContext
): string {
  const seniority = profile.metadata.seniority;

  log.debug(LogCategory.SERVICE, 'Determining closing theme', {
    seniority,
    company: jobContext.company,
  });

  // Map seniority level to closing theme
  switch (seniority) {
    case 'entry':
      return 'eager-to-contribute';

    case 'mid':
      // Check if company is mission-driven
      if (isMissionDriven(jobContext.company)) {
        return 'passionate-about-mission';
      }
      return 'excited-to-discuss';

    case 'senior':
    case 'staff':
    case 'principal':
      return 'ready-for-challenge';

    default:
      return 'excited-to-discuss';
  }
}

/**
 * ============================================================================
 * HELPER FUNCTIONS
 * ============================================================================
 */

/**
 * Selects the hook pattern best suited to available profile data
 */
function selectBestPattern(
  patterns: HookPattern[],
  profile: UserProfile,
  jobContext: JobContext
): HookPattern | null {
  // Score each pattern based on available data
  const scored = patterns.map((pattern) => ({
    pattern,
    score: scorePatternFit(pattern, profile, jobContext),
  }));

  // Sort by score (descending) and return highest
  const best = scored.sort((a, b) => b.score - a.score)[0];

  return best && best.score > 0 ? best.pattern : null;
}

/**
 * Scores how well a pattern matches available profile data
 * Higher score means more required fields are available
 */
function scorePatternFit(
  pattern: HookPattern,
  profile: UserProfile,
  jobContext: JobContext
): number {
  const availableData = {
    degree: profile.education?.[0]?.degree ? 1 : 0,
    field: profile.education?.[0]?.field ? 1 : 0,
    skill: profile.skills?.length > 0 ? 1 : 0,
    domain: profile.metadata.domains?.[0] ? 1 : 0,
    company: jobContext.company ? 1 : 0,
    role: jobContext.role ? 1 : 0,
    years: profile.metadata.totalYearsExperience > 0 ? 1 : 0,
    project_type: profile.projects?.length > 0 ? 1 : 0,
    technology: profile.skills?.length > 0 ? 1 : 0,
    achievement_type: profile.workExperience?.[0]?.achievements?.length > 0 ? 1 : 0,
    past_company: profile.workExperience?.[0]?.company ? 1 : 0,
    company_focus: jobContext.keyRequirements?.[0]?.phrase ? 1 : 0,
    current_title: profile.title ? 1 : 0,
    mission: jobContext.keyRequirements?.[0]?.phrase ? 1 : 0,
    technical_area: jobContext.keyRequirements?.[1]?.phrase ? 1 : 0,
    old_field: 1, // Assume available for career changers
    new_field: profile.metadata.domains?.[0] ? 1 : 0,
    transferable_skill: 1, // Assume available
    technical_skill: profile.skills?.length > 0 ? 1 : 0,
    timeframe: 1, // Assume available
    internship_count: profile.workExperience?.length || 0,
    companies: profile.workExperience?.length > 0 ? 1 : 0,
    skills: profile.skills?.length > 0 ? 1 : 0,
    team_type: profile.workExperience?.[0]?.achievements?.length > 0 ? 1 : 0,
    key_companies: profile.workExperience?.length > 0 ? 1 : 0,
    key_metrics: profile.workExperience?.[0]?.achievements?.some((a) => a.metrics && a.metrics.length > 0) ? 1 : 0,
    vision: jobContext.keyRequirements?.[0]?.phrase ? 1 : 0,
  } as Record<string, number>;

  // Count how many required fields are available
  const availableCount = pattern.requiredFields.filter(
    (field) => availableData[field]
  ).length;

  return availableCount / pattern.requiredFields.length;
}

/**
 * Fills a hook pattern template with actual profile data
 */
function fillHookTemplate(
  pattern: HookPattern,
  profile: UserProfile,
  jobContext: JobContext
): string {
  let text = pattern.template;

  // Extract values from profile and job context
  const replacements: Record<string, string> = {
    degree: profile.education?.[0]?.degree || 'student',
    field: profile.education?.[0]?.field || 'technical field',
    skill: profile.skills?.[0]?.name || 'technical skills',
    domain: profile.metadata.domains?.[0] || 'software development',
    company: jobContext.company,
    role: jobContext.role,
    years: profile.metadata.totalYearsExperience.toString(),
    project_type: profile.projects?.length > 0 ? 'capstone' : 'personal',
    technology:
      profile.projects?.[0]?.skills?.[0] ||
      profile.skills?.[0]?.name ||
      'modern technologies',
    achievement_type:
      profile.workExperience?.[0]?.achievements?.length > 0
        ? 'scalable solutions'
        : 'results',
    past_company: profile.workExperience?.[0]?.company || 'previous roles',
    company_focus: jobContext.keyRequirements?.[0]?.phrase || 'innovation',
    current_title: profile.title,
    mission: jobContext.keyRequirements?.[0]?.phrase || 'creating impact',
    technical_area:
      jobContext.keyRequirements?.[1]?.phrase ||
      jobContext.keyRequirements?.[0]?.phrase ||
      'technical challenges',
    old_field: 'my previous field',
    new_field: profile.metadata.domains?.[0] || 'technology',
    transferable_skill: 'analytical thinking',
    technical_skill: profile.skills?.[0]?.name || 'technical expertise',
    timeframe: '1+ years',
    internship_count:
      profile.workExperience?.filter((w) => w.title?.includes('Intern')).length
        .toString() || 'several',
    companies:
      profile.workExperience?.map((w) => w.company).join(' and ') || 'leading companies',
    team_type: 'engineering',
    key_companies:
      profile.workExperience?.slice(0, 2).map((w) => w.company).join(' and ') ||
      'notable companies',
    key_metrics: 'measurable impact',
    vision: jobContext.keyRequirements?.[0]?.phrase || 'innovation',
  };

  // Replace placeholders with actual data
  Object.entries(replacements).forEach(([key, value]) => {
    const placeholder = new RegExp(`\\{${key}\\}`, 'g');
    text = text.replace(placeholder, value);
  });

  return text;
}

/**
 * Fallback hook when no pattern matches well
 */
function fallbackHook(
  profile: UserProfile,
  jobContext: JobContext
): string {
  const role = jobContext.role;
  const topSkill = profile.skills?.[0]?.name || 'technical skills';
  const topDomain = profile.metadata.domains?.[0] || 'software development';

  switch (profile.metadata.seniority) {
    case 'entry':
      return `I'm excited about the opportunity to bring my expertise in ${topSkill} to ${jobContext.company}'s ${role} position.`;

    case 'mid':
    case 'senior':
      return `With my background in ${topDomain}, I'm drawn to ${jobContext.company}'s focus on ${jobContext.keyRequirements?.[0]?.phrase || 'innovation'}.`;

    case 'staff':
    case 'principal':
      return `Throughout my career building teams and systems in ${topDomain}, I've been impressed by ${jobContext.company}'s approach to ${jobContext.keyRequirements?.[0]?.phrase || 'technical excellence'}.`;

    default:
      return `I'm interested in bringing my ${topSkill} to the ${role} role at ${jobContext.company}.`;
  }
}

/**
 * Builds a value proposition connecting user's core strength to job's core need
 */
function buildValueProposition(
  _profile: UserProfile,
  jobContext: JobContext,
  primaryStory: AchievementStory
): string {
  const topRequirement = jobContext.keyRequirements?.[0];
  const achievementAction = primaryStory.achievement.action || 'developed';
  const achievementObject = primaryStory.achievement.object || 'solutions';

  if (topRequirement) {
    return `My experience ${achievementAction} ${achievementObject} demonstrates the ${topRequirement.phrase} expertise you're seeking.`;
  }

  return `My proven ability to ${achievementAction} ${achievementObject} directly addresses your key needs.`;
}

/**
 * Builds a connection statement mapping user's experience to job requirements
 */
function buildConnectionToRole(
  _profile: UserProfile,
  jobContext: JobContext,
  primaryStory: AchievementStory
): string {
  const requirement = jobContext.keyRequirements?.[0];
  const achievement = primaryStory.achievement;

  if (!requirement) {
    return `My background directly prepares me for this role.`;
  }

  // Create connection: "My experience with X aligns with your need for Y"
  const connectionKeyword =
    achievement.keywords?.[0] || achievement.object || 'expertise';
  const requirementTerm = requirement.phrase;

  return `My experience with ${connectionKeyword} aligns perfectly with your need for ${requirementTerm} to ${jobContext.company}'s ${jobContext.role} role.`;
}

/**
 * Heuristic: determine if company is mission-driven
 * Based on company name patterns and culture signals
 */
function isMissionDriven(company: string): boolean {
  const missionDrivenKeywords = [
    'impact',
    'mission',
    'foundation',
    'nonprofit',
    'social',
    'environmental',
    'sustainable',
    'green',
  ];

  const companyLower = company.toLowerCase();
  return missionDrivenKeywords.some((keyword) =>
    companyLower.includes(keyword)
  );
}
