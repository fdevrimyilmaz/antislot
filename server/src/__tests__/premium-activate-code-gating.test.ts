import { promises as fs } from "fs";
import os from "os";
import path from "path";
import request from "supertest";

// This suite boots the full server module twice; allow extra headroom on slower CI agents.
jest.setTimeout(90000);

describe("Premium activate code gating", () => {
  const envSnapshot = { ...process.env };
  const tempDirs: string[] = [];

  async function getApp(overrides?: Record<string, string>) {
    jest.resetModules();
    const env = process.env as Record<string, string | undefined>;

    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "antislot-premium-code-"));
    tempDirs.push(tmpDir);

    env.NODE_ENV = "test";
    env.CORS_ALLOWLIST = "http://localhost:3001";
    env.REQUIRE_API_AUTH = "false";
    env.API_AUTH_TOKEN = "";
    env.FIREBASE_PROJECT_ID = "test-project";
    env.IAP_WEBHOOK_SECRET = "test-webhook-secret";
    env.PREMIUM_DATA_FILE = path.join(tmpDir, "premium-state.json");
    env.DIARY_DATA_FILE = path.join(tmpDir, "diary-state.json");
    env.URGE_DATA_FILE = path.join(tmpDir, "urge-state.json");
    env.MONEY_PROTECTION_DATA_FILE = path.join(tmpDir, "money-protection-state.json");
    env.THERAPY_CALLBACK_DATA_FILE = path.join(tmpDir, "therapy-callback-state.json");
    env.ENABLE_PREMIUM_CODE_ACTIVATION = "false";
    env.PREMIUM_CODE_ALLOWLIST = "TESTCODE";

    for (const [key, value] of Object.entries(overrides ?? {})) {
      env[key] = value;
    }

    jest.doMock("../firebase-auth", () => ({
      verifyFirebaseBearerToken: jest.fn(async () => "premium-test-user"),
    }));

    const mod = await import("../index");
    return mod.app;
  }

  afterAll(async () => {
    const env = process.env as Record<string, string | undefined>;
    for (const key of Object.keys(env)) {
      if (!(key in envSnapshot)) {
        delete env[key];
      }
    }
    for (const [key, value] of Object.entries(envSnapshot)) {
      env[key] = value;
    }
    for (const dir of tempDirs) {
      await fs.rm(dir, { recursive: true, force: true });
    }
  });

  it("rejects activation code flow when disabled", async () => {
    const app = await getApp({
      ENABLE_PREMIUM_CODE_ACTIVATION: "false",
      PREMIUM_CODE_ALLOWLIST: "TESTCODE",
    });

    const res = await request(app)
      .post("/v1/premium/activate")
      .set("Authorization", "Bearer firebase-test-token")
      .send({ code: "TESTCODE" });

    expect(res.status).toBe(400);
    expect(res.body?.ok).toBe(false);
    expect(res.body?.error?.code).toBe("PREMIUM_VALIDATION_FAILED");
    expect(String(res.body?.error?.message ?? "")).toContain("disabled");
  });

  it("accepts activation code flow when enabled and allowlisted", async () => {
    const app = await getApp({
      ENABLE_PREMIUM_CODE_ACTIVATION: "true",
      PREMIUM_CODE_ALLOWLIST: "TESTCODE",
    });

    const res = await request(app)
      .post("/v1/premium/activate")
      .set("Authorization", "Bearer firebase-test-token")
      .send({ code: "TESTCODE" });

    expect(res.status).toBe(200);
    expect(res.body?.ok).toBe(true);
    expect(res.body?.state?.isActive).toBe(true);
    expect(res.body?.state?.source).toBe("code");
  });
});
