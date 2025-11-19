/**
 * Popup Entry Point
 * Small popup shown when clicking extension icon
 */

import React from 'react';
import ReactDOM from 'react-dom/client';

function Popup() {
  const togglePanel = () => {
    // Send message to content script to toggle panel
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.id) {
        chrome.tabs.sendMessage(tabs[0].id, { type: 'TOGGLE_PANEL' }, (response) => {
          console.log('Toggle response:', response);
          window.close();
        });
      }
    });
  };

  return (
    <div style={{
      width: '280px',
      padding: '16px',
      backgroundColor: 'white',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        marginBottom: '16px',
      }}>
        <div style={{
          width: '40px',
          height: '40px',
          borderRadius: '12px',
          background: 'linear-gradient(135deg, #0077B5 0%, #00A0DC 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontWeight: 'bold',
          fontSize: '14px',
        }}>
          LN
        </div>
        <div>
          <h1 style={{ fontSize: '14px', fontWeight: '600', margin: 0 }}>
            LinkedIn Network Pro
          </h1>
          <p style={{ fontSize: '12px', color: '#666', margin: 0 }}>
            AI-powered networking
          </p>
        </div>
      </div>

      <button
        onClick={togglePanel}
        style={{
          width: '100%',
          padding: '10px 16px',
          backgroundColor: '#0077B5',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          fontSize: '14px',
          fontWeight: '500',
          cursor: 'pointer',
          marginBottom: '8px',
        }}
      >
        Toggle Panel
      </button>

      <div style={{
        fontSize: '11px',
        color: '#999',
        textAlign: 'center',
        marginTop: '12px',
      }}>
        Navigate to LinkedIn to use all features
      </div>
    </div>
  );
}

const root = document.getElementById('root');
if (root) {
  ReactDOM.createRoot(root).render(
    <React.StrictMode>
      <Popup />
    </React.StrictMode>
  );
}
