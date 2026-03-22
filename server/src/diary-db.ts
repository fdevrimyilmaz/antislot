import { Pool } from "pg";
import { ensureDiaryTables } from "./diary-migrations";
import type { DiaryCloudEntry } from "./diary-types";

let pool: Pool | null = null;

function rowToDiaryEntry(row: Record<string, unknown>): DiaryCloudEntry {
  return {
    id: String(row.id || ""),
    date: String(row.date || ""),
    content: String(row.content || ""),
    createdAt: Number(row.created_at_ms) || 0,
    updatedAt: Number(row.updated_at_ms) || 0,
    deletedAt: row.deleted_at_ms != null ? Number(row.deleted_at_ms) : null,
  };
}

function getPool(): Pool {
  if (!pool) throw new Error("Diary DB not initialized");
  return pool;
}

export async function initDiaryDb(connectionString: string): Promise<void> {
  if (pool) return;

  pool = new Pool({
    connectionString,
    max: 6,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
  });

  try {
    const client = await pool.connect();
    try {
      await client.query("SELECT 1");
      const { applied } = await ensureDiaryTables(client);
      if (applied) {
        console.log(
          JSON.stringify({
            level: "info",
            message: "Diary schema migration applied",
            migration: "002_diary_tables.sql",
          })
        );
      }
    } finally {
      client.release();
    }
  } catch (error) {
    await pool.end().catch(() => undefined);
    pool = null;
    throw error;
  }
}

export async function closeDiaryDb(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
  }
}

export async function listDiaryEntries(userId: string): Promise<DiaryCloudEntry[]> {
  const p = getPool();
  const result = await p.query(
    `SELECT id, date, content, created_at_ms, updated_at_ms, deleted_at_ms
     FROM diary_entries
     WHERE user_id = $1
     ORDER BY updated_at_ms DESC`,
    [userId]
  );

  return result.rows.map((row) => rowToDiaryEntry(row as Record<string, unknown>));
}

export async function upsertDiaryEntryIfNewer(
  userId: string,
  entry: DiaryCloudEntry
): Promise<void> {
  const p = getPool();
  await p.query(
    `INSERT INTO diary_entries (
       user_id, date, id, content, created_at_ms, updated_at_ms, deleted_at_ms
     ) VALUES ($1, $2, $3, $4, $5, $6, $7)
     ON CONFLICT (user_id, date) DO UPDATE SET
       id = EXCLUDED.id,
       content = EXCLUDED.content,
       created_at_ms = EXCLUDED.created_at_ms,
       updated_at_ms = EXCLUDED.updated_at_ms,
       deleted_at_ms = EXCLUDED.deleted_at_ms
     WHERE
       EXCLUDED.updated_at_ms > diary_entries.updated_at_ms
       OR (
         EXCLUDED.updated_at_ms = diary_entries.updated_at_ms
         AND COALESCE(EXCLUDED.deleted_at_ms, 0) > COALESCE(diary_entries.deleted_at_ms, 0)
       )
       OR (
         EXCLUDED.updated_at_ms = diary_entries.updated_at_ms
         AND COALESCE(EXCLUDED.deleted_at_ms, 0) = COALESCE(diary_entries.deleted_at_ms, 0)
         AND EXCLUDED.id > diary_entries.id
       )`,
    [
      userId,
      entry.date,
      entry.id,
      entry.content,
      entry.createdAt,
      entry.updatedAt,
      entry.deletedAt,
    ]
  );
}

export async function pruneDiaryTombstones(
  userId: string,
  cutoffUpdatedAt: number
): Promise<void> {
  const p = getPool();
  await p.query(
    `DELETE FROM diary_entries
     WHERE user_id = $1
       AND deleted_at_ms IS NOT NULL
       AND updated_at_ms < $2`,
    [userId, cutoffUpdatedAt]
  );
}

