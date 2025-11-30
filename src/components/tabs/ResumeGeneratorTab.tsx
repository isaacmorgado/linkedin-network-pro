/**
 * AI Resume Generator Tab
 * Generate custom, ATS-optimized resumes for specific jobs
 */

import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Copy,
  FileText,
  Target,
  CheckCircle2,
  XCircle,
  ArrowRight,
  Award,
  AlertCircle,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import type {
  JobDescriptionAnalysis,
  ProfessionalProfile,
  GeneratedResume,
  ATSOptimization,
} from '../../types/resume';
import {
  getJobDescriptionAnalyses,
  getProfessionalProfile,
  getGeneratedResumes,
  saveGeneratedResume,
} from '../../utils/storage';
import { calculateATSScore, getATSScoreLevel } from '../../services/ats-optimizer';
import { generateResumeWithAI } from '../../services/ai-resume-generator';

interface ResumeGeneratorTabProps {
  panelWidth?: number;
}

type ViewMode = 'select-job' | 'generating' | 'preview';

export function ResumeGeneratorTab({ panelWidth = 400 }: ResumeGeneratorTabProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('select-job');
  const [jobAnalyses, setJobAnalyses] = useState<JobDescriptionAnalysis[]>([]);
  const [profile, setProfile] = useState<ProfessionalProfile | null>(null);
  const [selectedJob, setSelectedJob] = useState<JobDescriptionAnalysis | null>(null);
  const [generatedResume, setGeneratedResume] = useState<GeneratedResume | null>(null);
  const [savedResumes, setSavedResumes] = useState<GeneratedResume[]>([]);
  const [atsScore, setAtsScore] = useState<ATSOptimization | null>(null);

  const isCompact = panelWidth < 400;

  // Load data
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [jobs, profileData, resumes] = await Promise.all([
      getJobDescriptionAnalyses(),
      getProfessionalProfile(),
      getGeneratedResumes(),
    ]);
    setJobAnalyses(jobs);
    setProfile(profileData);
    setSavedResumes(resumes);
  };

  const handleGenerateResume = async (job: JobDescriptionAnalysis) => {
    if (!profile) {
      alert('Please create your professional profile first!');
      return;
    }

    setSelectedJob(job);
    setViewMode('generating');

    try {
      // Generate resume with AI
      const resume = await generateResumeWithAI(job, profile);
      setGeneratedResume(resume);

      // Calculate ATS score
      const score = calculateATSScore(
        resume.content.formattedText || '',
        job.extractedKeywords.map((k) => k.phrase),
        job.extractedKeywords.map((k) => k.phrase)
      );
      setAtsScore(score);

      setViewMode('preview');
    } catch (error) {
      console.error('[Uproot] Error generating resume:', error);
      alert('Failed to generate resume. Please try again.');
      setViewMode('select-job');
    }
  };

  const handleCopyToClipboard = () => {
    if (!generatedResume?.content.formattedText) return;

    navigator.clipboard.writeText(generatedResume.content.formattedText);
    alert('Resume copied to clipboard!');
  };

  const handleSaveResume = async () => {
    if (!generatedResume) return;

    await saveGeneratedResume(generatedResume);
    await loadData();
    alert('Resume saved!');
  };

  const handleReset = () => {
    setSelectedJob(null);
    setGeneratedResume(null);
    setAtsScore(null);
    setViewMode('select-job');
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        overflow: 'hidden',
        backgroundColor: '#FFFFFF',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: isCompact ? '16px' : '20px',
          borderBottom: '1px solid rgba(0, 0, 0, 0.08)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
          <Sparkles size={20} color="#0077B5" />
          <h2
            style={{
              fontSize: isCompact ? '18px' : '20px',
              fontWeight: '700',
              margin: 0,
              color: '#1d1d1f',
            }}
          >
            AI Resume Generator
          </h2>
        </div>
        <p style={{ fontSize: '13px', color: '#6e6e73', margin: 0 }}>
          Generate custom, ATS-optimized resumes for each job
        </p>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', backgroundColor: '#FAFAFA' }}>
        {viewMode === 'select-job' && (
          <SelectJobView
            jobAnalyses={jobAnalyses}
            savedResumes={savedResumes}
            hasProfile={profile !== null}
            onSelectJob={handleGenerateResume}
            onLoadResume={(resume) => {
              setGeneratedResume(resume);
              setSelectedJob(
                jobAnalyses.find((j) => j.id === resume.jobDescriptionId) || null
              );
              if (resume.atsOptimization) {
                setAtsScore(resume.atsOptimization);
              }
              setViewMode('preview');
            }}
            panelWidth={panelWidth}
          />
        )}

        {viewMode === 'generating' && (
          <GeneratingView jobTitle={selectedJob?.jobTitle || ''} />
        )}

        {viewMode === 'preview' && generatedResume && atsScore && (
          <PreviewView
            resume={generatedResume}
            atsScore={atsScore}
            onCopy={handleCopyToClipboard}
            onSave={handleSaveResume}
            onReset={handleReset}
            panelWidth={panelWidth}
          />
        )}
      </div>
    </div>
  );
}

// ============================================================================
// SELECT JOB VIEW
// ============================================================================

function SelectJobView({
  jobAnalyses,
  savedResumes,
  hasProfile,
  onSelectJob,
  onLoadResume,
  panelWidth,
}: {
  jobAnalyses: JobDescriptionAnalysis[];
  savedResumes: GeneratedResume[];
  hasProfile: boolean;
  onSelectJob: (job: JobDescriptionAnalysis) => void;
  onLoadResume: (resume: GeneratedResume) => void;
  panelWidth: number;
}) {
  const isCompact = panelWidth < 360;

  if (!hasProfile) {
    return (
      <div
        style={{
          padding: '40px',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '16px',
        }}
      >
        <AlertCircle size={48} color="#FF9500" />
        <h3 style={{ fontSize: '18px', fontWeight: '700', margin: 0, color: '#1d1d1f' }}>
          Create Your Profile First
        </h3>
        <p style={{ fontSize: '13px', color: '#6e6e73', margin: 0, maxWidth: '300px' }}>
          Build your professional profile so AI can generate tailored resumes for each job.
        </p>
      </div>
    );
  }

  if (jobAnalyses.length === 0) {
    return (
      <div
        style={{
          padding: '40px',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '16px',
        }}
      >
        <Target size={48} color="#0077B5" />
        <h3 style={{ fontSize: '18px', fontWeight: '700', margin: 0, color: '#1d1d1f' }}>
          Analyze a Job First
        </h3>
        <p style={{ fontSize: '13px', color: '#6e6e73', margin: 0, maxWidth: '300px' }}>
          Go to Job Analyzer and analyze a job description. Then come back here to generate a
          custom resume.
        </p>
      </div>
    );
  }

  return (
    <div style={{ padding: isCompact ? '12px' : '16px' }}>
      {/* Analyzed Jobs */}
      <div style={{ marginBottom: savedResumes.length > 0 ? '24px' : 0 }}>
        <h3
          style={{
            fontSize: '14px',
            fontWeight: '600',
            margin: '0 0 12px 0',
            color: '#1d1d1f',
          }}
        >
          Select Job to Generate Resume
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {jobAnalyses.map((job) => (
            <JobCard key={job.id} job={job} onSelect={() => onSelectJob(job)} />
          ))}
        </div>
      </div>

      {/* Saved Resumes */}
      {savedResumes.length > 0 && (
        <div>
          <h3
            style={{
              fontSize: '14px',
              fontWeight: '600',
              margin: '0 0 12px 0',
              color: '#1d1d1f',
            }}
          >
            Previously Generated ({savedResumes.length})
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {savedResumes.slice(0, 5).map((resume) => (
              <SavedResumeCard
                key={resume.id}
                resume={resume}
                onLoad={() => onLoadResume(resume)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function JobCard({ job, onSelect }: { job: JobDescriptionAnalysis; onSelect: () => void }) {
  const [showKeywords, setShowKeywords] = useState(false);

  return (
    <div
      style={{
        backgroundColor: '#FFFFFF',
        borderRadius: '12px',
        padding: '16px',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
        transition: 'all 150ms',
      }}
    >
      <div
        onClick={onSelect}
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: '12px',
          cursor: 'pointer',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.opacity = '0.8';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.opacity = '1';
        }}
      >
        <div
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '8px',
            backgroundColor: 'rgba(0, 119, 181, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <Sparkles size={20} color="#0077B5" />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h4
            style={{
              fontSize: '15px',
              fontWeight: '600',
              margin: '0 0 4px 0',
              color: '#1d1d1f',
            }}
          >
            {job.jobTitle}
          </h4>
          <p style={{ fontSize: '13px', color: '#6e6e73', margin: '0 0 8px 0' }}>
            {job.company}
          </p>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <Badge label={`${job.extractedKeywords.length} keywords`} color="#0077B5" />
            <Badge label={`${job.requiredSkills.length} required`} color="#FF3B30" />
          </div>
        </div>
        <ArrowRight size={20} color="#0077B5" />
      </div>

      {/* View Keywords Button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          setShowKeywords(!showKeywords);
        }}
        style={{
          marginTop: '12px',
          width: '100%',
          padding: '8px 12px',
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
      >
        {showKeywords ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        {showKeywords ? 'Hide Keywords' : 'View All Keywords'}
      </button>

      {/* Expanded Keywords View */}
      {showKeywords && (
        <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid rgba(0, 0, 0, 0.08)' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {job.extractedKeywords
              .sort((a, b) => b.score - a.score)
              .map((keyword) => (
                <div
                  key={keyword.phrase}
                  style={{
                    padding: '6px 10px',
                    backgroundColor: keyword.required ? '#FF3B3015' : '#FF950015',
                    borderLeft: `3px solid ${keyword.required ? '#FF3B30' : '#FF9500'}`,
                    borderRadius: '6px',
                    fontSize: '11px',
                    fontWeight: '600',
                    color: '#1d1d1f',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                  title={`Weight: ${keyword.score}/100, Frequency: ${keyword.frequency}`}
                >
                  {keyword.phrase}
                  <span style={{ fontSize: '9px', color: '#6e6e73' }}>
                    {Math.round(keyword.score)}
                  </span>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}

function SavedResumeCard({
  resume,
  onLoad,
}: {
  resume: GeneratedResume;
  onLoad: () => void;
}) {
  return (
    <div
      onClick={onLoad}
      style={{
        backgroundColor: '#FFFFFF',
        borderRadius: '8px',
        padding: '12px',
        boxShadow: '0 1px 4px rgba(0, 0, 0, 0.08)',
        cursor: 'pointer',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
        <FileText size={16} color="#34C759" style={{ marginTop: '2px', flexShrink: 0 }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: '13px', fontWeight: '600', color: '#1d1d1f' }}>
            {resume.jobTitle}
          </div>
          <div style={{ fontSize: '11px', color: '#6e6e73' }}>
            {resume.company} • {new Date(resume.generatedAt).toLocaleDateString()}
          </div>
        </div>
        {resume.atsOptimization && (
          <div
            style={{
              padding: '4px 8px',
              backgroundColor: `${getATSScoreLevel(resume.atsOptimization.overallATSScore).color}15`,
              borderRadius: '6px',
              fontSize: '11px',
              fontWeight: '600',
              color: getATSScoreLevel(resume.atsOptimization.overallATSScore).color,
            }}
          >
            {resume.atsOptimization.overallATSScore}%
          </div>
        )}
      </div>
    </div>
  );
}

function Badge({ label, color }: { label: string; color: string }) {
  return (
    <span
      style={{
        padding: '4px 8px',
        backgroundColor: `${color}15`,
        borderRadius: '6px',
        fontSize: '11px',
        fontWeight: '600',
        color,
      }}
    >
      {label}
    </span>
  );
}

// ============================================================================
// GENERATING VIEW
// ============================================================================

function GeneratingView({ jobTitle }: { jobTitle: string }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        padding: '40px',
        textAlign: 'center',
      }}
    >
      <Sparkles size={64} color="#0077B5" className="animate-pulse" />
      <h3
        style={{
          fontSize: '20px',
          fontWeight: '700',
          margin: '24px 0 8px 0',
          color: '#1d1d1f',
        }}
      >
        Generating Your Resume...
      </h3>
      <p style={{ fontSize: '14px', color: '#6e6e73', margin: '0 0 16px 0' }}>
        For: <strong>{jobTitle}</strong>
      </p>
      <div style={{ fontSize: '13px', color: '#6e6e73', lineHeight: '1.8' }}>
        <div>✨ Analyzing job requirements...</div>
        <div>🎯 Selecting relevant experiences...</div>
        <div>📝 Writing custom summary...</div>
        <div>🔍 Optimizing for ATS...</div>
        <div>⚡ Matching keywords...</div>
      </div>
    </div>
  );
}

// ============================================================================
// PREVIEW VIEW
// ============================================================================

function PreviewView({
  resume,
  atsScore,
  onCopy,
  onSave,
  onReset,
  panelWidth,
}: {
  resume: GeneratedResume;
  atsScore: ATSOptimization;
  onCopy: () => void;
  onSave: () => void;
  onReset: () => void;
  panelWidth: number;
}) {
  const [showRecommendations, setShowRecommendations] = useState(true);
  const isCompact = panelWidth < 360;

  const scoreLevel = getATSScoreLevel(atsScore.overallATSScore);

  return (
    <div style={{ padding: isCompact ? '12px' : '16px' }}>
      {/* ATS Score Card */}
      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '12px',
          padding: '16px',
          marginBottom: '16px',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
          <div
            style={{
              width: '60px',
              height: '60px',
              borderRadius: '12px',
              backgroundColor: `${scoreLevel.color}15`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <div
              style={{
                fontSize: '24px',
                fontWeight: '700',
                color: scoreLevel.color,
              }}
            >
              {atsScore.overallATSScore}
            </div>
          </div>
          <div style={{ flex: 1 }}>
            <h3
              style={{
                fontSize: '16px',
                fontWeight: '700',
                margin: '0 0 4px 0',
                color: '#1d1d1f',
              }}
            >
              ATS Score: {scoreLevel.label}
            </h3>
            <p style={{ fontSize: '12px', color: '#6e6e73', margin: 0 }}>
              Keyword Match: {Math.round(atsScore.keywordMatchRate)}% • Density:{' '}
              {atsScore.keywordDensity.toFixed(1)}%
            </p>
          </div>
        </div>

        {/* Quick metrics */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '8px',
          }}
        >
          <Metric
            label="Format"
            value={atsScore.formatCompliance.score}
            icon={
              atsScore.formatCompliance.score >= 80 ? (
                <CheckCircle2 size={12} />
              ) : (
                <XCircle size={12} />
              )
            }
          />
          <Metric
            label="Content"
            value={atsScore.contentQuality.score}
            icon={
              atsScore.contentQuality.score >= 80 ? (
                <CheckCircle2 size={12} />
              ) : (
                <XCircle size={12} />
              )
            }
          />
          <Metric
            label="Keywords"
            value={Math.round(atsScore.keywordMatchRate)}
            icon={
              atsScore.keywordMatchRate >= 75 ? (
                <CheckCircle2 size={12} />
              ) : (
                <AlertCircle size={12} />
              )
            }
          />
        </div>
      </div>

      {/* Recommendations */}
      {atsScore.recommendations.length > 0 && (
        <div
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '12px',
            padding: '16px',
            marginBottom: '16px',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
          }}
        >
          <button
            onClick={() => setShowRecommendations(!showRecommendations)}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'none',
              border: 'none',
              padding: 0,
              cursor: 'pointer',
              marginBottom: showRecommendations ? '12px' : 0,
            }}
          >
            <h4 style={{ fontSize: '14px', fontWeight: '600', margin: 0, color: '#1d1d1f' }}>
              Recommendations ({atsScore.recommendations.length})
            </h4>
            {showRecommendations ? (
              <ChevronUp size={16} color="#6e6e73" />
            ) : (
              <ChevronDown size={16} color="#6e6e73" />
            )}
          </button>
          {showRecommendations && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {atsScore.recommendations.map((rec, i) => (
                <div
                  key={i}
                  style={{
                    fontSize: '12px',
                    color: '#6e6e73',
                    lineHeight: '1.5',
                    paddingLeft: '12px',
                  }}
                >
                  {rec}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Resume Preview */}
      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '12px',
          padding: '16px',
          marginBottom: '16px',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          <h4 style={{ fontSize: '14px', fontWeight: '600', margin: 0, color: '#1d1d1f' }}>
            Resume Preview
          </h4>
          <button
            onClick={onCopy}
            style={{
              padding: '6px 12px',
              backgroundColor: 'rgba(0, 119, 181, 0.1)',
              color: '#0077B5',
              border: 'none',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <Copy size={12} />
            Copy
          </button>
        </div>
        <div
          style={{
            padding: '12px',
            backgroundColor: '#FAFAFA',
            borderRadius: '8px',
            fontSize: '12px',
            fontFamily: 'monospace',
            whiteSpace: 'pre-wrap',
            maxHeight: '300px',
            overflowY: 'auto',
            lineHeight: '1.6',
            color: '#1d1d1f',
          }}
        >
          {resume.content.formattedText || 'Resume content will appear here...'}
        </div>
      </div>

      {/* Action Buttons */}
      <div style={{ display: 'flex', gap: '8px' }}>
        <button
          onClick={onReset}
          style={{
            flex: 1,
            padding: '14px',
            backgroundColor: 'rgba(0, 0, 0, 0.05)',
            border: 'none',
            borderRadius: '12px',
            fontSize: '13px',
            fontWeight: '600',
            cursor: 'pointer',
            color: '#1d1d1f',
          }}
        >
          New Resume
        </button>
        <button
          onClick={onSave}
          style={{
            flex: 1,
            padding: '14px',
            backgroundColor: '#0077B5',
            color: 'white',
            border: 'none',
            borderRadius: '12px',
            fontSize: '13px',
            fontWeight: '600',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
          }}
        >
          <Award size={14} />
          Save Resume
        </button>
      </div>
    </div>
  );
}

function Metric({
  label,
  value,
  icon,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
}) {
  return (
    <div
      style={{
        padding: '8px',
        backgroundColor: 'rgba(0, 0, 0, 0.02)',
        borderRadius: '6px',
        textAlign: 'center',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', marginBottom: '2px' }}>
        {icon}
        <span style={{ fontSize: '14px', fontWeight: '700', color: '#1d1d1f' }}>{value}</span>
      </div>
      <div style={{ fontSize: '9px', color: '#6e6e73', textTransform: 'uppercase' }}>{label}</div>
    </div>
  );
}
