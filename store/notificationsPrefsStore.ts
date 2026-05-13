import { create } from "zustand";
import * as SecureStore from "expo-secure-store";

/**
 * User preferences for local (on-device) notifications.
 *
 * Stored separately from the remote-push feature flag (which gates Expo
 * push tokens). Local notifications don't require credentials — only
 * the OS-level permission grant — so this is purely a user toggle.
 */

const STORE_KEY = "antislot_notif_prefs_v1";

export type NotifPrefs = {
  /** Fire a reminder when each risk window begins. */
  riskRemindersEnabled: boolean;
  /** Daily morning check-in nudge. */
  checkinEnabled: boolean;
  /** 0–23 — time at which the daily nudge fires. */
  checkinHour: number;
  /** 0–59 */
  checkinMinute: number;
};

const DEFAULTS: NotifPrefs = {
  riskRemindersEnabled: false,
  checkinEnabled: false,
  checkinHour: 9,
  checkinMinute: 0,
};

type StoreShape = {
  hydrated: boolean;
  prefs: NotifPrefs;
  hydrate: () => Promise<void>;
  setPrefs: (patch: Partial<NotifPrefs>) => Promise<void>;
};

async function persist(prefs: NotifPrefs) {
  await SecureStore.setItemAsync(STORE_KEY, JSON.stringify(prefs));
}

function sanitize(input: unknown): NotifPrefs {
  if (!input || typeof input !== "object") return DEFAULTS;
  const i = input as Partial<NotifPrefs>;
  return {
    riskRemindersEnabled: Boolean(i.riskRemindersEnabled),
    checkinEnabled: Boolean(i.checkinEnabled),
    checkinHour:
      typeof i.checkinHour === "number" && i.checkinHour >= 0 && i.checkinHour <= 23
        ? Math.floor(i.checkinHour)
        : DEFAULTS.checkinHour,
    checkinMinute:
      typeof i.checkinMinute === "number" && i.checkinMinute >= 0 && i.checkinMinute <= 59
        ? Math.floor(i.checkinMinute)
        : DEFAULTS.checkinMinute,
  };
}

export const useNotifPrefsStore = create<StoreShape>((set, get) => ({
  hydrated: false,
  prefs: DEFAULTS,
  hydrate: async () => {
    try {
      const raw = await SecureStore.getItemAsync(STORE_KEY);
      if (!raw) {
        set({ hydrated: true, prefs: DEFAULTS });
        return;
      }
      set({ hydrated: true, prefs: sanitize(JSON.parse(raw)) });
    } catch {
      set({ hydrated: true, prefs: DEFAULTS });
    }
  },
  setPrefs: async (patch) => {
    const next = { ...get().prefs, ...patch };
    await persist(next);
    set({ prefs: next });
  },
}));
