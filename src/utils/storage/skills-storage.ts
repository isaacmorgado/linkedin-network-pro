/**
 * Skills & Tools Storage Module
 * Handles storage operations for technical skills, soft skills, tools, certifications, and languages
 */

import { log, LogCategory } from '../logger';
import type { Skill, Tool, Certification } from '../../types/resume';
import { getProfessionalProfile, saveProfessionalProfile } from './profile-storage';


/**
 * Add technical skill
 */
export async function addTechnicalSkill(skill: Omit<Skill, 'id'>): Promise<Skill> {
  return log.trackAsync(LogCategory.STORAGE, 'addTechnicalSkill', async () => {
    log.debug(LogCategory.STORAGE, 'Adding technical skill to profile', { skillName: skill.name });

    try {
      const profile = await getProfessionalProfile();

      const newSkill: Skill = {
        ...skill,
        id: `skill_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      };

      profile.technicalSkills.push(newSkill);
      await saveProfessionalProfile(profile);

      log.change(LogCategory.STORAGE, 'technicalSkill', 'create', { id: newSkill.id, name: newSkill.name });
      console.log('[Uproot] Added technical skill:', newSkill.name);
      return newSkill;
    } catch (error) {
      log.error(LogCategory.STORAGE, 'Failed to add technical skill', error as Error, { skillName: skill.name });
      console.error('[Uproot] Error adding technical skill:', error);
      throw error;
    }
  });
}

/**
 * Update technical skill
 */
export async function updateTechnicalSkill(id: string, updates: Partial<Skill>): Promise<void> {
  return log.trackAsync(LogCategory.STORAGE, 'updateTechnicalSkill', async () => {
    log.debug(LogCategory.STORAGE, 'Updating technical skill', { id, updates });

    try {
      const profile = await getProfessionalProfile();
      const index = profile.technicalSkills.findIndex((s) => s.id === id);

      if (index === -1) {
        log.error(LogCategory.STORAGE, 'Technical skill not found', new Error('Skill not found'), { id });
        throw new Error('Skill not found');
      }

      profile.technicalSkills[index] = {
        ...profile.technicalSkills[index],
        ...updates,
      };

      await saveProfessionalProfile(profile);
      log.change(LogCategory.STORAGE, 'technicalSkill', 'update', { id, updated: Object.keys(updates) });
      console.log('[Uproot] Updated technical skill:', id);
    } catch (error) {
      log.error(LogCategory.STORAGE, 'Failed to update technical skill', error as Error, { id });
      console.error('[Uproot] Error updating technical skill:', error);
      throw error;
    }
  });
}

/**
 * Delete technical skill
 */
export async function deleteTechnicalSkill(id: string): Promise<void> {
  return log.trackAsync(LogCategory.STORAGE, 'deleteTechnicalSkill', async () => {
    log.debug(LogCategory.STORAGE, 'Deleting technical skill', { id });

    try {
      const profile = await getProfessionalProfile();
      profile.technicalSkills = profile.technicalSkills.filter((s) => s.id !== id);
      await saveProfessionalProfile(profile);

      log.change(LogCategory.STORAGE, 'technicalSkill', 'delete', { id });
      console.log('[Uproot] Deleted technical skill:', id);
    } catch (error) {
      log.error(LogCategory.STORAGE, 'Failed to delete technical skill', error as Error, { id });
      console.error('[Uproot] Error deleting technical skill:', error);
      throw error;
    }
  });
}

/**
 * Add soft skill
 */
export async function addSoftSkill(skill: Omit<Skill, 'id'>): Promise<Skill> {
  return log.trackAsync(LogCategory.STORAGE, 'addSoftSkill', async () => {
    log.debug(LogCategory.STORAGE, 'Adding soft skill to profile', { skillName: skill.name });

    try {
      const profile = await getProfessionalProfile();

      const newSkill: Skill = {
        ...skill,
        id: `soft_skill_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      };

      profile.softSkills.push(newSkill);
      await saveProfessionalProfile(profile);

      log.change(LogCategory.STORAGE, 'softSkill', 'create', { id: newSkill.id, name: newSkill.name });
      console.log('[Uproot] Added soft skill:', newSkill.name);
      return newSkill;
    } catch (error) {
      log.error(LogCategory.STORAGE, 'Failed to add soft skill', error as Error, { skillName: skill.name });
      console.error('[Uproot] Error adding soft skill:', error);
      throw error;
    }
  });
}

/**
 * Add tool/software
 */
export async function addTool(tool: Omit<Tool, 'id'>): Promise<Tool> {
  return log.trackAsync(LogCategory.STORAGE, 'addTool', async () => {
    log.debug(LogCategory.STORAGE, 'Adding tool to profile', { toolName: tool.name });

    try {
      const profile = await getProfessionalProfile();

      const newTool: Tool = {
        ...tool,
        id: `tool_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      };

      profile.tools.push(newTool);
      await saveProfessionalProfile(profile);

      log.change(LogCategory.STORAGE, 'tool', 'create', { id: newTool.id, name: newTool.name });
      console.log('[Uproot] Added tool:', newTool.name);
      return newTool;
    } catch (error) {
      log.error(LogCategory.STORAGE, 'Failed to add tool', error as Error, { toolName: tool.name });
      console.error('[Uproot] Error adding tool:', error);
      throw error;
    }
  });
}

/**
 * Update tool
 */
export async function updateTool(id: string, updates: Partial<Tool>): Promise<void> {
  return log.trackAsync(LogCategory.STORAGE, 'updateTool', async () => {
    log.debug(LogCategory.STORAGE, 'Updating tool', { id, updates });

    try {
      const profile = await getProfessionalProfile();
      const index = profile.tools.findIndex((t) => t.id === id);

      if (index === -1) {
        log.error(LogCategory.STORAGE, 'Tool not found', new Error('Tool not found'), { id });
        throw new Error('Tool not found');
      }

      profile.tools[index] = {
        ...profile.tools[index],
        ...updates,
      };

      await saveProfessionalProfile(profile);
      log.change(LogCategory.STORAGE, 'tool', 'update', { id, updated: Object.keys(updates) });
      console.log('[Uproot] Updated tool:', id);
    } catch (error) {
      log.error(LogCategory.STORAGE, 'Failed to update tool', error as Error, { id });
      console.error('[Uproot] Error updating tool:', error);
      throw error;
    }
  });
}

/**
 * Delete tool
 */
export async function deleteTool(id: string): Promise<void> {
  return log.trackAsync(LogCategory.STORAGE, 'deleteTool', async () => {
    log.debug(LogCategory.STORAGE, 'Deleting tool', { id });

    try {
      const profile = await getProfessionalProfile();
      profile.tools = profile.tools.filter((t) => t.id !== id);
      await saveProfessionalProfile(profile);

      log.change(LogCategory.STORAGE, 'tool', 'delete', { id });
      console.log('[Uproot] Deleted tool:', id);
    } catch (error) {
      log.error(LogCategory.STORAGE, 'Failed to delete tool', error as Error, { id });
      console.error('[Uproot] Error deleting tool:', error);
      throw error;
    }
  });
}

/**
 * Add certification
 */
export async function addCertification(cert: Omit<Certification, 'id'>): Promise<Certification> {
  return log.trackAsync(LogCategory.STORAGE, 'addCertification', async () => {
    log.debug(LogCategory.STORAGE, 'Adding certification to profile', { certName: cert.name });

    try {
      const profile = await getProfessionalProfile();

      const newCert: Certification = {
        ...cert,
        id: `cert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      };

      profile.certifications.push(newCert);
      await saveProfessionalProfile(profile);

      log.change(LogCategory.STORAGE, 'certification', 'create', { id: newCert.id, name: newCert.name });
      console.log('[Uproot] Added certification:', newCert.name);
      return newCert;
    } catch (error) {
      log.error(LogCategory.STORAGE, 'Failed to add certification', error as Error, { certName: cert.name });
      console.error('[Uproot] Error adding certification:', error);
      throw error;
    }
  });
}

/**
 * Delete certification
 */
export async function deleteCertification(id: string): Promise<void> {
  return log.trackAsync(LogCategory.STORAGE, 'deleteCertification', async () => {
    log.debug(LogCategory.STORAGE, 'Deleting certification', { id });

    try {
      const profile = await getProfessionalProfile();
      profile.certifications = profile.certifications.filter((c) => c.id !== id);
      await saveProfessionalProfile(profile);

      log.change(LogCategory.STORAGE, 'certification', 'delete', { id });
      console.log('[Uproot] Deleted certification:', id);
    } catch (error) {
      log.error(LogCategory.STORAGE, 'Failed to delete certification', error as Error, { id });
      console.error('[Uproot] Error deleting certification:', error);
      throw error;
    }
  });
}

