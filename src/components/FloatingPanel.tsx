/**
 * Main Floating Panel Component - SIMPLIFIED VERSION THAT ACTUALLY WORKS
 */

import React from 'react';
import { Rnd } from 'react-rnd';
import { X } from 'lucide-react';

export function FloatingPanel() {
  const handleClose = () => {
    const container = document.getElementById('linkedin-extension-root');
    if (container) {
      container.style.display = 'none';
    }
  };

  return (
    <Rnd
      default={{
        x: 100,
        y: 100,
        width: 400,
        height: 500,
      }}
      minWidth={350}
      minHeight={400}
      bounds="window"
      style={{
        zIndex: 999999,
      }}
    >
      <div
        style={{
          width: '100%',
          height: '100%',
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          borderRadius: '16px',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
          border: '1px solid rgba(0, 0, 0, 0.1)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        }}
      >
        {/* Header - Draggable */}
        <div
          style={{
            padding: '16px',
            borderBottom: '1px solid rgba(0, 0, 0, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            cursor: 'move',
            backgroundColor: 'rgba(255, 255, 255, 0.8)',
          }}
        >
          <h2 style={{ fontSize: '14px', fontWeight: '600', margin: 0 }}>
            Uproot
          </h2>

          <button
            onClick={handleClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <div
          style={{
            flex: 1,
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            gap: '20px',
          }}
        >
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '16px',
              background: 'linear-gradient(135deg, #0077B5 0%, #00A0DC 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: '24px',
              fontWeight: 'bold',
            }}
          >
            LN
          </div>

          <div>
            <h1 style={{ fontSize: '20px', fontWeight: '600', margin: '0 0 8px 0' }}>
              Uproot
            </h1>
            <p style={{ fontSize: '14px', color: '#666', margin: 0 }}>
              AI-powered networking assistant
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%', maxWidth: '300px' }}>
            <button
              style={{
                width: '100%',
                padding: '12px 24px',
                backgroundColor: '#0077B5',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
              }}
            >
              Sign in with Google
            </button>

            <button
              style={{
                width: '100%',
                padding: '12px 24px',
                backgroundColor: 'white',
                color: '#333',
                border: '1px solid #ddd',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
              }}
            >
              Sign in with Email
            </button>
          </div>

          <p style={{ fontSize: '12px', color: '#999', margin: '20px 0 0 0' }}>
            ✅ Extension is working!<br />
            🎯 Drag this panel to move it<br />
            📍 Phase 1 Complete
          </p>
        </div>
      </div>
    </Rnd>
  );
}
