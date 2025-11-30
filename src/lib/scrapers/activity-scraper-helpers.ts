/**
 * Activity Scraper - Helper Functions
 * Selector utilities and scroll handling
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
 * Sleep utility for delays
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Scroll to load more content (infinite scroll)
 */
export async function scrollToLoadMore(
  _containerSelector: string,
  maxScrolls: number = 50
): Promise<void> {
  let previousHeight = 0;
  let scrollAttempts = 0;
  let noChangeCount = 0;

  console.log('[ActivityScraper] Starting infinite scroll loading...');

  while (scrollAttempts < maxScrolls) {
    const currentHeight = document.body.scrollHeight;
    window.scrollTo(0, document.body.scrollHeight);

    await sleep(1500);

    if (currentHeight === previousHeight) {
      noChangeCount++;

      if (noChangeCount >= 2) {
        console.log('[ActivityScraper] Reached end of content (no new items loaded)');
        break;
      }
    } else {
      noChangeCount = 0;
    }

    previousHeight = currentHeight;
    scrollAttempts++;

    if (scrollAttempts % 10 === 0) {
      console.log(`[ActivityScraper] Scrolled ${scrollAttempts} times...`);
    }
  }

  console.log(
    `[ActivityScraper] Scroll complete. Total scrolls: ${scrollAttempts}`
  );
}

/**
 * Generate UUID for activity IDs
 */
export function generateUUID(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
