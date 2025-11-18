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

import { AuthService } from '@/lib/supabase';
import { StorageManager } from '@/lib/storage';

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

  await StorageManager.setLocal('app_settings', defaultSettings);
}

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

/**
 * Refresh auth token if it's about to expire
 */
async function handleTokenRefresh() {
  try {
    const session = await AuthService.getSession();

    if (!session) {
      console.log('No session found, skipping token refresh');
      return;
    }

    // Check if token expires in less than 60 seconds
    const expiresAt = session.expires_at;
    const now = Math.floor(Date.now() / 1000);

    if (expiresAt && expiresAt - now < 60) {
      console.log('Token expiring soon, refreshing...');
      await AuthService.refreshSession();
      console.log('Token refreshed successfully');
    }
  } catch (error) {
    console.error('Token refresh error:', error);
  }
}

/**
 * Monitor LinkedIn activity for watchlist people/companies
 */
async function handleActivityMonitoring() {
  try {
    const user = await AuthService.getUser();
    if (!user) return;

    const watchlistPeople = await StorageManager.getLocal('watchlist_people') || [];
    const watchlistCompanies = await StorageManager.getLocal('watchlist_companies') || [];

    // TODO: Implement activity scraping via backend API
    // This should:
    // 1. Check for new posts from watchlist people
    // 2. Check for new jobs from watchlist companies
    // 3. Create notifications for relevant updates
    // 4. Respect rate limits and LinkedIn ToS

    console.log('Activity monitoring:', {
      people: watchlistPeople.length,
      companies: watchlistCompanies.length,
    });
  } catch (error) {
    console.error('Activity monitoring error:', error);
  }
}

// ============================================================================
// Message Handlers (Communication with content scripts and popup)
// ============================================================================

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Message received:', message.type, sender);

  (async () => {
    try {
      switch (message.type) {
        case 'GET_AUTH_STATUS':
          const session = await AuthService.getSession();
          sendResponse({ authenticated: !!session, session });
          break;

        case 'SIGN_OUT':
          await AuthService.signOut();
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

        default:
          sendResponse({ error: 'Unknown message type' });
      }
    } catch (error) {
      console.error('Message handler error:', error);
      sendResponse({ error: (error as Error).message });
    }
  })();

  // Return true to indicate async response
  return true;
});

/**
 * Handle AI content generation (delegate to backend or direct API)
 */
async function handleAIGeneration(payload: any) {
  // TODO: Implement AI generation
  // This should call your backend API or directly use Anthropic SDK
  // depending on your architecture choice

  console.log('AI generation requested:', payload.type);
  return { generated: 'Sample AI content' };
}

/**
 * Handle network route computation (use Web Worker for heavy computation)
 */
async function handleRouteComputation(payload: any) {
  // TODO: Implement graph algorithm
  // Should use Web Worker to avoid blocking

  console.log('Route computation requested for:', payload.targetId);
  return { route: [] };
}

/**
 * Handle notification creation
 */
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
  const notifications = await StorageManager.getLocal('notifications') || [];
  notifications.unshift({
    id: crypto.randomUUID(),
    type: payload.notificationType || 'system',
    title,
    message,
    read: false,
    createdAt: new Date().toISOString(),
  });

  // Keep only last 100 notifications
  await StorageManager.setLocal('notifications', notifications.slice(0, 100));
}

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

// ============================================================================
// Keep service worker alive (MV3 workaround)
// ============================================================================

// Service workers terminate after 30 seconds of inactivity
// Use alarms to keep critical functionality alive
let keepAliveInterval: number;

async function keepAlive() {
  // No-op function to keep worker alive
  console.log('Service worker alive');
}

// Set up keep-alive mechanism
chrome.alarms.create('keep-alive', { periodInMinutes: 1 });
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'keep-alive') {
    keepAlive();
  }
});

console.log('Service worker initialized');
