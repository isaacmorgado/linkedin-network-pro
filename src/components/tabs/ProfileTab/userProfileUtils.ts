/**
 * User Profile Utility Functions
 * Handles profile conversion and current user detection
 */

import type { UserProfile } from '../../../types/resume-tailoring';
import { getCurrentLinkedInUser, scrapeOwnProfile } from '../../../utils/linkedin-scraper';

/**
 * Convert LinkedInPersonProfile to UserProfile format
 */
export function convertLinkedInToUserProfile(linkedInProfile: any): UserProfile {
  return {
    id: linkedInProfile.profileUrl, // CRITICAL: Use full URL as ID to match graph nodes
    name: linkedInProfile.name || 'LinkedIn User',
    email: linkedInProfile.profileUrl,
    location: linkedInProfile.location || '',
    title: linkedInProfile.headline || linkedInProfile.currentRole?.title || '',
    avatarUrl: linkedInProfile.photoUrl,
    publicId: linkedInProfile.publicId,
    url: linkedInProfile.profileUrl,
    workExperience: linkedInProfile.currentRole?.title
      ? [
          {
            id: 'current-role',
            company: linkedInProfile.currentRole.company || '',
            title: linkedInProfile.currentRole.title,
            startDate: linkedInProfile.currentRole.startDate || new Date().toISOString(),
            endDate: null,
            location: linkedInProfile.location || '',
            description: '',
            industry: '',
            achievements: [],
            skills: [],
            domains: [],
            responsibilities: [],
          },
        ]
      : [],
    education: [],
    projects: [],
    skills: [],
    metadata: {
      totalYearsExperience: 0,
      domains: [],
      seniority: 'entry' as const,
      careerStage: 'professional' as const,
    },
  };
}

/**
 * Get current LinkedIn user profile with fallback chain
 * Priority:
 * 1. Try chrome.storage.local for 'userProfile' (Resume tab)
 * 2. If not found, call getCurrentLinkedInUser() from linkedin-scraper
 * 3. If that fails, call scrapeOwnProfile() from linkedin-scraper
 * 4. Only throw error if all 3 methods fail
 */
export async function getCurrentUser(): Promise<UserProfile | null> {
  try {
    // Method 1: Try Resume tab storage first
    const currentUserData = await chrome.storage.local.get(['userProfile']);
    if (currentUserData.userProfile) {
      const profile = currentUserData.userProfile;

      // Normalize old profile format (publicId-only) to full URL
      if (profile.email && !profile.email.startsWith('http')) {
        console.warn('[Uproot] Normalizing old profile format:', profile.email);
        profile.email = `https://www.linkedin.com/in/${profile.email}`;

        // Save normalized version back to storage
        await chrome.storage.local.set({ userProfile: profile });
      }

      console.log('[Uproot] Using current user from Resume tab:', profile.email);
      return profile;
    }

    console.log('[Uproot] No Resume tab data, trying LinkedIn detection...');

    // Method 2: Try getCurrentLinkedInUser() - detects user from any LinkedIn page
    const linkedInUser = getCurrentLinkedInUser();
    if (linkedInUser) {
      console.log('[Uproot] Detected LinkedIn user from page:', linkedInUser.name);
      return convertLinkedInToUserProfile(linkedInUser);
    }

    console.log('[Uproot] LinkedIn detection failed, trying profile scraping...');

    // Method 3: Try scrapeOwnProfile() - navigates to /me and scrapes
    const scrapedProfile = await scrapeOwnProfile();
    if (scrapedProfile && scrapedProfile.name !== 'LinkedIn User') {
      console.log('[Uproot] Scraped own profile:', scrapedProfile.name);
      return scrapedProfile;
    }

    // All methods failed
    console.error('[Uproot] All profile detection methods failed');
    return null;
  } catch (error) {
    console.error('[Uproot] Error getting current user:', error);
    return null;
  }
}
