import type { AccountabilityAlertDelivery } from "./accountability-alert";

export type AccountabilityGuardPolicy = {
  cooldownMs: number;
  dailyLimit: number;
  idempotencyWindowMs: number;
};

type IdempotencyRecord = {
  expiresAt: number;
  delivery: AccountabilityAlertDelivery;
};

type UserGuardState = {
  dayKey: string;
  sentToday: number;
  lastSentAt: number;
  idempotency: Map<string, IdempotencyRecord>;
};

type GuardStore = Map<string, UserGuardState>;

export type AccountabilityGuardDecision =
  | {
      kind: "allow";
    }
  | {
      kind: "duplicate";
      delivery: AccountabilityAlertDelivery;
    }
  | {
      kind: "deny";
      reason: "cooldown" | "daily_limit";
      retryAfterMs: number;
    };

const stateByUser = new Map<string, UserGuardState>();

function utcDayKey(now: number): string {
  const date = new Date(now);
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}-${String(
    date.getUTCDate()
  ).padStart(2, "0")}`;
}

function msUntilUtcDayEnd(now: number): number {
  const date = new Date(now);
  const end = Date.UTC(
    date.getUTCFullYear(),
    date.getUTCMonth(),
    date.getUTCDate() + 1,
    0,
    0,
    0,
    0
  );
  return Math.max(1, end - now);
}

function normalizeUserId(userId: string): string {
  return userId.trim().slice(0, 255);
}

function normalizeIdempotencyKey(key?: string): string {
  if (!key) return "";
  return key.trim().slice(0, 100);
}

function ensureUserState(store: GuardStore, userId: string, now: number): UserGuardState {
  const normalizedUserId = normalizeUserId(userId);
  const existing = store.get(normalizedUserId);
  const today = utcDayKey(now);

  if (!existing) {
    const created: UserGuardState = {
      dayKey: today,
      sentToday: 0,
      lastSentAt: 0,
      idempotency: new Map<string, IdempotencyRecord>(),
    };
    store.set(normalizedUserId, created);
    return created;
  }

  if (existing.dayKey !== today) {
    existing.dayKey = today;
    existing.sentToday = 0;
  }

  for (const [key, record] of existing.idempotency.entries()) {
    if (record.expiresAt <= now) {
      existing.idempotency.delete(key);
    }
  }

  return existing;
}

export function evaluateAccountabilityGuard(
  input: {
    userId: string;
    idempotencyKey?: string;
    now: number;
  },
  policy: AccountabilityGuardPolicy,
  store: GuardStore = stateByUser
): AccountabilityGuardDecision {
  const userId = normalizeUserId(input.userId);
  if (!userId) {
    return {
      kind: "deny",
      reason: "daily_limit",
      retryAfterMs: policy.cooldownMs,
    };
  }

  const now = Math.max(1, Math.trunc(input.now));
  const state = ensureUserState(store, userId, now);
  const idempotencyKey = normalizeIdempotencyKey(input.idempotencyKey);
  const cooldownMs = Math.max(1000, Math.trunc(policy.cooldownMs));
  const dailyLimit = Math.max(1, Math.trunc(policy.dailyLimit));

  if (idempotencyKey) {
    const existing = state.idempotency.get(idempotencyKey);
    if (existing && existing.expiresAt > now) {
      return {
        kind: "duplicate",
        delivery: existing.delivery,
      };
    }
  }

  if (state.lastSentAt > 0 && now - state.lastSentAt < cooldownMs) {
    return {
      kind: "deny",
      reason: "cooldown",
      retryAfterMs: cooldownMs - (now - state.lastSentAt),
    };
  }

  if (state.sentToday >= dailyLimit) {
    return {
      kind: "deny",
      reason: "daily_limit",
      retryAfterMs: msUntilUtcDayEnd(now),
    };
  }

  return { kind: "allow" };
}

export function recordAccountabilityGuardSuccess(
  input: {
    userId: string;
    idempotencyKey?: string;
    now: number;
    delivery: AccountabilityAlertDelivery;
  },
  policy: AccountabilityGuardPolicy,
  store: GuardStore = stateByUser
): void {
  const userId = normalizeUserId(input.userId);
  if (!userId) return;
  const now = Math.max(1, Math.trunc(input.now));
  const state = ensureUserState(store, userId, now);
  state.lastSentAt = now;
  state.sentToday += 1;

  const idempotencyKey = normalizeIdempotencyKey(input.idempotencyKey);
  if (!idempotencyKey) return;

  const windowMs = Math.max(1000, Math.trunc(policy.idempotencyWindowMs));
  state.idempotency.set(idempotencyKey, {
    expiresAt: now + windowMs,
    delivery: input.delivery,
  });
}
