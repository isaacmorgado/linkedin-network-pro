/**
 * LinkedIn Data Scrapers - Main Module
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

// Re-export all scraper functions
export { scrapeProfileData, scrapeRecentActivity } from './profile-scraper';
export { scrapeJobData, parseManualJobDescription } from './job-scraper';
export { detectPageType, waitForElement, extractKeywords, inferIndustryFromHeadline } from './helpers';
