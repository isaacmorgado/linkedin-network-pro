/**
 * Experience Bullets Section - AI-Powered Bullet Point Generator
 * Generates tailored job experience bullet points based on job description
 */

import { useState } from 'react';
import { Briefcase, Copy, Check } from 'lucide-react';
import type { ProfessionalProfile } from '../../types/resume';
import { log, LogCategory } from '../../utils/logger';
import { generateExperienceBullets, type GeneratedBullets } from '../../services/experience-bullet-generator';

interface ExperienceBulletsSectionProps {
  profile: ProfessionalProfile;
  jobDescription: string;
}

export function ExperienceBulletsSection({ profile, jobDescription }: ExperienceBulletsSectionProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedBullets, setGeneratedBullets] = useState<GeneratedBullets[]>([]);
  const [error, setError] = useState('');
  const [copiedIndex, setCopiedIndex] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!jobDescription.trim()) {
      setError('Please paste a job description first');
      return;
    }

    if (!profile.jobs || profile.jobs.length === 0) {
      setError('No job experience found in your profile');
      return;
    }

    setIsGenerating(true);
    setError('');

    try {
      const bullets = await generateExperienceBullets(jobDescription, profile);
      setGeneratedBullets(bullets);
      log.info(LogCategory.UI, 'Experience bullets generated successfully', {
        jobsProcessed: bullets.length,
        totalBullets: bullets.reduce((sum, j) => sum + j.bullets.length, 0),
      });

      // Auto-scroll to generated content
      setTimeout(() => {
        const container = document.querySelector('.minimal-panel-content');
        if (container) {
          container.scrollTop = container.scrollHeight;
        }
      }, 100);
    } catch (err) {
      log.error(LogCategory.UI, 'Failed to generate experience bullets', err as Error);
      setError('Failed to generate bullets. Please check your API key and try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyBullet = async (jobIndex: number, bulletIndex: number) => {
    const bullet = generatedBullets[jobIndex].bullets[bulletIndex];
    await navigator.clipboard.writeText(bullet);

    const key = `${jobIndex}-${bulletIndex}`;
    setCopiedIndex(key);
    log.action('Bullet copied to clipboard', { jobIndex, bulletIndex });

    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleCopyAllForJob = async (jobIndex: number) => {
    const job = generatedBullets[jobIndex];
    const formattedBullets = job.bullets.map(b => `• ${b}`).join('\n');
    await navigator.clipboard.writeText(formattedBullets);

    const key = `job-${jobIndex}`;
    setCopiedIndex(key);
    log.action('All bullets copied for job', { jobIndex, bulletCount: job.bullets.length });

    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleReset = () => {
    setGeneratedBullets([]);
    setError('');
    setCopiedIndex(null);
  };

  const hasNoJobs = !profile.jobs || profile.jobs.length === 0;

  return (
    <div className="generate-section-container">
      <div className="generate-section-header">
        <div className="generate-section-title-row">
          <Briefcase size={20} strokeWidth={2} style={{ color: '#0077B5' }} />
          <h3 className="generate-section-title">Experience Bullet Generator</h3>
        </div>
        <p className="generate-section-description">
          Generate tailored bullet points for your job experiences based on the job description
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

      {hasNoJobs && (
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
            ⚠️ No job experience found in your profile
          </p>
        </div>
      )}

      {/* Pre-generation State */}
      {generatedBullets.length === 0 && (
        <button
          className="generate-button-primary"
          onClick={handleGenerate}
          disabled={isGenerating || !jobDescription || hasNoJobs}
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
          {isGenerating ? 'Generating...' : 'Generate Bullets'}
        </button>
      )}

      {/* Post-generation State */}
      {generatedBullets.length > 0 && (
        <>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {generatedBullets.map((job, jobIndex) => (
              <div
                key={jobIndex}
                style={{
                  padding: '16px',
                  backgroundColor: '#f5f5f7',
                  borderRadius: '8px',
                  border: '1px solid rgba(0, 0, 0, 0.08)',
                }}
              >
                <h4 style={{
                  fontSize: '16px',
                  fontWeight: '600',
                  color: '#1d1d1f',
                  margin: '0 0 12px 0',
                }}>
                  {job.jobTitle} at {job.company}
                </h4>

                <ul style={{
                  margin: '0 0 12px 0',
                  paddingLeft: '20px',
                  listStyleType: 'disc',
                }}>
                  {job.bullets.map((bullet, bulletIndex) => (
                    <li
                      key={bulletIndex}
                      style={{
                        fontSize: '14px',
                        color: '#1d1d1f',
                        lineHeight: '1.6',
                        marginBottom: '8px',
                        position: 'relative',
                      }}
                    >
                      <div style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        justifyContent: 'space-between',
                        gap: '8px',
                      }}>
                        <span style={{ flex: 1 }}>{bullet}</span>
                        <button
                          onClick={() => handleCopyBullet(jobIndex, bulletIndex)}
                          style={{
                            padding: '4px 8px',
                            backgroundColor: copiedIndex === `${jobIndex}-${bulletIndex}` ? '#4ade80' : 'white',
                            color: copiedIndex === `${jobIndex}-${bulletIndex}` ? 'white' : '#0077B5',
                            border: '1px solid',
                            borderColor: copiedIndex === `${jobIndex}-${bulletIndex}` ? '#4ade80' : '#d2d2d7',
                            borderRadius: '6px',
                            fontSize: '12px',
                            fontWeight: '600',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            flexShrink: 0,
                            transition: 'all 0.2s',
                          }}
                        >
                          {copiedIndex === `${jobIndex}-${bulletIndex}` ? (
                            <>
                              <Check size={12} />
                              Copied
                            </>
                          ) : (
                            <>
                              <Copy size={12} />
                              Copy
                            </>
                          )}
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => handleCopyAllForJob(jobIndex)}
                  style={{
                    width: '100%',
                    padding: '10px 16px',
                    backgroundColor: copiedIndex === `job-${jobIndex}` ? '#4ade80' : '#0077B5',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '13px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    if (copiedIndex !== `job-${jobIndex}`) {
                      e.currentTarget.style.opacity = '0.9';
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.opacity = '1';
                  }}
                >
                  {copiedIndex === `job-${jobIndex}` ? (
                    <>
                      <Check size={16} />
                      All Bullets Copied!
                    </>
                  ) : (
                    <>
                      <Copy size={16} />
                      Copy All Bullets
                    </>
                  )}
                </button>
              </div>
            ))}
          </div>

          <button
            className="generate-button-secondary"
            onClick={handleReset}
            style={{
              marginTop: '16px',
              width: '100%',
            }}
          >
            Generate New Bullets
          </button>
        </>
      )}
    </div>
  );
}
