/**
 * Form Field Detector
 *
 * Auto-detects and classifies form fields on job application pages
 * using multi-heuristic pattern matching.
 *
 * Supports: Greenhouse, Lever, Workday, Indeed, and native application sites
 */

// ============================================================================
// Types & Enums
// ============================================================================

/**
 * Form field types that can be auto-filled
 */
export enum FormFieldType {
  FIRST_NAME = 'firstName',
  LAST_NAME = 'lastName',
  FULL_NAME = 'fullName',
  EMAIL = 'email',
  PHONE = 'phone',
  LOCATION = 'location',
  CITY = 'city',
  STATE = 'state',
  ZIP_CODE = 'zipCode',
  COUNTRY = 'country',
  BIRTHDAY = 'birthday',
  LINKEDIN_URL = 'linkedinUrl',
  GITHUB_URL = 'githubUrl',
  PORTFOLIO_URL = 'portfolioUrl',
  WEBSITE = 'website',
  JOB_TITLE = 'jobTitle', // Current or most recent job title
  COMPANY = 'company', // Current or most recent company
  YEARS_EXPERIENCE = 'yearsExperience', // Total years of professional experience
  SKILLS = 'skills',
  RESUME_UPLOAD = 'resumeUpload',
  COVER_LETTER_UPLOAD = 'coverLetterUpload',
  COVER_LETTER_TEXT = 'coverLetterText',
  WORK_AUTHORIZATION = 'workAuthorization',
  VETERAN_STATUS = 'veteranStatus',
  DISABILITY_STATUS = 'disabilityStatus',
  GENDER = 'gender',
  RACE_ETHNICITY = 'raceEthnicity',
  QUESTION = 'question', // Essay/text area questions
  REFERRAL = 'referral',
  UNKNOWN = 'unknown',
}

/**
 * Detected form field with metadata
 */
export interface DetectedField {
  element: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
  type: FormFieldType;
  label: string | null;
  placeholder: string | null;
  confidence: number; // 0-1 (how confident we are in the classification)
  atsSystem: string | null; // 'greenhouse', 'lever', 'workday', etc.
  debugInfo?: {
    name: string;
    id: string;
    hints: string;
    matchedPattern: string;
  };
}

/**
 * Form detection result
 */
export interface FormDetectionResult {
  fields: DetectedField[];
  atsSystem: string | null;
  isJobApplication: boolean;
  confidence: number; // Overall confidence that this is a job application
  timestamp: number;
  url: string;
}

// ============================================================================
// Form Detector Class
// ============================================================================

export class FormDetector {
  private observers: MutationObserver[] = [];

  /**
   * Detect all fillable fields on current page
   */
  detectFields(): FormDetectionResult {
    const fields: DetectedField[] = [];
    const atsSystem = this.detectAtsSystem();

    // Get all input, textarea, select elements
    const inputs = document.querySelectorAll<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>(
      'input:not([type="hidden"]):not([type="submit"]):not([type="button"]), textarea, select'
    );

    console.log(`[FormDetector] Found ${inputs.length} potential fields`);

    inputs.forEach((input) => {
      const detected = this.classifyField(input, atsSystem);
      if (detected.type !== FormFieldType.UNKNOWN || detected.confidence > 0.3) {
        fields.push(detected);
      }
    });

    // Determine if this looks like a job application
    const isJobApplication = this.isJobApplicationPage(fields);
    const overallConfidence = this.calculateOverallConfidence(fields);

    return {
      fields,
      atsSystem,
      isJobApplication,
      confidence: overallConfidence,
      timestamp: Date.now(),
      url: window.location.href,
    };
  }

  /**
   * Classify a single field using multi-heuristic approach
   */
  private classifyField(
    element: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement,
    atsSystem: string | null
  ): DetectedField {
    const name = element.getAttribute('name')?.toLowerCase() || '';
    const id = element.id?.toLowerCase() || '';
    const placeholder = (element as HTMLInputElement).placeholder?.toLowerCase() || '';
    const type = (element as HTMLInputElement).type?.toLowerCase() || '';
    const ariaLabel = element.getAttribute('aria-label')?.toLowerCase() || '';
    const autocomplete = element.getAttribute('autocomplete')?.toLowerCase() || '';

    // Get label text
    const labelText = this.getFieldLabel(element);
    const label = labelText?.toLowerCase() || '';

    // Combine all text hints
    const hints = `${name} ${id} ${placeholder} ${label} ${ariaLabel} ${autocomplete} ${type}`.toLowerCase();

    // Try pattern matching
    const classification = this.matchFieldType(hints, name, id, type, atsSystem);

    return {
      element,
      type: classification.type,
      label: labelText,
      placeholder: (element as HTMLInputElement).placeholder || null,
      confidence: classification.confidence,
      atsSystem,
      debugInfo: {
        name,
        id,
        hints,
        matchedPattern: classification.matchedPattern,
      },
    };
  }

  /**
   * Match field type using pattern matching
   */
  private matchFieldType(
    hints: string,
    name: string,
    id: string,
    type: string,
    atsSystem: string | null
  ): { type: FormFieldType; confidence: number; matchedPattern: string } {
    // Pattern library with confidence weights
    const patterns: Array<{
      type: FormFieldType;
      patterns: RegExp[];
      weight: number;
    }> = [
      // Names
      {
        type: FormFieldType.FIRST_NAME,
        patterns: [
          /\bfirst[\s_-]?name\b/,
          /\bgiven[\s_-]?name\b/,
          /\bfname\b/,
          /\bforename\b/,
        ],
        weight: 1.0,
      },
      {
        type: FormFieldType.LAST_NAME,
        patterns: [
          /\blast[\s_-]?name\b/,
          /\bsurname\b/,
          /\bfamily[\s_-]?name\b/,
          /\blname\b/,
        ],
        weight: 1.0,
      },
      {
        type: FormFieldType.FULL_NAME,
        patterns: [
          /\bfull[\s_-]?name\b/,
          /\byour[\s_-]?name\b/,
          /\bname\b(?!.*first|.*last)/,
        ],
        weight: 0.8,
      },

      // Contact
      {
        type: FormFieldType.EMAIL,
        patterns: [/\bemail\b/, /\be-?mail\b/, /autocomplete.*email/],
        weight: 1.0,
      },
      {
        type: FormFieldType.PHONE,
        patterns: [
          /\bphone\b/,
          /\bmobile\b/,
          /\btelephone\b/,
          /\btel\b/,
          /autocomplete.*tel/,
        ],
        weight: 1.0,
      },

      // Location
      {
        type: FormFieldType.LOCATION,
        patterns: [
          /\blocation\b/,
          /\baddress\b/,
          /\bwhere.*live\b/,
          /\bcurrent.*location\b/,
        ],
        weight: 0.9,
      },
      {
        type: FormFieldType.CITY,
        patterns: [/\bcity\b/, /\btown\b/, /autocomplete.*address-level2/],
        weight: 0.95,
      },
      {
        type: FormFieldType.STATE,
        patterns: [
          /\bstate\b/,
          /\bprovince\b/,
          /\bregion\b/,
          /autocomplete.*address-level1/,
        ],
        weight: 0.95,
      },
      {
        type: FormFieldType.ZIP_CODE,
        patterns: [
          /\bzip\b/,
          /\bpostal\b/,
          /\bpostcode\b/,
          /autocomplete.*postal-code/,
        ],
        weight: 0.95,
      },
      {
        type: FormFieldType.COUNTRY,
        patterns: [/\bcountry\b/, /autocomplete.*country/],
        weight: 0.95,
      },

      // Personal Info
      {
        type: FormFieldType.BIRTHDAY,
        patterns: [
          /\bbirthday\b/,
          /\bdate.*of.*birth\b/,
          /\bdob\b/,
          /\bbirth.*date\b/,
          /autocomplete.*bday/,
        ],
        weight: 1.0,
      },

      // URLs
      {
        type: FormFieldType.LINKEDIN_URL,
        patterns: [
          /\blinkedin\b/,
          /\blinked.*in\b/,
          /\blinkedin.*profile\b/,
          /\blinkedin.*url\b/,
        ],
        weight: 1.0,
      },
      {
        type: FormFieldType.GITHUB_URL,
        patterns: [/\bgithub\b/, /\bgithub.*profile\b/, /\bgithub.*url\b/],
        weight: 1.0,
      },
      {
        type: FormFieldType.PORTFOLIO_URL,
        patterns: [
          /\bportfolio\b/,
          /\bpersonal.*website\b/,
          /\bpersonal.*site\b/,
        ],
        weight: 0.9,
      },
      {
        type: FormFieldType.WEBSITE,
        patterns: [/\bwebsite\b/, /\burl\b/, /\bhomepage\b/],
        weight: 0.7,
      },

      // Skills & Documents
      {
        type: FormFieldType.SKILLS,
        patterns: [
          /\bskills?\b/,
          /\bproficienc/,
          /\btechnolog/,
          /\bexpertise\b/,
          /\bcompetenc/,
        ],
        weight: 0.9,
      },
      {
        type: FormFieldType.RESUME_UPLOAD,
        patterns: [
          /\bresume\b/,
          /\bcv\b/,
          /\bcurriculum.*vitae\b/,
          /\bupload.*resume\b/,
        ],
        weight: 1.0,
      },
      {
        type: FormFieldType.COVER_LETTER_UPLOAD,
        patterns: [/\bcover.*letter\b/, /\bupload.*cover\b/],
        weight: 1.0,
      },
      {
        type: FormFieldType.COVER_LETTER_TEXT,
        patterns: [
          /\bcover.*letter\b/,
          /\bwhy.*want.*to.*work\b/,
          /\bwhy.*interested\b/,
        ],
        weight: 0.85,
      },

      // EEO / Legal
      {
        type: FormFieldType.WORK_AUTHORIZATION,
        patterns: [
          /\bwork.*authorization\b/,
          /\bauthorized.*to.*work\b/,
          /\bvisa.*status\b/,
          /\bwork.*permit\b/,
          /\bsponsorship\b/,
        ],
        weight: 1.0,
      },
      {
        type: FormFieldType.VETERAN_STATUS,
        patterns: [
          /\bveteran\b/,
          /\bmilitary.*service\b/,
          /\bveteran.*status\b/,
        ],
        weight: 1.0,
      },
      {
        type: FormFieldType.DISABILITY_STATUS,
        patterns: [
          /\bdisabilit/,
          /\bdisabled\b/,
          /\baccommodation/,
          /\bada\b/,
        ],
        weight: 1.0,
      },
      {
        type: FormFieldType.GENDER,
        patterns: [/\bgender\b/, /\bsex\b(?!.*offender)/],
        weight: 0.95,
      },
      {
        type: FormFieldType.RACE_ETHNICITY,
        patterns: [
          /\brace\b/,
          /\bethnicity\b/,
          /\brace.*ethnicity\b/,
          /\bdemographic/,
        ],
        weight: 0.95,
      },

      // Questions
      {
        type: FormFieldType.QUESTION,
        patterns: [
          /\bwhy\b/,
          /\bdescribe\b/,
          /\btell.*us\b/,
          /\bexplain\b/,
          /\bhow.*would\b/,
          /\bwhat.*makes\b/,
          /\badditional.*information\b/,
        ],
        weight: 0.7,
      },

      // Referral
      {
        type: FormFieldType.REFERRAL,
        patterns: [
          /\breferral\b/,
          /\breferred.*by\b/,
          /\bhow.*did.*you.*hear\b/,
          /\bsource\b/,
        ],
        weight: 0.9,
      },
    ];

    // Try to match against patterns - collect ALL matches, not just first
    let bestMatch: { type: FormFieldType; confidence: number; matchedPattern: string } | null = null;

    for (const { type: fieldType, patterns: regexes, weight } of patterns) {
      for (const regex of regexes) {
        if (regex.test(hints)) {
          // Calculate confidence based on:
          // 1. Base weight from pattern
          // 2. Match quality (exact vs partial)
          // 3. ATS-specific boost
          let confidence = weight;

          // Boost if matched in name or id (more reliable than placeholder)
          if (regex.test(name) || regex.test(id)) {
            confidence = Math.min(1.0, confidence + 0.1);
          }

          // Boost if ATS system detected (more standardized forms)
          if (atsSystem) {
            confidence = Math.min(1.0, confidence + 0.05);
          }

          // Boost if type matches (e.g., type="email")
          if (type === 'email' && fieldType === FormFieldType.EMAIL) {
            confidence = 1.0;
          }
          if (type === 'tel' && fieldType === FormFieldType.PHONE) {
            confidence = 1.0;
          }
          if (type === 'url' && (fieldType === FormFieldType.LINKEDIN_URL || fieldType === FormFieldType.GITHUB_URL || fieldType === FormFieldType.PORTFOLIO_URL || fieldType === FormFieldType.WEBSITE)) {
            confidence = Math.min(1.0, confidence + 0.15); // Strong boost for URL fields
          }
          if (type === 'file' && (fieldType === FormFieldType.RESUME_UPLOAD || fieldType === FormFieldType.COVER_LETTER_UPLOAD)) {
            confidence = Math.min(1.0, confidence + 0.1);
          }

          // Keep the best match (highest confidence)
          if (!bestMatch || confidence > bestMatch.confidence) {
            bestMatch = {
              type: fieldType,
              confidence,
              matchedPattern: regex.source,
            };
          }
        }
      }
    }

    // Return best match or unknown
    if (bestMatch) {
      return bestMatch;
    }

    return {
      type: FormFieldType.UNKNOWN,
      confidence: 0,
      matchedPattern: 'none',
    };
  }

  /**
   * Get label text for a field
   */
  private getFieldLabel(element: HTMLElement): string | null {
    // Try aria-label first
    const ariaLabel = element.getAttribute('aria-label');
    if (ariaLabel) return ariaLabel;

    // Try aria-labelledby
    const labelledBy = element.getAttribute('aria-labelledby');
    if (labelledBy) {
      const labelElement = document.getElementById(labelledBy);
      if (labelElement) return labelElement.textContent?.trim() || null;
    }

    // Try associated <label> element
    if (element.id) {
      const label = document.querySelector<HTMLLabelElement>(`label[for="${element.id}"]`);
      if (label) return label.textContent?.trim() || null;
    }

    // Try parent label
    const parentLabel = element.closest('label');
    if (parentLabel) {
      // Get text but exclude nested input text
      const clone = parentLabel.cloneNode(true) as HTMLLabelElement;
      const nestedInputs = clone.querySelectorAll('input, textarea, select');
      nestedInputs.forEach(input => input.remove());
      return clone.textContent?.trim() || null;
    }

    // Try previous sibling label
    const previousSibling = element.previousElementSibling;
    if (previousSibling?.tagName === 'LABEL') {
      return previousSibling.textContent?.trim() || null;
    }

    return null;
  }

  /**
   * Detect which ATS system is being used
   */
  private detectAtsSystem(): string | null {
    const url = window.location.hostname.toLowerCase();
    const html = document.documentElement.innerHTML.toLowerCase();

    // URL-based detection (most reliable)
    if (url.includes('greenhouse.io')) return 'greenhouse';
    if (url.includes('lever.co')) return 'lever';
    if (url.includes('myworkdayjobs.com') || url.includes('myworkday')) return 'workday';
    if (url.includes('indeed.com')) return 'indeed';
    if (url.includes('taleo.net')) return 'taleo';
    if (url.includes('icims.com')) return 'icims';
    if (url.includes('ultipro.com') || url.includes('ulti.pro')) return 'ultipro';
    if (url.includes('smartrecruiters.com')) return 'smartrecruiters';
    if (url.includes('ashbyhq.com')) return 'ashby';
    if (url.includes('jobvite.com')) return 'jobvite';

    // HTML content detection (fallback)
    if (html.includes('greenhouse')) return 'greenhouse';
    if (html.includes('lever-frame') || html.includes('lever.co')) return 'lever';
    if (html.includes('workday')) return 'workday';
    if (html.includes('taleo')) return 'taleo';
    if (html.includes('icims')) return 'icims';

    return null;
  }

  /**
   * Determine if current page is a job application
   */
  private isJobApplicationPage(fields: DetectedField[]): boolean {
    const url = window.location.href.toLowerCase();

    // URL-based detection
    const jobUrlPatterns = [
      /apply/,
      /application/,
      /job.*form/,
      /careers/,
      /jobs/,
      /greenhouse\.io/,
      /lever\.co/,
      /workday/,
      /indeed\.com/,
    ];

    if (jobUrlPatterns.some(pattern => pattern.test(url))) {
      return true;
    }

    // Field-based detection (needs at least 3 common job application fields)
    const commonJobFields = [
      FormFieldType.FIRST_NAME,
      FormFieldType.LAST_NAME,
      FormFieldType.FULL_NAME,
      FormFieldType.EMAIL,
      FormFieldType.PHONE,
      FormFieldType.RESUME_UPLOAD,
      FormFieldType.COVER_LETTER_UPLOAD,
      FormFieldType.COVER_LETTER_TEXT,
      FormFieldType.WORK_AUTHORIZATION,
    ];

    const matchedFieldTypes = new Set(
      fields
        .filter(f => f.confidence > 0.5)
        .map(f => f.type)
    );

    const commonFieldCount = commonJobFields.filter(type =>
      matchedFieldTypes.has(type)
    ).length;

    return commonFieldCount >= 3;
  }

  /**
   * Calculate overall confidence that this is a job application
   */
  private calculateOverallConfidence(fields: DetectedField[]): number {
    if (fields.length === 0) return 0;

    // Average confidence of all detected fields
    const avgFieldConfidence =
      fields.reduce((sum, f) => sum + f.confidence, 0) / fields.length;

    // Bonus for having many high-confidence fields
    const highConfidenceFields = fields.filter(f => f.confidence > 0.8).length;
    const highConfidenceBonus = Math.min(0.2, highConfidenceFields * 0.02);

    // Bonus for ATS system detection
    const atsBonus = this.detectAtsSystem() ? 0.1 : 0;

    return Math.min(1.0, avgFieldConfidence + highConfidenceBonus + atsBonus);
  }

  /**
   * Start observing for dynamic form fields
   */
  startObserving(callback: (result: FormDetectionResult) => void): void {
    const observer = new MutationObserver((mutations) => {
      // Debounce: only re-detect if significant DOM changes
      const hasNewInputs = mutations.some((mutation) =>
        Array.from(mutation.addedNodes).some(
          (node) =>
            node.nodeType === Node.ELEMENT_NODE &&
            (node as Element).matches('input, textarea, select')
        )
      );

      if (hasNewInputs) {
        console.log('[FormDetector] New form fields detected, re-scanning...');
        const result = this.detectFields();
        callback(result);
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    this.observers.push(observer);
    console.log('[FormDetector] Started observing for dynamic form changes');
  }

  /**
   * Stop observing
   */
  stopObserving(): void {
    this.observers.forEach((obs) => obs.disconnect());
    this.observers = [];
    console.log('[FormDetector] Stopped observing');
  }

  /**
   * Get debug summary of detection results
   */
  getDebugSummary(result: FormDetectionResult): string {
    const lines = [
      '='.repeat(80),
      'FORM DETECTION RESULTS',
      '='.repeat(80),
      '',
      `URL: ${result.url}`,
      `ATS System: ${result.atsSystem || 'Unknown'}`,
      `Is Job Application: ${result.isJobApplication ? 'YES' : 'NO'}`,
      `Overall Confidence: ${(result.confidence * 100).toFixed(1)}%`,
      `Fields Detected: ${result.fields.length}`,
      '',
      'DETECTED FIELDS:',
      '-'.repeat(80),
    ];

    // Sort by confidence (highest first)
    const sortedFields = [...result.fields].sort((a, b) => b.confidence - a.confidence);

    sortedFields.forEach((field, index) => {
      const confidencePercent = (field.confidence * 100).toFixed(1);
      const typeStr = field.type.padEnd(20);
      const labelStr = (field.label || '(no label)').substring(0, 40).padEnd(40);

      lines.push(
        `${(index + 1).toString().padStart(3)}. [${confidencePercent}%] ${typeStr} | ${labelStr}`
      );

      if (field.debugInfo) {
        lines.push(`     Name: ${field.debugInfo.name || '(none)'}`);
        lines.push(`     ID: ${field.debugInfo.id || '(none)'}`);
        lines.push(`     Pattern: ${field.debugInfo.matchedPattern}`);
        lines.push('');
      }
    });

    lines.push('='.repeat(80));

    return lines.join('\n');
  }
}
