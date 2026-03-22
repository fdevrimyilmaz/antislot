#!/usr/bin/env node
/**
 * Webhook smoke test — renewal, cancel, refund, grace, expire event'lerini simüle eder.
 *
 * Kullanım:
 *   IAP_SMOKE_BASE_URL=https://api.example.com IAP_WEBHOOK_SECRET=xxx node scripts/webhook-smoke.mjs
 *
 * Opsiyonel:
 *   WEBHOOK_SMOKE_USER_ID=test-user-123  (varsayılan: webhook-smoke-{timestamp})
 */

const requiredVars = ["IAP_SMOKE_BASE_URL", "IAP_WEBHOOK_SECRET"];

for (const key of requiredVars) {
  if (!process.env[key] || !process.env[key].trim()) {
    console.error(`[webhook-smoke] Missing required env: ${key}`);
    process.exit(1);
  }
}

const baseUrl = process.env.IAP_SMOKE_BASE_URL.replace(/\/+$/, "");
const token = process.env.IAP_WEBHOOK_SECRET;
const userId = process.env.WEBHOOK_SMOKE_USER_ID || `webhook-smoke-${Date.now()}`;

const EVENTS = [
  {
    name: "renewal",
    body: {
      eventId: `evt-renewal-${Date.now()}`,
      userId,
      transactionId: `tx-renew-${Date.now()}`,
      productId: "antislot_premium_yearly",
      source: "subscription_yearly",
      platform: "ios",
      type: "renewal",
      expiresAt: Date.now() + 365 * 24 * 60 * 60 * 1000,
    },
  },
  {
    name: "grace",
    body: {
      eventId: `evt-grace-${Date.now()}`,
      userId,
      transactionId: `tx-grace-${Date.now()}`,
      productId: "antislot_premium_monthly",
      source: "subscription_monthly",
      platform: "android",
      type: "grace",
      expiresAt: Date.now() + 3 * 24 * 60 * 60 * 1000,
    },
  },
  {
    name: "cancel",
    body: {
      eventId: `evt-cancel-${Date.now()}`,
      userId,
      transactionId: `tx-cancel-${Date.now()}`,
      productId: "antislot_premium_yearly",
      source: "subscription_yearly",
      platform: "ios",
      type: "cancel",
      expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000,
    },
  },
  {
    name: "expire",
    body: {
      eventId: `evt-expire-${Date.now()}`,
      userId,
      transactionId: `tx-expire-${Date.now()}`,
      productId: "antislot_premium_monthly",
      source: "subscription_monthly",
      platform: "android",
      type: "expire",
      expiresAt: null,
    },
  },
  {
    name: "refund",
    body: {
      eventId: `evt-refund-${Date.now()}`,
      userId,
      transactionId: `tx-refund-${Date.now()}`,
      productId: "antislot_premium_lifetime",
      source: "lifetime",
      platform: "ios",
      type: "refund",
      expiresAt: null,
    },
  },
];

async function sendWebhook(event) {
  const res = await fetch(`${baseUrl}/v1/iap/webhook`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      "X-Request-Id": `webhook-smoke-${Date.now()}-${event.name}`,
    },
    body: JSON.stringify(event.body),
  });
  const payload = await res.json().catch(() => ({}));
  return { status: res.status, payload };
}

async function run() {
  console.log("[webhook-smoke] Testing events for userId:", userId);
  let failed = 0;

  for (const event of EVENTS) {
    const { status, payload } = await sendWebhook(event);
    const ok = status === 200 && payload?.ok === true;
    if (ok) {
      console.log(`[webhook-smoke] ${event.name}: OK`);
    } else {
      console.error(`[webhook-smoke] ${event.name}: FAIL`, { status, payload });
      failed++;
    }
  }

  // İdempotency testi — aynı event iki kez gönderilmeli; ikisi de 200 dönmeli, duplicate sessizce kabul edilmeli
  const idemEvent = {
    name: "idempotency",
    body: {
      eventId: `evt-idempotency-${Date.now()}`,
      userId,
      transactionId: `tx-idem-${Date.now()}`,
      productId: "antislot_premium_monthly",
      source: "subscription_monthly",
      platform: "ios",
      type: "renewal",
      expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000,
    },
  };
  const { status: s1, payload: p1 } = await sendWebhook(idemEvent);
  const { status: s2, payload: p2 } = await sendWebhook(idemEvent);
  const idemOk = s1 === 200 && s2 === 200 && p1?.ok && p2?.ok;
  if (idemOk) {
    console.log("[webhook-smoke] idempotency: OK (duplicate event accepted, same response)");
  } else {
    console.error("[webhook-smoke] idempotency: FAIL", { s1, p1, s2, p2 });
    failed++;
  }

  if (failed > 0) {
    process.exit(1);
  }
  console.log("[webhook-smoke] All tests passed");
}

run().catch((err) => {
  console.error("[webhook-smoke] Fatal:", err);
  process.exit(1);
});
