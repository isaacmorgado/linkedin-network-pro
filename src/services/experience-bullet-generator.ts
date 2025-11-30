/**
 * Experience Bullet Generator Service
 * Uses Claude API to generate tailored job experience bullet points
 * based on job description and user's professional profile
 */

import Anthropic from '@anthropic-ai/sdk';
import type { ProfessionalProfile, JobExperience } from '../types/resume';
import { log, LogCategory } from '../utils/logger';

/**
 * Generated bullet points for a specific job
 */
export interface GeneratedBullets {
  jobTitle: string;
  company: string;
  bullets: string[];  // 3-5 tailored bullet points
}

/**
 * Generate tailored experience bullet points for job applications
 *
 * @param jobDescription - The full job posting text
 * @param profile - User's professional profile from storage
 * @param targetJobIndex - Optional: generate bullets for specific job (default: all jobs)
 * @returns Array of generated bullets for each relevant job
 */
export async function generateExperienceBullets(
  jobDescription: string,
  profile: ProfessionalProfile,
  targetJobIndex?: number
): Promise<GeneratedBullets[]> {
  return log.trackAsync(LogCategory.SERVICE, 'generateExperienceBullets', async () => {
    console.log('[Uproot] Generating experience bullets for job description');
    log.debug(LogCategory.SERVICE, 'Starting bullet generation', {
      targetJobIndex,
      totalJobs: profile.jobs.length,
      descriptionLength: jobDescription.length,
    });

    try {
      // Initialize Anthropic client
      const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY;
      if (!apiKey) {
        log.error(LogCategory.SERVICE, 'VITE_ANTHROPIC_API_KEY not set, using fallback');
        return generateFallbackBullets(profile, targetJobIndex);
      }

      const anthropic = new Anthropic({
        apiKey,
        dangerouslyAllowBrowser: true,
      });

      // Select jobs to process
      const jobsToProcess = selectJobsToProcess(profile.jobs, targetJobIndex);
      log.info(LogCategory.SERVICE, `Processing ${jobsToProcess.length} jobs`);

      // Extract key skills from job description
      const topSkills = extractTopSkillsFromJobDescription(jobDescription);
      log.debug(LogCategory.SERVICE, 'Extracted top skills from job description', {
        skillCount: topSkills.length,
        skills: topSkills,
      });

      // Build prompt for Claude
      const prompt = buildPrompt(jobDescription, profile, jobsToProcess, topSkills);
      log.debug(LogCategory.SERVICE, 'Built prompt for Claude API', {
        promptLength: prompt.length,
      });

      // Call Claude API
      log.debug(LogCategory.SERVICE, 'Calling Claude API for bullet generation');
      const message = await anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 800,
        temperature: 0.4,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      });

      const responseText = message.content[0].type === 'text'
        ? message.content[0].text.trim()
        : '';

      log.debug(LogCategory.SERVICE, 'Received Claude API response', {
        responseLength: responseText.length,
      });

      // Parse response
      const generatedBullets = parseClaudeResponse(responseText, jobsToProcess);
      log.info(LogCategory.SERVICE, 'Successfully generated experience bullets', {
        jobsProcessed: generatedBullets.length,
        totalBullets: generatedBullets.reduce((sum, j) => sum + j.bullets.length, 0),
      });

      return generatedBullets;
    } catch (error) {
      log.error(LogCategory.SERVICE, 'Bullet generation failed, using fallback', error as Error);
      console.error('[Uproot] Error generating bullets:', error);
      return generateFallbackBullets(profile, targetJobIndex);
    }
  });
}

/**
 * Select which jobs to process based on targetJobIndex
 */
function selectJobsToProcess(
  jobs: JobExperience[],
  targetJobIndex?: number
): JobExperience[] {
  if (targetJobIndex !== undefined && targetJobIndex >= 0 && targetJobIndex < jobs.length) {
    // Single job
    return [jobs[targetJobIndex]];
  }

  // Most recent 3 jobs by default
  return jobs.slice(0, 3);
}

/**
 * Extract top technical keywords from job description
 */
function extractTopSkillsFromJobDescription(jobDescription: string): string[] {
  const technicalKeywords = [
    // Languages
    'JavaScript', 'TypeScript', 'Python', 'Java', 'C\\+\\+', 'C#', 'Go', 'Rust', 'Ruby', 'PHP', 'Swift', 'Kotlin',
    // Frontend
    'React', 'Vue', 'Angular', 'Svelte', 'Next\\.js', 'Nuxt', 'HTML', 'CSS', 'Tailwind',
    // Backend
    'Node\\.js', 'Express', 'Django', 'Flask', 'Spring', 'Laravel', 'Rails',
    // Databases
    'PostgreSQL', 'MySQL', 'MongoDB', 'Redis', 'Elasticsearch', 'DynamoDB', 'SQL', 'NoSQL',
    // Cloud & DevOps
    'AWS', 'Azure', 'GCP', 'Docker', 'Kubernetes', 'CI/CD', 'Jenkins', 'GitHub Actions', 'Terraform',
    // Other
    'GraphQL', 'REST', 'API', 'Microservices', 'Agile', 'Scrum', 'Git', 'Testing', 'TDD',
  ];

  const skills: string[] = [];

  for (const keyword of technicalKeywords) {
    const regex = new RegExp(`\\b${keyword}\\b`, 'i');
    if (regex.test(jobDescription)) {
      skills.push(keyword.replace(/\\\\/g, '').replace(/\\\./g, '.'));
    }
  }

  return skills.slice(0, 7); // Top 7 skills
}

/**
 * Build the prompt for Claude API
 */
function buildPrompt(
  _jobDescription: string,
  _profile: ProfessionalProfile,
  jobs: JobExperience[],
  topSkills: string[]
): string {
  // Build job history section
  const jobHistorySection = jobs.map((job, index) => {
    const technologies = job.technologies.join(', ') || 'Not specified';
    const dates = formatJobDates(job);
    const currentTense = job.current ? '(current job - use present tense)' : '(use past tense)';

    return `Job ${index + 1}: ${job.title} at ${job.company} ${currentTense}
- Dates: ${dates}
- Technologies/Skills: ${technologies}
- Current bullets: ${job.bullets.slice(0, 3).map(b => b.text).join('\n  • ')}`;
  }).join('\n\n');

  return `STRICT RULES:
1. DO NOT invent achievements, metrics, or responsibilities not in the job history
2. ONLY use actual job titles, companies, and dates from the profile
3. DO reference skills/keywords from the job description when relevant
4. DO keep each bullet to 1-2 lines (120-150 characters max)
5. DO start with strong action verbs (Led, Developed, Implemented, Architected, etc.)
6. DO NOT add fake team sizes, project budgets, or percentage improvements
7. DO write in past tense for previous jobs, present tense for current job
8. DO use actual technologies/skills from their profile

JOB DESCRIPTION REQUIREMENTS:
Key skills/requirements: ${topSkills.length > 0 ? topSkills.join(', ') : 'General software engineering skills'}

USER'S JOB HISTORY:
${jobHistorySection}

TASK:
Generate 3-5 professional bullet points for EACH job that:
- Highlight relevant experience matching the job requirements above
- Use actual technologies/skills from their profile
- Are ATS-optimized with keywords from the job description
- Are truthful and fact-based
- Start with strong action verbs
- Are concise (120-150 characters each)

Format as JSON array:
[
  {
    "jobTitle": "Job Title",
    "company": "Company Name",
    "bullets": [
      "First bullet point...",
      "Second bullet point...",
      "Third bullet point..."
    ]
  }
]

Begin:`;
}

/**
 * Format job dates for display
 */
function formatJobDates(job: JobExperience): string {
  const start = job.startDate || 'Unknown';
  const end = job.current ? 'Present' : (job.endDate || 'Unknown');
  return `${start} - ${end}`;
}

/**
 * Parse Claude's JSON response
 */
function parseClaudeResponse(
  responseText: string,
  _jobs: JobExperience[]
): GeneratedBullets[] {
  try {
    // Try to extract JSON from response
    const jsonMatch = responseText.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      log.warn(LogCategory.SERVICE, 'No JSON array found in response');
      throw new Error('Invalid response format');
    }

    const parsed = JSON.parse(jsonMatch[0]) as GeneratedBullets[];

    // Validate structure
    if (!Array.isArray(parsed) || parsed.length === 0) {
      throw new Error('Response is not a valid array');
    }

    // Ensure each bullet is within character limit
    return parsed.map(job => ({
      ...job,
      bullets: job.bullets.map(bullet => {
        if (bullet.length > 150) {
          log.debug(LogCategory.SERVICE, 'Trimming bullet to 150 characters', {
            original: bullet.length,
          });
          return bullet.substring(0, 147) + '...';
        }
        return bullet;
      }),
    }));
  } catch (error) {
    log.error(LogCategory.SERVICE, 'Failed to parse Claude response', error as Error);
    throw error;
  }
}

/**
 * Generate fallback bullets when API is unavailable
 */
function generateFallbackBullets(
  profile: ProfessionalProfile,
  targetJobIndex?: number
): GeneratedBullets[] {
  console.log('[Uproot] Using fallback bullet generation');

  const jobs = selectJobsToProcess(profile.jobs, targetJobIndex);

  return jobs.map(job => {
    const technologies = job.technologies.slice(0, 3).join(', ') || 'various technologies';
    const actionVerb = job.current ? 'Develop' : 'Developed';

    // Use existing bullets if available, otherwise generate basic ones
    const bullets = job.bullets.length > 0
      ? job.bullets.slice(0, 4).map(b => b.text)
      : [
          `${actionVerb} software solutions using ${technologies}`,
          `Collaborated with cross-functional teams to deliver projects`,
          `Implemented best practices and code quality standards`,
        ];

    return {
      jobTitle: job.title,
      company: job.company,
      bullets,
    };
  });
}
