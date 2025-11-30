/**
 * Tab Switcher Component for MinimalAutofillPanel
 * Allows switching between Job Description and Questions views
 */

import { FileText, MessageSquare, Briefcase } from 'lucide-react';
import type { AutofillView } from './types';

interface AutofillTabSwitcherProps {
  activeView: AutofillView;
  onViewChange: (view: AutofillView) => void;
  panelWidth: number;
}

export function AutofillTabSwitcher({
  activeView,
  onViewChange,
  panelWidth,
}: AutofillTabSwitcherProps) {
  const isCompact = panelWidth < 450;
  const fontSize = isCompact ? '11px' : '14px';
  const padding = isCompact ? '8px 10px' : '10px 16px';
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

        {/* Experience Bullets Tab */}
        <button
          onClick={() => onViewChange('experience-bullets')}
          style={{
            flex: 1,
            padding,
            backgroundColor: activeView === 'experience-bullets' ? '#0077B5' : 'transparent',
            color: activeView === 'experience-bullets' ? '#FFFFFF' : '#6e6e73',
            border: activeView === 'experience-bullets' ? 'none' : '1px solid rgba(0, 0, 0, 0.12)',
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
            if (activeView !== 'experience-bullets') {
              e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.04)';
            }
          }}
          onMouseLeave={(e) => {
            if (activeView !== 'experience-bullets') {
              e.currentTarget.style.backgroundColor = 'transparent';
            }
          }}
        >
          <Briefcase size={iconSize} strokeWidth={2} />
          {isCompact ? 'Experience' : 'Experience Bullets'}
        </button>
      </div>
    </div>
  );
}
