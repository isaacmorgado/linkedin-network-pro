/**
 * Scraper Helper Functions
 * Utility functions shared across different scrapers
 */

/**
 * Wait for element to appear in DOM
 */
export function waitForElement(selector: string, timeout = 5000): Promise<Element | null> {
  return new Promise((resolve, reject) => {
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
      reject(new Error(`Element ${selector} not found within ${timeout}ms`));
    }, timeout);
  });
}

/**
 * Page Type Detection
 */
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

/**
 * Extract keywords from text using simple NLP
 */
export function extractKeywords(text: string): string[] {
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
 * Infer industry from profile headline
 * Uses keyword matching against common industries
 */
export function inferIndustryFromHeadline(headline: string): string | undefined {
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

/**
 * Query selector with fallback options
 * Tries multiple selectors until one matches
 *
 * @param parent - Parent element or document to query
 * @param selectors - Array of selectors to try (in order)
 * @returns Array of matched elements (empty if none found)
 *
 * @example
 * ```typescript
 * const elements = querySelectorAllFallback(document, [
 *   '.primary-selector',
 *   '.fallback-selector',
 *   '[data-attribute]'
 * ]);
 * ```
 */
export function querySelectorAllFallback(
  parent: Element | Document,
  selectors: string[]
): Element[] {
  for (const selector of selectors) {
    try {
      const elements = parent.querySelectorAll(selector);
      if (elements.length > 0) {
        return Array.from(elements);
      }
    } catch (error) {
      console.warn(`[Helpers] Invalid selector: ${selector}`, error);
    }
  }
  return [];
}

/**
 * Parse education/certification date string
 * Supports formats: "2016 - 2020", "2016 - Present", "2020", "Jan 2020", "January 2020"
 *
 * @param dateString - Date string from LinkedIn
 * @returns Object with startYear and endYear, or null if invalid
 *
 * @example
 * ```typescript
 * parseDateString("2016 - 2020") // { startYear: 2016, endYear: 2020 }
 * parseDateString("2016 - Present") // { startYear: 2016, endYear: undefined }
 * parseDateString("2020") // { startYear: undefined, endYear: 2020 }
 * ```
 */
export function parseDateString(dateString: string | undefined): {
  startYear?: number;
  endYear?: number;
} {
  if (!dateString) return {};

  const text = dateString.trim();

  // Try range format: "2016 - 2020" or "2016 - Present"
  const rangeMatch = text.match(/(\d{4})\s*[-–]\s*(\d{4}|Present)/i);
  if (rangeMatch) {
    return {
      startYear: parseInt(rangeMatch[1]),
      endYear: rangeMatch[2].toLowerCase() === 'present' ? new Date().getFullYear() : parseInt(rangeMatch[2]),
    };
  }

  // Try single year: "2020"
  const singleYearMatch = text.match(/(\d{4})/);
  if (singleYearMatch) {
    const year = parseInt(singleYearMatch[1]);
    return {
      startYear: year,
      endYear: year,
    };
  }

  return {};
}

/**
 * Extract number from text (e.g., "5 endorsements" -> 5)
 *
 * @param text - Text containing a number
 * @returns Extracted number or 0 if not found
 *
 * @example
 * ```typescript
 * extractNumberFromText("5 endorsements") // 5
 * extractNumberFromText("1 endorsement") // 1
 * extractNumberFromText("No endorsements") // 0
 * ```
 */
export function extractNumberFromText(text: string | undefined | null): number {
  if (!text) return 0;

  // Remove commas from numbers (e.g., "1,234" -> "1234")
  const cleanedText = text.replace(/,/g, '');
  const match = cleanedText.match(/(\d+)/);
  return match ? parseInt(match[1], 10) : 0;
}
