/**
 * Chrome Storage Utilities
 * Wrapper around chrome.storage.local for type-safe operations
 */

import type { WatchlistPerson, WatchlistCompany, ConnectionPath } from '../types/watchlist';
import {
  CONNECTION_PATHS_STORAGE_KEY,
  WATCHLIST_PEOPLE_STORAGE_KEY,
  WATCHLIST_COMPANIES_STORAGE_KEY
} from '../types/watchlist';
import type { OnboardingState, JobPreferences } from '../types/onboarding';
import { ONBOARDING_STORAGE_KEY } from '../types/onboarding';
import type { FeedItem, FeedStats } from '../types/feed';
import { FEED_STORAGE_KEY } from '../types/feed';
import type {
  ProfessionalProfile,
  PersonalInfo,
  JobExperience,
  InternshipExperience,
  VolunteerExperience,
  Skill,
  Tool,
  Certification,
  Education,
  Project,
  JobDescriptionAnalysis,
  GeneratedResume,
  Application,
  ApplicationStatus,
  ProfileStats,
  ResumeStats,
} from '../types/resume';
import {
  PROFESSIONAL_PROFILE_KEY,
  JOB_DESCRIPTIONS_KEY,
  GENERATED_RESUMES_KEY,
  APPLICATIONS_KEY,
  RESUMES_STORAGE_KEY,
  RESUME_APPLICATIONS_STORAGE_KEY,
} from '../types/resume';
import type {
  CoverLetter,
  CoverLetterTemplate,
  CoverLetterComponent,
  CoverLetterPreferences,
  CoverLetterAnalytics,
  GeneratedCoverLetter,
} from '../types/cover-letter';
import {
  COVER_LETTERS_KEY,
  COVER_LETTER_TEMPLATES_KEY,
  COVER_LETTER_COMPONENTS_KEY,
  COVER_LETTER_PREFERENCES_KEY,
  COVER_LETTER_ANALYTICS_KEY,
} from '../types/cover-letter';

// Get watchlist from storage
export async function getWatchlist(): Promise<WatchlistPerson[]> {
  try {
    const result = await chrome.storage.local.get('uproot_watchlist');
    return result.uproot_watchlist || [];
  } catch (error) {
    console.error('[Uproot] Error getting watchlist:', error);
    return [];
  }
}

// Save watchlist to storage
export async function saveWatchlist(watchlist: WatchlistPerson[]): Promise<void> {
  try {
    await chrome.storage.local.set({ uproot_watchlist: watchlist });
    console.log('[Uproot] Watchlist saved:', watchlist.length, 'people');
  } catch (error) {
    console.error('[Uproot] Error saving watchlist:', error);
    throw error;
  }
}

// Add person to watchlist
export async function addToWatchlist(person: Omit<WatchlistPerson, 'id' | 'addedAt'>): Promise<WatchlistPerson> {
  const watchlist = await getWatchlist();

  // Generate ID from profile URL
  const id = person.profileUrl;

  // Check if already in watchlist
  const existingIndex = watchlist.findIndex((p) => p.id === id);
  if (existingIndex !== -1) {
    console.log('[Uproot] Person already in watchlist:', person.name);
    return watchlist[existingIndex];
  }

  // Create new watchlist person
  const newPerson: WatchlistPerson = {
    ...person,
    id,
    addedAt: Date.now(),
  };

  // Add to beginning of list
  watchlist.unshift(newPerson);

  await saveWatchlist(watchlist);
  console.log('[Uproot] Added to watchlist:', person.name);

  return newPerson;
}

// Remove person from watchlist
export async function removeFromWatchlist(id: string): Promise<void> {
  const watchlist = await getWatchlist();
  const filteredWatchlist = watchlist.filter((p) => p.id !== id);

  await saveWatchlist(filteredWatchlist);
  console.log('[Uproot] Removed from watchlist:', id);
}

// Update person in watchlist
export async function updateWatchlistPerson(id: string, updates: Partial<WatchlistPerson>): Promise<void> {
  const watchlist = await getWatchlist();
  const index = watchlist.findIndex((p) => p.id === id);

  if (index === -1) {
    throw new Error('Person not found in watchlist');
  }

  watchlist[index] = {
    ...watchlist[index],
    ...updates,
  };

  await saveWatchlist(watchlist);
  console.log('[Uproot] Updated watchlist person:', id);
}

// Check if person is in watchlist
export async function isInWatchlist(profileUrl: string): Promise<boolean> {
  const watchlist = await getWatchlist();
  return watchlist.some((p) => p.id === profileUrl);
}

// ============================================================================
// COMPANY WATCHLIST FUNCTIONS
// ============================================================================

// Get company watchlist from storage
export async function getCompanyWatchlist(): Promise<WatchlistCompany[]> {
  try {
    const result = await chrome.storage.local.get(WATCHLIST_COMPANIES_STORAGE_KEY);
    return result[WATCHLIST_COMPANIES_STORAGE_KEY] || [];
  } catch (error) {
    console.error('[Uproot] Error getting company watchlist:', error);
    return [];
  }
}

// Save company watchlist to storage
export async function saveCompanyWatchlist(companies: WatchlistCompany[]): Promise<void> {
  try {
    await chrome.storage.local.set({ [WATCHLIST_COMPANIES_STORAGE_KEY]: companies });
    console.log('[Uproot] Company watchlist saved:', companies.length, 'companies');
  } catch (error) {
    console.error('[Uproot] Error saving company watchlist:', error);
    throw error;
  }
}

// Add company to watchlist
export async function addCompanyToWatchlist(
  company: Omit<WatchlistCompany, 'id' | 'addedAt'>
): Promise<WatchlistCompany> {
  const companies = await getCompanyWatchlist();

  // Generate ID from company URL
  const id = company.companyUrl;

  // Check if already in watchlist
  const existingIndex = companies.findIndex((c) => c.id === id);
  if (existingIndex !== -1) {
    console.log('[Uproot] Company already in watchlist:', company.name);
    return companies[existingIndex];
  }

  // Create new watchlist company
  const newCompany: WatchlistCompany = {
    ...company,
    id,
    addedAt: Date.now(),
    jobAlertEnabled: company.jobAlertEnabled ?? false,
  };

  // Add to beginning of list
  companies.unshift(newCompany);

  await saveCompanyWatchlist(companies);
  console.log('[Uproot] Added company to watchlist:', company.name);

  return newCompany;
}

// Remove company from watchlist
export async function removeCompanyFromWatchlist(id: string): Promise<void> {
  const companies = await getCompanyWatchlist();
  const filteredCompanies = companies.filter((c) => c.id !== id);

  await saveCompanyWatchlist(filteredCompanies);
  console.log('[Uproot] Removed company from watchlist:', id);
}

// Update company in watchlist
export async function updateWatchlistCompany(
  id: string,
  updates: Partial<WatchlistCompany>
): Promise<void> {
  const companies = await getCompanyWatchlist();
  const index = companies.findIndex((c) => c.id === id);

  if (index === -1) {
    throw new Error('Company not found in watchlist');
  }

  companies[index] = {
    ...companies[index],
    ...updates,
  };

  await saveCompanyWatchlist(companies);
  console.log('[Uproot] Updated watchlist company:', id);
}

// Check if company is in watchlist
export async function isCompanyInWatchlist(companyUrl: string): Promise<boolean> {
  const companies = await getCompanyWatchlist();
  return companies.some((c) => c.id === companyUrl);
}

// ============================================================================
// CONNECTION PATH FUNCTIONS
// ============================================================================

// Get connection paths from storage
export async function getConnectionPaths(): Promise<ConnectionPath[]> {
  try {
    const result = await chrome.storage.local.get(CONNECTION_PATHS_STORAGE_KEY);
    return result[CONNECTION_PATHS_STORAGE_KEY] || [];
  } catch (error) {
    console.error('[Uproot] Error getting connection paths:', error);
    return [];
  }
}

// Save connection paths to storage
export async function saveConnectionPaths(paths: ConnectionPath[]): Promise<void> {
  try {
    await chrome.storage.local.set({ [CONNECTION_PATHS_STORAGE_KEY]: paths });
    console.log('[Uproot] Connection paths saved:', paths.length, 'paths');
  } catch (error) {
    console.error('[Uproot] Error saving connection paths:', error);
    throw error;
  }
}

// Add connection path
export async function addConnectionPath(
  path: Omit<ConnectionPath, 'id' | 'addedAt' | 'lastUpdated'>
): Promise<ConnectionPath> {
  const paths = await getConnectionPaths();

  // Generate ID from target profile URL
  const id = path.targetProfileUrl;

  // Check if already exists
  const existingIndex = paths.findIndex((p) => p.id === id);
  if (existingIndex !== -1) {
    console.log('[Uproot] Connection path already exists:', path.targetName);
    return paths[existingIndex];
  }

  // Create new connection path
  const newPath: ConnectionPath = {
    ...path,
    id,
    addedAt: Date.now(),
    lastUpdated: Date.now(),
  };

  // Add to beginning of list
  paths.unshift(newPath);

  await saveConnectionPaths(paths);
  console.log('[Uproot] Added connection path:', path.targetName);

  return newPath;
}

// Remove connection path
export async function removeConnectionPath(id: string): Promise<void> {
  const paths = await getConnectionPaths();
  const filteredPaths = paths.filter((p) => p.id !== id);

  await saveConnectionPaths(filteredPaths);
  console.log('[Uproot] Removed connection path:', id);
}

// Update connection path
export async function updateConnectionPath(
  id: string,
  updates: Partial<ConnectionPath>
): Promise<void> {
  const paths = await getConnectionPaths();
  const index = paths.findIndex((p) => p.id === id);

  if (index === -1) {
    throw new Error('Connection path not found');
  }

  paths[index] = {
    ...paths[index],
    ...updates,
    lastUpdated: Date.now(),
  };

  await saveConnectionPaths(paths);
  console.log('[Uproot] Updated connection path:', id);
}

// Mark step as connected in a path
export async function markStepConnected(pathId: string, stepIndex: number): Promise<void> {
  const paths = await getConnectionPaths();
  const pathIndex = paths.findIndex((p) => p.id === pathId);

  if (pathIndex === -1) {
    throw new Error('Connection path not found');
  }

  const path = paths[pathIndex];
  
  if (stepIndex < 0 || stepIndex >= path.path.length) {
    throw new Error('Invalid step index');
  }

  // Mark step as connected
  path.path[stepIndex].connected = true;

  // Update completed steps count
  path.completedSteps = path.path.filter((step) => step.connected).length;

  // Check if path is complete
  path.isComplete = path.completedSteps === path.totalSteps;
  path.lastUpdated = Date.now();

  await saveConnectionPaths(paths);
  console.log('[Uproot] Marked step as connected:', pathId, stepIndex);
}

// Check if connection path exists
export async function isConnectionPathSaved(targetProfileUrl: string): Promise<boolean> {
  const paths = await getConnectionPaths();
  return paths.some((p) => p.id === targetProfileUrl);
}

// ========================================
// Onboarding Storage Functions
// ========================================

// Get onboarding state
export async function getOnboardingState(): Promise<OnboardingState> {
  try {
    const result = await chrome.storage.local.get(ONBOARDING_STORAGE_KEY);
    return result[ONBOARDING_STORAGE_KEY] || {
      isComplete: false,
      currentStep: 0,
    };
  } catch (error) {
    console.error('[Uproot] Error getting onboarding state:', error);
    return {
      isComplete: false,
      currentStep: 0,
    };
  }
}

// Save onboarding state
export async function saveOnboardingState(state: OnboardingState): Promise<void> {
  try {
    await chrome.storage.local.set({ [ONBOARDING_STORAGE_KEY]: state });
    console.log('[Uproot] Onboarding state saved:', state);
  } catch (error) {
    console.error('[Uproot] Error saving onboarding state:', error);
    throw error;
  }
}

// Complete onboarding with preferences
export async function completeOnboarding(preferences: JobPreferences): Promise<void> {
  const state: OnboardingState = {
    isComplete: true,
    completedAt: Date.now(),
    currentStep: 3, // Final step
    preferences,
  };
  await saveOnboardingState(state);
  console.log('[Uproot] Onboarding completed with preferences');
}

// Check if onboarding is complete
export async function isOnboardingComplete(): Promise<boolean> {
  const state = await getOnboardingState();
  return state.isComplete;
}

// ============================================================================
// FEED FUNCTIONS
// ============================================================================

// Get feed items from storage
export async function getFeedItems(): Promise<FeedItem[]> {
  try {
    const result = await chrome.storage.local.get(FEED_STORAGE_KEY);
    const items = result[FEED_STORAGE_KEY] || [];
    // Sort by timestamp, newest first
    return items.sort((a: FeedItem, b: FeedItem) => b.timestamp - a.timestamp);
  } catch (error) {
    console.error('[Uproot] Error getting feed items:', error);
    return [];
  }
}

// Save feed items to storage
export async function saveFeedItems(items: FeedItem[]): Promise<void> {
  try {
    // Sort by timestamp, newest first before saving
    const sortedItems = items.sort((a, b) => b.timestamp - a.timestamp);
    await chrome.storage.local.set({ [FEED_STORAGE_KEY]: sortedItems });
    console.log('[Uproot] Feed items saved:', items.length, 'items');
  } catch (error) {
    console.error('[Uproot] Error saving feed items:', error);
    throw error;
  }
}

// Add new feed item
export async function addFeedItem(item: Omit<FeedItem, 'id'>): Promise<FeedItem> {
  const items = await getFeedItems();

  // Generate unique ID
  const id = `feed_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  // Create new feed item
  const newItem: FeedItem = {
    ...item,
    id,
  };

  // Add to beginning of list
  items.unshift(newItem);

  await saveFeedItems(items);
  console.log('[Uproot] Added feed item:', newItem.type, newItem.title);

  return newItem;
}

// Update feed item
export async function updateFeedItem(id: string, updates: Partial<FeedItem>): Promise<void> {
  const items = await getFeedItems();
  const index = items.findIndex((item) => item.id === id);

  if (index === -1) {
    throw new Error('Feed item not found');
  }

  items[index] = {
    ...items[index],
    ...updates,
  };

  await saveFeedItems(items);
  console.log('[Uproot] Updated feed item:', id);
}

// Toggle read status of feed item
export async function toggleFeedItemRead(id: string): Promise<void> {
  const items = await getFeedItems();
  const index = items.findIndex((item) => item.id === id);

  if (index === -1) {
    throw new Error('Feed item not found');
  }

  items[index].read = !items[index].read;

  await saveFeedItems(items);
  console.log('[Uproot] Toggled read status for feed item:', id, '→', items[index].read);
}

// Mark all feed items as read
export async function markAllFeedItemsAsRead(): Promise<void> {
  const items = await getFeedItems();
  const updatedItems = items.map((item) => ({ ...item, read: true }));

  await saveFeedItems(updatedItems);
  console.log('[Uproot] Marked all feed items as read');
}

// Delete feed item
export async function deleteFeedItem(id: string): Promise<void> {
  const items = await getFeedItems();
  const filteredItems = items.filter((item) => item.id !== id);

  await saveFeedItems(filteredItems);
  console.log('[Uproot] Deleted feed item:', id);
}

// Get feed statistics
export async function getFeedStats(): Promise<FeedStats> {
  const items = await getFeedItems();

  return {
    totalItems: items.length,
    unreadCount: items.filter((item) => !item.read).length,
    jobAlerts: items.filter((item) => item.type === 'job_alert').length,
    companyUpdates: items.filter((item) => item.type === 'company_update').length,
    connectionUpdates: items.filter((item) => item.type === 'connection_update').length,
  };
}

// Clear all feed items (for testing/reset)
export async function clearFeed(): Promise<void> {
  try {
    await chrome.storage.local.remove(FEED_STORAGE_KEY);
    console.log('[Uproot] Feed cleared');
  } catch (error) {
    console.error('[Uproot] Error clearing feed:', error);
    throw error;
  }
}

// ============================================================================
// PROFESSIONAL PROFILE MANAGEMENT
// ============================================================================

/**
 * Get the user's professional profile
 * Returns empty profile if none exists
 */
export async function getProfessionalProfile(): Promise<ProfessionalProfile> {
  try {
    const result = await chrome.storage.local.get(PROFESSIONAL_PROFILE_KEY);
    const profile = result[PROFESSIONAL_PROFILE_KEY];

    if (!profile) {
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

    return profile;
  } catch (error) {
    console.error('[Uproot] Error getting professional profile:', error);
    throw error;
  }
}

/**
 * Save the entire professional profile
 */
export async function saveProfessionalProfile(profile: ProfessionalProfile): Promise<void> {
  try {
    const updatedProfile = {
      ...profile,
      updatedAt: Date.now(),
    };

    await chrome.storage.local.set({ [PROFESSIONAL_PROFILE_KEY]: updatedProfile });
    console.log('[Uproot] Professional profile saved');
  } catch (error) {
    console.error('[Uproot] Error saving professional profile:', error);
    throw error;
  }
}

/**
 * Update personal information
 */
export async function updatePersonalInfo(info: PersonalInfo): Promise<void> {
  const profile = await getProfessionalProfile();
  profile.personalInfo = info;
  await saveProfessionalProfile(profile);
  console.log('[Uproot] Personal info updated');
}

// ============================================================================
// WORK EXPERIENCE MANAGEMENT
// ============================================================================

/**
 * Add new job experience
 */
export async function addJobExperience(job: Omit<JobExperience, 'id' | 'createdAt' | 'updatedAt'>): Promise<JobExperience> {
  const profile = await getProfessionalProfile();

  const newJob: JobExperience = {
    ...job,
    id: `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  profile.jobs.push(newJob);
  await saveProfessionalProfile(profile);

  console.log('[Uproot] Added job:', newJob.title, 'at', newJob.company);
  return newJob;
}

/**
 * Update existing job experience
 */
export async function updateJobExperience(id: string, updates: Partial<JobExperience>): Promise<void> {
  const profile = await getProfessionalProfile();
  const index = profile.jobs.findIndex((j) => j.id === id);

  if (index === -1) {
    throw new Error('Job not found');
  }

  profile.jobs[index] = {
    ...profile.jobs[index],
    ...updates,
    updatedAt: Date.now(),
  };

  await saveProfessionalProfile(profile);
  console.log('[Uproot] Updated job:', id);
}

/**
 * Delete job experience
 */
export async function deleteJobExperience(id: string): Promise<void> {
  const profile = await getProfessionalProfile();
  profile.jobs = profile.jobs.filter((j) => j.id !== id);
  await saveProfessionalProfile(profile);
  console.log('[Uproot] Deleted job:', id);
}

/**
 * Add new internship experience
 */
export async function addInternshipExperience(internship: Omit<InternshipExperience, 'id' | 'createdAt' | 'updatedAt'>): Promise<InternshipExperience> {
  const profile = await getProfessionalProfile();

  const newInternship: InternshipExperience = {
    ...internship,
    id: `intern_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  profile.internships.push(newInternship);
  await saveProfessionalProfile(profile);

  console.log('[Uproot] Added internship:', newInternship.title, 'at', newInternship.company);
  return newInternship;
}

/**
 * Update internship experience
 */
export async function updateInternshipExperience(id: string, updates: Partial<InternshipExperience>): Promise<void> {
  const profile = await getProfessionalProfile();
  const index = profile.internships.findIndex((i) => i.id === id);

  if (index === -1) {
    throw new Error('Internship not found');
  }

  profile.internships[index] = {
    ...profile.internships[index],
    ...updates,
    updatedAt: Date.now(),
  };

  await saveProfessionalProfile(profile);
  console.log('[Uproot] Updated internship:', id);
}

/**
 * Delete internship experience
 */
export async function deleteInternshipExperience(id: string): Promise<void> {
  const profile = await getProfessionalProfile();
  profile.internships = profile.internships.filter((i) => i.id !== id);
  await saveProfessionalProfile(profile);
  console.log('[Uproot] Deleted internship:', id);
}

/**
 * Add volunteer experience
 */
export async function addVolunteerExperience(volunteer: Omit<VolunteerExperience, 'id' | 'createdAt' | 'updatedAt'>): Promise<VolunteerExperience> {
  const profile = await getProfessionalProfile();

  const newVolunteer: VolunteerExperience = {
    ...volunteer,
    id: `volunteer_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  profile.volunteerWork.push(newVolunteer);
  await saveProfessionalProfile(profile);

  console.log('[Uproot] Added volunteer work:', newVolunteer.role, 'at', newVolunteer.organization);
  return newVolunteer;
}

/**
 * Update volunteer experience
 */
export async function updateVolunteerExperience(id: string, updates: Partial<VolunteerExperience>): Promise<void> {
  const profile = await getProfessionalProfile();
  const index = profile.volunteerWork.findIndex((v) => v.id === id);

  if (index === -1) {
    throw new Error('Volunteer work not found');
  }

  profile.volunteerWork[index] = {
    ...profile.volunteerWork[index],
    ...updates,
    updatedAt: Date.now(),
  };

  await saveProfessionalProfile(profile);
  console.log('[Uproot] Updated volunteer work:', id);
}

/**
 * Delete volunteer experience
 */
export async function deleteVolunteerExperience(id: string): Promise<void> {
  const profile = await getProfessionalProfile();
  profile.volunteerWork = profile.volunteerWork.filter((v) => v.id !== id);
  await saveProfessionalProfile(profile);
  console.log('[Uproot] Deleted volunteer work:', id);
}

// ============================================================================
// SKILLS & TOOLS MANAGEMENT
// ============================================================================

/**
 * Add technical skill
 */
export async function addTechnicalSkill(skill: Omit<Skill, 'id'>): Promise<Skill> {
  const profile = await getProfessionalProfile();

  const newSkill: Skill = {
    ...skill,
    id: `skill_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
  };

  profile.technicalSkills.push(newSkill);
  await saveProfessionalProfile(profile);

  console.log('[Uproot] Added technical skill:', newSkill.name);
  return newSkill;
}

/**
 * Update technical skill
 */
export async function updateTechnicalSkill(id: string, updates: Partial<Skill>): Promise<void> {
  const profile = await getProfessionalProfile();
  const index = profile.technicalSkills.findIndex((s) => s.id === id);

  if (index === -1) {
    throw new Error('Skill not found');
  }

  profile.technicalSkills[index] = {
    ...profile.technicalSkills[index],
    ...updates,
  };

  await saveProfessionalProfile(profile);
  console.log('[Uproot] Updated technical skill:', id);
}

/**
 * Delete technical skill
 */
export async function deleteTechnicalSkill(id: string): Promise<void> {
  const profile = await getProfessionalProfile();
  profile.technicalSkills = profile.technicalSkills.filter((s) => s.id !== id);
  await saveProfessionalProfile(profile);
  console.log('[Uproot] Deleted technical skill:', id);
}

/**
 * Add soft skill
 */
export async function addSoftSkill(skill: Omit<Skill, 'id'>): Promise<Skill> {
  const profile = await getProfessionalProfile();

  const newSkill: Skill = {
    ...skill,
    id: `soft_skill_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
  };

  profile.softSkills.push(newSkill);
  await saveProfessionalProfile(profile);

  console.log('[Uproot] Added soft skill:', newSkill.name);
  return newSkill;
}

/**
 * Add tool/software
 */
export async function addTool(tool: Omit<Tool, 'id'>): Promise<Tool> {
  const profile = await getProfessionalProfile();

  const newTool: Tool = {
    ...tool,
    id: `tool_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
  };

  profile.tools.push(newTool);
  await saveProfessionalProfile(profile);

  console.log('[Uproot] Added tool:', newTool.name);
  return newTool;
}

/**
 * Update tool
 */
export async function updateTool(id: string, updates: Partial<Tool>): Promise<void> {
  const profile = await getProfessionalProfile();
  const index = profile.tools.findIndex((t) => t.id === id);

  if (index === -1) {
    throw new Error('Tool not found');
  }

  profile.tools[index] = {
    ...profile.tools[index],
    ...updates,
  };

  await saveProfessionalProfile(profile);
  console.log('[Uproot] Updated tool:', id);
}

/**
 * Delete tool
 */
export async function deleteTool(id: string): Promise<void> {
  const profile = await getProfessionalProfile();
  profile.tools = profile.tools.filter((t) => t.id !== id);
  await saveProfessionalProfile(profile);
  console.log('[Uproot] Deleted tool:', id);
}

/**
 * Add certification
 */
export async function addCertification(cert: Omit<Certification, 'id'>): Promise<Certification> {
  const profile = await getProfessionalProfile();

  const newCert: Certification = {
    ...cert,
    id: `cert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
  };

  profile.certifications.push(newCert);
  await saveProfessionalProfile(profile);

  console.log('[Uproot] Added certification:', newCert.name);
  return newCert;
}

/**
 * Delete certification
 */
export async function deleteCertification(id: string): Promise<void> {
  const profile = await getProfessionalProfile();
  profile.certifications = profile.certifications.filter((c) => c.id !== id);
  await saveProfessionalProfile(profile);
  console.log('[Uproot] Deleted certification:', id);
}

// ============================================================================
// EDUCATION & PROJECTS
// ============================================================================

/**
 * Add education
 */
export async function addEducation(edu: Omit<Education, 'id' | 'createdAt' | 'updatedAt'>): Promise<Education> {
  const profile = await getProfessionalProfile();

  const newEdu: Education = {
    ...edu,
    id: `edu_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  profile.education.push(newEdu);
  await saveProfessionalProfile(profile);

  console.log('[Uproot] Added education:', newEdu.degree, 'in', newEdu.field);
  return newEdu;
}

/**
 * Update education
 */
export async function updateEducation(id: string, updates: Partial<Education>): Promise<void> {
  const profile = await getProfessionalProfile();
  const index = profile.education.findIndex((e) => e.id === id);

  if (index === -1) {
    throw new Error('Education not found');
  }

  profile.education[index] = {
    ...profile.education[index],
    ...updates,
    updatedAt: Date.now(),
  };

  await saveProfessionalProfile(profile);
  console.log('[Uproot] Updated education:', id);
}

/**
 * Delete education
 */
export async function deleteEducation(id: string): Promise<void> {
  const profile = await getProfessionalProfile();
  profile.education = profile.education.filter((e) => e.id !== id);
  await saveProfessionalProfile(profile);
  console.log('[Uproot] Deleted education:', id);
}

/**
 * Add project
 */
export async function addProject(project: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>): Promise<Project> {
  const profile = await getProfessionalProfile();

  const newProject: Project = {
    ...project,
    id: `project_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  profile.projects.push(newProject);
  await saveProfessionalProfile(profile);

  console.log('[Uproot] Added project:', newProject.name);
  return newProject;
}

/**
 * Update project
 */
export async function updateProject(id: string, updates: Partial<Project>): Promise<void> {
  const profile = await getProfessionalProfile();
  const index = profile.projects.findIndex((p) => p.id === id);

  if (index === -1) {
    throw new Error('Project not found');
  }

  profile.projects[index] = {
    ...profile.projects[index],
    ...updates,
    updatedAt: Date.now(),
  };

  await saveProfessionalProfile(profile);
  console.log('[Uproot] Updated project:', id);
}

/**
 * Delete project
 */
export async function deleteProject(id: string): Promise<void> {
  const profile = await getProfessionalProfile();
  profile.projects = profile.projects.filter((p) => p.id !== id);
  await saveProfessionalProfile(profile);
  console.log('[Uproot] Deleted project:', id);
}

// ============================================================================
// JOB DESCRIPTION ANALYSIS
// ============================================================================

/**
 * Save analyzed job description
 */
export async function saveJobDescription(analysis: Omit<JobDescriptionAnalysis, 'id'>): Promise<string> {
  try {
    const result = await chrome.storage.local.get(JOB_DESCRIPTIONS_KEY);
    const descriptions: JobDescriptionAnalysis[] = result[JOB_DESCRIPTIONS_KEY] || [];

    const newDescription: JobDescriptionAnalysis = {
      ...analysis,
      id: `jobdesc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    };

    descriptions.unshift(newDescription);
    await chrome.storage.local.set({ [JOB_DESCRIPTIONS_KEY]: descriptions });

    console.log('[Uproot] Saved job description:', newDescription.jobTitle, 'at', newDescription.company);
    return newDescription.id;
  } catch (error) {
    console.error('[Uproot] Error saving job description:', error);
    throw error;
  }
}

/**
 * Get all job descriptions
 */
export async function getJobDescriptions(): Promise<JobDescriptionAnalysis[]> {
  try {
    const result = await chrome.storage.local.get(JOB_DESCRIPTIONS_KEY);
    return result[JOB_DESCRIPTIONS_KEY] || [];
  } catch (error) {
    console.error('[Uproot] Error getting job descriptions:', error);
    return [];
  }
}

/**
 * Get job description by ID
 */
export async function getJobDescriptionById(id: string): Promise<JobDescriptionAnalysis | null> {
  const descriptions = await getJobDescriptions();
  return descriptions.find((d) => d.id === id) || null;
}

/**
 * Delete job description
 */
export async function deleteJobDescription(id: string): Promise<void> {
  try {
    const descriptions = await getJobDescriptions();
    const filtered = descriptions.filter((d) => d.id !== id);
    await chrome.storage.local.set({ [JOB_DESCRIPTIONS_KEY]: filtered });
    console.log('[Uproot] Deleted job description:', id);
  } catch (error) {
    console.error('[Uproot] Error deleting job description:', error);
    throw error;
  }
}

// ============================================================================
// GENERATED RESUMES
// ============================================================================

/**
 * Save generated resume
 */
export async function saveGeneratedResume(resume: GeneratedResume): Promise<void> {
  try {
    const result = await chrome.storage.local.get(GENERATED_RESUMES_KEY);
    const resumes: GeneratedResume[] = result[GENERATED_RESUMES_KEY] || [];

    resumes.unshift(resume);
    await chrome.storage.local.set({ [GENERATED_RESUMES_KEY]: resumes });

    console.log('[Uproot] Saved generated resume for:', resume.jobTitle, 'at', resume.company);
  } catch (error) {
    console.error('[Uproot] Error saving generated resume:', error);
    throw error;
  }
}

/**
 * Get all generated resumes
 */
export async function getGeneratedResumes(): Promise<GeneratedResume[]> {
  try {
    const result = await chrome.storage.local.get(GENERATED_RESUMES_KEY);
    return result[GENERATED_RESUMES_KEY] || [];
  } catch (error) {
    console.error('[Uproot] Error getting generated resumes:', error);
    return [];
  }
}

/**
 * Get generated resume by ID
 */
export async function getGeneratedResumeById(id: string): Promise<GeneratedResume | null> {
  const resumes = await getGeneratedResumes();
  return resumes.find((r) => r.id === id) || null;
}

/**
 * Delete generated resume
 */
export async function deleteGeneratedResume(id: string): Promise<void> {
  try {
    const resumes = await getGeneratedResumes();
    const filtered = resumes.filter((r) => r.id !== id);
    await chrome.storage.local.set({ [GENERATED_RESUMES_KEY]: filtered });
    console.log('[Uproot] Deleted generated resume:', id);
  } catch (error) {
    console.error('[Uproot] Error deleting generated resume:', error);
    throw error;
  }
}

// ============================================================================
// APPLICATION TRACKING
// ============================================================================

/**
 * Add new application
 */
export async function addApplication(app: Omit<Application, 'id' | 'createdAt' | 'updatedAt' | 'statusHistory'>): Promise<Application> {
  try {
    const result = await chrome.storage.local.get(APPLICATIONS_KEY);
    const applications: Application[] = result[APPLICATIONS_KEY] || [];

    const newApp: Application = {
      ...app,
      id: `app_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      statusHistory: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    applications.unshift(newApp);
    await chrome.storage.local.set({ [APPLICATIONS_KEY]: applications });

    console.log('[Uproot] Added application:', newApp.jobTitle, 'at', newApp.company);
    return newApp;
  } catch (error) {
    console.error('[Uproot] Error adding application:', error);
    throw error;
  }
}

/**
 * Get all applications
 */
export async function getApplications(): Promise<Application[]> {
  try {
    const result = await chrome.storage.local.get(APPLICATIONS_KEY);
    const apps = result[APPLICATIONS_KEY] || [];
    // Sort by most recent
    return apps.sort((a: Application, b: Application) => b.appliedDate - a.appliedDate);
  } catch (error) {
    console.error('[Uproot] Error getting applications:', error);
    return [];
  }
}

/**
 * Update application status with history tracking
 */
export async function updateApplicationStatus(
  id: string,
  newStatus: ApplicationStatus,
  notes?: string
): Promise<void> {
  try {
    const applications = await getApplications();
    const index = applications.findIndex((a) => a.id === id);

    if (index === -1) {
      throw new Error('Application not found');
    }

    const oldStatus = applications[index].status;

    // Add to status history
    applications[index].statusHistory.push({
      from: oldStatus,
      to: newStatus,
      date: Date.now(),
      notes,
    });

    applications[index].status = newStatus;
    applications[index].updatedAt = Date.now();

    if (notes) {
      applications[index].notes = notes;
    }

    await chrome.storage.local.set({ [APPLICATIONS_KEY]: applications });
    console.log('[Uproot] Updated application status:', id, oldStatus, '→', newStatus);
  } catch (error) {
    console.error('[Uproot] Error updating application status:', error);
    throw error;
  }
}

/**
 * Delete application
 */
export async function deleteApplication(id: string): Promise<void> {
  try {
    const applications = await getApplications();
    const filtered = applications.filter((a) => a.id !== id);
    await chrome.storage.local.set({ [APPLICATIONS_KEY]: filtered });
    console.log('[Uproot] Deleted application:', id);
  } catch (error) {
    console.error('[Uproot] Error deleting application:', error);
    throw error;
  }
}

// ============================================================================
// STATISTICS & ANALYTICS
// ============================================================================

/**
 * Get profile statistics
 */
export async function getProfileStats(): Promise<ProfileStats> {
  const profile = await getProfessionalProfile();

  // Calculate years of experience
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth();

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

// ============================================================================
// RESUME MANAGEMENT (Upload/Track Resumes)
// ============================================================================

/**
 * Get all uploaded resumes
 */
export async function getResumes(): Promise<Resume[]> {
  try {
    const result = await chrome.storage.local.get(RESUMES_STORAGE_KEY);
    return result[RESUMES_STORAGE_KEY] || [];
  } catch (error) {
    console.error('[Uproot] Error getting resumes:', error);
    return [];
  }
}

/**
 * Add new resume
 */
export async function addResume(data: Omit<Resume, 'id' | 'uploadedAt'>): Promise<Resume> {
  const resumes = await getResumes();

  const newResume: Resume = {
    ...data,
    id: `resume_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    uploadedAt: Date.now(),
  };

  resumes.push(newResume);
  await chrome.storage.local.set({ [RESUMES_STORAGE_KEY]: resumes });

  console.log('[Uproot] Added resume:', newResume.name);
  return newResume;
}

/**
 * Update resume
 */
export async function updateResume(id: string, updates: Partial<Resume>): Promise<void> {
  const resumes = await getResumes();
  const index = resumes.findIndex((r) => r.id === id);

  if (index === -1) {
    throw new Error('Resume not found');
  }

  resumes[index] = { ...resumes[index], ...updates };
  await chrome.storage.local.set({ [RESUMES_STORAGE_KEY]: resumes });
  console.log('[Uproot] Updated resume:', id);
}

/**
 * Delete resume
 */
export async function deleteResume(id: string): Promise<void> {
  const resumes = await getResumes();
  const filtered = resumes.filter((r) => r.id !== id);
  await chrome.storage.local.set({ [RESUMES_STORAGE_KEY]: filtered });
  console.log('[Uproot] Deleted resume:', id);
}

// ============================================================================
// RESUME APPLICATION TRACKING
// ============================================================================

/**
 * Get all resume applications
 */
export async function getResumeApplications(): Promise<ResumeApplication[]> {
  try {
    const result = await chrome.storage.local.get(RESUME_APPLICATIONS_STORAGE_KEY);
    return result[RESUME_APPLICATIONS_STORAGE_KEY] || [];
  } catch (error) {
    console.error('[Uproot] Error getting resume applications:', error);
    return [];
  }
}

/**
 * Add resume application
 */
export async function addResumeApplication(data: Omit<ResumeApplication, 'id'>): Promise<ResumeApplication> {
  const applications = await getResumeApplications();

  const newApp: ResumeApplication = {
    ...data,
    id: `app_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
  };

  applications.push(newApp);
  await chrome.storage.local.set({ [RESUME_APPLICATIONS_STORAGE_KEY]: applications });

  console.log('[Uproot] Added application:', newApp.company, newApp.jobTitle);
  return newApp;
}

/**
 * Update resume application status
 */
export async function updateResumeApplicationStatus(id: string, status: ApplicationStatus): Promise<void> {
  const applications = await getResumeApplications();
  const index = applications.findIndex((a) => a.id === id);

  if (index === -1) {
    throw new Error('Application not found');
  }

  applications[index].status = status;
  await chrome.storage.local.set({ [RESUME_APPLICATIONS_STORAGE_KEY]: applications });
  console.log('[Uproot] Updated application status:', id, status);
}

/**
 * Delete resume application
 */
export async function deleteResumeApplication(id: string): Promise<void> {
  const applications = await getResumeApplications();
  const filtered = applications.filter((a) => a.id !== id);
  await chrome.storage.local.set({ [RESUME_APPLICATIONS_STORAGE_KEY]: filtered });
  console.log('[Uproot] Deleted application:', id);
}

/**
 * Get resume statistics
 */
export async function getResumeStats(): Promise<ResumeStats> {
  const [resumes, applications] = await Promise.all([
    getGeneratedResumes(),
    getApplications(),
  ]);

  // Count applications by status
  const applicationsByStatus: { [key in ApplicationStatus]: number } = {
    applied: 0,
    screening: 0,
    'phone-screen': 0,
    'technical-interview': 0,
    'onsite-interview': 0,
    'final-round': 0,
    offer: 0,
    accepted: 0,
    rejected: 0,
    withdrawn: 0,
  };

  applications.forEach((app) => {
    applicationsByStatus[app.status]++;
  });

  // Calculate average ATS score
  const atsScores = resumes.map((r) => r.atsOptimization.overallATSScore);
  const averageATSScore = atsScores.length > 0
    ? atsScores.reduce((sum, score) => sum + score, 0) / atsScores.length
    : 0;

  // Calculate average match score (from job descriptions)
  const jobDescriptions = await getJobDescriptions();
  const matchScores = jobDescriptions
    .map((d) => d.matchAnalysis?.overallScore)
    .filter((score): score is number => score !== undefined);
  const averageMatchScore = matchScores.length > 0
    ? matchScores.reduce((sum, score) => sum + score, 0) / matchScores.length
    : 0;

  // Calculate success rates
  const totalApplied = applications.length;
  const interviewStages = ['phone-screen', 'technical-interview', 'onsite-interview', 'final-round'];
  const inScreeningOrBeyond = applications.filter((a) =>
    a.status === 'screening' || interviewStages.includes(a.status) || a.status === 'offer' || a.status === 'accepted'
  ).length;
  const inInterviews = applications.filter((a) =>
    interviewStages.includes(a.status) || a.status === 'offer' || a.status === 'accepted'
  ).length;
  const offers = applicationsByStatus.offer + applicationsByStatus.accepted;

  const responseRate = totalApplied > 0 ? (inScreeningOrBeyond / totalApplied) * 100 : 0;
  const interviewRate = totalApplied > 0 ? (inInterviews / totalApplied) * 100 : 0;
  const offerRate = totalApplied > 0 ? (offers / totalApplied) * 100 : 0;

  return {
    totalGenerated: resumes.length,
    totalApplications: applications.length,
    applicationsByStatus,
    averageATSScore: Math.round(averageATSScore),
    averageMatchScore: Math.round(averageMatchScore),
    responseRate: Math.round(responseRate),
    interviewRate: Math.round(interviewRate),
    offerRate: Math.round(offerRate),
  };
}

// ============================================================================
// ADDITIONAL PROFESSIONAL PROFILE FUNCTIONS
// ============================================================================

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
function calculateYearsOfExperience(profile: ProfessionalProfile): number {
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
function calculateProfileCompleteness(profile: ProfessionalProfile): number {
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

// ============================================================================
// JOB DESCRIPTION ANALYSIS FUNCTIONS
// ============================================================================

/**
 * Get all job description analyses from storage
 */
export async function getJobDescriptionAnalyses(): Promise<JobDescriptionAnalysis[]> {
  try {
    const result = await chrome.storage.local.get(JOB_DESCRIPTIONS_KEY);
    const analyses = result[JOB_DESCRIPTIONS_KEY] || [];
    // Sort by analyzed date, newest first
    return analyses.sort((a: JobDescriptionAnalysis, b: JobDescriptionAnalysis) => b.analyzedAt - a.analyzedAt);
  } catch (error) {
    console.error('[Uproot] Error getting job description analyses:', error);
    return [];
  }
}

/**
 * Save job description analysis to storage
 */
export async function saveJobDescriptionAnalysis(analysis: JobDescriptionAnalysis): Promise<void> {
  try {
    const analyses = await getJobDescriptionAnalyses();

    // Check if analysis with same ID exists
    const existingIndex = analyses.findIndex((a) => a.id === analysis.id);

    if (existingIndex !== -1) {
      // Update existing
      analyses[existingIndex] = analysis;
    } else {
      // Add new
      analyses.push(analysis);
    }

    await chrome.storage.local.set({ [JOB_DESCRIPTIONS_KEY]: analyses });
    console.log('[Uproot] Job description analysis saved:', analysis.jobTitle);
  } catch (error) {
    console.error('[Uproot] Error saving job description analysis:', error);
    throw error;
  }
}

/**
 * Delete job description analysis
 */
export async function deleteJobDescriptionAnalysis(id: string): Promise<void> {
  try {
    const analyses = await getJobDescriptionAnalyses();
    const filtered = analyses.filter((a) => a.id !== id);
    await chrome.storage.local.set({ [JOB_DESCRIPTIONS_KEY]: filtered });
    console.log('[Uproot] Job description analysis deleted:', id);
  } catch (error) {
    console.error('[Uproot] Error deleting job description analysis:', error);
    throw error;
  }
}

/**
 * Get job description analysis by ID
 */
export async function getJobDescriptionAnalysis(id: string): Promise<JobDescriptionAnalysis | null> {
  try {
    const analyses = await getJobDescriptionAnalyses();
    return analyses.find((a) => a.id === id) || null;
  } catch (error) {
    console.error('[Uproot] Error getting job description analysis:', error);
    return null;
  }
}

// Note: Generated resume functions are defined earlier in this file (lines 1055-1105)

// ============================================================================
// COVER LETTER MANAGEMENT
// ============================================================================

/**
 * Get all cover letters
 */
export async function getCoverLetters(): Promise<CoverLetter[]> {
  try {
    const result = await chrome.storage.local.get(COVER_LETTERS_KEY);
    return result[COVER_LETTERS_KEY] || [];
  } catch (error) {
    console.error('[Uproot] Error getting cover letters:', error);
    return [];
  }
}

/**
 * Get cover letter by ID
 */
export async function getCoverLetter(id: string): Promise<CoverLetter | null> {
  try {
    const letters = await getCoverLetters();
    return letters.find((l) => l.id === id) || null;
  } catch (error) {
    console.error('[Uproot] Error getting cover letter:', error);
    return null;
  }
}

/**
 * Get cover letters for a specific job
 */
export async function getCoverLettersForJob(jobId: string): Promise<CoverLetter[]> {
  try {
    const letters = await getCoverLetters();
    return letters.filter((l) => l.jobId === jobId);
  } catch (error) {
    console.error('[Uproot] Error getting cover letters for job:', error);
    return [];
  }
}

/**
 * Save cover letter (create or update)
 */
export async function saveCoverLetter(letter: CoverLetter): Promise<void> {
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
    } else {
      letters.push(updatedLetter);
    }

    await chrome.storage.local.set({ [COVER_LETTERS_KEY]: letters });
    console.log('[Uproot] Cover letter saved:', letter.id);
  } catch (error) {
    console.error('[Uproot] Error saving cover letter:', error);
    throw error;
  }
}

/**
 * Create new cover letter
 */
export async function createCoverLetter(
  letterData: Omit<CoverLetter, 'id' | 'createdAt' | 'updatedAt' | 'lastEditedAt' | 'version'>
): Promise<CoverLetter> {
  const newLetter: CoverLetter = {
    ...letterData,
    id: `cover_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    version: 1,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    lastEditedAt: Date.now(),
  };

  await saveCoverLetter(newLetter);
  console.log('[Uproot] Created cover letter:', newLetter.id, 'for', newLetter.company);
  return newLetter;
}

/**
 * Update cover letter
 */
export async function updateCoverLetter(id: string, updates: Partial<CoverLetter>): Promise<void> {
  try {
    const letter = await getCoverLetter(id);
    if (!letter) {
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
    console.log('[Uproot] Updated cover letter:', id);
  } catch (error) {
    console.error('[Uproot] Error updating cover letter:', error);
    throw error;
  }
}

/**
 * Delete cover letter
 */
export async function deleteCoverLetter(id: string): Promise<void> {
  try {
    const letters = await getCoverLetters();
    const filtered = letters.filter((l) => l.id !== id);
    await chrome.storage.local.set({ [COVER_LETTERS_KEY]: filtered });
    console.log('[Uproot] Deleted cover letter:', id);
  } catch (error) {
    console.error('[Uproot] Error deleting cover letter:', error);
    throw error;
  }
}

/**
 * Mark cover letter as sent
 */
export async function markCoverLetterAsSent(id: string): Promise<void> {
  try {
    await updateCoverLetter(id, {
      status: 'sent',
      sentAt: Date.now(),
    });
    console.log('[Uproot] Marked cover letter as sent:', id);
  } catch (error) {
    console.error('[Uproot] Error marking cover letter as sent:', error);
    throw error;
  }
}

/**
 * Update cover letter outcome
 */
export async function updateCoverLetterOutcome(
  id: string,
  outcome: 'no-response' | 'rejected' | 'phone-screen' | 'interview' | 'offer'
): Promise<void> {
  try {
    await updateCoverLetter(id, {
      outcomeStatus: outcome,
      responseReceived: outcome !== 'no-response',
      responseDate: Date.now(),
    });
    console.log('[Uproot] Updated cover letter outcome:', id, outcome);
  } catch (error) {
    console.error('[Uproot] Error updating cover letter outcome:', error);
    throw error;
  }
}

// ============================================================================
// COVER LETTER TEMPLATES
// ============================================================================

/**
 * Get all cover letter templates
 */
export async function getCoverLetterTemplates(): Promise<CoverLetterTemplate[]> {
  try {
    const result = await chrome.storage.local.get(COVER_LETTER_TEMPLATES_KEY);
    const templates = result[COVER_LETTER_TEMPLATES_KEY] || [];

    // If no templates exist, return default templates
    if (templates.length === 0) {
      return getDefaultCoverLetterTemplates();
    }

    return templates;
  } catch (error) {
    console.error('[Uproot] Error getting cover letter templates:', error);
    return getDefaultCoverLetterTemplates();
  }
}

/**
 * Get cover letter template by ID
 */
export async function getCoverLetterTemplate(id: string): Promise<CoverLetterTemplate | null> {
  try {
    const templates = await getCoverLetterTemplates();
    return templates.find((t) => t.id === id) || null;
  } catch (error) {
    console.error('[Uproot] Error getting cover letter template:', error);
    return null;
  }
}

/**
 * Save cover letter template
 */
export async function saveCoverLetterTemplate(template: CoverLetterTemplate): Promise<void> {
  try {
    const templates = await getCoverLetterTemplates();
    const existingIndex = templates.findIndex((t) => t.id === template.id);

    const updatedTemplate: CoverLetterTemplate = {
      ...template,
      updatedAt: Date.now(),
    };

    if (existingIndex >= 0) {
      templates[existingIndex] = updatedTemplate;
    } else {
      templates.push(updatedTemplate);
    }

    await chrome.storage.local.set({ [COVER_LETTER_TEMPLATES_KEY]: templates });
    console.log('[Uproot] Cover letter template saved:', template.id);
  } catch (error) {
    console.error('[Uproot] Error saving cover letter template:', error);
    throw error;
  }
}

/**
 * Delete cover letter template
 */
export async function deleteCoverLetterTemplate(id: string): Promise<void> {
  try {
    const templates = await getCoverLetterTemplates();

    // Prevent deleting default templates
    const template = templates.find((t) => t.id === id);
    if (template && template.isDefault) {
      throw new Error('Cannot delete default template');
    }

    const filtered = templates.filter((t) => t.id !== id);
    await chrome.storage.local.set({ [COVER_LETTER_TEMPLATES_KEY]: filtered });
    console.log('[Uproot] Deleted cover letter template:', id);
  } catch (error) {
    console.error('[Uproot] Error deleting cover letter template:', error);
    throw error;
  }
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
      jobLevel: ['mid', 'senior', 'executive'],
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
      tone: 'confident',
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

// ============================================================================
// COVER LETTER COMPONENTS
// ============================================================================

/**
 * Get all cover letter components
 */
export async function getCoverLetterComponents(): Promise<CoverLetterComponent[]> {
  try {
    const result = await chrome.storage.local.get(COVER_LETTER_COMPONENTS_KEY);
    const components = result[COVER_LETTER_COMPONENTS_KEY] || [];

    // If no components exist, return default components
    if (components.length === 0) {
      return getDefaultCoverLetterComponents();
    }

    return components;
  } catch (error) {
    console.error('[Uproot] Error getting cover letter components:', error);
    return getDefaultCoverLetterComponents();
  }
}

/**
 * Save cover letter component
 */
export async function saveCoverLetterComponent(component: CoverLetterComponent): Promise<void> {
  try {
    const components = await getCoverLetterComponents();
    const existingIndex = components.findIndex((c) => c.id === component.id);

    if (existingIndex >= 0) {
      components[existingIndex] = component;
    } else {
      components.push(component);
    }

    await chrome.storage.local.set({ [COVER_LETTER_COMPONENTS_KEY]: components });
    console.log('[Uproot] Cover letter component saved:', component.id);
  } catch (error) {
    console.error('[Uproot] Error saving cover letter component:', error);
    throw error;
  }
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
      bestFor: { tone: ['confident'], jobLevel: ['mid', 'senior'] },
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
      bestFor: { tone: ['professional'], jobLevel: ['senior', 'executive'] },
      isDefault: true,
      usageCount: 0,
      createdAt: Date.now(),
    },
  ];
}

// ============================================================================
// COVER LETTER PREFERENCES
// ============================================================================

/**
 * Get user's cover letter preferences
 */
export async function getCoverLetterPreferences(): Promise<CoverLetterPreferences> {
  try {
    const result = await chrome.storage.local.get(COVER_LETTER_PREFERENCES_KEY);
    const prefs = result[COVER_LETTER_PREFERENCES_KEY];

    if (!prefs) {
      // Return default preferences
      return {
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
      };
    }

    return prefs;
  } catch (error) {
    console.error('[Uproot] Error getting cover letter preferences:', error);
    throw error;
  }
}

/**
 * Save cover letter preferences
 */
export async function saveCoverLetterPreferences(prefs: CoverLetterPreferences): Promise<void> {
  try {
    await chrome.storage.local.set({ [COVER_LETTER_PREFERENCES_KEY]: prefs });
    console.log('[Uproot] Cover letter preferences saved');
  } catch (error) {
    console.error('[Uproot] Error saving cover letter preferences:', error);
    throw error;
  }
}

// ============================================================================
// COVER LETTER ANALYTICS
// ============================================================================

/**
 * Get cover letter analytics
 */
export async function getCoverLetterAnalytics(): Promise<CoverLetterAnalytics> {
  try {
    const result = await chrome.storage.local.get(COVER_LETTER_ANALYTICS_KEY);
    const analytics = result[COVER_LETTER_ANALYTICS_KEY];

    if (!analytics) {
      // Return empty analytics
      return {
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
      };
    }

    return analytics;
  } catch (error) {
    console.error('[Uproot] Error getting cover letter analytics:', error);
    throw error;
  }
}

/**
 * Update cover letter analytics
 */
export async function updateCoverLetterAnalytics(updates: Partial<CoverLetterAnalytics>): Promise<void> {
  try {
    const analytics = await getCoverLetterAnalytics();
    const updated: CoverLetterAnalytics = {
      ...analytics,
      ...updates,
    };

    await chrome.storage.local.set({ [COVER_LETTER_ANALYTICS_KEY]: updated });
    console.log('[Uproot] Cover letter analytics updated');
  } catch (error) {
    console.error('[Uproot] Error updating cover letter analytics:', error);
    throw error;
  }
}

/**
 * Recalculate analytics from all cover letters
 * Call this periodically to keep analytics fresh
 */
export async function recalculateCoverLetterAnalytics(): Promise<void> {
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
    console.log('[Uproot] Cover letter analytics recalculated');
  } catch (error) {
    console.error('[Uproot] Error recalculating cover letter analytics:', error);
    throw error;
  }
}
