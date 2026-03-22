import { storage, STORAGE_KEYS } from "@/lib/storage";
import type {
  MoneyProtectionSyncRequest,
  MoneyProtectionSyncResponse,
} from "@/types/moneyProtectionSync";
import {
  setMoneyProtectionSyncClient,
  useMoneyProtectionStore,
} from "../moneyProtectionStore";

jest.mock("@/lib/storage", () => ({
  storage: {
    get: jest.fn(),
    set: jest.fn(),
    remove: jest.fn(),
  },
  STORAGE_KEYS: {
    MONEY_PROTECTION_STATE: "antislot_money_protection_state",
    MONEY_PROTECTION_LAST_SYNC_AT: "antislot_money_protection_last_sync_at",
  },
}));

const mockStorage = storage as jest.Mocked<typeof storage>;
const DAY_MS = 24 * 60 * 60 * 1000;
const mockSyncClient = jest.fn<
  Promise<MoneyProtectionSyncResponse | null>,
  [MoneyProtectionSyncRequest]
>(async () => null);

function toDayKey(timestamp: number): string {
  const date = new Date(timestamp);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

describe("moneyProtectionStore", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockStorage.get.mockResolvedValue(null);
    mockStorage.set.mockResolvedValue(undefined);
    mockStorage.remove.mockResolvedValue(undefined);
    setMoneyProtectionSyncClient(null);
    mockSyncClient.mockReset();
    mockSyncClient.mockResolvedValue(null);

    useMoneyProtectionStore.setState({
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
      savedTodayDateKey: null,
      lockMinutes: 0,
      lockStartedAt: null,
      updatedAt: 0,
      completedChecks: 4,
      totalChecks: 7,
      protectionScore: 57,
      canConfirmSafe: false,
      riskLevel: "high",
      lockActive: false,
      lockRemainingSec: 0,
      hydrated: false,
    });
  });

  afterAll(() => {
    setMoneyProtectionSyncClient(null);
  });

  it("hydrates and computes safe state from persisted payload", async () => {
    const now = new Date(2026, 1, 22, 10, 0, 0).getTime();
    const nowSpy = jest.spyOn(Date, "now").mockReturnValue(now);

    mockStorage.get.mockResolvedValue({
      cardAway: true,
      alone: false,
      emotionalDistress: false,
      escapeNeed: false,
      emotionalVoid: false,
      bankAppHidden: true,
      paymentsDisabled: true,
      lastSafeCheck: null,
      dailyLimitTRY: 500,
      savedTodayTRY: 120,
      savedTodayDateKey: toDayKey(now),
      lockMinutes: 0,
      lockStartedAt: null,
    });

    await useMoneyProtectionStore.getState().hydrate();
    const state = useMoneyProtectionStore.getState();

    expect(state.hydrated).toBe(true);
    expect(state.protectionScore).toBe(100);
    expect(state.canConfirmSafe).toBe(true);
    expect(state.riskLevel).toBe("safe");
    expect(mockStorage.get).toHaveBeenCalledWith(STORAGE_KEYS.MONEY_PROTECTION_STATE, {
      type: "standard",
    });

    nowSpy.mockRestore();
  });

  it("resets daily spend when date changes", async () => {
    const day1 = new Date(2026, 1, 22, 8, 0, 0).getTime();
    const day2 = day1 + DAY_MS + 60_000;
    const nowSpy = jest.spyOn(Date, "now");
    nowSpy.mockReturnValue(day1);

    await useMoneyProtectionStore.getState().setDailyLimitTRY(100);
    await useMoneyProtectionStore.getState().addSpendTRY(40);
    expect(useMoneyProtectionStore.getState().savedTodayTRY).toBe(40);
    expect(useMoneyProtectionStore.getState().savedTodayDateKey).toBe(toDayKey(day1));

    nowSpy.mockReturnValue(day2);
    await useMoneyProtectionStore.getState().addSpendTRY(10);

    expect(useMoneyProtectionStore.getState().savedTodayTRY).toBe(10);
    expect(useMoneyProtectionStore.getState().savedTodayDateKey).toBe(toDayKey(day2));

    nowSpy.mockRestore();
  });

  it("starts lock and clears expired lock via refresh", async () => {
    const startedAt = new Date(2026, 1, 22, 9, 0, 0).getTime();
    const nowSpy = jest.spyOn(Date, "now");
    nowSpy.mockReturnValue(startedAt);

    await useMoneyProtectionStore.getState().startLock(20);
    expect(useMoneyProtectionStore.getState().lockActive).toBe(true);
    expect(useMoneyProtectionStore.getState().lockRemainingSec).toBeGreaterThanOrEqual(1199);

    nowSpy.mockReturnValue(startedAt + 20 * 60 * 1000 + 1_000);
    await useMoneyProtectionStore.getState().refreshLockState();

    const state = useMoneyProtectionStore.getState();
    expect(state.lockActive).toBe(false);
    expect(state.lockRemainingSec).toBe(0);
    expect(state.lockMinutes).toBe(0);
    expect(state.lockStartedAt).toBeNull();

    nowSpy.mockRestore();
  });

  it("blocks safe confirmation when daily limit is reached", async () => {
    await useMoneyProtectionStore.getState().updateChecks({
      cardAway: true,
      alone: false,
      emotionalDistress: false,
      escapeNeed: false,
      emotionalVoid: false,
      bankAppHidden: true,
      paymentsDisabled: true,
    });

    expect(useMoneyProtectionStore.getState().canConfirmSafe).toBe(true);

    await useMoneyProtectionStore.getState().setDailyLimitTRY(100);
    await useMoneyProtectionStore.getState().addSpendTRY(100);

    const state = useMoneyProtectionStore.getState();
    expect(state.canConfirmSafe).toBe(false);
    expect(state.riskLevel).toBe("high");
  });

  it("marks safe timestamp only when criteria are met", async () => {
    const now = new Date(2026, 1, 22, 11, 0, 0).getTime();
    const nowSpy = jest.spyOn(Date, "now").mockReturnValue(now);

    await useMoneyProtectionStore.getState().markSafeToday();
    expect(useMoneyProtectionStore.getState().lastSafeCheck).toBeNull();

    await useMoneyProtectionStore.getState().updateChecks({
      cardAway: true,
      alone: false,
      emotionalDistress: false,
      escapeNeed: false,
      emotionalVoid: false,
      bankAppHidden: true,
      paymentsDisabled: true,
    });

    await useMoneyProtectionStore.getState().markSafeToday();
    expect(useMoneyProtectionStore.getState().lastSafeCheck).toBe(now);

    nowSpy.mockRestore();
  });

  it("syncs with cloud state and stores last sync timestamp", async () => {
    const now = new Date(2026, 1, 22, 12, 0, 0).getTime();
    const nowSpy = jest.spyOn(Date, "now").mockReturnValue(now);
    const localState = {
      cardAway: true,
      alone: false,
      emotionalDistress: false,
      escapeNeed: false,
      emotionalVoid: false,
      bankAppHidden: true,
      paymentsDisabled: true,
      lastSafeCheck: null,
      dailyLimitTRY: 250,
      savedTodayTRY: 50,
      savedTodayDateKey: toDayKey(now),
      lockMinutes: 0,
      lockStartedAt: null,
      updatedAt: now,
    };

    const remoteState = {
      ...localState,
      dailyLimitTRY: 300,
      savedTodayTRY: 20,
      updatedAt: now + 5_000,
    };

    let storedState = localState;
    let storedLastSyncAt = 0;

    mockStorage.get.mockImplementation(async (key: string) => {
      if (key === STORAGE_KEYS.MONEY_PROTECTION_STATE) return storedState;
      if (key === STORAGE_KEYS.MONEY_PROTECTION_LAST_SYNC_AT) return storedLastSyncAt;
      return null;
    });

    mockStorage.set.mockImplementation(async (key: string, value: unknown) => {
      if (key === STORAGE_KEYS.MONEY_PROTECTION_STATE) {
        storedState = value as typeof localState;
      }
      if (key === STORAGE_KEYS.MONEY_PROTECTION_LAST_SYNC_AT) {
        storedLastSyncAt = Number(value ?? 0);
      }
    });

    mockSyncClient.mockResolvedValue({
      ok: true,
      state: remoteState,
      serverTime: now + 5_000,
      conflicts: 0,
    });

    setMoneyProtectionSyncClient(mockSyncClient);
    await useMoneyProtectionStore.getState().syncWithServer();

    expect(mockSyncClient).toHaveBeenCalledWith({
      state: expect.objectContaining({
        dailyLimitTRY: 250,
        updatedAt: now,
      }),
      lastSyncAt: 0,
    });

    expect(useMoneyProtectionStore.getState().dailyLimitTRY).toBe(300);
    expect(storedLastSyncAt).toBe(now + 5_000);
    nowSpy.mockRestore();
  });
});
