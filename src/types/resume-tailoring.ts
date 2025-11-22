/**
 * Resume Tailoring Types
 * Core schemas for AI-powered resume tailoring without hallucination
 */

import type { ExtractedKeyword } from './resume';

/**
 * User's complete professional profile
 * This is the SINGLE SOURCE OF TRUTH - AI can only use data from here
 */
export interface UserProfile {
  // Core identity
  id?: string; // LinkedIn profile ID or internal ID (for pathfinding)
  name: string;
  email?: string;
  phone?: string;
  location?: string;
  title: string; // Current/desired title
  avatarUrl?: string; // Profile image URL (for UI display in pathfinding)
  publicId?: string; // LinkedIn public identifier (for pathfinding)
  url?: string; // LinkedIn profile URL (for pathfinding and UI links)

  // Professional experience
  workExperience: WorkExperience[];

  // Education
  education: Education[];

  // Projects (critical for students/career changers)
  projects: Project[];

  // Explicit skills
  skills: Skill[];

  // Additional experience
  volunteer?: VolunteerExperience[];
  certifications?: Certification[];
  publications?: Publication[];
  languages?: Language[];

  // Metadata for smart matching
  metadata: ProfileMetadata;
}

export interface ProfileMetadata {
  totalYearsExperience: number;
  domains: string[]; // e.g., ['web dev', 'data science']
  seniority: 'entry' | 'mid' | 'senior' | 'staff' | 'principal';
  careerStage: 'student' | 'career-changer' | 'professional';
}

export interface WorkExperience {
  id: string;
  company: string;
  title: string;
  startDate: string; // ISO date string
  endDate: string | null; // null = current
  location?: string;
  description?: string;
  industry?: string;

  // The key to smart matching
  achievements: Achievement[];

  // Semantic tags for matching
  skills: string[];
  domains: string[];
  responsibilities: string[];
}

/**
 * Achievement - atomic unit of experience
 * Each achievement is verified and can be rewritten for different contexts
 */
export interface Achievement {
  id: string;
  bullet: string; // Original text from user

  // Structured extraction for matching
  action: string; // "Built", "Led", "Optimized"
  object: string; // "microservices platform", "team of 5"
  result?: string; // "reducing latency by 40%"
  metrics?: Metric[];

  // Semantic understanding
  skills: string[]; // Skills demonstrated
  keywords: string[]; // ATS-friendly keywords
  transferableSkills: string[]; // "leadership", "problem-solving"

  // Verification metadata
  verified: boolean; // User confirmed this is true
  source: 'user' | 'inferred'; // Did user write this, or inferred?
}

export interface Metric {
  value: number;
  unit: string; // '%', 'users', 'hours', 'dollars'
  type: 'increase' | 'decrease' | 'reduction' | 'scale' | 'count';
  context?: string; // "revenue", "latency", "users"
}

export interface Education {
  id: string;
  school: string;
  degree: string; // "Bachelor of Science", "Master of Arts"
  field?: string; // "Computer Science", "Business Administration"
  startDate: string;
  endDate: string | null;
  gpa?: number;
  honors?: string[];
  relevantCourses?: string[];
  achievements?: Achievement[];
}

export interface Project {
  id: string;
  name: string;
  description: string;
  startDate?: string;
  endDate?: string;
  url?: string; // GitHub, deployed site, etc.

  achievements: Achievement[];
  skills: string[];
  domains: string[];

  // For students - projects can be treated as work experience
  treatedAsExperience: boolean;
}

export interface Skill {
  name: string;
  level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  yearsOfExperience: number;
  category?: string; // 'programming-language', 'framework', 'tool'
}

export interface VolunteerExperience {
  id: string;
  organization: string;
  role: string;
  startDate: string;
  endDate: string | null;
  description?: string;
  achievements: Achievement[];
  skills: string[];
}

export interface Certification {
  id: string;
  name: string;
  issuer: string;
  dateObtained: string;
  expirationDate?: string;
  credentialId?: string;
  url?: string;
}

export interface Publication {
  id: string;
  title: string;
  authors: string[];
  venue: string;
  date: string;
  url?: string;
}

export interface Language {
  name: string;
  proficiency: 'elementary' | 'limited-working' | 'professional-working' | 'full-professional' | 'native';
}

/**
 * Job requirements extracted from job posting
 */
export interface JobRequirements {
  required: ExtractedKeyword[];
  preferred: ExtractedKeyword[];

  // Structured extractions
  experienceYears?: number; // "5+ years" → 5
  educationLevel?: string; // "Bachelor's degree"
  certifications?: string[];

  // Inferred metadata
  jobLevel?: 'entry' | 'mid' | 'senior' | 'staff' | 'principal';
  domain?: string; // 'software engineering', 'data science'
}

/**
 * Match between user's experience and job requirement
 */
export interface Match {
  requirement: ExtractedKeyword;
  userEvidence: Achievement[];
  matchType: 'direct' | 'semantic' | 'transferable' | 'inferred';
  confidence: number; // 0-1

  // For resume generation
  suggestedBullet?: string;
  explanation?: string; // Why this matches
}

export interface MatchReport {
  matches: Match[];
  missing: ExtractedKeyword[];
  matchScore: number; // 0-1
  recommendations: Recommendation[];

  // Detailed breakdown
  directMatches: Match[];
  semanticMatches: Match[];
  transferableMatches: Match[];
  inferredMatches: Match[];
}

export interface Recommendation {
  type: 'add-skill' | 'reframe-experience' | 'add-project' | 'get-certification';
  priority: 'high' | 'medium' | 'low';
  skill?: string;
  reason: string;
  suggestion: string;
}

/**
 * Rewritten resume bullet
 */
export interface RewrittenBullet {
  original: string;
  rewritten: string;
  changes: Change[];
  keywordsAdded: string[];

  // Anti-hallucination verification
  factVerification: FactVerification;
}

export interface Change {
  type: 'keyword-injection' | 'expansion' | 'specificity' | 'rephrasing' | 'metric-emphasis';
  from?: string;
  to?: string;
  justification: string;
}

export interface FactVerification {
  allFactsPreserved: boolean;
  addedFacts: string[]; // Should be EMPTY
  removedFacts: string[];
  confidence: number; // 0-1
}

/**
 * Tailored resume output
 */
export interface TailoredResume {
  header: ResumeHeader;
  summary?: string;
  experience: TailoredSection[];
  projects?: TailoredSection[];
  education: Education[];
  skills: SkillsSection;
  certifications?: Certification[];

  // Metadata
  matchReport: MatchReport;
  atsScore: number; // 0-100
}

export interface ResumeHeader {
  name: string;
  title: string;
  email?: string;
  phone?: string;
  location?: string;
  linkedin?: string;
  github?: string;
  website?: string;
}

export interface TailoredSection {
  company: string;
  title: string;
  startDate: string;
  endDate: string | null;
  location?: string;

  // Rewritten bullets optimized for this job
  bullets: string[];

  // Tracking what was changed
  originalBullets: string[];
  changes: RewrittenBullet[];
}

export interface SkillsSection {
  [category: string]: string[];
  // Example:
  // "Languages": ["Python", "JavaScript"],
  // "Frameworks": ["React", "Node.js"]
}

/**
 * Configuration for resume generation
 */
export interface ResumeGenerationConfig {
  allowHallucination: false; // ALWAYS false!
  preserveFacts: true; // ALWAYS true!
  maxKeywordsPerBullet: number;
  tone: 'professional' | 'technical' | 'casual';
  targetMatchScore: number; // 0.8 = aim for 80% match

  // Strategy based on user profile
  strategy: 'student' | 'career-changer' | 'professional';
}

/**
 * ATS optimization report
 */
export interface ATSReport {
  score: number; // 0-100
  keywordDensity: number;
  sectionsOptimized: boolean;
  formatOptimized: boolean;

  issues: ATSIssue[];
  suggestions: string[];
}

export interface ATSIssue {
  severity: 'critical' | 'warning' | 'info';
  issue: string;
  fix: string;
}
