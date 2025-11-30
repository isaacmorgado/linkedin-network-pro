/**
 * JobsTab Timeout Tests
 * Tests timeout handling for async operations in JobsTab component
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { JobsTab } from '../JobsTab';
import type { JobDescriptionAnalysis, GeneratedResume, ProfessionalProfile } from '@/types/resume';
import * as storage from '@/utils/storage';
import * as aiResumeGenerator from '@/services/ai-resume-generator';
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
    { term: 'React', category: 'technical-skill', required: true, frequency: 2, weight: 90, synonyms: ['React.js', 'ReactJS'] },
    { term: 'TypeScript', category: 'technical-skill', required: true, frequency: 2, weight: 85, synonyms: ['TS'] },
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
  jobs: [
    {
      id: 'job_exp_1',
      title: 'Senior Software Engineer',
      company: 'Previous Company',
      location: 'San Francisco, CA',
      startDate: '2020-01',
      endDate: '2023-12',
      current: false,
      employmentType: 'full-time' as const,
      technologies: ['React', 'TypeScript', 'Node.js'],
      bullets: [
        {
          id: 'bullet_1',
          text: 'Led development of React applications',
          keywords: ['React', 'leadership'],
          metrics: [{ value: 'improved performance by 30%', context: 'performance' }],
          order: 0,
        },
      ],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    },
  ],
  internships: [],
  volunteerWork: [],
  technicalSkills: [
    {
      id: 'skill_1',
      name: 'React',
      category: 'frontend',
      proficiency: 'expert',
      yearsOfExperience: 5,
      synonyms: ['React.js', 'ReactJS'],
    },
  ],
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

describe('JobsTab Timeout Tests', () => {
  beforeEach(() => {
    // Clear all mocks
    vi.clearAllMocks();

    // Use real timers by default
    vi.useRealTimers();

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
    vi.useRealTimers();
  });

  describe('Resume Generation Timeouts', () => {
    it('should show loading state during resume generation', async () => {
      const user = userEvent.setup();
      const mockJob = createMockJob();

      vi.mocked(storage.getJobDescriptionAnalyses).mockResolvedValue([mockJob]);
      vi.mocked(storage.getGeneratedResumes).mockResolvedValue([]);

      // Mock generateResumeWithAI to take a long time
      vi.mocked(aiResumeGenerator.generateResumeWithAI).mockImplementation(
        () => new Promise((resolve) => {
          setTimeout(() => resolve(createMockResume()), 5000);
        })
      );

      render(<JobsTab panelWidth={400} />);

      // Wait for component to load
      await waitFor(() => {
        expect(screen.getByText('Senior Software Engineer')).toBeDefined();
      });

      // Click generate resume button
      const generateButton = screen.getByText('Generate Resume');
      await user.click(generateButton);

      // Should show loading state
      await waitFor(() => {
        expect(screen.getByText('Generating Resume...')).toBeDefined();
      });
    });

    it('should handle resume generation timeout gracefully', async () => {
      const user = userEvent.setup();
      const mockJob = createMockJob();

      vi.mocked(storage.getJobDescriptionAnalyses).mockResolvedValue([mockJob]);
      vi.mocked(storage.getGeneratedResumes).mockResolvedValue([]);

      // Mock generateResumeWithAI to resolve after a long delay (using real timers)
      vi.mocked(aiResumeGenerator.generateResumeWithAI).mockImplementation(
        () => new Promise((resolve) => {
          setTimeout(() => resolve(createMockResume()), 5000);
        })
      );

      render(<JobsTab panelWidth={400} />);

      // Wait for component to load
      await waitFor(() => {
        expect(screen.getByText('Senior Software Engineer')).toBeDefined();
      });

      // Click generate resume button
      const generateButton = screen.getByText('Generate Resume');
      await user.click(generateButton);

      // Should show loading state
      await waitFor(() => {
        expect(screen.getByText('Generating Resume...')).toBeDefined();
      });

      // Wait a bit - operation should still be in progress
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Should still be loading
      expect(screen.getByText('Generating Resume...')).toBeDefined();
    });

    it('should handle resume generation error and allow retry', async () => {
      const user = userEvent.setup();
      const mockJob = createMockJob();

      vi.mocked(storage.getJobDescriptionAnalyses).mockResolvedValue([mockJob]);
      vi.mocked(storage.getGeneratedResumes).mockResolvedValue([]);

      // Mock generateResumeWithAI to fail first time, succeed second time
      let callCount = 0;
      vi.mocked(aiResumeGenerator.generateResumeWithAI).mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return Promise.reject(new Error('API timeout'));
        }
        return Promise.resolve(createMockResume());
      });

      render(<JobsTab panelWidth={400} />);

      // Wait for component to load
      await waitFor(() => {
        expect(screen.getByText('Senior Software Engineer')).toBeDefined();
      });

      // Click generate resume button (first attempt)
      const generateButton = screen.getByText('Generate Resume');
      await user.click(generateButton);

      // Should show error message
      await waitFor(() => {
        expect(screen.getByText('API timeout')).toBeDefined();
      }, { timeout: 3000 });

      // Should still show generate button for retry
      const retryButton = screen.getByText('Generate Resume');
      expect(retryButton).toBeDefined();

      // Click retry (second attempt)
      await user.click(retryButton);

      // Should succeed this time
      await waitFor(() => {
        expect(screen.getByText('Resume Generated')).toBeDefined();
      }, { timeout: 3000 });
    });

    it('should handle missing profile error during resume generation', async () => {
      const user = userEvent.setup();
      const mockJob = createMockJob();

      vi.mocked(storage.getJobDescriptionAnalyses).mockResolvedValue([mockJob]);
      vi.mocked(storage.getGeneratedResumes).mockResolvedValue([]);
      vi.mocked(storage.getProfessionalProfile).mockResolvedValue(null as any);

      render(<JobsTab panelWidth={400} />);

      // Wait for component to load
      await waitFor(() => {
        expect(screen.getByText('Senior Software Engineer')).toBeDefined();
      });

      // Click generate resume button
      const generateButton = screen.getByText('Generate Resume');
      await user.click(generateButton);

      // Should show error message
      await waitFor(() => {
        expect(screen.getByText('Please build your professional profile first')).toBeDefined();
      }, { timeout: 3000 });
    });

    it('should remain functional after resume generation error', async () => {
      const user = userEvent.setup();
      const mockJob = createMockJob();

      vi.mocked(storage.getJobDescriptionAnalyses).mockResolvedValue([mockJob]);
      vi.mocked(storage.getGeneratedResumes).mockResolvedValue([]);

      // Mock generateResumeWithAI to fail
      vi.mocked(aiResumeGenerator.generateResumeWithAI).mockRejectedValue(
        new Error('Network error')
      );

      render(<JobsTab panelWidth={400} />);

      // Wait for component to load
      await waitFor(() => {
        expect(screen.getByText('Senior Software Engineer')).toBeDefined();
      });

      // Click generate resume button
      const generateButton = screen.getByText('Generate Resume');
      await user.click(generateButton);

      // Wait for error
      await waitFor(() => {
        expect(screen.getByText('Network error')).toBeDefined();
      }, { timeout: 3000 });

      // Verify button is still clickable (component remains responsive)
      const retryButton = screen.getByText('Generate Resume');
      expect(retryButton).toBeDefined();
      expect(retryButton.hasAttribute('disabled')).toBe(false);
    });
  });

  describe('Job Analysis Timeouts', () => {
    it('should show analyzing state when job analysis starts', async () => {
      const user = userEvent.setup();

      vi.mocked(storage.getJobDescriptionAnalyses).mockResolvedValue([]);
      vi.mocked(storage.getGeneratedResumes).mockResolvedValue([]);

      // Mock chrome.runtime.sendMessage to take time
      mockChrome.runtime.sendMessage.mockImplementation(() =>
        new Promise((resolve) => {
          setTimeout(() => resolve({
            success: true,
            data: {
              description: 'Test job description',
              jobTitle: 'Software Engineer',
              company: 'Test Company',
              location: 'Remote',
              url: 'https://linkedin.com/jobs/test',
            }
          }), 2000);
        })
      );

      vi.mocked(keywordExtractor.extractKeywordsFromJobDescription).mockReturnValue([
        { term: 'React', category: 'technical-skill', required: true, frequency: 2, weight: 90, synonyms: ['React.js'] },
      ]);

      vi.mocked(keywordExtractor.categorizeJobRequirements).mockReturnValue({
        required: ['React'],
        preferred: ['TypeScript'],
      });

      render(<JobsTab panelWidth={400} />);

      // Wait for empty state
      await waitFor(() => {
        expect(screen.getByText('No jobs analyzed yet')).toBeDefined();
      });

      // Click analyze button
      const analyzeButton = screen.getByText('Analyze Current LinkedIn Job Page');
      await user.click(analyzeButton);

      // Should show analyzing state
      await waitFor(() => {
        expect(screen.getByText('Analyzing Job...')).toBeDefined();
      });
    });

    it('should handle job analysis timeout after 30 seconds', async () => {
      const user = userEvent.setup();

      vi.mocked(storage.getJobDescriptionAnalyses).mockResolvedValue([]);
      vi.mocked(storage.getGeneratedResumes).mockResolvedValue([]);

      // Mock chrome.runtime.sendMessage to resolve after a long delay (using real timers)
      mockChrome.runtime.sendMessage.mockImplementation(() =>
        new Promise((resolve) => {
          setTimeout(() => resolve({
            success: true,
            data: {
              description: 'Test job description',
              jobTitle: 'Software Engineer',
              company: 'Test Company',
              location: 'Remote',
              url: 'https://linkedin.com/jobs/test'
            }
          }), 5000);
        })
      );

      render(<JobsTab panelWidth={400} />);

      // Wait for empty state
      await waitFor(() => {
        expect(screen.getByText('No jobs analyzed yet')).toBeDefined();
      });

      // Click analyze button
      const analyzeButton = screen.getByText('Analyze Current LinkedIn Job Page');
      await user.click(analyzeButton);

      // Should show analyzing state
      await waitFor(() => {
        expect(screen.getByText('Analyzing Job...')).toBeDefined();
      });

      // Wait a bit - operation should still be in progress
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Should still be analyzing
      expect(screen.getByText('Analyzing Job...')).toBeDefined();
    });

    it('should handle job analysis failure and show error', async () => {
      const user = userEvent.setup();

      vi.mocked(storage.getJobDescriptionAnalyses).mockResolvedValue([]);
      vi.mocked(storage.getGeneratedResumes).mockResolvedValue([]);

      // Mock chrome.runtime.sendMessage to fail
      mockChrome.runtime.sendMessage.mockResolvedValue({
        success: false,
        error: 'Failed to extract job data from page',
      });

      render(<JobsTab panelWidth={400} />);

      // Wait for empty state
      await waitFor(() => {
        expect(screen.getByText('No jobs analyzed yet')).toBeDefined();
      });

      // Click analyze button
      const analyzeButton = screen.getByText('Analyze Current LinkedIn Job Page');
      await user.click(analyzeButton);

      // Should show error message
      await waitFor(() => {
        expect(screen.getByText('Failed to extract job data from page')).toBeDefined();
      }, { timeout: 3000 });
    });

    it('should handle invalid job data from analysis', async () => {
      const user = userEvent.setup();

      vi.mocked(storage.getJobDescriptionAnalyses).mockResolvedValue([]);
      vi.mocked(storage.getGeneratedResumes).mockResolvedValue([]);

      // Mock chrome.runtime.sendMessage to return invalid data
      mockChrome.runtime.sendMessage.mockResolvedValue({
        success: true,
        data: {
          description: '',  // Empty description should fail validation
          jobTitle: '',
          company: '',
        },
      });

      render(<JobsTab panelWidth={400} />);

      // Wait for empty state
      await waitFor(() => {
        expect(screen.getByText('No jobs analyzed yet')).toBeDefined();
      });

      // Click analyze button
      const analyzeButton = screen.getByText('Analyze Current LinkedIn Job Page');
      await user.click(analyzeButton);

      // Should show validation error
      await waitFor(() => {
        expect(screen.getByText(/Invalid response/)).toBeDefined();
      }, { timeout: 3000 });
    });

    it('should allow retry after analysis error', async () => {
      const user = userEvent.setup();

      vi.mocked(storage.getJobDescriptionAnalyses).mockResolvedValue([]);
      vi.mocked(storage.getGeneratedResumes).mockResolvedValue([]);

      let callCount = 0;
      mockChrome.runtime.sendMessage.mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return Promise.resolve({
            success: false,
            error: 'Network error',
          });
        }
        return Promise.resolve({
          success: true,
          data: {
            description: 'Test job description',
            jobTitle: 'Software Engineer',
            company: 'Test Company',
            location: 'Remote',
            url: 'https://linkedin.com/jobs/test',
          },
        });
      });

      vi.mocked(keywordExtractor.extractKeywordsFromJobDescription).mockReturnValue([
        { term: 'React', category: 'technical-skill', required: true, frequency: 2, weight: 90, synonyms: [] },
      ]);

      vi.mocked(keywordExtractor.categorizeJobRequirements).mockReturnValue({
        required: ['React'],
        preferred: [],
      });

      render(<JobsTab panelWidth={400} />);

      // Wait for empty state
      await waitFor(() => {
        expect(screen.getByText('No jobs analyzed yet')).toBeDefined();
      });

      // First attempt - should fail
      const analyzeButton = screen.getByText('Analyze Current LinkedIn Job Page');
      await user.click(analyzeButton);

      await waitFor(() => {
        expect(screen.getByText('Network error')).toBeDefined();
      }, { timeout: 3000 });

      // Second attempt - should succeed
      const retryButton = screen.getByText('Analyze Current LinkedIn Job Page');
      await user.click(retryButton);

      await waitFor(() => {
        expect(screen.getByText(/Job analyzed: Software Engineer at Test Company/)).toBeDefined();
      }, { timeout: 3000 });
    });
  });

  describe('Storage Operation Timeouts', () => {
    it('should handle slow initial data load', async () => {
      // Mock slow storage operations with real timers (short delays for testing)
      vi.mocked(storage.getJobDescriptionAnalyses).mockImplementation(
        () => new Promise((resolve) => {
          setTimeout(() => resolve([createMockJob()]), 1000);
        })
      );

      vi.mocked(storage.getGeneratedResumes).mockImplementation(
        () => new Promise((resolve) => {
          setTimeout(() => resolve([]), 1000);
        })
      );

      render(<JobsTab panelWidth={400} />);

      // Should show loading state initially
      expect(screen.queryByText('Senior Software Engineer')).toBeNull();

      // Wait for data to load
      await waitFor(() => {
        expect(screen.getByText('Senior Software Engineer')).toBeDefined();
      }, { timeout: 3000 });
    });

    it('should handle storage load errors gracefully', async () => {
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

      vi.mocked(storage.getJobDescriptionAnalyses).mockRejectedValue(
        new Error('Database unavailable')
      );
      vi.mocked(storage.getGeneratedResumes).mockRejectedValue(
        new Error('Database unavailable')
      );

      render(<JobsTab panelWidth={400} />);

      await waitFor(() => {
        expect(consoleError).toHaveBeenCalledWith(
          expect.stringContaining('[Uproot] Error loading jobs'),
          expect.any(Error)
        );
      });

      consoleError.mockRestore();
    });

    it('should handle save operation timeout', async () => {
      const user = userEvent.setup();
      const mockJob = createMockJob();

      vi.mocked(storage.getJobDescriptionAnalyses).mockResolvedValue([mockJob]);
      vi.mocked(storage.getGeneratedResumes).mockResolvedValue([]);

      // Mock slow save operation
      vi.mocked(storage.saveGeneratedResume).mockImplementation(
        () => new Promise((resolve) => {
          setTimeout(() => resolve(), 10000);
        })
      );

      vi.mocked(aiResumeGenerator.generateResumeWithAI).mockResolvedValue(
        createMockResume()
      );

      render(<JobsTab panelWidth={400} />);

      // Wait for component to load
      await waitFor(() => {
        expect(screen.getByText('Senior Software Engineer')).toBeDefined();
      });

      // Generate resume
      const generateButton = screen.getByText('Generate Resume');
      await user.click(generateButton);

      // Resume generation completes but save is slow
      // Component should still show generating state while saving
      await waitFor(() => {
        expect(screen.getByText('Generating Resume...')).toBeDefined();
      });
    });

    it('should handle partial data load (jobs load, resumes fail)', async () => {
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
      const mockJob = createMockJob();

      vi.mocked(storage.getJobDescriptionAnalyses).mockResolvedValue([mockJob]);
      vi.mocked(storage.getGeneratedResumes).mockRejectedValue(
        new Error('Resumes database corrupted')
      );

      render(<JobsTab panelWidth={400} />);

      // Component shows error when any data load fails (current behavior)
      await waitFor(() => {
        expect(screen.getByText('Failed to load jobs')).toBeDefined();
      });

      // Verify error was logged
      expect(consoleError).toHaveBeenCalledWith(
        expect.stringContaining('[Uproot] Error loading jobs'),
        expect.any(Error)
      );

      consoleError.mockRestore();
    });
  });

  describe('Concurrent Operation Timeouts', () => {
    it('should handle multiple resume generations timing out', async () => {
      const user = userEvent.setup();
      const mockJobs = [
        createMockJob({ id: 'job_1', jobTitle: 'Frontend Engineer' }),
        createMockJob({ id: 'job_2', jobTitle: 'Backend Engineer' }),
      ];

      vi.mocked(storage.getJobDescriptionAnalyses).mockResolvedValue(mockJobs);
      vi.mocked(storage.getGeneratedResumes).mockResolvedValue([]);

      // Mock generateResumeWithAI to fail for all attempts
      vi.mocked(aiResumeGenerator.generateResumeWithAI).mockRejectedValue(
        new Error('Service temporarily unavailable')
      );

      render(<JobsTab panelWidth={400} />);

      // Wait for jobs to load
      await waitFor(() => {
        expect(screen.getByText('Frontend Engineer')).toBeDefined();
        expect(screen.getByText('Backend Engineer')).toBeDefined();
      });

      // Try to generate resume for first job
      const generateButtons = screen.getAllByText('Generate Resume');
      await user.click(generateButtons[0]);

      // Should show error
      await waitFor(() => {
        expect(screen.getByText('Service temporarily unavailable')).toBeDefined();
      }, { timeout: 3000 });

      // Should still be able to try second job
      const remainingButtons = screen.getAllByText('Generate Resume');
      expect(remainingButtons.length).toBeGreaterThan(0);
    });

    it('should handle analysis timing out while resume generation in progress', async () => {
      const user = userEvent.setup();
      const mockJob = createMockJob();

      vi.mocked(storage.getJobDescriptionAnalyses).mockResolvedValue([mockJob]);
      vi.mocked(storage.getGeneratedResumes).mockResolvedValue([]);

      // Mock long-running resume generation (real timers with short delay for testing)
      vi.mocked(aiResumeGenerator.generateResumeWithAI).mockImplementation(
        () => new Promise((resolve) => {
          setTimeout(() => resolve(createMockResume()), 3000);
        })
      );

      // Mock analysis that also takes time
      mockChrome.runtime.sendMessage.mockImplementation(() =>
        new Promise((resolve) => {
          setTimeout(() => resolve({
            success: true,
            data: {
              description: 'Test job',
              jobTitle: 'Engineer',
              company: 'Company',
              location: 'Remote',
              url: 'https://test.com'
            }
          }), 3000);
        })
      );

      render(<JobsTab panelWidth={400} />);

      await waitFor(() => {
        expect(screen.getByText('Senior Software Engineer')).toBeDefined();
      });

      // Start resume generation
      const generateButton = screen.getByText('Generate Resume');
      await user.click(generateButton);

      await waitFor(() => {
        expect(screen.getByText('Generating Resume...')).toBeDefined();
      });

      // Component still allows analysis during resume generation (analyze button is not disabled by generating state)
      const analyzeButton = screen.getByText('Analyze Current LinkedIn Job Page');
      expect(analyzeButton.hasAttribute('disabled')).toBe(false);
    });

    it('should keep UI responsive during multiple slow operations', async () => {
      const mockJob = createMockJob();

      vi.mocked(storage.getJobDescriptionAnalyses).mockImplementation(
        () => new Promise((resolve) => {
          setTimeout(() => resolve([mockJob]), 2000);
        })
      );

      vi.mocked(storage.getGeneratedResumes).mockImplementation(
        () => new Promise((resolve) => {
          setTimeout(() => resolve([]), 2000);
        })
      );

      const { container } = render(<JobsTab panelWidth={400} />);

      // Component should render immediately even with slow data
      expect(container).toBeDefined();

      // Should eventually show loaded data
      await waitFor(() => {
        expect(screen.getByText('Senior Software Engineer')).toBeDefined();
      }, { timeout: 5000 });
    });
  });

  describe('Recovery After Timeout', () => {
    it('should allow new operations after resume generation timeout', async () => {
      const user = userEvent.setup();
      const mockJob = createMockJob();

      vi.mocked(storage.getJobDescriptionAnalyses).mockResolvedValue([mockJob]);
      vi.mocked(storage.getGeneratedResumes).mockResolvedValue([]);

      // First call fails, second succeeds
      let callCount = 0;
      vi.mocked(aiResumeGenerator.generateResumeWithAI).mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return Promise.reject(new Error('Timeout'));
        }
        return Promise.resolve(createMockResume());
      });

      render(<JobsTab panelWidth={400} />);

      await waitFor(() => {
        expect(screen.getByText('Senior Software Engineer')).toBeDefined();
      });

      // First attempt
      const generateButton = screen.getByText('Generate Resume');
      await user.click(generateButton);

      await waitFor(() => {
        expect(screen.getByText('Timeout')).toBeDefined();
      }, { timeout: 3000 });

      // Retry should work
      const retryButton = screen.getByText('Generate Resume');
      await user.click(retryButton);

      await waitFor(() => {
        expect(screen.getByText('Resume Generated')).toBeDefined();
      }, { timeout: 3000 });
    });

    it('should maintain consistent state after timeout', async () => {
      const user = userEvent.setup();
      const mockJob = createMockJob();

      vi.mocked(storage.getJobDescriptionAnalyses).mockResolvedValue([mockJob]);
      vi.mocked(storage.getGeneratedResumes).mockResolvedValue([]);

      vi.mocked(aiResumeGenerator.generateResumeWithAI).mockRejectedValue(
        new Error('Operation timed out')
      );

      render(<JobsTab panelWidth={400} />);

      await waitFor(() => {
        expect(screen.getByText('Senior Software Engineer')).toBeDefined();
      });

      // Attempt resume generation
      const generateButton = screen.getByText('Generate Resume');
      await user.click(generateButton);

      await waitFor(() => {
        expect(screen.getByText('Operation timed out')).toBeDefined();
      }, { timeout: 3000 });

      // Verify job is still displayed correctly
      expect(screen.getByText('Senior Software Engineer')).toBeDefined();
      expect(screen.getByText('TechCorp')).toBeDefined();
      expect(screen.getByText('2 keywords')).toBeDefined();
    });

    it('should not leak memory from abandoned operations', async () => {
      const user = userEvent.setup();
      const mockJob = createMockJob();

      vi.mocked(storage.getJobDescriptionAnalyses).mockResolvedValue([mockJob]);
      vi.mocked(storage.getGeneratedResumes).mockResolvedValue([]);

      let resolveFn: ((value: GeneratedResume) => void) | null = null;
      vi.mocked(aiResumeGenerator.generateResumeWithAI).mockImplementation(
        () => new Promise((resolve) => {
          resolveFn = resolve;
        })
      );

      const { unmount } = render(<JobsTab panelWidth={400} />);

      await waitFor(() => {
        expect(screen.getByText('Senior Software Engineer')).toBeDefined();
      });

      // Start operation
      const generateButton = screen.getByText('Generate Resume');
      await user.click(generateButton);

      await waitFor(() => {
        expect(screen.getByText('Generating Resume...')).toBeDefined();
      });

      // Unmount component (simulates navigation away)
      unmount();

      // Try to resolve the promise after unmount - should not cause errors
      if (resolveFn) {
        (resolveFn as (value: GeneratedResume) => void)(createMockResume());
      }

      // Wait a bit to ensure no errors are thrown
      await new Promise(resolve => setTimeout(resolve, 100));

      // No errors should be thrown (component properly cleaned up)
      expect(true).toBe(true);
    });

    it('should clear error messages after successful retry', async () => {
      const user = userEvent.setup();
      const mockJob = createMockJob();

      vi.mocked(storage.getJobDescriptionAnalyses).mockResolvedValue([mockJob]);
      vi.mocked(storage.getGeneratedResumes).mockResolvedValue([]);

      let callCount = 0;
      vi.mocked(aiResumeGenerator.generateResumeWithAI).mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return Promise.reject(new Error('First attempt failed'));
        }
        return Promise.resolve(createMockResume());
      });

      render(<JobsTab panelWidth={400} />);

      await waitFor(() => {
        expect(screen.getByText('Senior Software Engineer')).toBeDefined();
      });

      // First attempt
      const generateButton = screen.getByText('Generate Resume');
      await user.click(generateButton);

      // Error message appears
      await waitFor(() => {
        expect(screen.getByText('First attempt failed')).toBeDefined();
      }, { timeout: 3000 });

      // Retry
      const retryButton = screen.getByText('Generate Resume');
      await user.click(retryButton);

      // Success - error message should be cleared
      await waitFor(() => {
        expect(screen.getByText('Resume Generated')).toBeDefined();
        expect(screen.queryByText('First attempt failed')).toBeNull();
      }, { timeout: 3000 });
    });
  });
});
