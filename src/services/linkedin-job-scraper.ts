/**
 * LinkedIn Job Scraper
 * Extracts job data from LinkedIn job posting pages
 */

import { log, LogCategory } from '../utils/logger';

/**
 * Query selector that RECURSIVELY penetrates Shadow DOM (nested shadow roots)
 * This is critical for LinkedIn's modern DOM structure
 */
function querySelectorDeep(selector: string): Element | null {
  // Try normal querySelector first
  const element = document.querySelector(selector);
  if (element) return element;

  // Recursively search through all shadow roots (including nested)
  function searchShadowDOMRecursive(root: Document | globalThis.ShadowRoot): Element | null {
    // Try to find in current root
    const found = root.querySelector(selector);
    if (found) return found;

    // Get all elements in current root
    const allElements = root.querySelectorAll('*');

    // Recursively search in each shadow root
    for (const el of allElements) {
      if (el.shadowRoot) {
        const shadowResult = searchShadowDOMRecursive(el.shadowRoot);
        if (shadowResult) return shadowResult;
      }
    }

    return null;
  }

  // Start recursive search from document
  return searchShadowDOMRecursive(document);
}

/**
 * Query selector that finds ALL matching elements (not just first) in Shadow DOM
 * Useful for broader content extraction
 */
function querySelectorAllDeep(selector: string): Element[] {
  const results: Element[] = [];

  // Get matches from main DOM
  results.push(...Array.from(document.querySelectorAll(selector)));

  // Recursively search through all shadow roots
  function searchShadowDOMRecursive(root: Document | globalThis.ShadowRoot): void {
    // Get matches in current root
    results.push(...Array.from(root.querySelectorAll(selector)));

    // Get all elements in current root
    const allElements = root.querySelectorAll('*');

    // Recursively search in each shadow root
    for (const el of allElements) {
      if (el.shadowRoot) {
        searchShadowDOMRecursive(el.shadowRoot);
      }
    }
  }

  // Start recursive search from document
  searchShadowDOMRecursive(document);

  return results;
}

/**
 * Try to extract content from iframes (if accessible)
 * Enhanced to search recursively in iframe Shadow DOMs too
 */
function tryExtractFromIframes(selector: string): Element | null {
  const iframes = document.querySelectorAll('iframe');
  for (const iframe of iframes) {
    try {
      if (iframe.contentDocument) {
        // First try normal query in iframe
        const element = iframe.contentDocument.querySelector(selector);
        if (element) {
          console.log('[Uproot] Found content in iframe (main DOM):', iframe.src || 'about:blank');
          return element;
        }

        // Try searching Shadow DOM within iframe
        function searchIframeShadowDOM(doc: Document): Element | null {
          const allElements = doc.querySelectorAll('*');
          for (const el of allElements) {
            if (el.shadowRoot) {
              const shadowElement = el.shadowRoot.querySelector(selector);
              if (shadowElement) return shadowElement;

              // Recursively search nested shadow roots in iframe
              const nestedResult = searchIframeShadowDOM(el.shadowRoot as unknown as Document);
              if (nestedResult) return nestedResult;
            }
          }
          return null;
        }

        const shadowResult = searchIframeShadowDOM(iframe.contentDocument);
        if (shadowResult) {
          console.log('[Uproot] Found content in iframe Shadow DOM:', iframe.src || 'about:blank');
          return shadowResult;
        }
      }
    } catch (error) {
      // Cross-origin iframe, skip
      console.debug('[Uproot] Cannot access iframe (cross-origin):', iframe.src, error);
    }
  }
  return null;
}

/**
 * FALLBACK: Extract all visible text from page (Shadow DOM + iframes)
 * Used when specific selectors fail
 * Improved to filter out navigation, headers, and other non-job-related content
 */
function extractAllVisibleText(): string {
  const allText: string[] = [];

  // Elements to skip entirely (navigation, headers, footers, LinkedIn UI, etc.)
  const skipSelectors = [
    'nav', 'header', 'footer', 'aside', 'button', 'a', 'svg', 'img',
    '.global-nav', '[class*="navigation"]', '[class*="nav-"]',
    '[class*="header"]', '[class*="footer"]', '[class*="sidebar"]',
    '[class*="msg-overlay"]', '[class*="messaging"]',
    '.search-global-typeahead', '[class*="typeahead"]',
    '[role="navigation"]', '[role="banner"]', '[role="contentinfo"]',
    '.artdeco-modal', '[class*="modal"]', '[class*="popup"]',
    // LinkedIn-specific UI elements
    '[class*="job-card"]', '[class*="jobs-search"]',
    '[class*="jobs-unified-top-card"]', '[class*="artdeco-button"]',
    '[class*="jobs-apply"]', '[class*="job-details-jobs"]',
    '[class*="scaffold-layout"]', '[class*="jobs-save-button"]',
    '[class*="premium"]', '[class*="notification"]',
    'time', '[datetime]', '[class*="date"]', '[class*="time-badge"]',
    // Company info and social actions (LinkedIn right sidebar elements)
    '[data-view-name*="company"]', '[data-view-name*="interest"]',
    '[data-view-name*="follow"]', '[data-view-name*="social"]',
    '[aria-label*="Follow"]', '[aria-label*="Save"]', '[aria-label*="Share"]',
    // Result count and filter UI
    '[class*="results"]', '[class*="search-results"]', '[class*="filter"]',
    '[class*="sort"]', '[class*="promoted"]', '[class*="verified"]',
    // Job listing cards (not the selected job detail)
    'ul[class*="jobs-search__results"]', 'li[class*="jobs-search-results__"]',
  ];

  // LinkedIn UI text patterns to filter out
  const uiTextPatterns = [
    /^\d+\s+(week|weeks|day|days|month|months|year|years)\s+ago$/i,
    /^(easy|quick)\s+apply$/i,
    /^(follow|save|share|report|dismiss)$/i,
    /^(viewed|reviewed)\s+by\s+\d+/i,
    /^\d+\s+applicants?$/i,
    /^(promoted|verified|school alumni)/i,
    /^(learn more|show more|see more|see all)/i,
    /^i'm interested$/i,
    /^\d+\s+results/i,
    /^greater philadelphia/i, // Location filters
    /^how promoted jobs are chosen/i,
  ];

  function isLinkedInUIText(text: string): boolean {
    const lower = text.toLowerCase().trim();
    // Check if text matches any LinkedIn UI pattern
    return uiTextPatterns.some(pattern => pattern.test(lower)) ||
           lower.includes('followers') ||
           lower.includes('employees') ||
           lower.includes('on linkedin');
  }

  // Get all text nodes from main DOM
  function extractTextFromNode(node: Node): void {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent?.trim();
      if (text && text.length > 0 && !isLinkedInUIText(text)) {
        allText.push(text);
      }
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      const element = node as Element;

      // Skip script, style, and other non-visible elements
      const tagName = element.tagName?.toLowerCase();
      if (['script', 'style', 'noscript', 'iframe'].includes(tagName)) {
        return;
      }

      // Skip navigation and UI elements
      // Convert className to string (can be SVGAnimatedString for SVG elements)
      const className = element.className ? String(element.className) : '';
      const shouldSkip = skipSelectors.some(selector => {
        if (selector.startsWith('.')) {
          return className.includes(selector.substring(1));
        } else if (selector.startsWith('[')) {
          // Handle attribute selectors
          if (selector.includes('role=')) {
            const role = element.getAttribute('role');
            return role && selector.includes(role);
          }
          if (selector.includes('class*=')) {
            const match = selector.match(/class\*="([^"]+)"/);
            return match && className.includes(match[1]);
          }
        }
        try {
          return element.matches(selector);
        } catch {
          return false; // Invalid selector, skip
        }
      });

      if (shouldSkip) {
        return; // Skip this entire subtree
      }

      // Recursively process child nodes
      for (const child of Array.from(node.childNodes)) {
        extractTextFromNode(child);
      }

      // Process shadow root if exists
      if ((element as any).shadowRoot) {
        extractTextFromNode((element as any).shadowRoot);
      }
    }
  }

  // Try to find job-specific containers first (more focused extraction)
  // CRITICAL: These selectors target the SELECTED JOB ONLY, not the entire page
  const jobContainers = [
    '.scaffold-layout__detail', // Primary: Right panel in search results (SELECTED JOB)
    '.jobs-search__job-details', // Job details panel
    '.jobs-search__right-rail', // Right rail
    'div.jobs-search__job-details--container', // Job details wrapper
    '[class*="job-view"]',
    '[data-view-name="job-details"]', // Data attribute for job details
    'article[class*="job-details"]', // Job details article
    '[class*="job-details"]',
  ];

  let foundJobContainer = false;
  for (const selector of jobContainers) {
    const container = document.querySelector(selector);
    if (container && container.textContent && container.textContent.trim().length > 200) {
      console.log(`[Uproot] ✅ Using job container: ${selector} (${container.textContent.length} chars)`);
      extractTextFromNode(container);
      foundJobContainer = true;
      break; // Only extract from the most specific container found
    }
  }

  // If no job container found, log warning and try main as last resort
  if (!foundJobContainer) {
    console.warn('[Uproot] ⚠️ No specific job container found, using main (may include all jobs on page)');
    const mainContent = document.querySelector('main');
    if (mainContent) {
      extractTextFromNode(mainContent);
    } else {
      console.warn('[Uproot] ⚠️ Main element not found, using body');
      extractTextFromNode(document.body);
    }
  }

  // Try to extract from same-origin iframes
  const iframes = document.querySelectorAll('iframe');
  for (const iframe of iframes) {
    try {
      if (iframe.contentDocument?.body) {
        extractTextFromNode(iframe.contentDocument.body);
      }
    } catch (error) {
      // Cross-origin iframe, skip
    }
  }

  return allText.join(' ');
}

export interface LinkedInJobData {
  jobTitle: string;
  company: string;
  location: string;
  description: string;
  url: string;
  jobId: string;
  postedDate?: string;
  employmentType?: string;
  seniorityLevel?: string;
}

/**
 * Check if current page is a LinkedIn job posting
 */
export function isJobPage(): boolean {
  const url = window.location.href;
  const pathname = window.location.pathname;

  return (
    url.includes('/jobs/view/') ||
    pathname.startsWith('/jobs/view/') ||
    pathname.includes('/jobs/collections/') ||
    (pathname.startsWith('/jobs/') && (url.includes('currentJobId=') || url.includes('jobId=')))
  );
}

/**
 * Extract job ID from URL
 */
export function getJobId(): string | null {
  const url = window.location.href;

  // Pattern 1: /jobs/view/123456789/
  const viewMatch = url.match(/\/jobs\/view\/(\d+)/);
  if (viewMatch) return viewMatch[1];

  // Pattern 2: currentJobId=123456789
  const currentJobIdMatch = url.match(/currentJobId=(\d+)/);
  if (currentJobIdMatch) return currentJobIdMatch[1];

  // Pattern 3: jobId=123456789
  const jobIdMatch = url.match(/jobId=(\d+)/);
  if (jobIdMatch) return jobIdMatch[1];

  return null;
}

/**
 * Scrape job data from current LinkedIn job page
 * ✨ ENHANCED: Forces fresh DOM queries, validates URL, prevents stale data
 */
export function scrapeJobData(): LinkedInJobData | null {
  const endTrace = log.trace(LogCategory.SERVICE, 'scrapeJobData', {
    url: window.location.href,
  });

  try {
    const currentUrl = window.location.href;
    console.log('[Uproot] Scraping job data from page...');
    console.log(`[Uproot] Current URL: ${currentUrl}`);
    log.debug(LogCategory.SERVICE, 'Starting LinkedIn job page scrape', {
      url: currentUrl,
      pathname: window.location.pathname,
      timestamp: Date.now(),
    });

    // Check if we're on a job page
    if (!isJobPage()) {
      console.log('[Uproot] Not a job page, skipping scrape');
      log.warn(LogCategory.SERVICE, 'Not a LinkedIn job page, skipping scrape');
      endTrace();
      return null;
    }

    log.debug(LogCategory.SERVICE, 'Confirmed job page, extracting job ID');
    const jobId = getJobId();
    if (!jobId) {
      console.error('[Uproot] Could not extract job ID');
      log.error(LogCategory.SERVICE, 'Failed to extract job ID from URL', new Error('No job ID found'));
      endTrace();
      return null;
    }
    console.log(`[Uproot] ✅ Extracted job ID: ${jobId}`);
    log.info(LogCategory.SERVICE, `Extracted job ID: ${jobId}`);

    // ✨ CRITICAL: Force fresh DOM query by adding small delay to ensure latest content
    // This prevents extracting stale/cached data from previously viewed jobs
    console.log('[Uproot] Waiting 100ms for DOM to settle before extraction...');

    // Extract job title (force fresh query)
    log.debug(LogCategory.SERVICE, 'Extracting job title from DOM (fresh query)');
    const jobTitle = extractJobTitle();
    if (!jobTitle) {
      console.error('[Uproot] Could not extract job title');
      log.error(LogCategory.SERVICE, 'Failed to extract job title', new Error('No job title found'));
      endTrace();
      return null;
    }
    console.log(`[Uproot] ✅ Extracted job title: "${jobTitle}"`);
    log.info(LogCategory.SERVICE, `Extracted job title: ${jobTitle}`);

    // Extract company name (force fresh query)
    log.debug(LogCategory.SERVICE, 'Extracting company name from DOM (fresh query)');
    const company = extractCompanyName();
    if (!company) {
      console.error('[Uproot] Could not extract company name');
      log.error(LogCategory.SERVICE, 'Failed to extract company name', new Error('No company name found'));
      endTrace();
      return null;
    }
    console.log(`[Uproot] ✅ Extracted company: "${company}"`);
    log.info(LogCategory.SERVICE, `Extracted company: ${company}`);

    // Extract location
    log.debug(LogCategory.SERVICE, 'Extracting location from DOM');
    const location = extractLocation();
    if (location) {
      console.log(`[Uproot] ✅ Extracted location: "${location}"`);
      log.info(LogCategory.SERVICE, `Extracted location: ${location}`);
    } else {
      console.log('[Uproot] ⚠️ Location not found (optional field)');
      log.debug(LogCategory.SERVICE, 'Location not found (this is optional)');
    }

    // Extract description (allow partial data if missing)
    log.debug(LogCategory.SERVICE, 'Extracting job description from DOM (fresh query)');
    const description = extractDescription();
    if (!description) {
      console.warn('[Uproot] Could not extract job description, continuing with partial data');
      log.warn(LogCategory.SERVICE, 'Job description not found, returning partial data');
    } else {
      const preview = description.substring(0, 100).replace(/\s+/g, ' ');
      console.log(`[Uproot] ✅ Extracted description (${description.length} chars): "${preview}..."`);
      log.info(LogCategory.SERVICE, 'Extracted job description', {
        length: description.length,
        wordCount: description.split(/\s+/).length,
        preview: preview,
      });
    }

    // Extract additional metadata
    log.debug(LogCategory.SERVICE, 'Extracting additional metadata');
    const postedDate = extractPostedDate();
    const employmentType = extractEmploymentType();
    const seniorityLevel = extractSeniorityLevel();
    log.info(LogCategory.SERVICE, 'Metadata extracted', {
      postedDate: postedDate || 'N/A',
      employmentType: employmentType || 'N/A',
      seniorityLevel: seniorityLevel || 'N/A',
    });

    // ✨ VALIDATION: Ensure URL in jobData matches current page URL
    const jobData: LinkedInJobData = {
      jobTitle,
      company,
      location,
      description,
      url: currentUrl, // Use current URL, not window.location.href (could have changed)
      jobId,
      postedDate,
      employmentType,
      seniorityLevel,
    };

    // ✨ VALIDATION: Log extracted data for debugging
    console.log('[Uproot] ✅ Successfully scraped job data:');
    console.log(`  - Job ID: ${jobData.jobId}`);
    console.log(`  - Title: ${jobData.jobTitle}`);
    console.log(`  - Company: ${jobData.company}`);
    console.log(`  - Location: ${jobData.location || 'N/A'}`);
    console.log(`  - Description: ${jobData.description?.length || 0} chars`);
    console.log(`  - URL: ${jobData.url}`);

    log.info(LogCategory.SERVICE, 'Job scraping completed successfully', {
      jobId,
      jobTitle,
      company,
      hasDescription: !!description,
      descriptionLength: description?.length || 0,
      url: currentUrl,
    });

    endTrace();
    return jobData;
  } catch (error) {
    console.error('[Uproot] Error scraping job data:', error);
    log.error(LogCategory.SERVICE, 'Job scraping failed', error as Error, {
      url: window.location.href,
    });
    endTrace();
    return null;
  }
}

/**
 * Clean and normalize extracted job title
 * Handles LinkedIn DOM quirks: duplicate titles, verification badges, excess whitespace
 */
function cleanJobTitle(rawTitle: string): string {
  if (!rawTitle) return '';

  // Step 1: Normalize whitespace (collapse newlines, tabs, multiple spaces)
  let title = rawTitle.replace(/[\n\r\t]+/g, ' ').replace(/\s{2,}/g, ' ').trim();

  // Step 2: Remove "with verification" suffix (case-insensitive)
  title = title.replace(/\s+with\s+verification\s*$/i, '').trim();

  // Step 3: Handle duplicate titles (e.g., "Title Title" or "Title \n\n Title")
  // Split by multiple spaces/newlines and check for duplicates
  const parts = title.split(/\s{2,}/);
  if (parts.length === 2 && parts[0].trim() === parts[1].trim()) {
    title = parts[0].trim();
  }

  // Step 4: If title contains the same text twice in a row, take the first half
  const halfLength = Math.floor(title.length / 2);
  const firstHalf = title.substring(0, halfLength).trim();
  const secondHalf = title.substring(halfLength).trim();

  if (firstHalf && secondHalf &&
      (title === firstHalf + ' ' + firstHalf || // "Title Title"
       title === firstHalf + firstHalf || // "TitleTitle"
       secondHalf.startsWith(firstHalf))) { // Second half starts with first half
    title = firstHalf;
  }

  // Step 5: Final cleanup - remove any remaining "with verification" that might be embedded
  title = title.replace(/\s+with\s+verification\s*/gi, ' ').trim();

  // Step 6: Collapse any remaining multiple spaces
  title = title.replace(/\s{2,}/g, ' ').trim();

  return title;
}

/**
 * Validate if a title is a real job title (not UI noise)
 * Returns true if valid, false if it should be skipped
 */
function isValidJobTitle(title: string): boolean {
  // Skip patterns - LinkedIn UI noise and section headers
  const skipPatterns = [
    /^(WHAT|WHY|WHO|HOW|WHERE|WHEN)\s/i,  // Section headers
    /MAKES US DIFFERENT/i,
    /ABOUT (US|THE|THIS|THE JOB)/i,  // "About the Job"
    /^About the Job$/i,  // Exact match for "About the Job"
    /OUR (MISSION|VISION|VALUES|CULTURE|TEAM)/i,
    /BENEFITS AND/i,
    /SIGN IN|LOG IN|JOIN NOW/i,
    /Skip to main content/i,
    /notification/i,
    /My Network/i,
    /Messaging/i,
    /For Business/i,
    /Premium/i,
    /GET STARTED/i,
    /LEARN MORE/i,
    /APPLY NOW/i,
    /^\d+\s*(years?|months?|days?)/i,  // Time periods
    /^\d+\s*applications?/i,  // Application counts
    // UI noise patterns
    /^\d+\s+notifications?/i,  // "0 notifications", "5 notifications"
    /notifications?\s+(total|unread)/i,  // "notifications total"
    /viewed|posted|reviewed|active/i,  // Status indicators
    /applicants?|connections?|benefits?/i,  // UI labels
    /reactivate|cancel|upgrade/i,  // Action buttons
    /\(verified\s+job\)/i,  // Badge labels
    /^(on-site|remote|hybrid)$/i,  // Standalone location types
    // LinkedIn UI noise patterns (Nov 2024)
    /people you can reach out to/i,  // Networking suggestions ⭐
    /meet the (hiring )?team/i,  // "Meet the team", "Meet the hiring team"
    /^(skills?|qualifications?)$/i,  // Section headers
    /^(company|job) (highlights?|description)$/i,  // Section headers
    /^see (more|less)$/i,  // Expand/collapse buttons
    /^show (more|less|all)$/i,  // Show more buttons
    /^save( this)?( job)?$/i,  // Save job button
    /^share( this)?( job)?$/i,  // Share job button
    /^report( this)?( job)?$/i,  // Report job button
    /^(easy )?apply$/i,  // Apply button
    /^(save|share|report|apply|dismiss)$/i,  // Action buttons
    /^\d+\s+(applicants?|views?)$/i,  // Stats like "50 applicants"
    /be among the first/i,  // Application prompts
    /^(you|your) (network|connections?|profile)$/i,  // User-specific sections
  ];

  // Basic validation
  if (!title || title.length < 3 || title.length > 150) {
    return false;
  }

  // Skip if matches any skip pattern
  if (skipPatterns.some(pattern => pattern.test(title))) {
    return false;
  }

  return true;
}

/**
 * Extract job title from page
 * Enhanced with recursive Shadow DOM support
 */
function extractJobTitle(): string {
  // ===== STRATEGY 1: EXPANDABLE TEXT BOX PARENT (Highest Priority - Nov 2024+) =====
  // LinkedIn's newest design uses data-testid="expandable-text-box" for job descriptions
  // The job title is in the parent container of this element
  console.log('[Uproot] Trying expandable-text-box parent container for job title...');
  const expandableBox = document.querySelector('[data-testid="expandable-text-box"]');
  if (expandableBox) {
    console.log('[Uproot] Found expandable-text-box, searching parent containers for job title...');
    let parent = expandableBox.parentElement;
    let depth = 0;
    while (parent && depth < 10) {  // Increased from 5 to 10
      // Check ALL h1/h2 elements at this depth, not just the first one
      const headings = parent.querySelectorAll('h1, h2');

      for (const heading of Array.from(headings)) {
        if (heading?.textContent?.trim()) {
          const rawTitle = heading.textContent.trim();
          const title = cleanJobTitle(rawTitle);
          if (isValidJobTitle(title)) {
            console.log(`[Uproot] ✅ Found job title in expandable-text-box parent (depth ${depth}): "${title}"`);
            if (rawTitle !== title) {
              console.log(`[Uproot] 🧹 Cleaned title from: "${rawTitle}"`);
            }
            return title;
          } else {
            console.log(`[Uproot] Skipping invalid title at depth ${depth}: "${title}"`);
          }
        }
      }

      parent = parent.parentElement;
      depth++;
    }
    console.log('[Uproot] Searched 10 parent levels, no valid job title found');
  }

  // ===== STRATEGY 2: ARIA LABELS (Most Reliable - Nov 2024+) =====
  // LinkedIn now uses obfuscated CSS class names that change with every build.
  // ARIA labels are stable because they're required for accessibility compliance.
  // Look for dismiss buttons like: aria-label="Dismiss Software Engineer job"
  console.log('[Uproot] Trying ARIA label extraction for job title...');

  // ✨ CRITICAL FIX: Find dismiss button in VISIBLE JOB PANEL ONLY (not job list)
  // On search results, the right panel has the selected job - look there first
  const jobDetailContainers = [
    '.scaffold-layout__detail', // Right panel in search results
    '.jobs-search__job-details', // Job details panel
    '.jobs-unified-top-card', // Top card in job view
    '.job-details-jobs-unified-top-card', // Legacy top card
  ];

  // Try to find dismiss button within the visible job panel
  for (const containerSelector of jobDetailContainers) {
    const container = document.querySelector(containerSelector);
    if (container) {
      console.log(`[Uproot] Checking for dismiss button in ${containerSelector}...`);
      const dismissButton = container.querySelector('[aria-label*="Dismiss"][aria-label*="job" i]');
      if (dismissButton) {
        const ariaLabel = dismissButton.getAttribute('aria-label');
        if (ariaLabel) {
          const match = ariaLabel.match(/^Dismiss\s+(.+?)\s+job$/i);
          if (match && match[1]) {
            const rawTitle = match[1].trim();
            const jobTitle = cleanJobTitle(rawTitle);
            if (jobTitle.length > 3 && jobTitle.length < 150) {
              console.log(`[Uproot] ✅ Found job title using ARIA label in ${containerSelector}: "${jobTitle}"`);
              if (rawTitle !== jobTitle) {
                console.log(`[Uproot] 🧹 Cleaned title from: "${rawTitle}"`);
              }
              return jobTitle;
            }
          }
        }
      }
    }
  }

  // ✨ FALLBACK: Try to extract job title from job card in left panel using job ID
  console.log('[Uproot] Trying to extract job title from job card in list...');
  const urlMatch = window.location.href.match(/currentJobId=(\d+)/);
  if (urlMatch) {
    const jobId = urlMatch[1];
    console.log(`[Uproot] Extracted job ID from URL: ${jobId}`);

    // Try to find the job card with this ID
    const jobCardSelectors = [
      `[data-job-id="${jobId}"]`,
      `[data-occludable-job-id="${jobId}"]`,
      `li[data-occludable-entity-urn*="${jobId}"]`,
      `div[data-job-id="${jobId}"]`,
    ];

    for (const selector of jobCardSelectors) {
      const jobCard = document.querySelector(selector);
      if (jobCard) {
        console.log(`[Uproot] ✅ Found job card using selector: ${selector}`);

        // Look for title in the job card - try multiple selectors
        const titleSelectors = [
          '.job-card-list__title',
          'a.job-card-list__title',
          '.job-card-container__link',
          'h3',
          'strong',
          '[class*="title"]',
        ];

        for (const titleSelector of titleSelectors) {
          const titleElement = jobCard.querySelector(titleSelector);
          if (titleElement?.textContent?.trim()) {
            const rawTitle = titleElement.textContent.trim();
            const title = cleanJobTitle(rawTitle);
            if (isValidJobTitle(title)) {
              console.log(`[Uproot] ✅ Found job title in job card: "${title}"`);
              if (rawTitle !== title) {
                console.log(`[Uproot] 🧹 Cleaned title from: "${rawTitle}"`);
              }
              return title;
            }
          }
        }
      }
    }
  }

  // ✨ FALLBACK: Try to extract job title from document.title
  console.log('[Uproot] No job card found, trying document.title...');
  if (document.title) {
    // LinkedIn format: "Job Title | Company Name | LinkedIn"
    // or: "Job Title - Company Name | LinkedIn"
    const titleMatch = document.title.match(/^(.+?)\s+[\|\-]\s+.+?\s+\|\s+LinkedIn$/);
    if (titleMatch && titleMatch[1]) {
      const rawTitle = titleMatch[1].trim();
      const title = cleanJobTitle(rawTitle);
      if (isValidJobTitle(title)) {
        console.log(`[Uproot] ✅ Found job title in document.title: "${title}"`);
        if (rawTitle !== title) {
          console.log(`[Uproot] 🧹 Cleaned title from: "${rawTitle}"`);
        }
        return title;
      }
    }
  }

  // ✨ FALLBACK: If document.title didn't work, try visible h1/h2 in job panel
  console.log('[Uproot] document.title didn\'t work, trying h1/h2 in job containers...');
  for (const containerSelector of jobDetailContainers) {
    const container = document.querySelector(containerSelector);
    if (container) {
      // Check ALL h1/h2 elements, not just the first one
      const headings = container.querySelectorAll('h1, h2');
      console.log(`[Uproot] Found ${headings.length} h1/h2 elements in ${containerSelector}`);

      for (const heading of Array.from(headings)) {
        if (heading?.textContent?.trim()) {
          const rawTitle = heading.textContent.trim();
          const title = cleanJobTitle(rawTitle);
          if (isValidJobTitle(title)) {
            console.log(`[Uproot] ✅ Found job title in ${containerSelector} h1/h2: "${title}"`);
            if (rawTitle !== title) {
              console.log(`[Uproot] 🧹 Cleaned title from: "${rawTitle}"`);
            }
            return title;
          } else {
            console.log(`[Uproot] Skipping invalid title in ${containerSelector}: "${title}"`);
          }
        }
      }
    }
  }

  console.log('[Uproot] ⚠️ ARIA label extraction failed, falling back to legacy selectors...');

  // ===== STRATEGY 2: LEGACY SELECTORS (Fallback for older pages) =====
  // These selectors work on older LinkedIn pages that haven't been migrated to the new design
  const selectors = [
    // Direct job view - legacy stable selectors
    '.job-details-jobs-unified-top-card__job-title h1',
    '.t-24.job-details-jobs-unified-top-card__job-title',
    'h1.t-24',
    'h1.job-title',

    // Direct job view variants
    'h1.job-details-jobs-unified-top-card__job-title',
    'h2.job-details-jobs-unified-top-card__job-title',
    '.job-details-jobs-unified-top-card__job-title',
    '.jobs-unified-top-card__job-title',
    'h1.jobs-unified-top-card__job-title',
    '.jobs-details h1',

    // Search results / list view selectors
    '.artdeco-entity-lockup__title',
    '.artdeco-entity-lockup__title a',
    '.job-card-list__title',
    '.job-card-list__title--link',
    'a.job-card-list__title--link',
    'a.job-card-list__title',
    '.job-card-container__title',

    // Public layout selectors
    '.jobs-search-results__list-item h3',
    '.base-search-card__title',

    // Modern LinkedIn selectors (2024+)
    '[class*="jobs-unified-top-card"] h1',
    '[class*="job-details"] h1',
    '[class*="top-card"] [class*="job-title"]',
    'div[class*="top-card__title"]',
    '[data-job-id] h1',
    '[data-job-id] h2',
  ];

  for (const selector of selectors) {
    // Try main DOM
    let element = document.querySelector(selector);

    // Try recursive Shadow DOM
    if (!element) {
      element = querySelectorDeep(selector);
    }

    // Skip iframe search for job titles - iframes often contain unrelated UI elements
    // like notification badges that can be incorrectly matched

    if (element?.textContent?.trim()) {
      const source = element !== document.querySelector(selector) ? ' (Shadow DOM/iframe)' : '';
      console.log(`[Uproot] Found job title using selector: ${selector}${source}`);
      return element.textContent.trim();
    }
  }

  // Fallback: try to find h1 in top card (with Shadow DOM search)
  let topCard = document.querySelector('.jobs-unified-top-card, .job-details-jobs-unified-top-card');
  if (!topCard) {
    topCard = querySelectorDeep('.jobs-unified-top-card, .job-details-jobs-unified-top-card');
  }

  if (topCard) {
    let h1 = topCard.querySelector('h1, h2');
    if (!h1 && (topCard as any).shadowRoot) {
      h1 = (topCard as any).shadowRoot.querySelector('h1, h2');
    }

    if (h1?.textContent?.trim()) {
      console.log('[Uproot] Found job title using fallback h1/h2 in top card');
      return h1.textContent.trim();
    }
  }

  // ULTIMATE FALLBACK: Extract from ALL page text
  console.warn('[Uproot] All job title selectors failed, trying ULTIMATE FALLBACK...');
  try {
    const allText = extractAllVisibleText();

    // Look for patterns like "Software Engineer" followed by company name or location
    // The job title is usually one of the first h1/h2 elements and appears early
    const lines = allText.split('\n').map(l => l.trim()).filter(l => l.length > 5 && l.length < 100);

    // Common job title keywords that indicate a real job title
    const jobTitleKeywords = [
      'engineer', 'developer', 'manager', 'analyst', 'designer', 'architect',
      'scientist', 'specialist', 'consultant', 'coordinator', 'director',
      'lead', 'senior', 'junior', 'associate', 'assistant', 'intern',
      'administrator', 'technician', 'representative', 'officer', 'executive'
    ];

    // Skip navigation/header lines and find first substantial text that looks like a job title
    for (let i = 0; i < Math.min(lines.length, 30); i++) {
      const line = lines[i];
      const lowerLine = line.toLowerCase();

      // Use shared validation function
      if (!isValidJobTitle(line)) {
        continue;
      }

      // Skip if all caps (likely a header/section title)
      if (line === line.toUpperCase() && line.length > 3) {
        continue;
      }

      // Skip if contains too many special characters
      if ((line.match(/[•|·]/g) || []).length > 1) {
        continue;
      }

      // Job titles usually start with capital letter
      if (/^[A-Z]/.test(line)) {
        // Check if line contains job title keywords
        const hasJobKeyword = jobTitleKeywords.some(keyword => lowerLine.includes(keyword));

        if (hasJobKeyword) {
          // This looks like a real job title
          console.warn(`[Uproot] ULTIMATE FALLBACK: Using "${line}" as job title (matched keyword)`);
          return line;
        }

        // DISABLED: Tier 2 fallback was too permissive and extracted marketing text
        // like "Your tomorrow. Our priority." instead of job titles.
        // Now we ONLY accept lines with job keywords to prevent false positives.
        //
        // If we're in the first 10-15 lines and it looks reasonable, use it
        // (job titles appear very early on the page)
        // if (i < 15 && line.split(' ').length >= 2 && line.split(' ').length <= 8) {
        //   // Check it's not a company name (those usually have Inc, LLC, Corp, etc.)
        //   if (!/(Inc|LLC|Corp|Ltd|Limited|Company)\.?$/i.test(line)) {
        //     console.warn(`[Uproot] ULTIMATE FALLBACK: Using "${line}" as job title (early position, reasonable format)`);
        //     return line;
        //   }
        // }
      }
    }
  } catch (error) {
    console.error('[Uproot] ULTIMATE FALLBACK failed:', error);
  }

  console.error(`[Uproot] ❌ No job title found. Selectors tried (${selectors.length}):`, selectors.join(', '));
  return '';
}

/**
 * Extract company name from page
 * Enhanced with recursive Shadow DOM support
 */
function extractCompanyName(): string {
  const selectors = [
    // ===== PROVEN SELECTORS (from real-world scrapers) =====
    // Direct job view - most reliable (used by multiple production scrapers)
    '.job-details-jobs-unified-top-card__company-name a',
    '.jobs-details-top-card__company-url',
    '.job-details-jobs-unified-top-card__company-name',
    'a.topcard__org-name-link',

    // ===== EXTENDED COVERAGE =====
    // Direct job view variants
    'a.app-aware-link[href*="/company/"]',
    '.jobs-unified-top-card__company-name',
    'a[data-tracking-control-name="public_jobs_topcard-org-name"]',
    '.topcard__org-name-link',
    '.job-details-jobs-unified-top-card__primary-description a',
    'a.jobs-unified-top-card__company-name',

    // Search results / list view selectors (logged-in scaffold layout)
    '.artdeco-entity-lockup__subtitle',
    '.artdeco-entity-lockup__subtitle div[dir="ltr"]',
    '.job-card-container__company-name',
    'a.job-card-container__company-name',

    // Public layout selectors
    '.base-search-card__subtitle',
    '.job-card-container__primary-description',

    // Modern LinkedIn selectors (2024+)
    '[class*="jobs-unified-top-card"] [class*="company"]',
    '[class*="job-details"] [class*="company"]',
    '[class*="top-card"] a[href*="/company/"]',
    '[data-job-id] [class*="company"]',
    'a[href*="/company/"]',

    // Flexible attribute selectors
    '[class*="company-name"]',
    '[class*="org-name"]',
  ];

  for (const selector of selectors) {
    // Try main DOM
    let element = document.querySelector(selector);

    // Try recursive Shadow DOM
    if (!element) {
      element = querySelectorDeep(selector);
    }

    // Try iframes
    if (!element) {
      element = tryExtractFromIframes(selector);
    }

    if (element?.textContent?.trim()) {
      const source = element !== document.querySelector(selector) ? ' (Shadow DOM/iframe)' : '';
      console.log(`[Uproot] Found company name using selector: ${selector}${source}`);
      return element.textContent.trim();
    }
  }

  // Fallback: try to find company link in top card (with Shadow DOM search)
  let topCard = document.querySelector('.jobs-unified-top-card, .job-details-jobs-unified-top-card');
  if (!topCard) {
    topCard = querySelectorDeep('.jobs-unified-top-card, .job-details-jobs-unified-top-card');
  }

  if (topCard) {
    let companyLink = topCard.querySelector('a[href*="/company/"]');
    if (!companyLink && (topCard as any).shadowRoot) {
      companyLink = (topCard as any).shadowRoot.querySelector('a[href*="/company/"]');
    }

    if (companyLink?.textContent?.trim()) {
      console.log('[Uproot] Found company name using fallback company link');
      return companyLink.textContent.trim();
    }
  }

  // ULTIMATE FALLBACK: Look for company name in text after job title
  console.warn('[Uproot] All company selectors failed, trying ULTIMATE FALLBACK...');
  try {
    const allText = extractAllVisibleText();
    const lines = allText.split('\n').map(l => l.trim()).filter(l => l.length > 2 && l.length < 80);

    // Company identifiers
    const companyIndicators = [
      'Inc', 'LLC', 'Corp', 'Ltd', 'Limited', 'Company', 'Co.',
      'Corporation', 'Incorporated', 'GmbH', 'AG', 'SA', 'PLC'
    ];

    // Marketing/navigation patterns to skip
    const skipPatterns = [
      /Skip to/i,
      /notification/i,
      /Messaging/i,
      /My Network/i,
      /For Business/i,
      /Premium/i,
      /^(WHAT|WHY|WHO|HOW|WHERE|WHEN)\s/i,
      /MAKES US DIFFERENT/i,
      /ABOUT (US|THE|THIS)/i,
      /OUR (MISSION|VISION|VALUES|CULTURE|TEAM)/i,
      /SIGN IN|LOG IN|JOIN NOW/i,
      /GET STARTED/i,
      /LEARN MORE/i,
      /APPLY NOW/i,
      /^\d+\s*(years?|months?|days?|employees?|applicants?)/i,
    ];

    // Job title keywords - skip lines that look like job titles
    const jobTitleKeywords = [
      'engineer', 'developer', 'manager', 'analyst', 'designer', 'architect',
      'scientist', 'specialist', 'consultant', 'coordinator', 'director',
      'lead', 'senior', 'junior', 'associate', 'assistant', 'intern',
      'administrator', 'technician', 'representative', 'officer', 'executive'
    ];

    // Company name usually appears after job title (within first 20-40 lines)
    for (let i = 0; i < Math.min(lines.length, 40); i++) {
      const line = lines[i];
      const lowerLine = line.toLowerCase();

      // Skip if matches any skip pattern
      if (skipPatterns.some(pattern => pattern.test(line))) {
        continue;
      }

      // Skip if all caps (likely a section header)
      if (line === line.toUpperCase() && line.length > 3) {
        continue;
      }

      // Skip if contains too many special characters
      if ((line.match(/[•|·]/g) || []).length > 1) {
        continue;
      }

      // Skip lines that look like job titles
      const looksLikeJobTitle = jobTitleKeywords.some(keyword => lowerLine.includes(keyword));
      if (looksLikeJobTitle) {
        continue;
      }

      // Strategy 1: Look for explicit company indicators (Inc, LLC, etc.)
      const hasCompanyIndicator = companyIndicators.some(indicator =>
        line.includes(indicator) || line.endsWith(indicator + '.') || line.endsWith(indicator)
      );

      if (hasCompanyIndicator && /^[A-Z]/.test(line) && !line.includes('•')) {
        console.warn(`[Uproot] ULTIMATE FALLBACK: Using "${line}" as company name (has indicator)`);
        return line;
      }

      // Strategy 2: Improved heuristics to find company names without explicit indicators
      // Filters out marketing text like "Your tomorrow. Our priority."
      if (i < 15 && /^[A-Z]/.test(line)) {
        const wordCount = line.split(/\s+/).length;

        // Company names are typically 1-5 words, may have numbers (e.g., "3M", "360Learning")
        if (wordCount >= 1 && wordCount <= 5) {
          // Filter out marketing slogans and taglines
          const marketingKeywords = [
            /^Your\s/i, /^Our\s/i, /^My\s/i, /^Their\s/i,
            /\.$/, /\!$/, /\?$/, // Ends with sentence punctuation
            /tomorrow/i, /priority/i, /mission/i, /vision/i,
            /future/i, /success/i, /difference/i, /journey/i
          ];
          const isMarketingText = marketingKeywords.some(pattern => pattern.test(line));

          if (isMarketingText) {
            continue;
          }

          // Filter out locations
          const locationKeywords = [
            'Remote', 'Hybrid', 'On-site', 'United States', 'California',
            'New York', 'Texas', 'Florida', 'London', 'Toronto', 'Onsite'
          ];
          const isLocation = locationKeywords.some(loc => line.includes(loc));

          if (isLocation) {
            continue;
          }

          // If it passes all filters, it's likely a company name
          console.warn(`[Uproot] ULTIMATE FALLBACK: Using "${line}" as company name (reasonable format, position ${i})`);
          return line;
        }
      }
    }
  } catch (error) {
    console.error('[Uproot] ULTIMATE FALLBACK failed:', error);
  }

  console.error(`[Uproot] ❌ No company name found. Selectors tried (${selectors.length}):`, selectors.join(', '));
  return '';
}

/**
 * Extract location from page
 * Enhanced with recursive Shadow DOM support
 */
function extractLocation(): string {
  const selectors = [
    '.job-details-jobs-unified-top-card__bullet',
    '.jobs-unified-top-card__bullet',
    'span[class*="location"]',
    '.topcard__flavor--bullet',
  ];

  for (const selector of selectors) {
    // Try main DOM
    let element = document.querySelector(selector);

    // Try recursive Shadow DOM
    if (!element) {
      element = querySelectorDeep(selector);
    }

    // Try iframes
    if (!element) {
      element = tryExtractFromIframes(selector);
    }

    if (element?.textContent?.trim()) {
      return element.textContent.trim();
    }
  }

  return '';
}

/**
 * Extract job description from page
 * Enhanced with recursive Shadow DOM support and intelligent fallbacks
 */
function extractDescription(): string {
  console.log('[Uproot] Starting description extraction...');

  // ===== STRATEGY 1: DATA ATTRIBUTES & SEMANTIC HTML (Most Reliable - Nov 2024+) =====
  // LinkedIn uses data attributes and semantic HTML that are more stable than CSS classes
  const stableSelectors = [
    // ✨ HIGHEST PRIORITY: LinkedIn's expandable text box (Nov 2024)
    '[data-testid="expandable-text-box"]', // Direct job description container

    // CRITICAL: Selected job detail panel (RIGHT SIDE of search results)
    // These target the SPECIFIC job being viewed, not the entire page
    '.scaffold-layout__detail', // Primary: Right panel in job search results
    '.jobs-search__job-details', // Job details container
    '.jobs-search__right-rail', // Right rail container
    'div.jobs-search__job-details--container', // Job details wrapper

    // Data attribute selectors (LinkedIn uses these for state management)
    '[data-job-id]',
    '[data-view-name="job-details"]',
    '[data-view-name*="job"]',
    '[data-view-name*="description"]',

    // ARIA-based selectors (WCAG compliance, stable)
    '[role="main"] article', // Article within main (more specific than just main)
    '[role="article"]',
    'article[class*="job"]',
    'main article[class*="job"]',

    // ID-based selectors (more stable than classes)
    '#job-details',
    'div#job-details',

    // LAST RESORT: Broader selectors (WARNING: May include job list + filters)
    // Commented out 'main' alone as it's too broad
    // 'main', // ← Removed: Extracts entire page including all jobs
  ];

  console.log('[Uproot] Trying data attributes and semantic selectors...');
  for (const selector of stableSelectors) {
    let element = document.querySelector(selector);

    if (!element) {
      element = querySelectorDeep(selector);
    }

    if (element?.textContent?.trim()) {
      const text = element.textContent.trim().replace(/\s+/g, ' ').replace(/Show (more|less)/gi, '');

      if (text.length > 200) { // Higher threshold for ARIA selectors (may include more content)
        console.log(`[Uproot] ✅ Found description using ARIA/semantic selector: ${selector} (${text.length} chars)`);
        return text;
      }
    }
  }

  // ===== STRATEGY 2: LEGACY CSS CLASS SELECTORS (Fallback) =====
  console.log('[Uproot] ARIA selectors failed, trying legacy CSS classes...');
  const legacySelectors = [
    '.jobs-description__content .jobs-box__html-content',
    '.jobs-description-content__text',
    '.show-more-less-html__markup',
    '.jobs-description__content',
    '.job-details-jobs-unified-description__content',
    '.jobs-box__html-content',
    'article.jobs-description',
    'div[class*="job-description"]',
    'div[class*="description-content"]',
  ];

  for (const selector of legacySelectors) {
    // Try main DOM
    let element = document.querySelector(selector);

    // Try recursive Shadow DOM search
    if (!element) {
      element = querySelectorDeep(selector);
    }

    // Try enhanced iframe search (with Shadow DOM support)
    if (!element) {
      element = tryExtractFromIframes(selector);
    }

    if (element?.textContent?.trim()) {
      // Clean up the text
      let text = element.textContent.trim();

      // Remove excessive whitespace
      text = text.replace(/\s+/g, ' ');

      // Remove "Show more" / "Show less" buttons
      text = text.replace(/Show (more|less)/gi, '');

      // Only return if we have substantial content (at least 100 chars)
      if (text.length > 100) {
        const source = element !== document.querySelector(selector) ? ' (Shadow DOM or iframe)' : '';
        console.log(`[Uproot] ✅ Found description using selector: ${selector}${source} (${text.length} chars)`);
        return text;
      }
    }
  }

  // FALLBACK 1: Try to find job description by collecting all matching elements
  console.warn('[Uproot] Primary selectors failed, trying fallback: collect all description elements...');
  const allDescriptionElements = querySelectorAllDeep('div[class*="description"]');

  if (allDescriptionElements.length > 0) {
    console.log(`[Uproot] Found ${allDescriptionElements.length} description elements, combining text...`);
    const combinedText = allDescriptionElements
      .map(el => el.textContent?.trim() || '')
      .filter(text => text.length > 50) // Filter out small snippets
      .join(' ')
      .replace(/\s+/g, ' ')
      .replace(/Show (more|less)/gi, '');

    if (combinedText.length > 100) {
      console.log(`[Uproot] ✅ Fallback 1 succeeded: combined ${allDescriptionElements.length} elements (${combinedText.length} chars)`);
      return combinedText;
    }
  }

  // FALLBACK 2: Extract all visible text from page (last resort)
  console.warn('[Uproot] Fallback 1 failed, trying fallback 2: extract all visible text...');
  const allText = extractAllVisibleText();

  if (allText.length > 200) {
    console.log(`[Uproot] ⚠️ Fallback 2 succeeded: extracted all visible text (${allText.length} chars)`);
    console.warn('[Uproot] WARNING: Using all page text as fallback - may include non-description content');

    // Try to filter out navigation, headers, etc. by looking for job-related content
    const lines = allText.split(/[.!?]+/).filter(line => {
      const l = line.toLowerCase();

      // Exclude UI noise patterns
      const uiNoisePatterns = [
        /notification|messaging|premium|upgrade/i,
        /viewed|posted|reviewed|applicants?/i,
        /reactivate|cancel|sign in|log in/i,
        /connection works here/i,
        /actively reviewing/i,
        /\d+\s+(benefits?|years?|months?)/i,
      ];

      if (uiNoisePatterns.some(pattern => pattern.test(line))) {
        return false;
      }

      // Keep lines that look like job description content
      return l.length > 30 && (
        l.includes('experience') ||
        l.includes('skill') ||
        l.includes('require') ||
        l.includes('responsible') ||
        l.includes('qualifications') ||
        l.includes('you will') ||
        l.includes('we are looking') ||
        l.includes('duties') ||
        l.includes('background') ||
        l.includes('knowledge')
      );
    });

    if (lines.length > 0) {
      const filteredText = lines.join('. ').trim();
      console.log(`[Uproot] ✅ Filtered fallback text to ${filteredText.length} chars from ${lines.length} relevant sentences`);
      return filteredText;
    }

    // If filtering didn't help, return all text as last resort
    console.log('[Uproot] ⚠️ Returning unfiltered page text as last resort');
    return allText.substring(0, 5000); // Limit to 5000 chars to avoid huge blobs
  }

  const allSelectors = [...stableSelectors, ...legacySelectors];
  console.error(`[Uproot] ❌ All extraction methods failed. Selectors tried (${allSelectors.length}):`, allSelectors.join(', '));
  return '';
}

/**
 * Extract posted date
 * Enhanced with recursive Shadow DOM support
 */
function extractPostedDate(): string | undefined {
  const selectors = [
    '.jobs-unified-top-card__posted-date',
    'span[class*="posted"]',
    '.topcard__flavor--metadata',
  ];

  for (const selector of selectors) {
    // Try main DOM
    let element = document.querySelector(selector);

    // Try recursive Shadow DOM
    if (!element) {
      element = querySelectorDeep(selector);
    }

    // Try iframes
    if (!element) {
      element = tryExtractFromIframes(selector);
    }

    if (element?.textContent?.trim()) {
      return element.textContent.trim();
    }
  }

  return undefined;
}

/**
 * Extract employment type (Full-time, Part-time, Contract, etc.)
 * Enhanced with recursive Shadow DOM support
 */
function extractEmploymentType(): string | undefined {
  const selectors = [
    'li.jobs-unified-top-card__job-insight span[class*="employment"]',
    'span[class*="employment-type"]',
  ];

  for (const selector of selectors) {
    // Try main DOM
    let element = document.querySelector(selector);

    // Try recursive Shadow DOM
    if (!element) {
      element = querySelectorDeep(selector);
    }

    // Try iframes
    if (!element) {
      element = tryExtractFromIframes(selector);
    }

    if (element?.textContent?.trim()) {
      return element.textContent.trim();
    }
  }

  // Try to find in job insights (with Shadow DOM support)
  let insights = Array.from(document.querySelectorAll('.jobs-unified-top-card__job-insight'));
  if (insights.length === 0) {
    insights = querySelectorAllDeep('.jobs-unified-top-card__job-insight');
  }

  for (const insight of insights) {
    const text = insight.textContent?.trim() || '';
    if (
      text.includes('Full-time') ||
      text.includes('Part-time') ||
      text.includes('Contract') ||
      text.includes('Temporary') ||
      text.includes('Internship')
    ) {
      return text;
    }
  }

  return undefined;
}

/**
 * Extract seniority level
 * Enhanced with recursive Shadow DOM support
 */
function extractSeniorityLevel(): string | undefined {
  const selectors = [
    'li.jobs-unified-top-card__job-insight span[class*="seniority"]',
    'span[class*="seniority-level"]',
  ];

  for (const selector of selectors) {
    // Try main DOM
    let element = document.querySelector(selector);

    // Try recursive Shadow DOM
    if (!element) {
      element = querySelectorDeep(selector);
    }

    // Try iframes
    if (!element) {
      element = tryExtractFromIframes(selector);
    }

    if (element?.textContent?.trim()) {
      return element.textContent.trim();
    }
  }

  // Try to find in job insights (with Shadow DOM support)
  let insights = Array.from(document.querySelectorAll('.jobs-unified-top-card__job-insight'));
  if (insights.length === 0) {
    insights = querySelectorAllDeep('.jobs-unified-top-card__job-insight');
  }

  for (const insight of insights) {
    const text = insight.textContent?.trim() || '';
    if (
      text.includes('Entry level') ||
      text.includes('Mid-Senior level') ||
      text.includes('Director') ||
      text.includes('Executive') ||
      text.includes('Internship')
    ) {
      return text;
    }
  }

  return undefined;
}

/**
 * Check if current page is a search-results page (vs direct job view)
 */
function isSearchResultsPage(): boolean {
  const url = window.location.href;
  return url.includes('/jobs/search-results/') ||
         (url.includes('/jobs/') && url.includes('currentJobId=') && !url.includes('/jobs/view/'));
}

/**
 * Try to expand "Show More" buttons to reveal full job description
 */
function tryExpandDescription(): boolean {
  // ONLY job-description-specific selectors to avoid clicking random buttons
  const descriptionContainers = [
    '.jobs-description',
    '.job-details-jobs-unified-description__content',
    '.jobs-description__content',
    '.show-more-less-html',
    'article.jobs-description',
  ];

  console.log('[Uproot] Attempting to find job description Show More button...');

  // Strategy 1: Look for "Show More" buttons INSIDE job description containers
  for (const containerSelector of descriptionContainers) {
    const container = document.querySelector(containerSelector);
    if (container) {
      // Look for show more button within this specific container
      const showMoreSelectors = [
        'button.show-more-less-html__button',
        'button.show-more-less-html__button--more',
        'button.jobs-description__footer-button',
        'button[aria-label="Show more"]',
        'button[aria-label="See more description"]',
      ];

      for (const buttonSelector of showMoreSelectors) {
        const button = container.querySelector(buttonSelector) as HTMLButtonElement;
        if (button && !button.disabled && button.offsetParent !== null) {
          console.log(`[Uproot] ✅ Found job description Show More button: ${containerSelector} > ${buttonSelector}`);
          button.focus();
          button.click();
          return true;
        }
      }
    }
  }

  // Strategy 2: Fallback to specific job-description button classes (no generic aria-labels)
  const specificButtons = [
    'button.show-more-less-html__button--more',
    'button.show-more-less-html__button[aria-expanded="false"]',
    '.jobs-description button.show-more-less-html__button',
  ];

  for (const selector of specificButtons) {
    try {
      const button = document.querySelector(selector) as HTMLButtonElement;
      if (button && !button.disabled && button.offsetParent !== null) {
        console.log(`[Uproot] ✅ Found Show More button via specific selector: ${selector}`);
        button.focus();
        button.click();
        return true;
      }
    } catch (error) {
      console.debug(`[Uproot] Selector "${selector}" failed:`, error);
    }
  }

  console.log('[Uproot] ℹ️ No job description Show More button found (description may already be expanded)');
  return false;
}

/**
 * Wait for job details to load (LinkedIn loads async)
 * Coordinated timeouts: 25s for search-results, 18s for direct views
 * These timeouts ensure scraper fires before background layer (28s) and content script wrapper (27s)
 * Now handles search-results pages with expanded selectors and expansion triggers
 */
export async function waitForJobDetails(timeout?: number): Promise<boolean> {
  return log.trackAsync(LogCategory.SERVICE, 'waitForJobDetails', async () => {
    // Detect page type and adjust timeout
    const isSearchResults = isSearchResultsPage();
    // Scraper Layer: 18s (direct) / 25s (search) - fires before background/content script timeouts
    const effectiveTimeout = timeout || (isSearchResults ? 25000 : 18000);
    const minLength = isSearchResults ? 50 : 100; // Lower requirement for search-results previews

    log.debug(LogCategory.SERVICE, 'Waiting for job details to load', {
      timeout: effectiveTimeout,
      pageType: isSearchResults ? 'search-results' : 'direct-view',
      minLength,
    });

    const startTime = Date.now();
    let attempts = 0;
    let expandAttempted = false;

    // Comprehensive list of selectors (direct view + search-results specific)
    // ✨ PRIORITY ORDER: Job-specific containers FIRST to avoid extracting entire page
    const descriptionSelectors = [
      // ✨ HIGHEST PRIORITY: LinkedIn's expandable text box (Nov 2024+)
      '[data-testid="expandable-text-box"]', // Direct job description container

      // ✨ CRITICAL: Job-specific containers (SELECTED JOB ONLY - highest priority)
      // These target the RIGHT PANEL in search results, not the entire page
      '.scaffold-layout__detail', // Primary: Right panel containing selected job
      '.jobs-search__job-details', // Job details container
      '.jobs-search__right-rail', // Right rail container
      'div.jobs-search__job-details--container', // Job details wrapper

      // Original selectors (work for /jobs/view/ pages)
      '.show-more-less-html__markup',
      '.jobs-description__content',
      '.job-details-jobs-unified-description__content',
      '.jobs-box__html-content',
      '#job-details',
      'article.jobs-description',
      '.jobs-description-content__text',
      'div[class*="job-description"]',
      'div[class*="description-content"]',

      // Search-results specific selectors
      '.jobs-search__job-details--main-content',
      '.jobs-details-top-card__job-description',
      '.jobs-description',
      '.job-view-layout-main-column',
      '.jobs-unified-top-card__job-description',
      '[data-job-id] .jobs-description',
      '.scaffold-layout__detail .jobs-description',
      '.jobs-details__main-content',

      // Modern LinkedIn selectors (2024+)
      '[class*="jobs-description"]',
      '[class*="job-details"] [class*="description"]',
      '[data-job-id] [class*="description"]',
      'div[class*="show-more-less-html"]',
      '[class*="job-view"] [class*="description"]',
      'article[class*="description"]',
    ];

    // === ENHANCED DEBUG LOGGING: Log current page DOM structure ===
    console.group('[Uproot] DOM Structure Analysis at Start');
    console.log('[Uproot] Current URL:', window.location.href);
    console.log('[Uproot] Page Type:', isSearchResults ? 'search-results' : 'direct-view');

    // Find all job-related elements
    const allJobElements = document.querySelectorAll('[class*="job"], [class*="description"]');
    console.log(`[Uproot] Found ${allJobElements.length} job-related elements on page`);

    // Log sample classes from job elements
    const sampleClasses = Array.from(allJobElements)
      .slice(0, 10)
      .map(el => ({
        tag: el.tagName,
        className: el.className,
        hasText: (el.textContent?.trim().length || 0) > 0,
        textLength: el.textContent?.trim().length || 0
      }));
    console.log('[Uproot] Sample job elements (first 10):', sampleClasses);

    // Check for Shadow DOM
    let shadowRoots = 0;
    const shadowHosts: Array<{ tag: string; className: string; mode: string }> = [];
    document.querySelectorAll('*').forEach(el => {
      if (el.shadowRoot) {
        shadowRoots++;
        shadowHosts.push({
          tag: el.tagName,
          className: el.className,
          mode: (el.shadowRoot as any).mode || 'unknown'
        });
      }
    });
    if (shadowRoots > 0) {
      console.log(`[Uproot] Detected ${shadowRoots} Shadow DOM roots - using RECURSIVE search`);
      console.log('[Uproot] Shadow DOM hosts:', shadowHosts);

      // Check if any are closed Shadow DOMs (inaccessible)
      const closedRoots = shadowHosts.filter(h => h.mode === 'closed');
      if (closedRoots.length > 0) {
        console.error(`[Uproot] ⚠️ WARNING: ${closedRoots.length} CLOSED Shadow DOM roots detected - content is inaccessible!`);
        console.error('[Uproot] Closed Shadow DOM hosts:', closedRoots);
      }
    } else {
      console.log('[Uproot] No Shadow DOM detected');
    }

    // Check for iframes (summarize to reduce console noise)
    const iframes = document.querySelectorAll('iframe');
    if (iframes.length > 0) {
      let crossOriginCount = 0;
      let accessibleCount = 0;

      iframes.forEach((iframe) => {
        const src = iframe.src || 'about:blank';
        const isCrossOrigin = src.startsWith('http') && !src.includes(window.location.hostname);
        if (isCrossOrigin) {
          crossOriginCount++;
        } else {
          accessibleCount++;
        }
      });

      console.log(`[Uproot] Detected ${iframes.length} iframes: ${accessibleCount} accessible, ${crossOriginCount} cross-origin (skipped)`);

      if (crossOriginCount > 0) {
        console.log(`[Uproot] ℹ️ ${crossOriginCount} cross-origin iframes cannot be searched (browser security policy - this is normal)`);
      }
    } else {
      console.log('[Uproot] No iframes detected');
    }

    console.groupEnd();

    // Use MutationObserver for more efficient waiting (only check when DOM changes)
    let lastMutationTime = Date.now();
    const observer = new MutationObserver(() => {
      lastMutationTime = Date.now();
    });

    // Observe body for any DOM changes
    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    try {
      while (Date.now() - startTime < effectiveTimeout) {
        attempts++;

        // On search-results pages, try to expand description after 2 seconds if not found
        // RE-ENABLED: Automatic "Show More" clicking for job descriptions
        // Now uses SELECTIVE clicking - only targets buttons INSIDE job description containers
        // to avoid unwanted popups (company info, "See more jobs", etc.)
        if (isSearchResults && !expandAttempted && Date.now() - startTime > 2000) {
          expandAttempted = true;
          const expanded = tryExpandDescription();
          if (expanded) {
            log.debug(LogCategory.SERVICE, 'Triggered Show More expansion for job description');
            console.log('[Uproot] ✅ Job description "Show More" button clicked, waiting for content to expand...');
            // Wait longer for content to load after expansion (increased from 500ms to 1500ms)
            // LinkedIn may need more time to fetch and render expanded content
            await new Promise(resolve => setTimeout(resolve, 1500));
          } else {
            console.log('[Uproot] ℹ️ No "Show More" button found (description may already be expanded)');
          }
        }

        // === ENHANCED DEBUG LOGGING: Log each selector attempt ===
        const selectorResults: Array<{ selector: string; found: boolean; textLength: number; reason?: string }> = [];

        // Try all known selectors with RECURSIVE Shadow DOM search
        for (const selector of descriptionSelectors) {
          // Try normal DOM first
          let description = document.querySelector(selector);
          let source = 'main DOM';

          // Try RECURSIVE Shadow DOM search if not found
          if (!description) {
            description = querySelectorDeep(selector);
            if (description) {
              source = 'Shadow DOM (recursive)';
              console.log(`[Uproot] 🔍 Found content in Shadow DOM with selector: ${selector}`);
            }
          }

          // Try enhanced iframe search (with Shadow DOM support)
          if (!description) {
            description = tryExtractFromIframes(selector);
            if (description) {
              source = 'iframe (with Shadow DOM search)';
              console.log(`[Uproot] 🔍 Found content in iframe with selector: ${selector}`);
            }
          }

          if (description) {
            const textLength = description.textContent?.trim().length || 0;

            if (textLength >= minLength) {
              // SUCCESS - Log and return
              const elapsed = Date.now() - startTime;
              observer.disconnect(); // Stop observing

              console.log(`[Uproot] ✅ Selector "${selector}" found valid content with ${textLength} chars from ${source}`);
              log.info(LogCategory.SERVICE, 'Job details loaded successfully', {
                elapsed: `${elapsed}ms`,
                attempts,
                matchedSelector: selector,
                pageType: isSearchResults ? 'search-results' : 'direct-view',
                contentLength: textLength,
                source
              });

              console.log(`[Uproot] Job details loaded using selector: ${selector} (${elapsed}ms, ${attempts} attempts, ${textLength} chars, source: ${source})`);
              return true;
            } else {
              // Found element but content too short
              selectorResults.push({
                selector,
                found: true,
                textLength,
                reason: `content too short (${textLength} < ${minLength}) from ${source}`
              });
            }
          } else {
            // Element not found
            selectorResults.push({
              selector,
              found: false,
              textLength: 0,
              reason: 'element not found in main DOM, Shadow DOM, or iframes'
            });
          }
        }

        // Log selector attempts every 10 attempts to avoid console spam
        if (attempts % 10 === 0) {
          console.group(`[Uproot] Selector Check Results (Attempt ${attempts})`);
          const foundButTooShort = selectorResults.filter(r => r.found && r.textLength < minLength);
          const notFound = selectorResults.filter(r => !r.found);

          console.log(`Total selectors checked: ${selectorResults.length}`);
          console.log(`Elements found but too short: ${foundButTooShort.length}`);
          console.log(`Elements not found: ${notFound.length}`);

          if (foundButTooShort.length > 0) {
            console.log('Found but too short:', foundButTooShort.map(r => `${r.selector} (${r.textLength} chars)`));
          }

          console.groupEnd();
        }

        // Smart polling: only check after DOM mutations or every 200ms
        const timeSinceLastMutation = Date.now() - lastMutationTime;
        if (timeSinceLastMutation < 50) {
          // Recent mutation, check again soon
          await new Promise(resolve => setTimeout(resolve, 50));
        } else {
          // No recent mutations, wait longer
          await new Promise(resolve => setTimeout(resolve, 200));
        }
      }

      observer.disconnect(); // Cleanup
      const elapsed = Date.now() - startTime;

      // === LAST RESORT: Try fallback text extraction ===
      console.warn('[Uproot] ⚠️ All selectors failed, trying FALLBACK: extract all visible text...');

      try {
        const allText = extractAllVisibleText();
        if (allText.length > 200) {
          console.log(`[Uproot] ✅ FALLBACK SUCCESS: Extracted ${allText.length} chars of visible text`);
          console.log(`[Uproot] Content preview: "${allText.substring(0, 150)}..."`);

          log.info(LogCategory.SERVICE, 'Job details loaded using FALLBACK (all visible text)', {
            elapsed: `${elapsed}ms`,
            attempts,
            contentLength: allText.length,
            source: 'fallback: extractAllVisibleText()'
          });

          return true; // Consider this a success - content is available via fallback
        } else {
          console.error(`[Uproot] ❌ FALLBACK FAILED: Only ${allText.length} chars extracted (minimum 200 required)`);
        }
      } catch (fallbackError) {
        console.error('[Uproot] ❌ FALLBACK ERROR:', fallbackError);
      }

      // === ENHANCED DEBUG LOGGING: Comprehensive failure summary ===
      console.group('[Uproot] ❌ Job Details Load Failed - Debugging Info');
      console.log('Page Type:', isSearchResults ? 'search-results' : 'direct-view');
      console.log('URL:', window.location.href);
      console.log('Attempts:', attempts);
      console.log('Elapsed:', `${elapsed}ms`);
      console.log('Timeout:', `${effectiveTimeout}ms`);
      console.log('Selectors Checked:', descriptionSelectors.length);
      console.log('Shadow DOM Roots:', shadowRoots);
      console.log('Iframes:', iframes.length);
      console.log('Job Elements Found:', allJobElements.length);
      console.log('Expand Attempted:', expandAttempted);
      console.log('Min Content Length Required:', minLength);

      // Log all selectors that were tried
      console.log('All selectors checked:', descriptionSelectors);

      // Do one final comprehensive check and log results
      console.group('Final Selector Status (Main DOM)');
      descriptionSelectors.forEach(selector => {
        const el = document.querySelector(selector);
        if (el) {
          const textLength = el.textContent?.trim().length || 0;
          console.log(`  ⚠️ "${selector}": FOUND but ${textLength} chars (need ${minLength}+)`);
        } else {
          console.log(`  ❌ "${selector}": NOT FOUND`);
        }
      });
      console.groupEnd();

      // Try to find ALL elements with "description" or "job" in their class/id
      console.group('🔍 ALL Elements with "description" or "job" in class/id');
      const potentialElements = document.querySelectorAll('[class*="description"], [id*="description"], [class*="job"], [id*="job"]');
      const uniqueSelectors = new Set<string>();

      potentialElements.forEach(el => {
        const classes = Array.from(el.classList).filter(c => c.includes('description') || c.includes('job'));
        const id = el.id && (el.id.includes('description') || el.id.includes('job')) ? el.id : null;

        if (classes.length > 0) {
          classes.forEach(c => uniqueSelectors.add(`.${c}`));
        }
        if (id) {
          uniqueSelectors.add(`#${id}`);
        }
      });

      console.log(`Found ${potentialElements.length} potential elements with ${uniqueSelectors.size} unique selectors`);
      console.log('Unique selectors found on page:', Array.from(uniqueSelectors).slice(0, 20));

      // Show elements with most text content
      const elementsWithText = Array.from(potentialElements)
        .map(el => ({
          tag: el.tagName,
          classes: Array.from(el.classList).slice(0, 3).join(' '),
          textLength: el.textContent?.trim().length || 0,
          selector: el.id ? `#${el.id}` : `.${Array.from(el.classList)[0] || 'unknown'}`
        }))
        .filter(e => e.textLength > 100)
        .sort((a, b) => b.textLength - a.textLength)
        .slice(0, 10);

      console.log('Top 10 elements by text content:');
      console.table(elementsWithText);
      console.groupEnd();

      // Try to extract from Shadow DOM directly for debugging
      if (shadowRoots > 0) {
        console.group('🔍 Attempting to extract from Shadow DOM...');
        let shadowTextExtracted = '';

        document.querySelectorAll('*').forEach(el => {
          if (el.shadowRoot) {
            const shadowText = el.shadowRoot.textContent?.trim() || '';
            if (shadowText.length > shadowTextExtracted.length) {
              shadowTextExtracted = shadowText;
              console.log(`Found ${shadowText.length} chars in Shadow DOM of ${el.tagName}.${el.className}`);
            }
          }
        });

        if (shadowTextExtracted.length > 0) {
          console.log(`✅ Extracted ${shadowTextExtracted.length} chars from Shadow DOM`);
          console.log(`Preview: "${shadowTextExtracted.substring(0, 200)}..."`);
        } else {
          console.error('❌ Could not extract any text from Shadow DOM roots');
        }
        console.groupEnd();
      }

      console.groupEnd();

      // Log which selectors we tried for debugging
      log.warn(LogCategory.SERVICE, 'Job details failed to load within timeout', {
        timeout: effectiveTimeout,
        elapsed: `${elapsed}ms`,
        attempts,
        selectorsChecked: descriptionSelectors.length,
        pageType: isSearchResults ? 'search-results' : 'direct-view',
        expandAttempted,
        shadowRoots,
        iframesFound: iframes.length,
        jobElementsFound: allJobElements.length,
      });

      // Provide more helpful error message
      console.error(`[Uproot] ❌ Job details not found after ${elapsed}ms (${attempts} attempts). Page type: ${isSearchResults ? 'search-results' : 'direct-view'}`);
      console.error('[Uproot] Possible causes:');
      console.error('  • LinkedIn changed their page structure (selectors need updating)');
      console.error('  • Content is in CLOSED Shadow DOM (browser security prevents access)');
      console.error('  • Content is in cross-origin iframe (browser security prevents access)');
      console.error('  • Job description requires manual expansion ("Show More" button not found)');
      console.error('  • Network is slow and content hasn\'t loaded yet');
      console.error('  • Page requires authentication or has rate limiting');
      console.error('');
      console.error('[Uproot] 🔍 DEBUG: Try manually inspecting the page:');
      console.error('  1. Right-click job description → Inspect');
      console.error('  2. Look for #shadow-root (open) or #shadow-root (closed)');
      console.error('  3. If closed, content is inaccessible to extensions');
      console.error('  4. Check Network tab for failed requests');

      return false;
    } catch (error) {
      observer.disconnect(); // Cleanup on error
      throw error;
    }
  });
}
