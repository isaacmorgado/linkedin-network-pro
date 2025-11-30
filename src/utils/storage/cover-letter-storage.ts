/**
 * Cover Letter Storage Module
 * Handles storage operations for cover letters, templates, components, preferences, and analytics
 */

import { log, LogCategory } from '../logger';
import type {
  CoverLetter,
  CoverLetterTemplate,
  CoverLetterComponent,
  CoverLetterPreferences,
  CoverLetterAnalytics,
} from '../../types/cover-letter';
import {
  COVER_LETTERS_KEY,
  COVER_LETTER_TEMPLATES_KEY,
  COVER_LETTER_COMPONENTS_KEY,
  COVER_LETTER_PREFERENCES_KEY,
  COVER_LETTER_ANALYTICS_KEY,
} from '../../types/cover-letter';


/**
 * Get all cover letters
 */
export async function getCoverLetters(): Promise<CoverLetter[]> {
  return log.trackAsync(LogCategory.STORAGE, 'getCoverLetters', async () => {
    log.debug(LogCategory.STORAGE, 'Fetching all cover letters from storage');

    try {
      const result = await chrome.storage.local.get(COVER_LETTERS_KEY);
      const letters = result[COVER_LETTERS_KEY] || [];
      log.info(LogCategory.STORAGE, 'Cover letters retrieved', { count: letters.length });
      return letters;
    } catch (error) {
      log.error(LogCategory.STORAGE, 'Failed to get cover letters', error as Error);
      console.error('[Uproot] Error getting cover letters:', error);
      return [];
    }
  });
}

/**
 * Get cover letter by ID
 */
export async function getCoverLetter(id: string): Promise<CoverLetter | null> {
  return log.trackAsync(LogCategory.STORAGE, 'getCoverLetter', async () => {
    log.debug(LogCategory.STORAGE, 'Fetching cover letter by ID', { id });

    try {
      const letters = await getCoverLetters();
      const letter = letters.find((l) => l.id === id) || null;
      log.info(LogCategory.STORAGE, 'Cover letter lookup complete', { id, found: !!letter });
      return letter;
    } catch (error) {
      log.error(LogCategory.STORAGE, 'Failed to get cover letter', error as Error, { id });
      console.error('[Uproot] Error getting cover letter:', error);
      return null;
    }
  });
}

/**
 * Get cover letters for a specific job
 */
export async function getCoverLettersForJob(jobId: string): Promise<CoverLetter[]> {
  return log.trackAsync(LogCategory.STORAGE, 'getCoverLettersForJob', async () => {
    log.debug(LogCategory.STORAGE, 'Fetching cover letters for specific job', { jobId });

    try {
      const letters = await getCoverLetters();
      const filtered = letters.filter((l) => l.jobId === jobId);
      log.info(LogCategory.STORAGE, 'Cover letters for job retrieved', { jobId, count: filtered.length });
      return filtered;
    } catch (error) {
      log.error(LogCategory.STORAGE, 'Failed to get cover letters for job', error as Error, { jobId });
      console.error('[Uproot] Error getting cover letters for job:', error);
      return [];
    }
  });
}

/**
 * Save cover letter (create or update)
 */
export async function saveCoverLetter(letter: CoverLetter): Promise<void> {
  return log.trackAsync(LogCategory.STORAGE, 'saveCoverLetter', async () => {
    log.debug(LogCategory.STORAGE, 'Saving cover letter', { id: letter.id, company: letter.company });

    try {
      const letters = await getCoverLetters();
      const existingIndex = letters.findIndex((l) => l.id === letter.id);

      const updatedLetter: CoverLetter = {
        ...letter,
        updatedAt: Date.now(),
        lastEditedAt: Date.now(),
      };

      if (existingIndex >= 0) {
        letters[existingIndex] = updatedLetter;
        log.change(LogCategory.STORAGE, 'coverLetter', 'update', { id: letter.id, company: letter.company });
      } else {
        letters.push(updatedLetter);
        log.change(LogCategory.STORAGE, 'coverLetter', 'create', { id: letter.id, company: letter.company });
      }

      await chrome.storage.local.set({ [COVER_LETTERS_KEY]: letters });
      console.log('[Uproot] Cover letter saved:', letter.id);
    } catch (error) {
      log.error(LogCategory.STORAGE, 'Failed to save cover letter', error as Error, { id: letter.id });
      console.error('[Uproot] Error saving cover letter:', error);
      throw error;
    }
  });
}

/**
 * Create new cover letter
 */
export async function createCoverLetter(
  letterData: Omit<CoverLetter, 'id' | 'createdAt' | 'updatedAt' | 'lastEditedAt' | 'version'>
): Promise<CoverLetter> {
  return log.trackAsync(LogCategory.STORAGE, 'createCoverLetter', async () => {
    log.debug(LogCategory.STORAGE, 'Creating new cover letter', { company: letterData.company, jobTitle: letterData.jobTitle });

    try {
      const newLetter: CoverLetter = {
        ...letterData,
        id: `cover_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        version: 1,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        lastEditedAt: Date.now(),
      };

      await saveCoverLetter(newLetter);
      log.change(LogCategory.STORAGE, 'coverLetter', 'create', { id: newLetter.id, company: newLetter.company });
      console.log('[Uproot] Created cover letter:', newLetter.id, 'for', newLetter.company);
      return newLetter;
    } catch (error) {
      log.error(LogCategory.STORAGE, 'Failed to create cover letter', error as Error, { company: letterData.company });
      console.error('[Uproot] Error creating cover letter:', error);
      throw error;
    }
  });
}

/**
 * Update cover letter
 */
export async function updateCoverLetter(id: string, updates: Partial<CoverLetter>): Promise<void> {
  return log.trackAsync(LogCategory.STORAGE, 'updateCoverLetter', async () => {
    log.debug(LogCategory.STORAGE, 'Updating cover letter', { id, updates });

    try {
      const letter = await getCoverLetter(id);
      if (!letter) {
        log.error(LogCategory.STORAGE, 'Cover letter not found', new Error('Cover letter not found'), { id });
        throw new Error('Cover letter not found');
      }

      const updatedLetter: CoverLetter = {
        ...letter,
        ...updates,
        id: letter.id, // Preserve ID
        updatedAt: Date.now(),
        lastEditedAt: Date.now(),
      };

      await saveCoverLetter(updatedLetter);
      log.change(LogCategory.STORAGE, 'coverLetter', 'update', { id, updated: Object.keys(updates) });
      console.log('[Uproot] Updated cover letter:', id);
    } catch (error) {
      log.error(LogCategory.STORAGE, 'Failed to update cover letter', error as Error, { id });
      console.error('[Uproot] Error updating cover letter:', error);
      throw error;
    }
  });
}

/**
 * Delete cover letter
 */
export async function deleteCoverLetter(id: string): Promise<void> {
  return log.trackAsync(LogCategory.STORAGE, 'deleteCoverLetter', async () => {
    log.debug(LogCategory.STORAGE, 'Deleting cover letter', { id });

    try {
      const letters = await getCoverLetters();
      const filtered = letters.filter((l) => l.id !== id);
      await chrome.storage.local.set({ [COVER_LETTERS_KEY]: filtered });

      log.change(LogCategory.STORAGE, 'coverLetter', 'delete', { id });
      console.log('[Uproot] Deleted cover letter:', id);
    } catch (error) {
      log.error(LogCategory.STORAGE, 'Failed to delete cover letter', error as Error, { id });
      console.error('[Uproot] Error deleting cover letter:', error);
      throw error;
    }
  });
}

/**
 * Mark cover letter as sent
 */
export async function markCoverLetterAsSent(id: string): Promise<void> {
  return log.trackAsync(LogCategory.STORAGE, 'markCoverLetterAsSent', async () => {
    log.debug(LogCategory.STORAGE, 'Marking cover letter as sent', { id });

    try {
      await updateCoverLetter(id, {
        status: 'sent',
        sentAt: Date.now(),
      });
      log.change(LogCategory.STORAGE, 'coverLetter', 'update', { id, action: 'markedAsSent' });
      console.log('[Uproot] Marked cover letter as sent:', id);
    } catch (error) {
      log.error(LogCategory.STORAGE, 'Failed to mark cover letter as sent', error as Error, { id });
      console.error('[Uproot] Error marking cover letter as sent:', error);
      throw error;
    }
  });
}

/**
 * Update cover letter outcome
 */
export async function updateCoverLetterOutcome(
  id: string,
  outcome: 'no-response' | 'rejected' | 'phone-screen' | 'interview' | 'offer'
): Promise<void> {
  return log.trackAsync(LogCategory.STORAGE, 'updateCoverLetterOutcome', async () => {
    log.debug(LogCategory.STORAGE, 'Updating cover letter outcome', { id, outcome });

    try {
      await updateCoverLetter(id, {
        outcomeStatus: outcome,
        responseReceived: outcome !== 'no-response',
        responseDate: Date.now(),
      });
      log.change(LogCategory.STORAGE, 'coverLetter', 'update', { id, outcome });
      console.log('[Uproot] Updated cover letter outcome:', id, outcome);
    } catch (error) {
      log.error(LogCategory.STORAGE, 'Failed to update cover letter outcome', error as Error, { id, outcome });
      console.error('[Uproot] Error updating cover letter outcome:', error);
      throw error;
    }
  });
}



/**
 * Get all cover letter templates
 */
export async function getCoverLetterTemplates(): Promise<CoverLetterTemplate[]> {
  return log.trackAsync(LogCategory.STORAGE, 'getCoverLetterTemplates', async () => {
    log.debug(LogCategory.STORAGE, 'Fetching cover letter templates from storage');

    try {
      const result = await chrome.storage.local.get(COVER_LETTER_TEMPLATES_KEY);
      const templates = result[COVER_LETTER_TEMPLATES_KEY] || [];

      // If no templates exist, return default templates
      if (templates.length === 0) {
        const defaults = getDefaultCoverLetterTemplates();
        log.info(LogCategory.STORAGE, 'Using default cover letter templates', { count: defaults.length });
        return defaults;
      }

      log.info(LogCategory.STORAGE, 'Cover letter templates retrieved', { count: templates.length });
      return templates;
    } catch (error) {
      log.error(LogCategory.STORAGE, 'Failed to get cover letter templates', error as Error);
      console.error('[Uproot] Error getting cover letter templates:', error);
      return getDefaultCoverLetterTemplates();
    }
  });
}

/**
 * Get cover letter template by ID
 */
export async function getCoverLetterTemplate(id: string): Promise<CoverLetterTemplate | null> {
  return log.trackAsync(LogCategory.STORAGE, 'getCoverLetterTemplate', async () => {
    log.debug(LogCategory.STORAGE, 'Fetching cover letter template by ID', { id });

    try {
      const templates = await getCoverLetterTemplates();
      const template = templates.find((t) => t.id === id) || null;
      log.info(LogCategory.STORAGE, 'Cover letter template lookup complete', { id, found: !!template });
      return template;
    } catch (error) {
      log.error(LogCategory.STORAGE, 'Failed to get cover letter template', error as Error, { id });
      console.error('[Uproot] Error getting cover letter template:', error);
      return null;
    }
  });
}

/**
 * Save cover letter template
 */
export async function saveCoverLetterTemplate(template: CoverLetterTemplate): Promise<void> {
  return log.trackAsync(LogCategory.STORAGE, 'saveCoverLetterTemplate', async () => {
    log.debug(LogCategory.STORAGE, 'Saving cover letter template', { id: template.id, name: template.name });

    try {
      const templates = await getCoverLetterTemplates();
      const existingIndex = templates.findIndex((t) => t.id === template.id);

      const updatedTemplate: CoverLetterTemplate = {
        ...template,
        updatedAt: Date.now(),
      };

      if (existingIndex >= 0) {
        templates[existingIndex] = updatedTemplate;
        log.change(LogCategory.STORAGE, 'coverLetterTemplate', 'update', { id: template.id, name: template.name });
      } else {
        templates.push(updatedTemplate);
        log.change(LogCategory.STORAGE, 'coverLetterTemplate', 'create', { id: template.id, name: template.name });
      }

      await chrome.storage.local.set({ [COVER_LETTER_TEMPLATES_KEY]: templates });
      console.log('[Uproot] Cover letter template saved:', template.id);
    } catch (error) {
      log.error(LogCategory.STORAGE, 'Failed to save cover letter template', error as Error, { id: template.id });
      console.error('[Uproot] Error saving cover letter template:', error);
      throw error;
    }
  });
}

/**
 * Delete cover letter template
 */
export async function deleteCoverLetterTemplate(id: string): Promise<void> {
  return log.trackAsync(LogCategory.STORAGE, 'deleteCoverLetterTemplate', async () => {
    log.debug(LogCategory.STORAGE, 'Deleting cover letter template', { id });

    try {
      const templates = await getCoverLetterTemplates();

      // Prevent deleting default templates
      const template = templates.find((t) => t.id === id);
      if (template && template.isDefault) {
        log.error(LogCategory.STORAGE, 'Cannot delete default template', new Error('Cannot delete default template'), { id });
        throw new Error('Cannot delete default template');
      }

      const filtered = templates.filter((t) => t.id !== id);
      await chrome.storage.local.set({ [COVER_LETTER_TEMPLATES_KEY]: filtered });

      log.change(LogCategory.STORAGE, 'coverLetterTemplate', 'delete', { id });
      console.log('[Uproot] Deleted cover letter template:', id);
    } catch (error) {
      log.error(LogCategory.STORAGE, 'Failed to delete cover letter template', error as Error, { id });
      console.error('[Uproot] Error deleting cover letter template:', error);
      throw error;
    }
  });
}

/**
 * Get default cover letter templates
 * Based on research: Problem-Solution format has highest response rate
 */
function getDefaultCoverLetterTemplates(): CoverLetterTemplate[] {
  return [
    {
      id: 'template_problem_solution',
      name: 'Problem-Solution (Recommended)',
      description: 'Highest response rate. Position yourself as solving their problems.',
      framework: 'problem-solution',
      industry: ['tech', 'corporate', 'consulting'],
      jobLevel: ['mid', 'senior', 'senior'],
      tone: 'professional',
      structure: {
        opening: {
          id: 'opening_problem_solution',
          type: 'opening',
          text: 'I was excited to see {{companyName}}\'s opening for {{jobTitle}}. With {{companyName}}\'s focus on {{companyMission}}, I believe my experience in {{relevantSkill}} can help address the challenges your team is facing.',
        },
        body: [
          {
            id: 'body_experience',
            type: 'experience',
            text: 'In my current role at {{currentCompany}}, I {{relevantAchievement}}. This directly aligns with your need for {{jobRequirement}}, and I\'m confident I can bring similar results to {{companyName}}.',
          },
          {
            id: 'body_value',
            type: 'value-proposition',
            text: 'I\'m particularly drawn to {{specificCompanyDetail}}. My background in {{relevantExperience}} has prepared me to {{valueProposition}}.',
          },
        ],
        closing: {
          id: 'closing_cta',
          type: 'closing',
          text: 'I would welcome the opportunity to discuss how my experience can contribute to {{companyName}}\'s continued success. Thank you for your consideration.',
        },
      },
      requiredVariables: [
        { name: 'companyName', type: 'string', description: 'Company name', autoFillFrom: 'job', autoFillPath: 'company' },
        { name: 'jobTitle', type: 'string', description: 'Job title', autoFillFrom: 'job', autoFillPath: 'jobTitle' },
        { name: 'relevantSkill', type: 'string', description: 'Your most relevant skill', autoFillFrom: 'profile', autoFillPath: 'technicalSkills[0].name' },
        { name: 'relevantAchievement', type: 'string', description: 'Your top relevant achievement' },
      ],
      optionalVariables: [
        { name: 'companyMission', type: 'string', description: 'Company mission or focus area' },
        { name: 'specificCompanyDetail', type: 'string', description: 'Specific detail about company (recent news, product, etc.)' },
      ],
      isDefault: true,
      usageCount: 0,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    },
    {
      id: 'template_achievement_focused',
      name: 'Achievement-Focused',
      description: 'Best for technical roles. Lead with quantifiable results.',
      framework: 'achievement-focused',
      industry: ['tech', 'data', 'engineering'],
      jobLevel: ['mid', 'senior'],
      tone: 'professional',
      structure: {
        opening: {
          id: 'opening_achievement',
          type: 'opening',
          text: 'I was excited to see the {{jobTitle}} position at {{companyName}}. In my current role, I {{topAchievement}}, and I\'m eager to bring similar impact to your team.',
        },
        body: [
          {
            id: 'body_achievements',
            type: 'experience',
            text: 'My background includes: {{achievement1}}, {{achievement2}}, and {{achievement3}}. These experiences have given me {{relevantSkills}} that directly align with your requirements.',
          },
        ],
        closing: {
          id: 'closing_next_steps',
          type: 'closing',
          text: 'I would love to discuss how I can contribute to {{companyName}}\'s {{companyGoal}}. Thank you for your time and consideration.',
        },
      },
      requiredVariables: [
        { name: 'companyName', type: 'string', description: 'Company name', autoFillFrom: 'job', autoFillPath: 'company' },
        { name: 'jobTitle', type: 'string', description: 'Job title', autoFillFrom: 'job', autoFillPath: 'jobTitle' },
        { name: 'topAchievement', type: 'string', description: 'Your single best achievement with metrics' },
      ],
      optionalVariables: [],
      isDefault: true,
      usageCount: 0,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    },
  ];
}



/**
 * Get all cover letter components
 */
export async function getCoverLetterComponents(): Promise<CoverLetterComponent[]> {
  return log.trackAsync(LogCategory.STORAGE, 'getCoverLetterComponents', async () => {
    log.debug(LogCategory.STORAGE, 'Fetching cover letter components from storage');

    try {
      const result = await chrome.storage.local.get(COVER_LETTER_COMPONENTS_KEY);
      const components = result[COVER_LETTER_COMPONENTS_KEY] || [];

      // If no components exist, return default components
      if (components.length === 0) {
        const defaults = getDefaultCoverLetterComponents();
        log.info(LogCategory.STORAGE, 'Using default cover letter components', { count: defaults.length });
        return defaults;
      }

      log.info(LogCategory.STORAGE, 'Cover letter components retrieved', { count: components.length });
      return components;
    } catch (error) {
      log.error(LogCategory.STORAGE, 'Failed to get cover letter components', error as Error);
      console.error('[Uproot] Error getting cover letter components:', error);
      return getDefaultCoverLetterComponents();
    }
  });
}

/**
 * Save cover letter component
 */
export async function saveCoverLetterComponent(component: CoverLetterComponent): Promise<void> {
  return log.trackAsync(LogCategory.STORAGE, 'saveCoverLetterComponent', async () => {
    log.debug(LogCategory.STORAGE, 'Saving cover letter component', { id: component.id, name: component.name });

    try {
      const components = await getCoverLetterComponents();
      const existingIndex = components.findIndex((c) => c.id === component.id);

      if (existingIndex >= 0) {
        components[existingIndex] = component;
        log.change(LogCategory.STORAGE, 'coverLetterComponent', 'update', { id: component.id, name: component.name });
      } else {
        components.push(component);
        log.change(LogCategory.STORAGE, 'coverLetterComponent', 'create', { id: component.id, name: component.name });
      }

      await chrome.storage.local.set({ [COVER_LETTER_COMPONENTS_KEY]: components });
      console.log('[Uproot] Cover letter component saved:', component.id);
    } catch (error) {
      log.error(LogCategory.STORAGE, 'Failed to save cover letter component', error as Error, { id: component.id });
      console.error('[Uproot] Error saving cover letter component:', error);
      throw error;
    }
  });
}

/**
 * Get default cover letter components
 * Research-backed opening hooks, value props, and closings
 */
function getDefaultCoverLetterComponents(): CoverLetterComponent[] {
  return [
    {
      id: 'opening_passion',
      type: 'opening-hook',
      name: 'Passion Opening',
      description: 'For mission-driven companies',
      text: 'I\'ve been following {{companyName}}\'s work in {{companyMission}} for some time, and I\'m excited to apply for the {{jobTitle}} position.',
      variables: ['companyName', 'companyMission', 'jobTitle'],
      example: 'I\'ve been following Tesla\'s work in sustainable energy for some time, and I\'m excited to apply for the Senior Software Engineer position.',
      bestFor: { tone: ['enthusiastic'], industry: ['nonprofit', 'tech', 'healthcare'] },
      isDefault: true,
      usageCount: 0,
      createdAt: Date.now(),
    },
    {
      id: 'opening_achievement',
      type: 'opening-hook',
      name: 'Achievement Opening',
      description: 'Lead with impressive results',
      text: 'When I {{achievement}}, I knew this type of impact was what I wanted to continue creating. Your {{jobTitle}} role at {{companyName}} represents exactly that opportunity.',
      variables: ['achievement', 'jobTitle', 'companyName'],
      example: 'When I reduced deployment time by 70% at my last company, I knew this type of impact was what I wanted to continue creating.',
      bestFor: { tone: ['professional'], jobLevel: ['mid', 'senior'] },
      isDefault: true,
      usageCount: 0,
      createdAt: Date.now(),
    },
    {
      id: 'closing_enthusiastic',
      type: 'closing-cta',
      name: 'Enthusiastic Closing',
      description: 'Show genuine excitement',
      text: 'I would be thrilled to bring my {{relevantSkills}} to {{companyName}} and contribute to {{companyGoal}}. I look forward to discussing how I can add value to your team.',
      variables: ['relevantSkills', 'companyName', 'companyGoal'],
      example: 'I would be thrilled to bring my full-stack expertise to Stripe and contribute to building the financial infrastructure of the internet.',
      bestFor: { tone: ['enthusiastic'], jobLevel: ['entry', 'mid'] },
      isDefault: true,
      usageCount: 0,
      createdAt: Date.now(),
    },
    {
      id: 'closing_professional',
      type: 'closing-cta',
      name: 'Professional Closing',
      description: 'Confident and professional',
      text: 'I would welcome the opportunity to discuss how my experience in {{relevantArea}} can contribute to {{companyName}}\'s continued success. Thank you for your consideration.',
      variables: ['relevantArea', 'companyName'],
      example: 'I would welcome the opportunity to discuss how my experience in enterprise architecture can contribute to Microsoft\'s continued success.',
      bestFor: { tone: ['professional'], jobLevel: ['senior', 'senior'] },
      isDefault: true,
      usageCount: 0,
      createdAt: Date.now(),
    },
  ];
}



/**
 * Get user's cover letter preferences
 */
export async function getCoverLetterPreferences(): Promise<CoverLetterPreferences> {
  return log.trackAsync(LogCategory.STORAGE, 'getCoverLetterPreferences', async () => {
    log.debug(LogCategory.STORAGE, 'Fetching cover letter preferences from storage');

    try {
      const result = await chrome.storage.local.get(COVER_LETTER_PREFERENCES_KEY);
      const prefs = result[COVER_LETTER_PREFERENCES_KEY];

      if (!prefs) {
        // Return default preferences
        const defaults = {
          defaultTone: 'professional',
          defaultCustomizationLevel: 'standard',
          defaultFramework: 'problem-solution',
          minimumQualityScore: 75,
          minimumATSScore: 70,
          preferredContactFormat: 'header',
          includeLinkedIn: true,
          includePortfolio: true,
          autoFetchCompanyResearch: true,
          includeCompanyResearchInLetter: true,
          trackOutcomes: true,
          storeSentLetters: true,
          anonymizeLettersForAnalysis: false,
        } as CoverLetterPreferences;
        log.info(LogCategory.STORAGE, 'Using default cover letter preferences');
        return defaults;
      }

      log.info(LogCategory.STORAGE, 'Cover letter preferences retrieved');
      return prefs;
    } catch (error) {
      log.error(LogCategory.STORAGE, 'Failed to get cover letter preferences', error as Error);
      console.error('[Uproot] Error getting cover letter preferences:', error);
      throw error;
    }
  });
}

/**
 * Save cover letter preferences
 */
export async function saveCoverLetterPreferences(prefs: CoverLetterPreferences): Promise<void> {
  return log.trackAsync(LogCategory.STORAGE, 'saveCoverLetterPreferences', async () => {
    log.debug(LogCategory.STORAGE, 'Saving cover letter preferences', { defaultTone: prefs.defaultTone, defaultFramework: prefs.defaultFramework });

    try {
      await chrome.storage.local.set({ [COVER_LETTER_PREFERENCES_KEY]: prefs });
      log.change(LogCategory.STORAGE, 'coverLetterPreferences', 'update', { tone: prefs.defaultTone, framework: prefs.defaultFramework });
      console.log('[Uproot] Cover letter preferences saved');
    } catch (error) {
      log.error(LogCategory.STORAGE, 'Failed to save cover letter preferences', error as Error);
      console.error('[Uproot] Error saving cover letter preferences:', error);
      throw error;
    }
  });
}



/**
 * Get cover letter analytics
 */
export async function getCoverLetterAnalytics(): Promise<CoverLetterAnalytics> {
  return log.trackAsync(LogCategory.STORAGE, 'getCoverLetterAnalytics', async () => {
    log.debug(LogCategory.STORAGE, 'Fetching cover letter analytics from storage');

    try {
      const result = await chrome.storage.local.get(COVER_LETTER_ANALYTICS_KEY);
      const analytics = result[COVER_LETTER_ANALYTICS_KEY];

      if (!analytics) {
        // Return empty analytics
        const defaults = {
          totalGenerated: 0,
          totalSent: 0,
          responsesReceived: 0,
          responseRate: 0,
          phoneScreens: 0,
          interviews: 0,
          offers: 0,
          rejections: 0,
          averageQualityScore: 0,
          averageATSScore: 0,
          performanceByFramework: {},
          performanceByTone: {},
          performanceByIndustry: {},
          averageCustomizationLevel: 'standard',
          averageGenerationTime: 0,
          manualEditRate: 0,
        } as CoverLetterAnalytics;
        log.info(LogCategory.STORAGE, 'Using default cover letter analytics');
        return defaults;
      }

      log.info(LogCategory.STORAGE, 'Cover letter analytics retrieved', { totalGenerated: analytics.totalGenerated, totalSent: analytics.totalSent });
      return analytics;
    } catch (error) {
      log.error(LogCategory.STORAGE, 'Failed to get cover letter analytics', error as Error);
      console.error('[Uproot] Error getting cover letter analytics:', error);
      throw error;
    }
  });
}

/**
 * Update cover letter analytics
 */
export async function updateCoverLetterAnalytics(updates: Partial<CoverLetterAnalytics>): Promise<void> {
  return log.trackAsync(LogCategory.STORAGE, 'updateCoverLetterAnalytics', async () => {
    log.debug(LogCategory.STORAGE, 'Updating cover letter analytics', { updates: Object.keys(updates) });

    try {
      const analytics = await getCoverLetterAnalytics();
      const updated: CoverLetterAnalytics = {
        ...analytics,
        ...updates,
      };

      await chrome.storage.local.set({ [COVER_LETTER_ANALYTICS_KEY]: updated });
      log.change(LogCategory.STORAGE, 'coverLetterAnalytics', 'update', { fields: Object.keys(updates) });
      console.log('[Uproot] Cover letter analytics updated');
    } catch (error) {
      log.error(LogCategory.STORAGE, 'Failed to update cover letter analytics', error as Error);
      console.error('[Uproot] Error updating cover letter analytics:', error);
      throw error;
    }
  });
}

/**
 * Recalculate analytics from all cover letters
 * Call this periodically to keep analytics fresh
 */
export async function recalculateCoverLetterAnalytics(): Promise<void> {
  return log.trackAsync(LogCategory.STORAGE, 'recalculateCoverLetterAnalytics', async () => {
    log.debug(LogCategory.STORAGE, 'Recalculating cover letter analytics from all letters');

    try {
      const letters = await getCoverLetters();

      const totalGenerated = letters.length;
      const totalSent = letters.filter((l) => l.status === 'sent').length;
      const responsesReceived = letters.filter((l) => l.responseReceived).length;
      const responseRate = totalSent > 0 ? (responsesReceived / totalSent) * 100 : 0;

      const phoneScreens = letters.filter((l) => l.outcomeStatus === 'phone-screen').length;
      const interviews = letters.filter((l) => l.outcomeStatus === 'interview').length;
      const offers = letters.filter((l) => l.outcomeStatus === 'offer').length;
      const rejections = letters.filter((l) => l.outcomeStatus === 'rejected').length;

      const qualityScores = letters.map((l) => l.qualityScore.overallScore);
      const averageQualityScore = qualityScores.length > 0
        ? qualityScores.reduce((sum, score) => sum + score, 0) / qualityScores.length
        : 0;

      const atsScores = letters.map((l) => l.atsOptimization.overallATSScore);
      const averageATSScore = atsScores.length > 0
        ? atsScores.reduce((sum, score) => sum + score, 0) / atsScores.length
        : 0;

      const analytics: CoverLetterAnalytics = {
        totalGenerated,
        totalSent,
        responsesReceived,
        responseRate,
        phoneScreens,
        interviews,
        offers,
        rejections,
        averageQualityScore,
        averageATSScore,
        performanceByFramework: {},
        performanceByTone: {},
        performanceByIndustry: {},
        averageCustomizationLevel: 'standard', // Could calculate this
        averageGenerationTime: 0, // Would need to track this separately
        manualEditRate: 0, // Would need to track edits
      };

      await chrome.storage.local.set({ [COVER_LETTER_ANALYTICS_KEY]: analytics });
      log.change(LogCategory.STORAGE, 'coverLetterAnalytics', 'update', {
        totalGenerated,
        totalSent,
        responseRate: responseRate.toFixed(1)
      });
      console.log('[Uproot] Cover letter analytics recalculated');
    } catch (error) {
      log.error(LogCategory.STORAGE, 'Failed to recalculate cover letter analytics', error as Error);
      console.error('[Uproot] Error recalculating cover letter analytics:', error);
      throw error;
    }
  });
}
