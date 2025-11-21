/**
 * AI-Powered Cover Letter Generator
 *
 * Generates tailored cover letters using:
 * - Job description analysis
 * - Professional profile data
 * - AI enhancement (Claude 3.5 Sonnet)
 * - ATS optimization
 */

import type { LinkedInJobData } from './linkedin-job-scraper';
import type { ProfessionalProfile } from '../types/resume';
import type { JobDescriptionAnalysis } from './job-description-analyzer';
import type {
  CoverLetter,
  CoverLetterContent,
  CoverLetterTone,
  CoverLetterGenerationOptions,
  CoverLetterGenerationResult,
} from '../types/cover-letter';
import { log, LogCategory } from '../utils/logger';

// ============================================================================
// MAIN GENERATION FUNCTION
// ============================================================================

/**
 * Generate a tailored cover letter for a specific job
 */
export async function generateCoverLetter(
  jobData: LinkedInJobData,
  jobAnalysis: JobDescriptionAnalysis,
  profile: ProfessionalProfile,
  options: CoverLetterGenerationOptions = {}
): Promise<CoverLetterGenerationResult> {
  const startTime = Date.now();
  const endTrace = log.trace(LogCategory.SERVICE, 'generateCoverLetter', {
    jobTitle: jobData.jobTitle,
    company: jobData.company,
    useAI: options.useAI !== false,
  });

  const warnings: string[] = [];

  try {
    // Set defaults
    const tone = options.tone || 'professional';
    const useAI = options.useAI !== false;
    const targetWordCount = options.targetWordCount || 280;

    log.info(LogCategory.SERVICE, 'Starting cover letter generation', {
      jobTitle: jobData.jobTitle,
      company: jobData.company,
      tone,
      useAI,
      targetWordCount,
    });

    // Generate content
    let content: CoverLetterContent;

    if (useAI) {
      // Try AI generation first
      try {
        content = await generateWithAI(
          jobData,
          jobAnalysis,
          profile,
          tone,
          targetWordCount,
          options
        );
        log.info(LogCategory.SERVICE, 'Cover letter generated with AI');
      } catch (error) {
        log.warn(LogCategory.SERVICE, 'AI generation failed, falling back to template', {
          error: (error as Error).message,
        });
        warnings.push('AI generation unavailable - using template-based generation');
        content = generateWithTemplate(jobData, jobAnalysis, profile, tone, options);
      }
    } else {
      // Template-based generation
      content = generateWithTemplate(jobData, jobAnalysis, profile, tone, options);
      log.info(LogCategory.SERVICE, 'Cover letter generated with template');
    }

    // Calculate ATS score
    const atsScore = calculateCoverLetterATSScore(content.fullText, jobAnalysis);

    // Build cover letter object
    const coverLetter: CoverLetter = {
      id: crypto.randomUUID(),
      jobId: jobData.jobId,
      jobTitle: jobData.jobTitle,
      company: jobData.company,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      content,
      wordCount: countWords(content.fullText),
      atsScore,
      tone,
      generatedWithAI: useAI,
    };

    const generationTime = Date.now() - startTime;

    log.info(LogCategory.SERVICE, 'Cover letter generation complete', {
      wordCount: coverLetter.wordCount,
      atsScore,
      generationTime,
      aiUsed: useAI,
    });

    endTrace();

    return {
      coverLetter,
      warnings,
      generationTime,
      aiUsed: useAI,
    };
  } catch (error) {
    log.error(LogCategory.SERVICE, 'Cover letter generation failed', error as Error);
    endTrace();
    throw error;
  }
}

// ============================================================================
// AI GENERATION
// ============================================================================

async function generateWithAI(
  jobData: LinkedInJobData,
  jobAnalysis: JobDescriptionAnalysis,
  profile: ProfessionalProfile,
  tone: CoverLetterTone,
  targetWordCount: number,
  options: CoverLetterGenerationOptions
): Promise<CoverLetterContent> {
  const apiKey = options.anthropicApiKey || import.meta.env.VITE_ANTHROPIC_API_KEY;

  if (!apiKey) {
    throw new Error('Anthropic API key not configured');
  }

  // Build resume summary for context
  const resumeSummary = buildResumeSummary(profile);

  // Build prompt
  const prompt = buildAIPrompt(
    jobData,
    jobAnalysis,
    resumeSummary,
    profile.personalInfo.fullName,
    tone,
    targetWordCount,
    options
  );

  // Call Claude API
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 2048,
      temperature: 0.7,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(`Claude API error: ${JSON.stringify(errorData)}`);
  }

  const data = await response.json();
  const generatedText = data.content[0].text;

  // Parse AI response into structured content
  const content = parseAIResponse(
    generatedText,
    profile,
    jobData.company,
    options.includeAddress || false
  );

  return content;
}

/**
 * Build AI prompt for cover letter generation
 */
function buildAIPrompt(
  jobData: LinkedInJobData,
  jobAnalysis: JobDescriptionAnalysis,
  resumeSummary: string,
  candidateName: string,
  tone: CoverLetterTone,
  targetWordCount: number,
  options: CoverLetterGenerationOptions
): string {
  const toneInstructions = {
    professional:
      'Use a formal, traditional business tone. Professional and respectful language.',
    enthusiastic:
      'Use an energetic, passionate tone. Show genuine excitement about the opportunity.',
    technical:
      'Use a detail-oriented, precise tone. Focus on technical achievements and specifics.',
    conversational:
      'Use a friendly, approachable tone. Be warm while maintaining professionalism.',
  };

  const emphasizeSkills = options.emphasizeSkills || jobAnalysis.keywords.slice(0, 5);
  const companyContext = options.companyResearch || '';

  return `You are an expert cover letter writer specializing in ATS-optimized applications.

**Task:** Write a compelling cover letter for the following job application.

**Job Details:**
- Position: ${jobData.jobTitle}
- Company: ${jobData.company}
- Location: ${jobData.location}

**Job Description:**
${jobData.description}

**Key Requirements (from analysis):**
${jobAnalysis.requiredSkills.slice(0, 8).join(', ')}

**Skills to Emphasize:**
${emphasizeSkills.join(', ')}

**Candidate Information:**
Name: ${candidateName}

**Candidate's Resume Summary:**
${resumeSummary}

${companyContext ? `**Company Research:**\n${companyContext}\n` : ''}

**Instructions:**
1. Write a ${tone} cover letter targeting ${targetWordCount} words
2. ${toneInstructions[tone]}
3. Structure: Opening hook → Relevant experience → Motivation & fit → Call to action
4. Include keywords naturally: ${emphasizeSkills.slice(0, 3).join(', ')}
5. Each paragraph should be 3-4 sentences
6. Show specific examples from the candidate's experience
7. Demonstrate knowledge of the company and role
8. End with a strong call to action

**Output Format:**
Provide the cover letter body text only (no header, no signature block).
Use this exact structure:

GREETING: [greeting line]

OPENING: [opening paragraph - hook about why excited]

BODY1: [paragraph about relevant experience and achievements]

BODY2: [paragraph about motivation and company fit]

CLOSING: [paragraph with call to action and availability]

SIGNATURE: [closing salutation]

Begin:`;
}

/**
 * Parse AI response into structured cover letter content
 */
function parseAIResponse(
  aiResponse: string,
  profile: ProfessionalProfile,
  companyName: string,
  includeAddress: boolean
): CoverLetterContent {
  // Extract sections using regex
  const greetingMatch = aiResponse.match(/GREETING:\s*(.+)/i);
  const openingMatch = aiResponse.match(/OPENING:\s*(.+?)(?=BODY1:)/is);
  const body1Match = aiResponse.match(/BODY1:\s*(.+?)(?=BODY2:)/is);
  const body2Match = aiResponse.match(/BODY2:\s*(.+?)(?=CLOSING:)/is);
  const closingMatch = aiResponse.match(/CLOSING:\s*(.+?)(?=SIGNATURE:)/is);
  const signatureMatch = aiResponse.match(/SIGNATURE:\s*(.+)/is);

  const greeting = greetingMatch?.[1]?.trim() || 'Dear Hiring Manager,';
  const opening = openingMatch?.[1]?.trim() || '';
  const body1 = body1Match?.[1]?.trim() || '';
  const body2 = body2Match?.[1]?.trim() || '';
  const closing = closingMatch?.[1]?.trim() || '';
  const signature = signatureMatch?.[1]?.trim() || 'Sincerely,';

  // Build full text
  const fullText = buildFullCoverLetterText(
    profile,
    companyName,
    greeting,
    opening,
    body1,
    body2,
    closing,
    signature,
    includeAddress
  );

  return {
    candidateName: profile.personalInfo.fullName,
    candidateEmail: profile.personalInfo.email || '',
    candidatePhone: profile.personalInfo.phone || '',
    candidateAddress: includeAddress ? profile.personalInfo.location : undefined,
    date: new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }),
    hiringManagerName: undefined,
    companyName,
    companyAddress: undefined,
    greeting,
    opening,
    body1,
    body2,
    closing,
    signature,
    fullText,
  };
}

// ============================================================================
// TEMPLATE-BASED GENERATION
// ============================================================================

function generateWithTemplate(
  jobData: LinkedInJobData,
  jobAnalysis: JobDescriptionAnalysis,
  profile: ProfessionalProfile,
  tone: CoverLetterTone,
  options: CoverLetterGenerationOptions
): CoverLetterContent {
  const topSkills = jobAnalysis.keywords.slice(0, 3);
  const companyName = jobData.company;
  const position = jobData.jobTitle;
  const candidateName = profile.personalInfo.fullName;

  // Get top experience
  const topExperience = profile.experience?.[0];
  const yearsExperience = topExperience
    ? calculateYearsOfExperience(topExperience.startDate, topExperience.endDate)
    : 0;

  // Generate greeting
  const greeting = 'Dear Hiring Manager,';

  // Generate opening (hook)
  const opening = `I am writing to express my strong interest in the ${position} position at ${companyName}. With ${yearsExperience}+ years of experience in ${topSkills[0] || 'the field'} and a proven track record of ${topExperience?.achievements?.[0] || 'delivering results'}, I am excited about the opportunity to contribute to your team's success.`;

  // Generate body1 (relevant experience)
  const body1 = `In my current role as ${topExperience?.title || 'a professional'} at ${topExperience?.company || 'my current company'}, I have developed strong expertise in ${topSkills.join(', ')}. ${topExperience?.achievements?.[0] || 'I have successfully led multiple projects'}, demonstrating my ability to ${jobAnalysis.requiredSkills[0] || 'drive results'}. My technical proficiency in ${topSkills[1] || 'relevant technologies'} aligns closely with the requirements outlined in your job posting.`;

  // Generate body2 (motivation & fit)
  const body2 = `I am particularly drawn to ${companyName}'s commitment to ${jobAnalysis.keywords[0] || 'innovation'} and your focus on ${jobAnalysis.keywords[1] || 'excellence'}. Your company's reputation for ${jobAnalysis.keywords[2] || 'quality'} resonates with my professional values, and I am eager to bring my skills in ${topSkills[0]} to contribute to your continued growth. I believe my experience and enthusiasm make me an excellent fit for this role.`;

  // Generate closing (call to action)
  const closing = `I would welcome the opportunity to discuss how my background in ${topSkills[0]} and ${topSkills[1] || 'related areas'} can benefit ${companyName}. I am available for an interview at your earliest convenience and look forward to the possibility of joining your team. Thank you for considering my application.`;

  // Generate signature
  const signature = 'Sincerely,';

  // Build full text
  const fullText = buildFullCoverLetterText(
    profile,
    companyName,
    greeting,
    opening,
    body1,
    body2,
    closing,
    signature,
    options.includeAddress || false
  );

  return {
    candidateName: profile.personalInfo.fullName,
    candidateEmail: profile.personalInfo.email || '',
    candidatePhone: profile.personalInfo.phone || '',
    candidateAddress: options.includeAddress ? profile.personalInfo.location : undefined,
    date: new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }),
    hiringManagerName: undefined,
    companyName,
    companyAddress: undefined,
    greeting,
    opening,
    body1,
    body2,
    closing,
    signature,
    fullText,
  };
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Build full cover letter text
 */
function buildFullCoverLetterText(
  profile: ProfessionalProfile,
  companyName: string,
  greeting: string,
  opening: string,
  body1: string,
  body2: string,
  closing: string,
  signature: string,
  includeAddress: boolean
): string {
  const lines: string[] = [];

  // Header - Candidate info
  lines.push(profile.personalInfo.fullName);
  if (profile.personalInfo.email) lines.push(profile.personalInfo.email);
  if (profile.personalInfo.phone) lines.push(profile.personalInfo.phone);
  if (includeAddress && profile.personalInfo.location) {
    lines.push(profile.personalInfo.location);
  }
  lines.push(''); // Blank line

  // Date
  const formattedDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  lines.push(formattedDate);
  lines.push(''); // Blank line

  // Recipient
  lines.push('Hiring Manager');
  lines.push(companyName);
  lines.push(''); // Blank line

  // Body
  lines.push(greeting);
  lines.push(''); // Blank line
  lines.push(opening);
  lines.push(''); // Blank line
  lines.push(body1);
  lines.push(''); // Blank line
  lines.push(body2);
  lines.push(''); // Blank line
  lines.push(closing);
  lines.push(''); // Blank line

  // Signature
  lines.push(signature);
  lines.push(profile.personalInfo.fullName);

  return lines.join('\n');
}

/**
 * Build resume summary for AI context
 */
function buildResumeSummary(profile: ProfessionalProfile): string {
  const parts: string[] = [];

  // Experience
  if (profile.experience && profile.experience.length > 0) {
    const exp = profile.experience.slice(0, 3);
    parts.push('**Experience:**');
    exp.forEach((e) => {
      parts.push(
        `- ${e.title} at ${e.company} (${e.startDate} - ${e.endDate || 'Present'})`
      );
      if (e.achievements && e.achievements.length > 0) {
        e.achievements.slice(0, 2).forEach((a) => {
          parts.push(`  • ${a}`);
        });
      }
    });
  }

  // Skills
  if (profile.skills && profile.skills.length > 0) {
    parts.push('');
    parts.push('**Skills:**');
    parts.push(profile.skills.slice(0, 15).join(', '));
  }

  // Education
  if (profile.education && profile.education.length > 0) {
    parts.push('');
    parts.push('**Education:**');
    profile.education.forEach((e) => {
      parts.push(`- ${e.degree} in ${e.fieldOfStudy} from ${e.institution}`);
    });
  }

  return parts.join('\n');
}

/**
 * Calculate ATS score for cover letter
 */
function calculateCoverLetterATSScore(
  coverLetterText: string,
  jobAnalysis: JobDescriptionAnalysis
): number {
  let score = 0;
  const lowerText = coverLetterText.toLowerCase();

  // Keyword match (50 points)
  const keywords = [...jobAnalysis.requiredSkills, ...jobAnalysis.keywords]
    .slice(0, 20)
    .map((k) => k.toLowerCase());
  const matchedKeywords = keywords.filter((keyword) => lowerText.includes(keyword));
  const keywordScore = (matchedKeywords.length / keywords.length) * 50;
  score += keywordScore;

  // Length check (15 points) - 200-350 words ideal
  const wordCount = countWords(coverLetterText);
  if (wordCount >= 200 && wordCount <= 350) {
    score += 15;
  } else if (wordCount >= 150 && wordCount < 200) {
    score += 10;
  } else if (wordCount > 350 && wordCount <= 400) {
    score += 10;
  } else {
    score += 5;
  }

  // Structure check (20 points)
  if (lowerText.includes('dear')) score += 5; // Has greeting
  if (lowerText.includes('sincerely') || lowerText.includes('best regards')) score += 5; // Has closing
  if (lowerText.match(/\n\n/g)?.length >= 3) score += 5; // Multiple paragraphs
  if (lowerText.includes(jobAnalysis.company.toLowerCase())) score += 5; // Mentions company

  // Company-specific (15 points)
  if (lowerText.includes(jobAnalysis.jobTitle.toLowerCase())) score += 8; // Mentions role
  if (matchedKeywords.length >= 5) score += 7; // Good keyword density

  return Math.min(100, Math.round(score));
}

/**
 * Count words in text
 */
function countWords(text: string): number {
  return text.trim().split(/\s+/).length;
}

/**
 * Calculate years of experience
 */
function calculateYearsOfExperience(startDate: string, endDate?: string): number {
  const start = new Date(startDate);
  const end = endDate ? new Date(endDate) : new Date();
  const diffMs = end.getTime() - start.getTime();
  const years = diffMs / (1000 * 60 * 60 * 24 * 365.25);
  return Math.round(years);
}
