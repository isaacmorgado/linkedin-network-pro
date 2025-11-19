/**
 * Main Floating Panel Component - WITH TAB NAVIGATION
 */

import React, { useState, useRef, useEffect } from 'react';
import { Rnd } from 'react-rnd';
import { X, Minimize2, Maximize2 } from 'lucide-react';
import { TabNavigation } from './navigation/TabNavigation';
import type { TabId } from '../types/navigation';

export function FloatingPanel() {
  const [activeTab, setActiveTab] = useState<TabId>('feed');
  const [panelSize, setPanelSize] = useState({ width: 400, height: 500 });
  const [isMinimized, setIsMinimized] = useState(false);
  const [panelPosition, setPanelPosition] = useState({ x: 100, y: 100 });
  const rndRef = useRef<Rnd>(null);

  const handleClose = () => {
    const container = document.getElementById('linkedin-extension-root');
    if (container) {
      container.style.display = 'none';
    }
  };

  const handleMinimize = () => {
    setIsMinimized(!isMinimized);
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

        // Smooth animation using updatePosition
        rndRef.current?.updatePosition({ x: panelPosition.x, y: newY });
        setPanelPosition({ x: panelPosition.x, y: newY });

        console.log('[Uproot] Auto-repositioned minimized panel:', { from: currentY, to: newY });
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
        top: false,
        right: true,
        bottom: true,
        left: true,
        topRight: false,
        bottomRight: true,
        bottomLeft: true,
        topLeft: false,
      }}
      size={isMinimized ? { width: panelSize.width, height: 60 } : undefined}
      onDragStop={(e, data) => {
        setPanelPosition({ x: data.x, y: data.y });
      }}
      onResize={(e, direction, ref, delta, position) => {
        if (!isMinimized) {
          setPanelSize({
            width: parseInt(ref.style.width),
            height: parseInt(ref.style.height),
          });
        }
      }}
      style={{
        zIndex: 999999,
        transition: isMinimized ? 'all 400ms cubic-bezier(0.4, 0.0, 0.2, 1)' : 'none',
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
              onTabChange={setActiveTab}
              panelWidth={panelSize.width}
            />
          </div>
        )}
      </div>
    </Rnd>
  );
}
