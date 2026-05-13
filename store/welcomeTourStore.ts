import { create } from "zustand";
import * as SecureStore from "expo-secure-store";

/**
 * One-shot "feature tour" flag.
 *
 * After onboarding completes (or on the next launch for existing users
 * who installed this version), the home screen pops a tour modal that
 * introduces the major new features. Once dismissed — or finished — we
 * never show it again.
 *
 * The version is included in the key so a future tour update (e.g.
 * v2 introducing more features) shows again without manual reset.
 */

const STORE_KEY = "antislot_welcome_tour_v1";

type StoreShape = {
  hydrated: boolean;
  shown: boolean;
  hydrate: () => Promise<void>;
  markShown: () => Promise<void>;
};

export const useWelcomeTourStore = create<StoreShape>((set, get) => ({
  hydrated: false,
  shown: false,
  hydrate: async () => {
    try {
      const raw = await SecureStore.getItemAsync(STORE_KEY);
      set({ hydrated: true, shown: raw === "1" });
    } catch {
      set({ hydrated: true, shown: false });
    }
  },
  markShown: async () => {
    if (get().shown) return;
    try {
      await SecureStore.setItemAsync(STORE_KEY, "1");
    } catch {
      // best effort — we still flip the in-memory flag so the modal
      // doesn't re-pop in this session.
    }
    set({ shown: true });
  },
}));
