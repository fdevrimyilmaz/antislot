import { Pool } from "pg";
import { normalizeUiLanguage } from "./locale";
import { ensureTherapyCallbackTables } from "./therapy-callback-migrations";
import type { TherapyCallbackRecord } from "./therapy-callback-types";

let pool: Pool | null = null;

function getPool(): Pool {
  if (!pool) throw new Error("Therapy callback DB not initialized");
  return pool;
}

function rowToRecord(row: Record<string, unknown>): TherapyCallbackRecord {
  const locale = normalizeUiLanguage(row.locale, "en");
  const statusRaw = String(row.status || "queued");
  const status =
    statusRaw === "contacted" || statusRaw === "closed" ? statusRaw : "queued";

  return {
    requestId: String(row.request_id || ""),
    userId: String(row.user_id || ""),
    phone: String(row.phone || ""),
    name: row.name == null ? undefined : String(row.name),
    preferredTime: row.preferred_time == null ? undefined : String(row.preferred_time),
    note: row.note == null ? undefined : String(row.note),
    adminNote: row.admin_note == null ? undefined : String(row.admin_note),
    locale,
    status,
    createdAt: Number(row.created_at_ms) || 0,
    updatedAt: Number(row.updated_at_ms) || 0,
  };
}

export async function initTherapyCallbackDb(connectionString: string): Promise<void> {
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
      const { applied } = await ensureTherapyCallbackTables(client);
      if (applied) {
        console.log(
          JSON.stringify({
            level: "info",
            message: "Therapy callback schema migration applied",
            migration: "005_therapy_callback_tables.sql",
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

export async function insertTherapyCallback(record: TherapyCallbackRecord): Promise<void> {
  const p = getPool();
  await p.query(
    `INSERT INTO therapy_callback_requests (
      request_id, user_id, phone, name, preferred_time, note, admin_note, locale, status, created_at_ms, updated_at_ms
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
    ON CONFLICT (request_id) DO NOTHING`,
    [
      record.requestId,
      record.userId,
      record.phone,
      record.name ?? null,
      record.preferredTime ?? null,
      record.note ?? null,
      record.adminNote ?? null,
      record.locale,
      record.status,
      record.createdAt,
      record.updatedAt,
    ]
  );
}

export async function countQueuedTherapyCallbacks(): Promise<number> {
  const p = getPool();
  const result = await p.query(
    `SELECT COUNT(*)::bigint AS total
     FROM therapy_callback_requests
     WHERE status = 'queued'`
  );
  return Number(result.rows[0]?.total ?? 0);
}

export async function listTherapyCallbacksByUser(
  userId: string,
  limit = 20
): Promise<TherapyCallbackRecord[]> {
  const p = getPool();
  const safeLimit = Math.max(1, Math.min(100, Math.trunc(limit)));
  const result = await p.query(
    `SELECT request_id, user_id, phone, name, preferred_time, note, admin_note, locale, status, created_at_ms, updated_at_ms
     FROM therapy_callback_requests
     WHERE user_id = $1
     ORDER BY created_at_ms DESC
     LIMIT $2`,
    [userId, safeLimit]
  );
  return result.rows.map((row) => rowToRecord(row as Record<string, unknown>));
}

export async function listTherapyCallbacksByStatus(
  status: TherapyCallbackRecord["status"] | "all",
  limit = 50
): Promise<TherapyCallbackRecord[]> {
  const p = getPool();
  const safeLimit = Math.max(1, Math.min(200, Math.trunc(limit)));

  const query =
    status === "all"
      ? `SELECT request_id, user_id, phone, name, preferred_time, note, admin_note, locale, status, created_at_ms, updated_at_ms
         FROM therapy_callback_requests
         ORDER BY created_at_ms DESC
         LIMIT $1`
      : `SELECT request_id, user_id, phone, name, preferred_time, note, admin_note, locale, status, created_at_ms, updated_at_ms
         FROM therapy_callback_requests
         WHERE status = $1
         ORDER BY created_at_ms DESC
         LIMIT $2`;

  const result =
    status === "all"
      ? await p.query(query, [safeLimit])
      : await p.query(query, [status, safeLimit]);

  return result.rows.map((row) => rowToRecord(row as Record<string, unknown>));
}

export async function updateTherapyCallbackStatus(
  requestId: string,
  status: TherapyCallbackRecord["status"],
  adminNote?: string
): Promise<TherapyCallbackRecord | null> {
  const p = getPool();
  const now = Date.now();
  const result = await p.query(
    `UPDATE therapy_callback_requests
     SET status = $2,
         admin_note = COALESCE($3, admin_note),
         updated_at_ms = $4
     WHERE request_id = $1
     RETURNING request_id, user_id, phone, name, preferred_time, note, admin_note, locale, status, created_at_ms, updated_at_ms`,
    [requestId, status, adminNote ?? null, now]
  );
  const row = result.rows[0];
  return row ? rowToRecord(row as Record<string, unknown>) : null;
}
