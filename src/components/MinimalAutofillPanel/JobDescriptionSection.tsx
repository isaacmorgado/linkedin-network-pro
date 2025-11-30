/**
 * Job Description Section - Paste Job Description
 * Allows users to paste and save the job description for later use
 */

import { FileText } from 'lucide-react';

interface JobDescriptionSectionProps {
  jobDescription: string;
  onJobDescriptionChange: (text: string) => void;
}

export function JobDescriptionSection({
  jobDescription,
  onJobDescriptionChange
}: JobDescriptionSectionProps) {
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
