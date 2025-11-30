/**
 * Profile Scraper
 * Extracts person profile data from LinkedIn profile pages
 */

import type { LinkedInPersonProfile } from '../../types/monitoring';
import type { UserProfile, WorkExperience, ProfileMetadata } from '../../types/resume-tailoring';
import { isContextInvalidatedError } from '../storage/helpers';

/**
 * Storage key for cached current user profile
 */
export const CURRENT_USER_PROFILE_KEY = 'uproot_current_user';

/**
 * TTL for cached profile: 7 days in milliseconds
 */
const PROFILE_CACHE_TTL = 7 * 24 * 60 * 60 * 1000; // 7 days

/**
 * Cached profile data with timestamp
 */
interface CachedProfile {
  profile: UserProfile;
  cachedAt: number;
  expiresAt: number;
}

/**
 * Detect currently logged-in LinkedIn user
 * Works on any LinkedIn page where user is logged in
 * Does NOT require being on the user's profile page
 *
 * @param retryCount - Internal retry counter for handling DOM load delays
 * @param maxRetries - Maximum number of retry attempts
 */
export function getCurrentLinkedInUser(retryCount: number = 0, maxRetries: number = 3): LinkedInPersonProfile | null {
  try {
    // Try multiple selectors for user identification
    let profileUrl = '';
    let name = '';
    let headline = '';
    let photoUrl: string | undefined;

    // Method 1: Extract from global navigation bar
    const navProfileLink = document.querySelector('a[href*="/in/me/"], a[data-control-name="identity_profile_photo"]') as HTMLAnchorElement;
    if (navProfileLink) {
      let href = navProfileLink.href;

      // Ensure full URL (in case href is relative or malformed)
      if (href.startsWith('/')) {
        href = window.location.origin + href;
      } else if (!href.startsWith('http')) {
        // If it's just "dmartell" or similar, construct full URL
        href = `${window.location.origin}/in/${href}`;
      }

      profileUrl = href.replace('/in/me/', '/in/').replace(/\/$/, '');
    }

    // Method 2: Extract from profile photo in nav
    const navPhoto = document.querySelector('.global-nav__me-photo, img.global-nav__me-photo') as HTMLImageElement;
    if (navPhoto) {
      photoUrl = navPhoto.src;
      // Alt text often contains the user's name
      if (navPhoto.alt && navPhoto.alt !== 'Photo') {
        name = navPhoto.alt.trim();
      }
    }

    // Method 3: Extract from user menu trigger
    const menuTrigger = document.querySelector('.global-nav__primary-link-me-menu-trigger span.t-12.break-words, [data-control-name="identity_profile_photo"] + span');
    if (menuTrigger && !name) {
      const menuText = menuTrigger.textContent?.trim();
      if (menuText && menuText !== 'Me') {
        name = menuText;
      }
    }

    // Method 4: Try to extract from JSON-LD structured data
    const jsonLdScripts = document.querySelectorAll('script[type="application/ld+json"]');
    for (const script of jsonLdScripts) {
      try {
        const data = JSON.parse(script.textContent || '');
        if (data['@type'] === 'Person' || data['@type'] === 'ProfilePage') {
          if (data.name && !name) name = data.name;
          if (data.image && !photoUrl) photoUrl = data.image;
          if (data.jobTitle && !headline) headline = data.jobTitle;
          if (data.url && !profileUrl) profileUrl = data.url;
        }
      } catch (e) {
        // Skip invalid JSON
      }
    }

    // Method 5: Try meta tags
    if (!name) {
      const ogTitle = document.querySelector('meta[property="og:title"]') as HTMLMetaElement;
      if (ogTitle && ogTitle.content) {
        name = ogTitle.content.split('|')[0].trim();
      }
    }

    if (!photoUrl) {
      const ogImage = document.querySelector('meta[property="og:image"]') as HTMLMetaElement;
      if (ogImage && ogImage.content) {
        photoUrl = ogImage.content;
      }
    }

    // Method 6: Extract from expanded user menu (if open)
    const expandedMenu = document.querySelector('.global-nav__me-content');
    if (expandedMenu) {
      const menuNameElement = expandedMenu.querySelector('.text-heading-xlarge, .t-16.t-black.t-bold');
      if (menuNameElement && !name) {
        name = menuNameElement.textContent?.trim() || '';
      }

      const menuHeadlineElement = expandedMenu.querySelector('.text-body-small.t-black--light, .t-12.t-black--light.t-normal');
      if (menuHeadlineElement && !headline) {
        headline = menuHeadlineElement.textContent?.trim() || '';
      }
    }

    // Method 7: Try to get from page state data (LinkedIn's client-side data)
    try {
      // LinkedIn sometimes stores user data in window.__RELAY_BOOTSTRAP_DATA__ or similar
      const windowAny = window as any;
      if (windowAny.__RELAY_BOOTSTRAP_DATA__) {
        const relayData = windowAny.__RELAY_BOOTSTRAP_DATA__;
        // Navigate through the data structure to find current user info
        for (const key in relayData) {
          const entry = relayData[key];
          if (entry?.data?.me || entry?.data?.currentUser) {
            const userData = entry.data.me || entry.data.currentUser;
            if (userData.miniProfile) {
              if (userData.miniProfile.firstName && userData.miniProfile.lastName && !name) {
                name = `${userData.miniProfile.firstName} ${userData.miniProfile.lastName}`;
              }
              if (userData.miniProfile.headline && !headline) {
                headline = userData.miniProfile.headline;
              }
              if (userData.miniProfile.picture && !photoUrl) {
                photoUrl = userData.miniProfile.picture.rootUrl;
              }
            }
          }
        }
      }
    } catch (e) {
      // Skip if we can't access window data
    }

    // Validate we have at least minimal data
    if (!name && !profileUrl) {
      // Retry with exponential backoff if we haven't exceeded max retries
      if (retryCount < maxRetries) {
        const delay = Math.pow(2, retryCount) * 200; // 200ms, 400ms, 800ms
        if (retryCount === 0) {
          // Only log on first detection failure to avoid spam
          console.debug('[Uproot] LinkedIn user detection attempt failed, will retry...', {
            retryCount: retryCount + 1,
            maxRetries,
            delayMs: delay
          });
        }
        // Use synchronous delay for simplicity in this context
        return null; // Caller should handle retry
      }

      // Only warn if all retries exhausted and we still can't detect user
      if (retryCount >= maxRetries) {
        console.warn('[Uproot] Could not detect current LinkedIn user after retries - user may not be logged in or page not fully loaded');
      }
      return null;
    }

    // Return profile with available data
    return {
      profileUrl: profileUrl || window.location.origin + '/in/me/',
      name: name || 'LinkedIn User',
      headline: headline || '',
      currentRole: {
        title: headline || '',
        company: '',
      },
      location: '',
      photoUrl,
    };
  } catch (error) {
    console.error('[Uproot] Error detecting current LinkedIn user:', error instanceof Error ? error.message : String(error), error);
    return null;
  }
}

/**
 * Scrape person profile data
 * Works on: linkedin.com/in/{username}
 * NOTE: This function requires DOM access and cannot run in service worker context
 */
export function scrapePersonProfile(): LinkedInPersonProfile | null {
  // Guard: Only execute in DOM context (not in service worker)
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    console.warn('[Uproot] scrapePersonProfile() cannot be called in service worker context');
    return null;
  }

  try {
    const profileUrl = window.location.href;

    // Name
    const nameElement = document.querySelector('h1.text-heading-xlarge, h1.inline');
    const name = nameElement?.textContent?.trim() || '';

    // Headline
    const headlineElement = document.querySelector('.text-body-medium.break-words, .pv-text-details__left-panel h2');
    const headline = headlineElement?.textContent?.trim() || '';

    // Photo
    const photoElement = document.querySelector('img.pv-top-card-profile-picture__image') as HTMLImageElement;
    const photoUrl = photoElement?.src;

    // Location
    const locationElement = document.querySelector('.text-body-small.inline.t-black--light.break-words, .pv-text-details__left-panel span.text-body-small');
    const location = locationElement?.textContent?.trim() || '';

    // Current role (from experience section)
    const currentRoleElement = document.querySelector('.pvs-list__item--line-separated:first-child, .experience-item:first-child');

    let currentRole = {
      title: '',
      company: '',
      companyUrl: undefined as string | undefined,
      startDate: undefined as string | undefined,
    };

    if (currentRoleElement) {
      const titleEl = currentRoleElement.querySelector('.mr1.hoverable-link-text.t-bold span[aria-hidden="true"]');
      const companyEl = currentRoleElement.querySelector('.t-14.t-normal span[aria-hidden="true"]');
      const companyLinkEl = currentRoleElement.querySelector('a[href*="/company/"]') as HTMLAnchorElement;
      const dateEl = currentRoleElement.querySelector('.t-14.t-normal.t-black--light span[aria-hidden="true"]');

      currentRole = {
        title: titleEl?.textContent?.trim() || '',
        company: companyEl?.textContent?.trim().split('·')[0]?.trim() || '',
        companyUrl: companyLinkEl?.href,
        startDate: dateEl?.textContent?.trim().split('·')[0]?.trim(),
      };
    }

    return {
      profileUrl,
      name,
      headline,
      currentRole,
      location,
      photoUrl,
    };
  } catch (error) {
    console.error('[Uproot] Error scraping person profile:', error instanceof Error ? error.message : String(error), error);
    return null;
  }
}

/**
 * Scrape mutual connections from a LinkedIn profile page
 * Works on: linkedin.com/in/{username}
 *
 * Returns list of mutual connections with their profile URLs and names
 * NOTE: This function requires DOM access and cannot run in service worker context
 */
export function scrapeMutualConnections(): LinkedInPersonProfile[] {
  // Guard: Only execute in DOM context (not in service worker)
  if (typeof document === 'undefined') {
    console.warn('[Uproot] scrapeMutualConnections() cannot be called in service worker context');
    return [];
  }

  const mutuals: LinkedInPersonProfile[] = [];

  try {
    console.log('[Uproot] Scraping mutual connections...');

    // Strategy 1: Check for mutual connections link/button
    // LinkedIn shows "X mutual connections" near the profile header
    const mutualLinkSelectors = [
      'a[href*="/search/results/people/?facetNetwork=%5B%22F%22%5D"]',
      'a[href*="facetNetwork"]',
      'button[aria-label*="mutual"]',
      '.pv-top-card--list-bullet a[href*="mutual"]',
    ];

    let mutualElement: HTMLElement | null = null;
    for (const selector of mutualLinkSelectors) {
      mutualElement = document.querySelector(selector) as HTMLElement;
      if (mutualElement) break;
    }

    if (mutualElement) {
      const mutualText = mutualElement.textContent?.trim() || '';
      const mutualCount = parseInt(mutualText.match(/(\d+)/)?.[1] || '0');

      console.log(`[Uproot] Found ${mutualCount} mutual connections mentioned`);

      // Try to find mutual connection cards on the page
      // LinkedIn sometimes shows mutual connections in a section
      const mutualCards = document.querySelectorAll('[data-view-name="profile-card"], .org-people-profile-card');

      mutualCards.forEach((card) => {
        try {
          const linkEl = card.querySelector('a[href*="/in/"]') as HTMLAnchorElement;
          const nameEl = card.querySelector('.org-people-profile-card__profile-title, [data-anonymize="person-name"]');
          const headlineEl = card.querySelector('.artdeco-entity-lockup__subtitle, .org-people-profile-card__profile-info');
          const photoEl = card.querySelector('img') as HTMLImageElement;

          if (linkEl && nameEl) {
            let profileUrl = linkEl.href;

            // Normalize URL
            if (profileUrl.startsWith('/')) {
              profileUrl = window.location.origin + profileUrl;
            }
            profileUrl = profileUrl.replace(/\/$/, '');

            mutuals.push({
              profileUrl,
              name: nameEl.textContent?.trim() || '',
              headline: headlineEl?.textContent?.trim() || '',
              currentRole: {
                title: headlineEl?.textContent?.trim() || '',
                company: '',
              },
              location: '',
              photoUrl: photoEl?.src,
            });
          }
        } catch (err) {
          console.warn('[Uproot] Error extracting mutual connection card:', err instanceof Error ? err.message : String(err), err);
        }
      });
    }

    console.log(`[Uproot] Scraped ${mutuals.length} mutual connection profiles`);
    return mutuals;
  } catch (error) {
    console.error('[Uproot] Error scraping mutual connections:', error instanceof Error ? error.message : String(error), error);
    return [];
  }
}

/**
 * Minimal user profile for fallback when scraping fails
 */
function getMinimalProfile(): UserProfile {
  return {
    name: 'LinkedIn User',
    title: '',
    workExperience: [],
    education: [],
    projects: [],
    skills: [],
    metadata: {
      totalYearsExperience: 0,
      domains: [],
      seniority: 'entry',
      careerStage: 'professional',
    },
  };
}

/**
 * Check if cached profile is still valid
 */
async function getCachedProfile(): Promise<UserProfile | null> {
  try {
    const result = await chrome.storage.local.get(CURRENT_USER_PROFILE_KEY);
    const cached = result[CURRENT_USER_PROFILE_KEY] as CachedProfile | undefined;

    if (!cached) {
      console.log('[Uproot] No cached profile found');
      return null;
    }

    const now = Date.now();
    if (now >= cached.expiresAt) {
      console.log('[Uproot] Cached profile expired');
      return null;
    }

    console.log('[Uproot] Using cached profile (expires in', Math.round((cached.expiresAt - now) / (1000 * 60 * 60)), 'hours)');
    return cached.profile;
  } catch (error) {
    // Silently handle extension context invalidation during reloads
    if (isContextInvalidatedError(error)) {
      return null;
    }
    console.error('[Uproot] Error reading cached profile:', error instanceof Error ? error.message : String(error), error);
    return null;
  }
}

/**
 * Save profile to cache with TTL
 */
async function cacheProfile(profile: UserProfile): Promise<void> {
  try {
    const now = Date.now();
    const cached: CachedProfile = {
      profile,
      cachedAt: now,
      expiresAt: now + PROFILE_CACHE_TTL,
    };

    await chrome.storage.local.set({ [CURRENT_USER_PROFILE_KEY]: cached });
    console.log('[Uproot] Profile cached successfully (TTL: 7 days)');
  } catch (error) {
    // Silently handle extension context invalidation during reloads
    if (isContextInvalidatedError(error)) {
      return;
    }
    console.error('[Uproot] Error caching profile:', error instanceof Error ? error.message : String(error), error);
  }
}

/**
 * Convert LinkedInPersonProfile to UserProfile format
 */
function convertLinkedInProfileToUserProfile(
  linkedInProfile: LinkedInPersonProfile
): UserProfile {
  // Parse current role into work experience
  const workExperience: WorkExperience[] = [];
  if (linkedInProfile.currentRole && linkedInProfile.currentRole.title) {
    workExperience.push({
      id: 'current-role',
      company: linkedInProfile.currentRole.company || '',
      title: linkedInProfile.currentRole.title,
      startDate: linkedInProfile.currentRole.startDate || new Date().toISOString(),
      endDate: null, // Current role
      location: linkedInProfile.location,
      achievements: [],
      skills: [],
      domains: [],
      responsibilities: [],
    });
  }

  // Calculate metadata
  const metadata: ProfileMetadata = {
    totalYearsExperience: 0, // Would need more data to calculate
    domains: [],
    seniority: inferSeniority(linkedInProfile.currentRole?.title || ''),
    careerStage: 'professional',
  };

  return {
    name: linkedInProfile.name,
    title: linkedInProfile.headline || linkedInProfile.currentRole?.title || '',
    location: linkedInProfile.location,
    avatarUrl: linkedInProfile.photoUrl,
    url: linkedInProfile.profileUrl,
    workExperience,
    education: [],
    projects: [],
    skills: [],
    metadata,
  };
}

/**
 * Infer seniority level from job title
 */
function inferSeniority(title: string): 'entry' | 'mid' | 'senior' | 'staff' | 'principal' {
  const lower = title.toLowerCase();

  if (lower.includes('principal') || lower.includes('distinguished')) return 'principal';
  if (lower.includes('staff') || lower.includes('lead')) return 'staff';
  if (lower.includes('senior') || lower.includes('sr.')) return 'senior';
  if (lower.includes('junior') || lower.includes('jr.') || lower.includes('associate')) return 'entry';

  return 'mid';
}

/**
 * Scrape the current user's own LinkedIn profile
 *
 * This function:
 * 1. Checks cache first (7-day TTL)
 * 2. Navigates to /me to get current user's profile
 * 3. Uses existing profile scraper
 * 4. Converts to UserProfile format
 * 5. Caches result
 * 6. Returns minimal profile on error
 *
 * @returns Promise<UserProfile> - The current user's profile
 */
export async function scrapeOwnProfile(): Promise<UserProfile> {
  try {
    console.log('[Uproot] Fetching current user profile...');

    // Check cache first
    const cachedProfile = await getCachedProfile();
    if (cachedProfile) {
      return cachedProfile;
    }

    console.log('[Uproot] Cache miss, scraping fresh profile...');

    // Get current URL to restore later
    const currentUrl = window.location.href;
    const isOnOwnProfile = currentUrl.includes('/in/') &&
                           (currentUrl.includes('/me') ||
                            document.querySelector('.pv-top-card__edit-profile-button') !== null);

    let linkedInProfile: LinkedInPersonProfile | null = null;

    if (isOnOwnProfile) {
      // Already on own profile, scrape directly
      console.log('[Uproot] Already on own profile, scraping...');
      linkedInProfile = scrapePersonProfile();
    } else {
      // Navigate to /me to get own profile
      console.log('[Uproot] Navigating to /me...');

      // Store original URL
      const returnUrl = window.location.href;

      // Navigate to profile page
      window.location.href = 'https://www.linkedin.com/in/me/';

      // Wait for navigation and page load
      await new Promise<void>((resolve) => {
        const checkReady = setInterval(() => {
          if (window.location.href.includes('/in/') &&
              document.querySelector('.pv-top-card')) {
            clearInterval(checkReady);
            resolve();
          }
        }, 500);

        // Timeout after 10 seconds
        setTimeout(() => {
          clearInterval(checkReady);
          resolve();
        }, 10000);
      });

      // Scrape profile
      linkedInProfile = scrapePersonProfile();

      // Navigate back to original page if different
      if (returnUrl !== 'https://www.linkedin.com/in/me/' &&
          !returnUrl.includes('/in/me')) {
        window.location.href = returnUrl;
      }
    }

    // Convert to UserProfile format
    if (linkedInProfile) {
      console.log('[Uproot] Successfully scraped profile:', linkedInProfile.name);
      const userProfile = convertLinkedInProfileToUserProfile(linkedInProfile);

      // Cache the profile
      await cacheProfile(userProfile);

      return userProfile;
    } else {
      throw new Error('Failed to scrape profile data');
    }
  } catch (error) {
    console.error('[Uproot] Error scraping own profile:', error instanceof Error ? error.message : String(error), error);

    // Return minimal profile on error
    console.log('[Uproot] Returning minimal profile due to error');
    return getMinimalProfile();
  }
}

/**
 * Clear cached profile (useful for testing or manual refresh)
 */
export async function clearCachedProfile(): Promise<void> {
  try {
    await chrome.storage.local.remove(CURRENT_USER_PROFILE_KEY);
    console.log('[Uproot] Cached profile cleared');
  } catch (error) {
    console.error('[Uproot] Error clearing cached profile:', error instanceof Error ? error.message : String(error), error);
  }
}
