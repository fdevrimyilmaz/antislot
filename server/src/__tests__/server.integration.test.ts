import http from "http";
import request from "supertest";

jest.setTimeout(30000);

describe("Server Integration", () => {
  let coreServer: http.Server;
  let corePort = 0;

  beforeAll(async () => {
    coreServer = http.createServer((req, res) => {
      if (req.url === "/v1/blocklist" && req.method === "GET") {
        res.statusCode = 200;
        res.setHeader("Content-Type", "application/json");
        res.end(
          JSON.stringify({
            version: 1,
            updatedAt: 1,
            domains: ["bet365.com"],
            signature: "sig",
          })
        );
        return;
      }
      if (req.url === "/v1/health" && req.method === "GET") {
        res.statusCode = 200;
        res.setHeader("Content-Type", "application/json");
        res.end(
          JSON.stringify({
            status: "ok",
            ts: Date.now(),
          })
        );
        return;
      }
      if (req.url === "/v1/patterns" && req.method === "GET") {
        res.statusCode = 200;
        res.setHeader("Content-Type", "application/json");
        res.end(
          JSON.stringify({
            version: 1,
            updatedAt: 1,
            patterns: [{ pattern: "bet", type: "contains", weight: 0.7 }],
            signature: "sig",
          })
        );
        return;
      }
      if (req.url === "/v1/verify-signature" && req.method === "POST") {
        let raw = "";
        req.on("data", (chunk) => {
          raw += String(chunk);
        });
        req.on("end", () => {
          const body = raw ? JSON.parse(raw) : {};
          const signature = typeof body?.signature === "string" ? body.signature : "";
          res.statusCode = 200;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({ ok: signature === "sig" }));
        });
        return;
      }
      res.statusCode = 404;
      res.end();
    });

    await new Promise<void>((resolve) => {
      coreServer.listen(0, "127.0.0.1", () => {
        const addr = coreServer.address();
        if (addr && typeof addr === "object") {
          corePort = addr.port;
        }
        resolve();
      });
    });
  });

  afterAll(async () => {
    await new Promise<void>((resolve, reject) => {
      coreServer.close((err) => (err ? reject(err) : resolve()));
    });
  });

  async function getApp(overrides?: Record<string, string>) {
    jest.resetModules();
    (process.env as Record<string, string | undefined>).NODE_ENV = "test";
    process.env.CORS_ALLOWLIST = "http://localhost:3001";
    process.env.REQUIRE_API_AUTH = "true";
    process.env.API_AUTH_TOKEN = "integration-token";
    process.env.CORE_BACKEND_URL = `http://127.0.0.1:${corePort}`;
    process.env.CORE_BACKEND_TIMEOUT_MS = "12000";
    process.env.ENABLE_METRICS_ENDPOINT = "true";
    process.env.METRICS_AUTH_TOKEN = "metrics-token";
    process.env.IAP_WEBHOOK_SECRET = "webhook-integration-secret";
    process.env.ADMIN_PROXY_AUTH_REQUIRED = "false";
    process.env.ADMIN_PROXY_SHARED_SECRET = "";
    process.env.ADMIN_PROXY_SECRET_HEADER = "x-admin-proxy-secret";
    process.env.ADMIN_PROXY_USER_HEADER = "x-auth-request-email";
    process.env.ADMIN_PROXY_GROUPS_HEADER = "x-auth-request-groups";
    process.env.ADMIN_PROXY_ALLOWED_USERS = "";
    process.env.ADMIN_PROXY_ALLOWED_GROUPS = "";
    for (const [key, value] of Object.entries(overrides ?? {})) {
      process.env[key] = value;
    }
    const mod = await import("../index");
    return mod.app;
  }

  it("proxies /v1/blocklist from core backend", async () => {
    const app = await getApp();
    const res = await request(app).get("/v1/blocklist");

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      version: 1,
      updatedAt: 1,
      domains: ["bet365.com"],
      signature: "sig",
    });
  });

  it("proxies /v1/verify-signature from core backend", async () => {
    const app = await getApp();
    const res = await request(app)
      .post("/v1/verify-signature")
      .send({
        payload: { version: 1, domains: ["bet365.com"] },
        signature: "sig",
      });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true });
  });

  it("returns health payload with observability metadata", async () => {
    const app = await getApp();
    const res = await request(app).get("/v1/health");

    expect(res.status).toBe(200);
    expect(res.body?.ok).toBe(true);
    expect(res.body?.status).toBe("up");
    expect(res.body?.ready).toBe(true);
    expect(typeof res.body?.uptimeSec).toBe("number");
    expect(typeof res.body?.observability?.sentryEnabled).toBe("boolean");
    expect(typeof res.body?.runtime?.avgDurationMs).toBe("number");
  });

  it("returns ready status for dependency checks", async () => {
    const app = await getApp();
    const res = await request(app).get("/v1/ready");

    expect(res.status).toBe(200);
    expect(res.body?.ok).toBe(true);
    expect(res.body?.status).toBe("ready");
    expect(Array.isArray(res.body?.blockers)).toBe(true);
  });

  it("returns prometheus metrics when authorized", async () => {
    const app = await getApp();
    const res = await request(app)
      .get("/v1/metrics")
      .set("Authorization", "Bearer metrics-token");

    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toContain("text/plain");
    expect(res.text).toContain("antislot_runtime_requests_total");
    expect(res.text).toContain("antislot_openai_circuit_state");
  });

  it("rejects metrics without auth", async () => {
    const app = await getApp();
    const res = await request(app).get("/v1/metrics");

    expect(res.status).toBe(401);
    expect(res.body?.ok).toBe(false);
    expect(res.body?.error?.code).toBe("UNAUTHORIZED");
  });

  it("returns 503 on /v1/ready when core backend is unavailable", async () => {
    const app = await getApp({
      CORE_BACKEND_URL: "http://127.0.0.1:9",
      CORE_BACKEND_TIMEOUT_MS: "200",
      CORE_HEALTH_TIMEOUT_MS: "200",
      CORE_HEALTH_CACHE_MS: "1",
    });
    const res = await request(app).get("/v1/ready");

    expect(res.status).toBe(503);
    expect(res.body?.ok).toBe(false);
    expect(Array.isArray(res.body?.blockers)).toBe(true);
    expect(res.body?.blockers).toContain("core_backend_unreachable");
  });

  it("returns 502 when core backend is unreachable", async () => {
    const app = await getApp({
      CORE_BACKEND_URL: "http://127.0.0.1:9",
      CORE_BACKEND_TIMEOUT_MS: "200",
    });
    const res = await request(app).get("/v1/blocklist");

    expect(res.status).toBe(502);
    expect(res.body?.ok).toBe(false);
    expect(res.body?.error?.code).toBe("UPSTREAM_ERROR");
  });

  it("returns 503 when core backend request times out", async () => {
    const hangingServer = http.createServer((_req, _res) => {
      // Intentionally keep the connection open so timeout path is exercised.
    });

    let hangingPort = 0;
    await new Promise<void>((resolve) => {
      hangingServer.listen(0, "127.0.0.1", () => {
        const addr = hangingServer.address();
        if (addr && typeof addr === "object") {
          hangingPort = addr.port;
        }
        resolve();
      });
    });

    try {
      const app = await getApp({
        CORE_BACKEND_URL: `http://127.0.0.1:${hangingPort}`,
        CORE_BACKEND_TIMEOUT_MS: "50",
      });
      const res = await request(app).get("/v1/blocklist");

      expect(res.status).toBe(503);
      expect(res.body?.ok).toBe(false);
      expect(res.body?.error?.code).toBe("SERVICE_UNAVAILABLE");
    } finally {
      await new Promise<void>((resolve, reject) => {
        hangingServer.close((err) => (err ? reject(err) : resolve()));
      });
    }
  });

  it("returns auth error format on missing token", async () => {
    const app = await getApp();
    const res = await request(app).get("/v1/premium/status");

    expect(res.status).toBe(401);
    expect(res.body?.ok).toBe(false);
    expect(res.body?.error?.code).toBe("UNAUTHORIZED");
    expect(typeof res.body?.error?.requestId).toBe("string");
  });

  it("rejects /v1/premium/status with API auth token (user routes require Firebase token)", async () => {
    const app = await getApp();
    const res = await request(app)
      .get("/v1/premium/status")
      .set("Authorization", "Bearer integration-token")
      .set("X-User-Id", "user-1");

    expect(res.status).toBe(401);
    expect(res.body?.ok).toBe(false);
    expect(res.body?.error?.code).toBe("UNAUTHORIZED");
  });

  it("returns auth error format on diary sync without Firebase token", async () => {
    const app = await getApp();
    const res = await request(app)
      .post("/v1/diary/sync")
      .set("Authorization", "Bearer integration-token")
      .set("X-User-Id", "user-1")
      .send({ entries: [], lastSyncAt: 0 });

    expect(res.status).toBe(401);
    expect(res.body?.ok).toBe(false);
    expect(res.body?.error?.code).toBe("UNAUTHORIZED");
  });

  it("returns auth error format on urge sync without Firebase token", async () => {
    const app = await getApp();
    const res = await request(app)
      .post("/v1/urge/sync")
      .set("Authorization", "Bearer integration-token")
      .set("X-User-Id", "user-1")
      .send({ logs: [], lastSyncAt: 0 });

    expect(res.status).toBe(401);
    expect(res.body?.ok).toBe(false);
    expect(res.body?.error?.code).toBe("UNAUTHORIZED");
  });

  it("returns auth error format on money protection sync without Firebase token", async () => {
    const app = await getApp();
    const res = await request(app)
      .post("/v1/money-protection/sync")
      .set("Authorization", "Bearer integration-token")
      .set("X-User-Id", "user-1")
      .send({ state: {}, lastSyncAt: 0 });

    expect(res.status).toBe(401);
    expect(res.body?.ok).toBe(false);
    expect(res.body?.error?.code).toBe("UNAUTHORIZED");
  });

  it("returns auth error format on money protection history without Firebase token", async () => {
    const app = await getApp();
    const res = await request(app)
      .get("/v1/money-protection/history")
      .set("Authorization", "Bearer integration-token")
      .set("X-User-Id", "user-1");

    expect(res.status).toBe(401);
    expect(res.body?.ok).toBe(false);
    expect(res.body?.error?.code).toBe("UNAUTHORIZED");
  });

  it("uses Gemini provider for /v1/chat when configured", async () => {
    const app = await getApp({
      AI_PROVIDER: "gemini",
      GEMINI_API_KEY: "gemini-test-key",
      OPENAI_API_KEY: "",
    });

    const originalFetch = global.fetch;
    const mockFetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        modelVersion: "gemini-2.0-flash",
        candidates: [
          {
            content: {
              parts: [{ text: "Gemini integration reply" }],
            },
          },
        ],
      }),
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (global as any).fetch = mockFetch;

    try {
      const res = await request(app)
        .post("/v1/chat")
        .set("Authorization", "Bearer integration-token")
        .set("X-User-Id", "user-1")
        .send({
          messages: [{ role: "user", content: "Merhaba" }],
          locale: "en",
          coachingContext: {
            locale: "en",
            riskLevel: "high",
            suggestedIntensity: 8,
            trigger: "financial",
            focus: "User statement: debt stress is increasing tonight.",
            actionPlan: ["Start a 10-minute delay window.", "Temporarily lock the card."],
          },
        });

      expect(res.status).toBe(200);
      expect(res.body?.ok).toBe(true);
      expect(res.body?.reply).toBe("Gemini integration reply");
      expect(mockFetch).toHaveBeenCalled();
      expect(String(mockFetch.mock.calls[0]?.[0] ?? "")).toContain(":generateContent?key=");
      const upstreamBody = JSON.parse(String(mockFetch.mock.calls[0]?.[1]?.body ?? "{}"));
      const systemPrompt = String(upstreamBody?.contents?.[0]?.parts?.[0]?.text ?? "");
      expect(systemPrompt).toContain("Risk level: high");
      expect(systemPrompt).toContain("Priority actions:");
    } finally {
      global.fetch = originalFetch;
    }
  });

  it("returns auth error format on therapy callback request without Firebase token", async () => {
    const app = await getApp();
    const res = await request(app)
      .post("/v1/therapy/callback")
      .set("Authorization", "Bearer integration-token")
      .set("X-User-Id", "user-1")
      .send({
        phone: "+1 (415) 555-0100",
        note: "Need support",
        locale: "en",
      });

    expect(res.status).toBe(401);
    expect(res.body?.ok).toBe(false);
    expect(res.body?.error?.code).toBe("UNAUTHORIZED");
  });

  it("returns auth error format on therapy callback history without Firebase token", async () => {
    const app = await getApp();
    const res = await request(app)
      .get("/v1/therapy/callback/history")
      .set("Authorization", "Bearer integration-token")
      .set("X-User-Id", "user-1");

    expect(res.status).toBe(401);
    expect(res.body?.ok).toBe(false);
    expect(res.body?.error?.code).toBe("UNAUTHORIZED");
  });

  it("returns auth error format on accountability alert without Firebase token", async () => {
    const app = await getApp();
    const res = await request(app)
      .post("/v1/accountability/alert")
      .set("Authorization", "Bearer integration-token")
      .set("X-User-Id", "user-1")
      .send({
        phone: "+14155550100",
        message: "High-risk signal detected. Please check in.",
      });

    expect(res.status).toBe(401);
    expect(res.body?.ok).toBe(false);
    expect(res.body?.error?.code).toBe("UNAUTHORIZED");
  });

  it("allows internal queue listing with API auth token", async () => {
    const app = await getApp();
    const res = await request(app)
      .get("/v1/therapy/callback/queue")
      .set("Authorization", "Bearer integration-token");

    expect(res.status).toBe(200);
    expect(res.body?.ok).toBe(true);
    expect(Array.isArray(res.body?.requests)).toBe(true);
    expect(typeof res.body?.totalQueued).toBe("number");
  });

  it("allows queue listing with reverse-proxy admin headers when required", async () => {
    const app = await getApp({
      REQUIRE_API_AUTH: "false",
      API_AUTH_TOKEN: "",
      ADMIN_PROXY_AUTH_REQUIRED: "true",
      ADMIN_PROXY_SHARED_SECRET: "proxy-integration-secret",
      ADMIN_PROXY_ALLOWED_USERS: "ops@antislot.app",
    });

    const res = await request(app)
      .get("/v1/therapy/callback/queue")
      .set("X-Admin-Proxy-Secret", "proxy-integration-secret")
      .set("X-Auth-Request-Email", "ops@antislot.app");

    expect(res.status).toBe(200);
    expect(res.body?.ok).toBe(true);
    expect(Array.isArray(res.body?.requests)).toBe(true);
  });

  it("rejects queue listing when proxy auth is required but missing headers", async () => {
    const app = await getApp({
      REQUIRE_API_AUTH: "false",
      API_AUTH_TOKEN: "",
      ADMIN_PROXY_AUTH_REQUIRED: "true",
      ADMIN_PROXY_SHARED_SECRET: "proxy-integration-secret",
    });

    const res = await request(app).get("/v1/therapy/callback/queue");

    expect(res.status).toBe(401);
    expect(res.body?.ok).toBe(false);
    expect(res.body?.error?.code).toBe("UNAUTHORIZED");
  });

  it("rejects queue listing when proxy user is not allowlisted", async () => {
    const app = await getApp({
      REQUIRE_API_AUTH: "false",
      API_AUTH_TOKEN: "",
      ADMIN_PROXY_AUTH_REQUIRED: "true",
      ADMIN_PROXY_SHARED_SECRET: "proxy-integration-secret",
      ADMIN_PROXY_ALLOWED_USERS: "allowed@antislot.app",
    });

    const res = await request(app)
      .get("/v1/therapy/callback/queue")
      .set("X-Admin-Proxy-Secret", "proxy-integration-secret")
      .set("X-Auth-Request-Email", "ops@antislot.app");

    expect(res.status).toBe(401);
    expect(res.body?.ok).toBe(false);
    expect(res.body?.error?.code).toBe("UNAUTHORIZED");
  });

  it("updates callback status via internal admin route", async () => {
    const app = await getApp();
    const { enqueueTherapyCallback } = await import("../therapy-callback");
    const queued = await enqueueTherapyCallback(
      "integration-admin-user",
      { phone: "+1 (415) 555-0199", locale: "en" },
      "support@antislot.app"
    );

    const res = await request(app)
      .patch(`/v1/therapy/callback/${queued.requestId}/status`)
      .set("Authorization", "Bearer integration-token")
      .send({
        status: "closed",
        adminNote: "Resolved in integration test",
      });

    expect(res.status).toBe(200);
    expect(res.body?.ok).toBe(true);
    expect(res.body?.request?.requestId).toBe(queued.requestId);
    expect(res.body?.request?.status).toBe("closed");
    expect(res.body?.request?.adminNote).toBe("Resolved in integration test");
  });

  it("rejects invalid admin status update payload", async () => {
    const app = await getApp();
    const res = await request(app)
      .patch("/v1/therapy/callback/not-real/status")
      .set("Authorization", "Bearer integration-token")
      .send({ status: "invalid" });

    expect(res.status).toBe(400);
    expect(res.body?.ok).toBe(false);
    expect(res.body?.error?.code).toBe("BAD_REQUEST");
  });

  describe("IAP webhook", () => {
    it("rejects webhook without token", async () => {
      const app = await getApp();
      const res = await request(app)
        .post("/v1/iap/webhook")
        .send({
          eventId: "evt-1",
          userId: "user-wh",
          transactionId: "tx-1",
          productId: "antislot_premium_monthly",
          source: "subscription_monthly",
          platform: "ios",
          type: "renewal",
        });
      expect(res.status).toBe(401);
      expect(res.body?.ok).toBe(false);
    });

    it("rejects webhook with invalid token", async () => {
      const app = await getApp();
      const res = await request(app)
        .post("/v1/iap/webhook")
        .set("Authorization", "Bearer wrong-token")
        .send({
          eventId: "evt-1",
          userId: "user-wh",
          transactionId: "tx-1",
          productId: "antislot_premium_monthly",
          source: "subscription_monthly",
          platform: "ios",
          type: "renewal",
        });
      expect(res.status).toBe(401);
    });

    it("rejects webhook with invalid payload (missing fields)", async () => {
      const app = await getApp();
      const res = await request(app)
        .post("/v1/iap/webhook")
        .set("Authorization", "Bearer webhook-integration-secret")
        .send({
          eventId: "evt-1",
          userId: "user-wh",
          // missing: transactionId, productId, source, type
        });
      expect(res.status).toBe(400);
      expect(res.body?.error?.code).toBe("BAD_REQUEST");
    });

    it("accepts renewal webhook and returns state", async () => {
      const app = await getApp();
      const body = {
        eventId: `evt-renewal-${Date.now()}`,
        userId: "user-webhook-test",
        transactionId: `tx-renew-${Date.now()}`,
        productId: "antislot_premium_yearly",
        source: "subscription_yearly" as const,
        platform: "ios" as const,
        type: "renewal" as const,
        expiresAt: Date.now() + 365 * 24 * 60 * 60 * 1000,
      };
      const res = await request(app)
        .post("/v1/iap/webhook")
        .set("Authorization", "Bearer webhook-integration-secret")
        .send(body);
      expect(res.status).toBe(200);
      expect(res.body?.ok).toBe(true);
      expect(res.body?.state).toBeDefined();
      expect(res.body?.state?.isActive).toBe(true);
      expect(res.body?.state?.source).toBe("subscription_yearly");
    });

    it("accepts cancel webhook and updates state", async () => {
      const app = await getApp();
      const body = {
        eventId: `evt-cancel-${Date.now()}`,
        userId: "user-webhook-cancel",
        transactionId: `tx-cancel-${Date.now()}`,
        productId: "antislot_premium_monthly",
        source: "subscription_monthly" as const,
        platform: "android" as const,
        type: "cancel" as const,
      };
      const res = await request(app)
        .post("/v1/iap/webhook")
        .set("Authorization", "Bearer webhook-integration-secret")
        .send(body);
      expect(res.status).toBe(200);
      expect(res.body?.ok).toBe(true);
      expect(res.body?.state?.isActive).toBe(false);
    });

    it("is idempotent: duplicate event returns same state without re-processing", async () => {
      const app = await getApp();
      const eventId = `evt-idem-${Date.now()}`;
      const body = {
        eventId,
        userId: "user-idem",
        transactionId: `tx-idem-${Date.now()}`,
        productId: "antislot_premium_yearly",
        source: "subscription_yearly" as const,
        platform: "ios" as const,
        type: "renewal" as const,
        expiresAt: Date.now() + 365 * 24 * 60 * 60 * 1000,
      };
      const res1 = await request(app)
        .post("/v1/iap/webhook")
        .set("Authorization", "Bearer webhook-integration-secret")
        .send(body);
      const res2 = await request(app)
        .post("/v1/iap/webhook")
        .set("Authorization", "Bearer webhook-integration-secret")
        .send(body);
      expect(res1.status).toBe(200);
      expect(res2.status).toBe(200);
      expect(res1.body?.ok).toBe(true);
      expect(res2.body?.ok).toBe(true);
      expect(res1.body?.state?.isActive).toBe(true);
      expect(res2.body?.state?.isActive).toBe(true);
    });
  });
});
