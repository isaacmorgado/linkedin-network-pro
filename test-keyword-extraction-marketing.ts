/**
 * Test Script: Marketing Industry Keyword Extraction
 * Tests ATS keyword extraction for a Digital Marketing Manager position
 */

import { extractKeywordsFromJobDescription } from './src/services/keyword-extractor';

const MARKETING_JOB_DESCRIPTION = `
Digital Marketing Manager

Fast-growing SaaS company seeks a data-driven Digital Marketing Manager to lead our growth marketing initiatives.

REQUIREMENTS:
- Bachelor's degree in Marketing, Business, or related field
- 5+ years of digital marketing experience
- Google Ads Certification required
- Google Analytics Certification required
- HubSpot Certification preferred
- Proven track record of managing $100K+ monthly ad budgets

CORE RESPONSIBILITIES:
SEO & SEM:
- Develop and execute comprehensive SEO strategies
- Manage Google Ads campaigns (Search, Display, YouTube)
- Optimize PPC campaigns for maximum ROI
- Conduct keyword research and competitive analysis
- Monitor and improve organic search rankings

Marketing Automation & Email:
- Build automated email campaigns in HubSpot
- Create drip campaigns and nurture sequences
- Implement marketing automation workflows
- A/B test email subject lines and content
- Segment audiences for personalized messaging

Social Media Marketing:
- Develop social media strategy across LinkedIn, Facebook, Instagram, Twitter
- Create and schedule content using Hootsuite or Buffer
- Manage social media advertising campaigns
- Monitor social media engagement and metrics
- Collaborate with content team on social-first content

Analytics & Reporting:
- Track and analyze campaign performance using Google Analytics (GA4)
- Build dashboards in Tableau or Looker
- Monitor KPIs: CAC, LTV, conversion rates, ROI
- Perform attribution analysis across channels
- Present monthly performance reports to leadership

Content Marketing:
- Oversee blog content strategy
- Collaborate with content writers on SEO optimization
- Create compelling ad copy and landing pages
- Develop content calendar
- Optimize conversion funnels

REQUIRED SKILLS:
Technical Skills:
- Google Ads (Search, Display, Shopping, YouTube)
- Google Analytics (GA4)
- SEO tools (SEMrush, Ahrefs, Moz)
- Marketing automation (HubSpot, Marketo, Pardot)
- Email marketing platforms (Mailchimp, SendGrid)
- Social media management (Hootsuite, Buffer, Sprout Social)
- CRM (Salesforce, HubSpot CRM)
- Data visualization (Tableau, Looker, Google Data Studio)
- Tag management (Google Tag Manager)

Marketing Skills:
- SEO and SEM expertise
- PPC campaign management
- Conversion rate optimization (CRO)
- A/B testing and experimentation
- Marketing funnel optimization
- Lead generation
- Performance marketing
- Growth marketing
- Content strategy
- Social media marketing
- Email marketing

Soft Skills:
- Data-driven decision making
- Strong analytical skills
- Excellent communication
- Project management
- Cross-functional collaboration
- Creative problem-solving
- Attention to detail

CERTIFICATIONS REQUIRED:
- Google Ads Certification
- Google Analytics Individual Qualification (GAIQ) or GA4 Certification

CERTIFICATIONS PREFERRED:
- HubSpot Inbound Marketing Certification
- HubSpot Content Marketing Certification
- Facebook Blueprint Certification
- SEMrush Certification

TOOLS WE USE:
- Google Marketing Platform (Ads, Analytics, Tag Manager)
- HubSpot (Marketing Hub, CRM)
- Salesforce
- SEMrush
- Ahrefs
- Mailchimp
- Hootsuite
- Tableau
- Slack
- Asana
`;

console.log('='.repeat(80));
console.log('MARKETING INDUSTRY TEST: Digital Marketing Manager');
console.log('='.repeat(80));
console.log();

console.log('Job Description Preview:');
console.log(MARKETING_JOB_DESCRIPTION.substring(0, 300) + '...');
console.log();

console.log('Extracting keywords...');
console.log();

const keywords = extractKeywordsFromJobDescription(MARKETING_JOB_DESCRIPTION);

console.log(`Total keywords extracted: ${keywords.length}`);
console.log();

// Group keywords by category
const keywordsByCategory: Record<string, typeof keywords> = {};
keywords.forEach(kw => {
  if (!keywordsByCategory[kw.category]) {
    keywordsByCategory[kw.category] = [];
  }
  keywordsByCategory[kw.category].push(kw);
});

console.log('RESULTS BY CATEGORY:');
console.log('='.repeat(80));

Object.entries(keywordsByCategory).forEach(([category, kws]) => {
  console.log();
  console.log(`${category.toUpperCase()} (${kws.length} keywords):`);
  console.log('-'.repeat(40));
  kws.slice(0, 10).forEach(kw => {
    console.log(`  ✓ ${kw.phrase} (score: ${kw.score}, occurrences: ${kw.occurrences})${kw.required ? ' [REQUIRED]' : ''}`);
  });
  if (kws.length > 10) {
    console.log(`  ... and ${kws.length - 10} more`);
  }
});

console.log();
console.log('='.repeat(80));
console.log('TOP 20 MOST IMPORTANT KEYWORDS:');
console.log('='.repeat(80));

keywords.slice(0, 20).forEach((kw, index) => {
  console.log(`${index + 1}. ${kw.phrase}`);
  console.log(`   Category: ${kw.category}`);
  console.log(`   Score: ${kw.score} | Occurrences: ${kw.occurrences}${kw.required ? ' | REQUIRED' : ''}`);
  if (kw.synonyms && kw.synonyms.length > 0) {
    console.log(`   Synonyms: ${kw.synonyms.slice(0, 3).join(', ')}${kw.synonyms.length > 3 ? '...' : ''}`);
  }
  console.log();
});

// Validate critical marketing keywords were found
console.log('='.repeat(80));
console.log('VALIDATION: Critical Marketing Keywords');
console.log('='.repeat(80));

const criticalKeywords = [
  'SEO',
  'Google Ads',
  'Google Analytics',
  'PPC',
  'HubSpot',
  'Marketing Automation',
  'Email Marketing',
  'Social Media Marketing',
  'SEMrush',
  'Conversion Rate Optimization'
];

criticalKeywords.forEach(term => {
  const found = keywords.find(kw =>
    kw.phrase.toLowerCase() === term.toLowerCase() ||
    (kw.synonyms && kw.synonyms.some(s => s.toLowerCase() === term.toLowerCase()))
  );
  console.log(`${found ? '✓' : '✗'} ${term}${found ? ` (score: ${found.score})` : ' [NOT FOUND]'}`);
});

console.log();
console.log('='.repeat(80));
console.log('TEST COMPLETE');
console.log('='.repeat(80));
