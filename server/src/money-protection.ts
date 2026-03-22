import { randomUUID } from "crypto";
import { promises as fs } from "fs";
import path from "path";
import * as moneyProtectionDb from "./money-protection-db";
import type {
  MoneyProtectionCloudEvent,
  MoneyProtectionCloudState,
  MoneyProtectionSyncResult,
} from "./money-protection-types";

type MoneyProtectionFileDb = {
  users: Record<string, MoneyProtectionCloudState>;
  events: Record<string, MoneyProtectionCloudEvent[]>;
};

const MAX_LOCK_MINUTES = 24 * 60;
const MAX_TRY_AMOUNT = 1_000_000;
const MAX_EVENTS_PER_USER = 500;

let dataFilePath = "./data/money-protection-state.json";
let usePostgres = false;
let fileDb: MoneyProtectionFileDb = { users: {}, events: {} };

const DEFAULT_STATE: MoneyProtectionCloudState = {
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

function parsePositiveMs(value: unknown, fallback: number): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return Math.trunc(parsed);
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

function getLockRemainingSec(
  state: Pick<MoneyProtectionCloudState, "lockMinutes" | "lockStartedAt">,
  now: number
): number {
  if (!state.lockStartedAt || state.lockMinutes <= 0) return 0;
  const lockEndsAt = state.lockStartedAt + state.lockMinutes * 60 * 1000;
  const remainingMs = lockEndsAt - now;
  if (remainingMs <= 0) return 0;
  return Math.floor(remainingMs / 1000);
}

function normalizeState(rawValue: unknown): MoneyProtectionCloudState {
  const raw = (rawValue && typeof rawValue === "object"
    ? rawValue
    : {}) as Partial<MoneyProtectionCloudState>;

  const lockMinutes = Math.round(clampNumber(raw.lockMinutes, 0, 0, MAX_LOCK_MINUTES));
  const lockStartedAt = parsePositiveMs(raw.lockStartedAt, 0) || null;
  const lastSafeCheck = parsePositiveMs(raw.lastSafeCheck, 0) || null;

  return {
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
    updatedAt: parsePositiveMs(
      raw.updatedAt,
      Math.max(lastSafeCheck ?? 0, lockStartedAt ?? 0, 0)
    ),
  };
}

function normalizeEvent(rawValue: unknown): MoneyProtectionCloudEvent | null {
  if (!rawValue || typeof rawValue !== "object") return null;
  const raw = rawValue as Partial<MoneyProtectionCloudEvent>;
  const id = typeof raw.id === "string" && raw.id.trim() ? raw.id.trim().slice(0, 128) : "";
  if (!id) return null;

  const createdAt = parsePositiveMs(raw.createdAt, 0);
  const localUpdatedAt = parsePositiveMs(raw.localUpdatedAt, 0);
  const resolvedUpdatedAt = parsePositiveMs(raw.resolvedUpdatedAt, 0);
  const state = normalizeState(raw.state);
  const source = raw.source === "sync" ? "sync" : "sync";

  return {
    id,
    source,
    createdAt,
    localUpdatedAt,
    resolvedUpdatedAt,
    conflicts: Math.max(0, Math.trunc(clampNumber(raw.conflicts, 0, 0, 99))),
    state,
  };
}

function normalizeEvents(input: unknown): MoneyProtectionCloudEvent[] {
  if (!Array.isArray(input)) return [];

  const byId = new Map<string, MoneyProtectionCloudEvent>();
  for (const raw of input) {
    const event = normalizeEvent(raw);
    if (!event) continue;
    byId.set(event.id, event);
  }

  return Array.from(byId.values())
    .sort((a, b) => {
      if (b.createdAt !== a.createdAt) return b.createdAt - a.createdAt;
      return b.id.localeCompare(a.id);
    })
    .slice(0, MAX_EVENTS_PER_USER);
}

function applyRuntimeAdjustments(
  state: MoneyProtectionCloudState,
  now: number
): MoneyProtectionCloudState {
  let next = { ...state };

  const today = getDayKey(now);
  if (next.savedTodayDateKey !== today) {
    next = {
      ...next,
      savedTodayTRY: 0,
      savedTodayDateKey: today,
      updatedAt: Math.max(next.updatedAt, now),
    };
  }

  if (next.lockStartedAt && next.lockMinutes > 0 && getLockRemainingSec(next, now) <= 0) {
    next = {
      ...next,
      lockMinutes: 0,
      lockStartedAt: null,
      updatedAt: Math.max(next.updatedAt, now),
    };
  }

  return next;
}

function compareStateQuality(
  a: MoneyProtectionCloudState,
  b: MoneyProtectionCloudState
): number {
  if (a.updatedAt !== b.updatedAt) return a.updatedAt - b.updatedAt;

  const aLock = a.lockStartedAt && a.lockMinutes > 0 ? 1 : 0;
  const bLock = b.lockStartedAt && b.lockMinutes > 0 ? 1 : 0;
  if (aLock !== bLock) return aLock - bLock;

  if (a.savedTodayTRY !== b.savedTodayTRY) return a.savedTodayTRY - b.savedTodayTRY;
  if (a.dailyLimitTRY !== b.dailyLimitTRY) return b.dailyLimitTRY - a.dailyLimitTRY;

  const aChecks = Number(a.cardAway) + Number(a.bankAppHidden) + Number(a.paymentsDisabled);
  const bChecks = Number(b.cardAway) + Number(b.bankAppHidden) + Number(b.paymentsDisabled);
  if (aChecks !== bChecks) return aChecks - bChecks;

  return (a.lastSafeCheck ?? 0) - (b.lastSafeCheck ?? 0);
}

function mergeStates(
  preferred: MoneyProtectionCloudState,
  secondary: MoneyProtectionCloudState
): MoneyProtectionCloudState {
  return compareStateQuality(preferred, secondary) >= 0 ? preferred : secondary;
}

function buildConflictCount(
  localState: MoneyProtectionCloudState,
  finalState: MoneyProtectionCloudState
): number {
  return compareStateQuality(localState, finalState) < 0 ? 1 : 0;
}

function buildSyncEvent(
  localState: MoneyProtectionCloudState,
  finalState: MoneyProtectionCloudState,
  conflicts: number,
  now: number
): MoneyProtectionCloudEvent {
  return {
    id: `mpe_${now}_${randomUUID().slice(0, 8)}`,
    source: "sync",
    createdAt: now,
    localUpdatedAt: localState.updatedAt,
    resolvedUpdatedAt: finalState.updatedAt,
    conflicts,
    state: finalState,
  };
}

async function ensureDir(filePath: string): Promise<void> {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
}

async function persistFileDb(): Promise<void> {
  const file = dataFilePath;
  const tmp = `${file}.tmp`;
  await ensureDir(file);
  await fs.writeFile(tmp, JSON.stringify(fileDb, null, 2), "utf8");
  await fs.rename(tmp, file);
}

function asFileDb(raw: unknown): MoneyProtectionFileDb {
  if (!raw || typeof raw !== "object") {
    return { users: {}, events: {} };
  }

  const candidate = raw as Partial<MoneyProtectionFileDb>;
  const users =
    candidate.users && typeof candidate.users === "object"
      ? (candidate.users as Record<string, unknown>)
      : {};
  const events =
    candidate.events && typeof candidate.events === "object"
      ? (candidate.events as Record<string, unknown>)
      : {};

  const normalizedUsers: Record<string, MoneyProtectionCloudState> = {};
  for (const [userId, state] of Object.entries(users)) {
    normalizedUsers[userId] = normalizeState(state);
  }

  const normalizedEvents: Record<string, MoneyProtectionCloudEvent[]> = {};
  for (const [userId, userEvents] of Object.entries(events)) {
    normalizedEvents[userId] = normalizeEvents(userEvents);
  }

  return { users: normalizedUsers, events: normalizedEvents };
}

async function loadStateFromStore(
  userId: string
): Promise<MoneyProtectionCloudState | null> {
  if (usePostgres) {
    return moneyProtectionDb.getMoneyProtectionState(userId);
  }

  return fileDb.users[userId] ? normalizeState(fileDb.users[userId]) : null;
}

async function persistStateToFile(
  userId: string,
  state: MoneyProtectionCloudState
): Promise<void> {
  fileDb.users[userId] = normalizeState(state);
  await persistFileDb();
}

async function appendEventToFile(
  userId: string,
  event: MoneyProtectionCloudEvent
): Promise<void> {
  const current = normalizeEvents(fileDb.events[userId] ?? []);
  fileDb.events[userId] = normalizeEvents([event, ...current]);
  await persistFileDb();
}

export async function initializeMoneyProtectionStore(
  filePath: string,
  databaseUrl?: string
): Promise<void> {
  dataFilePath = filePath;

  if (databaseUrl?.trim()) {
    await moneyProtectionDb.initMoneyProtectionDb(databaseUrl.trim());
    usePostgres = true;
    return;
  }

  usePostgres = false;
  await ensureDir(dataFilePath);
  try {
    const raw = await fs.readFile(dataFilePath, "utf8");
    fileDb = asFileDb(JSON.parse(raw));
  } catch {
    fileDb = { users: {}, events: {} };
    await persistFileDb();
  }
}

export async function getMoneyProtectionHistory(
  userId: string,
  limit = 50
): Promise<MoneyProtectionCloudEvent[]> {
  const safeLimit = Math.max(1, Math.min(200, Math.trunc(limit)));
  if (usePostgres) {
    return moneyProtectionDb.listMoneyProtectionEvents(userId, safeLimit);
  }

  return normalizeEvents(fileDb.events[userId] ?? []).slice(0, safeLimit);
}

export async function syncMoneyProtectionState(
  userId: string,
  localStateRaw: unknown,
  _lastSyncAt: number
): Promise<MoneyProtectionSyncResult> {
  const now = Date.now();
  const localState = applyRuntimeAdjustments(normalizeState(localStateRaw), now);

  if (usePostgres) {
    await moneyProtectionDb.upsertMoneyProtectionStateIfNewer(userId, localState);
    const stored = (await moneyProtectionDb.getMoneyProtectionState(userId)) ?? localState;
    const finalState = applyRuntimeAdjustments(normalizeState(stored), now);

    if (finalState.updatedAt <= 0) {
      finalState.updatedAt = now;
      await moneyProtectionDb.upsertMoneyProtectionStateIfNewer(userId, finalState);
    }

    const conflicts = buildConflictCount(localState, finalState);
    const event = buildSyncEvent(localState, finalState, conflicts, now);
    await moneyProtectionDb.appendMoneyProtectionEvent(userId, event);

    return {
      state: finalState,
      serverTime: now,
      conflicts,
    };
  }

  const currentState = (await loadStateFromStore(userId)) ?? {
    ...DEFAULT_STATE,
    updatedAt: 0,
  };

  const merged = mergeStates(localState, applyRuntimeAdjustments(currentState, now));
  const finalState =
    merged.updatedAt > 0
      ? merged
      : {
          ...merged,
          updatedAt: now,
        };

  const conflicts = buildConflictCount(localState, finalState);
  const event = buildSyncEvent(localState, finalState, conflicts, now);

  await persistStateToFile(userId, finalState);
  await appendEventToFile(userId, event);

  return {
    state: finalState,
    serverTime: now,
    conflicts,
  };
}
