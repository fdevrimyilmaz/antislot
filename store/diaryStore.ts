import * as SecureStore from "@/lib/secureStoreCompat";

import { syncDiaryCloud } from "@/services/diaryApi";
import type { DiarySyncEntry } from "@/types/diary";

const DIARY_ENTRIES_KEY = "antislot_diary_entries";
const LAST_ENTRY_DATE_KEY = "antislot_last_entry_date";
const LAST_SYNC_AT_KEY = "antislot_diary_last_sync_at";
const MAX_ENTRY_CONTENT_LENGTH = 4000;
export const MAX_DIARY_ENTRIES = 365;
const TOMBSTONE_RETENTION_MS = 90 * 24 * 60 * 60 * 1000;
const SYNC_ENTRY_LIMIT = 800;

export interface DiaryEntry {
  id: string;
  date: string;
  content: string;
  createdAt: number;
  updatedAt?: number;
  deletedAt?: number | null;
}

let syncInFlight: Promise<void> | null = null;
let syncQueued = false;

export function getLocalDateKey(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function isValidDateKey(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00`);
  return !Number.isNaN(parsed.getTime());
}

function parsePositiveMs(value: unknown, fallback: number): number {
  if (typeof value === "number" && Number.isFinite(value) && value > 0) {
    return Math.trunc(value);
  }
  return fallback;
}

function parseDeletedAt(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value) && value > 0) {
    return Math.trunc(value);
  }
  return null;
}

function compareDiaryEntries(a: DiaryEntry, b: DiaryEntry): number {
  const aUpdated = a.updatedAt ?? a.createdAt;
  const bUpdated = b.updatedAt ?? b.createdAt;
  if (aUpdated !== bUpdated) return aUpdated - bUpdated;

  const aDeleted = a.deletedAt ?? 0;
  const bDeleted = b.deletedAt ?? 0;
  if (aDeleted !== bDeleted) return aDeleted - bDeleted;

  if (a.content !== b.content) return a.content.localeCompare(b.content);
  return a.id.localeCompare(b.id);
}

function normalizeDiaryEntry(input: unknown): DiaryEntry | null {
  if (!input || typeof input !== "object") return null;

  const candidate = input as Partial<DiaryEntry>;
  const id = typeof candidate.id === "string" ? candidate.id.trim() : "";
  const date = typeof candidate.date === "string" ? candidate.date.trim() : "";
  if (!id || !isValidDateKey(date)) return null;

  const rawContent = typeof candidate.content === "string" ? candidate.content.trim() : "";
  const createdAt = parsePositiveMs(candidate.createdAt, Date.now());
  let updatedAt = parsePositiveMs(candidate.updatedAt, createdAt);
  let deletedAt = parseDeletedAt(candidate.deletedAt);

  if (deletedAt == null && !rawContent) return null;

  if (updatedAt < createdAt) updatedAt = createdAt;
  if (deletedAt != null && deletedAt < updatedAt) deletedAt = updatedAt;

  return {
    id,
    date,
    content: rawContent.slice(0, MAX_ENTRY_CONTENT_LENGTH),
    createdAt,
    updatedAt,
    deletedAt,
  };
}

function normalizeDiaryEntries(input: unknown): DiaryEntry[] {
  if (!Array.isArray(input)) return [];

  const byId = new Map<string, DiaryEntry>();
  for (const rawEntry of input) {
    const entry = normalizeDiaryEntry(rawEntry);
    if (!entry) continue;

    const existing = byId.get(entry.id);
    if (!existing || compareDiaryEntries(entry, existing) > 0) {
      byId.set(entry.id, entry);
    }
  }

  const byDate = new Map<string, DiaryEntry>();
  for (const entry of byId.values()) {
    const existing = byDate.get(entry.date);
    if (!existing || compareDiaryEntries(entry, existing) > 0) {
      byDate.set(entry.date, entry);
    }
  }

  const tombstoneCutoff = Date.now() - TOMBSTONE_RETENTION_MS;
  return Array.from(byDate.values())
    .filter((entry) => {
      if (entry.deletedAt == null) return true;
      return (entry.updatedAt ?? entry.createdAt) >= tombstoneCutoff;
    })
    .sort((a, b) => (b.updatedAt ?? b.createdAt) - (a.updatedAt ?? a.createdAt))
    .slice(0, MAX_DIARY_ENTRIES);
}

function toSyncEntry(entry: DiaryEntry): DiarySyncEntry {
  return {
    id: entry.id,
    date: entry.date,
    content: entry.content,
    createdAt: entry.createdAt,
    updatedAt: entry.updatedAt ?? entry.createdAt,
    deletedAt: entry.deletedAt ?? null,
  };
}

async function syncLastEntryDate(entries: DiaryEntry[]): Promise<void> {
  const activeEntries = entries.filter((entry) => entry.deletedAt == null);
  const latestDate = activeEntries[0]?.date;
  if (latestDate) {
    await SecureStore.setItemAsync(LAST_ENTRY_DATE_KEY, latestDate);
  } else {
    await SecureStore.deleteItemAsync(LAST_ENTRY_DATE_KEY);
  }
}

async function getStoredLastSyncAt(): Promise<number> {
  const raw = await SecureStore.getItemAsync(LAST_SYNC_AT_KEY);
  if (!raw) return 0;
  const parsed = parseInt(raw, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) return 0;
  return parsed;
}

async function setStoredLastSyncAt(value: number): Promise<void> {
  if (!Number.isFinite(value) || value <= 0) return;
  await SecureStore.setItemAsync(LAST_SYNC_AT_KEY, Math.trunc(value).toString());
}

async function persistDiaryEntries(entries: DiaryEntry[], syncedAt?: number): Promise<void> {
  const normalized = normalizeDiaryEntries(entries);
  await SecureStore.setItemAsync(DIARY_ENTRIES_KEY, JSON.stringify(normalized));
  await syncLastEntryDate(normalized);
  if (syncedAt && Number.isFinite(syncedAt) && syncedAt > 0) {
    await setStoredLastSyncAt(syncedAt);
  }
}

async function readDiaryEntries(repair = false): Promise<DiaryEntry[]> {
  const entriesStr = await SecureStore.getItemAsync(DIARY_ENTRIES_KEY);
  if (!entriesStr) return [];

  let parsed: unknown;
  try {
    parsed = JSON.parse(entriesStr);
  } catch {
    if (repair) {
      await SecureStore.deleteItemAsync(DIARY_ENTRIES_KEY);
      await SecureStore.deleteItemAsync(LAST_ENTRY_DATE_KEY);
    }
    return [];
  }

  const normalized = normalizeDiaryEntries(parsed);
  if (repair) {
    const normalizedString = JSON.stringify(normalized);
    if (normalizedString !== entriesStr) {
      await SecureStore.setItemAsync(DIARY_ENTRIES_KEY, normalizedString);
    }
    await syncLastEntryDate(normalized);
  }

  return normalized;
}

function mergeEntrySets(preferred: DiaryEntry[], secondary: DiaryEntry[]): DiaryEntry[] {
  const byDate = new Map<string, DiaryEntry>();

  for (const entry of secondary) {
    const normalized = normalizeDiaryEntry(entry);
    if (!normalized) continue;
    byDate.set(normalized.date, normalized);
  }

  for (const entry of preferred) {
    const normalized = normalizeDiaryEntry(entry);
    if (!normalized) continue;
    const existing = byDate.get(normalized.date);
    if (!existing || compareDiaryEntries(normalized, existing) >= 0) {
      byDate.set(normalized.date, normalized);
    }
  }

  return normalizeDiaryEntries(Array.from(byDate.values()));
}

export async function getDiarySyncState(): Promise<{ entries: DiarySyncEntry[]; lastSyncAt: number }> {
  const [entries, lastSyncAt] = await Promise.all([
    readDiaryEntries(true),
    getStoredLastSyncAt(),
  ]);

  return {
    entries: entries.map(toSyncEntry).slice(0, SYNC_ENTRY_LIMIT),
    lastSyncAt,
  };
}

export async function applyCloudDiaryState(entries: DiarySyncEntry[], syncedAt: number): Promise<void> {
  const localEntries = await readDiaryEntries(true);
  const remoteEntries = normalizeDiaryEntries(entries);
  const merged = mergeEntrySets(localEntries, remoteEntries);
  await persistDiaryEntries(merged, syncedAt);
}

export async function syncDiaryWithServer(): Promise<void> {
  if (syncInFlight) {
    syncQueued = true;
    return syncInFlight;
  }

  syncInFlight = (async () => {
    do {
      syncQueued = false;

      const snapshot = await getDiarySyncState();
      const result = await syncDiaryCloud({
        entries: snapshot.entries,
        lastSyncAt: snapshot.lastSyncAt,
      });
      if (!result) {
        return;
      }

      await applyCloudDiaryState(result.entries, result.serverTime);
    } while (syncQueued);
  })().finally(() => {
    syncInFlight = null;
  });

  return syncInFlight;
}

export async function saveDiaryEntry(entry: DiaryEntry): Promise<void> {
  try {
    const now = Date.now();
    const normalizedInput = normalizeDiaryEntry({
      ...entry,
      updatedAt: now,
      deletedAt: null,
    });
    if (!normalizedInput) {
      throw new Error("Invalid diary entry");
    }

    const entries = await readDiaryEntries(true);
    const existingById = entries.find((item) => item.id === normalizedInput.id);
    const existingByDate = entries.find((item) => item.date === normalizedInput.date);

    const base = existingById ?? existingByDate;
    const nextEntry: DiaryEntry = {
      ...(base ?? normalizedInput),
      ...normalizedInput,
      createdAt: base?.createdAt ?? normalizedInput.createdAt,
      updatedAt: now,
      deletedAt: null,
    };

    const filtered = entries.filter(
      (item) => item.id !== nextEntry.id && item.date !== nextEntry.date
    );

    await persistDiaryEntries([nextEntry, ...filtered]);
  } catch (error) {
    console.error("Gunluk kaydi kaydedilirken hata:", error);
    throw error;
  }
}

export async function getDiaryEntries(): Promise<DiaryEntry[]> {
  try {
    const entries = await readDiaryEntries(true);
    return entries.filter((entry) => entry.deletedAt == null);
  } catch (error) {
    console.error("Gunluk kayitlari yuklenirken hata:", error);
    return [];
  }
}

export async function updateDiaryEntry(id: string, content: string): Promise<void> {
  try {
    const normalizedContent = content.trim();
    if (!normalizedContent) return;

    const entries = await readDiaryEntries(true);
    const existing = entries.find((entry) => entry.id === id && entry.deletedAt == null);
    if (!existing) return;

    await saveDiaryEntry({
      ...existing,
      content: normalizedContent,
    });
  } catch (error) {
    console.error("Gunluk kaydi guncellenirken hata:", error);
    throw error;
  }
}

export async function deleteDiaryEntry(id: string): Promise<void> {
  try {
    const entries = await readDiaryEntries(true);
    const target = entries.find((entry) => entry.id === id);
    if (!target) return;

    const now = Date.now();
    const tombstone: DiaryEntry = {
      ...target,
      updatedAt: now,
      deletedAt: now,
    };

    const updated = entries.filter((entry) => entry.id !== id && entry.date !== target.date);
    await persistDiaryEntries([tombstone, ...updated]);
  } catch (error) {
    console.error("Gunluk kaydi silinirken hata:", error);
    throw error;
  }
}

export async function getTodayEntry(): Promise<DiaryEntry | null> {
  const today = getLocalDateKey();
  const entries = await getDiaryEntries();
  return entries.find((entry) => entry.date === today) || null;
}

export async function getLastEntryDate(): Promise<string | null> {
  try {
    const stored = await SecureStore.getItemAsync(LAST_ENTRY_DATE_KEY);
    if (stored && isValidDateKey(stored)) {
      return stored;
    }

    const entries = await getDiaryEntries();
    return entries[0]?.date ?? null;
  } catch {
    return null;
  }
}
