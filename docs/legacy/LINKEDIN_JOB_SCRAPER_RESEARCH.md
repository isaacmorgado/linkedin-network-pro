# LinkedIn Job Scraper & ATS Resume Optimizer - Code Research

## Executive Summary

Found excellent real-world implementations from GitHub for:
1. **LinkedIn Job Scraping** - Chrome extensions with content scripts
2. **ATS Score Calculation** - Multiple scoring algorithms
3. **Skills Extraction** - NLP and pattern-matching approaches
4. **Job-Resume Matching** - Keyword matching and scoring

---

## 🎯 Best Repositories Found

### 1. **Jobjourney Extension** (MIT License)
**Repository**: https://github.com/Rorogogogo/Jobjourney-extention

**Key Files**:
- `pages/content/src/matches/jobsites/linkedin-scraper.ts`
- `pages/content/src/matches/jobsites/save-single-job-scrapers/linkedin-single-job-scraper.ts`
- `pages/content/src/matches/jobsites/save-button-manager/job-data-extractor.ts`

**What it does**: Chrome extension that scrapes LinkedIn job pages and saves job data

**LinkedIn Selectors Used**:
```typescript
// Job detail selectors
'.job-details-jobs-unified-top-card__job-title h1'
'.job-details-jobs-unified-top-card__company-name a'
'.job-details-jobs-unified-top-card__primary-description-container'
'.jobs-description__content .jobs-box__html-content'
'.jobs-description-content__text'
'.artdeco-entity-lockup__image img.evi-image' // Company logo
'.job-details-jobs-unified-top-card__container--two-pane .evi-image'
```

**Code Pattern**:
```typescript
extractJobData(): JobData | null {
  const url = window.location.href;

  // Check if on job detail page
  if (url.includes('/jobs/collections/') && !url.includes('currentJobId=')) {
    return null;
  }

  const titleElement = this.querySelector([
    '.job-details-jobs-unified-top-card__job-title h1',
    '.t-24.job-details-jobs-unified-top-card__job-title',
    'h1.job-title'
  ]);

  const companyElement = this.querySelector([
    '.job-details-jobs-unified-top-card__company-name a',
    '.jobs-details-top-card__company-url',
    '.job-details-jobs-unified-top-card__company-name'
  ]);

  const descriptionElement = document.querySelector(
    '.jobs-description__content .jobs-box__html-content, .jobs-description-content__text, div#job-details'
  );

  // Extract job ID from URL
  let jobUrl = this.cleanUrl(window.location.href);
  const currentJobIdMatch = window.location.href.match(/currentJobId=(\d+)/);
  if (currentJobIdMatch) {
    jobUrl = `https://www.linkedin.com/jobs/view/${currentJobIdMatch[1]}/`;
  }

  return {
    title: titleElement?.textContent?.trim(),
    company: companyElement?.textContent?.trim(),
    location: locationElement?.textContent?.trim(),
    description: descriptionElement?.textContent?.trim(),
    url: jobUrl
  };
}
```

---

### 2. **First2Apply** (MIT License)
**Repository**: https://github.com/beastx-ro/first2apply

**Key Files**:
- `apps/backend/supabase/functions/_shared/jobDescriptionParser.ts`
- `apps/backend/supabase/functions/_shared/customJobsParser.ts`
- `apps/backend/supabase/functions/scan-job-description/index.ts`

**What it does**: Automated job application system with AI-powered job description parsing

**Code Pattern**:
```typescript
export async function parseJobDescriptionUpdates({
  site,
  html,
  job,
  user,
  ...context
}) {
  // Parse the job description from HTML
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  // Extract structured data using OpenAI
  const response = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [
      {
        role: 'user',
        content: userPrompt,
      },
    ],
    max_completion_tokens: 10_000,
    response_format: zodResponseFormat(PARSE_JOB_DESCRIPTION_SCHEMA, 'ParseJobDescriptionResponse'),
  });

  return parsedJobData;
}
```

---

### 3. **LinkedIn Jobs Scraper** (Production-Ready)
**Repository**: https://github.com/spinlud/linkedin-jobs-scraper

**Key Files**:
- `src/scraper/strategies/AuthenticatedStrategy.ts`

**LinkedIn Selectors (Updated)**:
```typescript
const selectors = {
  jobs: 'div.job-card-container',
  link: 'a.job-card-container__link',
  applyBtn: 'button.jobs-apply-button[role="link"]',
  title: '.artdeco-entity-lockup__title',
  company: '.artdeco-entity-lockup__subtitle',
  companyLink: '.job-details-jobs-unified-top-card__company-name a',
  place: '.artdeco-entity-lockup__caption',
  date: 'time',
  dateText: '.job-details-jobs-unified-top-card__primary-description-container span:nth-of-type(3)',
  description: '.jobs-description',
  detailsPanel: '.jobs-search__job-details--container',
  detailsTop: '.jobs-details-top-card',
  details: '.jobs-details__main-content',
  insights: '.job-details-jobs-unified-top-card__container--two-pane li',
  pagination: '.jobs-search-two-pane__pagination',
  requiredSkills: '.job-details-how-you-match__skills-item-subtitle',
}
```

---

### 4. **RSSHub LinkedIn Parser**
**Repository**: https://github.com/DIYgod/RSSHub (MIT License)

**Key Files**:
- `lib/routes/linkedin/utils.ts`

**Code Pattern**:
```typescript
/**
 * Parse job detail page
 * Example page: https://www.linkedin.com/jobs/view/software-engineer-backend-junior-at-genies-3429649821
 *
 * @param {String} data HTML string of job detail page
 * @returns {Job} Job details
 */
function parseJobDetail(data) {
  const $ = cheerio.load(data);

  return {
    title: $('.job-details-jobs-unified-top-card__job-title').text().trim(),
    company: $('.job-details-jobs-unified-top-card__company-name').text().trim(),
    location: $('.job-details-jobs-unified-top-card__primary-description-container').text().trim(),
    description: $('.jobs-description__content').text().trim(),
    url: window.location.href
  };
}
```

---

## 🎯 ATS Score Calculation

### 1. **ResumeItNow** (MIT License)
**Repository**: https://github.com/maheshpaulj/ResumeItNow

**Key File**: `app/api/ats-check/route.ts`

**Code Pattern**:
```typescript
const prompt = jobDescription
  ? `Analyze this resume text and job description for ATS compatibility. Extract relevant keywords maximum of 10, calculate an ATS score (0-100), and provide suggestions for improvement. Resume: "${resumeText}". Job Description: "${jobDescription}". Return the response in JSON format with keys: score (number), keywords (array of strings, only important ones), suggestions (array of strings).`
  : `Analyze this resume text for general ATS compatibility. Extract relevant keywords maximum of 10, calculate an ATS score (0-100), and provide suggestions for improvement. Resume: "${resumeText}". Return the response in JSON format with keys: score (number), keywords (array of strings, only important ones), suggestions (array of strings).`;

const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
  method: "POST",
  headers: {
    Authorization: `Bearer ${OPENROUTER_API_KEY}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    model: "anthropic/claude-3-sonnet",
    messages: [{ role: "user", content: prompt }],
  }),
});
```

---

### 2. **AI Career Assistant** (Rule-Based ATS Scoring)
**Repository**: https://github.com/Gnaneswar22/ai-career-assistant

**Key File**: `app/api/resume/generate/route.ts`

**Code Pattern**:
```typescript
// Define ATS scoring rules
const ATS_RULES = {
  keywordMatch: {
    weight: 0.30,
    check: (resume: string, keywords: string[]) => {
      const matchedKeywords = keywords.filter(keyword =>
        resume.toLowerCase().includes(keyword.toLowerCase())
      );
      return matchedKeywords.length / keywords.length;
    },
  },
  formatting: {
    weight: 0.20,
    check: (resume: string) => {
      let score = 1.0;
      // Check for proper formatting
      if (!/\n\n/.test(resume)) score *= 0.8; // Lacks spacing
      if (resume.includes('•') || resume.includes('-')) score *= 1.1; // Has bullet points
      return Math.min(score, 1.0);
    },
  },
  sectionStructure: {
    weight: 0.15,
    check: (resume: string) => {
      const sections = ['experience', 'education', 'skills'];
      const foundSections = sections.filter(section =>
        resume.toLowerCase().includes(section)
      );
      return foundSections.length / sections.length;
    },
  },
  quantifiableAchievements: {
    weight: 0.15,
    check: (resume: string) => {
      const numberPattern = /\d+%|\$\d+|\d+\+/g;
      const matches = resume.match(numberPattern) || [];
      return Math.min(matches.length / 5, 1.0); // Target at least 5 quantifiable metrics
    },
  },
  actionVerbs: {
    weight: 0.10,
    check: (resume: string) => {
      const actionVerbs = ['led', 'managed', 'developed', 'created', 'implemented', 'improved', 'increased', 'reduced'];
      const foundVerbs = actionVerbs.filter(verb =>
        resume.toLowerCase().includes(verb)
      );
      return foundVerbs.length / actionVerbs.length;
    },
  },
  length: {
    weight: 0.10,
    check: (resume: string) => {
      const wordCount = resume.split(/\s+/).length;
      if (wordCount < 200) return 0.5;
      if (wordCount > 800) return 0.7;
      return 1.0; // 200-800 words is optimal
    },
  },
}

// Calculate ATS Score
function calculateATSScore(resumeContent: string, targetKeywords: string[] = []): number {
  let totalScore = 0;

  for (const [rule, config] of Object.entries(ATS_RULES)) {
    const ruleScore = config.check(resumeContent, targetKeywords);
    totalScore += ruleScore * config.weight;
  }

  return Math.round(totalScore * 100); // Convert to 0-100 scale
}
```

---

### 3. **Advanced ATS Resume Checker** (Python)
**Repository**: https://github.com/mayankkala/Advanced-ATS-Resume-Checker

**Key File**: `resumeATS.py`

**Code Pattern**:
```python
prompt = f"""
You are ResumeChecker, an expert in resume analysis. Provide a detailed analysis:

1. Identify the most suitable profession for this resume.
2. List 5 strengths of the resume.
3. Suggest 3-5 areas for improvement with specific recommendations.
4. Rate the following aspects out of 10: Impact, Brevity, Style, Structure, Skills.
5. Provide a brief review of each major section (Summary, Experience, Education).
6. Give an overall ATS score out of 100 with a breakdown of the scoring.

Resume text: {pdf_text}
Job description (if provided): {job_description}
"""
```

---

## 🎯 Skills Extraction

### 1. **Open Resume** (AGPL-3.0 License)
**Repository**: https://github.com/xitanggg/open-resume

**Key Files**:
- `src/app/lib/parse-resume-from-pdf/extract-resume-from-sections/extract-skills.ts`
- `src/app/lib/parse-resume-from-pdf/extract-resume-from-sections/index.ts`

**Code Pattern**:
```typescript
export const extractSkills = (sections: ResumeSectionToLines) => {
  const lines = getSectionLinesByKeywords(sections, ["skill"]);
  const descriptionsLineIdx = getDescriptionsLineIdx(lines) ?? 0;
  const descriptionsLines = lines.slice(descriptionsLineIdx);
  const descriptions = getBulletPointsFromLines(descriptionsLines);

  const skills: Skills = {
    featuredSkills: [],
    descriptions: descriptions,
  };

  return { skills };
};
```

---

### 2. **HyperBrowser Job Matcher**
**Repository**: https://github.com/hyperbrowserai/hyperbrowser-app-examples

**Key File**: `hb-job-matcher/app/api/extract-profile/route.ts`

**Code Pattern**:
```typescript
function extractSkillsFromText(text: string): string[] {
  const commonTechTerms = [
    'JavaScript', 'TypeScript', 'Python', 'Java', 'Go', 'Rust', 'Swift', 'C++', 'C#',
    'React', 'Angular', 'Vue', 'Next.js', 'Nuxt.js', 'Svelte', 'Flutter', 'React Native',
    'Node.js', 'Express', 'Django', 'Flask', 'Spring', 'ASP.NET',
    'MongoDB', 'PostgreSQL', 'MySQL', 'Redis', 'Elasticsearch',
    'AWS', 'Azure', 'GCP', 'Docker', 'Kubernetes', 'CI/CD',
    'Git', 'Agile', 'Scrum', 'REST API', 'GraphQL', 'Microservices',
    'Machine Learning', 'AI', 'Data Science', 'TensorFlow', 'PyTorch'
  ];

  const skills: string[] = [];
  const textLower = text.toLowerCase();

  for (const term of commonTechTerms) {
    const regex = new RegExp(`\\b${term.toLowerCase()}\\b`, 'i');
    if (regex.test(textLower)) {
      skills.push(term);
    }
  }

  return [...new Set(skills)]; // Remove duplicates
}
```

---

### 3. **JobSync** (Skills Extraction from Job Descriptions)
**Repository**: https://github.com/adityagarwal15/JobSync

**Key File**: `routes/searchAPI.routes.js`

**Code Pattern**:
```javascript
function extractSkills(snippet, title) {
  const allText = `${snippet} ${title}`.toLowerCase();

  const techSkills = [
    'javascript', 'python', 'java', 'react', 'node.js', 'angular', 'vue',
    'typescript', 'sql', 'nosql', 'aws', 'docker', 'kubernetes', 'git',
    'machine learning', 'ai', 'data science', 'agile', 'scrum'
  ];

  return techSkills.filter(skill => allText.includes(skill));
}
```

---

## 🎯 Resume-Job Matching

### 1. **JobSync CrewAI** (MIT License)
**Repository**: https://github.com/Gsync/jobsync

**Key File**: `src/actions/ai.actions.ts`

**Code Pattern**:
```typescript
const prompt = ChatPromptTemplate.fromMessages([
  [
    "system",
    `
    You are an expert assistant tasked with matching job seekers' resumes with job descriptions and providing suggestions to improve their resumes.

    You will analyze the given resume and job description, provide a matching score between 0 and 100, score will be based on:
    - Application Tracking System (ATS) friendliness
    - Skill and keywords match

    Suggest improvements to increase the matching score and make the resume more aligned with the job description.
    Be verbose and highlight details in your response.

    Your response must always return JSON object with following structure:
    {
      "matching_score": <number 0-100>,
      "ats_score": <number 0-100>,
      "keyword_match_percentage": <number 0-100>,
      "matched_keywords": [<array of matched keywords>],
      "missing_keywords": [<array of missing important keywords>],
      "detailed_analysis": [
        {
          "category": "<Experience|Skills|Education|etc>",
          "strength": "<what's good>",
          "improvement": "<what to improve>",
          "priority": "<high|medium|low>"
        }
      ],
      "suggestions": [<array of actionable suggestions>]
    }
    `
  ]
]);
```

---

### 2. **CrewAI Resume Generator** (MIT License)
**Repository**: https://github.com/peshak2008/crewai_resumesummary_coverletter_generator

**Key File**: `utils/crew.py`

**Code Pattern**:
```python
resume_writing_task = Task(
    description=f"""
    Write a resume summary section that highlights {candidate_name}'s hard and soft skills.

    Try to highlight skills and keywords that match the job description.
    Do not make up skills or summary that do not truthfully represent {candidate_name}'s strength.

    The summary paragraph is about 5 sentences. Do not be too verbose, and make the sentences impactful,
    and do not use cliche words.

    When using sentences from {candidate_name}'s resume in the summary, do not copy word for word.
    But when applicable, it is ok to use exact keywords from the job description to show that the
    candidate is a great fit.

    Also Select a job title that closely matches the job title in the job description.
    The desired job title is 1-5 words.

    You must follow the format: Job Title: <title>\n\n Summary: <Summary>
    """,
    agent=resume_writer,
    context=[job_description_task, candidate_skills_task],
)
```

---

## 🎯 Implementation Recommendations

### For LinkedIn Job Scraper (Current Job Page Analysis)

**Use this approach**:
```typescript
// In content script
async function analyzeCurrentLinkedInJob() {
  // Check if on LinkedIn job page
  const isJobPage = window.location.href.includes('linkedin.com/jobs/view/');
  if (!isJobPage) {
    return { error: 'Not on a LinkedIn job page' };
  }

  // Extract job data using multiple selectors for reliability
  const jobData = {
    title: getTextFromSelectors([
      '.job-details-jobs-unified-top-card__job-title h1',
      'h1.t-24',
      'h1.job-title'
    ]),
    company: getTextFromSelectors([
      '.job-details-jobs-unified-top-card__company-name a',
      '.job-details-jobs-unified-top-card__company-name'
    ]),
    location: getTextFromSelectors([
      '.job-details-jobs-unified-top-card__primary-description-container span',
      '.job-details-jobs-unified-top-card__bullet'
    ]),
    description: getTextFromSelectors([
      '.jobs-description__content .jobs-box__html-content',
      '.jobs-description-content__text',
      '#job-details'
    ]),
    skills: extractSkillsFromJobDescription(description)
  };

  return jobData;
}

function getTextFromSelectors(selectors: string[]): string {
  for (const selector of selectors) {
    const element = document.querySelector(selector);
    if (element?.textContent?.trim()) {
      return element.textContent.trim();
    }
  }
  return '';
}
```

---

### For ATS Resume Optimization

**Recommended Hybrid Approach**:

```typescript
interface ATSAnalysis {
  score: number;
  keywordMatchScore: number;
  formattingScore: number;
  structureScore: number;
  matchedKeywords: string[];
  missingKeywords: string[];
  suggestions: string[];
}

async function analyzeResumeForATS(
  resumeText: string,
  jobDescription: string
): Promise<ATSAnalysis> {
  // Step 1: Rule-based scoring (fast, local)
  const ruleBasedScore = calculateRuleBasedATS(resumeText, jobDescription);

  // Step 2: Keyword extraction and matching
  const jobKeywords = extractKeywordsFromJob(jobDescription);
  const resumeKeywords = extractKeywordsFromResume(resumeText);
  const matchedKeywords = jobKeywords.filter(kw =>
    resumeKeywords.includes(kw.toLowerCase())
  );
  const keywordMatchScore = matchedKeywords.length / jobKeywords.length;

  // Step 3: AI-enhanced analysis (optional, for detailed feedback)
  const aiAnalysis = await getAIAnalysis(resumeText, jobDescription);

  return {
    score: Math.round((ruleBasedScore * 0.6 + keywordMatchScore * 0.4) * 100),
    keywordMatchScore: Math.round(keywordMatchScore * 100),
    formattingScore: ruleBasedScore.formatting,
    structureScore: ruleBasedScore.structure,
    matchedKeywords,
    missingKeywords: jobKeywords.filter(kw => !matchedKeywords.includes(kw)),
    suggestions: generateSuggestions(ruleBasedScore, keywordMatchScore, aiAnalysis)
  };
}
```

---

## 📋 Key Takeaways

1. **LinkedIn Selectors**: Use multiple fallback selectors as LinkedIn updates their DOM frequently
2. **ATS Scoring**: Combine rule-based (fast, free) with AI-enhanced (detailed) analysis
3. **Skills Extraction**: Maintain a comprehensive list of tech terms and use regex matching
4. **Job Matching**: Focus on keyword overlap, then enhance with semantic analysis
5. **Error Handling**: Always have fallbacks for DOM selectors and API failures

---

## 🔗 Top 5 Repositories to Study

1. **Rorogogogo/Jobjourney-extention** - Best Chrome extension architecture
2. **beastx-ro/first2apply** - Best job description parser with AI
3. **Gnaneswar22/ai-career-assistant** - Best rule-based ATS scoring
4. **xitanggg/open-resume** - Best resume parsing and skills extraction
5. **Gsync/jobsync** - Best resume-job matching algorithm

---

*Generated: 2024-11-20*
*Total Repositories Analyzed: 15+*
*Total Code Patterns Found: 40+*
