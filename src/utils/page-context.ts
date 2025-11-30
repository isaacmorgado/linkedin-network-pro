/**
 * Page Context Detection
 *
 * Detects what type of page we're on to determine which UI to show:
 * - LinkedIn: Show full FloatingPanel with all tabs
 * - Third-party job site: Show MinimalAutofillPanel (Generate only)
 * - Other: Hide extension
 */

import { log, LogCategory } from './logger';

// ============================================================================
// Types
// ============================================================================

export type PageContext = 'linkedin' | 'job-application' | 'other';

export interface PageInfo {
  context: PageContext;
  url: string;
  hostname: string;
  pathname: string;
  isLinkedIn: boolean;
  isJobApplication: boolean;
  atsSystem: string | null; // 'greenhouse', 'lever', 'workday', etc.
  confidence: number; // 0-1 scale
}

// ============================================================================
// ATS System Detection
// ============================================================================

/**
 * Known ATS systems and their URL patterns
 */
const ATS_SYSTEMS: Array<{
  name: string;
  patterns: RegExp[];
  weight: number;
}> = [
  {
    name: 'greenhouse',
    patterns: [
      /greenhouse\.io/i,
      /boards\.greenhouse\.io/i,
      /grnh\.se/i,
    ],
    weight: 1.0,
  },
  {
    name: 'lever',
    patterns: [
      /lever\.co/i,
      /jobs\.lever\.co/i,
    ],
    weight: 1.0,
  },
  {
    name: 'workday',
    patterns: [
      /myworkday\.com/i,
      /myworkdayjobs\.com/i,
      /wd\d+\.myworkday\.com/i,
    ],
    weight: 1.0,
  },
  {
    name: 'indeed',
    patterns: [
      /indeed\.com\/viewjob/i,
      /indeed\.com\/cmp\//i,
      /indeed\.com\/jobs/i,
    ],
    weight: 1.0,
  },
  {
    name: 'taleo',
    patterns: [
      /taleo\.net/i,
      /tbe\.taleo\.net/i,
    ],
    weight: 1.0,
  },
  {
    name: 'icims',
    patterns: [
      /icims\.com/i,
      /careers\-.*\.icims\.com/i,
    ],
    weight: 1.0,
  },
  {
    name: 'ultipro',
    patterns: [
      /ultipro\.com/i,
      /recruiting\.ultipro\.com/i,
    ],
    weight: 1.0,
  },
  {
    name: 'smartrecruiters',
    patterns: [
      /smartrecruiters\.com/i,
      /jobs\.smartrecruiters\.com/i,
    ],
    weight: 1.0,
  },
  {
    name: 'ashby',
    patterns: [
      /ashbyhq\.com/i,
      /jobs\.ashbyhq\.com/i,
    ],
    weight: 1.0,
  },
  {
    name: 'jobvite',
    patterns: [
      /jobvite\.com/i,
      /jobs\.jobvite\.com/i,
    ],
    weight: 1.0,
  },
];

/**
 * Detect ATS system from URL
 */
function detectATSSystem(url: string, hostname: string): string | null {
  for (const { name, patterns } of ATS_SYSTEMS) {
    for (const pattern of patterns) {
      if (pattern.test(url) || pattern.test(hostname)) {
        log.info(LogCategory.CONTENT_SCRIPT, 'ATS system detected', {
          system: name,
          url,
          hostname,
        });
        return name;
      }
    }
  }
  return null;
}

// ============================================================================
// Job Application Detection
// ============================================================================

/**
 * Heuristics to detect if a page is a job application form
 */
function isJobApplicationPage(): { isApplication: boolean; confidence: number } {
  const url = window.location.href.toLowerCase();
  const hostname = window.location.hostname.toLowerCase();
  const pathname = window.location.pathname.toLowerCase();

  let confidence = 0;

  // Check ATS system (strong signal)
  const atsSystem = detectATSSystem(url, hostname);
  if (atsSystem) {
    confidence += 0.5;
  }

  // Check URL patterns
  const jobUrlPatterns = [
    /\/jobs?\//i,
    /\/careers?\//i,
    /\/apply/i,
    /\/application/i,
    /\/position/i,
    /\/opportunities/i,
    /\/openings?/i,
    /\/job-?post/i,
    /\/employment/i,
  ];

  for (const pattern of jobUrlPatterns) {
    if (pattern.test(url) || pattern.test(pathname)) {
      confidence += 0.2;
      break;
    }
  }

  // Check for form elements (on page load might not have detected yet)
  if (typeof document !== 'undefined' && document.readyState === 'complete') {
    const forms = document.querySelectorAll('form');
    const inputs = document.querySelectorAll('input[type="text"], input[type="email"], input[type="file"]');
    const textareas = document.querySelectorAll('textarea');

    // If page has form elements that look like application fields
    if (forms.length > 0 && (inputs.length >= 3 || textareas.length >= 1)) {
      confidence += 0.2;
    }

    // Check for common job application field names
    const applicationFieldPatterns = [
      /name/i,
      /email/i,
      /phone/i,
      /resume/i,
      /cover.*letter/i,
      /linkedin/i,
      /portfolio/i,
    ];

    let matchedFields = 0;
    inputs.forEach((input) => {
      const name = input.getAttribute('name') || '';
      const id = input.id || '';
      const placeholder = (input as HTMLInputElement).placeholder || '';
      const combined = `${name} ${id} ${placeholder}`.toLowerCase();

      for (const pattern of applicationFieldPatterns) {
        if (pattern.test(combined)) {
          matchedFields++;
          break;
        }
      }
    });

    if (matchedFields >= 3) {
      confidence += 0.1;
    }
  }

  // Cap confidence at 1.0
  confidence = Math.min(1.0, confidence);

  log.info(LogCategory.CONTENT_SCRIPT, 'Job application detection', {
    isApplication: confidence >= 0.5,
    confidence,
    url,
    hostname,
  });

  return {
    isApplication: confidence >= 0.5,
    confidence,
  };
}

// ============================================================================
// Page Context Detection
// ============================================================================

/**
 * Detect current page context
 */
export function detectPageContext(): PageInfo {
  const url = window.location.href;
  const hostname = window.location.hostname;
  const pathname = window.location.pathname;

  // Check if LinkedIn
  const isLinkedIn = hostname.includes('linkedin.com');

  // Determine context
  let context: PageContext;
  let atsSystem: string | null = null;
  let confidence = 0;

  if (isLinkedIn) {
    context = 'linkedin';
    confidence = 1.0;
    log.info(LogCategory.CONTENT_SCRIPT, 'Page context: LinkedIn', {
      url,
      hostname,
      pathname,
    });
  } else {
    // Check if job application site
    atsSystem = detectATSSystem(url, hostname);
    const { isApplication, confidence: appConfidence } = isJobApplicationPage();

    if (isApplication) {
      context = 'job-application';
      confidence = appConfidence;
      log.info(LogCategory.CONTENT_SCRIPT, 'Page context: Job Application', {
        url,
        hostname,
        pathname,
        atsSystem,
        confidence,
      });
    } else {
      context = 'other';
      confidence = 0;
      log.info(LogCategory.CONTENT_SCRIPT, 'Page context: Other', {
        url,
        hostname,
        pathname,
      });
    }
  }

  return {
    context,
    url,
    hostname,
    pathname,
    isLinkedIn,
    isJobApplication: context === 'job-application',
    atsSystem,
    confidence,
  };
}

/**
 * Check if extension should be active on current page
 */
export function shouldShowExtension(pageInfo: PageInfo): boolean {
  // Show on LinkedIn (full panel)
  if (pageInfo.isLinkedIn) {
    return true;
  }

  // Show on job application sites (minimal panel)
  if (pageInfo.isJobApplication && pageInfo.confidence >= 0.5) {
    return true;
  }

  // Hide on other sites
  return false;
}

/**
 * Get appropriate panel type for current page
 */
export function getPanelType(pageInfo: PageInfo): 'full' | 'minimal' | 'none' {
  if (pageInfo.isLinkedIn) {
    return 'full'; // Full FloatingPanel with all tabs
  }

  if (pageInfo.isJobApplication && pageInfo.confidence >= 0.5) {
    return 'minimal'; // MinimalAutofillPanel (Generate only)
  }

  return 'none'; // Don't show extension
}
