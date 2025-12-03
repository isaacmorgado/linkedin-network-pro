# Email Notifications Integration - TODO

## Overview
Email notifications feature to be implemented as part of Elite tier subscription benefits.

## Requirements

### Tier Restriction
- **Email notifications are ELITE TIER ONLY**
- Free and Pro users should see the email section but with upgrade prompt
- Only Elite tier users can enable email notifications

### Email Service Provider Strategy

**Phase 1: Start with Resend (0-100k emails/month)**
- Cost: 3,000 emails/month FREE, then $20/month for 50,000 emails
- Simple, modern API - integrate in < 1 hour
- Excellent deliverability
- Perfect for MVP and early growth

**Phase 2: Migrate to AWS SES (>100k emails/month)**
- Cost: $0.10 per 1,000 emails (~75% cost savings at scale)
- Migration trigger: When hitting 100k+ emails/month consistently
- Estimated timeline: When you have 1,500+ Elite tier users
- ROI: Saves $170/month at 600k emails, $420/month at 1M emails

### Backend Architecture Needed
1. **Server/API** (choose one):
   - Cloudflare Workers (serverless, cheap, fast)
   - AWS Lambda (serverless, pay-per-use)
   - Simple Node.js/Express server (traditional)

2. **Database** (to store email preferences):
   - User email addresses
   - Notification preferences
   - Email delivery logs
   - User subscription tier verification

3. **Authentication**:
   - Verify user subscription tier before sending emails
   - Secure API endpoints
   - Rate limiting to prevent abuse

### Email Types to Implement
Based on existing notification types:
- ✅ `job_alert` - New jobs matching preferences
- ✅ `connection_accepted` - Connection requests accepted
- ✅ `message_follow_up` - Follow-up reminders
- ✅ `activity_update` - Watchlist company activity
- ✅ `system` - Important system notifications

### Email Frequency Options
Already in UI:
- `instant` - Send immediately
- `daily` - Daily digest at 8 AM user local time
- `weekly` - Weekly summary on Monday mornings

### UI Changes Needed

#### 1. Add Tier Gate
```tsx
// In NotificationSettings.tsx - Email section
{!isEliteTier && (
  <div style={{
    padding: '12px',
    background: 'rgba(10, 102, 194, 0.1)',
    borderRadius: '8px',
    marginBottom: '16px'
  }}>
    <p>📧 Email notifications are available for Elite tier users only.</p>
    <button onClick={handleUpgrade}>Upgrade to Elite</button>
  </div>
)}
```

#### 2. Store Email Address
Currently the email input exists but doesn't save to storage:
```tsx
// Save email address to user profile
const [emailAddress, setEmailAddress] = useState('');

// On save:
await StorageManager.setLocal('user_email', emailAddress);
```

### Implementation Steps (When Ready)

#### Phase 1: Backend Setup
1. Create Resend account and get API key
2. Set up Cloudflare Worker or Lambda function
3. Create email templates (HTML + text versions)
4. Implement email sending logic with rate limiting

#### Phase 2: Extension Updates
1. Add tier checking logic to NotificationSettings component
2. Store user email address in settings
3. Add upgrade prompt for non-Elite users
4. Call backend API to register email preferences

#### Phase 3: Email Triggers
1. Hook into existing notification system
2. When notification is created, check if user has email enabled
3. Queue email based on frequency preference
4. Send via backend API

### Security Considerations
- ✅ Validate email addresses (already done with Zod schema)
- ✅ Rate limit API calls to prevent spam
- ✅ Verify subscription tier server-side (not just client-side)
- ✅ Use environment variables for API keys (never in code)
- ✅ Implement unsubscribe mechanism (required by law)
- ✅ GDPR compliance - store only necessary data

### Cost Estimation by Scale

**100 Elite users (30k emails/month)**
- Resend: $20/month
- Cloudflare Workers: $5/month
- **Total: $25/month**

**1,000 Elite users (60k emails/month)**
- Resend: $80/month (up to 100k)
- Cloudflare Workers: $5/month
- **Total: $85/month**

**10,000 Elite users (600k emails/month)**
- Option A (Resend): $250/month
- Option B (AWS SES): $60 emails + $20 compute = $80/month
- **Savings with AWS SES: $170/month**

**Migration Recommendation:**
- Start: Resend (simple, fast setup)
- Switch at: 100k emails/month (1,500 Elite users)
- Expected ROI: 3-4 hours migration work saves $2,000+/year

### Files to Modify When Implementing
- `src/components/tabs/settings/NotificationSettings.tsx` - Add tier gate
- `src/stores/settings.ts` - Add email address storage
- `src/entrypoints/background.ts` - Add email trigger logic
- `src/services/notification-service.ts` - Create new service for email
- `src/types/index.ts` - Add email-related types if needed

### Environment Variables Needed
```env
# Backend (.env)
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxx
API_SECRET_KEY=your_secret_key_here
DATABASE_URL=your_database_connection_string

# Extension (hardcoded endpoints)
VITE_EMAIL_API_URL=https://your-worker.workers.dev/email
```

## Current Status
- ✅ UI for email notifications exists (toggle, email input, preferences)
- ✅ SMS removed, email-only approach
- ❌ No backend integration
- ❌ No tier restriction enforcement
- ❌ Email address not saved
- ❌ No actual emails being sent

## Migration Path: Resend → AWS SES

### When to Migrate
**Trigger:** Consistently hitting 100k+ emails/month (3-4 months in a row)

**Signs it's time:**
- Monthly Resend bill >$100
- 1,500+ Elite tier users
- Email volume growing 20%+ month-over-month

### Migration Checklist
- [ ] Set up AWS account and verify SES domain
- [ ] Create new email templates in SES format
- [ ] Build SES adapter matching Resend API interface
- [ ] Test SES in staging with 1,000 test emails
- [ ] Gradual rollout: 10% → 50% → 100% over 1 week
- [ ] Monitor deliverability rates (should match Resend)
- [ ] Cancel Resend subscription after 1 month on SES

**Estimated migration time:** 4-6 hours development + 1 week testing

---

## Phase 1: Resend Integration (Do This First)

### Quick Start (30 minutes)
1. Sign up at resend.com
2. Verify your domain (add DNS records)
3. Get API key
4. Install SDK: `npm install resend`
5. Create Cloudflare Worker with Resend integration

### Code Structure
```typescript
// Email service abstraction layer (future-proof for AWS SES migration)
interface EmailProvider {
  send(params: EmailParams): Promise<void>;
}

class ResendProvider implements EmailProvider {
  async send(params: EmailParams) {
    // Resend implementation
  }
}

// Later, easily swap to:
class SESProvider implements EmailProvider {
  async send(params: EmailParams) {
    // AWS SES implementation
  }
}
```

This abstraction makes migration to AWS SES a 1-hour task instead of rewriting everything.

---

## Notes
- **Start:** Resend (approved ✅) - simple, fast, perfect for launch
- **Scale:** AWS SES - migrate when >100k emails/month for cost savings
- Push notifications (browser) work out of the box - no cost, no backend
- Email is nice-to-have Elite feature, not required for MVP
- Wait until you have paying Elite customers before building this
- Use abstraction layer to make future migration painless
