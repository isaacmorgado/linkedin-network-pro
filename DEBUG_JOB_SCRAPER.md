# Job Scraper Debugging Guide

## How to Test Job Analysis

### 1. Load Extension & Navigate to Job Page

1. Go to `chrome://extensions`
2. Reload Uproot extension (click refresh icon)
3. Go to LinkedIn job page (e.g., `linkedin.com/jobs/search`)
4. Click on any job posting
5. Wait 2-3 seconds for page to fully load

### 2. Open Extension Popup

1. Click Uproot icon in Chrome toolbar
2. Jobs tab should appear (if on job page)
3. Click "Analyze Current LinkedIn Job Page" button

### 3. Check Console for Debugging

**LinkedIn Page Console** (F12 on LinkedIn tab):
```
[Uproot] Analyzing current job page...
[Uproot] Found job title using selector: ...
[Uproot] Found company name using selector: ...
[Uproot] Found description using selector: ... (XXXX chars)
[Uproot] Successfully scraped job data: {...}
[Uproot] Scraped job: [Job Title]
```

**Extension Popup Console** (inspect popup):
```
[Uproot] Requesting job analysis from content script...
[Uproot] Received job data: {...}
[Uproot] Job saved successfully
```

### 4. Common Issues & How to Debug

#### Issue: "Not on a LinkedIn job page"

**Debug:**
1. Open console on LinkedIn page
2. Run:
   ```javascript
   console.log('URL:', window.location.href);
   console.log('Pathname:', window.location.pathname);
   ```
3. URL should contain one of:
   - `/jobs/view/[jobId]`
   - `/jobs/search?currentJobId=...`
   - `/jobs/collections/...?currentJobId=...`
   - Any `/jobs/` path with `jobId=` or `currentJobId=` parameter

**Fix:**
- Navigate to actual job posting (not just job search results)
- Click on specific job in list
- Wait for URL to update

#### Issue: "Could not extract job data"

**Debug - Check what's being found:**
```javascript
// Run in LinkedIn page console
console.log('Job ID:', (() => {
  const url = window.location.href;
  const viewMatch = url.match(/\/jobs\/view\/(\d+)/);
  const currentJobIdMatch = url.match(/currentJobId=(\d+)/);
  const jobIdMatch = url.match(/jobId=(\d+)/);
  return viewMatch?.[1] || currentJobIdMatch?.[1] || jobIdMatch?.[1] || 'NOT FOUND';
})());

console.log('Job Title:', document.querySelector('h1.job-details-jobs-unified-top-card__job-title')?.textContent?.trim() || 'NOT FOUND');

console.log('Company:', document.querySelector('.job-details-jobs-unified-top-card__company-name')?.textContent?.trim() || 'NOT FOUND');

console.log('Description Length:', document.querySelector('.jobs-description__content')?.textContent?.trim()?.length || 0);
```

**If Job Title NOT FOUND:**
- Page may not be fully loaded, wait 5 seconds and try again
- LinkedIn changed selectors, need to update scraper

**If Company NOT FOUND:**
- Same as above

**If Description Length is 0 or very small:**
- Click "Show more" if description is collapsed
- Wait for description to load
- LinkedIn may have changed description container

#### Issue: Description too short or missing keywords

**Debug - View full description:**
```javascript
// Run in LinkedIn page console
const desc = document.querySelector('.jobs-description__content');
console.log('Description:', desc?.textContent?.trim()?.substring(0, 500));
console.log('Full length:', desc?.textContent?.trim()?.length);
```

**Expected:**
- Length should be > 100 characters
- Should contain job requirements, skills, qualifications

#### Issue: Job saved but no keywords extracted

**Debug - Check storage:**
```javascript
// Run in extension popup console (inspect popup)
chrome.storage.local.get('uproot_job_descriptions', (data) => {
  const jobs = data.uproot_job_descriptions || [];
  console.log('Total jobs:', jobs.length);
  if (jobs.length > 0) {
    const latest = jobs[0];
    console.log('Latest job:', latest.jobTitle);
    console.log('Keywords:', latest.extractedKeywords?.length || 0);
    console.log('Required skills:', latest.requiredSkills?.length || 0);
    console.log('Preferred skills:', latest.preferredSkills?.length || 0);
  }
});
```

**Expected:**
- `extractedKeywords` should have 10-50+ items
- `requiredSkills` should have at least a few items
- `preferredSkills` may be empty if job doesn't specify preferred skills

### 5. Manual Scraping Test

**Run this in LinkedIn job page console to test scraping directly:**
```javascript
// Import scraper (only works if content script loaded)
const url = window.location.href;
const pathname = window.location.pathname;

// Check if job page
const isJobPage = url.includes('/jobs/view/') ||
  pathname.startsWith('/jobs/view/') ||
  pathname.includes('/jobs/collections/') ||
  (pathname.startsWith('/jobs/') && (url.includes('currentJobId=') || url.includes('jobId=')));

console.log('Is Job Page:', isJobPage);

if (isJobPage) {
  // Test selectors
  console.log('Testing selectors...');

  console.log('Job Title Selectors:');
  [
    'h1.job-details-jobs-unified-top-card__job-title',
    'h1.t-24',
    '.jobs-unified-top-card__job-title',
  ].forEach(sel => {
    const el = document.querySelector(sel);
    if (el) console.log(`✓ ${sel}: "${el.textContent?.trim()}"`);
  });

  console.log('\nCompany Selectors:');
  [
    '.job-details-jobs-unified-top-card__company-name',
    '.jobs-unified-top-card__company-name',
    'a[href*="/company/"]',
  ].forEach(sel => {
    const el = document.querySelector(sel);
    if (el) console.log(`✓ ${sel}: "${el.textContent?.trim()}"`);
  });

  console.log('\nDescription Selectors:');
  [
    '.jobs-description__content',
    '.job-details-jobs-unified-description__content',
  ].forEach(sel => {
    const el = document.querySelector(sel);
    if (el) console.log(`✓ ${sel}: ${el.textContent?.trim()?.length} chars`);
  });
}
```

### 6. Expected Console Output (Success)

**LinkedIn Page:**
```
[Uproot] Analyzing current job page...
[Uproot] Scraping job data from page...
[Uproot] Found job title using selector: h1.job-details-jobs-unified-top-card__job-title
[Uproot] Found company name using selector: .job-details-jobs-unified-top-card__company-name
[Uproot] Found description using selector: .jobs-description__content (2847 chars)
[Uproot] Successfully scraped job data: {jobTitle: "Senior Software Engineer", company: "Google", ...}
[Uproot] Scraped job: Senior Software Engineer
```

**Extension Popup:**
```
[Uproot] Requesting job analysis from content script...
[Uproot] Received job data: {jobTitle: "Senior Software Engineer", company: "Google", ...}
[Uproot] Job saved successfully
[Uproot] Badge counts updated: {feed: 0, watchlist: 0, jobs: 1}
```

### 7. URL Patterns Supported

✅ **Working patterns:**
- `linkedin.com/jobs/view/1234567890/`
- `linkedin.com/jobs/search?currentJobId=1234567890`
- `linkedin.com/jobs/search-results?currentJobId=1234567890`
- `linkedin.com/jobs/collections/recommended?currentJobId=1234567890`
- Any `/jobs/` URL with `jobId=1234567890` parameter

❌ **Not supported:**
- `linkedin.com/jobs/search` (no specific job selected)
- `linkedin.com/jobs/` (jobs homepage)
- `linkedin.com/feed` (not a job page)

### 8. Test Checklist

Before reporting bugs, verify:
- [ ] Extension reloaded after latest build
- [ ] On actual LinkedIn job posting (not search results page)
- [ ] URL contains job ID (view URL in address bar)
- [ ] Page fully loaded (wait 3-5 seconds)
- [ ] Clicked "Show more" to expand full description
- [ ] Checked console on both LinkedIn page AND extension popup
- [ ] Tried multiple different job postings
- [ ] No other extensions interfering (disable ad blockers, etc.)

### 9. Reporting Issues

If scraping still fails after debugging, provide:
1. **LinkedIn job URL** (without company-specific info)
2. **Console logs** from LinkedIn page
3. **Console logs** from extension popup
4. **Screenshot** of job page
5. **Output of manual scraping test** (section 5)

This helps identify if:
- LinkedIn changed their DOM structure
- Specific job posting has unusual format
- Extension permissions issue
- Network/timing issue
