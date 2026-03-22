export type MoneyProtectionCloudState = {
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

export type MoneyProtectionSyncResult = {
  state: MoneyProtectionCloudState;
  serverTime: number;
  conflicts: number;
};

export type MoneyProtectionCloudEvent = {
  id: string;
  source: "sync";
  createdAt: number;
  localUpdatedAt: number;
  resolvedUpdatedAt: number;
  conflicts: number;
  state: MoneyProtectionCloudState;
};
