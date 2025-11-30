/**
 * AI Cover Letter Generator Tests
 * Basic tests for AI-powered cover letter generation with anti-hallucination
 */

import { describe, it, expect, vi } from 'vitest';
import { generateCoverLetter } from '../cover-letter-generator';
import type { UserProfile } from '../../types/resume-tailoring';

// Mock Anthropic SDK
vi.mock('@anthropic-ai/sdk', () => {
  return {
    default: class MockAnthropic {
      messages = {
        create: vi.fn().mockResolvedValue({
          content: [{
            type: 'text',
            text: JSON.stringify({
              opening: "Dear Hiring Manager,\n\nI am excited to apply for the Senior Software Engineer position at Google.",
              body: [
                "I have Python experience and AWS cloud platform expertise.",
                "At Tech Corp, I built scalable microservices using Python and AWS."
              ],
              closing: "Thank you for considering my application.\n\nBest regards,\nJane Doe",
              skills_demonstrated: ["Python", "AWS"],
              company_research_hooks: ["Cloud Platform team"],
              personal_connection: "building scalable systems"
            })
          }],
          model: 'claude-3-5-sonnet-20241022',
          role: 'assistant',
          stop_reason: 'end_turn',
          usage: { input_tokens: 100, output_tokens: 200 }
        })
      };
    }
  };
});

// Mock environment variable
process.env.VITE_ANTHROPIC_API_KEY = 'test-api-key';

// ============================================================================
// Mock Data - User Profiles
// ============================================================================

const createMockProfile = (overrides?: Partial<UserProfile>): UserProfile => ({
  name: 'Jane Doe',
  title: 'Senior Software Engineer',
  email: 'jane.doe@example.com',
  phone: '(555) 123-4567',
  location: 'San Francisco, CA',
  workExperience: [
    {
      id: 'exp-1',
      company: 'Tech Corp',
      title: 'Senior Software Engineer',
      location: 'San Francisco, CA',
      startDate: '2020-01',
      endDate: null,
      achievements: [
        {
          id: 'ach-1',
          bullet: 'Built scalable microservices handling 1M+ requests/day using Python and AWS',
          action: 'Built',
          object: 'microservices architecture',
          result: '1M+ requests/day',
          metrics: [{ value: 1000000, unit: 'requests', type: 'scale', context: 'requests/day' }],
          skills: ['Python', 'AWS'],
          keywords: ['Python', 'AWS', 'Microservices'],
          transferableSkills: ['System Design'],
          verified: true,
          source: 'user',
        },
      ],
      skills: ['Python', 'AWS', 'Leadership'],
      domains: ['Software Engineering', 'Cloud Computing'],
      responsibilities: ['Architecture', 'Team Leadership'],
    },
  ],
  education: [
    {
      id: 'edu-1',
      school: 'Stanford University',
      degree: 'BS Computer Science',
      field: 'Computer Science',
      startDate: '2015-09',
      endDate: '2019-06',
    },
  ],
  projects: [],
  skills: [
    { name: 'Python', level: 'expert', yearsOfExperience: 5, category: 'programming-language' },
    { name: 'AWS', level: 'advanced', yearsOfExperience: 5, category: 'cloud-platform' },
  ],
  certifications: [],
  metadata: {
    careerStage: 'professional',
    totalYearsExperience: 5,
    domains: ['Software Engineering', 'Cloud Computing'],
    seniority: 'senior',
  },
  ...overrides,
});

const SAMPLE_JOB_POSTING = `
Senior Software Engineer - Python & Cloud

Google is seeking a Senior Software Engineer to join our Cloud Platform team.

Requirements:
- 5+ years of experience with Python
- Strong experience with cloud platforms (AWS, GCP, or Azure)
- Experience building scalable distributed systems
`;

// ============================================================================
// Tests - Basic Functionality
// ============================================================================

describe('Cover Letter Generator - Basic Tests', () => {
  it('should generate a complete cover letter with all required fields', async () => {
    const profile = createMockProfile();
    const result = await generateCoverLetter(profile, SAMPLE_JOB_POSTING);

    expect(result).toBeDefined();
    expect(result.fullText).toBeDefined();
    expect(typeof result.fullText).toBe('string');
    expect(result.fullText.length).toBeGreaterThan(0);
    expect(result.htmlFormatted).toBeDefined();
    expect(result.sections).toBeDefined();
    expect(result.narrative).toBeDefined();
    expect(result.tone).toBeDefined();
    expect(result.wordCount).toBeGreaterThan(0);
    expect(result.verification).toBeDefined();
    expect(result.matchAnalysis).toBeDefined();
  });

  it('should calculate ATS score', async () => {
    const profile = createMockProfile();
    const result = await generateCoverLetter(profile, SAMPLE_JOB_POSTING);

    expect(result.matchAnalysis.atsScore).toBeGreaterThan(0);
    expect(result.matchAnalysis.atsScore).toBeLessThanOrEqual(100);
  });

  it('should include required sections', async () => {
    const profile = createMockProfile();
    const result = await generateCoverLetter(profile, SAMPLE_JOB_POSTING);

    expect(result.sections.opening).toBeDefined();
    expect(result.sections.body).toBeDefined();
    expect(result.sections.closing).toBeDefined();
  });

  it('should include narrative elements', async () => {
    const profile = createMockProfile();
    const result = await generateCoverLetter(profile, SAMPLE_JOB_POSTING);

    expect(result.narrative.hook).toBeDefined();
    expect(result.narrative.valueProposition).toBeDefined();
    expect(result.narrative.primaryStory).toBeDefined();
    expect(result.narrative.connectionToRole).toBeDefined();
    expect(result.narrative.closingTheme).toBeDefined();
  });

  it('should have valid tone profile', async () => {
    const profile = createMockProfile();
    const result = await generateCoverLetter(profile, SAMPLE_JOB_POSTING);

    expect(result.tone).toBeDefined();
    expect(result.tone.style).toBeDefined();
    expect(['professional', 'conversational', 'balanced']).toContain(result.tone.style);
  });

  it('should verify content is not hallucinated', async () => {
    const profile = createMockProfile();
    const result = await generateCoverLetter(profile, SAMPLE_JOB_POSTING);

    expect(result.verification.noHallucination).toBe(true);
    expect(result.verification.allFactsFromProfile).toBeDefined();
    expect(Array.isArray(result.verification.allFactsFromProfile)).toBe(true);
  });

  it('should generate HTML formatted version', async () => {
    const profile = createMockProfile();
    const result = await generateCoverLetter(profile, SAMPLE_JOB_POSTING);

    expect(result.htmlFormatted).toContain('<p>');
    expect(result.htmlFormatted.length).toBeGreaterThan(result.fullText.length * 0.8);
  });

  it('should track word count', async () => {
    const profile = createMockProfile();
    const result = await generateCoverLetter(profile, SAMPLE_JOB_POSTING);

    // Word count should be reasonable (100-600 words)
    expect(result.wordCount).toBeGreaterThan(100);
    expect(result.wordCount).toBeLessThan(600);
    expect(result.verification.wordCount).toBe(result.wordCount);
  });
});

// ============================================================================
// Tests - Configuration
// ============================================================================

describe('Cover Letter Generator - Configuration', () => {
  it('should respect custom target length', async () => {
    const profile = createMockProfile();
    const result = await generateCoverLetter(profile, SAMPLE_JOB_POSTING, {
      targetLength: 200,
    });

    // Should be shorter (allow some tolerance)
    expect(result.wordCount).toBeLessThan(350);
  });

  it('should allow custom tone configuration', async () => {
    const profile = createMockProfile();
    const result = await generateCoverLetter(profile, SAMPLE_JOB_POSTING, {
      tone: {
        style: 'professional',
        formality: 'formal',
      },
    });

    expect(result.tone.style).toBe('professional');
    expect(result.tone.formality).toBe('formal');
  });

  it('should allow custom temperature', async () => {
    const profile = createMockProfile();
    const result = await generateCoverLetter(profile, SAMPLE_JOB_POSTING, {
      temperature: 0.1,
    });

    expect(result).toBeDefined();
    expect(result.wordCount).toBeGreaterThan(0);
  });
});

// ============================================================================
// Tests - Match Analysis
// ============================================================================

describe('Cover Letter Generator - Match Analysis', () => {
  it('should identify addressed requirements', async () => {
    const profile = createMockProfile();
    const result = await generateCoverLetter(profile, SAMPLE_JOB_POSTING);

    expect(result.matchAnalysis.requirementsAddressed).toBeDefined();
    expect(Array.isArray(result.matchAnalysis.requirementsAddressed)).toBe(true);
  });

  it('should identify missed requirements', async () => {
    const limitedProfile = createMockProfile({
      skills: [
        { name: 'Java', level: 'expert', yearsOfExperience: 5, category: 'programming-language' },
      ],
    });

    const result = await generateCoverLetter(limitedProfile, SAMPLE_JOB_POSTING);

    expect(result.matchAnalysis.requirementsMissed).toBeDefined();
    expect(Array.isArray(result.matchAnalysis.requirementsMissed)).toBe(true);
  });
});

// ============================================================================
// Tests - Edge Cases
// ============================================================================

describe('Cover Letter Generator - Edge Cases', () => {
  it('should handle minimal profile', async () => {
    const minimalProfile = createMockProfile({
      workExperience: [
        {
          id: 'exp-1',
          company: 'Company A',
          title: 'Engineer',
          startDate: '2022-01',
          endDate: null,
          achievements: [
            {
              id: 'ach-1',
              bullet: 'Developed software',
              action: 'Developed',
              object: 'software',
              skills: ['Programming'],
              keywords: ['Software'],
              transferableSkills: [],
              metrics: [],
              verified: true,
              source: 'user',
            },
          ],
          skills: ['Programming'],
          domains: ['Software'],
          responsibilities: ['Development'],
        },
      ],
      education: [],
      skills: [],
    });

    const result = await generateCoverLetter(minimalProfile, SAMPLE_JOB_POSTING);

    expect(result).toBeDefined();
    expect(result.fullText.length).toBeGreaterThan(0);
  });

  it('should handle short job posting', async () => {
    const shortPosting = 'Looking for a Python developer.';
    const profile = createMockProfile();

    const result = await generateCoverLetter(profile, shortPosting);

    expect(result).toBeDefined();
    expect(result.fullText).toBeDefined();
    expect(result.wordCount).toBeGreaterThan(0);
  });

  it('should handle profile with multiple experiences', async () => {
    const experiences = Array.from({ length: 5 }, (_, i) => ({
      id: `exp-${i}`,
      company: `Company ${i}`,
      title: `Engineer ${i}`,
      startDate: `${2018 + i}-01`,
      endDate: `${2019 + i}-01`,
      achievements: [
        {
          id: `ach-${i}`,
          bullet: `Achievement ${i}`,
          action: 'Achieved',
          object: 'results',
          skills: ['Python'],
          keywords: ['Python'],
          transferableSkills: [],
          metrics: [],
          verified: true,
          source: 'user' as const,
        },
      ],
      skills: ['Python'],
      domains: ['Engineering'],
      responsibilities: ['Development'],
    }));

    const profile = createMockProfile({
      workExperience: experiences,
    });

    const result = await generateCoverLetter(profile, SAMPLE_JOB_POSTING);

    expect(result).toBeDefined();
    expect(result.narrative.primaryStory).toBeDefined();
  });
});

// ============================================================================
// Tests - Verification
// ============================================================================

describe('Cover Letter Generator - Verification', () => {
  it('should track keyword coverage', async () => {
    const profile = createMockProfile();
    const result = await generateCoverLetter(profile, SAMPLE_JOB_POSTING);

    expect(result.verification.keywordsUsed).toBeDefined();
    expect(Array.isArray(result.verification.keywordsUsed)).toBe(true);
    expect(result.verification.keywordCoverage).toBeGreaterThanOrEqual(0);
    expect(result.verification.keywordCoverage).toBeLessThanOrEqual(1);
  });

  it('should validate word count', async () => {
    const profile = createMockProfile();
    const result = await generateCoverLetter(profile, SAMPLE_JOB_POSTING);

    expect(result.verification.wordCountValid).toBeDefined();
    expect(typeof result.verification.wordCountValid).toBe('boolean');
  });

  it('should check for spelling errors', async () => {
    const profile = createMockProfile();
    const result = await generateCoverLetter(profile, SAMPLE_JOB_POSTING);

    expect(result.verification.spellingErrors).toBeDefined();
    expect(Array.isArray(result.verification.spellingErrors)).toBe(true);
  });

  it('should not add facts not in profile', async () => {
    const profile = createMockProfile();
    const result = await generateCoverLetter(profile, SAMPLE_JOB_POSTING);

    expect(result.verification.addedFacts).toBeDefined();
    expect(result.verification.addedFacts.length).toBe(0);
  });
});
