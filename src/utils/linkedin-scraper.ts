/**
 * LinkedIn Page Scraper Utilities
 * Extracts structured data from LinkedIn pages
 */

import type {
  LinkedInJob,
  LinkedInPersonProfile,
  LinkedInCompanyUpdate,
} from '../types/monitoring';
import type { ExperienceLevel, WorkLocationType } from '../types/onboarding';
import type { UserProfile, WorkExperience, ProfileMetadata } from '../types/resume-tailoring';

// ============================================================================
// JOB SCRAPING
// ============================================================================

/**
 * Scrape job listings from a LinkedIn company jobs page
 * Works on: linkedin.com/company/{company}/jobs
 */
export function scrapeCompanyJobs(companyUrl: string): LinkedInJob[] {
  const jobs: LinkedInJob[] = [];

  try {
    // LinkedIn job cards selector
    const jobCards = document.querySelectorAll('.jobs-search__results-list li, .scaffold-layout__list-item');

    jobCards.forEach((card, index) => {
      try {
        const job = extractJobFromCard(card as HTMLElement, companyUrl);
        if (job) {
          jobs.push(job);
        }
      } catch (error) {
        console.error('[Uproot] Error extracting job from card:', error);
      }
    });

    console.log(`[Uproot] Scraped ${jobs.length} jobs from company page`);
  } catch (error) {
    console.error('[Uproot] Error scraping company jobs:', error);
  }

  return jobs;
}

/**
 * Extract job data from a single job card element
 */
function extractJobFromCard(card: HTMLElement, companyUrl: string): LinkedInJob | null {
  try {
    // Job title and URL
    const titleLink = card.querySelector('a.job-card-list__title, a.job-card-container__link') as HTMLAnchorElement;
    if (!titleLink) return null;

    const title = titleLink.textContent?.trim() || '';
    const jobUrl = titleLink.href;
    const jobId = extractJobIdFromUrl(jobUrl);

    // Company name
    const companyElement = card.querySelector('.job-card-container__company-name, .artdeco-entity-lockup__subtitle');
    const company = companyElement?.textContent?.trim() || '';

    // Location
    const locationElement = card.querySelector('.job-card-container__metadata-item, .artdeco-entity-lockup__caption');
    const location = locationElement?.textContent?.trim() || '';

    // Posted date
    const postedElement = card.querySelector('time');
    const postedDate = postedElement?.textContent?.trim() || '';
    const postedTimestamp = estimateTimestamp(postedDate);

    // Easy apply badge
    const isEasyApply = card.querySelector('.job-card-container__apply-method')?.textContent?.includes('Easy Apply') || false;

    // Applicant count
    const applicantElement = card.querySelector('.job-card-container__footer-item');
    const applicantCount = applicantElement?.textContent?.trim();

    // Infer work location type from location text
    const workLocation = inferWorkLocationType(location);

    // Infer experience level from title
    const experienceLevel = inferExperienceLevel(title);

    return {
      id: jobId,
      title,
      company,
      companyUrl,
      location,
      workLocation,
      experienceLevel,
      postedDate,
      postedTimestamp,
      jobUrl,
      isEasyApply,
      applicantCount,
    };
  } catch (error) {
    console.error('[Uproot] Error extracting job from card:', error);
    return null;
  }
}

/**
 * Extract job ID from LinkedIn job URL
 */
function extractJobIdFromUrl(url: string): string {
  const match = url.match(/jobs\/view\/(\d+)/);
  return match ? match[1] : url;
}

/**
 * Convert LinkedIn's relative time strings to estimated timestamps
 */
function estimateTimestamp(postedDate: string): number {
  const now = Date.now();
  const text = postedDate.toLowerCase();

  if (text.includes('just now') || text.includes('now')) {
    return now;
  }

  const minutesMatch = text.match(/(\d+)\s*minute/);
  if (minutesMatch) {
    return now - parseInt(minutesMatch[1]) * 60 * 1000;
  }

  const hoursMatch = text.match(/(\d+)\s*hour/);
  if (hoursMatch) {
    return now - parseInt(hoursMatch[1]) * 60 * 60 * 1000;
  }

  const daysMatch = text.match(/(\d+)\s*day/);
  if (daysMatch) {
    return now - parseInt(daysMatch[1]) * 24 * 60 * 60 * 1000;
  }

  const weeksMatch = text.match(/(\d+)\s*week/);
  if (weeksMatch) {
    return now - parseInt(weeksMatch[1]) * 7 * 24 * 60 * 60 * 1000;
  }

  const monthsMatch = text.match(/(\d+)\s*month/);
  if (monthsMatch) {
    return now - parseInt(monthsMatch[1]) * 30 * 24 * 60 * 60 * 1000;
  }

  // Default to 1 day ago if can't parse
  return now - 24 * 60 * 60 * 1000;
}

/**
 * Infer work location type from location string
 */
function inferWorkLocationType(location: string): WorkLocationType | undefined {
  const lower = location.toLowerCase();

  if (lower.includes('remote')) return 'remote';
  if (lower.includes('hybrid')) return 'hybrid';
  if (lower.includes('on-site') || lower.includes('onsite') || lower.includes('in-office')) return 'onsite';

  return undefined;
}

/**
 * Infer experience level from job title
 */
function inferExperienceLevel(title: string): ExperienceLevel | undefined {
  const lower = title.toLowerCase();

  if (lower.includes('intern')) return 'internship';
  if (lower.includes('entry') || lower.includes('junior') || lower.includes('associate')) return 'entry';
  if (lower.includes('senior') || lower.includes('sr.')) return 'senior';
  if (lower.includes('director') || lower.includes('head of')) return 'director';
  if (lower.includes('vp') || lower.includes('vice president') || lower.includes('chief') || lower.includes('ceo') || lower.includes('cto') || lower.includes('cfo')) return 'executive';

  // Default to mid-level if no indicators
  return 'mid';
}

// ============================================================================
// CURRENT USER DETECTION
// ============================================================================

/**
 * Detect currently logged-in LinkedIn user
 * Works on any LinkedIn page where user is logged in
 * Does NOT require being on the user's profile page
 */
export function getCurrentLinkedInUser(): LinkedInPersonProfile | null {
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
      console.warn('[Uproot] Could not detect current LinkedIn user - user may not be logged in');
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
    console.error('[Uproot] Error detecting current LinkedIn user:', error);
    return null;
  }
}

// ============================================================================
// PERSON PROFILE SCRAPING
// ============================================================================

/**
 * Scrape person profile data
 * Works on: linkedin.com/in/{username}
 */
export function scrapePersonProfile(): LinkedInPersonProfile | null {
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
    console.error('[Uproot] Error scraping person profile:', error);
    return null;
  }
}

// ============================================================================
// COMPANY UPDATE SCRAPING
// ============================================================================

/**
 * Scrape company posts/updates
 * Works on: linkedin.com/company/{company}/posts
 */
export function scrapeCompanyUpdates(companyUrl: string): LinkedInCompanyUpdate[] {
  const updates: LinkedInCompanyUpdate[] = [];

  try {
    // Company post cards
    const postCards = document.querySelectorAll('.feed-shared-update-v2, .occludable-update');

    postCards.forEach((card, index) => {
      try {
        const update = extractUpdateFromCard(card as HTMLElement);
        if (update) {
          updates.push(update);
        }
      } catch (error) {
        console.error('[Uproot] Error extracting update from card:', error);
      }
    });

    console.log(`[Uproot] Scraped ${updates.length} updates from company page`);
  } catch (error) {
    console.error('[Uproot] Error scraping company updates:', error);
  }

  return updates;
}

/**
 * Extract update data from a single post card
 */
function extractUpdateFromCard(card: HTMLElement): LinkedInCompanyUpdate | null {
  try {
    // Post URL
    const linkElement = card.querySelector('a[href*="/feed/update/"]') as HTMLAnchorElement;
    const url = linkElement?.href || '';
    const id = url.match(/urn:li:activity:(\d+)/)?.[1] || `update_${Date.now()}`;

    // Post text preview
    const textElement = card.querySelector('.feed-shared-text__text-view span[dir="ltr"]');
    const preview = textElement?.textContent?.trim().slice(0, 200) || '';

    // Post image
    const imageElement = card.querySelector('img.feed-shared-image__image') as HTMLImageElement;
    const imageUrl = imageElement?.src;

    // Timestamp
    const timeElement = card.querySelector('time') as HTMLTimeElement;
    const timestamp = timeElement?.dateTime ? new Date(timeElement.dateTime).getTime() : Date.now();

    // Infer type from content
    let type: 'post' | 'article' | 'event' | 'hiring' = 'post';
    if (preview.toLowerCase().includes('hiring') || preview.toLowerCase().includes('join our team')) {
      type = 'hiring';
    } else if (card.querySelector('.feed-shared-article')) {
      type = 'article';
    } else if (preview.toLowerCase().includes('event')) {
      type = 'event';
    }

    return {
      id,
      type,
      timestamp,
      url,
      preview,
      imageUrl,
    };
  } catch (error) {
    console.error('[Uproot] Error extracting update from card:', error);
    return null;
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Check if we're on a LinkedIn page
 */
export function isLinkedInPage(): boolean {
  return window.location.hostname.includes('linkedin.com');
}

/**
 * Get current page type
 */
export function getLinkedInPageType(): 'company' | 'profile' | 'job' | 'feed' | 'other' {
  const path = window.location.pathname;

  if (path.includes('/company/')) return 'company';
  if (path.includes('/in/')) return 'profile';
  if (path.includes('/jobs/')) return 'job';
  if (path.includes('/feed/')) return 'feed';

  return 'other';
}

/**
 * Extract company ID from company URL
 */
export function getCompanyIdFromUrl(url: string): string | null {
  const match = url.match(/\/company\/([^/]+)/);
  return match ? match[1] : null;
}

/**
 * Extract profile username from profile URL
 */
export function getProfileUsernameFromUrl(url: string): string | null {
  const match = url.match(/\/in\/([^/]+)/);
  return match ? match[1] : null;
}

// ============================================================================
// CURRENT USER PROFILE SCRAPING
// ============================================================================

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
    console.error('[Uproot] Error reading cached profile:', error);
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
    console.error('[Uproot] Error caching profile:', error);
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
    console.error('[Uproot] Error scraping own profile:', error);

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
    console.error('[Uproot] Error clearing cached profile:', error);
  }
}
