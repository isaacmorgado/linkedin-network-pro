# Quick Test Instructions

## Step 1: Load Extension (if not already loaded)
1. Open Chrome
2. Go to `chrome://extensions`
3. Enable "Developer mode" (toggle in top right)
4. Click "Load unpacked"
5. Select folder: `/home/imorgado/Documents/agent-girl/uproot/.output/chrome-mv3/`

## Step 2: Test for Errors
1. Open a new tab and go to: https://www.linkedin.com/jobs/collections/recommended/?currentJobId=4303873075
2. Press F12 to open DevTools Console
3. Look for any RED error messages

## Step 3: Test Extension Reload (THE KEY TEST)
1. Keep the LinkedIn tab open with DevTools Console visible
2. Go to `chrome://extensions` in another tab
3. Find "Uproot" extension
4. Click the **"Reload"** button (circular arrow icon)
5. Switch back to LinkedIn tab
6. Check the Console

### ✅ SUCCESS - You should see:
- Clean console (no error messages)
- Extension still works

### ❌ FAILURE - You would see (before fix):
```
Session storage get error: Error: Extension context invalidated.
[Uproot][WARN][SERVICE] Location not found
```

## Step 4: Report Results
Reply with:
- ✅ "All tests passed - no errors" OR
- ❌ Screenshot of any errors you see
