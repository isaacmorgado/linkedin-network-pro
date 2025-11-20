/**
 * LinkedIn Job Scraper
 * Extracts job data from LinkedIn job posting pages
 */

export interface LinkedInJobData {
  jobTitle: string;
  company: string;
  location: string;
  description: string;
  url: string;
  jobId: string;
  postedDate?: string;
  employmentType?: string;
  seniorityLevel?: string;
}

/**
 * Check if current page is a LinkedIn job posting
 */
export function isJobPage(): boolean {
  const url = window.location.href;
  const pathname = window.location.pathname;

  return (
    url.includes('/jobs/view/') ||
    pathname.startsWith('/jobs/view/') ||
    pathname.includes('/jobs/collections/') ||
    (pathname.startsWith('/jobs/') && (url.includes('currentJobId=') || url.includes('jobId=')))
  );
}

/**
 * Extract job ID from URL
 */
export function getJobId(): string | null {
  const url = window.location.href;

  // Pattern 1: /jobs/view/123456789/
  const viewMatch = url.match(/\/jobs\/view\/(\d+)/);
  if (viewMatch) return viewMatch[1];

  // Pattern 2: currentJobId=123456789
  const currentJobIdMatch = url.match(/currentJobId=(\d+)/);
  if (currentJobIdMatch) return currentJobIdMatch[1];

  // Pattern 3: jobId=123456789
  const jobIdMatch = url.match(/jobId=(\d+)/);
  if (jobIdMatch) return jobIdMatch[1];

  return null;
}

/**
 * Scrape job data from current LinkedIn job page
 */
export function scrapeJobData(): LinkedInJobData | null {
  try {
    console.log('[Uproot] Scraping job data from page...');

    // Check if we're on a job page
    if (!isJobPage()) {
      console.log('[Uproot] Not a job page, skipping scrape');
      return null;
    }

    const jobId = getJobId();
    if (!jobId) {
      console.error('[Uproot] Could not extract job ID');
      return null;
    }

    // Extract job title
    const jobTitle = extractJobTitle();
    if (!jobTitle) {
      console.error('[Uproot] Could not extract job title');
      return null;
    }

    // Extract company name
    const company = extractCompanyName();
    if (!company) {
      console.error('[Uproot] Could not extract company name');
      return null;
    }

    // Extract location
    const location = extractLocation();

    // Extract description
    const description = extractDescription();
    if (!description) {
      console.error('[Uproot] Could not extract job description');
      return null;
    }

    // Extract additional metadata
    const postedDate = extractPostedDate();
    const employmentType = extractEmploymentType();
    const seniorityLevel = extractSeniorityLevel();

    const jobData: LinkedInJobData = {
      jobTitle,
      company,
      location,
      description,
      url: window.location.href,
      jobId,
      postedDate,
      employmentType,
      seniorityLevel,
    };

    console.log('[Uproot] Successfully scraped job data:', jobData);
    return jobData;
  } catch (error) {
    console.error('[Uproot] Error scraping job data:', error);
    return null;
  }
}

/**
 * Extract job title from page
 */
function extractJobTitle(): string {
  // Try multiple selectors (LinkedIn changes DOM structure frequently)
  const selectors = [
    'h1.job-details-jobs-unified-top-card__job-title',
    'h1.t-24',
    'h2.job-details-jobs-unified-top-card__job-title',
    '.job-details-jobs-unified-top-card__job-title',
    'h1[class*="job-title"]',
    '.jobs-unified-top-card__job-title',
    'h1.jobs-unified-top-card__job-title',
    '.job-details-jobs-unified-top-card__job-title h1',
  ];

  for (const selector of selectors) {
    const element = document.querySelector(selector);
    if (element?.textContent?.trim()) {
      console.log(`[Uproot] Found job title using selector: ${selector}`);
      return element.textContent.trim();
    }
  }

  // Fallback: try to find h1 in top card
  const topCard = document.querySelector('.jobs-unified-top-card, .job-details-jobs-unified-top-card');
  if (topCard) {
    const h1 = topCard.querySelector('h1, h2');
    if (h1?.textContent?.trim()) {
      console.log('[Uproot] Found job title using fallback h1/h2 in top card');
      return h1.textContent.trim();
    }
  }

  console.error('[Uproot] No job title found. Selectors tried:', selectors);
  return '';
}

/**
 * Extract company name from page
 */
function extractCompanyName(): string {
  const selectors = [
    '.job-details-jobs-unified-top-card__company-name',
    'a.app-aware-link[href*="/company/"]',
    '.jobs-unified-top-card__company-name',
    'a[data-tracking-control-name="public_jobs_topcard-org-name"]',
    '.topcard__org-name-link',
    '.job-details-jobs-unified-top-card__primary-description a',
    'a.jobs-unified-top-card__company-name',
  ];

  for (const selector of selectors) {
    const element = document.querySelector(selector);
    if (element?.textContent?.trim()) {
      console.log(`[Uproot] Found company name using selector: ${selector}`);
      return element.textContent.trim();
    }
  }

  // Fallback: try to find company link in top card
  const topCard = document.querySelector('.jobs-unified-top-card, .job-details-jobs-unified-top-card');
  if (topCard) {
    const companyLink = topCard.querySelector('a[href*="/company/"]');
    if (companyLink?.textContent?.trim()) {
      console.log('[Uproot] Found company name using fallback company link');
      return companyLink.textContent.trim();
    }
  }

  console.error('[Uproot] No company name found. Selectors tried:', selectors);
  return '';
}

/**
 * Extract location from page
 */
function extractLocation(): string {
  const selectors = [
    '.job-details-jobs-unified-top-card__bullet',
    '.jobs-unified-top-card__bullet',
    'span[class*="location"]',
    '.topcard__flavor--bullet',
  ];

  for (const selector of selectors) {
    const element = document.querySelector(selector);
    if (element?.textContent?.trim()) {
      return element.textContent.trim();
    }
  }

  return '';
}

/**
 * Extract job description from page
 */
function extractDescription(): string {
  const selectors = [
    '.jobs-description__content',
    '.job-details-jobs-unified-description__content',
    '.jobs-box__html-content',
    '#job-details',
    'article.jobs-description',
    '.jobs-description-content__text',
    'div[class*="job-description"]',
    'div[class*="description-content"]',
  ];

  for (const selector of selectors) {
    const element = document.querySelector(selector);
    if (element?.textContent?.trim()) {
      // Clean up the text
      let text = element.textContent.trim();

      // Remove excessive whitespace
      text = text.replace(/\s+/g, ' ');

      // Remove "Show more" / "Show less" buttons
      text = text.replace(/Show (more|less)/gi, '');

      // Only return if we have substantial content (at least 100 chars)
      if (text.length > 100) {
        console.log(`[Uproot] Found description using selector: ${selector} (${text.length} chars)`);
        return text;
      }
    }
  }

  console.error('[Uproot] No description found. Available selectors tried:', selectors);
  return '';
}

/**
 * Extract posted date
 */
function extractPostedDate(): string | undefined {
  const selectors = [
    '.jobs-unified-top-card__posted-date',
    'span[class*="posted"]',
    '.topcard__flavor--metadata',
  ];

  for (const selector of selectors) {
    const element = document.querySelector(selector);
    if (element?.textContent?.trim()) {
      return element.textContent.trim();
    }
  }

  return undefined;
}

/**
 * Extract employment type (Full-time, Part-time, Contract, etc.)
 */
function extractEmploymentType(): string | undefined {
  const selectors = [
    'li.jobs-unified-top-card__job-insight span[class*="employment"]',
    'span[class*="employment-type"]',
  ];

  for (const selector of selectors) {
    const element = document.querySelector(selector);
    if (element?.textContent?.trim()) {
      return element.textContent.trim();
    }
  }

  // Try to find in job insights
  const insights = document.querySelectorAll('.jobs-unified-top-card__job-insight');
  for (const insight of insights) {
    const text = insight.textContent?.trim() || '';
    if (
      text.includes('Full-time') ||
      text.includes('Part-time') ||
      text.includes('Contract') ||
      text.includes('Temporary') ||
      text.includes('Internship')
    ) {
      return text;
    }
  }

  return undefined;
}

/**
 * Extract seniority level
 */
function extractSeniorityLevel(): string | undefined {
  const selectors = [
    'li.jobs-unified-top-card__job-insight span[class*="seniority"]',
    'span[class*="seniority-level"]',
  ];

  for (const selector of selectors) {
    const element = document.querySelector(selector);
    if (element?.textContent?.trim()) {
      return element.textContent.trim();
    }
  }

  // Try to find in job insights
  const insights = document.querySelectorAll('.jobs-unified-top-card__job-insight');
  for (const insight of insights) {
    const text = insight.textContent?.trim() || '';
    if (
      text.includes('Entry level') ||
      text.includes('Mid-Senior level') ||
      text.includes('Director') ||
      text.includes('Executive') ||
      text.includes('Internship')
    ) {
      return text;
    }
  }

  return undefined;
}

/**
 * Wait for job details to load (LinkedIn loads async)
 */
export async function waitForJobDetails(timeout = 5000): Promise<boolean> {
  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    // Check if description is loaded
    const description = document.querySelector('.jobs-description__content, .job-details-jobs-unified-description__content');
    if (description && description.textContent && description.textContent.trim().length > 100) {
      return true;
    }

    // Wait 100ms before checking again
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  return false;
}
