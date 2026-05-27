import { create } from "zustand";
import * as SecureStore from "expo-secure-store";

import { auth } from "@/lib/firebase";
import { daysSince, readProgress, writeProgress } from "@/services/progress";

type ProgressStoreState = {
  gamblingFreeDays: number;
  streakStartedAt: number | null;
  hydrated: boolean;
  loading: boolean;
  error: string | null;
  hydrate: (uid?: string) => Promise<void>;
  reset: (uid?: string) => Promise<void>;
  /** Recompute the visible day count from the stored start timestamp. */
  recomputeDays: () => void;
};

const SESSIONS_COMPLETED_KEY = "antislot_sessions_completed";

function resolveErrorMessage(error: unknown) {
  if (error instanceof Error && error.message) return error.message;
  return "Ilerleme verisi guncellenemedi.";
}

function resolveUid(uid?: string) {
  return uid ?? auth.currentUser?.uid ?? null;
}

export const useProgressStore = create<ProgressStoreState>((set, get) => ({
  gamblingFreeDays: 0,
  streakStartedAt: null,
  hydrated: false,
  loading: false,
  error: null,
  hydrate: async (uid) => {
    if (get().loading) return;
    const resolvedUid = resolveUid(uid);
    if (!resolvedUid) {
      set({ hydrated: true, error: "Kullanici bulunamadi." });
      return;
    }
    set({ loading: true, error: null });
    try {
      const snapshot = await readProgress(resolvedUid);
      set({
        gamblingFreeDays: snapshot.gamblingFreeDays,
        streakStartedAt: snapshot.streakStartedAt,
        hydrated: true,
        loading: false,
        error: null,
      });
    } catch (error) {
      set({ loading: false, hydrated: true, error: resolveErrorMessage(error) });
    }
  },
  reset: async (uid) => {
    if (get().loading) return;
    const resolvedUid = resolveUid(uid);
    if (!resolvedUid) {
      set({ error: "Kullanici bulunamadi." });
      return;
    }
    const now = Date.now();
    set({
      gamblingFreeDays: 0,
      streakStartedAt: now,
      loading: true,
      error: null,
      hydrated: true,
    });
    try {
      await writeProgress(resolvedUid, now);
      set({ loading: false });
    } catch (error) {
      set({ loading: false, error: resolveErrorMessage(error) });
    }
  },
  recomputeDays: () => {
    const startedAt = get().streakStartedAt;
    if (startedAt === null) return;
    const fresh = daysSince(startedAt);
    if (fresh !== get().gamblingFreeDays) {
      set({ gamblingFreeDays: fresh });
    }
  },
}));

async function getSessionsCompleted(): Promise<number> {
  const countStr = await SecureStore.getItemAsync(SESSIONS_COMPLETED_KEY);
  if (!countStr) return 0;
  try {
    return parseInt(countStr, 10);
  } catch {
    return 0;
  }
}

export async function incrementSessionsCompleted(): Promise<void> {
  const current = await getSessionsCompleted();
  await SecureStore.setItemAsync(SESSIONS_COMPLETED_KEY, (current + 1).toString());
}
