import { create } from "zustand";
import * as SecureStore from "expo-secure-store";

/**
 * Risk windows = recurring weekly time windows the user marks as
 * high-risk for gambling urges (e.g. payday evenings, weekend nights).
 *
 * Honest framing: this is NOT a real OS-level blocker for external apps
 * or sites — Expo can't do that. Instead we surface an active-window
 * banner inside the app, dim non-essential CTAs, and (next iteration)
 * push a notification at window start so the user is alerted.
 */

const STORE_KEY = "antislot_risk_windows_v1";

/** 0 = Sunday, 6 = Saturday — matches JavaScript Date.getDay(). */
export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export type RiskWindow = {
  id: string;
  label: string;
  /** Days the window repeats on. */
  days: Weekday[];
  /** 0–23 */
  startHour: number;
  /** 0–59 */
  startMinute: number;
  /** 0–23 */
  endHour: number;
  /** 0–59. End may be earlier than start to denote a window that crosses midnight. */
  endMinute: number;
  createdAt: number;
};

type StoreShape = {
  hydrated: boolean;
  windows: RiskWindow[];
  hydrate: () => Promise<void>;
  add: (input: Omit<RiskWindow, "id" | "createdAt">) => Promise<RiskWindow>;
  update: (id: string, patch: Partial<Omit<RiskWindow, "id" | "createdAt">>) => Promise<void>;
  remove: (id: string) => Promise<void>;
};

function genId(): string {
  return `rw_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

async function persist(windows: RiskWindow[]) {
  await SecureStore.setItemAsync(STORE_KEY, JSON.stringify(windows));
}

export const useRiskWindowsStore = create<StoreShape>((set, get) => ({
  hydrated: false,
  windows: [],
  hydrate: async () => {
    try {
      const raw = await SecureStore.getItemAsync(STORE_KEY);
      if (!raw) {
        set({ hydrated: true, windows: [] });
        return;
      }
      const parsed = JSON.parse(raw) as RiskWindow[];
      const cleaned = Array.isArray(parsed) ? parsed.filter(isValidWindow) : [];
      set({ hydrated: true, windows: cleaned });
    } catch {
      set({ hydrated: true, windows: [] });
    }
  },
  add: async (input) => {
    const next: RiskWindow = { ...input, id: genId(), createdAt: Date.now() };
    const updated = [...get().windows, next];
    await persist(updated);
    set({ windows: updated });
    return next;
  },
  update: async (id, patch) => {
    const updated = get().windows.map((w) =>
      w.id === id ? { ...w, ...patch } : w
    );
    await persist(updated);
    set({ windows: updated });
  },
  remove: async (id) => {
    const updated = get().windows.filter((w) => w.id !== id);
    await persist(updated);
    set({ windows: updated });
  },
}));

function isValidWindow(w: unknown): w is RiskWindow {
  if (!w || typeof w !== "object") return false;
  const x = w as Partial<RiskWindow>;
  return (
    typeof x.id === "string" &&
    typeof x.label === "string" &&
    Array.isArray(x.days) &&
    x.days.every((d) => typeof d === "number" && d >= 0 && d <= 6) &&
    typeof x.startHour === "number" &&
    typeof x.startMinute === "number" &&
    typeof x.endHour === "number" &&
    typeof x.endMinute === "number"
  );
}

/**
 * Whether `now` falls inside `w`. Supports cross-midnight windows
 * (end-of-day ≤ start-of-day means it spans into the next day).
 */
export function isInsideWindow(w: RiskWindow, now: Date): boolean {
  const day = now.getDay() as Weekday;
  const minutes = now.getHours() * 60 + now.getMinutes();
  const start = w.startHour * 60 + w.startMinute;
  const end = w.endHour * 60 + w.endMinute;

  if (start === end) return false;

  if (start < end) {
    // Same-day window.
    return w.days.includes(day) && minutes >= start && minutes < end;
  }

  // Cross-midnight: [start..1440) on day OR [0..end) on the next day.
  const prevDay = ((day + 6) % 7) as Weekday;
  if (w.days.includes(day) && minutes >= start) return true;
  if (w.days.includes(prevDay) && minutes < end) return true;
  return false;
}

/** First active window at `now`, or null. */
export function getActiveWindow(
  windows: RiskWindow[],
  now: Date = new Date()
): RiskWindow | null {
  for (const w of windows) {
    if (isInsideWindow(w, now)) return w;
  }
  return null;
}

const DAY_LABELS_SHORT: Record<Weekday, string> = {
  0: "Paz",
  1: "Pzt",
  2: "Sal",
  3: "Çar",
  4: "Per",
  5: "Cum",
  6: "Cmt",
};

export function formatDays(days: Weekday[]): string {
  if (days.length === 7) return "Her gün";
  if (
    days.length === 5 &&
    [1, 2, 3, 4, 5].every((d) => days.includes(d as Weekday))
  ) {
    return "Hafta içi";
  }
  if (
    days.length === 2 &&
    days.includes(0) &&
    days.includes(6)
  ) {
    return "Hafta sonu";
  }
  return [...days]
    .sort((a, b) => ((a + 6) % 7) - ((b + 6) % 7)) // Mon-first display
    .map((d) => DAY_LABELS_SHORT[d])
    .join(", ");
}

export function formatHM(h: number, m: number): string {
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}
