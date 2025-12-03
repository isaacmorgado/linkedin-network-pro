# Uproot: Implementation Roadmap to $1M MRR
**Priority-Ordered Implementation Plan for LinkedIn Network Pro**

*Generated: December 3, 2025*
*Target: $1M Monthly Recurring Revenue in 18-24 Months*

---

## Executive Summary

### Critical Findings from Research

**The Churn Paradox:**
- **Early-Stage Churn**: 93% of users churn by Day 30 (74% on Day 1, 87% by Week 1)
- **Post-Hire Churn**: 70-80% churn after getting hired
- **The Solution**: Build BOTH simultaneously with dual-purpose features

**Revenue Opportunity:**
- **Market Validation**: LinkedIn Premium generates $2B annually from employed professionals (55% retention for 2+ years)
- **Proof Points**: Levels.fyi has 1.5M MAU, Blind has 7M users - all employed professionals
- **LTV Impact**: Post-hire features create 10x LTV multiplier ($150 → $1,500 lifetime value)

**CS Graduate Market Pain:**
- 6.1% unemployment rate (higher than philosophy majors)
- 30-40% of job postings are ghost jobs
- Average 221 applications before getting hired
- 68% report "extended silence" anxiety from ghosting

**Path to $1M MRR:**
- **Required Metrics**: 150K users, 4% conversion rate, $20 average pricing
- **Timeframe**: 18-24 months (realistic for CS-focused tool)
- **Comparison**: Gamma reached $1M MRR in 4-6 months (exceptional, AI-native product)

---

## Phase 1: Early Retention Crisis (Months 0-3)
### Goal: Reduce Week 1 churn from 87% to 65%

Week 1 is the **crisis point** where you lose 87% of users. This phase is about instant value delivery and activation.

### 1.1 Instant Gratification Features (Launch Week)

**Priority 1: LinkedIn Profile Score (Pre-Signup)**
- **Why First**: Delivers value in 30 seconds BEFORE signup
- **Implementation**:
  - Paste LinkedIn URL → Instant score (0-100)
  - Breakdown: Headline optimization, experience descriptions, skills, endorsements
  - Comparison: "You score 67/100. Top profiles in your field average 84/100"
- **Expected Impact**: 40-60% signup conversion from visitors
- **Technical Requirements**:
  - Public profile scraping (no auth needed)
  - Simple scoring algorithm based on completeness + keyword density
  - Cache scores for 24 hours to reduce API calls

**Priority 2: Company Reach Score**
- **Why Second**: Immediate "aha moment" for network value
- **Implementation**:
  - "You have 3 connections at Google, 2 at Meta, 1 at Apple"
  - Visual heat map of companies by degree of separation
  - Export as shareable image (built-in virality)
- **Expected Impact**: 8-12% organic share rate
- **Technical Requirements**:
  - LinkedIn CSV import (backup if API restricted)
  - Company aggregation algorithm
  - PNG export with Uproot branding

**Priority 3: Warm Path Discovery (First 5 Minutes)**
- **Why Third**: Core value prop - reduce cold applications
- **Implementation**:
  - Paste job URL → Instant connection path visualization
  - "You're 2 degrees from the hiring manager through Sarah Chen"
  - Color-coded: Green (1st degree), Yellow (2nd), Red (3rd+)
- **Expected Impact**: Defines aha moment for retention prediction
- **Technical Requirements**:
  - Job posting scraper for company + hiring manager extraction
  - Pathfinding algorithm (already built per existing codebase)
  - Real-time visualization (D3.js or similar)

### 1.2 Activation Tracking & Gamification

**Daily Streak System**
- **Metric**: Users who hit 3-day streak have 3.2x retention vs non-streakers
- **Implementation**:
  - Day 1: Create profile + scan 1 connection
  - Day 2: Add 3 target companies to watchlist
  - Day 3: Find 1 warm path + send 1 intro request
  - Day 7: Unlock "Career Explorer" badge
- **Rewards**:
  - 7-day streak: 1 free AI resume rewrite
  - 30-day streak: Premium features for 1 week
  - 90-day streak: Lifetime 20% discount

**Progress Bar Psychology**
- "Your profile is 60% optimized. Complete 2 more steps to unlock full network analysis"
- Leverages Zeigarnik effect (people complete unfinished tasks)

### 1.3 Persona-Specific Aha Moments

**SWE/CS Graduates (Primary Focus)**
- **Aha Moment Definition**:
  - Find 3+ warm paths to target companies
  - Send 1 intro request
  - Get 1 response
  - **Timeframe**: Within 7 days
- **Activation Rate Target**: 40% (from 15% baseline)

**Finance/IB Personas (Secondary)**
- Map 2 alumni connections at target banks
- Draft 1 personalized cold outreach
- Track application status for 5 jobs

**Creative Personas (Animation/Film/Music) - Post-MVP**
- Connect with 2 industry professionals
- Upload 5 portfolio pieces
- Get profile reviewed by 1 peer

### 1.4 Required Chrome Extension MVP Features

**Must-Have for Market Launch:**

1. **LinkedIn Profile Scraper**
   - Scrape own profile (name, headline, experience, education, skills)
   - Export to JSON for resume generation
   - Status: ✅ Already built (per existing codebase)

2. **Connection Path Finder**
   - Visualize 1st, 2nd, 3rd degree connections to target companies
   - Color-coded path visualization
   - Export paths as shareable images
   - Status: ✅ Algorithm built, needs UI polish

3. **Job Application Tracker**
   - Auto-detect when user applies to job (track URL)
   - Kanban board: Applied → Phone Screen → Onsite → Offer
   - Automatic status updates via email parsing (Gmail API)
   - Ghost job detection: Flag jobs with 100+ applicants, no update in 30 days

4. **Company Watchlist**
   - Track job postings from favorite companies
   - Browser notifications when new jobs posted
   - Show connection strength to each company

5. **Profile Score Calculator**
   - Real-time scoring as user updates LinkedIn profile
   - Benchmarking vs. top profiles in their field
   - Actionable tips: "Add 3 more technical skills to reach 80/100"

6. **Intro Request Templates**
   - Pre-written templates for requesting warm intros
   - Personalization fields: {{connection_name}}, {{company}}, {{role}}
   - Track send rate and response rate

**Nice-to-Have (Post-Launch):**
- Salary benchmarking (Phase 2)
- Resume auto-fill (already built per codebase)
- Cover letter generation (already built)
- Interview prep resources (Phase 3)

---

## Phase 2: Viral Growth & Post-Hire Hooks (Months 3-6)
### Goal: Achieve K-factor > 1.0 (viral growth) + reduce post-hire churn to 40%

### 2.1 Viral PLG Features (Expected 15-25% Share Rate)

**Priority 1: Shareable Network Insights**
- "My LinkedIn network reaches 847 companies across 23 industries"
- Visual infographic with Uproot branding
- One-click share to LinkedIn, Twitter, Reddit
- **Expected Share Rate**: 15-20%

**Priority 2: Peer Comparison Leaderboards**
- "You're in the top 12% of CS graduates for network strength"
- Weekly leaderboard: Most connections, fastest responders, best intro success rate
- Public profiles: "See how Sarah Chen built a network of 500+ in 6 months"
- **Expected Share Rate**: 8-12%

**Priority 3: Success Stories Showcase**
- User-generated content: "I got my Google offer through a 2nd-degree connection on Uproot"
- Request permission to share success stories
- Featured on homepage + shared on social media
- **Expected Share Rate**: 20-30% (from featured users)

### 2.2 Two-Sided Referral Program

**Structure (Based on Dropbox Model):**
- **Referrer Reward**: 2 weeks of Premium for each friend who activates (max 6/year = 12 weeks free)
- **Referee Reward**: 2 weeks Premium trial (vs. standard 1 week)
- **Activation Trigger**: Friend completes aha moment (finds 3 warm paths + sends 1 request)

**Expected Economics:**
- CAC: $15 (50% reduction from $30 paid ads)
- Viral coefficient: 0.4-0.6 initially, target 1.0+ by Month 12
- Referral rate: 15% of users refer 1+ friends

**Implementation:**
- Unique referral codes per user
- Dashboard showing referral stats (invited, activated, earned Premium days)
- Email triggers: "Sarah just used your referral! You've unlocked 2 weeks Premium"

### 2.3 Post-Hire Revenue Hooks (The $2B Opportunity)

This is where LinkedIn Premium makes $2B/year and Levels.fyi gets 1.5M MAU. Build these features NOW to prevent 70-80% post-hire churn.

**Priority 1: Salary Benchmarking**
- **Why It Matters**: Employed professionals check salary data 2-3x/year (promotion cycles, performance reviews)
- **Implementation**:
  - Crowdsourced salary data (à la Levels.fyi)
  - "Senior SWE at Google SF: $180K-$240K base (from 1,847 data points)"
  - Filter by: YOE, location, level, company
  - Show personal percentile: "You're at the 60th percentile for your role"
- **Monetization**: Premium feature (free users see ranges, paid see exact numbers + percentiles)
- **Data Collection Strategy**:
  - Offer 3 months free Premium in exchange for verified salary data
  - Verify via offer letters or pay stubs (auto-redacted)
  - Build initial dataset: 1,000 salaries across 50 companies

**Priority 2: Career Progression Tracking**
- **Why It Matters**: Gamification for career growth (Duolingo for your career)
- **Implementation**:
  - "You've been SWE II for 18 months. Average promotion cycle is 22 months"
  - Skill gap analysis: "To reach Senior SWE, add: System Design, Mentoring, Tech Lead experience"
  - Promotion readiness score (0-100)
  - Set promotion goals with milestones
- **Engagement**: Weekly check-ins, progress tracking, peer comparisons
- **Retention Impact**: Users with active career goals have 4x longer retention

**Priority 3: Internal Mobility Explorer**
- **Why It Matters**: 25% of employees consider internal transfers annually
- **Implementation**:
  - "3 open roles at your company match your skills: ML Engineer, Tech Lead, Product Manager"
  - Connection paths to hiring managers in other departments
  - Transfer timeline tracker: "Most successful transfers happen after 18 months tenure"
- **Use Case**: Instead of leaving company, explore internal opportunities first

**Priority 4: Professional Network Maintenance**
- **Why It Matters**: Networks decay 30% annually without maintenance
- **Implementation**:
  - "You haven't talked to Sarah Chen in 8 months. Send a quick message to stay connected"
  - Auto-generated re-engagement templates: "Hey Sarah, saw you got promoted to Senior PM. Congrats!"
  - Birthday/work anniversary reminders
  - "Weak tie strength alerts": Flag connections likely to go dormant
- **Psychology**: Maintains network value even when not actively job searching

### 2.4 Community Features (Network Effects)

**CS Graduate Community Hub**
- **Forums by Topic**: Interview prep, salary negotiation, company reviews, relocation advice
- **Peer Resume Reviews**: Upload resume → get feedback from 3 peers who recently got offers
- **Mock Interview Exchange**: Match users for practice interviews (30-min sessions)
- **Expected Engagement**: 20-30% of users participate monthly
- **Retention Impact**: Community members have 2.3x retention vs. non-participants

**Company Insider Network**
- "Connect with 47 current Google employees who graduated from your school"
- Ask anonymous questions: "What's the WLB really like on Google Cloud?"
- Verified employees only (via email verification + LinkedIn scraping)

---

## Phase 3: Scale to $1M MRR (Months 6-18)
### Goal: 150K users, 4% paid conversion, $20 ARPU = $1M MRR

### 3.1 Growth Channels (Ranked by ROI)

**Channel 1: Reddit (Highest ROI)**
- **Target Subreddits**: r/cscareerquestions (967K), r/EngineeringStudents (486K), r/jobs (437K)
- **Strategy**:
  - Weekly "I analyzed 1,000 LinkedIn profiles of recent CS grads who got FAANG offers. Here's what they have in common" posts
  - Subtle CTA: "I built a free tool to analyze your profile: [link]"
  - User success stories: "How I got 3 offers using warm intros from Uproot"
- **Expected CAC**: $5-8 per user (organic content + occasional awards to boost posts)
- **Volume**: 5,000-10,000 signups/month by Month 12

**Channel 2: University Partnerships**
- **Target**: Career services offices at top CS schools (Stanford, MIT, Berkeley, CMU, etc.)
- **Offer**: Free Premium accounts for all students + career counselors
- **Value Prop**: "Help your students get jobs faster with data-driven networking"
- **Expected Signups**: 2,000-5,000 per university partnership
- **Revenue Model**: Free for students, convert to paid post-graduation ($10/mo alumni discount)

**Channel 3: Product Hunt Launch**
- **Timing**: Month 6 (after MVP is polished + have 50 happy users for initial upvotes)
- **Goal**: #1 Product of the Day
- **Prep**:
  - Video demo (90 seconds)
  - Founder story: "Why I built this after sending 300 cold applications"
  - Exclusive PH offer: Lifetime 30% discount for first 1,000 users
- **Expected Signups**: 3,000-8,000 in launch week
- **Follow-up**: "We're #1 on Product Hunt" social media posts (2nd wave of virality)

**Channel 4: LinkedIn Organic Content**
- **Strategy**: Founder-led content marketing
- **Topics**:
  - "I analyzed 500 FAANG job postings. 78% had a backdoor via 2nd-degree connections"
  - "Why cold applications have a 0.2% success rate (and what to do instead)"
  - Weekly CS job market insights (salary trends, hiring freezes, hot companies)
- **Expected Growth**: 10K-20K followers by Month 12 → 2-5% convert to Uproot users

**Channel 5: Paid Ads (Lowest Priority)**
- **Channels**: Google Search ("LinkedIn network tool"), Facebook (CS graduate targeting)
- **Expected CAC**: $30-50 per user (3-5x higher than organic)
- **Use Case**: Accelerate growth once organic channels prove out PMF
- **Budget**: Allocate 20% of revenue to paid ads starting Month 12

### 3.2 Pricing & Packaging

**Free Tier (Forever Free)**
- 10 warm path lookups per month
- Basic company watchlist (5 companies)
- Job application tracker (unlimited)
- Profile score calculator
- Access to community forums
- **Goal**: Activation and viral growth

**Premium Tier ($19/month or $190/year - save 17%)**
- Unlimited warm path lookups
- Advanced salary benchmarking (exact numbers + percentiles)
- Resume AI rewrites (5 per month)
- Cover letter generator (unlimited)
- Career progression tracking
- Priority support
- Ad-free experience
- **Target**: Active job seekers (2-6 month subscription period)

**Professional Tier ($29/month or $290/year - save 17%)**
- Everything in Premium
- Internal mobility explorer
- Network maintenance automation
- Interview prep resources (coming Phase 4)
- Peer resume reviews (priority queue)
- Exclusive "Professional Network" community access
- **Target**: Employed professionals optimizing career (12-36 month retention)

**Student Discount (50% off)**
- $9.50/month or $95/year for .edu email holders
- Converts to full price 6 months post-graduation
- Partner with universities for bulk discounts

### 3.3 Conversion Optimization Tactics

**Freemium → Premium Triggers:**

1. **Hard Paywall on 11th Warm Path Lookup**
   - "You've found 10 warm paths this month. Upgrade to Premium for unlimited lookups"
   - Show comparison: "Premium users find 3.2x more job opportunities"
   - Time-limited offer: "Upgrade now and get 20% off first month"

2. **Salary Data Teaser**
   - Free users see: "Senior SWE at Google: $180K-$280K" (wide range)
   - Premium users see: "Senior SWE at Google SF: $220K base, $180K stock, $35K bonus (from 487 data points)"
   - CTA: "Unlock exact numbers to negotiate your offer"

3. **Resume AI Upgrade Prompts**
   - After 1st free resume rewrite: "Your resume score improved 34 points! Want 4 more rewrites this month?"
   - Show success rate: "Users who rewrite resumes 3+ times get 2.1x more interviews"

4. **FOMO Tactics**
   - "🔥 Sarah Chen just got a Google offer using a warm intro from Uproot"
   - "127 users upgraded to Premium this week to unlock salary data"
   - Countdown timer: "This offer expires in 48 hours"

**Target Conversion Rates:**
- Month 3: 1.5% free → paid (baseline)
- Month 6: 2.5% (better onboarding + paywall optimization)
- Month 12: 4.0% (mature product + pricing experiments)
- Month 18: 5.0% (best-in-class for freemium SaaS)

### 3.4 Revenue Projections to $1M MRR

**Month 6 Snapshot:**
- Total Users: 15,000
- Paid Users: 375 (2.5% conversion)
- ARPU: $20
- MRR: $7,500

**Month 12 Snapshot:**
- Total Users: 75,000
- Paid Users: 3,000 (4.0% conversion)
- ARPU: $21 (mix shift toward Professional tier)
- MRR: $63,000

**Month 18 Snapshot (TARGET: $1M MRR):**
- Total Users: 200,000
- Paid Users: 10,000 (5.0% conversion)
- ARPU: $22 (more Professional tier, annual prepays)
- MRR: $220,000
- **Gap to $1M**: Need 45,000 paid users at $22 ARPU

**Revised Month 24 Projection:**
- Total Users: 500,000 (aggressive growth via Reddit + university partnerships)
- Paid Users: 25,000 (5.0% conversion)
- ARPU: $24 (mature pricing, more annuals)
- MRR: $600,000
- **Alternative**: 200K users, 10% conversion (requires stronger product-market fit)

**Path to $1M MRR (Two Scenarios):**

**Scenario A: High Volume, Low Conversion**
- 500K users × 4% conversion × $50 ARPU (annual prepay) = $1M MRR
- Requires: Massive Reddit/TikTok virality, university partnerships

**Scenario B: Lower Volume, High Conversion**
- 200K users × 10% conversion × $50 ARPU = $1M MRR
- Requires: Extremely strong PMF, best-in-class product

**Realistic Target: Month 24-30**
- 350K users × 6% conversion × $47 ARPU = $987K MRR ≈ $1M MRR
- Combination of viral growth + pricing optimization + post-hire retention

---

## Phase 4: Advanced Features (Months 18-24)
### Goal: Increase ARPU from $22 to $50+ (move upmarket)

### 4.1 AI-Powered Career Coach

**Implementation:**
- Weekly 1:1 coaching sessions with AI coach (GPT-4 powered)
- Topics: Resume reviews, salary negotiation, interview prep, career pivots
- Personalized action plans: "Based on your profile, here are 5 steps to get promoted in 6 months"
- **Pricing**: Professional Plus tier at $79/month (3.3x current Premium)

### 4.2 Interview Prep Academy (SWE Focus)

**LeetCode Integration:**
- Track coding problems solved
- Personalized study plans based on target company
- Mock interview platform with peer matching
- **Value Prop**: "Google asks these 15 problem patterns in 80% of interviews"

**Behavioral Interview Prep:**
- STAR method templates by situation (leadership, conflict, failure)
- Company-specific interview guides (from crowdsourced data)
- Video practice with AI feedback on body language, filler words, pace

**System Design Curriculum:**
- 10 most common system design questions (URL shortener, news feed, chat app, etc.)
- Step-by-step walkthroughs with diagrams
- Peer review platform: Share designs, get feedback

**Pricing:**
- Standalone: $49/month (active job seekers, 2-4 month commitment)
- Bundled with Professional: $99/month (all-in-one career platform)

### 4.3 Employer-Facing Product (B2B Pivot)

**Recruiting Tool for Mid-Size Companies:**
- **Problem**: Mid-size companies (500-5,000 employees) can't compete with FAANG for recruiting
- **Solution**: "Find candidates who have 2nd-degree connections to your current employees"
- **Pricing**: $500-2,000/month per recruiter seat
- **Target**: 50 companies × 5 seats × $1,000/month = $250K MRR (B2B revenue stream)

**Employee Referral Platform:**
- White-label Uproot for company internal referral programs
- Track employee referrals, automate intro requests, gamify with rewards
- **Pricing**: $5-10K/year per company (500+ employees)

---

## Digital Employees: Priority Ranking
### AI Agents to Build for Competitive Advantage

### Tier 1: Must-Build (Months 0-6)

**1. Network Insight Analyst**
- **Function**: Analyze LinkedIn network to find warm paths to target companies
- **Input**: User's connections + target company/role
- **Output**: Ranked list of introduction paths with success probability scores
- **Impact**: Core value prop - replaces 3-5 hours of manual LinkedIn stalking
- **Build Complexity**: Medium (pathfinding algorithm already exists per codebase)

**2. Resume Optimization Engine**
- **Function**: Rewrite resume bullets for ATS optimization + impact maximization
- **Input**: Current resume + target job description
- **Output**: Rewritten resume with keyword density analysis + impact scoring
- **Impact**: Users get 2.1x more interviews (per existing research)
- **Build Complexity**: Low (GPT-4 API + prompt engineering)
- **Status**: ✅ Already built per codebase (BULLET_REWRITER_GUIDE.md exists)

**3. Career Path Navigator**
- **Function**: Predict next career moves based on current profile + market trends
- **Input**: User's experience, skills, interests + job market data
- **Output**: "3 most common next roles for your profile: Senior SWE (65%), Tech Lead (22%), Engineering Manager (13%)"
- **Impact**: Reduces decision paralysis, increases career goal clarity
- **Build Complexity**: Medium (requires career progression dataset - scrape LinkedIn public profiles)

### Tier 2: High-Impact (Months 6-12)

**4. Introduction Orchestrator**
- **Function**: Automate the "warm intro request" workflow end-to-end
- **Input**: Target person + mutual connection
- **Output**: Personalized intro request message (sent via email or LinkedIn)
- **Workflow**:
  1. User clicks "Request intro to Sarah Chen (via Mike Liu)"
  2. AI drafts personalized message: "Hi Mike, I noticed you're connected to Sarah Chen at Google. I'm applying for a SWE role there and would love an introduction. Here's why I'm a good fit: [3 bullet points]. Would you be willing to make an intro?"
  3. User reviews, edits, sends
  4. AI follows up in 5 days if no response
- **Impact**: Increases intro request rate 5-10x (removes friction)
- **Build Complexity**: Medium (Gmail/LinkedIn API + GPT-4)

**5. Ghost Job Detector**
- **Function**: Flag fake job postings to prevent wasted applications
- **Input**: Job posting URL
- **Output**: "⚠️ This job has 843 applicants and hasn't been updated in 47 days. 78% chance it's a ghost job"
- **Detection Criteria**:
  - Posted >30 days ago, still active
  - Applicant count >500
  - No company employee activity on posting
  - Company has hiring freeze (via news scraping)
- **Impact**: Saves users 20-40 hours of wasted application time
- **Build Complexity**: Low (crowdsourced data + simple heuristics)

**6. Salary Negotiation Coach**
- **Function**: Real-time negotiation advice during offer discussions
- **Input**: Offer details (base, stock, bonus, location) + user's experience
- **Output**: "This offer is at the 45th percentile for your level. Here's how to negotiate: [3 tactics]. Aim for $180K base (65th percentile)"
- **Impact**: Users negotiate $10K-30K higher offers (10-30% of annual salary)
- **Build Complexity**: Medium (requires salary database - build via crowdsourcing)

### Tier 3: Nice-to-Have (Months 12-24)

**7. AI SDR (Sales Development Rep)**
- **Function**: Automated outreach to university career centers for partnerships
- **Workflow**:
  1. Scrape list of CS career counselors at top 100 universities
  2. Generate personalized cold emails: "Hi [Name], I noticed Berkeley CS students struggle with networking. Uproot helps them find warm paths to companies. 15 Stanford students got offers using us last quarter. Can we offer Berkeley students free Premium accounts?"
  3. Auto-follow-up sequence (Day 3, Day 7, Day 14)
  4. Hand off hot leads to human founder
- **Impact**: 1 AI SDR replaces 4-5 human SDRs (per research)
- **Build Complexity**: High (requires email infrastructure + deliverability optimization)

**8. Content Generation Engine**
- **Function**: Auto-generate viral LinkedIn posts for founder's account
- **Input**: Weekly job market data (hiring trends, salary changes, hot companies)
- **Output**: "🚨 Google just posted 47 SWE roles. Here's how to get past the ATS: [3 tactics]"
- **Impact**: Drives 2-5% of weekly signups via founder's LinkedIn following
- **Build Complexity**: Medium (GPT-4 + job board scraping)

**9. Interview Question Predictor**
- **Function**: Predict interview questions based on target company + role
- **Input**: Company name + job level
- **Output**: "Google asks these 15 LeetCode questions in 80% of L3 SWE interviews: [list with links]"
- **Data Source**: Crowdsourced interview experiences (à la Glassdoor)
- **Impact**: Reduces interview prep time 50%, increases pass rate 20-30%
- **Build Complexity**: High (requires large crowdsourced dataset)

**10. Peer Matching Algorithm**
- **Function**: Match users with similar backgrounds for peer support
- **Input**: User's profile (school, major, graduation year, target companies)
- **Output**: "You have 3 matches: Sarah (Stanford CS '24, targeting Google), Mike (Berkeley CS '24, targeting startups), Lisa (CMU CS '24, targeting fintech)"
- **Use Cases**: Peer resume reviews, mock interviews, job search accountability partners
- **Impact**: Increases retention 2.3x via community engagement
- **Build Complexity**: Medium (collaborative filtering algorithm)

---

## Churn Prevention Strategy
### Early-Stage + Post-Hire Tactics

### Early-Stage Churn (Day 1-30)

**Day 1 (74% Churn Risk):**
- ✅ Instant value: Profile score + company reach score in <5 minutes
- ✅ Aha moment prompt: "Find your first warm path in the next 10 minutes"
- ✅ Email sequence: "Welcome to Uproot! Here's how Sarah got a Google offer using warm intros"

**Week 1 (87% Churn Risk - CRISIS POINT):**
- ✅ Daily streak gamification: Reward 3-day streak with free resume rewrite
- ✅ Push notifications: "New job posted at Google (you have 3 connections there)"
- ✅ Aha moment tracking: If user hasn't found 3 warm paths by Day 4, send intervention email

**Week 2-4 (93% Churn Risk):**
- ✅ Community onboarding: "Join 847 CS graduates in the job search support group"
- ✅ Success stories: "Mike got his Meta offer last week. Here's his strategy"
- ✅ Behavioral triggers: If no logins for 3 days → "Your dream job might have just been posted"

**Metrics to Track:**
- D1 retention: Target 35% (vs. 26% baseline)
- D7 retention: Target 20% (vs. 13% baseline)
- D30 retention: Target 12% (vs. 7% baseline)

### Post-Hire Churn (Months 3-12 Post-Signup)

**Immediately After Job Acceptance:**
- ✅ Congratulations email: "You got the job! Here's how to keep using Uproot to grow your career"
- ✅ Feature pivot: Show salary benchmarking + career progression tracking (not job search features)
- ✅ Pricing adjustment: Offer Professional tier upgrade: "$10 off first 3 months to track your new career"

**First 90 Days at New Job:**
- ✅ Onboarding milestones: "Track your first 30/60/90 days. 82% of successful employees hit these 5 goals"
- ✅ Network maintenance: "You haven't talked to Mike in 60 days. He just got promoted - send a congrats message"
- ✅ Learning goals: "Set a skill development goal for your first year. Most Senior SWEs at your company have: System Design, Mentoring, 2+ programming languages"

**Months 6-18 (Promotion Preparation):**
- ✅ Promotion readiness score: "You're 68% ready for Senior SWE. Close these 3 gaps: [list]"
- ✅ Internal mobility alerts: "3 new roles at your company match your skills"
- ✅ Salary benchmarking: "Review season is in 2 months. You're at 60th percentile - here's how to negotiate to 80th"

**Long-Term Retention (18+ Months):**
- ✅ Career pivots: "Ready for your next role? Here are 3 common paths for someone with your background"
- ✅ Interview prep refresh: "It's been 2 years since your last interview. Here's what's changed in SWE interviews"
- ✅ Network decay prevention: "Your network strength dropped 15% this year. Reconnect with these 10 people"

**Target Retention:**
- Month 6 (post-hire): 40% (vs. 20-30% baseline)
- Month 12 (post-hire): 25% (vs. 10-15% baseline)
- Month 24 (post-hire): 15% (vs. 5-8% baseline)

### Winback Campaigns (Churned Users)

**30 Days Post-Churn:**
- "We've added salary benchmarking since you left. See where you stand (free for the next 7 days)"

**90 Days Post-Churn:**
- "Sarah Chen just got a promotion using Uproot's career tracking. Want to see how?"

**6 Months Post-Churn:**
- "It's promotion season. Come back to benchmark your salary and prepare for your review"

---

## Metrics Dashboard: Weekly Tracking
### KPIs to Monitor for $1M MRR Goal

### North Star Metric
**Active Paid Users (APU)**
- Month 6: 375
- Month 12: 3,000
- Month 18: 10,000
- Month 24: 25,000 → **Goal: 42,000 by Month 30**

### Acquisition Metrics
- **Weekly Signups**: Track by channel (Reddit, university, Product Hunt, organic, paid)
  - Month 6: 500/week
  - Month 12: 1,500/week
  - Month 18: 4,000/week
- **CAC by Channel**:
  - Reddit: $5-8
  - University: $2-5 (subsidized by partnerships)
  - Product Hunt: $15-25
  - Paid Ads: $30-50
- **Viral Coefficient (K-factor)**: Target 0.6 by Month 12, 1.0+ by Month 18

### Activation Metrics
- **D1 Retention**: Target 35%
- **Aha Moment Rate**: % of users who find 3 warm paths + send 1 intro request within 7 days - Target 40%
- **Time to First Value**: Median time to first warm path discovery - Target <5 minutes

### Engagement Metrics
- **DAU/MAU Ratio**: Daily Active / Monthly Active Users - Target 0.25 (users log in 7.5 days/month)
- **3-Day Streak Rate**: % of users who hit 3-day streak - Target 30%
- **Feature Adoption**:
  - Warm path lookups: 8-12 per active user/month
  - Job application tracking: 15-25 jobs tracked
  - Community participation: 20-30% of users

### Conversion Metrics
- **Free → Paid Conversion Rate**:
  - Month 6: 2.5%
  - Month 12: 4.0%
  - Month 18: 5.0%
- **Average Days to Conversion**: Target 14 days (shorten with better paywalls)
- **Paywall Conversion Rate**: % of users who hit paywall and upgrade - Target 12-18%

### Retention Metrics
- **Monthly Churn Rate**:
  - Premium (job seekers): Target 15% (avg 2-6 month retention)
  - Professional (employed): Target 5% (avg 12-36 month retention)
- **Cohort Retention Curves**: Track each signup cohort's retention over 12 months
  - Month 1: 60%
  - Month 3: 35%
  - Month 6: 20%
  - Month 12: 12%

### Revenue Metrics
- **MRR (Monthly Recurring Revenue)**:
  - Month 6: $7,500
  - Month 12: $63,000
  - Month 18: $220,000
  - Month 24: $600,000
  - **Month 30: $1,000,000** ✅
- **ARPU (Average Revenue Per User)**: Target $22 → $47 by Month 24
- **LTV (Lifetime Value)**:
  - Premium: $150 (6-month avg retention)
  - Professional: $1,500 (24-month avg retention)
- **LTV:CAC Ratio**: Target 3:1 or higher (healthy SaaS economics)
- **Net Revenue Retention (NRR)**: Target 110% (includes upsells from Premium → Professional)

### Product Metrics
- **Feature Usage Rates**:
  - Profile score: 80%+ of new users
  - Warm path finder: 60%+ of active users
  - Salary benchmarking: 40%+ of Premium users
  - Job tracker: 70%+ of job seekers
- **Share Rate**: % of users who share network insights - Target 15-20%
- **NPS (Net Promoter Score)**: Target 50+ (world-class products are 50-70)

---

## Technical Implementation Notes

### Architecture Decisions

**Tech Stack (Existing per Codebase):**
- Frontend: WXT Framework (Chrome extension), React, TailwindCSS
- Backend: Node.js (per backend/ folder in codebase)
- Database: (Not specified - recommend PostgreSQL for relational data)
- AI: OpenAI GPT-4 API (per existing resume rewriter)

**Critical Technical Requirements:**

1. **LinkedIn Data Scraping**
   - Primary: LinkedIn API (if access granted - apply for partnership)
   - Fallback: CSV import + manual profile scraping (public profiles only)
   - Rate Limiting: Respect LinkedIn's robots.txt, implement exponential backoff
   - Storage: Cache profile data for 7 days to reduce API calls

2. **Pathfinding Algorithm**
   - Status: ✅ Already built (pathfinding_algorithm.js exists in codebase)
   - Optimization: Implement breadth-first search (BFS) for shortest paths
   - Performance: Target <500ms for 2nd-degree paths, <2s for 3rd-degree

3. **Salary Database**
   - Build crowdsourced dataset: Incentivize with Premium trials
   - Verify data: Require offer letters or pay stubs (auto-redact PII)
   - Initial seed: 1,000 salaries across 50 companies (can be done manually)

4. **Real-Time Notifications**
   - Chrome extension: Service worker for background job monitoring
   - Email: Trigger notifications via cron jobs (daily/weekly)
   - Push notifications: Firebase Cloud Messaging (FCM)

5. **Analytics & Tracking**
   - User behavior: Mixpanel or Amplitude (track aha moments, feature usage)
   - Revenue: Stripe for payments + Baremetrics for MRR dashboard
   - Retention: Cohort analysis dashboards (build custom or use Amplitude)

### Security & Privacy

**Data Privacy Compliance:**
- GDPR compliance: User data export + deletion on request
- LinkedIn TOS compliance: No bulk scraping of non-public data
- Encryption: All user data encrypted at rest (AES-256) and in transit (TLS 1.3)

**Payment Security:**
- Use Stripe for PCI compliance (never store credit card data)
- Implement dunning management: Auto-retry failed payments 3x over 7 days

---

## Risk Mitigation

### Risk 1: LinkedIn API Access Denied
**Probability**: High (LinkedIn is restrictive with API access)
**Impact**: High (core feature relies on LinkedIn data)
**Mitigation**:
- Plan A: Apply for LinkedIn Partner Program (emphasize value to job seekers)
- Plan B: CSV import fallback (user exports own connections)
- Plan C: Public profile scraping (respect rate limits, focus on own network only)

### Risk 2: Slow Growth (Can't Reach $1M MRR by Month 24)
**Probability**: Medium
**Impact**: High
**Mitigation**:
- Focus on one growth channel at a time (Reddit first, then universities)
- Optimize conversion before scaling acquisition
- Pivot pricing: Test $29 Premium tier if 4% conversion isn't achievable

### Risk 3: Post-Hire Churn Still High (>60%)
**Probability**: Medium
**Impact**: High (destroys LTV economics)
**Mitigation**:
- Double down on Professional tier value props (salary data, career tracking)
- Interview churned users: "Why did you cancel? What would bring you back?"
- Build employer-facing B2B product as alternative revenue stream

### Risk 4: Competitive Threats
**Probability**: High (LinkedIn could build similar features)
**Impact**: High
**Mitigation**:
- Move fast: Ship MVP in 3 months before competitors notice
- Build community moat: 10,000+ engaged users = defensible distribution
- Focus on CS grads niche (LinkedIn is generalist)

---

## Success Criteria by Phase

### Phase 1 (Months 0-3): MVP Launch
- ✅ Chrome extension live on Chrome Web Store
- ✅ 1,000 total users (mostly free)
- ✅ 25 paid users ($500 MRR)
- ✅ D7 retention >15%
- ✅ 5-10 positive user testimonials

### Phase 2 (Months 3-6): Product-Market Fit
- ✅ 15,000 total users
- ✅ 375 paid users ($7,500 MRR)
- ✅ D7 retention >20%, D30 retention >10%
- ✅ K-factor >0.4 (viral growth starting)
- ✅ Product Hunt #1 Product of the Day

### Phase 3 (Months 6-18): Scale to $100K MRR
- ✅ 200,000 total users
- ✅ 10,000 paid users ($220,000 MRR)
- ✅ 5+ university partnerships
- ✅ Reddit presence: 50K+ upvotes across posts, 10K+ signups from Reddit
- ✅ NPS >40

### Phase 4 (Months 18-24): Push to $1M MRR
- ✅ 500,000 total users (or path to getting there by Month 30)
- ✅ 25,000 paid users ($600,000 MRR) - **on track to $1M by Month 30**
- ✅ K-factor >1.0 (true viral growth)
- ✅ Professional tier: 30% of revenue (post-hire retention working)
- ✅ LTV:CAC ratio >3:1

---

## Next Steps: What to Build This Week

### Week 1 Priorities (MVP Sprint)

**Day 1-2: LinkedIn Profile Score**
- Build public profile scraper (no auth required)
- Create scoring algorithm (0-100 based on completeness + keywords)
- Design landing page: "Paste your LinkedIn URL → Get instant score"
- **Goal**: Ship by end of Day 2

**Day 3-4: Company Reach Score**
- Build CSV import flow (user exports LinkedIn connections)
- Aggregate connections by company
- Create visual heat map (top 20 companies)
- Add "Export as image" feature (PNG with Uproot branding)
- **Goal**: Ship by end of Day 4

**Day 5-7: Warm Path Finder UI Polish**
- Code already exists (pathfinding_algorithm.js) - focus on UX
- Improve visualization: Color-coded paths, click to expand details
- Add "Request intro" CTA button (triggers intro template)
- Test with 10 beta users, collect feedback
- **Goal**: Ship polished version by end of Week 1

### Week 2 Priorities (Activation & Retention)

**Day 8-10: Daily Streak System**
- Build streak tracking (local storage + backend sync)
- Design streak UI (Duolingo-style flame icon)
- Define Day 1-3 tasks (scan network, add watchlist, find 1 warm path)
- Implement push notifications for streak maintenance
- **Goal**: Ship by end of Day 10

**Day 11-12: Job Application Tracker**
- Auto-detect job applications (track URL + timestamp)
- Build Kanban board UI (Applied → Phone Screen → Onsite → Offer)
- Add manual status updates
- **Goal**: Basic version shipped by end of Day 12

**Day 13-14: Onboarding Flow**
- 3-step onboarding: (1) Import connections, (2) Add 3 target companies, (3) Find first warm path
- Track aha moment completion rate
- A/B test different onboarding prompts
- **Goal**: Ship by end of Week 2

### Week 3-4 Priorities (Monetization)

**Day 15-18: Freemium Paywall**
- Implement 10 warm path lookups/month limit for free users
- Build upgrade flow (Stripe integration)
- Design Premium tier landing page
- Set pricing: $19/month or $190/year

**Day 19-21: Premium Features (Phase 1)**
- Unlimited warm path lookups
- 5 AI resume rewrites/month (use existing resume rewriter code)
- Ad-free experience
- Priority support badge

**Day 22-28: Beta Launch**
- Recruit 50 beta users from Reddit (post in r/cscareerquestions)
- Offer lifetime 50% discount for early adopters
- Collect feedback via weekly surveys
- Iterate on top 3 feature requests
- **Goal**: 50 active users, 5-10 paid by end of Month 1

---

## Conclusion

This roadmap provides a **clear, priority-ordered path to $1M MRR in 24-30 months**. The strategy is built on three pillars:

1. **Fix Week 1 Churn First** (87% drop-off is the crisis) - instant value via profile score + company reach score
2. **Build Post-Hire Features Simultaneously** (avoid 70% churn cliff after users get hired) - salary data + career tracking
3. **Leverage Viral Growth** (reduce CAC from $30 to $5-8) - shareable insights + referral program

**Critical Success Factors:**
- Ship MVP in 90 days (speed matters more than perfection)
- Focus on CS grads first (highest unemployment, most pain)
- Prioritize one growth channel at a time (Reddit → universities → Product Hunt)
- Track aha moment completion rate weekly (predicts retention)
- Build community moat before competitors wake up

**The $1M MRR formula:**
- 500K users × 4% conversion × $50 ARPU = $1M MRR (Month 30)
- Or: 200K users × 10% conversion × $50 ARPU = $1M MRR (requires exceptional PMF)

This is an aggressive but **achievable goal** if you execute on early retention fixes (Phase 1), viral growth tactics (Phase 2), and post-hire revenue hooks (Phase 3) simultaneously. The market is proven ($2B LinkedIn Premium revenue, 1.5M Levels.fyi MAU), and the pain is real (6.1% CS grad unemployment, 221 applications before hired).

**Now go build.** 🚀