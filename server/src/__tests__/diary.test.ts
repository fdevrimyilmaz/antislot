import { promises as fs } from "fs";
import os from "os";
import path from "path";
import { initializeDiaryStore, syncDiaryState } from "../diary";

function entry(params: {
  id: string;
  date: string;
  content: string;
  createdAt: number;
  updatedAt: number;
  deletedAt?: number | null;
}) {
  return {
    id: params.id,
    date: params.date,
    content: params.content,
    createdAt: params.createdAt,
    updatedAt: params.updatedAt,
    deletedAt: params.deletedAt ?? null,
  };
}

describe("diary sync", () => {
  let tempDir = "";
  let statePath = "";
  let baseTs = 0;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "diary-sync-"));
    statePath = path.join(tempDir, "diary-state.json");
    baseTs = Date.now();
    await initializeDiaryStore(statePath);
  });

  afterEach(async () => {
    if (tempDir) {
      await fs.rm(tempDir, { recursive: true, force: true });
    }
  });

  it("stores and returns synced entries", async () => {
    const result = await syncDiaryState(
      "user-a",
      [
        entry({
          id: "e1",
          date: "2026-02-22",
          content: "first",
          createdAt: baseTs + 1000,
          updatedAt: baseTs + 1000,
        }),
      ],
      0
    );

    expect(result.entries).toHaveLength(1);
    expect(result.entries[0]?.content).toBe("first");
    expect(result.conflicts).toBe(0);
  });

  it("keeps newer server value when client sends older conflict", async () => {
    await syncDiaryState(
      "user-a",
      [
        entry({
          id: "e1",
          date: "2026-02-22",
          content: "server-wins",
          createdAt: baseTs + 1000,
          updatedAt: baseTs + 3000,
        }),
      ],
      0
    );

    const result = await syncDiaryState(
      "user-a",
      [
        entry({
          id: "e2",
          date: "2026-02-22",
          content: "older-client",
          createdAt: baseTs + 1000,
          updatedAt: baseTs + 2000,
        }),
      ],
      0
    );

    expect(result.entries).toHaveLength(1);
    expect(result.entries[0]?.content).toBe("server-wins");
    expect(result.conflicts).toBe(1);
  });

  it("applies deletion tombstone and allows later revive with newer update", async () => {
    await syncDiaryState(
      "user-a",
      [
        entry({
          id: "e1",
          date: "2026-02-22",
          content: "alive",
          createdAt: baseTs + 1000,
          updatedAt: baseTs + 1000,
        }),
      ],
      0
    );

    const afterDelete = await syncDiaryState(
      "user-a",
      [
        entry({
          id: "e1",
          date: "2026-02-22",
          content: "alive",
          createdAt: baseTs + 1000,
          updatedAt: baseTs + 2000,
          deletedAt: baseTs + 2000,
        }),
      ],
      0
    );
    expect(afterDelete.entries[0]?.deletedAt).toBe(baseTs + 2000);

    const afterRevive = await syncDiaryState(
      "user-a",
      [
        entry({
          id: "e1",
          date: "2026-02-22",
          content: "revived",
          createdAt: baseTs + 1000,
          updatedAt: baseTs + 3000,
          deletedAt: null,
        }),
      ],
      0
    );
    expect(afterRevive.entries[0]?.deletedAt).toBeNull();
    expect(afterRevive.entries[0]?.content).toBe("revived");
  });
});
