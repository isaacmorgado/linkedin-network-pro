# Architecture Overview

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         LinkedIn Page                            │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │              Content Script (React App)                     │ │
│  │  ┌──────────────────────────────────────────────────────┐  │ │
│  │  │          Floating Panel (Shadow DOM)                 │  │ │
│  │  │                                                       │  │ │
│  │  │  ┌─────────────────────────────────────────────────┐ │  │ │
│  │  │  │  Profile | Watchlist | Jobs | Feed | Settings  │ │  │ │
│  │  │  └─────────────────────────────────────────────────┘ │  │ │
│  │  │                                                       │  │ │
│  │  │  - Draggable/Resizable (react-rnd)                  │  │ │
│  │  │  - Apple-like frosted glass UI                      │  │ │
│  │  │  - State management (Zustand)                       │  │ │
│  │  └──────────────────────────────────────────────────────┘  │ │
│  │                                                             │ │
│  │  DOM Scrapers:                                              │ │
│  │  - Profile data extraction                                 │ │
│  │  - Job description parsing                                 │ │
│  │  - Activity feed monitoring                                │ │
│  │  - Rate limiting & anti-detection                          │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                              ↕ Message Passing
┌─────────────────────────────────────────────────────────────────┐
│              Service Worker (Background Script)                  │
│                                                                  │
│  - Auth token refresh (chrome.alarms every 30min)              │
│  - Activity monitoring (chrome.alarms every 15min)              │
│  - Notification creation                                        │
│  - Message routing                                              │
│  - AI content generation delegation                             │
│  - Route computation delegation                                 │
└─────────────────────────────────────────────────────────────────┘
                              ↕
┌─────────────────────────────────────────────────────────────────┐
│                      Chrome Storage APIs                         │
│                                                                  │
│  chrome.storage.session (in-memory):                            │
│  - Auth tokens (cleared on browser restart)                     │
│  - Sensitive temporary data                                     │
│                                                                  │
│  chrome.storage.local (persistent):                             │
│  - User profile & settings                                      │
│  - Watchlist (people & companies)                               │
│  - Saved jobs                                                   │
│  - Notifications                                                 │
│                                                                  │
│  IndexedDB (Dexie.js):                                          │
│  - Network graphs (nodes & edges)                               │
│  - Scraped profile snapshots                                    │
│  - Large datasets                                               │
└─────────────────────────────────────────────────────────────────┘
                              ↕
┌─────────────────────────────────────────────────────────────────┐
│                      External Services                           │
│                                                                  │
│  Supabase:                                                      │
│  - Authentication (email/password, Google OAuth)                │
│  - PostgreSQL database (user profiles, subscriptions)           │
│  - Edge Functions (webhooks, background jobs)                   │
│  - Realtime sync (optional, opt-in)                             │
│                                                                  │
│  Stripe:                                                        │
│  - Subscription management                                      │
│  - Customer portal                                              │
│  - Webhook handling                                             │
│                                                                  │
│  Anthropic Claude:                                              │
│  - Personalized message generation                              │
│  - Resume tailoring                                             │
│  - Cover letter generation                                      │
│  - Anti-hallucination validation                                │
│                                                                  │
│  Resend (optional):                                             │
│  - Email notifications                                          │
│                                                                  │
│  Twilio (optional):                                             │
│  - SMS notifications                                            │
└─────────────────────────────────────────────────────────────────┘
```

## Data Flow

### 1. Authentication Flow

```
User clicks "Sign In"
  ↓
LoginScreen component
  ↓
useAuthStore.signIn()
  ↓
AuthService.signInWithEmail() or signInWithGoogle()
  ↓
Supabase Auth
  ↓
Token stored in chrome.storage.session
  ↓
User profile loaded from chrome.storage.local or Supabase
  ↓
UI updates, panel shows main tabs
```

### 2. Profile Scraping Flow

```
User navigates to LinkedIn profile
  ↓
Content script detects page change (MutationObserver)
  ↓
scrapeProfileData() extracts data from DOM
  ↓
Rate limiter throttles requests (2-15s delays)
  ↓
Profile data saved to IndexedDB
  ↓
calculateMatchScore() computes similarity
  ↓
UI displays profile actions and match score
```

### 3. Network Pathfinding Flow

```
User clicks "Find Best Route"
  ↓
ProfileTab sends message to service worker
  ↓
Service worker delegates to Web Worker (future)
  ↓
NetworkGraph constructs graph from IndexedDB
  ↓
Dijkstra's algorithm computes weighted path
  ↓
Route with nodes, edges, probability returned
  ↓
UI displays visual network path
```

### 4. AI Content Generation Flow

```
User clicks "Generate Message"
  ↓
Send context (profile data, mutuals, posts) to service worker
  ↓
Service worker calls backend API or Anthropic directly
  ↓
Claude 3.5 Sonnet generates personalized message
  ↓
Anti-hallucination validator checks facts
  ↓
Message returned with citations
  ↓
UI displays editable message
```

## Key Design Decisions

### 1. Local-First Architecture

**Why**: Privacy, speed, offline capability

- All data stored locally by default
- Cloud sync is opt-in only
- Users control their data

### 2. Shadow DOM for Panel

**Why**: CSS isolation, prevent conflicts with LinkedIn's styles

- Panel uses separate style context
- No BEM or complex naming needed
- Tailwind classes work cleanly

### 3. WXT Framework (Vite-based)

**Why**: Modern DX, fast HMR, TypeScript-first

- 5x faster builds than Webpack
- Zero configuration
- Supports all browsers (Chrome, Firefox, Edge, Safari)

### 4. Zustand for State Management

**Why**: Lightweight (1KB), simple API, no providers

- Perfect for extensions
- Easy chrome.storage integration
- TypeScript-friendly

### 5. React-RND for Draggable Panel

**Why**: Combined drag + resize, stable, well-maintained

- 11k+ stars
- Simple API
- Works with React 18

### 6. Supabase for Backend

**Why**: Better DX than Firebase, generous free tier, PostgreSQL

- Row-level security
- Edge Functions for serverless
- Built-in auth
- Self-hostable

### 7. Stripe for Payments

**Why**: Industry standard, powerful APIs, Customer Portal

- Entitlements API for feature gating
- Self-service subscription management
- Extensive webhook system

### 8. Claude 3.5 Sonnet for AI

**Why**: Best writing quality, natural tone, 200K context

- Superior for personalization
- Structured outputs with JSON Schema
- Low hallucination rate

## Performance Optimizations

### 1. Web Workers (Planned)

- Graph algorithms run off main thread
- Prevents UI blocking during pathfinding

### 2. IndexedDB for Large Data

- 10x faster than chrome.storage for complex queries
- Unlimited storage (with user permission)
- Compound indexes for fast lookups

### 3. React.lazy + Suspense

- Code splitting by tab
- Only load tab content when accessed

### 4. Debouncing & Throttling

- Rate limit DOM scraping
- Prevent excessive re-renders

### 5. Prompt Caching (AI)

- 80% latency reduction
- 90% cost reduction for repeated context

## Security Measures

### 1. CSP-Compliant

- No inline scripts
- No eval()
- Trusted sources only

### 2. Token Storage

- Access tokens: chrome.storage.session (in-memory)
- Refresh tokens: chrome.storage.local (encrypted on disk)
- Never exposed to content scripts

### 3. Message Validation

- All messages between contexts validated
- Zod schemas for type safety

### 4. Rate Limiting

- Scraping: 2-15s delays
- API calls: Token bucket algorithm
- Respect LinkedIn rate limits

### 5. Row-Level Security

- Supabase RLS policies
- Users can only access their own data

## Scalability Considerations

### 1. Data Size Limits

- chrome.storage.local: 10MB max
- IndexedDB: Unlimited (with permission)
- Solution: Use IndexedDB for graphs, chrome.storage for settings

### 2. Service Worker Lifetime

- Terminates after 30 seconds of inactivity
- Solution: Use chrome.alarms, not setInterval
- Never store state in memory

### 3. Concurrent Users

- Backend: Supabase auto-scales
- AI: Rate limits apply (plan accordingly)
- Solution: Queue system for AI requests

### 4. Graph Size

- Large networks (10K+ nodes) require optimization
- Solution: Progressive loading, only load subgraphs as needed

## Testing Strategy

### 1. Unit Tests

- Pure functions (graph algorithms, match scoring)
- Utilities (storage, validation)

### 2. Integration Tests

- Service worker message passing
- Storage operations
- Auth flows

### 3. E2E Tests (Planned)

- Playwright for extension testing
- LinkedIn page interactions
- Full user flows

## Deployment Pipeline

```
1. Development
   - pnpm dev (hot reload)
   - Test in Chrome with --disable-web-security

2. Build
   - pnpm build
   - Generates .output/chrome-mv3/

3. Package
   - pnpm zip
   - Creates distributable ZIP

4. Publish
   - Upload to Chrome Web Store
   - Submit for review
   - Automated release notes

5. Update
   - chrome.runtime.onUpdateAvailable
   - Auto-update to latest version
```

## Monitoring & Analytics (Planned)

- Error tracking: Sentry
- Usage analytics: PostHog (privacy-friendly)
- Performance: Web Vitals
- User feedback: In-app surveys

---

*This architecture is designed for scalability, maintainability, and extensibility. All major decisions are documented with rationale.*
