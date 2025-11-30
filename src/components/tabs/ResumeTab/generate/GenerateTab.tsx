import { useState } from 'react';
import { Sparkles, CheckCircle2, TrendingUp, RefreshCw, FileText } from 'lucide-react';
import type { ProfessionalProfile } from '../../../../types/resume';

export function GenerateTab({ profile }: { profile: ProfessionalProfile; onUpdate?: () => void }) {
  const [step, setStep] = useState<'input' | 'analysis' | 'generated'>('input');
  const [jobTitle, setJobTitle] = useState('');
  const [company, setCompany] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');
  const [analysis, setAnalysis] = useState<any>(null);
  const [generatedResume, setGeneratedResume] = useState<any>(null);

  // Reset to start
  const handleReset = () => {
    setStep('input');
    setJobTitle('');
    setCompany('');
    setJobDescription('');
    setError('');
    setAnalysis(null);
    setGeneratedResume(null);
  };

  // Step 1: Analyze job description
  const handleAnalyzeJob = async () => {
    if (!jobTitle.trim() || !company.trim() || !jobDescription.trim()) {
      setError('Please fill in all fields');
      return;
    }

    setIsAnalyzing(true);
    setError('');

    try {
      // Dynamically import keyword extractor
      const { extractKeywordsFromJobDescription, categorizeJobRequirements } = await import('../../../../services/keyword-extractor');

      // Extract keywords and categorize requirements
      const extractedKeywords = extractKeywordsFromJobDescription(jobDescription);
      const { required, preferred } = categorizeJobRequirements(jobDescription);

      // Create analysis object
      const jobAnalysis = {
        id: `job_${Date.now()}`,
        rawText: jobDescription,
        jobTitle,
        company,
        extractedKeywords,
        requiredSkills: required,
        preferredSkills: preferred,
        analyzedAt: new Date().toISOString(),
      };

      setAnalysis(jobAnalysis);
      setStep('analysis');
    } catch (err) {
      console.error('[Uproot] Error analyzing job:', err);
      setError('Failed to analyze job description. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Step 2: Generate resume from analysis
  const handleGenerateResume = async () => {
    if (!analysis) return;

    setIsGenerating(true);
    setError('');

    try {
      // Dynamically import resume generator
      const { generateResumeWithAI } = await import('../../../../services/ai-resume-generator');

      // Generate optimized resume
      const resume = await generateResumeWithAI(analysis, profile);

      setGeneratedResume(resume);
      setStep('generated');
    } catch (err) {
      console.error('[Uproot] Error generating resume:', err);
      setError('Failed to generate resume. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Copy resume to clipboard
  const handleCopyToClipboard = () => {
    if (!generatedResume) return;

    const resumeText = formatResumeForClipboard(generatedResume);
    navigator.clipboard.writeText(resumeText).then(() => {
      alert('Resume copied to clipboard!');
    });
  };

  // Format resume content as plain text
  const formatResumeForClipboard = (resume: any): string => {
    const { content } = resume;
    let text = '';

    // Professional Summary
    if (content.professionalSummary) {
      text += `${content.professionalSummary}\n\n`;
    }

    // Technical Skills
    if (content.technicalSkills && content.technicalSkills.length > 0) {
      text += 'TECHNICAL SKILLS\n';
      text += content.technicalSkills.join(' • ') + '\n\n';
    }

    // Experience
    if (content.experience && content.experience.length > 0) {
      text += 'EXPERIENCE\n\n';
      content.experience.forEach((exp: any) => {
        text += `${exp.title} | ${exp.company}\n`;
        text += `${exp.startDate} - ${exp.endDate || 'Present'}${exp.location ? ` | ${exp.location}` : ''}\n`;
        if (exp.bullets && exp.bullets.length > 0) {
          exp.bullets.forEach((bullet: any) => {
            text += `• ${bullet.text}\n`;
          });
        }
        text += '\n';
      });
    }

    // Education
    if (content.education && content.education.length > 0) {
      text += 'EDUCATION\n\n';
      content.education.forEach((edu: any) => {
        text += `${edu.degree} in ${edu.field}\n`;
        text += `${edu.institution}${edu.location ? ` | ${edu.location}` : ''}\n`;
        text += `${edu.startDate} - ${edu.endDate || 'Present'}${edu.gpa ? ` | GPA: ${edu.gpa}` : ''}\n\n`;
      });
    }

    // Projects
    if (content.projects && content.projects.length > 0) {
      text += 'PROJECTS\n\n';
      content.projects.forEach((proj: any) => {
        text += `${proj.name}\n`;
        if (proj.description) {
          text += `${proj.description}\n`;
        }
        if (proj.technologies && proj.technologies.length > 0) {
          text += `Technologies: ${proj.technologies.join(', ')}\n`;
        }
        text += '\n';
      });
    }

    return text;
  };

  // Get ATS score styling
  const getATSScoreStyle = (score: number) => {
    if (score >= 80) return { color: '#34C759', label: 'Excellent' };
    if (score >= 65) return { color: '#0077B5', label: 'Good' };
    if (score >= 50) return { color: '#FF9500', label: 'Needs Work' };
    return { color: '#FF3B30', label: 'Poor' };
  };

  // STEP 1: Input job description
  if (step === 'input') {
    return (
      <>
        <style>
          {`
            @keyframes spin {
              from { transform: rotate(0deg); }
              to { transform: rotate(360deg); }
            }
          `}
        </style>
        <div style={{ padding: '20px' }}>
          <div style={{ marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <Sparkles size={20} strokeWidth={2} style={{ color: '#0077B5' }} />
              <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#1d1d1f', margin: 0 }}>
                Generate ATS-Optimized Resume
              </h3>
            </div>
            <p style={{ fontSize: '13px', color: '#6e6e73', margin: 0 }}>
              Paste a job description to generate a tailored resume with ATS optimization
            </p>
          </div>

          {error && (
            <div style={{
              padding: '12px',
              backgroundColor: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: '8px',
              marginBottom: '16px',
            }}>
              <p style={{ fontSize: '13px', color: '#dc2626', margin: 0 }}>{error}</p>
            </div>
          )}

          {/* Job Title */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#1d1d1f', marginBottom: '6px' }}>
              Job Title *
            </label>
            <input
              type="text"
              value={jobTitle}
              onChange={(e) => setJobTitle(e.target.value)}
              placeholder="e.g., Senior Software Engineer"
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid rgba(0, 0, 0, 0.12)',
                borderRadius: '6px',
                fontSize: '14px',
                fontFamily: 'inherit',
              }}
            />
          </div>

          {/* Company */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#1d1d1f', marginBottom: '6px' }}>
              Company *
            </label>
            <input
              type="text"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              placeholder="e.g., Google"
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid rgba(0, 0, 0, 0.12)',
                borderRadius: '6px',
                fontSize: '14px',
                fontFamily: 'inherit',
              }}
            />
          </div>

          {/* Job Description */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#1d1d1f', marginBottom: '6px' }}>
              Job Description *
            </label>
            <textarea
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              placeholder="Paste the full job description here..."
              rows={12}
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid rgba(0, 0, 0, 0.12)',
                borderRadius: '6px',
                fontSize: '13px',
                fontFamily: 'inherit',
                resize: 'vertical',
                lineHeight: '1.5',
              }}
            />
            <p style={{ fontSize: '12px', color: '#6e6e73', margin: '6px 0 0 0' }}>
              {jobDescription.length} characters
            </p>
          </div>

          {/* Analyze Button */}
          <button
            onClick={handleAnalyzeJob}
            disabled={isAnalyzing}
            style={{
              width: '100%',
              padding: '14px 16px',
              background: isAnalyzing ? '#d1d5db' : '#0077B5',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: isAnalyzing ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              transition: 'background 0.2s',
            }}
            onMouseEnter={(e) => {
              if (!isAnalyzing) e.currentTarget.style.background = '#006399';
            }}
            onMouseLeave={(e) => {
              if (!isAnalyzing) e.currentTarget.style.background = '#0077B5';
            }}
          >
            {isAnalyzing ? (
              <>
                <RefreshCw size={18} strokeWidth={2} style={{ animation: 'spin 1s linear infinite' }} />
                <span>Analyzing...</span>
              </>
            ) : (
              <>
                <TrendingUp size={18} strokeWidth={2} />
                <span>Analyze Job Description</span>
              </>
            )}
          </button>
        </div>
      </>
    );
  }

  // STEP 2: Show analysis results
  if (step === 'analysis' && analysis) {
    const topKeywords = analysis.extractedKeywords
      .filter((k: any) => k.importance > 0.3)
      .slice(0, 15);

    return (
      <>
        <style>
          {`
            @keyframes spin {
              from { transform: rotate(0deg); }
              to { transform: rotate(360deg); }
            }
          `}
        </style>
        <div style={{ padding: '20px' }}>
          {/* Header */}
          <div style={{ marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckCircle2 size={20} strokeWidth={2} style={{ color: '#34C759' }} />
                <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#1d1d1f', margin: 0 }}>
                  Analysis Complete
                </h3>
              </div>
              <button
                onClick={handleReset}
                style={{
                  padding: '6px 12px',
                  background: 'white',
                  color: '#6e6e73',
                  border: '1px solid rgba(0, 0, 0, 0.12)',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: '600',
                  cursor: 'pointer',
                }}
              >
                Start Over
              </button>
            </div>
            <p style={{ fontSize: '13px', color: '#6e6e73', margin: 0 }}>
              {analysis.jobTitle} at {analysis.company}
            </p>
          </div>

          {error && (
            <div style={{
              padding: '12px',
              backgroundColor: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: '8px',
              marginBottom: '16px',
            }}>
              <p style={{ fontSize: '13px', color: '#dc2626', margin: 0 }}>{error}</p>
            </div>
          )}

          {/* Top Keywords */}
          <div style={{ marginBottom: '20px' }}>
            <h4 style={{ fontSize: '14px', fontWeight: '600', color: '#1d1d1f', margin: '0 0 10px 0' }}>
              Top Keywords Extracted ({analysis.extractedKeywords.length} total)
            </h4>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {topKeywords.map((keyword: any, index: number) => (
                <span
                  key={index}
                  style={{
                    padding: '6px 10px',
                    backgroundColor: keyword.category === 'technical-skill' ? 'rgba(0, 119, 181, 0.1)' :
                                   keyword.category === 'soft-skill' ? 'rgba(52, 199, 89, 0.1)' :
                                   'rgba(0, 0, 0, 0.05)',
                    color: keyword.category === 'technical-skill' ? '#0077B5' :
                           keyword.category === 'soft-skill' ? '#34C759' :
                           '#1d1d1f',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: '500',
                  }}
                >
                  {keyword.keyword}
                </span>
              ))}
            </div>
          </div>

          {/* Required Skills */}
          {analysis.requiredSkills.length > 0 && (
            <div style={{ marginBottom: '20px' }}>
              <h4 style={{ fontSize: '14px', fontWeight: '600', color: '#1d1d1f', margin: '0 0 10px 0' }}>
                Required Skills ({analysis.requiredSkills.length})
              </h4>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {analysis.requiredSkills.map((skill: string, index: number) => (
                  <span
                    key={index}
                    style={{
                      padding: '6px 10px',
                      backgroundColor: '#fef2f2',
                      color: '#dc2626',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: '500',
                      border: '1px solid #fecaca',
                    }}
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Preferred Skills */}
          {analysis.preferredSkills.length > 0 && (
            <div style={{ marginBottom: '20px' }}>
              <h4 style={{ fontSize: '14px', fontWeight: '600', color: '#1d1d1f', margin: '0 0 10px 0' }}>
                Preferred Skills ({analysis.preferredSkills.length})
              </h4>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {analysis.preferredSkills.map((skill: string, index: number) => (
                  <span
                    key={index}
                    style={{
                      padding: '6px 10px',
                      backgroundColor: 'rgba(0, 119, 181, 0.05)',
                      color: '#0077B5',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: '500',
                      border: '1px solid rgba(0, 119, 181, 0.2)',
                    }}
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Generate Resume Button */}
          <button
            onClick={handleGenerateResume}
            disabled={isGenerating}
            style={{
              width: '100%',
              padding: '14px 16px',
              background: isGenerating ? '#d1d5db' : '#0077B5',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: isGenerating ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              transition: 'background 0.2s',
            }}
            onMouseEnter={(e) => {
              if (!isGenerating) e.currentTarget.style.background = '#006399';
            }}
            onMouseLeave={(e) => {
              if (!isGenerating) e.currentTarget.style.background = '#0077B5';
            }}
          >
            {isGenerating ? (
              <>
                <RefreshCw size={18} strokeWidth={2} style={{ animation: 'spin 1s linear infinite' }} />
                <span>Generating Resume...</span>
              </>
            ) : (
              <>
                <Sparkles size={18} strokeWidth={2} />
                <span>Generate Optimized Resume</span>
              </>
            )}
          </button>
        </div>
      </>
    );
  }

  // STEP 3: Show generated resume
  if (step === 'generated' && generatedResume) {
    const atsScore = generatedResume.atsOptimization.overallATSScore;
    const scoreStyle = getATSScoreStyle(atsScore);

    return (
      <div style={{ padding: '20px' }}>
        {/* Header */}
        <div style={{ marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Sparkles size={20} strokeWidth={2} style={{ color: '#0077B5' }} />
              <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#1d1d1f', margin: 0 }}>
                Resume Generated
              </h3>
            </div>
            <button
              onClick={handleReset}
              style={{
                padding: '6px 12px',
                background: 'white',
                color: '#6e6e73',
                border: '1px solid rgba(0, 0, 0, 0.12)',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: '600',
                cursor: 'pointer',
              }}
            >
              New Resume
            </button>
          </div>
          <p style={{ fontSize: '13px', color: '#6e6e73', margin: 0 }}>
            {generatedResume.jobTitle} at {generatedResume.company}
          </p>
        </div>

        {/* ATS Score */}
        <div style={{
          padding: '16px',
          backgroundColor: 'white',
          border: `2px solid ${scoreStyle.color}`,
          borderRadius: '12px',
          marginBottom: '20px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <div>
              <h4 style={{ fontSize: '14px', fontWeight: '600', color: '#1d1d1f', margin: '0 0 4px 0' }}>
                ATS Compatibility Score
              </h4>
              <p style={{ fontSize: '12px', color: '#6e6e73', margin: 0 }}>
                {generatedResume.atsOptimization.keywordsUsed.length} of {generatedResume.atsOptimization.totalKeywords} keywords matched
              </p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '32px', fontWeight: '700', color: scoreStyle.color }}>
                {atsScore}
              </div>
              <div style={{ fontSize: '12px', fontWeight: '600', color: scoreStyle.color }}>
                {scoreStyle.label}
              </div>
            </div>
          </div>

          {/* Score Breakdown */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', paddingTop: '12px', borderTop: '1px solid rgba(0, 0, 0, 0.08)' }}>
            <div>
              <div style={{ fontSize: '11px', color: '#6e6e73', marginBottom: '2px' }}>Match Rate</div>
              <div style={{ fontSize: '14px', fontWeight: '600', color: '#1d1d1f' }}>
                {Math.round(generatedResume.atsOptimization.keywordMatchRate)}%
              </div>
            </div>
            <div>
              <div style={{ fontSize: '11px', color: '#6e6e73', marginBottom: '2px' }}>Format</div>
              <div style={{ fontSize: '14px', fontWeight: '600', color: '#1d1d1f' }}>
                {generatedResume.atsOptimization.formatCompliance.score}%
              </div>
            </div>
            <div>
              <div style={{ fontSize: '11px', color: '#6e6e73', marginBottom: '2px' }}>Quality</div>
              <div style={{ fontSize: '14px', fontWeight: '600', color: '#1d1d1f' }}>
                {generatedResume.atsOptimization.contentQuality.score}%
              </div>
            </div>
          </div>
        </div>

        {/* Recommendations */}
        {generatedResume.atsOptimization.recommendations.length > 0 && (
          <div style={{ marginBottom: '20px' }}>
            <h4 style={{ fontSize: '14px', fontWeight: '600', color: '#1d1d1f', margin: '0 0 10px 0' }}>
              Optimization Tips
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {generatedResume.atsOptimization.recommendations.slice(0, 5).map((rec: string, index: number) => (
                <div
                  key={index}
                  style={{
                    padding: '10px 12px',
                    backgroundColor: rec.startsWith('✅') ? 'rgba(52, 199, 89, 0.05)' :
                                   rec.startsWith('❌') ? 'rgba(220, 38, 38, 0.05)' :
                                   'rgba(255, 149, 0, 0.05)',
                    borderLeft: `3px solid ${rec.startsWith('✅') ? '#34C759' :
                                             rec.startsWith('❌') ? '#dc2626' :
                                             '#FF9500'}`,
                    borderRadius: '6px',
                    fontSize: '12px',
                    color: '#1d1d1f',
                    lineHeight: '1.5',
                  }}
                >
                  {rec}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Resume Preview */}
        <div style={{ marginBottom: '20px' }}>
          <h4 style={{ fontSize: '14px', fontWeight: '600', color: '#1d1d1f', margin: '0 0 10px 0' }}>
            Resume Content
          </h4>

          {/* Professional Summary */}
          {generatedResume.professionalSummary && (
            <div style={{ marginBottom: '16px' }}>
              <h5 style={{ fontSize: '13px', fontWeight: '600', color: '#0077B5', margin: '0 0 6px 0', textTransform: 'uppercase' }}>
                Professional Summary
              </h5>
              <p style={{ fontSize: '13px', color: '#1d1d1f', margin: 0, lineHeight: '1.6' }}>
                {generatedResume.professionalSummary}
              </p>
            </div>
          )}

          {/* Selected Experiences */}
          {generatedResume.selectedExperiences && generatedResume.selectedExperiences.length > 0 && (
            <div style={{ marginBottom: '16px' }}>
              <h5 style={{ fontSize: '13px', fontWeight: '600', color: '#0077B5', margin: '0 0 10px 0', textTransform: 'uppercase' }}>
                Experience ({generatedResume.selectedExperiences.length})
              </h5>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {generatedResume.selectedExperiences.slice(0, 3).map((exp: any, index: number) => (
                  <div key={index} style={{ paddingLeft: '12px', borderLeft: '2px solid rgba(0, 119, 181, 0.2)' }}>
                    <div style={{ fontSize: '13px', fontWeight: '600', color: '#1d1d1f' }}>
                      {exp.title} • {exp.company}
                    </div>
                    <div style={{ fontSize: '11px', color: '#6e6e73', marginBottom: '6px' }}>
                      {exp.selectedBullets.length} bullet{exp.selectedBullets.length !== 1 ? 's' : ''} selected • {Math.round(exp.relevanceScore * 100)}% match
                    </div>
                  </div>
                ))}
                {generatedResume.selectedExperiences.length > 3 && (
                  <p style={{ fontSize: '12px', color: '#6e6e73', margin: 0 }}>
                    +{generatedResume.selectedExperiences.length - 3} more
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Selected Skills */}
          {generatedResume.selectedSkills && generatedResume.selectedSkills.length > 0 && (
            <div style={{ marginBottom: '16px' }}>
              <h5 style={{ fontSize: '13px', fontWeight: '600', color: '#0077B5', margin: '0 0 8px 0', textTransform: 'uppercase' }}>
                Skills ({generatedResume.selectedSkills.length})
              </h5>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {generatedResume.selectedSkills.slice(0, 12).map((skill: string, index: number) => (
                  <span
                    key={index}
                    style={{
                      padding: '4px 8px',
                      backgroundColor: 'rgba(0, 119, 181, 0.1)',
                      color: '#0077B5',
                      borderRadius: '4px',
                      fontSize: '11px',
                      fontWeight: '500',
                    }}
                  >
                    {skill}
                  </span>
                ))}
                {generatedResume.selectedSkills.length > 12 && (
                  <span style={{ fontSize: '11px', color: '#6e6e73', alignSelf: 'center' }}>
                    +{generatedResume.selectedSkills.length - 12} more
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Copy to Clipboard Button */}
        <button
          onClick={handleCopyToClipboard}
          style={{
            width: '100%',
            padding: '14px 16px',
            background: '#34C759',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: '600',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            transition: 'background 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#2fb350';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = '#34C759';
          }}
        >
          <FileText size={18} strokeWidth={2} />
          <span>Copy Resume to Clipboard</span>
        </button>
      </div>
    );
  }

  return null;
}
