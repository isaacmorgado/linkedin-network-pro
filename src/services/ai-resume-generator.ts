/**
 * AI Resume Generator Service
 * Uses Claude API to generate custom, ATS-optimized resumes
 */

import type {
  JobDescriptionAnalysis,
  ProfessionalProfile,
  GeneratedResume,
  ResumeContent,
  ResumeSectionItem,
} from '../types/resume';
import { calculateATSScore } from './ats-optimizer';

/**
 * Generate a custom resume tailored to a specific job
 * Uses Claude API for intelligent content generation
 */
export async function generateResumeWithAI(
  job: JobDescriptionAnalysis,
  profile: ProfessionalProfile
): Promise<GeneratedResume> {
  console.log('[Uproot] Generating resume for:', job.jobTitle, 'at', job.company);

  // Select most relevant experiences based on job requirements
  const relevantJobs = selectRelevantExperiences(profile, job);

  // Select matching skills
  const relevantSkills = selectRelevantSkills(profile, job);

  // Generate professional summary (AI-powered)
  const professionalSummary = await generateProfessionalSummary(profile, job);

  // Build resume content
  const content = buildResumeContent(
    profile,
    relevantJobs,
    relevantSkills,
    professionalSummary
  );

  // Calculate ATS optimization score
  const atsOptimization = calculateATSScore(
    content.formattedText || '',
    job.extractedKeywords.map((k) => k.term),
    job.extractedKeywords.map((k) => k.term)
  );

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
  return resume;
}

/**
 * Select most relevant job experiences based on keyword matching
 */
function selectRelevantExperiences(
  profile: ProfessionalProfile,
  job: JobDescriptionAnalysis
): ProfessionalProfile['jobs'] {
  const jobKeywords = job.extractedKeywords.map((k) => k.term.toLowerCase());

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
  return scoredJobs
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map((item) => item.job);
}

/**
 * Select most relevant skills based on job requirements
 */
function selectRelevantSkills(
  profile: ProfessionalProfile,
  job: JobDescriptionAnalysis
): ProfessionalProfile['technicalSkills'] {
  const jobKeywords = job.extractedKeywords.map((k) => k.term.toLowerCase());
  const allSkills = [...profile.technicalSkills, ...profile.softSkills];

  // Filter skills that match job keywords
  const matchingSkills = allSkills.filter((skill) => {
    const skillName = skill.name.toLowerCase();
    return jobKeywords.some(
      (k) => k.includes(skillName) || skillName.includes(k) || skill.synonyms?.some((s) => k.includes(s.toLowerCase()))
    );
  });

  // Sort by proficiency and return top 15
  return matchingSkills
    .sort((a, b) => {
      const proficiencyOrder = { expert: 4, advanced: 3, intermediate: 2, beginner: 1 };
      return proficiencyOrder[b.proficiency] - proficiencyOrder[a.proficiency];
    })
    .slice(0, 15);
}

/**
 * Generate a custom professional summary for the job
 * This would use Claude API in production
 */
async function generateProfessionalSummary(
  profile: ProfessionalProfile,
  job: JobDescriptionAnalysis
): Promise<string> {
  // In production, this would call Claude API
  // For now, generate a template-based summary

  const yearsExp = calculateYearsOfExperience(profile);
  const topSkills = profile.technicalSkills
    .slice(0, 3)
    .map((s) => s.name)
    .join(', ');

  const requiredSkills = job.requiredSkills.slice(0, 3).join(', ');

  // Template-based generation (would be Claude AI in production)
  const summary = `Results-driven professional with ${yearsExp}+ years of experience in ${topSkills}. Proven track record of delivering high-impact solutions and driving innovation. Expertise in ${requiredSkills}, with a strong focus on scalability and performance. Passionate about leveraging cutting-edge technologies to solve complex business challenges and exceed organizational goals.`;

  return summary;

  /* Production version with Claude API:

  const prompt = `Generate a professional summary for a resume tailored to this job:

Job Title: ${job.jobTitle}
Company: ${job.company}

Required Skills: ${job.requiredSkills.join(', ')}
Preferred Skills: ${job.preferredSkills.join(', ')}

Candidate Profile:
- Years of Experience: ${yearsExp}
- Technical Skills: ${profile.technicalSkills.map(s => s.name).join(', ')}
- Recent Jobs: ${profile.jobs.slice(0, 2).map(j => `${j.title} at ${j.company}`).join('; ')}

Write a compelling 2-3 sentence professional summary that:
1. Highlights relevant experience matching the job requirements
2. Emphasizes matching skills and technologies
3. Uses strong action words
4. Includes quantifiable achievements if possible
5. Is ATS-optimized with keywords

Professional Summary:`;

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': CLAUDE_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 300,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    }),
  });

  const data = await response.json();
  return data.content[0].text.trim();
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
  const skillsContent = selectedSkills.map((s) => s.name).join(' • ');
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
  const formattedText = formatResumeAsText(profile, sections);

  return {
    sections,
    formattedText,
  };
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
  // This would be implemented in storage.ts
  return [];
}

/**
 * Save generated resume to storage
 */
export async function saveGeneratedResume(resume: GeneratedResume): Promise<void> {
  // This would be implemented in storage.ts
  console.log('[Uproot] Saving generated resume:', resume.id);
}
