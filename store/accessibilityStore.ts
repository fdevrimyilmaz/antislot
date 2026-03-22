import { create } from "zustand";
import { storage, STORAGE_KEYS } from "@/lib/storage";

export type AccessibilityPreferences = {
  fontScale: 1 | 1.1 | 1.2 | 1.3;
  crisisMode: boolean;
  highContrast: boolean;
  readabilityBoostApplied?: boolean;
};

const DEFAULT_PREFERENCES: AccessibilityPreferences = {
  fontScale: 1.1,
  crisisMode: false,
  highContrast: true,
  readabilityBoostApplied: true,
};

function normalizeFontScale(value: unknown): AccessibilityPreferences["fontScale"] {
  if (value === 1 || value === 1.1 || value === 1.2 || value === 1.3) {
    return value;
  }
  return DEFAULT_PREFERENCES.fontScale;
}

function applyReadabilityMigration(preferences: AccessibilityPreferences): AccessibilityPreferences {
  if (preferences.readabilityBoostApplied) return preferences;
  return {
    ...preferences,
    highContrast: true,
    fontScale: preferences.fontScale >= 1.1 ? preferences.fontScale : 1.1,
    readabilityBoostApplied: true,
  };
}

type AccessibilityStoreState = {
  preferences: AccessibilityPreferences;
  hydrated: boolean;
  hydrate: () => Promise<void>;
  updatePreferences: (partial: Partial<AccessibilityPreferences>) => Promise<void>;
};

export const useAccessibilityStore = create<AccessibilityStoreState>((set, get) => ({
  preferences: DEFAULT_PREFERENCES,
  hydrated: false,

  hydrate: async () => {
    if (get().hydrated) return;
    try {
      const stored = await storage.get<Partial<AccessibilityPreferences>>(
        STORAGE_KEYS.ACCESSIBILITY_PREFERENCES,
        { type: "standard" }
      );
      const merged: AccessibilityPreferences = {
        ...DEFAULT_PREFERENCES,
        ...(stored ?? {}),
        fontScale: normalizeFontScale(stored?.fontScale),
      };
      const migrated = applyReadabilityMigration(merged);
      set({
        preferences: migrated,
        hydrated: true,
      });
      if (JSON.stringify(migrated) !== JSON.stringify(stored ?? {})) {
        await storage.set(STORAGE_KEYS.ACCESSIBILITY_PREFERENCES, migrated, {
          type: "standard",
        });
      }
    } catch {
      set({
        preferences: DEFAULT_PREFERENCES,
        hydrated: true,
      });
    }
  },

  updatePreferences: async (partial) => {
    const updated: AccessibilityPreferences = {
      ...get().preferences,
      ...partial,
      fontScale: normalizeFontScale(partial.fontScale ?? get().preferences.fontScale),
      readabilityBoostApplied: true,
    };
    set({ preferences: updated });
    await storage.set(STORAGE_KEYS.ACCESSIBILITY_PREFERENCES, updated, {
      type: "standard",
    });
  },
}));
