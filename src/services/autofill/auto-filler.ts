/**
 * Auto-Fill Engine
 *
 * Automatically fills job application forms using:
 * - FormDetector (detects fields)
 * - AutofillStorage (gets user data)
 * - Visual feedback (highlights filled fields)
 */

import { FormDetector, FormFieldType, type DetectedField } from './form-detector';
import { getAutofillProfile } from '../../utils/autofill-storage';
import type { AutofillProfile } from '../../types/autofill';

// ============================================================================
// Types
// ============================================================================

export interface AutoFillOptions {
  visualFeedback?: boolean; // Show green highlights on filled fields
  skipLowConfidence?: boolean; // Skip fields with confidence < 0.5
  confidenceThreshold?: number; // Minimum confidence to auto-fill (default: 0.5)
  fillDelay?: number; // Delay between filling fields in ms (default: 100)
  onFieldFilled?: (field: DetectedField, value: string) => void;
  onComplete?: (filledCount: number, totalCount: number) => void;
}

export interface AutoFillResult {
  success: boolean;
  filledCount: number;
  totalFields: number;
  skippedFields: number;
  errors: Array<{
    field: DetectedField;
    error: string;
  }>;
}

// ============================================================================
// Auto-Fill Engine
// ============================================================================

export class AutoFiller {
  private detector: FormDetector;
  private profile: AutofillProfile | null = null;

  constructor() {
    this.detector = new FormDetector();
  }

  /**
   * Auto-fill all detected fields on current page
   */
  async autoFill(options: AutoFillOptions = {}): Promise<AutoFillResult> {
    const {
      visualFeedback = true,
      skipLowConfidence = true,
      confidenceThreshold = 0.5,
      fillDelay = 100,
      onFieldFilled,
      onComplete,
    } = options;

    console.log('[AutoFiller] Starting auto-fill process...');

    // Load user profile
    this.profile = await getAutofillProfile();
    if (!this.profile || !this.profile.email) {
      console.warn('[AutoFiller] No autofill profile found. Please set up your profile in Account Settings.');
      return {
        success: false,
        filledCount: 0,
        totalFields: 0,
        skippedFields: 0,
        errors: [{ field: null as any, error: 'No autofill profile found' }],
      };
    }

    // Detect fields
    const detectionResult = this.detector.detectFields();
    console.log(`[AutoFiller] Detected ${detectionResult.fields.length} fields`);

    const result: AutoFillResult = {
      success: true,
      filledCount: 0,
      totalFields: detectionResult.fields.length,
      skippedFields: 0,
      errors: [],
    };

    // Fill each field
    for (const field of detectionResult.fields) {
      // Skip low confidence fields
      if (skipLowConfidence && field.confidence < confidenceThreshold) {
        result.skippedFields++;
        console.log(`[AutoFiller] Skipping ${field.type} (confidence: ${(field.confidence * 100).toFixed(1)}%)`);
        continue;
      }

      // Get value for this field type
      const value = this.getValueForField(field);
      if (!value) {
        result.skippedFields++;
        continue;
      }

      // Fill the field
      try {
        await this.fillField(field, value, visualFeedback);
        result.filledCount++;
        console.log(`[AutoFiller] ✅ Filled ${field.type}: ${value.substring(0, 30)}...`);

        if (onFieldFilled) {
          onFieldFilled(field, value);
        }

        // Delay between fills (avoid triggering anti-bot detection)
        if (fillDelay > 0) {
          await new Promise((resolve) => setTimeout(resolve, fillDelay));
        }
      } catch (error) {
        result.errors.push({
          field,
          error: (error as Error).message,
        });
        console.error(`[AutoFiller] ❌ Failed to fill ${field.type}:`, error);
      }
    }

    console.log(`[AutoFiller] Complete: ${result.filledCount}/${result.totalFields} fields filled`);

    if (onComplete) {
      onComplete(result.filledCount, result.totalFields);
    }

    return result;
  }

  /**
   * Get value for a specific field type
   */
  private getValueForField(field: DetectedField): string | null {
    if (!this.profile) return null;

    switch (field.type) {
      case FormFieldType.FIRST_NAME:
        return this.profile.firstName;

      case FormFieldType.LAST_NAME:
        return this.profile.lastName;

      case FormFieldType.FULL_NAME:
        return this.profile.fullName || `${this.profile.firstName} ${this.profile.lastName}`;

      case FormFieldType.EMAIL:
        return this.profile.email;

      case FormFieldType.PHONE:
        return this.profile.phone;

      case FormFieldType.LOCATION:
        return this.profile.location;

      case FormFieldType.CITY:
        return this.profile.address?.city || this.extractCity(this.profile.location);

      case FormFieldType.STATE:
        return this.profile.address?.state || this.extractState(this.profile.location);

      case FormFieldType.ZIP_CODE:
        return this.profile.address?.zipCode || '';

      case FormFieldType.COUNTRY:
        return this.profile.address?.country || 'United States';

      case FormFieldType.BIRTHDAY:
        return this.profile.birthday || '';

      case FormFieldType.LINKEDIN_URL:
        return this.profile.linkedinUrl || '';

      case FormFieldType.GITHUB_URL:
        return this.profile.githubUrl || '';

      case FormFieldType.PORTFOLIO_URL:
        return this.profile.portfolioUrl || '';

      case FormFieldType.WEBSITE:
        return this.profile.websiteUrl || this.profile.portfolioUrl || '';

      case FormFieldType.JOB_TITLE:
        return this.profile.currentJobTitle || '';

      case FormFieldType.COMPANY:
        return this.profile.currentCompany || '';

      case FormFieldType.YEARS_EXPERIENCE:
        return this.profile.totalYearsExperience ? this.profile.totalYearsExperience.toString() : '';

      case FormFieldType.WORK_AUTHORIZATION:
        return this.mapWorkAuthorizationToValue(this.profile.workAuthorization);

      case FormFieldType.VETERAN_STATUS:
        return this.mapVeteranStatusToValue(this.profile.veteranStatus);

      case FormFieldType.GENDER:
        return this.mapGenderToValue(this.profile.gender);

      // Skip these field types - require special handling
      case FormFieldType.SKILLS:
      case FormFieldType.RESUME_UPLOAD:
      case FormFieldType.COVER_LETTER_UPLOAD:
      case FormFieldType.COVER_LETTER_TEXT:
      case FormFieldType.QUESTION:
      case FormFieldType.REFERRAL:
        return null;

      default:
        return null;
    }
  }

  /**
   * Fill a single field with value
   */
  private async fillField(
    field: DetectedField,
    value: string,
    visualFeedback: boolean
  ): Promise<void> {
    const element = field.element;

    // Set value
    if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) {
      element.value = value;
    } else if (element instanceof HTMLSelectElement) {
      // Try to find matching option
      const option = Array.from(element.options).find(
        (opt) => opt.value === value || opt.textContent?.toLowerCase() === value.toLowerCase()
      );
      if (option) {
        element.value = option.value;
      }
    }

    // Trigger events (some forms need this to validate)
    element.dispatchEvent(new Event('input', { bubbles: true }));
    element.dispatchEvent(new Event('change', { bubbles: true }));
    element.dispatchEvent(new Event('blur', { bubbles: true }));

    // Visual feedback
    if (visualFeedback) {
      this.addVisualFeedback(element);
    }
  }

  /**
   * Add visual feedback (green highlight) to filled field
   */
  private addVisualFeedback(element: HTMLElement): void {
    const originalBackground = element.style.backgroundColor;
    const originalTransition = element.style.transition;

    // Add green highlight
    element.style.transition = 'background-color 0.3s ease';
    element.style.backgroundColor = '#D4EDDA'; // Light green

    // Add checkmark icon
    const checkmark = document.createElement('span');
    checkmark.textContent = '✓';
    checkmark.style.cssText = `
      position: absolute;
      right: 8px;
      top: 50%;
      transform: translateY(-50%);
      color: #28A745;
      font-weight: bold;
      font-size: 16px;
      pointer-events: none;
      z-index: 10;
    `;

    // Position parent relatively if needed
    const parent = element.parentElement;
    if (parent && getComputedStyle(parent).position === 'static') {
      parent.style.position = 'relative';
    }

    if (parent) {
      parent.appendChild(checkmark);
    }

    // Fade out after 2 seconds
    setTimeout(() => {
      element.style.backgroundColor = originalBackground;
      element.style.transition = originalTransition;
      if (checkmark.parentElement) {
        checkmark.remove();
      }
    }, 2000);
  }

  /**
   * Extract city from location string ("San Francisco, CA" -> "San Francisco")
   */
  private extractCity(location: string): string {
    const parts = location.split(',');
    return parts[0]?.trim() || '';
  }

  /**
   * Extract state from location string ("San Francisco, CA" -> "CA")
   */
  private extractState(location: string): string {
    const parts = location.split(',');
    return parts[1]?.trim() || '';
  }

  /**
   * Map work authorization enum to form value
   */
  private mapWorkAuthorizationToValue(auth?: string): string {
    if (!auth || auth === 'prefer_not_to_say') return '';

    const mapping: Record<string, string[]> = {
      us_citizen: ['yes', 'citizen', 'us citizen', 'authorized'],
      green_card: ['yes', 'permanent resident', 'green card'],
      visa: ['yes', 'visa', 'work visa'],
      need_sponsorship: ['no', 'need sponsorship', 'require sponsorship'],
    };

    const values = mapping[auth];
    return values ? values[0] : '';
  }

  /**
   * Map veteran status enum to form value
   */
  private mapVeteranStatusToValue(status?: string): string {
    if (!status || status === 'prefer_not_to_say') return '';

    const mapping: Record<string, string> = {
      not_veteran: 'no',
      veteran: 'yes',
      disabled_veteran: 'disabled veteran',
    };

    return mapping[status] || '';
  }

  /**
   * Map gender enum to form value
   */
  private mapGenderToValue(gender?: string): string {
    if (!gender || gender === 'prefer_not_to_say') return '';

    const mapping: Record<string, string> = {
      male: 'male',
      female: 'female',
      non_binary: 'non-binary',
      self_describe: '',
    };

    return mapping[gender] || '';
  }

  /**
   * Show notification to user
   */
  showNotification(message: string, type: 'success' | 'info' | 'warning' | 'error' = 'info'): void {
    const notification = document.createElement('div');

    const colors = {
      success: { bg: '#D4EDDA', border: '#28A745', text: '#155724' },
      info: { bg: '#D1ECF1', border: '#17A2B8', text: '#0C5460' },
      warning: { bg: '#FFF3CD', border: '#FFC107', text: '#856404' },
      error: { bg: '#F8D7DA', border: '#DC3545', text: '#721C24' },
    };

    const color = colors[type];

    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: ${color.bg};
      border: 2px solid ${color.border};
      border-radius: 8px;
      padding: 16px 20px;
      color: ${color.text};
      font-family: system-ui, -apple-system, sans-serif;
      font-size: 14px;
      font-weight: 500;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      z-index: 2147483646;
      isolation: isolate;
      max-width: 400px;
      animation: slideIn 0.3s ease-out;
    `;

    notification.textContent = message;
    document.body.appendChild(notification);

    // Remove after 3 seconds
    setTimeout(() => {
      notification.style.animation = 'slideOut 0.3s ease-out';
      setTimeout(() => {
        notification.remove();
      }, 300);
    }, 3000);
  }

  /**
   * Start observing for dynamic form changes
   */
  startObserving(callback: () => void): void {
    this.detector.startObserving((result) => {
      console.log(`[AutoFiller] Detected ${result.fields.length} new fields`);
      callback();
    });
  }

  /**
   * Stop observing
   */
  stopObserving(): void {
    this.detector.stopObserving();
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

let autoFillerInstance: AutoFiller | null = null;

/**
 * Get singleton AutoFiller instance
 */
export function getAutoFiller(): AutoFiller {
  if (!autoFillerInstance) {
    autoFillerInstance = new AutoFiller();
  }
  return autoFillerInstance;
}
