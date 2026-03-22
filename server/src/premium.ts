import { createHash, randomUUID } from "crypto";
import { promises as fs } from "fs";
import path from "path";
import {
  tryInsertEvent,
  tryInsertEventAndTransaction,
  isIdempotencyStoreActive,
} from "./premium-idempotency";
import * as premiumDb from "./premium-db";

type PremiumSource =
  | "trial"
  | "subscription_monthly"
  | "subscription_yearly"
  | "lifetime"
  | "code"
  | "admin";

export type PremiumState = {
  isActive: boolean;
  source: PremiumSource | null;
  startedAt: number | null;
  expiresAt: number | null;
  trialEndsAt: number | null;
  features: string[];
  lastSync: number;
};

type EntitlementStatus = "active" | "canceled" | "refunded" | "grace" | "expired";
type EntitlementRecord = {
  userId: string;
  platform: "ios" | "android" | "unknown";
  source: PremiumSource;
  productId: string;
  status: EntitlementStatus;
  transactionId: string;
  eventId: string;
  startedAt: number;
  expiresAt: number | null;
  updatedAt: number;
};

type PremiumDb = {
  entitlements: Record<string, EntitlementRecord>;
  processedEvents: Record<string, number>;
};

const DEFAULT_STATE: PremiumState = {
  isActive: false,
  source: null,
  startedAt: null,
  expiresAt: null,
  trialEndsAt: null,
  features: [],
  lastSync: 0,
};

const FEATURES_ALL = [
  "blocker",
  "live_support",
  "advanced_stats",
  "premium_sessions",
  "premium_insights",
  "premium_ai_features",
];

const EVENT_TTL_MS = 45 * 24 * 60 * 60 * 1000;

let stateFilePath = "./data/premium-state.json";
let db: PremiumDb = { entitlements: {}, processedEvents: {} };
let usePostgres = false;

function hashReceipt(receipt: string): string {
  return createHash("sha256").update(receipt).digest("hex");
}

function normalizeStatus(record: EntitlementRecord): EntitlementRecord {
  const now = Date.now();
  const expired = record.expiresAt != null && now > record.expiresAt;
  if (expired && record.status === "active") {
    return { ...record, status: "expired", updatedAt: now };
  }
  return record;
}

function pickUserEntitlement(userId: string): EntitlementRecord | null {
  const record = db.entitlements[userId];
  if (!record) return null;
  const normalized = normalizeStatus(record);
  db.entitlements[userId] = normalized;
  return normalized;
}

function stateFromEntitlement(record: EntitlementRecord | null): PremiumState {
  const now = Date.now();
  if (!record) return { ...DEFAULT_STATE, lastSync: now };

  const active = record.status === "active" || record.status === "grace";
  if (!active) return { ...DEFAULT_STATE, lastSync: now };

  return {
    isActive: true,
    source: record.source,
    startedAt: record.startedAt,
    expiresAt: record.expiresAt,
    trialEndsAt: record.source === "trial" ? record.expiresAt : null,
    features: FEATURES_ALL,
    lastSync: now,
  };
}

function eventKey(userId: string, eventId: string): string {
  return `${userId}:${eventId}`;
}

function transactionEventKey(userId: string, transactionId: string): string {
  return `${userId}:tx:${transactionId}`;
}

function compactProcessedEvents(): void {
  const now = Date.now();
  for (const [key, ts] of Object.entries(db.processedEvents)) {
    if (now - ts > EVENT_TTL_MS) {
      delete db.processedEvents[key];
    }
  }
}

async function ensureDir(filePath: string): Promise<void> {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
}

async function persistDb(): Promise<void> {
  compactProcessedEvents();
  const file = stateFilePath;
  const tmp = `${file}.tmp`;
  await ensureDir(file);
  await fs.writeFile(tmp, JSON.stringify(db, null, 2), "utf8");
  await fs.rename(tmp, file);
}

function asPremiumDb(raw: unknown): PremiumDb {
  if (!raw || typeof raw !== "object") {
    return { entitlements: {}, processedEvents: {} };
  }

  const value = raw as Partial<PremiumDb>;
  const entitlements =
    value.entitlements && typeof value.entitlements === "object"
      ? (value.entitlements as Record<string, EntitlementRecord>)
      : {};
  const processedEvents =
    value.processedEvents && typeof value.processedEvents === "object"
      ? (value.processedEvents as Record<string, number>)
      : {};

  return { entitlements, processedEvents };
}

export async function initializePremiumStore(
  filePath: string,
  dbPath?: string,
  databaseUrl?: string
): Promise<void> {
  stateFilePath = filePath;

  if (databaseUrl?.trim()) {
    await premiumDb.initPremiumDb(databaseUrl.trim());
    usePostgres = true;
    return;
  }

  await ensureDir(stateFilePath);

  if (dbPath?.trim()) {
    const mod = await import("./premium-idempotency");
    mod.initIdempotencyStore(dbPath.trim());
  }

  try {
    const raw = await fs.readFile(stateFilePath, "utf8");
    const parsed = JSON.parse(raw) as unknown;
    db = asPremiumDb(parsed);
  } catch {
    db = { entitlements: {}, processedEvents: {} };
    await persistDb();
  }
}

function normalizeRecord(record: EntitlementRecord | null): EntitlementRecord | null {
  if (!record) return null;
  return normalizeStatus(record);
}

export async function getPremiumStatus(userId: string): Promise<PremiumState> {
  if (usePostgres) {
    const record = await premiumDb.getEntitlement(userId);
    const normalized = normalizeRecord(record);
    return stateFromEntitlement(normalized ?? null);
  }
  return stateFromEntitlement(pickUserEntitlement(userId));
}

export async function syncPremiumState(userId: string, _localState: PremiumState): Promise<PremiumState> {
  return getPremiumStatus(userId);
}

export async function grantPremiumFromCode(userId: string): Promise<PremiumState> {
  const now = Date.now();
  const eventId = `code-${randomUUID()}`;
  const eKey = eventKey(userId, eventId);

  if (usePostgres) {
    const alreadyProcessed = await premiumDb.hasProcessedEvent(eKey);
    if (alreadyProcessed) {
      return getPremiumStatus(userId);
    }
    const existing = await premiumDb.getEntitlement(userId);
    const record: EntitlementRecord = {
      userId,
      platform: existing?.platform ?? "unknown",
      source: "code",
      productId: "code",
      status: "active",
      transactionId: existing?.transactionId ?? `code-${userId}`,
      eventId,
      startedAt: now,
      expiresAt: null,
      updatedAt: now,
    };
    await premiumDb.addProcessedEvent(eKey, now);
    await premiumDb.upsertEntitlement(record);
    await premiumDb.compactProcessedEvents();
    return stateFromEntitlement(record);
  }

  const existing = pickUserEntitlement(userId);
  if (isIdempotencyStoreActive()) {
    tryInsertEvent(userId, eventId);
  } else {
    db.processedEvents[eKey] = now;
  }

  db.entitlements[userId] = {
    userId,
    platform: existing?.platform ?? "unknown",
    source: "code",
    productId: "code",
    status: "active",
    transactionId: existing?.transactionId ?? `code-${userId}`,
    eventId,
    startedAt: now,
    expiresAt: null,
    updatedAt: now,
  };

  await persistDb();
  return stateFromEntitlement(db.entitlements[userId]);
}

export async function grantPremiumFromReceipt(params: {
  userId: string;
  source: PremiumSource;
  platform: "ios" | "android";
  productId?: string;
  transactionId?: string;
  eventId?: string;
  expiresAt: number | null;
  receipt: string;
}): Promise<PremiumState> {
  const now = Date.now();
  const transactionId = params.transactionId?.trim() || hashReceipt(params.receipt).slice(0, 24);
  const eventId = params.eventId?.trim() || `receipt-${transactionId}`;
  const eKey = eventKey(params.userId, eventId);
  const txKey = transactionEventKey(params.userId, transactionId);

  if (usePostgres) {
    const alreadyEvent = await premiumDb.hasProcessedEvent(eKey);
    const alreadyTx = await premiumDb.hasProcessedEvent(txKey);
    if (alreadyEvent || alreadyTx) {
      return getPremiumStatus(params.userId);
    }
    const record: EntitlementRecord = {
      userId: params.userId,
      platform: params.platform,
      source: params.source,
      productId: params.productId ?? params.source,
      status: "active",
      transactionId,
      eventId,
      startedAt: now,
      expiresAt: params.expiresAt,
      updatedAt: now,
    };
    await premiumDb.addProcessedEvent(eKey, now);
    await premiumDb.addProcessedEvent(txKey, now);
    await premiumDb.upsertEntitlement(record);
    await premiumDb.compactProcessedEvents();
    return stateFromEntitlement(record);
  }

  if (isIdempotencyStoreActive()) {
    const inserted = tryInsertEventAndTransaction(
      params.userId,
      eventId,
      transactionId
    );
    if (!inserted) {
      return stateFromEntitlement(pickUserEntitlement(params.userId));
    }
  } else {
    if (db.processedEvents[eKey] || db.processedEvents[txKey]) {
      return stateFromEntitlement(pickUserEntitlement(params.userId));
    }
    db.processedEvents[eKey] = now;
    db.processedEvents[txKey] = now;
  }

  db.entitlements[params.userId] = {
    userId: params.userId,
    platform: params.platform,
    source: params.source,
    productId: params.productId ?? params.source,
    status: "active",
    transactionId,
    eventId,
    startedAt: now,
    expiresAt: params.expiresAt,
    updatedAt: now,
  };

  await persistDb();
  return stateFromEntitlement(db.entitlements[params.userId]);
}

export async function applyWebhookEvent(params: {
  userId: string;
  eventId: string;
  transactionId: string;
  productId: string;
  source: PremiumSource;
  platform: "ios" | "android" | "unknown";
  type: "renewal" | "cancel" | "refund" | "grace" | "expire";
  expiresAt?: number | null;
}): Promise<PremiumState> {
  const now = Date.now();
  const eKey = eventKey(params.userId, params.eventId);
  const txKey = transactionEventKey(params.userId, params.transactionId);

  if (usePostgres) {
    const alreadyProcessed = await premiumDb.hasProcessedEvent(eKey);
    if (alreadyProcessed) {
      return getPremiumStatus(params.userId);
    }
    const current = await premiumDb.getEntitlement(params.userId);
    const nextStatus: EntitlementStatus =
      params.type === "renewal"
        ? "active"
        : params.type === "cancel"
          ? "canceled"
          : params.type === "refund"
            ? "refunded"
            : params.type === "grace"
              ? "grace"
              : "expired";

    const record: EntitlementRecord = {
      userId: params.userId,
      platform: params.platform,
      source: params.source,
      productId: params.productId,
      status: nextStatus,
      transactionId: params.transactionId,
      eventId: params.eventId,
      startedAt: current?.startedAt ?? now,
      expiresAt: params.expiresAt ?? current?.expiresAt ?? null,
      updatedAt: now,
    };
    await premiumDb.addProcessedEvent(eKey, now);
    await premiumDb.addProcessedEvent(txKey, now);
    await premiumDb.upsertEntitlement(record);
    await premiumDb.compactProcessedEvents();
    return stateFromEntitlement(record);
  }

  if (isIdempotencyStoreActive()) {
    const inserted = tryInsertEventAndTransaction(
      params.userId,
      params.eventId,
      params.transactionId
    );
    if (!inserted) {
      return stateFromEntitlement(pickUserEntitlement(params.userId));
    }
  } else {
    if (db.processedEvents[eKey]) {
      return stateFromEntitlement(pickUserEntitlement(params.userId));
    }
    db.processedEvents[eKey] = now;
    db.processedEvents[txKey] = now;
  }

  const current = pickUserEntitlement(params.userId);
  const nextStatus: EntitlementStatus =
    params.type === "renewal"
      ? "active"
      : params.type === "cancel"
        ? "canceled"
        : params.type === "refund"
          ? "refunded"
          : params.type === "grace"
            ? "grace"
            : "expired";

  db.entitlements[params.userId] = {
    userId: params.userId,
    platform: params.platform,
    source: params.source,
    productId: params.productId,
    status: nextStatus,
    transactionId: params.transactionId,
    eventId: params.eventId,
    startedAt: current?.startedAt ?? now,
    expiresAt: params.expiresAt ?? current?.expiresAt ?? null,
    updatedAt: now,
  };

  await persistDb();
  return stateFromEntitlement(db.entitlements[params.userId]);
}

export async function restorePremium(userId: string): Promise<PremiumState> {
  if (usePostgres) {
    return getPremiumStatus(userId);
  }
  const record = pickUserEntitlement(userId);
  await persistDb();
  return stateFromEntitlement(record);
}

export function getDefaultPremiumState(): PremiumState {
  return { ...DEFAULT_STATE };
}
