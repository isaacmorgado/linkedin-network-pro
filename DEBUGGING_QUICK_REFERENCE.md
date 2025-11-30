# Debugging Quick Reference - LinkedIn Job Scraper

## Quick Console Output Guide

When job scraping fails, check console for these log groups:

### 1. Initial DOM Analysis
```
[Uproot] DOM Structure Analysis at Start
```
**What to look for:**
- `Found X job-related elements` - If 0, page hasn't loaded
- `Sample job elements` - Check class names for new selectors
- `Detected N Shadow DOM roots` - If > 0, selectors won't work
- `Detected N iframes` - If > 0, content may be inaccessible

### 2. Selector Check Results (Every 10 attempts)
```
[Uproot] Selector Check Results (Attempt 10)
```
**What to look for:**
- `Elements found but too short: X` - Selectors are close, need adjustment
- `Elements not found: X` - These selectors don't match current page
- `Found but too short: [...]` - Lists specific selectors with char counts

### 3. Final Failure Summary
```
[Uproot] ❌ Job Details Load Failed - Debugging Info
```
**What to look for:**
- `Page Type` - search-results vs direct-view
- `Shadow DOM Roots: N` - If > 0, need Shadow DOM support
- `Iframes: N` - If > 0, content may be in iframe
- `Final Selector Status` - Shows FOUND vs NOT FOUND for each selector

## Common Failure Scenarios

### Scenario 1: All Selectors Return "NOT FOUND"
**Diagnosis:**
```
Final Selector Status
  ❌ ".show-more-less-html__markup": NOT FOUND
  ❌ ".jobs-description__content": NOT FOUND
  ❌ ".job-details-jobs-unified-description__content": NOT FOUND
  ... (all NOT FOUND)
```

**Likely Cause:** LinkedIn changed their DOM structure

**Solution:**
1. Check `Sample job elements` for new class names
2. Add new selectors to `descriptionSelectors` array
3. Test with new selectors

**Example Fix:**
```typescript
// If sample shows: className: "jobs-details__description-v2"
// Add to descriptionSelectors array:
const descriptionSelectors = [
  // ... existing selectors
  '.jobs-details__description-v2',  // Add new selector
];
```

### Scenario 2: Some Selectors "FOUND but X chars (need Y+)"
**Diagnosis:**
```
Final Selector Status
  ⚠️ ".jobs-search__job-details": FOUND but 34 chars (need 50+)
  ⚠️ ".jobs-description": FOUND but 42 chars (need 50+)
```

**Likely Cause:** Content exists but is truncated or incomplete

**Solution:**
1. Lower `minLength` threshold for search-results pages
2. Or combine multiple elements
3. Or wait for "Show More" expansion to complete

**Example Fix:**
```typescript
// Current: minLength = isSearchResults ? 50 : 100
// Try: minLength = isSearchResults ? 30 : 100
const minLength = isSearchResults ? 30 : 100;
```

### Scenario 3: Shadow DOM Detected
**Diagnosis:**
```
[Uproot] Detected 3 Shadow DOM roots - content may be inaccessible
[Uproot] Shadow DOM hosts: [
  {tag: "LINKEDIN-JOB-CARD", className: "jobs-card"},
  ...
]
```

**Likely Cause:** Job content is in Shadow DOM (querySelector can't access)

**Solution:**
Need to implement Shadow DOM traversal:

```typescript
// Pseudocode for Shadow DOM access
function findInShadowDOM(selector: string): Element | null {
  // Check regular DOM first
  let element = document.querySelector(selector);
  if (element) return element;

  // Check Shadow DOM roots
  document.querySelectorAll('*').forEach(el => {
    if (el.shadowRoot) {
      const found = el.shadowRoot.querySelector(selector);
      if (found) element = found;
    }
  });

  return element;
}
```

### Scenario 4: Iframes Detected
**Diagnosis:**
```
[Uproot] Detected 2 iframes on page - content may be in iframe
[Uproot] iframe[0] src: about:blank id: none
[Uproot] iframe[1] src: https://jobs.linkedin.com/embed/123456 id: job-frame
```

**Likely Cause:** Job content is in iframe (may be cross-origin)

**Solution:**
1. Check if iframe is same-origin (can access `.contentDocument`)
2. If same-origin, search within iframe
3. If cross-origin, can't access (security restriction)

**Example Fix:**
```typescript
// Try to access iframe content (same-origin only)
const iframes = document.querySelectorAll('iframe');
for (const iframe of iframes) {
  try {
    const iframeDoc = iframe.contentDocument;
    if (iframeDoc) {
      const element = iframeDoc.querySelector(selector);
      if (element) return element;
    }
  } catch (error) {
    // Cross-origin iframe, can't access
    console.warn('[Uproot] Cross-origin iframe blocked:', error);
  }
}
```

### Scenario 5: "Show More" Button Not Found
**Diagnosis:**
```
[Uproot] Attempting to find Show More button...
[Uproot] No Show More buttons found. Tried: [...]
```

**Likely Cause:** Button selector changed or button doesn't exist

**Solution:**
1. Inspect page manually to find "Show More" button
2. Note its `aria-label`, class, or id
3. Add selector to `showMoreButtons` array in `tryExpandDescription()`

**Example Fix:**
```typescript
// If button is: <button aria-label="Expand job description">
const showMoreButtons = [
  // ... existing selectors
  'button[aria-label*="Expand job"]',  // Add new selector
];
```

## Quick Fixes Checklist

When selectors fail:

- [ ] Check `Sample job elements` for new class names
- [ ] Check if Shadow DOM is present (> 0 roots)
- [ ] Check if iframes are present
- [ ] Look at "found but too short" selectors
- [ ] Check if "Show More" button was found
- [ ] Note page type (search-results vs direct-view)
- [ ] Check `Min Content Length Required`

## Testing After Changes

1. **Update selectors** in `descriptionSelectors` array
2. **Rebuild extension**: `npm run build`
3. **Reload extension** in browser
4. **Test on failing LinkedIn page**
5. **Check console** for new log output
6. **Repeat** until selectors work

## Performance Notes

- Logging adds ~165-365ms overhead per call
- Acceptable cost for debugging purposes
- Can be disabled by commenting out log sections
- Production build includes all logging (use for debugging in production)

## File Locations

- **Enhanced logging code**: `/home/imorgado/Documents/agent-girl/uproot/src/services/linkedin-job-scraper.ts`
- **Example output**: `/home/imorgado/Documents/agent-girl/uproot/ENHANCED_LOGGING_EXAMPLE.md`
- **Changes summary**: `/home/imorgado/Documents/agent-girl/uproot/LOGGING_CHANGES_SUMMARY.md`
- **This guide**: `/home/imorgado/Documents/agent-girl/uproot/DEBUGGING_QUICK_REFERENCE.md`

## Support

If logging reveals new patterns not covered in this guide:

1. Document the console output
2. Document the LinkedIn page URL and structure
3. Document the expected vs actual behavior
4. Update selectors based on findings
5. Add new scenarios to this guide
