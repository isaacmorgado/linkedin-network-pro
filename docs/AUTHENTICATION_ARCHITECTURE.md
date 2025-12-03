# Authentication & User Management Architecture

## Overview
Full authentication system to gate extension access, track subscription tiers, and enable targeted email marketing.

**Key Flow:** Landing Page → Sign Up/Login → Extension Access Granted → Tier-Based Features + Emails

---

## Architecture Stack

### Frontend
- **Landing Page**: Next.js (or simple HTML/JS)
- **Extension**: Current React setup (WXT)
- **Auth Provider**: Clerk (recommended) or Supabase Auth

### Backend
- **API**: Cloudflare Workers (serverless)
- **Database**: Supabase (Postgres) or PlanetScale (MySQL)
- **Email Marketing**: Loops.so
- **Email Transactional**: Resend
- **Payments**: Stripe (for Pro/Elite subscriptions)

### Why This Stack?
- **Clerk**: Best auth UX, handles everything (MFA, OAuth, session management)
- **Cloudflare Workers**: Fast edge compute, cheap, scales automatically
- **Supabase**: Postgres + real-time + storage in one, generous free tier
- **Stripe**: Industry standard for subscriptions

---

## Database Schema

### Users Table
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Authentication (managed by Clerk/Supabase)
  clerk_id VARCHAR(255) UNIQUE, -- or supabase_id
  email VARCHAR(255) UNIQUE NOT NULL,
  email_verified BOOLEAN DEFAULT false,

  -- Profile
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  -- Subscription
  tier VARCHAR(20) DEFAULT 'free', -- 'free' | 'pro' | 'elite'
  stripe_customer_id VARCHAR(255),
  stripe_subscription_id VARCHAR(255),
  subscription_status VARCHAR(50), -- 'active' | 'canceled' | 'past_due'
  subscription_start_date TIMESTAMP,
  subscription_end_date TIMESTAMP,

  -- Extension
  extension_installed BOOLEAN DEFAULT false,
  extension_install_date TIMESTAMP,
  extension_last_active TIMESTAMP,
  extension_version VARCHAR(20),

  -- Marketing
  loops_contact_id VARCHAR(255), -- Loops.so contact ID
  marketing_emails_enabled BOOLEAN DEFAULT true,
  acquisition_source VARCHAR(100), -- 'landing_page' | 'referral' | 'google_ads'
  referral_code VARCHAR(50),

  -- Usage Stats (for behavioral targeting)
  jobs_saved_count INT DEFAULT 0,
  companies_watched_count INT DEFAULT 0,
  messages_generated_count INT DEFAULT 0,
  connections_made_count INT DEFAULT 0,
  last_job_save_date TIMESTAMP,

  -- Indexes
  INDEX idx_clerk_id (clerk_id),
  INDEX idx_email (email),
  INDEX idx_tier (tier),
  INDEX idx_extension_installed (extension_installed)
);
```

### Sessions Table (if not using Clerk)
```sql
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  token VARCHAR(255) UNIQUE NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),

  INDEX idx_token (token),
  INDEX idx_user_id (user_id)
);
```

### Email Events Table (for analytics)
```sql
CREATE TABLE email_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  email_type VARCHAR(50), -- 'onboarding' | 'upgrade_prompt' | 'job_alert'
  event_type VARCHAR(50), -- 'sent' | 'delivered' | 'opened' | 'clicked' | 'bounced'
  email_provider VARCHAR(20), -- 'loops' | 'resend'
  provider_message_id VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),

  INDEX idx_user_id (user_id),
  INDEX idx_email_type (email_type),
  INDEX idx_created_at (created_at)
);
```

---

## User Flow

### 1. Landing Page Signup
```
User visits landing page
  ↓
Clicks "Get Started"
  ↓
Clerk auth modal (email + password or OAuth)
  ↓
Account created in database
  ↓
Sync to Loops.so (welcome email sequence starts)
  ↓
Redirect to "Install Extension" page
```

### 2. Extension Installation & Activation
```
User installs extension
  ↓
Extension opens → "Sign In Required"
  ↓
User clicks "Sign In" → Opens Clerk modal in popup
  ↓
After successful auth, extension receives session token
  ↓
Extension calls API: POST /api/extension/activate
  ↓
API updates user record: extension_installed = true
  ↓
API sends event to Loops.so: "extension_installed"
  ↓
Loops.so stops "install extension" emails, starts "feature discovery" emails
  ↓
Extension unlocked, shows main UI
```

### 3. Tier-Based Feature Access
```
Extension loads → Fetches user profile from API
  ↓
API returns: { tier: 'free', features: [...] }
  ↓
Extension UI adapts:
  - Free: Basic features + upgrade prompts
  - Pro: Advanced features enabled
  - Elite: All features + email notifications
  ↓
User tries to use Elite feature (e.g., email notifications)
  ↓
Extension checks tier → Shows upgrade modal if not Elite
```

### 4. Subscription Upgrade
```
User clicks "Upgrade to Elite"
  ↓
Extension opens Stripe Checkout (hosted page)
  ↓
User completes payment
  ↓
Stripe webhook → API: POST /webhooks/stripe
  ↓
API updates user: tier = 'elite', subscription_status = 'active'
  ↓
API sends event to Loops.so: "upgraded_to_elite"
  ↓
Loops.so sends "Welcome to Elite" email
  ↓
Extension refreshes user profile, unlocks Elite features
```

### 5. Behavioral Email Triggers
```
User saves 50th job in extension
  ↓
Extension calls: POST /api/events/job_saved { count: 50 }
  ↓
API updates user.jobs_saved_count = 50
  ↓
API checks: if tier != 'elite' && jobs_saved_count >= 50
  ↓
API sends event to Loops.so: "power_user_no_elite"
  ↓
Loops.so triggers: "You need job alerts" email
```

---

## API Endpoints

### Authentication
```typescript
POST /api/auth/register
Body: { email, password, firstName, lastName }
Response: { user, sessionToken }

POST /api/auth/login
Body: { email, password }
Response: { user, sessionToken }

POST /api/auth/logout
Headers: { Authorization: Bearer <token> }
Response: { success: true }

GET /api/auth/me
Headers: { Authorization: Bearer <token> }
Response: { user } // Full user profile with tier, features
```

### Extension
```typescript
POST /api/extension/activate
Headers: { Authorization: Bearer <token> }
Response: { success: true }
// Marks extension as installed

GET /api/extension/profile
Headers: { Authorization: Bearer <token> }
Response: {
  user: { tier, email, firstName },
  features: ['ai_messages', 'job_tracker', ...],
  limits: { jobsSaved: 50, messagesPerDay: 10 }
}

POST /api/extension/sync
Headers: { Authorization: Bearer <token> }
Body: { jobsSaved: 47, companiesWatched: 3, ... }
Response: { success: true }
// Syncs usage stats from extension to database
```

### Events (for Loops.so triggers)
```typescript
POST /api/events/track
Headers: { Authorization: Bearer <token> }
Body: {
  event: 'job_saved' | 'company_watched' | 'message_generated',
  properties: { count: 50, ... }
}
Response: { success: true }
// Tracks event, updates database, sends to Loops.so if needed
```

### Subscription (Stripe integration)
```typescript
POST /api/subscription/create-checkout
Headers: { Authorization: Bearer <token> }
Body: { tier: 'pro' | 'elite' }
Response: { checkoutUrl: 'https://checkout.stripe.com/...' }

POST /api/subscription/portal
Headers: { Authorization: Bearer <token> }
Response: { portalUrl: 'https://billing.stripe.com/...' }
// For managing subscription, updating payment method

POST /webhooks/stripe
Body: Stripe webhook payload
// Handles subscription.created, subscription.updated, subscription.deleted
```

---

## Loops.so Integration

### Contact Properties (synced for each user)
```typescript
{
  email: "user@example.com",
  firstName: "Isaac",
  lastName: "Morgado",

  // Subscription
  tier: "elite", // free | pro | elite
  subscriptionStatus: "active",
  subscriptionStartDate: "2025-01-15",

  // Extension
  extensionInstalled: true,
  extensionInstallDate: "2025-01-16",
  extensionLastActive: "2025-01-20",

  // Usage
  jobsSaved: 47,
  companiesWatched: 5,
  messagesGenerated: 23,

  // Acquisition
  source: "landing_page",
  createdAt: "2025-01-15"
}
```

### Events to Send to Loops.so
```typescript
// Lifecycle events
loops.sendEvent("user_registered", { email, source })
loops.sendEvent("extension_installed", { email, installDate })
loops.sendEvent("extension_uninstalled", { email, reason })

// Subscription events
loops.sendEvent("upgraded_to_pro", { email, fromTier: "free" })
loops.sendEvent("upgraded_to_elite", { email, fromTier: "pro" })
loops.sendEvent("subscription_canceled", { email, tier, reason })
loops.sendEvent("subscription_renewed", { email, tier })

// Behavioral events (trigger targeted emails)
loops.sendEvent("power_user_detected", { email, jobsSaved: 50 })
loops.sendEvent("feature_used_first_time", { email, feature: "ai_messages" })
loops.sendEvent("inactive_7_days", { email, lastActive })
loops.sendEvent("approaching_limit", { email, limit: "jobs_saved", usage: 45, max: 50 })
```

### API Integration Code
```typescript
// Cloudflare Worker example
import { LoopsClient } from 'loops';

const loops = new LoopsClient(env.LOOPS_API_KEY);

// Create/update contact when user registers
async function syncUserToLoops(user: User) {
  await loops.createContact({
    email: user.email,
    firstName: user.first_name,
    tier: user.tier,
    extensionInstalled: user.extension_installed,
    jobsSaved: user.jobs_saved_count,
    // ... other properties
  });
}

// Send event when user behavior triggers something
async function sendLoopsEvent(email: string, event: string, properties?: object) {
  await loops.sendEvent({
    email,
    eventName: event,
    eventProperties: properties
  });
}
```

---

## Extension Authentication Flow

### On Extension Startup
```typescript
// background.ts
import { Clerk } from '@clerk/chrome-extension';

const clerk = new Clerk(PUBLISHABLE_KEY);

async function initializeExtension() {
  // Check if user is authenticated
  const session = await clerk.session;

  if (!session) {
    // Show "Sign In Required" screen
    chrome.runtime.sendMessage({ type: 'AUTH_REQUIRED' });
    return;
  }

  // Get session token
  const token = await session.getToken();

  // Fetch user profile from API
  const response = await fetch('https://api.yourapp.com/extension/profile', {
    headers: { 'Authorization': `Bearer ${token}` }
  });

  const { user, features, limits } = await response.json();

  // Store in extension storage
  await chrome.storage.local.set({
    user,
    features,
    limits,
    sessionToken: token
  });

  // Enable extension features based on tier
  enableFeatures(features);
}
```

### Feature Gating in Extension
```typescript
// Check if user can access feature
async function canUseFeature(featureName: string): Promise<boolean> {
  const { user, features } = await chrome.storage.local.get(['user', 'features']);

  // Check if feature is in user's tier
  if (!features.includes(featureName)) {
    // Show upgrade modal
    showUpgradeModal(featureName);
    return false;
  }

  return true;
}

// Example usage
async function enableEmailNotifications() {
  if (await canUseFeature('email_notifications')) {
    // Feature available, proceed
  } else {
    // Show "Upgrade to Elite" modal
  }
}
```

### Syncing Usage Data Back to Backend
```typescript
// Periodically sync usage stats to backend
setInterval(async () => {
  const { sessionToken } = await chrome.storage.local.get('sessionToken');
  const stats = await getUsageStats(); // jobs saved, etc.

  await fetch('https://api.yourapp.com/extension/sync', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${sessionToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(stats)
  });
}, 5 * 60 * 1000); // Every 5 minutes
```

---

## Clerk Integration (Recommended Auth Provider)

### Why Clerk?
- ✅ Handles everything: signup, login, MFA, OAuth (Google, LinkedIn)
- ✅ Beautiful pre-built UI components
- ✅ Works with Chrome extensions out of the box
- ✅ Free tier: 10,000 MAU (Monthly Active Users)
- ✅ Webhooks for user events (signup, login, etc.)

### Setup Steps
1. Sign up at clerk.com
2. Create application
3. Get publishable key + secret key
4. Install: `npm install @clerk/chrome-extension`
5. Add to extension manifest

### Landing Page Integration
```tsx
// Landing page (Next.js)
import { SignUp, SignIn } from '@clerk/nextjs';

export default function LandingPage() {
  return (
    <div>
      <h1>LinkedIn Network Pro</h1>
      <SignUp
        afterSignUpUrl="/install-extension"
        appearance={{ /* custom styling */ }}
      />
    </div>
  );
}
```

### Extension Integration
```typescript
// manifest.json
{
  "permissions": [
    "storage",
    "identity"
  ],
  "host_permissions": [
    "https://clerk.yourapp.com/*"
  ]
}

// background.ts
import { Clerk } from '@clerk/chrome-extension';

const clerk = new Clerk(process.env.CLERK_PUBLISHABLE_KEY);

// Initialize Clerk
await clerk.load();

// Check if signed in
if (clerk.user) {
  console.log('User is signed in:', clerk.user.emailAddress);
  console.log('Tier:', clerk.user.publicMetadata.tier);
} else {
  // Prompt user to sign in
}
```

### Clerk Webhooks → Backend
```typescript
// Cloudflare Worker: /webhooks/clerk
export default {
  async fetch(request: Request, env: Env) {
    const payload = await request.json();

    if (payload.type === 'user.created') {
      // New user registered
      const { id, email_addresses, first_name, last_name } = payload.data;

      // Create user in database
      await db.users.create({
        clerk_id: id,
        email: email_addresses[0].email_address,
        first_name,
        last_name,
        tier: 'free'
      });

      // Sync to Loops.so
      await loops.createContact({
        email: email_addresses[0].email_address,
        firstName: first_name,
        tier: 'free',
        source: 'landing_page'
      });

      // Trigger welcome email sequence in Loops.so
      await loops.sendEvent('user_registered', {
        email: email_addresses[0].email_address
      });
    }

    return new Response('OK');
  }
};
```

---

## Stripe Integration for Subscriptions

### Product Setup in Stripe
```
Product 1: LinkedIn Network Pro - Pro
  - Price: $19/month
  - Features: Advanced job filters, company insights, bulk messaging

Product 2: LinkedIn Network Pro - Elite
  - Price: $39/month
  - Features: Everything in Pro + Email notifications, priority support, AI cover letters
```

### Checkout Flow
```typescript
// API: POST /api/subscription/create-checkout
import Stripe from 'stripe';

const stripe = new Stripe(env.STRIPE_SECRET_KEY);

export async function createCheckout(userId: string, tier: 'pro' | 'elite') {
  const user = await db.users.findById(userId);

  // Create or retrieve Stripe customer
  let customerId = user.stripe_customer_id;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      metadata: { user_id: userId }
    });
    customerId = customer.id;
    await db.users.update(userId, { stripe_customer_id: customerId });
  }

  // Create checkout session
  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    line_items: [{
      price: tier === 'pro' ? env.STRIPE_PRO_PRICE_ID : env.STRIPE_ELITE_PRICE_ID,
      quantity: 1
    }],
    success_url: 'https://yourapp.com/success?session_id={CHECKOUT_SESSION_ID}',
    cancel_url: 'https://yourapp.com/pricing',
    metadata: { user_id: userId, tier }
  });

  return session.url;
}
```

### Webhook Handler
```typescript
// POST /webhooks/stripe
export async function handleStripeWebhook(request: Request) {
  const sig = request.headers.get('stripe-signature');
  const payload = await request.text();

  const event = stripe.webhooks.constructEvent(payload, sig, env.STRIPE_WEBHOOK_SECRET);

  switch (event.type) {
    case 'checkout.session.completed':
      const session = event.data.object;
      const userId = session.metadata.user_id;
      const tier = session.metadata.tier;

      // Update user tier
      await db.users.update(userId, {
        tier,
        stripe_subscription_id: session.subscription,
        subscription_status: 'active',
        subscription_start_date: new Date()
      });

      // Send event to Loops.so
      const user = await db.users.findById(userId);
      await loops.sendEvent(`upgraded_to_${tier}`, { email: user.email });

      break;

    case 'customer.subscription.deleted':
      // Subscription canceled
      const subscription = event.data.object;
      await db.users.update(
        { stripe_subscription_id: subscription.id },
        { tier: 'free', subscription_status: 'canceled' }
      );
      break;
  }

  return new Response('OK');
}
```

---

## Deployment Checklist

### Infrastructure Setup
- [ ] Set up Clerk account and app
- [ ] Set up Supabase project and database
- [ ] Set up Cloudflare Workers account
- [ ] Set up Stripe account and products
- [ ] Set up Loops.so account
- [ ] Set up Resend account

### Environment Variables
```env
# Clerk
CLERK_PUBLISHABLE_KEY=pk_test_xxx
CLERK_SECRET_KEY=sk_test_xxx
CLERK_WEBHOOK_SECRET=whsec_xxx

# Database (Supabase)
DATABASE_URL=postgresql://xxx
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=xxx

# Stripe
STRIPE_PUBLISHABLE_KEY=pk_test_xxx
STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
STRIPE_PRO_PRICE_ID=price_xxx
STRIPE_ELITE_PRICE_ID=price_xxx

# Email
LOOPS_API_KEY=xxx
RESEND_API_KEY=re_xxx

# API
API_BASE_URL=https://api.yourapp.com
JWT_SECRET=xxx (if not using Clerk)
```

### Code Changes Needed
- [ ] Add Clerk to extension (sign-in flow)
- [ ] Create Cloudflare Workers API
- [ ] Build database migrations (Supabase)
- [ ] Add tier-based feature gating in extension
- [ ] Create Stripe checkout flow
- [ ] Set up webhook handlers (Clerk, Stripe)
- [ ] Integrate Loops.so event tracking
- [ ] Add usage stat syncing from extension → API

---

## Cost Estimation

### At 1,000 Users
**Services:**
- Clerk: Free (under 10k MAU)
- Supabase: Free tier (500MB storage, 2GB bandwidth)
- Cloudflare Workers: $5/month (100k requests/day)
- Stripe: 2.9% + $0.30 per transaction
- Loops.so: $30/month (up to 2k contacts)
- Resend: $20/month (transactional emails for Elite users)

**Total: ~$55/month** (before Stripe fees)

### At 10,000 Users
- Clerk: $25/month (10k+ MAU)
- Supabase: $25/month (Pro plan)
- Cloudflare Workers: $5/month (scales easily)
- Stripe: Same % fees
- Loops.so: $150/month (10k contacts)
- Resend: $80/month

**Total: ~$285/month**

**Revenue at 10k users (assuming 10% conversion to paid):**
- 1,000 paid users × $29 avg = $29,000/month
- Infrastructure: $285/month (1% of revenue)

---

## Security Considerations

### Session Management
- ✅ Use Clerk for secure session handling
- ✅ Rotate session tokens every 24 hours
- ✅ Implement session expiry (7 days idle)
- ✅ Store session tokens in Chrome storage (encrypted)

### API Security
- ✅ Validate JWT tokens on every request
- ✅ Rate limit API endpoints (100 requests/min per user)
- ✅ Use HTTPS only
- ✅ Sanitize all user inputs
- ✅ Implement CORS properly

### Data Privacy
- ✅ Don't store sensitive LinkedIn data (comply with TOS)
- ✅ Encrypt user data at rest (Supabase does this)
- ✅ Only collect necessary data for features
- ✅ Allow users to delete their account + data
- ✅ GDPR compliance (data export, right to be forgotten)

---

## Next Steps

1. **Set up Clerk** → Fastest way to get auth working
2. **Create Supabase project** → Set up database schema
3. **Build basic API** → Start with /auth/me and /extension/profile
4. **Add auth to extension** → Show sign-in prompt on first launch
5. **Integrate Loops.so** → Track user_registered event
6. **Test end-to-end** → Sign up → Install → Use features
7. **Add Stripe** → Enable paid subscriptions
8. **Polish UX** → Smooth onboarding, clear upgrade prompts

The architecture is now ready for you to build the landing page and backend!
