/**
 * Education & Projects Storage Module
 * Handles storage operations for education and projects
 */

import { log, LogCategory } from '../logger';
import type { Education, Project } from '../../types/resume';
import { getProfessionalProfile, saveProfessionalProfile } from './profile-storage';


/**
 * Add education
 */
export async function addEducation(edu: Omit<Education, 'id' | 'createdAt' | 'updatedAt'>): Promise<Education> {
  return log.trackAsync(LogCategory.STORAGE, 'addEducation', async () => {
    log.debug(LogCategory.STORAGE, 'Adding education to profile', { degree: edu.degree, institution: edu.institution });

    try {
      const profile = await getProfessionalProfile();

      const newEdu: Education = {
        ...edu,
        id: `edu_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      profile.education.push(newEdu);
      await saveProfessionalProfile(profile);

      log.change(LogCategory.STORAGE, 'education', 'create', { id: newEdu.id, degree: newEdu.degree, institution: newEdu.institution });
      console.log('[Uproot] Added education:', newEdu.degree, 'in', newEdu.field);
      return newEdu;
    } catch (error) {
      log.error(LogCategory.STORAGE, 'Failed to add education', error as Error, { degree: edu.degree });
      console.error('[Uproot] Error adding education:', error);
      throw error;
    }
  });
}

/**
 * Update education
 */
export async function updateEducation(id: string, updates: Partial<Education>): Promise<void> {
  return log.trackAsync(LogCategory.STORAGE, 'updateEducation', async () => {
    log.debug(LogCategory.STORAGE, 'Updating education', { id, updates });

    try {
      const profile = await getProfessionalProfile();
      const index = profile.education.findIndex((e) => e.id === id);

      if (index === -1) {
        log.error(LogCategory.STORAGE, 'Education not found', new Error('Education not found'), { id });
        throw new Error('Education not found');
      }

      profile.education[index] = {
        ...profile.education[index],
        ...updates,
        updatedAt: Date.now(),
      };

      await saveProfessionalProfile(profile);
      log.change(LogCategory.STORAGE, 'education', 'update', { id, updated: Object.keys(updates) });
      console.log('[Uproot] Updated education:', id);
    } catch (error) {
      log.error(LogCategory.STORAGE, 'Failed to update education', error as Error, { id });
      console.error('[Uproot] Error updating education:', error);
      throw error;
    }
  });
}

/**
 * Delete education
 */
export async function deleteEducation(id: string): Promise<void> {
  return log.trackAsync(LogCategory.STORAGE, 'deleteEducation', async () => {
    log.debug(LogCategory.STORAGE, 'Deleting education', { id });

    try {
      const profile = await getProfessionalProfile();
      profile.education = profile.education.filter((e) => e.id !== id);
      await saveProfessionalProfile(profile);

      log.change(LogCategory.STORAGE, 'education', 'delete', { id });
      console.log('[Uproot] Deleted education:', id);
    } catch (error) {
      log.error(LogCategory.STORAGE, 'Failed to delete education', error as Error, { id });
      console.error('[Uproot] Error deleting education:', error);
      throw error;
    }
  });
}

/**
 * Add project
 */
export async function addProject(project: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>): Promise<Project> {
  return log.trackAsync(LogCategory.STORAGE, 'addProject', async () => {
    log.debug(LogCategory.STORAGE, 'Adding project to profile', { projectName: project.name });

    try {
      const profile = await getProfessionalProfile();

      const newProject: Project = {
        ...project,
        id: `project_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      profile.projects.push(newProject);
      await saveProfessionalProfile(profile);

      log.change(LogCategory.STORAGE, 'project', 'create', { id: newProject.id, name: newProject.name });
      console.log('[Uproot] Added project:', newProject.name);
      return newProject;
    } catch (error) {
      log.error(LogCategory.STORAGE, 'Failed to add project', error as Error, { projectName: project.name });
      console.error('[Uproot] Error adding project:', error);
      throw error;
    }
  });
}

/**
 * Update project
 */
export async function updateProject(id: string, updates: Partial<Project>): Promise<void> {
  return log.trackAsync(LogCategory.STORAGE, 'updateProject', async () => {
    log.debug(LogCategory.STORAGE, 'Updating project', { id, updates });

    try {
      const profile = await getProfessionalProfile();
      const index = profile.projects.findIndex((p) => p.id === id);

      if (index === -1) {
        log.error(LogCategory.STORAGE, 'Project not found', new Error('Project not found'), { id });
        throw new Error('Project not found');
      }

      profile.projects[index] = {
        ...profile.projects[index],
        ...updates,
        updatedAt: Date.now(),
      };

      await saveProfessionalProfile(profile);
      log.change(LogCategory.STORAGE, 'project', 'update', { id, updated: Object.keys(updates) });
      console.log('[Uproot] Updated project:', id);
    } catch (error) {
      log.error(LogCategory.STORAGE, 'Failed to update project', error as Error, { id });
      console.error('[Uproot] Error updating project:', error);
      throw error;
    }
  });
}

/**
 * Delete project
 */
export async function deleteProject(id: string): Promise<void> {
  return log.trackAsync(LogCategory.STORAGE, 'deleteProject', async () => {
    log.debug(LogCategory.STORAGE, 'Deleting project', { id });

    try {
      const profile = await getProfessionalProfile();
      profile.projects = profile.projects.filter((p) => p.id !== id);
      await saveProfessionalProfile(profile);

      log.change(LogCategory.STORAGE, 'project', 'delete', { id });
      console.log('[Uproot] Deleted project:', id);
    } catch (error) {
      log.error(LogCategory.STORAGE, 'Failed to delete project', error as Error, { id });
      console.error('[Uproot] Error deleting project:', error);
      throw error;
    }
  });
}

