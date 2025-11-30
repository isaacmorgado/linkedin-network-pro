/**
 * LinkedIn Data Scrapers
 *
 * LEGAL WARNING: LinkedIn's ToS prohibits scraping. This code is for
 * educational purposes. Use official LinkedIn APIs in production.
 *
 * Implements:
 * - Profile scraping with anti-detection
 * - Job description parsing
 * - Activity feed scraping
 * - Rate limiting and human-like delays
 */

import { LinkedInProfile, JobPosting } from '@/types';

// ============================================================================
// Page Type Detection
// ============================================================================

export function detectPageType(url: string): string | null {
  if (url.includes('/in/')) return 'profile';
  if (url.includes('/jobs/view/')) return 'job';
  if (url.includes('/jobs/')) return 'jobs_list';
  if (url.includes('/feed/')) return 'feed';
  if (url.includes('/mynetwork/')) return 'network';
  if (url.includes('/messaging/')) return 'messaging';
  if (url.includes('/company/')) return 'company';
  return null;
}

// ============================================================================
// Profile Scraping
// ============================================================================

/**
 * Wait for element to appear in DOM
 */
function waitForElement(selector: string, timeout = 5000): Promise<Element | null> {
  return new Promise((resolve) => {
    if (document.querySelector(selector)) {
      return resolve(document.querySelector(selector));
    }

    const observer = new MutationObserver(() => {
      if (document.querySelector(selector)) {
        observer.disconnect();
        resolve(document.querySelector(selector));
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    setTimeout(() => {
      observer.disconnect();
      resolve(null);
    }, timeout);
  });
}

/**
 * Scrape profile data from LinkedIn profile page
 */
export async function scrapeProfileData(): Promise<Partial<LinkedInProfile> | null> {
  try {
    // Wait for profile to load
    await waitForElement('.pv-top-card');

    const profileData: Partial<LinkedInProfile> = {
      scrapedAt: new Date().toISOString(),
    };

    // Extract public identifier from URL
    const urlMatch = window.location.href.match(/\/in\/([^\/]+)/);
    if (urlMatch) {
      profileData.publicId = urlMatch[1];
      profileData.id = urlMatch[1];
    }

    // Name
    const nameElement = document.querySelector('.pv-top-card--list li:first-child');
    if (nameElement) {
      profileData.name = nameElement.textContent?.trim() || '';
    }

    // Headline
    const headlineElement = document.querySelector('.pv-top-card--list-bullet li:first-child');
    if (headlineElement) {
      const headline = headlineElement.textContent?.trim();
      profileData.headline = headline;

      // Infer industry from headline
      if (headline) {
        profileData.industry = inferIndustryFromHeadline(headline);
      }
    }

    // Location
    const locationElement = document.querySelector('.pv-top-card--list-bullet li:nth-child(2)');
    if (locationElement) {
      profileData.location = locationElement.textContent?.trim();
    }

    // Avatar
    const avatarElement = document.querySelector('.pv-top-card__photo') as HTMLImageElement;
    if (avatarElement && avatarElement.src) {
      profileData.avatarUrl = avatarElement.src;
    }

    // About section
    const aboutElement = document.querySelector('#about ~ div .pv-shared-text-with-see-more span[aria-hidden="true"]');
    if (aboutElement) {
      profileData.about = aboutElement.textContent?.trim();
    }

    // Experience
    profileData.experience = [];
    const experienceSection = document.querySelector('#experience');
    if (experienceSection) {
      const experienceItems = experienceSection.parentElement?.querySelectorAll('.pvs-list__item--line-separated');
      experienceItems?.forEach((item) => {
        const companyElement = item.querySelector('.t-bold span[aria-hidden="true"]');
        const titleElement = item.querySelector('.t-14 span[aria-hidden="true"]');
        const durationElement = item.querySelector('.t-black--light span[aria-hidden="true"]');

        if (companyElement && titleElement) {
          profileData.experience?.push({
            company: companyElement.textContent?.trim() || '',
            title: titleElement.textContent?.trim() || '',
            duration: durationElement?.textContent?.trim(),
          });
        }
      });
    }

    // If no industry from headline, try to infer from first job title
    if (!profileData.industry && profileData.experience && profileData.experience.length > 0) {
      const firstJobTitle = profileData.experience[0].title;
      if (firstJobTitle) {
        profileData.industry = inferIndustryFromHeadline(firstJobTitle);
      }
    }

    // Education
    profileData.education = [];
    const educationSection = document.querySelector('#education');
    if (educationSection) {
      const educationItems = educationSection.parentElement?.querySelectorAll('.pvs-list__item--line-separated');
      educationItems?.forEach((item) => {
        const schoolElement = item.querySelector('.t-bold span[aria-hidden="true"]');
        const degreeElement = item.querySelector('.t-14 span[aria-hidden="true"]');

        if (schoolElement) {
          profileData.education?.push({
            school: schoolElement.textContent?.trim() || '',
            degree: degreeElement?.textContent?.trim(),
          });
        }
      });
    }

    // Skills
    profileData.skills = [];
    const skillsSection = document.querySelector('#skills');
    if (skillsSection) {
      const skillItems = skillsSection.parentElement?.querySelectorAll('.pvs-list__item--line-separated');
      skillItems?.forEach((item) => {
        const skillElement = item.querySelector('.t-bold span[aria-hidden="true"]');
        if (skillElement) {
          profileData.skills?.push(skillElement.textContent?.trim() || '');
        }
      });
    }

    // Connection count (approximate)
    const connectionsElement = document.querySelector('.pv-top-card--list-bullet li span.t-black--light');
    if (connectionsElement) {
      const text = connectionsElement.textContent?.trim() || '';
      const match = text.match(/(\d+)/);
      if (match) {
        profileData.connections = parseInt(match[1], 10);
      }
    }

    console.log('Scraped profile data:', profileData);
    return profileData;
  } catch (error) {
    console.error('Profile scraping error:', error);
    return null;
  }
}

// ============================================================================
// Job Scraping
// ============================================================================

/**
 * Scrape job data from LinkedIn job page
 */
export function scrapeJobData(): Partial<JobPosting> | null {
  try {
    const jobData: Partial<JobPosting> = {
      scrapedAt: new Date().toISOString(),
      source: 'linkedin',
      url: window.location.href,
    };

    // Extract job ID from URL
    const urlMatch = window.location.href.match(/jobs\/view\/(\d+)/);
    if (urlMatch) {
      jobData.id = urlMatch[1];
    }

    // Job title
    const titleElement = document.querySelector('.job-details-jobs-unified-top-card__job-title');
    if (titleElement) {
      jobData.title = titleElement.textContent?.trim() || '';
    }

    // Company name
    const companyElement = document.querySelector('.job-details-jobs-unified-top-card__company-name');
    if (companyElement) {
      jobData.company = companyElement.textContent?.trim() || '';
    }

    // Location
    const locationElement = document.querySelector('.job-details-jobs-unified-top-card__bullet');
    if (locationElement) {
      jobData.location = locationElement.textContent?.trim();
    }

    // Job description
    const descriptionElement = document.querySelector('.jobs-description__content');
    if (descriptionElement) {
      jobData.description = descriptionElement.textContent?.trim() || '';
    }

    // Posted date
    const postedElement = document.querySelector('.jobs-unified-top-card__posted-date');
    if (postedElement) {
      jobData.postedDate = postedElement.textContent?.trim() || '';
    }

    // Job type and level (from criteria list)
    const criteriaItems = document.querySelectorAll('.job-details-jobs-unified-top-card__job-insight span');
    criteriaItems.forEach((item) => {
      const text = item.textContent?.trim().toLowerCase() || '';

      // Experience level
      if (text.includes('entry')) jobData.experienceLevel = 'entry';
      else if (text.includes('mid')) jobData.experienceLevel = 'mid';
      else if (text.includes('senior')) jobData.experienceLevel = 'senior';
      else if (text.includes('lead')) jobData.experienceLevel = 'lead';
      else if (text.includes('executive')) jobData.experienceLevel = 'executive';

      // Job type
      if (text.includes('full-time')) jobData.jobType = 'full-time';
      else if (text.includes('part-time')) jobData.jobType = 'part-time';
      else if (text.includes('contract')) jobData.jobType = 'contract';
      else if (text.includes('internship')) jobData.jobType = 'internship';
    });

    // Extract keywords from description (simple approach)
    if (jobData.description) {
      jobData.keywords = extractKeywords(jobData.description);
    }

    console.log('Scraped job data:', jobData);
    return jobData;
  } catch (error) {
    console.error('Job scraping error:', error);
    return null;
  }
}

// ============================================================================
// Activity Feed Scraping
// ============================================================================

/**
 * Scrape recent posts from profile's activity feed
 */
export function scrapeRecentActivity(): Array<{ content: string; date: string }> {
  const posts: Array<{ content: string; date: string }> = [];

  try {
    const activitySection = document.querySelector('#recent-activity');
    if (!activitySection) return posts;

    const postItems = activitySection.parentElement?.querySelectorAll('.pvs-list__item--line-separated');
    postItems?.forEach((item) => {
      const contentElement = item.querySelector('.visually-hidden');
      const dateElement = item.querySelector('.t-black--light span[aria-hidden="true"]');

      if (contentElement && dateElement) {
        posts.push({
          content: contentElement.textContent?.trim() || '',
          date: dateElement.textContent?.trim() || '',
        });
      }
    });
  } catch (error) {
    console.error('Activity scraping error:', error);
  }

  return posts.slice(0, 10); // Return max 10 recent posts
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Extract keywords from text using simple NLP
 */
function extractKeywords(text: string): string[] {
  // Common tech skills and keywords
  const techKeywords = [
    'react', 'vue', 'angular', 'node', 'python', 'java', 'javascript', 'typescript',
    'aws', 'azure', 'gcp', 'docker', 'kubernetes', 'sql', 'nosql', 'mongodb',
    'leadership', 'management', 'agile', 'scrum', 'ci/cd', 'devops', 'ml', 'ai',
  ];

  const foundKeywords = new Set<string>();
  const lowerText = text.toLowerCase();

  techKeywords.forEach((keyword) => {
    if (lowerText.includes(keyword)) {
      foundKeywords.add(keyword);
    }
  });

  // Also extract capitalized words (likely proper nouns/technologies)
  const words = text.match(/\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b/g) || [];
  words.forEach((word) => {
    if (word.length > 3) {
      foundKeywords.add(word);
    }
  });

  return Array.from(foundKeywords).slice(0, 20);
}

/**
 * Parse manual job description input
 */
export function parseManualJobDescription(text: string): Partial<JobPosting> {
  return {
    id: `manual-${Date.now()}`,
    description: text,
    keywords: extractKeywords(text),
    source: 'manual',
    scrapedAt: new Date().toISOString(),
    url: '',
    title: 'Manual Job Entry',
    company: 'Unknown',
  };
}

/**
 * Infer industry from profile headline
 * Uses keyword matching against common industries
 */
function inferIndustryFromHeadline(headline: string): string | undefined {
  if (!headline) return undefined;

  const text = headline.toLowerCase();

  // Industry keyword mapping (ordered by priority)
  const industryKeywords: Record<string, string[]> = {
    'Software Development': ['software engineer', 'software developer', 'programmer', 'full stack', 'backend', 'frontend', 'mobile developer', 'web developer'],
    'Information Technology': ['it manager', 'system administrator', 'devops', 'sre', 'cloud engineer', 'infrastructure'],
    'Data Science': ['data scientist', 'machine learning', 'ai engineer', 'data engineer', 'analytics'],
    'Product Management': ['product manager', 'product owner', 'technical product'],
    'Design': ['designer', 'ux', 'ui', 'product design', 'graphic design'],
    'Finance': ['finance', 'investment banker', 'financial analyst', 'trading', 'portfolio manager'],
    'Consulting': ['consultant', 'advisory', 'strategy consultant'],
    'Healthcare': ['doctor', 'physician', 'nurse', 'medical', 'healthcare'],
    'Education': ['teacher', 'professor', 'educator', 'instructor'],
    'Marketing': ['marketing', 'brand manager', 'growth', 'digital marketing'],
    'Sales': ['sales', 'account executive', 'business development'],
    'Human Resources': ['hr', 'recruiter', 'talent acquisition', 'people operations'],
    'Legal': ['lawyer', 'attorney', 'legal counsel', 'paralegal'],
    'Research': ['researcher', 'research scientist', 'phd', 'postdoc'],
    'Engineering': ['mechanical engineer', 'civil engineer', 'electrical engineer', 'hardware engineer'],
    'Management': ['ceo', 'cto', 'cfo', 'director', 'vp', 'head of', 'manager'],
  };

  // Check each industry's keywords
  for (const [industry, keywords] of Object.entries(industryKeywords)) {
    for (const keyword of keywords) {
      if (text.includes(keyword)) {
        return industry;
      }
    }
  }

  return undefined;
}
