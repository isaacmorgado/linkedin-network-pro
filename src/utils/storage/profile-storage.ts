/**
 * Professional Profile Storage Module
 * Handles storage operations for user professional profile
 */

import { log, LogCategory } from '../logger';
import type { ProfessionalProfile, PersonalInfo, ProfileStats } from '../../types/resume';
import { PROFESSIONAL_PROFILE_KEY } from '../../types/resume';

/**
 * Get the user's professional profile
 * Returns empty profile if none exists
 */
export async function getProfessionalProfile(): Promise<ProfessionalProfile> {
  return log.trackAsync(LogCategory.STORAGE, 'getProfessionalProfile', async () => {
    try {
      log.debug(LogCategory.STORAGE, 'Fetching professional profile from storage');
      const result = await chrome.storage.local.get(PROFESSIONAL_PROFILE_KEY);
      const profile = result[PROFESSIONAL_PROFILE_KEY];

      if (!profile) {
        log.info(LogCategory.STORAGE, 'No profile found, returning empty profile structure');
        // Return empty profile structure
        return {
          personalInfo: {
            fullName: '',
            email: '',
          },
          jobs: [],
          internships: [],
          volunteerWork: [],
          technicalSkills: [],
          softSkills: [],
          tools: [],
          certifications: [],
          languages: [],
          education: [],
          projects: [],
          publications: [],
          achievements: [],
          awards: [],
          createdAt: Date.now(),
          updatedAt: Date.now(),
          version: 1,
        };
      }

      log.info(LogCategory.STORAGE, 'Professional profile retrieved', {
        fullName: profile.personalInfo.fullName,
        jobsCount: profile.jobs.length,
        educationCount: profile.education.length
      });
      console.log('[Uproot] Retrieved professional profile');
      return profile;
    } catch (error) {
      log.error(LogCategory.STORAGE, 'Error getting professional profile', { error });
      console.error('[Uproot] Error getting professional profile:', error);
      throw error;
    }
  });
}

/**
 * Save the entire professional profile
 */
export async function saveProfessionalProfile(profile: ProfessionalProfile): Promise<void> {
  return log.trackAsync(LogCategory.STORAGE, 'saveProfessionalProfile', async () => {
    try {
      log.debug(LogCategory.STORAGE, 'Saving professional profile', {
        fullName: profile.personalInfo.fullName,
        jobsCount: profile.jobs.length,
        educationCount: profile.education.length
      });
      const updatedProfile = {
        ...profile,
        updatedAt: Date.now(),
      };

      await chrome.storage.local.set({ [PROFESSIONAL_PROFILE_KEY]: updatedProfile });
      log.change(LogCategory.STORAGE, 'professionalProfile', 'update', {
        fullName: profile.personalInfo.fullName,
        jobsCount: profile.jobs.length
      });
      console.log('[Uproot] Professional profile saved');
    } catch (error) {
      log.error(LogCategory.STORAGE, 'Error saving professional profile', { error });
      console.error('[Uproot] Error saving professional profile:', error);
      throw error;
    }
  });
}

/**
 * Update personal information
 */
export async function updatePersonalInfo(info: PersonalInfo): Promise<void> {
  return log.trackAsync(LogCategory.STORAGE, 'updatePersonalInfo', async () => {
    log.debug(LogCategory.STORAGE, 'Updating personal info', { fullName: info.fullName, email: info.email });
    const profile = await getProfessionalProfile();
    profile.personalInfo = info;
    await saveProfessionalProfile(profile);
    log.change(LogCategory.STORAGE, 'personalInfo', 'update', { fullName: info.fullName });
    console.log('[Uproot] Personal info updated');
  });
}

/**
 * Get profile statistics
 */
export async function getProfileStats(): Promise<ProfileStats> {
  const profile = await getProfessionalProfile();

  // Calculate years of experience
  let totalMonths = 0;
  profile.jobs.forEach((job) => {
    const startDate = new Date(job.startDate);
    const endDate = job.endDate ? new Date(job.endDate) : new Date();
    const months = (endDate.getFullYear() - startDate.getFullYear()) * 12 +
      (endDate.getMonth() - startDate.getMonth());
    totalMonths += months;
  });

  const yearsOfExperience = Math.floor(totalMonths / 12);

  // Calculate profile completeness (0-100)
  let completeness = 0;
  if (profile.personalInfo.fullName) completeness += 10;
  if (profile.personalInfo.email) completeness += 10;
  if (profile.personalInfo.professionalSummary) completeness += 10;
  if (profile.jobs.length > 0) completeness += 20;
  if (profile.technicalSkills.length > 0) completeness += 15;
  if (profile.education.length > 0) completeness += 15;
  if (profile.projects.length > 0) completeness += 10;
  if (profile.certifications.length > 0) completeness += 10;

  return {
    totalJobs: profile.jobs.length,
    totalInternships: profile.internships.length,
    totalVolunteerWork: profile.volunteerWork.length,
    totalProjects: profile.projects.length,
    totalSkills: profile.technicalSkills.length + profile.softSkills.length,
    totalCertifications: profile.certifications.length,
    yearsOfExperience,
    profileCompleteness: Math.min(100, completeness),
  };
}


/**
 * Create a new professional profile
 */
export async function createProfessionalProfile(
  personalInfo: ProfessionalProfile['personalInfo']
): Promise<ProfessionalProfile> {
  const now = Date.now();
  const profile: ProfessionalProfile = {
    personalInfo,
    jobs: [],
    internships: [],
    volunteerWork: [],
    technicalSkills: [],
    softSkills: [],
    tools: [],
    certifications: [],
    languages: [],
    education: [],
    projects: [],
    publications: [],
    achievements: [],
    awards: [],
    createdAt: now,
    updatedAt: now,
    version: 1,
  };

  await saveProfessionalProfile(profile);
  return profile;
}

// Note: getProfileStats is defined earlier in this file (line 1215)

/**
 * Calculate years of experience from job history
 */
// @ts-expect-error - Reserved for future use
function __calculateYearsOfExperience(profile: ProfessionalProfile): number {
  if (profile.jobs.length === 0) return 0;

  let totalMonths = 0;

  for (const job of profile.jobs) {
    const startDate = parseDate(job.startDate);
    const endDate = job.endDate ? parseDate(job.endDate) : new Date();

    if (startDate && endDate) {
      const months = Math.max(
        0,
        (endDate.getFullYear() - startDate.getFullYear()) * 12 +
          (endDate.getMonth() - startDate.getMonth())
      );
      totalMonths += months;
    }
  }

  return Math.round((totalMonths / 12) * 10) / 10;
}

/**
 * Parse date string in "YYYY-MM" format
 */
function parseDate(dateStr: string): Date | null {
  const match = dateStr.match(/^(\d{4})-(\d{2})$/);
  if (!match) return null;

  const year = parseInt(match[1]);
  const month = parseInt(match[2]) - 1; // JS months are 0-indexed

  return new Date(year, month, 1);
}

/**
 * Calculate profile completeness percentage
 */
// @ts-expect-error - Reserved for future use
function __calculateProfileCompleteness(profile: ProfessionalProfile): number {
  let score = 0;
  let maxScore = 0;

  // Personal info (30 points)
  maxScore += 30;
  if (profile.personalInfo.fullName) score += 5;
  if (profile.personalInfo.email) score += 5;
  if (profile.personalInfo.phone) score += 3;
  if (profile.personalInfo.location) score += 3;
  if (profile.personalInfo.linkedinUrl) score += 3;
  if (profile.personalInfo.githubUrl) score += 3;
  if (profile.personalInfo.portfolioUrl) score += 3;
  if (profile.personalInfo.professionalSummary) score += 5;

  // Work experience (35 points)
  maxScore += 35;
  if (profile.jobs.length > 0) {
    score += 15;
    const hasDetailedBullets = profile.jobs.some((j) => j.bullets.length >= 3);
    if (hasDetailedBullets) score += 10;
    if (profile.jobs.length >= 2) score += 10;
  }

  // Skills (15 points)
  maxScore += 15;
  if (profile.technicalSkills.length >= 5) score += 8;
  if (profile.softSkills.length >= 3) score += 4;
  if (profile.tools.length >= 5) score += 3;

  // Education (10 points)
  maxScore += 10;
  if (profile.education.length > 0) score += 10;

  // Projects (5 points)
  maxScore += 5;
  if (profile.projects.length > 0) score += 5;

  // Certifications (5 points)
  maxScore += 5;
  if (profile.certifications.length > 0) score += 5;

  return Math.round((score / maxScore) * 100);
}

