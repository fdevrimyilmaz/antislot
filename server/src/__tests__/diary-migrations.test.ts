import { promises as fs } from "fs";
import os from "os";
import path from "path";
import { ensureDiaryTables } from "../diary-migrations";

describe("ensureDiaryTables", () => {
  it("applies migration when diary table is missing", async () => {
    const migrationDir = await fs.mkdtemp(path.join(os.tmpdir(), "diary-migration-"));
    const migrationSqlPath = path.join(migrationDir, "002_diary_tables.sql");
    await fs.writeFile(
      migrationSqlPath,
      "CREATE TABLE IF NOT EXISTS diary_entries (user_id text, date text, id text, content text, created_at_ms bigint, updated_at_ms bigint, deleted_at_ms bigint);",
      "utf8"
    );

    const query = jest
      .fn()
      .mockResolvedValueOnce({ rows: [] }) // lock
      .mockResolvedValueOnce({ rows: [{ diary_entries: null }] }) // table check
      .mockResolvedValueOnce({ rows: [] }) // begin
      .mockResolvedValueOnce({ rows: [] }) // sql
      .mockResolvedValueOnce({ rows: [] }) // commit
      .mockResolvedValueOnce({ rows: [] }); // unlock

    try {
      const result = await ensureDiaryTables({ query }, migrationSqlPath);
      expect(result).toEqual({ applied: true, reason: "missing_tables" });
      expect(query.mock.calls[3]?.[0]).toContain("CREATE TABLE IF NOT EXISTS diary_entries");
    } finally {
      await fs.rm(migrationDir, { recursive: true, force: true });
    }
  });

  it("skips migration when diary table already exists", async () => {
    const query = jest
      .fn()
      .mockResolvedValueOnce({ rows: [] }) // lock
      .mockResolvedValueOnce({ rows: [{ diary_entries: "diary_entries" }] }) // table check
      .mockResolvedValueOnce({ rows: [] }); // unlock

    const result = await ensureDiaryTables({ query });
    expect(result).toEqual({ applied: false, reason: "already_present" });
    expect(query).toHaveBeenCalledTimes(3);
  });
});

