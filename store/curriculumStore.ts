import { create } from "zustand";
import * as SecureStore from "expo-secure-store";

import { TOTAL_DAYS } from "@/app/data/recoveryCurriculum";

/**
 * Tracks the user's progress through the 30-day curriculum.
 *
 * Persistence is a single JSON blob: { startedAt, completed: number[],
 * reflections: { [day]: string } }. Reflections are stored locally, never
 * leave the device.
 */

const STORE_KEY = "antislot_curriculum_v1";

type Reflection = { day: number; text: string; savedAt: number };

export type CurriculumState = {
  startedAt: number | null;
  completed: number[];
  reflections: Record<number, Reflection>;
};

type StoreShape = {
  hydrated: boolean;
  state: CurriculumState;
  hydrate: () => Promise<void>;
  start: () => Promise<void>;
  /** Mark a day complete (idempotent). */
  complete: (day: number) => Promise<void>;
  /** Persist or update a reflection for a given day. */
  saveReflection: (day: number, text: string) => Promise<void>;
  /** Hard reset — wipes everything. */
  reset: () => Promise<void>;
};

const EMPTY: CurriculumState = {
  startedAt: null,
  completed: [],
  reflections: {},
};

async function persist(state: CurriculumState) {
  await SecureStore.setItemAsync(STORE_KEY, JSON.stringify(state));
}

function sanitize(input: unknown): CurriculumState {
  if (!input || typeof input !== "object") return EMPTY;
  const i = input as Partial<CurriculumState>;
  const completed = Array.isArray(i.completed)
    ? i.completed.filter(
        (d): d is number => typeof d === "number" && d >= 1 && d <= TOTAL_DAYS
      )
    : [];
  const reflections: Record<number, Reflection> = {};
  if (i.reflections && typeof i.reflections === "object") {
    for (const [k, v] of Object.entries(i.reflections)) {
      const day = Number(k);
      const r = v as Partial<Reflection>;
      if (
        Number.isFinite(day) &&
        day >= 1 &&
        day <= TOTAL_DAYS &&
        typeof r?.text === "string"
      ) {
        reflections[day] = {
          day,
          text: r.text,
          savedAt: typeof r.savedAt === "number" ? r.savedAt : Date.now(),
        };
      }
    }
  }
  return {
    startedAt: typeof i.startedAt === "number" ? i.startedAt : null,
    completed,
    reflections,
  };
}

export const useCurriculumStore = create<StoreShape>((set, get) => ({
  hydrated: false,
  state: EMPTY,
  hydrate: async () => {
    try {
      const raw = await SecureStore.getItemAsync(STORE_KEY);
      if (!raw) {
        set({ hydrated: true, state: EMPTY });
        return;
      }
      set({ hydrated: true, state: sanitize(JSON.parse(raw)) });
    } catch {
      set({ hydrated: true, state: EMPTY });
    }
  },
  start: async () => {
    if (get().state.startedAt) return;
    const next: CurriculumState = {
      ...get().state,
      startedAt: Date.now(),
    };
    await persist(next);
    set({ state: next });
  },
  complete: async (day) => {
    const current = get().state;
    if (current.completed.includes(day)) return;
    const next: CurriculumState = {
      ...current,
      // First completion implicitly starts the journey.
      startedAt: current.startedAt ?? Date.now(),
      completed: [...current.completed, day].sort((a, b) => a - b),
    };
    await persist(next);
    set({ state: next });
  },
  saveReflection: async (day, text) => {
    const trimmed = text.trim();
    const current = get().state;
    const reflections = { ...current.reflections };
    if (trimmed.length === 0) {
      delete reflections[day];
    } else {
      reflections[day] = { day, text: trimmed, savedAt: Date.now() };
    }
    const next: CurriculumState = { ...current, reflections };
    await persist(next);
    set({ state: next });
  },
  reset: async () => {
    await SecureStore.deleteItemAsync(STORE_KEY);
    set({ state: EMPTY });
  },
}));

/**
 * Returns the day number the user should focus on next. Logic:
 *   - If never started → 1 (so the hub can entice "Start").
 *   - If today's day equals the latest completed + 1, that's the next.
 *   - If they're behind schedule, the next is "first uncompleted in order".
 *   - Clamps at TOTAL_DAYS.
 */
export function getNextDay(state: CurriculumState): number {
  if (state.completed.length === 0) return 1;
  for (let d = 1; d <= TOTAL_DAYS; d++) {
    if (!state.completed.includes(d)) return d;
  }
  return TOTAL_DAYS;
}

/** Completion percentage (0..100). */
export function progressPct(state: CurriculumState): number {
  if (TOTAL_DAYS === 0) return 0;
  return Math.round((state.completed.length / TOTAL_DAYS) * 100);
}
