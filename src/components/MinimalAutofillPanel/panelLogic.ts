/**
 * Panel logic and helpers
 * Contains positioning and resize logic for the panel
 */

import type { Rnd } from 'react-rnd';
import { log, LogCategory } from '../../utils/logger';

export interface PanelPosition {
  x: number;
  y: number;
}

export interface PanelSize {
  width: number;
  height: number;
}

/**
 * Calculate repositioning on maximize
 */
export function calculateMaximizePosition(
  panelPosition: PanelPosition,
  panelSize: PanelSize,
  rndRef: React.RefObject<Rnd>,
  setShouldAnimate: (value: boolean) => void,
  setPanelPosition: (pos: PanelPosition) => void
): void {
  if (!rndRef.current) return;

  const viewportHeight = window.innerHeight;
  const fullPanelHeight = panelSize.height;
  const currentY = panelPosition.y;

  // Step 1: Calculate where the bottom edge of the minimized panel currently is
  const currentBottomY = currentY + 60; // 60px is minimized height

  // Step 2: Calculate where the top of the full panel should be to keep bottom edge in same place
  const targetY = currentBottomY - fullPanelHeight;

  // Step 3: Smart clamp - keep panel within safe bounds
  const newY = Math.max(20, Math.min(targetY, viewportHeight - fullPanelHeight - 40));

  // Step 4: Only reposition if the change is significant (> 5px)
  const shouldReposition = Math.abs(newY - currentY) > 5;

  if (shouldReposition) {
    // Step 5: Log the repositioning reason
    log.action('Repositioning panel on maximize', {
      reason: targetY < 20 ? 'would go above viewport' : targetY > viewportHeight - fullPanelHeight - 40 ? 'would go below viewport' : 'normal expansion',
      currentY,
      currentBottomY,
      targetY,
      newY,
      adjustment: newY - currentY
    });

    // Enable animation, reposition, then disable after animation completes
    setShouldAnimate(true);
    setTimeout(() => {
      rndRef.current?.updatePosition({ x: panelPosition.x, y: newY });
      setPanelPosition({ x: panelPosition.x, y: newY });
      console.log('[Uproot] Repositioned on maximize:', { from: currentY, to: newY, reason: targetY < 20 ? 'too high' : 'too low' });

      // Disable animation after it completes
      setTimeout(() => setShouldAnimate(false), 500);
    }, 50); // Small delay to let minimize animation start
  } else {
    log.debug(LogCategory.UI, 'Skipping reposition - adjustment too small', {
      currentY,
      targetY,
      difference: Math.abs(newY - currentY)
    });
  }
}

/**
 * Auto-reposition minimized panel if needed
 */
export function autoRepositionMinimized(
  panelPosition: PanelPosition,
  rndRef: React.RefObject<Rnd>,
  setShouldAnimate: (value: boolean) => void,
  setPanelPosition: (pos: PanelPosition) => void
): void {
  if (!rndRef.current) return;

  const viewportHeight = window.innerHeight;
  const panelHeight = 60; // Minimized height
  const currentY = panelPosition.y;

  // If panel is below 80% of viewport height when minimized, animate it back up
  const maxAllowedY = viewportHeight - panelHeight - 20; // 20px padding from bottom

  if (currentY > maxAllowedY) {
    const newY = Math.max(20, maxAllowedY); // At least 20px from top

    // Enable animation, reposition, then disable
    setShouldAnimate(true);
    rndRef.current?.updatePosition({ x: panelPosition.x, y: newY });
    setPanelPosition({ x: panelPosition.x, y: newY });

    log.debug(LogCategory.UI, 'Auto-repositioned minimized panel', { from: currentY, to: newY });

    // Disable animation after it completes (match CSS transition time)
    setTimeout(() => setShouldAnimate(false), 500);
  }
}

/**
 * Handle drag stop - check for bottom edge repositioning
 */
export function handleDragStop(
  d: { x: number; y: number },
  isMinimized: boolean,
  rndRef: React.RefObject<Rnd>,
  setShouldAnimate: (value: boolean) => void,
  setPanelPosition: (pos: PanelPosition) => void
): void {
  log.debug(LogCategory.UI, 'Panel dragged', { x: d.x, y: d.y });

  // Check if panel was dragged to bottom edge (within 20px) when minimized
  if (isMinimized) {
    const viewportHeight = window.innerHeight;
    const panelHeight = 60; // Minimized height
    const bottomThreshold = viewportHeight - panelHeight - 20;

    // If dragged to bottom edge, trigger animation to reposition
    if (d.y > bottomThreshold) {
      const newY = Math.max(20, bottomThreshold);
      setShouldAnimate(true);
      setTimeout(() => {
        rndRef.current?.updatePosition({ x: d.x, y: newY });
        setPanelPosition({ x: d.x, y: newY });
        log.debug(LogCategory.UI, 'Repositioned after drag to bottom', { from: d.y, to: newY });
        setTimeout(() => setShouldAnimate(false), 500);
      }, 50);
      return;
    }
  }

  setPanelPosition({ x: d.x, y: d.y });
}
