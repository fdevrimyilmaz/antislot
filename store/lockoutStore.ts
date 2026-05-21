import { create } from "zustand";
import * as SecureStore from "expo-secure-store";

/**
 * Self-exclusion lockout (GamBan-style commitment device).
 *
 * Honest framing: we can't block third-party gambling sites or apps from a
 * sandboxed Expo runtime. What we CAN do is gate destructive in-app actions
 * (resetting streak, disabling gambling tracking, deleting data) for the
 * duration the user committed to. This makes a "pre-decision" so the user
 * doesn't have to relitigate the choice in a moment of weakness.
 *
 * Persistence: SecureStore with a single JSON blob. Hydrated once at app boot.
 */

const LOCKOUT_KEY = "antislot_lockout_state";

export type LockoutState = {
  /** Wall-clock ms when the user activated. */
  startedAt: number;
  /** Wall-clock ms when the lockout expires. */
  endsAt: number;
  /** Duration the user picked, in days. Stored for display. */
  durationDays: number;
  /** Free-text "why I'm doing this" — surfaced during the lockout. */
  note: string;
};

type StoreShape = {
  hydrated: boolean;
  state: LockoutState | null;
  hydrate: () => Promise<void>;
  activate: (input: { durationDays: number; note: string }) => Promise<void>;
  /** Re-check expiry against the wall clock; clears state if expired. */
  refresh: () => Promise<void>;
};

function isExpired(s: LockoutState): boolean {
  return Date.now() >= s.endsAt;
}

export const useLockoutStore = create<StoreShape>((set, get) => ({
  hydrated: false,
  state: null,
  hydrate: async () => {
    try {
      const raw = await SecureStore.getItemAsync(LOCKOUT_KEY);
      if (!raw) {
        set({ hydrated: true, state: null });
        return;
      }
      const parsed = JSON.parse(raw) as LockoutState;
      if (
        typeof parsed.startedAt !== "number" ||
        typeof parsed.endsAt !== "number" ||
        typeof parsed.durationDays !== "number"
      ) {
        await SecureStore.deleteItemAsync(LOCKOUT_KEY);
        set({ hydrated: true, state: null });
        return;
      }
      if (isExpired(parsed)) {
        await SecureStore.deleteItemAsync(LOCKOUT_KEY);
        set({ hydrated: true, state: null });
        return;
      }
      set({ hydrated: true, state: parsed });
    } catch {
      set({ hydrated: true, state: null });
    }
  },
  activate: async ({ durationDays, note }) => {
    const now = Date.now();
    const next: LockoutState = {
      startedAt: now,
      endsAt: now + durationDays * 24 * 60 * 60 * 1000,
      durationDays,
      note: note.trim(),
    };
    await SecureStore.setItemAsync(LOCKOUT_KEY, JSON.stringify(next));
    set({ state: next });
  },
  refresh: async () => {
    const current = get().state;
    if (!current) return;
    if (isExpired(current)) {
      await SecureStore.deleteItemAsync(LOCKOUT_KEY);
      set({ state: null });
    }
  },
}));

/** True when a user-chosen lockout window is currently active. */
export function isLockoutActive(state: LockoutState | null): state is LockoutState {
  return Boolean(state) && !isExpired(state as LockoutState);
}

/** Remaining ms; clamps to 0 when expired or absent. */
export function remainingMs(state: LockoutState | null): number {
  if (!state) return 0;
  return Math.max(0, state.endsAt - Date.now());
}

/** Pretty-print remaining time for UI. */
export function formatRemaining(ms: number): string {
  if (ms <= 0) return "0 dk";
  const totalSec = Math.floor(ms / 1000);
  const days = Math.floor(totalSec / 86400);
  const hours = Math.floor((totalSec % 86400) / 3600);
  const minutes = Math.floor((totalSec % 3600) / 60);
  if (days > 0) {
    return `${days} gün ${hours} sa`;
  }
  if (hours > 0) {
    return `${hours} sa ${minutes} dk`;
  }
  return `${minutes} dk`;
}
