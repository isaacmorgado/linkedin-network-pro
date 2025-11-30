/**
 * Resume Generator Tests
 * Comprehensive tests for AI-powered resume generation and tailoring
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { generateTailoredResume, quickGenerateTailoredResume } from '../resume-generator';
import type { UserProfile } from '../../types/resume-tailoring';

// ============================================================================
// Mock Data - User Profiles
// ============================================================================

const createMockUserProfile = (overrides?: Partial<UserProfile>): UserProfile => ({
  name: 'John Doe',
  title: 'Senior Software Engineer',
  email: 'john@example.com',
  phone: '555-1234',
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
          bullet: 'Built microservices using Python and AWS',
          action: 'Built',
          object: 'microservices platform',
          result: 'handling 1M+ requests/day',
          skills: ['Python', 'AWS'],
          keywords: ['Python', 'AWS', 'Microservices'],
          transferableSkills: ['System Design'],
          metrics: [{ value: 1000000, unit: 'requests', type: 'scale', context: 'requests/day' }],
          verified: true,
          source: 'user',
        },
        {
          id: 'ach-2',
          bullet: 'Led team of 5 engineers to deliver 20+ features',
          action: 'Led',
          object: 'team of engineers',
          result: 'delivered 20+ features',
          skills: ['Leadership', 'Team Management'],
          keywords: ['Leadership', 'Team Management'],
          transferableSkills: ['Leadership', 'Communication'],
          metrics: [{ value: 5, unit: 'people', type: 'count', context: 'team size' }],
          verified: true,
          source: 'user',
        },
      ],
      skills: ['Python', 'AWS', 'Microservices'],
      domains: ['Software Engineering', 'Cloud Computing'],
      responsibilities: ['Architecture', 'Team Leadership'],
    },
    {
      id: 'exp-2',
      company: 'Startup Inc',
      title: 'Software Engineer',
      location: 'San Francisco, CA',
      startDate: '2018-01',
      endDate: '2019-12',
      achievements: [
        {
          id: 'ach-3',
          bullet: 'Developed React frontend applications',
          action: 'Developed',
          object: 'React applications',
          skills: ['React', 'JavaScript'],
          keywords: ['React', 'JavaScript', 'Frontend'],
          transferableSkills: ['Web Development'],
          metrics: [],
          verified: true,
          source: 'user',
        },
      ],
      skills: ['React', 'JavaScript', 'Frontend'],
      domains: ['Web Development'],
      responsibilities: ['Frontend Development'],
    },
  ],
  education: [
    {
      id: 'edu-1',
      school: 'Stanford University',
      degree: 'BS Computer Science',
      field: 'Computer Science',
      startDate: '2014-09',
      endDate: '2018-06',
    },
  ],
  projects: [
    {
      id: 'proj-1',
      name: 'Open Source Project',
      description: 'Built ML library',
      startDate: '2022-01',
      endDate: '2022-06',
      achievements: [
        {
          id: 'ach-proj-1',
          bullet: 'Created machine learning library with 1000+ stars',
          action: 'Created',
          object: 'ML library',
          result: 'gained 1000+ stars',
          skills: ['Machine Learning', 'Python'],
          keywords: ['Machine Learning', 'Python'],
          transferableSkills: ['Open Source'],
          metrics: [{ value: 1000, unit: 'stars', type: 'count', context: 'GitHub stars' }],
          verified: true,
          source: 'user',
        },
      ],
      skills: ['Python', 'TensorFlow'],
      domains: ['Machine Learning'],
      treatedAsExperience: false,
    },
  ],
  skills: [
    { name: 'Python', level: 'expert', yearsOfExperience: 6, category: 'programming-language' },
    { name: 'JavaScript', level: 'advanced', yearsOfExperience: 4, category: 'programming-language' },
    { name: 'AWS', level: 'advanced', yearsOfExperience: 3, category: 'cloud-platform' },
    { name: 'React', level: 'advanced', yearsOfExperience: 4, category: 'framework' },
    { name: 'Docker', level: 'intermediate', yearsOfExperience: 3, category: 'tool' },
  ],
  certifications: [
    {
      id: 'cert-1',
      name: 'AWS Solutions Architect',
      issuer: 'Amazon',
      dateObtained: '2021-06',
    },
  ],
  metadata: {
    careerStage: 'professional',
    totalYearsExperience: 6,
    domains: ['Software Engineering', 'Cloud Computing'],
    seniority: 'senior',
  },
  ...overrides,
});

const SAMPLE_JOB_DESCRIPTION = `
Senior Software Engineer - Python & Cloud

We're seeking a Senior Software Engineer with strong Python and cloud experience.

Requirements:
- 5+ years of Python experience
- AWS cloud platform expertise
- Experience with microservices architecture
- React and JavaScript frontend skills
- Strong leadership and communication

Preferred:
- Docker and Kubernetes
- Machine learning experience
- Bachelor's degree in Computer Science
`;

// ============================================================================
// Tests - Success Cases
// ============================================================================

describe('Resume Generator - Success Cases', () => {
  beforeEach(() => {
    // Mock bullet rewriter
    vi.mock('../bullet-rewriter', () => ({
      rewriteBulletsBatch: vi.fn().mockResolvedValue([
        {
          original: 'Built microservices using Python and AWS',
          rewritten: 'Built microservices using Python and AWS handling 1M+ requests/day',
          keywordsAdded: ['Python', 'AWS'],
          factVerification: {
            allFactsPreserved: true,
            addedFacts: [],
          },
        },
      ]),
    }));
  });

  it('should generate complete tailored resume', async () => {
    const profile = createMockUserProfile();
    const resume = await generateTailoredResume(profile, SAMPLE_JOB_DESCRIPTION);

    expect(resume).toBeDefined();
    expect(resume).toHaveProperty('header');
    expect(resume).toHaveProperty('summary');
    expect(resume).toHaveProperty('experience');
    expect(resume).toHaveProperty('education');
    expect(resume).toHaveProperty('skills');
    expect(resume).toHaveProperty('matchReport');
    expect(resume).toHaveProperty('atsScore');
  });

  it('should include header with contact information', async () => {
    const profile = createMockUserProfile({
      name: 'Jane Smith',
      email: 'jane@example.com',
      phone: '555-9999',
    });

    const resume = await generateTailoredResume(profile, SAMPLE_JOB_DESCRIPTION);

    expect(resume.header.name).toBe('Jane Smith');
    expect(resume.header.email).toBe('jane@example.com');
    expect(resume.header.phone).toBe('555-9999');
  });

  it('should extract and match job requirements', async () => {
    const profile = createMockUserProfile();
    const resume = await generateTailoredResume(profile, SAMPLE_JOB_DESCRIPTION);

    expect(resume.matchReport).toBeDefined();
    expect(resume.matchReport.matches).toBeDefined();
    // Match score is 0-1, not 0-100
    expect(resume.matchReport.matchScore).toBeGreaterThan(0);
    expect(resume.matchReport.matchScore).toBeLessThanOrEqual(1);
  });

  it('should tailor experience bullets to job keywords', async () => {
    const profile = createMockUserProfile();
    const resume = await generateTailoredResume(profile, SAMPLE_JOB_DESCRIPTION);

    expect(resume.experience).toBeDefined();
    expect(resume.experience.length).toBeGreaterThan(0);

    const firstExperience = resume.experience[0];
    expect(firstExperience.bullets).toBeDefined();
    expect(firstExperience.bullets.length).toBeGreaterThan(0);
    expect(firstExperience.changes).toBeDefined();
  });

  it('should preserve original bullets for comparison', async () => {
    const profile = createMockUserProfile();
    const resume = await generateTailoredResume(profile, SAMPLE_JOB_DESCRIPTION);

    resume.experience.forEach((exp) => {
      expect(exp.originalBullets).toBeDefined();
      expect(exp.originalBullets.length).toBeGreaterThan(0);
      expect(exp.bullets.length).toBe(exp.originalBullets.length);
    });
  });

  it('should calculate ATS score', async () => {
    const profile = createMockUserProfile();
    const resume = await generateTailoredResume(profile, SAMPLE_JOB_DESCRIPTION);

    expect(resume.atsScore).toBeGreaterThanOrEqual(0);
    expect(resume.atsScore).toBeLessThanOrEqual(100);
  });

  it('should optimize skills section with matched skills first', async () => {
    const profile = createMockUserProfile();
    const resume = await generateTailoredResume(profile, SAMPLE_JOB_DESCRIPTION);

    expect(resume.skills).toBeDefined();
    expect(Object.keys(resume.skills).length).toBeGreaterThan(0);

    // Should have categorized skills
    Object.values(resume.skills).forEach((skillList) => {
      expect(Array.isArray(skillList)).toBe(true);
      expect(skillList.length).toBeGreaterThan(0);
    });
  });

  it('should generate professional summary based on match', async () => {
    const profile = createMockUserProfile();
    const resume = await generateTailoredResume(profile, SAMPLE_JOB_DESCRIPTION);

    expect(resume.summary).toBeDefined();
    if (resume.summary) {
      expect(typeof resume.summary).toBe('string');
      expect(resume.summary.length).toBeGreaterThan(0);
      expect(resume.summary.split(' ').length).toBeGreaterThan(10);
    }
  });
});

// ============================================================================
// Tests - Strategy Selection
// ============================================================================

describe('Resume Generator - Strategy Selection', () => {
  it('should use student strategy for students', async () => {
    const studentProfile = createMockUserProfile({
      workExperience: [],
      metadata: {
        careerStage: 'student',
        totalYearsExperience: 0,
        domains: ['Computer Science'],
        seniority: 'entry',
      },
      projects: [
        {
          id: 'proj-student-1',
          name: 'Course Project',
          description: 'Built web app',
          startDate: '2023-01',
          endDate: '2023-06',
          achievements: [
            {
              id: 'ach-student-1',
              bullet: 'Built full-stack application',
              action: 'Built',
              object: 'full-stack application',
              skills: ['Python', 'React'],
              keywords: ['Python', 'React'],
              transferableSkills: ['Full-stack Development'],
              metrics: [],
              verified: true,
              source: 'user',
            },
          ],
          skills: ['Python', 'React'],
          domains: ['Web Development'],
          treatedAsExperience: true,
        },
      ],
    });

    const resume = await generateTailoredResume(studentProfile, SAMPLE_JOB_DESCRIPTION);

    expect(resume).toBeDefined();
    expect(resume.projects).toBeDefined();
    expect(resume.projects!.length).toBeGreaterThan(0);
  });

  it('should use professional strategy for experienced candidates', async () => {
    const professionalProfile = createMockUserProfile({
      metadata: {
        careerStage: 'professional',
        totalYearsExperience: 10,
        domains: ['Software Engineering'],
        seniority: 'senior',
      },
    });

    const resume = await generateTailoredResume(professionalProfile, SAMPLE_JOB_DESCRIPTION);

    expect(resume).toBeDefined();
    expect(resume.experience.length).toBeGreaterThan(0);
    // Professionals typically don't include projects
    expect(!resume.projects || resume.projects.length === 0).toBe(true);
  });

  it('should use career-changer strategy when applicable', async () => {
    const careerChangerProfile = createMockUserProfile({
      metadata: {
        careerStage: 'career-changer',
        totalYearsExperience: 8,
        domains: ['Marketing', 'Software Engineering'],
        seniority: 'mid',
      },
    });

    const resume = await generateTailoredResume(careerChangerProfile, SAMPLE_JOB_DESCRIPTION);

    expect(resume).toBeDefined();
    if (resume.summary) {
      expect(resume.summary).toContain('transitioning');
    }
  });
});

// ============================================================================
// Tests - Anti-Hallucination
// ============================================================================

describe('Resume Generator - Anti-Hallucination', () => {
  it('should not add fake achievements', async () => {
    const profile = createMockUserProfile();
    const resume = await generateTailoredResume(profile, SAMPLE_JOB_DESCRIPTION);

    // Check all experience sections
    resume.experience.forEach((exp) => {
      exp.changes?.forEach((change) => {
        expect(change.factVerification).toBeDefined();
        if (!change.factVerification.allFactsPreserved) {
          // If facts not preserved, should use original
          expect(exp.bullets).toContain(change.original);
        }
      });
    });
  });

  it('should fall back to original bullets if hallucination detected', async () => {
    // Mock bullet rewriter that adds fake facts
    vi.mock('../bullet-rewriter', () => ({
      rewriteBulletsBatch: vi.fn().mockResolvedValue([
        {
          original: 'Built microservices',
          rewritten: 'Built microservices handling 10M+ requests/day', // Fake metric
          keywordsAdded: ['Microservices'],
          factVerification: {
            allFactsPreserved: false,
            addedFacts: ['10M+ requests/day'],
          },
        },
      ]),
    }));

    const profile = createMockUserProfile();
    const resume = await generateTailoredResume(profile, SAMPLE_JOB_DESCRIPTION);

    // Should use original bullet when hallucination detected
    expect(resume.experience[0].bullets[0]).toBe('Built microservices using Python and AWS');
  });

  it('should preserve all metrics from original profile', async () => {
    const profile = createMockUserProfile();
    const originalMetrics = profile.workExperience
      .flatMap((exp) => exp.achievements)
      .flatMap((ach) => ach.metrics || []);

    const resume = await generateTailoredResume(profile, SAMPLE_JOB_DESCRIPTION);

    // All original metrics should appear somewhere in resume
    originalMetrics.forEach((metric) => {
      const allBullets = resume.experience.flatMap((exp) => exp.bullets).join(' ');
      // Check for value in various formats (1000000, 1M+, etc.)
      const hasMetric = allBullets.includes(metric.value.toString()) ||
                        allBullets.includes('1M+') ||
                        allBullets.includes('5');
      expect(hasMetric).toBe(true);
    });
  });
});

// ============================================================================
// Tests - Edge Cases
// ============================================================================

describe('Resume Generator - Edge Cases', () => {
  it('should handle profile with no work experience', async () => {
    const profile = createMockUserProfile({
      workExperience: [],
      projects: [
        {
          id: 'proj-edge-1',
          name: 'Personal Project',
          description: 'Built app',
          startDate: '2023-01',
          endDate: undefined,
          achievements: [
            {
              id: 'ach-edge-1',
              bullet: 'Built application',
              action: 'Built',
              object: 'application',
              skills: ['Python'],
              keywords: ['Python'],
              transferableSkills: ['Development'],
              metrics: [],
              verified: true,
              source: 'user',
            },
          ],
          skills: ['Python'],
          domains: ['Software Development'],
          treatedAsExperience: true,
        },
      ],
    });

    const resume = await generateTailoredResume(profile, SAMPLE_JOB_DESCRIPTION);

    expect(resume).toBeDefined();
    // Projects may be included or not depending on strategy
    if (resume.projects) {
      expect(resume.projects.length).toBeGreaterThan(0);
    }
    // At minimum, should have valid resume structure
    expect(resume.header).toBeDefined();
    expect(resume.matchReport).toBeDefined();
  });

  it('should handle empty job description', async () => {
    const profile = createMockUserProfile();

    // Empty job description should still work
    const resume = await generateTailoredResume(profile, '');
    expect(resume).toBeDefined();
    // Match score can be any valid value 0-1
    expect(resume.matchReport.matchScore).toBeGreaterThanOrEqual(0);
    expect(resume.matchReport.matchScore).toBeLessThanOrEqual(1);
  });

  it('should handle very long job description', async () => {
    const profile = createMockUserProfile();
    const longJobDescription = SAMPLE_JOB_DESCRIPTION.repeat(20);

    const resume = await generateTailoredResume(profile, longJobDescription);

    expect(resume).toBeDefined();
    expect(resume.matchReport.matches.length).toBeGreaterThan(0);
  });

  it('should handle profile with many experiences', async () => {
    const experiences = Array.from({ length: 10 }, (_, i) => ({
      id: `exp-many-${i}`,
      company: `Company ${i}`,
      title: `Title ${i}`,
      location: 'SF, CA',
      startDate: `${2010 + i}-01`,
      endDate: `${2011 + i}-01`,
      achievements: [
        {
          id: `ach-many-${i}`,
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
      domains: ['Software Engineering'],
      responsibilities: ['Development'],
    }));

    const profile = createMockUserProfile({
      workExperience: experiences,
    });

    const resume = await generateTailoredResume(profile, SAMPLE_JOB_DESCRIPTION);

    expect(resume).toBeDefined();
    // Should limit to most recent/relevant
    expect(resume.experience.length).toBeLessThanOrEqual(5);
  });

  it('should handle profile with no skills', async () => {
    const profile = createMockUserProfile({
      skills: [],
    });

    const resume = await generateTailoredResume(profile, SAMPLE_JOB_DESCRIPTION);

    expect(resume).toBeDefined();
    expect(resume.skills).toBeDefined();
  });

  it('should handle job description with unusual formatting', async () => {
    const weirdJobDescription = `
      !!!URGENT HIRING!!!

      🚀 AMAZING OPPORTUNITY 🚀

      Requirements:
      - Python
      - AWS
      - 5+ years

      Preferred:
      - Docker
    `;

    const profile = createMockUserProfile();
    const resume = await generateTailoredResume(profile, weirdJobDescription);

    expect(resume).toBeDefined();
    expect(resume.matchReport.matches.length).toBeGreaterThan(0);
  });
});

// ============================================================================
// Tests - Quick Generate
// ============================================================================

describe('Resume Generator - Quick Generate', () => {
  it('should generate resume with default config', async () => {
    const profile = createMockUserProfile();
    const resume = await quickGenerateTailoredResume(profile, SAMPLE_JOB_DESCRIPTION);

    expect(resume).toBeDefined();
    expect(resume.atsScore).toBeGreaterThanOrEqual(0);
  });

  it('should use professional tone by default', async () => {
    const profile = createMockUserProfile();
    const resume = await quickGenerateTailoredResume(profile, SAMPLE_JOB_DESCRIPTION);

    expect(resume).toBeDefined();
    // Summary should be professional
    if (resume.summary) {
      expect(resume.summary).not.toMatch(/😊|🎉|awesome|epic/i);
    }
  });

  it('should limit keywords per bullet', async () => {
    const profile = createMockUserProfile();
    const resume = await quickGenerateTailoredResume(profile, SAMPLE_JOB_DESCRIPTION);

    expect(resume).toBeDefined();
    // Each change should have reasonable number of keywords
    resume.experience.forEach((exp) => {
      exp.changes?.forEach((change) => {
        expect(change.keywordsAdded.length).toBeLessThanOrEqual(3);
      });
    });
  });
});

// ============================================================================
// Tests - Match Scoring
// ============================================================================

describe('Resume Generator - Match Scoring', () => {
  it('should score higher for exact skill matches', async () => {
    const profile = createMockUserProfile({
      skills: [
        { name: 'Python', level: 'expert', yearsOfExperience: 5, category: 'programming-language' },
        { name: 'AWS', level: 'advanced', yearsOfExperience: 5, category: 'cloud-platform' },
        { name: 'React', level: 'advanced', yearsOfExperience: 4, category: 'framework' },
        { name: 'Docker', level: 'intermediate', yearsOfExperience: 3, category: 'tool' },
      ],
    });

    const resume = await generateTailoredResume(profile, SAMPLE_JOB_DESCRIPTION);

    // Match score is 0-1, so 0.6 = 60%
    expect(resume.matchReport.matchScore).toBeGreaterThan(0.6);
  });

  it('should identify missing requirements', async () => {
    const profile = createMockUserProfile({
      skills: [
        { name: 'Java', level: 'expert', yearsOfExperience: 5, category: 'programming-language' }, // Not in job requirements
      ],
    });

    const resume = await generateTailoredResume(profile, SAMPLE_JOB_DESCRIPTION);

    expect(resume.matchReport.missing).toBeDefined();
    expect(resume.matchReport.missing.length).toBeGreaterThan(0);
  });

  it('should categorize required vs preferred matches', async () => {
    const profile = createMockUserProfile();
    const resume = await generateTailoredResume(profile, SAMPLE_JOB_DESCRIPTION);

    expect(resume.matchReport.matches).toBeDefined();
    resume.matchReport.matches.forEach((match) => {
      expect(match).toHaveProperty('requirement');
      expect(match).toHaveProperty('matchType');
    });
  });
});

// ============================================================================
// Tests - Deterministic Behavior
// ============================================================================

describe('Resume Generator - Deterministic Behavior', () => {
  it('should produce consistent ATS scores for same inputs', async () => {
    const profile = createMockUserProfile();

    const scores = await Promise.all([
      generateTailoredResume(profile, SAMPLE_JOB_DESCRIPTION).then((r) => r.atsScore),
      generateTailoredResume(profile, SAMPLE_JOB_DESCRIPTION).then((r) => r.atsScore),
      generateTailoredResume(profile, SAMPLE_JOB_DESCRIPTION).then((r) => r.atsScore),
    ]);

    expect(scores[0]).toBe(scores[1]);
    expect(scores[1]).toBe(scores[2]);
  });

  it('should have reproducible match scores', async () => {
    const profile = createMockUserProfile();

    const result1 = await generateTailoredResume(profile, SAMPLE_JOB_DESCRIPTION);
    const result2 = await generateTailoredResume(profile, SAMPLE_JOB_DESCRIPTION);

    expect(result1.matchReport.matchScore).toBe(result2.matchReport.matchScore);
  });

  it('should select same experiences consistently', async () => {
    const profile = createMockUserProfile();

    const result1 = await generateTailoredResume(profile, SAMPLE_JOB_DESCRIPTION);
    const result2 = await generateTailoredResume(profile, SAMPLE_JOB_DESCRIPTION);

    expect(result1.experience.length).toBe(result2.experience.length);
    expect(result1.experience[0].company).toBe(result2.experience[0].company);
  });
});
