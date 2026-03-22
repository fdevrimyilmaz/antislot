import { promises as fs } from "fs";
import os from "os";
import path from "path";
import { initializeUrgeStore, syncUrgeState } from "../urge";

function log(params: {
  id: string;
  timestamp: number;
  intensity: number;
  trigger?: string | null;
  duration: number;
  outcome?: {
    finalIntensity: number;
    effectiveness: string;
  };
}) {
  return {
    id: params.id,
    timestamp: params.timestamp,
    intensity: params.intensity,
    trigger: params.trigger ?? null,
    interventions: [],
    duration: params.duration,
    outcome: params.outcome,
  };
}

describe("urge sync", () => {
  let tempDir = "";
  let statePath = "";
  let baseTs = 0;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "urge-sync-"));
    statePath = path.join(tempDir, "urge-state.json");
    baseTs = Date.now();
    await initializeUrgeStore(statePath);
  });

  afterEach(async () => {
    if (tempDir) {
      await fs.rm(tempDir, { recursive: true, force: true });
    }
  });

  it("stores and returns synced logs", async () => {
    const result = await syncUrgeState(
      "user-a",
      [
        log({
          id: "u1",
          timestamp: baseTs + 1000,
          intensity: 7,
          trigger: "emotional",
          duration: 120,
        }),
      ],
      0
    );

    expect(result.logs).toHaveLength(1);
    expect(result.logs[0]?.id).toBe("u1");
    expect(result.conflicts).toBe(0);
  });

  it("keeps richer server value when duplicate id conflict is weaker", async () => {
    await syncUrgeState(
      "user-a",
      [
        log({
          id: "u1",
          timestamp: baseTs + 1000,
          intensity: 8,
          duration: 180,
          outcome: {
            finalIntensity: 4,
            effectiveness: "helpful",
          },
        }),
      ],
      0
    );

    const result = await syncUrgeState(
      "user-a",
      [
        log({
          id: "u1",
          timestamp: baseTs + 1000,
          intensity: 8,
          duration: 60,
        }),
      ],
      0
    );

    expect(result.logs).toHaveLength(1);
    expect(result.logs[0]?.duration).toBe(180);
    expect(result.logs[0]?.outcome?.effectiveness).toBe("helpful");
    expect(result.conflicts).toBe(1);
  });

  it("merges additional logs from client", async () => {
    await syncUrgeState(
      "user-a",
      [
        log({
          id: "u1",
          timestamp: baseTs + 1000,
          intensity: 6,
          duration: 90,
        }),
      ],
      0
    );

    const result = await syncUrgeState(
      "user-a",
      [
        log({
          id: "u2",
          timestamp: baseTs + 2000,
          intensity: 5,
          duration: 45,
        }),
      ],
      0
    );

    const ids = result.logs.map((item) => item.id);
    expect(ids).toEqual(expect.arrayContaining(["u1", "u2"]));
  });
});
