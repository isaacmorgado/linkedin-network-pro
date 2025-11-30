/**
 * Panel Header Component
 * Contains title and control buttons (fill form/minimize/close)
 */

import { useState } from 'react';
import { X, Minimize2, Maximize2, Sparkles, Zap, CheckCircle } from 'lucide-react';
import { AutoFiller } from '../../services/autofill/auto-filler';
import { FormDetector } from '../../services/autofill/form-detector';
import { log, LogCategory } from '../../utils/logger';

interface PanelHeaderProps {
  isMinimized: boolean;
  onMinimize: () => void;
  onClose: () => void;
}

export function PanelHeader({ isMinimized, onMinimize, onClose }: PanelHeaderProps) {
  const [isFilling, setIsFilling] = useState(false);
  const [fillStatus, setFillStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [filledCount, setFilledCount] = useState(0);

  const handleFillForm = async () => {
    setIsFilling(true);
    setFillStatus('idle');
    log.info(LogCategory.UI, 'Fill Form button clicked', { component: 'PanelHeader' });

    try {
      const detector = new FormDetector();
      const detectionResult = detector.detectFields();

      if (detectionResult.fields.length === 0) {
        alert('No fillable fields detected on this page');
        setIsFilling(false);
        log.warn(LogCategory.SERVICE, 'No fillable fields detected');
        return;
      }

      log.info(LogCategory.SERVICE, 'Starting autofill', { fieldCount: detectionResult.fields.length });
      const filler = new AutoFiller();
      const result = await filler.autoFill();

      setFilledCount(result.filledCount);
      setFillStatus('success');
      log.info(LogCategory.SERVICE, 'Form autofill completed', { filledCount: result.filledCount });

      // Auto-clear success status after 2 seconds
      setTimeout(() => setFillStatus('idle'), 2000);

    } catch (error) {
      console.error('Autofill failed:', error);
      log.error(LogCategory.SERVICE, 'Autofill failed', error as Error);
      setFillStatus('error');
      alert('Failed to fill form. Please check console for details.');
      setTimeout(() => setFillStatus('idle'), 2000);
    } finally {
      setIsFilling(false);
    }
  };

  return (
    <div className="minimal-panel-header">
      <div className="minimal-panel-title">
        <Sparkles size={16} strokeWidth={2} />
        <span>Uproot AI Assistant</span>
      </div>
      <div className="minimal-panel-controls">
        {/* Fill Form Button */}
        <button
          className="fill-form-button"
          onClick={handleFillForm}
          disabled={isFilling}
          title="Auto-fill form fields"
        >
          {isFilling ? (
            <div className="fill-form-spinner" />
          ) : fillStatus === 'success' ? (
            <CheckCircle size={16} />
          ) : (
            <Zap size={16} />
          )}
          <span className="fill-form-text">
            {fillStatus === 'success' ? `Filled ${filledCount}` : 'Fill Form'}
          </span>
        </button>

        {/* Minimize/Maximize Button */}
        <button
          className="minimal-panel-button"
          onClick={onMinimize}
          title={isMinimized ? 'Maximize' : 'Minimize'}
        >
          {isMinimized ? <Maximize2 size={16} /> : <Minimize2 size={16} />}
        </button>

        {/* Close Button */}
        <button
          className="minimal-panel-button"
          onClick={onClose}
          title="Close"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
