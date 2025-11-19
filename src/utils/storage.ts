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
import type { Resume, ResumeApplication, ResumeStats, ProfessionalProfile, ProfileStats, JobDescriptionAnalysis } from '../types/resume';
import { RESUMES_STORAGE_KEY, RESUME_APPLICATIONS_STORAGE_KEY, PROFESSIONAL_PROFILE_KEY, JOB_DESCRIPTIONS_KEY } from '../types/resume';

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
// PROFESSIONAL PROFILE FUNCTIONS
// ============================================================================

/**
 * Get professional profile from storage
 */
export async function getProfessionalProfile(): Promise<ProfessionalProfile | null> {
  try {
    const result = await chrome.storage.local.get(PROFESSIONAL_PROFILE_KEY);
    return result[PROFESSIONAL_PROFILE_KEY] || null;
  } catch (error) {
    console.error('[Uproot] Error getting professional profile:', error);
    return null;
  }
}

/**
 * Save professional profile to storage
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

/**
 * Get profile statistics
 */
export async function getProfileStats(): Promise<ProfileStats> {
  try {
    const profile = await getProfessionalProfile();

    if (!profile) {
      return {
        totalJobs: 0,
        totalInternships: 0,
        totalVolunteerWork: 0,
        totalProjects: 0,
        totalSkills: 0,
        totalCertifications: 0,
        yearsOfExperience: 0,
        profileCompleteness: 0,
      };
    }

    // Calculate years of experience from jobs
    const yearsOfExperience = calculateYearsOfExperience(profile);

    // Calculate profile completeness (0-100)
    const completeness = calculateProfileCompleteness(profile);

    return {
      totalJobs: profile.jobs.length,
      totalInternships: profile.internships.length,
      totalVolunteerWork: profile.volunteerWork.length,
      totalProjects: profile.projects.length,
      totalSkills: profile.technicalSkills.length + profile.softSkills.length,
      totalCertifications: profile.certifications.length,
      yearsOfExperience,
      profileCompleteness: completeness,
    };
  } catch (error) {
    console.error('[Uproot] Error getting profile stats:', error);
    return {
      totalJobs: 0,
      totalInternships: 0,
      totalVolunteerWork: 0,
      totalProjects: 0,
      totalSkills: 0,
      totalCertifications: 0,
      yearsOfExperience: 0,
      profileCompleteness: 0,
    };
  }
}

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
