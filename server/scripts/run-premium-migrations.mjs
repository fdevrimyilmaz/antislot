import "dotenv/config";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

const { Pool } = pg;
const connectionString = (process.env.DATABASE_URL || "").trim();

if (!connectionString) {
  console.error("DATABASE_URL is required.");
  process.exit(1);
}

const currentFile = fileURLToPath(import.meta.url);
const currentDir = path.dirname(currentFile);
const migrationSqlPath = path.resolve(currentDir, "..", "migrations", "001_premium_tables.sql");
const advisoryLockKey = 9_017_001;

const pool = new Pool({
  connectionString,
  max: 2,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

async function tablesExist(client) {
  const result = await client.query(
    `SELECT
      to_regclass($1) AS premium_entitlements,
      to_regclass($2) AS premium_processed_events`,
    ["public.premium_entitlements", "public.premium_processed_events"]
  );
  const row = result.rows[0] ?? {};
  return Boolean(row.premium_entitlements) && Boolean(row.premium_processed_events);
}

async function run() {
  const client = await pool.connect();
  let transactionOpen = false;
  try {
    await client.query("SELECT pg_advisory_lock($1)", [advisoryLockKey]);
    const alreadyPresent = await tablesExist(client);
    if (alreadyPresent) {
      console.log("premium schema already present, skipping");
      return;
    }

    const sql = await readFile(migrationSqlPath, "utf8");
    await client.query("BEGIN");
    transactionOpen = true;
    await client.query(sql);
    await client.query("COMMIT");
    transactionOpen = false;
    console.log("premium schema migration applied");
  } catch (error) {
    if (transactionOpen) {
      await client.query("ROLLBACK");
    }
    throw error;
  } finally {
    await client.query("SELECT pg_advisory_unlock($1)", [advisoryLockKey]).catch(() => undefined);
    client.release();
    await pool.end();
  }
}

run().catch((error) => {
  console.error("premium schema migration failed:", error instanceof Error ? error.message : String(error));
  process.exit(1);
});
