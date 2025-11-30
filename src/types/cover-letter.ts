/**
 * Cover Letter Type Definitions
 * AI-powered cover letter generation with ATS optimization
 * Based on comprehensive research from 100+ sources (2024-2025)
 */

import type { JobDescriptionAnalysis, ExtractedKeyword, ProfessionalProfile } from './resume';

// ============================================================================
// STORAGE KEYS
// ============================================================================

export const COVER_LETTERS_KEY = 'uproot_cover_letters';
export const COVER_LETTER_TEMPLATES_KEY = 'uproot_cover_letter_templates';
export const COVER_LETTER_COMPONENTS_KEY = 'uproot_cover_letter_components';
export const COVER_LETTER_PREFERENCES_KEY = 'uproot_cover_letter_preferences';
export const COVER_LETTER_ANALYTICS_KEY = 'uproot_cover_letter_analytics';

// ============================================================================
// LEGACY TYPES (for backward compatibility)
// ============================================================================

/**
 * Legacy tone type for UI components
 */
export type CoverLetterTone = 'professional' | 'enthusiastic' | 'conversational' | 'confident';

// ============================================================================
// COVER LETTER
// ============================================================================

/**
 * Main cover letter document
 * Can be AI-generated, template-based, or manually written
 */
export interface CoverLetter {
  id: string;
  userId?: string;

  // Associated job
  jobId?: string; // Links to saved job in JobsTab
  jobDescriptionId?: string; // Links to JobDescriptionAnalysis
  jobTitle: string;
  company: string;

  // Generation method
  generationMethod: 'ai' | 'template' | 'manual' | 'hybrid';
  templateId?: string; // If generated from template

  // Version control
  version: number;
  parentId?: string; // If this is a revision of another letter
  status: 'draft' | 'final' | 'sent';

  // Content
  content: CoverLetterContent;

  // Quality metrics
  qualityScore: CoverLetterQualityScore;
  atsOptimization: CoverLetterATSScore;

  // User customization level
  customizationLevel: 'quick' | 'standard' | 'thorough'; // 90%, 60%, 30% template reuse

  // Tracking
  sentAt?: number;
  responseReceived?: boolean;
  responseDate?: number;
  outcomeStatus?: 'no-response' | 'rejected' | 'phone-screen' | 'interview' | 'offer';

  // Metadata
  createdAt: number;
  updatedAt: number;
  lastEditedAt: number;
}

/**
 * Structured cover letter content
 * Following proven Problem-Solution format (highest response rate in 2024)
 */
export interface CoverLetterContent {
  // Header
  contactInfo: CoverLetterContactInfo;
  date: string; // "November 20, 2024"
  recipientInfo: CoverLetterRecipientInfo;

  // Greeting
  greeting: string; // "Dear Hiring Manager," or "Dear [Name],"

  // Body paragraphs (optimal: 3-4 paragraphs, 250-400 words total)
  opening: CoverLetterParagraph; // Hook + why you're excited
  body: CoverLetterParagraph[]; // 1-2 paragraphs: relevant experience + value proposition
  closing: CoverLetterParagraph; // CTA + enthusiasm

  // Sign-off
  signOff: string; // "Sincerely," or "Best regards,"
  signature: string; // Full name

  // Full text (assembled from components)
  fullText: string;

  // Word count (optimal: 250-400)
  wordCount: number;

  // Paragraph count (optimal: 4-6 including greeting/closing)
  paragraphCount: number;
}

export interface CoverLetterContactInfo {
  fullName: string;
  email: string;
  phone?: string;
  location?: string; // "San Francisco, CA"
  linkedinUrl?: string;
  portfolioUrl?: string;
}

export interface CoverLetterRecipientInfo {
  hiringManagerName?: string; // If known
  hiringManagerTitle?: string; // "Hiring Manager" or specific title
  companyName: string;
  companyAddress?: string;
}

export interface CoverLetterParagraph {
  id: string;
  type: 'opening' | 'experience' | 'value-proposition' | 'closing';
  text: string;

  // Keywords used in this paragraph (for ATS)
  keywords: string[];

  // Metrics mentioned (for impact)
  metrics?: string[]; // ["40%", "$2M", "500 users"]

  // Component this was generated from (if applicable)
  componentId?: string;
}

// ============================================================================
// QUALITY SCORING
// ============================================================================

/**
 * Comprehensive quality validation
 * Based on research: 76% auto-reject for typos, 73% spot generic templates
 */
export interface CoverLetterQualityScore {
  // Overall score (0-100)
  overallScore: number;
  grade: 'A' | 'B' | 'C' | 'D' | 'F'; // A: 90+, B: 80+, C: 70+, D: 60+, F: <60

  // Component scores
  grammar: QualityComponent; // 20% weight - typos are auto-reject
  readability: QualityComponent; // 15% weight - Flesch-Kincaid, SMOG
  tone: QualityComponent; // 10% weight - professional, enthusiastic, confident
  atsCompatibility: QualityComponent; // 15% weight - formatting, keywords
  contentQuality: QualityComponent; // 20% weight - specificity, metrics, personalization
  structure: QualityComponent; // 10% weight - proper paragraphs, greeting, closing
  personalization: QualityComponent; // 10% weight - company research, customization

  // Issues found
  criticalIssues: QualityIssue[]; // Must fix (typos, wrong company name, etc.)
  warnings: QualityIssue[]; // Should fix (clichés, passive voice, too long)
  suggestions: QualityIssue[]; // Nice to have (add metrics, stronger opening)

  // Readability metrics
  fleschKincaidGrade: number; // Target: 8-10 (professional but accessible)
  fleschReadingEase: number; // Target: 60-70

  // Content analysis
  passiveVoicePercentage: number; // Target: <10%
  clichéCount: number; // Target: 0
  buzzwordCount: number; // Target: <3

  // Validation passed?
  isReadyToSend: boolean; // No critical issues
  estimatedSuccessProbability: number; // 0-95% based on quality + ATS score
}

export interface QualityComponent {
  score: number; // 0-100
  weight: number; // Percentage weight in overall score
  issues: QualityIssue[];
  passed: boolean; // Meets minimum threshold
}

export interface QualityIssue {
  severity: 'critical' | 'warning' | 'suggestion';
  category: 'grammar' | 'spelling' | 'tone' | 'structure' | 'content' | 'formatting' | 'personalization';
  message: string;
  location?: {
    paragraph: number;
    sentence?: number;
    position?: number;
  };
  suggestion?: string; // How to fix it
  examples?: string[]; // Example improvements
}

/**
 * ATS compatibility scoring
 * Based on research: 99% of Fortune 500 use ATS, optimal keyword density 2-4%
 */
export interface CoverLetterATSScore {
  overallATSScore: number; // 0-100

  // Keyword analysis
  keywordDensity: number; // Percentage (optimal: 2-4%)
  keywordMatchRate: number; // Percentage of job keywords used (target: 60-80%)
  primaryKeywordsUsed: string[]; // 5-8 main terms, 2-3 times each
  secondaryKeywordsUsed: string[]; // 10-15 total keywords
  totalKeywords: number;
  keywordsUsed: string[];
  keywordsMissing: string[];

  // Format compliance
  formatCompliance: {
    singleColumn: boolean;
    noHeadersFooters: boolean;
    standardFont: boolean;
    noGraphics: boolean;
    noTables: boolean;
    score: number; // 0-100
  };

  // Length compliance
  lengthCompliance: {
    wordCount: number;
    optimal: boolean; // 250-400 words
    tooShort: boolean; // <200 words
    tooLong: boolean; // >500 words
    score: number;
  };

  // Personalization detection
  personalizationScore: number; // 0-100 (73% of managers spot generic templates)
  companyNameMentioned: boolean;
  jobTitleMentioned: boolean;
  companyResearchEvident: boolean; // Mentions mission, products, news, etc.

  // Recommendations
  recommendations: string[];
}

// ============================================================================
// TEMPLATES & COMPONENTS
// ============================================================================

/**
 * Reusable cover letter template
 * Based on proven formulas: AIDA, Problem-Solution, Achievement-Focused, Story-Driven
 */
export interface CoverLetterTemplate {
  id: string;
  name: string;
  description: string;

  // Template type/framework
  framework: 'problem-solution' | 'achievement-focused' | 'story-driven' | 'aida' | 'par-star' | 't-format' | 'custom';

  // Best use cases
  industry?: string[]; // ["tech", "finance", "marketing"]
  jobLevel?: ('entry' | 'mid' | 'senior' | 'executive')[]; // What career levels it works for
  tone: 'professional' | 'enthusiastic' | 'conversational' | 'confident';

  // Template structure (with variable placeholders)
  structure: {
    opening: TemplateComponent;
    body: TemplateComponent[];
    closing: TemplateComponent;
  };

  // Variables that need to be filled
  requiredVariables: TemplateVariable[];
  optionalVariables: TemplateVariable[];

  // Performance data
  usageCount: number;
  successRate?: number; // Percentage that got interviews (if tracked)
  averageQualityScore?: number;

  // Is this a default template or user-created?
  isDefault: boolean;

  // Metadata
  createdAt: number;
  updatedAt: number;
}

export interface TemplateComponent {
  id: string;
  type: 'opening' | 'experience' | 'value-proposition' | 'closing';
  text: string; // With {{variable}} placeholders

  // Alternative versions (for A/B testing or variety)
  alternatives?: string[];

  // Instructions for AI generation
  generationPrompt?: string;
}

export interface TemplateVariable {
  name: string; // "companyName", "jobTitle", "relevantExperience", etc.
  type: 'string' | 'number' | 'array' | 'object';
  description: string;
  defaultValue?: any;
  placeholder?: string; // Shown in editor

  // How to auto-fill from profile/job
  autoFillFrom?: 'profile' | 'job' | 'analysis';
  autoFillPath?: string; // JSON path like "personalInfo.fullName"
}

/**
 * Reusable content components (openings, closings, value props)
 * Research shows: stories are 22x more memorable, metrics prove capability
 */
export interface CoverLetterComponent {
  id: string;
  type: 'opening-hook' | 'value-proposition' | 'experience-highlight' | 'closing-cta' | 'company-research';
  name: string;
  description: string;

  // Component text (with variables)
  text: string;

  // Context for when to use this
  bestFor?: {
    industry?: string[];
    tone?: ('professional' | 'enthusiastic' | 'conversational')[];
    jobLevel?: ('entry' | 'mid' | 'senior')[];
  };

  // Variables needed
  variables: string[]; // ["companyName", "metric", "achievement"]

  // Example filled version
  example?: string;

  // Usage tracking
  usageCount: number;
  successRate?: number;

  // User-created or default?
  isDefault: boolean;

  createdAt: number;
}

// ============================================================================
// GENERATED COVER LETTER (AI-POWERED)
// ============================================================================

/**
 * AI-generated cover letter tailored to specific job
 * Based on research: 53% more interviews with tailored letters, 94% of managers value them
 */
export interface GeneratedCoverLetter {
  id: string;

  // Job it was generated for
  jobDescriptionId: string;
  jobTitle: string;
  company: string;

  // Generation strategy used
  framework: 'problem-solution' | 'achievement-focused' | 'story-driven' | 'aida' | 'hybrid';
  customizationLevel: 'quick' | 'standard' | 'thorough'; // 90%, 60%, 30% template reuse

  // Content selection from profile
  selectedExperiences: SelectedCoverLetterExperience[];
  selectedSkills: string[]; // Skill names matched to job
  selectedAchievements: string[]; // Achievement IDs to highlight

  // Company research integrated
  companyResearch?: CompanyResearch;

  // Generated paragraphs
  content: CoverLetterContent;

  // Quality & ATS scores
  qualityScore: CoverLetterQualityScore;
  atsOptimization: CoverLetterATSScore;

  // AI generation details
  aiProvider?: 'claude' | 'gpt-4' | 'gpt-3.5';
  prompt?: string; // The prompt used (for debugging/improvement)
  temperature?: number; // AI creativity setting

  // User feedback (for learning)
  userRating?: number; // 1-5 stars
  userEdited?: boolean; // Did user make changes?
  sentToEmployer?: boolean;
  gotResponse?: boolean;

  // Metadata
  generatedAt: number;
  version: number;
}

export interface SelectedCoverLetterExperience {
  type: 'job' | 'internship' | 'volunteer' | 'project' | 'achievement';
  id: string;
  relevanceScore: number; // 0-100 - how relevant to this job

  // Which specific accomplishments/bullets to mention
  highlightedPoints: string[]; // Bullet IDs or achievement text

  // How this experience connects to job requirements
  connectionToJob: string; // "Matches 'React' and 'team leadership' requirements"
}

export interface CompanyResearch {
  companyName: string;

  // Automatically fetched
  mission?: string;
  values?: string[];
  recentNews?: CompanyNewsItem[];
  products?: string[];
  culture?: string; // Culture description

  // User-provided
  customResearch?: string; // User's notes about the company

  // How this research was integrated into letter
  integratedInParagraph?: string[]; // Paragraph IDs where research was used

  fetchedAt?: number;
  source?: string; // "clearbit", "linkedin", "manual"
}

export interface CompanyNewsItem {
  title: string;
  summary: string;
  url?: string;
  date: string;
  relevance?: number; // How relevant to mention in letter
}

// ============================================================================
// GENERATION PARAMETERS
// ============================================================================

/**
 * Parameters for AI cover letter generation
 */
export interface CoverLetterGenerationParams {
  // Required inputs
  jobDescription: string | JobDescriptionAnalysis;
  profile: ProfessionalProfile;

  // Customization preferences
  framework?: 'problem-solution' | 'achievement-focused' | 'story-driven' | 'aida' | 'auto'; // auto = AI picks best
  tone?: 'professional' | 'enthusiastic' | 'conversational' | 'confident' | 'auto';
  customizationLevel?: 'quick' | 'standard' | 'thorough';

  // Length preference
  targetLength?: 'short' | 'medium' | 'long'; // short: 200-250, medium: 250-350, long: 350-400

  // Focus areas
  emphasizeSkills?: string[]; // Skills to definitely mention
  emphasizeExperiences?: string[]; // Experience IDs to highlight
  includeCompanyResearch?: boolean; // Whether to fetch/include company research

  // Template to use (if template-based)
  templateId?: string;

  // AI settings
  aiProvider?: 'claude' | 'gpt-4' | 'gpt-3.5';
  temperature?: number; // 0.0-1.0, lower = more consistent, higher = more creative

  // Quality thresholds
  minimumQualityScore?: number; // Regenerate if below this (default: 75)
  minimumATSScore?: number; // Regenerate if below this (default: 70)

  // User writing style (optional - to match voice)
  writingSamples?: string[]; // User's previous writing to match style
}

// ============================================================================
// INTERNAL GENERATION TYPES (Kenkai Framework)
// ============================================================================

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
 * Tone profile for cover letter generation
 */
export interface ToneProfile {
  style: 'professional' | 'conversational' | 'balanced';
  enthusiasm: 'reserved' | 'moderate' | 'high';
  formality: 'formal' | 'business-casual' | 'casual';
  personalityLevel: number; // 0-1
}

/**
 * Achievement story for cover letter
 */
export interface AchievementStory {
  achievement: any; // Achievement object from profile
  source: 'work' | 'project' | 'volunteer';
  company: string;
  title: string;
  relevanceScore: number;
  starFramework: {
    situation: string;
    task: string;
    action: string;
    result: string;
  };
  keywords: string[];
  estimatedWordCount: number;
}

/**
 * Cover letter narrative structure
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
 * Generated sections structure
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
 * Verification result for cover letter
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
 * Configuration for cover letter generation (alias for CoverLetterGenerationParams)
 */
export interface CoverLetterConfig {
  targetLength?: number; // Target word count (200-450)
  temperature?: number; // AI creativity (0-1)
  tone?: Partial<ToneProfile>;
  includeHiringManager?: boolean;
  researchContext?: {
    industryTrends?: string[];
    atsOptimizationTips?: string[];
    commonMistakesToAvoid?: string[];
    companySpecificAdvice?: string[];
  };
}

/**
 * Internal cover letter generation result (Kenkai framework)
 */
export interface GeneratedCoverLetterInternal {
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

// ============================================================================
// STORAGE & MANAGEMENT
// ============================================================================

/**
 * Cover letter storage structure (Chrome storage)
 */
export interface CoverLetterStorage {
  coverLetters: Record<string, CoverLetter>; // ID -> CoverLetter
  templates: Record<string, CoverLetterTemplate>; // ID -> Template
  components: Record<string, CoverLetterComponent>; // ID -> Component

  // Metadata
  lastUpdated: number;
  totalGenerated: number;
  totalSent: number;
}

/**
 * User preferences for cover letter generation
 */
export interface CoverLetterPreferences {
  // Default settings
  defaultTone: 'professional' | 'enthusiastic' | 'conversational' | 'confident';
  defaultCustomizationLevel: 'quick' | 'standard' | 'thorough';
  defaultFramework?: 'problem-solution' | 'achievement-focused' | 'story-driven' | 'aida';

  // AI preferences
  preferredAIProvider?: 'claude' | 'gpt-4' | 'gpt-3.5';
  aiTemperature?: number;

  // Quality preferences
  minimumQualityScore: number; // Default: 75
  minimumATSScore: number; // Default: 70

  // Contact info format
  preferredContactFormat: 'header' | 'footer' | 'letterhead';
  includeLinkedIn: boolean;
  includePortfolio: boolean;

  // Company research
  autoFetchCompanyResearch: boolean;
  includeCompanyResearchInLetter: boolean;

  // Tracking preferences
  trackOutcomes: boolean; // Track if letters get responses

  // Privacy
  storeSentLetters: boolean;
  anonymizeLettersForAnalysis: boolean;
}

// ============================================================================
// EXPORT FORMATS
// ============================================================================

export interface CoverLetterExport {
  format: 'pdf' | 'docx' | 'txt' | 'html';
  content: string | Blob;
  filename: string;
  generatedAt: number;
}

// ============================================================================
// ANALYTICS & TRACKING
// ============================================================================

/**
 * Success metrics for cover letters
 * Research shows: 53% more interviews with tailored letters
 */
export interface CoverLetterAnalytics {
  totalGenerated: number;
  totalSent: number;

  // Response rates
  responsesReceived: number;
  responseRate: number; // Percentage

  // Outcomes
  phoneScreens: number;
  interviews: number;
  offers: number;
  rejections: number;

  // Quality metrics
  averageQualityScore: number;
  averageATSScore: number;

  // A/B testing data
  performanceByFramework: Record<string, FrameworkPerformance>;
  performanceByTone: Record<string, TonePerformance>;
  performanceByIndustry: Record<string, IndustryPerformance>;

  // User behavior
  averageCustomizationLevel: 'quick' | 'standard' | 'thorough';
  averageGenerationTime: number; // Seconds
  manualEditRate: number; // Percentage of letters user edits
}

export interface FrameworkPerformance {
  framework: string;
  usageCount: number;
  responseRate: number;
  interviewRate: number;
  averageQualityScore: number;
}

export interface TonePerformance {
  tone: string;
  usageCount: number;
  responseRate: number;
  interviewRate: number;
}

export interface IndustryPerformance {
  industry: string;
  usageCount: number;
  responseRate: number;
  interviewRate: number;
  bestFramework: string;
  bestTone: string;
}
