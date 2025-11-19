/**
 * Content Script - SIMPLIFIED - NO STORAGE, NO IMPORTS, JUST INJECT THE PANEL
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import { FloatingPanel } from '@/components/FloatingPanel';

export default defineContentScript({
  matches: ['https://www.linkedin.com/*'],

  main() {
    console.log('✅ LinkedIn Extension loaded');

    // Wait for page to load
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', init);
    } else {
      init();
    }

    function init() {
      // Wait a bit for LinkedIn to finish loading
      setTimeout(() => {
        injectPanel();
      }, 1000);
    }

    function injectPanel() {
      console.log('🚀 Injecting floating panel...');

      // Check if already exists
      if (document.getElementById('linkedin-extension-root')) {
        console.log('⚠️ Panel already exists');
        return;
      }

      // Create container
      const container = document.createElement('div');
      container.id = 'linkedin-extension-root';
      container.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; z-index: 999999;';

      // Add to page
      document.body.appendChild(container);

      // Create a wrapper for the panel that can receive pointer events
      const panelWrapper = document.createElement('div');
      panelWrapper.style.cssText = 'pointer-events: auto;';
      container.appendChild(panelWrapper);

      // Render React
      const root = ReactDOM.createRoot(panelWrapper);
      root.render(
        <React.StrictMode>
          <FloatingPanel />
        </React.StrictMode>
      );

      console.log('✅ Panel injected!');
    }

    // Listen for toggle messages from popup
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      console.log('📨 Message received:', message);

      if (message.type === 'TOGGLE_PANEL') {
        const container = document.getElementById('linkedin-extension-root');
        if (container) {
          const isHidden = container.style.display === 'none';
          container.style.display = isHidden ? '' : 'none';
          console.log('🔄 Panel toggled:', isHidden ? 'SHOWING' : 'HIDING');
          sendResponse({ success: true, action: isHidden ? 'shown' : 'hidden' });
        } else {
          console.log('⚠️ Container not found, injecting panel...');
          injectPanel();
          sendResponse({ success: true, action: 'injected' });
        }
      }

      return true;
    });
  },
});
