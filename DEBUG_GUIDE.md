# 🐛 Debug Guide - Widget Not Showing Up

## Quick Checks

### 1. **Reload Extension** (MOST IMPORTANT)
```
1. Go to chrome://extensions
2. Find "Uproot"
3. Click the REFRESH icon (circular arrow)
4. Close all LinkedIn tabs
5. Open new LinkedIn job page
```

### 2. **Check Console Logs**
On LinkedIn job page:
```
1. Right-click → Inspect → Console tab
2. Filter by "Uproot"
3. You should see:
   ✅ LinkedIn Extension loaded
   [Uproot] Injecting job widget...
   ✅ Job widget injected!
   [Uproot Widget] Mounting...
```

If you DON'T see these logs:
- Extension not loaded properly → Reload extension
- Content script not injecting → Check manifest permissions

### 3. **Check Job Page Detection**
In console, type:
```javascript
window.location.href
```

Should contain:
- `linkedin.com/jobs/view/XXXXXX` OR
- `linkedin.com/jobs/collections/` with `currentJobId=XXXXXX`

If URL doesn't match → Widget won't show (it's job-page only)

### 4. **Check DOM**
In console, type:
```javascript
document.getElementById('uproot-job-widget-root')
```

Should return: `<div id="uproot-job-widget-root">...</div>`

If NULL → Widget didn't inject, check console for errors

### 5. **Force Visibility Check**
In console, type:
```javascript
const widget = document.getElementById('uproot-job-widget-root');
if (widget) {
  console.log('Widget exists!', widget.style);
} else {
  console.log('Widget NOT FOUND');
}
```

## Common Issues

### Issue: "Widget not appearing"
**Fix:**
1. Reload extension
2. Close all LinkedIn tabs
3. Open fresh job page
4. Wait 2-3 seconds for page to load
5. Widget should appear bottom-right

### Issue: "Console shows errors about isJobPage"
**Fix:**
Check if you're on actual job page:
- ✅ `linkedin.com/jobs/view/123456`
- ❌ `linkedin.com/jobs/search`
- ❌ `linkedin.com/feed`

### Issue: "Console shows React errors"
**Fix:**
Rebuild extension:
```bash
npm run build
```
Then reload in chrome://extensions

### Issue: "Widget appears then disappears"
**Fix:**
LinkedIn's SPA navigation might be removing it. Check console for:
```
[Uproot] URL changed: ...
[Uproot] Removed job widget
```

## Testing Workflow

### Step 1: Clean Start
```
1. chrome://extensions
2. Remove Uproot completely
3. cd linkedin-extension
4. npm run build
5. Load unpacked → .output/chrome-mv3
```

### Step 2: Go to Real Job
```
1. linkedin.com/jobs/search
2. Click any job posting
3. URL should be: /jobs/view/XXXXXXX
4. Wait 2 seconds
5. Widget appears bottom-right corner
```

### Step 3: Test Widget
```
1. Click "Analyze This Job"
2. See loading state
3. See keywords extracted
4. Click "Generate Custom Resume"
5. See resume with ATS score
6. Click "Copy to Clipboard"
```

## Console Commands for Debugging

### Check if content script loaded:
```javascript
console.log('Extension check:', typeof defineContentScript);
```

### Manually inject widget (if it's missing):
```javascript
// This is what the content script does
const container = document.createElement('div');
container.id = 'uproot-job-widget-root';
container.style.cssText = 'position: fixed; bottom: 0; right: 0; z-index: 999999;';
document.body.appendChild(container);
console.log('Widget container created:', container);
```

### Check job detection:
```javascript
const isJob = window.location.href.includes('linkedin.com/jobs/view/') ||
              (window.location.href.includes('linkedin.com/jobs/collections/') &&
               window.location.href.includes('currentJobId='));
console.log('Is job page?', isJob);
```

## Still Not Working?

### Check Browser Console (NOT page console):
```
1. chrome://extensions
2. Find Uproot
3. Click "service worker" or "background page"
4. Check for errors
```

### Check Manifest Permissions:
```
Should have:
- permissions: ["storage", "activeTab", "scripting"]
- host_permissions: ["https://www.linkedin.com/*"]
```

### Nuclear Option - Full Reset:
```bash
# Delete extension
rm -rf .output

# Clean install
rm -rf node_modules
npm install

# Rebuild
npm run build

# Reload in Chrome
chrome://extensions → Remove → Load unpacked
```

## Expected Behavior

**✅ CORRECT:**
1. Go to job page → Widget appears in 1-2 seconds
2. Widget shows "Analyze This Job" button
3. Clicking button → Shows analyzing state
4. 2 seconds later → Shows "Job Analyzed!" with stats
5. Click "Generate Resume" → Shows generating state
6. 3 seconds later → Shows resume with ATS score
7. Click "Copy" → Resume copied to clipboard

**❌ WRONG:**
- Widget never appears → Extension not loaded or wrong page
- Widget appears but button doesn't work → Check console for errors
- Analysis hangs forever → Check job description extraction failed

## Logs to Share if Still Broken

Send these console logs:
```javascript
// 1. Check widget
console.log('Widget:', document.getElementById('uproot-job-widget-root'));

// 2. Check URL
console.log('URL:', window.location.href);

// 3. Check errors
console.log('Errors:', localStorage.getItem('uproot-errors'));

// 4. Check job data
const jobData = {
  title: document.querySelector('h1')?.textContent,
  company: document.querySelector('a[href*="/company/"]')?.textContent,
  description: document.querySelector('.jobs-description__content')?.textContent?.length
};
console.log('Job data found:', jobData);
```

---

**If widget STILL doesn't show after all this, there's a fundamental issue with the extension loading. Double-check the build output and manifest.json.**
