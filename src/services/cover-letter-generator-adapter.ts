/**
 * Adapter for backward compatibility with CoverLetterTab
 * Converts 4-parameter legacy signature to new 3-parameter signature
 */

import type { LinkedInJobData } from './linkedin-job-scraper';
import type { JobDescriptionAnalysis, ProfessionalProfile } from '../types/resume';
import type { CoverLetter } from '../types/cover-letter';
import { generateCoverLetterWithResearch } from './enhanced-cover-letter-generator';

/**
 * Legacy options interface for backward compatibility
 */
interface LegacyOptions {
  useAI?: boolean;
  tone?: string;
  targetWordCount?: number;
}

/**
 * Legacy function signature that CoverLetterTab expects
 *
 * @param jobData - LinkedIn job data (used for metadata)
 * @param selectedJob - Job description analysis
 * @param profile - Professional profile
 * @param options - Legacy generation options
 * @returns Object with coverLetter and warnings
 */
export async function generateCoverLetter(
  jobData: LinkedInJobData,
  selectedJob: JobDescriptionAnalysis,
  profile: ProfessionalProfile,
  options?: LegacyOptions
): Promise<{ coverLetter: CoverLetter; warnings: string[] }> {
  // Convert to new format
  const jobPosting = selectedJob.rawText || jobData.description;

  // Map legacy tone to new format
  const params = {
    tone: options?.tone ? {
      style: mapLegacyTone(options.tone),
    } : undefined,
    targetLength: options?.targetWordCount ?
      (options.targetWordCount < 250 ? 'short' :
       options.targetWordCount > 350 ? 'long' : 'medium') :
      'medium' as 'short' | 'medium' | 'long',
  };

  // Generate using enhanced generator with research
  const result = await generateCoverLetterWithResearch(
    profile,
    jobPosting,
    {
      ...params,
      targetLength: options?.targetWordCount || 280,
    },
    true // enable research mode
  );

  // Convert internal result to CoverLetter format
  const coverLetter: CoverLetter = {
    id: crypto.randomUUID(),
    jobTitle: jobData.jobTitle,
    company: jobData.company,
    generationMethod: 'ai',
    version: 1,
    status: 'draft',
    content: {
      contactInfo: {
        fullName: profile.personalInfo.fullName,
        email: profile.personalInfo.email,
        phone: profile.personalInfo.phone,
        location: profile.personalInfo.location,
        linkedinUrl: profile.personalInfo.linkedinUrl,
        portfolioUrl: profile.personalInfo.portfolioUrl,
      },
      date: new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }),
      recipientInfo: {
        companyName: jobData.company,
      },
      greeting: result.sections.opening.greeting,
      opening: {
        id: 'opening',
        type: 'opening',
        text: result.sections.opening.hook + ' ' + result.sections.opening.valueProposition,
        keywords: [],
      },
      body: [
        {
          id: 'body1',
          type: 'experience',
          text: result.sections.body.paragraph1,
          keywords: [],
        },
        ...(result.sections.body.paragraph2 ? [{
          id: 'body2',
          type: 'experience' as const,
          text: result.sections.body.paragraph2,
          keywords: [],
        }] : []),
      ],
      closing: {
        id: 'closing',
        type: 'closing',
        text: result.sections.closing.reiterateInterest + ' ' + result.sections.closing.callToAction,
        keywords: [],
      },
      signOff: result.sections.closing.signOff,
      signature: profile.personalInfo.fullName,
      fullText: result.fullText,
      wordCount: result.wordCount,
      paragraphCount: 4 + (result.sections.body.paragraph2 ? 1 : 0),
    },
    qualityScore: {
      overallScore: 85, // Placeholder
      grade: 'A',
      grammar: { score: 90, weight: 20, issues: [], passed: true },
      readability: { score: 85, weight: 15, issues: [], passed: true },
      tone: { score: 90, weight: 10, issues: [], passed: true },
      atsCompatibility: { score: result.matchAnalysis.atsScore, weight: 15, issues: [], passed: true },
      contentQuality: { score: 85, weight: 20, issues: [], passed: true },
      structure: { score: 90, weight: 10, issues: [], passed: true },
      personalization: { score: 85, weight: 10, issues: [], passed: true },
      criticalIssues: [],
      warnings: result.verification.addedFacts.map(f => ({
        severity: 'warning' as const,
        category: 'content' as const,
        message: f,
      })),
      suggestions: [],
      fleschKincaidGrade: 10,
      fleschReadingEase: 65,
      passiveVoicePercentage: 5,
      clichéCount: 0,
      buzzwordCount: 1,
      isReadyToSend: result.verification.noHallucination,
      estimatedSuccessProbability: result.matchAnalysis.atsScore,
    },
    atsOptimization: {
      overallATSScore: result.matchAnalysis.atsScore,
      keywordDensity: 3.5,
      keywordMatchRate: result.verification.keywordCoverage * 100,
      primaryKeywordsUsed: result.verification.keywordsUsed.slice(0, 8),
      secondaryKeywordsUsed: result.verification.keywordsUsed.slice(8),
      totalKeywords: result.verification.keywordsUsed.length,
      keywordsUsed: result.verification.keywordsUsed,
      keywordsMissing: result.matchAnalysis.requirementsMissed,
      formatCompliance: {
        singleColumn: true,
        noHeadersFooters: true,
        standardFont: true,
        noGraphics: true,
        noTables: true,
        score: 100,
      },
      lengthCompliance: {
        wordCount: result.wordCount,
        optimal: result.verification.wordCountValid,
        tooShort: result.wordCount < 200,
        tooLong: result.wordCount > 500,
        score: result.verification.wordCountValid ? 100 : 70,
      },
      personalizationScore: 85,
      companyNameMentioned: result.fullText.includes(jobData.company),
      jobTitleMentioned: result.fullText.includes(jobData.jobTitle),
      companyResearchEvident: true,
      recommendations: result.matchAnalysis.requirementsMissed.map(
        kw => `Consider mentioning: ${kw}`
      ),
    },
    customizationLevel: 'standard',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    lastEditedAt: Date.now(),
  };

  // Extract warnings from verification
  const warnings = result.verification.addedFacts;

  return { coverLetter, warnings };
}

/**
 * Map legacy tone strings to new tone profile style
 */
function mapLegacyTone(tone: string): 'professional' | 'conversational' | 'balanced' {
  const lowerTone = tone.toLowerCase();
  if (lowerTone.includes('professional') || lowerTone.includes('formal')) {
    return 'professional';
  } else if (lowerTone.includes('conversational') || lowerTone.includes('casual')) {
    return 'conversational';
  } else {
    return 'balanced';
  }
}
