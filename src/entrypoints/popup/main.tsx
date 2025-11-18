/**
 * Popup Entry Point (Optional)
 * Small popup shown when clicking extension icon
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import '@/styles/globals.css';

function Popup() {
  const openPanel = () => {
    // Send message to content script to open panel
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.id) {
        chrome.tabs.sendMessage(tabs[0].id, { type: 'TOGGLE_PANEL' });
        window.close();
      }
    });
  };

  return (
    <div className="w-64 p-4 bg-white dark:bg-gray-900">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold">
          LN
        </div>
        <div>
          <h1 className="font-semibold text-sm">LinkedIn Network Pro</h1>
          <p className="text-xs text-gray-500">AI-powered networking</p>
        </div>
      </div>

      <button
        onClick={openPanel}
        className="btn-primary w-full mb-2"
      >
        Open Panel
      </button>

      <div className="text-xs text-gray-500 text-center mt-4">
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
