/**
 * Service Worker (Background Script) - Manifest V3
 *
 * Responsibilities:
 * - Handle extension installation and updates
 * - Manage background alarms for periodic tasks
 * - Handle auth token refresh
 * - Process notifications
 * - Manage message passing between content scripts and UI
 * - Monitor LinkedIn connection acceptances
 */

import { log, LogCategory } from '../utils/logger';
import { detectConnectionAcceptances, logConnectionAcceptance } from '../services/connection-monitor';
import { getConnectionPaths } from '../utils/storage/connection-path-storage';
import { getCompanyWatchlist } from '../utils/storage/company-watchlist-storage';
import { getWatchlist } from '../utils/storage/watchlist-storage';
import { getOnboardingState } from '../utils/storage/onboarding-storage';
import { checkCompanyJobs, checkCompanyUpdates, checkPersonProfile } from '../services/watchlist-monitor';
import { handleOrchestratorMessage, isOrchestratorMessage } from '../services/scraping/message-handlers';
import { scrapingOrchestrator } from '../services/scraping/orchestrator';
import { ScrapingPriority } from '../services/scraping/types';
import { initializeScheduler, setupOnlineStatusMonitoring } from '../services/scraping/scheduler';
import { generateDeadlineAlertsForUser } from '../services/deadline-alerts';
import { getApplications, addFeedItem } from '../utils/storage';
import { cleanupOldFeedItems, getStorageStats } from '../utils/storage/feed-storage';
import { STORAGE_KEYS } from '../types';
import type { SavedJob } from '../types';

export default defineBackground(() => {
  log.info(LogCategory.BACKGROUND, 'Background script initialized');

  // Initialize scraping scheduler
  initializeScheduler();
  setupOnlineStatusMonitoring();

  // ============================================================================
  // Installation & Update Handlers
  // ============================================================================

  chrome.runtime.onInstalled.addListener(async (details) => {
    log.info(LogCategory.BACKGROUND, 'Extension installed', {
      reason: details.reason,
      version: chrome.runtime.getManifest().version
    });

    if (details.reason === 'install') {
      log.info(LogCategory.BACKGROUND, 'First installation - initializing defaults');

      // First install - set default settings
      await initializeDefaultSettings();

      // Create alarm for token refresh
      chrome.alarms.create('token-refresh', {
        periodInMinutes: 30, // Check every 30 minutes
      });
      log.info(LogCategory.BACKGROUND, 'Created token-refresh alarm', { periodInMinutes: 30 });

      // Create alarm for activity monitoring
      chrome.alarms.create('activity-monitor', {
        periodInMinutes: 15, // Check every 15 minutes
      });
      log.info(LogCategory.BACKGROUND, 'Created activity-monitor alarm', { periodInMinutes: 15 });

      // Create alarm for connection acceptance monitoring
      chrome.alarms.create('connection-watcher', {
        periodInMinutes: 30, // Check every 30 minutes
      });
      log.info(LogCategory.BACKGROUND, 'Created connection-watcher alarm', { periodInMinutes: 30 });

      // Create alarm for deadline alerts generation
      chrome.alarms.create('deadline-alerts', {
        periodInMinutes: 360, // Check every 6 hours
        delayInMinutes: 1, // Run 1 minute after install
      });
      log.info(LogCategory.BACKGROUND, 'Created deadline-alerts alarm', { periodInMinutes: 360 });

      // Create alarm for feed cleanup (runs daily)
      chrome.alarms.create('feed-cleanup', {
        periodInMinutes: 1440, // 24 hours = 1440 minutes
        delayInMinutes: 60, // First run 1 hour after install
      });
      log.info(LogCategory.BACKGROUND, 'Created feed-cleanup alarm', { periodInMinutes: 1440 });

      // Create alarm for daily connection sync
      const next3AM = getNext3AM();
      chrome.alarms.create('connection-sync', {
        when: next3AM,
        periodInMinutes: 24 * 60, // Daily
      });
      log.info(LogCategory.BACKGROUND, 'Created connection-sync alarm', { nextRun: new Date(next3AM).toISOString() });
    }

    if (details.reason === 'update') {
      log.info(LogCategory.BACKGROUND, 'Extension updated', {
        previousVersion: details.previousVersion,
        currentVersion: chrome.runtime.getManifest().version
      });
      // Handle migration if needed
    }
  });

  // Extension startup handler
  chrome.runtime.onStartup.addListener(() => {
    log.info(LogCategory.BACKGROUND, 'Extension started');
  });

  // Extension suspend handler
  chrome.runtime.onSuspend.addListener(() => {
    log.info(LogCategory.BACKGROUND, 'Extension suspending');
  });

  // ============================================================================
  // Alarm Handlers
  // ============================================================================

  chrome.alarms.onAlarm.addListener(async (alarm) => {
    log.info(LogCategory.BACKGROUND, 'Alarm triggered', {
      name: alarm.name,
      scheduledTime: new Date(alarm.scheduledTime).toISOString()
    });

    try {
      switch (alarm.name) {
        case 'token-refresh':
          await handleTokenRefresh();
          break;

        case 'activity-monitor':
          await handleActivityMonitoring();
          break;

        case 'connection-watcher':
          await handleConnectionWatcher();
          break;

        case 'deadline-alerts':
          await handleDeadlineAlerts();
          break;

        case 'feed-cleanup':
          await handleFeedCleanup();
          break;

        case 'connection-sync':
          await handleConnectionSync();
          break;

        default:
          log.warn(LogCategory.BACKGROUND, 'Unknown alarm triggered', { name: alarm.name });
      }
    } catch (error) {
      log.error(LogCategory.BACKGROUND, 'Alarm handler error', error as Error, { alarmName: alarm.name });
    }
  });

  // ============================================================================
  // Message Handlers
  // ============================================================================

  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    log.debug(LogCategory.BACKGROUND, 'Message received', {
      type: message.type,
      from: sender.tab?.id || 'popup',
      hasData: !!message.data
    });

    // Check if this is an orchestrator message
    if (isOrchestratorMessage(message)) {
      log.debug(LogCategory.BACKGROUND, 'Handling orchestrator message', { type: message.type });
      return handleOrchestratorMessage(message, sender, sendResponse);
    }

    (async () => {
      try {
        switch (message.type) {
          case 'GET_AUTH_STATUS':
            log.debug(LogCategory.BACKGROUND, 'Handling GET_AUTH_STATUS request');
            sendResponse({ authenticated: false, session: null });
            break;

          case 'SIGN_OUT':
            log.info(LogCategory.BACKGROUND, 'User signing out');
            sendResponse({ success: true });
            break;

          case 'GENERATE_AI_CONTENT': {
            log.info(LogCategory.BACKGROUND, 'AI content generation requested', { payloadType: message.payload?.type });
            const result = await handleAIGeneration(message.payload);
            sendResponse({ success: true, data: result });
            break;
          }

          case 'COMPUTE_ROUTE': {
            log.info(LogCategory.BACKGROUND, 'Route computation requested', { targetId: message.payload?.targetId });
            const route = await handleRouteComputation(message.payload);
            sendResponse({ success: true, data: route });
            break;
          }

          case 'SEND_NOTIFICATION':
            log.info(LogCategory.BACKGROUND, 'Notification send requested', { title: message.payload?.title });
            await handleNotification(message.payload);
            sendResponse({ success: true });
            break;

          case 'ANALYZE_CURRENT_JOB': {
            log.info(LogCategory.BACKGROUND, 'Job analysis requested - forwarding to content script');
            // Forward to active tab's content script
            const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
            if (!activeTab.id) {
              log.warn(LogCategory.BACKGROUND, 'No active tab found for job analysis');
              sendResponse({ success: false, error: 'No active tab found' });
              break;
            }

            log.debug(LogCategory.BACKGROUND, 'Forwarding message to content script', { tabId: activeTab.id });
            // Forward message to content script with 28-second timeout
            // Background Layer: 28s - ensures response before UI timeout (35s)
            try {
              const contentScriptResponse = await Promise.race([
                new Promise<any>((resolve, reject) => {
                  chrome.tabs.sendMessage(activeTab.id!, { type: 'ANALYZE_CURRENT_JOB' }, (response) => {
                    if (chrome.runtime.lastError) {
                      reject(new Error(chrome.runtime.lastError.message));
                    } else {
                      resolve(response);
                    }
                  });
                }),
                new Promise<never>((_, reject) =>
                  setTimeout(() => reject(new Error('Content script timeout after 28 seconds')), 28000)
                )
              ]);
              log.info(LogCategory.BACKGROUND, 'Content script responded successfully', { tabId: activeTab.id });
              sendResponse(contentScriptResponse);
            } catch (error) {
              log.error(LogCategory.BACKGROUND, 'Content script communication failed', error as Error, { tabId: activeTab.id });
              sendResponse({ success: false, error: (error as Error).message });
            }
            break;
          }

          default:
            log.warn(LogCategory.BACKGROUND, 'Unknown message type received', { type: message.type });
            sendResponse({ error: 'Unknown message type' });
        }

        log.info(LogCategory.BACKGROUND, 'Message handled successfully', { type: message.type });
      } catch (error) {
        log.error(LogCategory.BACKGROUND, 'Message handling failed', error as Error, { type: message.type });
        sendResponse({ success: false, error: (error as Error).message });
      }
    })();

    return true; // Will respond asynchronously
  });

  // ============================================================================
  // Storage Change Handlers
  // ============================================================================

  chrome.storage.onChanged.addListener((changes, areaName) => {
    log.debug(LogCategory.BACKGROUND, 'Storage changed', {
      area: areaName,
      keys: Object.keys(changes),
      changeCount: Object.keys(changes).length
    });

    // Log individual changes for important keys
    for (const [key, { oldValue, newValue }] of Object.entries(changes)) {
      if (['app_settings', 'auth_token', 'user_profile'].includes(key)) {
        log.debug(LogCategory.BACKGROUND, `Storage key updated: ${key}`, {
          area: areaName,
          hasOldValue: oldValue !== undefined,
          hasNewValue: newValue !== undefined
        });
      }
    }
  });

  // ============================================================================
  // Tab Event Handlers
  // ============================================================================

  chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete' && tab.url?.includes('linkedin.com')) {
      log.debug(LogCategory.BACKGROUND, 'LinkedIn tab loaded', {
        tabId,
        url: tab.url,
        title: tab.title
      });
    }
  });

  chrome.tabs.onActivated.addListener(async (activeInfo) => {
    try {
      const tab = await chrome.tabs.get(activeInfo.tabId);
      log.debug(LogCategory.BACKGROUND, 'Tab activated', {
        tabId: activeInfo.tabId,
        url: tab.url,
        isLinkedIn: tab.url?.includes('linkedin.com') || false
      });
    } catch (error) {
      log.error(LogCategory.BACKGROUND, 'Failed to get tab info on activation', error as Error, { tabId: activeInfo.tabId });
    }
  });

  // ============================================================================
  // Action Handler (Extension icon click)
  // ============================================================================

  chrome.action.onClicked.addListener(async (tab) => {
    log.info(LogCategory.BACKGROUND, 'Extension icon clicked', {
      tabId: tab.id,
      url: tab.url,
      title: tab.title
    });

    // Send message to content script to toggle panel
    if (tab.id) {
      try {
        await chrome.tabs.sendMessage(tab.id, { type: 'TOGGLE_PANEL' });
        log.debug(LogCategory.BACKGROUND, 'Toggle panel message sent to content script', { tabId: tab.id });
      } catch (error) {
        log.error(LogCategory.BACKGROUND, 'Failed to send toggle panel message', error as Error, { tabId: tab.id });
      }
    } else {
      log.warn(LogCategory.BACKGROUND, 'No tab ID available for extension icon click');
    }
  });

  // ============================================================================
  // Keyboard Command Handlers
  // ============================================================================

  chrome.commands.onCommand.addListener(async (command) => {
    log.info(LogCategory.BACKGROUND, 'Keyboard command triggered', { command });

    const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!activeTab.id || !activeTab.url) {
      log.warn(LogCategory.BACKGROUND, 'No active tab or URL for keyboard command', { command });
      return;
    }

    // Check if we're on LinkedIn
    const isLinkedIn = activeTab.url.includes('linkedin.com');

    try {
      switch (command) {
        case 'toggle-panel':
          log.info(LogCategory.BACKGROUND, 'Executing toggle-panel command (Alt+1)', { tabId: activeTab.id, isLinkedIn });
          await chrome.tabs.sendMessage(activeTab.id, { type: 'TOGGLE_PANEL' });
          break;

        case 'save-question':
          // Only trigger on 3rd party job application sites, NOT on LinkedIn
          if (isLinkedIn) {
            log.debug(LogCategory.BACKGROUND, 'Ignoring save-question command on LinkedIn - this shortcut is for 3rd party job sites only', { url: activeTab.url });
            return;
          }
          log.info(LogCategory.BACKGROUND, 'Executing save-question command (Alt+2) on job application site', { tabId: activeTab.id, url: activeTab.url });
          await chrome.tabs.sendMessage(activeTab.id, { type: 'SAVE_HIGHLIGHTED_QUESTION' });
          break;

        case 'paste-to-generate':
          // Only trigger on 3rd party job application sites, NOT on LinkedIn
          if (isLinkedIn) {
            log.debug(LogCategory.BACKGROUND, 'Ignoring paste-to-generate command on LinkedIn - this shortcut is for 3rd party job sites only', { url: activeTab.url });
            return;
          }
          log.info(LogCategory.BACKGROUND, 'Executing paste-to-generate command (Alt+3) on job application site', { tabId: activeTab.id, url: activeTab.url });
          await chrome.tabs.sendMessage(activeTab.id, { type: 'PASTE_TO_GENERATE' });
          break;

        default:
          log.warn(LogCategory.BACKGROUND, 'Unknown keyboard command', { command });
      }
    } catch (error) {
      log.error(LogCategory.BACKGROUND, 'Keyboard command execution failed', error as Error, {
        command,
        tabId: activeTab.id
      });
    }
  });
});

// ============================================================================
// Helper Functions
// ============================================================================

async function initializeDefaultSettings() {
  log.info(LogCategory.BACKGROUND, 'Initializing default settings');

  const defaultSettings = {
    theme: {
      mode: 'system',
      accentColor: '#0A66C2',
      blurIntensity: 10,
      curvePreset: 'moderate',
    },
    notifications: {
      email: { enabled: false, types: [], frequency: 'daily' },
      sms: { enabled: false, types: [] },
      push: { enabled: true, types: ['job_alert', 'connection_accepted'] },
    },
    privacy: {
      cloudSyncEnabled: false,
      autoSendEnabled: false,
      analyticsEnabled: false,
      clearDataOnLogout: false,
    },
    panelPosition: { x: 100, y: 100 },
    panelSize: { width: 420, height: 680 },
  };

  try {
    // TODO: Use StorageManager when imports are working
    await chrome.storage.local.set({ app_settings: defaultSettings });
    log.info(LogCategory.BACKGROUND, 'Default settings initialized successfully');
  } catch (error) {
    log.error(LogCategory.BACKGROUND, 'Failed to initialize default settings', error as Error);
    throw error;
  }
}

async function handleTokenRefresh() {
  log.debug(LogCategory.BACKGROUND, 'Starting token refresh check');

  try {
    // TODO: Implement token refresh when Supabase is configured
    log.debug(LogCategory.BACKGROUND, 'Token refresh check completed (not yet implemented)');
  } catch (error) {
    log.error(LogCategory.BACKGROUND, 'Token refresh check failed', error as Error);
    throw error;
  }
}

async function handleActivityMonitoring() {
  log.debug(LogCategory.BACKGROUND, 'Starting activity monitoring check');
  try {
    // Load watchlists and preferences
    const [companies, people, onboardingState] = await Promise.all([
      getCompanyWatchlist(),
      getWatchlist(),
      getOnboardingState(),
    ]);

    const preferences = onboardingState.preferences;

    log.debug(LogCategory.BACKGROUND, `Monitoring ${companies.length} companies and ${people.length} people`);

    // Check each company with job alerts enabled
    const companiesWithAlerts = companies.filter(c => c.jobAlertEnabled);
    for (const company of companiesWithAlerts) {
      try {
        log.debug(LogCategory.BACKGROUND, `Checking jobs for ${company.name}`);
        if (preferences) {
          await checkCompanyJobs(company, preferences);
        }

        // Also check for company updates/posts if last check was >24h ago
        const dayInMs = 24 * 60 * 60 * 1000;
        if (!company.lastChecked || Date.now() - company.lastChecked > dayInMs) {
          log.debug(LogCategory.BACKGROUND, `Checking updates for ${company.name}`);
          await checkCompanyUpdates(company);
        }
      } catch (error) {
        log.error(LogCategory.BACKGROUND, `Failed to check company ${company.name}`, error as Error);
        // Continue with other companies even if one fails
      }
    }

    // Check each person in watchlist for profile updates
    for (const person of people) {
      try {
        log.debug(LogCategory.BACKGROUND, `Checking profile for ${person.name}`);
        await checkPersonProfile(person);
      } catch (error) {
        log.error(LogCategory.BACKGROUND, `Failed to check person ${person.name}`, error as Error);
        // Continue with other people even if one fails
      }
    }

    log.debug(LogCategory.BACKGROUND, 'Activity monitoring check completed successfully');
  } catch (error) {
    log.error(LogCategory.BACKGROUND, 'Activity monitoring check failed', error as Error);
    throw error;
  }
}

async function handleConnectionWatcher() {
  log.debug(LogCategory.BACKGROUND, 'Starting connection acceptance check');

  try {
    // TODO: Scrape LinkedIn to get current connections
    // For now, use an empty array (no connections detected)
    const currentConnections: string[] = [];
    console.log('[Uproot] TODO: Scrape LinkedIn to get current connections');

    // Get connection paths
    const connectionPaths = await getConnectionPaths();

    // Check for newly accepted connections
    const acceptances = await detectConnectionAcceptances(currentConnections, connectionPaths);

    log.info(LogCategory.BACKGROUND, 'Connection acceptance check completed', {
      acceptancesFound: acceptances.length,
    });

    // Log each acceptance to feed and update path
    for (const acceptance of acceptances) {
      const path = connectionPaths.find((p) => p.id === acceptance.pathId);
      if (path && acceptance.stepIndex < path.path.length) {
        const step = path.path[acceptance.stepIndex];
        await logConnectionAcceptance(
          acceptance.pathId,
          acceptance.stepIndex,
          acceptance.personName,
          step.profileUrl
        );
        log.info(LogCategory.BACKGROUND, 'Connection acceptance logged', {
          personName: acceptance.personName,
        });
      }
    }
  } catch (error) {
    log.error(LogCategory.BACKGROUND, 'Connection acceptance check failed', error as Error);
    throw error;
  }
}

async function handleDeadlineAlerts() {
  log.debug(LogCategory.BACKGROUND, 'Starting deadline alerts generation');

  try {
    // Get saved jobs from storage
    const savedJobsResult = await chrome.storage.local.get(STORAGE_KEYS.SAVED_JOBS);
    const savedJobs: SavedJob[] = savedJobsResult[STORAGE_KEYS.SAVED_JOBS] || [];

    // Get applications from storage
    const applications = await getApplications();

    log.debug(LogCategory.BACKGROUND, 'Fetched data for deadline alerts', {
      savedJobsCount: savedJobs.length,
      applicationsCount: applications.length,
    });

    // Generate deadline alerts
    const alerts = await generateDeadlineAlertsForUser(savedJobs, applications);

    if (alerts.length > 0) {
      log.info(LogCategory.BACKGROUND, 'Generated deadline alerts', {
        count: alerts.length,
        types: alerts.map((a) => a.alertType),
      });

      // Add each alert to feed storage
      for (const alert of alerts) {
        await addFeedItem(alert);
      }

      log.info(LogCategory.BACKGROUND, 'Deadline alerts added to feed', { count: alerts.length });
    } else {
      log.debug(LogCategory.BACKGROUND, 'No deadline alerts generated');
    }
  } catch (error) {
    log.error(LogCategory.BACKGROUND, 'Deadline alerts generation failed', error as Error);
    // Don't throw - we don't want to crash the background script for this
  }
}

async function handleFeedCleanup() {
  log.debug(LogCategory.BACKGROUND, 'Starting feed cleanup...');

  try {
    // Log storage stats before cleanup
    const statsBefore = await getStorageStats();
    log.debug(LogCategory.BACKGROUND, 'Storage stats before cleanup', statsBefore);

    const removedCount = await cleanupOldFeedItems(30); // Remove items older than 30 days

    // Log storage stats after cleanup
    const statsAfter = await getStorageStats();

    if (removedCount > 0) {
      log.info(LogCategory.BACKGROUND, 'Feed cleanup complete', {
        removedCount,
        maxAgeDays: 30,
        before: statsBefore,
        after: statsAfter,
      });
    } else {
      log.debug(LogCategory.BACKGROUND, 'Feed cleanup complete - no old items found', {
        stats: statsAfter,
      });
    }
  } catch (error) {
    log.error(LogCategory.BACKGROUND, 'Feed cleanup failed', error as Error);
    // Don't throw - we don't want to crash the background script for cleanup
  }
}

async function handleAIGeneration(payload: any) {
  log.info(LogCategory.BACKGROUND, 'Handling AI generation request', { type: payload?.type });

  try {
    // TODO: Implement AI generation
    const result = { generated: 'Sample AI content' };
    log.info(LogCategory.BACKGROUND, 'AI generation completed successfully', { type: payload?.type });
    return result;
  } catch (error) {
    log.error(LogCategory.BACKGROUND, 'AI generation failed', error as Error, { type: payload?.type });
    throw error;
  }
}

async function handleRouteComputation(payload: any) {
  log.info(LogCategory.BACKGROUND, 'Handling route computation request', { targetId: payload?.targetId });

  try {
    // TODO: Implement graph algorithm
    const result = { route: [] };
    log.info(LogCategory.BACKGROUND, 'Route computation completed successfully', { targetId: payload?.targetId, routeLength: 0 });
    return result;
  } catch (error) {
    log.error(LogCategory.BACKGROUND, 'Route computation failed', error as Error, { targetId: payload?.targetId });
    throw error;
  }
}

async function handleNotification(payload: any) {
  const { title, message, iconUrl } = payload;
  log.info(LogCategory.BACKGROUND, 'Handling notification request', {
    title,
    type: payload.notificationType || 'system',
    hasIcon: !!iconUrl
  });

  try {
    // Create Chrome notification
    const notificationId = await chrome.notifications.create({
      type: 'basic',
      iconUrl: iconUrl || '/icon-128.png',
      title,
      message,
      priority: 2,
    });
    log.debug(LogCategory.BACKGROUND, 'Chrome notification created', { notificationId, title });

    // Save to notification history
    const result = await chrome.storage.local.get('notifications');
    const notifications = result.notifications || [];
    const newNotification = {
      id: crypto.randomUUID(),
      type: payload.notificationType || 'system',
      title,
      message,
      read: false,
      createdAt: new Date().toISOString(),
    };
    notifications.unshift(newNotification);

    // Keep only last 100 notifications
    const trimmedNotifications = notifications.slice(0, 100);
    await chrome.storage.local.set({ notifications: trimmedNotifications });

    log.info(LogCategory.BACKGROUND, 'Notification saved to history', {
      notificationId: newNotification.id,
      totalNotifications: trimmedNotifications.length
    });
  } catch (error) {
    log.error(LogCategory.BACKGROUND, 'Notification handling failed', error as Error, { title });
    throw error;
  }
}

async function handleConnectionSync() {
  log.info(LogCategory.BACKGROUND, 'Handling daily connection sync');

  try {
    // Enqueue LOW priority connection scrape task
    await scrapingOrchestrator.enqueueTask({
      type: 'connection',
      priority: ScrapingPriority.LOW,
      params: { resume: true }, // Resume from last run if interrupted
    });

    log.info(LogCategory.BACKGROUND, 'Connection sync task enqueued');
  } catch (error) {
    log.error(LogCategory.BACKGROUND, 'Connection sync failed', error as Error);
  }
}

function getNext3AM(): number {
  const now = new Date();
  const next3AM = new Date();

  // Set to 3 AM
  next3AM.setHours(3, 0, 0, 0);

  // If already past 3 AM today, schedule for tomorrow
  if (now.getTime() > next3AM.getTime()) {
    next3AM.setDate(next3AM.getDate() + 1);
  }

  return next3AM.getTime();
}
