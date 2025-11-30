/**
 * Questions Section - AI Answer Generation
 * Uses the user's actual profile data (no hallucination) + job description to generate answers
 */

import { useState, useEffect } from 'react';
import { MessageSquare, Copy } from 'lucide-react';
import type { ProfessionalProfile } from '../../types/resume';
import { log, LogCategory } from '../../utils/logger';
import { generateAnswerFromProfile } from './answerGenerator';

interface QuestionsSectionProps {
  profile: ProfessionalProfile;
  jobDescription: string;
}

export function QuestionsSection({ profile, jobDescription }: QuestionsSectionProps) {
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
      const { extractKeywordsFromJobDescription } = await import('../../services/keyword-extractor');

      // Extract keywords from JD
      const keywords = extractKeywordsFromJobDescription(jobDescription);

      // Generate answer based on user's ACTUAL profile data + keywords (no hallucination)
      const keywordStrings = keywords.map((k: any) => k.keyword || k);
      const answer = await generateAnswerFromProfile(question, keywordStrings, profile);

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
  );
}
