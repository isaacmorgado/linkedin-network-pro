/**
 * Job Scraper
 * Extracts job listing data from LinkedIn company pages
 */

import type { LinkedInJob } from '../../types/monitoring';
import type { ExperienceLevel, WorkLocationType } from '../../types/onboarding';

/**
 * Scrape job listings from a LinkedIn company jobs page
 * Works on: linkedin.com/company/{company}/jobs
 * NOTE: This function requires DOM access and cannot run in service worker context
 */
export function scrapeCompanyJobs(companyUrl: string): LinkedInJob[] {
  // Guard: Only execute in DOM context (not in service worker)
  if (typeof document === 'undefined') {
    console.warn('[Uproot] scrapeCompanyJobs() cannot be called in service worker context');
    return [];
  }

  const jobs: LinkedInJob[] = [];

  try {
    // LinkedIn job cards selector
    const jobCards = document.querySelectorAll('.jobs-search__results-list li, .scaffold-layout__list-item');

    jobCards.forEach((card, _index) => {
      try {
        const job = extractJobFromCard(card as HTMLElement, companyUrl);
        if (job) {
          jobs.push(job);
        }
      } catch (error) {
        console.error('[Uproot] Error extracting job from card:', error instanceof Error ? error.message : String(error), error);
      }
    });

    console.log(`[Uproot] Scraped ${jobs.length} jobs from company page`);
  } catch (error) {
    console.error('[Uproot] Error scraping company jobs:', error instanceof Error ? error.message : String(error), error);
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
    console.error('[Uproot] Error extracting job from card:', error instanceof Error ? error.message : String(error), error);
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
