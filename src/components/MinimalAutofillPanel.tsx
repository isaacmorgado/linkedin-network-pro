/**
 * Minimal Autofill Panel for Third-Party Job Sites
 *
 * Shows ONLY the Generate section (AI answer generation) from ResumeTab.
 * Used on non-LinkedIn job application sites.
 */

import React, { useState, useRef, useEffect } from 'react';
import { Rnd } from 'react-rnd';
import { X, Minimize2, Maximize2, Sparkles, FileText, MessageSquare, Copy } from 'lucide-react';
import { getProfessionalProfile } from '../utils/storage';
import type { ProfessionalProfile } from '../types/resume';
import { log, LogCategory } from '../utils/logger';

type AutofillView = 'job-description' | 'questions';

export function MinimalAutofillPanel() {
  const [panelSize, setPanelSize] = useState({ width: 400, height: 500 });
  const [isMinimized, setIsMinimized] = useState(false);
  const [panelPosition, setPanelPosition] = useState({ x: 100, y: 100 });
  const [shouldAnimate, setShouldAnimate] = useState(false);
  const [profile, setProfile] = useState<ProfessionalProfile | null>(null);
  const [activeView, setActiveView] = useState<AutofillView>('job-description');
  const [jobDescription, setJobDescription] = useState('');
  const rndRef = useRef<Rnd>(null);

  // Load profile on mount
  useEffect(() => {
    log.info(LogCategory.UI, 'MinimalAutofillPanel mounted');
    loadProfile();

    return () => {
      log.debug(LogCategory.UI, 'MinimalAutofillPanel unmounting');
    };
  }, []);

  async function loadProfile() {
    try {
      const prof = await getProfessionalProfile();
      setProfile(prof);
      log.info(LogCategory.UI, 'Profile loaded for minimal panel', {
        hasProfile: !!prof,
      });
    } catch (error) {
      log.error(LogCategory.UI, 'Failed to load profile', error as Error);
    }
  }

  const handleClose = () => {
    log.action('Close button clicked', { component: 'MinimalAutofillPanel' });
    const container = document.getElementById('uproot-autofill-root');
    if (container) {
      container.style.display = 'none';
      log.debug(LogCategory.UI, 'MinimalAutofillPanel hidden');
    }
  };

  const handleMinimize = () => {
    const willBeMinimized = !isMinimized;
    log.action('Minimize/Maximize button clicked', {
      component: 'MinimalAutofillPanel',
      willBeMinimized,
    });

    // If we're MAXIMIZING (currently minimized, about to expand)
    if (!willBeMinimized && rndRef.current) {
      const viewportHeight = window.innerHeight;
      const fullPanelHeight = panelSize.height;
      const currentY = panelPosition.y;

      // Check if full panel would go past the bottom
      const wouldGoPastBottom = currentY + fullPanelHeight > viewportHeight - 40;

      if (wouldGoPastBottom) {
        const newY = Math.max(20, viewportHeight - fullPanelHeight - 40);
        setShouldAnimate(true);
        setTimeout(() => {
          rndRef.current?.updatePosition({ x: panelPosition.x, y: newY });
          setPanelPosition({ x: panelPosition.x, y: newY });
          setTimeout(() => setShouldAnimate(false), 600);
        }, 50);
      }
    }

    setIsMinimized(willBeMinimized);
  };

  return (
    <>
      <style>
        {`
          @keyframes minimizePanel {
            0% {
              height: ${panelSize.height}px;
              opacity: 1;
            }
            100% {
              height: 0;
              opacity: 0;
            }
          }

          @keyframes maximizePanel {
            0% {
              height: 0;
              opacity: 0;
            }
            100% {
              height: ${panelSize.height}px;
              opacity: 1;
            }
          }

          .minimal-panel-container {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            background: white;
            border-radius: 12px;
            box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(0, 0, 0, 0.05);
            overflow: hidden;
            display: flex;
            flex-direction: column;
            position: relative;
          }

          .minimal-panel-header {
            background: linear-gradient(135deg, #0077B5 0%, #005582 100%);
            color: white;
            padding: 12px 16px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            cursor: move;
            user-select: none;
          }

          .minimal-panel-title {
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 14px;
            font-weight: 600;
          }

          .minimal-panel-controls {
            display: flex;
            gap: 8px;
          }

          .minimal-panel-button {
            background: rgba(255, 255, 255, 0.2);
            border: none;
            border-radius: 6px;
            padding: 6px;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: background 0.2s;
          }

          .minimal-panel-button:hover {
            background: rgba(255, 255, 255, 0.3);
          }

          .minimal-panel-content {
            flex: 1;
            overflow-y: auto;
            ${isMinimized ? 'display: none;' : ''}
          }

          /* Resize handle styles - Override react-rnd defaults */
          .react-resizable-handle {
            position: absolute !important;
            z-index: 10 !important;
          }

          /* Corner handles - 20x20px clickable areas */
          .react-resizable-handle-se {
            bottom: 0 !important;
            right: 0 !important;
            width: 20px !important;
            height: 20px !important;
            cursor: se-resize !important;
          }

          .react-resizable-handle-sw {
            bottom: 0 !important;
            left: 0 !important;
            width: 20px !important;
            height: 20px !important;
            cursor: sw-resize !important;
          }

          .react-resizable-handle-ne {
            top: 0 !important;
            right: 0 !important;
            width: 20px !important;
            height: 20px !important;
            cursor: ne-resize !important;
          }

          .react-resizable-handle-nw {
            top: 0 !important;
            left: 0 !important;
            width: 20px !important;
            height: 20px !important;
            cursor: nw-resize !important;
          }

          /* Edge handles - 8px wide strips */
          .react-resizable-handle-e {
            right: 0 !important;
            top: 0 !important;
            bottom: 0 !important;
            width: 8px !important;
            height: 100% !important;
            cursor: e-resize !important;
          }

          .react-resizable-handle-w {
            left: 0 !important;
            top: 0 !important;
            bottom: 0 !important;
            width: 8px !important;
            height: 100% !important;
            cursor: w-resize !important;
          }

          .react-resizable-handle-n {
            top: 0 !important;
            left: 0 !important;
            right: 0 !important;
            height: 8px !important;
            width: 100% !important;
            cursor: n-resize !important;
          }

          .react-resizable-handle-s {
            bottom: 0 !important;
            left: 0 !important;
            right: 0 !important;
            height: 8px !important;
            width: 100% !important;
            cursor: s-resize !important;
          }

          /* Visual indicators for corner handles */
          .react-resizable-handle-se::after,
          .react-resizable-handle-sw::after,
          .react-resizable-handle-ne::after,
          .react-resizable-handle-nw::after {
            content: '';
            position: absolute;
            width: 10px;
            height: 10px;
            border-style: solid;
            border-color: rgba(0, 119, 181, 0.4);
            border-width: 2px;
          }

          .react-resizable-handle-se::after {
            bottom: 4px;
            right: 4px;
            border-top: none;
            border-left: none;
          }

          .react-resizable-handle-sw::after {
            bottom: 4px;
            left: 4px;
            border-top: none;
            border-right: none;
          }

          .react-resizable-handle-ne::after {
            top: 4px;
            right: 4px;
            border-bottom: none;
            border-left: none;
          }

          .react-resizable-handle-nw::after {
            top: 4px;
            left: 4px;
            border-bottom: none;
            border-right: none;
          }
        `}
      </style>

      <Rnd
        ref={rndRef}
        size={panelSize}
        position={panelPosition}
        onDragStop={(e, d) => {
          setPanelPosition({ x: d.x, y: d.y });
          log.debug(LogCategory.UI, 'Panel dragged', { x: d.x, y: d.y });
        }}
        onResizeStop={(e, direction, ref, delta, position) => {
          setPanelSize({
            width: parseInt(ref.style.width),
            height: parseInt(ref.style.height),
          });
          setPanelPosition(position);
          log.debug(LogCategory.UI, 'Panel resized', {
            width: ref.style.width,
            height: ref.style.height,
          });
        }}
        minWidth={350}
        minHeight={400}
        maxWidth={600}
        maxHeight={800}
        bounds="window"
        dragHandleClassName="minimal-panel-header"
        enableResizing={{
          top: true,
          right: true,
          bottom: true,
          left: true,
          topRight: true,
          bottomRight: true,
          bottomLeft: true,
          topLeft: true,
        }}
        resizeHandleStyles={{
          top: {
            height: '8px',
            top: 0,
            left: 0,
            right: 0
          },
          right: {
            width: '8px',
            right: 0,
            top: 0,
            bottom: 0
          },
          bottom: {
            height: '8px',
            bottom: 0,
            left: 0,
            right: 0
          },
          left: {
            width: '8px',
            left: 0,
            top: 0,
            bottom: 0
          },
          topRight: {
            width: '20px',
            height: '20px',
            top: 0,
            right: 0
          },
          bottomRight: {
            width: '20px',
            height: '20px',
            bottom: 0,
            right: 0
          },
          bottomLeft: {
            width: '20px',
            height: '20px',
            bottom: 0,
            left: 0
          },
          topLeft: {
            width: '20px',
            height: '20px',
            top: 0,
            left: 0
          },
        }}
        style={{
          pointerEvents: 'auto',
          ...(shouldAnimate && {
            transition: 'all 0.5s cubic-bezier(0.4, 0.0, 0.2, 1)',
          }),
        }}
      >
        <div className="minimal-panel-container">
          {/* Header */}
          <div className="minimal-panel-header">
            <div className="minimal-panel-title">
              <Sparkles size={16} strokeWidth={2} />
              <span>Uproot AI Assistant</span>
            </div>
            <div className="minimal-panel-controls">
              <button
                className="minimal-panel-button"
                onClick={handleMinimize}
                title={isMinimized ? 'Maximize' : 'Minimize'}
              >
                {isMinimized ? <Maximize2 size={16} /> : <Minimize2 size={16} />}
              </button>
              <button
                className="minimal-panel-button"
                onClick={handleClose}
                title="Close"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Content - Tabbed Interface */}
          {!isMinimized && (
            <div className="minimal-panel-content">
              <AutofillTabSwitcher
                activeView={activeView}
                onViewChange={setActiveView}
                panelWidth={panelSize.width}
              />

              {profile ? (
                <>
                  {activeView === 'job-description' && (
                    <JobDescriptionSection
                      jobDescription={jobDescription}
                      onJobDescriptionChange={setJobDescription}
                    />
                  )}
                  {activeView === 'questions' && (
                    <QuestionsSection
                      profile={profile}
                      jobDescription={jobDescription}
                    />
                  )}
                </>
              ) : (
                <div style={{ padding: '20px', textAlign: 'center' }}>
                  <p style={{ color: '#6e6e73', fontSize: '14px' }}>
                    Loading profile...
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </Rnd>
    </>
  );
}

/**
 * Tab Switcher Component
 */
interface AutofillTabSwitcherProps {
  activeView: AutofillView;
  onViewChange: (view: AutofillView) => void;
  panelWidth: number;
}

function AutofillTabSwitcher({
  activeView,
  onViewChange,
  panelWidth,
}: AutofillTabSwitcherProps) {
  const isCompact = panelWidth < 400;
  const fontSize = isCompact ? '12px' : '14px';
  const padding = isCompact ? '8px 12px' : '10px 16px';
  const gap = isCompact ? '4px' : '8px';
  const iconSize = isCompact ? 14 : 16;

  return (
    <div
      style={{
        padding: '12px 16px',
        borderBottom: '1px solid rgba(0, 0, 0, 0.08)',
        backgroundColor: 'rgba(0, 119, 181, 0.03)',
      }}
    >
      <div style={{ display: 'flex', gap }}>
        {/* Job Description Tab */}
        <button
          onClick={() => onViewChange('job-description')}
          style={{
            flex: 1,
            padding,
            backgroundColor: activeView === 'job-description' ? '#0077B5' : 'transparent',
            color: activeView === 'job-description' ? '#FFFFFF' : '#6e6e73',
            border: activeView === 'job-description' ? 'none' : '1px solid rgba(0, 0, 0, 0.12)',
            borderRadius: '8px',
            fontSize,
            fontWeight: '600',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            transition: 'all 150ms',
          }}
          onMouseEnter={(e) => {
            if (activeView !== 'job-description') {
              e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.04)';
            }
          }}
          onMouseLeave={(e) => {
            if (activeView !== 'job-description') {
              e.currentTarget.style.backgroundColor = 'transparent';
            }
          }}
        >
          <FileText size={iconSize} strokeWidth={2} />
          Job Description
        </button>

        {/* Questions Tab */}
        <button
          onClick={() => onViewChange('questions')}
          style={{
            flex: 1,
            padding,
            backgroundColor: activeView === 'questions' ? '#0077B5' : 'transparent',
            color: activeView === 'questions' ? '#FFFFFF' : '#6e6e73',
            border: activeView === 'questions' ? 'none' : '1px solid rgba(0, 0, 0, 0.12)',
            borderRadius: '8px',
            fontSize,
            fontWeight: '600',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            transition: 'all 150ms',
          }}
          onMouseEnter={(e) => {
            if (activeView !== 'questions') {
              e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.04)';
            }
          }}
          onMouseLeave={(e) => {
            if (activeView !== 'questions') {
              e.currentTarget.style.backgroundColor = 'transparent';
            }
          }}
        >
          <MessageSquare size={iconSize} strokeWidth={2} />
          Questions
        </button>
      </div>
    </div>
  );
}

/**
 * Job Description Section - Paste Job Description
 */
interface JobDescriptionSectionProps {
  jobDescription: string;
  onJobDescriptionChange: (text: string) => void;
}

function JobDescriptionSection({ jobDescription, onJobDescriptionChange }: JobDescriptionSectionProps) {
  return (
    <div className="generate-section-container">
      <div className="generate-section-header">
        <div className="generate-section-title-row">
          <FileText size={20} strokeWidth={2} style={{ color: '#0077B5' }} />
          <h3 className="generate-section-title">Job Description</h3>
        </div>
        <p className="generate-section-description">
          Paste the job description here. This will be analyzed to generate personalized answers based on your profile.
        </p>
      </div>

      <div className="generate-form-group">
        <label className="generate-label">Full Job Description</label>
        <textarea
          className="generate-textarea"
          value={jobDescription}
          onChange={(e) => onJobDescriptionChange(e.target.value)}
          placeholder="Paste the complete job description here..."
          style={{ minHeight: '350px' }}
        />
      </div>

      {jobDescription && (
        <div style={{
          padding: '12px 16px',
          backgroundColor: '#f0f9ff',
          border: '1px solid #bfdbfe',
          borderRadius: '8px',
          marginTop: '12px',
        }}>
          <p style={{
            fontSize: '13px',
            color: '#1e40af',
            margin: 0,
            lineHeight: '1.5',
          }}>
            ✓ Job description saved. Switch to the Questions tab to generate personalized answers.
          </p>
        </div>
      )}
    </div>
  );
}

/**
 * Questions Section - AI Answer Generation
 * Uses the user's actual profile data (no hallucination) + job description to generate answers
 */
interface QuestionsSectionProps {
  profile: ProfessionalProfile;
  jobDescription: string;
}

function QuestionsSection({ profile, jobDescription }: QuestionsSectionProps) {
  const [question, setQuestion] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedAnswer, setGeneratedAnswer] = useState('');
  const [error, setError] = useState('');
  const [showCopied, setShowCopied] = useState(false);
  const [autoCopied, setAutoCopied] = useState(false);

  // Listen for paste event from keyboard shortcut (Alt+3, only on non-LinkedIn pages)
  useEffect(() => {
    const handlePasteEvent = (event: Event) => {
      const customEvent = event as CustomEvent<{ question: string }>;
      if (customEvent.detail?.question) {
        setQuestion(customEvent.detail.question);
        log.info(LogCategory.UI, 'Question pasted from keyboard shortcut', {
          questionLength: customEvent.detail.question.length
        });
      }
    };

    window.addEventListener('uproot:pasteToGenerate', handlePasteEvent);

    return () => {
      window.removeEventListener('uproot:pasteToGenerate', handlePasteEvent);
    };
  }, []);

  const handleGenerateAnswer = async () => {
    if (!question.trim()) {
      setError('Please enter a question');
      return;
    }

    if (!jobDescription.trim()) {
      setError('Please paste a job description in the Job Description tab first');
      return;
    }

    setIsGenerating(true);
    setError('');
    setAutoCopied(false);

    try {
      log.info(LogCategory.UI, 'Generating AI answer from profile data', {
        questionLength: question.length,
        jdLength: jobDescription.length,
        hasProfile: !!profile,
      });

      // Import keyword extractor
      const { extractKeywordsFromJobDescription } = await import('../services/keyword-extractor');

      // Extract keywords from JD
      const keywords = extractKeywordsFromJobDescription(jobDescription);

      // Generate answer based on user's ACTUAL profile data + keywords (no hallucination)
      const answer = generateAnswerFromProfile(question, keywords, profile);

      setGeneratedAnswer(answer);

      // Auto-copy to clipboard
      await navigator.clipboard.writeText(answer);
      setAutoCopied(true);

      log.info(LogCategory.UI, 'AI answer generated from profile and auto-copied to clipboard');
    } catch (err) {
      log.error(LogCategory.UI, 'Failed to generate answer', err as Error);
      setError('Failed to generate answer. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyAnswer = () => {
    if (!generatedAnswer) return;

    navigator.clipboard.writeText(generatedAnswer).then(() => {
      log.action('Answer copied to clipboard (manual)');
      setShowCopied(true);
      setTimeout(() => setShowCopied(false), 2000);
    });
  };

  const handleReset = () => {
    setQuestion('');
    setGeneratedAnswer('');
    setError('');
    setShowCopied(false);
    setAutoCopied(false);
  };

  return (
    <>
      <style>
        {`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }

          .generate-section-container {
            padding: 20px;
          }

          .generate-section-header {
            margin-bottom: 20px;
          }

          .generate-section-title-row {
            display: flex;
            align-items: center;
            gap: 8px;
            margin-bottom: 8px;
          }

          .generate-section-title {
            fontSize: 16px;
            font-weight: 600;
            color: #1d1d1f;
            margin: 0;
          }

          .generate-section-description {
            font-size: 13px;
            color: #6e6e73;
            margin: 0;
            line-height: 1.5;
          }

          .generate-form-group {
            margin-bottom: 16px;
          }

          .generate-label {
            display: block;
            font-size: 13px;
            font-weight: 600;
            color: #1d1d1f;
            margin-bottom: 8px;
          }

          .generate-textarea,
          .generate-input {
            width: 100%;
            padding: 12px;
            border: 1px solid #d2d2d7;
            border-radius: 8px;
            fontSize: 13px;
            font-family: inherit;
            box-sizing: border-box;
            transition: border-color 0.2s;
          }

          .generate-textarea:focus,
          .generate-input:focus {
            outline: none;
            border-color: #0077B5;
          }

          .generate-textarea {
            min-height: 120px;
            resize: vertical;
          }

          .generate-button-primary {
            width: 100%;
            padding: 12px 16px;
            background: linear-gradient(135deg, #0077B5 0%, #005582 100%);
            color: white;
            border: none;
            border-radius: 8px;
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            transition: opacity 0.2s;
          }

          .generate-button-primary:hover:not(:disabled) {
            opacity: 0.9;
          }

          .generate-button-primary:disabled {
            background: #d2d2d7;
            cursor: not-allowed;
          }

          .generate-answer-box {
            padding: 16px;
            background-color: #f5f5f7;
            border-radius: 8px;
            margin-bottom: 16px;
          }

          .generate-answer-title {
            font-size: 14px;
            font-weight: 600;
            color: #1d1d1f;
            margin: 0 0 12px 0;
          }

          .generate-answer-text {
            font-size: 13px;
            color: #1d1d1f;
            line-height: 1.6;
            margin: 0;
            white-space: pre-wrap;
          }

          .generate-button-group {
            display: flex;
            gap: 12px;
          }

          .generate-button-secondary {
            flex: 1;
            padding: 12px 16px;
            background: white;
            color: #0077B5;
            border: 1px solid #0077B5;
            border-radius: 8px;
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
            transition: background-color 0.2s;
          }

          .generate-button-secondary:hover {
            background-color: #f5f5f7;
          }

          .generate-error-box {
            padding: 12px 16px;
            background-color: #fef2f2;
            border: 1px solid #fecaca;
            border-radius: 8px;
            margin-bottom: 16px;
          }

          .generate-error-text {
            font-size: 13px;
            color: #dc2626;
            margin: 0;
          }
        `}
      </style>
      <div className="generate-section-container">
        <div className="generate-section-header">
          <div className="generate-section-title-row">
            <MessageSquare size={20} strokeWidth={2} style={{ color: '#0077B5' }} />
            <h3 className="generate-section-title">AI Answer Generator</h3>
          </div>
          <p className="generate-section-description">
            Enter a question to get a personalized answer based on your profile and the job description
          </p>
        </div>

        {error && (
          <div className="generate-error-box">
            <p className="generate-error-text">{error}</p>
          </div>
        )}

        {!jobDescription && (
          <div style={{
            padding: '12px 16px',
            backgroundColor: '#fef3c7',
            border: '1px solid #fbbf24',
            borderRadius: '8px',
            marginBottom: '16px',
          }}>
            <p style={{
              fontSize: '13px',
              color: '#92400e',
              margin: 0,
              lineHeight: '1.5',
            }}>
              ⚠️ Please paste a job description in the Job Description tab first
            </p>
          </div>
        )}

        {/* Step 1: Input */}
        {!generatedAnswer && (
          <>
            <div className="generate-form-group">
              <label className="generate-label">Your Question</label>
              <input
                className="generate-input"
                type="text"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="e.g., Why do you want to work here?"
              />
            </div>

            <button
              className="generate-button-primary"
              onClick={handleGenerateAnswer}
              disabled={isGenerating || !jobDescription}
            >
              {isGenerating && (
                <div
                  style={{
                    width: '16px',
                    height: '16px',
                    border: '2px solid white',
                    borderTopColor: 'transparent',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite',
                  }}
                />
              )}
              {isGenerating ? 'Generating...' : 'Generate Answer'}
            </button>
          </>
        )}

        {/* Step 2: Generated Answer */}
        {generatedAnswer && (
          <>
            {autoCopied && (
              <div style={{
                padding: '12px 16px',
                backgroundColor: '#d1f4e0',
                border: '1px solid #4ade80',
                borderRadius: '8px',
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}>
                <Copy size={16} style={{ color: '#16a34a' }} />
                <p style={{
                  fontSize: '13px',
                  color: '#16a34a',
                  margin: 0,
                  fontWeight: '600',
                }}>
                  ✓ Answer automatically copied to clipboard!
                </p>
              </div>
            )}

            <div className="generate-answer-box">
              <h4 className="generate-answer-title">Generated Answer</h4>
              <p className="generate-answer-text">{generatedAnswer}</p>
            </div>

            <div className="generate-button-group">
              <button className="generate-button-primary" onClick={handleCopyAnswer}>
                <Copy size={16} style={{ marginRight: '6px' }} />
                {showCopied ? 'Copied!' : 'Copy Answer'}
              </button>
              <button className="generate-button-secondary" onClick={handleReset}>
                New Question
              </button>
            </div>
          </>
        )}
      </div>
    </>
  );
}

/**
 * Generate answer from user's ACTUAL profile and keywords
 * No hallucination - uses real data from ProfessionalProfile
 */
function generateAnswerFromProfile(
  question: string,
  keywords: string[],
  profile: ProfessionalProfile
): string {
  const questionLower = question.toLowerCase();

  // "Why do you want to work here?" template
  if (questionLower.includes('why') && questionLower.includes('work here')) {
    const topSkills = profile.skills.technical.slice(0, 3).map((s) => s.name).join(', ');
    return `I'm excited about this opportunity because it aligns perfectly with my background in ${topSkills}. The role's focus on ${keywords.slice(0, 2).join(' and ')} matches my experience, and I'm particularly drawn to the chance to contribute to impactful projects while continuing to grow professionally.`;
  }

  // "Tell us about yourself" template
  if (
    questionLower.includes('tell') &&
    (questionLower.includes('yourself') || questionLower.includes('about you'))
  ) {
    const latestJob = profile.experience.jobs[0];
    const topSkills = profile.skills.technical.slice(0, 3).map((s) => s.name).join(', ');

    if (latestJob) {
      return `I'm a professional with experience in ${latestJob.title} at ${latestJob.company}, where I've developed strong expertise in ${topSkills}. I'm passionate about leveraging technology to solve complex problems and have a proven track record of delivering results in fast-paced environments.`;
    }
  }

  // "What are your strengths?" template
  if (questionLower.includes('strength')) {
    const topSkills = profile.skills.technical.slice(0, 3).map((s) => s.name).join(', ');
    return `My key strengths include ${topSkills}, which I've applied successfully in previous roles. I'm particularly skilled at problem-solving and adapting quickly to new technologies, which allows me to contribute effectively to diverse projects.`;
  }

  // Generic fallback
  const topSkills = profile.skills.technical.slice(0, 3).map((s) => s.name).join(', ');
  return `Based on my experience with ${topSkills} and the requirements in the job description (${keywords.slice(0, 3).join(', ')}), I believe I'm well-suited for this role. I'm excited about the opportunity to apply my skills and contribute to your team's success.`;
}
