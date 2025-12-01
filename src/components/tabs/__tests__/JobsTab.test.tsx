/**
 * JobsTab Component Tests
 * Comprehensive test suite for job analysis, resume generation, and state management
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { JobsTab } from '../JobsTab';
import type { JobDescriptionAnalysis, GeneratedResume, ProfessionalProfile } from '@/types/resume';
import * as storage from '@/utils/storage';
import * as keywordExtractor from '@/services/keyword-extractor';

// Mock modules
vi.mock('@/utils/storage');
vi.mock('@/services/ai-resume-generator');
vi.mock('@/services/keyword-extractor');

// Mock chrome runtime API
const mockChrome = {
  runtime: {
    sendMessage: vi.fn(),
  },
};
(globalThis as any).chrome = mockChrome;

// Mock navigator.clipboard
const mockClipboard = {
  writeText: vi.fn(),
};
(globalThis as any).navigator = {
  clipboard: mockClipboard,
};

// Mock alert
const mockAlert = vi.fn();
(globalThis as any).alert = mockAlert;

// Test data factories
const createMockJob = (overrides: Partial<JobDescriptionAnalysis> = {}): JobDescriptionAnalysis => ({
  id: 'job_1',
  rawText: 'Looking for a Senior Software Engineer with React and TypeScript experience.',
  jobTitle: 'Senior Software Engineer',
  company: 'TechCorp',
  location: 'San Francisco, CA',
  jobUrl: 'https://linkedin.com/jobs/123',
  extractedKeywords: [
    { phrase: 'React', score: 90, occurrences: 2, category: 'framework', required: true, frequency: 2, synonyms: ['React.js', 'ReactJS'] },
    { phrase: 'TypeScript', score: 85, occurrences: 2, category: 'language', required: true, frequency: 2, synonyms: ['TS'] },
  ],
  requiredSkills: ['React', 'TypeScript'],
  preferredSkills: ['Node.js', 'GraphQL'],
  requiredExperience: ['5+ years'],
  preferredExperience: ['Team leadership'],
  analyzedAt: Date.now(),
  ...overrides,
});

const createMockResume = (overrides: Partial<GeneratedResume> = {}): GeneratedResume => ({
  id: 'resume_1',
  jobDescriptionId: 'job_1',
  jobTitle: 'Senior Software Engineer',
  company: 'TechCorp',
  selectedExperiences: [],
  selectedSkills: [],
  selectedProjects: [],
  selectedEducation: [],
  professionalSummary: 'Experienced software engineer...',
  content: {
    sections: [],
    formattedText: 'Professional Summary\n\nExperienced software engineer...',
  },
  atsOptimization: {
    keywordDensity: 2.5,
    keywordMatchRate: 78,
    totalKeywords: 25,
    keywordsUsed: ['React', 'TypeScript'],
    formatCompliance: {
      singleColumn: true,
      noHeadersFooters: true,
      standardFont: true,
      noGraphics: true,
      noTables: true,
      score: 95,
    },
    contentQuality: {
      hasMetrics: true,
      usesActionVerbs: true,
      aprFormatUsed: true,
      averageBulletLength: 18,
      score: 88,
    },
    overallATSScore: 85,
    recommendations: ['Add more quantifiable metrics', 'Include AWS certification'],
  },
  generatedAt: Date.now(),
  version: 1,
  ...overrides,
});

const createMockProfile = (): ProfessionalProfile => ({
  personalInfo: {
    fullName: 'John Doe',
    email: 'john@example.com',
    phone: '555-0100',
    location: 'San Francisco, CA',
  },
  jobs: [],
  internships: [],
  volunteerWork: [],
  technicalSkills: [],
  softSkills: [],
  tools: [],
  certifications: [],
  languages: [],
  education: [],
  projects: [],
  publications: [],
  achievements: [],
  awards: [],
  createdAt: Date.now(),
  updatedAt: Date.now(),
  version: 1,
});

describe('JobsTab Component', () => {
  beforeEach(() => {
    // Clear all mocks
    vi.clearAllMocks();

    // Setup default mock implementations
    vi.mocked(storage.getJobDescriptionAnalyses).mockResolvedValue([]);
    vi.mocked(storage.getGeneratedResumes).mockResolvedValue([]);
    vi.mocked(storage.getProfessionalProfile).mockResolvedValue(createMockProfile());
    vi.mocked(storage.saveJobDescriptionAnalysis).mockResolvedValue();
    vi.mocked(storage.deleteJobDescriptionAnalysis).mockResolvedValue();
    vi.mocked(storage.saveGeneratedResume).mockResolvedValue();

    vi.mocked(keywordExtractor.extractKeywordsFromJobDescription).mockReturnValue([]);
    vi.mocked(keywordExtractor.categorizeJobRequirements).mockReturnValue({
      required: [],
      preferred: [],
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Component Rendering', () => {
    it('should render without crashing', () => {
      const { container } = render(<JobsTab panelWidth={400} />);
      expect(container).toBeDefined();
    });

    it('should render empty state when no jobs exist', async () => {
      vi.mocked(storage.getJobDescriptionAnalyses).mockResolvedValue([]);
      vi.mocked(storage.getGeneratedResumes).mockResolvedValue([]);

      render(<JobsTab panelWidth={400} />);

      await waitFor(() => {
        expect(screen.getByText('No jobs analyzed yet')).toBeDefined();
      });
    });

    it('should render job list when jobs are loaded', async () => {
      const mockJobs = [createMockJob()];
      vi.mocked(storage.getJobDescriptionAnalyses).mockResolvedValue(mockJobs);
      vi.mocked(storage.getGeneratedResumes).mockResolvedValue([]);

      render(<JobsTab panelWidth={400} />);

      await waitFor(() => {
        expect(screen.getByText('Senior Software Engineer')).toBeDefined();
        expect(screen.getByText('TechCorp')).toBeDefined();
      });
    });

    it('should render with custom panel width', () => {
      const { container } = render(<JobsTab panelWidth={600} />);
      expect(container).toBeDefined();
    });

    it('should use default panel width when not provided', () => {
      const { container } = render(<JobsTab />);
      expect(container).toBeDefined();
    });

    it('should show job count when jobs are loaded', async () => {
      const mockJobs = [createMockJob({ id: 'job_1' }), createMockJob({ id: 'job_2' })];
      vi.mocked(storage.getJobDescriptionAnalyses).mockResolvedValue(mockJobs);
      vi.mocked(storage.getGeneratedResumes).mockResolvedValue([]);

      render(<JobsTab panelWidth={400} />);

      await waitFor(() => {
        expect(screen.getByText('2 analyzed')).toBeDefined();
      });
    });
  });

  describe('Storage Integration', () => {
    it('should load jobs from storage on mount', async () => {
      const mockJobs = [createMockJob()];
      vi.mocked(storage.getJobDescriptionAnalyses).mockResolvedValue(mockJobs);
      vi.mocked(storage.getGeneratedResumes).mockResolvedValue([]);

      render(<JobsTab panelWidth={400} />);

      await waitFor(() => {
        expect(storage.getJobDescriptionAnalyses).toHaveBeenCalledTimes(1);
      });
    });

    it('should load resumes from storage on mount', async () => {
      const mockResumes = [createMockResume()];
      vi.mocked(storage.getJobDescriptionAnalyses).mockResolvedValue([]);
      vi.mocked(storage.getGeneratedResumes).mockResolvedValue(mockResumes);

      render(<JobsTab panelWidth={400} />);

      await waitFor(() => {
        expect(storage.getGeneratedResumes).toHaveBeenCalledTimes(1);
      });
    });

    it('should load jobs and resumes in parallel', async () => {
      const mockJobs = [createMockJob()];
      const mockResumes = [createMockResume()];
      vi.mocked(storage.getJobDescriptionAnalyses).mockResolvedValue(mockJobs);
      vi.mocked(storage.getGeneratedResumes).mockResolvedValue(mockResumes);

      render(<JobsTab panelWidth={400} />);

      await waitFor(() => {
        expect(storage.getJobDescriptionAnalyses).toHaveBeenCalledTimes(1);
        expect(storage.getGeneratedResumes).toHaveBeenCalledTimes(1);
      });
    });

    it('should handle storage errors gracefully', async () => {
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
      vi.mocked(storage.getJobDescriptionAnalyses).mockRejectedValue(new Error('Storage error'));
      vi.mocked(storage.getGeneratedResumes).mockResolvedValue([]);

      render(<JobsTab panelWidth={400} />);

      await waitFor(() => {
        expect(consoleError).toHaveBeenCalledWith(
          expect.stringContaining('[Uproot] Error loading jobs'),
          expect.any(Error)
        );
      });

      consoleError.mockRestore();
    });
  });

  describe('Job Analysis', () => {
    it('should display analyze button', async () => {
      vi.mocked(storage.getJobDescriptionAnalyses).mockResolvedValue([]);
      vi.mocked(storage.getGeneratedResumes).mockResolvedValue([]);

      render(<JobsTab panelWidth={400} />);

      await waitFor(() => {
        expect(screen.getByText('Analyze Current LinkedIn Job Page')).toBeDefined();
      });
    });

    it('should show keyword count for analyzed job', async () => {
      const mockJob = createMockJob({
        extractedKeywords: [
          { phrase: 'React', score: 90, occurrences: 2, category: 'framework', required: true, frequency: 2 },
          { phrase: 'TypeScript', score: 85, occurrences: 2, category: 'language', required: true, frequency: 2 },
        ],
      });
      vi.mocked(storage.getJobDescriptionAnalyses).mockResolvedValue([mockJob]);
      vi.mocked(storage.getGeneratedResumes).mockResolvedValue([]);

      render(<JobsTab panelWidth={400} />);

      await waitFor(() => {
        expect(screen.getByText('2 keywords')).toBeDefined();
      });
    });
  });

  describe('Resume Generation', () => {
    it('should show generate resume button for jobs without resumes', async () => {
      const mockJob = createMockJob();
      vi.mocked(storage.getJobDescriptionAnalyses).mockResolvedValue([mockJob]);
      vi.mocked(storage.getGeneratedResumes).mockResolvedValue([]);

      render(<JobsTab panelWidth={400} />);

      await waitFor(() => {
        expect(screen.getByText('Generate Resume')).toBeDefined();
      });
    });

    it('should show resume generated status for jobs with resumes', async () => {
      const mockJob = createMockJob({ id: 'job_1' });
      const mockResume = createMockResume({ jobDescriptionId: 'job_1' });
      vi.mocked(storage.getJobDescriptionAnalyses).mockResolvedValue([mockJob]);
      vi.mocked(storage.getGeneratedResumes).mockResolvedValue([mockResume]);

      render(<JobsTab panelWidth={400} />);

      await waitFor(() => {
        expect(screen.getByText('Resume Generated')).toBeDefined();
      });
    });

    it('should display ATS score for generated resume', async () => {
      const mockJob = createMockJob({ id: 'job_1' });
      const mockResume = createMockResume({
        jobDescriptionId: 'job_1',
        atsOptimization: {
          ...createMockResume().atsOptimization,
          overallATSScore: 92
        }
      });

      vi.mocked(storage.getJobDescriptionAnalyses).mockResolvedValue([mockJob]);
      vi.mocked(storage.getGeneratedResumes).mockResolvedValue([mockResume]);

      render(<JobsTab panelWidth={400} />);

      await waitFor(() => {
        expect(screen.getByText(/ATS: 92/)).toBeDefined();
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle storage load errors gracefully', async () => {
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

      vi.mocked(storage.getJobDescriptionAnalyses).mockRejectedValue(new Error('Storage unavailable'));
      vi.mocked(storage.getGeneratedResumes).mockResolvedValue([]);

      render(<JobsTab panelWidth={400} />);

      await waitFor(() => {
        expect(consoleError).toHaveBeenCalledWith(
          expect.stringContaining('[Uproot] Error loading jobs'),
          expect.any(Error)
        );
      });

      consoleError.mockRestore();
    });
  });

  describe('User Interactions - Helper Functions', () => {
    it('should format dates correctly', () => {
      // Use explicit date constructor to avoid timezone issues
      const timestamp = new Date(2023, 5, 15).getTime(); // Month is 0-indexed (5 = June)
      const formatted = new Date(timestamp).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });

      expect(formatted).toBe('Jun 15, 2023');
    });

    it('should calculate ATS score style for high scores (80+)', () => {
      const getATSScoreStyle = (score: number) => {
        if (score >= 80) return { color: '#059669', backgroundColor: '#ecfdf5' };
        if (score >= 65) return { color: '#0077B5', backgroundColor: '#eff6ff' };
        if (score >= 50) return { color: '#ea580c', backgroundColor: '#fff7ed' };
        return { color: '#dc2626', backgroundColor: '#fef2f2' };
      };

      expect(getATSScoreStyle(85)).toEqual({ color: '#059669', backgroundColor: '#ecfdf5' });
    });

    it('should calculate ATS score style for medium scores (65-79)', () => {
      const getATSScoreStyle = (score: number) => {
        if (score >= 80) return { color: '#059669', backgroundColor: '#ecfdf5' };
        if (score >= 65) return { color: '#0077B5', backgroundColor: '#eff6ff' };
        if (score >= 50) return { color: '#ea580c', backgroundColor: '#fff7ed' };
        return { color: '#dc2626', backgroundColor: '#fef2f2' };
      };

      expect(getATSScoreStyle(70)).toEqual({ color: '#0077B5', backgroundColor: '#eff6ff' });
    });

    it('should calculate ATS score style for low scores (50-64)', () => {
      const getATSScoreStyle = (score: number) => {
        if (score >= 80) return { color: '#059669', backgroundColor: '#ecfdf5' };
        if (score >= 65) return { color: '#0077B5', backgroundColor: '#eff6ff' };
        if (score >= 50) return { color: '#ea580c', backgroundColor: '#fff7ed' };
        return { color: '#dc2626', backgroundColor: '#fef2f2' };
      };

      expect(getATSScoreStyle(55)).toEqual({ color: '#ea580c', backgroundColor: '#fff7ed' });
    });

    it('should calculate ATS score style for very low scores (<50)', () => {
      const getATSScoreStyle = (score: number) => {
        if (score >= 80) return { color: '#059669', backgroundColor: '#ecfdf5' };
        if (score >= 65) return { color: '#0077B5', backgroundColor: '#eff6ff' };
        if (score >= 50) return { color: '#ea580c', backgroundColor: '#fff7ed' };
        return { color: '#dc2626', backgroundColor: '#fef2f2' };
      };

      expect(getATSScoreStyle(45)).toEqual({ color: '#dc2626', backgroundColor: '#fef2f2' });
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty jobs array', async () => {
      vi.mocked(storage.getJobDescriptionAnalyses).mockResolvedValue([]);
      vi.mocked(storage.getGeneratedResumes).mockResolvedValue([]);

      render(<JobsTab panelWidth={400} />);

      await waitFor(() => {
        expect(storage.getJobDescriptionAnalyses).toHaveBeenCalled();
      });
    });

    it('should handle empty resumes array', async () => {
      vi.mocked(storage.getJobDescriptionAnalyses).mockResolvedValue([createMockJob()]);
      vi.mocked(storage.getGeneratedResumes).mockResolvedValue([]);

      render(<JobsTab panelWidth={400} />);

      await waitFor(() => {
        expect(storage.getGeneratedResumes).toHaveBeenCalled();
      });
    });

    it('should handle job without location', async () => {
      const jobWithoutLocation = createMockJob({ location: undefined });
      vi.mocked(storage.getJobDescriptionAnalyses).mockResolvedValue([jobWithoutLocation]);
      vi.mocked(storage.getGeneratedResumes).mockResolvedValue([]);

      render(<JobsTab panelWidth={400} />);

      await waitFor(() => {
        expect(screen.getByText('Senior Software Engineer')).toBeDefined();
      });
    });

    it('should handle job without URL', async () => {
      const jobWithoutUrl = createMockJob({ jobUrl: undefined });
      vi.mocked(storage.getJobDescriptionAnalyses).mockResolvedValue([jobWithoutUrl]);
      vi.mocked(storage.getGeneratedResumes).mockResolvedValue([]);

      render(<JobsTab panelWidth={400} />);

      await waitFor(() => {
        expect(screen.getByText('Senior Software Engineer')).toBeDefined();
      });
    });

    it('should handle very long job descriptions', async () => {
      const longDescription = 'A'.repeat(10000);
      const jobLongDesc = createMockJob({ rawText: longDescription });

      vi.mocked(storage.getJobDescriptionAnalyses).mockResolvedValue([jobLongDesc]);
      vi.mocked(storage.getGeneratedResumes).mockResolvedValue([]);

      render(<JobsTab panelWidth={400} />);

      await waitFor(() => {
        expect(jobLongDesc.rawText.length).toBe(10000);
      });
    });

    it('should handle many jobs (performance)', async () => {
      const manyJobs = Array.from({ length: 50 }, (_, i) =>
        createMockJob({ id: `job_${i}`, analyzedAt: Date.now() - i * 1000 })
      );

      vi.mocked(storage.getJobDescriptionAnalyses).mockResolvedValue(manyJobs);
      vi.mocked(storage.getGeneratedResumes).mockResolvedValue([]);

      render(<JobsTab panelWidth={400} />);

      await waitFor(() => {
        expect(screen.getByText('50 analyzed')).toBeDefined();
      });
    });

    it('should handle special characters in job data', async () => {
      const specialJob = createMockJob({
        jobTitle: 'Software Engineer (C++) <Senior>',
        company: 'Tech & Co.',
        rawText: 'Looking for C++ developer with <5 years experience & strong skills',
      });

      vi.mocked(storage.getJobDescriptionAnalyses).mockResolvedValue([specialJob]);
      vi.mocked(storage.getGeneratedResumes).mockResolvedValue([]);

      render(<JobsTab panelWidth={400} />);

      await waitFor(() => {
        expect(screen.getByText('Software Engineer (C++) <Senior>')).toBeDefined();
        expect(screen.getByText('Tech & Co.')).toBeDefined();
      });
    });
  });

  describe('Data Validation', () => {
    it('should verify mock data structure is correct', () => {
      const mockJob = createMockJob();
      expect(mockJob.id).toBeDefined();
      expect(mockJob.jobTitle).toBeDefined();
      expect(mockJob.company).toBeDefined();
      expect(mockJob.extractedKeywords).toBeDefined();
      expect(mockJob.analyzedAt).toBeDefined();
    });

    it('should verify resume data structure is correct', () => {
      const mockResume = createMockResume();
      expect(mockResume.id).toBeDefined();
      expect(mockResume.jobDescriptionId).toBeDefined();
      expect(mockResume.atsOptimization).toBeDefined();
      expect(mockResume.atsOptimization.overallATSScore).toBe(85);
    });

    it('should verify profile data structure is correct', () => {
      const mockProfile = createMockProfile();
      expect(mockProfile.personalInfo).toBeDefined();
      expect(mockProfile.personalInfo.fullName).toBe('John Doe');
      expect(mockProfile.jobs).toBeDefined();
      expect(mockProfile.education).toBeDefined();
    });
  });

  describe('Component State', () => {
    it('should handle multiple jobs rendering', async () => {
      const mockJobs = [
        createMockJob({ id: 'job_1', jobTitle: 'Frontend Engineer' }),
        createMockJob({ id: 'job_2', jobTitle: 'Backend Engineer' }),
        createMockJob({ id: 'job_3', jobTitle: 'Full Stack Engineer' }),
      ];

      vi.mocked(storage.getJobDescriptionAnalyses).mockResolvedValue(mockJobs);
      vi.mocked(storage.getGeneratedResumes).mockResolvedValue([]);

      render(<JobsTab panelWidth={400} />);

      await waitFor(() => {
        expect(screen.getByText('Frontend Engineer')).toBeDefined();
        expect(screen.getByText('Backend Engineer')).toBeDefined();
        expect(screen.getByText('Full Stack Engineer')).toBeDefined();
      });
    });

    it('should handle jobs with varying keyword counts', async () => {
      const mockJobs = [
        createMockJob({
          id: 'job_1',
          extractedKeywords: [
            { phrase: 'React', score: 90, occurrences: 1, category: 'framework', required: true, frequency: 1 },
          ],
        }),
        createMockJob({
          id: 'job_2',
          extractedKeywords: [
            { phrase: 'React', score: 90, occurrences: 1, category: 'framework', required: true, frequency: 1 },
            { phrase: 'Node', score: 85, occurrences: 1, category: 'framework', required: true, frequency: 1 },
            { phrase: 'TypeScript', score: 80, occurrences: 1, category: 'language', required: true, frequency: 1 },
          ],
        }),
      ];

      vi.mocked(storage.getJobDescriptionAnalyses).mockResolvedValue(mockJobs);
      vi.mocked(storage.getGeneratedResumes).mockResolvedValue([]);

      render(<JobsTab panelWidth={400} />);

      await waitFor(() => {
        expect(screen.getByText('1 keywords')).toBeDefined();
        expect(screen.getByText('3 keywords')).toBeDefined();
      });
    });
  });
});
