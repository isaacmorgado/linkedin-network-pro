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
