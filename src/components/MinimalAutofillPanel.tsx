/**
 * Minimal Autofill Panel for Third-Party Job Sites
 *
 * Shows ONLY the Generate section (AI answer generation) from ResumeTab.
 * Used on non-LinkedIn job application sites.
 */

import React, { useState, useRef, useEffect } from 'react';
import { Rnd } from 'react-rnd';
import { X, Minimize2, Maximize2, Sparkles } from 'lucide-react';
import { getProfessionalProfile } from '../utils/storage';
import type { ProfessionalProfile } from '../types/resume';
import { log, LogCategory } from '../utils/logger';

export function MinimalAutofillPanel() {
  const [panelSize, setPanelSize] = useState({ width: 400, height: 500 });
  const [isMinimized, setIsMinimized] = useState(false);
  const [panelPosition, setPanelPosition] = useState({ x: 100, y: 100 });
  const [shouldAnimate, setShouldAnimate] = useState(false);
  const [profile, setProfile] = useState<ProfessionalProfile | null>(null);
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

          {/* Content - Generate Tab */}
          {!isMinimized && (
            <div className="minimal-panel-content">
              {profile ? (
                <GenerateSection profile={profile} />
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
 * Generate Section - AI Answer Generation
 * (Extracted from ResumeTab GenerateTab)
 */
function GenerateSection({ profile }: { profile: ProfessionalProfile }) {
  const [jobDescription, setJobDescription] = useState('');
  const [question, setQuestion] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedAnswer, setGeneratedAnswer] = useState('');
  const [error, setError] = useState('');

  // Listen for paste event from keyboard shortcut (Alt+Enter)
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
    if (!jobDescription.trim() || !question.trim()) {
      setError('Please paste the job description and enter a question');
      return;
    }

    setIsGenerating(true);
    setError('');

    try {
      log.info(LogCategory.UI, 'Generating AI answer', {
        questionLength: question.length,
        jdLength: jobDescription.length,
      });

      // Import keyword extractor
      const { extractKeywordsFromJobDescription } = await import('../services/keyword-extractor');

      // Extract keywords from JD
      const keywords = extractKeywordsFromJobDescription(jobDescription);

      // Generate answer based on profile + keywords
      const answer = generateAnswerFromProfile(question, keywords, profile);

      setGeneratedAnswer(answer);
      log.info(LogCategory.UI, 'AI answer generated successfully');
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
      log.action('Answer copied to clipboard');
      // Could show a toast notification here
    });
  };

  const handleReset = () => {
    setJobDescription('');
    setQuestion('');
    setGeneratedAnswer('');
    setError('');
  };

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
              AI Answer Generator
            </h3>
          </div>
          <p style={{ fontSize: '13px', color: '#6e6e73', margin: 0 }}>
            Paste the job description and enter your question to get an AI-generated answer
          </p>
        </div>

        {error && (
          <div
            style={{
              padding: '12px',
              backgroundColor: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: '8px',
              marginBottom: '16px',
            }}
          >
            <p style={{ fontSize: '13px', color: '#dc2626', margin: 0 }}>{error}</p>
          </div>
        )}

        {/* Step 1: Input */}
        {!generatedAnswer && (
          <>
            <div style={{ marginBottom: '16px' }}>
              <label
                style={{
                  display: 'block',
                  fontSize: '13px',
                  fontWeight: '600',
                  color: '#1d1d1f',
                  marginBottom: '6px',
                }}
              >
                Job Description
              </label>
              <textarea
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                placeholder="Paste the full job description here..."
                style={{
                  width: '100%',
                  minHeight: '120px',
                  padding: '12px',
                  border: '1px solid #d2d2d7',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontFamily: 'inherit',
                  resize: 'vertical',
                }}
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label
                style={{
                  display: 'block',
                  fontSize: '13px',
                  fontWeight: '600',
                  color: '#1d1d1f',
                  marginBottom: '6px',
                }}
              >
                Your Question
              </label>
              <input
                type="text"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="e.g., Why do you want to work here?"
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #d2d2d7',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontFamily: 'inherit',
                }}
              />
            </div>

            <button
              onClick={handleGenerateAnswer}
              disabled={isGenerating}
              style={{
                width: '100%',
                padding: '12px',
                background: isGenerating
                  ? '#d2d2d7'
                  : 'linear-gradient(135deg, #0077B5 0%, #005582 100%)',
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
              }}
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
            <div
              style={{
                padding: '16px',
                backgroundColor: '#f5f5f7',
                borderRadius: '8px',
                marginBottom: '16px',
              }}
            >
              <h4 style={{ fontSize: '14px', fontWeight: '600', color: '#1d1d1f', marginBottom: '12px' }}>
                Generated Answer
              </h4>
              <p style={{ fontSize: '13px', color: '#1d1d1f', lineHeight: '1.6', margin: 0, whiteSpace: 'pre-wrap' }}>
                {generatedAnswer}
              </p>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={handleCopyAnswer}
                style={{
                  flex: 1,
                  padding: '12px',
                  background: 'linear-gradient(135deg, #0077B5 0%, #005582 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                }}
              >
                Copy Answer
              </button>
              <button
                onClick={handleReset}
                style={{
                  flex: 1,
                  padding: '12px',
                  background: 'white',
                  color: '#0077B5',
                  border: '1px solid #0077B5',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                }}
              >
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
 * Generate answer from profile and keywords
 * (Simplified version - could be enhanced with OpenAI API)
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
