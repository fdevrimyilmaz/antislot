import { randomUUID } from "crypto";
import { promises as fs } from "fs";
import path from "path";
import { normalizeUiLanguage } from "./locale";
import * as therapyDb from "./therapy-callback-db";
import type {
  TherapyCallbackQueueResponse,
  TherapyCallbackRecord,
} from "./therapy-callback-types";

type TherapyCallbackFileDb = {
  requests: TherapyCallbackRecord[];
};

type EnqueuePayload = {
  phone?: unknown;
  name?: unknown;
  preferredTime?: unknown;
  note?: unknown;
  locale?: unknown;
};

const MAX_PHONE_CHARS = 32;
const MAX_NAME_CHARS = 120;
const MAX_PREFERRED_TIME_CHARS = 160;
const MAX_NOTE_CHARS = 1000;
const MAX_RECORDS = 10_000;

let callbackFilePath = "./data/therapy-callback-state.json";
let usePostgres = false;
let fileDb: TherapyCallbackFileDb = { requests: [] };

function normalizeText(value: unknown, maxChars: number): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  return trimmed.slice(0, maxChars);
}

function normalizePhone(value: unknown): string {
  if (typeof value !== "string") return "";
  const trimmed = value.trim();
  if (!trimmed) return "";
  const hasPlus = trimmed.startsWith("+");
  const digits = trimmed.replace(/[^\d]/g, "");
  if (!digits) return "";
  const normalized = `${hasPlus ? "+" : ""}${digits}`.slice(0, MAX_PHONE_CHARS);
  return normalized;
}

function isValidPhone(phone: string): boolean {
  const digits = phone.replace(/^\+/, "");
  return digits.length >= 10 && digits.length <= 15;
}

function normalizeLocale(value: unknown): "tr" | "en" {
  return normalizeUiLanguage(value, "en");
}

function normalizeStatus(value: unknown): TherapyCallbackRecord["status"] {
  if (value === "contacted") return "contacted";
  if (value === "closed") return "closed";
  return "queued";
}

function normalizeRequestId(value: unknown): string {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, 64);
}

function normalizeRecord(value: unknown): TherapyCallbackRecord | null {
  if (!value || typeof value !== "object") return null;
  const candidate = value as Partial<TherapyCallbackRecord>;
  const requestId =
    typeof candidate.requestId === "string" ? candidate.requestId.trim().slice(0, 64) : "";
  const userId = typeof candidate.userId === "string" ? candidate.userId.trim().slice(0, 255) : "";
  const phone = normalizePhone(candidate.phone);
  if (!requestId || !userId || !phone || !isValidPhone(phone)) {
    return null;
  }

  const createdAt =
    typeof candidate.createdAt === "number" && Number.isFinite(candidate.createdAt) && candidate.createdAt > 0
      ? Math.trunc(candidate.createdAt)
      : Date.now();
  const updatedAt =
    typeof candidate.updatedAt === "number" && Number.isFinite(candidate.updatedAt) && candidate.updatedAt > 0
      ? Math.trunc(candidate.updatedAt)
      : createdAt;

  return {
    requestId,
    userId,
    phone,
    name: normalizeText(candidate.name, MAX_NAME_CHARS),
    preferredTime: normalizeText(candidate.preferredTime, MAX_PREFERRED_TIME_CHARS),
    note: normalizeText(candidate.note, MAX_NOTE_CHARS),
    adminNote: normalizeText(candidate.adminNote, MAX_NOTE_CHARS),
    locale: normalizeLocale(candidate.locale),
    status: normalizeStatus(candidate.status),
    createdAt,
    updatedAt: Math.max(createdAt, updatedAt),
  };
}

function normalizeRecords(input: unknown): TherapyCallbackRecord[] {
  if (!Array.isArray(input)) return [];
  const byId = new Map<string, TherapyCallbackRecord>();
  for (const raw of input) {
    const normalized = normalizeRecord(raw);
    if (!normalized) continue;
    byId.set(normalized.requestId, normalized);
  }
  return Array.from(byId.values())
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, MAX_RECORDS);
}

function asFileDb(raw: unknown): TherapyCallbackFileDb {
  if (!raw || typeof raw !== "object") return { requests: [] };
  const candidate = raw as Partial<TherapyCallbackFileDb>;
  return {
    requests: normalizeRecords(candidate.requests),
  };
}

async function ensureDir(filePath: string): Promise<void> {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
}

async function persistFileDb(): Promise<void> {
  const file = callbackFilePath;
  const tmp = `${file}.tmp`;
  await ensureDir(file);
  await fs.writeFile(tmp, JSON.stringify(fileDb, null, 2), "utf8");
  await fs.rename(tmp, file);
}

function countQueued(records: TherapyCallbackRecord[]): number {
  return records.filter((item) => item.status === "queued").length;
}

export async function initializeTherapyCallbackStore(
  filePath: string,
  databaseUrl?: string
): Promise<void> {
  callbackFilePath = filePath;

  if (databaseUrl?.trim()) {
    await therapyDb.initTherapyCallbackDb(databaseUrl.trim());
    usePostgres = true;
    return;
  }

  usePostgres = false;
  await ensureDir(callbackFilePath);
  try {
    const raw = await fs.readFile(callbackFilePath, "utf8");
    fileDb = asFileDb(JSON.parse(raw));
  } catch {
    fileDb = { requests: [] };
    await persistFileDb();
  }
}

export async function enqueueTherapyCallback(
  userIdRaw: string,
  payload: EnqueuePayload,
  supportEmail: string
): Promise<TherapyCallbackQueueResponse> {
  const userId = userIdRaw.trim().slice(0, 255);
  if (!userId) {
    throw new Error("invalid_user_id");
  }

  const phone = normalizePhone(payload.phone);
  if (!phone || !isValidPhone(phone)) {
    throw new Error("invalid_phone");
  }

  const now = Date.now();
  const requestId = `tcb_${now}_${randomUUID().slice(0, 8)}`;
  const record: TherapyCallbackRecord = {
    requestId,
    userId,
    phone,
    name: normalizeText(payload.name, MAX_NAME_CHARS),
    preferredTime: normalizeText(payload.preferredTime, MAX_PREFERRED_TIME_CHARS),
    note: normalizeText(payload.note, MAX_NOTE_CHARS),
    adminNote: undefined,
    locale: normalizeLocale(payload.locale),
    status: "queued",
    createdAt: now,
    updatedAt: now,
  };

  if (usePostgres) {
    await therapyDb.insertTherapyCallback(record);
    const queueDepth = await therapyDb.countQueuedTherapyCallbacks();
    return {
      requestId,
      status: "queued",
      queueDepth,
      queuedAt: now,
      supportEmail,
    };
  }

  fileDb.requests = normalizeRecords([record, ...fileDb.requests]);
  await persistFileDb();
  return {
    requestId,
    status: "queued",
    queueDepth: countQueued(fileDb.requests),
    queuedAt: now,
    supportEmail,
  };
}

export async function getTherapyCallbackHistory(
  userIdRaw: string,
  limit = 20
): Promise<TherapyCallbackRecord[]> {
  const userId = userIdRaw.trim().slice(0, 255);
  if (!userId) return [];

  const safeLimit = Math.max(1, Math.min(100, Math.trunc(limit)));

  if (usePostgres) {
    return therapyDb.listTherapyCallbacksByUser(userId, safeLimit);
  }

  return fileDb.requests.filter((item) => item.userId === userId).slice(0, safeLimit);
}

export async function listTherapyCallbackQueue(
  status: TherapyCallbackRecord["status"] | "all" = "queued",
  limit = 50
): Promise<TherapyCallbackRecord[]> {
  const safeLimit = Math.max(1, Math.min(200, Math.trunc(limit)));
  const safeStatus =
    status === "all" || status === "queued" || status === "contacted" || status === "closed"
      ? status
      : "queued";

  if (usePostgres) {
    return therapyDb.listTherapyCallbacksByStatus(safeStatus, safeLimit);
  }

  const base =
    safeStatus === "all"
      ? fileDb.requests
      : fileDb.requests.filter((item) => item.status === safeStatus);
  return base.slice(0, safeLimit);
}

export async function getQueuedTherapyCallbackCount(): Promise<number> {
  if (usePostgres) {
    return therapyDb.countQueuedTherapyCallbacks();
  }
  return countQueued(fileDb.requests);
}

export async function updateTherapyCallbackStatus(
  requestIdRaw: string,
  statusRaw: unknown,
  adminNoteRaw?: unknown
): Promise<TherapyCallbackRecord | null> {
  const requestId = normalizeRequestId(requestIdRaw);
  if (!requestId) {
    throw new Error("invalid_request_id");
  }

  const status =
    statusRaw === "queued" || statusRaw === "contacted" || statusRaw === "closed"
      ? statusRaw
      : "";
  if (!status) {
    throw new Error("invalid_status");
  }

  const adminNote = normalizeText(adminNoteRaw, MAX_NOTE_CHARS);

  if (usePostgres) {
    return therapyDb.updateTherapyCallbackStatus(requestId, status, adminNote);
  }

  let updated: TherapyCallbackRecord | null = null;
  fileDb.requests = normalizeRecords(
    fileDb.requests.map((item) => {
      if (item.requestId !== requestId) return item;
      updated = {
        ...item,
        status,
        adminNote: adminNote ?? item.adminNote,
        updatedAt: Date.now(),
      };
      return updated;
    })
  );

  if (!updated) return null;
  await persistFileDb();
  return updated;
}
