# LinkedIn Network Pro - Required Fixes

## Project Overview
This is a Chrome extension for LinkedIn that helps users optimize their networking strategy. The codebase is written in TypeScript with React components. Three critical systems need fixes:
1. Test/implementation mismatch in the universal pathfinder
2. Missing background monitoring integration
3. Code quality violations (file size limits)

---

## Priority 1: Critical Fixes

### Fix 1: Update Pathfinder Tests (Remove 'none' Strategy References)

**Context:**
Recent commit (6948998) eliminated the 'none' strategy type and replaced it with 'cold-outreach' to guarantee viable connection paths. Tests still expect the old 'none' type.

**Files to modify:**
1. `src/services/universal-connection/__tests__/minimal-profile.test.ts`
2. `src/services/universal-connection/__tests__/minimal-profile-examples.test.ts`

**Changes required:**

#### File 1: `minimal-profile.test.ts`

**Line 256:**
```typescript
// OLD (incorrect)
expect(strategy.type).toBe('none');
expect(strategy.confidence).toBe(0);

// NEW (correct)
expect(strategy.type).toBe('cold-outreach');
expect(strategy.lowConfidence).toBe(true);
expect(strategy.confidence).toBeGreaterThan(0);
expect(strategy.confidence).toBeLessThanOrEqual(0.44);
```

**Line 299:**
```typescript
// OLD (incorrect)
expect(strategy.type).toBe('none');

// NEW (correct)
expect(strategy.type).toBe('cold-outreach');
expect(strategy.lowConfidence).toBe(true);
```

#### File 2: `minimal-profile-examples.test.ts`

**Line 90:**
```typescript
// OLD (incorrect)
expect(result.type).toBe('none');

// NEW (correct)
expect(result.type).toBe('cold-outreach');
expect(result.lowConfidence).toBe(true);
```

**Line 179:**
```typescript
// OLD (incorrect)
expect(result.type).toBe('none');

// NEW (correct)
expect(result.type).toBe('cold-outreach');
expect(result.lowConfidence).toBe(true);
```

**Line 270:**
```typescript
// OLD (incorrect)
expect(result.type).toBe('none');

// NEW (correct)
expect(result.type).toBe('cold-outreach');
expect(result.lowConfidence).toBe(true);
```

**Line 416:**
```typescript
// OLD (incorrect)
expect(minimalResult.type).toBe('none');

// NEW (correct)
expect(minimalResult.type).toBe('cold-outreach');
expect(minimalResult.lowConfidence).toBe(true);
```

**Line 466:**
```typescript
// OLD (incorrect)
expect(result.type).toBe('none');

// NEW (correct)
expect(result.type).toBe('cold-outreach');
expect(result.lowConfidence).toBe(true);
```

**Validation:**
Run tests after changes:
```bash
npm test -- minimal-profile
```

**Expected output:**
- All tests in both files should pass
- No references to type 'none' should remain
- All low-confidence strategies should be 'cold-outreach' type

---

### Fix 2: Implement Background Activity Monitoring

**Context:**
The background monitoring system has a TODO stub that prevents automatic job alerts and company update notifications from working. The infrastructure exists but the handler function is empty.

**File to modify:**
`src/entrypoints/background.ts`

**Current code (lines 340-350):**
```typescript
async function handleActivityMonitoring() {
  log.debug(LogCategory.BACKGROUND, 'Starting activity monitoring check');
  try {
    // TODO: Implement activity monitoring
    log.debug(LogCategory.BACKGROUND, 'Activity monitoring check completed (not yet implemented)');
  } catch (error) {
    log.error(LogCategory.BACKGROUND, 'Activity monitoring check failed', error as Error);
    throw error;
  }
}
```

**Required implementation:**
```typescript
async function handleActivityMonitoring() {
  log.debug(LogCategory.BACKGROUND, 'Starting activity monitoring check');
  try {
    // Import required functions at top of file if not already present
    // import { getCompanyWatchlist } from '@/utils/storage/company-watchlist-storage';
    // import { getWatchlist } from '@/utils/storage/watchlist-storage';
    // import { getOnboardingState } from '@/utils/storage/onboarding-storage';
    // import { checkCompanyJobs, checkCompanyUpdates, checkPersonProfile } from '@/services/watchlist-monitor';

    // Load watchlists and preferences
    const [companies, people, onboardingState] = await Promise.all([
      getCompanyWatchlist(),
      getWatchlist(),
      getOnboardingState(),
    ]);

    const preferences = onboardingState.preferences;

    log.debug(LogCategory.BACKGROUND, `Monitoring ${companies.length} companies and ${people.length} people`);

    // Check each company with job alerts enabled
    const companiesWithAlerts = companies.filter(c => c.jobAlertEnabled);
    for (const company of companiesWithAlerts) {
      try {
        log.debug(LogCategory.BACKGROUND, `Checking jobs for ${company.name}`);
        await checkCompanyJobs(company, preferences);

        // Also check for company updates/posts if last check was >24h ago
        const dayInMs = 24 * 60 * 60 * 1000;
        if (!company.lastChecked || Date.now() - company.lastChecked > dayInMs) {
          log.debug(LogCategory.BACKGROUND, `Checking updates for ${company.name}`);
          await checkCompanyUpdates(company);
        }
      } catch (error) {
        log.error(LogCategory.BACKGROUND, `Failed to check company ${company.name}`, error as Error);
        // Continue with other companies even if one fails
      }
    }

    // Check each person in watchlist for profile updates
    for (const person of people) {
      try {
        log.debug(LogCategory.BACKGROUND, `Checking profile for ${person.name}`);
        await checkPersonProfile(person, preferences);
      } catch (error) {
        log.error(LogCategory.BACKGROUND, `Failed to check person ${person.name}`, error as Error);
        // Continue with other people even if one fails
      }
    }

    log.debug(LogCategory.BACKGROUND, 'Activity monitoring check completed successfully');
  } catch (error) {
    log.error(LogCategory.BACKGROUND, 'Activity monitoring check failed', error as Error);
    throw error;
  }
}
```

**Required imports to add at top of file:**
```typescript
import { getCompanyWatchlist } from '@/utils/storage/company-watchlist-storage';
import { getWatchlist } from '@/utils/storage/watchlist-storage';
import { getOnboardingState } from '@/utils/storage/onboarding-storage';
import { checkCompanyJobs, checkCompanyUpdates, checkPersonProfile } from '@/services/watchlist-monitor';
```

**Note about scraping limitations:**
The current implementation in `watchlist-monitor.ts` requires being on the actual LinkedIn page to scrape. For background monitoring to work fully, the background script needs to:
1. Open company/profile pages in hidden tabs OR
2. Use LinkedIn API (if available) OR
3. Message content script to perform scraping

**Enhanced implementation with tab handling:**
```typescript
async function handleActivityMonitoring() {
  log.debug(LogCategory.BACKGROUND, 'Starting activity monitoring check');
  try {
    const [companies, people, onboardingState] = await Promise.all([
      getCompanyWatchlist(),
      getWatchlist(),
      getOnboardingState(),
    ]);

    const preferences = onboardingState.preferences;
    const companiesWithAlerts = companies.filter(c => c.jobAlertEnabled);

    // For each company, open jobs page in background tab
    for (const company of companiesWithAlerts) {
      try {
        const jobsUrl = `${company.companyUrl}/jobs`;

        // Create hidden tab
        const tab = await chrome.tabs.create({
          url: jobsUrl,
          active: false,
        });

        // Wait for content script to load and scrape
        await new Promise((resolve) => {
          const listener = (
            message: any,
            sender: chrome.runtime.MessageSender,
          ) => {
            if (
              sender.tab?.id === tab.id &&
              message.type === 'COMPANY_JOBS_SCRAPED'
            ) {
              chrome.runtime.onMessage.removeListener(listener);
              resolve(message.jobs);
            }
          };
          chrome.runtime.onMessage.addListener(listener);

          // Send message to content script to start scraping
          setTimeout(() => {
            chrome.tabs.sendMessage(tab.id!, {
              type: 'CHECK_COMPANY_JOBS',
              company,
              preferences,
            });
          }, 2000); // Wait for page to load
        });

        // Close tab after scraping
        if (tab.id) {
          await chrome.tabs.remove(tab.id);
        }
      } catch (error) {
        log.error(LogCategory.BACKGROUND, `Failed to check ${company.name}`, error as Error);
      }
    }

    log.debug(LogCategory.BACKGROUND, 'Activity monitoring completed');
  } catch (error) {
    log.error(LogCategory.BACKGROUND, 'Activity monitoring failed', error as Error);
    throw error;
  }
}
```

**Content script message handler required:**
Add to `src/entrypoints/content.tsx` in the message listener:

```typescript
// Inside chrome.runtime.onMessage.addListener callback
case 'CHECK_COMPANY_JOBS': {
  const { company, preferences } = message;
  const jobs = await checkCompanyJobs(company, preferences);

  // Send results back to background
  chrome.runtime.sendMessage({
    type: 'COMPANY_JOBS_SCRAPED',
    jobs,
  });
  break;
}
```

**Validation:**
After implementation:
1. Build extension: `npm run build`
2. Load extension in Chrome
3. Add a company to watchlist with job alerts enabled
4. Wait 15 minutes (or manually trigger alarm)
5. Check that feed items appear in Feed tab
6. Check console logs for "Activity monitoring check completed successfully"

**Expected output:**
- Background alarm triggers every 15 minutes
- Monitoring checks all watchlisted companies
- New jobs generate feed items (type: 'job_alert')
- Company updates generate feed items (type: 'company_update')
- Console shows successful completion logs
- No "not yet implemented" messages

---

### Fix 3: Verify Type Definitions

**Context:**
Ensure the ConnectionStrategy type no longer includes 'none' as a valid type.

**File to check:**
`src/services/universal-connection/universal-connection-types.ts`

**Location:**
Line 43 (approximately)

**Expected type definition:**
```typescript
export type ConnectionStrategyType =
  | 'mutual'
  | 'direct-similarity'
  | 'intermediary'
  | 'cold-similarity'
  | 'cold-outreach';
```

**Should NOT include:**
```typescript
// WRONG - do not have this
export type ConnectionStrategyType =
  | 'mutual'
  | 'direct-similarity'
  | 'intermediary'
  | 'cold-similarity'
  | 'cold-outreach'
  | 'none'; // ❌ Remove this if present
```

**Action:**
- Read the file
- If 'none' is present in the type union, remove it
- Save the file

**Validation:**
```bash
npm run compile
# Should compile with no errors
# Search codebase for remaining 'none' references:
grep -r "type.*'none'" src/services/universal-connection/
# Should only appear in comments or old documentation, not in code
```

---

## Priority 2: Code Quality Fixes

### Fix 4: Refactor Large Files to Meet 300-Line Limit

**Context:**
Project has a strict 300-line limit per file (documented in CLAUDE.md). Several files violate this rule and must be split into modules.

#### File 1: `keyword-extractor.ts` (727 lines)

**Current location:**
`src/services/keyword-extractor.ts`

**Required structure:**
Create directory: `src/services/keyword-extractor/`

**Split into:**
```
src/services/keyword-extractor/
├── index.ts                    (< 200 lines) - Main orchestrator, re-exports
├── skills-matcher.ts           (< 150 lines) - Skills database matching logic
├── ngram-analyzer.ts           (< 150 lines) - N-gram extraction (unigrams, bigrams, trigrams)
├── keyword-scorer.ts           (< 200 lines) - Scoring algorithm and weighting
├── section-parser.ts           (< 150 lines) - Job section parsing (Required/Preferred)
├── keyword-categorizer.ts      (< 150 lines) - Category assignment logic
├── types.ts                    (< 100 lines) - Type definitions
└── constants.ts                (< 100 lines) - Weights, thresholds, stop words
```

**Splitting guidelines:**
- `skills-matcher.ts`: Extract all skills database matching logic (lines with `skillsDatabase.getAllSkills()`, synonym matching)
- `ngram-analyzer.ts`: Extract tokenization, n-gram extraction, frequency analysis
- `keyword-scorer.ts`: Extract scoring algorithm (frequency, position, technical term detection, weighting)
- `section-parser.ts`: Extract job section parsing (Required Qualifications, Preferred Qualifications detection)
- `keyword-categorizer.ts`: Extract categorization logic (technical-skill, tool, certification, etc.)
- `types.ts`: Move all interfaces and types
- `constants.ts`: Move all constants (GENERIC_TERMS, TECHNICAL_INDICATORS, weights)
- `index.ts`: Main function that orchestrates the flow, re-exports all public functions

**Example index.ts structure:**
```typescript
// Orchestrator
import { matchSkillsFromDatabase } from './skills-matcher';
import { analyzeNGrams } from './ngram-analyzer';
import { scoreKeywords } from './keyword-scorer';
import { parseJobSections } from './section-parser';
import { categorizeKeywords } from './keyword-categorizer';

export function extractKeywordsFromJobDescription(
  jobDescription: string,
  options?: KeywordExtractionOptions
): ExtractedKeyword[] {
  // 1. Parse sections
  const sections = parseJobSections(jobDescription);

  // 2. Match known skills
  const knownSkills = matchSkillsFromDatabase(jobDescription);

  // 3. Extract n-grams
  const ngrams = analyzeNGrams(jobDescription);

  // 4. Score all keywords
  const scored = scoreKeywords([...knownSkills, ...ngrams], sections);

  // 5. Categorize
  return categorizeKeywords(scored);
}

// Re-export everything
export * from './types';
export { matchSkillsFromDatabase } from './skills-matcher';
export { analyzeNGrams } from './ngram-analyzer';
export { scoreKeywords } from './keyword-scorer';
export { parseJobSections } from './section-parser';
export { categorizeKeywords } from './keyword-categorizer';
```

**Backward compatibility:**
Ensure all existing imports still work:
```typescript
// These should still work after refactor
import { extractKeywordsFromJobDescription } from '@/services/keyword-extractor';
import type { ExtractedKeyword } from '@/services/keyword-extractor';
```

---

#### File 2: `watchlist-monitor.ts` (555 lines)

**Current location:**
`src/services/watchlist-monitor.ts`

**Required structure:**
Create directory: `src/services/watchlist-monitor/`

**Split into:**
```
src/services/watchlist-monitor/
├── index.ts                    (< 150 lines) - Main orchestrator, re-exports
├── company-job-checker.ts      (< 200 lines) - checkCompanyJobs logic
├── company-update-checker.ts   (< 200 lines) - checkCompanyUpdates logic
├── person-checker.ts           (< 200 lines) - checkPersonProfile logic
├── feed-generator.ts           (< 200 lines) - Feed item generation functions
├── snapshot-manager.ts         (< 150 lines) - Snapshot comparison logic
├── types.ts                    (< 100 lines) - Type definitions
└── constants.ts                (< 100 lines) - Match thresholds, limits
```

**Splitting guidelines:**
- `company-job-checker.ts`: Extract `checkCompanyJobs` function and helpers
- `company-update-checker.ts`: Extract `checkCompanyUpdates` function and helpers
- `person-checker.ts`: Extract `checkPersonProfile` function and helpers
- `feed-generator.ts`: Extract all `generateXXXFeedItem` functions
- `snapshot-manager.ts`: Extract snapshot loading/saving/comparison logic
- `types.ts`: Move interfaces (JobSnapshot, etc.)
- `constants.ts`: Move constants (MATCH_THRESHOLD, MAX_JOBS_TO_CHECK, etc.)
- `index.ts`: Main `monitorCurrentPage` function, re-exports

**Example index.ts:**
```typescript
import { checkCompanyJobs } from './company-job-checker';
import { checkCompanyUpdates } from './company-update-checker';
import { checkPersonProfile } from './person-checker';

export async function monitorCurrentPage(
  watchlistCompanies: WatchlistCompany[],
  watchlistPeople: WatchlistPerson[],
  preferences: JobPreferences
): Promise<void> {
  const currentUrl = window.location.href;

  // Check if on company page
  const companyId = getCompanyIdFromUrl(currentUrl);
  if (companyId) {
    const company = watchlistCompanies.find(c =>
      c.companyUrl.includes(companyId)
    );
    if (company) {
      if (company.jobAlertEnabled && currentUrl.includes('/jobs')) {
        await checkCompanyJobs(company, preferences);
      }
      if (currentUrl.includes('/posts')) {
        await checkCompanyUpdates(company);
      }
    }
  }

  // Check if on profile page
  const username = getProfileUsernameFromUrl(currentUrl);
  if (username) {
    const person = watchlistPeople.find(p =>
      p.profileUrl.includes(username)
    );
    if (person) {
      await checkPersonProfile(person, preferences);
    }
  }
}

// Re-export all public functions
export { checkCompanyJobs } from './company-job-checker';
export { checkCompanyUpdates } from './company-update-checker';
export { checkPersonProfile } from './person-checker';
export * from './types';
```

---

#### File 3: `linkedin-job-scraper.ts` (435 lines)

**Current location:**
`src/services/linkedin-job-scraper.ts`

**Required structure:**
Create directory: `src/services/linkedin-job-scraper/`

**Split into:**
```
src/services/linkedin-job-scraper/
├── index.ts                    (< 150 lines) - Main scraper orchestrator
├── job-page-detector.ts        (< 100 lines) - isJobPage, URL pattern detection
├── job-card-scraper.ts         (< 200 lines) - Extract data from job cards
├── job-details-scraper.ts      (< 200 lines) - Extract data from job details page
├── dom-helpers.ts              (< 150 lines) - DOM query helper functions
├── selectors.ts                (< 100 lines) - CSS selector constants
└── types.ts                    (< 100 lines) - Type definitions
```

**Splitting guidelines:**
- `job-page-detector.ts`: Extract `isJobPage()` and URL detection logic
- `job-card-scraper.ts`: Extract job card list scraping (search results page)
- `job-details-scraper.ts`: Extract job details page scraping (single job view)
- `dom-helpers.ts`: Extract helper functions for DOM queries
- `selectors.ts`: Move all CSS selectors to constants
- `types.ts`: Move LinkedInJob interface and related types
- `index.ts`: Main `scrapeCurrentJob()` function

**Example index.ts:**
```typescript
import { isJobPage } from './job-page-detector';
import { scrapeJobCard } from './job-card-scraper';
import { scrapeJobDetails } from './job-details-scraper';

export async function scrapeCurrentJob(): Promise<LinkedInJob | null> {
  if (!isJobPage()) {
    return null;
  }

  // Try job details page first (single job view)
  let job = await scrapeJobDetails();

  // Fallback to job card if details page fails
  if (!job) {
    job = await scrapeJobCard();
  }

  return job;
}

// Re-export
export { isJobPage } from './job-page-detector';
export { scrapeJobCard } from './job-card-scraper';
export { scrapeJobDetails } from './job-details-scraper';
export * from './types';
```

---

**Validation for all refactors:**
After each file split:
```bash
# Verify TypeScript compilation
npm run compile

# Verify all tests still pass
npm test

# Check line counts
find src/services/keyword-extractor -name "*.ts" ! -name "*.test.ts" -exec wc -l {} \; | sort -rn
find src/services/watchlist-monitor -name "*.ts" ! -name "*.test.ts" -exec wc -l {} \; | sort -rn
find src/services/linkedin-job-scraper -name "*.ts" ! -name "*.test.ts" -exec wc -l {} \; | sort -rn

# All files should be < 300 lines
```

**Expected output:**
- All files under 300 lines
- TypeScript compiles with no errors
- All tests pass
- No breaking changes to imports
- Backward compatibility maintained

---

## Priority 3: Optional Enhancements

### Enhancement 1: Add Missing Helper Functions Verification

**Context:**
Ensure helper functions referenced in imports actually exist.

**File to check:**
`src/utils/scrapers/helpers.ts`

**Required exports:**
```typescript
export function getCompanyIdFromUrl(url: string): string | null;
export function getProfileUsernameFromUrl(url: string): string | null;
export function isLinkedInPage(url: string): boolean;
export function getLinkedInPageType(url: string): 'company' | 'profile' | 'job' | 'feed' | 'unknown';
```

**If file doesn't exist, create it:**
```typescript
// src/utils/scrapers/helpers.ts

export function getCompanyIdFromUrl(url: string): string | null {
  // Extract company ID from URLs like:
  // https://www.linkedin.com/company/google/
  // https://www.linkedin.com/company/12345/
  const companyMatch = url.match(/\/company\/([^\/\?]+)/);
  return companyMatch ? companyMatch[1] : null;
}

export function getProfileUsernameFromUrl(url: string): string | null {
  // Extract username from URLs like:
  // https://www.linkedin.com/in/billgates/
  const profileMatch = url.match(/\/in\/([^\/\?]+)/);
  return profileMatch ? profileMatch[1] : null;
}

export function isLinkedInPage(url: string): boolean {
  return url.includes('linkedin.com');
}

export function getLinkedInPageType(
  url: string
): 'company' | 'profile' | 'job' | 'feed' | 'unknown' {
  if (url.includes('/company/')) return 'company';
  if (url.includes('/in/')) return 'profile';
  if (url.includes('/jobs/')) return 'job';
  if (url.includes('/feed/')) return 'feed';
  return 'unknown';
}
```

**Validation:**
```bash
# Check if file exists
ls -la src/utils/scrapers/helpers.ts

# Verify exports
grep "export function" src/utils/scrapers/helpers.ts

# Verify imports work
npm run compile
```

---

### Enhancement 2: Add Content Script Message Handler

**Context:**
Content script needs message handler for background-triggered job checks.

**File to modify:**
`src/entrypoints/content.tsx`

**Add to message listener:**
Find the `chrome.runtime.onMessage.addListener` and add this case:

```typescript
chrome.runtime.onMessage.addListener(
  async (message, sender, sendResponse) => {
    // ... existing cases ...

    case 'CHECK_COMPANY_JOBS': {
      const { company, preferences } = message;

      try {
        // Import at top of file if not already
        // import { checkCompanyJobs } from '@/services/watchlist-monitor';

        const jobs = await checkCompanyJobs(company, preferences);

        // Send results back to background
        chrome.runtime.sendMessage({
          type: 'COMPANY_JOBS_SCRAPED',
          jobs,
          success: true,
        });
      } catch (error) {
        chrome.runtime.sendMessage({
          type: 'COMPANY_JOBS_SCRAPED',
          jobs: [],
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
      break;
    }

    case 'CHECK_COMPANY_UPDATES': {
      const { company } = message;

      try {
        // Import at top of file if not already
        // import { checkCompanyUpdates } from '@/services/watchlist-monitor';

        const updates = await checkCompanyUpdates(company);

        chrome.runtime.sendMessage({
          type: 'COMPANY_UPDATES_SCRAPED',
          updates,
          success: true,
        });
      } catch (error) {
        chrome.runtime.sendMessage({
          type: 'COMPANY_UPDATES_SCRAPED',
          updates: [],
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
      break;
    }

    // ... rest of cases ...
  }
);
```

**Required imports:**
```typescript
import { checkCompanyJobs, checkCompanyUpdates } from '@/services/watchlist-monitor';
```

---

## Testing & Validation

### Full System Test

After all fixes are complete, run this test sequence:

**1. Build the extension:**
```bash
npm install
npm run compile
npm run build
```

**2. Run test suite:**
```bash
npm test
```

**Expected output:**
- All tests pass
- No references to 'none' strategy type
- No TypeScript compilation errors

**3. Load extension in Chrome:**
- Open Chrome
- Go to `chrome://extensions/`
- Enable "Developer mode"
- Click "Load unpacked"
- Select the `dist` folder

**4. Test pathfinding:**
- Navigate to any LinkedIn profile
- Open extension panel
- Click "Find Connection Path"
- Verify it returns a strategy (never 'none')
- Low similarity profiles should return 'cold-outreach' with `lowConfidence: true`

**5. Test job alerts:**
- Go to Settings → Job Preferences
- Add job titles (e.g., "Software Engineer", "Software Engineering Intern")
- Select experience level "Internship" (if testing for internships)
- Add preferred locations
- Save preferences

- Go to Watchlist tab
- Add a company (e.g., "Google", "Microsoft")
- Enable "Job Alerts" toggle
- Navigate to the company's jobs page on LinkedIn (e.g., linkedin.com/company/google/jobs)
- Wait a few seconds
- Check Feed tab for new job alerts

**6. Test background monitoring:**
- After setting up job alerts (step 5)
- Wait 15 minutes for alarm to trigger
- Check Chrome extension console logs (go to chrome://extensions/, click "service worker" under your extension)
- Look for "Activity monitoring check completed successfully"
- Check Feed tab for new items

**7. Test keyword extraction:**
- Navigate to any LinkedIn job posting
- Open extension panel
- Go to Jobs tab
- Click "Analyze Current LinkedIn Job Page"
- Verify keywords are extracted
- Check that keywords are categorized as "Required" or "Preferred"
- Verify keyword categories (technical-skill, tool, certification, etc.)

---

## Success Criteria

All fixes are complete when:

- [ ] All tests pass (`npm test`)
- [ ] No TypeScript compilation errors (`npm run compile`)
- [ ] All files are under 300 lines (check with `find src -name "*.ts" -exec wc -l {} \; | awk '$1 > 300'`)
- [ ] No references to 'none' strategy type in code (only in comments/docs)
- [ ] Background monitoring logs show "completed successfully"
- [ ] Feed items appear automatically after alarm triggers
- [ ] Manual job analysis extracts keywords correctly
- [ ] Extension loads in Chrome without errors
- [ ] Pathfinding returns actionable strategies for any profile

---

## File Reference

**Files to modify:**
1. `src/services/universal-connection/__tests__/minimal-profile.test.ts`
2. `src/services/universal-connection/__tests__/minimal-profile-examples.test.ts`
3. `src/services/universal-connection/universal-connection-types.ts`
4. `src/entrypoints/background.ts`
5. `src/entrypoints/content.tsx`
6. `src/services/keyword-extractor.ts` (refactor to directory)
7. `src/services/watchlist-monitor.ts` (refactor to directory)
8. `src/services/linkedin-job-scraper.ts` (refactor to directory)

**Files to create:**
1. `src/utils/scrapers/helpers.ts` (if doesn't exist)
2. `src/services/keyword-extractor/` (directory with 8 files)
3. `src/services/watchlist-monitor/` (directory with 7 files)
4. `src/services/linkedin-job-scraper/` (directory with 6 files)

**Files to read for context:**
1. `src/services/watchlist-monitor.ts` (before refactoring)
2. `src/services/job-matcher.ts`
3. `src/services/keyword-extractor.ts` (before refactoring)
4. `src/types/monitoring.ts`
5. `src/types/feed.ts`
6. `src/types/watchlist.ts`
7. `CLAUDE.md` (project guidelines)

---

## Additional Notes

**Import path aliases:**
This project uses TypeScript path aliases:
- `@/` maps to `src/`
- Example: `import { foo } from '@/services/bar'` → `src/services/bar`

**Logging:**
Use the project's logging system:
```typescript
import { log, LogCategory } from '@/utils/logger';

log.debug(LogCategory.BACKGROUND, 'Message here');
log.error(LogCategory.BACKGROUND, 'Error message', error);
```

**Storage APIs:**
Use project's storage utilities (not raw chrome.storage):
```typescript
import { getCompanyWatchlist } from '@/utils/storage/company-watchlist-storage';
import { addFeedItem } from '@/utils/storage/feed-storage';
```

**Async/await:**
All scraping and storage operations are async. Always use `await` or `.then()`.

**Error handling:**
Wrap all monitoring operations in try-catch to prevent one failure from breaking the entire flow.

**Rate limiting:**
Be mindful of LinkedIn rate limits. The background alarm runs every 15 minutes, which should be safe. If checking many companies, consider adding delays between requests.

---

## Estimated Time

- Fix 1 (Test updates): 30 minutes
- Fix 2 (Background monitoring): 2-3 hours
- Fix 3 (Type verification): 15 minutes
- Fix 4 (File refactoring): 4-6 hours
- Testing & validation: 1-2 hours

**Total: 8-12 hours of development work**

---

## Questions?

If anything is unclear:
1. Read the referenced files for context
2. Check `CLAUDE.md` for project guidelines
3. Look at existing similar implementations (e.g., how other scrapers are structured)
4. Run tests frequently to catch issues early
5. Use TypeScript compiler to validate changes (`npm run compile`)
