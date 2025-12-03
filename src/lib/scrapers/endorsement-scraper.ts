/**
 * Endorsement Scraper - Extract WHO endorsed a skill
 *
 * Clicks on skill endorsement counts to open modals and scrapes endorser profile IDs.
 * Used for engagement_bridge pathfinding strategy.
 *
 * LEGAL WARNING: LinkedIn's ToS prohibits scraping. This code is for
 * educational purposes. Use official LinkedIn APIs in production.
 */

import { waitForElement } from './helpers';

/**
 * Sleep helper for human-like delays
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Extract profile ID from LinkedIn URL
 */
function extractProfileId(href: string | null): string | null {
  if (!href) return null;
  const match = href.match(/\/in\/([^\/\?]+)/);
  return match ? match[1] : null;
}

/**
 * Scrape endorsers for a specific skill by opening the endorsement modal
 *
 * @param skillElement - The DOM element containing the skill
 * @param skillName - Name of the skill (for logging)
 * @returns Array of profile IDs who endorsed this skill
 */
export async function scrapeSkillEndorsers(
  skillElement: Element,
  skillName: string
): Promise<string[]> {
  const endorsers: string[] = [];

  try {
    console.log(`[EndorsementScraper] Scraping endorsers for skill: ${skillName}`);

    // ========================================================================
    // STEP 1: Find and click the endorsement button
    // ========================================================================

    // Try multiple selectors for the endorsement button/link
    const endorsementButton =
      skillElement.querySelector('button[aria-label*="endorsement"]') ||
      skillElement.querySelector('a[href*="endorsements"]') ||
      skillElement.querySelector('.pvs-entity__supplementary-info') ||
      skillElement.querySelector('button.artdeco-button--tertiary');

    if (!endorsementButton) {
      console.warn(`[EndorsementScraper] No endorsement button found for ${skillName}`);
      return [];
    }

    // Human-like delay before clicking (800-1500ms)
    const preClickDelay = 800 + Math.random() * 700;
    await sleep(preClickDelay);

    // Click to open modal
    (endorsementButton as HTMLElement).click();
    console.log(`[EndorsementScraper] Clicked endorsement button for ${skillName}`);

    // ========================================================================
    // STEP 2: Wait for endorsement modal to appear
    // ========================================================================

    const modalAppeared = await waitForElement(
      '.artdeco-modal',
      5000 // 5 second timeout
    );

    if (!modalAppeared) {
      console.warn(`[EndorsementScraper] Modal did not appear for ${skillName}`);
      return [];
    }

    // Additional small delay for modal content to fully load
    await sleep(500);

    console.log(`[EndorsementScraper] Modal opened for ${skillName}`);

    // ========================================================================
    // STEP 3: Scroll through endorser list to load all endorsers
    // ========================================================================

    const modalContent = document.querySelector('.artdeco-modal__content');
    if (modalContent) {
      // Scroll to bottom to trigger lazy loading
      let previousHeight = 0;
      let scrollAttempts = 0;
      const maxScrolls = 10; // Limit scrolling to avoid infinite loops

      while (scrollAttempts < maxScrolls) {
        const currentHeight = modalContent.scrollHeight;

        // If height hasn't changed, we've loaded everything
        if (currentHeight === previousHeight && scrollAttempts > 0) {
          break;
        }

        previousHeight = currentHeight;

        // Scroll to bottom
        modalContent.scrollTop = modalContent.scrollHeight;

        // Wait for content to load (human-like delay)
        await sleep(300 + Math.random() * 200);

        scrollAttempts++;
      }

      console.log(`[EndorsementScraper] Completed ${scrollAttempts} scroll attempts`);
    }

    // ========================================================================
    // STEP 4: Extract endorser profile IDs from the modal
    // ========================================================================

    // Find all profile links in the modal
    const endorserLinks = document.querySelectorAll(
      '.artdeco-modal a[href*="/in/"]'
    );

    console.log(`[EndorsementScraper] Found ${endorserLinks.length} endorser links`);

    // Extract unique profile IDs
    const seenIds = new Set<string>();
    endorserLinks.forEach((link) => {
      const href = link.getAttribute('href');
      const profileId = extractProfileId(href);

      if (profileId && !seenIds.has(profileId)) {
        seenIds.add(profileId);
        endorsers.push(profileId);
      }
    });

    console.log(`[EndorsementScraper] Extracted ${endorsers.length} unique endorsers for ${skillName}`);

    // ========================================================================
    // STEP 5: Close the modal
    // ========================================================================

    const closeButton =
      document.querySelector('.artdeco-modal__dismiss') ||
      document.querySelector('button[data-test-modal-close-btn]');

    if (closeButton) {
      (closeButton as HTMLElement).click();
      console.log(`[EndorsementScraper] Closed modal for ${skillName}`);
    } else {
      console.warn(`[EndorsementScraper] Could not find close button, modal may remain open`);

      // Try pressing Escape as fallback
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    }

    // Wait for modal to close before continuing
    await sleep(500);

    return endorsers;
  } catch (error) {
    console.error(`[EndorsementScraper] Error scraping endorsers for ${skillName}:`, error);

    // Try to close modal on error
    const closeButton = document.querySelector('.artdeco-modal__dismiss');
    if (closeButton) {
      (closeButton as HTMLElement).click();
    }

    return endorsers; // Return whatever we got before the error
  }
}

/**
 * Scrape endorsers for multiple skills with rate limiting
 *
 * @param skills - Array of skill elements with their names
 * @param maxSkills - Maximum number of skills to scrape (default: 5)
 * @returns Map of skill name to endorser profile IDs
 */
export async function scrapeMultipleSkillEndorsers(
  skills: Array<{ element: Element; name: string }>,
  maxSkills: number = 5
): Promise<Map<string, string[]>> {
  const endorserMap = new Map<string, string[]>();

  console.log(`[EndorsementScraper] Starting batch scrape for ${Math.min(skills.length, maxSkills)} skills`);

  // Limit to maxSkills to avoid over-scraping
  const skillsToScrape = skills.slice(0, maxSkills);

  for (let i = 0; i < skillsToScrape.length; i++) {
    const { element, name } = skillsToScrape[i];

    console.log(`[EndorsementScraper] Processing skill ${i + 1}/${skillsToScrape.length}: ${name}`);

    const endorsers = await scrapeSkillEndorsers(element, name);
    endorserMap.set(name, endorsers);

    // Human-like delay between skills (1.5-3 seconds)
    // Longer delays to avoid detection
    if (i < skillsToScrape.length - 1) {
      const betweenSkillDelay = 1500 + Math.random() * 1500;
      console.log(`[EndorsementScraper] Waiting ${Math.round(betweenSkillDelay)}ms before next skill...`);
      await sleep(betweenSkillDelay);
    }
  }

  console.log(`[EndorsementScraper] Batch scrape complete. Scraped ${endorserMap.size} skills.`);

  return endorserMap;
}
