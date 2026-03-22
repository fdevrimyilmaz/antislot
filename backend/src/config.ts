/* eslint-disable expo/no-dynamic-env-var */

/**
 * AntiSlot Backend configuration (fail-fast for production).
 */

function parseIntEnv(key: string, fallback: number): number {
  const raw = process.env[key];
  if (!raw) return fallback;

  const parsed = Number.parseInt(raw, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error(`Invalid ${key}: expected a positive integer`);
  }
  return parsed;
}

function parseSampleRateEnv(key: string, fallback: number): number {
  const raw = process.env[key];
  if (!raw) return fallback;

  const parsed = Number.parseFloat(raw);
  if (!Number.isFinite(parsed) || parsed < 0 || parsed > 1) {
    throw new Error(`Invalid ${key}: expected a number between 0 and 1`);
  }
  return parsed;
}

function parseCsvEnv(key: string): string[] {
  const raw = process.env[key] ?? "";
  return raw
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseAiProviderEnv(defaultProvider: "openai" | "gemini"): "openai" | "gemini" {
  const value = (process.env.AI_PROVIDER || defaultProvider).trim().toLowerCase();
  if (value === "openai" || value === "gemini") {
    return value;
  }
  throw new Error("Invalid AI_PROVIDER: use openai or gemini");
}

const nodeEnv = process.env.NODE_ENV || "development";
const isProduction = nodeEnv === "production";

const hmacSecret =
  process.env.HMAC_SECRET ||
  (isProduction ? "" : "antislot-secret-key-change-in-production");

if (!hmacSecret || hmacSecret === "antislot-secret-key-change-in-production") {
  if (isProduction) {
    throw new Error("Production requires a non-default HMAC_SECRET.");
  }
}

const corsAllowlist = parseCsvEnv("CORS_ALLOWLIST");
if (isProduction && corsAllowlist.length === 0) {
  throw new Error("Production requires CORS_ALLOWLIST (comma-separated origins).");
}

const apiAuthToken = process.env.API_AUTH_TOKEN ?? "";
const requireApiAuth = isProduction || process.env.REQUIRE_API_AUTH === "true";
const firebaseProjectId = (process.env.FIREBASE_PROJECT_ID || "").trim();
const firebaseServiceAccountJsonB64 = (process.env.FIREBASE_SERVICE_ACCOUNT_JSON_B64 || "").trim();
const openAiApiKey = (process.env.OPENAI_API_KEY || "").trim();
const geminiApiKey = (process.env.GEMINI_API_KEY || "").trim();
const aiProviderDefault: "openai" | "gemini" = geminiApiKey ? "gemini" : "openai";
const aiProvider = parseAiProviderEnv(aiProviderDefault);
if (requireApiAuth && !apiAuthToken && !firebaseProjectId) {
  throw new Error("Auth enabled but neither API_AUTH_TOKEN nor FIREBASE_PROJECT_ID configured.");
}

export const config = {
  port: parseIntEnv("PORT", 3000),
  nodeEnv,
  isProduction,
  hmacSecret,
  corsAllowlist,
  apiAuthToken,
  requireApiAuth,
  firebaseProjectId,
  firebaseServiceAccountJsonB64,

  cacheControl: {
    blocklist: "public, max-age=3600, must-revalidate",
    patterns: "public, max-age=7200, must-revalidate",
    health: "no-cache",
  },

  dataDir: process.env.DATA_DIR || "./data",
  blocklistFile: process.env.BLOCKLIST_FILE || "./data/blocklist.json",
  patternsFile: process.env.PATTERNS_FILE || "./data/patterns.json",
  autoVersionBump: process.env.AUTO_VERSION_BUMP !== "false",

  aiProvider,
  openAiApiKey,
  openAiModel: process.env.OPENAI_MODEL || "gpt-4o",
  openAiBaseUrl: process.env.OPENAI_BASE_URL || "https://api.openai.com/v1",
  geminiApiKey,
  geminiModel: process.env.GEMINI_MODEL || "gemini-2.0-flash",
  geminiBaseUrl:
    process.env.GEMINI_BASE_URL || "https://generativelanguage.googleapis.com/v1beta",
  openAiTimeoutMs: parseIntEnv("OPENAI_TIMEOUT_MS", 15000),
  openAiMaxTokens: parseIntEnv("OPENAI_MAX_TOKENS", 300),
  aiRateLimitMax: parseIntEnv("AI_RATE_LIMIT_MAX", 20),
  aiRateLimitWindowMs: parseIntEnv("AI_RATE_LIMIT_WINDOW_MS", 60000),
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
};
