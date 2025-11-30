/**
 * Company Scraper - Employee Data Extraction
 * Functions for extracting employee data from DOM
 */

import type { CompanyEmployee } from '@/types/network';
import { querySelectorFallback } from './company-scraper-helpers';

const PROFILE_LINK_SELECTORS = [
  'a.app-aware-link[href*="/in/"]',
  'a[href*="/in/"]',
  'a[data-control-name="view_profile"]',
  '.artdeco-entity-lockup__title a',
];

const NAME_SELECTORS = [
  '.org-people-profile-card__profile-title',
  'h3.artdeco-entity-lockup__title',
  '[data-control-name="people_profile_card"] h3',
  'a[href*="/in/"] .t-16',
];

const HEADLINE_SELECTORS = [
  '.artdeco-entity-lockup__subtitle',
  '.org-people-profile-card__subtitle',
  'a[href*="/in/"] + div .t-14',
  '[data-control-name="people_profile_card"] .t-14',
];

const ROLE_SELECTORS = [
  '.org-people-profile-card__profile-info-list li',
  '.artdeco-entity-lockup__caption',
  '.org-people-profile-card__profile-info .t-12',
];

const CONNECTION_DEGREE_SELECTORS = [
  '.dist-value',
  '.member-distance-badge .dist-value',
  '[data-control-name="people_profile_card"] .dist-value',
  'span[aria-label*="degree"]',
];

const MUTUAL_CONNECTIONS_SELECTORS = [
  '.org-people-profile-card__profile-info-subtitle',
  'span[aria-label*="mutual"]',
  '.artdeco-entity-lockup__badge',
];

/**
 * Extract employee data from a single employee card element
 */
export function extractEmployee(cardElement: Element): CompanyEmployee | null {
  try {
    const linkElement = querySelectorFallback(cardElement, PROFILE_LINK_SELECTORS);
    if (!linkElement) {
      return null;
    }

    const profileUrl = linkElement.getAttribute('href') || '';
    const profileIdMatch = profileUrl.match(/\/in\/([^\/\?]+)/);
    if (!profileIdMatch) {
      return null;
    }
    const profileId = profileIdMatch[1];

    const nameElement = querySelectorFallback(cardElement, NAME_SELECTORS);
    const name = nameElement?.textContent?.trim();

    if (!name) {
      return null;
    }

    const headlineElement = querySelectorFallback(cardElement, HEADLINE_SELECTORS);
    const headline = headlineElement?.textContent?.trim() || undefined;

    const roleElement = querySelectorFallback(cardElement, ROLE_SELECTORS);
    const role = roleElement?.textContent?.trim() || headline || 'Unknown';

    const connectionDegree = extractConnectionDegree(cardElement);
    const mutualConnectionCount = connectionDegree === 2
      ? extractMutualConnectionCount(cardElement)
      : 0;

    const department = inferDepartmentFromHeadline(headline);

    const fullProfileUrl = profileUrl.startsWith('http')
      ? profileUrl
      : `https://www.linkedin.com${profileUrl}`;

    const employee: CompanyEmployee = {
      profileId,
      name,
      headline,
      role,
      department,
      connectionDegree,
      mutualConnections: mutualConnectionCount > 0
        ? Array(mutualConnectionCount).fill('')
        : [],
      profileUrl: fullProfileUrl,
      startDate: undefined,
      endDate: undefined,
    };

    return employee;
  } catch (error) {
    console.error('[CompanyScraper] Error extracting employee:', error);
    return null;
  }
}

/**
 * Extract connection degree using multiple detection methods
 */
function extractConnectionDegree(cardElement: Element): number {
  try {
    const degreeElement = querySelectorFallback(cardElement, CONNECTION_DEGREE_SELECTORS);

    if (degreeElement) {
      const text = degreeElement.textContent?.trim() || '';

      if (text.includes('1st')) return 1;
      if (text.includes('2nd')) return 2;
      if (text.includes('3rd') || text.includes('3+')) return 3;
    }

    const messageButton = cardElement.querySelector('button[aria-label*="Message"]');
    if (messageButton) return 1;

    const connectButton = cardElement.querySelector(
      'button[aria-label*="Connect"], button.artdeco-button--secondary'
    );
    if (connectButton) return 3;

    const ariaElement = cardElement.querySelector('[aria-label*="degree"]');
    if (ariaElement) {
      const ariaLabel = ariaElement.getAttribute('aria-label') || '';
      if (ariaLabel.includes('1st')) return 1;
      if (ariaLabel.includes('2nd')) return 2;
      if (ariaLabel.includes('3rd')) return 3;
    }

    return 3;
  } catch (error) {
    console.error('[CompanyScraper] Error extracting connection degree:', error);
    return 3;
  }
}

/**
 * Extract mutual connection count for 2nd degree connections
 */
function extractMutualConnectionCount(cardElement: Element): number {
  try {
    const mutualElement = querySelectorFallback(cardElement, MUTUAL_CONNECTIONS_SELECTORS);
    if (!mutualElement) return 0;

    const text = mutualElement.textContent?.trim() || '';
    const match = text.match(/(\d+)\s+mutual/i);
    if (match) {
      return parseInt(match[1], 10);
    }

    return 0;
  } catch (error) {
    console.error('[CompanyScraper] Error extracting mutual connections:', error);
    return 0;
  }
}

/**
 * Infer department from headline using keyword matching
 */
function inferDepartmentFromHeadline(headline?: string): string | undefined {
  if (!headline) return undefined;

  const text = headline.toLowerCase();

  const departmentKeywords: Record<string, string[]> = {
    'Engineering': ['engineer', 'developer', 'software', 'sre', 'devops', 'architect'],
    'Product': ['product manager', 'product owner', 'product designer'],
    'Design': ['designer', 'ux', 'ui', 'creative'],
    'Sales': ['sales', 'account executive', 'business development'],
    'Marketing': ['marketing', 'brand', 'growth', 'content'],
    'Finance': ['finance', 'accounting', 'controller', 'treasury'],
    'HR': ['hr', 'recruiter', 'talent', 'people operations'],
    'Operations': ['operations', 'ops', 'supply chain', 'logistics'],
    'Legal': ['lawyer', 'attorney', 'legal', 'counsel'],
    'Executive': ['ceo', 'cto', 'cfo', 'coo', 'vp', 'chief', 'president'],
    'Research': ['researcher', 'scientist', 'phd', 'research'],
    'IT': ['it manager', 'system admin', 'infrastructure', 'security'],
  };

  for (const [department, keywords] of Object.entries(departmentKeywords)) {
    for (const keyword of keywords) {
      if (text.includes(keyword)) {
        return department;
      }
    }
  }

  return undefined;
}
