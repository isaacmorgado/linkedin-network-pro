# 🤖 AI Backend Integration Plan

## The Problem

**Current State:**
- Resumes use template-based generation (no real AI)
- No API key required (works offline)
- Limited quality

**What You Want:**
- Real AI-powered resume generation (Claude API)
- Users DON'T need their own API keys
- Included in subscription plan
- Backend handles all AI calls

## The Solution: Backend API + Subscription Gating

### Architecture

```
┌─────────────┐      ┌──────────────┐      ┌─────────────┐
│   Chrome    │─────▶│   Backend    │─────▶│  Claude AI  │
│  Extension  │      │     API      │      │     API     │
└─────────────┘      └──────────────┘      └─────────────┘
                            │
                            ▼
                     ┌──────────────┐
                     │   Supabase   │
                     │  (Database)  │
                     └──────────────┘
```

### Component Breakdown

#### 1. **Backend API** (Node.js/Express or Supabase Edge Functions)
```typescript
// /api/generate-resume

POST /api/generate-resume
Headers:
  - Authorization: Bearer <user_token>
  - Content-Type: application/json

Body:
{
  "jobAnalysis": {...},
  "profile": {...}
}

Response:
{
  "resume": {...},
  "atsScore": 85,
  "creditsUsed": 1
}
```

#### 2. **Subscription Tiers**

| Tier | Price | AI Resumes/Month | Features |
|------|-------|------------------|----------|
| Free | $0 | 3 | Template-based resumes, keyword extraction |
| Pro | $9.99 | 50 | AI resumes, ATS scoring, PDF export |
| Elite | $19.99 | Unlimited | All Pro + priority support, cover letters |

#### 3. **Database Schema** (Supabase)

```sql
-- Users table (handled by Supabase Auth)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users PRIMARY KEY,
  email TEXT NOT NULL,
  subscription_tier TEXT DEFAULT 'free',
  subscription_status TEXT DEFAULT 'active',
  subscription_expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Usage tracking
CREATE TABLE resume_generations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id),
  job_title TEXT,
  company TEXT,
  credits_used INTEGER DEFAULT 1,
  ats_score INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Monthly usage tracking
CREATE TABLE monthly_usage (
  user_id UUID REFERENCES profiles(id),
  month TEXT, -- 'YYYY-MM'
  resumes_generated INTEGER DEFAULT 0,
  credits_remaining INTEGER,
  PRIMARY KEY (user_id, month)
);
```

## Implementation Steps

### Phase 1: Backend Setup

#### Option A: Supabase Edge Functions (Recommended)
```typescript
// supabase/functions/generate-resume/index.ts

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!
  )

  // Get user from JWT
  const authHeader = req.headers.get('Authorization')!
  const token = authHeader.replace('Bearer ', '')
  const { data: { user } } = await supabase.auth.getUser(token)

  if (!user) {
    return new Response('Unauthorized', { status: 401 })
  }

  // Check subscription & credits
  const { data: profile } = await supabase
    .from('profiles')
    .select('subscription_tier')
    .eq('id', user.id)
    .single()

  const { data: usage } = await supabase
    .from('monthly_usage')
    .select('credits_remaining')
    .eq('user_id', user.id)
    .eq('month', new Date().toISOString().slice(0, 7))
    .single()

  // Check limits
  const limits = {
    free: 3,
    pro: 50,
    elite: 999999
  }

  if (usage.credits_remaining <= 0) {
    return new Response('Credit limit reached', { status: 429 })
  }

  // Parse request
  const { jobAnalysis, profile: userProfile } = await req.json()

  // Call Claude API
  const claudeResponse = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': Deno.env.get('CLAUDE_API_KEY')!,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 2000,
      messages: [{
        role: 'user',
        content: generatePrompt(jobAnalysis, userProfile)
      }]
    })
  })

  const aiResponse = await claudeResponse.json()

  // Generate resume with AI summary
  const resume = {
    ...generateResumeContent(jobAnalysis, userProfile),
    professionalSummary: aiResponse.content[0].text,
    generatedAt: Date.now()
  }

  // Track usage
  await supabase
    .from('resume_generations')
    .insert({
      user_id: user.id,
      job_title: jobAnalysis.jobTitle,
      company: jobAnalysis.company,
      credits_used: 1,
      ats_score: resume.atsScore
    })

  await supabase
    .from('monthly_usage')
    .update({ credits_remaining: usage.credits_remaining - 1 })
    .eq('user_id', user.id)
    .eq('month', new Date().toISOString().slice(0, 7))

  return new Response(JSON.stringify(resume), {
    headers: { 'Content-Type': 'application/json' }
  })
})

function generatePrompt(job, profile) {
  return `Generate a professional summary for a resume tailored to this job:

Job Title: ${job.jobTitle}
Company: ${job.company}

Required Skills: ${job.requiredSkills.join(', ')}
Preferred Skills: ${job.preferredSkills.join(', ')}

Candidate Profile:
- Years of Experience: ${calculateYears(profile)}
- Technical Skills: ${profile.technicalSkills.map(s => s.name).join(', ')}
- Recent Jobs: ${profile.jobs.slice(0, 2).map(j => `${j.title} at ${j.company}`).join('; ')}

Write a compelling 2-3 sentence professional summary that:
1. Highlights relevant experience matching the job requirements
2. Emphasizes matching skills and technologies
3. Uses strong action words
4. Includes quantifiable achievements if possible
5. Is ATS-optimized with keywords

Professional Summary:`
}
```

#### Option B: Separate Node.js Backend
```typescript
// server.ts

import express from 'express';
import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@supabase/supabase-js';

const app = express();
const anthropic = new Anthropic({ apiKey: process.env.CLAUDE_API_KEY });
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

app.post('/api/generate-resume', async (req, res) => {
  // Same logic as Edge Function above
});

app.listen(3000);
```

### Phase 2: Extension Updates

#### Update AI Resume Generator
```typescript
// src/services/ai-resume-generator.ts

async function generateProfessionalSummary(
  profile: ProfessionalProfile,
  job: JobDescriptionAnalysis
): Promise<string> {
  // Get user token
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    throw new Error('Please sign in to use AI resume generation');
  }

  // Check if user has credits
  const { data: usage } = await supabase
    .from('monthly_usage')
    .select('credits_remaining')
    .eq('user_id', session.user.id)
    .single();

  if (usage.credits_remaining <= 0) {
    throw new Error('Credit limit reached. Upgrade your plan for more AI resumes.');
  }

  // Call backend API
  const response = await fetch('https://your-backend.supabase.co/functions/v1/generate-resume', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${session.access_token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      jobAnalysis: job,
      profile: profile,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to generate resume');
  }

  const resume = await response.json();
  return resume.professionalSummary;
}
```

### Phase 3: Subscription Management

#### Stripe Integration
```typescript
// Webhook handler
app.post('/api/webhooks/stripe', async (req, res) => {
  const event = req.body;

  switch (event.type) {
    case 'checkout.session.completed':
      // Update user to Pro/Elite tier
      await supabase
        .from('profiles')
        .update({
          subscription_tier: event.data.object.metadata.tier,
          subscription_status: 'active',
          subscription_expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        })
        .eq('id', event.data.object.client_reference_id);

      // Initialize monthly credits
      await supabase
        .from('monthly_usage')
        .upsert({
          user_id: event.data.object.client_reference_id,
          month: new Date().toISOString().slice(0, 7),
          credits_remaining: event.data.object.metadata.tier === 'pro' ? 50 : 999999
        });
      break;

    case 'customer.subscription.deleted':
      // Downgrade to free
      await supabase
        .from('profiles')
        .update({
          subscription_tier: 'free',
          subscription_status: 'canceled'
        })
        .eq('id', event.data.object.metadata.user_id);
      break;
  }

  res.json({ received: true });
});
```

## Cost Estimates

### Claude API Pricing
- Input: $3 per million tokens
- Output: $15 per million tokens
- Average resume: ~500 input tokens + 200 output tokens
- **Cost per resume: ~$0.004**

### Monthly Costs

| Tier | Users | Resumes/User | Total Resumes | Cost | Revenue | Profit |
|------|-------|--------------|---------------|------|---------|--------|
| Free | 1000 | 3 | 3,000 | $12 | $0 | -$12 |
| Pro | 100 | 25 | 2,500 | $10 | $999 | $989 |
| Elite | 20 | 100 | 2,000 | $8 | $399 | $391 |
| **Total** | **1120** | - | **7,500** | **$30** | **$1,398** | **$1,368** |

**Profit margin: 97.9%** 🚀

## Deployment

### Supabase Edge Functions
```bash
# Deploy function
supabase functions deploy generate-resume

# Set secrets
supabase secrets set CLAUDE_API_KEY=sk-ant-...

# Test
curl -X POST https://your-project.supabase.co/functions/v1/generate-resume \
  -H "Authorization: Bearer YOUR_JWT" \
  -H "Content-Type: application/json" \
  -d '{"jobAnalysis": {...}, "profile": {...}}'
```

### Environment Variables
```
CLAUDE_API_KEY=sk-ant-api...
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=xxx
STRIPE_SECRET_KEY=sk_live_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
```

## Next Steps

1. ✅ Set up Supabase project
2. ✅ Create database tables
3. ✅ Deploy Edge Function for AI generation
4. ✅ Update extension to call backend
5. ✅ Add subscription management UI
6. ✅ Integrate Stripe for payments
7. ✅ Add usage tracking dashboard
8. ✅ Test with real users

---

**This gives you professional AI generation without users needing their own API keys, while making 97% profit margin.** 💰
