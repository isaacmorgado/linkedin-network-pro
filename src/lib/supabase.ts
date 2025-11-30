import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { StorageManager } from './storage';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder-key';

// Warn if using placeholders (only in development)
if (import.meta.env.DEV && (supabaseUrl.includes('placeholder') || supabaseAnonKey.includes('placeholder'))) {
  console.warn('⚠️ Supabase not configured. Copy .env.example to .env and add your credentials.');
}

/**
 * Custom storage adapter for Supabase using chrome.storage.session
 * This ensures tokens are stored in-memory and cleared on browser restart
 */
const chromeStorageAdapter = {
  async getItem(key: string): Promise<string | null> {
    const value = await StorageManager.getSession<string>(key);
    return value;
  },
  async setItem(key: string, value: string): Promise<void> {
    await StorageManager.setSession(key, value);
  },
  async removeItem(key: string): Promise<void> {
    await StorageManager.removeSession(key);
  },
};

/**
 * Supabase client with chrome.storage integration
 */
export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: chromeStorageAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

/**
 * Auth utilities
 */
export class AuthService {
  /**
   * Sign in with email and password
   */
  static async signInWithEmail(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
    return data;
  }

  /**
   * Sign up with email and password
   */
  static async signUpWithEmail(email: string, password: string) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) throw error;
    return data;
  }

  /**
   * Sign in with Google using chrome.identity
   */
  static async signInWithGoogle() {
    try {
      // Use chrome.identity.launchWebAuthFlow for OAuth
      const redirectUrl = chrome.identity.getRedirectURL();
      const clientId = import.meta.env.GOOGLE_CLIENT_ID;
      const scopes = ['email', 'profile'];

      const authUrl =
        `https://accounts.google.com/o/oauth2/v2/auth?` +
        `client_id=${clientId}&` +
        `response_type=token&` +
        `redirect_uri=${encodeURIComponent(redirectUrl)}&` +
        `scope=${encodeURIComponent(scopes.join(' '))}`;

      const responseUrl = await chrome.identity.launchWebAuthFlow({
        url: authUrl,
        interactive: true,
      });

      // Extract access token from response URL
      const url = new URL(responseUrl!);
      const params = new URLSearchParams(url.hash.substring(1));
      const accessToken = params.get('access_token');

      if (!accessToken) {
        throw new Error('No access token received');
      }

      // Sign in to Supabase with Google token
      const { data, error } = await supabase.auth.signInWithIdToken({
        provider: 'google',
        token: accessToken,
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Google sign-in error:', error);
      throw error;
    }
  }

  /**
   * Sign out
   */
  static async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;

    // Clear all local storage if privacy setting is enabled
    const settings = await StorageManager.getLocal('app_settings');
    if (settings && typeof settings === 'object' && 'privacy' in settings) {
      const appSettings = settings as { privacy?: { clearDataOnLogout?: boolean } };
      if (appSettings.privacy?.clearDataOnLogout) {
        await StorageManager.clearLocal();
      }
    }
  }

  /**
   * Get current session
   */
  static async getSession() {
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;
    return data.session;
  }

  /**
   * Get current user
   */
  static async getUser() {
    const { data, error } = await supabase.auth.getUser();
    if (error) throw error;
    return data.user;
  }

  /**
   * Refresh session
   */
  static async refreshSession() {
    const { data, error } = await supabase.auth.refreshSession();
    if (error) throw error;
    return data.session;
  }

  /**
   * Listen to auth state changes
   */
  static onAuthStateChange(callback: (event: string, session: any) => void) {
    return supabase.auth.onAuthStateChange(callback);
  }
}
