/**
 * Main Floating Panel Component - WITH TAB NAVIGATION
 */

import React, { useState, useRef, useEffect } from 'react';
import { Rnd } from 'react-rnd';
import { X, Minimize2, Maximize2 } from 'lucide-react';
import { TabNavigation } from './navigation/TabNavigation';
import type { TabId } from '../types/navigation';
import { log, LogCategory } from '../utils/logger';

export function FloatingPanel() {
  const [activeTab, setActiveTab] = useState<TabId>('feed');
  const [panelSize, setPanelSize] = useState({ width: 400, height: 500 });
  const [isMinimized, setIsMinimized] = useState(false);
  const [panelPosition, setPanelPosition] = useState({ x: 100, y: 100 });
  const [shouldAnimate, setShouldAnimate] = useState(false);
  const rndRef = useRef<Rnd>(null);

  // Component mount/unmount logging
  useEffect(() => {
    log.info(LogCategory.UI, 'FloatingPanel mounted', {
      activeTab,
      panelSize,
      panelPosition,
      isMinimized
    });

    return () => {
      log.debug(LogCategory.UI, 'FloatingPanel unmounting');
    };
  }, []);

  // Check if first run and set to onboarding tab
  useEffect(() => {
    async function checkFirstRun() {
      log.debug(LogCategory.UI, 'Checking onboarding status');
      const { isOnboardingComplete } = await import('../utils/storage');
      const completed = await isOnboardingComplete();
      log.info(LogCategory.UI, 'Onboarding status checked', { completed });
      if (!completed) {
        log.action('Setting active tab to onboarding', { reason: 'first-run' });
        setActiveTab('onboarding');
      }
    }
    checkFirstRun();
  }, []);

  const handleClose = () => {
    log.action('Close button clicked', { component: 'FloatingPanel' });
    const container = document.getElementById('linkedin-extension-root');
    if (container) {
      container.style.display = 'none';
      log.debug(LogCategory.UI, 'FloatingPanel hidden');
    }
  };

  const handleMinimize = () => {
    const willBeMinimized = !isMinimized;
    log.action('Minimize/Maximize button clicked', {
      component: 'FloatingPanel',
      willBeMinimized,
      currentPosition: panelPosition
    });

    // If we're MAXIMIZING (currently minimized, about to expand)
    if (!willBeMinimized && rndRef.current) {
      const viewportHeight = window.innerHeight;
      const fullPanelHeight = panelSize.height;
      const currentY = panelPosition.y;

      // Check if full panel would go past the bottom (Windows taskbar)
      const wouldGoPastBottom = currentY + fullPanelHeight > viewportHeight - 40; // 40px for taskbar

      if (wouldGoPastBottom) {
        // Reposition so bottom of panel is 40px from bottom
        const newY = Math.max(20, viewportHeight - fullPanelHeight - 40);

        // Enable animation, reposition, then disable after animation completes
        setShouldAnimate(true);
        setTimeout(() => {
          rndRef.current?.updatePosition({ x: panelPosition.x, y: newY });
          setPanelPosition({ x: panelPosition.x, y: newY });
          console.log('[Uproot] Repositioned on maximize:', { from: currentY, to: newY });

          // Disable animation after it completes
          setTimeout(() => setShouldAnimate(false), 600);
        }, 50); // Small delay to let minimize animation start
      }
    }

    setIsMinimized(willBeMinimized);
  };

  // Auto-reposition when minimized and at bottom of viewport
  useEffect(() => {
    if (!isMinimized || !rndRef.current) return;

    const checkPosition = () => {
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

        console.log('[Uproot] Auto-repositioned minimized panel:', { from: currentY, to: newY });

        // Disable animation after it completes
        setTimeout(() => setShouldAnimate(false), 600);
      }
    };

    // Check immediately when minimized
    checkPosition();

    // Also check on window resize
    window.addEventListener('resize', checkPosition);
    return () => window.removeEventListener('resize', checkPosition);
  }, [isMinimized, panelPosition.x, panelPosition.y]);

  return (
    <Rnd
      ref={rndRef}
      default={{
        x: panelPosition.x,
        y: panelPosition.y,
        width: panelSize.width,
        height: panelSize.height,
      }}
      position={panelPosition}
      minWidth={350}
      minHeight={isMinimized ? 60 : 400}
      bounds="window"
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
      size={isMinimized ? { width: panelSize.width, height: 60 } : undefined}
      onDragStop={(e, data) => {
        log.action('Panel dragged', {
          from: panelPosition,
          to: { x: data.x, y: data.y },
          component: 'FloatingPanel'
        });
        setPanelPosition({ x: data.x, y: data.y });
      }}
      onResize={(e, direction, ref, delta, position) => {
        if (!isMinimized) {
          const newSize = {
            width: parseInt(ref.style.width),
            height: parseInt(ref.style.height),
          };
          log.action('Panel resized', {
            from: panelSize,
            to: newSize,
            direction,
            component: 'FloatingPanel'
          });
          setPanelSize(newSize);
          // Update position when resizing from top or left edges
          setPanelPosition({ x: position.x, y: position.y });
        }
      }}
      style={{
        zIndex: 999999,
        // Bouncy spring animation - only when programmatically repositioning, not during drag
        transition: shouldAnimate
          ? 'all 500ms cubic-bezier(0.68, -0.55, 0.265, 1.55)'
          : 'none',
      }}
    >
      <div
        style={{
          width: '100%',
          height: isMinimized ? '60px' : '100%',
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          borderRadius: '16px',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
          border: '1px solid rgba(0, 0, 0, 0.1)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
          transition: 'height 300ms cubic-bezier(0.4, 0.0, 0.2, 1)',
        }}
      >
        {/* Header - Draggable */}
        <div
          style={{
            padding: '16px',
            borderBottom: isMinimized ? 'none' : '1px solid rgba(0, 0, 0, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            cursor: 'move',
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #0077B5 0%, #00A0DC 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontSize: '12px',
                fontWeight: 'bold',
              }}
            >
              UP
            </div>
            <h2
              style={{
                fontSize: '14px',
                fontWeight: '600',
                margin: 0,
                color: '#1d1d1f',
              }}
            >
              Uproot
            </h2>
          </div>

          <div style={{ display: 'flex', gap: '4px' }}>
            <button
              onClick={handleMinimize}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '6px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '6px',
                transition: 'background-color 150ms',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.05)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
              title={isMinimized ? 'Maximize' : 'Minimize'}
            >
              {isMinimized ? (
                <Maximize2 size={14} color="#6e6e73" />
              ) : (
                <Minimize2 size={14} color="#6e6e73" />
              )}
            </button>

            <button
              onClick={handleClose}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '6px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '6px',
                transition: 'background-color 150ms',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255, 59, 48, 0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
              title="Close"
            >
              <X size={14} color="#FF3B30" />
            </button>
          </div>
        </div>

        {/* Tab Navigation & Content */}
        {!isMinimized && (
          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
            }}
          >
            <TabNavigation
              activeTab={activeTab}
              onTabChange={(tab) => {
        log.action('Tab changed', { from: activeTab, to: tab, component: 'FloatingPanel' });
        setActiveTab(tab);
      }}
              panelWidth={panelSize.width}
            />
          </div>
        )}
      </div>
    </Rnd>
  );
}
