# 🔌 API Integration Roadmap

**Status:** Documentation for future implementation
**Created:** November 20, 2025
**Purpose:** Track all APIs needed for full Uproot functionality

---

## 📊 Current Status Summary

### ✅ What's Built (No API Needed)
- **Notification Settings UI** - Complete with email/SMS/push toggles, frequency controls, type filtering
- **Settings Storage** - Chrome storage persists all preferences
- **Chrome Push Notifications** - Working via `chrome.notifications.create()`
- **Notification History** - Last 100 notifications saved to Chrome storage
- **Cover Letter Generator UI** - Complete with tone selection, ATS scoring, export functionality
- **Job Analyzer UI** - Job scraping, keyword extraction, ATS optimization
- **Resume Builder UI** - Profile building, experience management

### ⚠️ What Works But Needs Enhancement
- **Push Notifications** - Can be triggered manually via message passing, but no automatic event triggers
- **Job Scraping** - Works client-side but limited by LinkedIn's DOM structure changes
- **Cover Letter Generation** - Has template fallback, but AI generation requires API

### ❌ What Requires API Integration
1. **AI-Powered Generation** (Claude API)
2. **Email Notifications** (Resend API)
3. **SMS Notifications** (Twilio API)
4. **Automatic Event Triggers** (Background monitoring + API hooks)
5. **Company Research** (Web scraping or enrichment APIs)
6. **Advanced Analytics** (Backend API for aggregation)

---

## 🎯 Priority 1: AI Generation (Claude API)

### **Required For:**
- Cover letter AI generation with tone customization
- Resume bullet optimization with ATS keywords
- Professional summary writing
- Skills recommendation based on job requirements
- Hallucination-free content generation

### **API Details:**
- **Provider:** Anthropic
- **Model:** Claude 3.5 Sonnet (`claude-3-5-sonnet-20241022`)
- **Endpoint:** `https://api.anthropic.com/v1/messages`
- **Cost:** $3 per 1M input tokens, $15 per 1M output tokens
- **Free Tier:** None (pay-as-you-go)

### **Required Credentials:**
```bash
VITE_ANTHROPIC_API_KEY=sk-ant-api03-xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### **Integration Points:**

**1. Cover Letter Generator** (`src/services/cover-letter-generator.ts`)
```typescript
// Line 387-458: generateWithAI() function
// Currently commented out with TODO

async function generateWithAI(
  jobData: LinkedInJobData,
  jobAnalysis: JobDescriptionAnalysis,
  profile: ProfessionalProfile,
  tone: CoverLetterTone,
  targetWordCount: number,
  options: CoverLetterGenerationOptions
): Promise<CoverLetterContent> {
  const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY;

  if (!apiKey) {
    throw new Error('Claude API key not configured');
  }

  // Build context-aware prompt with strict anti-hallucination rules
  const prompt = buildCoverLetterPrompt(jobData, jobAnalysis, profile, tone, targetWordCount);

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 2048,
      temperature: 0.7,
      messages: [{
        role: 'user',
        content: prompt,
      }],
    }),
  });

  // Parse and validate response
  const result = await response.json();
  const content = parseCoverLetterResponse(result.content[0].text);

  // CRITICAL: Validate all claims against profile (prevent hallucinations)
  validateCoverLetterClaims(content, profile);

  return content;
}
```

**2. Resume Bullet Enhancer** (NEW SERVICE NEEDED)
```typescript
// src/services/ai-resume-enhancer.ts (NOT YET CREATED)

export async function enhanceResumeBullets(
  experiences: Experience[],
  jobKeywords: string[],
  profile: ProfessionalProfile
): Promise<EnhancedExperience[]> {
  const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY;

  // Use Claude to reword bullets with job keywords
  // STRICT RULE: Only use facts from user's actual experiences
  // NO invented metrics, achievements, or skills
}
```

### **Implementation Steps:**
1. ✅ Add API key to `.env` file
2. ✅ Uncomment AI generation code in `cover-letter-generator.ts`
3. ✅ Create `ai-resume-enhancer.ts` service
4. ✅ Add hallucination detection validation layer
5. ✅ Create UI toggle: "Generate with AI" vs "Use Template"
6. ✅ Add error handling for API failures (fallback to templates)
7. ✅ Test with multiple tones and job types
8. ✅ Monitor token usage and costs

### **Cost Estimation:**
- **Cover Letter:** ~1,500 input tokens + 800 output tokens = $0.016 per generation
- **Resume Bullets:** ~2,000 input tokens + 500 output tokens = $0.013 per resume
- **Monthly (100 cover letters + 50 resumes):** ~$2.25/month

---

## 🎯 Priority 2: Email Notifications (Resend API)

### **Required For:**
- Job alert emails (new matching jobs)
- Connection accepted notifications
- Message follow-up reminders
- Daily/weekly digest emails
- Activity update summaries

### **API Details:**
- **Provider:** Resend
- **Endpoint:** `https://api.resend.com/emails`
- **Cost:** $0 (3,000 emails/month free), then $20/month (50k emails)
- **Free Tier:** 3,000 emails/month, 100 emails/day

### **Required Credentials:**
```bash
VITE_RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
VITE_RESEND_FROM_EMAIL=notifications@uproot.app
```

### **Integration Points:**

**1. Notification Service** (NEW SERVICE NEEDED)
```typescript
// src/services/notification-service.ts (NOT YET CREATED)

export class NotificationService {
  private resendApiKey: string;
  private fromEmail: string;

  async sendEmail(
    to: string,
    subject: string,
    htmlBody: string,
    notificationType: NotificationType
  ): Promise<void> {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.resendApiKey}`,
      },
      body: JSON.stringify({
        from: this.fromEmail,
        to,
        subject,
        html: htmlBody,
      }),
    });

    if (!response.ok) {
      throw new Error(`Resend API error: ${response.statusText}`);
    }
  }

  async sendInstantNotification(payload: NotificationPayload, preferences: NotificationPreferences): Promise<void> {
    // Check if email enabled
    if (!preferences.email.enabled || preferences.email.frequency !== 'instant') {
      return;
    }

    // Check if type is enabled
    if (!preferences.email.types.includes(payload.type)) {
      return;
    }

    // Check quiet hours / DND mode
    if (this.isQuietHours(preferences) || preferences.dndMode?.enabled) {
      await this.queueForBatch(payload);
      return;
    }

    // Send immediately
    const html = this.buildEmailTemplate(payload);
    await this.sendEmail(
      preferences.email.address!,
      payload.title,
      html,
      payload.type
    );
  }

  async sendDailyDigest(preferences: NotificationPreferences): Promise<void> {
    // Get queued notifications from last 24 hours
    const notifications = await this.getQueuedNotifications('daily');

    if (notifications.length === 0) return;

    const html = this.buildDigestTemplate(notifications, 'daily');
    await this.sendEmail(
      preferences.email.address!,
      `Uproot Daily Digest - ${notifications.length} Updates`,
      html,
      'system'
    );

    // Clear queue
    await this.clearQueue('daily');
  }

  async sendWeeklyDigest(preferences: NotificationPreferences): Promise<void> {
    // Similar to daily but for 7-day window
  }
}
```

**2. Background Alarm Handlers** (`src/entrypoints/background.ts`)
```typescript
// Add to existing background.ts

// Create alarms for batch sending
chrome.alarms.create('daily-email-digest', {
  when: getNext9AM(), // 9 AM local time
  periodInMinutes: 1440, // 24 hours
});

chrome.alarms.create('weekly-email-digest', {
  when: getNextMondayAt9AM(),
  periodInMinutes: 10080, // 7 days = 10,080 minutes
});

// Handle alarm triggers
chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === 'daily-email-digest') {
    const settings = await StorageManager.getLocal('app_settings');
    if (settings?.notifications.email.frequency === 'daily') {
      await notificationService.sendDailyDigest(settings.notifications);
    }
  }

  if (alarm.name === 'weekly-email-digest') {
    const settings = await StorageManager.getLocal('app_settings');
    if (settings?.notifications.email.frequency === 'weekly') {
      await notificationService.sendWeeklyDigest(settings.notifications);
    }
  }
});
```

### **Email Templates:**

**Job Alert Template:**
```html
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #0077B5; color: white; padding: 20px; text-align: center; }
    .job-card { border: 1px solid #e5e5e5; padding: 20px; margin: 20px 0; }
    .cta-button { background: #0077B5; color: white; padding: 12px 24px; text-decoration: none; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>💼 New Job Match</h1>
    </div>
    <div class="job-card">
      <h2>{{jobTitle}}</h2>
      <p><strong>{{companyName}}</strong> · {{location}}</p>
      <p>{{description}}</p>
      <p><strong>Match Score:</strong> {{matchScore}}%</p>
      <a href="{{jobUrl}}" class="cta-button">View Job</a>
    </div>
  </div>
</body>
</html>
```

### **Implementation Steps:**
1. ✅ Sign up for Resend account (free tier)
2. ✅ Get API key from [resend.com/api-keys](https://resend.com/api-keys)
3. ✅ (Optional) Verify custom domain to avoid "via resend.com"
4. ✅ Create `notification-service.ts` with email sending logic
5. ✅ Build email templates (job alerts, digests, etc.)
6. ✅ Add alarm handlers for daily/weekly digests
7. ✅ Implement quiet hours and DND mode logic
8. ✅ Create notification queue in Chrome storage
9. ✅ Test instant, daily, and weekly sending
10. ✅ Add email validation in settings UI
11. ✅ Monitor Resend dashboard for delivery errors

### **Cost Estimation:**
- **Light User (10 alerts/day):** 300 emails/month = FREE
- **Moderate User (50 alerts/day):** 1,500 emails/month = FREE
- **Power User (100 alerts/day):** 3,000 emails/month = FREE
- **Enterprise (100+ alerts/day):** 5,000 emails/month = $20/month

---

## 🎯 Priority 3: SMS Notifications (Twilio API)

### **Required For:**
- Urgent job alerts via SMS
- Connection accepted notifications
- Critical reminders (interview deadlines, etc.)

### **API Details:**
- **Provider:** Twilio
- **Endpoint:** `https://api.twilio.com/2010-04-01/Accounts/{AccountSid}/Messages.json`
- **Cost:** $15 trial credit (~500 SMS), then $0.0075/SMS (US)
- **Free Tier:** $15 credit on sign-up

### **Required Credentials:**
```bash
VITE_TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
VITE_TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
VITE_TWILIO_PHONE_NUMBER=+15551234567
```

### **Integration Points:**

**1. Notification Service** (extend existing)
```typescript
// src/services/notification-service.ts

async sendSMS(
  to: string,
  message: string,
  notificationType: NotificationType
): Promise<void> {
  // Encode credentials for Basic Auth
  const credentials = btoa(`${this.twilioAccountSid}:${this.twilioAuthToken}`);

  const response = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${this.twilioAccountSid}/Messages.json`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${credentials}`,
      },
      body: new URLSearchParams({
        To: to,
        From: this.twilioPhoneNumber,
        Body: message,
      }),
    }
  );

  if (!response.ok) {
    throw new Error(`Twilio API error: ${response.statusText}`);
  }
}

async sendInstantSMS(payload: NotificationPayload, preferences: NotificationPreferences): Promise<void> {
  // Check if SMS enabled
  if (!preferences.sms.enabled) {
    return;
  }

  // Check if type is enabled (SMS typically only for critical alerts)
  if (!preferences.sms.types.includes(payload.type)) {
    return;
  }

  // Format message (max 160 characters for single SMS)
  const message = this.formatSMSMessage(payload);

  await this.sendSMS(
    preferences.sms.phoneNumber!,
    message,
    payload.type
  );
}

private formatSMSMessage(payload: NotificationPayload): string {
  // Keep under 160 characters to avoid multi-part SMS charges
  let message = `💼 ${payload.title}`;

  if (payload.body) {
    const bodyPreview = payload.body.substring(0, 100);
    message += `\n${bodyPreview}...`;
  }

  if (payload.url) {
    // Shorten URL or use link shortener API
    message += `\n${payload.url}`;
  }

  return message.substring(0, 160);
}
```

### **Important Considerations:**

**Trial Account Restrictions:**
- Can only send to verified phone numbers
- Must verify numbers at: [console.twilio.com/verified-caller-ids](https://console.twilio.com/us1/develop/phone-numbers/manage/verified)

**Legal Requirements:**
- Users must explicitly opt-in to SMS notifications
- Include opt-out instructions: "Reply STOP to unsubscribe"
- Don't send promotional content without consent (TCPA compliance)
- Respect quiet hours (no SMS after 9 PM local time)

**Cost Optimization:**
- SMS is expensive ($0.0075 per message in US)
- Only use for critical/urgent alerts
- Default to push/email for non-urgent notifications
- Consider SMS only for Elite tier users

### **Implementation Steps:**
1. ✅ Sign up for Twilio account (get $15 credit)
2. ✅ Purchase phone number (~$1/month)
3. ✅ Get Account SID and Auth Token
4. ✅ Add SMS sending to `notification-service.ts`
5. ✅ Add phone number validation in settings UI (E.164 format)
6. ✅ Implement character limit (160) and truncation
7. ✅ Add opt-out handling ("Reply STOP")
8. ✅ Verify test numbers in Twilio console (trial only)
9. ✅ Test SMS delivery
10. ✅ Add cost tracking/warnings in UI
11. ✅ Consider making SMS Elite-only feature

### **Cost Estimation:**
- **Light User (5 SMS/day):** 150 SMS/month = $1.13/month
- **Moderate User (20 SMS/day):** 600 SMS/month = $4.50/month
- **Power User (100 SMS/day):** 3,000 SMS/month = $22.50/month

**Recommendation:** SMS should be Elite-tier only or limited to critical alerts.

---

## 🎯 Priority 4: Automatic Event Triggers

### **Problem:**
Currently, notifications can only be triggered manually via:
```typescript
chrome.runtime.sendMessage({
  type: 'SEND_NOTIFICATION',
  payload: { title: '...', message: '...', iconUrl: '...' }
});
```

There's no automatic triggering when events occur (new jobs, new connections, etc.).

### **Required Integrations:**

**1. Job Alert Monitor** (NEW SERVICE NEEDED)
```typescript
// src/services/job-alert-monitor.ts

export class JobAlertMonitor {
  private checkInterval = 15 * 60 * 1000; // 15 minutes

  async start() {
    // Set up alarm to check for new jobs
    chrome.alarms.create('job-alert-check', {
      periodInMinutes: 15,
    });
  }

  async checkForNewJobs(): Promise<void> {
    // 1. Get user's job preferences from settings
    const settings = await StorageManager.getLocal('app_settings');
    const preferences = settings?.jobPreferences;

    if (!preferences) return;

    // 2. Query LinkedIn Jobs API (or scrape LinkedIn search results)
    const newJobs = await this.searchLinkedInJobs(preferences);

    // 3. Compare with previously seen jobs
    const unseenJobs = await this.filterUnseenJobs(newJobs);

    // 4. For each new match, send notification
    for (const job of unseenJobs) {
      await notificationService.sendNotification({
        type: 'job_alert',
        title: `New Job: ${job.title}`,
        body: `${job.company} · ${job.location}`,
        url: job.url,
        priority: 'high',
      }, settings.notifications);
    }

    // 5. Mark jobs as seen
    await this.markJobsAsSeen(unseenJobs);
  }

  private async searchLinkedInJobs(preferences: JobPreferences): Promise<Job[]> {
    // OPTION 1: Use LinkedIn's undocumented API (risky - may break)
    // OPTION 2: Scrape LinkedIn search results (violates TOS)
    // OPTION 3: Use RapidAPI LinkedIn scraper ($$ - requires subscription)
    // OPTION 4: Use user's existing LinkedIn session to search (complex)

    // For now, this requires LinkedIn API access or web scraping
    // Both have challenges (API access restricted, scraping violates TOS)
  }
}
```

**2. Connection Monitor** (NEW SERVICE NEEDED)
```typescript
// src/services/connection-monitor.ts

export class ConnectionMonitor {
  async checkForNewConnections(): Promise<void> {
    // 1. Get current connection count from LinkedIn
    const currentCount = await this.getConnectionCount();

    // 2. Compare with previous count
    const previousCount = await StorageManager.getLocal('connection_count');

    // 3. If increased, send notification
    if (currentCount > previousCount) {
      const newConnections = currentCount - previousCount;

      await notificationService.sendNotification({
        type: 'connection_accepted',
        title: `${newConnections} New Connection${newConnections > 1 ? 's' : ''}`,
        body: `You have ${newConnections} new connection${newConnections > 1 ? 's' : ''} on LinkedIn`,
        url: 'https://www.linkedin.com/mynetwork/invite-connect/connections/',
        priority: 'normal',
      }, settings.notifications);
    }

    // 4. Update stored count
    await StorageManager.setLocal('connection_count', currentCount);
  }

  private async getConnectionCount(): Promise<number> {
    // Scrape from LinkedIn connections page
    // Requires content script access to LinkedIn DOM
  }
}
```

**3. Watchlist Monitor** (PARTIALLY IMPLEMENTED)
```typescript
// src/services/watchlist-monitor.ts (EXISTS - line 1-450)

// Current implementation:
// - Monitors people/companies in watchlist
// - Detects job changes, posts, etc.
// - Stores activity in Chrome storage

// TODO: Add notification triggering
export async function checkWatchlistActivity(): Promise<void> {
  const watchlist = await getWatchlist();

  for (const item of watchlist) {
    const activity = await detectActivity(item);

    if (activity.length > 0) {
      // Currently just stores activity
      await storeActivity(activity);

      // TODO: Also send notification
      for (const event of activity) {
        await notificationService.sendNotification({
          type: 'activity_update',
          title: event.title,
          body: event.description,
          url: event.url,
          priority: 'normal',
        }, settings.notifications);
      }
    }
  }
}
```

**4. Background Alarm Orchestration** (`src/entrypoints/background.ts`)
```typescript
// Add to existing background.ts

// Create alarms for all monitors
chrome.runtime.onInstalled.addListener(async (details) => {
  if (details.reason === 'install') {
    // Job alerts every 15 minutes
    chrome.alarms.create('job-alert-check', {
      periodInMinutes: 15,
    });

    // Connection check every hour
    chrome.alarms.create('connection-check', {
      periodInMinutes: 60,
    });

    // Watchlist activity every 30 minutes
    chrome.alarms.create('watchlist-check', {
      periodInMinutes: 30,
    });
  }
});

// Handle all alarms
chrome.alarms.onAlarm.addListener(async (alarm) => {
  switch (alarm.name) {
    case 'job-alert-check':
      await jobAlertMonitor.checkForNewJobs();
      break;

    case 'connection-check':
      await connectionMonitor.checkForNewConnections();
      break;

    case 'watchlist-check':
      await checkWatchlistActivity();
      break;
  }
});
```

### **Implementation Challenges:**

**LinkedIn API Access:**
- LinkedIn's official API is **very restricted**
- Job search API requires partnership approval
- People search API not available to public
- **Workaround:** Client-side scraping when user is on LinkedIn

**Scraping Concerns:**
- Violates LinkedIn's Terms of Service
- DOM selectors break frequently
- Rate limiting and IP bans
- **Workaround:** Only scrape when user actively browses LinkedIn, use existing session

**Alternative: Third-Party APIs:**
- RapidAPI LinkedIn scrapers: $50-200/month
- Proxycurl API: $0.02 per profile lookup
- ScraperAPI: $49/month for 100k requests
- **Consideration:** Pass costs to Elite tier users

### **Implementation Steps:**
1. ✅ Create alarm handlers in `background.ts`
2. ✅ Implement `job-alert-monitor.ts` service
3. ✅ Implement `connection-monitor.ts` service
4. ✅ Enhance `watchlist-monitor.ts` with notifications
5. ✅ Add quiet hours / DND checking before sending
6. ✅ Implement notification frequency throttling (avoid spam)
7. ✅ Test all monitors
8. ✅ Add user controls: pause alerts, adjust frequency
9. ✅ Consider rate limiting to avoid LinkedIn detection

---

## 🎯 Priority 5: Company Research API

### **Required For:**
- Cover letter personalization (company values, culture, mission)
- Enriched company data (size, industry, recent news)
- Better job recommendations

### **Current Implementation:**
Cover letter generator has placeholder for company research:
```typescript
// src/services/cover-letter-generator.ts (line 87-97)

// TODO: Research company (currently using basic job data only)
const companyResearch = {
  name: jobData.company || 'the company',
  industry: jobAnalysis.industry || 'this industry',
  values: jobAnalysis.companyValues || [],
  mission: '',
  culture: [],
  recentNews: [],
};
```

### **API Options:**

**Option 1: Clearbit Enrichment API**
- **Endpoint:** `https://company.clearbit.com/v2/companies/find?domain=example.com`
- **Cost:** $99/month (50k lookups), $499/month (250k lookups)
- **Data:** Logo, industry, employee count, description, founded year

**Option 2: Proxycurl Company API**
- **Endpoint:** `https://nubela.co/proxycurl/api/linkedin/company`
- **Cost:** $0.05 per company lookup
- **Data:** Full LinkedIn company data (employees, recent posts, jobs, etc.)

**Option 3: LinkedIn Scraping (Client-Side)**
- **Method:** Scrape company "About" page when user visits
- **Cost:** FREE
- **Data:** Mission, values, employee count, recent posts
- **Risk:** Violates LinkedIn TOS

**Option 4: OpenAI/Claude for Company Analysis**
- **Method:** Use AI to analyze company website, news articles
- **Cost:** ~$0.01 per analysis
- **Data:** Summarized mission, values, culture from public sources

### **Recommended Approach:**

**Hybrid Strategy:**
1. **Free Tier:** Client-side scraping when user visits LinkedIn company page
2. **Elite Tier:** Proxycurl API for richer data ($0.05 per lookup)
3. **AI Enhancement:** Use Claude to summarize and extract values from scraped data

```typescript
// src/services/company-research.ts (NEW SERVICE)

export async function researchCompany(
  companyName: string,
  linkedinUrl?: string,
  tier: 'free' | 'elite' = 'free'
): Promise<CompanyResearch> {

  if (tier === 'elite' && linkedinUrl) {
    // Use Proxycurl API for comprehensive data
    return await fetchProxycurlData(linkedinUrl);
  }

  // Free tier: Client-side scraping
  if (linkedinUrl) {
    return await scrapeLinkedInCompanyPage(linkedinUrl);
  }

  // Fallback: Search company website and use AI
  return await analyzeCompanyWithAI(companyName);
}

async function fetchProxycurlData(linkedinUrl: string): Promise<CompanyResearch> {
  const apiKey = import.meta.env.VITE_PROXYCURL_API_KEY;

  const response = await fetch(
    `https://nubela.co/proxycurl/api/linkedin/company?url=${encodeURIComponent(linkedinUrl)}`,
    {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
    }
  );

  const data = await response.json();

  return {
    name: data.name,
    industry: data.industry,
    employeeCount: data.company_size,
    description: data.description,
    mission: data.tagline,
    values: extractValuesFromDescription(data.description),
    recentNews: data.updates?.slice(0, 3) || [],
    culture: data.specialities || [],
  };
}

async function scrapeLinkedInCompanyPage(linkedinUrl: string): Promise<CompanyResearch> {
  // Inject content script to scrape company page
  // Extract: About section, employee count, recent posts

  const result = await chrome.tabs.sendMessage(activeTabId, {
    type: 'SCRAPE_COMPANY_PAGE',
    url: linkedinUrl,
  });

  return result.companyData;
}

async function analyzeCompanyWithAI(companyName: string): Promise<CompanyResearch> {
  // Use Claude to research company from public sources
  const prompt = `Research ${companyName}. Provide:
  1. Mission statement
  2. Core values (3-5)
  3. Company culture keywords
  4. Recent news (last 3 months)

  Only use publicly available information. If unsure, say "Unknown".`;

  // Call Claude API
  const research = await callClaudeAPI(prompt);

  return parseCompanyResearch(research);
}
```

### **Implementation Steps:**
1. ✅ Create `company-research.ts` service
2. ✅ Implement client-side LinkedIn scraping (free tier)
3. ✅ (Optional) Integrate Proxycurl API (Elite tier)
4. ✅ Add AI-based company analysis fallback
5. ✅ Update cover letter generator to use company research
6. ✅ Cache company data to avoid repeated lookups
7. ✅ Test with various companies

### **Cost Estimation:**
- **Free Tier (scraping):** $0/month
- **Elite Tier (Proxycurl):** $0.05 × 50 companies/month = $2.50/month
- **AI Analysis (fallback):** $0.01 × 20 companies/month = $0.20/month

---

## 🎯 Priority 6: Backend API (Optional Enhancement)

### **Why Consider a Backend?**

**Current Architecture:**
- All data stored in Chrome local storage (5 MB limit)
- No cross-device sync
- No analytics aggregation
- No backup/recovery
- Limited to client-side operations

**Backend Benefits:**
- **Cloud Storage:** Unlimited data, sync across devices
- **Advanced Analytics:** Track success rates, optimize recommendations
- **Backup & Recovery:** Never lose user data
- **Collaboration Features:** Share profiles, templates with team
- **API Key Management:** Securely store API keys server-side
- **Rate Limiting:** Prevent abuse, manage costs
- **Premium Features:** Subscription management, payment processing

### **Tech Stack Options:**

**Option 1: Supabase (Current Plan)**
- **Services:** Postgres DB, Auth, Storage, Edge Functions
- **Cost:** FREE (500 MB DB, 50k edge function invocations)
- **Pros:** Easy setup, generous free tier, built-in auth
- **Cons:** Learning curve for edge functions

**Option 2: Firebase**
- **Services:** Firestore, Auth, Cloud Functions
- **Cost:** FREE (1 GB storage, 125k reads/day)
- **Pros:** Simple, well-documented, real-time sync
- **Cons:** NoSQL data model (less flexible)

**Option 3: Custom Backend (Node.js + Postgres)**
- **Services:** Express API, Postgres, Redis cache
- **Cost:** $5/month (Railway, Render, DigitalOcean)
- **Pros:** Full control, any tech stack
- **Cons:** More maintenance, setup time

### **Recommended Backend Features:**

**1. User Profile Sync**
```typescript
// Sync user profile across devices
POST /api/profile/sync
{
  "userId": "user-123",
  "profile": { /* ProfessionalProfile */ },
  "lastModified": "2025-11-20T21:12:00Z"
}

// Response: merged profile with conflict resolution
```

**2. Cloud Storage for Resumes/Cover Letters**
```typescript
// Store generated documents
POST /api/documents
{
  "userId": "user-123",
  "type": "cover_letter",
  "jobId": "job-456",
  "content": { /* CoverLetter */ },
  "version": 1
}

// List user's documents
GET /api/documents?userId=user-123&type=cover_letter
```

**3. Analytics Aggregation**
```typescript
// Track success metrics
POST /api/analytics/event
{
  "userId": "user-123",
  "event": "cover_letter_generated",
  "metadata": {
    "tone": "professional",
    "atsScore": 87,
    "jobId": "job-456"
  }
}

// Get aggregated stats
GET /api/analytics/stats?userId=user-123
// Returns: total applications, avg ATS score, success rate, etc.
```

**4. API Key Management (Security)**
```typescript
// Store API keys securely server-side
POST /api/keys
{
  "userId": "user-123",
  "service": "anthropic",
  "key": "sk-ant-xxx" // Encrypted in DB
}

// Extension fetches proxied API calls
POST /api/ai/generate
{
  "userId": "user-123",
  "prompt": "...",
  "model": "claude-3-5-sonnet"
}
// Server uses stored key, extension never sees it
```

**5. Subscription Management**
```typescript
// Premium tier features
GET /api/subscription/status?userId=user-123
// Returns: { tier: 'elite', features: [...], expiresAt: '...' }

// Stripe webhook for payment processing
POST /api/webhooks/stripe
// Updates subscription status
```

### **Implementation Steps (If Building Backend):**
1. ✅ Set up Supabase project
2. ✅ Create database schema (users, profiles, documents, analytics)
3. ✅ Implement authentication (OAuth with LinkedIn)
4. ✅ Create API endpoints (profile sync, document storage)
5. ✅ Add edge functions for AI proxying (hide API keys)
6. ✅ Implement real-time sync (Supabase Realtime)
7. ✅ Add analytics tracking
8. ✅ Set up Stripe integration (subscription payments)
9. ✅ Update extension to use backend APIs
10. ✅ Add offline mode fallback (Chrome storage)

### **Cost Estimation (Supabase):**
- **Free Tier:** 500 MB DB, 50k edge functions, 2 GB bandwidth
- **Pro Tier ($25/month):** 8 GB DB, 500k edge functions, 250 GB bandwidth
- **Recommendation:** Start with free tier, upgrade if needed

---

## 📋 Summary: API Integration Priorities

| Priority | API/Service | Purpose | Cost (Est.) | Complexity | Timeline |
|----------|-------------|---------|-------------|------------|----------|
| **P1** | Claude API | AI cover letters, resume optimization | $2-5/month | Medium | 1 week |
| **P2** | Resend API | Email notifications, digests | FREE - $20/month | Low | 3 days |
| **P3** | Twilio API | SMS alerts (Elite tier) | $1-5/month | Low | 2 days |
| **P4** | Event Triggers | Automatic job/connection alerts | $0 | High | 2 weeks |
| **P5** | Company Research | Proxycurl or AI-based | $0-3/month | Medium | 1 week |
| **P6** | Backend (Optional) | Cloud sync, analytics, security | $0-25/month | High | 4 weeks |

---

## 🚦 Recommended Implementation Order

### **Phase 1: Core AI (Week 1)**
1. Add Claude API integration
2. Implement AI cover letter generation
3. Add hallucination detection
4. Test with multiple tones

### **Phase 2: Email Alerts (Week 2)**
1. Set up Resend account
2. Create notification-service.ts
3. Build email templates
4. Add daily/weekly digest logic
5. Test all email flows

### **Phase 3: Automatic Triggers (Week 3-4)**
1. Implement job alert monitoring
2. Add connection monitoring
3. Enhance watchlist monitoring
4. Set up background alarms
5. Add notification throttling
6. Test end-to-end automation

### **Phase 4: Enhancements (Week 5+)**
1. (Optional) Add SMS via Twilio
2. (Optional) Add company research API
3. (Optional) Build backend for sync
4. (Optional) Add analytics tracking

---

## 🔐 Security Considerations

### **API Key Storage:**

**❌ NEVER do this:**
```typescript
// Hardcoded in source code
const apiKey = 'sk-ant-xxxxx';
```

**✅ Good for development:**
```typescript
// .env file (not committed to git)
VITE_ANTHROPIC_API_KEY=sk-ant-xxxxx

// Usage
const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY;
```

**✅ Best for production:**
```typescript
// Store encrypted in Chrome storage
const settings = await chrome.storage.local.get('api_keys');
const apiKey = decryptApiKey(settings.api_keys.anthropic);

// OR: Use backend proxy (API key never touches client)
const response = await fetch('https://api.uproot.app/ai/generate', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${userToken}` },
  body: JSON.stringify({ prompt: '...' }),
});
```

### **Rate Limiting:**
- Implement client-side rate limiting to prevent abuse
- Track API usage per user
- Show usage warnings in UI
- Consider monthly quotas for free tier

### **Error Handling:**
- Always handle API failures gracefully
- Provide fallback to template generation
- Show clear error messages to users
- Log errors for debugging

---

## 📊 Total Cost Estimate

### **Monthly Cost Breakdown:**

**Free Tier (Limited AI, Push Only):**
- Claude API: $2-5/month (moderate use)
- Resend Email: $0/month (under 3k emails)
- Twilio SMS: $0/month (not used)
- Chrome Push: $0/month (free)
- **Total: $2-5/month**

**Elite Tier (All Features):**
- Claude API: $5-10/month (heavy use)
- Resend Email: $0-20/month (under 50k emails)
- Twilio SMS: $3-5/month (limited use)
- Proxycurl: $2-5/month (50 lookups)
- Supabase: $0-25/month (if using backend)
- **Total: $10-65/month**

**Revenue Model:**
- Free Tier: Push notifications only, limited AI (5 cover letters/month)
- Elite Tier ($9.99/month): Unlimited AI, email, SMS, cloud sync
- **Break-even:** ~2 Elite subscribers cover all API costs

---

## ✅ Next Steps

1. **Immediate:** Add Claude API key to `.env` for cover letter generation
2. **This Week:** Set up Resend for email notifications
3. **Next Week:** Implement automatic job alert triggers
4. **Future:** Consider backend for advanced features

---

**Last Updated:** November 20, 2025
**Maintained By:** Agent Girl
**Status:** Living document - update as APIs are integrated
