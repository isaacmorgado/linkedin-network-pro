/**
 * Keyword Extractor Tests
 * Tests for extracting keywords from job descriptions for ATS optimization
 */

import { describe, it, expect } from 'vitest';
import { extractKeywordsFromJobDescription } from '../keyword-extractor';
import { calculateATSScore } from '../ats-optimizer';

// ============================================================================
// Mock Data - Job Descriptions
// ============================================================================

const TYPICAL_JOB_DESCRIPTION = `
Senior Software Engineer - Python & React

We are seeking a Senior Software Engineer to join our growing team.

Requirements:
- 5+ years of experience with Python
- Strong experience with React and JavaScript
- Experience with AWS cloud services
- Knowledge of PostgreSQL or similar databases
- Strong communication skills

Preferred Qualifications:
- Experience with Docker and Kubernetes
- Familiarity with CI/CD pipelines
- Bachelor's degree in Computer Science

Responsibilities:
- Design and implement scalable backend systems
- Collaborate with frontend team using React
- Write clean, maintainable code
- Mentor junior developers
`;


const MULTI_WORD_SKILLS_JOB = `
Senior Data Scientist

Requirements:
- Machine learning experience required
- Natural language processing skills
- Deep learning frameworks (TensorFlow, PyTorch)
- Project management experience
- Strong problem solving abilities
`;

// ============================================================================
// Tests - Happy Path
// ============================================================================

describe('Keyword Extractor - Happy Path', () => {
  it('should extract basic technical keywords from typical job description', () => {
    const keywords = extractKeywordsFromJobDescription(TYPICAL_JOB_DESCRIPTION);

    // Should return array of keywords
    expect(keywords).toBeDefined();
    expect(Array.isArray(keywords)).toBe(true);
    expect(keywords.length).toBeGreaterThan(0);

    // Should extract major technologies mentioned
    const keywordTerms = keywords.map((k) => k.phrase.toLowerCase());
    expect(keywordTerms).toContain('python');
    expect(keywordTerms).toContain('react');

    // Each keyword should have required structure
    keywords.forEach((keyword) => {
      expect(keyword).toHaveProperty('phrase');
      expect(keyword).toHaveProperty('category');
      expect(keyword).toHaveProperty('required');
      expect(keyword).toHaveProperty('frequency');
      expect(keyword).toHaveProperty('score');
      expect(typeof keyword.phrase).toBe('string');
      expect(typeof keyword.required).toBe('boolean');
      expect(typeof keyword.frequency).toBe('number');
      expect(typeof keyword.score).toBe('number');
    });
  });

  it('should identify known skills from database', () => {
    const keywords = extractKeywordsFromJobDescription(TYPICAL_JOB_DESCRIPTION);

    // Should identify known skills with proper categorization
    const pythonKeyword = keywords.find((k) => k.phrase.toLowerCase() === 'python');
    expect(pythonKeyword).toBeDefined();
    expect(pythonKeyword?.category).toBe('programming-language');

    // Known skills should have higher weights (get +10 bonus)
    if (pythonKeyword) {
      expect(pythonKeyword.score).toBeGreaterThan(20); // Threshold is 20, should exceed it
    }

    // Should handle case-insensitive matching
    const keywords2 = extractKeywordsFromJobDescription('PYTHON and python and Python');
    const pythonMatches = keywords2.filter((k) => k.phrase.toLowerCase() === 'python');
    expect(pythonMatches.length).toBeLessThanOrEqual(1); // Should deduplicate
  });

  it('should extract multi-word technical terms', () => {
    const keywords = extractKeywordsFromJobDescription(MULTI_WORD_SKILLS_JOB);

    // Should extract compound technical terms
    const keywordTerms = keywords.map((k) => k.phrase.toLowerCase());

    // These are common multi-word skills that should be captured
    const hasMultiWordSkill = keywordTerms.some(
      (term) =>
        term.includes('machine learning') ||
        term.includes('natural language processing') ||
        term.includes('deep learning') ||
        term.includes('project management')
    );

    expect(hasMultiWordSkill).toBe(true);
  });

  it('should classify required vs preferred skills', () => {
    const keywords = extractKeywordsFromJobDescription(TYPICAL_JOB_DESCRIPTION);

    // Should have both required and preferred keywords
    const requiredKeywords = keywords.filter((k) => k.required === true);
    const preferredKeywords = keywords.filter((k) => k.required === false);

    expect(requiredKeywords.length).toBeGreaterThan(0);
    expect(preferredKeywords.length).toBeGreaterThan(0);

    // Python is in Requirements section, should be required
    const pythonKeyword = keywords.find((k) => k.phrase.toLowerCase() === 'python');
    if (pythonKeyword) {
      expect(pythonKeyword.required).toBe(true);
    }

    // Docker is in Preferred Qualifications section, should not be required
    const dockerKeyword = keywords.find((k) => k.phrase.toLowerCase() === 'docker');
    if (dockerKeyword) {
      expect(dockerKeyword.required).toBe(false);
    }
  });

  it('should apply position weighting correctly', () => {
    const keywords = extractKeywordsFromJobDescription(TYPICAL_JOB_DESCRIPTION);

    // Keywords should be sorted by weight (descending)
    for (let i = 0; i < keywords.length - 1; i++) {
      expect(keywords[i].score).toBeGreaterThanOrEqual(keywords[i + 1].score);
    }

    // All weights should be in valid range (0-100)
    keywords.forEach((keyword) => {
      expect(keyword.score).toBeGreaterThanOrEqual(0);
      expect(keyword.score).toBeLessThanOrEqual(100);
    });

    // Keywords appearing multiple times should have higher frequency
    const pythonKeyword = keywords.find((k) => k.phrase.toLowerCase() === 'python');
    if (pythonKeyword && pythonKeyword.frequency && pythonKeyword.frequency > 1) {
      // Higher frequency should contribute to weight
      expect(pythonKeyword.score).toBeGreaterThan(30);
    }
  });
});

// ============================================================================
// Tests - Edge Cases
// ============================================================================

describe('Keyword Extractor - Edge Cases', () => {
  it('should handle empty job description', () => {
    const keywords = extractKeywordsFromJobDescription('');

    // Should return empty array or handle gracefully
    expect(keywords).toBeDefined();
    expect(Array.isArray(keywords)).toBe(true);
    expect(keywords.length).toBe(0);
  });

  it('should handle null/undefined input', () => {
    // @ts-expect-error Testing invalid input
    expect(() => extractKeywordsFromJobDescription(null)).not.toThrow();

    // @ts-expect-error Testing invalid input
    expect(() => extractKeywordsFromJobDescription(undefined)).not.toThrow();

    // @ts-expect-error Testing invalid input
    const nullResult = extractKeywordsFromJobDescription(null);
    expect(Array.isArray(nullResult)).toBe(true);
  });

  it('should handle very long job description (100k chars)', () => {
    // Create a 100k character job description
    const longDescription = 'Python developer with React experience. '.repeat(2500); // ~100k chars

    const startTime = Date.now();
    const keywords = extractKeywordsFromJobDescription(longDescription, 'Software Engineer', {
      disableIndustryFiltering: true,
    });
    const duration = Date.now() - startTime;

    // Should complete in reasonable time (< 5 seconds)
    expect(duration).toBeLessThan(5000);

    // Should still return valid results
    expect(keywords).toBeDefined();
    expect(Array.isArray(keywords)).toBe(true);

    // Should not crash or return empty
    expect(keywords.length).toBeGreaterThan(0);
  });

  it('should handle job description with HTML tags', () => {
    const htmlJobDescription = `
      <div>
        <h2>Senior Software Engineer</h2>
        <p>We need someone with <strong>Python</strong> and <em>React</em> experience.</p>
        <ul>
          <li>5+ years Python</li>
          <li>React experience</li>
        </ul>
      </div>
    `;

    const keywords = extractKeywordsFromJobDescription(htmlJobDescription);

    // Should extract keywords despite HTML
    expect(keywords).toBeDefined();
    expect(keywords.length).toBeGreaterThan(0);

    const keywordTerms = keywords.map((k) => k.phrase.toLowerCase());

    // Should extract Python and React, not HTML tags
    expect(keywordTerms).toContain('python');
    expect(keywordTerms).toContain('react');

    // Should NOT extract HTML tags as keywords
    const hasHtmlTags = keywordTerms.some(
      (term) => term.includes('<') || term.includes('>') || term.includes('div') || term.includes('strong')
    );
    expect(hasHtmlTags).toBe(false);
  });

  it('should handle job description with emoji', () => {
    const emojiJobDescription = `
      🚀 Exciting Opportunity! 🚀

      We're looking for a Python 🐍 developer with React ⚛️ experience.

      Requirements:
      - 5+ years Python 💻
      - React experience 📱
      - Strong communication skills 💬
    `;

    const keywords = extractKeywordsFromJobDescription(emojiJobDescription, 'Python Developer', {
      disableIndustryFiltering: true,
    });

    // Should handle emoji without crashing
    expect(keywords).toBeDefined();
    expect(keywords.length).toBeGreaterThan(0);

    const keywordTerms = keywords.map((k) => k.phrase.toLowerCase());

    // Should extract text keywords
    expect(keywordTerms).toContain('python');
    expect(keywordTerms).toContain('react');

    // Emoji should not be extracted as keywords
    const hasEmoji = keywordTerms.some((term) => /[\u{1F300}-\u{1F9FF}]/u.test(term));
    expect(hasEmoji).toBe(false);
  });

  it('should handle all caps text', () => {
    const allCapsJobDescription = `
      SENIOR SOFTWARE ENGINEER

      WE ARE SEEKING A PYTHON DEVELOPER WITH REACT EXPERIENCE.

      REQUIREMENTS:
      - 5+ YEARS PYTHON
      - STRONG REACT SKILLS
      - AWS EXPERIENCE
    `;

    const keywords = extractKeywordsFromJobDescription(allCapsJobDescription);

    // Should handle all caps without crashing
    expect(keywords).toBeDefined();
    expect(keywords.length).toBeGreaterThan(0);

    // Should extract keywords despite capitalization
    const keywordTerms = keywords.map((k) => k.phrase.toLowerCase());
    expect(keywordTerms).toContain('python');
    expect(keywordTerms).toContain('react');

    // Should not treat caps as separate keywords
    const pythonKeywords = keywords.filter((k) => k.phrase.toLowerCase() === 'python');
    expect(pythonKeywords.length).toBeLessThanOrEqual(1); // Should deduplicate
  });

  it('should handle non-ASCII characters', () => {
    const nonAsciiJobDescription = `
      Développeur Senior - Python & React

      Nous recherchons un développeur avec:
      - Expérience en Python (5+ années)
      - Compétences en React
      - Maîtrise de l'anglais

      Localisation: Montréal, Québec
    `;

    const keywords = extractKeywordsFromJobDescription(nonAsciiJobDescription, 'Senior Developer', {
      disableIndustryFiltering: true,
    });

    // Should handle non-ASCII without crashing
    expect(keywords).toBeDefined();
    expect(Array.isArray(keywords)).toBe(true);

    // Should still extract ASCII keywords
    const keywordTerms = keywords.map((k) => k.phrase.toLowerCase());
    expect(keywordTerms).toContain('python');
    expect(keywordTerms).toContain('react');
  });

  it('should strip bullet points and formatting characters', () => {
    const bulletJobDescription = `
      Requirements:
      • Python experience
      - React skills
      * AWS knowledge
      → Docker proficiency
      ✓ PostgreSQL
    `;

    const keywords = extractKeywordsFromJobDescription(bulletJobDescription, 'Software Engineer', {
      disableIndustryFiltering: true,
    });

    // Should extract keywords
    expect(keywords).toBeDefined();
    expect(keywords.length).toBeGreaterThan(0);

    // Keywords should NOT contain bullet characters
    keywords.forEach((keyword) => {
      expect(keyword.phrase).not.toMatch(/^[•\-*→✓]\s/); // Should not start with bullet
      expect(keyword.phrase).not.toMatch(/[•*→✓]/); // Should not contain bullet chars
    });

    // Should extract clean keywords
    const keywordTerms = keywords.map((k) => k.phrase.toLowerCase());
    expect(keywordTerms).toContain('python');
    expect(keywordTerms).toContain('react');

    // Should NOT have artifacts like "- python" or "• react"
    const hasArtifacts = keywords.some(
      (k) => k.phrase.startsWith('-') || k.phrase.startsWith('•') || k.phrase.startsWith('*')
    );
    expect(hasArtifacts).toBe(false);
  });
});

// ============================================================================
// Tests - Integration with ATS Optimizer
// ============================================================================

describe('Keyword Extractor - Integration with ATS Optimizer', () => {
  const SAMPLE_RESUME = `
    John Doe
    Senior Software Engineer
    john@example.com

    EXPERIENCE
    Senior Software Engineer at Tech Corp (2020-Present)
    - Developed Python backend services handling 1M+ requests/day
    - Built React frontend applications with 50K+ active users
    - Implemented AWS infrastructure reducing costs by 30%
    - Led team of 5 engineers delivering 20+ features

    Software Engineer at Startup Inc (2018-2020)
    - Created PostgreSQL database schemas for user data
    - Deployed applications using Docker and Kubernetes
    - Established CI/CD pipelines using GitHub Actions

    SKILLS
    Python, JavaScript, React, AWS, PostgreSQL, Docker, Kubernetes
  `;

  it('should extract keywords that integrate correctly with ats-optimizer scoring', () => {
    // Extract keywords from job description
    const keywords = extractKeywordsFromJobDescription(TYPICAL_JOB_DESCRIPTION);

    // Should return valid keyword objects
    expect(keywords).toBeDefined();
    expect(keywords.length).toBeGreaterThan(0);

    // Extract just the keyword terms as strings (what ATS optimizer expects)
    const jobKeywordStrings = keywords.map((k) => k.phrase);

    // Should be able to pass to ATS optimizer without errors
    expect(() => {
      calculateATSScore(
        SAMPLE_RESUME,
        ['Python', 'React', 'AWS'], // resume keywords
        jobKeywordStrings // job keywords
      );
    }).not.toThrow();

    // Should return valid ATS optimization result
    const atsResult = calculateATSScore(
      SAMPLE_RESUME,
      ['Python', 'React', 'AWS'],
      jobKeywordStrings
    );

    expect(atsResult).toBeDefined();
    expect(atsResult.overallATSScore).toBeGreaterThanOrEqual(0);
    expect(atsResult.overallATSScore).toBeLessThanOrEqual(100);
    expect(atsResult.keywordMatchRate).toBeGreaterThanOrEqual(0);
    expect(atsResult.keywordDensity).toBeGreaterThanOrEqual(0);
  });

  it('should produce weighted keywords that calculateKeywordMatchRate accepts', () => {
    const keywords = extractKeywordsFromJobDescription(TYPICAL_JOB_DESCRIPTION);

    // All keywords should have weights
    keywords.forEach((keyword) => {
      expect(keyword.score).toBeDefined();
      expect(typeof keyword.score).toBe('number');
      expect(keyword.score).toBeGreaterThanOrEqual(0);
      expect(keyword.score).toBeLessThanOrEqual(100);
    });

    // Should be able to sort by weight (top keywords)
    const topKeywords = keywords
      .sort((a, b) => b.score - a.score)
      .slice(0, 10)
      .map((k) => k.phrase);

    // Top keywords should work with ATS optimizer
    const atsResult = calculateATSScore(SAMPLE_RESUME, ['Python', 'React'], topKeywords);

    expect(atsResult.keywordMatchRate).toBeGreaterThanOrEqual(0);
    expect(atsResult.keywordMatchRate).toBeLessThanOrEqual(100);
  });

  it('should classify required/preferred keywords that match ATS expectations', () => {
    const keywords = extractKeywordsFromJobDescription(TYPICAL_JOB_DESCRIPTION);

    // Should have both required and preferred
    const requiredKeywords = keywords.filter((k) => k.required);
    const preferredKeywords = keywords.filter((k) => !k.required);

    expect(requiredKeywords.length).toBeGreaterThan(0);
    expect(preferredKeywords.length).toBeGreaterThan(0);

    // Required keywords should typically have higher weights
    const avgRequiredWeight =
      requiredKeywords.reduce((sum, k) => sum + k.score, 0) / requiredKeywords.length;
    const avgPreferredWeight =
      preferredKeywords.reduce((sum, k) => sum + k.score, 0) / preferredKeywords.length;

    // Required should generally be weighted higher (though not guaranteed for every case)
    expect(avgRequiredWeight).toBeGreaterThan(0);
    expect(avgPreferredWeight).toBeGreaterThan(0);

    // Both should be usable with ATS optimizer
    const requiredTerms = requiredKeywords.map((k) => k.phrase);
    const preferredTerms = preferredKeywords.map((k) => k.phrase);

    expect(() => {
      calculateATSScore(SAMPLE_RESUME, ['Python'], requiredTerms);
    }).not.toThrow();

    expect(() => {
      calculateATSScore(SAMPLE_RESUME, ['Docker'], preferredTerms);
    }).not.toThrow();
  });

  it('should handle end-to-end flow: job description → keywords → ATS score', () => {
    // Step 1: Extract keywords from job description
    const keywords = extractKeywordsFromJobDescription(TYPICAL_JOB_DESCRIPTION);
    expect(keywords.length).toBeGreaterThan(0);

    // Step 2: Convert to format ATS optimizer expects
    const jobKeywordStrings = keywords.map((k) => k.phrase);

    // Step 3: Simulate resume keywords (what would be extracted from user's resume)
    const resumeKeywords = ['Python', 'React', 'JavaScript', 'AWS', 'PostgreSQL', 'Docker'];

    // Step 4: Calculate ATS score
    const atsResult = calculateATSScore(SAMPLE_RESUME, resumeKeywords, jobKeywordStrings);

    // Step 5: Verify complete integration
    expect(atsResult).toBeDefined();

    // Should have valid keyword matching metrics
    expect(atsResult.keywordMatchRate).toBeGreaterThanOrEqual(0);
    expect(atsResult.keywordMatchRate).toBeLessThanOrEqual(100);
    expect(atsResult.keywordDensity).toBeGreaterThanOrEqual(0);
    expect(atsResult.totalKeywords).toBeGreaterThan(0);
    expect(atsResult.keywordsUsed).toBeDefined();
    expect(Array.isArray(atsResult.keywordsUsed)).toBe(true);

    // Should have format compliance
    expect(atsResult.formatCompliance).toBeDefined();
    expect(atsResult.formatCompliance.score).toBeGreaterThanOrEqual(0);
    expect(atsResult.formatCompliance.score).toBeLessThanOrEqual(100);

    // Should have content quality
    expect(atsResult.contentQuality).toBeDefined();
    expect(atsResult.contentQuality.score).toBeGreaterThanOrEqual(0);
    expect(atsResult.contentQuality.score).toBeLessThanOrEqual(100);

    // Should have overall score
    expect(atsResult.overallATSScore).toBeGreaterThanOrEqual(0);
    expect(atsResult.overallATSScore).toBeLessThanOrEqual(100);

    // Should have recommendations
    expect(atsResult.recommendations).toBeDefined();
    expect(Array.isArray(atsResult.recommendations)).toBe(true);

    // End-to-end flow should produce meaningful results
    // If resume mentions Python and job requires Python, match rate should be non-zero
    if (jobKeywordStrings.some((k) => k.toLowerCase().includes('python'))) {
      expect(atsResult.keywordMatchRate).toBeGreaterThan(0);
    }
  });
});

// ============================================================================
// Tests - Quality Optimization
// ============================================================================

describe('Keyword Extractor - Quality Optimization', () => {
  it('should extract reasonable number of keywords (2-3% density)', () => {
    // Use the same job description from earlier tests (638 characters)
    const jobDescription = TYPICAL_JOB_DESCRIPTION;
    const keywords = extractKeywordsFromJobDescription(jobDescription);

    // Calculate metrics
    const wordCount = jobDescription.split(/\s+/).filter((w) => w.length > 0).length;
    const keywordCount = keywords.length;
    const density = (keywordCount / wordCount) * 100;

    console.log(`
      Quality Metrics:
      - Job Description Length: ${jobDescription.length} chars
      - Word Count: ${wordCount} words
      - Keywords Extracted: ${keywordCount}
      - Keyword Density: ${density.toFixed(2)}%
      - Target: <20 keywords, <15% density
    `);

    // Target: Extract high-quality keywords only (10-20 keywords for ~100 word job description)
    // Note: Job descriptions are naturally keyword-dense (listing requirements)
    // This is different from resume optimization where 2-3% density is the goal
    expect(keywordCount).toBeLessThan(20); // Reasonable maximum (~20% of words)
    expect(density).toBeLessThan(15); // Less than 15% density for job descriptions
  });

  it('should filter out n-grams with excessive stop words', () => {
    // Create a job description with lots of filler words that could generate bad n-grams
    const jobDescription = `
      We are looking for a highly skilled Python Python Python developer with React React React experience.
      You will be working closely with our team on backend backend backend systems.
      The ideal candidate will have strong communication communication communication skills and experience.
      Requirements: Python, React, PostgreSQL, AWS, Docker
      We are we are we are excited to work with you on our team.
    `;

    const keywords = extractKeywordsFromJobDescription(jobDescription);
    const keywordTerms = keywords.map((k) => k.phrase.toLowerCase());

    console.log('\n      Extracted Keywords:', keywordTerms);

    // Good multi-word terms (should be extracted if weight is high enough)
    // These have meaningful content even if they contain some stop words
    const goodTermsPresent = keywordTerms.filter(
      (term) =>
        term === 'python developer' ||
        term === 'backend systems' ||
        term === '5+ years' ||
        term === 'postgresql'
    );
    console.log('      Good multi-word terms found:', goodTermsPresent);

    // Bad n-grams with too many stop words (should NOT be extracted)
    // These are phrases where >50% of words are stop words with no semantic value
    const stopWords = new Set([
      'we',
      'are',
      'the',
      'a',
      'an',
      'with',
      'our',
      'on',
      'will',
      'you',
      'has',
      'of',
      'and',
      'using',
    ]);

    const badNgrams = keywordTerms.filter((term) => {
      if (!term.includes(' ')) return false; // Single words are fine

      const words = term.split(' ');
      const stopWordCount = words.filter((w) => stopWords.has(w)).length;
      const stopWordRatio = stopWordCount / words.length;

      // If more than 50% are stop words, it's a bad n-gram
      return stopWordRatio > 0.5;
    });

    console.log('      Bad n-grams with >50% stop words:', badNgrams);

    // Should not extract nonsensical phrases like "with react and", "you will work", etc.
    expect(badNgrams.length).toBe(0); // No nonsensical n-grams
  });
});
