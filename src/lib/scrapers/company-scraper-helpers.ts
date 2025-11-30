/**
 * Company Scraper - Helper Functions
 * Selector helpers and utility functions
 */

/**
 * Query selector with multiple fallbacks
 */
export function querySelectorFallback(
  parent: Element | Document,
  selectors: string[]
): Element | null {
  for (const selector of selectors) {
    const element = parent.querySelector(selector);
    if (element) {
      return element;
    }
  }
  return null;
}

/**
 * Query all selector with multiple fallbacks
 */
export function querySelectorAllFallback(
  parent: Element | Document,
  selectors: string[]
): Element[] {
  for (const selector of selectors) {
    const elements = parent.querySelectorAll(selector);
    if (elements.length > 0) {
      return Array.from(elements);
    }
  }
  return [];
}

/**
 * Generate random delay for human-like behavior
 */
export function randomDelay(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min) + min);
}

/**
 * Sleep utility for delays
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Scroll to load all employees (infinite scroll)
 */
export async function scrollToLoadAllEmployees(maxScrolls: number = 100): Promise<void> {
  let previousHeight = 0;
  let scrollAttempts = 0;
  let noChangeCount = 0;

  console.log('[CompanyScraper] Starting infinite scroll for employees...');

  while (scrollAttempts < maxScrolls) {
    const currentHeight = document.body.scrollHeight;
    window.scrollTo(0, document.body.scrollHeight);

    await sleep(randomDelay(2000, 4000));

    if (currentHeight === previousHeight) {
      noChangeCount++;

      if (noChangeCount >= 3) {
        console.log('[CompanyScraper] Reached end of employee list (no new items loaded)');
        break;
      }
    } else {
      noChangeCount = 0;
    }

    previousHeight = currentHeight;
    scrollAttempts++;

    if (scrollAttempts % 10 === 0) {
      console.log(`[CompanyScraper] Scrolled ${scrollAttempts} times...`);
    }
  }

  console.log(`[CompanyScraper] Scroll complete. Total scrolls: ${scrollAttempts}`);
}
