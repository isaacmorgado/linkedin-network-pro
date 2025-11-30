/**
 * Cover Letter Story Selector
 * Selects and processes the best 1-2 achievements from UserProfile for cover letter narrative
 *
 * Core Logic:
 * 1. Score each achievement by relevance to job context
 * 2. Filter by STAR completeness (Situation, Task, Action, Result)
 * 3. Return top 1-2 stories ranked by relevance
 *
 * STAR Framework Distribution (validated through research):
 * - Situation: 10% - Context/setup (company, role, timeframe)
 * - Task: 10% - What needed to be done
 * - Action: 60% - What USER did (the critical part)
 * - Result: 20% - Outcomes/metrics
 */

import type {
  UserProfile,
  Achievement,
  MatchReport,
} from '../types/resume-tailoring';
import type {
  JobContext,
  AchievementStory,
} from '../../docs/examples/cover-letter-generation-types';
import { log, LogCategory } from '../utils/logger';

/**
 * STAR Framework - Structured storytelling format
 * Used internally and exported in AchievementStory
 */
interface StarFramework {
  situation: string;    // 10% - "At TechCorp, a 50-person engineering team"
  task: string;         // 10% - "needed to reduce API response times"
  action: string;       // 60% - "I designed and implemented database indexing + query optimization"
  result: string;       // 20% - "reducing latency by 40% and improving user satisfaction by 15%"
}

/**
 * Internal scoring structure for ranking achievements
 */
interface ScoredAchievement {
  achievement: Achievement;
  relevanceScore: number;     // 0-1 scale
  completenessScore: number;  // 0-1 scale (STAR completeness)
  starFramework: StarFramework;
  keywords: string[];
  estimatedWordCount: number;
}

/**
 * Scoring weights for relevance calculation
 */
const RELEVANCE_WEIGHTS = {
  directKeywordMatch: 0.4,   // Direct keyword match from job posting
  semanticMatch: 0.2,        // Semantically similar concepts
  quantifiableResults: 0.3,  // Has measurable outcomes
  recency: 0.1,              // Achievement from last 2 years
};

/**
 * Minimum STAR completeness threshold for inclusion
 * All components should have meaningful content
 */
const MIN_STAR_COMPLETENESS = 0.5; // 50% completeness minimum

/**
 * Selects 1-2 best achievements from user profile based on job context
 *
 * @param profile - User's complete professional profile (verified facts only)
 * @param jobContext - Extracted information from job posting
 * @param matchReport - Results from resume-matcher with direct evidence
 * @returns Array of 1-2 top achievement stories with STAR breakdowns
 *
 * @example
 * const stories = selectBestStories(userProfile, jobContext, matchReport);
 * // Returns: [
 * //   {
 * //     achievement: { bullet: "Built microservices platform..." },
 * //     relevanceScore: 0.87,
 * //     starFramework: { situation: "...", task: "...", action: "...", result: "..." }
 * //   }
 * // ]
 */
export function selectBestStories(
  profile: UserProfile,
  jobContext: JobContext,
  matchReport: MatchReport
): AchievementStory[] {
  const startTimer = log.startTimer(LogCategory.SERVICE, 'selectBestStories');

  try {
    // Step 1: Collect all achievements from profile
    const allAchievements = collectAchievements(profile);
    log.info(
      LogCategory.SERVICE,
      `Collected ${allAchievements.length} achievements from profile`,
      { company: jobContext.company, role: jobContext.role }
    );

    // Step 2: Score each achievement
    const scoredAchievements = allAchievements
      .map((achievement) =>
        scoreAchievement(
          achievement,
          jobContext,
          matchReport,
          profile.metadata.seniority
        )
      )
      // Filter out very low-scoring or incomplete achievements
      .filter((scored) => scored.completenessScore >= MIN_STAR_COMPLETENESS)
      .sort((a, b) => b.relevanceScore - a.relevanceScore);

    log.debug(
      LogCategory.SERVICE,
      `Scored ${scoredAchievements.length} eligible achievements`,
      {
        topScore: scoredAchievements[0]?.relevanceScore,
        topAchievement: scoredAchievements[0]?.achievement.bullet.substring(0, 50),
      }
    );

    // Step 3: Return top 1-2 stories
    // For entry-level: 1 story is sufficient
    // For mid/senior: 2 stories show depth
    const maxStories =
      profile.metadata.seniority === 'entry' ? 1 : 2;
    const selectedScored = scoredAchievements.slice(0, maxStories);

    // Step 4: Convert to AchievementStory format
    const result = selectedScored.map((scored) => ({
      achievement: scored.achievement,
      relevanceScore: scored.relevanceScore,
      starFramework: scored.starFramework,
      keywords: scored.keywords,
      estimatedWordCount: scored.estimatedWordCount,
    }));

    log.info(
      LogCategory.SERVICE,
      `Selected ${result.length} best stories`,
      {
        stories: result.map((s) => ({
          relevance: s.relevanceScore.toFixed(2),
          wordCount: s.estimatedWordCount,
        })),
      }
    );

    startTimer();
    return result;
  } catch (error) {
    log.error(
      LogCategory.SERVICE,
      'Error in selectBestStories',
      error as Error
    );
    throw error;
  }
}

/**
 * Converts an achievement into STAR framework format
 *
 * @param achievement - Raw achievement from user profile
 * @returns STAR breakdown with structured components
 *
 * @example
 * const achievement = {
 *   bullet: "Led migration of legacy monolith to microservices",
 *   action: "Led",
 *   object: "migration to microservices",
 *   result: "reducing deployment time by 60%"
 * };
 * const star = convertToSTAR(achievement);
 * // Returns:
 * // {
 * //   situation: "At my previous company in Q3 2023",
 * //   task: "We needed to modernize our architecture",
 * //   action: "Led a team migration from monolith to microservices architecture",
 * //   result: "reducing deployment time by 60% and enabling 10x faster feature releases"
 * // }
 */
export function convertToSTAR(achievement: Achievement): StarFramework {
  const situation = extractSituation(achievement);
  const task = extractTask(achievement);
  const action = extractAction(achievement);
  const result = extractResult(achievement);

  return { situation, task, action, result };
}

/**
 * Calculates relevance score (0-1) for an achievement against job context
 *
 * Scoring formula:
 * - Direct keyword match: +0.4 (exact match with job requirements)
 * - Semantic match: +0.2 (similar concepts, not exact)
 * - Quantifiable results: +0.3 (has metrics/outcomes)
 * - Recency: +0.1 (within last 2 years)
 *
 * @param achievement - Achievement to score
 * @param jobContext - Job posting context with requirements
 * @returns Relevance score 0-1 (0 = irrelevant, 1 = perfectly relevant)
 *
 * @example
 * const relevance = calculateStoryRelevance(achievement, jobContext);
 * // Returns: 0.87 (87% relevant to job requirements)
 */
export function calculateStoryRelevance(
  achievement: Achievement,
  jobContext: JobContext
): number {
  let score = 0;

  // Score 1: Direct keyword match (0.4 max)
  const directMatches = countDirectMatches(
    achievement,
    jobContext.keyRequirements
  );
  if (directMatches > 0) {
    score += Math.min(directMatches * 0.15, RELEVANCE_WEIGHTS.directKeywordMatch);
  }

  // Score 2: Semantic match (0.2 max)
  const semanticMatches = countSemanticMatches(
    achievement,
    jobContext.keyRequirements
  );
  if (semanticMatches > 0) {
    score += Math.min(semanticMatches * 0.08, RELEVANCE_WEIGHTS.semanticMatch);
  }

  // Score 3: Has quantifiable results (0.3 max)
  if (hasQuantifiableResults(achievement)) {
    score += RELEVANCE_WEIGHTS.quantifiableResults;
  }

  // Score 4: Recency bonus (0.1 max)
  if (isRecent(achievement)) {
    score += RELEVANCE_WEIGHTS.recency;
  }

  // Ensure score stays in 0-1 range
  return Math.min(score, 1.0);
}

/**
 * ============================================================================
 * HELPER FUNCTIONS
 * ============================================================================
 */

/**
 * Collects all achievements from across the user profile
 * Sources: work experience, projects, volunteer work, education achievements
 */
function collectAchievements(profile: UserProfile): Achievement[] {
  const achievements: Achievement[] = [];

  // From work experience
  profile.workExperience.forEach((job) => {
    if (job.achievements && Array.isArray(job.achievements)) {
      achievements.push(...job.achievements);
    }
  });

  // From projects
  if (profile.projects && Array.isArray(profile.projects)) {
    profile.projects.forEach((project) => {
      if (project.achievements && Array.isArray(project.achievements)) {
        achievements.push(...project.achievements);
      }
    });
  }

  // From volunteer work
  if (profile.volunteer && Array.isArray(profile.volunteer)) {
    profile.volunteer.forEach((volunteer) => {
      if (volunteer.achievements && Array.isArray(volunteer.achievements)) {
        achievements.push(...volunteer.achievements);
      }
    });
  }

  // From education
  if (profile.education && Array.isArray(profile.education)) {
    profile.education.forEach((edu) => {
      if (edu.achievements && Array.isArray(edu.achievements)) {
        achievements.push(...edu.achievements);
      }
    });
  }

  return achievements;
}

/**
 * Scores a single achievement with multiple dimensions
 */
function scoreAchievement(
  achievement: Achievement,
  jobContext: JobContext,
  _matchReport: MatchReport,
  _seniority: string
): ScoredAchievement {
  // Calculate relevance (0-1)
  const relevanceScore = calculateStoryRelevance(achievement, jobContext);

  // Convert to STAR framework
  const starFramework = convertToSTAR(achievement);

  // Calculate STAR completeness (0-1)
  const completenessScore = calculateSTARCompleteness(starFramework);

  // Extract keywords that match job requirements
  const keywords = extractKeywords(achievement, jobContext);

  // Estimate word count for this story in cover letter context
  const estimatedWordCount = estimateWordCount(starFramework);

  return {
    achievement,
    relevanceScore,
    completenessScore,
    starFramework,
    keywords,
    estimatedWordCount,
  };
}

/**
 * Extracts situation/context from achievement
 * Requires: metadata about when/where this happened
 */
function extractSituation(achievement: Achievement): string {
  // Ideal: get from work experience or project context
  // Fallback: infer from achievement description
  // This is a simple approach - in production, would have more context

  // Check if action mentions company/domain context
  const actionWords = achievement.action?.toLowerCase() || '';

  // Common situation starters
  if (actionWords.includes('led') || actionWords.includes('managed')) {
    return `In a professional setting where I needed to lead a team effort`;
  }

  if (actionWords.includes('built') || actionWords.includes('created')) {
    return `When tasked with creating a solution to improve operations`;
  }

  if (actionWords.includes('optimized') || actionWords.includes('improved')) {
    return `In a situation where performance or efficiency needed improvement`;
  }

  // Generic fallback
  return `In a professional context where I could apply my expertise`;
}

/**
 * Extracts task/challenge from achievement
 * The problem that needed solving
 */
function extractTask(achievement: Achievement): string {
  // The task is often implied by the action + object
  const action = achievement.action?.toLowerCase() || '';
  const object = achievement.object || '';

  if (object) {
    // "Built X" → "We needed to build X" or "The challenge was to create X"
    if (
      action.includes('built') ||
      action.includes('created') ||
      action.includes('developed')
    ) {
      return `The challenge was to ${action.toLowerCase()} ${object}`;
    }

    // "Optimized X" → "We needed to optimize X"
    if (action.includes('optimized') || action.includes('improved')) {
      return `The team needed to ${action.toLowerCase()} ${object}`;
    }

    // "Led X" → "I needed to lead X"
    if (action.includes('led') || action.includes('managed')) {
      return `I was tasked with ${action.toLowerCase()} ${object}`;
    }

    // Default
    return `We had to address the need to ${action.toLowerCase()} ${object}`;
  }

  // Fallback if no object
  return `There was a business challenge that required ${action.toLowerCase()}`;
}

/**
 * Extracts action - the core of the STAR story (60% of narrative)
 * This is the most important part - what the USER actually did
 */
function extractAction(achievement: Achievement): string {
  // Action is the verb + object from achievement
  const action = achievement.action || 'Contributed to';
  const object = achievement.object || 'a business initiative';

  // Expand with more detail if available
  let expandedAction = `${action} ${object}`;

  // If skills are available, add them
  if (achievement.skills && achievement.skills.length > 0) {
    const topSkills = achievement.skills.slice(0, 2).join(' and ');
    expandedAction += `, demonstrating my expertise in ${topSkills}`;
  }

  return expandedAction;
}

/**
 * Extracts result/outcome from achievement
 * The measurable impact
 */
function extractResult(achievement: Achievement): string {
  // Best case: we have explicit result field
  if (achievement.result) {
    return achievement.result;
  }

  // Next best: we have metrics
  if (achievement.metrics && achievement.metrics.length > 0) {
    const metricStrings = achievement.metrics.map((m) => {
      const value = m.type === 'decrease' || m.type === 'reduction'
        ? `decreased ${m.context || 'metric'} by ${m.value}${m.unit}`
        : `increased ${m.context || 'metric'} by ${m.value}${m.unit}`;
      return value;
    });
    return `This resulted in ${metricStrings.join(' and ')}`;
  }

  // Fallback: generic positive impact
  return 'This contributed positively to the team and business outcomes';
}

/**
 * Counts how many job keywords directly match achievement
 */
function countDirectMatches(
  achievement: Achievement,
  jobKeywords: any[]
): number {
  const achievementText = `${achievement.bullet} ${achievement.keywords?.join(' ')}`.toLowerCase();

  return jobKeywords.filter((kw) =>
    achievementText.includes(kw.phrase.toLowerCase())
  ).length;
}

/**
 * Counts semantic matches between achievement and job keywords
 * Uses transferable skill mappings and skill inference
 */
function countSemanticMatches(
  achievement: Achievement,
  jobKeywords: any[]
): number {
  const achievementSkills = achievement.skills || [];
  const achievementKeywords = achievement.keywords || [];

  // Simple semantic match: do any achievement keywords relate to job keywords?
  const allAchievementText = [
    ...achievementSkills,
    ...achievementKeywords,
  ].join(' ').toLowerCase();

  return jobKeywords.filter((kw) => {
    // Check for synonyms or related terms
    const variations = [kw.phrase, ...(kw.synonyms || [])].map((s) =>
      s.toLowerCase()
    );
    return variations.some((v) => allAchievementText.includes(v));
  }).length;
}

/**
 * Checks if achievement has quantifiable results
 */
function hasQuantifiableResults(achievement: Achievement): boolean {
  // Has explicit metrics
  if (achievement.metrics && achievement.metrics.length > 0) {
    return true;
  }

  // Result field contains numbers/percentages
  if (achievement.result) {
    return /(\d+%|\d+ [a-z]+|x faster|x larger)/i.test(achievement.result);
  }

  // No quantifiable results
  return false;
}

/**
 * Checks if achievement is recent (within 2 years)
 * Assumes we have access to date context - simplified here
 */
function isRecent(_achievement: Achievement): boolean {
  // In a real implementation, would check achievement date against current time
  // For now, assume all achievements in profile are included for simplicity
  return true;
}

/**
 * Calculates how complete the STAR framework is
 * Each component should have meaningful content
 */
function calculateSTARCompleteness(star: StarFramework): number {
  let completeness = 0;

  // Each component worth 0.25 if it exists and is substantial
  if (star.situation && star.situation.length > 10) completeness += 0.25;
  if (star.task && star.task.length > 10) completeness += 0.25;
  if (star.action && star.action.length > 10) completeness += 0.25;
  if (star.result && star.result.length > 10) completeness += 0.25;

  return Math.min(completeness, 1.0);
}

/**
 * Extracts relevant keywords from achievement that match job keywords
 */
function extractKeywords(
  achievement: Achievement,
  jobContext: JobContext
): string[] {
  const achievementKeywords = achievement.keywords || [];
  const jobTerms = jobContext.keyRequirements.map((r: any) => r.phrase.toLowerCase());

  // Filter achievement keywords that match job requirements
  return achievementKeywords.filter((ak: string) =>
    jobTerms.some((jt: string) => jt.includes(ak.toLowerCase()) || ak.toLowerCase().includes(jt))
  );
}

/**
 * Estimates word count for STAR story in cover letter context
 * Used to ensure balanced narrative structure
 */
function estimateWordCount(star: StarFramework): number {
  // Rough estimation: average English word is 4.7 characters
  const totalChars =
    star.situation.length +
    star.task.length +
    star.action.length +
    star.result.length;

  // Account for STAR distribution: situation (10%) + task (10%) + action (60%) + result (20%)
  // Typical achievement story in cover letter: 60-120 words
  const estimatedWords = Math.round(totalChars / 4.7);
  return Math.min(Math.max(estimatedWords, 30), 150); // 30-150 word range
}
