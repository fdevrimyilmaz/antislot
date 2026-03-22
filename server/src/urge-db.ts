import { Pool } from "pg";
import { ensureUrgeTables } from "./urge-migrations";
import type { UrgeCloudLog } from "./urge-types";

let pool: Pool | null = null;

function getPool(): Pool {
  if (!pool) throw new Error("Urge DB not initialized");
  return pool;
}

function parseJsonField<T>(value: unknown, fallback: T): T {
  if (value == null) return fallback;
  if (typeof value === "string") {
    try {
      return JSON.parse(value) as T;
    } catch {
      return fallback;
    }
  }
  if (typeof value === "object") {
    return value as T;
  }
  return fallback;
}

function rowToUrgeLog(row: Record<string, unknown>): UrgeCloudLog {
  return {
    id: String(row.id || ""),
    timestamp: Number(row.timestamp_ms) || 0,
    intensity: Number(row.intensity) || 1,
    trigger: row.trigger == null ? null : String(row.trigger),
    context: row.context == null ? undefined : String(row.context),
    interventions: parseJsonField(row.interventions, []),
    outcome: parseJsonField(row.outcome, undefined),
    duration: Number(row.duration_sec) || 1,
  };
}

export async function initUrgeDb(connectionString: string): Promise<void> {
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
      const { applied } = await ensureUrgeTables(client);
      if (applied) {
        console.log(
          JSON.stringify({
            level: "info",
            message: "Urge schema migration applied",
            migration: "003_urge_tables.sql",
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

export async function closeUrgeDb(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
  }
}

export async function listUrgeLogs(userId: string): Promise<UrgeCloudLog[]> {
  const p = getPool();
  const result = await p.query(
    `SELECT id, timestamp_ms, intensity, trigger, context, interventions, outcome, duration_sec
     FROM urge_logs
     WHERE user_id = $1
     ORDER BY timestamp_ms DESC`,
    [userId]
  );

  return result.rows.map((row) => rowToUrgeLog(row as Record<string, unknown>));
}

export async function upsertUrgeLogIfNewer(userId: string, log: UrgeCloudLog): Promise<void> {
  const p = getPool();
  await p.query(
    `INSERT INTO urge_logs (
      user_id, id, timestamp_ms, intensity, trigger, context, interventions, outcome, duration_sec
    ) VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, $8::jsonb, $9)
    ON CONFLICT (user_id, id) DO UPDATE SET
      timestamp_ms = EXCLUDED.timestamp_ms,
      intensity = EXCLUDED.intensity,
      trigger = EXCLUDED.trigger,
      context = EXCLUDED.context,
      interventions = EXCLUDED.interventions,
      outcome = EXCLUDED.outcome,
      duration_sec = EXCLUDED.duration_sec
    WHERE
      EXCLUDED.timestamp_ms > urge_logs.timestamp_ms
      OR (
        EXCLUDED.timestamp_ms = urge_logs.timestamp_ms
        AND EXCLUDED.duration_sec > urge_logs.duration_sec
      )
      OR (
        EXCLUDED.timestamp_ms = urge_logs.timestamp_ms
        AND EXCLUDED.duration_sec = urge_logs.duration_sec
        AND urge_logs.outcome IS NULL
        AND EXCLUDED.outcome IS NOT NULL
      )`,
    [
      userId,
      log.id,
      log.timestamp,
      log.intensity,
      log.trigger,
      log.context ?? null,
      JSON.stringify(log.interventions ?? []),
      log.outcome ? JSON.stringify(log.outcome) : null,
      log.duration,
    ]
  );
}
