export type MoneyProtectionSyncState = {
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
};

export type MoneyProtectionSyncRequest = {
  state: MoneyProtectionSyncState;
  lastSyncAt: number;
};

export type MoneyProtectionSyncResponse = {
  ok: boolean;
  state: MoneyProtectionSyncState;
  serverTime: number;
  conflicts: number;
};
