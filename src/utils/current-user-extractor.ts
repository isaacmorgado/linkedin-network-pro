/**
 * Current User Extractor for LinkedIn
 *
 * Extracts current logged-in user information from LinkedIn DOM
 * without requiring navigation or API calls.
 *
 * APPROACH:
 * 1. Check global navigation bar (.global-nav) for user profile elements
 * 2. Parse meta tags and JSON-LD structured data
 * 3. Check localStorage/sessionStorage for session data
 * 4. Handle both old and new LinkedIn UI versions
 *
 * Returns minimal UserProfile or null if not found.
 */

import type { LinkedInPersonProfile } from '../types/monitoring';

// ============================================================================
// MAIN EXTRACTION FUNCTION
// ============================================================================

/**
 * Extract current user info from LinkedIn DOM
 * Works across all LinkedIn pages without navigation
 */
export function extractCurrentUserFromDOM(): Partial<LinkedInPersonProfile> | null {
  try {
    // Strategy 1: Global Navigation Bar (most reliable)
    const navBarUser = extractFromGlobalNav();
    if (navBarUser && navBarUser.name) {
      console.log('[Uproot] Current user extracted from global nav:', navBarUser);
      return navBarUser;
    }

    // Strategy 2: Profile Dropdown Menu
    const dropdownUser = extractFromProfileDropdown();
    if (dropdownUser && dropdownUser.name) {
      console.log('[Uproot] Current user extracted from dropdown:', dropdownUser);
      return dropdownUser;
    }

    // Strategy 3: Meta Tags
    const metaUser = extractFromMetaTags();
    if (metaUser && metaUser.name) {
      console.log('[Uproot] Current user extracted from meta tags:', metaUser);
      return metaUser;
    }

    // Strategy 4: JSON-LD Structured Data
    const jsonLdUser = extractFromJSONLD();
    if (jsonLdUser && jsonLdUser.name) {
      console.log('[Uproot] Current user extracted from JSON-LD:', jsonLdUser);
      return jsonLdUser;
    }

    // Strategy 5: localStorage/sessionStorage
    const storageUser = extractFromStorage();
    if (storageUser && storageUser.name) {
      console.log('[Uproot] Current user extracted from storage:', storageUser);
      return storageUser;
    }

    console.warn('[Uproot] Could not extract current user from any source');
    return null;
  } catch (error) {
    console.error('[Uproot] Error extracting current user:', error instanceof Error ? error.message : String(error), error);
    return null;
  }
}

// ============================================================================
// STRATEGY 1: GLOBAL NAVIGATION BAR
// ============================================================================

/**
 * Extract user info from global navigation bar
 * Selectors for both new and old LinkedIn UI
 */
function extractFromGlobalNav(): Partial<LinkedInPersonProfile> | null {
  try {
    const globalNav = document.querySelector('.global-nav');
    if (!globalNav) {
      return null;
    }

    // NEW UI: Look for "Me" button with profile photo
    // Selector: .global-nav__me-photo, .global-nav__me-photo-img
    const mePhoto = globalNav.querySelector('.global-nav__me-photo img, .global-nav__me img, img[alt*="photo" i]') as HTMLImageElement;
    const meButton = globalNav.querySelector('.global-nav__me, button[id*="me-button"]');

    // Extract photo URL
    const photoUrl = mePhoto?.src || undefined;

    // Extract name from alt text or aria-label
    let name = mePhoto?.alt?.replace(/photo of /i, '').replace(/\'s profile picture/i, '').trim() || '';
    if (!name) {
      name = meButton?.getAttribute('aria-label')?.replace(/view /i, '').replace(/\'s profile/i, '').trim() || '';
    }

    // Extract profile URL from link
    let profileUrl: string | undefined;
    const profileLink = globalNav.querySelector('a[href*="/in/"]') as HTMLAnchorElement;
    if (profileLink) {
      profileUrl = profileLink.href;
    }

    // Extract headline from dropdown or tooltip
    let headline: string | undefined;
    const headlineElement = globalNav.querySelector('.global-nav__me-content .t-black--light, .nav-item__profile-member-headline');
    if (headlineElement) {
      headline = headlineElement.textContent?.trim() || undefined;
    }

    if (name) {
      return {
        name,
        photoUrl,
        profileUrl,
        headline,
      };
    }

    // OLD UI: Look for top card navigation
    const navCard = globalNav.querySelector('.nav-item__profile-member-photo, .nav-item__icon img') as HTMLImageElement;
    const navName = globalNav.querySelector('.nav-item__profile-member-name, .t-bold.t-black')?.textContent?.trim();

    if (navCard || navName) {
      return {
        name: navName || navCard?.alt?.replace(/photo of /i, '').trim() || '',
        photoUrl: navCard?.src || undefined,
        profileUrl: globalNav.querySelector('a[href*="/in/"]')?.getAttribute('href') || undefined,
      };
    }

    return null;
  } catch (error) {
    console.error('[Uproot] Error extracting from global nav:', error instanceof Error ? error.message : String(error), error);
    return null;
  }
}

// ============================================================================
// STRATEGY 2: PROFILE DROPDOWN MENU
// ============================================================================

/**
 * Extract user info from profile dropdown menu
 * Triggered by clicking the "Me" button
 */
function extractFromProfileDropdown(): Partial<LinkedInPersonProfile> | null {
  try {
    // Look for expanded dropdown (may not always be visible)
    const dropdown = document.querySelector('.artdeco-dropdown__content, [data-control-name="identity_profile_card"]');
    if (!dropdown) {
      return null;
    }

    // Extract name from card
    const nameElement = dropdown.querySelector('.artdeco-entity-lockup__title, .text-heading-xlarge');
    const name = nameElement?.textContent?.trim();

    // Extract headline
    const headlineElement = dropdown.querySelector('.artdeco-entity-lockup__subtitle, .text-body-small');
    const headline = headlineElement?.textContent?.trim();

    // Extract photo
    const photoElement = dropdown.querySelector('img.artdeco-entity-lockup__image, img.profile-photo') as HTMLImageElement;
    const photoUrl = photoElement?.src || undefined;

    // Extract profile URL
    const profileLink = dropdown.querySelector('a[href*="/in/"]') as HTMLAnchorElement;
    const profileUrl = profileLink?.href || undefined;

    if (name) {
      return {
        name,
        headline,
        photoUrl,
        profileUrl,
      };
    }

    return null;
  } catch (error) {
    console.error('[Uproot] Error extracting from dropdown:', error instanceof Error ? error.message : String(error), error);
    return null;
  }
}

// ============================================================================
// STRATEGY 3: META TAGS
// ============================================================================

/**
 * Extract user info from meta tags
 * LinkedIn includes profile data in meta tags for SEO
 */
function extractFromMetaTags(): Partial<LinkedInPersonProfile> | null {
  try {
    // LinkedIn sometimes includes current user in meta tags
    const metaTitle = document.querySelector('meta[property="og:title"]')?.getAttribute('content');
    const metaDescription = document.querySelector('meta[property="og:description"]')?.getAttribute('content');
    const metaImage = document.querySelector('meta[property="og:image"]')?.getAttribute('content');
    const metaUrl = document.querySelector('meta[property="og:url"]')?.getAttribute('content');

    // Only extract if we're on a profile page that matches current user
    // Check if URL contains /in/
    if (metaUrl && metaUrl.includes('/in/') && window.location.pathname.includes('/in/')) {
      // Compare with current page URL to ensure it's the user's own profile
      const currentProfileId = window.location.pathname.match(/\/in\/([^/]+)/)?.[1];
      const metaProfileId = metaUrl.match(/\/in\/([^/]+)/)?.[1];

      if (currentProfileId === metaProfileId) {
        // This is the user's own profile
        return {
          name: metaTitle || '',
          headline: metaDescription || undefined,
          photoUrl: metaImage || undefined,
          profileUrl: metaUrl,
        };
      }
    }

    return null;
  } catch (error) {
    console.error('[Uproot] Error extracting from meta tags:', error instanceof Error ? error.message : String(error), error);
    return null;
  }
}

// ============================================================================
// STRATEGY 4: JSON-LD STRUCTURED DATA
// ============================================================================

/**
 * Extract user info from JSON-LD structured data
 * LinkedIn includes Person schema data
 */
function extractFromJSONLD(): Partial<LinkedInPersonProfile> | null {
  try {
    const scripts = document.querySelectorAll('script[type="application/ld+json"]');

    for (const script of scripts) {
      try {
        const data = JSON.parse(script.textContent || '{}');

        // Look for Person schema
        if (data['@type'] === 'Person' || data['@type'] === 'ProfilePage') {
          const person = data['@type'] === 'ProfilePage' ? data.mainEntity : data;

          if (person && person.name) {
            return {
              name: person.name,
              headline: person.jobTitle || person.description || undefined,
              photoUrl: person.image?.url || person.image || undefined,
              profileUrl: person.url || person['@id'] || undefined,
            };
          }
        }
      } catch (parseError) {
        // Skip invalid JSON
        continue;
      }
    }

    return null;
  } catch (error) {
    console.error('[Uproot] Error extracting from JSON-LD:', error instanceof Error ? error.message : String(error), error);
    return null;
  }
}

// ============================================================================
// STRATEGY 5: LOCALSTORAGE / SESSIONSTORAGE
// ============================================================================

/**
 * Extract user info from browser storage
 * LinkedIn stores session data in localStorage/sessionStorage
 */
function extractFromStorage(): Partial<LinkedInPersonProfile> | null {
  try {
    // Try localStorage first
    const storageKeys = [
      'li.me',                    // LinkedIn session key
      'li_at',                    // LinkedIn auth token (contains user ID)
      'voyager.identity',         // LinkedIn Voyager API identity
      'currentUser',              // Generic current user key
      'JSESSIONID',               // Session ID
    ];

    for (const key of storageKeys) {
      try {
        const localValue = localStorage.getItem(key);
        const sessionValue = sessionStorage.getItem(key);

        const value = localValue || sessionValue;
        if (!value) continue;

        // Try to parse as JSON
        try {
          const parsed = JSON.parse(value);

          // Look for user profile data in parsed object
          if (parsed.miniProfile || parsed.profile || parsed.user) {
            const profile = parsed.miniProfile || parsed.profile || parsed.user;

            return {
              name: profile.firstName && profile.lastName
                ? `${profile.firstName} ${profile.lastName}`
                : profile.name || '',
              headline: profile.headline || profile.occupation || undefined,
              photoUrl: profile.picture || profile.pictureUrl || profile.profilePicture?.displayImage || undefined,
              profileUrl: profile.publicIdentifier
                ? `https://www.linkedin.com/in/${profile.publicIdentifier}/`
                : profile.url || undefined,
            };
          }
        } catch {
          // Not JSON, skip
          continue;
        }
      } catch (storageError) {
        // Skip if storage access fails
        continue;
      }
    }

    return null;
  } catch (error) {
    console.error('[Uproot] Error extracting from storage:', error instanceof Error ? error.message : String(error), error);
    return null;
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Check if current user data is available
 */
export function isUserLoggedIn(): boolean {
  const user = extractCurrentUserFromDOM();
  return user !== null && user.name !== undefined && user.name.length > 0;
}

/**
 * Extract just the profile URL
 */
export function getCurrentUserProfileUrl(): string | null {
  try {
    // First try global nav
    const globalNav = document.querySelector('.global-nav');
    const profileLink = globalNav?.querySelector('a[href*="/in/"]') as HTMLAnchorElement;
    if (profileLink) {
      return profileLink.href;
    }

    // Fallback: extract from full user data
    const user = extractCurrentUserFromDOM();
    return user?.profileUrl || null;
  } catch (error) {
    console.error('[Uproot] Error getting profile URL:', error instanceof Error ? error.message : String(error), error);
    return null;
  }
}

/**
 * Extract just the profile photo URL
 */
export function getCurrentUserPhotoUrl(): string | null {
  try {
    const user = extractCurrentUserFromDOM();
    return user?.photoUrl || null;
  } catch (error) {
    console.error('[Uproot] Error getting photo URL:', error instanceof Error ? error.message : String(error), error);
    return null;
  }
}

/**
 * Extract public identifier from profile URL
 * Example: "https://www.linkedin.com/in/john-doe/" -> "john-doe"
 */
export function getCurrentUserPublicId(): string | null {
  try {
    const profileUrl = getCurrentUserProfileUrl();
    if (!profileUrl) return null;

    const match = profileUrl.match(/\/in\/([^/]+)/);
    return match ? match[1] : null;
  } catch (error) {
    console.error('[Uproot] Error getting public ID:', error instanceof Error ? error.message : String(error), error);
    return null;
  }
}

// ============================================================================
// DOM SELECTORS REFERENCE
// ============================================================================

/**
 * Complete list of DOM selectors used across LinkedIn UI versions
 *
 * GLOBAL NAVIGATION (New UI - 2023+):
 * - .global-nav                           - Main navigation container
 * - .global-nav__me                       - "Me" button
 * - .global-nav__me-photo                 - Profile photo container
 * - .global-nav__me-photo-img             - Profile photo image
 * - .global-nav__me img                   - Profile photo (alternative)
 *
 * GLOBAL NAVIGATION (Old UI):
 * - .nav-item__profile-member-photo       - Profile photo in nav
 * - .nav-item__profile-member-name        - Name in nav
 * - .nav-item__icon img                   - Profile icon
 *
 * PROFILE DROPDOWN:
 * - .artdeco-dropdown__content            - Dropdown container
 * - [data-control-name="identity_profile_card"] - Profile card
 * - .artdeco-entity-lockup__title         - Name in card
 * - .artdeco-entity-lockup__subtitle      - Headline in card
 * - .artdeco-entity-lockup__image         - Photo in card
 *
 * META TAGS:
 * - meta[property="og:title"]             - Profile name
 * - meta[property="og:description"]       - Profile headline
 * - meta[property="og:image"]             - Profile photo
 * - meta[property="og:url"]               - Profile URL
 *
 * JSON-LD:
 * - script[type="application/ld+json"]    - Structured data
 *   - @type: "Person" or "ProfilePage"
 *   - name, jobTitle, image, url
 *
 * STORAGE KEYS:
 * - localStorage.getItem('li.me')         - LinkedIn session
 * - localStorage.getItem('li_at')         - Auth token
 * - localStorage.getItem('voyager.identity') - Voyager API identity
 *
 * PROFILE PAGE (Own Profile):
 * - .pv-top-card                          - Profile top card
 * - .pv-top-card-profile-picture__image   - Profile photo
 * - h1.text-heading-xlarge                - Name
 * - .text-body-medium                     - Headline
 */
