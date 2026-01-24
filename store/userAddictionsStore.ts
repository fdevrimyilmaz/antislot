import { create } from "zustand";
import * as SecureStore from "expo-secure-store";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Global addiction selection + progress state (persisted).
export const ADDICTION_KEYS = ["gambling"] as const;
export type AddictionKey = (typeof ADDICTION_KEYS)[number];
export type UserAddictions = Record<AddictionKey, boolean>;

export type ProgressState = {
  gambling: { daysClean: number; lastResetAt?: string };
};

type DaysCleanKey = "gambling";

export const ADDICTION_LABELS: Record<AddictionKey, string> = {
  gambling: "Kumar",
};

const STORAGE_KEYS = {
  userAddictions: "userAddictions",
  progress: "progress",
};

const DEFAULT_USER_ADDICTIONS: UserAddictions = {
  gambling: true,
};

const DEFAULT_PROGRESS: ProgressState = {
  gambling: { daysClean: 0 },
};

const DAY_MS = 24 * 60 * 60 * 1000;
let secureStoreAvailable: boolean | null = null;

async function isSecureStoreAvailable() {
  if (secureStoreAvailable !== null) return secureStoreAvailable;
  try {
    secureStoreAvailable = await SecureStore.isAvailableAsync();
  } catch {
    secureStoreAvailable = false;
  }
  return secureStoreAvailable;
}

async function readStorage(key: string): Promise<string | null> {
  try {
    if (await isSecureStoreAvailable()) {
      return await SecureStore.getItemAsync(key);
    }
  } catch (error) {
    console.warn("SecureStore okunamadı:", error);
  }
  try {
    return await AsyncStorage.getItem(key);
  } catch (error) {
    console.warn("AsyncStorage okunamadı:", error);
  }
  return null;
}

async function writeStorage(key: string, value: string) {
  try {
    if (await isSecureStoreAvailable()) {
      await SecureStore.setItemAsync(key, value);
      return;
    }
  } catch (error) {
    console.warn("SecureStore yazılamadı:", error);
  }
  try {
    await AsyncStorage.setItem(key, value);
  } catch (error) {
    console.warn("AsyncStorage yazılamadı:", error);
  }
}

function safeJsonParse<T>(value: string | null): T | null {
  if (!value) return null;
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

function normalizeUserAddictions(raw: unknown): UserAddictions {
  const next = { ...DEFAULT_USER_ADDICTIONS };
  if (!raw || typeof raw !== "object") return next;
  const record = raw as Record<string, unknown>;
  ADDICTION_KEYS.forEach((key) => {
    if (typeof record[key] === "boolean") {
      next[key] = record[key] as boolean;
    }
  });
  return next;
}

function normalizeProgress(raw: unknown): ProgressState {
  const next: ProgressState = {
    gambling: { ...DEFAULT_PROGRESS.gambling },
  };
  if (!raw || typeof raw !== "object") return next;
  const record = raw as Partial<ProgressState> & Record<string, unknown>;

  const applyDaysClean = (key: DaysCleanKey) => {
    const entry = record[key];
    if (!entry || typeof entry !== "object") return;
    const typed = entry as ProgressState[DaysCleanKey];
    if (typeof typed.daysClean === "number" && Number.isFinite(typed.daysClean)) {
      next[key].daysClean = typed.daysClean;
    }
    if (typeof typed.lastResetAt === "string") {
      next[key].lastResetAt = typed.lastResetAt;
    }
  };

  applyDaysClean("gambling");

  return next;
}

function syncDaysClean(progress: ProgressState): ProgressState {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const computeDays = (entry: ProgressState[DaysCleanKey]) => {
    if (!entry.lastResetAt) return entry;
    const resetDate = new Date(entry.lastResetAt);
    if (Number.isNaN(resetDate.getTime())) return entry;
    resetDate.setHours(0, 0, 0, 0);
    const diffDays = Math.max(0, Math.floor((today.getTime() - resetDate.getTime()) / DAY_MS));
    if (diffDays === entry.daysClean) return entry;
    return { ...entry, daysClean: diffDays };
  };

  return {
    ...progress,
    gambling: computeDays(progress.gambling),
  };
}

function isDaysCleanKey(key: AddictionKey): key is DaysCleanKey {
  return key === "gambling";
}

type UserAddictionsStore = {
  userAddictions: UserAddictions;
  progress: ProgressState;
  hydrated: boolean;
  hydrateFromStorage: () => Promise<void>;
  setAddiction: (key: AddictionKey, value: boolean) => Promise<void>;
  setManyAddictions: (partial: Partial<UserAddictions>) => Promise<void>;
  resetDaysClean: (key: AddictionKey) => Promise<void>;
  incrementDaysCleanDailyJob: () => Promise<void>;
};

export const useUserAddictionsStore = create<UserAddictionsStore>((set, get) => ({
  userAddictions: DEFAULT_USER_ADDICTIONS,
  progress: DEFAULT_PROGRESS,
  hydrated: true,
  hydrateFromStorage: async () => {
    if (get().hydrated) return;
    const [storedAddictions, storedProgress] = await Promise.all([
      readStorage(STORAGE_KEYS.userAddictions),
      readStorage(STORAGE_KEYS.progress),
    ]);
    const userAddictions = normalizeUserAddictions(safeJsonParse(storedAddictions));
    let progress = normalizeProgress(safeJsonParse(storedProgress));
    const nowIso = new Date().toISOString();
    (["gambling"] as DaysCleanKey[]).forEach((key) => {
      if (userAddictions[key] && !progress[key].lastResetAt) {
        progress = { ...progress, [key]: { daysClean: 0, lastResetAt: nowIso } };
      }
    });
    progress = syncDaysClean(progress);
    set({ userAddictions, progress, hydrated: true });
    await writeStorage(STORAGE_KEYS.progress, JSON.stringify(progress));
  },
  setAddiction: async (key, value) => {
    set((state) => {
      const nextAddictions = { ...state.userAddictions, [key]: value };
      let nextProgress = state.progress;
      if (value && isDaysCleanKey(key) && !state.progress[key].lastResetAt) {
        const nowIso = new Date().toISOString();
        nextProgress = { ...state.progress, [key]: { daysClean: 0, lastResetAt: nowIso } };
      }
      return { userAddictions: nextAddictions, progress: nextProgress };
    });
    await Promise.all([
      writeStorage(STORAGE_KEYS.userAddictions, JSON.stringify(get().userAddictions)),
      writeStorage(STORAGE_KEYS.progress, JSON.stringify(get().progress)),
    ]);
  },
  setManyAddictions: async (partial) => {
    set((state) => {
      const nextAddictions = { ...state.userAddictions, ...partial };
      let nextProgress = state.progress;
      const nowIso = new Date().toISOString();
      (["gambling"] as DaysCleanKey[]).forEach((key) => {
        if (nextAddictions[key] && !nextProgress[key].lastResetAt) {
          nextProgress = { ...nextProgress, [key]: { daysClean: 0, lastResetAt: nowIso } };
        }
      });
      return { userAddictions: nextAddictions, progress: nextProgress };
    });
    await Promise.all([
      writeStorage(STORAGE_KEYS.userAddictions, JSON.stringify(get().userAddictions)),
      writeStorage(STORAGE_KEYS.progress, JSON.stringify(get().progress)),
    ]);
  },
  resetDaysClean: async (key) => {
    if (!isDaysCleanKey(key)) return;
    const nowIso = new Date().toISOString();
    set((state) => ({
      progress: {
        ...state.progress,
        [key]: { daysClean: 0, lastResetAt: nowIso },
      },
    }));
    await writeStorage(STORAGE_KEYS.progress, JSON.stringify(get().progress));
  },
  incrementDaysCleanDailyJob: async () => {
    const updated = syncDaysClean(get().progress);
    set({ progress: updated });
    await writeStorage(STORAGE_KEYS.progress, JSON.stringify(updated));
  },
}));
