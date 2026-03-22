import { promises as fs } from "fs";
import os from "os";
import path from "path";
import {
  getMoneyProtectionHistory,
  initializeMoneyProtectionStore,
  syncMoneyProtectionState,
} from "../money-protection";

function state(params?: Partial<{
  cardAway: boolean;
  alone: boolean;
  emotionalDistress: boolean;
  escapeNeed: boolean;
  emotionalVoid: boolean;
  bankAppHidden: boolean;
  paymentsDisabled: boolean;
  lastSafeCheck: number | null;
  dailyLimitTRY: number;
  savedTodayTRY: number;
  savedTodayDateKey: string | null;
  lockMinutes: number;
  lockStartedAt: number | null;
  updatedAt: number;
}>): Record<string, unknown> {
  return {
    cardAway: false,
    alone: false,
    emotionalDistress: false,
    escapeNeed: false,
    emotionalVoid: false,
    bankAppHidden: false,
    paymentsDisabled: false,
    lastSafeCheck: null,
    dailyLimitTRY: 0,
    savedTodayTRY: 0,
    savedTodayDateKey: "2026-02-22",
    lockMinutes: 0,
    lockStartedAt: null,
    updatedAt: 0,
    ...(params ?? {}),
  };
}

describe("money protection sync", () => {
  let tempDir = "";
  let statePath = "";
  let baseTs = 0;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "money-protection-sync-"));
    statePath = path.join(tempDir, "money-protection-state.json");
    baseTs = Date.now();
    await initializeMoneyProtectionStore(statePath);
  });

  afterEach(async () => {
    if (tempDir) {
      await fs.rm(tempDir, { recursive: true, force: true });
    }
  });

  it("stores and returns synced state", async () => {
    const result = await syncMoneyProtectionState(
      "user-a",
      state({
        cardAway: true,
        dailyLimitTRY: 300,
        updatedAt: baseTs + 1_000,
      }),
      0
    );

    expect(result.state.cardAway).toBe(true);
    expect(result.state.dailyLimitTRY).toBe(300);
    expect(result.conflicts).toBe(0);
  });

  it("keeps server state when local update is older", async () => {
    await syncMoneyProtectionState(
      "user-a",
      state({
        cardAway: true,
        bankAppHidden: true,
        paymentsDisabled: true,
        updatedAt: baseTs + 2_000,
      }),
      0
    );

    const result = await syncMoneyProtectionState(
      "user-a",
      state({
        cardAway: false,
        bankAppHidden: false,
        paymentsDisabled: false,
        updatedAt: baseTs + 1_000,
      }),
      0
    );

    expect(result.state.cardAway).toBe(true);
    expect(result.state.bankAppHidden).toBe(true);
    expect(result.conflicts).toBe(1);
  });

  it("accepts newer local update", async () => {
    await syncMoneyProtectionState(
      "user-a",
      state({
        dailyLimitTRY: 100,
        updatedAt: baseTs + 1_000,
      }),
      0
    );

    const result = await syncMoneyProtectionState(
      "user-a",
      state({
        dailyLimitTRY: 450,
        updatedAt: baseTs + 3_000,
      }),
      0
    );

    expect(result.state.dailyLimitTRY).toBe(450);
    expect(result.conflicts).toBe(0);
  });

  it("records audit events for sync operations", async () => {
    await syncMoneyProtectionState(
      "user-a",
      state({
        dailyLimitTRY: 150,
        updatedAt: baseTs + 1_000,
      }),
      0
    );

    await syncMoneyProtectionState(
      "user-a",
      state({
        dailyLimitTRY: 120,
        updatedAt: baseTs + 500,
      }),
      0
    );

    const events = await getMoneyProtectionHistory("user-a", 10);
    expect(events.length).toBeGreaterThanOrEqual(2);
    expect(events[0]?.source).toBe("sync");
    expect(events[0]?.state).toBeDefined();
    expect(events.some((event) => event.conflicts >= 1)).toBe(true);
  });
});
