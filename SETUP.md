# 🚀 Resume Tailoring System - Setup Guide

## Prerequisites

- ✅ Node.js 20+ (already installed)
- ✅ npm (already installed)
- ⚠️ Anthropic API key (need to get)

---

## Step 1: Get Anthropic API Key

1. Go to https://console.anthropic.com/
2. Sign up / Log in
3. Navigate to "API Keys"
4. Create new key
5. Copy the key (starts with `sk-ant-...`)

**Cost:** Free tier includes $5 credit (~100-500 resumes)

---

## Step 2: Configure Environment

```bash
# Navigate to project
cd /home/imorgado/Documents/agent-girl/chat-abc62d98/linkedin-network-pro

# Create .env file
cat > .env << 'EOF'
VITE_ANTHROPIC_API_KEY=sk-ant-your-key-here
EOF

# Replace 'sk-ant-your-key-here' with your actual key
```

**Or** export as environment variable:
```bash
export VITE_ANTHROPIC_API_KEY=sk-ant-your-actual-key
```

---

## Step 3: Install Dependencies

```bash
# Anthropic SDK should already be in package.json
npm install

# If not installed, add it:
npm install @anthropic-ai/sdk dotenv
```

---

## Step 4: Test Keyword Extractor (No API needed)

```bash
# This works without API key
npx tsx test-keyword-extractor.ts
```

**Expected output:**
```
✅ 85% F1 score
✅ Top keywords extracted
✅ Required vs Preferred split working
```

---

## Step 5: Test Full System (Needs API key)

```bash
# Load environment variables and run E2E test
npx tsx test-resume-generation-e2e.ts
```

**Expected output:**
```
✅ Match Score: 78%
✅ ATS Score: 75/100
✅ No hallucination detected
✅ Resume generated successfully
```

**If you see errors:**
- Check API key is set correctly
- Check you have API credits remaining
- Check internet connection

---

## Usage Examples

### Example 1: Extract Keywords Only (No API)

```typescript
import { extractKeywordsFromJobDescription } from './src/services/keyword-extractor';

const jobPosting = `
Senior Software Engineer at Meta
Required: Python, React, Docker, 5+ years
Preferred: AWS, Kubernetes
`;

const keywords = extractKeywordsFromJobDescription(jobPosting);

// Get required skills
const required = keywords.filter(k => k.required).map(k => k.term);
console.log('Required:', required);

// Get preferred skills
const preferred = keywords.filter(k => !k.required).map(k => k.term);
console.log('Preferred:', preferred);
```

---

### Example 2: Match User to Job (No API)

```typescript
import { matchUserToJob } from './src/services/resume-matcher';
import type { UserProfile, JobRequirements } from './src/types/resume-tailoring';

// Create user profile
const profile: UserProfile = {
  name: 'John Doe',
  title: 'Software Engineer',
  workExperience: [
    {
      id: '1',
      company: 'Tech Corp',
      title: 'Software Engineer',
      startDate: '2022-01-01',
      endDate: null,
      achievements: [
        {
          id: 'a1',
          bullet: 'Built Python microservices handling 1M requests/day',
          action: 'Built',
          object: 'Python microservices',
          skills: ['Python', 'Microservices'],
          keywords: ['Python', 'microservices', 'APIs'],
          transferableSkills: ['backend development'],
          verified: true,
          source: 'user',
        }
      ],
      skills: ['Python', 'React'],
      domains: ['backend'],
      responsibilities: [],
    }
  ],
  education: [],
  projects: [],
  skills: [
    { name: 'Python', level: 'advanced', yearsOfExperience: 3 },
    { name: 'React', level: 'intermediate', yearsOfExperience: 2 },
  ],
  metadata: {
    totalYearsExperience: 3,
    domains: ['backend'],
    seniority: 'mid',
    careerStage: 'professional',
  },
};

// Extract job requirements
const keywords = extractKeywordsFromJobDescription(jobPosting);
const jobRequirements: JobRequirements = {
  required: keywords.filter(k => k.required),
  preferred: keywords.filter(k => !k.required),
};

// Match!
const matchReport = matchUserToJob(profile, jobRequirements);

console.log(`Match Score: ${(matchReport.matchScore * 100).toFixed(1)}%`);
console.log(`Matched: ${matchReport.matches.length} skills`);
console.log(`Missing: ${matchReport.missing.length} skills`);

// Show recommendations
matchReport.recommendations.forEach(rec => {
  console.log(`[${rec.priority}] ${rec.suggestion}`);
});
```

---

### Example 3: Generate Tailored Resume (Needs API)

```typescript
import { quickGenerateTailoredResume } from './src/services/resume-generator';

const profile: UserProfile = { /* ... */ };
const jobPosting = "...";

const tailored = await quickGenerateTailoredResume(profile, jobPosting);

// Access results
console.log('Match Score:', tailored.matchReport.matchScore);
console.log('ATS Score:', tailored.atsScore);

// Get optimized bullets
tailored.experience.forEach(exp => {
  console.log(`\n${exp.company}:`);
  exp.bullets.forEach(bullet => {
    console.log(`  • ${bullet}`);
  });
});

// See what changed
exp.changes.forEach(change => {
  console.log('\nOriginal:', change.original);
  console.log('Rewritten:', change.rewritten);
  console.log('Keywords Added:', change.keywordsAdded);
  console.log('Verified:', change.factVerification.allFactsPreserved);
});
```

---

## Troubleshooting

### "API key not found"
```bash
# Check environment variable is set
echo $VITE_ANTHROPIC_API_KEY

# If empty, set it:
export VITE_ANTHROPIC_API_KEY=sk-ant-your-key

# Or add to .env file
```

### "Rate limit exceeded"
- Free tier has rate limits
- Wait a few minutes and retry
- Or upgrade to paid tier

### "Invalid API key"
- Double-check key is correct (starts with `sk-ant-`)
- Make sure you copied the entire key
- Regenerate key in Anthropic console

### "Module not found: @anthropic-ai/sdk"
```bash
npm install @anthropic-ai/sdk
```

---

## What Works Without API

**✅ No API needed:**
- Keyword extraction
- Skill matching
- Match score calculation
- Recommendations
- Hallucination detection

**⚠️ Needs API:**
- Bullet rewriting (the AI part)
- Full resume generation

**Workaround:** Use matching + recommendations, manually rewrite bullets

---

## Cost Management

**Free Tier:**
- $5 credit
- ~100-500 resumes
- Perfect for testing

**Paid Tier:**
- $0.01-0.05 per resume
- Much cheaper than Jobscan ($50/mo) or Resume Worded ($33/mo)

**Optimization:**
- Only rewrite bullets that need keywords
- Cache results for same job posting
- Use lower `maxKeywordsPerBullet` setting

---

## Next Steps

1. ✅ Test keyword extractor (no API)
2. ✅ Get Anthropic API key
3. ✅ Test full system
4. 🚀 Integrate with your LinkedIn extension
5. 🎨 Build UI (optional)

---

## Support

**Issues?**
- Check logs in console
- Verify API key is set
- Check API credits remaining
- Test with simple example first

**Feature Requests?**
- User profile parser (parse PDF resumes)
- Multiple resume formats
- Batch processing
- UI/frontend

---

## Summary

**Status:**
- ✅ Keyword Extractor: Complete, no API needed
- ✅ Matching Engine: Complete, no API needed
- ⚠️ Resume Generator: Complete, needs Anthropic API key

**Total Setup Time:** ~10 minutes
**Cost:** Free tier ($5 credit = 100-500 resumes)

**You're ready to go!** 🚀
