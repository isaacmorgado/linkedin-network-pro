/**
 * Professional Profile & Resume Generation Type Definitions
 * AI-powered resume generation with ATS optimization
 */

// ============================================================================
// PROFESSIONAL PROFILE DATABASE
// ============================================================================

/**
 * Main professional profile - comprehensive career database
 * This is where users input ALL their experience, skills, projects, etc.
 */
export interface ProfessionalProfile {
  // Personal Information
  personalInfo: PersonalInfo;

  // Work Experience
  jobs: JobExperience[];
  internships: InternshipExperience[];
  volunteerWork: VolunteerExperience[];

  // Skills & Tools
  technicalSkills: Skill[];
  softSkills: Skill[];
  tools: Tool[];
  certifications: Certification[];
  languages: Language[];

  // Education & Projects
  education: Education[];
  projects: Project[];
  publications: Publication[];

  // Achievements & Awards
  achievements: Achievement[];
  awards: Award[];

  // Metadata
  createdAt: number;
  updatedAt: number;
  version: number; // Track profile version for migrations
}

// ============================================================================
// PERSONAL INFORMATION
// ============================================================================

export interface PersonalInfo {
  fullName: string;
  email: string;
  phone?: string;
  location?: string; // "San Francisco, CA" or "Remote"
  linkedinUrl?: string;
  githubUrl?: string;
  portfolioUrl?: string;
  professionalSummary?: string; // AI can use this as base for customization
}

// ============================================================================
// WORK EXPERIENCE (JOBS, INTERNSHIPS, VOLUNTEER)
// ============================================================================

export interface JobExperience {
  id: string;
  company: string;
  companyUrl?: string;
  title: string;
  location: string; // "San Francisco, CA" or "Remote"
  startDate: string; // "2023-01" format
  endDate?: string; // undefined if current
  current: boolean;
  employmentType: 'full-time' | 'part-time' | 'contract' | 'freelance';

  // Detailed accomplishments using APR format
  bullets: ExperienceBullet[];

  // Technologies/tools used (for keyword matching)
  technologies: string[]; // ["React", "TypeScript", "Node.js"]

  // Metadata
  createdAt: number;
  updatedAt: number;
}

export interface InternshipExperience {
  id: string;
  company: string;
  companyUrl?: string;
  title: string;
  location: string;
  startDate: string;
  endDate: string;
  duration?: string; // "3 months" - auto-calculated or manual

  bullets: ExperienceBullet[];
  technologies: string[];

  createdAt: number;
  updatedAt: number;
}

export interface VolunteerExperience {
  id: string;
  organization: string;
  organizationUrl?: string;
  role: string;
  location: string;
  startDate: string;
  endDate?: string;
  current: boolean;

  bullets: ExperienceBullet[];
  skills: string[]; // Skills demonstrated

  createdAt: number;
  updatedAt: number;
}

/**
 * Experience Bullet - APR Format (Action + Project/Problem + Result)
 * Optimized for ATS with keyword extraction and quantifiable metrics
 */
export interface ExperienceBullet {
  id: string;

  // Full bullet text (auto-generated from APR components or manually entered)
  text: string;

  // APR Components (optional - used by AI to generate better text)
  action?: string; // Strong action verb: "Architected", "Implemented", "Led"
  project?: string; // Problem or project: "a microservices architecture"
  result?: string; // Quantified outcome: "reducing API latency by 40%"

  // Extracted keywords for ATS matching
  keywords: string[];

  // Quantifiable metrics (for AI to emphasize)
  metrics?: Metric[];

  // Display order
  order: number;

  // Is this bullet a standout achievement?
  isHighlight?: boolean;
}

export interface Metric {
  value: string; // "40%", "$2M", "500K users"
  context: string; // "latency reduction", "revenue increase", "user growth"
}

// ============================================================================
// SKILLS, TOOLS, CERTIFICATIONS
// ============================================================================

export interface Skill {
  id: string;
  name: string;
  category: 'frontend' | 'backend' | 'devops' | 'data' | 'design' | 'management' | 'other';
  proficiency: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  yearsOfExperience?: number;

  // Related keywords/synonyms for ATS matching
  synonyms?: string[]; // ["React" could include "React.js", "ReactJS"]
}

export interface Tool {
  id: string;
  name: string;
  category: 'language' | 'framework' | 'database' | 'cloud' | 'tool' | 'platform';
  proficiency: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  version?: string; // "React 18", "Python 3.11"

  synonyms?: string[];
}

export interface Certification {
  id: string;
  name: string;
  issuer: string; // "AWS", "Google", "Microsoft"
  issueDate: string; // "2023-01"
  expiryDate?: string;
  credentialId?: string;
  credentialUrl?: string;

  // Full name and acronym for ATS
  acronym?: string; // "AWS Certified Solutions Architect (SAA-C03)"
}

export interface Language {
  id: string;
  name: string;
  proficiency: 'elementary' | 'limited-working' | 'professional-working' | 'full-professional' | 'native';
}

// ============================================================================
// EDUCATION & PROJECTS
// ============================================================================

export interface Education {
  id: string;
  institution: string;
  degree: string; // "Bachelor of Science"
  field: string; // "Computer Science"
  location: string;
  startDate: string;
  endDate?: string; // undefined if current
  current: boolean;
  gpa?: string; // "3.8/4.0"

  // Achievements
  honors?: string[]; // ["Dean's List", "Summa Cum Laude"]
  relevantCoursework?: string[];

  createdAt: number;
  updatedAt: number;
}

export interface Project {
  id: string;
  name: string;
  description: string; // Brief 1-2 sentence description

  // Detailed accomplishment bullets (like work experience)
  bullets: ExperienceBullet[];

  // Tech stack
  technologies: string[];

  // Links to showcase work
  links: ProjectLinks;

  // Date
  startDate?: string;
  endDate?: string;

  // Tags for categorization
  tags: string[]; // ["open-source", "hackathon", "personal"]

  createdAt: number;
  updatedAt: number;
}

export interface ProjectLinks {
  github?: string;
  demo?: string;
  youtube?: string;
  website?: string;
  other?: string;
}

export interface Publication {
  id: string;
  title: string;
  publisher?: string; // Journal, conference, or platform
  publishDate: string;
  url?: string;
  coAuthors?: string[];
  description?: string;
}

// ============================================================================
// ACHIEVEMENTS & AWARDS
// ============================================================================

export interface Achievement {
  id: string;
  title: string;
  description: string;
  date?: string;

  // Quantifiable impact
  metrics?: Metric[];

  // Associated with job/project?
  associatedWith?: {
    type: 'job' | 'internship' | 'project' | 'volunteer';
    id: string;
  };
}

export interface Award {
  id: string;
  name: string;
  issuer: string;
  date: string;
  description?: string;
}

// ============================================================================
// JOB DESCRIPTION ANALYSIS
// ============================================================================

/**
 * Parsed job description with keyword extraction
 * Users paste job description, AI analyzes it
 */
export interface JobDescriptionAnalysis {
  id: string;

  // Raw input
  rawText: string;
  jobTitle: string;
  company: string;
  description?: string; // Job description text

  // Parsed data
  extractedKeywords: ExtractedKeyword[];
  requiredSkills: string[];
  preferredSkills: string[];
  requiredExperience: string[];
  preferredExperience: string[];

  // Job details
  location?: string;
  workLocation?: 'remote' | 'hybrid' | 'onsite';
  experienceLevel?: 'entry' | 'mid' | 'senior' | 'lead' | 'executive';
  salaryRange?: string;

  // Match analysis against user's profile
  matchAnalysis?: MatchAnalysis;

  // Metadata
  analyzedAt: number;
  source?: 'linkedin' | 'indeed' | 'other'; // Where job was found
  jobUrl?: string;
}

/**
 * Extracted keyword with metadata for ATS optimization
 * Uses heuristic-based extraction (section-aware, strength detection)
 */
export interface ExtractedKeyword {
  phrase: string;      // "React", "Python", "CI/CD", "microservices"
  score: number;       // Weighted importance score (higher = more important)
  occurrences: number; // How many times this keyword appears in the text

  // Optional fields for backward compatibility with existing components
  category?: KeywordCategory;
  source?: 'lexicon' | 'inferred';
  required?: boolean;
  frequency?: number;
  context?: string[];
  synonyms?: string[];
}

export type KeywordCategory =
  | 'language'     // Programming languages (Golang, Python, TypeScript)
  | 'framework'    // Frameworks/libraries (React, Node.js, Django)
  | 'cloud'        // Cloud platforms (AWS, Azure, GCP)
  | 'devops'       // DevOps tools (Docker, Kubernetes, CI/CD)
  | 'db'           // Databases (PostgreSQL, MongoDB, Redis)
  | 'tool'         // Other tools (GraphQL, Kafka, Microservices)
  | 'protocol'     // Protocols (SNMP, REST, etc.)
  | 'methodology'  // Methodologies (Agile, Scrum, TDD)
  | 'role'         // Job roles (Software Engineer, DevOps Engineer)
  | 'soft'         // Soft skills (collaboration, leadership)
  | 'project'      // Project/product names (internal systems)
  | 'other';       // Other/uncategorized

/**
 * How well the user's profile matches the job
 */
export interface MatchAnalysis {
  overallScore: number; // 0-100

  // Detailed breakdown
  keywordMatch: {
    matched: ExtractedKeyword[];
    missing: ExtractedKeyword[];
    matchPercentage: number; // Target: 75-80%
  };

  experienceMatch: {
    hasRequiredExperience: boolean;
    hasPreferredExperience: boolean;
    score: number;
  };

  skillsMatch: {
    requiredSkillsMatched: string[];
    requiredSkillsMissing: string[];
    preferredSkillsMatched: string[];
    score: number;
  };

  // Recommendations
  recommendations: string[]; // What to emphasize, what's missing
  suggestedExperiences: string[]; // Which jobs/projects to highlight (IDs)
  suggestedSkills: string[]; // Which skills to emphasize (IDs)
}

// ============================================================================
// GENERATED RESUME
// ============================================================================

/**
 * AI-generated resume tailored to specific job
 * ATS-optimized with keyword density and formatting
 */
export interface GeneratedResume {
  id: string;

  // Job it was generated for
  jobDescriptionId: string;
  jobTitle: string;
  company: string;

  // Selected content from profile
  selectedExperiences: SelectedExperience[];
  selectedSkills: string[]; // Skill IDs
  selectedProjects: string[]; // Project IDs
  selectedEducation: string[]; // Education IDs

  // Generated content
  professionalSummary: string; // AI-generated summary optimized for this job
  content: ResumeContent;

  // ATS Optimization metrics
  atsOptimization: ATSOptimization;

  // Metadata
  generatedAt: number;
  lastExportedAt?: number;
  version: number;
}

export interface SelectedExperience {
  type: 'job' | 'internship' | 'volunteer' | 'project';
  id: string;
  selectedBullets: string[]; // Bullet IDs that were included
  bulletOrder: number[]; // Order of bullets in resume
}

export interface ResumeContent {
  // Sections in order
  sections: ResumeSection[];

  // Full resume as formatted text (for preview)
  formattedText?: string;
}

export interface ResumeSection {
  type: 'summary' | 'experience' | 'skills' | 'education' | 'projects' | 'certifications' | 'awards';
  title: string; // "Professional Summary", "Work Experience", etc.
  content: string | ResumeSectionItem[]; // Formatted content
  order: number; // Display order
}

export interface ResumeSectionItem {
  title: string; // Job title, degree, project name
  subtitle?: string; // Company, institution
  location?: string;
  dates?: string; // "Jan 2023 - Present"
  bullets?: string[];
  content?: string; // For summary section
}

/**
 * ATS Optimization analysis
 */
export interface ATSOptimization {
  // Keyword optimization
  keywordDensity: number; // 2-3% target
  keywordMatchRate: number; // 75-80% target
  totalKeywords: number;
  keywordsUsed: string[];

  // Format checks
  formatCompliance: {
    singleColumn: boolean;
    noHeadersFooters: boolean;
    standardFont: boolean; // Calibri, Arial
    noGraphics: boolean;
    noTables: boolean;
    score: number; // 0-100
  };

  // Content quality
  contentQuality: {
    hasMetrics: boolean; // Every bullet has quantifiable metric
    usesActionVerbs: boolean;
    aprFormatUsed: boolean; // Action + Project + Result
    averageBulletLength: number; // 15-20 words ideal
    score: number;
  };

  // Overall ATS score
  overallATSScore: number; // 0-100

  // Recommendations
  recommendations: string[];
}

// ============================================================================
// APPLICATION TRACKING
// ============================================================================

export interface Application {
  id: string;

  // Job details
  company: string;
  jobTitle: string;
  jobUrl?: string;
  location?: string;

  // Resume used
  generatedResumeId?: string; // Link to GeneratedResume
  jobDescriptionId?: string; // Link to JobDescriptionAnalysis

  // Application details
  appliedDate: number;
  appliedVia: 'linkedin' | 'company-website' | 'indeed' | 'other';

  // Status tracking
  status: ApplicationStatus;
  statusHistory: StatusChange[];

  // Follow-up
  followUpDate?: number;
  interviewDates?: number[];

  // Notes
  notes?: string;

  createdAt: number;
  updatedAt: number;
}

export type ApplicationStatus =
  | 'applied'
  | 'screening'
  | 'phone-screen'
  | 'technical-interview'
  | 'onsite-interview'
  | 'final-round'
  | 'offer'
  | 'accepted'
  | 'rejected'
  | 'withdrawn';

export interface StatusChange {
  from: ApplicationStatus;
  to: ApplicationStatus;
  date: number;
  notes?: string;
}

// ============================================================================
// STATISTICS & ANALYTICS
// ============================================================================

export interface ProfileStats {
  totalJobs: number;
  totalInternships: number;
  totalVolunteerWork: number;
  totalProjects: number;
  totalSkills: number;
  totalCertifications: number;

  yearsOfExperience: number; // Auto-calculated from jobs
  profileCompleteness: number; // 0-100
}

export interface ResumeStats {
  totalGenerated: number;
  totalApplications: number;

  applicationsByStatus: {
    [key in ApplicationStatus]: number;
  };

  averageATSScore: number;
  averageMatchScore: number;

  // Success metrics
  responseRate: number; // (screening + interviews) / applied
  interviewRate: number; // interviews / applied
  offerRate: number; // offers / applied
}

// ============================================================================
// STORAGE KEYS
// ============================================================================

export const PROFESSIONAL_PROFILE_KEY = 'uproot_professional_profile';
export const JOB_DESCRIPTIONS_KEY = 'uproot_job_descriptions';
export const GENERATED_RESUMES_KEY = 'uproot_generated_resumes';
export const APPLICATIONS_KEY = 'uproot_applications';

// Legacy keys (for migration)
export const RESUMES_STORAGE_KEY = 'uproot_resumes';
export const RESUME_APPLICATIONS_STORAGE_KEY = 'uproot_resume_applications';
