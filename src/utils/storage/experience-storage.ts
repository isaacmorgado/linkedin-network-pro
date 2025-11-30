/**
 * Work Experience Storage Module
 * Handles storage operations for job, internship, and volunteer experiences
 */

import { log, LogCategory } from '../logger';
import type { JobExperience, InternshipExperience, VolunteerExperience } from '../../types/resume';
import { getProfessionalProfile, saveProfessionalProfile } from './profile-storage';

/**
 * Add new job experience
 */
export async function addJobExperience(job: Omit<JobExperience, 'id' | 'createdAt' | 'updatedAt'>): Promise<JobExperience> {
  return log.trackAsync(LogCategory.STORAGE, 'addJobExperience', async () => {
    log.debug(LogCategory.STORAGE, 'Adding job experience', { title: job.title, company: job.company });
    const profile = await getProfessionalProfile();

    const newJob: JobExperience = {
      ...job,
      id: `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    profile.jobs.push(newJob);
    await saveProfessionalProfile(profile);

    log.change(LogCategory.STORAGE, 'jobExperience', 'create', { id: newJob.id, title: newJob.title, company: newJob.company });
    console.log('[Uproot] Added job:', newJob.title, 'at', newJob.company);
    return newJob;
  });
}

/**
 * Update existing job experience
 */
export async function updateJobExperience(id: string, updates: Partial<JobExperience>): Promise<void> {
  return log.trackAsync(LogCategory.STORAGE, 'updateJobExperience', async () => {
    log.debug(LogCategory.STORAGE, 'Updating job experience', { id, updates });
    const profile = await getProfessionalProfile();
    const index = profile.jobs.findIndex((j) => j.id === id);

    if (index === -1) {
      log.error(LogCategory.STORAGE, 'Job not found', { id });
      throw new Error('Job not found');
    }

    profile.jobs[index] = {
      ...profile.jobs[index],
      ...updates,
      updatedAt: Date.now(),
    };

    await saveProfessionalProfile(profile);
    log.change(LogCategory.STORAGE, 'jobExperience', 'update', { id, updates });
    console.log('[Uproot] Updated job:', id);
  });
}

/**
 * Delete job experience
 */
export async function deleteJobExperience(id: string): Promise<void> {
  return log.trackAsync(LogCategory.STORAGE, 'deleteJobExperience', async () => {
    log.debug(LogCategory.STORAGE, 'Deleting job experience', { id });
    const profile = await getProfessionalProfile();
    profile.jobs = profile.jobs.filter((j) => j.id !== id);
    await saveProfessionalProfile(profile);
    log.change(LogCategory.STORAGE, 'jobExperience', 'delete', { id });
    console.log('[Uproot] Deleted job:', id);
  });
}

/**
 * Add new internship experience
 */
export async function addInternshipExperience(internship: Omit<InternshipExperience, 'id' | 'createdAt' | 'updatedAt'>): Promise<InternshipExperience> {
  return log.trackAsync(LogCategory.STORAGE, 'addInternshipExperience', async () => {
    log.debug(LogCategory.STORAGE, 'Adding internship experience', { title: internship.title, company: internship.company });
    const profile = await getProfessionalProfile();

    const newInternship: InternshipExperience = {
      ...internship,
      id: `intern_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    profile.internships.push(newInternship);
    await saveProfessionalProfile(profile);

    log.change(LogCategory.STORAGE, 'internshipExperience', 'create', { id: newInternship.id, title: newInternship.title, company: newInternship.company });
    console.log('[Uproot] Added internship:', newInternship.title, 'at', newInternship.company);
    return newInternship;
  });
}

/**
 * Update internship experience
 */
export async function updateInternshipExperience(id: string, updates: Partial<InternshipExperience>): Promise<void> {
  return log.trackAsync(LogCategory.STORAGE, 'updateInternshipExperience', async () => {
    log.debug(LogCategory.STORAGE, 'Updating internship experience', { id, updates });
    const profile = await getProfessionalProfile();
    const index = profile.internships.findIndex((i) => i.id === id);

    if (index === -1) {
      log.error(LogCategory.STORAGE, 'Internship not found', { id });
      throw new Error('Internship not found');
    }

    profile.internships[index] = {
      ...profile.internships[index],
      ...updates,
      updatedAt: Date.now(),
    };

    await saveProfessionalProfile(profile);
    log.change(LogCategory.STORAGE, 'internshipExperience', 'update', { id, updates });
    console.log('[Uproot] Updated internship:', id);
  });
}

/**
 * Delete internship experience
 */
export async function deleteInternshipExperience(id: string): Promise<void> {
  return log.trackAsync(LogCategory.STORAGE, 'deleteInternshipExperience', async () => {
    log.debug(LogCategory.STORAGE, 'Deleting internship experience', { id });
    const profile = await getProfessionalProfile();
    profile.internships = profile.internships.filter((i) => i.id !== id);
    await saveProfessionalProfile(profile);
    log.change(LogCategory.STORAGE, 'internshipExperience', 'delete', { id });
    console.log('[Uproot] Deleted internship:', id);
  });
}

/**
 * Add volunteer experience
 */
export async function addVolunteerExperience(volunteer: Omit<VolunteerExperience, 'id' | 'createdAt' | 'updatedAt'>): Promise<VolunteerExperience> {
  return log.trackAsync(LogCategory.STORAGE, 'addVolunteerExperience', async () => {
    log.debug(LogCategory.STORAGE, 'Adding volunteer experience', { role: volunteer.role, organization: volunteer.organization });
    const profile = await getProfessionalProfile();

    const newVolunteer: VolunteerExperience = {
      ...volunteer,
      id: `volunteer_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    profile.volunteerWork.push(newVolunteer);
    await saveProfessionalProfile(profile);

    log.change(LogCategory.STORAGE, 'volunteerExperience', 'create', { id: newVolunteer.id, role: newVolunteer.role, organization: newVolunteer.organization });
    console.log('[Uproot] Added volunteer work:', newVolunteer.role, 'at', newVolunteer.organization);
    return newVolunteer;
  });
}

/**
 * Update volunteer experience
 */
export async function updateVolunteerExperience(id: string, updates: Partial<VolunteerExperience>): Promise<void> {
  return log.trackAsync(LogCategory.STORAGE, 'updateVolunteerExperience', async () => {
    log.debug(LogCategory.STORAGE, 'Updating volunteer experience', { id, updates });
    const profile = await getProfessionalProfile();
    const index = profile.volunteerWork.findIndex((v) => v.id === id);

    if (index === -1) {
      log.error(LogCategory.STORAGE, 'Volunteer work not found', { id });
      throw new Error('Volunteer work not found');
    }

    profile.volunteerWork[index] = {
      ...profile.volunteerWork[index],
      ...updates,
      updatedAt: Date.now(),
    };

    await saveProfessionalProfile(profile);
    log.change(LogCategory.STORAGE, 'volunteerExperience', 'update', { id, updates });
    console.log('[Uproot] Updated volunteer work:', id);
  });
}

/**
 * Delete volunteer experience
 */
export async function deleteVolunteerExperience(id: string): Promise<void> {
  return log.trackAsync(LogCategory.STORAGE, 'deleteVolunteerExperience', async () => {
    log.debug(LogCategory.STORAGE, 'Deleting volunteer experience', { id });
    const profile = await getProfessionalProfile();
    profile.volunteerWork = profile.volunteerWork.filter((v) => v.id !== id);
    await saveProfessionalProfile(profile);
    log.change(LogCategory.STORAGE, 'volunteerExperience', 'delete', { id });
    console.log('[Uproot] Deleted volunteer work:', id);
  });
}
