/**
 * Privacy Preferences Store
 * 
 * Manages user privacy preferences for telemetry and crash reporting.
 */

import { create } from 'zustand';
import { storage, STORAGE_KEYS } from '@/lib/storage';

export interface PrivacyPreferences {
  shareDiagnostics: boolean;
  crashReporting: boolean;
}

const DEFAULT_PREFERENCES: PrivacyPreferences = {
  shareDiagnostics: false,
  crashReporting: false,
};

interface PrivacyStoreState {
  preferences: PrivacyPreferences;
  hydrated: boolean;
  updatePreferences: (partial: Partial<PrivacyPreferences>) => Promise<void>;
  hydrate: () => Promise<void>;
}

export const usePrivacyStore = create<PrivacyStoreState>((set, get) => ({
  preferences: DEFAULT_PREFERENCES,
  hydrated: false,

  hydrate: async () => {
    const state = get();
    if (state.hydrated) return;

    try {
      const stored = await storage.get<PrivacyPreferences>(
        STORAGE_KEYS.PRIVACY_PREFERENCES,
        { type: 'standard' }
      );
      set({
        preferences: stored ?? DEFAULT_PREFERENCES,
        hydrated: true,
      });
    } catch (error) {
      console.error('[PrivacyStore] Hydration error:', error);
      set({
        preferences: DEFAULT_PREFERENCES,
        hydrated: true,
      });
    }
  },

  updatePreferences: async (partial) => {
    const state = get();
    const updated = { ...state.preferences, ...partial };
    set({ preferences: updated });
    try {
      await storage.set(STORAGE_KEYS.PRIVACY_PREFERENCES, updated, {
        type: 'standard',
      });
    } catch (error) {
      console.error('[PrivacyStore] Failed to save preferences:', error);
    }
  },
}));
