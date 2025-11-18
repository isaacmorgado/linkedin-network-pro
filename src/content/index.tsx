/**
 * Content Script - Injected into LinkedIn pages
 *
 * Responsibilities:
 * - Detect LinkedIn page type (profile, job, feed, etc.)
 * - Scrape data from LinkedIn DOM
 * - Inject floating panel UI
 * - Handle SPA navigation
 * - Communicate with service worker
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import { FloatingPanel } from '@/components/FloatingPanel';
import { detectPageType, scrapeProfileData, scrapeJobData } from './scrapers';
import '@/styles/globals.css';

console.log('LinkedIn Extension content script loaded');

// ============================================================================
// Page Type Detection
// ============================================================================

let currentPageType: string | null = null;
let panelRoot: ReactDOM.Root | null = null;
let panelContainer: HTMLElement | null = null;

/**
 * Detect which LinkedIn page we're on
 */
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

/**
 * Update panel context when page changes
 */
function updatePanelContext(pageType: string | null) {
  // Send page context to panel
  const event = new CustomEvent('linkedin-extension:page-change', {
    detail: { pageType, url: window.location.href }
  });
  window.dispatchEvent(event);
}

// ============================================================================
// SPA Navigation Detection
// ============================================================================

/**
 * Detect LinkedIn's SPA navigation using MutationObserver + History API
 */
let lastUrl = window.location.href;

// Monitor URL changes
const urlObserver = new MutationObserver(() => {
  const currentUrl = window.location.href;
  if (currentUrl !== lastUrl) {
    lastUrl = currentUrl;
    handlePageChange();
  }
});

// Start observing
urlObserver.observe(document.body, {
  childList: true,
  subtree: true,
});

// Also hook into History API
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

// ============================================================================
// Floating Panel Injection
// ============================================================================

/**
 * Inject floating panel into page using Shadow DOM
 */
function injectFloatingPanel() {
  // Check if already injected
  if (document.getElementById('linkedin-extension-root')) {
    console.log('Panel already injected');
    return;
  }

  // Create container
  panelContainer = document.createElement('div');
  panelContainer.id = 'linkedin-extension-root';

  // Use Shadow DOM to isolate styles
  const shadowRoot = panelContainer.attachShadow({ mode: 'open' });

  // Create style container for Tailwind
  const styleContainer = document.createElement('div');

  // Inject our CSS into shadow DOM
  const style = document.createElement('style');
  // Note: In production, this would be injected by the build system
  style.textContent = `
    @import url('chrome-extension://${chrome.runtime.id}/content.css');
  `;
  shadowRoot.appendChild(style);
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

// ============================================================================
// Message Handlers
// ============================================================================

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

/**
 * Toggle panel visibility
 */
function togglePanel() {
  if (!panelContainer) {
    injectFloatingPanel();
  } else {
    const isVisible = panelContainer.style.display !== 'none';
    panelContainer.style.display = isVisible ? 'none' : 'block';
  }
}

// ============================================================================
// Rate Limiting for Scraping
// ============================================================================

class RateLimiter {
  private queue: Array<() => void> = [];
  private processing = false;
  private lastActionTime = 0;
  private readonly minDelay = 2000; // 2 seconds minimum between actions

  async throttle<T>(action: () => T): Promise<T> {
    return new Promise((resolve) => {
      this.queue.push(() => {
        const result = action();
        resolve(result);
      });

      this.processQueue();
    });
  }

  private async processQueue() {
    if (this.processing || this.queue.length === 0) return;

    this.processing = true;

    while (this.queue.length > 0) {
      const now = Date.now();
      const timeSinceLastAction = now - this.lastActionTime;

      if (timeSinceLastAction < this.minDelay) {
        await this.delay(this.minDelay - timeSinceLastAction);
      }

      const action = this.queue.shift();
      if (action) {
        action();
        this.lastActionTime = Date.now();
      }

      // Random additional delay (human-like behavior)
      await this.delay(Math.random() * 1000 + 500);
    }

    this.processing = false;
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

export const rateLimiter = new RateLimiter();

// ============================================================================
// Initialization
// ============================================================================

// Wait for page to be ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

function init() {
  console.log('Initializing LinkedIn extension content script');

  // Detect initial page type
  handlePageChange();

  // Inject panel after a short delay to ensure LinkedIn is loaded
  setTimeout(() => {
    injectFloatingPanel();
  }, 1000);
}
