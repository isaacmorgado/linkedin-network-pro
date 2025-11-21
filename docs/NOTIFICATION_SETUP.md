# 📧 Notification System Setup Guide

Complete guide to setting up email, SMS, and push notifications for Uproot.

---

## 🎯 Overview

Uproot supports **3 notification channels**:

1. **Email** - Via Resend API (instant/daily/weekly batches)
2. **SMS** - Via Twilio API (instant only)
3. **Push** - Via Chrome Notifications API (instant only, built-in)

**Features:**
- Multi-channel support (email + SMS + push)
- Frequency control (instant, daily digest, weekly digest)
- Type filtering (job alerts, connections, messages, activity, system)
- Batch queuing for daily/weekly emails
- User preference management in Settings tab

---

## 🚀 Quick Start

### 1. Push Notifications (No Setup Required)

**Built-in Chrome notifications work immediately!**

```typescript
// Already configured in notification-service.ts
await chrome.notifications.create({
  type: 'basic',
  iconUrl: chrome.runtime.getURL('icon/128.png'),
  title: 'New Job Alert',
  message: 'Senior Software Engineer at Google',
});
```

✅ **No API keys needed**
✅ **Works offline**
✅ **Always instant**

---

## 📧 Email Notifications Setup (Resend API)

### Step 1: Create Resend Account

1. Go to [resend.com](https://resend.com)
2. Sign up for free account
3. Verify your email address

**Free Tier:**
- 3,000 emails/month
- 100 emails/day
- Perfect for personal use

---

### Step 2: Get API Key

1. Go to [API Keys](https://resend.com/api-keys)
2. Click "Create API Key"
3. Name: `Uproot Extension`
4. Permission: `Sending access`
5. Copy the API key (starts with `re_`)

**Example:**
```
re_123abc456def789ghi012jkl345mno678pqr
```

⚠️ **Save this key securely - you can't see it again!**

---

### Step 3: Verify Domain (Optional but Recommended)

**Why verify?** Unverified domains show "via resend.com" in recipient's inbox.

**Option A: Use Resend Domain (Easiest)**
- Send from: `notifications@resend.dev`
- No setup required
- Shows "via resend.com"

**Option B: Verify Your Domain (Recommended)**
1. Go to [Domains](https://resend.com/domains)
2. Click "Add Domain"
3. Enter your domain: `uproot.app`
4. Add DNS records (SPF, DKIM, DMARC)
5. Wait for verification (5-10 minutes)
6. Send from: `notifications@uproot.app`

**DNS Records to Add:**
```
Type: TXT
Host: @
Value: v=spf1 include:resend.com ~all

Type: CNAME
Host: resend._domainkey
Value: resend._domainkey.resend.com

Type: TXT
Host: _dmarc
Value: v=DMARC1; p=none; rua=mailto:dmarc@uproot.app
```

---

### Step 4: Add API Key to Extension

**Method 1: Environment Variables (Development)**

Create `.env` file:
```bash
VITE_RESEND_API_KEY=re_123abc456def789ghi012jkl345mno678pqr
VITE_RESEND_FROM_EMAIL=notifications@uproot.app
```

Update `notification-service.ts`:
```typescript
const resendApiKey = import.meta.env.VITE_RESEND_API_KEY;
const fromEmail = import.meta.env.VITE_RESEND_FROM_EMAIL || 'notifications@resend.dev';
```

**Method 2: Settings Storage (Production)**

Add to settings store:
```typescript
// src/stores/settings.ts
export interface AppSettings {
  // ... existing settings
  apiKeys?: {
    resend?: string;
    twilio?: {
      accountSid: string;
      authToken: string;
      phoneNumber: string;
    };
  };
}
```

Update notification service:
```typescript
// Get API key from settings
const settings = await getSettings();
const resendApiKey = settings?.apiKeys?.resend || 'YOUR_RESEND_API_KEY';
```

**Method 3: Hardcode (Testing Only)**

⚠️ **NOT RECOMMENDED FOR PRODUCTION**

```typescript
// notification-service.ts line 217
const resendApiKey = 're_123abc456def789ghi012jkl345mno678pqr';
```

---

### Step 5: Test Email Sending

```typescript
import { notificationService } from './services/notification-service';

const testPayload = {
  type: 'job_alert',
  title: 'Test Email from Uproot',
  body: 'This is a test notification to verify Resend integration.',
  url: 'https://uproot.app/test',
  priority: 'high',
};

const testPreferences = {
  email: {
    enabled: true,
    address: 'your.email@example.com',
    types: ['job_alert', 'connection_accepted', 'message_follow_up', 'activity_update', 'system'],
    frequency: 'instant',
  },
  sms: { enabled: false, phoneNumber: null, types: [] },
  push: { enabled: false, types: [] },
};

await notificationService.sendNotification(testPayload, testPreferences);
```

**Check your inbox!** Should receive HTML email in 2-3 seconds.

---

## 📱 SMS Notifications Setup (Twilio API)

### Step 1: Create Twilio Account

1. Go to [twilio.com/try-twilio](https://www.twilio.com/try-twilio)
2. Sign up for free account
3. Verify your email and phone number

**Free Trial:**
- $15 trial credit
- ~500 SMS messages (US)
- Phone number verification required

---

### Step 2: Get Phone Number

1. Go to [Phone Numbers](https://console.twilio.com/us1/develop/phone-numbers/manage/incoming)
2. Click "Buy a number"
3. Choose country (e.g., United States)
4. Select "SMS" capability
5. Purchase number (~$1/month after trial)

**Example Number:**
```
+1 (555) 123-4567
```

---

### Step 3: Get API Credentials

1. Go to [Console Dashboard](https://console.twilio.com/)
2. Find "Account Info" section
3. Copy credentials:
   - **Account SID**: `ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`
   - **Auth Token**: Click "Show" and copy

**Example:**
```
Account SID: ACXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
Auth Token: your_auth_token_here
Phone Number: +15551234567
```

⚠️ **Keep Auth Token secret!**

---

### Step 4: Add Credentials to Extension

**Method 1: Environment Variables (Development)**

Create `.env` file:
```bash
VITE_TWILIO_ACCOUNT_SID=ACXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
VITE_TWILIO_AUTH_TOKEN=your_auth_token_here
VITE_TWILIO_PHONE_NUMBER=+15551234567
```

Update `notification-service.ts`:
```typescript
const twilioAccountSid = import.meta.env.VITE_TWILIO_ACCOUNT_SID;
const twilioAuthToken = import.meta.env.VITE_TWILIO_AUTH_TOKEN;
const twilioPhoneNumber = import.meta.env.VITE_TWILIO_PHONE_NUMBER;
```

**Method 2: Settings Storage (Production)**

```typescript
// Get from settings
const settings = await getSettings();
const twilioAccountSid = settings?.apiKeys?.twilio?.accountSid || 'YOUR_ACCOUNT_SID';
const twilioAuthToken = settings?.apiKeys?.twilio?.authToken || 'YOUR_AUTH_TOKEN';
const twilioPhoneNumber = settings?.apiKeys?.twilio?.phoneNumber || 'YOUR_PHONE_NUMBER';
```

---

### Step 5: Verify Phone Numbers (Trial Account)

⚠️ **Trial accounts can only send SMS to verified numbers!**

1. Go to [Verified Caller IDs](https://console.twilio.com/us1/develop/phone-numbers/manage/verified)
2. Click "Add new Caller ID"
3. Enter your phone number: `+1 555 987 6543`
4. Enter verification code sent via SMS
5. Repeat for all test numbers

**Production:** After upgrading, you can send to any number.

---

### Step 6: Test SMS Sending

```typescript
import { notificationService } from './services/notification-service';

const testPayload = {
  type: 'job_alert',
  title: 'Test SMS from Uproot',
  body: 'Senior Software Engineer at Google - Apply now!',
  url: 'https://linkedin.com/jobs/123456',
  priority: 'high',
};

const testPreferences = {
  email: { enabled: false, address: null, types: [], frequency: 'instant' },
  sms: {
    enabled: true,
    phoneNumber: '+15559876543', // Must be verified on trial
    types: ['job_alert', 'connection_accepted'],
  },
  push: { enabled: false, types: [] },
};

await notificationService.sendNotification(testPayload, testPreferences);
```

**Check your phone!** Should receive SMS in 2-3 seconds.

---

## ⚙️ Settings Integration

### Add API Keys to Settings UI

Create new settings section in `SettingsTab.tsx`:

```typescript
// New tab: API Configuration
<SettingsNavButton
  icon={<Key size={iconSize} strokeWidth={2} />}
  label="API Configuration"
  shortLabel="APIs"
  isActive={activeView === 'api'}
  onClick={() => onViewChange('api')}
/>
```

Create `APISettings.tsx` component:

```typescript
export function APISettings() {
  const [resendKey, setResendKey] = useState('');
  const [twilioSid, setTwilioSid] = useState('');
  const [twilioToken, setTwilioToken] = useState('');
  const [twilioPhone, setTwilioPhone] = useState('');

  const handleSave = async () => {
    const settings = await getSettings();
    await updateSettings({
      ...settings,
      apiKeys: {
        resend: resendKey,
        twilio: {
          accountSid: twilioSid,
          authToken: twilioToken,
          phoneNumber: twilioPhone,
        },
      },
    });
  };

  return (
    <div>
      <Section title="Resend API (Email)">
        <input
          type="password"
          placeholder="re_xxxxxxxxxxxxx"
          value={resendKey}
          onChange={(e) => setResendKey(e.target.value)}
        />
        <a href="https://resend.com/api-keys" target="_blank">
          Get API Key
        </a>
      </Section>

      <Section title="Twilio API (SMS)">
        <input
          placeholder="Account SID (ACxxxxx)"
          value={twilioSid}
          onChange={(e) => setTwilioSid(e.target.value)}
        />
        <input
          type="password"
          placeholder="Auth Token"
          value={twilioToken}
          onChange={(e) => setTwilioToken(e.target.value)}
        />
        <input
          placeholder="Phone Number (+15551234567)"
          value={twilioPhone}
          onChange={(e) => setTwilioPhone(e.target.value)}
        />
        <a href="https://console.twilio.com" target="_blank">
          Get Credentials
        </a>
      </Section>

      <button onClick={handleSave}>Save API Keys</button>
    </div>
  );
}
```

---

## 🔧 Background Script Integration

### Daily/Weekly Batch Sending

Add alarm handlers in `background.ts`:

```typescript
// Create alarms for daily/weekly batches
chrome.alarms.create('daily-email-batch', {
  when: getNext9AM(),
  periodInMinutes: 1440, // 24 hours
});

chrome.alarms.create('weekly-email-batch', {
  when: getNextMondayAt9AM(),
  periodInMinutes: 10080, // 7 days
});

// Handle batch alarms
chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === 'daily-email-batch') {
    const settings = await getSettings();
    await notificationService.sendDailyBatch(settings.notifications);
  }

  if (alarm.name === 'weekly-email-batch') {
    const settings = await getSettings();
    await notificationService.sendWeeklyBatch(settings.notifications);
  }
});
```

---

## 📊 Testing Checklist

### Email Notifications

- [ ] Instant email received in inbox
- [ ] HTML formatting displays correctly
- [ ] Job alert icon (💼) shows
- [ ] Action button links to job URL
- [ ] From address correct (not via resend.com if domain verified)
- [ ] Daily batch queues notifications
- [ ] Weekly batch queues notifications
- [ ] Daily digest email sent at 9 AM
- [ ] Weekly digest email sent Monday 9 AM

### SMS Notifications

- [ ] Instant SMS received on phone
- [ ] Message under 160 characters
- [ ] Emoji displays correctly (💼)
- [ ] URL shortened or truncated properly
- [ ] Phone number formatted correctly (+15551234567)
- [ ] Only sends for selected notification types

### Push Notifications

- [ ] Chrome notification appears instantly
- [ ] Extension icon displays
- [ ] High priority notifications require interaction
- [ ] Normal priority auto-dismiss after 5 seconds
- [ ] Click notification opens URL

### Settings UI

- [ ] Toggle switches save correctly
- [ ] Email address validation
- [ ] Phone number validation (+1 format)
- [ ] Notification type checkboxes work
- [ ] Frequency radio buttons work
- [ ] "Save" button shows success message
- [ ] Changes persist after browser restart

---

## 🐛 Troubleshooting

### Email Not Sending

**Check:**
1. Resend API key is correct (starts with `re_`)
2. Email address in preferences is valid
3. Email notification type is enabled
4. Frequency is set to "instant" (or check batch queue)
5. Check Resend dashboard for errors: [resend.com/logs](https://resend.com/logs)

**Common Errors:**
- `401 Unauthorized` - Invalid API key
- `422 Unprocessable Entity` - Invalid email format
- `429 Too Many Requests` - Rate limit exceeded (100/day on free)

---

### SMS Not Sending

**Check:**
1. Twilio credentials are correct (SID starts with `AC`)
2. Phone number is verified (trial accounts only)
3. Phone number format: `+15551234567` (E.164 format)
4. SMS notification type is enabled
5. Check Twilio console for errors: [console.twilio.com](https://console.twilio.com)

**Common Errors:**
- `401 Unauthorized` - Invalid Account SID or Auth Token
- `21211 Invalid Phone Number` - Phone number not in E.164 format
- `21608 Unverified Number` - Trial account can't send to unverified numbers
- `21610 Message Blocked` - Recipient opted out

---

### Push Notifications Not Showing

**Check:**
1. Chrome notifications permission granted
2. Extension has `notifications` permission in manifest
3. Icon file exists at `icon/128.png`
4. Push notification type is enabled in settings

**Browser Settings:**
1. Go to `chrome://settings/content/notifications`
2. Ensure Chrome can show notifications
3. Check extension is not blocked

---

## 💰 Cost Estimates

### Free Tier Usage

| Service | Free Tier | Cost After |
|---------|-----------|------------|
| **Resend** | 3,000 emails/month | $20/month (50k emails) |
| **Twilio SMS** | $15 credit (~500 SMS) | $0.0075/SMS (US) |
| **Chrome Push** | Unlimited | Free |

### Monthly Cost Examples

**Light User** (10 job alerts/day):
- 300 emails/month → FREE
- 0 SMS → FREE
- Push notifications → FREE
- **Total: $0/month**

**Moderate User** (50 job alerts/day):
- 1,500 emails/month → FREE
- 0 SMS → FREE
- Push notifications → FREE
- **Total: $0/month**

**Power User** (100 job alerts/day + SMS):
- 3,000 emails/month → FREE
- 3,000 SMS/month → $22.50
- Push notifications → FREE
- **Total: $22.50/month**

---

## 🎯 Best Practices

### Email

✅ **DO:**
- Use instant for urgent notifications (job alerts)
- Use daily digest for activity updates
- Use weekly digest for connection summaries
- Verify your domain for professional look
- Keep subject lines under 60 characters

❌ **DON'T:**
- Send more than 100 emails/day (free tier limit)
- Use all caps in subject line (spam filter)
- Include unescaped HTML in body
- Send to invalid email addresses

### SMS

✅ **DO:**
- Keep messages under 160 characters
- Use SMS for critical alerts only (expensive)
- Include shortened URLs
- Test with verified numbers first

❌ **DON'T:**
- Send promotional content (illegal without consent)
- Send after 9 PM local time
- Use SMS for daily digests (too expensive)
- Forget country code (+1 for US)

### Push

✅ **DO:**
- Use for all notification types (free!)
- Set high priority for job alerts
- Include actionable buttons
- Test click-through URLs

❌ **DON'T:**
- Spam with too many notifications
- Show sensitive data in notification body
- Require interaction for low-priority items

---

## 📚 Resources

### Resend
- [Documentation](https://resend.com/docs)
- [API Reference](https://resend.com/docs/api-reference/emails/send-email)
- [Email Templates](https://resend.com/docs/send-with-react)
- [Domain Verification](https://resend.com/docs/dashboard/domains/introduction)

### Twilio
- [Documentation](https://www.twilio.com/docs/sms)
- [API Reference](https://www.twilio.com/docs/sms/api)
- [Phone Numbers](https://www.twilio.com/docs/phone-numbers)
- [Pricing](https://www.twilio.com/sms/pricing/us)

### Chrome APIs
- [Notifications API](https://developer.chrome.com/docs/extensions/reference/notifications/)
- [Alarms API](https://developer.chrome.com/docs/extensions/reference/alarms/)
- [Storage API](https://developer.chrome.com/docs/extensions/reference/storage/)

---

## ✅ Setup Complete!

You now have a fully functional multi-channel notification system! 🎉

**Next Steps:**
1. Test all three channels (email, SMS, push)
2. Configure user preferences in Settings tab
3. Monitor notification delivery in respective dashboards
4. Adjust batching schedules based on user feedback
5. Add custom email templates for different notification types

**Need Help?**
- Resend Support: support@resend.com
- Twilio Support: help.twilio.com
- Chrome Extensions: groups.google.com/a/chromium.org/g/chromium-extensions
