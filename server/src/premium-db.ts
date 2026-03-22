import { Pool, PoolClient } from "pg";
import { ensurePremiumTables } from "./premium-migrations";

export type EntitlementStatus = "active" | "canceled" | "refunded" | "grace" | "expired";
export type PremiumSource =
  | "trial"
  | "subscription_monthly"
  | "subscription_yearly"
  | "lifetime"
  | "code"
  | "admin";

export type EntitlementRecord = {
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

let pool: Pool | null = null;

export function getPool(): Pool {
  if (!pool) throw new Error("Premium DB not initialized");
  return pool;
}

export async function initPremiumDb(connectionString: string): Promise<void> {
  if (pool) return;
  pool = new Pool({
    connectionString,
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
  });
  try {
    const client = await pool.connect();
    try {
      await client.query("SELECT 1");
      const { applied } = await ensurePremiumTables(client);
      if (applied) {
        console.log(
          JSON.stringify({
            level: "info",
            message: "Premium schema migration applied",
            migration: "001_premium_tables.sql",
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

export async function closePremiumDb(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
  }
}

function rowToEntitlement(row: Record<string, unknown>): EntitlementRecord {
  return {
    userId: String(row.user_id),
    platform: (row.platform as "ios" | "android" | "unknown") || "unknown",
    source: (row.source as PremiumSource) || "subscription_monthly",
    productId: String(row.product_id || ""),
    status: (row.status as EntitlementStatus) || "active",
    transactionId: String(row.transaction_id || ""),
    eventId: String(row.event_id || ""),
    startedAt: Number(row.started_at) || 0,
    expiresAt: row.expires_at != null ? Number(row.expires_at) : null,
    updatedAt: Number(row.updated_at) || 0,
  };
}

export async function getEntitlement(userId: string): Promise<EntitlementRecord | null> {
  const p = getPool();
  const result = await p.query(
    "SELECT user_id, platform, source, product_id, status, transaction_id, event_id, started_at, expires_at, updated_at FROM premium_entitlements WHERE user_id = $1",
    [userId]
  );
  const row = result.rows[0];
  if (!row) return null;
  return rowToEntitlement(row);
}

export async function upsertEntitlement(record: EntitlementRecord): Promise<void> {
  const p = getPool();
  await p.query(
    `INSERT INTO premium_entitlements (user_id, platform, source, product_id, status, transaction_id, event_id, started_at, expires_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
     ON CONFLICT (user_id) DO UPDATE SET
       platform = EXCLUDED.platform,
       source = EXCLUDED.source,
       product_id = EXCLUDED.product_id,
       status = EXCLUDED.status,
       transaction_id = EXCLUDED.transaction_id,
       event_id = EXCLUDED.event_id,
       started_at = EXCLUDED.started_at,
       expires_at = EXCLUDED.expires_at,
       updated_at = EXCLUDED.updated_at`,
    [
      record.userId,
      record.platform,
      record.source,
      record.productId,
      record.status,
      record.transactionId,
      record.eventId,
      record.startedAt,
      record.expiresAt,
      record.updatedAt,
    ]
  );
}

export async function hasProcessedEvent(eventKey: string): Promise<boolean> {
  const p = getPool();
  const result = await p.query(
    "SELECT 1 FROM premium_processed_events WHERE event_key = $1",
    [eventKey]
  );
  return (result.rowCount ?? 0) > 0;
}

export async function addProcessedEvent(eventKey: string, processedAt: number): Promise<void> {
  const p = getPool();
  await p.query(
    "INSERT INTO premium_processed_events (event_key, processed_at) VALUES ($1, $2) ON CONFLICT (event_key) DO NOTHING",
    [eventKey, processedAt]
  );
}

const EVENT_TTL_MS = 45 * 24 * 60 * 60 * 1000;

export async function compactProcessedEvents(): Promise<void> {
  const p = getPool();
  const cutoff = Date.now() - EVENT_TTL_MS;
  await p.query("DELETE FROM premium_processed_events WHERE processed_at < $1", [cutoff]);
}

export async function withTransaction<T>(
  fn: (client: PoolClient) => Promise<T>
): Promise<T> {
  const p = getPool();
  const client = await p.connect();
  try {
    await client.query("BEGIN");
    const result = await fn(client);
    await client.query("COMMIT");
    return result;
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
}
