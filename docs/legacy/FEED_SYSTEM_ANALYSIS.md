# Feed System Analysis & Missing Functionality

**Date**: November 20, 2024
**Issue**: Watchlist company job alerts not appearing in feed
**Status**: ❌ **Critical Integration Missing**

---

## 🔍 Problem Summary

The Feed page UI and infrastructure are **fully implemented**, but the **backend monitoring service that generates feed items** is not connected. Specifically:

1. ✅ Feed UI works perfectly
2. ✅ Feed storage/retrieval works
3. ✅ Watchlist monitor service is complete
4. ❌ **Monitoring service is NEVER called**
5. ❌ **No content script to trigger monitoring**

**Result**: Feed page shows empty state because no feed items are being generated from watchlist activity.

---

## 📊 Current Architecture

### What Exists:

```
┌─────────────────────────────────────────────────────────────┐
│                         Feed UI                              │
│                     (FeedTab.tsx)                           │
│  - Displays feed items                                       │
│  - Filters (jobs, companies, people)                         │
│  - Mark as read/unread                                       │
└─────────────────────────────────────────────────────────────┘
                           ↑
                           │ Loads from storage
                           │
┌─────────────────────────────────────────────────────────────┐
│                    Chrome Storage                            │
│                  (uproot_feed key)                          │
│  - FeedItem[]                                                │
│  - Stats (unread count, etc.)                                │
└─────────────────────────────────────────────────────────────┘
                           ↑
                           │ Should be populated by
                           │
┌─────────────────────────────────────────────────────────────┐
│              Watchlist Monitor Service                       │
│          (watchlist-monitor.ts) ✅ COMPLETE                 │
│  - checkCompanyJobs() - detects new jobs                    │
│  - checkPersonProfile() - detects job changes                │
│  - checkCompanyUpdates() - detects posts                     │
│  - generateJobAlertFeedItem() - creates feed items           │
└─────────────────────────────────────────────────────────────┘
                           ↑
                           │ ❌ NEVER CALLED!
                           │
┌─────────────────────────────────────────────────────────────┐
│                Background Script                             │
│            (background.ts) ⚠️ INCOMPLETE                    │
│  - Alarm: 'activity-monitor' (every 15 min) ✅             │
│  - Handler: handleActivityMonitoring() ❌ TODO STUB         │
└─────────────────────────────────────────────────────────────┘
```

---

## ❌ Missing Piece #1: Background Monitoring

**File**: `src/entrypoints/background.ts`
**Line**: 299-309
**Status**: ❌ TODO Stub

### Current Code:
```typescript
async function handleActivityMonitoring() {
  log.debug(LogCategory.BACKGROUND, 'Starting activity monitoring check');

  try {
    // TODO: Implement activity monitoring  ⬅️ DOES NOTHING!
    log.debug(LogCategory.BACKGROUND, 'Activity monitoring check completed (not yet implemented)');
  } catch (error) {
    log.error(LogCategory.BACKGROUND, 'Activity monitoring check failed', error as Error);
    throw error;
  }
}
```

### What It Should Do:

```typescript
async function handleActivityMonitoring() {
  log.debug(LogCategory.BACKGROUND, 'Starting activity monitoring check');

  try {
    // 1. Load watchlist and preferences
    const watchlistCompanies = await getWatchlistCompanies();
    const watchlistPeople = await getWatchlistPeople();
    const jobPreferences = await getJobPreferences();

    // 2. Filter companies with job alerts enabled
    const companiesWithAlerts = watchlistCompanies.filter(c => c.jobAlertEnabled);

    if (companiesWithAlerts.length === 0) {
      log.debug(LogCategory.BACKGROUND, 'No companies with job alerts enabled');
      return;
    }

    log.info(LogCategory.BACKGROUND, `Monitoring ${companiesWithAlerts.length} companies for job alerts`);

    // 3. For each company, check jobs in background
    for (const company of companiesWithAlerts) {
      try {
        // Open company jobs page in hidden tab
        const tab = await chrome.tabs.create({
          url: `${company.companyUrl}/jobs`,
          active: false, // Don't switch to tab
        });

        // Wait for page to load
        await new Promise(resolve => {
          const listener = (tabId: number, changeInfo: any) => {
            if (tabId === tab.id && changeInfo.status === 'complete') {
              chrome.tabs.onUpdated.removeListener(listener);
              resolve(null);
            }
          };
          chrome.tabs.onUpdated.addListener(listener);
        });

        // Send message to content script to scrape jobs
        await chrome.tabs.sendMessage(tab.id!, {
          type: 'CHECK_COMPANY_JOBS',
          company,
          preferences: jobPreferences
        });

        // Close tab after scraping
        await chrome.tabs.remove(tab.id!);

        log.info(LogCategory.BACKGROUND, `Checked jobs for ${company.name}`);
      } catch (error) {
        log.error(LogCategory.BACKGROUND, `Failed to check jobs for ${company.name}`, error as Error);
      }
    }

    log.info(LogCategory.BACKGROUND, 'Activity monitoring check completed');
  } catch (error) {
    log.error(LogCategory.BACKGROUND, 'Activity monitoring check failed', error as Error);
    throw error;
  }
}
```

---

## ❌ Missing Piece #2: Content Script

**File**: DOES NOT EXIST (needs to be created)
**Location**: `src/entrypoints/content.ts`
**Status**: ❌ Missing

### What It Should Do:

```typescript
// src/entrypoints/content.ts
export default defineContentScript({
  matches: ['*://www.linkedin.com/*'],
  main() {
    // Listen for messages from background script
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      (async () => {
        if (message.type === 'CHECK_COMPANY_JOBS') {
          const { company, preferences } = message;

          // Use watchlist monitor service
          const newJobs = await checkCompanyJobs(company, preferences);

          sendResponse({
            success: true,
            newJobsCount: newJobs.length
          });
        }

        if (message.type === 'MONITOR_CURRENT_PAGE') {
          const { watchlistCompanies, watchlistPeople, preferences } = message;

          // Check if current page is watchlisted
          await monitorCurrentPage(watchlistCompanies, watchlistPeople, preferences);

          sendResponse({ success: true });
        }
      })();

      return true; // Async response
    });

    // Also monitor when user naturally navigates to watchlist pages
    window.addEventListener('load', async () => {
      const currentUrl = window.location.href;

      // Only monitor if on LinkedIn
      if (!currentUrl.includes('linkedin.com')) return;

      // Load watchlist and preferences
      const watchlistCompanies = await getWatchlistCompanies();
      const watchlistPeople = await getWatchlistPeople();
      const jobPreferences = await getJobPreferences();

      // Check current page
      await monitorCurrentPage(watchlistCompanies, watchlistPeople, jobPreferences);
    });
  }
});
```

---

## 📋 Implementation Checklist

### Phase 1: Background Monitoring (Priority: HIGH)
- [ ] Implement `handleActivityMonitoring()` in background.ts
- [ ] Add helper functions to load watchlist from storage
- [ ] Add logic to open company jobs pages in background tabs
- [ ] Add message passing to content script for scraping
- [ ] Add error handling and retry logic

### Phase 2: Content Script Integration (Priority: HIGH)
- [ ] Create `src/entrypoints/content.ts`
- [ ] Add message listener for `CHECK_COMPANY_JOBS`
- [ ] Add automatic monitoring on page load
- [ ] Add message listener for `MONITOR_CURRENT_PAGE`
- [ ] Import and use watchlist-monitor service

### Phase 3: Testing (Priority: HIGH)
- [ ] Add a test company to watchlist
- [ ] Enable job alerts for that company
- [ ] Wait for alarm trigger (or manually trigger)
- [ ] Verify feed items appear in Feed tab
- [ ] Verify match scores are calculated correctly
- [ ] Verify Easy Apply badge shows up

### Phase 4: Optimization (Priority: MEDIUM)
- [ ] Add rate limiting (don't check too frequently)
- [ ] Add caching (don't re-check same jobs)
- [ ] Add user notification when new jobs found
- [ ] Add settings to control monitoring frequency
- [ ] Add manual "Check Now" button

---

## 🎯 Expected Behavior After Fix

### Automatic Background Monitoring:
1. Every 15 minutes, background script wakes up
2. Loads watchlist companies with job alerts enabled
3. For each company:
   - Opens their LinkedIn jobs page (hidden tab)
   - Scrapes current job listings
   - Compares with previous snapshot
   - Detects new jobs
   - Filters by user preferences (title, location, etc.)
   - Generates feed items for matches
   - Closes hidden tab
4. Feed items appear in Feed tab with:
   - Job title
   - Company name & logo
   - Location
   - Match score (percentage)
   - "Easy Apply" or "View Job" button

### Manual Page Monitoring:
1. User visits watchlisted company's page
2. Content script detects it's a watchlisted page
3. If on `/jobs` page:
   - Automatically scrapes jobs
   - Generates feed items for new matches
4. If on `/posts` page:
   - Scrapes company updates
   - Generates feed items for new posts
5. User sees notification: "3 new job matches from [Company]"

---

## 🔧 Quick Fix Priority

**Highest Priority**: Implement background monitoring (Phase 1)
- This enables automatic job alerts every 15 minutes
- Doesn't require user to visit pages manually
- Matches expected behavior from documentation

**Second Priority**: Content script (Phase 2)
- Enables real-time monitoring when browsing
- Better user experience (instant alerts)
- Reduces background processing load

---

## 📝 Notes

- The watchlist-monitor service is **already fully implemented** and tested
- The Feed UI is **already fully implemented** and works correctly
- The only missing piece is the **glue code** to trigger monitoring
- Alarm is already set up (every 15 minutes)
- Just needs the handler implementation + content script

---

**Estimated Time to Fix**: 2-3 hours
- 1 hour: Background monitoring implementation
- 1 hour: Content script creation
- 1 hour: Testing and debugging

**Complexity**: Medium
- Code is straightforward (mostly wiring existing services)
- Main challenge is Chrome extension message passing
- Testing requires waiting for alarms or manual triggering

---

**Ready to implement the fix?** 🚀
