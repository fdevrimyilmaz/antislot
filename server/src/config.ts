export type AiProvider = "gemini" | "openai";

const nodeEnv = process.env.NODE_ENV ?? "development";
const isProduction = nodeEnv === "production";

function resolveAiProvider(): AiProvider {
  const raw = (process.env.AI_PROVIDER ?? "").trim().toLowerCase();
  if (raw === "openai") return "openai";
  if (raw === "gemini") return "gemini";
  // Prefer Gemini when configured, otherwise fallback to OpenAI.
  if (process.env.GEMINI_API_KEY) return "gemini";
  return "openai";
}

export const config = {
  nodeEnv,
  port: Number(process.env.PORT || 3001),
  host: process.env.HOST || "0.0.0.0",
  aiProvider: resolveAiProvider(),

  openAiApiKey: process.env.OPENAI_API_KEY || "",
  openAiModel: process.env.OPENAI_MODEL || "gpt-4o-mini",

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
  isProduction,
};

function validateAiConfig(): void {
  if (config.aiProvider === "gemini" && !config.geminiApiKey) {
    throw new Error("AI_PROVIDER=gemini requires GEMINI_API_KEY");
  }
  if (config.aiProvider === "openai" && !config.openAiApiKey) {
    throw new Error("AI_PROVIDER=openai requires OPENAI_API_KEY");
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
