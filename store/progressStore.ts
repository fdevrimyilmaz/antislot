import * as SecureStore from "@/lib/secureStoreCompat";
import { create } from "zustand";

import { auth } from "@/lib/firebase";
import { getJSON, setJSON } from "@/lib/storage";
import { STORAGE_KEYS } from "@/lib/storage/keys";
import { readProgress, writeProgress } from "@/services/progress";

export type DayStatus = "clean" | "reset" | "empty";

export type ProgressExtras = {
  bestStreak: number;
  resetDates: string[];
  totalCleanDaysAllTime: number;
  checkedInDates: string[];
};

function todayKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

const MAX_DAYS_LOG = 7;

function buildLast7Days(
  resetDates: string[],
  checkedInDates: string[],
  todayStr: string
): { date: string; status: DayStatus }[] {
  const result: { date: string; status: DayStatus }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    const isReset = resetDates.includes(key);
    const isCheckedIn = checkedInDates.includes(key);
    const isToday = key === todayStr;
    const status: DayStatus = isReset
      ? "reset"
      : isCheckedIn || (isToday && !isReset)
        ? "clean"
        : "empty";
    result.push({ date: key, status });
  }
  return result;
}

export const BADGE_MILESTONES = [3, 7, 30, 100] as const;

export function getNextBadgeTarget(currentCleanDays: number): number {
  const next = BADGE_MILESTONES.find((m) => currentCleanDays < m);
  return next ?? BADGE_MILESTONES[BADGE_MILESTONES.length - 1];
}

export function getProgressDerived(state: { gamblingFreeDays: number; progressExtras: ProgressExtras }) {
  const currentCleanDays = state.gamblingFreeDays;
  const currentStreak = currentCleanDays;
  const bestStreak = state.progressExtras.bestStreak;
  const totalCleanDaysAllTime = state.progressExtras.totalCleanDaysAllTime ?? 0;
  const today = todayKey();
  const resetToday = state.progressExtras.resetDates.includes(today);
  const checkedInToday = (state.progressExtras.checkedInDates ?? []).includes(today);
  const cleanToday = !resetToday && (checkedInToday || currentCleanDays > 0);
  const last7Days = buildLast7Days(
    state.progressExtras.resetDates,
    state.progressExtras.checkedInDates ?? [],
    today
  );
  const weekCleanCount = last7Days.filter((d) => d.status === "clean").length;
  const xp = totalCleanDaysAllTime * 10;
  const level = Math.floor(xp / 100);
  const nextLevelXP = (level + 1) * 100;
  const xpInLevel = xp % 100;
  const nextBadgeTarget = getNextBadgeTarget(currentCleanDays);
  return {
    currentCleanDays,
    currentStreak,
    bestStreak,
    totalCleanDaysAllTime,
    today,
    cleanToday,
    last7Days,
    weekCleanCount,
    xp,
    level,
    nextLevelXP,
    xpInLevel,
    nextBadgeTarget,
  };
}

type ProgressStoreState = {
  gamblingFreeDays: number;
  progressExtras: ProgressExtras;
  hydrated: boolean;
  loading: boolean;
  error: string | null;
  hydrate: (uid?: string) => Promise<void>;
  reset: (uid?: string) => Promise<void>;
  checkInToday: () => Promise<void>;
};

const SESSIONS_COMPLETED_KEY = "antislot_sessions_completed";

const DEFAULT_EXTRAS: ProgressExtras = {
  bestStreak: 0,
  resetDates: [],
  totalCleanDaysAllTime: 0,
  checkedInDates: [],
};

function resolveErrorMessage(error: unknown) {
  if (error instanceof Error && error.message) return error.message;
  return "Ilerleme verisi guncellenemedi.";
}

function resolveUid(uid?: string) {
  return uid ?? auth?.currentUser?.uid ?? null;
}

async function loadProgressExtras(): Promise<ProgressExtras> {
  const raw = await getJSON<ProgressExtras & { totalCleanDaysAllTime?: number; checkedInDates?: string[] }>(
    STORAGE_KEYS.PROGRESS_EXTRAS
  );
  if (!raw || typeof raw !== "object") return { ...DEFAULT_EXTRAS };
  const resetDates = Array.isArray(raw.resetDates) ? raw.resetDates.filter((x) => typeof x === "string") : [];
  const checkedInDates = Array.isArray(raw.checkedInDates) ? raw.checkedInDates.filter((x) => typeof x === "string") : [];
  const bestStreak = typeof raw.bestStreak === "number" && Number.isFinite(raw.bestStreak) ? raw.bestStreak : 0;
  const totalCleanDaysAllTime =
    typeof raw.totalCleanDaysAllTime === "number" && Number.isFinite(raw.totalCleanDaysAllTime)
      ? raw.totalCleanDaysAllTime
      : 0;
  return { bestStreak, resetDates, totalCleanDaysAllTime, checkedInDates };
}

async function saveProgressExtras(extras: ProgressExtras): Promise<void> {
  const trimmed = {
    ...extras,
    resetDates: extras.resetDates.slice(-MAX_DAYS_LOG),
    checkedInDates: (extras.checkedInDates ?? []).slice(-14),
  };
  await setJSON(STORAGE_KEYS.PROGRESS_EXTRAS, trimmed);
}

export const useProgressStore = create<ProgressStoreState>((set, get) => ({
  gamblingFreeDays: 0,
  progressExtras: DEFAULT_EXTRAS,
  hydrated: false,
  loading: false,
  error: null,
  hydrate: async (uid) => {
    if (get().loading) return;
    const resolvedUid = resolveUid(uid);
    if (!resolvedUid) {
      const extras = await loadProgressExtras();
      set({ progressExtras: extras, hydrated: true, error: "Kullanici bulunamadi." });
      return;
    }
    set({ loading: true, error: null });
    try {
      const [days, extras] = await Promise.all([readProgress(resolvedUid), loadProgressExtras()]);
      set({ gamblingFreeDays: days, progressExtras: extras, hydrated: true, loading: false, error: null });
    } catch (error) {
      const extras = await loadProgressExtras().catch(() => DEFAULT_EXTRAS);
      set({ progressExtras: extras, loading: false, hydrated: true, error: resolveErrorMessage(error) });
    }
  },
  reset: async (uid) => {
    if (get().loading) return;
    const resolvedUid = resolveUid(uid);
    const state = get();
    const newBestStreak = Math.max(state.progressExtras.bestStreak, state.gamblingFreeDays);
    const today = todayKey();
    const newResetDates = [...state.progressExtras.resetDates.filter((d) => d !== today), today].slice(-MAX_DAYS_LOG);
    const totalCleanDaysAllTime =
      (state.progressExtras.totalCleanDaysAllTime ?? 0) + state.gamblingFreeDays;
    const newExtras: ProgressExtras = {
      bestStreak: newBestStreak,
      resetDates: newResetDates,
      totalCleanDaysAllTime,
      checkedInDates: state.progressExtras.checkedInDates ?? [],
    };
    set({ progressExtras: newExtras });
    await saveProgressExtras(newExtras);

    if (!resolvedUid) {
      set({ gamblingFreeDays: 0 });
      return;
    }
    set({ gamblingFreeDays: 0, loading: true, error: null, hydrated: true });
    try {
      await writeProgress(resolvedUid, 0);
      set({ loading: false });
    } catch (error) {
      set({ loading: false, error: resolveErrorMessage(error) });
    }
  },
  checkInToday: async () => {
    const today = todayKey();
    const state = get();
    const checkedIn = state.progressExtras.checkedInDates ?? [];
    if (checkedIn.includes(today)) return;
    const next = [...checkedIn, today].slice(-14);
    const newExtras: ProgressExtras = {
      ...state.progressExtras,
      checkedInDates: next,
    };
    set({ progressExtras: newExtras });
    await saveProgressExtras(newExtras);
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
