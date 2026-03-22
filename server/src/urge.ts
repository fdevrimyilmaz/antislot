import { promises as fs } from "fs";
import path from "path";
import * as urgeDb from "./urge-db";
import type {
  UrgeCloudIntervention,
  UrgeCloudLog,
  UrgeCloudOutcome,
  UrgeSyncResult,
} from "./urge-types";

type UrgeFileDb = {
  users: Record<string, UrgeCloudLog[]>;
};

const MAX_SYNC_LOGS = 2000;
const MAX_LOGS_PER_USER = 5000;
const MAX_NOTE_CHARS = 1000;
const MAX_CONTEXT_CHARS = 500;
const MAX_INTERVENTIONS_PER_LOG = 20;

const ALLOWED_TRIGGERS = new Set([
  "emotional",
  "environmental",
  "cognitive",
  "physical",
  "social",
  "financial",
  "unknown",
]);

const ALLOWED_INTERVENTION_TYPES = new Set([
  "breathing",
  "grounding",
  "reframing",
  "redirection",
  "support",
  "delay",
  "sos",
]);

const ALLOWED_EFFECTIVENESS = new Set([
  "very_helpful",
  "helpful",
  "neutral",
  "not_helpful",
]);

let urgeFilePath = "./data/urge-state.json";
let usePostgres = false;
let fileDb: UrgeFileDb = { users: {} };

function clampIntensity(value: unknown, fallback: number): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  const rounded = Math.round(parsed);
  if (rounded < 1 || rounded > 10) return fallback;
  return rounded;
}

function sanitizeText(value: unknown, maxChars: number): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  return trimmed.slice(0, maxChars);
}

function parsePositiveMs(value: unknown, fallback: number): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return Math.trunc(parsed);
}

function parseDurationSec(value: unknown, fallback: number): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return Math.max(1, Math.trunc(parsed));
}

function normalizeIntervention(value: unknown): UrgeCloudIntervention | null {
  if (!value || typeof value !== "object") return null;
  const candidate = value as Partial<UrgeCloudIntervention>;
  const type = typeof candidate.type === "string" ? candidate.type.trim() : "";
  if (!ALLOWED_INTERVENTION_TYPES.has(type)) return null;

  const startedAt = parsePositiveMs(candidate.startedAt, 0);
  if (startedAt <= 0) return null;

  const completedAt =
    candidate.completedAt == null ? undefined : parsePositiveMs(candidate.completedAt, 0) || undefined;

  const duration =
    candidate.duration == null
      ? undefined
      : parseDurationSec(candidate.duration, 0) || undefined;

  const effectiveness =
    typeof candidate.effectiveness === "string" &&
    ALLOWED_EFFECTIVENESS.has(candidate.effectiveness)
      ? candidate.effectiveness
      : undefined;

  return {
    type,
    startedAt,
    completedAt,
    duration,
    effectiveness,
    note: sanitizeText(candidate.note, MAX_NOTE_CHARS),
  };
}

function normalizeOutcome(value: unknown, fallbackIntensity: number): UrgeCloudOutcome | undefined {
  if (!value || typeof value !== "object") return undefined;
  const candidate = value as Partial<UrgeCloudOutcome>;
  const effectiveness =
    typeof candidate.effectiveness === "string" &&
    ALLOWED_EFFECTIVENESS.has(candidate.effectiveness)
      ? candidate.effectiveness
      : undefined;
  if (!effectiveness) return undefined;

  return {
    finalIntensity: clampIntensity(candidate.finalIntensity, fallbackIntensity),
    effectiveness,
    note: sanitizeText(candidate.note, MAX_NOTE_CHARS),
  };
}

function normalizeUrgeLog(value: unknown): UrgeCloudLog | null {
  if (!value || typeof value !== "object") return null;
  const candidate = value as Partial<UrgeCloudLog>;

  const id = typeof candidate.id === "string" ? candidate.id.trim().slice(0, 128) : "";
  if (!id) return null;

  const timestamp = parsePositiveMs(candidate.timestamp, Date.now());
  const intensity = clampIntensity(candidate.intensity, 5);
  const triggerRaw = typeof candidate.trigger === "string" ? candidate.trigger.trim() : "";
  const trigger = triggerRaw && ALLOWED_TRIGGERS.has(triggerRaw) ? triggerRaw : null;
  const context = sanitizeText(candidate.context, MAX_CONTEXT_CHARS);

  const interventions = Array.isArray(candidate.interventions)
    ? candidate.interventions
        .map((entry) => normalizeIntervention(entry))
        .filter((entry): entry is UrgeCloudIntervention => entry !== null)
        .slice(0, MAX_INTERVENTIONS_PER_LOG)
    : [];

  const duration = parseDurationSec(candidate.duration, 1);
  const outcome = normalizeOutcome(candidate.outcome, intensity);

  return {
    id,
    timestamp,
    intensity,
    trigger,
    context,
    interventions,
    outcome,
    duration,
  };
}

function compareLogs(a: UrgeCloudLog, b: UrgeCloudLog): number {
  const aOutcome = a.outcome ? 1 : 0;
  const bOutcome = b.outcome ? 1 : 0;
  if (aOutcome !== bOutcome) return aOutcome - bOutcome;

  if (a.interventions.length !== b.interventions.length) {
    return a.interventions.length - b.interventions.length;
  }

  if (a.duration !== b.duration) return a.duration - b.duration;
  if (a.timestamp !== b.timestamp) return a.timestamp - b.timestamp;
  return a.id.localeCompare(b.id);
}

function normalizeUrgeLogs(input: unknown): UrgeCloudLog[] {
  if (!Array.isArray(input)) return [];

  const byId = new Map<string, UrgeCloudLog>();
  for (const rawLog of input) {
    const log = normalizeUrgeLog(rawLog);
    if (!log) continue;

    const existing = byId.get(log.id);
    if (!existing || compareLogs(log, existing) > 0) {
      byId.set(log.id, log);
    }
  }

  return Array.from(byId.values())
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, MAX_LOGS_PER_USER);
}

function mergeLogSets(preferred: UrgeCloudLog[], secondary: UrgeCloudLog[]): UrgeCloudLog[] {
  const byId = new Map<string, UrgeCloudLog>();
  for (const log of secondary) {
    byId.set(log.id, log);
  }
  for (const log of preferred) {
    const existing = byId.get(log.id);
    if (!existing || compareLogs(log, existing) >= 0) {
      byId.set(log.id, log);
    }
  }
  return normalizeUrgeLogs(Array.from(byId.values()));
}

function buildConflictCount(localLogs: UrgeCloudLog[], finalLogs: UrgeCloudLog[]): number {
  const byId = new Map(finalLogs.map((log) => [log.id, log]));
  let conflicts = 0;

  for (const local of localLogs) {
    const remote = byId.get(local.id);
    if (!remote) continue;
    if (compareLogs(local, remote) < 0) {
      conflicts += 1;
    }
  }
  return conflicts;
}

async function ensureDir(filePath: string): Promise<void> {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
}

async function persistFileDb(): Promise<void> {
  const file = urgeFilePath;
  const tmp = `${file}.tmp`;
  await ensureDir(file);
  await fs.writeFile(tmp, JSON.stringify(fileDb, null, 2), "utf8");
  await fs.rename(tmp, file);
}

function asUrgeDb(raw: unknown): UrgeFileDb {
  if (!raw || typeof raw !== "object") {
    return { users: {} };
  }

  const candidate = raw as Partial<UrgeFileDb>;
  const users =
    candidate.users && typeof candidate.users === "object"
      ? (candidate.users as Record<string, unknown>)
      : {};

  const normalizedUsers: Record<string, UrgeCloudLog[]> = {};
  for (const [userId, logs] of Object.entries(users)) {
    normalizedUsers[userId] = normalizeUrgeLogs(logs);
  }

  return { users: normalizedUsers };
}

async function loadLogsFromStore(userId: string): Promise<UrgeCloudLog[]> {
  if (usePostgres) {
    const logs = await urgeDb.listUrgeLogs(userId);
    return normalizeUrgeLogs(logs);
  }
  return normalizeUrgeLogs(fileDb.users[userId] ?? []);
}

async function persistLogsToFile(userId: string, logs: UrgeCloudLog[]): Promise<void> {
  fileDb.users[userId] = normalizeUrgeLogs(logs);
  await persistFileDb();
}

export async function initializeUrgeStore(
  filePath: string,
  databaseUrl?: string
): Promise<void> {
  urgeFilePath = filePath;

  if (databaseUrl?.trim()) {
    await urgeDb.initUrgeDb(databaseUrl.trim());
    usePostgres = true;
    return;
  }

  usePostgres = false;
  await ensureDir(urgeFilePath);
  try {
    const raw = await fs.readFile(urgeFilePath, "utf8");
    fileDb = asUrgeDb(JSON.parse(raw));
  } catch {
    fileDb = { users: {} };
    await persistFileDb();
  }
}

export async function syncUrgeState(
  userId: string,
  localLogsRaw: unknown,
  _lastSyncAt: number
): Promise<UrgeSyncResult> {
  const localLogs = normalizeUrgeLogs(localLogsRaw).slice(0, MAX_SYNC_LOGS);

  if (usePostgres) {
    for (const log of localLogs) {
      await urgeDb.upsertUrgeLogIfNewer(userId, log);
    }

    const finalLogs = await loadLogsFromStore(userId);
    return {
      logs: finalLogs,
      serverTime: Date.now(),
      conflicts: buildConflictCount(localLogs, finalLogs),
    };
  }

  const currentLogs = await loadLogsFromStore(userId);
  const merged = mergeLogSets(localLogs, currentLogs);
  await persistLogsToFile(userId, merged);

  return {
    logs: merged,
    serverTime: Date.now(),
    conflicts: buildConflictCount(localLogs, merged),
  };
}
