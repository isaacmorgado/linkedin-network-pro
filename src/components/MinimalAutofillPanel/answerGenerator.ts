/**
 * Answer generation logic
 * Generates answers from user's ACTUAL profile and keywords
 * No hallucination - uses real data from ProfessionalProfile
 */

import Anthropic from '@anthropic-ai/sdk';
import type { ProfessionalProfile } from '../../types/resume';

export async function generateAnswerFromProfile(
  question: string,
  keywords: string[],
  profile: ProfessionalProfile
): Promise<string> {
  try {
    // Initialize API
    const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error('VITE_ANTHROPIC_API_KEY not set');
    }

    const anthropic = new Anthropic({ apiKey, dangerouslyAllowBrowser: true });

    // Build prompt (extract profile data)
    const yearsExp = calculateYearsOfExperience(profile);
    const topSkills = profile.technicalSkills
      .slice(0, 5)
      .filter(s => s && s.name)
      .map(s => s.name)
      .join(', ');

    const latestJob = profile.jobs[0];
    const latestJobText = latestJob
      ? `${latestJob.title} at ${latestJob.company}`
      : 'N/A';

    const prompt = `STRICT RULES:
1. DO NOT invent experiences, skills, or accomplishments not in the profile
2. ONLY use facts from the professional profile below
3. DO reference job keywords when relevant
4. DO keep answer to 3-4 sentences maximum
5. DO NOT add fake metrics, team sizes, or company details
6. DO write in first person ("I have...", "My experience...")

PROFESSIONAL PROFILE:
- Name: ${profile.personalInfo.fullName}
- Latest Job: ${latestJobText}
- Technical Skills: ${topSkills}
- Years of Experience: ${yearsExp}

JOB KEYWORDS:
${keywords.join(', ')}

QUESTION:
"${question}"

Write a concise, professional answer (3-4 sentences) using ONLY verified facts from the profile.

Begin:`;

    // Call API
    const message = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 250,
      temperature: 0.4,
      messages: [{ role: 'user', content: prompt }],
    });

    // Parse response
    const answer = message.content[0].type === 'text'
      ? message.content[0].text.trim()
      : '';

    return answer;

  } catch (error) {
    console.error('Failed to generate answer with AI:', error);

    // Fallback template
    const topSkills = profile.technicalSkills
      .slice(0, 3)
      .filter(s => s && s.name)
      .map(s => s.name)
      .join(', ');

    return `Based on my experience with ${topSkills} and the requirements mentioned (${keywords.slice(0, 3).join(', ')}), I believe I'm well-suited for this role.`;
  }
}

function calculateYearsOfExperience(profile: ProfessionalProfile): number {
  if (!profile.jobs || profile.jobs.length === 0) return 0;

  let totalMonths = 0;
  for (const job of profile.jobs) {
    const start = new Date(job.startDate);
    const end = job.current ? new Date() : new Date(job.endDate || new Date());
    const months = (end.getFullYear() - start.getFullYear()) * 12 +
                   (end.getMonth() - start.getMonth());
    totalMonths += Math.max(0, months);
  }

  return Math.round(totalMonths / 12);
}
