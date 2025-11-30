/**
 * Scraper Helper Functions
 * Utility functions for URL parsing and page detection
 */

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
