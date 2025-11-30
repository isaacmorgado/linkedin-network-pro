/**
 * Job Scraper
 * Scrapes LinkedIn job posting data
 *
 * LEGAL WARNING: LinkedIn's ToS prohibits scraping. This code is for
 * educational purposes. Use official LinkedIn APIs in production.
 */

import { JobPosting } from '@/types';
import { extractKeywords } from './helpers';

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
