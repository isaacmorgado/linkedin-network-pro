/**
 * Content Script - Injected into LinkedIn pages
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import { FloatingPanel } from '@/components/FloatingPanel';
import { detectPageType, scrapeProfileData, scrapeJobData } from '@/lib/scrapers';
import '@/styles/globals.css';

export default defineContentScript({
  matches: ['https://www.linkedin.com/*'],

  main() {
    console.log('LinkedIn Extension content script loaded');

    let currentPageType: string | null = null;
    let panelRoot: ReactDOM.Root | null = null;
    let panelContainer: HTMLElement | null = null;

    // Initialize the extension
    init();

    function init() {
      console.log('Initializing LinkedIn extension content script');

      // Detect initial page type
      handlePageChange();

      // Set up SPA navigation detection
      setupNavigationDetection();

      // Inject panel after a short delay
      setTimeout(() => {
        injectFloatingPanel();
      }, 1000);
    }

    function handlePageChange() {
      const url = window.location.href;
      const newPageType = detectPageType(url);

      if (newPageType !== currentPageType) {
        console.log('Page type changed:', currentPageType, '->', newPageType);
        currentPageType = newPageType;

        // Update panel UI based on page type
        if (panelRoot && panelContainer) {
          updatePanelContext(newPageType);
        }
      }
    }

    function updatePanelContext(pageType: string | null) {
      // Send page context to panel
      const event = new CustomEvent('linkedin-extension:page-change', {
        detail: { pageType, url: window.location.href }
      });
      window.dispatchEvent(event);
    }

    function setupNavigationDetection() {
      // Monitor URL changes
      let lastUrl = window.location.href;

      const urlObserver = new MutationObserver(() => {
        const currentUrl = window.location.href;
        if (currentUrl !== lastUrl) {
          lastUrl = currentUrl;
          handlePageChange();
        }
      });

      urlObserver.observe(document.body, {
        childList: true,
        subtree: true,
      });

      // Hook into History API
      const originalPushState = history.pushState;
      const originalReplaceState = history.replaceState;

      history.pushState = function (...args) {
        originalPushState.apply(history, args);
        handlePageChange();
      };

      history.replaceState = function (...args) {
        originalReplaceState.apply(history, args);
        handlePageChange();
      };

      // Listen to popstate (back/forward)
      window.addEventListener('popstate', handlePageChange);
    }

    function injectFloatingPanel() {
      // Check if already injected
      if (document.getElementById('linkedin-extension-root')) {
        console.log('Panel already injected');
        return;
      }

      // Create container
      panelContainer = document.createElement('div');
      panelContainer.id = 'linkedin-extension-root';
      panelContainer.style.cssText = 'all: initial; position: fixed; z-index: 2147483647;';

      // Use Shadow DOM to isolate styles
      const shadowRoot = panelContainer.attachShadow({ mode: 'open' });

      // Create style container for Tailwind
      const styleContainer = document.createElement('div');
      styleContainer.style.cssText = 'all: initial;';

      shadowRoot.appendChild(styleContainer);

      // Add to page
      document.body.appendChild(panelContainer);

      // Render React app
      panelRoot = ReactDOM.createRoot(styleContainer);
      panelRoot.render(
        <React.StrictMode>
          <FloatingPanel />
        </React.StrictMode>
      );

      console.log('Floating panel injected');
    }

    // Message handlers
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      console.log('Content script received message:', message.type);

      switch (message.type) {
        case 'TOGGLE_PANEL':
          togglePanel();
          sendResponse({ success: true });
          break;

        case 'SCRAPE_PROFILE':
          const profileData = scrapeProfileData();
          sendResponse({ success: true, data: profileData });
          break;

        case 'SCRAPE_JOB':
          const jobData = scrapeJobData();
          sendResponse({ success: true, data: jobData });
          break;

        default:
          sendResponse({ error: 'Unknown message type' });
      }

      return true;
    });

    function togglePanel() {
      if (!panelContainer) {
        injectFloatingPanel();
      } else {
        const isVisible = panelContainer.style.display !== 'none';
        panelContainer.style.display = isVisible ? 'none' : '';
      }
    }
  },
});
