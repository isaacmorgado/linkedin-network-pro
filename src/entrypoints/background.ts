/**
 * Service Worker (Background Script) - Manifest V3
 *
 * Responsibilities:
 * - Handle extension installation and updates
 * - Manage background alarms for periodic tasks
 * - Handle auth token refresh
 * - Process notifications
 * - Manage message passing between content scripts and UI
 */

export default defineBackground(() => {
  console.log('Background script initialized');

  // ============================================================================
  // Installation & Update Handlers
  // ============================================================================

  chrome.runtime.onInstalled.addListener(async (details) => {
    console.log('Extension installed:', details.reason);

    if (details.reason === 'install') {
      // First install - set default settings
      await initializeDefaultSettings();

      // Create alarm for token refresh
      chrome.alarms.create('token-refresh', {
        periodInMinutes: 30, // Check every 30 minutes
      });

      // Create alarm for activity monitoring
      chrome.alarms.create('activity-monitor', {
        periodInMinutes: 15, // Check every 15 minutes
      });
    }

    if (details.reason === 'update') {
      console.log('Extension updated from', details.previousVersion);
      // Handle migration if needed
    }
  });

  // ============================================================================
  // Alarm Handlers
  // ============================================================================

  chrome.alarms.onAlarm.addListener(async (alarm) => {
    console.log('Alarm triggered:', alarm.name);

    switch (alarm.name) {
      case 'token-refresh':
        await handleTokenRefresh();
        break;

      case 'activity-monitor':
        await handleActivityMonitoring();
        break;

      default:
        console.warn('Unknown alarm:', alarm.name);
    }
  });

  // ============================================================================
  // Message Handlers
  // ============================================================================

  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log('Message received:', message.type, sender);

    (async () => {
      try {
        switch (message.type) {
          case 'GET_AUTH_STATUS':
            sendResponse({ authenticated: false, session: null });
            break;

          case 'SIGN_OUT':
            sendResponse({ success: true });
            break;

          case 'GENERATE_AI_CONTENT':
            const result = await handleAIGeneration(message.payload);
            sendResponse({ success: true, data: result });
            break;

          case 'COMPUTE_ROUTE':
            const route = await handleRouteComputation(message.payload);
            sendResponse({ success: true, data: route });
            break;

          case 'SEND_NOTIFICATION':
            await handleNotification(message.payload);
            sendResponse({ success: true });
            break;

          case 'ANALYZE_CURRENT_JOB':
            // Forward to active tab's content script
            const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
            if (!activeTab.id) {
              sendResponse({ success: false, error: 'No active tab found' });
              break;
            }

            // Forward message to content script
            chrome.tabs.sendMessage(activeTab.id, { type: 'ANALYZE_CURRENT_JOB' }, (response) => {
              if (chrome.runtime.lastError) {
                sendResponse({ success: false, error: chrome.runtime.lastError.message });
              } else {
                sendResponse(response);
              }
            });
            break;

          default:
            sendResponse({ error: 'Unknown message type' });
        }
      } catch (error) {
        console.error('Message handler error:', error);
        sendResponse({ error: (error as Error).message });
      }
    })();

    return true; // Will respond asynchronously
  });

  // ============================================================================
  // Action Handler (Extension icon click)
  // ============================================================================

  chrome.action.onClicked.addListener(async (tab) => {
    console.log('Extension icon clicked on tab:', tab.id);

    // Send message to content script to toggle panel
    if (tab.id) {
      chrome.tabs.sendMessage(tab.id, { type: 'TOGGLE_PANEL' });
    }
  });
});

// ============================================================================
// Helper Functions
// ============================================================================

async function initializeDefaultSettings() {
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

  // TODO: Use StorageManager when imports are working
  await chrome.storage.local.set({ app_settings: defaultSettings });
}

async function handleTokenRefresh() {
  try {
    // TODO: Implement token refresh when Supabase is configured
    console.log('Token refresh check...');
  } catch (error) {
    console.error('Token refresh error:', error);
  }
}

async function handleActivityMonitoring() {
  try {
    // TODO: Implement activity monitoring
    console.log('Activity monitoring check...');
  } catch (error) {
    console.error('Activity monitoring error:', error);
  }
}

async function handleAIGeneration(payload: any) {
  // TODO: Implement AI generation
  console.log('AI generation requested:', payload.type);
  return { generated: 'Sample AI content' };
}

async function handleRouteComputation(payload: any) {
  // TODO: Implement graph algorithm
  console.log('Route computation requested for:', payload.targetId);
  return { route: [] };
}

async function handleNotification(payload: any) {
  const { title, message, iconUrl } = payload;

  // Create Chrome notification
  await chrome.notifications.create({
    type: 'basic',
    iconUrl: iconUrl || '/icon-128.png',
    title,
    message,
    priority: 2,
  });

  // Save to notification history
  const result = await chrome.storage.local.get('notifications');
  const notifications = result.notifications || [];
  notifications.unshift({
    id: crypto.randomUUID(),
    type: payload.notificationType || 'system',
    title,
    message,
    read: false,
    createdAt: new Date().toISOString(),
  });

  // Keep only last 100 notifications
  await chrome.storage.local.set({ notifications: notifications.slice(0, 100) });
}
