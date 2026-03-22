import { promises as fs } from "fs";
import path from "path";

type QueryResultRow = Record<string, unknown>;

export type MigrationDbClient = {
  query: (
    text: string,
    params?: ReadonlyArray<unknown>
  ) => Promise<{ rows: QueryResultRow[] }>;
};

export type PremiumMigrationResult = {
  applied: boolean;
  reason: "missing_tables" | "already_present";
};

const PREMIUM_MIGRATION_LOCK_KEY = 9_017_001;
const DEFAULT_MIGRATION_FILE = "001_premium_tables.sql";

function defaultMigrationSqlPath(): string {
  return path.resolve(__dirname, "..", "migrations", DEFAULT_MIGRATION_FILE);
}

async function allPremiumTablesPresent(client: MigrationDbClient): Promise<boolean> {
  const result = await client.query(
    `SELECT
      to_regclass($1) AS premium_entitlements,
      to_regclass($2) AS premium_processed_events`,
    ["public.premium_entitlements", "public.premium_processed_events"]
  );

  const row = result.rows[0] ?? {};
  return Boolean(row.premium_entitlements) && Boolean(row.premium_processed_events);
}

export async function ensurePremiumTables(
  client: MigrationDbClient,
  migrationSqlPath?: string
): Promise<PremiumMigrationResult> {
  const sqlPath = migrationSqlPath ?? defaultMigrationSqlPath();
  let transactionOpen = false;

  await client.query("SELECT pg_advisory_lock($1)", [PREMIUM_MIGRATION_LOCK_KEY]);
  try {
    const alreadyPresent = await allPremiumTablesPresent(client);
    if (alreadyPresent) {
      return { applied: false, reason: "already_present" };
    }

    const sql = await fs.readFile(sqlPath, "utf8");
    await client.query("BEGIN");
    transactionOpen = true;
    await client.query(sql);
    await client.query("COMMIT");
    transactionOpen = false;
    return { applied: true, reason: "missing_tables" };
  } catch (error) {
    if (transactionOpen) {
      await client.query("ROLLBACK");
    }
    throw error;
  } finally {
    await client.query("SELECT pg_advisory_unlock($1)", [PREMIUM_MIGRATION_LOCK_KEY]);
  }
}
