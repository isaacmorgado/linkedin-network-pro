/**
 * Profile Converter Utility
 *
 * Converts LinkedInProfile (from scraping/monitoring) to UserProfile (for pathfinding/resume)
 *
 * This utility bridges the gap between:
 * - LinkedInProfile: Basic profile info from scraping (types/index.ts)
 * - UserProfile: Rich profile for pathfinding and resume generation (types/resume-tailoring.ts)
 */

import type { LinkedInProfile } from '../types/index';
import type { UserProfile, ProfileMetadata, WorkExperience, Education } from '../types/resume-tailoring';

// ============================================================================
// MAIN CONVERSION FUNCTION
// ============================================================================

/**
 * Convert LinkedInProfile to UserProfile format
 *
 * Maps LinkedIn scraping data to the structured UserProfile format
 * used by pathfinding and resume generation features.
 *
 * @param linkedInProfile - Profile data from LinkedIn scraper
 * @returns UserProfile compatible with pathfinder and resume tools
 */
export function convertLinkedInProfileToUserProfile(
  linkedInProfile: LinkedInProfile
): UserProfile {
  // Map experience with structured achievements
  const workExperience: WorkExperience[] = linkedInProfile.experience.map((exp, index) => {
    // Parse duration to extract dates
    const { startDate, endDate } = parseDuration(exp.duration);

    // Create a basic achievement from the experience
    const achievement = {
      id: `${linkedInProfile.id}-exp-${index}-achievement-0`,
      bullet: `Worked as ${exp.title} at ${exp.company}`,
      action: 'Worked',
      object: `as ${exp.title}`,
      verified: false,
      source: 'inferred' as const,
      skills: [],
      keywords: [exp.title, exp.company],
      transferableSkills: [],
    };

    return {
      id: `${linkedInProfile.id}-exp-${index}`,
      company: exp.company,
      title: exp.title,
      startDate: startDate || new Date().toISOString(),
      endDate: endDate,
      location: exp.location,
      achievements: [achievement],
      skills: [],
      domains: linkedInProfile.industry ? [linkedInProfile.industry] : [],
      responsibilities: [],
    };
  });

  // Map education
  const education: Education[] = linkedInProfile.education.map((edu, index) => ({
    id: `${linkedInProfile.id}-edu-${index}`,
    school: edu.school,
    degree: edu.degree || '',
    field: edu.field,
    startDate: new Date().toISOString(), // Default - LinkedIn scraping may not have this
    endDate: null,
  }));

  // Map skills with default level
  const skills = linkedInProfile.skills.map(skill => ({
    name: skill.name,
    level: 'intermediate' as const,
    yearsOfExperience: 0,
  }));

  // Infer metadata from profile
  const metadata: ProfileMetadata = inferMetadata(linkedInProfile, workExperience);

  // Construct UserProfile
  const userProfile: UserProfile = {
    // Core identity
    id: linkedInProfile.id,
    name: linkedInProfile.name,
    email: linkedInProfile.publicId ? `${linkedInProfile.publicId}@linkedin.com` : undefined,
    location: linkedInProfile.location,
    title: linkedInProfile.headline || 'Professional',
    avatarUrl: linkedInProfile.avatarUrl,
    publicId: linkedInProfile.publicId || linkedInProfile.id,
    url: `https://www.linkedin.com/in/${linkedInProfile.publicId || linkedInProfile.id}/`,

    // Professional experience
    workExperience,

    // Education
    education,

    // Projects (empty for LinkedIn profiles - would need to be added manually)
    projects: [],

    // Skills
    skills,

    // Additional experience (optional fields)
    volunteer: undefined,
    certifications: undefined,
    publications: undefined,
    languages: undefined,

    // Metadata
    metadata,
  };

  return userProfile;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Parse duration string to extract start and end dates
 *
 * Examples:
 * - "Jan 2020 - Present" -> { startDate: "2020-01-01", endDate: null }
 * - "2018 - 2020" -> { startDate: "2018-01-01", endDate: "2020-12-31" }
 * - "3 years 2 months" -> estimate based on current date
 *
 * @param duration - Duration string from LinkedIn
 * @returns Start and end dates in ISO format
 */
function parseDuration(duration?: string): { startDate: string | null; endDate: string | null } {
  if (!duration) {
    return { startDate: null, endDate: null };
  }

  const now = new Date();

  // Check for "Present" or "Current"
  const isPresent = /present|current/i.test(duration);

  // Extract years and months if duration is in relative format (e.g., "3 years 2 months")
  const yearsMatch = duration.match(/(\d+)\s*(?:year|yr)/i);
  const monthsMatch = duration.match(/(\d+)\s*(?:month|mo)/i);

  if (yearsMatch || monthsMatch) {
    const years = yearsMatch ? parseInt(yearsMatch[1], 10) : 0;
    const months = monthsMatch ? parseInt(monthsMatch[1], 10) : 0;
    const totalMonths = years * 12 + months;

    // Calculate start date by subtracting from now
    const startDate = new Date(now);
    startDate.setMonth(startDate.getMonth() - totalMonths);

    return {
      startDate: startDate.toISOString(),
      endDate: isPresent ? null : now.toISOString(),
    };
  }

  // Extract year ranges (e.g., "2018 - 2020" or "Jan 2020 - Dec 2022")
  const yearRangeMatch = duration.match(/(\d{4})\s*-\s*(\d{4}|present|current)/i);
  if (yearRangeMatch) {
    const startYear = yearRangeMatch[1];
    const endYear = yearRangeMatch[2];

    return {
      startDate: `${startYear}-01-01T00:00:00.000Z`,
      endDate: /present|current/i.test(endYear) ? null : `${endYear}-12-31T23:59:59.999Z`,
    };
  }

  // Extract month and year (e.g., "Jan 2020 - Dec 2022")
  const monthYearMatch = duration.match(/([A-Za-z]+)\s+(\d{4})\s*-\s*([A-Za-z]+\s+\d{4}|present|current)/i);
  if (monthYearMatch) {
    const startMonth = parseMonth(monthYearMatch[1]);
    const startYear = monthYearMatch[2];
    const endPart = monthYearMatch[3];

    let endDate: string | null = null;
    if (!/present|current/i.test(endPart)) {
      const endMatch = endPart.match(/([A-Za-z]+)\s+(\d{4})/);
      if (endMatch) {
        const endMonth = parseMonth(endMatch[1]);
        const endYear = endMatch[2];
        endDate = `${endYear}-${endMonth.toString().padStart(2, '0')}-01T00:00:00.000Z`;
      }
    }

    return {
      startDate: `${startYear}-${startMonth.toString().padStart(2, '0')}-01T00:00:00.000Z`,
      endDate,
    };
  }

  // Fallback: return null for both
  return { startDate: null, endDate: null };
}

/**
 * Parse month name to month number (1-12)
 *
 * @param monthName - Month name (e.g., "Jan", "January")
 * @returns Month number (1-12)
 */
function parseMonth(monthName: string): number {
  const months: Record<string, number> = {
    jan: 1, january: 1,
    feb: 2, february: 2,
    mar: 3, march: 3,
    apr: 4, april: 4,
    may: 5,
    jun: 6, june: 6,
    jul: 7, july: 7,
    aug: 8, august: 8,
    sep: 9, september: 9,
    oct: 10, october: 10,
    nov: 11, november: 11,
    dec: 12, december: 12,
  };

  const normalized = monthName.toLowerCase().trim();
  return months[normalized] || 1;
}

/**
 * Infer metadata from LinkedIn profile
 *
 * Estimates:
 * - Total years of experience
 * - Career domains
 * - Seniority level
 * - Career stage
 *
 * @param profile - LinkedIn profile
 * @param workExperience - Parsed work experience
 * @returns Profile metadata
 */
function inferMetadata(
  profile: LinkedInProfile,
  workExperience: WorkExperience[]
): ProfileMetadata {
  // Calculate total years of experience
  const totalYearsExperience = workExperience.reduce((total, exp) => {
    const start = new Date(exp.startDate);
    const end = exp.endDate ? new Date(exp.endDate) : new Date();
    const years = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 365);
    return total + Math.max(0, years);
  }, 0);

  // Infer domains from industry and experience
  const domains: string[] = [];
  if (profile.industry) {
    domains.push(profile.industry);
  }
  // Add unique companies as domains (simplified approach)
  const uniqueCompanies = new Set(workExperience.map(exp => exp.company));
  if (uniqueCompanies.size > 0) {
    // Don't add companies as domains directly - keep it clean
  }

  // Infer seniority from headline and years of experience
  const seniority = inferSeniority(profile.headline || '', totalYearsExperience);

  // Infer career stage
  const careerStage = inferCareerStage(totalYearsExperience, workExperience);

  return {
    totalYearsExperience: Math.round(totalYearsExperience * 10) / 10, // Round to 1 decimal
    domains: domains.length > 0 ? domains : ['Professional Services'],
    seniority,
    careerStage,
  };
}

/**
 * Infer seniority level from headline and years of experience
 *
 * @param headline - LinkedIn headline
 * @param years - Total years of experience
 * @returns Seniority level
 */
function inferSeniority(
  headline: string,
  years: number
): 'entry' | 'mid' | 'senior' | 'staff' | 'principal' {
  const headlineLower = headline.toLowerCase();

  // Check for explicit seniority markers in headline (FIRST - most reliable)
  if (headlineLower.includes('principal') || headlineLower.includes('chief') || headlineLower.includes('vp') || headlineLower.includes('director')) {
    return 'principal';
  }
  if (headlineLower.includes('staff') || headlineLower.includes('architect')) {
    return 'staff';
  }
  if (headlineLower.includes('senior') || headlineLower.includes('sr.') || headlineLower.includes('lead')) {
    return 'senior';
  }
  if (headlineLower.includes('junior') || headlineLower.includes('jr.') || headlineLower.includes('associate')) {
    return 'entry';
  }

  // Check for mid-level indicators in headline (e.g., "Software Engineer", "Developer")
  // These default to mid-level unless proven otherwise by years
  const hasMidLevelTitle =
    headlineLower.includes('engineer') ||
    headlineLower.includes('developer') ||
    headlineLower.includes('designer') ||
    headlineLower.includes('analyst') ||
    headlineLower.includes('consultant');

  // If headline suggests mid-level and years support it (or are unknown/low), return mid
  if (hasMidLevelTitle && years < 10) {
    return 'mid';
  }

  // Infer from years of experience (fallback when headline doesn't specify)
  if (years < 2) return 'entry';
  if (years < 5) return 'mid';
  if (years < 10) return 'senior';
  if (years < 15) return 'staff';
  return 'principal';
}

/**
 * Infer career stage from experience
 *
 * @param years - Total years of experience
 * @param workExperience - Work experience array
 * @returns Career stage
 */
function inferCareerStage(
  years: number,
  workExperience: WorkExperience[]
): 'student' | 'career-changer' | 'professional' {
  // If less than 1 year and no experience, likely student
  if (years < 1 && workExperience.length === 0) {
    return 'student';
  }

  // If less than 3 years, could be student or early professional
  if (years < 3) {
    return 'student';
  }

  // Check for career changes (different domains in recent history)
  if (workExperience.length >= 2) {
    const recentExperiences = workExperience.slice(0, 2);
    const domains = new Set(recentExperiences.flatMap(exp => exp.domains));

    // If multiple very different domains, might be career changer
    if (domains.size > 2) {
      return 'career-changer';
    }
  }

  return 'professional';
}

// ============================================================================
// BATCH CONVERSION
// ============================================================================

/**
 * Convert multiple LinkedIn profiles to UserProfile format
 *
 * Useful for bulk operations like network analysis
 *
 * @param profiles - Array of LinkedIn profiles
 * @returns Array of UserProfiles
 */
export function convertLinkedInProfilesToUserProfiles(
  profiles: LinkedInProfile[]
): UserProfile[] {
  return profiles.map(convertLinkedInProfileToUserProfile);
}

// ============================================================================
// REVERSE CONVERSION (UserProfile -> LinkedInProfile)
// ============================================================================

/**
 * Convert UserProfile back to LinkedInProfile format
 *
 * Useful when updating LinkedIn profiles from local data
 *
 * @param userProfile - UserProfile from resume/pathfinding
 * @returns LinkedInProfile compatible with scraper/monitoring
 */
export function convertUserProfileToLinkedInProfile(
  userProfile: UserProfile
): LinkedInProfile {
  const linkedInProfile: LinkedInProfile = {
    id: userProfile.id || userProfile.publicId || `user-${Date.now()}`,
    publicId: userProfile.publicId,
    name: userProfile.name,
    headline: userProfile.title,
    location: userProfile.location,
    industry: userProfile.metadata.domains[0],
    avatarUrl: userProfile.avatarUrl,
    about: undefined,
    experience: userProfile.workExperience.map(exp => ({
      company: exp.company,
      title: exp.title,
      duration: formatDuration(exp.startDate, exp.endDate),
      location: exp.location,
    })),
    education: userProfile.education.map(edu => ({
      school: edu.school,
      degree: edu.degree,
      field: edu.field,
    })),
    skills: userProfile.skills.map(skill => ({
      name: skill.name,
      endorsementCount: 0,
      endorsedBy: [],
    })),
    connections: undefined,
    mutualConnections: [],
    recentPosts: [],
    certifications: [],
    userPosts: [],
    engagedPosts: [],
    recentActivity: [],
    scrapedAt: new Date().toISOString(),
  };

  return linkedInProfile;
}

/**
 * Format duration from start and end dates
 *
 * @param startDate - Start date in ISO format
 * @param endDate - End date in ISO format (null if current)
 * @returns Duration string (e.g., "Jan 2020 - Present")
 */
function formatDuration(startDate: string, endDate: string | null): string {
  const start = new Date(startDate);
  const end = endDate ? new Date(endDate) : null;

  const formatDate = (date: Date): string => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${months[date.getMonth()]} ${date.getFullYear()}`;
  };

  const startStr = formatDate(start);
  const endStr = end ? formatDate(end) : 'Present';

  return `${startStr} - ${endStr}`;
}
