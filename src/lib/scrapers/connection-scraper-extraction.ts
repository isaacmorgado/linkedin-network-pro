/**
 * Connection Scraper - Extraction Helpers
 * Functions for extracting connection data from DOM elements
 */

import type { NetworkNode } from '@/types';
import { querySelectorAllFallback } from './helpers';
import { networkDB } from '../storage/network-db';

// Fallback selectors for resilience
const NAME_SELECTORS = [
  '.mn-connection-card__name',
  '.artdeco-entity-lockup__title',
  '[data-test-entity-lockup-title]',
  '.reusable-search__result-container a[href*="/in/"]',
  'a[data-control-name="connection_profile"]',
];

const HEADLINE_SELECTORS = [
  '.mn-connection-card__occupation',
  '.artdeco-entity-lockup__subtitle',
  '[data-test-entity-lockup-subtitle]',
  '.entity-result__primary-subtitle',
];

const PROFILE_URL_SELECTORS = [
  'a.mn-connection-card__link[href*="/in/"]',
  'a[data-control-name="connection_profile"][href*="/in/"]',
  'a.artdeco-entity-lockup__title[href*="/in/"]',
  'a[href*="/in/"]',
];

const AVATAR_SELECTORS = [
  '.mn-connection-card__picture img',
  '.artdeco-entity-lockup__image img',
  '.presence-entity__image',
  'img[data-ghost-classes*="person"]',
];

const COMPANY_SELECTORS = [
  '.mn-connection-card__company-name',
  '.entity-result__primary-subtitle t-black',
  '.artdeco-entity-lockup__caption',
];

const TOTAL_COUNT_SELECTORS = [
  '.mn-connections__header h1',
  '.pvs-header__title-text',
  '[data-test-connections-count]',
  'h1.text-heading-xlarge',
];

/**
 * Extract connection data from a single connection card element
 */
export function extractConnection(cardElement: Element): NetworkNode | null {
  try {
    // Profile URL (REQUIRED)
    const profileLinkElement = querySelectorAllFallback(
      cardElement,
      PROFILE_URL_SELECTORS
    )[0] as HTMLAnchorElement | undefined;

    if (!profileLinkElement?.href) {
      return null;
    }

    const profileUrl = profileLinkElement.href;
    const profileIdMatch = profileUrl.match(/\/in\/([^\/\?]+)/);
    const profileId = profileIdMatch ? profileIdMatch[1] : profileUrl;

    // Name (REQUIRED)
    const nameElement = querySelectorAllFallback(cardElement, NAME_SELECTORS)[0];
    const name = nameElement?.textContent?.trim();

    if (!name) {
      return null;
    }

    // Headline (OPTIONAL)
    const headlineElement = querySelectorAllFallback(cardElement, HEADLINE_SELECTORS)[0];
    const headline = headlineElement?.textContent?.trim();

    // Company (OPTIONAL)
    const companyElement = querySelectorAllFallback(cardElement, COMPANY_SELECTORS)[0];
    const companyName = companyElement?.textContent?.trim();

    // Avatar URL (OPTIONAL)
    const avatarElement = querySelectorAllFallback(
      cardElement,
      AVATAR_SELECTORS
    )[0] as HTMLImageElement | undefined;
    const avatarUrl = avatarElement?.src && !avatarElement.src.includes('data:image')
      ? avatarElement.src
      : undefined;

    // Build NetworkNode
    const node: NetworkNode = {
      id: profileId,
      degree: 1,
      profile: {
        id: profileId,
        publicId: profileId,
        name,
        headline,
        avatarUrl,
        scrapedAt: new Date().toISOString(),
        experience: companyName
          ? [{ company: companyName, title: headline || '' }]
          : [],
        skills: [],
        education: [],
        mutualConnections: [],
        recentPosts: [],
        certifications: [],
        userPosts: [],
        engagedPosts: [],
        recentActivity: [],
      },
      matchScore: 0,
      status: 'connected',
    };

    return node;
  } catch (error) {
    console.error('[ConnectionScraper] Failed to extract connection:', error);
    return null;
  }
}

/**
 * Check if connection already exists in batch or database
 */
export async function connectionExists(
  profileId: string,
  existingBatch: NetworkNode[]
): Promise<boolean> {
  if (existingBatch.some((node) => node.id === profileId)) {
    return true;
  }

  try {
    const existing = await networkDB.nodes.get(profileId);
    return !!existing;
  } catch (error) {
    console.error('[ConnectionScraper] Error checking if connection exists:', error);
    return false;
  }
}

/**
 * Extract total connection count from page header
 */
export function getTotalConnectionCount(): number | null {
  try {
    const headerElement = querySelectorAllFallback(
      document,
      TOTAL_COUNT_SELECTORS
    )[0];

    if (!headerElement) {
      return null;
    }

    const text = headerElement.textContent?.trim() || '';
    const match = text.match(/(\d+[\d,]*)/);

    if (match) {
      const count = parseInt(match[1].replace(/,/g, ''), 10);
      console.log(`[ConnectionScraper] Total connections: ${count}`);
      return count;
    }

    return null;
  } catch (error) {
    console.error('[ConnectionScraper] Error extracting connection count:', error);
    return null;
  }
}
