/**
 * Content Script - Panel Injection + Watchlist Monitoring
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import { FloatingPanel } from '@/components/FloatingPanel';
import { monitorCurrentPage } from '@/services/watchlist-monitor';
import { getCompanyWatchlist, getWatchlist, getOnboardingState } from '@/utils/storage';
import { isJobPage, scrapeJobData, waitForJobDetails } from '@/services/linkedin-job-scraper';

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
        // NO floating widgets - user wants everything in popup only
        startMonitoring();
      }, 1000);

      // Listen for URL changes (LinkedIn is an SPA)
      observeUrlChanges();
    }

    /**
     * Start monitoring watchlist items on current page
     */
    async function startMonitoring() {
      try {
        console.log('[Uproot] Starting watchlist monitoring...');

        // Get watchlist data and preferences
        const [companies, people, onboardingState] = await Promise.all([
          getCompanyWatchlist(),
          getWatchlist(),
          getOnboardingState(),
        ]);

        if (!onboardingState.preferences) {
          console.log('[Uproot] No preferences set, skipping monitoring');
          return;
        }

        console.log('[Uproot] Monitoring:', {
          companies: companies.length,
          people: people.length,
          preferences: onboardingState.preferences,
        });

        // Monitor current page
        await monitorCurrentPage(companies, people, onboardingState.preferences);
      } catch (error) {
        console.error('[Uproot] Error in monitoring:', error);
      }
    }

    /**
     * Detect URL changes in LinkedIn SPA
     */
    function observeUrlChanges() {
      let lastUrl = window.location.href;

      // Use MutationObserver to detect navigation
      const observer = new MutationObserver(() => {
        const currentUrl = window.location.href;
        if (currentUrl !== lastUrl) {
          console.log('[Uproot] URL changed:', currentUrl);
          lastUrl = currentUrl;

          // Wait for page to settle, then monitor
          setTimeout(() => {
            // NO floating widgets
            startMonitoring();
          }, 2000);
        }
      });

      // Observe changes to the body
      observer.observe(document.body, {
        childList: true,
        subtree: true,
      });

      console.log('[Uproot] URL observer started');
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

    // Listen for messages from popup
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
        return true;
      }

      if (message.type === 'ANALYZE_CURRENT_JOB') {
        console.log('[Uproot] Analyzing current job page...');

        // Check if on job page
        if (!isJobPage()) {
          console.log('[Uproot] Not on a job page');
          sendResponse({ success: false, error: 'Not on a LinkedIn job page' });
          return true;
        }

        // Wait for job details to load, then scrape
        waitForJobDetails()
          .then(() => {
            const jobData = scrapeJobData();
            if (!jobData) {
              throw new Error('Could not extract job data');
            }
            console.log('[Uproot] Scraped job:', jobData.jobTitle);
            sendResponse({ success: true, data: jobData });
          })
          .catch((error) => {
            console.error('[Uproot] Scraping error:', error);
            sendResponse({ success: false, error: error.message });
          });

        return true; // Keep message channel open for async response
      }

      return false;
    });
  },
});
