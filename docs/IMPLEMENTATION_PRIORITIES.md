# Implementation Priorities

## Current Status
✅ Extension core features built
✅ Notification settings UI updated (SMS removed, visual feedback fixed)
✅ Email infrastructure planned (Resend → AWS SES migration path)
✅ Marketing email strategy documented (Loops.so integration)
✅ Full authentication architecture designed (Clerk + Supabase + Stripe)

## Immediate Priority: Polish Existing Features

**DECISION:** Focus on making current features work perfectly before building auth/email systems.

### Phase 1: Core Feature Polish (Do First) 🎯

#### 1.1 Extension Functionality
- [ ] Test all existing features end-to-end
- [ ] Fix any bugs or visual issues
- [ ] Ensure Chrome Storage is working correctly
- [ ] Verify all tabs/panels work smoothly
- [ ] Performance optimization (load times, memory usage)
- [ ] Cross-browser testing (Chrome stable, Edge, Brave)

#### 1.2 User Experience
- [ ] Smooth animations and transitions
- [ ] Clear error messages
- [ ] Loading states for all async operations
- [ ] Empty states with helpful CTAs
- [ ] Keyboard shortcuts (if applicable)
- [ ] Responsive design (different window sizes)

#### 1.3 Code Quality
- [ ] Run TypeScript compilation (`npm run compile`)
- [ ] Fix any linting errors (`npm run lint`)
- [ ] Run tests (`npm test`)
- [ ] Check file sizes (`npm run check:file-sizes`)
- [ ] Code review of critical paths
- [ ] Remove any console.logs or debug code

#### 1.4 Documentation
- [ ] Update README with installation instructions
- [ ] Document all features for users
- [ ] Add inline code comments for complex logic
- [ ] Create troubleshooting guide

---

### Phase 2: Email Setup (Second Priority) 📧

**Note:** Only start this AFTER Phase 1 is complete and stable.

#### 2.1 Basic Email Infrastructure
- [ ] Sign up for Resend account
- [ ] Verify domain (DNS records)
- [ ] Create basic Cloudflare Worker for email API
- [ ] Build 3 email templates (job alert, connection, activity)
- [ ] Test sending 10 emails successfully

#### 2.2 Extension Integration (Elite Tier Only)
- [ ] Add "Email Notifications" section with Elite tier gate
- [ ] Show upgrade prompt for Free/Pro users
- [ ] Store user email address in settings
- [ ] Connect to email API (mock for now)
- [ ] Test email preferences saving/loading

#### 2.3 Testing
- [ ] Send test transactional emails
- [ ] Verify email deliverability
- [ ] Check spam score (mail-tester.com)
- [ ] Test across email clients (Gmail, Outlook)
- [ ] Ensure unsubscribe works (even if manual for now)

**Estimated Time:** 4-6 hours
**Cost:** $0 (Resend free tier for testing)

---

### Phase 3: Authentication & Stripe Subscriptions (Later) 🔐💳

**Note:** Do NOT start this until Phase 1 & 2 are complete and tested.

**DECISION: Using Stripe for payment processing** ✅

**Reason for delay:**
- Adds significant complexity (auth, database, webhooks)
- Not required for MVP - extension works without it
- Can validate product/market fit with simple version first
- Easier to add auth later than to remove it if not needed

#### When to Start Phase 3:
✅ Extension has 50+ active users (validated demand)
✅ Users are asking for paid features
✅ Core features are polished and stable
✅ You have 2-3 weeks to dedicate to implementation

#### What's Involved:
**3.1 Authentication (Clerk) - Week 1**
- Set up Clerk account and application
- Add Clerk to extension (sign-in flow)
- Create sign-in/sign-up UI in extension
- Test authentication end-to-end
- Set up webhooks for user events

**3.2 Database (Supabase) - Week 1**
- Create Supabase project
- Design and create user schema
- Set up subscription tracking tables
- Test database connections
- Set up Row Level Security (RLS)

**3.3 API Layer (Cloudflare Workers) - Week 1**
- Build authentication endpoints
- Build user profile endpoints
- Build subscription management endpoints
- Set up webhook handlers (Clerk, Stripe)
- Test API thoroughly

**3.4 Stripe Integration - Week 2**
- Set up Stripe account
- Create products (Free/Pro/Elite tiers)
- Set up pricing ($0, $19/mo, $39/mo)
- Build checkout flow
- Build Stripe Customer Portal integration
- Set up subscription webhooks
- Test payment flow end-to-end

**3.5 Extension Updates - Week 2-3**
- Add tier-based feature gating
- Add upgrade prompts for locked features
- Add "Manage Subscription" button in settings
- Update UI to show current tier
- Sync user profile on startup
- Handle subscription status changes

**3.6 Marketing Emails (Loops.so) - Week 3**
- Set up Loops.so account
- Create contact properties schema
- Build event tracking integration
- Create initial email sequences
- Test email delivery

**Estimated Time:** 2-3 weeks full-time
**Cost:** ~$55/month when live (Clerk free tier + Supabase free tier + Cloudflare $5 + Loops $30 + Resend $20)
**Stripe Fees:** 2.9% + $0.30 per transaction

**All documentation ready in:**
- `docs/AUTHENTICATION_ARCHITECTURE.md`
- `docs/EMAIL_MARKETING_STRATEGY.md`
- `docs/EMAIL_INTEGRATION_TODO.md`

---

## Current Focus

**Work on Phase 1 ONLY until everything is polished and working perfectly.**

### Quick Wins to Tackle First:
1. ✅ Fix notification toggle visual feedback (DONE)
2. ✅ Remove SMS notifications (DONE)
3. [ ] Test extension on fresh Chrome profile
4. [ ] Fix any discovered bugs
5. [ ] Validate all core features work end-to-end
6. [ ] Run full test suite and fix failures
7. [ ] Optimize bundle size if needed
8. [ ] Write user-facing documentation

### Success Criteria for Phase 1:
- [ ] Extension loads in <2 seconds
- [ ] No console errors in production build
- [ ] All tests passing
- [ ] TypeScript compilation clean
- [ ] User can complete all core flows without issues
- [ ] Extension feels polished and professional

**Once Phase 1 is complete, reassess priorities. You may find:**
- Users don't actually want email notifications (save time/money)
- Different features are more requested (pivot focus)
- MVP is good enough to launch (delay auth until after initial users)

---

## Notes

**Why this order makes sense:**
1. **Validate first** - Make sure core product works before adding complexity
2. **User feedback** - Real users will tell you what they actually need
3. **Cost control** - Don't pay for infrastructure before proving demand
4. **Focus** - One thing at a time = better quality, faster shipping
5. **Reversibility** - Easy to add features later, hard to remove them

**Red flags that suggest you should delay auth even longer:**
- No users asking for email notifications
- Extension still has bugs or performance issues
- Core features not fully baked
- Unclear product-market fit
- Haven't validated pricing/tiers yet

**Green lights to start auth/email work:**
- Extension is stable and polished
- Users specifically requesting email notifications
- Ready to commit to paid tiers
- Have time to build properly (not rushing)
- Clear monetization strategy

---

## Decision Log

**2025-01-20:** Decided to delay authentication + marketing emails until core features are polished.
**Reason:** Focus on quality over features. Validate core product first.
**Next review:** After Phase 1 complete, reassess based on user feedback.

**2025-12-02:** Confirmed payment processor: **Stripe** (vs Gumroad/Paddle/Lemon Squeezy)
**Reason:** Best for SaaS subscriptions, most flexible, lowest fees, industry standard
**Implementation:** Phase 3 (after core features polished + basic email working)
**Architecture:** Clerk (auth) + Supabase (database) + Stripe (payments) + Loops.so (marketing)

---

## Quick Reference

**What's ready to build NOW:**
- ✅ Email infrastructure docs
- ✅ Marketing strategy
- ✅ Authentication architecture

**What to build FIRST:**
- 🎯 Polish existing extension features
- 🎯 Fix bugs, optimize performance
- 🎯 Write user documentation

**What to build LATER:**
- ⏳ Basic email notifications (Phase 2)
- ⏳ Full auth + marketing system (Phase 3)

**Current priority:** Make the extension awesome. Everything else can wait.
