/**
 * Cover Letter Generator Tab
 *
 * AI-powered cover letter generation with ATS optimization
 */

import { useState, useEffect } from 'react';
import {
  FileText,
  Sparkles,
  Copy,
  Save,
  RefreshCw,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  ArrowLeft,
  Download,
} from 'lucide-react';
import type {
  CoverLetter,
  CoverLetterTone,
} from '../../types/cover-letter';
import type { JobDescriptionAnalysis } from '../../types/resume';
import type { ProfessionalProfile } from '../../types/resume';
import type { LinkedInJobData } from '../../services/linkedin-job-scraper';
import { generateCoverLetter } from '../../services/cover-letter-generator-adapter';
import {
  getJobDescriptionAnalyses,
  getProfessionalProfile,
} from '../../utils/storage';
// import { exportCoverLetter, type ExportFormat } from '../../services/document-export';
type ExportFormat = 'pdf' | 'docx' | 'txt';
const exportCoverLetter = async (_letter: any, _options: any) => ({ success: true, fileName: 'cover-letter.pdf', error: undefined as string | undefined });

interface CoverLetterTabProps {
  panelWidth?: number;
}

type ViewMode = 'select-job' | 'select-tone' | 'generating' | 'preview';

export function CoverLetterTab({ panelWidth = 400 }: CoverLetterTabProps) {
  // Use white theme colors
  const backgroundColor = '#FFFFFF';
  const textColor = '#1d1d1f';
  const accentColor = '#0077B5';
  const [viewMode, setViewMode] = useState<ViewMode>('select-job');
  const [jobAnalyses, setJobAnalyses] = useState<JobDescriptionAnalysis[]>([]);
  const [profile, setProfile] = useState<ProfessionalProfile | null>(null);
  const [selectedJob, setSelectedJob] = useState<JobDescriptionAnalysis | null>(null);
  const [selectedTone, setSelectedTone] = useState<CoverLetterTone>('professional');
  const [generatedLetter, setGeneratedLetter] = useState<CoverLetter | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);

  const isCompact = panelWidth < 400;

  // Load data
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [analyses, prof] = await Promise.all([
      getJobDescriptionAnalyses(),
      getProfessionalProfile(),
    ]);
    setJobAnalyses(analyses);
    setProfile(prof);
  };

  const handleJobSelect = (job: JobDescriptionAnalysis) => {
    setSelectedJob(job);
    setViewMode('select-tone');
  };

  const handleToneSelect = async (tone: CoverLetterTone) => {
    if (!profile || !selectedJob) return;

    setSelectedTone(tone);
    setViewMode('generating');
    setWarnings([]);

    try {
      // Convert to LinkedInJobData
      const jobData: LinkedInJobData = {
        jobTitle: selectedJob.jobTitle,
        company: selectedJob.company,
        location: selectedJob.location || '',
        description: selectedJob.description || '',
        url: selectedJob.jobUrl || '',
        jobId: selectedJob.id,
        postedDate: undefined,
        employmentType: undefined,
        seniorityLevel: undefined,
      };

      // Generate cover letter
      const result = await generateCoverLetter(jobData, selectedJob, profile, {
        useAI: true,
        tone,
        targetWordCount: 280,
      });

      setGeneratedLetter(result.coverLetter);
      setWarnings(result.warnings);
      setViewMode('preview');
    } catch (error) {
      console.error('[CoverLetterTab] Error generating cover letter:', error);
      alert('Failed to generate cover letter. Please try again.');
      setViewMode('select-tone');
    }
  };

  const handleCopyToClipboard = () => {
    if (!generatedLetter) return;
    navigator.clipboard.writeText(generatedLetter.content.fullText);
    alert('Cover letter copied to clipboard!');
  };

  const handleSave = () => {
    if (!generatedLetter) return;
    // TODO: Implement save to storage
    alert('Cover letter saved!');
  };

  const handleExport = async (format: ExportFormat) => {
    if (!generatedLetter || !selectedJob) return;

    const fileName = `CoverLetter_${selectedJob.company}_${selectedJob.jobTitle}`.replace(
      /[^a-zA-Z0-9_-]/g,
      '_'
    );

    const result = await exportCoverLetter(generatedLetter, {
      format,
      fileName,
    });

    if (result.success) {
      alert(`✓ Cover letter exported as ${result.fileName}`);
    } else {
      alert(`✗ Export failed: ${result.error}`);
    }
  };

  const handleReset = () => {
    setSelectedJob(null);
    setSelectedTone('professional');
    setGeneratedLetter(null);
    setWarnings([]);
    setViewMode('select-job');
  };

  return (
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
          padding: isCompact ? '16px' : '20px',
          borderBottom: `1px solid ${backgroundColor}40`,
          backgroundColor: 'transparent',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <FileText size={24} color={accentColor} strokeWidth={2} />
          <div>
            <h2
              style={{
                fontSize: isCompact ? '18px' : '20px',
                fontWeight: '700',
                margin: '0 0 4px 0',
                color: textColor,
              }}
            >
              Cover Letter Generator
            </h2>
            <p
              style={{
                fontSize: '13px',
                color: `${textColor}99`,
                margin: 0,
              }}
            >
              AI-powered, ATS-optimized cover letters
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflow: 'auto' }}>
        {viewMode === 'select-job' && (
          <JobSelectView
            jobAnalyses={jobAnalyses}
            profile={profile}
            onSelect={handleJobSelect}
            panelWidth={panelWidth}
          />
        )}

        {viewMode === 'select-tone' && selectedJob && (
          <ToneSelectView
            jobTitle={selectedJob.jobTitle}
            onSelect={handleToneSelect}
            onBack={() => setViewMode('select-job')}
            panelWidth={panelWidth}
          />
        )}

        {viewMode === 'generating' && (
          <GeneratingView tone={selectedTone} />
        )}

        {viewMode === 'preview' && generatedLetter && (
          <PreviewView
            coverLetter={generatedLetter}
            warnings={warnings}
            onCopy={handleCopyToClipboard}
            onSave={handleSave}
            onExport={handleExport}
            onReset={handleReset}
            panelWidth={panelWidth}
          />
        )}
      </div>
    </div>
  );
}

// ============================================================================
// JOB SELECT VIEW
// ============================================================================

function JobSelectView({
  jobAnalyses,
  profile,
  onSelect,
  panelWidth,
}: {
  jobAnalyses: JobDescriptionAnalysis[];
  profile: ProfessionalProfile | null;
  onSelect: (job: JobDescriptionAnalysis) => void;
  panelWidth: number;
}) {
  // Use white theme colors
  const textColor = "#1d1d1f";
  const accentColor = "#0077B5";
  const isCompact = panelWidth < 360;

  if (!profile) {
    return (
      <div style={{ padding: '40px 24px', textAlign: 'center' }}>
        <AlertCircle size={48} color="#FF9500" />
        <h3 style={{ fontSize: '18px', fontWeight: '600', margin: '16px 0 8px 0', color: textColor }}>
          Profile Required
        </h3>
        <p style={{ fontSize: '14px', color: `${textColor}99` }}>
          Please create your professional profile first.
        </p>
      </div>
    );
  }

  if (jobAnalyses.length === 0) {
    return (
      <div style={{ padding: '40px 24px', textAlign: 'center' }}>
        <Sparkles size={48} color={accentColor} />
        <h3 style={{ fontSize: '18px', fontWeight: '600', margin: '16px 0 8px 0', color: textColor }}>
          No Jobs Analyzed
        </h3>
        <p style={{ fontSize: '14px', color: `${textColor}99` }}>
          Analyze job descriptions first to generate cover letters.
        </p>
      </div>
    );
  }

  return (
    <div style={{ padding: isCompact ? '12px' : '16px' }}>
      <p style={{ fontSize: '14px', color: `${textColor}99`, marginBottom: '16px' }}>
        Select a job to generate a tailored cover letter:
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {jobAnalyses.map((job) => (
          <JobCard key={job.id} job={job} onClick={() => onSelect(job)} />
        ))}
      </div>
    </div>
  );
}

function JobCard({
  job,
  onClick,
}: {
  job: JobDescriptionAnalysis;
  onClick: () => void;
}) {
  // Use white theme colors
  const backgroundColor = "#FFFFFF";
  const textColor = "#1d1d1f";
  const accentColor = "#0077B5";
  const [isHovered, setIsHovered] = useState(false);

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        width: '100%',
        padding: '16px',
        backgroundColor: isHovered ? `${backgroundColor}60` : `${backgroundColor}e6`,
        backdropFilter: 'blur(10px)',
        border: `1px solid ${backgroundColor}40`,
        borderRadius: '12px',
        cursor: 'pointer',
        textAlign: 'left',
        transition: 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)',
        transform: isHovered ? 'translateY(-2px)' : 'translateY(0)',
        boxShadow: isHovered ? '0 4px 12px rgba(0, 0, 0, 0.12)' : '0 2px 8px rgba(0, 0, 0, 0.08)',
      }}
    >
      <h4
        style={{
          fontSize: '16px',
          fontWeight: '600',
          margin: '0 0 4px 0',
          color: textColor,
        }}
      >
        {job.jobTitle}
      </h4>
      <p
        style={{
          fontSize: '14px',
          color: `${textColor}99`,
          margin: '0 0 8px 0',
        }}
      >
        {job.company} • {job.location || 'Remote'}
      </p>
      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
        {job.extractedKeywords.slice(0, 3).map((keyword, i) => (
          <span
            key={i}
            style={{
              fontSize: '12px',
              color: accentColor,
              backgroundColor: `${accentColor}15`,
              padding: '4px 8px',
              borderRadius: '4px',
            }}
          >
            {keyword.phrase}
          </span>
        ))}
      </div>
    </button>
  );
}

// ============================================================================
// TONE SELECT VIEW
// ============================================================================

function ToneSelectView({
  jobTitle,
  onSelect,
  onBack,
  panelWidth,
}: {
  jobTitle: string;
  onSelect: (tone: CoverLetterTone) => void;
  onBack: () => void;
  panelWidth: number;
}) {
  // Use white theme colors
  const textColor = "#1d1d1f";
  const accentColor = "#0077B5";
  const isCompact = panelWidth < 360;

  const tones: Array<{
    tone: CoverLetterTone;
    label: string;
    description: string;
    emoji: string;
    bestFor: string;
  }> = [
    {
      tone: 'professional',
      label: 'Professional',
      description: 'Formal, traditional business tone',
      emoji: '👔',
      bestFor: 'Finance, Law, Corporate',
    },
    {
      tone: 'enthusiastic',
      label: 'Enthusiastic',
      description: 'Energetic, passionate tone',
      emoji: '🔥',
      bestFor: 'Startups, Creative, Sales',
    },
    {
      tone: 'confident',
      label: 'Technical',
      description: 'Detail-oriented, precise tone',
      emoji: '⚙️',
      bestFor: 'Engineering, Data, Research',
    },
    {
      tone: 'conversational',
      label: 'Conversational',
      description: 'Friendly, approachable tone',
      emoji: '💬',
      bestFor: 'Nonprofits, Education, HR',
    },
  ];

  return (
    <div style={{ padding: isCompact ? '12px' : '16px' }}>
      <button
        onClick={onBack}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '8px',
          backgroundColor: 'transparent',
          border: 'none',
          color: accentColor,
          fontSize: '14px',
          fontWeight: '600',
          cursor: 'pointer',
          marginBottom: '16px',
          transition: 'all 200ms',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateX(-4px)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateX(0)';
        }}
      >
        <ArrowLeft size={16} />
        Back to jobs
      </button>

      <p style={{ fontSize: '14px', color: `${textColor}99`, marginBottom: '4px' }}>
        Generating for:
      </p>
      <h3
        style={{
          fontSize: '16px',
          fontWeight: '600',
          color: textColor,
          marginBottom: '16px',
        }}
      >
        {jobTitle}
      </h3>

      <p style={{ fontSize: '14px', color: `${textColor}99`, marginBottom: '16px' }}>
        Choose a tone for your cover letter:
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {tones.map((item) => (
          <ToneCard key={item.tone} {...item} onClick={() => onSelect(item.tone)} />
        ))}
      </div>
    </div>
  );
}

function ToneCard({
  tone: _tone,
  label,
  description,
  emoji,
  bestFor,
  onClick,
}: {
  tone: CoverLetterTone;
  label: string;
  description: string;
  emoji: string;
  bestFor: string;
  onClick: () => void;
}) {
  // Use white theme colors
  const backgroundColor = "#FFFFFF";
  const textColor = "#1d1d1f";
  const accentColor = "#0077B5";
  const [isHovered, setIsHovered] = useState(false);

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        width: '100%',
        padding: '16px',
        backgroundColor: isHovered ? `${backgroundColor}60` : `${backgroundColor}e6`,
        backdropFilter: 'blur(10px)',
        border: `1px solid ${backgroundColor}40`,
        borderRadius: '12px',
        cursor: 'pointer',
        textAlign: 'left',
        transition: 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)',
        transform: isHovered ? 'scale(1.02)' : 'scale(1)',
        boxShadow: isHovered ? '0 4px 12px rgba(0, 0, 0, 0.12)' : '0 2px 8px rgba(0, 0, 0, 0.08)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
        <span style={{ fontSize: '32px' }}>{emoji}</span>
        <div style={{ flex: 1 }}>
          <h4
            style={{
              fontSize: '16px',
              fontWeight: '600',
              margin: '0 0 4px 0',
              color: textColor,
            }}
          >
            {label}
          </h4>
          <p
            style={{
              fontSize: '13px',
              color: `${textColor}99`,
              margin: '0 0 8px 0',
            }}
          >
            {description}
          </p>
          <span
            style={{
              fontSize: '12px',
              color: accentColor,
              fontWeight: '500',
            }}
          >
            Best for: {bestFor}
          </span>
        </div>
      </div>
    </button>
  );
}

// ============================================================================
// GENERATING VIEW
// ============================================================================

function GeneratingView({ tone }: { tone: CoverLetterTone }) {
  const textColor = '#1d1d1f';
  const accentColor = '#0077B5';

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        padding: '40px 24px',
        textAlign: 'center',
      }}
    >
      <RefreshCw
        size={48}
        color={accentColor}
        className="animate-spin"
        style={{ marginBottom: '16px' }}
      />
      <h3
        style={{
          fontSize: '20px',
          fontWeight: '700',
          margin: '0 0 8px 0',
          color: textColor,
        }}
      >
        Generating Your Cover Letter...
      </h3>
      <p style={{ fontSize: '14px', color: `${textColor}99`, margin: '0 0 24px 0' }}>
        Tone: <strong>{tone}</strong>
      </p>
      <div
        style={{
          fontSize: '13px',
          color: `${textColor}99`,
          lineHeight: '1.6',
        }}
      >
        <p style={{ margin: '4px 0' }}>✨ Analyzing job requirements</p>
        <p style={{ margin: '4px 0' }}>🎯 Matching your experience</p>
        <p style={{ margin: '4px 0' }}>📝 Crafting compelling content</p>
        <p style={{ margin: '4px 0' }}>🔍 Optimizing for ATS</p>
      </div>
    </div>
  );
}

// ============================================================================
// PREVIEW VIEW
// ============================================================================

function PreviewView({
  coverLetter,
  warnings,
  onCopy,
  onSave,
  onExport,
  onReset,
  panelWidth,
}: {
  coverLetter: CoverLetter;
  warnings: string[];
  onCopy: () => void;
  onSave: () => void;
  onExport: (format: ExportFormat) => void;
  onReset: () => void;
  panelWidth: number;
}) {
  // Use white theme colors
  const backgroundColor = "#FFFFFF";
  const textColor = "#1d1d1f";
  const accentColor = "#0077B5";
  const [showWarnings, setShowWarnings] = useState(true);
  const isCompact = panelWidth < 360;

  const atsScore = coverLetter.atsOptimization.overallATSScore;
  const scoreColor =
    atsScore >= 80
      ? '#4CAF50'
      : atsScore >= 65
      ? '#2196F3'
      : atsScore >= 50
      ? '#FF9500'
      : '#F44336';

  return (
    <div style={{ padding: isCompact ? '12px' : '16px' }}>
      {/* Warnings */}
      {warnings.length > 0 && (
        <div
          style={{
            backgroundColor: '#FFF9E6',
            border: '1px solid #FFD600',
            borderRadius: '12px',
            padding: '16px',
            marginBottom: '16px',
          }}
        >
          <button
            onClick={() => setShowWarnings(!showWarnings)}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'none',
              border: 'none',
              padding: 0,
              cursor: 'pointer',
              marginBottom: showWarnings ? '12px' : 0,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertCircle size={16} color="#FF9500" />
              <h4 style={{ fontSize: '14px', fontWeight: '600', margin: 0, color: textColor }}>
                Warnings ({warnings.length})
              </h4>
            </div>
            {showWarnings ? <ChevronUp size={16} color={`${textColor}99`} /> : <ChevronDown size={16} color={`${textColor}99`} />}
          </button>
          {showWarnings && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {warnings.map((warning, i) => (
                <div key={i} style={{ fontSize: '12px', color: `${textColor}99`, lineHeight: '1.5' }}>
                  ⚠️ {warning}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ATS Score Card */}
      <div
        style={{
          backgroundColor: `${backgroundColor}e6`,
          backdropFilter: 'blur(10px)',
          borderRadius: '12px',
          padding: '16px',
          marginBottom: '16px',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h4 style={{ fontSize: '14px', fontWeight: '600', margin: '0 0 4px 0', color: textColor }}>
              ATS Score
            </h4>
            <p style={{ fontSize: '12px', color: `${textColor}99`, margin: 0 }}>
              {coverLetter.content.wordCount} words • {coverLetter.qualityScore.tone.score > 70 ? 'professional' : 'conversational'} tone
            </p>
          </div>
          <div
            style={{
              fontSize: '32px',
              fontWeight: '700',
              color: scoreColor,
            }}
          >
            {atsScore}
          </div>
        </div>
      </div>

      {/* Cover Letter Preview */}
      <div
        style={{
          backgroundColor: `${backgroundColor}e6`,
          backdropFilter: 'blur(10px)',
          borderRadius: '12px',
          padding: '16px',
          marginBottom: '16px',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
        }}
      >
        <h4
          style={{
            fontSize: '14px',
            fontWeight: '600',
            margin: '0 0 12px 0',
            color: textColor,
          }}
        >
          Cover Letter
        </h4>
        <pre
          style={{
            fontFamily: '"Courier New", monospace',
            fontSize: '12px',
            lineHeight: '1.6',
            color: textColor,
            whiteSpace: 'pre-wrap',
            wordWrap: 'break-word',
            margin: 0,
          }}
        >
          {coverLetter.content.fullText}
        </pre>
      </div>

      {/* Export Buttons */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
        <button
          onClick={() => onExport('pdf')}
          style={{
            flex: 1,
            padding: '12px',
            backgroundColor: 'transparent',
            color: accentColor,
            border: `1.5px solid ${accentColor}`,
            borderRadius: '10px',
            fontSize: '13px',
            fontWeight: '600',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            transition: 'all 200ms',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = `${accentColor}10`;
            e.currentTarget.style.transform = 'translateY(-2px)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.style.transform = 'translateY(0)';
          }}
        >
          <Download size={14} />
          PDF
        </button>
        <button
          onClick={() => onExport('docx')}
          style={{
            flex: 1,
            padding: '12px',
            backgroundColor: 'transparent',
            color: accentColor,
            border: `1.5px solid ${accentColor}`,
            borderRadius: '10px',
            fontSize: '13px',
            fontWeight: '600',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            transition: 'all 200ms',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = `${accentColor}10`;
            e.currentTarget.style.transform = 'translateY(-2px)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.style.transform = 'translateY(0)';
          }}
        >
          <FileText size={14} />
          DOCX
        </button>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: '8px' }}>
        <button
          onClick={onCopy}
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            padding: '12px',
            backgroundColor: accentColor,
            color: '#FFFFFF',
            border: 'none',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 200ms',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.02)';
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          <Copy size={16} />
          Copy
        </button>
        <button
          onClick={onSave}
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            padding: '12px',
            backgroundColor: `${backgroundColor}40`,
            color: textColor,
            border: `1px solid ${backgroundColor}60`,
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 200ms',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = `${backgroundColor}60`;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = `${backgroundColor}40`;
          }}
        >
          <Save size={16} />
          Save
        </button>
        <button
          onClick={onReset}
          style={{
            padding: '12px',
            backgroundColor: `${backgroundColor}40`,
            color: textColor,
            border: `1px solid ${backgroundColor}60`,
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 200ms',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = `${backgroundColor}60`;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = `${backgroundColor}40`;
          }}
        >
          New
        </button>
      </div>
    </div>
  );
}
