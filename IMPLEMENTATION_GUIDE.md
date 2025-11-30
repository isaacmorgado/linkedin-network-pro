# Implementation Guide

This document provides a roadmap for completing the LinkedIn Network Pro extension skeleton.

## ✅ Completed

The skeleton includes:

1. ✅ **Project Structure** - WXT-based, TypeScript-first
2. ✅ **Configuration Files** - package.json, tsconfig.json, wxt.config.ts, tailwind.config.ts
3. ✅ **Type System** - Comprehensive Zod schemas for all data models
4. ✅ **Storage Utilities** - Type-safe chrome.storage wrappers
5. ✅ **Supabase Integration** - Auth service with Google OAuth support
6. ✅ **Service Worker** - Background script with alarms, message handlers
7. ✅ **Content Script** - LinkedIn injection, SPA navigation detection
8. ✅ **Scrapers** - Profile, job, and activity data extraction
9. ✅ **Graph Algorithms** - Dijkstra, BFS, match scoring
10. ✅ **State Management** - Zustand stores for auth and settings
11. ✅ **UI Components** - FloatingPanel, ProfileTab skeleton
12. ✅ **Styling** - Tailwind with Apple-inspired design system
13. ✅ **Documentation** - README, ARCHITECTURE, this guide

## 🚧 Next Steps to Complete

### Phase 1: Core UI Components (1-2 weeks)

#### Missing Components

Create the following React components:

```bash
src/components/
├── auth/
│   ├── LoginScreen.tsx        # Email/password + Google OAuth
│   └── SignupScreen.tsx       # Registration form
├── navigation/
│   └── TabNavigation.tsx      # Tab switcher
├── tabs/
│   ├── WatchlistTab.tsx       # Watchlist management
│   ├── JobsTab.tsx            # Job tools and saved jobs
│   ├── FeedTab.tsx            # Activity feed
│   ├── SettingsTab.tsx        # Settings panel
│   └── NotificationsTab.tsx   # Notifications list
└── ui/
    ├── Button.tsx             # Reusable button
    ├── Input.tsx              # Form inputs
    ├── Card.tsx               # Card container
    ├── MatchScore.tsx         # Star rating display
    ├── NetworkPath.tsx        # Visual route display
    ├── ProgressBar.tsx        # Connection progress
    └── Toast.tsx              # Notification toasts
```

**Implementation Priority:**
1. LoginScreen (blocking - required for auth)
2. TabNavigation (blocking - required for UI)
3. SettingsTab (high - needed for profile setup)
4. WatchlistTab (high - core feature)
5. JobsTab (medium - Pro+ feature)
6. Others (low - can be stubbed initially)

### Phase 2: AI Integration (1-2 weeks)

Create AI service layer:

```typescript
// src/lib/ai.ts

export class AIService {
  static async generateMessage(context: {
    profile: LinkedInProfile;
    userProfile: UserProfile;
    tone: 'professional' | 'casual' | 'enthusiastic';
  }): Promise<PersonalizedMessage> {
    // 1. Build prompt with context
    // 2. Call Claude API with structured output
    // 3. Validate response against facts
    // 4. Return with citations
  }

  static async tailorResume(job: JobPosting, profile: UserProfile): Promise<string> {
    // 1. Extract keywords from job description
    // 2. Match with user's experience
    // 3. Generate tailored bullets
    // 4. Return formatted resume
  }

  static async generateCoverLetter(job: JobPosting, profile: UserProfile): Promise<CoverLetter> {
    // 1. Analyze job description
    // 2. Match user's background
    // 3. Generate structured sections
    // 4. Return editable sections
  }
}
```

**Key Files:**
- `src/lib/ai.ts` - AI service with Claude integration
- `src/lib/prompts.ts` - Prompt templates
- `src/lib/validators.ts` - Anti-hallucination validators

**Testing:**
- Unit tests for prompt generation
- Integration tests with mock API responses
- Validation tests for fact-checking

### Phase 3: Supabase Backend (1 week)

Set up Supabase Edge Functions:

```typescript
// supabase/functions/stripe-webhook/index.ts
// Handle Stripe webhooks

// supabase/functions/ai-generate/index.ts
// Proxy AI requests (if not calling directly from extension)

// supabase/functions/monitor-activity/index.ts
// Background job to monitor LinkedIn activity
```

**Database Schema:**

```sql
-- Already provided in README.md
-- Add additional tables as needed:

CREATE TABLE watchlist_people (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id),
  profile_id TEXT NOT NULL,
  profile_data JSONB,
  match_score INTEGER,
  added_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE saved_jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id),
  job_data JSONB,
  application_status TEXT,
  saved_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Phase 4: Graph Computation Worker (1 week)

Implement Web Worker for heavy computation:

```typescript
// src/workers/graph-worker.ts

self.onmessage = (e) => {
  const { type, payload } = e.data;

  if (type === 'COMPUTE_ROUTE') {
    const { sourceId, targetId, networkData } = payload;

    // Build graph
    const graph = new NetworkGraph();
    graph.import(networkData);

    // Compute route
    const route = graph.findWeightedPath(sourceId, targetId);

    // Return result
    self.postMessage({ type: 'ROUTE_RESULT', data: route });
  }
};
```

**Integration:**
- Update service worker to spawn worker
- Handle message passing
- Implement cancellation for long-running tasks

### Phase 5: Resume & PDF Generation (1 week)

Implement resume tools:

```typescript
// src/lib/resume.ts

import { Document, Page, View, Text, pdf } from '@react-pdf/renderer';

export class ResumeService {
  static async generatePDF(profile: UserProfile, tailoredBullets: string[]): Promise<Blob> {
    const doc = (
      <Document>
        <Page size="A4">
          {/* Resume layout */}
        </Page>
      </Document>
    );

    const blob = await pdf(doc).toBlob();
    return blob;
  }

  static extractKeywords(jobDescription: string): string[] {
    // Use compromise.js for NLP
    // Extract tech skills, action verbs
  }

  static matchExperience(keywords: string[], experience: any[]): any[] {
    // Match job keywords to user experience
    // Return ranked matches
  }
}
```

**Key Libraries:**
- `@react-pdf/renderer` - PDF generation
- `compromise` - NLP for keyword extraction
- `pdf-lib` - PDF manipulation

### Phase 6: Notifications (3-5 days)

Implement notification system:

```typescript
// src/lib/notifications.ts

export class NotificationService {
  static async send(notification: Notification) {
    const settings = await StorageManager.getLocal('app_settings');

    // Chrome notification
    if (settings.notifications.push.enabled) {
      await chrome.notifications.create({ ... });
    }

    // Email notification
    if (settings.notifications.email.enabled) {
      await sendEmail(notification); // Resend API
    }

    // SMS notification
    if (settings.notifications.sms.enabled) {
      await sendSMS(notification); // Twilio API
    }
  }
}
```

**Backend:**
- Resend for emails
- Twilio for SMS
- Edge Function to proxy requests

### Phase 7: Testing (Ongoing)

Add comprehensive tests:

```bash
src/
├── __tests__/
│   ├── lib/
│   │   ├── graph.test.ts      # Graph algorithms
│   │   ├── storage.test.ts    # Storage utilities
│   │   └── validators.test.ts # Data validation
│   ├── components/
│   │   └── FloatingPanel.test.tsx
│   └── integration/
│       ├── auth.test.ts       # Auth flows
│       └── scraping.test.ts   # Scraper tests
```

**Testing Stack:**
- Vitest for unit tests
- @testing-library/react for component tests
- Playwright for E2E tests

### Phase 8: Polish & Optimization (1 week)

**Performance:**
- [ ] Implement React.lazy for code splitting
- [ ] Add loading skeletons
- [ ] Optimize re-renders with React.memo
- [ ] Implement virtual scrolling for long lists

**UX:**
- [ ] Add error boundaries
- [ ] Improve loading states
- [ ] Add animations (Framer Motion)
- [ ] Implement keyboard shortcuts

**Accessibility:**
- [ ] ARIA labels
- [ ] Keyboard navigation
- [ ] Screen reader support
- [ ] Focus management

## 📋 Implementation Checklist

Use this checklist to track progress:

### Core Features

- [ ] Authentication
  - [ ] Email/password sign in/up
  - [ ] Google OAuth flow
  - [ ] Token refresh mechanism
  - [ ] Sign out with data clearing

- [ ] Profile Page Actions
  - [ ] Detect profile pages
  - [ ] Scrape profile data
  - [ ] Calculate match score
  - [ ] Find connection route
  - [ ] Generate personalized message
  - [ ] Add to watchlist

- [ ] Watchlist
  - [ ] Add/remove people
  - [ ] Add/remove companies
  - [ ] Progress tracking
  - [ ] Manual refresh
  - [ ] Best match calculation

- [ ] Jobs
  - [ ] Detect job pages
  - [ ] Scrape job data
  - [ ] Manual JD input
  - [ ] Resume tailoring
  - [ ] Cover letter generation
  - [ ] Save jobs
  - [ ] Application tracking

- [ ] Feed
  - [ ] Activity from watchlist people
  - [ ] Job alerts from companies
  - [ ] Filters (type, date)

- [ ] Notifications
  - [ ] Chrome notifications
  - [ ] Email notifications
  - [ ] SMS notifications
  - [ ] Notification history
  - [ ] Preference management

- [ ] Settings
  - [ ] Subscription management
  - [ ] Theme customization (Pro+)
  - [ ] Profile data management
  - [ ] Notification preferences
  - [ ] Privacy controls

### Technical Debt

- [ ] Add error handling everywhere
- [ ] Implement retry logic for API calls
- [ ] Add request timeout handling
- [ ] Implement offline mode
- [ ] Add data migration for updates
- [ ] Security audit
- [ ] Performance profiling
- [ ] Memory leak detection

### Documentation

- [ ] Add JSDoc to all functions
- [ ] Create API documentation
- [ ] Write user guide
- [ ] Add troubleshooting section
- [ ] Create video walkthrough
- [ ] Document known issues

## 🎯 MVP Definition

For a Minimum Viable Product, implement:

**Must Have:**
1. Authentication (Google OAuth only for MVP)
2. Profile scraping and match scoring
3. Basic route finding (simple BFS, not full Dijkstra)
4. Personalized message generation (AI)
5. Watchlist (people only, no companies)
6. Basic settings (theme, notifications)

**Can Wait:**
- Resume tailoring (Pro feature)
- Cover letter generation (Pro feature)
- Company watchlist
- Advanced graph algorithms
- Email/SMS notifications
- Cloud sync

**MVP Timeline:** 4-6 weeks with 1-2 developers

## 🚀 Launch Checklist

Before publishing to Chrome Web Store:

- [ ] All features tested manually
- [ ] Unit test coverage > 70%
- [ ] No console errors
- [ ] Privacy policy created
- [ ] Terms of service created
- [ ] Store listing prepared (screenshots, description)
- [ ] Pricing configured in Stripe
- [ ] Support email configured
- [ ] Analytics initialized
- [ ] Error tracking configured
- [ ] Beta testing completed (10+ users)
- [ ] Security audit completed
- [ ] Performance benchmarks passed

## 📞 Support & Resources

- **WXT Documentation**: https://wxt.dev/
- **Supabase Docs**: https://supabase.com/docs
- **Anthropic API**: https://docs.anthropic.com/
- **Chrome Extensions**: https://developer.chrome.com/docs/extensions/
- **Tailwind CSS**: https://tailwindcss.com/docs

---

**Note**: This skeleton provides a solid foundation. Focus on the MVP first, then iterate based on user feedback. The architecture is designed to be flexible and extensible.

Good luck! 🚀
