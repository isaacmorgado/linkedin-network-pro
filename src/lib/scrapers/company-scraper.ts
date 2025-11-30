/**
 * Company Scraper - LinkedIn Employee Data Extraction
 *
 * Extracts employee lists from LinkedIn company "People" pages.
 * CRITICAL for company_bridge pathfinding strategy.
 *
 * LEGAL WARNING: LinkedIn's ToS prohibits scraping. This code is for
 * educational purposes. Use official LinkedIn APIs in production.
 */

import type { CompanyEmployee, CompanyMap } from '@/types/network';
import { waitForElement } from './helpers';
import { rateLimiter } from '@/lib/rate-limiter';
import {
  querySelectorFallback,
  querySelectorAllFallback,
  sleep,
  scrollToLoadAllEmployees,
} from './company-scraper-helpers';
import { extractEmployee } from './company-scraper-extraction';

const EMPLOYEE_CARD_SELECTORS = [
  '.org-people-profile-card',
  '.org-people-profile-card__card-spacing',
  '[data-control-name="people_profile_card"]',
  '.artdeco-entity-lockup',
];

const COMPANY_NAME_SELECTORS = [
  '.org-top-card-summary__title',
  '.org-top-card__title',
  'h1[data-test-id="org-name"]',
];

/**
 * Scrape employee data from a LinkedIn company's "People" page
 */
export async function scrapeCompanyEmployees(
  companyUrl: string
): Promise<CompanyEmployee[]> {
  const employees: CompanyEmployee[] = [];

  try {
    console.log('[CompanyScraper] Starting employee scrape:', companyUrl);

    const peopleUrl = companyUrl.endsWith('/')
      ? `${companyUrl}people/`
      : `${companyUrl}/people/`;

    console.log('[CompanyScraper] People URL:', peopleUrl);

    const cardsLoaded = await waitForElement(
      EMPLOYEE_CARD_SELECTORS[0],
      10000
    );

    if (!cardsLoaded) {
      console.warn('[CompanyScraper] Employee cards did not load.');
      return [];
    }

    await scrollToLoadAllEmployees(100);

    const cardElements = querySelectorAllFallback(
      document,
      EMPLOYEE_CARD_SELECTORS
    );

    console.log(`[CompanyScraper] Found ${cardElements.length} employee cards`);

    for (const cardElement of cardElements) {
      const employee = extractEmployee(cardElement);
      if (employee) {
        employees.push(employee);
      }
    }

    console.log(
      `[CompanyScraper] Successfully extracted ${employees.length} employees`
    );

    return employees;
  } catch (error) {
    console.error('[CompanyScraper] Failed to scrape employees:', error);
    return [];
  }
}

/**
 * Scrape company employees with rate limiting
 */
export async function scrapeCompanyEmployeesRateLimited(
  companyUrl: string
): Promise<CompanyEmployee[]> {
  return rateLimiter.enqueue(() => scrapeCompanyEmployees(companyUrl));
}

/**
 * Scrape company employees with retry logic and exponential backoff
 */
export async function scrapeCompanyEmployeesWithRetry(
  companyUrl: string,
  maxRetries: number = 3
): Promise<CompanyEmployee[]> {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(
        `[CompanyScraper] Attempt ${attempt}/${maxRetries} for ${companyUrl}`
      );

      const employees = await scrapeCompanyEmployees(companyUrl);

      if (employees.length > 0 || attempt === maxRetries) {
        return employees;
      }

      console.warn(
        `[CompanyScraper] Got 0 employees on attempt ${attempt}, retrying...`
      );
    } catch (error) {
      lastError = error as Error;
      console.error(
        `[CompanyScraper] Attempt ${attempt}/${maxRetries} failed:`,
        error
      );

      if (attempt < maxRetries) {
        const backoffMs = Math.pow(2, attempt) * 1000;
        console.log(
          `[CompanyScraper] Waiting ${backoffMs}ms before retry...`
        );
        await sleep(backoffMs);
      }
    }
  }

  if (lastError) {
    console.error(
      `[CompanyScraper] All ${maxRetries} attempts failed:`,
      lastError
    );
  }

  return [];
}

/**
 * Scrape company employees with both rate limiting and retry logic
 * RECOMMENDED for production use
 */
export async function scrapeCompanyEmployeesSafe(
  companyUrl: string,
  maxRetries: number = 3
): Promise<CompanyEmployee[]> {
  return rateLimiter.enqueue(() =>
    scrapeCompanyEmployeesWithRetry(companyUrl, maxRetries)
  );
}

/**
 * Build a CompanyMap from scraped employees
 */
export function buildCompanyMap(
  companyUrl: string,
  companyName: string,
  employees: CompanyEmployee[]
): CompanyMap {
  const companyIdMatch = companyUrl.match(/\/company\/([^\/]+)/);
  const companyId = companyIdMatch ? companyIdMatch[1] : companyUrl;

  return {
    companyId,
    companyName,
    employees,
    scrapedAt: new Date().toISOString(),
  };
}

/**
 * Scrape complete company map (employees + metadata)
 */
export async function scrapeCompanyMap(
  companyUrl: string
): Promise<CompanyMap | null> {
  try {
    const companyNameElement = querySelectorFallback(
      document,
      COMPANY_NAME_SELECTORS
    );
    const companyName = companyNameElement?.textContent?.trim() || 'Unknown Company';

    const employees = await scrapeCompanyEmployees(companyUrl);

    if (employees.length === 0) {
      console.warn('[CompanyScraper] No employees found');
      return null;
    }

    return buildCompanyMap(companyUrl, companyName, employees);
  } catch (error) {
    console.error('[CompanyScraper] Failed to scrape company map:', error);
    return null;
  }
}

/**
 * Scrape complete company map with rate limiting
 */
export async function scrapeCompanyMapSafe(
  companyUrl: string
): Promise<CompanyMap | null> {
  return rateLimiter.enqueue(() => scrapeCompanyMap(companyUrl));
}
