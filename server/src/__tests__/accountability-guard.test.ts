import {
  evaluateAccountabilityGuard,
  recordAccountabilityGuardSuccess,
  type AccountabilityGuardPolicy,
} from "../accountability-guard";
import type { AccountabilityAlertDelivery } from "../accountability-alert";

const POLICY: AccountabilityGuardPolicy = {
  cooldownMs: 20 * 60 * 1000,
  dailyLimit: 3,
  idempotencyWindowMs: 10 * 60 * 1000,
};

const SENT_DELIVERY: AccountabilityAlertDelivery = {
  delivery: "sent",
  provider: "twilio",
  fallbackRequired: false,
  messageId: "SM_TEST",
};

describe("accountability-guard", () => {
  it("allows first send and enforces cooldown", () => {
    const store = new Map();
    const userId = "user-1";
    const now = Date.UTC(2026, 2, 3, 12, 0, 0);

    const first = evaluateAccountabilityGuard({ userId, now }, POLICY, store);
    expect(first.kind).toBe("allow");

    recordAccountabilityGuardSuccess(
      {
        userId,
        now,
        delivery: SENT_DELIVERY,
      },
      POLICY,
      store
    );

    const cooldown = evaluateAccountabilityGuard(
      {
        userId,
        now: now + 60_000,
      },
      POLICY,
      store
    );

    expect(cooldown.kind).toBe("deny");
    if (cooldown.kind === "deny") {
      expect(cooldown.reason).toBe("cooldown");
      expect(cooldown.retryAfterMs).toBeGreaterThan(0);
    }
  });

  it("enforces daily limit and resets on next UTC day", () => {
    const store = new Map();
    const userId = "user-2";
    const now = Date.UTC(2026, 2, 3, 20, 0, 0);

    for (let i = 0; i < POLICY.dailyLimit; i += 1) {
      const decision = evaluateAccountabilityGuard({ userId, now: now + i * POLICY.cooldownMs }, POLICY, store);
      expect(decision.kind).toBe("allow");
      recordAccountabilityGuardSuccess(
        {
          userId,
          now: now + i * POLICY.cooldownMs,
          delivery: SENT_DELIVERY,
        },
        POLICY,
        store
      );
    }

    const blocked = evaluateAccountabilityGuard(
      {
        userId,
        now: now + POLICY.dailyLimit * POLICY.cooldownMs,
      },
      POLICY,
      store
    );
    expect(blocked.kind).toBe("deny");
    if (blocked.kind === "deny") {
      expect(blocked.reason).toBe("daily_limit");
      expect(blocked.retryAfterMs).toBeGreaterThan(0);
    }

    const nextDay = Date.UTC(2026, 2, 4, 0, 1, 0);
    const reset = evaluateAccountabilityGuard({ userId, now: nextDay }, POLICY, store);
    expect(reset.kind).toBe("allow");
  });

  it("deduplicates by idempotency key during window", () => {
    const store = new Map();
    const userId = "user-3";
    const key = "idem-123";
    const now = Date.UTC(2026, 2, 3, 10, 0, 0);

    const decision = evaluateAccountabilityGuard(
      {
        userId,
        idempotencyKey: key,
        now,
      },
      POLICY,
      store
    );
    expect(decision.kind).toBe("allow");

    recordAccountabilityGuardSuccess(
      {
        userId,
        idempotencyKey: key,
        now,
        delivery: SENT_DELIVERY,
      },
      POLICY,
      store
    );

    const duplicate = evaluateAccountabilityGuard(
      {
        userId,
        idempotencyKey: key,
        now: now + 30_000,
      },
      POLICY,
      store
    );
    expect(duplicate.kind).toBe("duplicate");
    if (duplicate.kind === "duplicate") {
      expect(duplicate.delivery).toEqual(SENT_DELIVERY);
    }
  });
});
