/**
 * Profile Builder Service
 * Converts user form inputs from Resume tab into UserProfile schema
 */

import type {
  UserProfile,
  WorkExperience,
  Achievement,
  Education,
  Project,
  Skill,
  Certification,
  Language,
  ProfileMetadata,
  Metric,
  VolunteerExperience,
} from '../types/resume-tailoring';
import { log, LogCategory } from '../utils/logger';

/**
 * Form data from Resume tab (what user inputs)
 */
export interface ResumeFormData {
  // Basic info
  basicInfo: {
    name: string;
    email?: string;
    phone?: string;
    location?: string;
    title: string; // Current/desired job title
    linkedin?: string;
    github?: string;
    website?: string;
  };

  // Work experience entries
  workExperience: WorkExperienceFormEntry[];

  // Education entries
  education: EducationFormEntry[];

  // Projects
  projects: ProjectFormEntry[];

  // Skills
  skills: SkillFormEntry[];

  // Optional sections
  certifications?: CertificationFormEntry[];
  languages?: LanguageFormEntry[];
  volunteer?: VolunteerFormEntry[];
}

export interface WorkExperienceFormEntry {
  company: string;
  title: string;
  startDate: string; // "2023-01-01" or "Jan 2023"
  endDate?: string | null; // null = current
  location?: string;

  // Achievement bullets (user types these)
  bullets: string[];

  // Optional: user can tag with skills/domains
  skills?: string[];
  domains?: string[];
}

export interface EducationFormEntry {
  school: string;
  degree: string; // "Bachelor's", "Master's", etc.
  field?: string; // "Computer Science"
  startDate: string;
  endDate?: string | null;
  gpa?: number;
  honors?: string[];
  relevantCourses?: string[];
}

export interface ProjectFormEntry {
  name: string;
  description: string;
  startDate?: string;
  endDate?: string;
  url?: string;
  bullets: string[];
  skills?: string[];
}

export interface SkillFormEntry {
  name: string;
  level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  yearsOfExperience?: number;
  category?: string; // "Languages", "Frameworks", etc.
}

export interface CertificationFormEntry {
  name: string;
  issuer: string;
  dateObtained: string;
  expirationDate?: string;
  credentialId?: string;
  url?: string;
}

export interface LanguageFormEntry {
  name: string;
  proficiency: 'elementary' | 'limited-working' | 'professional-working' | 'full-professional' | 'native';
}

export interface VolunteerFormEntry {
  organization: string;
  role: string;
  startDate: string;
  endDate?: string | null;
  description?: string;
  bullets?: string[];
}

/**
 * Convert form data to UserProfile
 * This is the main entry point for Resume tab → Profile conversion
 */
export function buildUserProfile(formData: ResumeFormData): UserProfile {
  const endTrace = log.trace(LogCategory.SERVICE, 'buildUserProfile', {
    name: formData.basicInfo.name,
  });

  try {
    log.info(LogCategory.SERVICE, 'Building user profile from form data', {
      experienceCount: formData.workExperience.length,
      projectsCount: formData.projects.length,
      skillsCount: formData.skills.length,
    });

    // Convert each section
    const workExperience = formData.workExperience.map(convertWorkExperience);
    const education = formData.education.map(convertEducation);
    const projects = formData.projects.map(convertProject);
    const skills = formData.skills.map(convertSkill);

    // Calculate metadata
    const metadata = calculateMetadata(formData, workExperience);

    const profile: UserProfile = {
      name: formData.basicInfo.name,
      email: formData.basicInfo.email,
      phone: formData.basicInfo.phone,
      location: formData.basicInfo.location,
      title: formData.basicInfo.title,
      workExperience,
      education,
      projects,
      skills,
      certifications: formData.certifications?.map(convertCertification),
      languages: formData.languages?.map(convertLanguage),
      volunteer: formData.volunteer?.map(convertVolunteer),
      metadata,
    };

    log.info(LogCategory.SERVICE, 'User profile built successfully', {
      totalYearsExperience: metadata.totalYearsExperience,
      careerStage: metadata.careerStage,
    });

    endTrace(profile);
    return profile;
  } catch (error) {
    log.error(LogCategory.SERVICE, 'Failed to build user profile', error as Error);
    endTrace();
    throw error;
  }
}

/**
 * Convert work experience form entry to WorkExperience with parsed achievements
 */
function convertWorkExperience(entry: WorkExperienceFormEntry): WorkExperience {
  log.debug(LogCategory.SERVICE, `Converting work experience: ${entry.company}`);

  // Convert bullet strings to Achievement objects
  const achievements: Achievement[] = entry.bullets.map((bullet, index) =>
    parseAchievement(bullet, `${entry.company}-${index}`)
  );

  return {
    id: generateId(`exp-${entry.company}-${entry.title}`),
    company: entry.company,
    title: entry.title,
    startDate: normalizeDate(entry.startDate),
    endDate: entry.endDate ? normalizeDate(entry.endDate) : null,
    location: entry.location,
    achievements,
    skills: entry.skills || extractSkillsFromBullets(entry.bullets),
    domains: entry.domains || [],
    responsibilities: extractResponsibilities(entry.bullets),
  };
}

/**
 * Parse a bullet point into an Achievement object
 * Extracts action, object, result, metrics, skills
 */
function parseAchievement(bullet: string, id: string): Achievement {
  // Extract action verb (first word usually)
  const action = extractActionVerb(bullet);

  // Extract object (what was built/done)
  const object = extractObject(bullet, action);

  // Extract result (if any)
  const result = extractResult(bullet);

  // Extract metrics (numbers with context)
  const metrics = extractMetrics(bullet);

  // Extract skills mentioned
  const skills = extractSkillsFromText(bullet);

  // Extract keywords for ATS
  const keywords = extractKeywords(bullet);

  // Determine transferable skills
  const transferableSkills = inferTransferableSkills(action, bullet);

  return {
    id: generateId(id),
    bullet: bullet.trim(),
    action,
    object,
    result,
    metrics,
    skills,
    keywords,
    transferableSkills,
    verified: true, // User-provided = verified
    source: 'user',
  };
}

/**
 * Extract action verb from bullet
 * Examples: "Built", "Led", "Optimized", "Developed"
 */
function extractActionVerb(bullet: string): string {
  const actionVerbs = [
    'built', 'developed', 'created', 'designed', 'implemented',
    'led', 'managed', 'directed', 'coordinated',
    'optimized', 'improved', 'enhanced', 'increased',
    'architected', 'engineered', 'deployed',
    'automated', 'streamlined', 'reduced',
    'analyzed', 'researched', 'investigated',
    'collaborated', 'partnered', 'worked',
  ];

  const firstWord = bullet.trim().split(/\s+/)[0]?.toLowerCase() || '';

  // Check if first word is an action verb
  if (actionVerbs.includes(firstWord)) {
    return firstWord.charAt(0).toUpperCase() + firstWord.slice(1);
  }

  // Check if any action verb appears early in the bullet
  const words = bullet.toLowerCase().split(/\s+/).slice(0, 3);
  for (const word of words) {
    if (actionVerbs.includes(word)) {
      return word.charAt(0).toUpperCase() + word.slice(1);
    }
  }

  return 'Worked on'; // Default
}

/**
 * Extract object (what was worked on)
 */
function extractObject(bullet: string, action: string): string {
  // Simple heuristic: take words after action verb until first comma or "by"/"to"/"for"
  const afterAction = bullet.substring(bullet.toLowerCase().indexOf(action.toLowerCase()) + action.length).trim();

  // Extract up to first stopping word
  const stopWords = [' by ', ' to ', ' for ', ' with ', ' using ', ' that ', ' which ', ','];
  let object = afterAction;

  for (const stop of stopWords) {
    const idx = afterAction.toLowerCase().indexOf(stop);
    if (idx > 0) {
      object = afterAction.substring(0, idx);
      break;
    }
  }

  return object.trim() || 'project';
}

/**
 * Extract result (outcome/impact)
 */
function extractResult(bullet: string): string | undefined {
  // Look for result indicators
  const resultPatterns = [
    /resulting in (.+?)(?:[,.]|$)/i,
    /which (.+?)(?:[,.]|$)/i,
    /to (.+?)(?:[,.]|$)/i,
    /reducing (.+?)(?:[,.]|$)/i,
    /increasing (.+?)(?:[,.]|$)/i,
    /improving (.+?)(?:[,.]|$)/i,
  ];

  for (const pattern of resultPatterns) {
    const match = bullet.match(pattern);
    if (match && match[1]) {
      return match[1].trim();
    }
  }

  return undefined;
}

/**
 * Extract metrics from bullet
 */
function extractMetrics(bullet: string): Metric[] {
  const metrics: Metric[] = [];

  // Pattern: number + unit
  const metricPatterns = [
    /(\d+(?:\.\d+)?)\s*(%|percent)/gi,
    /(\d+(?:,\d{3})*)\s*(users|customers|clients|requests)/gi,
    /(\d+(?:\.\d+)?)\s*(x|times)/gi,
    /(\d+)\s*(hours|days|weeks|months)/gi,
    /\$(\d+(?:,\d{3})*(?:\.\d{2})?)\s*(k|m|million|billion)?/gi,
  ];

  for (const pattern of metricPatterns) {
    let match;
    while ((match = pattern.exec(bullet)) !== null) {
      const value = parseFloat(match[1].replace(/,/g, ''));
      const unit = match[2] || '';

      // Determine type
      let type: 'increase' | 'decrease' | 'reduction' | 'scale' | 'count' = 'count';
      if (bullet.toLowerCase().includes('increas')) type = 'increase';
      else if (bullet.toLowerCase().includes('reduc')) type = 'reduction';
      else if (bullet.toLowerCase().includes('decreas')) type = 'decrease';
      else if (bullet.toLowerCase().includes('serv')) type = 'scale';

      metrics.push({ value, unit, type });
    }
  }

  return metrics;
}

/**
 * Escape special regex characters (same fix as keyword-extractor.ts)
 */
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Extract skills mentioned in text
 */
function extractSkillsFromText(text: string): string[] {
  const skills: string[] = [];

  // Common tech skills to detect
  const techSkills = [
    'Python', 'JavaScript', 'TypeScript', 'Java', 'C++', 'Go', 'Rust',
    'React', 'Vue', 'Angular', 'Node.js', 'Django', 'Flask', 'Express',
    'SQL', 'PostgreSQL', 'MySQL', 'MongoDB', 'Redis',
    'AWS', 'Azure', 'GCP', 'Docker', 'Kubernetes', 'Jenkins',
    'Git', 'CI/CD', 'REST', 'GraphQL', 'gRPC',
  ];

  for (const skill of techSkills) {
    // Escape special regex characters (fixes C++ crash)
    if (new RegExp(`\\b${escapeRegex(skill)}\\b`, 'i').test(text)) {
      skills.push(skill);
    }
  }

  return [...new Set(skills)]; // Remove duplicates
}

/**
 * Extract keywords for ATS
 */
function extractKeywords(text: string): string[] {
  // Extract important nouns and tech terms
  const words = text.toLowerCase().split(/\s+/);
  const keywords: string[] = [];

  // Filter for meaningful words (length > 3, not common words)
  const commonWords = new Set(['the', 'and', 'with', 'for', 'that', 'this', 'from', 'using']);

  for (const word of words) {
    const cleaned = word.replace(/[^a-z0-9]/g, '');
    if (cleaned.length > 3 && !commonWords.has(cleaned)) {
      keywords.push(cleaned);
    }
  }

  return [...new Set(keywords)];
}

/**
 * Infer transferable skills from action and context
 */
function inferTransferableSkills(action: string, bullet: string): string[] {
  const transferable: string[] = [];

  const actionLower = action.toLowerCase();
  const bulletLower = bullet.toLowerCase();

  // Leadership skills
  if (['led', 'managed', 'directed', 'coordinated'].includes(actionLower)) {
    transferable.push('leadership');
  }

  // Communication skills
  if (['presented', 'communicated', 'collaborated', 'partnered'].includes(actionLower)) {
    transferable.push('communication');
  }

  // Problem-solving
  if (['optimized', 'improved', 'debugged', 'solved', 'fixed'].includes(actionLower)) {
    transferable.push('problem-solving');
  }

  // Technical skills
  if (['built', 'developed', 'implemented', 'created', 'engineered'].includes(actionLower)) {
    transferable.push('technical-implementation');
  }

  // Team collaboration
  if (bulletLower.includes('team') || bulletLower.includes('collaborate')) {
    transferable.push('teamwork');
  }

  return [...new Set(transferable)];
}

/**
 * Extract responsibilities from bullets
 */
function extractResponsibilities(bullets: string[]): string[] {
  const responsibilities = new Set<string>();

  const responsibilityKeywords = [
    'code review', 'testing', 'deployment', 'documentation',
    'mentoring', 'training', 'presenting', 'planning',
  ];

  for (const bullet of bullets) {
    const lower = bullet.toLowerCase();
    for (const keyword of responsibilityKeywords) {
      if (lower.includes(keyword)) {
        responsibilities.add(keyword);
      }
    }
  }

  return Array.from(responsibilities);
}

/**
 * Extract skills from all bullets
 */
function extractSkillsFromBullets(bullets: string[]): string[] {
  const allSkills = bullets.flatMap(extractSkillsFromText);
  return [...new Set(allSkills)];
}

/**
 * Convert other form entries
 */
function convertEducation(entry: EducationFormEntry): Education {
  return {
    id: generateId(`edu-${entry.school}`),
    school: entry.school,
    degree: entry.degree,
    field: entry.field,
    startDate: normalizeDate(entry.startDate),
    endDate: entry.endDate ? normalizeDate(entry.endDate) : null,
    gpa: entry.gpa,
    honors: entry.honors,
    relevantCourses: entry.relevantCourses,
  };
}

function convertProject(entry: ProjectFormEntry): Project {
  const achievements = entry.bullets.map((bullet, i) =>
    parseAchievement(bullet, `${entry.name}-${i}`)
  );

  return {
    id: generateId(`proj-${entry.name}`),
    name: entry.name,
    description: entry.description,
    startDate: entry.startDate,
    endDate: entry.endDate,
    url: entry.url,
    achievements,
    skills: entry.skills || extractSkillsFromBullets(entry.bullets),
    domains: [],
    treatedAsExperience: false, // Will be set based on career stage
  };
}

function convertSkill(entry: SkillFormEntry): Skill {
  return {
    name: entry.name,
    level: entry.level,
    yearsOfExperience: entry.yearsOfExperience || estimateYearsFromLevel(entry.level),
    category: entry.category,
  };
}

function convertCertification(entry: CertificationFormEntry): Certification {
  return {
    id: generateId(`cert-${entry.name}`),
    name: entry.name,
    issuer: entry.issuer,
    dateObtained: normalizeDate(entry.dateObtained),
    expirationDate: entry.expirationDate ? normalizeDate(entry.expirationDate) : undefined,
    credentialId: entry.credentialId,
    url: entry.url,
  };
}

function convertLanguage(entry: LanguageFormEntry): Language {
  return {
    name: entry.name,
    proficiency: entry.proficiency,
  };
}

function convertVolunteer(entry: VolunteerFormEntry): VolunteerExperience {
  const achievements = (entry.bullets || []).map((bullet, i) =>
    parseAchievement(bullet, `${entry.organization}-${i}`)
  );

  return {
    id: generateId(`vol-${entry.organization}`),
    organization: entry.organization,
    role: entry.role,
    startDate: normalizeDate(entry.startDate),
    endDate: entry.endDate ? normalizeDate(entry.endDate) : null,
    description: entry.description,
    achievements,
    skills: extractSkillsFromBullets(entry.bullets || []),
  };
}

/**
 * Calculate metadata from form data
 */
function calculateMetadata(
  formData: ResumeFormData,
  workExperience: WorkExperience[]
): ProfileMetadata {
  // Calculate total years of experience
  const totalYearsExperience = workExperience.reduce((total, exp) => {
    const start = new Date(exp.startDate);
    const end = exp.endDate ? new Date(exp.endDate) : new Date();
    const years = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 365);
    return total + years;
  }, 0);

  // Determine domains
  const domains = [...new Set(workExperience.flatMap(exp => exp.domains))];

  // Determine seniority
  let seniority: 'entry' | 'mid' | 'senior' | 'staff' | 'principal' = 'entry';
  if (totalYearsExperience >= 10) seniority = 'principal';
  else if (totalYearsExperience >= 7) seniority = 'staff';
  else if (totalYearsExperience >= 5) seniority = 'senior';
  else if (totalYearsExperience >= 2) seniority = 'mid';

  // Determine career stage
  let careerStage: 'student' | 'career-changer' | 'professional' = 'professional';
  if (totalYearsExperience < 1 && formData.projects.length > 0) {
    careerStage = 'student';
  } else if (domains.length > 2) {
    careerStage = 'career-changer'; // Multiple diverse domains
  }

  return {
    totalYearsExperience: Math.round(totalYearsExperience * 10) / 10,
    domains,
    seniority,
    careerStage,
  };
}

/**
 * Utility functions
 */

function generateId(base: string): string {
  return `${base.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`;
}

function normalizeDate(date: string): string {
  // Convert various date formats to ISO string
  try {
    return new Date(date).toISOString().split('T')[0];
  } catch {
    return date; // Return as-is if can't parse
  }
}

function estimateYearsFromLevel(level: 'beginner' | 'intermediate' | 'advanced' | 'expert'): number {
  const mapping = {
    beginner: 0.5,
    intermediate: 1.5,
    advanced: 3,
    expert: 5,
  };
  return mapping[level];
}

/**
 * Validate form data before building profile
 */
export function validateResumeFormData(formData: ResumeFormData): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Required fields
  if (!formData.basicInfo.name?.trim()) {
    errors.push('Name is required');
  }

  if (!formData.basicInfo.title?.trim()) {
    errors.push('Job title is required');
  }

  // At least one of: work experience or projects
  if (formData.workExperience.length === 0 && formData.projects.length === 0) {
    errors.push('At least one work experience or project is required');
  }

  // Validate date formats
  const allDates = [
    ...formData.workExperience.flatMap(exp => [exp.startDate, exp.endDate].filter(Boolean)),
    ...formData.education.flatMap(edu => [edu.startDate, edu.endDate].filter(Boolean)),
  ];

  for (const date of allDates) {
    if (date && isNaN(new Date(date as string).getTime())) {
      errors.push(`Invalid date format: ${date}`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
