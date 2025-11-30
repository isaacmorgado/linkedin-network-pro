/**
 * Jobs Tab - Analyzed Jobs & Resume Generation
 * Shows jobs analyzed from LinkedIn, generates custom resumes, downloads for Easy Apply
 */

import React, { useState, useEffect } from 'react';
import { Briefcase, FileText, Download, Trash2, Sparkles, Calendar, MapPin, Building2, Check, Loader2, Scan, ChevronUp, ChevronDown } from 'lucide-react';
import type { JobDescriptionAnalysis, GeneratedResume } from '@/types/resume';
import { getJobDescriptionAnalyses, deleteJobDescriptionAnalysis, getGeneratedResumes, saveGeneratedResume, saveJobDescriptionAnalysis } from '@/utils/storage';
import { generateResumeWithAI } from '@/services/ai-resume-generator';
import { getProfessionalProfile } from '@/utils/storage';
import { extractKeywordsFromJobDescription, categorizeJobRequirements } from '@/services/keyword-extractor';

interface JobsTabProps {
  panelWidth?: number;
}

export function JobsTab({ panelWidth: _panelWidth = 400 }: JobsTabProps) {
  const [jobs, setJobs] = useState<JobDescriptionAnalysis[]>([]);
  const [resumes, setResumes] = useState<GeneratedResume[]>([]);
  const [selectedJob, setSelectedJob] = useState<JobDescriptionAnalysis | null>(null);
  const [generatedResume, setGeneratedResume] = useState<GeneratedResume | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [jobsData, resumesData] = await Promise.all([
        getJobDescriptionAnalyses(),
        getGeneratedResumes(),
      ]);

      // Sort by date (newest first)
      jobsData.sort((a, b) => b.analyzedAt - a.analyzedAt);
      resumesData.sort((a, b) => b.generatedAt - a.generatedAt);

      setJobs(jobsData);
      setResumes(resumesData);
    } catch (err) {
      console.error('[Uproot] Error loading jobs:', err);
      setError('Failed to load jobs');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateResume = async (job: JobDescriptionAnalysis) => {
    try {
      setGenerating(true);
      setError('');

      // Get profile
      const profile = await getProfessionalProfile();
      if (!profile) {
        throw new Error('Please build your professional profile first');
      }

      console.log('[Uproot] Generating resume for:', job.jobTitle);

      // Generate resume
      const resume = await generateResumeWithAI(job, profile);

      // Save resume
      await saveGeneratedResume(resume);

      setGeneratedResume(resume);
      setResumes([resume, ...resumes]);

      console.log('[Uproot] Resume generated successfully');
    } catch (err) {
      console.error('[Uproot] Error generating resume:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate resume');
    } finally {
      setGenerating(false);
    }
  };

  const handleDeleteJob = async (id: string) => {
    try {
      await deleteJobDescriptionAnalysis(id);
      setJobs(jobs.filter((j) => j.id !== id));

      if (selectedJob?.id === id) {
        setSelectedJob(null);
        setGeneratedResume(null);
      }
    } catch (err) {
      console.error('[Uproot] Error deleting job:', err);
    }
  };

  const handleDownloadPDF = async (_resume: GeneratedResume) => {
    // TODO: Implement PDF generation
    alert('PDF export coming in v0.2.0! For now, use Copy to Clipboard.');
  };

  const handleDownloadDOCX = async (_resume: GeneratedResume) => {
    // TODO: Implement DOCX generation
    alert('DOCX export coming in v0.2.0! For now, use Copy to Clipboard.');
  };

  const handleCopyToClipboard = (resume: GeneratedResume) => {
    if (!resume.content.formattedText) return;
    navigator.clipboard.writeText(resume.content.formattedText);
    alert('Resume copied to clipboard!');
  };

  const handleAnalyzeCurrentPage = async () => {
    try {
      setAnalyzing(true);
      setError('');
      setSuccess('');

      console.log('[Uproot] Requesting job analysis from background script...');

      // Send message to background script with 35-second timeout to prevent infinite spinning
      // UI Layer: 35s (outermost, gives buffer for lower layers to timeout first)
      const response = await Promise.race([
        chrome.runtime.sendMessage({ type: 'ANALYZE_CURRENT_JOB' }),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Job analysis timed out after 35 seconds. Please try again.')), 35000)
        )
      ]);

      if (!response.success) {
        throw new Error(response.error || 'Failed to analyze job');
      }

      console.log('[Uproot] Received job data:', response.data);

      // Validate response data to prevent undefined values from propagating (Bug #5 fix)
      if (!response.data || typeof response.data !== 'object') {
        throw new Error('Invalid response: Missing or invalid response data');
      }

      // Validate required fields
      const { description, jobTitle, company, location, url } = response.data;

      if (!description || typeof description !== 'string' || description.trim().length === 0) {
        throw new Error('Invalid response: Job description is required and must be a non-empty string');
      }

      if (!jobTitle || typeof jobTitle !== 'string' || jobTitle.trim().length === 0) {
        throw new Error('Invalid response: Job title is required and must be a non-empty string');
      }

      if (!company || typeof company !== 'string' || company.trim().length === 0) {
        throw new Error('Invalid response: Company name is required and must be a non-empty string');
      }

      // Extract keywords and requirements (now safe - description is validated)
      const keywords = extractKeywordsFromJobDescription(description);
      const requirements = categorizeJobRequirements(description);

      // Create job analysis (using validated fields)
      const jobAnalysis: JobDescriptionAnalysis = {
        id: `job_${Date.now()}`,
        rawText: description,
        jobTitle: jobTitle,
        company: company,
        location: location, // Optional field
        jobUrl: url, // Optional field
        extractedKeywords: keywords,
        requiredSkills: requirements.required,
        preferredSkills: requirements.preferred,
        requiredExperience: [],
        preferredExperience: [],
        analyzedAt: Date.now(),
      };

      // Save to storage
      await saveJobDescriptionAnalysis(jobAnalysis);

      // Update UI
      setJobs([jobAnalysis, ...jobs]);
      setSuccess(`✓ Job analyzed: ${jobAnalysis.jobTitle} at ${jobAnalysis.company}`);

      console.log('[Uproot] Job saved successfully');

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);

    } catch (err) {
      console.error('[Uproot] Error analyzing job:', err);

      // Provide more helpful error messages based on error type
      let errorMessage = 'Failed to analyze job';

      if (err instanceof Error) {
        if (err.message.includes('Job details failed to load within timeout')) {
          errorMessage = 'Job details are taking too long to load. This might be due to:\n' +
            '• Slow internet connection\n' +
            '• LinkedIn page still loading\n' +
            '• LinkedIn changed their page structure\n\n' +
            'Try: Wait a few seconds for the page to fully load, then click Analyze again.';
        } else if (err.message.includes('timed out after 35 seconds')) {
          errorMessage = 'Analysis timed out. The job page may be slow to respond.\n\n' +
            'Try: Refresh the LinkedIn page and try again.';
        } else if (err.message.includes('Invalid response')) {
          errorMessage = 'Unable to extract job information from this page.\n\n' +
            'Make sure you\'re on a LinkedIn job posting page and the job description is visible.';
        } else {
          errorMessage = err.message;
        }
      }

      setError(errorMessage);
    } finally {
      setAnalyzing(false);
    }
  };

  const getATSScoreStyle = (score: number) => {
    if (score >= 80) return { color: '#059669', backgroundColor: '#ecfdf5' };
    if (score >= 65) return { color: '#0077B5', backgroundColor: '#eff6ff' };
    if (score >= 50) return { color: '#ea580c', backgroundColor: '#fff7ed' };
    return { color: '#dc2626', backgroundColor: '#fef2f2' };
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  if (loading) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          color: '#6e6e73',
        }}
      >
        <Loader2 size={24} strokeWidth={2} style={{ animation: 'spin 1s linear infinite' }} />
        <style>
          {`
            @keyframes spin {
              from { transform: rotate(0deg); }
              to { transform: rotate(360deg); }
            }
          `}
        </style>
      </div>
    );
  }

  if (jobs.length === 0) {
    return (
      <>
        {/* Global keyframes for spin animation */}
        <style>
          {`
            @keyframes spin {
              from { transform: rotate(0deg); }
              to { transform: rotate(360deg); }
            }
          `}
        </style>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            overflow: 'auto',
          }}
        >
        {/* Header */}
        <div
          style={{
            padding: '20px 20px 16px 20px',
            borderBottom: '1px solid rgba(0, 0, 0, 0.08)',
          }}
        >
          <h2
            style={{
              fontSize: '20px',
              fontWeight: '700',
              margin: 0,
              color: '#1d1d1f',
            }}
          >
            Your Jobs
          </h2>
        </div>

        {/* Content */}
        <div style={{ flex: 1, padding: '20px', overflow: 'auto' }}>
          {/* Analyze Button */}
          <button
            onClick={handleAnalyzeCurrentPage}
            disabled={analyzing}
            style={{
              width: '100%',
              padding: '14px 20px',
              background: analyzing ? '#9ca3af' : '#0077B5',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: analyzing ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              transition: 'background 0.2s, transform 0.1s',
              marginBottom: '16px',
            }}
            onMouseEnter={(e) => {
              if (!analyzing) {
                e.currentTarget.style.background = '#006399';
                e.currentTarget.style.transform = 'translateY(-1px)';
              }
            }}
            onMouseLeave={(e) => {
              if (!analyzing) {
                e.currentTarget.style.background = '#0077B5';
                e.currentTarget.style.transform = 'translateY(0)';
              }
            }}
          >
            {analyzing ? (
              <>
                <Loader2 size={18} strokeWidth={2} style={{ animation: 'spin 1s linear infinite' }} />
                <span>Analyzing Job...</span>
              </>
            ) : (
              <>
                <Scan size={18} strokeWidth={2} />
                <span>Analyze Current LinkedIn Job Page</span>
              </>
            )}
          </button>

          {/* Error/Success Messages */}
          {error && (
            <div
              style={{
                padding: '12px 16px',
                backgroundColor: '#fef2f2',
                border: '1px solid #fecaca',
                borderRadius: '8px',
                fontSize: '13px',
                color: '#dc2626',
                marginBottom: '16px',
              }}
            >
              {error}
            </div>
          )}
          {success && (
            <div
              style={{
                padding: '12px 16px',
                backgroundColor: '#ecfdf5',
                border: '1px solid #a7f3d0',
                borderRadius: '8px',
                fontSize: '13px',
                color: '#059669',
                marginBottom: '16px',
              }}
            >
              {success}
            </div>
          )}

          {/* Empty State */}
          <div
            style={{
              textAlign: 'center',
              paddingTop: '48px',
              paddingBottom: '48px',
            }}
          >
            <Briefcase
              size={48}
              strokeWidth={1.5}
              style={{
                color: '#d1d5db',
                margin: '0 auto 16px auto',
              }}
            />
            <h3
              style={{
                fontSize: '14px',
                fontWeight: '600',
                margin: '0 0 8px 0',
                color: '#1d1d1f',
              }}
            >
              No jobs analyzed yet
            </h3>
            <p
              style={{
                fontSize: '13px',
                color: '#6e6e73',
                margin: '0 0 8px 0',
                lineHeight: '1.5',
              }}
            >
              Navigate to a LinkedIn job page and click "Analyze Current LinkedIn Job Page" above
            </p>
            <p
              style={{
                fontSize: '12px',
                color: '#9ca3af',
                margin: 0,
                lineHeight: '1.4',
              }}
            >
              The extension will extract job requirements and keywords to generate custom resumes
            </p>
          </div>
        </div>
      </div>
      </>
    );
  }

  return (
    <>
      {/* Global keyframes for spin animation */}
      <style>
        {`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}
      </style>

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          overflow: 'hidden',
        }}
      >
      {/* Header */}
      <div
        style={{
          padding: '20px 20px 16px 20px',
          borderBottom: '1px solid rgba(0, 0, 0, 0.08)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
          <h2
            style={{
              fontSize: '20px',
              fontWeight: '700',
              margin: 0,
              color: '#1d1d1f',
            }}
          >
            Your Jobs
          </h2>
          <div
            style={{
              fontSize: '12px',
              color: '#6e6e73',
            }}
          >
            {jobs.length} analyzed
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, padding: '20px', overflow: 'auto' }}>
        {/* Analyze Button */}
        <button
          onClick={handleAnalyzeCurrentPage}
          disabled={analyzing}
          style={{
            width: '100%',
            padding: '14px 20px',
            background: analyzing ? '#9ca3af' : '#0077B5',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: '600',
            cursor: analyzing ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
            transition: 'background 0.2s, transform 0.1s',
            marginBottom: '16px',
          }}
          onMouseEnter={(e) => {
            if (!analyzing) {
              e.currentTarget.style.background = '#006399';
              e.currentTarget.style.transform = 'translateY(-1px)';
            }
          }}
          onMouseLeave={(e) => {
            if (!analyzing) {
              e.currentTarget.style.background = '#0077B5';
              e.currentTarget.style.transform = 'translateY(0)';
            }
          }}
        >
          {analyzing ? (
            <>
              <Loader2 size={18} strokeWidth={2} style={{ animation: 'spin 1s linear infinite' }} />
              <span>Analyzing Job...</span>
            </>
          ) : (
            <>
              <Scan size={18} strokeWidth={2} />
              <span>Analyze Current LinkedIn Job Page</span>
            </>
          )}
        </button>

        {/* Error/Success Messages */}
        {error && (
          <div
            style={{
              padding: '12px 16px',
              backgroundColor: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: '8px',
              fontSize: '13px',
              color: '#dc2626',
              marginBottom: '16px',
            }}
          >
            {error}
          </div>
        )}
        {success && (
          <div
            style={{
              padding: '12px 16px',
              backgroundColor: '#ecfdf5',
              border: '1px solid #a7f3d0',
              borderRadius: '8px',
              fontSize: '13px',
              color: '#059669',
              marginBottom: '16px',
            }}
          >
            {success}
          </div>
        )}

        {/* Jobs List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {jobs.map((job) => {
            const existingResume = resumes.find((r) => r.jobDescriptionId === job.id);
            const isSelected = selectedJob?.id === job.id;

            return (
              <JobCard
                key={job.id}
                job={job}
                existingResume={existingResume}
                isSelected={isSelected}
                generating={generating}
                onSelect={() => {
                  setSelectedJob(job);
                  if (existingResume) {
                    setGeneratedResume(existingResume);
                  } else {
                    setGeneratedResume(null);
                  }
                }}
                onDelete={(e) => {
                  e.stopPropagation();
                  handleDeleteJob(job.id);
                }}
                onGenerateResume={(e) => {
                  e.stopPropagation();
                  handleGenerateResume(job);
                }}
                getATSScoreStyle={getATSScoreStyle}
                formatDate={formatDate}
              />
            );
          })}
        </div>

        {/* Resume Detail Panel */}
        {selectedJob && generatedResume && (
          <div
            style={{
              marginTop: '16px',
              paddingTop: '16px',
              borderTop: '1px solid rgba(0, 0, 0, 0.08)',
            }}
          >
            <div
              style={{
                backgroundColor: 'white',
                border: '1px solid rgba(0, 0, 0, 0.08)',
                borderRadius: '8px',
                padding: '16px',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '16px',
                }}
              >
                <h3
                  style={{
                    fontSize: '16px',
                    fontWeight: '700',
                    margin: 0,
                    color: '#1d1d1f',
                  }}
                >
                  Generated Resume
                </h3>
                <div
                  style={{
                    fontSize: '13px',
                    padding: '6px 12px',
                    borderRadius: '8px',
                    fontWeight: '600',
                    ...getATSScoreStyle(generatedResume.atsOptimization.overallATSScore),
                  }}
                >
                  ATS Score: {generatedResume.atsOptimization.overallATSScore}/100
                </div>
              </div>

              {/* ATS Breakdown */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr 1fr',
                  gap: '12px',
                  marginBottom: '16px',
                }}
              >
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '12px', color: '#6e6e73', marginBottom: '4px' }}>
                    Keyword Match
                  </div>
                  <div style={{ fontSize: '20px', fontWeight: '700', color: '#1d1d1f' }}>
                    {generatedResume.atsOptimization.keywordMatchRate}%
                  </div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '12px', color: '#6e6e73', marginBottom: '4px' }}>Format</div>
                  <div style={{ fontSize: '20px', fontWeight: '700', color: '#1d1d1f' }}>
                    {generatedResume.atsOptimization.formatCompliance.score}%
                  </div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '12px', color: '#6e6e73', marginBottom: '4px' }}>Content</div>
                  <div style={{ fontSize: '20px', fontWeight: '700', color: '#1d1d1f' }}>
                    {generatedResume.atsOptimization.contentQuality.score}%
                  </div>
                </div>
              </div>

              {/* Download Buttons */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <button
                  onClick={() => handleDownloadPDF(generatedResume)}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    background: '#0077B5',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '10px',
                    transition: 'background 0.2s, transform 0.1s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#006399';
                    e.currentTarget.style.transform = 'translateY(-1px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = '#0077B5';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  <Download size={16} strokeWidth={2} />
                  <span>Download as PDF (for Easy Apply)</span>
                </button>

                <button
                  onClick={() => handleDownloadDOCX(generatedResume)}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    background: '#059669',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '10px',
                    transition: 'background 0.2s, transform 0.1s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#047857';
                    e.currentTarget.style.transform = 'translateY(-1px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = '#059669';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  <Download size={16} strokeWidth={2} />
                  <span>Download as DOCX (for Easy Apply)</span>
                </button>

                <button
                  onClick={() => handleCopyToClipboard(generatedResume)}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    background: 'white',
                    color: '#1d1d1f',
                    border: '1px solid rgba(0, 0, 0, 0.12)',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '10px',
                    transition: 'background 0.2s, border-color 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#f9fafb';
                    e.currentTarget.style.borderColor = 'rgba(0, 0, 0, 0.16)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'white';
                    e.currentTarget.style.borderColor = 'rgba(0, 0, 0, 0.12)';
                  }}
                >
                  <FileText size={16} strokeWidth={2} />
                  <span>Copy to Clipboard</span>
                </button>
              </div>

              {/* Recommendations */}
              {generatedResume.atsOptimization.recommendations.length > 0 && (
                <div
                  style={{
                    marginTop: '16px',
                    paddingTop: '16px',
                    borderTop: '1px solid rgba(0, 0, 0, 0.08)',
                  }}
                >
                  <h4
                    style={{
                      fontSize: '12px',
                      fontWeight: '700',
                      color: '#6e6e73',
                      margin: '0 0 8px 0',
                    }}
                  >
                    Recommendations
                  </h4>
                  <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {generatedResume.atsOptimization.recommendations.slice(0, 3).map((rec, i) => (
                      <li
                        key={i}
                        style={{
                          fontSize: '12px',
                          color: '#6e6e73',
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: '8px',
                        }}
                      >
                        <span style={{ color: '#0077B5', marginTop: '2px' }}>•</span>
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
    </>
  );
}

// Job Card Component
interface JobCardProps {
  job: JobDescriptionAnalysis;
  existingResume: GeneratedResume | undefined;
  isSelected: boolean;
  generating: boolean;
  onSelect: () => void;
  onDelete: (e: React.MouseEvent) => void;
  onGenerateResume: (e: React.MouseEvent) => void;
  getATSScoreStyle: (score: number) => { color: string; backgroundColor: string };
  formatDate: (timestamp: number) => string;
}

function JobCard({
  job,
  existingResume,
  isSelected,
  generating,
  onSelect,
  onDelete,
  onGenerateResume,
  getATSScoreStyle,
  formatDate,
}: JobCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [showKeywords, setShowKeywords] = useState(false);

  return (
    <div
      style={{
        padding: '16px',
        borderRadius: '12px',
        border: isSelected ? '1px solid #0077B5' : '1px solid rgba(0, 0, 0, 0.08)',
        backgroundColor: isSelected ? 'rgba(0, 119, 181, 0.03)' : 'white',
        boxShadow: isHovered && !isSelected ? '0 4px 12px rgba(0, 0, 0, 0.08)' : '0 2px 4px rgba(0, 0, 0, 0.04)',
        cursor: 'pointer',
        transition: 'all 200ms cubic-bezier(0.4, 0.0, 0.2, 1)',
        transform: isHovered && !isSelected ? 'translateY(-2px)' : 'translateY(0)',
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Job Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '8px' }}>
        <div style={{ flex: 1 }}>
          <h3
            style={{
              fontSize: '15px',
              fontWeight: '600',
              margin: '0 0 6px 0',
              color: '#1d1d1f',
            }}
          >
            {job.jobTitle}
          </h3>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '13px',
              color: '#6e6e73',
              marginBottom: '8px',
            }}
          >
            <Building2 size={12} strokeWidth={2} />
            <span>{job.company}</span>
            {job.location && (
              <>
                <MapPin size={12} strokeWidth={2} style={{ marginLeft: '4px' }} />
                <span>{job.location}</span>
              </>
            )}
          </div>
        </div>

        <button
          onClick={onDelete}
          style={{
            padding: '8px',
            background: 'transparent',
            border: 'none',
            borderRadius: '6px',
            color: '#9ca3af',
            cursor: 'pointer',
            transition: 'all 150ms',
          }}
          title="Delete job"
          onMouseEnter={(e) => {
            e.currentTarget.style.color = '#dc2626';
            e.currentTarget.style.backgroundColor = '#fef2f2';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = '#9ca3af';
            e.currentTarget.style.backgroundColor = 'transparent';
          }}
        >
          <Trash2 size={16} strokeWidth={2} />
        </button>
      </div>

      {/* Job Stats */}
      <div
        onClick={onSelect}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          fontSize: '12px',
          color: '#6e6e73',
          marginBottom: '12px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <Sparkles size={12} strokeWidth={2} />
          <span>{job.extractedKeywords.length} keywords</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <Calendar size={12} strokeWidth={2} />
          <span>{formatDate(job.analyzedAt)}</span>
        </div>
      </div>

      {/* View Keywords Button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          setShowKeywords(!showKeywords);
        }}
        style={{
          width: '100%',
          padding: '8px 12px',
          marginBottom: '12px',
          backgroundColor: 'transparent',
          border: '1px solid #0077B5',
          borderRadius: '6px',
          fontSize: '12px',
          fontWeight: '600',
          color: '#0077B5',
          cursor: 'pointer',
          transition: 'all 150ms',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '6px',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = 'rgba(0, 119, 181, 0.05)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'transparent';
        }}
      >
        {showKeywords ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        {showKeywords ? 'Hide Keywords' : 'View All Keywords'}
      </button>

      {/* Expanded Keywords View */}
      {showKeywords && (
        <div style={{ marginBottom: '12px', paddingBottom: '12px', borderBottom: '1px solid rgba(0, 0, 0, 0.08)' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {(() => {
              // Get min/max scores for color gradient
              const sortedKeywords = job.extractedKeywords.sort((a, b) => b.score - a.score);
              const scores = sortedKeywords.map(k => k.score || 0);
              const minScore = Math.min(...scores);
              const maxScore = Math.max(...scores);

              // Helper: Calculate color from green (high) to red (low)
              const getColorForScore = (score: number): { bg: string; border: string } => {
                if (maxScore === minScore) {
                  return { bg: '#34C75915', border: '#34C759' }; // All same score = green
                }

                // Normalize score to 0-1 scale
                const normalized = (score - minScore) / (maxScore - minScore);

                // Green (high) = hsl(120, 70%, 50%)
                // Yellow (mid) = hsl(60, 70%, 50%)
                // Red (low) = hsl(0, 70%, 50%)
                const hue = normalized * 120; // 0 (red) to 120 (green)

                return {
                  bg: `hsl(${hue}, 70%, 95%)`,
                  border: `hsl(${hue}, 70%, 45%)`,
                };
              };

              return sortedKeywords.map((keyword) => {
                const score = keyword.score || 0;
                const colors = getColorForScore(score);

                return (
                  <div
                    key={keyword.phrase}
                    style={{
                      padding: '6px 10px',
                      backgroundColor: colors.bg,
                      borderLeft: `3px solid ${colors.border}`,
                      borderRadius: '6px',
                      fontSize: '11px',
                      fontWeight: '600',
                      color: '#1d1d1f',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                    title={`Score: ${Math.round(score)} (${keyword.required ? 'Required' : 'Preferred'})`}
                  >
                    {keyword.phrase}
                    <span style={{ fontSize: '9px', color: '#6e6e73' }}>
                      {Math.round(score)}
                    </span>
                  </div>
                );
              });
            })()}
          </div>
        </div>
      )}

      {/* Resume Status */}
      {existingResume ? (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingTop: '12px',
            borderTop: '1px solid rgba(0, 0, 0, 0.08)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Check size={16} strokeWidth={2} style={{ color: '#059669' }} />
            <span style={{ fontSize: '13px', color: '#059669', fontWeight: '600' }}>
              Resume Generated
            </span>
            <div
              style={{
                fontSize: '12px',
                padding: '4px 8px',
                borderRadius: '6px',
                fontWeight: '600',
                ...getATSScoreStyle(existingResume.atsOptimization.overallATSScore),
              }}
            >
              ATS: {existingResume.atsOptimization.overallATSScore}
            </div>
          </div>
        </div>
      ) : (
        <button
          onClick={onGenerateResume}
          disabled={generating}
          style={{
            width: '100%',
            marginTop: '12px',
            paddingTop: '12px',
            borderTop: '1px solid rgba(0, 0, 0, 0.08)',
            background: 'rgba(0, 119, 181, 0.05)',
            border: 'none',
            borderRadius: '6px',
            padding: '10px 16px',
            fontSize: '13px',
            fontWeight: '600',
            color: generating ? '#9ca3af' : '#0077B5',
            cursor: generating ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            transition: 'all 150ms',
          }}
          onMouseEnter={(e) => {
            if (!generating) {
              e.currentTarget.style.backgroundColor = 'rgba(0, 119, 181, 0.1)';
            }
          }}
          onMouseLeave={(e) => {
            if (!generating) {
              e.currentTarget.style.backgroundColor = 'rgba(0, 119, 181, 0.05)';
            }
          }}
        >
          {generating ? (
            <>
              <Loader2 size={16} strokeWidth={2} style={{ animation: 'spin 1s linear infinite' }} />
              <span>Generating Resume...</span>
            </>
          ) : (
            <>
              <FileText size={16} strokeWidth={2} />
              <span>Generate Resume</span>
            </>
          )}
        </button>
      )}
    </div>
  );
}
