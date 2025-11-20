# 🚀 Quick Start Guide - Uproot Extension

**Get from zero to custom resume in 5 minutes.**

---

## 📦 Installation (2 minutes)

### Step 1: Build the Extension

```bash
# Clone the repository
git clone https://github.com/yourusername/uproot.git
cd uproot/linkedin-extension

# Install dependencies
npm install

# Build the extension
npm run build
```

You should see:
```
✓ Built in XXXms
.output/chrome-mv3/manifest.json    597 B
.output/chrome-mv3/background.js    12.84 kB
.output/chrome-mv3/content.js       390.68 kB
```

### Step 2: Load in Chrome

1. Open Chrome and go to `chrome://extensions`
2. Enable **Developer mode** (toggle in top right corner)
3. Click **Load unpacked**
4. Navigate to your project folder and select `.output/chrome-mv3`
5. You should see Uproot appear in your extensions list! 🎉

### Step 3: Pin to Toolbar

1. Click the puzzle icon in Chrome toolbar (extensions menu)
2. Find "Uproot" in the list
3. Click the pin icon to keep it visible

**Done!** Click the Uproot icon to open the extension.

---

## 🎯 First-Time Setup (3 minutes)

### Build Your Profile

When you first open Uproot, go to **Profile Builder** tab:

#### 1. Personal Information
```
✓ Full Name: John Doe
✓ Email: john.doe@email.com
✓ Phone: (555) 123-4567
✓ Location: San Francisco, CA
✓ LinkedIn: linkedin.com/in/johndoe
```

#### 2. Add Work Experience

Click **Add Job Experience**:
```
✓ Job Title: Senior Software Engineer
✓ Company: Tech Corp
✓ Location: San Francisco, CA
✓ Start Date: 2020-01
✓ End Date: Leave blank if current
✓ Current: Check if still working there

Technologies Used: React, TypeScript, Node.js, AWS

Achievements (3-5 bullet points):
• Built scalable microservices architecture serving 1M+ users
• Reduced API response time by 40% through optimization
• Led team of 5 engineers on React migration project
```

**Pro Tips:**
- Use strong action verbs (Built, Reduced, Led, Increased)
- Include quantifiable metrics (40%, 1M+, 5 engineers)
- Follow APR format: Action + Project + Result
- Add 3-5 bullets per job (ATS sweet spot)

#### 3. Add Skills

**Technical Skills:**
- JavaScript, TypeScript, Python, React, Node.js
- AWS, Docker, Kubernetes, PostgreSQL, MongoDB

**Soft Skills:**
- Team Leadership, Project Management, Agile, Communication

**Pro Tip:** Add proficiency levels (Beginner/Intermediate/Advanced/Expert) and years of experience

#### 4. Add Education
```
✓ Degree: Bachelor of Science
✓ Field: Computer Science
✓ Institution: State University
✓ Location: City, State
✓ Start: 2012-09
✓ End: 2016-05
✓ GPA: 3.8 (optional)
✓ Honors: Dean's List, Cum Laude (optional)
```

#### 5. Add Projects (Optional but Recommended)
```
✓ Project Name: E-commerce Platform
✓ Description: Built full-stack e-commerce app with React and Node.js
✓ Technologies: React, Node.js, PostgreSQL, Stripe
✓ Link: github.com/johndoe/ecommerce
✓ Highlights:
  • Implemented payment processing with Stripe
  • Built real-time inventory management system
  • Deployed on AWS with 99.9% uptime
```

**Your profile is now ready!** The AI will use this to generate custom resumes.

---

## 🎨 Using Uproot (Daily Workflow)

### Scenario: You Found a Job Posting

Let's say you found this job on LinkedIn:

> **Senior Full-Stack Developer**
> **Company**: StartupCo
>
> We're looking for a Senior Full-Stack Developer with experience in React, Node.js, and AWS. Must have 5+ years of experience building scalable web applications. TypeScript and Docker experience preferred. You'll lead a small team and mentor junior developers...

Here's how to use Uproot:

---

### Step 1: Analyze the Job (15 seconds)

1. **Copy the entire job description** from LinkedIn
2. Open Uproot extension
3. Go to **Job Analyzer** tab
4. Paste the job description
5. Enter:
   - Job Title: `Senior Full-Stack Developer`
   - Company: `StartupCo`
6. Click **Analyze with AI**

**What happens:**
- AI extracts keywords in 2 seconds
- Shows required vs preferred skills
- Calculates your match percentage
- Highlights missing skills

**You'll see:**
```
Required Skills (Red):
• React (Importance: 95)
• Node.js (Importance: 92)
• AWS (Importance: 88)
• Full-stack development (Importance: 85)
• Team leadership (Importance: 80)

Preferred Skills (Orange):
• TypeScript (Importance: 70)
• Docker (Importance: 65)
• Mentoring (Importance: 60)

Match Score: 87% ✓
Missing: Docker (add to profile or address in summary)
```

---

### Step 2: Generate Custom Resume (5 seconds)

1. Go to **Resume Generator** tab
2. Click on the job you just analyzed ("Senior Full-Stack Developer at StartupCo")
3. AI generates custom resume (3 seconds)

**What the AI does automatically:**
- ✅ Selects your most relevant jobs (keyword matching)
- ✅ Picks matching skills (React, Node.js, AWS, TypeScript)
- ✅ Writes custom professional summary for THIS specific job
- ✅ Optimizes for ATS (keyword density, format compliance)
- ✅ Calculates ATS score (0-100)

**You'll see:**
```
PROFESSIONAL SUMMARY
─────────────────────────────────
Results-driven Senior Software Engineer with 8+ years of experience in React,
Node.js, and AWS. Proven track record of building scalable full-stack applications
serving millions of users. Expert in TypeScript and Docker, with strong leadership
experience mentoring teams of 5+ engineers...

PROFESSIONAL EXPERIENCE
─────────────────────────────────
Senior Software Engineer
Tech Corp | San Francisco, CA | Jan 2020 - Present

• Built scalable microservices architecture with Node.js and AWS serving 1M+ users
• Led React migration project for team of 5 engineers, reducing load time by 40%
• Implemented CI/CD pipeline using Docker and Kubernetes
• Mentored 3 junior developers on full-stack best practices

TECHNICAL SKILLS
─────────────────────────────────
React • Node.js • TypeScript • AWS • Docker • Kubernetes • PostgreSQL • ...

EDUCATION
─────────────────────────────────
Bachelor of Science in Computer Science
State University | 2012 - 2016 | GPA: 3.8

─────────────────────────────────
ATS Score: 85/100 🟢 (Excellent)
Keyword Match: 82%
Format Compliance: 100%
```

---

### Step 3: Review ATS Score & Recommendations

Scroll down to see your ATS breakdown:

**Overall Score: 85/100** 🟢 (Excellent)

**Breakdown:**
- ✅ Keyword Match: 82% (Target: 75-80%) - Great!
- ✅ Format Compliance: 100% - Perfect!
- ✅ Content Quality: 85% - Strong action verbs and metrics
- ⚠️ Keyword Density: 2.1% (Target: 2-3%) - Could add more

**Recommendations:**
1. ✓ Add one more bullet mentioning "Docker" to boost keyword match
2. ✓ Consider adding "microservices" to technical skills section
3. ✓ Good use of metrics (1M+ users, 40% improvement)

---

### Step 4: Copy & Apply (5 seconds)

1. Click **Copy to Clipboard** button
2. Go to the job application site
3. Paste into the resume text field
4. Submit! 🚀

**That's it.** Custom, ATS-optimized resume in under 30 seconds total.

---

## 🎯 Pro Tips & Best Practices

### Profile Building Tips

**1. Use Action Verbs**
```
✓ Built, Developed, Created, Designed, Implemented
✓ Led, Managed, Mentored, Coordinated, Directed
✓ Increased, Reduced, Improved, Optimized, Achieved
✓ Launched, Deployed, Shipped, Released, Delivered

✗ Responsible for, Worked on, Helped with, Tasked with
```

**2. Include Metrics**
```
✓ "Increased conversion rate by 35%"
✓ "Reduced server costs by $50K/year"
✓ "Served 2M+ monthly active users"
✓ "Led team of 8 engineers"

✗ "Made the app faster"
✗ "Improved user experience"
✗ "Worked on a team"
```

**3. Follow APR Format**
```
APR = Action + Project + Result

✓ "Built [Action] microservices architecture [Project] serving 1M+ users [Result]"
✓ "Led [Action] React migration [Project] reducing load time by 40% [Result]"
✓ "Implemented [Action] CI/CD pipeline [Project] cutting deploy time from 2hrs to 10min [Result]"
```

**4. Keep Bullets Concise**
```
✓ One line per bullet (max 2 lines)
✓ Start with strong action verb
✓ Include specific technology/tool
✓ End with quantifiable result

✗ Long paragraphs
✗ Generic descriptions
✗ No metrics or outcomes
```

### Job Analysis Tips

**1. Analyze Every Job You Apply To**
- Even if jobs seem similar, keywords vary
- Different companies emphasize different skills
- Analysis takes 15 seconds - always worth it

**2. Pay Attention to Match Score**
```
90%+  = Perfect match, apply immediately
75-90% = Good match, customize resume
60-75% = Possible match, highlight transferable skills
<60%  = Weak match, consider if worth applying
```

**3. Address Missing Skills**
- If a required skill is missing, mention related experience
- Use synonyms (JS ↔ JavaScript, AWS ↔ Cloud)
- Emphasize transferable skills

### Resume Generation Tips

**1. Review Before Sending**
- AI is smart but not perfect
- Check for typos or formatting issues
- Ensure bullets make sense for the job

**2. Customize Further (Optional)**
- Add job-specific achievements
- Reorder bullets to match job priorities
- Adjust summary if needed

**3. Track Your Applications**
- Note which resumes got interviews
- Iterate on what works
- Update profile with new achievements

---

## 🐛 Troubleshooting

### "No jobs found in profile"
**Solution:** Go to Profile Builder → Add at least one job experience

### "Match score is 0%"
**Solution:** Job description might be too short or generic. Paste full description including requirements.

### "Resume looks off"
**Solution:** Copy to a text editor first (Notepad, VS Code) to see plain text, then paste to application

### "ATS score is low"
**Solution:** Check recommendations below the score. Usually need to:
- Add more relevant keywords to profile
- Include metrics in bullets
- Match job requirements more closely

### "Extension not loading"
**Solution:**
1. Go to `chrome://extensions`
2. Find Uproot
3. Click refresh icon
4. If still not working, remove and reload unpacked extension

---

## 📊 Success Checklist

Before applying to a job:

- [ ] Profile is at least 80% complete
- [ ] Job description analyzed in Job Analyzer
- [ ] Match score is 65% or higher
- [ ] Resume generated for specific job
- [ ] ATS score is 65+ (preferably 80+)
- [ ] Reviewed AI-generated content for accuracy
- [ ] Addressed any red flags in recommendations
- [ ] Copied resume to clipboard
- [ ] Pasted into application
- [ ] Submitted! 🎉

---

## 🎓 Learning Resources

**Inside the extension:**
- Read the 3 research reports in `/docs/research`
- Review ATS optimization checklist
- Check keyword extraction methodology

**External resources:**
- [ATS Resume Guide](https://www.indeed.com/career-advice/resumes-cover-letters/ats-resume)
- [Action Verbs List](https://www.themuse.com/advice/185-powerful-verbs-that-will-make-your-resume-awesome)
- [Resume Metrics Examples](https://www.jobscan.co/blog/resume-accomplishments-examples/)

---

## 🚀 Next Steps

1. **Build your profile** (one-time, 10-15 minutes)
2. **Find a job posting** you want to apply to
3. **Analyze the job** (15 seconds)
4. **Generate resume** (5 seconds)
5. **Copy & apply** (5 seconds)
6. **Repeat for every job** 🔄

**Goal:** Apply to 10 jobs today with custom resumes. You got this! 💪

---

## 💬 Need Help?

- Check [README.md](README.md) for full documentation
- Review [FEATURES.md](FEATURES.md) for feature details
- Open an issue on GitHub if you find bugs
- Star the repo if you find this helpful! ⭐

---

**Ready? Let's get you that interview.** 🎯
