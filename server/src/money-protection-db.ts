import { Pool } from "pg";
import { ensureMoneyProtectionTables } from "./money-protection-migrations";
import type {
  MoneyProtectionCloudEvent,
  MoneyProtectionCloudState,
} from "./money-protection-types";

let pool: Pool | null = null;

function getPool(): Pool {
  if (!pool) throw new Error("MoneyProtection DB not initialized");
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

function rowToState(row: Record<string, unknown>): MoneyProtectionCloudState {
  const parsed = parseJsonField<Partial<MoneyProtectionCloudState>>(row.state_json, {});
  return {
    cardAway: Boolean(parsed.cardAway),
    alone: Boolean(parsed.alone),
    emotionalDistress: Boolean(parsed.emotionalDistress),
    escapeNeed: Boolean(parsed.escapeNeed),
    emotionalVoid: Boolean(parsed.emotionalVoid),
    bankAppHidden: Boolean(parsed.bankAppHidden),
    paymentsDisabled: Boolean(parsed.paymentsDisabled),
    lastSafeCheck:
      typeof parsed.lastSafeCheck === "number" && Number.isFinite(parsed.lastSafeCheck) && parsed.lastSafeCheck > 0
        ? Math.trunc(parsed.lastSafeCheck)
        : null,
    dailyLimitTRY: typeof parsed.dailyLimitTRY === "number" && Number.isFinite(parsed.dailyLimitTRY) ? parsed.dailyLimitTRY : 0,
    savedTodayTRY: typeof parsed.savedTodayTRY === "number" && Number.isFinite(parsed.savedTodayTRY) ? parsed.savedTodayTRY : 0,
    savedTodayDateKey:
      typeof parsed.savedTodayDateKey === "string" ? parsed.savedTodayDateKey : null,
    lockMinutes: typeof parsed.lockMinutes === "number" && Number.isFinite(parsed.lockMinutes) ? Math.trunc(parsed.lockMinutes) : 0,
    lockStartedAt:
      typeof parsed.lockStartedAt === "number" && Number.isFinite(parsed.lockStartedAt) && parsed.lockStartedAt > 0
        ? Math.trunc(parsed.lockStartedAt)
        : null,
    updatedAt: Number(row.updated_at_ms) || 0,
  };
}

function rowToEvent(row: Record<string, unknown>): MoneyProtectionCloudEvent {
  return {
    id: String(row.event_id || ""),
    source: "sync",
    createdAt: Number(row.created_at_ms) || 0,
    localUpdatedAt: Number(row.local_updated_at_ms) || 0,
    resolvedUpdatedAt: Number(row.resolved_updated_at_ms) || 0,
    conflicts: Number(row.conflicts) || 0,
    state: rowToState({
      state_json: row.state_json,
      updated_at_ms: row.resolved_updated_at_ms,
    }),
  };
}

export async function initMoneyProtectionDb(connectionString: string): Promise<void> {
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
      const { applied } = await ensureMoneyProtectionTables(client);
      if (applied) {
        console.log(
          JSON.stringify({
            level: "info",
            message: "Money protection schema migration applied",
            migration: "004_money_protection_tables.sql",
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

export async function getMoneyProtectionState(
  userId: string
): Promise<MoneyProtectionCloudState | null> {
  const p = getPool();
  const result = await p.query(
    `SELECT state_json, updated_at_ms
     FROM money_protection_states
     WHERE user_id = $1`,
    [userId]
  );
  const row = result.rows[0];
  if (!row) return null;
  return rowToState(row as Record<string, unknown>);
}

export async function upsertMoneyProtectionStateIfNewer(
  userId: string,
  state: MoneyProtectionCloudState
): Promise<void> {
  const p = getPool();
  await p.query(
    `INSERT INTO money_protection_states (user_id, state_json, updated_at_ms)
     VALUES ($1, $2::jsonb, $3)
     ON CONFLICT (user_id) DO UPDATE SET
       state_json = EXCLUDED.state_json,
       updated_at_ms = EXCLUDED.updated_at_ms
     WHERE EXCLUDED.updated_at_ms > money_protection_states.updated_at_ms`,
    [userId, JSON.stringify(state), state.updatedAt]
  );
}

export async function appendMoneyProtectionEvent(
  userId: string,
  event: MoneyProtectionCloudEvent
): Promise<void> {
  const p = getPool();
  await p.query(
    `INSERT INTO money_protection_events (
       user_id, event_id, source, created_at_ms, local_updated_at_ms, resolved_updated_at_ms, conflicts, state_json
     ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb)
     ON CONFLICT (user_id, event_id) DO NOTHING`,
    [
      userId,
      event.id,
      event.source,
      event.createdAt,
      event.localUpdatedAt,
      event.resolvedUpdatedAt,
      event.conflicts,
      JSON.stringify(event.state),
    ]
  );
}

export async function listMoneyProtectionEvents(
  userId: string,
  limit = 50
): Promise<MoneyProtectionCloudEvent[]> {
  const p = getPool();
  const safeLimit = Math.max(1, Math.min(200, Math.trunc(limit)));
  const result = await p.query(
    `SELECT event_id, source, created_at_ms, local_updated_at_ms, resolved_updated_at_ms, conflicts, state_json
     FROM money_protection_events
     WHERE user_id = $1
     ORDER BY created_at_ms DESC
     LIMIT $2`,
    [userId, safeLimit]
  );

  return result.rows.map((row) => rowToEvent(row as Record<string, unknown>));
}
