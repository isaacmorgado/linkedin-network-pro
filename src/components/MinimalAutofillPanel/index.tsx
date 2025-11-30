/**
 * Minimal Autofill Panel for Third-Party Job Sites
 *
 * Shows ONLY the Generate section (AI answer generation) from ResumeTab.
 * Used on non-LinkedIn job application sites.
 *
 * Refactored to separate concerns into smaller modules.
 */

import { useState, useRef, useEffect } from 'react';
import { Rnd } from 'react-rnd';
import { getProfessionalProfile } from '../../utils/storage';
import type { ProfessionalProfile } from '../../types/resume';
import { log, LogCategory } from '../../utils/logger';
import { getPanelStyles } from './styles';
import { PanelHeader } from './PanelHeader';
import { AutofillTabSwitcher } from './AutofillTabSwitcher';
import { JobDescriptionSection } from './JobDescriptionSection';
import { QuestionsSection } from './QuestionsSection';
import { ExperienceBulletsSection } from './ExperienceBulletsSection';
import type { AutofillView } from './types';
import {
  calculateMaximizePosition,
  autoRepositionMinimized,
  handleDragStop,
  type PanelPosition,
  type PanelSize,
} from './panelLogic';

export function MinimalAutofillPanel() {
  const [panelSize, setPanelSize] = useState<PanelSize>({ width: 400, height: 500 });
  const [isMinimized, setIsMinimized] = useState(false);
  const [panelPosition, setPanelPosition] = useState<PanelPosition>({ x: 100, y: 100 });
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
      currentPosition: panelPosition
    });

    // If we're MAXIMIZING (currently minimized, about to expand)
    if (!willBeMinimized) {
      calculateMaximizePosition(
        panelPosition,
        panelSize,
        rndRef,
        setShouldAnimate,
        setPanelPosition
      );
    }

    setIsMinimized(willBeMinimized);
  };

  // Auto-reposition when minimized and at bottom of viewport
  useEffect(() => {
    if (!isMinimized || !rndRef.current) return;

    const checkPosition = () => {
      autoRepositionMinimized(
        panelPosition,
        rndRef,
        setShouldAnimate,
        setPanelPosition
      );
    };

    // Check immediately when minimized
    checkPosition();

    // Also check on window resize
    window.addEventListener('resize', checkPosition);
    return () => window.removeEventListener('resize', checkPosition);
  }, [isMinimized, panelPosition.y]);

  return (
    <>
      <style>{getPanelStyles(panelSize, isMinimized)}</style>

      <Rnd
        ref={rndRef}
        default={{
          x: panelPosition.x,
          y: panelPosition.y,
          width: panelSize.width,
          height: panelSize.height,
        }}
        size={isMinimized ? { width: panelSize.width, height: 60 } : undefined}
        position={panelPosition}
        onDragStop={(_e, d) => {
          handleDragStop(d, isMinimized, rndRef, setShouldAnimate, setPanelPosition);
        }}
        onResize={(_e, _direction, ref, _delta, position) => {
          if (!isMinimized) {
            // FIX: Clamp position to prevent negative values when resizing from left/top edges
            const newSize = {
              width: parseInt(ref.style.width),
              height: parseInt(ref.style.height),
            };
            const clampedPosition = {
              x: Math.max(0, Math.min(position.x, window.innerWidth - newSize.width)),
              y: Math.max(0, Math.min(position.y, window.innerHeight - newSize.height))
            };
            setPanelSize(newSize);
            setPanelPosition(clampedPosition);
          }
        }}
        onResizeStop={(_e, _direction, ref, _delta, position) => {
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
        minHeight={isMinimized ? 60 : 400}
        maxWidth={600}
        maxHeight={800}
        bounds="window"
        dragHandleClassName="minimal-panel-header"
        cancel=".react-resizable-handle"
        disableDragging={false}
        enableResizing={isMinimized ? false : {
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
          top: { height: '8px', top: 0, left: 0, right: 0 },
          right: { width: '8px', right: 0, top: 0, bottom: 0 },
          bottom: { height: '8px', bottom: 0, left: 0, right: 0 },
          left: { width: '8px', left: 0, top: 0, bottom: 0 },
          topRight: { width: '20px', height: '20px', top: 0, right: 0 },
          bottomRight: { width: '20px', height: '20px', bottom: 0, right: 0 },
          bottomLeft: { width: '20px', height: '20px', bottom: 0, left: 0 },
          topLeft: { width: '20px', height: '20px', top: 0, left: 0 },
        }}
        style={{
          zIndex: 2147483647,
          isolation: 'isolate',
          pointerEvents: 'auto',
          transition: shouldAnimate
            ? 'all 500ms cubic-bezier(0.68, -0.55, 0.265, 1.55)'
            : 'none',
        }}
      >
        <div className="minimal-panel-container">
          <PanelHeader
            isMinimized={isMinimized}
            onMinimize={handleMinimize}
            onClose={handleClose}
          />

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
                  {activeView === 'experience-bullets' && (
                    <ExperienceBulletsSection
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

// Re-export for backward compatibility
export default MinimalAutofillPanel;
