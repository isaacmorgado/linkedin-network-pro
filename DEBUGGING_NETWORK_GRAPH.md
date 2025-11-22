# Debugging "Network Graph is Empty" Error

## Step-by-Step Debugging Guide

### Step 1: Reload the Extension

**IMPORTANT**: After running `npm run build`, you MUST reload the extension!

1. Go to `chrome://extensions/`
2. Find "LinkedIn Network Pro" or "Uproot"
3. Click the **🔄 Reload** button (circular arrow icon)
4. Verify it says "Errors" = 0

### Step 2: Enable Console Logging

1. Visit any LinkedIn profile page (e.g., `linkedin.com/in/someone`)
2. Open Developer Tools (F12 or Right-click → Inspect)
3. Go to the **Console** tab
4. Look for logs prefixed with `[Uproot]` or `[NETWORK]`

**Expected logs:**
```
[Uproot] [CONTENT_SCRIPT] Content script loaded
[Uproot] [CONTENT_SCRIPT] URL changed detected
[Uproot] [NETWORK] LinkedIn profile detected, adding to network graph
[Uproot] [NETWORK] Scraping profile: https://linkedin.com/in/...
[Uproot] [NETWORK] Added node to graph: ...
[Uproot] [NETWORK] Saved network graph with X nodes, Y edges
[Uproot] [NETWORK] Added [Name] to network (X total profiles)
```

**If you see NO logs:**
- Content script isn't loading
- Check Step 1 (reload extension)
- Check console filter (make sure "All levels" is selected, not just "Errors")

**If you see errors:**
- Copy the exact error message
- Look for red text in console
- Check if there's a stack trace

---

### Step 3: Manually Check Storage

Paste this in the browser console (on any LinkedIn page):

```javascript
// Check network graph storage
chrome.storage.local.get(['networkGraph', 'profile_scrape_cache'], (data) => {
  console.log('=== NETWORK GRAPH DEBUG ===');
  console.log('Network Graph exists?', !!data.networkGraph);
  console.log('Nodes:', data.networkGraph?.nodes?.length || 0);
  console.log('Edges:', data.networkGraph?.edges?.length || 0);
  console.log('Cache entries:', data.profile_scrape_cache?.length || 0);

  if (data.networkGraph) {
    console.log('Sample node:', data.networkGraph.nodes[0]);
  }
  console.log('=========================');
});
```

**Expected output:**
```
=== NETWORK GRAPH DEBUG ===
Network Graph exists? true
Nodes: 3
Edges: 2
Cache entries: 3
Sample node: {id: "...", profile: {...}, degree: 2, matchScore: 0}
=========================
```

**If Nodes = 0:**
- Graph exists but is empty
- Profiles aren't being scraped
- Continue to Step 4

---

### Step 4: Test Profile Scraping Manually

On a LinkedIn profile page, paste this in console:

```javascript
// Test if profile data is scrapeable
const testScrape = () => {
  // Check if elements exist
  const name = document.querySelector('h1.text-heading-xlarge')?.textContent?.trim();
  const headline = document.querySelector('div.text-body-medium.break-words')?.textContent?.trim();
  const photo = document.querySelector('img.pv-top-card-profile-picture__image')?.src;

  console.log('=== PROFILE SCRAPING TEST ===');
  console.log('Name found:', name || 'MISSING');
  console.log('Headline found:', headline || 'MISSING');
  console.log('Photo found:', photo ? 'YES' : 'NO');
  console.log('Profile URL:', window.location.href);
  console.log('============================');

  if (!name) {
    console.error('❌ Cannot scrape profile - name element not found!');
    console.log('Possible reasons:');
    console.log('1. LinkedIn changed their HTML structure');
    console.log('2. Profile is private/restricted');
    console.log('3. Page hasn't fully loaded');
  } else {
    console.log('✅ Profile data is scrapeable');
  }
};

testScrape();
```

**If name is MISSING:**
- LinkedIn DOM structure changed (they do this often)
- Profile is private
- Need to update selectors in `linkedin-scraper.ts`

---

### Step 5: Manually Trigger Network Building

If scraping works but auto-building doesn't, manually trigger it:

```javascript
// Manually add current profile to graph
// NOTE: This won't work directly in console due to import restrictions
// But you can check if the function exists

console.log('Checking if network builder is available...');

// If you see the function in the extension context, it's loaded correctly
```

---

### Step 6: Check Content Script Integration

Verify the content script is actually running:

```javascript
// Check if content script variables exist
console.log('Window location:', window.location.href);
console.log('Is LinkedIn?', window.location.hostname.includes('linkedin.com'));
console.log('Is profile page?', window.location.href.includes('/in/'));
console.log('Should trigger?',
  window.location.href.includes('linkedin.com/in/') &&
  !window.location.href.includes('/edit/')
);
```

---

### Step 7: Clear Cache and Test Fresh

If nothing works, clear storage and try again:

```javascript
// CAUTION: This deletes your network graph!
chrome.storage.local.remove(['networkGraph', 'profile_scrape_cache'], () => {
  console.log('✅ Storage cleared. Now visit 3 LinkedIn profiles.');
});
```

Then:
1. Visit 3 different LinkedIn profile pages
2. Wait 5 seconds on each page
3. Check storage again (Step 3)
4. Try "Find Connection Path"

---

## Common Issues & Solutions

### Issue 1: "Extension not reloaded after build"
**Solution**: Go to `chrome://extensions/` and click reload button

### Issue 2: "Content script not loading"
**Symptoms**: No console logs at all
**Solution**:
- Check extension is enabled
- Check it has permissions for `<all_urls>`
- Try reloading the LinkedIn tab

### Issue 3: "Profile scraping fails"
**Symptoms**: Logs show "Failed to scrape profile data"
**Solution**:
- LinkedIn changed their HTML structure
- Wait 3-5 seconds for page to fully load
- Check if you're logged into LinkedIn

### Issue 4: "addProfileToGraph not defined"
**Symptoms**: `addProfileToGraph is not a function`
**Solution**:
- Import isn't working in content script
- Check build output for errors
- Verify network-builder-service.ts exports correctly

### Issue 5: "Graph saves but has 0 nodes"
**Symptoms**: networkGraph exists but nodes.length = 0
**Solution**:
- Scraping succeeds but node creation fails
- Check if LinkedInProfile → NetworkNode conversion is working
- Look for errors in `convertToNetworkNode()`

### Issue 6: "Rate limiting triggers too fast"
**Symptoms**: Only 1 profile added, then stops
**Solution**:
- Cache is working correctly (7-day TTL)
- Wait 2-5 seconds between profile visits
- Check cache: `chrome.storage.local.get('profile_scrape_cache')`

---

## Manual Testing Procedure

### Test 1: Fresh Install

1. Clear storage: `chrome.storage.local.clear()`
2. Reload extension
3. Visit Profile 1, wait 5 seconds
4. Check console for `[NETWORK]` logs
5. Check storage: should have 1 node
6. Visit Profile 2, wait 5 seconds
7. Check storage: should have 2 nodes
8. Visit Profile 3, wait 5 seconds
9. Check storage: should have 3 nodes
10. Open extension panel
11. Click "Find Connection Path"
12. Should show strategy (or error if <2 nodes)

### Test 2: Cache Behavior

1. Visit same profile twice within 7 days
2. First visit: Should add to graph
3. Second visit: Should show "Profile already in cache"
4. Check cache timestamp

### Test 3: Different Profile Types

Try these LinkedIn profiles:
- ✅ Public profile with full details
- ✅ Connection (1st degree)
- ⚠️ Private profile (may fail)
- ⚠️ Your own profile (should skip or handle specially)

---

## Debug Output Template

If still not working, provide this info:

```
### Extension Version
- Name: LinkedIn Network Pro / Uproot
- Version: [check manifest.json]

### Environment
- Browser: Chrome [version]
- OS: [Windows/Mac/Linux]

### Storage Status
[Paste output from Step 3]

### Profile Scraping Test
[Paste output from Step 4]

### Console Logs
[Copy all [Uproot] and [NETWORK] logs]

### Errors
[Copy any red error messages]

### Steps Taken
1. Reloaded extension: [Yes/No]
2. Cleared storage: [Yes/No]
3. Visited X profiles
4. Waited 5+ seconds per profile: [Yes/No]
```

---

## Next Steps Based on Results

### If scraping works but graph is empty:
➡️ Issue is in `addProfileToGraph()` or `saveNetworkGraph()`
➡️ Check if `NetworkGraph.addNode()` is being called
➡️ Check if `chrome.storage.local.set()` is failing

### If scraping fails:
➡️ LinkedIn DOM selectors need updating
➡️ Check `src/utils/linkedin-scraper.ts`
➡️ Update selectors for current LinkedIn HTML

### If content script doesn't load:
➡️ Check manifest.json permissions
➡️ Check matches pattern includes LinkedIn
➡️ Check build output includes content script

### If everything works in console but not automatically:
➡️ Check `observeUrlChanges()` in content.tsx
➡️ Check if setTimeout is executing
➡️ Check if condition `currentUrl.includes('linkedin.com/in/')` is true

---

## Emergency Fix: Manual Graph Building

If auto-building is broken, you can manually build a test graph:

```javascript
// Create a test graph manually
const testGraph = {
  nodes: [
    {
      id: "test-user-1",
      profile: {
        name: "Test User 1",
        headline: "Software Engineer",
        profileUrl: "https://linkedin.com/in/test1",
        skills: ["JavaScript", "Python"],
        experience: [],
        education: []
      },
      status: "not_contacted",
      degree: 2,
      matchScore: 0
    },
    {
      id: "test-user-2",
      profile: {
        name: "Test User 2",
        headline: "Product Manager",
        profileUrl: "https://linkedin.com/in/test2",
        skills: ["Strategy", "Leadership"],
        experience: [],
        education: []
      },
      status: "not_contacted",
      degree: 2,
      matchScore: 0
    }
  ],
  edges: [
    {
      from: "test-user-1",
      to: "test-user-2",
      weight: 0.8,
      relationshipType: "unknown"
    }
  ]
};

chrome.storage.local.set({ networkGraph: testGraph }, () => {
  console.log('✅ Test graph created!');
  console.log('Try clicking "Find Connection Path" now');
});
```

This will let you test if the pathfinding works even if scraping doesn't.
