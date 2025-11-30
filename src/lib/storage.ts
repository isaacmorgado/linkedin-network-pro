/**
 * Type-safe Chrome storage utilities
 * Uses chrome.storage.session for sensitive data (in-memory)
 * Uses chrome.storage.local for persistent data
 */

import { STORAGE_KEYS } from '@/types';
import { isContextInvalidatedError } from '@/utils/storage/helpers';

export class StorageManager {
  /**
   * Get data from session storage (in-memory, cleared on restart)
   * Use for sensitive data like tokens
   */
  static async getSession<T>(key: string): Promise<T | null> {
    try {
      const result = await chrome.storage.session.get(key);
      return result[key] ?? null;
    } catch (error: any) {
      // Silently handle extension context invalidation during reloads
      if (isContextInvalidatedError(error)) {
        return null;
      }
      // Also check for common Chrome extension errors that should be silent
      const errorMsg = error?.message?.toLowerCase() || String(error).toLowerCase();
      if (
        errorMsg.includes('cannot access') ||
        errorMsg.includes('not available') ||
        errorMsg.includes('disconnected') ||
        errorMsg.includes('receiving end does not exist')
      ) {
        return null;
      }
      console.error('Session storage get error:', error);
      return null;
    }
  }

  /**
   * Set data in session storage
   */
  static async setSession<T>(key: string, value: T): Promise<void> {
    try {
      await chrome.storage.session.set({ [key]: value });
    } catch (error: any) {
      // Silently handle extension context invalidation during reloads
      if (isContextInvalidatedError(error)) {
        return;
      }
      // Also check for common Chrome extension errors that should be silent
      const errorMsg = error?.message?.toLowerCase() || String(error).toLowerCase();
      if (
        errorMsg.includes('cannot access') ||
        errorMsg.includes('not available') ||
        errorMsg.includes('disconnected') ||
        errorMsg.includes('receiving end does not exist')
      ) {
        return;
      }
      console.error('Session storage set error:', error);
      throw error;
    }
  }

  /**
   * Get data from local storage (persistent)
   */
  static async getLocal<T>(key: string): Promise<T | null> {
    try {
      const result = await chrome.storage.local.get(key);
      return result[key] ?? null;
    } catch (error: any) {
      // Silently handle extension context invalidation during reloads
      if (isContextInvalidatedError(error)) {
        return null;
      }
      // Also check for common Chrome extension errors that should be silent
      const errorMsg = error?.message?.toLowerCase() || String(error).toLowerCase();
      if (
        errorMsg.includes('cannot access') ||
        errorMsg.includes('not available') ||
        errorMsg.includes('disconnected') ||
        errorMsg.includes('receiving end does not exist')
      ) {
        return null;
      }
      console.error('Local storage get error:', error);
      return null;
    }
  }

  /**
   * Set data in local storage
   */
  static async setLocal<T>(key: string, value: T): Promise<void> {
    try {
      await chrome.storage.local.set({ [key]: value });
    } catch (error: any) {
      // Silently handle extension context invalidation during reloads
      if (isContextInvalidatedError(error)) {
        return;
      }
      // Also check for common Chrome extension errors that should be silent
      const errorMsg = error?.message?.toLowerCase() || String(error).toLowerCase();
      if (
        errorMsg.includes('cannot access') ||
        errorMsg.includes('not available') ||
        errorMsg.includes('disconnected') ||
        errorMsg.includes('receiving end does not exist')
      ) {
        return;
      }
      console.error('Local storage set error:', error);
      throw error;
    }
  }

  /**
   * Remove from session storage
   */
  static async removeSession(key: string): Promise<void> {
    try {
      await chrome.storage.session.remove(key);
    } catch (error) {
      // Silently handle extension context invalidation during reloads
      if (isContextInvalidatedError(error)) {
        return;
      }
      console.error('Session storage remove error:', error);
    }
  }

  /**
   * Remove from local storage
   */
  static async removeLocal(key: string): Promise<void> {
    try {
      await chrome.storage.local.remove(key);
    } catch (error) {
      // Silently handle extension context invalidation during reloads
      if (isContextInvalidatedError(error)) {
        return;
      }
      console.error('Local storage remove error:', error);
    }
  }

  /**
   * Clear all session storage
   */
  static async clearSession(): Promise<void> {
    try {
      await chrome.storage.session.clear();
    } catch (error) {
      // Silently handle extension context invalidation during reloads
      if (isContextInvalidatedError(error)) {
        return;
      }
      console.error('Session storage clear error:', error);
    }
  }

  /**
   * Clear all local storage
   */
  static async clearLocal(): Promise<void> {
    try {
      await chrome.storage.local.clear();
    } catch (error) {
      // Silently handle extension context invalidation during reloads
      if (isContextInvalidatedError(error)) {
        return;
      }
      console.error('Local storage clear error:', error);
    }
  }

  /**
   * Get auth tokens (from session storage)
   */
  static async getAuthToken(): Promise<string | null> {
    return this.getSession<string>(STORAGE_KEYS.AUTH_TOKEN);
  }

  /**
   * Set auth tokens (in session storage)
   */
  static async setAuthToken(token: string): Promise<void> {
    await this.setSession(STORAGE_KEYS.AUTH_TOKEN, token);
  }

  /**
   * Clear all auth data
   */
  static async clearAuth(): Promise<void> {
    await this.removeSession(STORAGE_KEYS.AUTH_TOKEN);
    await this.removeSession(STORAGE_KEYS.REFRESH_TOKEN);
  }

  /**
   * Listen to storage changes
   */
  static onChanged(
    callback: (changes: { [key: string]: chrome.storage.StorageChange }) => void
  ): void {
    chrome.storage.onChanged.addListener((changes, areaName) => {
      if (areaName === 'local' || areaName === 'session') {
        callback(changes);
      }
    });
  }
}
