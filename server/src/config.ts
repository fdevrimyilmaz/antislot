/** Only Google Gemini is supported. The mobile-app consent prompt and the
 *  App Privacy declaration name Google as the sole AI processor; do not
 *  reintroduce other providers without updating those disclosures first. */
export type AiProvider = "gemini";

const nodeEnv = process.env.NODE_ENV ?? "development";
const isProduction = nodeEnv === "production";

export const config = {
  nodeEnv,
  port: Number(process.env.PORT || 3001),
  host: process.env.HOST || "0.0.0.0",
  aiProvider: "gemini" as AiProvider,

  geminiApiKey: process.env.GEMINI_API_KEY || "",
  geminiModel: process.env.GEMINI_MODEL || "gemini-2.5-flash",
  geminiBaseUrl:
    process.env.GEMINI_BASE_URL || "https://generativelanguage.googleapis.com/v1beta",

  databaseUrl: process.env.DATABASE_URL || "",
  iapValidatorUrl: process.env.IAP_VALIDATOR_URL || "",
  alertWebhookUrl: process.env.ALERT_WEBHOOK_URL || "",
  allowDevReceiptBypass:
    process.env.ALLOW_DEV_RECEIPT_BYPASS === "true" ||
    process.env.ALLOW_DEV_RECEIPT_BYPASS === "1",
  premiumIdempotencyDbPath:
    process.env.PREMIUM_IDEMPOTENCY_DB_PATH || "data/premium-idempotency.db",
  premiumRedeemCodes: (
    process.env.PREMIUM_CODE_ALLOWLIST ||
    process.env.PREMIUM_REDEEM_CODES ||
    ""
  )
    .split(",")
    .map((c) => c.trim().toUpperCase())
    .filter((c) => c.length > 0),
  apple: {
    rootCertDir: process.env.APPLE_ROOT_CERT_DIR || "certs/apple",
    bundleId: process.env.APPLE_BUNDLE_ID || "com.antislot.app",
    environment: (process.env.APPLE_ENV || (isProduction ? "production" : "sandbox")).toLowerCase(),
    appAppleId: process.env.APPLE_APP_APPLE_ID
      ? Number(process.env.APPLE_APP_APPLE_ID)
      : undefined,
    enableOnlineRevocationCheck:
      process.env.APPLE_VERIFY_ONLINE_REVOCATION === "true" ||
      process.env.APPLE_VERIFY_ONLINE_REVOCATION === "1",
  },
  isProduction,
};

function validateAiConfig(): void {
  if (!config.geminiApiKey) {
    throw new Error("GEMINI_API_KEY is required (Gemini is the only supported AI provider)");
  }
}

function validateProductionConfig(): void {
  if (!config.isProduction) return;

  if (!config.databaseUrl) {
    throw new Error("Production requires DATABASE_URL");
  }
  if (config.allowDevReceiptBypass) {
    throw new Error("ALLOW_DEV_RECEIPT_BYPASS cannot be true in production");
  }
  if (!config.iapValidatorUrl) {
    throw new Error("Production requires IAP_VALIDATOR_URL");
  }
}

validateAiConfig();
validateProductionConfig();
