/**
 * Job Description Analyzer Tab
 * Paste job descriptions, extract keywords, analyze match against profile
 */

import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  FileText,
  Target,
  Trash2,
  Zap,
  Star,
  Award,
} from 'lucide-react';
import type {
  JobDescriptionAnalysis,
  ExtractedKeyword,
  MatchAnalysis,
  ProfessionalProfile,
} from '../../types/resume';
import {
  extractKeywordsFromJobDescription,
  categorizeJobRequirements,
} from '../../services/keyword-extractor';
import {
  getJobDescriptionAnalyses,
  saveJobDescriptionAnalysis,
  deleteJobDescriptionAnalysis,
  getProfessionalProfile,
} from '../../utils/storage';

interface JobAnalyzerTabProps {
  panelWidth?: number;
}

type ViewMode = 'paste' | 'analyzing' | 'results';

export function JobAnalyzerTab({ panelWidth = 400 }: JobAnalyzerTabProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('paste');
  const [jobText, setJobText] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [company, setCompany] = useState('');
  const [currentAnalysis, setCurrentAnalysis] = useState<JobDescriptionAnalysis | null>(null);
  const [savedAnalyses, setSavedAnalyses] = useState<JobDescriptionAnalysis[]>([]);
  const [profile, setProfile] = useState<ProfessionalProfile | null>(null);

  const isCompact = panelWidth < 400;

  // Load saved analyses and profile
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [analyses, profileData] = await Promise.all([
      getJobDescriptionAnalyses(),
      getProfessionalProfile(),
    ]);
    setSavedAnalyses(analyses);
    setProfile(profileData);
  };

  const handleAnalyze = () => {
    if (!jobText.trim()) return;

    setViewMode('analyzing');

    // Simulate AI processing delay
    setTimeout(() => {
      const keywords = extractKeywordsFromJobDescription(jobText, jobTitle || undefined);
      const { required, preferred } = categorizeJobRequirements(jobText, jobTitle || undefined);

      const analysis: JobDescriptionAnalysis = {
        id: `job_${Date.now()}`,
        rawText: jobText,
        jobTitle: jobTitle || 'Untitled Job',
        company: company || 'Unknown Company',
        extractedKeywords: keywords,
        requiredSkills: required,
        preferredSkills: preferred,
        requiredExperience: extractExperience(jobText, true),
        preferredExperience: extractExperience(jobText, false),
        analyzedAt: Date.now(),
      };

      // Add match analysis if profile exists
      if (profile) {
        analysis.matchAnalysis = calculateMatch(analysis, profile);
      }

      setCurrentAnalysis(analysis);
      setViewMode('results');
    }, 1500);
  };

  const handleSave = async () => {
    if (!currentAnalysis) return;
    await saveJobDescriptionAnalysis(currentAnalysis);
    await loadData();
  };

  const handleDelete = async (id: string) => {
    await deleteJobDescriptionAnalysis(id);
    await loadData();
  };

  const handleReset = () => {
    setJobText('');
    setJobTitle('');
    setCompany('');
    setCurrentAnalysis(null);
    setViewMode('paste');
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
          <Target size={20} color="#0077B5" />
          <h2
            style={{
              fontSize: isCompact ? '18px' : '20px',
              fontWeight: '700',
              margin: 0,
              color: '#1d1d1f',
            }}
          >
            Job Description Analyzer
          </h2>
        </div>
        <p style={{ fontSize: '13px', color: '#6e6e73', margin: 0 }}>
          Extract keywords, analyze ATS requirements, match against your profile
        </p>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', backgroundColor: '#FAFAFA' }}>
        {viewMode === 'paste' && (
          <PasteView
            jobText={jobText}
            jobTitle={jobTitle}
            company={company}
            onJobTextChange={setJobText}
            onJobTitleChange={setJobTitle}
            onCompanyChange={setCompany}
            onAnalyze={handleAnalyze}
            savedAnalyses={savedAnalyses}
            onSelectAnalysis={(analysis) => {
              setCurrentAnalysis(analysis);
              setJobText(analysis.rawText);
              setJobTitle(analysis.jobTitle);
              setCompany(analysis.company);
              setViewMode('results');
            }}
            onDeleteAnalysis={handleDelete}
            panelWidth={panelWidth}
          />
        )}

        {viewMode === 'analyzing' && <AnalyzingView />}

        {viewMode === 'results' && currentAnalysis && (
          <ResultsView
            analysis={currentAnalysis}
            hasProfile={profile !== null}
            onSave={handleSave}
            onReset={handleReset}
            panelWidth={panelWidth}
          />
        )}
      </div>
    </div>
  );
}

// ============================================================================
// PASTE VIEW
// ============================================================================

function PasteView({
  jobText,
  jobTitle,
  company,
  onJobTextChange,
  onJobTitleChange,
  onCompanyChange,
  onAnalyze,
  savedAnalyses,
  onSelectAnalysis,
  onDeleteAnalysis,
  panelWidth,
}: {
  jobText: string;
  jobTitle: string;
  company: string;
  onJobTextChange: (text: string) => void;
  onJobTitleChange: (title: string) => void;
  onCompanyChange: (company: string) => void;
  onAnalyze: () => void;
  savedAnalyses: JobDescriptionAnalysis[];
  onSelectAnalysis: (analysis: JobDescriptionAnalysis) => void;
  onDeleteAnalysis: (id: string) => void;
  panelWidth: number;
}) {
  const isCompact = panelWidth < 360;

  return (
    <div style={{ padding: isCompact ? '12px' : '16px' }}>
      {/* Input fields */}
      <div style={{ marginBottom: '12px' }}>
        <label
          style={{
            display: 'block',
            fontSize: '12px',
            fontWeight: '600',
            marginBottom: '6px',
            color: '#1d1d1f',
          }}
        >
          Job Title
        </label>
        <input
          type="text"
          value={jobTitle}
          onChange={(e) => onJobTitleChange(e.target.value)}
          placeholder="Senior Software Engineer"
          style={{
            width: '100%',
            padding: '10px 12px',
            border: '1px solid rgba(0, 0, 0, 0.1)',
            borderRadius: '8px',
            fontSize: '14px',
            fontFamily: 'inherit',
          }}
        />
      </div>

      <div style={{ marginBottom: '12px' }}>
        <label
          style={{
            display: 'block',
            fontSize: '12px',
            fontWeight: '600',
            marginBottom: '6px',
            color: '#1d1d1f',
          }}
        >
          Company
        </label>
        <input
          type="text"
          value={company}
          onChange={(e) => onCompanyChange(e.target.value)}
          placeholder="Google"
          style={{
            width: '100%',
            padding: '10px 12px',
            border: '1px solid rgba(0, 0, 0, 0.1)',
            borderRadius: '8px',
            fontSize: '14px',
            fontFamily: 'inherit',
          }}
        />
      </div>

      <div style={{ marginBottom: '16px' }}>
        <label
          style={{
            display: 'block',
            fontSize: '12px',
            fontWeight: '600',
            marginBottom: '6px',
            color: '#1d1d1f',
          }}
        >
          Job Description
        </label>
        <textarea
          value={jobText}
          onChange={(e) => onJobTextChange(e.target.value)}
          placeholder="Paste the full job description here..."
          style={{
            width: '100%',
            minHeight: '200px',
            padding: '12px',
            border: '1px solid rgba(0, 0, 0, 0.1)',
            borderRadius: '8px',
            fontSize: '13px',
            fontFamily: 'inherit',
            resize: 'vertical',
          }}
        />
        <div style={{ fontSize: '11px', color: '#6e6e73', marginTop: '4px' }}>
          {jobText.length} characters
        </div>
      </div>

      {/* Analyze button */}
      <button
        onClick={onAnalyze}
        disabled={!jobText.trim()}
        style={{
          width: '100%',
          padding: '14px',
          backgroundColor: jobText.trim() ? '#0077B5' : 'rgba(0, 0, 0, 0.1)',
          color: jobText.trim() ? 'white' : 'rgba(0, 0, 0, 0.3)',
          border: 'none',
          borderRadius: '12px',
          fontSize: '14px',
          fontWeight: '600',
          cursor: jobText.trim() ? 'pointer' : 'not-allowed',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          transition: 'all 150ms',
        }}
      >
        <Sparkles size={16} />
        Analyze with AI
      </button>

      {/* Saved analyses */}
      {savedAnalyses.length > 0 && (
        <div style={{ marginTop: '24px' }}>
          <h3
            style={{
              fontSize: '14px',
              fontWeight: '600',
              margin: '0 0 12px 0',
              color: '#1d1d1f',
            }}
          >
            Recent Analyses ({savedAnalyses.length})
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {savedAnalyses.slice(0, 5).map((analysis) => (
              <SavedAnalysisCard
                key={analysis.id}
                analysis={analysis}
                onSelect={() => onSelectAnalysis(analysis)}
                onDelete={() => onDeleteAnalysis(analysis.id)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function SavedAnalysisCard({
  analysis,
  onSelect,
  onDelete,
}: {
  analysis: JobDescriptionAnalysis;
  onSelect: () => void;
  onDelete: () => void;
}) {
  return (
    <div
      style={{
        backgroundColor: '#FFFFFF',
        borderRadius: '8px',
        padding: '12px',
        boxShadow: '0 1px 4px rgba(0, 0, 0, 0.08)',
        cursor: 'pointer',
        transition: 'all 150ms',
      }}
      onClick={onSelect}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
        <FileText size={16} color="#0077B5" style={{ marginTop: '2px', flexShrink: 0 }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: '13px', fontWeight: '600', color: '#1d1d1f' }}>
            {analysis.jobTitle}
          </div>
          <div style={{ fontSize: '11px', color: '#6e6e73' }}>{analysis.company}</div>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          style={{
            padding: '4px',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: '#6e6e73',
          }}
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
}

// ============================================================================
// ANALYZING VIEW
// ============================================================================

function AnalyzingView() {
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
      <Sparkles size={48} color="#0077B5" className="animate-pulse" />
      <h3
        style={{
          fontSize: '18px',
          fontWeight: '700',
          margin: '20px 0 8px 0',
          color: '#1d1d1f',
        }}
      >
        Analyzing Job Description...
      </h3>
      <p style={{ fontSize: '13px', color: '#6e6e73', margin: 0 }}>
        Extracting keywords, requirements, and ATS optimization tips
      </p>
    </div>
  );
}

// ============================================================================
// RESULTS VIEW
// ============================================================================

function ResultsView({
  analysis,
  hasProfile,
  onSave,
  onReset,
  panelWidth,
}: {
  analysis: JobDescriptionAnalysis;
  hasProfile: boolean;
  onSave: () => void;
  onReset: () => void;
  panelWidth: number;
}) {
  const [activeTab, setActiveTab] = useState<'keywords' | 'match'>('keywords');
  const isCompact = panelWidth < 360;

  return (
    <div style={{ padding: isCompact ? '12px' : '16px' }}>
      {/* Job info header */}
      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '12px',
          padding: '16px',
          marginBottom: '16px',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
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
            <Zap size={20} color="#0077B5" />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h3
              style={{
                fontSize: '16px',
                fontWeight: '700',
                margin: '0 0 4px 0',
                color: '#1d1d1f',
              }}
            >
              {analysis.jobTitle}
            </h3>
            <p style={{ fontSize: '13px', color: '#6e6e73', margin: 0 }}>
              {analysis.company}
            </p>
          </div>
        </div>

        {/* Quick stats */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '8px',
            marginTop: '12px',
          }}
        >
          <QuickStat
            label="Keywords"
            value={analysis.extractedKeywords.length}
            color="#0077B5"
          />
          <QuickStat
            label="Required"
            value={analysis.requiredSkills.length}
            color="#FF3B30"
          />
          <QuickStat
            label="Preferred"
            value={analysis.preferredSkills.length}
            color="#FF9500"
          />
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        <TabButton
          label="Keywords"
          icon={<Star size={14} />}
          isActive={activeTab === 'keywords'}
          onClick={() => setActiveTab('keywords')}
        />
        {hasProfile && (
          <TabButton
            label="Match Analysis"
            icon={<Target size={14} />}
            isActive={activeTab === 'match'}
            onClick={() => setActiveTab('match')}
          />
        )}
      </div>

      {/* Tab content */}
      {activeTab === 'keywords' && <KeywordsView analysis={analysis} />}
      {activeTab === 'match' && analysis.matchAnalysis && (
        <MatchAnalysisView matchAnalysis={analysis.matchAnalysis} />
      )}

      {/* Action buttons */}
      <div
        style={{
          display: 'flex',
          gap: '8px',
          marginTop: '16px',
          position: 'sticky',
          bottom: 0,
          paddingTop: '12px',
          backgroundColor: '#FAFAFA',
        }}
      >
        <button
          onClick={onReset}
          style={{
            flex: 1,
            padding: '12px',
            backgroundColor: 'rgba(0, 0, 0, 0.05)',
            border: 'none',
            borderRadius: '8px',
            fontSize: '13px',
            fontWeight: '600',
            cursor: 'pointer',
            color: '#1d1d1f',
          }}
        >
          New Analysis
        </button>
        <button
          onClick={onSave}
          style={{
            flex: 1,
            padding: '12px',
            backgroundColor: '#0077B5',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
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
          Save Analysis
        </button>
      </div>
    </div>
  );
}

function QuickStat({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div
      style={{
        padding: '8px',
        backgroundColor: 'rgba(0, 0, 0, 0.02)',
        borderRadius: '6px',
        textAlign: 'center',
      }}
    >
      <div style={{ fontSize: '18px', fontWeight: '700', color }}>{value}</div>
      <div style={{ fontSize: '10px', color: '#6e6e73' }}>{label}</div>
    </div>
  );
}

function TabButton({
  label,
  icon,
  isActive,
  onClick,
}: {
  label: string;
  icon: React.ReactNode;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        flex: 1,
        padding: '10px',
        backgroundColor: isActive ? '#0077B5' : 'rgba(0, 0, 0, 0.05)',
        color: isActive ? 'white' : '#6e6e73',
        border: 'none',
        borderRadius: '8px',
        fontSize: '12px',
        fontWeight: '600',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '6px',
        transition: 'all 150ms',
      }}
    >
      {icon}
      {label}
    </button>
  );
}

// ============================================================================
// KEYWORDS VIEW
// ============================================================================

function KeywordsView({ analysis }: { analysis: JobDescriptionAnalysis }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Required skills */}
      <KeywordSection
        title="Required Skills"
        keywords={analysis.extractedKeywords.filter((k) => k.required)}
        color="#FF3B30"
        emptyMessage="No required skills identified"
      />

      {/* Preferred skills */}
      <KeywordSection
        title="Preferred Skills"
        keywords={analysis.extractedKeywords.filter((k) => !k.required)}
        color="#FF9500"
        emptyMessage="No preferred skills identified"
      />
    </div>
  );
}

function KeywordSection({
  title,
  keywords,
  color,
  emptyMessage,
}: {
  title: string;
  keywords: ExtractedKeyword[];
  color: string;
  emptyMessage: string;
}) {
  const [showAll, setShowAll] = useState(false);
  const INITIAL_DISPLAY_LIMIT = 20;
  const hasMore = keywords.length > INITIAL_DISPLAY_LIMIT;
  const displayedKeywords = showAll ? keywords : keywords.slice(0, INITIAL_DISPLAY_LIMIT);

  return (
    <div>
      <h4
        style={{
          fontSize: '13px',
          fontWeight: '600',
          margin: '0 0 8px 0',
          color: '#1d1d1f',
        }}
      >
        {title} ({keywords.length})
      </h4>
      {keywords.length === 0 ? (
        <p style={{ fontSize: '12px', color: '#6e6e73', fontStyle: 'italic' }}>
          {emptyMessage}
        </p>
      ) : (
        <>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {displayedKeywords.map((keyword) => (
              <KeywordBadge key={keyword.phrase} keyword={keyword} color={color} />
            ))}
          </div>
          {hasMore && (
            <button
              onClick={() => setShowAll(!showAll)}
              style={{
                marginTop: '8px',
                padding: '6px 12px',
                backgroundColor: 'transparent',
                border: `1px solid ${color}`,
                borderRadius: '6px',
                fontSize: '11px',
                fontWeight: '600',
                color: color,
                cursor: 'pointer',
                transition: 'all 150ms',
              }}
            >
              {showAll ? 'Show Less' : `View All ${keywords.length} Keywords`}
            </button>
          )}
        </>
      )}
    </div>
  );
}

function KeywordBadge({ keyword, color }: { keyword: ExtractedKeyword; color: string }) {
  return (
    <div
      style={{
        padding: '6px 10px',
        backgroundColor: `${color}15`,
        borderLeft: `3px solid ${color}`,
        borderRadius: '6px',
        fontSize: '11px',
        fontWeight: '600',
        color: '#1d1d1f',
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
      }}
      title={`Score: ${keyword.score}, Occurrences: ${keyword.occurrences}`}
    >
      {keyword.phrase}
      <span style={{ fontSize: '9px', color: '#6e6e73' }}>
        {Math.round(keyword.score)}
      </span>
    </div>
  );
}

// ============================================================================
// MATCH ANALYSIS VIEW
// ============================================================================

function MatchAnalysisView({ matchAnalysis }: { matchAnalysis: MatchAnalysis }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Overall score */}
      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '12px',
          padding: '16px',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
          textAlign: 'center',
        }}
      >
        <div style={{ fontSize: '48px', fontWeight: '700', color: getScoreColor(matchAnalysis.overallScore) }}>
          {matchAnalysis.overallScore}%
        </div>
        <div style={{ fontSize: '13px', color: '#6e6e73' }}>Overall Match Score</div>
      </div>

      {/* Recommendations */}
      {matchAnalysis.recommendations.length > 0 && (
        <div
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '12px',
            padding: '16px',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
          }}
        >
          <h4 style={{ fontSize: '13px', fontWeight: '600', margin: '0 0 12px 0' }}>
            Recommendations
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {matchAnalysis.recommendations.map((rec, i) => (
              <div key={i} style={{ fontSize: '12px', color: '#6e6e73', lineHeight: '1.5' }}>
                • {rec}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function getScoreColor(score: number): string {
  if (score >= 80) return '#34C759';
  if (score >= 60) return '#0077B5';
  if (score >= 40) return '#FF9500';
  return '#FF3B30';
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function extractExperience(jobDescription: string, required: boolean): string[] {
  // Simple extraction - can be enhanced with AI
  const pattern = required
    ? /(\d+\+?\s+years?.*?experience)/gi
    : /preferred.*?(\d+\+?\s+years?.*?experience)/gi;

  const matches = jobDescription.match(pattern) || [];
  return matches.slice(0, 3);
}

function calculateMatch(
  analysis: JobDescriptionAnalysis,
  profile: ProfessionalProfile
): MatchAnalysis {
  // Simple match calculation - can be enhanced
  const profileSkills = [
    ...profile.technicalSkills.filter((s) => s && s.name).map((s) => s.name.toLowerCase()),
    ...profile.softSkills.filter((s) => s && s.name).map((s) => s.name.toLowerCase()),
    ...profile.tools.filter((t) => t && t.name).map((t) => t.name.toLowerCase()),
  ];

  const jobKeywords = analysis.extractedKeywords.map((k) => k.phrase.toLowerCase());

  const matched = jobKeywords.filter((k) =>
    profileSkills.some((s) => s.includes(k) || k.includes(s))
  );

  const matchPercentage = jobKeywords.length > 0
    ? (matched.length / jobKeywords.length) * 100
    : 0;

  return {
    overallScore: Math.round(matchPercentage),
    keywordMatch: {
      matched: analysis.extractedKeywords.filter((k) =>
        profileSkills.some((s) => s.includes(k.phrase.toLowerCase()) || k.phrase.toLowerCase().includes(s))
      ),
      missing: analysis.extractedKeywords.filter((k) =>
        !profileSkills.some((s) => s.includes(k.phrase.toLowerCase()) || k.phrase.toLowerCase().includes(s))
      ),
      matchPercentage,
    },
    experienceMatch: {
      hasRequiredExperience: true, // Simplified
      hasPreferredExperience: true,
      score: 80,
    },
    skillsMatch: {
      requiredSkillsMatched: analysis.requiredSkills.filter((s) =>
        profileSkills.some((ps) => ps.includes(s.toLowerCase()))
      ),
      requiredSkillsMissing: analysis.requiredSkills.filter((s) =>
        !profileSkills.some((ps) => ps.includes(s.toLowerCase()))
      ),
      preferredSkillsMatched: analysis.preferredSkills.filter((s) =>
        profileSkills.some((ps) => ps.includes(s.toLowerCase()))
      ),
      score: Math.round(matchPercentage),
    },
    recommendations: [
      matchPercentage < 60 ? 'Add more relevant skills to your profile' : 'Great skill match!',
      'Emphasize matching keywords in your resume',
      'Consider adding projects that demonstrate required skills',
    ],
    suggestedExperiences: [],
    suggestedSkills: [],
  };
}
