/**
 * AI Resume Generator Service
 * Uses Claude API to generate custom, ATS-optimized resumes
 */

import Anthropic from '@anthropic-ai/sdk';
import type {
  JobDescriptionAnalysis,
  ProfessionalProfile,
  GeneratedResume,
  ResumeContent,
  ResumeSectionItem,
} from '../types/resume';
import { calculateATSScore } from './ats-optimizer';
import { log, LogCategory } from '../utils/logger';

/**
 * Generate a custom resume tailored to a specific job
 * Uses Claude API for intelligent content generation
 */
export async function generateResumeWithAI(
  job: JobDescriptionAnalysis,
  profile: ProfessionalProfile
): Promise<GeneratedResume> {
  return log.trackAsync(LogCategory.SERVICE, 'generateResumeWithAI', async () => {
    console.log('[Uproot] Generating resume for:', job.jobTitle, 'at', job.company);
    log.debug(LogCategory.SERVICE, 'Starting resume generation', {
      jobTitle: job.jobTitle,
      company: job.company,
      jobKeywords: job.extractedKeywords.length,
      profileJobs: profile.jobs.length,
      profileSkills: profile.technicalSkills.length,
    });

    // Select most relevant experiences based on job requirements
    log.debug(LogCategory.SERVICE, 'Selecting relevant experiences');
    const relevantJobs = selectRelevantExperiences(profile, job);
    log.info(LogCategory.SERVICE, `Selected ${relevantJobs.length} most relevant experiences`);

    // Select matching skills
    log.debug(LogCategory.SERVICE, 'Selecting matching skills');
    const relevantSkills = selectRelevantSkills(profile, job);
    log.info(LogCategory.SERVICE, `Selected ${relevantSkills.length} matching skills`);

    // Generate professional summary (AI-powered)
    log.debug(LogCategory.SERVICE, 'Generating professional summary');
    const professionalSummary = await generateProfessionalSummary(profile, job);
    log.info(LogCategory.SERVICE, 'Professional summary generated', { length: professionalSummary.length });

    // Build resume content
    log.debug(LogCategory.SERVICE, 'Building resume content');
    const content = buildResumeContent(
      profile,
      relevantJobs,
      relevantSkills,
      professionalSummary
    );
    log.info(LogCategory.SERVICE, 'Resume content built', { sections: content.sections.length });

    // Calculate ATS optimization score
    log.debug(LogCategory.SERVICE, 'Calculating ATS score');
    const atsOptimization = calculateATSScore(
      content.formattedText || '',
      job.extractedKeywords.map((k) => k.phrase),
      job.extractedKeywords.map((k) => k.phrase)
    );
    log.info(LogCategory.SERVICE, 'ATS score calculated', { score: atsOptimization.overallATSScore });

    const now = Date.now();
    const resume: GeneratedResume = {
      id: `resume_${now}`,
      jobDescriptionId: job.id,
      jobTitle: job.jobTitle,
      company: job.company,
      selectedExperiences: relevantJobs.map((j) => ({
        type: 'job',
        id: j.id,
        selectedBullets: j.bullets.map((b) => b.id),
        bulletOrder: j.bullets.map((_, i) => i),
      })),
      selectedSkills: relevantSkills.map((s) => s.id),
      selectedProjects: [],
      selectedEducation: profile.education.map((e) => e.id),
      professionalSummary,
      content,
      atsOptimization,
      generatedAt: now,
      version: 1,
    };

    console.log('[Uproot] Resume generated with ATS score:', atsOptimization.overallATSScore);
    log.info(LogCategory.SERVICE, 'Resume generation completed successfully', {
      resumeId: resume.id,
      atsScore: atsOptimization.overallATSScore,
      experiencesSelected: relevantJobs.length,
      skillsSelected: relevantSkills.length,
    });
    return resume;
  });
}

/**
 * Select most relevant job experiences based on keyword matching
 */
function selectRelevantExperiences(
  profile: ProfessionalProfile,
  job: JobDescriptionAnalysis
): ProfessionalProfile['jobs'] {
  const endTrace = log.trace(LogCategory.SERVICE, 'selectRelevantExperiences', {
    totalJobs: profile.jobs.length,
    jobKeywords: job.extractedKeywords.length,
  });

  try {
    const jobKeywords = job.extractedKeywords.map((k) => k.phrase.toLowerCase());
    log.debug(LogCategory.SERVICE, 'Scoring experiences against job keywords', {
      keywordsToMatch: jobKeywords.length,
    });

    // Score each job by keyword relevance
    const scoredJobs = profile.jobs.map((jobExp) => {
      let score = 0;

      // Check technologies used
      for (const tech of jobExp.technologies) {
        if (jobKeywords.some((k) => k.includes(tech.toLowerCase()) || tech.toLowerCase().includes(k))) {
          score += 10;
        }
      }

      // Check bullet keywords
      for (const bullet of jobExp.bullets) {
        for (const keyword of bullet.keywords) {
          if (jobKeywords.some((k) => k.includes(keyword.toLowerCase()))) {
            score += 5;
          }
        }
      }

      // Prefer recent jobs
      if (jobExp.current) {
        score += 20;
      }

      return { job: jobExp, score };
    });

    // Sort by score and take top 3
    const selected = scoredJobs
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .map((item) => item.job);

    log.info(LogCategory.SERVICE, 'Selected most relevant experiences', {
      selectedCount: selected.length,
      topScores: scoredJobs.slice(0, 3).map((s) => ({ title: s.job.title, score: s.score })),
    });

    endTrace(selected);
    return selected;
  } catch (error) {
    log.error(LogCategory.SERVICE, 'Experience selection failed', error as Error);
    endTrace();
    throw error;
  }
}

/**
 * Select most relevant skills based on job requirements
 */
function selectRelevantSkills(
  profile: ProfessionalProfile,
  job: JobDescriptionAnalysis
): ProfessionalProfile['technicalSkills'] {
  const endTrace = log.trace(LogCategory.SERVICE, 'selectRelevantSkills', {
    technicalSkills: profile.technicalSkills.length,
    softSkills: profile.softSkills.length,
    jobKeywords: job.extractedKeywords.length,
  });

  try {
    const jobKeywords = job.extractedKeywords.map((k) => k.phrase.toLowerCase());
    const allSkills = [...profile.technicalSkills, ...profile.softSkills];
    log.debug(LogCategory.SERVICE, 'Matching skills against job keywords', {
      totalSkills: allSkills.length,
    });

    // Filter skills that match job keywords
    const matchingSkills = allSkills.filter((skill) => {
      if (!skill || !skill.name) return false;
      const skillName = skill.name.toLowerCase();
      return jobKeywords.some(
        (k) => k.includes(skillName) || skillName.includes(k) || skill.synonyms?.some((s) => k.includes(s.toLowerCase()))
      );
    });

    log.debug(LogCategory.SERVICE, `Found ${matchingSkills.length} matching skills, sorting by proficiency`);

    // Sort by proficiency and return top 15
    const selected = matchingSkills
      .sort((a, b) => {
        const proficiencyOrder = { expert: 4, advanced: 3, intermediate: 2, beginner: 1 };
        return proficiencyOrder[b.proficiency] - proficiencyOrder[a.proficiency];
      })
      .slice(0, 15);

    log.info(LogCategory.SERVICE, 'Selected most relevant skills', {
      matchingCount: matchingSkills.length,
      selectedCount: selected.length,
      topSkills: selected.slice(0, 5).filter((s) => s && s.name).map((s) => s.name),
    });

    endTrace(selected);
    return selected;
  } catch (error) {
    log.error(LogCategory.SERVICE, 'Skill selection failed', error as Error);
    endTrace();
    throw error;
  }
}

/**
 * Generate a custom professional summary for the job
 * This would use Claude API in production
 */
async function generateProfessionalSummary(
  profile: ProfessionalProfile,
  job: JobDescriptionAnalysis
): Promise<string> {
  return log.trackAsync(LogCategory.SERVICE, 'generateProfessionalSummary', async () => {
    // Initialize Anthropic client
    const apiKey = process.env.VITE_ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error('VITE_ANTHROPIC_API_KEY environment variable not set');
    }

    const anthropic = new Anthropic({ apiKey });

    const yearsExp = calculateYearsOfExperience(profile);
    const topSkills = profile.technicalSkills
      .slice(0, 3)
      .filter((s) => s && s.name)
      .map((s) => s.name)
      .join(', ');

    const requiredSkills = job.requiredSkills.slice(0, 3).join(', ');
    const recentJobs = profile.jobs
      .slice(0, 2)
      .map(j => `${j.title} at ${j.company}`)
      .join('; ');

    const prompt = `STRICT RULES:
1. DO NOT invent experiences, achievements, or skills not provided
2. ONLY use facts from the candidate profile below
3. DO keep it 2-3 sentences maximum
4. DO emphasize matching skills from job requirements
5. DO use strong action words
6. DO NOT add fake metrics, team sizes, or accomplishments

CANDIDATE PROFILE:
- Years of Experience: ${yearsExp}
- Technical Skills: ${topSkills}
- Recent Jobs: ${recentJobs}

JOB REQUIREMENTS:
- Job Title: ${job.jobTitle}
- Company: ${job.company}
- Required Skills: ${requiredSkills}
- Preferred Skills: ${job.preferredSkills.slice(0, 3).join(', ')}

Write a professional summary (2-3 sentences) that highlights relevant experience matching the job requirements. Use ATS-optimized keywords.

Begin:`;

    log.debug(LogCategory.SERVICE, 'Generating professional summary with Claude API', {
      jobTitle: job.jobTitle,
      requiredSkills: job.requiredSkills.length,
      yearsExperience: yearsExp,
    });

    const message = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 300,
      temperature: 0.4,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    const summary = message.content[0].type === 'text'
      ? message.content[0].text.trim()
      : '';

    log.info(LogCategory.SERVICE, 'Professional summary generated', {
      summaryLength: summary.length,
      wordCount: summary.split(/\s+/).length,
    });

    return summary;
  });

  /* Template-based fallback (if API key not available):

  const yearsExp = calculateYearsOfExperience(profile);
  const topSkills = profile.technicalSkills
    .slice(0, 3)
    .filter((s) => s && s.name)
    .map((s) => s.name)
    .join(', ');

  const requiredSkills = job.requiredSkills.slice(0, 3).join(', ');

  const summary = `Results-driven professional with ${yearsExp}+ years of experience in ${topSkills}. Proven track record of delivering high-impact solutions and driving innovation. Expertise in ${requiredSkills}, with a strong focus on scalability and performance. Passionate about leveraging cutting-edge technologies to solve complex business challenges and exceed organizational goals.`;

  return summary;
  */
}

/**
 * Calculate years of experience
 */
function calculateYearsOfExperience(profile: ProfessionalProfile): number {
  if (profile.jobs.length === 0) return 0;

  let totalMonths = 0;

  for (const job of profile.jobs) {
    const startDate = parseDate(job.startDate);
    const endDate = job.endDate ? parseDate(job.endDate) : new Date();

    if (startDate && endDate) {
      const months = Math.max(
        0,
        (endDate.getFullYear() - startDate.getFullYear()) * 12 +
          (endDate.getMonth() - startDate.getMonth())
      );
      totalMonths += months;
    }
  }

  return Math.round(totalMonths / 12);
}

/**
 * Parse date string in "YYYY-MM" format
 */
function parseDate(dateStr: string): Date | null {
  const match = dateStr.match(/^(\d{4})-(\d{2})$/);
  if (!match) return null;

  const year = parseInt(match[1]);
  const month = parseInt(match[2]) - 1;

  return new Date(year, month, 1);
}

/**
 * Build formatted resume content
 */
function buildResumeContent(
  profile: ProfessionalProfile,
  selectedJobs: ProfessionalProfile['jobs'],
  selectedSkills: ProfessionalProfile['technicalSkills'],
  professionalSummary: string
): ResumeContent {
  const endTrace = log.trace(LogCategory.SERVICE, 'buildResumeContent', {
    selectedJobs: selectedJobs.length,
    selectedSkills: selectedSkills.length,
    educationItems: profile.education.length,
  });

  try {
    log.debug(LogCategory.SERVICE, 'Building resume sections');
    const sections: ResumeContent['sections'] = [];

  // Professional Summary
  sections.push({
    type: 'summary',
    title: 'Professional Summary',
    content: professionalSummary,
    order: 0,
  });

  // Work Experience
  const experienceItems: ResumeSectionItem[] = selectedJobs.map((job) => ({
    title: job.title,
    subtitle: job.company,
    location: job.location,
    dates: formatDateRange(job.startDate, job.endDate, job.current),
    bullets: job.bullets.slice(0, 4).map((b) => b.text),
  }));

  sections.push({
    type: 'experience',
    title: 'Professional Experience',
    content: experienceItems,
    order: 1,
  });

  // Skills
  const skillsContent = selectedSkills.filter((s) => s && s.name).map((s) => s.name).join(' • ');
  sections.push({
    type: 'skills',
    title: 'Technical Skills',
    content: skillsContent,
    order: 2,
  });

  // Education
  const educationItems: ResumeSectionItem[] = profile.education.map((edu) => ({
    title: `${edu.degree} in ${edu.field}`,
    subtitle: edu.institution,
    location: edu.location,
    dates: formatDateRange(edu.startDate, edu.endDate, edu.current),
    bullets: edu.honors || [],
  }));

  if (educationItems.length > 0) {
    sections.push({
      type: 'education',
      title: 'Education',
      content: educationItems,
      order: 3,
    });
  }

  // Generate formatted text
  log.debug(LogCategory.SERVICE, 'Formatting resume as plain text for ATS');
  const formattedText = formatResumeAsText(profile, sections);

  const content = {
    sections,
    formattedText,
  };

  log.info(LogCategory.SERVICE, 'Resume content built successfully', {
    totalSections: sections.length,
    textLength: formattedText?.length || 0,
    wordCount: formattedText ? formattedText.split(/\s+/).length : 0,
  });

  endTrace(content);
  return content;
  } catch (error) {
    log.error(LogCategory.SERVICE, 'Resume content building failed', error as Error);
    endTrace();
    throw error;
  }
}

/**
 * Format date range as string
 */
function formatDateRange(start: string, end?: string, current?: boolean): string {
  const formatDate = (dateStr: string) => {
    const date = parseDate(dateStr);
    if (!date) return dateStr;
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  };

  const startFormatted = formatDate(start);
  const endFormatted = current ? 'Present' : end ? formatDate(end) : 'Present';

  return `${startFormatted} - ${endFormatted}`;
}

/**
 * Format resume as plain text for ATS parsing
 */
function formatResumeAsText(
  profile: ProfessionalProfile,
  sections: ResumeContent['sections']
): string {
  let text = '';

  // Header
  text += `${profile.personalInfo.fullName}\n`;
  if (profile.personalInfo.email) text += `${profile.personalInfo.email}\n`;
  if (profile.personalInfo.phone) text += `${profile.personalInfo.phone}\n`;
  if (profile.personalInfo.location) text += `${profile.personalInfo.location}\n`;
  if (profile.personalInfo.linkedinUrl) text += `${profile.personalInfo.linkedinUrl}\n`;
  text += '\n';

  // Sections
  for (const section of sections.sort((a, b) => a.order - b.order)) {
    text += `${section.title.toUpperCase()}\n`;
    text += '─'.repeat(50) + '\n\n';

    if (typeof section.content === 'string') {
      text += `${section.content}\n\n`;
    } else {
      // Array of items
      for (const item of section.content) {
        text += `${item.title}\n`;
        if (item.subtitle) text += `${item.subtitle}`;
        if (item.location) text += ` | ${item.location}`;
        if (item.dates) text += ` | ${item.dates}`;
        text += '\n';

        if (item.bullets && item.bullets.length > 0) {
          for (const bullet of item.bullets) {
            text += `• ${bullet}\n`;
          }
        }

        text += '\n';
      }
    }
  }

  return text;
}

/**
 * Get generated resumes from storage
 */
export async function getGeneratedResumes(): Promise<GeneratedResume[]> {
  return log.trackAsync(LogCategory.SERVICE, 'getGeneratedResumes', async () => {
    log.debug(LogCategory.SERVICE, 'Fetching generated resumes from storage');
    // This would be implemented in storage.ts
    const resumes: GeneratedResume[] = [];
    log.info(LogCategory.SERVICE, 'Retrieved generated resumes', { count: resumes.length });
    return resumes;
  });
}

/**
 * Save generated resume to storage
 */
export async function saveGeneratedResume(resume: GeneratedResume): Promise<void> {
  return log.trackAsync(LogCategory.SERVICE, 'saveGeneratedResume', async () => {
    console.log('[Uproot] Saving generated resume:', resume.id);
    log.debug(LogCategory.SERVICE, 'Saving generated resume', {
      resumeId: resume.id,
      jobTitle: resume.jobTitle,
      company: resume.company,
      atsScore: resume.atsOptimization.overallATSScore,
    });
    // This would be implemented in storage.ts
    log.info(LogCategory.SERVICE, 'Resume saved successfully', { resumeId: resume.id });
  });
}
