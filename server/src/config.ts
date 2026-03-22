/* eslint-disable expo/no-dynamic-env-var */

function parseIntEnv(key: string, fallback: number): number {
  const raw = process.env[key];
  if (!raw) return fallback;
  const value = Number.parseInt(raw, 10);
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`Invalid ${key}: must be a positive integer`);
  }
  return value;
}

function parseNonNegativeIntEnv(key: string, fallback: number): number {
  const raw = process.env[key];
  if (!raw) return fallback;
  const value = Number.parseInt(raw, 10);
  if (!Number.isFinite(value) || value < 0) {
    throw new Error(`Invalid ${key}: must be a non-negative integer`);
  }
  return value;
}

function parseSampleRateEnv(key: string, fallback: number): number {
  const raw = process.env[key];
  if (!raw) return fallback;

  const parsed = Number.parseFloat(raw);
  if (!Number.isFinite(parsed) || parsed < 0 || parsed > 1) {
    throw new Error(`Invalid ${key}: expected a number between 0 and 1.`);
  }
  return parsed;
}

function parseCsvEnv(key: string): string[] {
  return (process.env[key] ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseBooleanEnv(key: string, fallback: boolean): boolean {
  const raw = (process.env[key] ?? "").trim().toLowerCase();
  if (!raw) return fallback;
  if (raw === "true" || raw === "1" || raw === "yes") return true;
  if (raw === "false" || raw === "0" || raw === "no") return false;
  throw new Error(`Invalid ${key}: use true/false`);
}

function parseHeaderNameEnv(key: string, fallback: string): string {
  const value = (process.env[key] ?? fallback).trim().toLowerCase();
  if (!value) {
    throw new Error(`Invalid ${key}: header name cannot be empty.`);
  }
  if (!/^[a-z0-9-]+$/.test(value)) {
    throw new Error(`Invalid ${key}: expected a valid lowercase HTTP header name.`);
  }
  return value;
}

function parseAiProviderEnv(defaultProvider: "openai" | "gemini"): "openai" | "gemini" {
  const value = (process.env.AI_PROVIDER || defaultProvider).trim().toLowerCase();
  if (value === "openai" || value === "gemini") {
    return value;
  }
  throw new Error("Invalid AI_PROVIDER: use openai or gemini");
}

function parseSecretEnv(key: string, requiredInProd: boolean): string {
  const value = (process.env[key] ?? "").trim();
  const forbidden = new Set(["change-me", "changeme", "default", "test", "secret", "token"]);

  if (!value) {
    if (requiredInProd) {
      throw new Error(`${key} is required in production.`);
    }
    return "";
  }

  if (forbidden.has(value.toLowerCase())) {
    throw new Error(`${key} uses a weak/default value.`);
  }

  return value;
}

function parseTrustProxyEnv(): boolean | number {
  const value = (process.env.TRUST_PROXY ?? "false").trim().toLowerCase();
  if (!value || value === "false") {
    return false;
  }
  if (value === "true") {
    return true;
  }

  const hops = Number.parseInt(value, 10);
  if (!Number.isFinite(hops) || hops < 1) {
    throw new Error("Invalid TRUST_PROXY: use true, false, or a positive integer.");
  }
  return hops;
}

const nodeEnv = process.env.NODE_ENV || "development";
const isProduction = nodeEnv === "production";

const corsAllowlist = parseCsvEnv("CORS_ALLOWLIST");
if (isProduction && corsAllowlist.length === 0) {
  throw new Error("CORS_ALLOWLIST is required in production.");
}

const apiAuthToken = parseSecretEnv("API_AUTH_TOKEN", false);
const requireApiAuth = isProduction || process.env.REQUIRE_API_AUTH === "true";
const internalApiIpAllowlist = parseCsvEnv("INTERNAL_API_IP_ALLOWLIST");
const adminProxyAuthRequired = parseBooleanEnv("ADMIN_PROXY_AUTH_REQUIRED", false);
const adminProxySharedSecret = parseSecretEnv("ADMIN_PROXY_SHARED_SECRET", false);
const adminProxySecretHeader = parseHeaderNameEnv(
  "ADMIN_PROXY_SECRET_HEADER",
  "x-admin-proxy-secret"
);
const adminProxyUserHeader = parseHeaderNameEnv(
  "ADMIN_PROXY_USER_HEADER",
  "x-auth-request-email"
);
const adminProxyGroupsHeader = parseHeaderNameEnv(
  "ADMIN_PROXY_GROUPS_HEADER",
  "x-auth-request-groups"
);
const adminProxyAllowedUsers = parseCsvEnv("ADMIN_PROXY_ALLOWED_USERS").map((item) =>
  item.toLowerCase()
);
const adminProxyAllowedGroups = parseCsvEnv("ADMIN_PROXY_ALLOWED_GROUPS").map((item) =>
  item.toLowerCase()
);
const firebaseProjectId = (process.env.FIREBASE_PROJECT_ID || "").trim();
const firebaseServiceAccountJsonB64 = (process.env.FIREBASE_SERVICE_ACCOUNT_JSON_B64 || "").trim();
const coreBackendUrl = (process.env.CORE_BACKEND_URL || "").trim();
const trustProxy = parseTrustProxyEnv();
const openAiApiKey = (process.env.OPENAI_API_KEY || "").trim();
const geminiApiKey = (process.env.GEMINI_API_KEY || "").trim();
const aiProviderDefault: "openai" | "gemini" = geminiApiKey ? "gemini" : "openai";
const aiProvider = parseAiProviderEnv(aiProviderDefault);

const databaseUrl = (process.env.DATABASE_URL || "").trim();
const premiumDataFile = process.env.PREMIUM_DATA_FILE || "./data/premium-state.json";
const diaryDataFile = process.env.DIARY_DATA_FILE || "./data/diary-state.json";
const urgeDataFile = process.env.URGE_DATA_FILE || "./data/urge-state.json";
const moneyProtectionDataFile =
  process.env.MONEY_PROTECTION_DATA_FILE || "./data/money-protection-state.json";
const therapyCallbackDataFile =
  process.env.THERAPY_CALLBACK_DATA_FILE || "./data/therapy-callback-state.json";
const supportEmail =
  (process.env.SUPPORT_EMAIL || "support@antislot.app").trim() || "support@antislot.app";
const premiumDbPath = (process.env.PREMIUM_DB_PATH || "").trim();
const receiptValidatorUrl = (process.env.IAP_VALIDATOR_URL || "").trim();
const receiptValidatorApiKey = parseSecretEnv("IAP_VALIDATOR_API_KEY", false);
const allowDevReceiptBypass = process.env.ALLOW_DEV_RECEIPT_BYPASS === "true";
const enablePremiumCodeActivation = parseBooleanEnv("ENABLE_PREMIUM_CODE_ACTIVATION", false);
const iapWebhookSecret = parseSecretEnv("IAP_WEBHOOK_SECRET", isProduction);
const iapIosSharedSecret = (process.env.IAP_IOS_SHARED_SECRET || "").trim();
const iapAndroidPackageName = (process.env.IAP_ANDROID_PACKAGE_NAME || "").trim();
const iapGoogleServiceAccountJsonB64 = (process.env.IAP_GOOGLE_SERVICE_ACCOUNT_JSON_B64 || "").trim();
const iapProductMonthly = (process.env.IAP_PRODUCT_MONTHLY || "antislot_premium_monthly").trim();
const iapProductYearly = (process.env.IAP_PRODUCT_YEARLY || "antislot_premium_yearly").trim();
const iapProductLifetime = (process.env.IAP_PRODUCT_LIFETIME || "antislot_premium_lifetime").trim();
const coreBackendTimeoutMs = parseIntEnv("CORE_BACKEND_TIMEOUT_MS", 12000);
const iapStoreTimeoutMs = parseIntEnv("IAP_STORE_TIMEOUT_MS", 12000);
const coreHealthCacheMs = parseIntEnv("CORE_HEALTH_CACHE_MS", 30000);
const coreHealthTimeoutMs = parseIntEnv("CORE_HEALTH_TIMEOUT_MS", 2500);
const metricsEnabled = parseBooleanEnv("ENABLE_METRICS_ENDPOINT", !isProduction);
const metricsAuthToken = parseSecretEnv("METRICS_AUTH_TOKEN", false);
const alertWebhookUrl = (process.env.ALERT_WEBHOOK_URL || "").trim();
const alertWebhookBearerToken = parseSecretEnv("ALERT_WEBHOOK_BEARER_TOKEN", false);
const alertTimeoutMs = parseIntEnv("ALERT_TIMEOUT_MS", 4000);
const alertMinIntervalMs = parseNonNegativeIntEnv("ALERT_MIN_INTERVAL_MS", 300000);
const accountabilitySmsEnabled = parseBooleanEnv("ACCOUNTABILITY_SMS_ENABLED", false);
const accountabilitySmsTimeoutMs = parseIntEnv("ACCOUNTABILITY_SMS_TIMEOUT_MS", 8000);
const accountabilitySmsCooldownMs = parseIntEnv("ACCOUNTABILITY_SMS_COOLDOWN_MS", 20 * 60 * 1000);
const accountabilitySmsDailyLimit = parseIntEnv("ACCOUNTABILITY_SMS_DAILY_LIMIT", 8);
const accountabilitySmsIdempotencyWindowMs = parseIntEnv(
  "ACCOUNTABILITY_SMS_IDEMPOTENCY_WINDOW_MS",
  10 * 60 * 1000
);
const twilioAccountSid = (process.env.TWILIO_ACCOUNT_SID || "").trim();
const twilioAuthToken = parseSecretEnv("TWILIO_AUTH_TOKEN", false);
const twilioMessagingServiceSid = (process.env.TWILIO_MESSAGING_SERVICE_SID || "").trim();
const twilioFromNumber = (process.env.TWILIO_FROM_NUMBER || "").trim();

if (alertWebhookUrl && !/^https?:\/\//i.test(alertWebhookUrl)) {
  throw new Error("ALERT_WEBHOOK_URL must start with http:// or https://");
}
if (isProduction && alertWebhookUrl && !alertWebhookUrl.startsWith("https://")) {
  throw new Error("Production ALERT_WEBHOOK_URL must use https.");
}

const hasDirectIosValidator = iapIosSharedSecret.length > 0;
const hasDirectAndroidValidator =
  iapAndroidPackageName.length > 0 && iapGoogleServiceAccountJsonB64.length > 0;

if (isProduction && !receiptValidatorUrl && !hasDirectIosValidator && !hasDirectAndroidValidator) {
  throw new Error(
    "Production requires IAP_VALIDATOR_URL or direct store validator config (iOS secret / Android service account)."
  );
}

if (isProduction && allowDevReceiptBypass) {
  throw new Error("ALLOW_DEV_RECEIPT_BYPASS cannot be true in production.");
}

if (requireApiAuth && !apiAuthToken && !firebaseProjectId) {
  throw new Error("Auth enabled but neither API_AUTH_TOKEN nor FIREBASE_PROJECT_ID configured.");
}

if (adminProxyAuthRequired && !adminProxySharedSecret) {
  throw new Error("ADMIN_PROXY_SHARED_SECRET is required when ADMIN_PROXY_AUTH_REQUIRED is true.");
}

if (isProduction && apiAuthToken && internalApiIpAllowlist.length === 0) {
  throw new Error("Production requires INTERNAL_API_IP_ALLOWLIST when API_AUTH_TOKEN is enabled.");
}

if (isProduction && !databaseUrl) {
  throw new Error("Production requires DATABASE_URL (Postgres).");
}

if (isProduction && metricsEnabled && !metricsAuthToken) {
  throw new Error("Production requires METRICS_AUTH_TOKEN when ENABLE_METRICS_ENDPOINT is true.");
}

if (accountabilitySmsEnabled) {
  if (!twilioAccountSid || !twilioAuthToken) {
    throw new Error(
      "ACCOUNTABILITY_SMS_ENABLED requires TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN."
    );
  }
  if (!twilioMessagingServiceSid && !twilioFromNumber) {
    throw new Error(
      "ACCOUNTABILITY_SMS_ENABLED requires TWILIO_MESSAGING_SERVICE_SID or TWILIO_FROM_NUMBER."
    );
  }
}

export const config = {
  nodeEnv,
  isProduction,
  port: parseIntEnv("PORT", 3001),
  aiProvider,
  openAiApiKey,
  openAiModel: process.env.OPENAI_MODEL || "gpt-4o",
  geminiApiKey,
  geminiModel: process.env.GEMINI_MODEL || "gemini-2.0-flash",
  geminiBaseUrl:
    process.env.GEMINI_BASE_URL || "https://generativelanguage.googleapis.com/v1beta",
  openAiTimeoutMs: parseIntEnv("OPENAI_TIMEOUT_MS", 15000),
  openAiMaxRetries: parseNonNegativeIntEnv("OPENAI_MAX_RETRIES", 2),
  openAiRetryBaseDelayMs: parseIntEnv("OPENAI_RETRY_BASE_DELAY_MS", 250),
  openAiCircuitFailureThreshold: parseIntEnv("OPENAI_CIRCUIT_FAILURE_THRESHOLD", 4),
  openAiCircuitResetMs: parseIntEnv("OPENAI_CIRCUIT_RESET_MS", 20000),
  sentryDsn: (process.env.SENTRY_DSN || "").trim(),
  sentryEnvironment: (process.env.SENTRY_ENV || nodeEnv).trim(),
  sentryRelease: (process.env.SENTRY_RELEASE || "").trim(),
  sentryTracesSampleRate: parseSampleRateEnv(
    "SENTRY_TRACES_SAMPLE_RATE",
    isProduction ? 0.1 : 0
  ),
  sentryProfilesSampleRate: parseSampleRateEnv(
    "SENTRY_PROFILES_SAMPLE_RATE",
    isProduction ? 0.0 : 0
  ),
  corsAllowlist,
  apiAuthToken,
  requireApiAuth,
  internalApiIpAllowlist,
  adminProxyAuthRequired,
  adminProxySharedSecret,
  adminProxySecretHeader,
  adminProxyUserHeader,
  adminProxyGroupsHeader,
  adminProxyAllowedUsers,
  adminProxyAllowedGroups,
  coreBackendUrl,
  trustProxy,
  firebaseProjectId,
  firebaseServiceAccountJsonB64,
  chatRateLimitWindowMs: parseIntEnv("CHAT_RATE_LIMIT_WINDOW_MS", 60000),
  chatRateLimitMax: parseIntEnv("CHAT_RATE_LIMIT_MAX", 25),
  premiumRateLimitWindowMs: parseIntEnv("PREMIUM_RATE_LIMIT_WINDOW_MS", 60000),
  premiumRateLimitMax: parseIntEnv("PREMIUM_RATE_LIMIT_MAX", 20),
  webhookRateLimitWindowMs: parseIntEnv("WEBHOOK_RATE_LIMIT_WINDOW_MS", 60000),
  webhookRateLimitMax: parseIntEnv("WEBHOOK_RATE_LIMIT_MAX", 60),
  databaseUrl,
  premiumDataFile,
  diaryDataFile,
  urgeDataFile,
  moneyProtectionDataFile,
  therapyCallbackDataFile,
  supportEmail,
  premiumDbPath: premiumDbPath || undefined,
  receiptValidatorUrl,
  receiptValidatorApiKey,
  allowDevReceiptBypass,
  enablePremiumCodeActivation,
  iapWebhookSecret,
  iapIosSharedSecret,
  iapAndroidPackageName,
  iapGoogleServiceAccountJsonB64,
  iapProductMonthly,
  iapProductYearly,
  iapProductLifetime,
  coreBackendTimeoutMs,
  coreHealthCacheMs,
  coreHealthTimeoutMs,
  metricsEnabled,
  metricsAuthToken,
  iapStoreTimeoutMs,
  alertWebhookUrl,
  alertWebhookBearerToken,
  alertTimeoutMs,
  alertMinIntervalMs,
  accountabilitySmsEnabled,
  accountabilitySmsTimeoutMs,
  accountabilitySmsCooldownMs,
  accountabilitySmsDailyLimit,
  accountabilitySmsIdempotencyWindowMs,
  twilioAccountSid,
  twilioAuthToken,
  twilioMessagingServiceSid,
  twilioFromNumber,
};
