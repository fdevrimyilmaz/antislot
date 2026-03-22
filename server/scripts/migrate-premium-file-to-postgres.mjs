#!/usr/bin/env node
/**
 * Migrate premium state from JSON file to Postgres.
 * Usage: node scripts/migrate-premium-file-to-postgres.mjs <premium-state.json> <DATABASE_URL>
 * Example: node scripts/migrate-premium-file-to-postgres.mjs ./data/premium-state.json postgresql://antislot:pass@localhost:5432/antislot
 */

import { readFileSync } from "fs";
import pg from "pg";

const [filePath, databaseUrl] = process.argv.slice(2);

if (!filePath || !databaseUrl) {
  console.error("Usage: node migrate-premium-file-to-postgres.mjs <premium-state.json> <DATABASE_URL>");
  process.exit(1);
}

const raw = readFileSync(filePath, "utf8");
const parsed = JSON.parse(raw);

const entitlements = parsed?.entitlements && typeof parsed.entitlements === "object"
  ? parsed.entitlements
  : {};

const processedEvents = parsed?.processedEvents && typeof parsed.processedEvents === "object"
  ? parsed.processedEvents
  : {};

const pool = new pg.Pool({ connectionString: databaseUrl });

async function migrate() {
  const client = await pool.connect();

  try {
    let entitlementsCount = 0;

    for (const [userId, rec] of Object.entries(entitlements)) {
      const r = rec;
      if (!r || typeof r !== "object") continue;

      await client.query(
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
          String(userId),
          String(r.platform ?? "unknown"),
          String(r.source ?? "code"),
          String(r.productId ?? "code"),
          String(r.status ?? "active"),
          String(r.transactionId ?? ""),
          String(r.eventId ?? ""),
          Number(r.startedAt ?? 0),
          r.expiresAt != null ? Number(r.expiresAt) : null,
          Number(r.updatedAt ?? Date.now()),
        ]
      );
      entitlementsCount++;
    }

    let eventsCount = 0;
    for (const [eventKey, processedAt] of Object.entries(processedEvents)) {
      const ts = Number(processedAt);
      if (!Number.isFinite(ts)) continue;

      await client.query(
        "INSERT INTO premium_processed_events (event_key, processed_at) VALUES ($1, $2) ON CONFLICT (event_key) DO NOTHING",
        [String(eventKey), ts]
      );
      eventsCount++;
    }

    console.log(`Migrated ${entitlementsCount} entitlements and ${eventsCount} processed events.`);
  } finally {
    client.release();
    await pool.end();
  }
}

migrate().catch((err) => {
  console.error(err);
  process.exit(1);
});
