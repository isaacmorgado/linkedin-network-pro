/**
 * Cover Letter Generation - Backend Types
 * Types specific to the AI generation pipeline (separate from frontend/storage types)
 */

import type { Achievement } from '../../src/types/resume-tailoring';
import type { ExtractedKeyword } from '../../src/types/resume';

/**
 * Job context extracted from posting
 */
export interface JobContext {
  company: string;
  role: string;
  hiringManager?: string;
  keyRequirements: ExtractedKeyword[];
  culture: 'formal' | 'business-casual' | 'casual';
}

/**
 * Achievement story with STAR breakdown
 */
export interface AchievementStory {
  achievement: Achievement;
  relevanceScore: number; // 0-1
  starFramework: {
    situation: string; // 10%
    task: string; // 10%
    action: string; // 60%
    result: string; // 20%
  };
  keywords: string[];
  estimatedWordCount: number;
}

/**
 * Narrative structure
 */
export interface CoverLetterNarrative {
  hook: string;
  valueProposition: string;
  primaryStory: AchievementStory;
  secondaryStory?: AchievementStory;
  connectionToRole: string;
  closingTheme: string;
}

/**
 * Tone profile
 */
export interface ToneProfile {
  style: 'professional' | 'conversational' | 'balanced';
  enthusiasm: 'high' | 'moderate' | 'reserved';
  formality: 'formal' | 'business-casual' | 'casual';
  personalityLevel: number; // 0-1
}

/**
 * Cover letter sections
 */
export interface CoverLetterSections {
  opening: {
    greeting: string;
    hook: string;
    valueProposition: string;
  };
  body: {
    paragraph1: string;
    paragraph2?: string;
  };
  closing: {
    reiterateInterest: string;
    callToAction: string;
    signOff: string;
  };
}

/**
 * Verification results
 */
export interface CoverLetterVerification {
  noHallucination: boolean;
  allFactsFromProfile: string[];
  addedFacts: string[];
  confidence: number;
  wordCount: number;
  wordCountValid: boolean;
  spellingErrors: string[];
  sentimentScore: number;
  keywordsUsed: string[];
  keywordCoverage: number;
}

/**
 * Generated cover letter (backend)
 */
export interface GeneratedCoverLetter {
  fullText: string;
  htmlFormatted: string;
  sections: CoverLetterSections;
  narrative: CoverLetterNarrative;
  tone: ToneProfile;
  wordCount: number;
  verification: CoverLetterVerification;
  matchAnalysis: {
    requirementsAddressed: string[];
    requirementsMissed: string[];
    atsScore: number;
  };
}

/**
 * Generation config
 */
export interface CoverLetterConfig {
  targetLength?: number; // 200-400
  tone?: Partial<ToneProfile>;
  temperature?: number; // 0.4 default
  includeHiringManager?: boolean;
}
