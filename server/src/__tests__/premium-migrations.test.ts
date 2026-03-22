import { promises as fs } from "fs";
import os from "os";
import path from "path";
import { ensurePremiumTables } from "../premium-migrations";

describe("ensurePremiumTables", () => {
  it("applies migration when premium tables are missing", async () => {
    const migrationDir = await fs.mkdtemp(path.join(os.tmpdir(), "premium-migration-"));
    const migrationSqlPath = path.join(migrationDir, "001_premium_tables.sql");
    await fs.writeFile(
      migrationSqlPath,
      "CREATE TABLE IF NOT EXISTS premium_entitlements (user_id text primary key);",
      "utf8"
    );

    const query = jest
      .fn<Promise<{ rows: Record<string, unknown>[] }>, [string, ReadonlyArray<unknown>?]>()
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({
        rows: [
          {
            premium_entitlements: null,
            premium_processed_events: null,
          },
        ],
      })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] });

    try {
      const result = await ensurePremiumTables({ query }, migrationSqlPath);

      expect(result).toEqual({ applied: true, reason: "missing_tables" });
      expect(query).toHaveBeenCalledTimes(6);
      expect(query.mock.calls[3]?.[0]).toContain("CREATE TABLE IF NOT EXISTS premium_entitlements");
    } finally {
      await fs.rm(migrationDir, { recursive: true, force: true });
    }
  });

  it("skips migration when premium tables already exist", async () => {
    const query = jest
      .fn<Promise<{ rows: Record<string, unknown>[] }>, [string, ReadonlyArray<unknown>?]>()
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({
        rows: [
          {
            premium_entitlements: "premium_entitlements",
            premium_processed_events: "premium_processed_events",
          },
        ],
      });

    const result = await ensurePremiumTables({ query });

    expect(result).toEqual({ applied: false, reason: "already_present" });
    expect(query).toHaveBeenCalledTimes(3);
  });
});
