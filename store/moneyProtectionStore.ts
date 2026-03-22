import { create } from "zustand";

import { storage, STORAGE_KEYS } from "@/lib/storage";
import type {
  MoneyProtectionSyncRequest,
  MoneyProtectionSyncResponse,
  MoneyProtectionSyncState,
} from "@/types/moneyProtectionSync";

const CHECK_FIELDS = [
  "cardAway",
  "alone",
  "emotionalDistress",
  "escapeNeed",
  "emotionalVoid",
  "bankAppHidden",
  "paymentsDisabled",
] as const;
const PROTECTIVE_CHECK_FIELDS = ["cardAway", "bankAppHidden", "paymentsDisabled"] as const;
const RISK_CHECK_FIELDS = ["alone", "emotionalDistress", "escapeNeed", "emotionalVoid"] as const;
const TOTAL_CHECKS = CHECK_FIELDS.length;
const DEFAULT_LOCK_MINUTES = 20;
const MAX_LOCK_MINUTES = 24 * 60;
const MAX_TRY_AMOUNT = 1_000_000;

const STORAGE_KEY = STORAGE_KEYS.MONEY_PROTECTION_STATE;
const LAST_SYNC_AT_KEY = STORAGE_KEYS.MONEY_PROTECTION_LAST_SYNC_AT;

type CheckField = (typeof CHECK_FIELDS)[number];
type CheckState = Pick<MoneyProtectionState, CheckField>;
type PersistedShape = Partial<Record<keyof MoneyProtectionState, unknown>>;
type MoneyProtectionSyncClient = (
  payload: MoneyProtectionSyncRequest
) => Promise<MoneyProtectionSyncResponse | null>;

export type MoneyProtectionRiskLevel = "safe" | "warning" | "high";

export interface MoneyProtectionState {
  cardAway: boolean;
  alone: boolean;
  emotionalDistress: boolean;
  escapeNeed: boolean;
  emotionalVoid: boolean;
  bankAppHidden: boolean;
  paymentsDisabled: boolean;
  lastSafeCheck: number | null;
  dailyLimitTRY: number;
  savedTodayTRY: number;
  savedTodayDateKey: string | null;
  lockMinutes: number;
  lockStartedAt: number | null;
  updatedAt: number;
}

interface MoneyProtectionStoreState extends MoneyProtectionState {
  completedChecks: number;
  totalChecks: number;
  protectionScore: number;
  canConfirmSafe: boolean;
  riskLevel: MoneyProtectionRiskLevel;
  lockActive: boolean;
  lockRemainingSec: number;
  hydrated: boolean;
  hydrate: () => Promise<void>;
  updateChecks: (partial: Partial<Pick<MoneyProtectionState, CheckField>>) => Promise<void>;
  markSafeToday: () => Promise<void>;
  setDailyLimitTRY: (limit: number) => Promise<void>;
  addSpendTRY: (amount: number) => Promise<void>;
  startLock: (minutes?: number) => Promise<void>;
  stopLock: () => Promise<void>;
  refreshLockState: () => Promise<void>;
  getRiskLevel: () => MoneyProtectionRiskLevel;
  syncWithServer: () => Promise<void>;
  reset: () => Promise<void>;
}

const DEFAULT_STATE: MoneyProtectionState = {
  cardAway: false,
  alone: false,
  emotionalDistress: false,
  escapeNeed: false,
  emotionalVoid: false,
  bankAppHidden: false,
  paymentsDisabled: false,
  lastSafeCheck: null,
  dailyLimitTRY: 0,
  savedTodayTRY: 0,
  savedTodayDateKey: null,
  lockMinutes: 0,
  lockStartedAt: null,
  updatedAt: 0,
};

let syncInFlight: Promise<void> | null = null;
let syncQueued = false;
let moneyProtectionSyncClient: MoneyProtectionSyncClient | null = null;

function clampNumber(
  value: unknown,
  fallback: number,
  min = 0,
  max = Number.MAX_SAFE_INTEGER
): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, parsed));
}

function toCurrency(value: number): number {
  return Math.round(value * 100) / 100;
}

function normalizeDateKey(value: unknown): string | null {
  if (typeof value !== "string") return null;
  return /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : null;
}

function getDayKey(timestamp: number): string {
  const date = new Date(timestamp);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parsePositiveMs(value: unknown, fallback: number): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return Math.trunc(parsed);
}

function getLockRemainingSec(
  state: Pick<MoneyProtectionState, "lockMinutes" | "lockStartedAt">,
  now = Date.now()
): number {
  if (!state.lockStartedAt || state.lockMinutes <= 0) return 0;
  const lockEndsAt = state.lockStartedAt + state.lockMinutes * 60 * 1000;
  const remainingMs = lockEndsAt - now;
  if (remainingMs <= 0) return 0;
  return Math.floor(remainingMs / 1000);
}

function countTrueChecks(state: CheckState, fields: readonly CheckField[]): number {
  return fields.reduce((count, field) => count + (state[field] ? 1 : 0), 0);
}

function normalizeState(rawValue: unknown): MoneyProtectionState {
  const raw = (rawValue && typeof rawValue === "object" ? rawValue : {}) as PersistedShape;
  const lockMinutes = Math.round(clampNumber(raw.lockMinutes, 0, 0, MAX_LOCK_MINUTES));
  const lockStartedAt = parsePositiveMs(raw.lockStartedAt, 0) || null;
  const lastSafeCheck = parsePositiveMs(raw.lastSafeCheck, 0) || null;

  const normalized: MoneyProtectionState = {
    cardAway: Boolean(raw.cardAway),
    alone: Boolean(raw.alone),
    emotionalDistress: Boolean(raw.emotionalDistress),
    escapeNeed: Boolean(raw.escapeNeed),
    emotionalVoid: Boolean(raw.emotionalVoid),
    bankAppHidden: Boolean(raw.bankAppHidden),
    paymentsDisabled: Boolean(raw.paymentsDisabled),
    lastSafeCheck,
    dailyLimitTRY: toCurrency(clampNumber(raw.dailyLimitTRY, 0, 0, MAX_TRY_AMOUNT)),
    savedTodayTRY: toCurrency(clampNumber(raw.savedTodayTRY, 0, 0, MAX_TRY_AMOUNT)),
    savedTodayDateKey: normalizeDateKey(raw.savedTodayDateKey),
    lockMinutes: lockStartedAt && lockMinutes > 0 ? lockMinutes : 0,
    lockStartedAt: lockStartedAt && lockMinutes > 0 ? lockStartedAt : null,
    updatedAt: parsePositiveMs(raw.updatedAt, Math.max(lastSafeCheck ?? 0, lockStartedAt ?? 0, 0)),
  };

  return normalized;
}

function normalizeSyncState(rawValue: unknown): MoneyProtectionState | null {
  if (!rawValue || typeof rawValue !== "object") return null;
  return normalizeState(rawValue);
}

function maybeRollDailySpend(
  state: MoneyProtectionState,
  now = Date.now()
): { next: MoneyProtectionState; changed: boolean } {
  const today = getDayKey(now);
  if (state.savedTodayDateKey === today) {
    return { next: state, changed: false };
  }

  return {
    next: {
      ...state,
      savedTodayTRY: 0,
      savedTodayDateKey: today,
      updatedAt: Math.max(state.updatedAt, now),
    },
    changed: true,
  };
}

function maybeClearExpiredLock(
  state: MoneyProtectionState,
  now = Date.now()
): { next: MoneyProtectionState; changed: boolean } {
  if (!state.lockStartedAt || state.lockMinutes <= 0) {
    return { next: state, changed: false };
  }

  if (getLockRemainingSec(state, now) > 0) {
    return { next: state, changed: false };
  }

  return {
    next: {
      ...state,
      lockMinutes: 0,
      lockStartedAt: null,
      updatedAt: Math.max(state.updatedAt, now),
    },
    changed: true,
  };
}

function computeDerived(state: MoneyProtectionState, now = Date.now()) {
  const checks = state as CheckState;
  const protectiveReady = countTrueChecks(checks, PROTECTIVE_CHECK_FIELDS);
  const activeRiskFlags = countTrueChecks(checks, RISK_CHECK_FIELDS);
  const safeRiskChecks = RISK_CHECK_FIELDS.length - activeRiskFlags;
  const completedChecks = protectiveReady + safeRiskChecks;
  const baseScore = Math.round((completedChecks / TOTAL_CHECKS) * 100);

  const lockRemainingSec = getLockRemainingSec(state, now);
  const lockActive = lockRemainingSec > 0;
  const limitExceeded = state.dailyLimitTRY > 0 && state.savedTodayTRY >= state.dailyLimitTRY;

  const protectionScore = Math.max(0, Math.min(100, limitExceeded ? baseScore - 20 : baseScore));
  const canConfirmSafe =
    protectiveReady === PROTECTIVE_CHECK_FIELDS.length &&
    activeRiskFlags === 0 &&
    !lockActive &&
    !limitExceeded;

  let riskLevel: MoneyProtectionRiskLevel = "safe";
  if (lockActive || limitExceeded || activeRiskFlags >= 2 || protectiveReady <= 1) {
    riskLevel = "high";
  } else if (activeRiskFlags >= 1 || protectiveReady <= 2) {
    riskLevel = "warning";
  }

  return {
    completedChecks,
    totalChecks: TOTAL_CHECKS,
    protectionScore,
    canConfirmSafe,
    riskLevel,
    lockActive,
    lockRemainingSec,
  };
}

function compareStateQuality(a: MoneyProtectionState, b: MoneyProtectionState): number {
  if (a.updatedAt !== b.updatedAt) return a.updatedAt - b.updatedAt;

  const aLock = a.lockStartedAt && a.lockMinutes > 0 ? 1 : 0;
  const bLock = b.lockStartedAt && b.lockMinutes > 0 ? 1 : 0;
  if (aLock !== bLock) return aLock - bLock;

  if (a.savedTodayTRY !== b.savedTodayTRY) return a.savedTodayTRY - b.savedTodayTRY;
  if (a.dailyLimitTRY !== b.dailyLimitTRY) return b.dailyLimitTRY - a.dailyLimitTRY;

  const aChecks = countTrueChecks(a as CheckState, PROTECTIVE_CHECK_FIELDS);
  const bChecks = countTrueChecks(b as CheckState, PROTECTIVE_CHECK_FIELDS);
  if (aChecks !== bChecks) return aChecks - bChecks;

  return (a.lastSafeCheck ?? 0) - (b.lastSafeCheck ?? 0);
}

function mergeStates(preferred: MoneyProtectionState, secondary: MoneyProtectionState): MoneyProtectionState {
  return compareStateQuality(preferred, secondary) >= 0 ? preferred : secondary;
}

function pickPersistedState(state: MoneyProtectionStoreState): MoneyProtectionState {
  return {
    cardAway: state.cardAway,
    alone: state.alone,
    emotionalDistress: state.emotionalDistress,
    escapeNeed: state.escapeNeed,
    emotionalVoid: state.emotionalVoid,
    bankAppHidden: state.bankAppHidden,
    paymentsDisabled: state.paymentsDisabled,
    lastSafeCheck: state.lastSafeCheck,
    dailyLimitTRY: state.dailyLimitTRY,
    savedTodayTRY: state.savedTodayTRY,
    savedTodayDateKey: state.savedTodayDateKey,
    lockMinutes: state.lockMinutes,
    lockStartedAt: state.lockStartedAt,
    updatedAt: state.updatedAt,
  };
}

function toSyncState(state: MoneyProtectionState): MoneyProtectionSyncState {
  return {
    cardAway: state.cardAway,
    alone: state.alone,
    emotionalDistress: state.emotionalDistress,
    escapeNeed: state.escapeNeed,
    emotionalVoid: state.emotionalVoid,
    bankAppHidden: state.bankAppHidden,
    paymentsDisabled: state.paymentsDisabled,
    lastSafeCheck: state.lastSafeCheck,
    dailyLimitTRY: state.dailyLimitTRY,
    savedTodayTRY: state.savedTodayTRY,
    savedTodayDateKey: state.savedTodayDateKey,
    lockMinutes: state.lockMinutes,
    lockStartedAt: state.lockStartedAt,
    updatedAt: state.updatedAt,
  };
}

async function persistState(state: MoneyProtectionState): Promise<void> {
  await storage.set(STORAGE_KEY, state, { type: "standard" });
}

async function readStoredState(repair = false): Promise<MoneyProtectionState> {
  const stored = await storage.get<MoneyProtectionState>(STORAGE_KEY, { type: "standard" });
  const now = Date.now();
  let normalized = normalizeState(stored);
  const dayAdjusted = maybeRollDailySpend(normalized, now);
  normalized = dayAdjusted.next;
  const lockAdjusted = maybeClearExpiredLock(normalized, now);
  normalized = lockAdjusted.next;

  if (repair && (dayAdjusted.changed || lockAdjusted.changed)) {
    await persistState(normalized);
  }
  return normalized;
}

function sanitizeCheckPatch(
  partial: Partial<Pick<MoneyProtectionState, CheckField>>
): Partial<Pick<MoneyProtectionState, CheckField>> {
  const patch: Partial<Pick<MoneyProtectionState, CheckField>> = {};
  for (const field of CHECK_FIELDS) {
    if (field in partial) {
      patch[field] = Boolean(partial[field]);
    }
  }
  return patch;
}

async function getStoredLastSyncAt(): Promise<number> {
  const raw = await storage.get<number | string>(LAST_SYNC_AT_KEY, { type: "standard" });
  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed <= 0) return 0;
  return Math.trunc(parsed);
}

async function setStoredLastSyncAt(value: number): Promise<void> {
  if (!Number.isFinite(value) || value <= 0) return;
  await storage.set(LAST_SYNC_AT_KEY, Math.trunc(value), { type: "standard" });
}

function syncSnapshot(
  payload: MoneyProtectionSyncRequest
): Promise<MoneyProtectionSyncResponse | null> {
  if (!moneyProtectionSyncClient) {
    return Promise.resolve(null);
  }
  return moneyProtectionSyncClient(payload);
}

function scheduleSync(): void {
  void syncMoneyProtectionWithServer().catch((error) => {
    console.warn("[MoneyProtectionStore] Cloud sync error:", error);
  });
}

export function setMoneyProtectionSyncClient(client: MoneyProtectionSyncClient | null): void {
  moneyProtectionSyncClient = client;
}

export async function getMoneyProtectionSyncState(): Promise<{
  state: MoneyProtectionSyncState;
  lastSyncAt: number;
}> {
  const [state, lastSyncAt] = await Promise.all([
    readStoredState(true),
    getStoredLastSyncAt(),
  ]);

  return {
    state: toSyncState(state),
    lastSyncAt,
  };
}

export async function applyCloudMoneyProtectionState(
  cloudStateRaw: unknown,
  syncedAt: number
): Promise<void> {
  const remoteState = normalizeSyncState(cloudStateRaw);
  if (!remoteState) return;

  const localState = await readStoredState(true);
  const merged = mergeStates(localState, remoteState);

  await persistState(merged);
  if (syncedAt > 0) {
    await setStoredLastSyncAt(syncedAt);
  }
}

export async function syncMoneyProtectionWithServer(): Promise<void> {
  if (!moneyProtectionSyncClient) {
    return;
  }

  if (syncInFlight) {
    syncQueued = true;
    return syncInFlight;
  }

  syncInFlight = (async () => {
    do {
      syncQueued = false;

      const snapshot = await getMoneyProtectionSyncState();
      const response = await syncSnapshot({
        state: snapshot.state,
        lastSyncAt: snapshot.lastSyncAt,
      });
      if (!response) {
        return;
      }

      await applyCloudMoneyProtectionState(response.state, response.serverTime);
    } while (syncQueued);
  })().finally(() => {
    syncInFlight = null;
  });

  return syncInFlight;
}

export const useMoneyProtectionStore = create<MoneyProtectionStoreState>((set, get) => ({
  ...DEFAULT_STATE,
  ...computeDerived(DEFAULT_STATE),
  hydrated: false,

  hydrate: async () => {
    const state = get();
    if (state.hydrated) return;

    try {
      const normalized = await readStoredState(true);
      const derived = computeDerived(normalized, Date.now());
      set({
        ...normalized,
        ...derived,
        hydrated: true,
      });
    } catch (error) {
      console.error("[MoneyProtectionStore] Hydration error:", error);
      set({
        ...DEFAULT_STATE,
        ...computeDerived(DEFAULT_STATE),
        hydrated: true,
      });
    }
  },

  updateChecks: async (partial) => {
    const state = get();
    const now = Date.now();
    const patch = sanitizeCheckPatch(partial);
    if (Object.keys(patch).length === 0) return;

    const dayAdjusted = maybeRollDailySpend(pickPersistedState(state), now);
    const lockAdjusted = maybeClearExpiredLock(dayAdjusted.next, now);
    const nextState: MoneyProtectionState = {
      ...lockAdjusted.next,
      ...patch,
      updatedAt: now,
    };
    const derived = computeDerived(nextState, now);

    set({
      ...nextState,
      ...derived,
    });

    try {
      await persistState(nextState);
      scheduleSync();
    } catch (error) {
      console.error("[MoneyProtectionStore] Failed to save state:", error);
    }
  },

  markSafeToday: async () => {
    await get().refreshLockState();
    const state = get();
    if (!state.canConfirmSafe) return;

    const now = Date.now();
    const nextState: MoneyProtectionState = {
      ...pickPersistedState(state),
      lastSafeCheck: now,
      updatedAt: now,
    };
    const derived = computeDerived(nextState, now);

    set({
      ...nextState,
      ...derived,
    });

    try {
      await persistState(nextState);
      scheduleSync();
    } catch (error) {
      console.error("[MoneyProtectionStore] Failed to save safe check timestamp:", error);
    }
  },

  setDailyLimitTRY: async (limit) => {
    const state = get();
    const now = Date.now();
    const dayAdjusted = maybeRollDailySpend(pickPersistedState(state), now);
    const safeLimit = toCurrency(clampNumber(limit, 0, 0, MAX_TRY_AMOUNT));
    const nextState: MoneyProtectionState = {
      ...dayAdjusted.next,
      dailyLimitTRY: safeLimit,
      updatedAt: now,
    };
    const derived = computeDerived(nextState, now);

    set({
      ...nextState,
      ...derived,
    });

    try {
      await persistState(nextState);
      scheduleSync();
    } catch (error) {
      console.error("[MoneyProtectionStore] Failed to save daily limit:", error);
    }
  },

  addSpendTRY: async (amount) => {
    const state = get();
    const now = Date.now();
    const dayAdjusted = maybeRollDailySpend(pickPersistedState(state), now);
    const spend = toCurrency(clampNumber(amount, 0, 0, MAX_TRY_AMOUNT));
    if (spend <= 0) return;

    const nextState: MoneyProtectionState = {
      ...dayAdjusted.next,
      savedTodayTRY: toCurrency(Math.min(MAX_TRY_AMOUNT, dayAdjusted.next.savedTodayTRY + spend)),
      updatedAt: now,
    };
    const derived = computeDerived(nextState, now);

    set({
      ...nextState,
      ...derived,
    });

    try {
      await persistState(nextState);
      scheduleSync();
    } catch (error) {
      console.error("[MoneyProtectionStore] Failed to save spend:", error);
    }
  },

  startLock: async (minutes = DEFAULT_LOCK_MINUTES) => {
    const state = get();
    const now = Date.now();
    const dayAdjusted = maybeRollDailySpend(pickPersistedState(state), now);
    const safeMinutes = Math.round(clampNumber(minutes, DEFAULT_LOCK_MINUTES, 1, MAX_LOCK_MINUTES));
    const nextState: MoneyProtectionState = {
      ...dayAdjusted.next,
      lockMinutes: safeMinutes,
      lockStartedAt: now,
      updatedAt: now,
    };
    const derived = computeDerived(nextState, now);

    set({
      ...nextState,
      ...derived,
    });

    try {
      await persistState(nextState);
      scheduleSync();
    } catch (error) {
      console.error("[MoneyProtectionStore] Failed to start lock:", error);
    }
  },

  stopLock: async () => {
    const state = get();
    const now = Date.now();
    const nextState: MoneyProtectionState = {
      ...pickPersistedState(state),
      lockMinutes: 0,
      lockStartedAt: null,
      updatedAt: now,
    };
    const derived = computeDerived(nextState, now);

    set({
      ...nextState,
      ...derived,
    });

    try {
      await persistState(nextState);
      scheduleSync();
    } catch (error) {
      console.error("[MoneyProtectionStore] Failed to stop lock:", error);
    }
  },

  refreshLockState: async () => {
    const state = get();
    const now = Date.now();
    const dayAdjusted = maybeRollDailySpend(pickPersistedState(state), now);
    const lockAdjusted = maybeClearExpiredLock(dayAdjusted.next, now);
    const nextState = lockAdjusted.next;
    const derived = computeDerived(nextState, now);

    set({
      ...nextState,
      ...derived,
    });

    if (!dayAdjusted.changed && !lockAdjusted.changed) {
      return;
    }

    try {
      await persistState(nextState);
      scheduleSync();
    } catch (error) {
      console.error("[MoneyProtectionStore] Failed to refresh lock state:", error);
    }
  },

  getRiskLevel: () => {
    const now = Date.now();
    const state = pickPersistedState(get());
    return computeDerived(state, now).riskLevel;
  },

  syncWithServer: async () => {
    await syncMoneyProtectionWithServer();
    const normalized = await readStoredState(true);
    const derived = computeDerived(normalized, Date.now());
    set({
      ...normalized,
      ...derived,
    });
  },

  reset: async () => {
    const now = Date.now();
    const resetPersistedState: MoneyProtectionState = {
      ...DEFAULT_STATE,
      savedTodayDateKey: getDayKey(now),
      updatedAt: now,
    };
    const resetState = {
      ...resetPersistedState,
      ...computeDerived(resetPersistedState, now),
      hydrated: true,
    };

    set(resetState);

    try {
      await Promise.all([
        persistState(resetPersistedState),
        storage.remove(LAST_SYNC_AT_KEY, { type: "standard" }),
      ]);
    } catch (error) {
      console.error("[MoneyProtectionStore] Failed to reset state:", error);
    }
  },
}));
