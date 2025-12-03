# Email Marketing & Lead Nurturing Strategy

## Overview
Dual-purpose email infrastructure for both transactional notifications AND marketing/lifecycle campaigns.

## Email Categories

### 1. Transactional Emails (Resend)
**Purpose:** High-priority, user-initiated notifications
**Deliverability:** Critical - must arrive instantly
**Unsubscribe:** Cannot unsubscribe (except per-type preferences)

**Email Types:**
- Job alerts matching preferences
- Connection request accepted
- Follow-up reminders
- Watchlist activity updates
- System/account notifications

**Trigger:** User action or system event

---

### 2. Marketing Emails (Loops.so or similar)
**Purpose:** Nurture, educate, convert, retain users
**Deliverability:** Important but not critical
**Unsubscribe:** Must allow easy unsubscribe (CAN-SPAM compliance)

**Email Types:**
- Onboarding sequences
- Feature education drips
- Upgrade prompts
- Re-engagement campaigns
- Product announcements
- Weekly/monthly digests

**Trigger:** Time-based or behavior-based

---

## User Segmentation

### By Subscription Tier
**Free Tier:**
- ✅ Onboarding sequence (3-5 emails)
- ✅ Feature education (weekly)
- ✅ Upgrade prompts (based on usage)
- ❌ NO transactional notifications (Elite only)

**Pro Tier:**
- ✅ Onboarding + advanced features
- ✅ Pro-specific tips
- ✅ Upgrade to Elite prompts
- ❌ NO transactional notifications (Elite only)

**Elite Tier:**
- ✅ All transactional notifications (if enabled)
- ✅ VIP content, early access
- ✅ Feature announcements
- ✅ Usage/success insights

### By User Source
**Landing Page Signups (Not Yet Installed Extension):**
- Goal: Drive extension installation
- Sequence:
  - Day 0: Welcome + installation guide
  - Day 2: Feature highlights video
  - Day 4: Case study / testimonial
  - Day 7: "Need help?" support email
  - Day 14: Last chance / discount offer

**Extension Users (Active):**
- Goal: Engagement + tier upgrades
- Sequence:
  - Week 1: Feature discovery
  - Week 2: Power user tips
  - Week 3: Upgrade prompt (if Free/Pro)
  - Monthly: Feature updates, product news

**Churned Users (Uninstalled):**
- Goal: Win-back
- Sequence:
  - Day 3: "We miss you" + feedback request
  - Week 2: New feature announcement
  - Month 1: Special offer to return

### By Behavior
**Power Users (Daily Active):**
- Tips for getting even more value
- Beta feature access
- Referral program invites

**Low Engagement (< 1x/week):**
- Quick wins / use case ideas
- Success stories from similar users
- Re-engagement offer

**Feature-Specific:**
- Used Company Watchlist → Tips for maximizing it
- Used AI Messages → Advanced messaging strategies
- Used Job Tracker → Interview prep content

---

## Email Sequences

### Sequence 1: New User Onboarding (Free Tier)
**Goal:** Drive first value, encourage upgrade

| Day | Subject | Goal | CTA |
|-----|---------|------|-----|
| 0 | Welcome to LinkedIn Network Pro 🚀 | Get started | Install extension |
| 1 | Your first AI message in 60 seconds | First win | Try AI messages |
| 3 | How [Company] landed 3 jobs this week | Social proof | Upgrade to Pro |
| 7 | You're missing out on job alerts | FOMO | Upgrade to Elite |
| 14 | Last chance: 20% off Elite (expires today) | Convert | Upgrade now |

### Sequence 2: Pro → Elite Conversion
**Goal:** Demonstrate Elite value, drive upgrade

| Trigger | Email | Pitch |
|---------|-------|-------|
| After 7 days on Pro | "Ready for job alerts?" | Show Elite features |
| 50 saved jobs | "Track 50+ jobs? You need Elite" | Position as power user |
| 3 companies on watchlist | "Get notified about these companies" | Highlight Elite benefit |

### Sequence 3: Win-Back (Churned Users)
**Goal:** Re-engage inactive users

| Day | Subject | Approach |
|-----|---------|----------|
| 3 | "Quick question about LinkedIn Network Pro" | Request feedback |
| 7 | "We just launched [feature]" | Show product improvements |
| 30 | "50% off - we want you back" | Incentive to return |

---

## Implementation Architecture

### Recommended Stack
**Transactional:** Resend
- Job alerts, notifications
- $20-80/month depending on volume

**Marketing:** Loops.so
- All nurture sequences, campaigns
- $30/month (up to 2,000 contacts)
- Visual email builder
- Event-based triggers
- Easy segmentation

**Total Cost:** $50-110/month

### Data Flow
```
Extension → Backend API → {
  Transactional Event → Resend
  User Event → Loops.so webhook
}

Landing Page Signup → {
  Add to Loops.so
  Tag: "landing_signup"
  Start: Onboarding sequence
}

Extension Install → {
  Update Loops.so tag: "extension_installed"
  Stop: Installation nudge emails
  Start: Feature discovery sequence
}

Tier Upgrade → {
  Update Loops.so segment
  Start: Tier-specific sequence
  Enable: Transactional emails (if Elite)
}
```

### User Properties to Track (Loops.so)
```javascript
{
  email: "user@example.com",
  firstName: "Isaac",
  tier: "elite", // free | pro | elite
  source: "landing_page", // landing_page | extension | referral
  installDate: "2025-01-15",
  lastActive: "2025-01-20",
  jobsSaved: 47,
  companiesWatched: 5,
  messagesGenerated: 12,
  hasInstalledExtension: true,
  transactionalEmailEnabled: true
}
```

### Events to Send (Triggers)
```javascript
// Installation
loops.sendEvent("extension_installed", { email, installDate })

// Feature usage
loops.sendEvent("first_ai_message", { email })
loops.sendEvent("job_saved", { email, jobCount })
loops.sendEvent("company_watched", { email, companyCount })

// Conversion events
loops.sendEvent("upgraded_to_pro", { email, fromTier: "free" })
loops.sendEvent("upgraded_to_elite", { email, fromTier: "pro" })

// Churn
loops.sendEvent("extension_uninstalled", { email, reason })
```

---

## Email Copy Examples

### Transactional: Job Alert (Elite Only)
```
Subject: 🎯 3 new jobs match your preferences

Hi Isaac,

We found 3 new Product Manager roles at companies you're watching:

1. **Senior PM at Stripe** - San Francisco, $180k-220k
   Posted 2 hours ago | 47% keyword match
   [Quick Apply →]

2. **PM, Growth at Figma** - Remote, $160k-200k
   Posted today | 52% keyword match
   [Quick Apply →]

3. **Lead PM at Notion** - SF/Remote, $190k-230k
   Posted 5 hours ago | 61% keyword match
   [Quick Apply →]

---
💡 Tip: Jobs get 80% of applications in the first 24 hours. Apply early!

[View All Jobs →]

—
This is a notification email for Elite tier users. To change your preferences,
visit Settings > Notifications.
```

### Marketing: Free → Pro Upgrade (Day 3)
```
Subject: You're doing it manually. These users aren't 😎

Hi Isaac,

I noticed you've generated 5 AI messages this week. Nice!

But here's the thing...

**Pro users are sending 10x more connection requests** using our bulk messaging
feature. While you're crafting one message at a time, they're connecting with
20 prospects in the time it takes you to write one.

Real numbers from this week:
- Free users: avg 5 connections/week
- Pro users: avg 47 connections/week

That's not a typo. **47x more connections.**

[Upgrade to Pro - 50% off your first month →]

What you'll unlock:
✅ Bulk AI messaging (20 at once)
✅ Advanced job filters (salary, remote, etc.)
✅ Company insights & employee connections
✅ Priority support

No commitment. Cancel anytime.

[Try Pro for $9.50 (normally $19) →]

Best,
The Uproot Team

P.S. This 50% discount expires in 48 hours. After that, it's back to $19/month.
```

### Re-engagement: Win-Back (Day 30)
```
Subject: We messed up. Here's 50% off to prove it.

Hi Isaac,

You uninstalled LinkedIn Network Pro 30 days ago, and honestly?

That stings.

But I get it. Maybe we didn't deliver the value you expected. Maybe the
onboarding was confusing. Maybe you just got busy.

Whatever the reason, we've been working hard to make it better:

✨ **New in the last 30 days:**
- AI message quality improved 40% (seriously, try it)
- Instant job alerts (Elite tier)
- Company watchlist with automated tracking
- 2x faster extension load time

We want to earn your trust back.

[Get 50% off Elite for 3 months →]

No strings attached. If it's still not for you, no hard feelings.

But if you've been thinking about your job search, your network, or your next
career move... give us another shot.

Best,
Isaac (yes, also my name 👋)
Founder, Uproot

P.S. This offer expires in 7 days and is only for people who've uninstalled.
After that, you'll have to pay full price like everyone else.
```

---

## Compliance & Best Practices

### CAN-SPAM Compliance
- ✅ Include physical mailing address
- ✅ Clear "Unsubscribe" link in every marketing email
- ✅ Honor unsubscribes within 10 business days
- ✅ Accurate "From" and "Subject" lines
- ❌ Don't buy email lists
- ❌ Don't send to people who didn't opt in

### GDPR Compliance (if EU users)
- ✅ Get explicit consent before sending marketing emails
- ✅ Allow users to export/delete their data
- ✅ Store only necessary user data
- ✅ Include privacy policy link

### Deliverability Best Practices
- ✅ Use SPF, DKIM, DMARC records (Resend/Loops handle this)
- ✅ Warm up new sending domains gradually
- ✅ Keep bounce rate <5%
- ✅ Monitor spam complaints (<0.1%)
- ✅ Segment and personalize (higher engagement = better deliverability)
- ❌ Don't send to inactive users (>6 months)

---

## Metrics to Track

### Transactional Email Health
- Delivery rate (target: >99%)
- Open rate (target: >40%)
- Click rate (target: >15%)
- Time to deliver (target: <30 seconds)

### Marketing Email Performance
- Open rate (target: >20%)
- Click rate (target: >3%)
- Conversion rate (target: >2%)
- Unsubscribe rate (target: <0.5%)
- Spam complaint rate (target: <0.1%)

### Business Metrics
- Free → Pro conversion (target: >10%)
- Pro → Elite conversion (target: >5%)
- Win-back success rate (target: >3%)
- Email-attributed revenue
- LTV per email subscriber

---

## Cost Breakdown at Scale

### 1,000 Total Users
**Breakdown:**
- 600 free tier (landing page signups)
- 300 pro tier
- 100 elite tier

**Email Volume:**
- Transactional (Elite only): ~6,000/month
- Marketing (all users): ~4,000/month (4 emails/user/month)

**Cost:**
- Resend: $20/month
- Loops.so: $30/month
- **Total: $50/month**

### 10,000 Total Users
**Breakdown:**
- 5,000 free tier
- 3,500 pro tier
- 1,500 elite tier

**Email Volume:**
- Transactional: ~90,000/month
- Marketing: ~40,000/month

**Cost:**
- Resend: $80/month (or switch to AWS SES for $9/month)
- Loops.so: $150/month (or Customer.io for better segmentation)
- **Total: $150-230/month**

---

## Implementation Priority

### Phase 1: Foundation (Week 1-2)
1. ✅ Set up Resend for transactional emails (Elite tier only)
2. ✅ Create 3 basic email templates (job alert, connection, activity)
3. ✅ Add email preference settings to extension

### Phase 2: Marketing Infrastructure (Week 3-4)
1. ✅ Set up Loops.so account
2. ✅ Connect landing page to Loops (capture signups)
3. ✅ Build welcome email sequence (3 emails)
4. ✅ Track key events (install, upgrade, feature usage)

### Phase 3: Conversion Campaigns (Month 2)
1. ✅ Free → Pro upgrade sequence
2. ✅ Pro → Elite upgrade sequence
3. ✅ Feature announcement emails
4. ✅ Re-engagement campaign for inactive users

### Phase 4: Optimization (Month 3+)
1. ✅ A/B test subject lines
2. ✅ Segment by behavior (power users vs casual)
3. ✅ Personalization based on usage patterns
4. ✅ Win-back campaigns for churned users
5. ✅ Referral program emails

---

## Quick Start Checklist

**Resend Setup:**
- [ ] Sign up at resend.com
- [ ] Verify sending domain (DNS records)
- [ ] Create 3 email templates
- [ ] Integrate with backend API
- [ ] Test with 10 test emails

**Loops.so Setup:**
- [ ] Sign up at loops.so
- [ ] Add JavaScript snippet to landing page
- [ ] Create user properties schema
- [ ] Build first email sequence (welcome)
- [ ] Set up event tracking from extension
- [ ] Send test sequence to yourself

**Compliance:**
- [ ] Add unsubscribe link to all marketing emails
- [ ] Add physical address to email footers
- [ ] Create privacy policy page
- [ ] Set up preference center (manage email settings)

**Testing:**
- [ ] Send test transactional email
- [ ] Send test marketing sequence
- [ ] Verify unsubscribe works
- [ ] Check spam score (use mail-tester.com)
- [ ] Test across email clients (Gmail, Outlook, Apple Mail)

---

## Next Steps

1. **Decide on marketing platform**: Loops.so (recommended) or Customer.io
2. **Write email copy**: Use examples above as starting point
3. **Design email templates**: Keep it simple, mobile-friendly
4. **Set up tracking**: Events from extension → Loops.so
5. **Launch small**: Start with 100 test users before scaling
