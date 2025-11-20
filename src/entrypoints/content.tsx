/**
 * Content Script - Panel Injection + Watchlist Monitoring
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import { FloatingPanel } from '@/components/FloatingPanel';
import { monitorCurrentPage } from '@/services/watchlist-monitor';
import { getCompanyWatchlist, getWatchlist, getOnboardingState } from '@/utils/storage';
import { isJobPage, scrapeJobData, waitForJobDetails } from '@/services/linkedin-job-scraper';
import { log, LogCategory } from '../utils/logger';

export default defineContentScript({
  matches: ['https://www.linkedin.com/*'],

  main() {
    // Log content script initialization
    log.info(LogCategory.CONTENT_SCRIPT, 'Content script loaded', {
      url: window.location.href,
      pathname: window.location.pathname,
      isLinkedIn: window.location.hostname.includes('linkedin.com'),
      readyState: document.readyState,
    });

    // Wait for page to load
    if (document.readyState === 'loading') {
      log.debug(LogCategory.CONTENT_SCRIPT, 'Waiting for DOMContentLoaded event');
      document.addEventListener('DOMContentLoaded', init);
    } else {
      log.debug(LogCategory.CONTENT_SCRIPT, 'Document already loaded, initializing immediately');
      init();
    }

    /**
     * Detect LinkedIn page type
     */
    function detectLinkedInPage(): string {
      const path = window.location.pathname;
      let pageType = 'unknown';

      if (path.includes('/feed')) pageType = 'feed';
      else if (path.includes('/jobs')) pageType = 'jobs';
      else if (path.includes('/in/')) pageType = 'profile';
      else if (path.includes('/company/')) pageType = 'company';
      else if (path.includes('/search')) pageType = 'search';
      else if (path.includes('/messaging')) pageType = 'messaging';
      else if (path.includes('/mynetwork')) pageType = 'mynetwork';

      log.info(LogCategory.CONTENT_SCRIPT, 'LinkedIn page detected', {
        pageType,
        path,
        url: window.location.href
      });

      return pageType;
    }

    function init() {
      log.debug(LogCategory.CONTENT_SCRIPT, 'Initializing content script');

      // Detect page type
      const pageType = detectLinkedInPage();

      // Wait a bit for LinkedIn to finish loading
      setTimeout(() => {
        log.debug(LogCategory.CONTENT_SCRIPT, 'Starting post-load initialization', { pageType });
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
      const stopTimer = log.startTimer(LogCategory.CONTENT_SCRIPT, 'watchlist monitoring');

      try {
        log.info(LogCategory.CONTENT_SCRIPT, 'Starting watchlist monitoring');

        // Get watchlist data and preferences
        const [companies, people, onboardingState] = await Promise.all([
          getCompanyWatchlist(),
          getWatchlist(),
          getOnboardingState(),
        ]);

        log.debug(LogCategory.CONTENT_SCRIPT, 'Watchlist data loaded', {
          companyCount: companies.length,
          peopleCount: people.length,
          hasPreferences: !!onboardingState.preferences,
        });

        if (!onboardingState.preferences) {
          log.info(LogCategory.CONTENT_SCRIPT, 'No preferences set, skipping monitoring');
          stopTimer();
          return;
        }

        log.info(LogCategory.CONTENT_SCRIPT, 'Starting page monitoring with watchlist', {
          companies: companies.length,
          people: people.length,
          preferences: onboardingState.preferences,
        });

        // Monitor current page
        await monitorCurrentPage(companies, people, onboardingState.preferences);

        log.info(LogCategory.CONTENT_SCRIPT, 'Page monitoring completed successfully');
        stopTimer();
      } catch (error) {
        log.error(LogCategory.CONTENT_SCRIPT, 'Watchlist monitoring failed', error as Error);
        stopTimer();
      }
    }

    /**
     * Detect URL changes in LinkedIn SPA
     */
    function observeUrlChanges() {
      let lastUrl = window.location.href;

      log.info(LogCategory.CONTENT_SCRIPT, 'Starting URL change observer', {
        initialUrl: lastUrl
      });

      // Use MutationObserver to detect navigation
      const observer = new MutationObserver((mutations) => {
        const currentUrl = window.location.href;
        if (currentUrl !== lastUrl) {
          log.info(LogCategory.CONTENT_SCRIPT, 'URL changed detected', {
            from: lastUrl,
            to: currentUrl
          });

          lastUrl = currentUrl;

          // Detect new page type
          detectLinkedInPage();

          // Wait for page to settle, then monitor
          log.debug(LogCategory.CONTENT_SCRIPT, 'Waiting for page to settle before monitoring');
          setTimeout(() => {
            // NO floating widgets
            startMonitoring();
          }, 2000);
        } else {
          // Log DOM mutations at debug level (can be frequent)
          log.debug(LogCategory.CONTENT_SCRIPT, 'DOM mutations detected', {
            count: mutations.length,
            types: mutations.map(m => m.type).filter((v, i, a) => a.indexOf(v) === i) // unique types
          });
        }
      });

      // Observe changes to the body
      observer.observe(document.body, {
        childList: true,
        subtree: true,
      });

      log.info(LogCategory.CONTENT_SCRIPT, 'URL observer started successfully');
    }

    function injectPanel() {
      log.debug(LogCategory.CONTENT_SCRIPT, 'Attempting to inject floating panel');

      // Check if already exists
      if (document.getElementById('linkedin-extension-root')) {
        log.info(LogCategory.CONTENT_SCRIPT, 'Panel already exists, skipping injection');
        return;
      }

      try {
        log.debug(LogCategory.CONTENT_SCRIPT, 'Creating panel container element');

        // Create container
        const container = document.createElement('div');
        container.id = 'linkedin-extension-root';
        container.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; z-index: 999999;';

        // Add to page
        document.body.appendChild(container);

        log.debug(LogCategory.CONTENT_SCRIPT, 'Panel container added to DOM');

        // Create a wrapper for the panel that can receive pointer events
        const panelWrapper = document.createElement('div');
        panelWrapper.style.cssText = 'pointer-events: auto;';
        container.appendChild(panelWrapper);

        // Render React
        log.debug(LogCategory.CONTENT_SCRIPT, 'Rendering React FloatingPanel component');
        const root = ReactDOM.createRoot(panelWrapper);
        root.render(
          <React.StrictMode>
            <FloatingPanel />
          </React.StrictMode>
        );

        log.info(LogCategory.CONTENT_SCRIPT, 'Floating panel injected successfully', {
          containerId: container.id,
          zIndex: container.style.zIndex
        });
      } catch (error) {
        log.error(LogCategory.CONTENT_SCRIPT, 'Panel injection failed', error as Error);
      }
    }

    // Listen for messages from popup
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      log.debug(LogCategory.CONTENT_SCRIPT, 'Message received from background/popup', {
        type: message.type,
        hasSender: !!sender,
        senderId: sender?.id
      });

      try {
        if (message.type === 'TOGGLE_PANEL') {
          log.info(LogCategory.CONTENT_SCRIPT, 'Processing TOGGLE_PANEL message');

          const container = document.getElementById('linkedin-extension-root');
          if (container) {
            const isHidden = container.style.display === 'none';
            container.style.display = isHidden ? '' : 'none';
            const action = isHidden ? 'shown' : 'hidden';

            log.info(LogCategory.CONTENT_SCRIPT, 'Panel toggled', {
              action,
              wasHidden: isHidden,
              newDisplay: container.style.display
            });

            sendResponse({ success: true, action });
          } else {
            log.info(LogCategory.CONTENT_SCRIPT, 'Container not found, injecting new panel');
            injectPanel();
            sendResponse({ success: true, action: 'injected' });
          }
          return true;
        }

        if (message.type === 'ANALYZE_CURRENT_JOB') {
          log.info(LogCategory.CONTENT_SCRIPT, 'Processing ANALYZE_CURRENT_JOB message');

          // Check if on job page
          if (!isJobPage()) {
            log.info(LogCategory.CONTENT_SCRIPT, 'Not on a job page, cannot analyze', {
              currentPath: window.location.pathname
            });
            sendResponse({ success: false, error: 'Not on a LinkedIn job page' });
            return true;
          }

          log.debug(LogCategory.CONTENT_SCRIPT, 'On job page, waiting for details to load');

          // Wait for job details to load, then scrape
          waitForJobDetails()
            .then(() => {
              log.debug(LogCategory.CONTENT_SCRIPT, 'Job details loaded, starting scrape');

              const jobData = scrapeJobData();
              if (!jobData) {
                throw new Error('Could not extract job data');
              }

              log.info(LogCategory.CONTENT_SCRIPT, 'Job data scraped successfully', {
                jobTitle: jobData.jobTitle,
                companyName: jobData.companyName,
                hasDescription: !!jobData.description,
                descriptionLength: jobData.description?.length || 0
              });

              sendResponse({ success: true, data: jobData });
            })
            .catch((error) => {
              log.error(LogCategory.CONTENT_SCRIPT, 'Job scraping failed', error as Error, {
                currentUrl: window.location.href
              });
              sendResponse({ success: false, error: error.message });
            });

          return true; // Keep message channel open for async response
        }

        log.debug(LogCategory.CONTENT_SCRIPT, 'Unknown message type, ignoring', {
          type: message.type
        });

        return false;
      } catch (error) {
        log.error(LogCategory.CONTENT_SCRIPT, 'Message handling failed', error as Error, {
          messageType: message.type
        });
        sendResponse({ success: false, error: (error as Error).message });
        return true;
      }
    });
  },
});
