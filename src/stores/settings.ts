/**
 * Settings State Management using Zustand
 */

import { create } from 'zustand';
import type { AppSettings, Theme, NotificationPreferences, PrivacySettings } from '@/types';
import { StorageManager } from '@/lib/storage';

interface SettingsState extends AppSettings {
  // Actions
  loadSettings: () => Promise<void>;
  updateTheme: (theme: Partial<Theme>) => Promise<void>;
  updateNotifications: (notifications: Partial<NotificationPreferences>) => Promise<void>;
  updatePrivacy: (privacy: Partial<PrivacySettings>) => Promise<void>;
  updatePanelPosition: (position: { x: number; y: number }) => Promise<void>;
  updatePanelSize: (size: { width: number; height: number }) => Promise<void>;
  resetSettings: () => Promise<void>;
}

const DEFAULT_SETTINGS: AppSettings = {
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

export const useSettingsStore = create<SettingsState>((set, get) => ({
  ...DEFAULT_SETTINGS,

  loadSettings: async () => {
    const settings = await StorageManager.getLocal<AppSettings>('app_settings');

    if (settings) {
      set(settings);
    }
  },

  updateTheme: async (themeUpdates: Partial<Theme>) => {
    const currentTheme = get().theme;
    const updatedTheme = { ...currentTheme, ...themeUpdates };

    const newSettings = {
      ...get(),
      theme: updatedTheme,
    };

    await StorageManager.setLocal('app_settings', newSettings);
    set({ theme: updatedTheme });
  },

  updateNotifications: async (notificationUpdates: Partial<NotificationPreferences>) => {
    const currentNotifications = get().notifications;
    const updatedNotifications = {
      ...currentNotifications,
      ...notificationUpdates,
    };

    const newSettings = {
      ...get(),
      notifications: updatedNotifications,
    };

    await StorageManager.setLocal('app_settings', newSettings);
    set({ notifications: updatedNotifications });
  },

  updatePrivacy: async (privacyUpdates: Partial<PrivacySettings>) => {
    const currentPrivacy = get().privacy;
    const updatedPrivacy = { ...currentPrivacy, ...privacyUpdates };

    const newSettings = {
      ...get(),
      privacy: updatedPrivacy,
    };

    await StorageManager.setLocal('app_settings', newSettings);
    set({ privacy: updatedPrivacy });
  },

  updatePanelPosition: async (position: { x: number; y: number }) => {
    const newSettings = {
      ...get(),
      panelPosition: position,
    };

    await StorageManager.setLocal('app_settings', newSettings);
    set({ panelPosition: position });
  },

  updatePanelSize: async (size: { width: number; height: number }) => {
    const newSettings = {
      ...get(),
      panelSize: size,
    };

    await StorageManager.setLocal('app_settings', newSettings);
    set({ panelSize: size });
  },

  resetSettings: async () => {
    await StorageManager.setLocal('app_settings', DEFAULT_SETTINGS);
    set(DEFAULT_SETTINGS);
  },
}));
