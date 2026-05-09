import { promises as fs } from "fs";
import os from "os";
import path from "path";
import request from "supertest";

jest.setTimeout(90000);

const ALL_FEATURES = [
  "blocker",
  "live_support",
  "advanced_stats",
  "premium_sessions",
  "premium_insights",
  "premium_ai_features",
];

type ReceiptSource =
  | "subscription_monthly"
  | "subscription_quarterly"
  | "subscription_semiannual"
  | "subscription_yearly";

const RECEIPT_SOURCE_CASES: Array<{
  receipt: string;
  source: ReceiptSource;
  productId: string;
}> = [
  {
    receipt: "receipt-monthly",
    source: "subscription_monthly",
    productId: "antislot_premium_monthly",
  },
  {
    receipt: "receipt-quarterly",
    source: "subscription_quarterly",
    productId: "antislot_premium_3m",
  },
  {
    receipt: "receipt-semiannual",
    source: "subscription_semiannual",
    productId: "antislot_premium_6m",
  },
  {
    receipt: "receipt-yearly",
    source: "subscription_yearly",
    productId: "antislot_premium_yearly",
  },
];

describe("Premium receipt activation", () => {
  const envSnapshot = { ...process.env };
  const tempDirs: string[] = [];

  async function getApp() {
    jest.resetModules();
    const env = process.env as Record<string, string | undefined>;

    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "antislot-premium-receipt-"));
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
    env.IAP_PRODUCT_MONTHLY = "antislot_premium_monthly";
    env.IAP_PRODUCT_QUARTERLY = "antislot_premium_3m";
    env.IAP_PRODUCT_SEMIANNUAL = "antislot_premium_6m";
    env.IAP_PRODUCT_YEARLY = "antislot_premium_yearly";

    jest.doMock("../firebase-auth", () => ({
      verifyFirebaseBearerToken: jest.fn(async () => "premium-receipt-user"),
    }));

    jest.doMock("../iap-validator", () => ({
      validateReceipt: jest.fn(
        async (receipt: string): Promise<{
          ok: boolean;
          active: boolean;
          source: ReceiptSource;
          productId: string;
          expiresAt: number;
          transactionId: string;
          eventId: string;
        }> => {
          const match = RECEIPT_SOURCE_CASES.find((item) => item.receipt === receipt);
          const source = match?.source ?? "subscription_monthly";
          const productId = match?.productId ?? "antislot_premium_monthly";
          const now = Date.now();
          return {
            ok: true,
            active: true,
            source,
            productId,
            expiresAt: now + 30 * 24 * 60 * 60 * 1000,
            transactionId: `${receipt}-${now}`,
            eventId: `evt-${receipt}-${now}`,
          };
        }
      ),
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

  it.each(RECEIPT_SOURCE_CASES)(
    "activates %s receipt and unlocks all premium capabilities",
    async ({ receipt, source }) => {
      const app = await getApp();

      const activateRes = await request(app)
        .post("/v1/premium/activate")
        .set("Authorization", "Bearer firebase-test-token")
        .send({ receipt, platform: "ios" });

      expect(activateRes.status).toBe(200);
      expect(activateRes.body?.ok).toBe(true);
      expect(activateRes.body?.state?.isActive).toBe(true);
      expect(activateRes.body?.state?.source).toBe(source);
      expect(new Set(activateRes.body?.state?.features ?? [])).toEqual(new Set(ALL_FEATURES));

      const statusRes = await request(app)
        .get("/v1/premium/status")
        .set("Authorization", "Bearer firebase-test-token");

      expect(statusRes.status).toBe(200);
      expect(statusRes.body?.ok).toBe(true);
      expect(statusRes.body?.state?.isActive).toBe(true);
      expect(statusRes.body?.state?.source).toBe(source);
      expect(new Set(statusRes.body?.state?.features ?? [])).toEqual(new Set(ALL_FEATURES));
    }
  );
});
