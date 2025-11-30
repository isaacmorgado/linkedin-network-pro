/**
 * Auth State Management using Zustand
 */

import { create } from 'zustand';
import { AuthService } from '@/lib/supabase';
import type { UserProfile } from '@/types';
import { StorageManager } from '@/lib/storage';

interface AuthState {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  checkAuth: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,

  checkAuth: async () => {
    set({ isLoading: true, error: null });

    try {
      const session = await AuthService.getSession();

      if (session) {
        const user = await AuthService.getUser();

        // Fetch user profile from storage or Supabase
        const profile = await StorageManager.getLocal<UserProfile>('user_profile');

        set({
          user: profile || null,
          isAuthenticated: !!user,
          isLoading: false,
        });
      } else {
        set({
          user: null,
          isAuthenticated: false,
          isLoading: false,
        });
      }
    } catch (error) {
      console.error('Auth check error:', error);
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: (error as Error).message,
      });
    }
  },

  signIn: async (email: string, password: string) => {
    set({ isLoading: true, error: null });

    try {
// @ts-expect-error - Kept for debugging purposes
      const __authResult = await AuthService.signInWithEmail(email, password);

      // Fetch user profile
      const profile = await StorageManager.getLocal<UserProfile>('user_profile');

      set({
        user: profile || null,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error) {
      console.error('Sign in error:', error);
      set({
        isLoading: false,
        error: (error as Error).message,
      });
      throw error;
    }
  },

  signUp: async (email: string, password: string) => {
    set({ isLoading: true, error: null });

    try {
      const { user } = await AuthService.signUpWithEmail(email, password);

      // Create default user profile
      const defaultProfile: Partial<UserProfile> = {
        id: user?.id,
        email: user?.email || email,
        subscriptionTier: 'free',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await StorageManager.setLocal('user_profile', defaultProfile);

      set({
        user: defaultProfile as UserProfile,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error) {
      console.error('Sign up error:', error);
      set({
        isLoading: false,
        error: (error as Error).message,
      });
      throw error;
    }
  },

  signInWithGoogle: async () => {
    set({ isLoading: true, error: null });

    try {
      const { user } = await AuthService.signInWithGoogle();

      // Fetch or create user profile
      let profile = await StorageManager.getLocal<UserProfile>('user_profile');

      if (!profile) {
        profile = {
          id: user?.id || '',
          email: user?.email || '',
          subscriptionTier: 'free',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        } as UserProfile;

        await StorageManager.setLocal('user_profile', profile);
      }

      set({
        user: profile,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error) {
      console.error('Google sign in error:', error);
      set({
        isLoading: false,
        error: (error as Error).message,
      });
      throw error;
    }
  },

  signOut: async () => {
    set({ isLoading: true, error: null });

    try {
      await AuthService.signOut();

      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
      });
    } catch (error) {
      console.error('Sign out error:', error);
      set({
        isLoading: false,
        error: (error as Error).message,
      });
      throw error;
    }
  },

  updateProfile: async (updates: Partial<UserProfile>) => {
    const currentUser = get().user;
    if (!currentUser) return;

    const updatedUser = {
      ...currentUser,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    await StorageManager.setLocal('user_profile', updatedUser);
    set({ user: updatedUser });
  },
}));
