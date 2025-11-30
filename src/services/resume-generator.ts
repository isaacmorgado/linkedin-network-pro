/**
 * Resume Generator Service
 * Orchestrates all components to generate tailored resumes without hallucination
 */

import type {
  UserProfile,
  JobRequirements,
  TailoredResume,
  ResumeGenerationConfig,
  TailoredSection,
  SkillsSection,
  ResumeHeader,
  WorkExperience,
  Project,
  MatchReport,
} from '../types/resume-tailoring';
import { matchUserToJob } from './resume-matcher';
import { rewriteBulletsBatch } from './bullet-rewriter/index';
import { log, LogCategory } from '../utils/logger';
import { extractKeywordsFromJobDescription } from './keyword-extractor';

/**
 * Generate a tailored resume for a specific job
 * This is the main entry point that orchestrates all components
 */
export async function generateTailoredResume(
  profile: UserProfile,
  jobDescription: string,
  config?: Partial<ResumeGenerationConfig>
): Promise<TailoredResume> {
  const endTrace = log.trace(LogCategory.SERVICE, 'generateTailoredResume', {
    profileName: profile.name,
    jobDescriptionLength: jobDescription.length,
  });

  try {
    log.info(LogCategory.SERVICE, 'Starting resume generation', {
      name: profile.name,
      experienceCount: profile.workExperience.length,
      projectsCount: profile.projects.length,
    });

    // Step 1: Extract job requirements
    log.debug(LogCategory.SERVICE, 'Extracting job requirements');
    const extractedKeywords = extractKeywordsFromJobDescription(jobDescription);

    const jobRequirements: JobRequirements = {
      required: extractedKeywords.filter(k => k.required),
      preferred: extractedKeywords.filter(k => !k.required),
    };

    log.info(LogCategory.SERVICE, 'Job requirements extracted', {
      requiredCount: jobRequirements.required.length,
      preferredCount: jobRequirements.preferred.length,
    });

    // Step 2: Match user to job
    log.debug(LogCategory.SERVICE, 'Matching user profile to job requirements');
    const matchReport = matchUserToJob(profile, jobRequirements);

    log.info(LogCategory.SERVICE, 'Matching complete', {
      matchScore: matchReport.matchScore,
      matchedCount: matchReport.matches.length,
      missingCount: matchReport.missing.length,
    });

    // Step 3: Determine strategy based on user profile
    const strategy = determineStrategy(profile);
    log.debug(LogCategory.SERVICE, `Using strategy: ${strategy}`);

    // Step 4: Select and prioritize relevant experience
    const { relevantExperience, relevantProjects } = selectRelevantExperience(
      profile,
      matchReport,
      strategy
    );

    log.debug(LogCategory.SERVICE, 'Selected relevant experience', {
      experienceCount: relevantExperience.length,
      projectsCount: relevantProjects.length,
    });

    // Step 5: Get top keywords to target
    const targetKeywords = getTopKeywords(jobRequirements, 15);

    log.debug(LogCategory.SERVICE, 'Target keywords selected', {
      count: targetKeywords.length,
      keywords: targetKeywords.slice(0, 5),
    });

    // Step 6: Rewrite experience bullets
    log.debug(LogCategory.SERVICE, 'Rewriting experience bullets');
    const tailoredExperience = await rewriteExperienceSections(
      relevantExperience,
      targetKeywords,
      config
    );

    log.info(LogCategory.SERVICE, 'Experience bullets rewritten', {
      sectionsCount: tailoredExperience.length,
      totalBullets: tailoredExperience.reduce((sum, section) => sum + section.bullets.length, 0),
    });

    // Step 7: Rewrite project bullets (if applicable)
    let tailoredProjects: TailoredSection[] | undefined;
    if (relevantProjects.length > 0) {
      log.debug(LogCategory.SERVICE, 'Rewriting project bullets');
      tailoredProjects = await rewriteProjectSections(
        relevantProjects,
        targetKeywords,
        config
      );
    }

    // Step 8: Generate optimized skills section
    const skillsSection = generateSkillsSection(profile, matchReport);

    // Step 9: Generate professional summary
    const summary = generateSummary(profile, matchReport, jobRequirements);

    // Step 10: Calculate ATS score
    const atsScore = calculateATSScore(
      {
        experience: tailoredExperience,
        projects: tailoredProjects,
        skills: skillsSection,
      },
      jobRequirements
    );

    log.info(LogCategory.SERVICE, 'Resume generation complete', {
      atsScore,
      matchScore: matchReport.matchScore,
    });

    // Assemble final resume
    const resume: TailoredResume = {
      header: generateHeader(profile),
      summary,
      experience: tailoredExperience,
      projects: tailoredProjects,
      education: profile.education,
      skills: skillsSection,
      certifications: profile.certifications,
      matchReport,
      atsScore,
    };

    endTrace(resume);
    return resume;
  } catch (error) {
    log.error(LogCategory.SERVICE, 'Resume generation failed', error as Error);
    endTrace();
    throw error;
  }
}

/**
 * Determine the best strategy based on user profile
 */
function determineStrategy(profile: UserProfile): 'student' | 'career-changer' | 'professional' {
  const { careerStage, totalYearsExperience } = profile.metadata;

  if (careerStage === 'student') {
    return 'student';
  }

  if (careerStage === 'career-changer') {
    return 'career-changer';
  }

  if (totalYearsExperience < 2) {
    return 'student'; // Treat like student
  }

  return 'professional';
}

/**
 * Select most relevant experience and projects
 */
function selectRelevantExperience(
  profile: UserProfile,
  _matchReport: MatchReport,
  strategy: 'student' | 'career-changer' | 'professional'
) {
  // For students: prioritize projects, include all experience
  if (strategy === 'student') {
    return {
      relevantExperience: profile.workExperience,
      relevantProjects: profile.projects.filter(p => p.achievements.length > 0),
    };
  }

  // For career changers: include all experience (for transferable skills)
  if (strategy === 'career-changer') {
    return {
      relevantExperience: profile.workExperience,
      relevantProjects: profile.projects.slice(0, 2), // Include top 2 projects
    };
  }

  // For professionals: prioritize most recent and relevant
  const relevantExperience = profile.workExperience
    .slice(0, 5) // Last 5 positions
    .filter(exp => exp.achievements.length > 0);

  return {
    relevantExperience,
    relevantProjects: [], // Don't include projects for experienced professionals
  };
}

/**
 * Get top keywords to target in rewrites
 */
function getTopKeywords(requirements: JobRequirements, count: number): string[] {
  // Prioritize required keywords over preferred
  const required = requirements.required.map(k => k.phrase);
  const preferred = requirements.preferred.map(k => k.phrase);

  const allKeywords = [
    ...required,
    ...preferred.filter(k => !required.includes(k)), // Avoid duplicates
  ];

  return allKeywords.slice(0, count);
}

/**
 * Rewrite work experience sections
 */
async function rewriteExperienceSections(
  experiences: WorkExperience[],
  targetKeywords: string[],
  config?: Partial<ResumeGenerationConfig>
): Promise<TailoredSection[]> {
  const tailored: TailoredSection[] = [];

  for (const exp of experiences) {
    log.debug(LogCategory.SERVICE, `Rewriting bullets for ${exp.company}`, {
      achievementCount: exp.achievements.length,
    });

    // Rewrite all bullets for this experience
    const rewrittenBullets = await rewriteBulletsBatch(
      exp.achievements,
      targetKeywords,
      {
        targetKeywords,
        maxKeywordsPerBullet: config?.maxKeywordsPerBullet ?? 3,
        tone: config?.tone ?? 'professional',
        allowImpliedKeywords: true,
      }
    );

    // Use rewritten bullets (only if verified)
    const bullets = rewrittenBullets.map((rb: any, idx: number) => {
      if (rb.factVerification.allFactsPreserved) {
        log.debug(LogCategory.SERVICE, `Using rewritten bullet for ${exp.company}`, {
          keywordsAdded: rb.keywordsAdded,
        });
        return rb.rewritten;
      } else {
        log.warn(LogCategory.SERVICE, `Hallucination detected, using original for ${exp.company}`, {
          addedFacts: rb.factVerification.addedFacts,
        });
        return exp.achievements[idx].bullet; // Fallback to original
      }
    });

    tailored.push({
      company: exp.company,
      title: exp.title,
      startDate: exp.startDate,
      endDate: exp.endDate,
      location: exp.location,
      bullets,
      originalBullets: exp.achievements.map((a: any) => a.bullet),
      changes: rewrittenBullets,
    });
  }

  return tailored;
}

/**
 * Rewrite project sections
 */
async function rewriteProjectSections(
  projects: Project[],
  targetKeywords: string[],
  config?: Partial<ResumeGenerationConfig>
): Promise<TailoredSection[]> {
  const tailored: TailoredSection[] = [];

  for (const project of projects) {
    log.debug(LogCategory.SERVICE, `Rewriting bullets for project: ${project.name}`, {
      achievementCount: project.achievements.length,
    });

    const rewrittenBullets = await rewriteBulletsBatch(
      project.achievements,
      targetKeywords,
      {
        targetKeywords,
        maxKeywordsPerBullet: config?.maxKeywordsPerBullet ?? 3,
        tone: config?.tone ?? 'technical', // More technical for projects
        allowImpliedKeywords: true,
      }
    );

    const bullets = rewrittenBullets.map((rb: any, idx: number) => {
      return rb.factVerification.allFactsPreserved
        ? rb.rewritten
        : project.achievements[idx].bullet;
    });

    tailored.push({
      company: project.name, // Use project name as "company"
      title: 'Personal Project', // Generic title
      startDate: project.startDate ?? '',
      endDate: project.endDate ?? null,
      bullets,
      originalBullets: project.achievements.map((a: any) => a.bullet),
      changes: rewrittenBullets,
    });
  }

  return tailored;
}

/**
 * Generate optimized skills section
 */
function generateSkillsSection(
  profile: UserProfile,
  matchReport: MatchReport
): SkillsSection {
  // Get all matched skills
  const matchedSkills = new Set(
    matchReport.matches.map((m: any) => m.requirement.phrase)
  );

  // Categorize user's skills
  const categorized: SkillsSection = {};

  for (const skill of profile.skills) {
    // Prioritize matched skills
    const isMatched = matchedSkills.has(skill.name);
    const cat = skill.category ?? 'Other';

    if (!categorized[cat]) {
      categorized[cat] = [];
    }

    // Add to category (matched skills first)
    if (isMatched) {
      categorized[cat].unshift(skill.name);
    } else {
      categorized[cat].push(skill.name);
    }
  }

  // Limit to top skills per category
  for (const category in categorized) {
    categorized[category] = categorized[category].slice(0, 8);
  }

  return categorized;
}

/**
 * Generate professional summary
 */
function generateSummary(
  profile: UserProfile,
  matchReport: MatchReport,
  _requirements: JobRequirements
): string {
  const { title, metadata } = profile;
  const { matchScore, directMatches } = matchReport;

  // Get top matched skills
  const topSkills = directMatches
    .slice(0, 3)
    .map((m: any) => m.requirement.phrase)
    .join(', ');

  // Build summary based on career stage
  const { careerStage, totalYearsExperience, domains } = metadata;

  if (careerStage === 'student') {
    return `${title} with hands-on experience in ${topSkills}. Proven ability to deliver impactful projects in ${domains[0] ?? 'software development'}. ${matchScore >= 0.7 ? 'Strong alignment with role requirements.' : 'Eager to learn and grow in this role.'}`;
  }

  if (careerStage === 'career-changer') {
    return `${title} transitioning to ${domains[0] ?? 'new field'} with transferable skills in ${topSkills}. ${totalYearsExperience} years of professional experience with proven track record of ${matchScore >= 0.7 ? 'adaptability and' : ''} problem-solving.`;
  }

  // Professional
  return `${title} with ${totalYearsExperience}+ years of experience in ${domains.join(' and ')}. Expertise in ${topSkills}. Proven track record of delivering high-impact solutions in ${domains[0]}.`;
}

/**
 * Generate resume header
 */
function generateHeader(profile: UserProfile): ResumeHeader {
  return {
    name: profile.name,
    title: profile.title,
    email: profile.email,
    phone: profile.phone,
    location: profile.location,
  };
}

/**
 * Calculate ATS optimization score
 */
function calculateATSScore(
  resume: {
    experience: TailoredSection[];
    projects?: TailoredSection[];
    skills: SkillsSection;
  },
  requirements: JobRequirements
): number {
  let score = 0;

  // Extract all text from resume
  const allText = [
    ...resume.experience.flatMap(exp => exp.bullets),
    ...(resume.projects?.flatMap(proj => proj.bullets) ?? []),
    ...Object.values(resume.skills).flat(),
  ].join(' ').toLowerCase();

  // Check keyword coverage
  const requiredKeywords = requirements.required.map(k => k.phrase.toLowerCase());
  const preferredKeywords = requirements.preferred.map(k => k.phrase.toLowerCase());

  const requiredFound = requiredKeywords.filter(kw =>
    allText.includes(kw.toLowerCase())
  ).length;

  const preferredFound = preferredKeywords.filter(kw =>
    allText.includes(kw.toLowerCase())
  ).length;

  // Required keywords: worth 70 points
  const requiredScore = (requiredFound / Math.max(requiredKeywords.length, 1)) * 70;

  // Preferred keywords: worth 30 points
  const preferredScore = (preferredFound / Math.max(preferredKeywords.length, 1)) * 30;

  score = Math.round(requiredScore + preferredScore);

  log.debug(LogCategory.SERVICE, 'ATS score calculated', {
    score,
    requiredFound,
    requiredTotal: requiredKeywords.length,
    preferredFound,
    preferredTotal: preferredKeywords.length,
  });

  return Math.min(100, score);
}

/**
 * Parse job description and generate resume in one call
 */
export async function quickGenerateTailoredResume(
  profile: UserProfile,
  jobDescription: string
): Promise<TailoredResume> {
  return generateTailoredResume(profile, jobDescription, {
    allowHallucination: false,
    preserveFacts: true,
    maxKeywordsPerBullet: 3,
    tone: 'professional',
    targetMatchScore: 0.8,
    strategy: profile.metadata.careerStage,
  });
}
