/**
 * Content Script - Panel Injection + Watchlist Monitoring
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import { FloatingPanel } from '@/components/FloatingPanel';
import { MinimalAutofillPanel } from '@/components/MinimalAutofillPanel';
import { monitorCurrentPage } from '@/services/watchlist-monitor';
import { getCompanyWatchlist, getWatchlist, getOnboardingState } from '@/utils/storage';
import { isJobPage, scrapeJobData, waitForJobDetails } from '@/services/linkedin-job-scraper';
import { log, LogCategory } from '../utils/logger';
import { detectPageContext, getPanelType } from '../utils/page-context';
import { getCurrentLinkedInUser } from '@/utils/linkedin-scraper';
import { addProfileToGraph } from '@/services/network-builder-service';
import { scrapeConnectionsSafe, pauseScraping, resumeScraping } from '@/lib/scrapers/connection-scraper';
import type { NetworkNode } from '@/types';
import '@/utils/load-test-data'; // Expose test data utilities to window

export default defineContentScript({
  matches: ['<all_urls>'],

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

      // Detect page context (LinkedIn, job application, or other)
      const pageInfo = detectPageContext();
      const panelType = getPanelType(pageInfo);

      log.info(LogCategory.CONTENT_SCRIPT, 'Page context detected', {
        context: pageInfo.context,
        panelType,
        atsSystem: pageInfo.atsSystem,
        confidence: pageInfo.confidence,
      });

      // Wait a bit for page to finish loading
      setTimeout(async () => {
        log.debug(LogCategory.CONTENT_SCRIPT, 'Starting post-load initialization', { panelType });

        // Inject appropriate panel
        if (panelType !== 'none') {
          injectPanel(panelType);
        } else {
          log.info(LogCategory.CONTENT_SCRIPT, 'No panel needed for this page');
        }

        // Only start watchlist monitoring on LinkedIn
        if (pageInfo.isLinkedIn) {
          const linkedInPageType = detectLinkedInPage();
          log.debug(LogCategory.CONTENT_SCRIPT, 'LinkedIn page type', { linkedInPageType });
          startMonitoring();

          // ALSO trigger network building on initial page load
          const currentUrl = window.location.href;
          if (currentUrl.includes('linkedin.com/in/') && !currentUrl.includes('/edit/')) {
            try {
              log.info(LogCategory.NETWORK, 'LinkedIn profile detected on page load, adding to network graph');

              // Get current user's profile URL for edge creation
              const currentUserProfile = getCurrentLinkedInUser();
              const currentUserId = currentUserProfile?.profileUrl;

              const result = await addProfileToGraph(currentUrl, currentUserId);
              if (result.success) {
                log.info(LogCategory.NETWORK, result.message);
              } else {
                log.warn(LogCategory.NETWORK, `Failed to add profile: ${result.message}`);
              }
            } catch (error) {
              log.error(LogCategory.NETWORK, 'Error building network graph on page load', error as Error);
            }
          }
        }
      }, 1000);

      // Listen for URL changes (for SPAs)
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
      } catch (error: any) {
        // Silently handle extension context invalidation during reloads
        if (error?.message?.includes('Extension context invalidated')) {
          stopTimer();
          return;
        }
        // Log other errors normally
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

          // Wait for page to settle, then monitor and build network
          log.debug(LogCategory.CONTENT_SCRIPT, 'Waiting for page to settle before monitoring');
          setTimeout(async () => {
            // NO floating widgets
            startMonitoring();

            // Auto-build network graph when visiting LinkedIn profiles
            if (currentUrl.includes('linkedin.com/in/') && !currentUrl.includes('/edit/')) {
              try {
                log.info(LogCategory.NETWORK, 'LinkedIn profile detected, adding to network graph');

                // Get current user's profile URL for edge creation
                const currentUserProfile = getCurrentLinkedInUser();
                const currentUserId = currentUserProfile?.profileUrl;

                const result = await addProfileToGraph(currentUrl, currentUserId);
                if (result.success) {
                  log.info(LogCategory.NETWORK, result.message);
                } else {
                  log.warn(LogCategory.NETWORK, `Failed to add profile: ${result.message}`);
                }
              } catch (error) {
                log.error(LogCategory.NETWORK, 'Error building network graph', error as Error);
              }
            }
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

    function injectPanel(panelType: 'full' | 'minimal') {
      log.debug(LogCategory.CONTENT_SCRIPT, 'Attempting to inject panel', { panelType });

      // Use different container IDs for different panels
      const containerId = panelType === 'full' ? 'linkedin-extension-root' : 'uproot-autofill-root';

      // Check if already exists
      if (document.getElementById(containerId)) {
        log.info(LogCategory.CONTENT_SCRIPT, 'Panel already exists, skipping injection', { panelType });
        return;
      }

      try {
        log.debug(LogCategory.CONTENT_SCRIPT, 'Creating panel container element', { panelType });

        // Create container
        const container = document.createElement('div');
        container.id = containerId;
        container.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; z-index: 2147483647; isolation: isolate;';

        // Add to page
        document.body.appendChild(container);

        log.debug(LogCategory.CONTENT_SCRIPT, 'Panel container added to DOM', { containerId });

        // Create a wrapper for the panel that can receive pointer events
        const panelWrapper = document.createElement('div');
        panelWrapper.style.cssText = 'pointer-events: auto;';
        container.appendChild(panelWrapper);

        // Render appropriate React component based on panel type
        const root = ReactDOM.createRoot(panelWrapper);

        if (panelType === 'full') {
          log.debug(LogCategory.CONTENT_SCRIPT, 'Rendering FloatingPanel (LinkedIn)');
          root.render(
            <React.StrictMode>
              <FloatingPanel />
            </React.StrictMode>
          );
        } else {
          log.debug(LogCategory.CONTENT_SCRIPT, 'Rendering MinimalAutofillPanel (job application)');
          root.render(
            <React.StrictMode>
              <MinimalAutofillPanel />
            </React.StrictMode>
          );
        }

        log.info(LogCategory.CONTENT_SCRIPT, 'Panel injected successfully', {
          panelType,
          containerId,
          zIndex: container.style.zIndex
        });
      } catch (error) {
        log.error(LogCategory.CONTENT_SCRIPT, 'Panel injection failed', error as Error, { panelType });
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

          // Detect which panel should be shown
          const pageInfo = detectPageContext();
          const panelType = getPanelType(pageInfo);
          const containerId = panelType === 'full' ? 'linkedin-extension-root' : 'uproot-autofill-root';

          const container = document.getElementById(containerId);
          if (container) {
            const isHidden = container.style.display === 'none';
            container.style.display = isHidden ? '' : 'none';
            const action = isHidden ? 'shown' : 'hidden';

            log.info(LogCategory.CONTENT_SCRIPT, 'Panel toggled', {
              action,
              panelType,
              wasHidden: isHidden,
              newDisplay: container.style.display
            });

            sendResponse({ success: true, action });
          } else if (panelType !== 'none') {
            log.info(LogCategory.CONTENT_SCRIPT, 'Container not found, injecting new panel', { panelType });
            injectPanel(panelType);
            sendResponse({ success: true, action: 'injected' });
          } else {
            log.info(LogCategory.CONTENT_SCRIPT, 'No panel needed for this page');
            sendResponse({ success: false, error: 'Extension not available on this page' });
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

          // Wrap with explicit timeout to ensure response before background layer timeout
          // Content Script Wrapper: 27s - forces sendResponse before background timeout (28s)
          const detailsPromise = Promise.race([
            waitForJobDetails(),
            new Promise<boolean>((resolve) =>
              setTimeout(() => resolve(false), 27000) // 27s to ensure response before background timeout
            )
          ]);

          detailsPromise
            .then((success) => {
              // Check if job details loaded successfully
              if (!success) {
                log.warn(LogCategory.CONTENT_SCRIPT, 'Job details failed to load within timeout');
                sendResponse({
                  success: false,
                  error: 'Job details failed to load within timeout'
                });
                return;
              }

              log.debug(LogCategory.CONTENT_SCRIPT, 'Job details loaded, starting scrape');

              const jobData = scrapeJobData();
              if (!jobData) {
                throw new Error('Could not extract job data');
              }

              log.info(LogCategory.CONTENT_SCRIPT, 'Job data scraped successfully', {
                jobTitle: jobData.jobTitle,
                companyName: jobData.company,
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

        if (message.type === 'SAVE_HIGHLIGHTED_QUESTION') {
          log.info(LogCategory.CONTENT_SCRIPT, 'Processing SAVE_HIGHLIGHTED_QUESTION message');

          // Get highlighted text
          const selectedText = window.getSelection()?.toString().trim();
          if (!selectedText) {
            log.warn(LogCategory.CONTENT_SCRIPT, 'No text highlighted to save');
            sendResponse({ success: false, error: 'No text highlighted' });
            return true;
          }

          log.debug(LogCategory.CONTENT_SCRIPT, 'Text highlighted', {
            length: selectedText.length,
            preview: selectedText.substring(0, 50)
          });

          // Save question to storage
          import('../utils/autofill-storage').then(async ({ saveQuestion }) => {
            try {
              const question = await saveQuestion(selectedText);
              log.info(LogCategory.CONTENT_SCRIPT, 'Question saved successfully', {
                id: question.id,
                questionPreview: selectedText.substring(0, 50)
              });

              // Show notification
              const notification = document.createElement('div');
              notification.textContent = '✓ Question saved!';
              notification.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                background: #28A745;
                color: white;
                padding: 12px 20px;
                border-radius: 8px;
                font-family: system-ui;
                font-size: 14px;
                font-weight: 600;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
                z-index: 2147483646;
                isolation: isolate;
                animation: slideIn 0.3s ease-out;
              `;
              document.body.appendChild(notification);

              setTimeout(() => {
                notification.remove();
              }, 2000);

              sendResponse({ success: true, question });
            } catch (error) {
              log.error(LogCategory.CONTENT_SCRIPT, 'Failed to save question', error as Error);
              sendResponse({ success: false, error: (error as Error).message });
            }
          });

          return true; // Keep message channel open for async response
        }

        if (message.type === 'PASTE_TO_GENERATE') {
          log.info(LogCategory.CONTENT_SCRIPT, 'Processing PASTE_TO_GENERATE message');

          // Get highlighted text
          const selectedText = window.getSelection()?.toString().trim();
          if (!selectedText) {
            log.warn(LogCategory.CONTENT_SCRIPT, 'No text highlighted to paste');
            sendResponse({ success: false, error: 'No text highlighted' });
            return true;
          }

          log.debug(LogCategory.CONTENT_SCRIPT, 'Text highlighted for paste to Generate', {
            length: selectedText.length,
            preview: selectedText.substring(0, 50)
          });

          // Dispatch custom event to notify panel to paste text
          const event = new CustomEvent('uproot:pasteToGenerate', {
            detail: { question: selectedText }
          });
          window.dispatchEvent(event);

          log.info(LogCategory.CONTENT_SCRIPT, 'Paste to Generate event dispatched', {
            questionLength: selectedText.length
          });

          sendResponse({ success: true });
          return true;
        }

        if (message.type === 'GET_CURRENT_USER') {
          log.info(LogCategory.CONTENT_SCRIPT, 'Processing GET_CURRENT_USER message');

          try {
            // Call getCurrentLinkedInUser to scrape current user data
            const userProfile = getCurrentLinkedInUser();

            if (!userProfile) {
              log.warn(LogCategory.CONTENT_SCRIPT, 'Could not detect current LinkedIn user', {
                url: window.location.href,
                isLinkedIn: window.location.hostname.includes('linkedin.com')
              });
              sendResponse({
                success: false,
                error: 'Could not detect current LinkedIn user. Make sure you are logged in to LinkedIn.'
              });
              return true;
            }

            log.info(LogCategory.CONTENT_SCRIPT, 'Current user detected successfully', {
              name: userProfile.name,
              hasPhotoUrl: !!userProfile.photoUrl,
              hasHeadline: !!userProfile.headline
            });

            sendResponse({ success: true, data: userProfile });
          } catch (error) {
            log.error(LogCategory.CONTENT_SCRIPT, 'Failed to get current user', error as Error);
            sendResponse({
              success: false,
              error: (error as Error).message || 'Unknown error occurred while detecting current user'
            });
          }

          return true; // Keep message channel open for async response
        }

        if (message.type === 'EXECUTE_CONNECTION_SCRAPE') {
          log.info(LogCategory.CONTENT_SCRIPT, 'Processing EXECUTE_CONNECTION_SCRAPE message', {
            params: message.payload?.params,
            taskId: message.payload?.taskId
          });

          (async () => {
            try {
              const { params, taskId } = message.payload || {};
              const resume = params?.resume ?? true;

              log.debug(LogCategory.CONTENT_SCRIPT, 'Starting connection scrape', {
                taskId,
                resume,
                currentUrl: window.location.href
              });

              // Execute scrapeConnectionsSafe with progress callback
              const connections: NetworkNode[] = await scrapeConnectionsSafe({
                resume,
                onProgress: (update) => {
                  // Send progress updates back to Service Worker
                  chrome.runtime.sendMessage({
                    type: 'SCRAPER_PROGRESS',
                    payload: {
                      taskId,
                      taskType: 'connection',
                      current: update.scraped,
                      total: update.total,
                      status: `Scraping connections... (${update.scraped}/${update.total || '?'})`,
                      lastUpdate: new Date().toISOString(),
                    },
                  }).catch((error) => {
                    log.warn(LogCategory.CONTENT_SCRIPT, 'Failed to send progress update', {
                      error: error.message,
                      taskId
                    });
                  });

                  log.debug(LogCategory.CONTENT_SCRIPT, 'Connection scrape progress', {
                    taskId,
                    scraped: update.scraped,
                    total: update.total,
                    status: update.status
                  });
                },
              });

              log.info(LogCategory.CONTENT_SCRIPT, 'Connection scrape completed successfully', {
                taskId,
                connectionsScraped: connections.length
              });

              // Send completion message
              chrome.runtime.sendMessage({
                type: 'SCRAPER_COMPLETED',
                payload: {
                  taskId,
                  result: { connectionsScraped: connections.length },
                },
              }).catch((error) => {
                log.warn(LogCategory.CONTENT_SCRIPT, 'Failed to send completion message', {
                  error: error.message,
                  taskId
                });
              });

              sendResponse({
                success: true,
                data: { connectionsScraped: connections.length }
              });
            } catch (error) {
              log.error(LogCategory.CONTENT_SCRIPT, 'Connection scrape failed', error as Error, {
                taskId: message.payload?.taskId
              });

              // Send failure message to Service Worker
              const errorMessage = (error as Error).message || 'Unknown error during connection scrape';
              chrome.runtime.sendMessage({
                type: 'SCRAPER_FAILED',
                payload: {
                  taskId: message.payload?.taskId,
                  error: errorMessage,
                },
              }).catch((msgError) => {
                log.warn(LogCategory.CONTENT_SCRIPT, 'Failed to send failure message', {
                  error: msgError.message,
                  taskId: message.payload?.taskId
                });
              });

              sendResponse({
                success: false,
                error: errorMessage
              });
            }
          })();

          return true; // Keep message channel open for async response
        }

        if (message.type === 'PAUSE_CONNECTION_SCRAPE') {
          log.info(LogCategory.CONTENT_SCRIPT, 'Processing PAUSE_CONNECTION_SCRAPE message');

          try {
            pauseScraping();
            log.info(LogCategory.CONTENT_SCRIPT, 'Connection scraping paused');
            sendResponse({ success: true });
          } catch (error) {
            log.error(LogCategory.CONTENT_SCRIPT, 'Failed to pause connection scraping', error as Error);
            sendResponse({
              success: false,
              error: (error as Error).message
            });
          }

          return true;
        }

        if (message.type === 'RESUME_CONNECTION_SCRAPE') {
          log.info(LogCategory.CONTENT_SCRIPT, 'Processing RESUME_CONNECTION_SCRAPE message');

          try {
            resumeScraping();
            log.info(LogCategory.CONTENT_SCRIPT, 'Connection scraping resumed');
            sendResponse({ success: true });
          } catch (error) {
            log.error(LogCategory.CONTENT_SCRIPT, 'Failed to resume connection scraping', error as Error);
            sendResponse({
              success: false,
              error: (error as Error).message
            });
          }

          return true;
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
