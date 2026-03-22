import { promises as fs } from "fs";
import path from "path";

type QueryResultRow = Record<string, unknown>;

export type MigrationDbClient = {
  query: (
    text: string,
    params?: ReadonlyArray<unknown>
  ) => Promise<{ rows: QueryResultRow[] }>;
};

export type MoneyProtectionMigrationResult = {
  applied: boolean;
  reason: "missing_tables" | "already_present";
};

const MIGRATION_LOCK_KEY = 9_017_004;
const DEFAULT_MIGRATION_FILE = "004_money_protection_tables.sql";

function defaultMigrationSqlPath(): string {
  return path.resolve(__dirname, "..", "migrations", DEFAULT_MIGRATION_FILE);
}

async function moneyProtectionTablesPresent(
  client: MigrationDbClient
): Promise<boolean> {
  const result = await client.query(
    "SELECT to_regclass($1) AS money_protection_states, to_regclass($2) AS money_protection_events",
    ["public.money_protection_states", "public.money_protection_events"]
  );
  const row = result.rows[0] ?? {};
  return Boolean(row.money_protection_states) && Boolean(row.money_protection_events);
}

export async function ensureMoneyProtectionTables(
  client: MigrationDbClient,
  migrationSqlPath?: string
): Promise<MoneyProtectionMigrationResult> {
  const sqlPath = migrationSqlPath ?? defaultMigrationSqlPath();
  let transactionOpen = false;

  await client.query("SELECT pg_advisory_lock($1)", [MIGRATION_LOCK_KEY]);
  try {
    const alreadyPresent = await moneyProtectionTablesPresent(client);
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
    await client.query("SELECT pg_advisory_unlock($1)", [MIGRATION_LOCK_KEY]);
  }
}
