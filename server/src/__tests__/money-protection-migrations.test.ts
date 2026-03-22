import { promises as fs } from "fs";
import os from "os";
import path from "path";
import { ensureMoneyProtectionTables } from "../money-protection-migrations";

describe("ensureMoneyProtectionTables", () => {
  it("applies migration when money protection table is missing", async () => {
    const migrationDir = await fs.mkdtemp(path.join(os.tmpdir(), "money-protection-migration-"));
    const migrationSqlPath = path.join(migrationDir, "004_money_protection_tables.sql");
    await fs.writeFile(
      migrationSqlPath,
      "CREATE TABLE IF NOT EXISTS money_protection_states (user_id text primary key, state_json jsonb not null, updated_at_ms bigint not null);",
      "utf8"
    );

    const query = jest
      .fn()
      .mockResolvedValueOnce({ rows: [] }) // lock
      .mockResolvedValueOnce({ rows: [{ money_protection_states: null, money_protection_events: null }] }) // table check
      .mockResolvedValueOnce({ rows: [] }) // begin
      .mockResolvedValueOnce({ rows: [] }) // sql
      .mockResolvedValueOnce({ rows: [] }) // commit
      .mockResolvedValueOnce({ rows: [] }); // unlock

    try {
      const result = await ensureMoneyProtectionTables({ query }, migrationSqlPath);
      expect(result).toEqual({ applied: true, reason: "missing_tables" });
      expect(query.mock.calls[3]?.[0]).toContain(
        "CREATE TABLE IF NOT EXISTS money_protection_states"
      );
    } finally {
      await fs.rm(migrationDir, { recursive: true, force: true });
    }
  });

  it("skips migration when money protection table already exists", async () => {
    const query = jest
      .fn()
      .mockResolvedValueOnce({ rows: [] }) // lock
      .mockResolvedValueOnce({
        rows: [{
          money_protection_states: "money_protection_states",
          money_protection_events: "money_protection_events",
        }],
      }) // table check
      .mockResolvedValueOnce({ rows: [] }); // unlock

    const result = await ensureMoneyProtectionTables({ query });
    expect(result).toEqual({ applied: false, reason: "already_present" });
    expect(query).toHaveBeenCalledTimes(3);
  });
});
