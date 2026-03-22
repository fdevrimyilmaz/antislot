import { promises as fs } from "fs";
import os from "os";
import path from "path";
import { ensureUrgeTables } from "../urge-migrations";

describe("ensureUrgeTables", () => {
  it("applies migration when urge table is missing", async () => {
    const migrationDir = await fs.mkdtemp(path.join(os.tmpdir(), "urge-migration-"));
    const migrationSqlPath = path.join(migrationDir, "003_urge_tables.sql");
    await fs.writeFile(
      migrationSqlPath,
      "CREATE TABLE IF NOT EXISTS urge_logs (user_id text, id text, timestamp_ms bigint, intensity smallint, trigger text, context text, interventions jsonb, outcome jsonb, duration_sec integer);",
      "utf8"
    );

    const query = jest
      .fn()
      .mockResolvedValueOnce({ rows: [] }) // lock
      .mockResolvedValueOnce({ rows: [{ urge_logs: null }] }) // table check
      .mockResolvedValueOnce({ rows: [] }) // begin
      .mockResolvedValueOnce({ rows: [] }) // sql
      .mockResolvedValueOnce({ rows: [] }) // commit
      .mockResolvedValueOnce({ rows: [] }); // unlock

    try {
      const result = await ensureUrgeTables({ query }, migrationSqlPath);
      expect(result).toEqual({ applied: true, reason: "missing_tables" });
      expect(query.mock.calls[3]?.[0]).toContain("CREATE TABLE IF NOT EXISTS urge_logs");
    } finally {
      await fs.rm(migrationDir, { recursive: true, force: true });
    }
  });

  it("skips migration when urge table already exists", async () => {
    const query = jest
      .fn()
      .mockResolvedValueOnce({ rows: [] }) // lock
      .mockResolvedValueOnce({ rows: [{ urge_logs: "urge_logs" }] }) // table check
      .mockResolvedValueOnce({ rows: [] }); // unlock

    const result = await ensureUrgeTables({ query });
    expect(result).toEqual({ applied: false, reason: "already_present" });
    expect(query).toHaveBeenCalledTimes(3);
  });
});
