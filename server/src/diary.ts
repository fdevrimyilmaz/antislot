import { promises as fs } from "fs";
import path from "path";
import * as diaryDb from "./diary-db";
import type { DiaryCloudEntry, DiarySyncResult } from "./diary-types";

type DiaryFileDb = {
  users: Record<string, DiaryCloudEntry[]>;
};

const MAX_SYNC_ENTRIES = 800;
const MAX_ENTRY_CONTENT_LENGTH = 4000;
const MAX_ENTRIES_PER_USER = 730;
const TOMBSTONE_RETENTION_MS = 90 * 24 * 60 * 60 * 1000;

let diaryFilePath = "./data/diary-state.json";
let usePostgres = false;
let fileDb: DiaryFileDb = { users: {} };

function isValidDateKey(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00`);
  return !Number.isNaN(parsed.getTime());
}

function compareEntries(a: DiaryCloudEntry, b: DiaryCloudEntry): number {
  if (a.updatedAt !== b.updatedAt) return a.updatedAt - b.updatedAt;

  const aDeleted = a.deletedAt ?? 0;
  const bDeleted = b.deletedAt ?? 0;
  if (aDeleted !== bDeleted) return aDeleted - bDeleted;

  if (a.content !== b.content) return a.content.localeCompare(b.content);
  return a.id.localeCompare(b.id);
}

function normalizeDiaryEntry(input: unknown): DiaryCloudEntry | null {
  if (!input || typeof input !== "object") return null;

  const candidate = input as Partial<DiaryCloudEntry>;
  const id = typeof candidate.id === "string" ? candidate.id.trim().slice(0, 128) : "";
  const date = typeof candidate.date === "string" ? candidate.date.trim() : "";
  if (!id || !isValidDateKey(date)) return null;

  const createdAt =
    typeof candidate.createdAt === "number" && Number.isFinite(candidate.createdAt) && candidate.createdAt > 0
      ? Math.trunc(candidate.createdAt)
      : Date.now();

  let updatedAt =
    typeof candidate.updatedAt === "number" && Number.isFinite(candidate.updatedAt) && candidate.updatedAt > 0
      ? Math.trunc(candidate.updatedAt)
      : createdAt;

  let deletedAt: number | null =
    typeof candidate.deletedAt === "number" && Number.isFinite(candidate.deletedAt) && candidate.deletedAt > 0
      ? Math.trunc(candidate.deletedAt)
      : null;

  const content = typeof candidate.content === "string" ? candidate.content.trim() : "";
  if (!deletedAt && !content) return null;

  if (updatedAt < createdAt) updatedAt = createdAt;
  if (deletedAt != null && deletedAt < updatedAt) deletedAt = updatedAt;

  return {
    id,
    date,
    content: content.slice(0, MAX_ENTRY_CONTENT_LENGTH),
    createdAt,
    updatedAt,
    deletedAt,
  };
}

function normalizeDiaryEntries(input: unknown): DiaryCloudEntry[] {
  if (!Array.isArray(input)) return [];

  const byDate = new Map<string, DiaryCloudEntry>();
  for (const rawEntry of input) {
    const entry = normalizeDiaryEntry(rawEntry);
    if (!entry) continue;
    const existing = byDate.get(entry.date);
    if (!existing || compareEntries(entry, existing) > 0) {
      byDate.set(entry.date, entry);
    }
  }

  const cutoff = Date.now() - TOMBSTONE_RETENTION_MS;
  const filtered = Array.from(byDate.values()).filter((entry) => {
    if (entry.deletedAt == null) return true;
    return entry.updatedAt >= cutoff;
  });

  return filtered
    .sort((a, b) => b.updatedAt - a.updatedAt)
    .slice(0, MAX_ENTRIES_PER_USER);
}

async function ensureDir(filePath: string): Promise<void> {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
}

async function persistFileDb(): Promise<void> {
  const file = diaryFilePath;
  const tmp = `${file}.tmp`;
  await ensureDir(file);
  await fs.writeFile(tmp, JSON.stringify(fileDb, null, 2), "utf8");
  await fs.rename(tmp, file);
}

function asDiaryDb(raw: unknown): DiaryFileDb {
  if (!raw || typeof raw !== "object") {
    return { users: {} };
  }

  const candidate = raw as Partial<DiaryFileDb>;
  const users =
    candidate.users && typeof candidate.users === "object"
      ? (candidate.users as Record<string, unknown>)
      : {};

  const normalizedUsers: Record<string, DiaryCloudEntry[]> = {};
  for (const [userId, entries] of Object.entries(users)) {
    normalizedUsers[userId] = normalizeDiaryEntries(entries);
  }

  return { users: normalizedUsers };
}

function buildConflictCount(localEntries: DiaryCloudEntry[], finalEntries: DiaryCloudEntry[]): number {
  const byDate = new Map(finalEntries.map((entry) => [entry.date, entry]));
  let conflicts = 0;

  for (const local of localEntries) {
    const remote = byDate.get(local.date);
    if (!remote) continue;
    if (compareEntries(local, remote) < 0) {
      conflicts += 1;
    }
  }

  return conflicts;
}

async function loadEntriesFromStore(userId: string): Promise<DiaryCloudEntry[]> {
  if (usePostgres) {
    const entries = await diaryDb.listDiaryEntries(userId);
    return normalizeDiaryEntries(entries);
  }
  return normalizeDiaryEntries(fileDb.users[userId] ?? []);
}

async function persistEntriesToFile(userId: string, entries: DiaryCloudEntry[]): Promise<void> {
  fileDb.users[userId] = normalizeDiaryEntries(entries);
  await persistFileDb();
}

export async function initializeDiaryStore(
  filePath: string,
  databaseUrl?: string
): Promise<void> {
  diaryFilePath = filePath;

  if (databaseUrl?.trim()) {
    await diaryDb.initDiaryDb(databaseUrl.trim());
    usePostgres = true;
    return;
  }

  usePostgres = false;
  await ensureDir(diaryFilePath);
  try {
    const raw = await fs.readFile(diaryFilePath, "utf8");
    fileDb = asDiaryDb(JSON.parse(raw));
  } catch {
    fileDb = { users: {} };
    await persistFileDb();
  }
}

export async function syncDiaryState(
  userId: string,
  localEntriesRaw: unknown,
  _lastSyncAt: number
): Promise<DiarySyncResult> {
  const localEntries = normalizeDiaryEntries(localEntriesRaw).slice(0, MAX_SYNC_ENTRIES);

  if (usePostgres) {
    for (const entry of localEntries) {
      await diaryDb.upsertDiaryEntryIfNewer(userId, entry);
    }

    const cutoff = Date.now() - TOMBSTONE_RETENTION_MS;
    await diaryDb.pruneDiaryTombstones(userId, cutoff);

    const finalEntries = await loadEntriesFromStore(userId);
    return {
      entries: finalEntries,
      serverTime: Date.now(),
      conflicts: buildConflictCount(localEntries, finalEntries),
    };
  }

  const currentEntries = await loadEntriesFromStore(userId);
  const mergedByDate = new Map(currentEntries.map((entry) => [entry.date, entry]));

  for (const incoming of localEntries) {
    const existing = mergedByDate.get(incoming.date);
    if (!existing || compareEntries(incoming, existing) > 0) {
      mergedByDate.set(incoming.date, incoming);
    }
  }

  const merged = normalizeDiaryEntries(Array.from(mergedByDate.values()));
  await persistEntriesToFile(userId, merged);

  return {
    entries: merged,
    serverTime: Date.now(),
    conflicts: buildConflictCount(localEntries, merged),
  };
}

