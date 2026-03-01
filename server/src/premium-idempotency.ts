/**
 * DB-level idempotency for IAP webhook and receipt events.
 * Uses SQLite with UNIQUE constraint when better-sqlite3 is available.
 * If the native dependency is not available, premium.ts falls back to JSON idempotency.
 */

import { existsSync, mkdirSync } from "fs";
import { createRequire } from "module";
import path from "path";

const EVENT_TTL_MS = 45 * 24 * 60 * 60 * 1000;

type SqliteStatement = {
  run: (...args: unknown[]) => { changes: number };
  get: (...args: unknown[]) => unknown;
};

type SqliteDatabase = {
  pragma: (query: string) => void;
  exec: (query: string) => void;
  close: () => void;
  prepare: (query: string) => SqliteStatement;
  transaction: <T>(fn: () => T) => () => T;
};

let db: SqliteDatabase | null = null;
const loadModule = createRequire(__filename);

function eventKey(userId: string, eventId: string): string {
  return `e:${userId}:${eventId}`;
}

function transactionKey(userId: string, transactionId: string): string {
  return `t:${userId}:${transactionId}`;
}

export function initIdempotencyStore(dbPath: string): void {
  if (db) return;

  const dir = path.dirname(dbPath);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }

  try {
    const BetterSqlite3 = loadModule("better-sqlite3") as new (p: string) => SqliteDatabase;
    db = new BetterSqlite3(dbPath);
  } catch (error) {
    console.warn(
      `[premium-idempotency] better-sqlite3 unavailable, falling back to JSON idempotency. reason=${
        error instanceof Error ? error.message : String(error)
      }`
    );
    db = null;
    return;
  }

  db.pragma("journal_mode = WAL");
  db.exec(`
    CREATE TABLE IF NOT EXISTS premium_processed_events (
      event_key VARCHAR(512) NOT NULL PRIMARY KEY,
      processed_at INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_premium_processed_events_processed_at
      ON premium_processed_events(processed_at);
  `);
}

export function closeIdempotencyStore(): void {
  if (db) {
    db.close();
    db = null;
  }
}

/**
 * Attempt to record an event. Returns true if inserted (new), false if duplicate.
 * DB-level UNIQUE constraint guarantees atomic idempotency.
 */
export function tryInsertEvent(userId: string, eventId: string): boolean {
  if (!db) return false;

  const key = eventKey(userId, eventId);
  const now = Date.now();
  const stmt = db.prepare(
    "INSERT OR IGNORE INTO premium_processed_events (event_key, processed_at) VALUES (?, ?)"
  );
  const result = stmt.run(key, now);
  compactIfNeeded();
  return result.changes > 0;
}

/**
 * Attempt to record a transaction. Returns true if inserted (new), false if duplicate.
 */
export function tryInsertTransaction(userId: string, transactionId: string): boolean {
  if (!db) return false;

  const key = transactionKey(userId, transactionId);
  const now = Date.now();
  const stmt = db.prepare(
    "INSERT OR IGNORE INTO premium_processed_events (event_key, processed_at) VALUES (?, ?)"
  );
  const result = stmt.run(key, now);
  compactIfNeeded();
  return result.changes > 0;
}

/**
 * Check if event was already processed (for read path).
 */
export function hasEvent(userId: string, eventId: string): boolean {
  if (!db) return false;
  const key = eventKey(userId, eventId);
  const row = db.prepare("SELECT 1 FROM premium_processed_events WHERE event_key = ?").get(key);
  return !!row;
}

/**
 * Check if transaction was already processed (for read path).
 */
export function hasTransaction(userId: string, transactionId: string): boolean {
  if (!db) return false;
  const key = transactionKey(userId, transactionId);
  const row = db.prepare("SELECT 1 FROM premium_processed_events WHERE event_key = ?").get(key);
  return !!row;
}

/**
 * Batch insert for event + transaction. Returns true if both inserted (new event).
 * If either key exists, returns false (idempotent - treat as already processed).
 * Atomic: both inserts in same transaction for consistency.
 */
export function tryInsertEventAndTransaction(
  userId: string,
  eventId: string,
  transactionId: string
): boolean {
  if (!db) return false;

  const eventK = eventKey(userId, eventId);
  const txK = transactionKey(userId, transactionId);
  const now = Date.now();

  const insert = db.prepare(
    "INSERT OR IGNORE INTO premium_processed_events (event_key, processed_at) VALUES (?, ?)"
  );
  const run = db.transaction(() => {
    const r1 = insert.run(eventK, now);
    const r2 = insert.run(txK, now);
    return r1.changes + r2.changes;
  });
  const inserted = run();
  compactIfNeeded();
  return inserted === 2;
}

function compactIfNeeded(): void {
  if (!db) return;
  const cutoff = Date.now() - EVENT_TTL_MS;
  db.prepare("DELETE FROM premium_processed_events WHERE processed_at < ?").run(cutoff);
}

export function isIdempotencyStoreActive(): boolean {
  return db !== null;
}
