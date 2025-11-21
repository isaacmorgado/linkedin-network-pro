# Autofill Feature Architecture
**NordPass-Style Form Autofill + AI Question Answering**

**Date**: November 21, 2025
**Status**: 🏗️ **ARCHITECTURE PHASE** - Ready for Implementation
**Complexity**: HIGH (Chrome APIs + Form Detection + Context-Aware UI)

---

## 📋 Executive Summary

### What We're Building

A comprehensive autofill system that:
1. **Auto-detects and fills** job application forms across ANY website (Greenhouse, Lever, Workday, Indeed, native sites)
2. **Stores user profile data** in Account Settings (name, birthday, skills, etc.)
3. **Question bank** with AI-generated answers based on JD analysis
4. **Keyboard shortcuts** for power users (Alt+1, Alt+2, Alt+Enter)
5. **Context-aware UI** - minimal on third-party sites, full tabs on LinkedIn

### Integration Points

**Reuses existing features:**
- ✅ Keyword extractor
- ✅ ATS resume generator (PDF/DOCX export)
- ✅ Cover letter generator (PDF/DOCX export)
- ✅ Professional profile storage
- ✅ Job description analysis

**New components:**
- 🆕 Form field detection engine
- 🆕 Autofill profile storage
- 🆕 Question bank storage
- 🆕 Chrome keyboard shortcuts
- 🆕 Context menu integration
- 🆕 Context-aware UI renderer

---

## 🎯 User Requirements (Explicit from User)

### 1. Form Detection & Autofill
- **Trigger Options:**
  - Auto-detect form fields on page load
  - Click extension icon to manually trigger
  - Press `Alt+1` to open extension
- **Supported Sites:** Greenhouse, Lever, Workday, Indeed, native job application sites
- **Fields to Match:** name, last name, birthday, email, phone, location, skills, etc.

### 2. Data Storage
- **Autofill Profile:** Stored in Account Settings under Settings tab
  - Name, birthday, email, phone, location
  - Skills (full list for auto-selection)
  - Other common application fields
- **Question Bank:** Stored in Account Settings
  - User-saved questions with AI-generated answers
  - Tagged by job (based on JD)

### 3. Question Saving
- **Method 1:** Highlight question → Right-click → "Save with Uproot"
- **Method 2:** Highlight question → Press `Alt+2`
- **Storage:** Questions saved to Account Settings

### 4. AI Answer Generation
- **Workflow:**
  1. User copies JD and pastes into "Generate" section (Resume tab)
  2. User highlights question on form
  3. User presses `Alt+Enter`
  4. Question auto-copied and pasted into Generate feature
  5. AI generates response based on JD + user profile
- **NO auto-detection** - user initiates with highlight + Alt+Enter
- **Auto-select skills** from user's full skill list based on JD keywords

### 5. Context-Aware UI
- **LinkedIn pages:** Show all tabs normally (Feed, Watchlist, Resume, Profile, Settings, etc.)
- **Third-party sites:** Floating panel shows ONLY "Generate" section from Resume tab
  - Panel still resizable
  - Minimal UI to avoid clutter

### 6. Integration Requirements
- ✅ Reuse keyword extractor
- ✅ Connect to ATS resume generator (PDF/DOCX export)
- ✅ Connect to cover letter generator (PDF/DOCX export)
- ✅ Ensure all existing features still work

---

## 🏗️ Technical Architecture

### **Phase 1: Chrome Extension APIs** (Foundation)

#### 1.1 Manifest Permissions (wxt.config.ts)

**Current permissions:**
```typescript
permissions: [
  'storage',
  'alarms',
  'notifications',
  'identity',
  'activeTab',
  'scripting',
]
```

**New permissions needed:**
```typescript
permissions: [
  'storage',
  'alarms',
  'notifications',
  'identity',
  'activeTab',
  'scripting',
  'contextMenus',  // NEW: Right-click "Save with Uproot"
  'commands',      // NEW: Keyboard shortcuts (Alt+1, Alt+2, Alt+Enter)
]

host_permissions: [
  'https://www.linkedin.com/*',
  'https://*.supabase.co/*',
  'https://*/*',  // NEW: Access all sites for form detection
]
```

#### 1.2 Keyboard Commands

**File:** `wxt.config.ts` (add commands field to manifest)

```typescript
manifest: {
  // ... existing fields
  commands: {
    'open-extension': {
      suggested_key: {
        default: 'Alt+1',
        mac: 'Alt+1',
      },
      description: 'Open Uproot extension panel',
    },
    'save-question': {
      suggested_key: {
        default: 'Alt+2',
        mac: 'Alt+2',
      },
      description: 'Save highlighted question to question bank',
    },
    'paste-to-generate': {
      suggested_key: {
        default: 'Alt+Enter',
        mac: 'Alt+Enter',
      },
      description: 'Copy highlighted question to Generate section',
    },
  },
}
```

#### 1.3 Context Menu

**File:** `src/entrypoints/background.ts` (add context menu creation)

```typescript
// On extension install/update
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'save-with-uproot',
    title: 'Save with Uproot',
    contexts: ['selection'], // Only show when text is selected
  });
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'save-with-uproot' && info.selectionText) {
    // Send message to content script to save question
    chrome.tabs.sendMessage(tab.id, {
      type: 'SAVE_QUESTION',
      question: info.selectionText,
    });
  }
});
```

---

### **Phase 2: Form Detection Engine** (Core)

#### 2.1 Form Field Detector

**New File:** `src/services/autofill/form-detector.ts`

**Responsibilities:**
- Detect input fields on ANY website (not just LinkedIn)
- Classify field types (name, email, birthday, skills, etc.)
- Support dynamic forms (MutationObserver)
- Handle different ATS systems (Greenhouse, Lever, Workday, etc.)

**Strategy:**

**Pattern Matching (Multi-Heuristic):**
1. **Field name/id attributes** (e.g., `name="first_name"`, `id="applicant-email"`)
2. **Label text** (e.g., `<label>First Name</label>`)
3. **Placeholder text** (e.g., `placeholder="Enter your email"`)
4. **ARIA labels** (e.g., `aria-label="Phone number"`)
5. **Common patterns by ATS:**
   - Greenhouse: `greenhouse-first-name`, `greenhouse-email`
   - Lever: `lever-input-name`, `lever-input-email`
   - Workday: `input[data-automation-id*="email"]`

**Field Type Classification:**
```typescript
export enum FormFieldType {
  FIRST_NAME = 'firstName',
  LAST_NAME = 'lastName',
  FULL_NAME = 'fullName',
  EMAIL = 'email',
  PHONE = 'phone',
  LOCATION = 'location',
  BIRTHDAY = 'birthday',
  SKILLS = 'skills',
  RESUME_UPLOAD = 'resumeUpload',
  COVER_LETTER = 'coverLetter',
  QUESTION = 'question', // Essay/text area questions
  UNKNOWN = 'unknown',
}

export interface DetectedField {
  element: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
  type: FormFieldType;
  label: string | null;
  confidence: number; // 0-1 (how confident we are in the classification)
  atsSystem: string | null; // 'greenhouse', 'lever', 'workday', etc.
}

export interface FormDetectionResult {
  fields: DetectedField[];
  atsSystem: string | null;
  timestamp: number;
}
```

**Implementation:**
```typescript
export class FormDetector {
  private observers: MutationObserver[] = [];

  /**
   * Detect all fillable fields on current page
   */
  detectFields(): FormDetectionResult {
    const fields: DetectedField[] = [];

    // Get all input, textarea, select elements
    const inputs = document.querySelectorAll('input, textarea, select');

    inputs.forEach((input) => {
      const detected = this.classifyField(input as HTMLInputElement);
      if (detected.type !== FormFieldType.UNKNOWN) {
        fields.push(detected);
      }
    });

    return {
      fields,
      atsSystem: this.detectAtsSystem(),
      timestamp: Date.now(),
    };
  }

  /**
   * Classify a single field using multi-heuristic approach
   */
  private classifyField(element: HTMLInputElement): DetectedField {
    const name = element.name?.toLowerCase() || '';
    const id = element.id?.toLowerCase() || '';
    const placeholder = element.placeholder?.toLowerCase() || '';
    const label = this.getFieldLabel(element)?.toLowerCase() || '';
    const ariaLabel = element.getAttribute('aria-label')?.toLowerCase() || '';

    // Combine all text hints
    const hints = `${name} ${id} ${placeholder} ${label} ${ariaLabel}`;

    // Pattern matching
    const patterns: Record<FormFieldType, RegExp[]> = {
      [FormFieldType.FIRST_NAME]: [/first.*name|given.*name|fname/],
      [FormFieldType.LAST_NAME]: [/last.*name|surname|family.*name|lname/],
      [FormFieldType.FULL_NAME]: [/^name$|full.*name|your.*name/],
      [FormFieldType.EMAIL]: [/email|e-mail/],
      [FormFieldType.PHONE]: [/phone|mobile|telephone/],
      [FormFieldType.LOCATION]: [/location|city|address|where.*live/],
      [FormFieldType.BIRTHDAY]: [/birth|dob|date.*of.*birth/],
      [FormFieldType.SKILLS]: [/skill|proficienc|technolog|expertise/],
      [FormFieldType.RESUME_UPLOAD]: [/resume|cv|upload.*resume/],
      [FormFieldType.COVER_LETTER]: [/cover.*letter/],
      [FormFieldType.QUESTION]: [/(why|describe|tell.*us|explain)/],
      [FormFieldType.UNKNOWN]: [],
    };

    // Find best match
    for (const [type, regexes] of Object.entries(patterns)) {
      for (const regex of regexes) {
        if (regex.test(hints)) {
          return {
            element,
            type: type as FormFieldType,
            label: this.getFieldLabel(element),
            confidence: this.calculateConfidence(hints, regex),
            atsSystem: this.detectAtsSystem(),
          };
        }
      }
    }

    return {
      element,
      type: FormFieldType.UNKNOWN,
      label: null,
      confidence: 0,
      atsSystem: null,
    };
  }

  /**
   * Get label text for a field
   */
  private getFieldLabel(element: HTMLElement): string | null {
    // Try aria-label first
    const ariaLabel = element.getAttribute('aria-label');
    if (ariaLabel) return ariaLabel;

    // Try associated <label> element
    if (element.id) {
      const label = document.querySelector(`label[for="${element.id}"]`);
      if (label) return label.textContent?.trim() || null;
    }

    // Try parent label
    const parentLabel = element.closest('label');
    if (parentLabel) {
      return parentLabel.textContent?.trim() || null;
    }

    return null;
  }

  /**
   * Detect which ATS system is being used
   */
  private detectAtsSystem(): string | null {
    const url = window.location.hostname;
    const html = document.documentElement.outerHTML;

    if (url.includes('greenhouse.io') || html.includes('greenhouse')) return 'greenhouse';
    if (url.includes('lever.co') || html.includes('lever')) return 'lever';
    if (url.includes('myworkday') || html.includes('workday')) return 'workday';
    if (url.includes('indeed.com')) return 'indeed';
    if (html.includes('taleo')) return 'taleo';
    if (html.includes('icims')) return 'icims';

    return null;
  }

  /**
   * Calculate confidence score (0-1)
   */
  private calculateConfidence(hints: string, regex: RegExp): number {
    // Exact match = 1.0
    // Partial match = 0.7
    const matches = hints.match(regex);
    if (!matches) return 0;

    const matchLength = matches[0].length;
    const hintsLength = hints.length;

    // Longer match relative to total = higher confidence
    return Math.min(1.0, matchLength / hintsLength + 0.5);
  }

  /**
   * Start observing for dynamic form fields
   */
  startObserving(callback: (fields: DetectedField[]) => void): void {
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
        const result = this.detectFields();
        callback(result.fields);
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    this.observers.push(observer);
  }

  /**
   * Stop observing
   */
  stopObserving(): void {
    this.observers.forEach((obs) => obs.disconnect());
    this.observers = [];
  }
}
```

---

#### 2.2 Autofill Profile Storage

**New Type:** `src/types/autofill.ts`

```typescript
/**
 * Autofill Profile - Stored in Account Settings
 */
export interface AutofillProfile {
  // Personal Information
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  phone: string;
  location: string; // "San Francisco, CA"
  birthday?: string; // "1995-06-15" (ISO format)

  // LinkedIn URLs
  linkedinUrl?: string;
  githubUrl?: string;
  portfolioUrl?: string;

  // Skills (for auto-selection based on JD keywords)
  skills: string[]; // Full list of all skills

  // Work Authorization
  workAuthorization?: 'us_citizen' | 'green_card' | 'visa' | 'need_sponsorship';
  veteranStatus?: 'yes' | 'no' | 'prefer_not_to_say';
  disabilityStatus?: 'yes' | 'no' | 'prefer_not_to_say';

  // Metadata
  createdAt: number;
  updatedAt: number;
}

/**
 * Question Bank - Saved questions with AI answers
 */
export interface SavedQuestion {
  id: string; // UUID
  question: string; // The actual question text
  answer: string; // AI-generated answer
  jobId?: string; // Associated job description ID (if applicable)
  keywords: string[]; // Extracted keywords from JD
  savedAt: number;
  updatedAt: number;
}

export interface QuestionBank {
  questions: SavedQuestion[];
}

// Storage keys
export const AUTOFILL_PROFILE_KEY = 'uproot_autofill_profile';
export const QUESTION_BANK_KEY = 'uproot_question_bank';
```

**Storage Functions:** `src/utils/storage.ts` (add to existing file)

```typescript
// ============================================================================
// AUTOFILL FUNCTIONS
// ============================================================================

export async function getAutofillProfile(): Promise<AutofillProfile | null> {
  try {
    const result = await chrome.storage.local.get(AUTOFILL_PROFILE_KEY);
    return result[AUTOFILL_PROFILE_KEY] || null;
  } catch (error) {
    console.error('[Storage] Error getting autofill profile:', error);
    return null;
  }
}

export async function saveAutofillProfile(profile: AutofillProfile): Promise<void> {
  try {
    await chrome.storage.local.set({
      [AUTOFILL_PROFILE_KEY]: {
        ...profile,
        updatedAt: Date.now(),
      },
    });
  } catch (error) {
    console.error('[Storage] Error saving autofill profile:', error);
    throw error;
  }
}

export async function getQuestionBank(): Promise<QuestionBank> {
  try {
    const result = await chrome.storage.local.get(QUESTION_BANK_KEY);
    return result[QUESTION_BANK_KEY] || { questions: [] };
  } catch (error) {
    console.error('[Storage] Error getting question bank:', error);
    return { questions: [] };
  }
}

export async function saveQuestion(
  question: string,
  answer: string,
  jobId?: string,
  keywords?: string[]
): Promise<SavedQuestion> {
  try {
    const bank = await getQuestionBank();
    const newQuestion: SavedQuestion = {
      id: `question-${Date.now()}`,
      question,
      answer,
      jobId,
      keywords: keywords || [],
      savedAt: Date.now(),
      updatedAt: Date.now(),
    };

    bank.questions.unshift(newQuestion);

    await chrome.storage.local.set({ [QUESTION_BANK_KEY]: bank });
    return newQuestion;
  } catch (error) {
    console.error('[Storage] Error saving question:', error);
    throw error;
  }
}

export async function deleteQuestion(id: string): Promise<void> {
  try {
    const bank = await getQuestionBank();
    bank.questions = bank.questions.filter((q) => q.id !== id);
    await chrome.storage.local.set({ [QUESTION_BANK_KEY]: bank });
  } catch (error) {
    console.error('[Storage] Error deleting question:', error);
    throw error;
  }
}
```

---

### **Phase 3: Content Script Enhancement** (Integration)

#### 3.1 Detect Page Context

**File:** `src/entrypoints/content.tsx` (modify existing function)

```typescript
/**
 * Detect if on LinkedIn or third-party site
 */
function detectPageContext(): { isLinkedIn: boolean; pageType: string } {
  const hostname = window.location.hostname;
  const isLinkedIn = hostname.includes('linkedin.com');

  if (isLinkedIn) {
    return {
      isLinkedIn: true,
      pageType: detectLinkedInPage(), // Existing function
    };
  }

  // Third-party site - detect if job application page
  const isJobApplicationPage = detectJobApplicationPage();

  return {
    isLinkedIn: false,
    pageType: isJobApplicationPage ? 'job-application' : 'other',
  };
}

/**
 * Detect if current page is a job application form
 */
function detectJobApplicationPage(): boolean {
  const url = window.location.href.toLowerCase();
  const html = document.documentElement.outerHTML.toLowerCase();

  // Check URL patterns
  const urlPatterns = [
    /apply|application|job.*form|careers|greenhouse|lever|workday|indeed/,
  ];
  if (urlPatterns.some((pattern) => pattern.test(url))) return true;

  // Check for common form field patterns
  const hasNameField = document.querySelector('input[name*="name"], input[id*="name"]');
  const hasEmailField = document.querySelector('input[type="email"], input[name*="email"]');
  const hasResumeUpload = document.querySelector('input[type="file"][name*="resume"], input[type="file"][name*="cv"]');

  // If has at least 2 of these, likely a job application
  return [hasNameField, hasEmailField, hasResumeUpload].filter(Boolean).length >= 2;
}
```

#### 3.2 Auto-Detect and Autofill

**File:** `src/entrypoints/content.tsx` (add new function)

```typescript
import { FormDetector } from '@/services/autofill/form-detector';
import { getAutofillProfile } from '@/utils/storage';

// Initialize form detector
const formDetector = new FormDetector();

/**
 * Auto-detect and fill form fields
 */
async function autoFillForm() {
  console.log('[Uproot] Starting autofill process');

  // Get user's autofill profile
  const profile = await getAutofillProfile();
  if (!profile) {
    console.log('[Uproot] No autofill profile found');
    return;
  }

  // Detect form fields
  const result = formDetector.detectFields();
  console.log('[Uproot] Detected fields:', result);

  // Fill each field
  result.fields.forEach((field) => {
    if (field.confidence < 0.5) return; // Skip low-confidence matches

    let value: string | undefined;

    switch (field.type) {
      case FormFieldType.FIRST_NAME:
        value = profile.firstName;
        break;
      case FormFieldType.LAST_NAME:
        value = profile.lastName;
        break;
      case FormFieldType.FULL_NAME:
        value = profile.fullName;
        break;
      case FormFieldType.EMAIL:
        value = profile.email;
        break;
      case FormFieldType.PHONE:
        value = profile.phone;
        break;
      case FormFieldType.LOCATION:
        value = profile.location;
        break;
      case FormFieldType.BIRTHDAY:
        value = profile.birthday;
        break;
      // Skills field - show available skills for user to select
      case FormFieldType.SKILLS:
        // Don't auto-fill, instead show UI to select skills
        highlightSkillsField(field);
        return;
    }

    if (value) {
      fillField(field.element, value);
    }
  });
}

/**
 * Fill a single field with value
 */
function fillField(element: HTMLInputElement | HTMLTextAreaElement, value: string) {
  // Set value
  element.value = value;

  // Trigger input event (some forms need this)
  element.dispatchEvent(new Event('input', { bubbles: true }));
  element.dispatchEvent(new Event('change', { bubbles: true }));

  // Add visual feedback
  element.style.backgroundColor = '#E8F5E9'; // Light green
  setTimeout(() => {
    element.style.backgroundColor = '';
  }, 2000);
}

/**
 * Highlight skills field for user selection
 */
function highlightSkillsField(field: DetectedField) {
  // Add visual indicator
  field.element.style.border = '2px solid #0077B5';
  field.element.style.boxShadow = '0 0 8px rgba(0, 119, 181, 0.3)';

  // TODO: Show skill selector UI overlay
  // This will be implemented in Phase 4 (UI Components)
}
```

#### 3.3 Message Handlers for Keyboard Shortcuts

**File:** `src/entrypoints/background.ts` (add command listeners)

```typescript
// Listen for keyboard command shortcuts
chrome.commands.onCommand.addListener(async (command) => {
  console.log('[Uproot] Command received:', command);

  // Get active tab
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) return;

  switch (command) {
    case 'open-extension':
      // Open/toggle extension panel
      chrome.tabs.sendMessage(tab.id, { type: 'TOGGLE_PANEL' });
      break;

    case 'save-question':
      // Save highlighted text as question
      chrome.tabs.sendMessage(tab.id, { type: 'SAVE_HIGHLIGHTED_QUESTION' });
      break;

    case 'paste-to-generate':
      // Copy highlighted text to Generate section
      chrome.tabs.sendMessage(tab.id, { type: 'PASTE_TO_GENERATE' });
      break;
  }
});
```

**File:** `src/entrypoints/content.tsx` (add message handlers)

```typescript
// Add to existing chrome.runtime.onMessage listener

if (message.type === 'SAVE_HIGHLIGHTED_QUESTION') {
  const selectedText = window.getSelection()?.toString().trim();
  if (!selectedText) {
    alert('Please highlight a question first');
    return;
  }

  // Save to question bank (answer will be generated later)
  const saved = await saveQuestion(selectedText, '', undefined, []);

  // Show confirmation
  showNotification(`Question saved: "${selectedText.substring(0, 50)}..."`);
  sendResponse({ success: true, question: saved });
  return true;
}

if (message.type === 'PASTE_TO_GENERATE') {
  const selectedText = window.getSelection()?.toString().trim();
  if (!selectedText) {
    alert('Please highlight a question first');
    return;
  }

  // Send to Generate section in Resume tab
  chrome.runtime.sendMessage({
    type: 'SET_GENERATE_QUESTION',
    question: selectedText,
  });

  // Show confirmation
  showNotification('Question copied to Generate section');
  sendResponse({ success: true });
  return true;
}

/**
 * Show temporary notification
 */
function showNotification(message: string) {
  const notification = document.createElement('div');
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: #0077B5;
    color: white;
    padding: 12px 20px;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
    z-index: 999999;
    font-family: system-ui, -apple-system, sans-serif;
    font-size: 14px;
    animation: slideIn 0.3s ease-out;
  `;
  notification.textContent = message;

  document.body.appendChild(notification);

  setTimeout(() => {
    notification.remove();
  }, 3000);
}
```

---

### **Phase 4: Context-Aware UI** (UX)

#### 4.1 FloatingPanel Modification

**File:** `src/components/FloatingPanel.tsx` (modify to be context-aware)

**Current:** Shows all tabs on LinkedIn
**New:** Context-aware rendering based on page type

```typescript
import { detectPageContext } from '@/entrypoints/content';

export function FloatingPanel() {
  const [pageContext, setPageContext] = useState<{ isLinkedIn: boolean; pageType: string }>(
    detectPageContext()
  );

  // Update context when URL changes
  useEffect(() => {
    const handleUrlChange = () => {
      setPageContext(detectPageContext());
    };

    // Listen for URL changes
    window.addEventListener('popstate', handleUrlChange);

    // Also listen for pushState/replaceState (SPA navigation)
    const originalPushState = window.history.pushState;
    const originalReplaceState = window.history.replaceState;

    window.history.pushState = function(...args) {
      originalPushState.apply(window.history, args);
      handleUrlChange();
    };

    window.history.replaceState = function(...args) {
      originalReplaceState.apply(window.history, args);
      handleUrlChange();
    };

    return () => {
      window.removeEventListener('popstate', handleUrlChange);
      window.history.pushState = originalPushState;
      window.history.replaceState = originalReplaceState;
    };
  }, []);

  // Render different UI based on context
  if (pageContext.isLinkedIn) {
    // Full UI - all tabs
    return <FullFloatingPanel />;
  } else if (pageContext.pageType === 'job-application') {
    // Minimal UI - only Generate section
    return <MinimalFloatingPanel />;
  } else {
    // Hide on other third-party sites
    return null;
  }
}
```

#### 4.2 Minimal Floating Panel (Third-Party Sites)

**New File:** `src/components/MinimalFloatingPanel.tsx`

```typescript
/**
 * Minimal Floating Panel - Third-Party Sites
 * Shows ONLY the Generate section from Resume tab
 */
export function MinimalFloatingPanel() {
  const [isVisible, setIsVisible] = useState(true);
  const [width, setWidth] = useState(400);
  const [height, setHeight] = useState(500);

  // Listen for toggle message
  useEffect(() => {
    const handleMessage = (message: any) => {
      if (message.type === 'TOGGLE_PANEL') {
        setIsVisible((prev) => !prev);
      }
    };

    chrome.runtime.onMessage.addListener(handleMessage);
    return () => chrome.runtime.onMessage.removeListener(handleMessage);
  }, []);

  if (!isVisible) return null;

  return (
    <Draggable>
      <Resizable
        width={width}
        height={height}
        onResize={(w, h) => {
          setWidth(w);
          setHeight(h);
        }}
      >
        <div
          style={{
            position: 'fixed',
            top: '20px',
            right: '20px',
            width: `${width}px`,
            height: `${height}px`,
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)',
            borderRadius: '12px',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            zIndex: 999999,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: '16px',
              borderBottom: '1px solid rgba(0, 0, 0, 0.1)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600' }}>
              Uproot AI Assistant
            </h3>
            <button
              onClick={() => setIsVisible(false)}
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                fontSize: '20px',
                opacity: 0.6,
              }}
            >
              ✕
            </button>
          </div>

          {/* Generate Section - Import from ResumeTab */}
          <div style={{ flex: 1, overflow: 'auto', padding: '16px' }}>
            <GenerateSection panelWidth={width} />
          </div>
        </div>
      </Resizable>
    </Draggable>
  );
}
```

#### 4.3 Generate Section Enhancement

**File:** `src/components/tabs/ResumeTab.tsx` (modify existing Generate section)

**Current:** User manually pastes question
**New:** Auto-paste from Alt+Enter shortcut

```typescript
// Add state for question input
const [generateQuestion, setGenerateQuestion] = useState('');

// Listen for SET_GENERATE_QUESTION message
useEffect(() => {
  const handleMessage = (message: any) => {
    if (message.type === 'SET_GENERATE_QUESTION') {
      setGenerateQuestion(message.question);
      setActiveSubTab('generate'); // Auto-switch to Generate tab
    }
  };

  chrome.runtime.onMessage.addListener(handleMessage);
  return () => chrome.runtime.onMessage.removeListener(handleMessage);
}, []);

// In the Generate section UI:
<textarea
  value={generateQuestion}
  onChange={(e) => setGenerateQuestion(e.target.value)}
  placeholder="Paste a question here, or highlight text on the page and press Alt+Enter"
  style={{
    width: '100%',
    minHeight: '100px',
    padding: '12px',
    borderRadius: '8px',
    border: '1px solid #d1d1d6',
    fontSize: '14px',
    fontFamily: 'system-ui',
  }}
/>
```

---

### **Phase 5: Account Settings UI** (User Data Management)

#### 5.1 Autofill Profile Tab

**File:** `src/components/tabs/settings/AccountSettings.tsx` (add new section)

```typescript
// Add to existing AccountSettings component

<Section title="Autofill Profile" icon={<User size={18} />} accentColor={accentColor} backgroundColor={backgroundColor} textColor={textColor}>
  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
    <InputField
      label="First Name"
      value={autofillProfile?.firstName || ''}
      onChange={(value) => updateAutofillProfile({ firstName: value })}
    />
    <InputField
      label="Last Name"
      value={autofillProfile?.lastName || ''}
      onChange={(value) => updateAutofillProfile({ lastName: value })}
    />
    <InputField
      label="Email"
      type="email"
      value={autofillProfile?.email || ''}
      onChange={(value) => updateAutofillProfile({ email: value })}
    />
    <InputField
      label="Phone"
      type="tel"
      value={autofillProfile?.phone || ''}
      onChange={(value) => updateAutofillProfile({ phone: value })}
    />
    <InputField
      label="Location"
      value={autofillProfile?.location || ''}
      onChange={(value) => updateAutofillProfile({ location: value })}
      placeholder="e.g., San Francisco, CA"
    />
    <InputField
      label="Birthday (Optional)"
      type="date"
      value={autofillProfile?.birthday || ''}
      onChange={(value) => updateAutofillProfile({ birthday: value })}
    />

    {/* Skills Multi-Select */}
    <div>
      <label style={{ fontSize: '14px', fontWeight: '600', color: textColor }}>
        Skills
      </label>
      <SkillsSelector
        skills={autofillProfile?.skills || []}
        onChange={(skills) => updateAutofillProfile({ skills })}
      />
    </div>
  </div>
</Section>
```

#### 5.2 Question Bank UI

**New Section in AccountSettings:**

```typescript
<Section title="Question Bank" icon={<FileText size={18} />} accentColor={accentColor} backgroundColor={backgroundColor} textColor={textColor}>
  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
    {questionBank.questions.length === 0 ? (
      <p style={{ fontSize: '13px', color: `${textColor}80`, fontStyle: 'italic' }}>
        No saved questions yet. Highlight a question on a job application and press Alt+2 to save it.
      </p>
    ) : (
      questionBank.questions.map((q) => (
        <QuestionCard
          key={q.id}
          question={q}
          onDelete={() => deleteQuestion(q.id)}
          onEdit={(updated) => updateQuestion(q.id, updated)}
        />
      ))
    )}
  </div>
</Section>

// Question Card Component
function QuestionCard({ question, onDelete, onEdit }: {
  question: SavedQuestion;
  onDelete: () => void;
  onEdit: (updated: Partial<SavedQuestion>) => void;
}) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div
      style={{
        background: '#f9f9f9',
        borderRadius: '8px',
        padding: '12px',
        border: '1px solid #e0e0e0',
      }}
    >
      {/* Question */}
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        style={{
          cursor: 'pointer',
          fontSize: '14px',
          fontWeight: '600',
          marginBottom: '8px',
        }}
      >
        {question.question.length > 100
          ? `${question.question.substring(0, 100)}...`
          : question.question}
      </div>

      {/* Expanded View */}
      {isExpanded && (
        <>
          <div style={{ fontSize: '13px', color: '#666', marginBottom: '12px' }}>
            <strong>Answer:</strong> {question.answer || '(No answer generated yet)'}
          </div>

          {/* Keywords */}
          {question.keywords.length > 0 && (
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '12px' }}>
              {question.keywords.map((keyword) => (
                <span
                  key={keyword}
                  style={{
                    background: '#0077B5',
                    color: 'white',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    fontSize: '11px',
                  }}
                >
                  {keyword}
                </span>
              ))}
            </div>
          )}

          {/* Actions */}
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => onEdit({ answer: prompt('Enter new answer:') || question.answer })}
              style={{
                padding: '6px 12px',
                background: '#0077B5',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: '12px',
                cursor: 'pointer',
              }}
            >
              Edit Answer
            </button>
            <button
              onClick={onDelete}
              style={{
                padding: '6px 12px',
                background: '#F44336',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: '12px',
                cursor: 'pointer',
              }}
            >
              Delete
            </button>
          </div>
        </>
      )}
    </div>
  );
}
```

---

### **Phase 6: Skills Auto-Selection** (Intelligence)

#### 6.1 Keyword-Based Skill Matching

**New File:** `src/services/autofill/skill-matcher.ts`

```typescript
import { extractKeywords } from '@/services/keyword-extractor';
import type { AutofillProfile } from '@/types/autofill';
import type { JobDescriptionAnalysis } from '@/types/resume';

/**
 * Auto-select relevant skills from user's profile based on JD keywords
 */
export function autoSelectSkills(
  userSkills: string[],
  jdAnalysis: JobDescriptionAnalysis
): string[] {
  const selectedSkills: string[] = [];

  // Get all keywords from JD
  const jdKeywords = jdAnalysis.keywords.map((k) => k.keyword.toLowerCase());

  // Match user skills against JD keywords
  userSkills.forEach((skill) => {
    const skillLower = skill.toLowerCase();

    // Exact match
    if (jdKeywords.includes(skillLower)) {
      selectedSkills.push(skill);
      return;
    }

    // Partial match (e.g., "React" matches "React.js")
    const hasPartialMatch = jdKeywords.some(
      (keyword) => keyword.includes(skillLower) || skillLower.includes(keyword)
    );

    if (hasPartialMatch) {
      selectedSkills.push(skill);
    }
  });

  return selectedSkills;
}

/**
 * Show skill selector overlay on form field
 */
export function showSkillSelector(
  field: HTMLElement,
  userSkills: string[],
  selectedSkills: string[],
  onSelect: (skills: string[]) => void
): void {
  // Create overlay
  const overlay = document.createElement('div');
  overlay.style.cssText = `
    position: absolute;
    background: white;
    border: 2px solid #0077B5;
    border-radius: 8px;
    padding: 16px;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
    z-index: 999999;
    max-height: 400px;
    overflow-y: auto;
    width: 400px;
  `;

  // Position near field
  const rect = field.getBoundingClientRect();
  overlay.style.top = `${rect.bottom + 8}px`;
  overlay.style.left = `${rect.left}px`;

  // Build skill checkboxes
  const checkboxes: HTMLInputElement[] = [];
  userSkills.forEach((skill) => {
    const label = document.createElement('label');
    label.style.cssText = `
      display: block;
      padding: 8px;
      cursor: pointer;
      border-radius: 4px;
      transition: background 150ms;
    `;
    label.onmouseenter = () => (label.style.background = '#f5f5f5');
    label.onmouseleave = () => (label.style.background = '');

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = selectedSkills.includes(skill);
    checkbox.style.marginRight = '8px';

    label.appendChild(checkbox);
    label.appendChild(document.createTextNode(skill));
    overlay.appendChild(label);
    checkboxes.push(checkbox);
  });

  // Add confirm button
  const confirmBtn = document.createElement('button');
  confirmBtn.textContent = 'Confirm Selection';
  confirmBtn.style.cssText = `
    margin-top: 12px;
    padding: 8px 16px;
    background: #0077B5;
    color: white;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    width: 100%;
    font-weight: 600;
  `;
  confirmBtn.onclick = () => {
    const selected = userSkills.filter((skill, i) => checkboxes[i].checked);
    onSelect(selected);
    overlay.remove();
  };

  overlay.appendChild(confirmBtn);

  // Add to page
  document.body.appendChild(overlay);

  // Close on outside click
  const handleOutsideClick = (e: MouseEvent) => {
    if (!overlay.contains(e.target as Node)) {
      overlay.remove();
      document.removeEventListener('click', handleOutsideClick);
    }
  };

  setTimeout(() => {
    document.addEventListener('click', handleOutsideClick);
  }, 100);
}
```

---

## 📝 Implementation Plan

### **Week 1: Foundation (Phase 1 + 2)**

**Day 1-2: Chrome Extension APIs**
- [ ] Add `contextMenus` and `commands` permissions to wxt.config.ts
- [ ] Add keyboard commands to manifest (Alt+1, Alt+2, Alt+Enter)
- [ ] Implement context menu "Save with Uproot" in background.ts
- [ ] Test all keyboard shortcuts work

**Day 3-5: Form Detection Engine**
- [ ] Create `src/services/autofill/form-detector.ts`
- [ ] Implement field classification with multi-heuristic approach
- [ ] Test on Greenhouse, Lever, Workday, Indeed sites
- [ ] Add MutationObserver for dynamic forms

### **Week 2: Storage + Content Script (Phase 2 + 3)**

**Day 1-2: Autofill Storage**
- [ ] Create `src/types/autofill.ts`
- [ ] Add storage functions to `src/utils/storage.ts`
- [ ] Create autofill profile schema
- [ ] Create question bank schema

**Day 3-5: Content Script Integration**
- [ ] Modify `src/entrypoints/content.tsx` to detect page context
- [ ] Implement auto-fill logic
- [ ] Add message handlers for keyboard shortcuts
- [ ] Test autofill on multiple ATS systems

### **Week 3: UI Components (Phase 4 + 5)**

**Day 1-3: Context-Aware UI**
- [ ] Modify FloatingPanel.tsx for context detection
- [ ] Create MinimalFloatingPanel.tsx for third-party sites
- [ ] Enhance Generate section with auto-paste
- [ ] Test UI switching between LinkedIn and third-party

**Day 4-5: Account Settings UI**
- [ ] Add Autofill Profile section to AccountSettings.tsx
- [ ] Create Question Bank UI
- [ ] Build QuestionCard component
- [ ] Test data persistence

### **Week 4: Intelligence + Polish (Phase 6)**

**Day 1-2: Skills Auto-Selection**
- [ ] Create `src/services/autofill/skill-matcher.ts`
- [ ] Integrate with keyword extractor
- [ ] Build skill selector overlay
- [ ] Test skill matching accuracy

**Day 3-4: Integration Testing**
- [ ] Test autofill → resume generator flow
- [ ] Test question bank → AI answer generation
- [ ] Verify all existing features still work
- [ ] Test on real job applications

**Day 5: Polish + Documentation**
- [ ] Add user onboarding for autofill feature
- [ ] Write user guide
- [ ] Update CHANGELOG.md
- [ ] Prepare for release

---

## 🧪 Testing Strategy

### **Unit Tests**

1. **Form Detector** (`form-detector.test.ts`)
   - Test field classification accuracy
   - Test ATS system detection
   - Test confidence scoring

2. **Skill Matcher** (`skill-matcher.test.ts`)
   - Test keyword matching
   - Test partial matches
   - Test ranking algorithm

### **Integration Tests**

1. **Storage** (`autofill-storage.test.ts`)
   - Test profile save/load
   - Test question bank CRUD
   - Test data persistence

2. **Content Script** (`content-autofill.test.ts`)
   - Test page context detection
   - Test autofill flow
   - Test keyboard shortcuts

### **E2E Tests**

**File:** `test-autofill-e2e.ts`

```typescript
/**
 * E2E Test: Autofill Feature
 */

// Test 1: Form Detection
✅ Detects Greenhouse application form
✅ Detects Lever application form
✅ Detects Workday application form
✅ Classifies field types correctly (90%+ accuracy)

// Test 2: Autofill
✅ Fills name, email, phone correctly
✅ Skips low-confidence fields
✅ Triggers input events on filled fields

// Test 3: Question Bank
✅ Saves question with Alt+2
✅ Saves question with right-click menu
✅ Deletes question
✅ Edits answer

// Test 4: AI Answer Generation
✅ Pastes question with Alt+Enter
✅ Switches to Generate tab
✅ Generates answer based on JD
✅ Auto-selects relevant skills

// Test 5: Context-Aware UI
✅ Shows full UI on LinkedIn
✅ Shows minimal UI on Greenhouse
✅ Hides UI on non-job sites
```

### **Manual Testing Checklist**

**Autofill Flow:**
- [ ] Visit Greenhouse job posting
- [ ] Extension auto-detects form fields
- [ ] Click extension icon (or Alt+1)
- [ ] Fields auto-fill with profile data
- [ ] Skills field shows selector overlay
- [ ] Submit application successfully

**Question Bank Flow:**
- [ ] Highlight essay question on form
- [ ] Press Alt+2
- [ ] Question saved to Account Settings
- [ ] Press Alt+Enter on same question
- [ ] Generate section opens with question pasted
- [ ] AI generates answer
- [ ] Copy answer back to form

**Context Switching:**
- [ ] Start on LinkedIn feed (full UI)
- [ ] Navigate to Greenhouse job (minimal UI)
- [ ] Navigate to Google.com (no UI)
- [ ] Return to LinkedIn (full UI again)

---

## 🚨 Edge Cases & Error Handling

### **Form Detection**

**Edge Case 1:** Dynamic form fields loaded after page load
- **Solution:** MutationObserver re-scans when new inputs added

**Edge Case 2:** Custom form components (not standard HTML inputs)
- **Solution:** Fallback to manual field selection UI

**Edge Case 3:** iFrame-based forms
- **Solution:** Inject content script into iframes, handle cross-origin restrictions

### **Autofill**

**Edge Case 1:** Form validation prevents programmatic fill
- **Solution:** Simulate user typing events, add delays between fills

**Edge Case 2:** CAPTCHA or bot detection
- **Solution:** Never auto-submit, only fill fields

**Edge Case 3:** Multi-step forms
- **Solution:** Re-run detection on each step, persist filled data

### **Storage**

**Edge Case 1:** Chrome storage quota exceeded
- **Solution:** Warn user, offer to export old data, implement pagination for question bank

**Edge Case 2:** Concurrent writes to question bank
- **Solution:** Use transaction-like pattern, read-modify-write atomically

---

## 🔒 Privacy & Security

### **Data Storage**

- ✅ All data stored locally in `chrome.storage.local` (NOT cloud by default)
- ✅ User controls when to sync (optional Supabase integration)
- ✅ Export all data as JSON (Account Settings → Export Data)
- ✅ Clear all data option (Account Settings → Clear All Data)

### **Permissions**

- ✅ `host_permissions: ['https://*/*']` - Required for form detection on all sites
  - User must explicitly allow this during install
  - Manifest warns: "Read and change all your data on websites you visit"

### **Autofill Behavior**

- ✅ Never auto-submit forms (only fill fields)
- ✅ Visual feedback on filled fields (green highlight)
- ✅ User can disable auto-fill in settings

---

## 📊 Success Metrics

### **Functionality**

- [ ] 90%+ field detection accuracy across major ATS systems
- [ ] <500ms form detection time
- [ ] 100% keyboard shortcut reliability
- [ ] Zero data loss incidents

### **User Experience**

- [ ] <3 clicks to autofill entire form
- [ ] <5 seconds to save question
- [ ] <10 seconds to generate AI answer
- [ ] Minimal UI doesn't obstruct form

### **Integration**

- [ ] All existing features (resume gen, cover letter, networking) still work
- [ ] No performance degradation on LinkedIn
- [ ] Works on 95%+ job application sites

---

## 🔮 Future Enhancements (Post-MVP)

### **Phase 7: Smart Autofill**

- [ ] Learn from user corrections (which fields to skip)
- [ ] Adaptive confidence thresholds per ATS
- [ ] Prefill based on job description analysis

### **Phase 8: Answer Templates**

- [ ] Pre-built answer templates by question type
- [ ] STAR method answer generator
- [ ] Industry-specific answer variants

### **Phase 9: Multi-Application Tracking**

- [ ] Track which questions asked by which companies
- [ ] Reuse answers across similar questions
- [ ] Application status tracking integration

---

## 📚 References

**Chrome Extension APIs:**
- [chrome.commands](https://developer.chrome.com/docs/extensions/reference/commands/)
- [chrome.contextMenus](https://developer.chrome.com/docs/extensions/reference/contextMenus/)
- [chrome.storage](https://developer.chrome.com/docs/extensions/reference/storage/)

**Form Detection Patterns:**
- [Greenhouse API docs](https://developers.greenhouse.io/)
- [Lever API docs](https://hire.lever.co/developer/documentation)
- [Workday field patterns](https://community.workday.com/)

**Existing Codebase:**
- `src/components/tabs/ResumeTab.tsx` - Generate section
- `src/services/keyword-extractor.ts` - Keyword extraction
- `src/utils/storage.ts` - Storage utilities
- `src/types/resume.ts` - ProfessionalProfile types

---

## ✅ Ready to Build

This architecture document provides:
- ✅ Complete technical specification
- ✅ Phase-by-phase implementation plan
- ✅ Testing strategy
- ✅ Edge case handling
- ✅ Integration points with existing code

**Next Step:** Begin implementation with Phase 1 (Chrome Extension APIs).

**Estimated Timeline:** 4 weeks (full-time) or 8 weeks (part-time)

**Risks:** Low - leverages existing infrastructure, well-defined scope

---

**Document Version:** 1.0
**Last Updated:** November 21, 2025
**Author:** Agent Girl (Claude Code)
**Methodology:** KenKai (Architecture-First)
