import cors from "cors";
import { randomUUID, timingSafeEqual } from "crypto";
import "dotenv/config";
import express, { NextFunction, Request, Response } from "express";
import type { Server } from "http";
import OpenAI from "openai";
import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";
import { z } from "zod";

import {
  AccountabilityAlertUpstreamError,
  AccountabilityAlertValidationError,
  sendAccountabilityAlert,
} from "./accountability-alert";
import {
  evaluateAccountabilityGuard,
  recordAccountabilityGuardSuccess,
} from "./accountability-guard";
import { sendOperationalAlert } from "./alerting";
import { sanitizeClientMessages } from "./chat-sanitizer";
import { config } from "./config";
import { initializeDiaryStore, syncDiaryState } from "./diary";
import { verifyFirebaseBearerToken } from "./firebase-auth";
import { validateReceipt } from "./iap-validator";
import {
  getMoneyProtectionHistory,
  initializeMoneyProtectionStore,
  syncMoneyProtectionState,
} from "./money-protection";
import {
  enqueueTherapyCallback,
  getQueuedTherapyCallbackCount,
  getTherapyCallbackHistory,
  initializeTherapyCallbackStore,
  listTherapyCallbackQueue,
  updateTherapyCallbackStatus,
} from "./therapy-callback";
import { initializeUrgeStore, syncUrgeState } from "./urge";
import {
  captureException,
  flushObservability,
  initObservability,
  isObservabilityEnabled,
} from "./observability";
import { getRealityFeed } from "./reality-feed";
import {
    applyWebhookEvent,
    getPremiumStatus,
    grantPremiumFromCode,
    grantPremiumFromReceipt,
    initializePremiumStore,
    restorePremium,
    syncPremiumState,
} from "./premium";
import type { PremiumState } from "./premium";

type ApiErrorCode =
  | "BAD_REQUEST"
  | "UNAUTHORIZED"
  | "NOT_FOUND"
  | "RATE_LIMITED"
  | "UPSTREAM_ERROR"
  | "SERVICE_UNAVAILABLE"
  | "INTERNAL_ERROR"
  | "PREMIUM_VALIDATION_FAILED";

const objectPayloadSchema = z.object({}).passthrough();

const premiumSourceSchema = z.enum([
  "trial",
  "subscription_monthly",
  "subscription_yearly",
  "lifetime",
  "code",
  "admin",
]);

const premiumStateSchema: z.ZodType<PremiumState> = z.object({
  isActive: z.boolean(),
  source: premiumSourceSchema.nullable(),
  startedAt: z.number().finite().nullable(),
  expiresAt: z.number().finite().nullable(),
  trialEndsAt: z.number().finite().nullable(),
  features: z.array(z.string()),
  lastSync: z.number().finite(),
});

const positiveTimestampSchema = z
  .number()
  .finite()
  .positive()
  .transform((value) => Math.trunc(value));

const premiumSyncBodySchema = z.object({
  localState: premiumStateSchema,
});

const diarySyncBodySchema = z.object({
  entries: z.array(z.unknown()).max(1000),
  lastSyncAt: positiveTimestampSchema.optional(),
});

const urgeSyncBodySchema = z.object({
  logs: z.array(z.unknown()).max(2500),
  lastSyncAt: positiveTimestampSchema.optional(),
});

const moneyProtectionSyncBodySchema = z.object({
  state: objectPayloadSchema,
  lastSyncAt: positiveTimestampSchema.optional(),
});

const therapyCallbackBodySchema = z.object({
  phone: z.string().trim().min(1, "phone is required"),
  name: z.string().optional(),
  preferredTime: z.string().optional(),
  note: z.string().optional(),
  locale: z.unknown().optional(),
});

const therapyCallbackAdminUpdateBodySchema = z.object({
  status: z.enum(["queued", "contacted", "closed"]),
  adminNote: z.string().optional(),
});

const accountabilityAlertBodySchema = z.object({
  phone: z.unknown().optional(),
  message: z.unknown().optional(),
});

const webhookBodySchema = z.object({
  eventId: z.string().trim().min(1),
  userId: z.string().trim().min(1),
  transactionId: z.string().trim().min(1),
  productId: z.string().trim().min(1),
  source: z.enum(["subscription_monthly", "subscription_yearly", "lifetime"]),
  platform: z.enum(["ios", "android", "unknown"]).optional(),
  type: z.enum(["renewal", "cancel", "refund", "grace", "expire"]),
  expiresAt: z.number().finite().nullable().optional(),
});

const chatRiskLevelSchema = z.enum(["low", "medium", "high", "critical"]);
const chatCoachingContextSchema = z.object({
  locale: z.enum(["tr", "en"]).optional(),
  riskLevel: chatRiskLevelSchema.optional(),
  suggestedIntensity: z.number().finite().min(1).max(10).optional(),
  trigger: z.string().trim().min(1).max(64).optional(),
  focus: z.string().trim().min(1).max(240).optional(),
  actionPlan: z.array(z.string().trim().min(1).max(120)).max(5).optional(),
});

const chatRequestBodySchema = z.object({
  messages: z.array(z.unknown()),
  locale: z.string().trim().optional(),
  coachingContext: chatCoachingContextSchema.optional(),
});

type OpenAiCircuitState = "closed" | "open" | "half_open";
type ChatLocale = "tr" | "en";
type ChatRiskLevel = z.infer<typeof chatRiskLevelSchema>;
type ChatCoachingContext = z.infer<typeof chatCoachingContextSchema>;

type CoreDependencyHealth = {
  configured: boolean;
  ok: boolean;
  status: "up" | "down" | "degraded" | "disabled";
  checkedAt: number;
  latencyMs: number;
  statusCode: number | null;
  error: string | null;
};

type ServiceHealthSnapshot = {
  ready: boolean;
  degraded: boolean;
  blockers: string[];
  warnings: string[];
  dependencies: {
    premiumStoreReady: boolean;
    coreBackend: CoreDependencyHealth;
    openAi: {
      configured: boolean;
      circuitState: OpenAiCircuitState;
      chatEnabled: boolean;
      retryPolicy: {
        maxRetries: number;
        baseDelayMs: number;
      };
    };
  };
  runtime: {
    requestCount: number;
    clientErrorCount: number;
    rateLimitedCount: number;
    notFoundCount: number;
    serverErrorCount: number;
    lastServerErrorAt: number;
    avgDurationMs: number;
    maxDurationMs: number;
    lastRequestAt: number;
    chatUpstreamSuccessCount: number;
    chatUpstreamFailureCount: number;
  };
};

type RouteRuntimeMetric = {
  total: number;
  errors4xx: number;
  errors5xx: number;
  totalDurationMs: number;
  maxDurationMs: number;
};

type AiChatCompletion = {
  reply: string;
  model: string;
};

const TR_SYSTEM_PROMPT_BASE = [
  "Sen YAPAY ANTI adli, Turkce konusan bir iyilesme koçusun.",
  "Kumar/bahis birakma surecinde empatik, sakin ve eyleme donuk destek ver.",
  "Bahis taktigi, oran, kupon, site onerisi, para kazanma yontemi veya tetikleyici detay verme.",
  "Tibbi tani koyma, ilac/doz onerisi, yasal ya da finansal uzman tavsiyesi verme.",
  "Yanit formati: 1 kisa empati cumlesi + en fazla 3 numarali adim + 1 kisa takip sorusu.",
  "Yargilayici dil kullanma; kullanicinin ozerkligini destekle.",
];

const EN_SYSTEM_PROMPT_BASE = [
  "You are YAPAY ANTI, a recovery-focused support coach.",
  "Provide empathetic, calm, action-oriented guidance for gambling cessation.",
  "Do not provide betting tactics, odds advice, bookmaker/site suggestions, or money-making methods.",
  "Do not provide medical diagnosis, medication/dose advice, legal advice, or financial advisory content.",
  "Response format: 1 short empathy sentence + up to 3 numbered steps + 1 short follow-up question.",
  "Use non-judgmental language and support user agency.",
];

const app = express();
const apiRouter = express.Router();
const openai = config.openAiApiKey ? new OpenAI({ apiKey: config.openAiApiKey }) : null;
app.set("trust proxy", config.trustProxy);

initObservability({
  dsn: config.sentryDsn,
  environment: config.sentryEnvironment,
  release: config.sentryRelease,
  tracesSampleRate: config.sentryTracesSampleRate,
  profilesSampleRate: config.sentryProfilesSampleRate,
});

const RATE_LIMIT_STORE = new Map<string, { count: number; resetAt: number }>();
const SERVICE_BOOT_TS = Date.now();
const runtimeStats = {
  requestCount: 0,
  clientErrorCount: 0,
  rateLimitedCount: 0,
  notFoundCount: 0,
  serverErrorCount: 0,
  lastServerErrorAt: 0,
  totalDurationMs: 0,
  maxDurationMs: 0,
  lastRequestAt: 0,
  chatUpstreamSuccessCount: 0,
  chatUpstreamFailureCount: 0,
};
const ROUTE_METRICS = new Map<string, RouteRuntimeMetric>();

const openAiCircuit = {
  state: "closed" as OpenAiCircuitState,
  failureCount: 0,
  openedAt: 0,
  halfOpenTrialInFlight: false,
};

let premiumStoreReady = config.nodeEnv === "test";
let httpServer: Server | null = null;

const coreHealthCache: {
  value: CoreDependencyHealth;
  expiresAt: number;
  inFlight: Promise<CoreDependencyHealth> | null;
} = {
  value: {
    configured: Boolean(config.coreBackendUrl),
    ok: !config.coreBackendUrl && !config.isProduction,
    status: config.coreBackendUrl ? "degraded" : config.isProduction ? "down" : "disabled",
    checkedAt: 0,
    latencyMs: 0,
    statusCode: null,
    error: config.coreBackendUrl ? "not_checked" : "not_configured",
  },
  expiresAt: 0,
  inFlight: null,
};
const PREMIUM_CODES = new Set(
  (process.env.PREMIUM_CODE_ALLOWLIST ?? "")
    .split(",")
    .map((code) => code.trim().toUpperCase())
    .filter(Boolean)
);

function routeKey(req: Request): string {
  const safePath = req.path.replace(/\s+/g, "_").slice(0, 120);
  return `${req.method.toUpperCase()} ${safePath}`;
}

function escapePromLabel(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\n/g, "\\n");
}

function setPromGauge(lines: string[], name: string, value: number): void {
  lines.push(`${name} ${Number.isFinite(value) ? value : 0}`);
}

function promBool(value: boolean): number {
  return value ? 1 : 0;
}

function ensureRouteMetric(key: string): RouteRuntimeMetric {
  const existing = ROUTE_METRICS.get(key);
  if (existing) return existing;

  const created: RouteRuntimeMetric = {
    total: 0,
    errors4xx: 0,
    errors5xx: 0,
    totalDurationMs: 0,
    maxDurationMs: 0,
  };
  ROUTE_METRICS.set(key, created);
  return created;
}

function secureEqualToken(expected: string, provided: string): boolean {
  const a = Buffer.from(expected);
  const b = Buffer.from(provided);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

function getTokenFromAuthHeader(req: Request): string {
  const authHeader = req.headers.authorization;
  if (!authHeader) return "";
  const [scheme, token] = authHeader.split(" ");
  if (scheme?.toLowerCase() !== "bearer") return "";
  return token?.trim() ?? "";
}

function getUserId(req: Request): string {
  const userId = req.headers["x-user-id"];
  if (typeof userId === "string") return userId.trim();
  if (Array.isArray(userId)) return (userId[0] ?? "").trim();
  return "";
}

function getHeaderValue(req: Request, headerName: string): string {
  const headerValue = req.headers[headerName];
  if (typeof headerValue === "string") return headerValue.trim();
  if (Array.isArray(headerValue)) return (headerValue[0] ?? "").trim();
  return "";
}

function parseHeaderList(value: string): string[] {
  return value
    .split(/[,\s;]+/)
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
}

type TherapyAdminProxyDecision = {
  ok: boolean;
  attempted: boolean;
};

function getTherapyAdminProxyDecision(req: Request): TherapyAdminProxyDecision {
  if (!config.adminProxySharedSecret) {
    return { ok: false, attempted: false };
  }

  const proxySecret = getHeaderValue(req, config.adminProxySecretHeader);
  const proxyUser = getHeaderValue(req, config.adminProxyUserHeader).toLowerCase();
  const proxyGroups = parseHeaderList(getHeaderValue(req, config.adminProxyGroupsHeader));
  const attempted = Boolean(proxySecret || proxyUser || proxyGroups.length > 0);

  if (!attempted) {
    return { ok: false, attempted: false };
  }

  if (!proxySecret || !proxyUser) {
    return { ok: false, attempted: true };
  }

  if (!secureEqualToken(config.adminProxySharedSecret, proxySecret)) {
    return { ok: false, attempted: true };
  }

  if (
    config.adminProxyAllowedUsers.length > 0 &&
    !config.adminProxyAllowedUsers.includes(proxyUser)
  ) {
    return { ok: false, attempted: true };
  }

  if (config.adminProxyAllowedGroups.length > 0) {
    const hasAllowedGroup = proxyGroups.some((group) =>
      config.adminProxyAllowedGroups.includes(group)
    );
    if (!hasAllowedGroup) {
      return { ok: false, attempted: true };
    }
  }

  return { ok: true, attempted: true };
}

function normalizeIpAddress(ip: string): string {
  const trimmed = ip.trim();
  if (!trimmed) return "";
  if (trimmed.startsWith("::ffff:")) return trimmed.slice("::ffff:".length);
  if (trimmed === "::1") return "127.0.0.1";
  return trimmed;
}

function getRequestIp(req: Request): string {
  const rawIp = req.ip || req.socket.remoteAddress || "";
  return normalizeIpAddress(rawIp);
}

function isInternalApiCallerAllowed(req: Request): boolean {
  if (config.internalApiIpAllowlist.length === 0) {
    return !config.isProduction;
  }
  const ip = getRequestIp(req);
  return config.internalApiIpAllowlist.includes(ip);
}

function isOriginAllowed(origin?: string): boolean {
  if (!origin) return true;
  if (config.corsAllowlist.length === 0 && !config.isProduction) return true;
  return config.corsAllowlist.includes(origin);
}

type RateLimitDecision = {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetAt: number;
};

function consumeRateLimit(key: string, max: number, windowMs: number): RateLimitDecision {
  const now = Date.now();
  const entry = RATE_LIMIT_STORE.get(key);

  if (!entry || entry.resetAt <= now) {
    RATE_LIMIT_STORE.set(key, {
      count: 1,
      resetAt: now + windowMs,
    });
    return {
      allowed: true,
      limit: max,
      remaining: Math.max(0, max - 1),
      resetAt: now + windowMs,
    };
  }

  if (entry.count >= max) {
    return {
      allowed: false,
      limit: max,
      remaining: 0,
      resetAt: entry.resetAt,
    };
  }

  entry.count += 1;
  RATE_LIMIT_STORE.set(key, entry);
  return {
    allowed: true,
    limit: max,
    remaining: Math.max(0, max - entry.count),
    resetAt: entry.resetAt,
  };
}

const rateLimitCleanupInterval = setInterval(() => {
  const now = Date.now();
  for (const [key, value] of RATE_LIMIT_STORE.entries()) {
    if (value.resetAt <= now) {
      RATE_LIMIT_STORE.delete(key);
    }
  }
}, 60_000);

const rateLimitCleanupTimer = rateLimitCleanupInterval as unknown as NodeJS.Timeout;
if (typeof rateLimitCleanupTimer.unref === "function") {
  rateLimitCleanupTimer.unref();
}

function requestId(req: Request): string {
  const id = (req as Request & { id?: string }).id;
  return id || "unknown";
}

/** Data minimization: mask userId in logs to avoid PII exposure. */
function maskUserId(userId: string): string {
  if (!userId || userId.length < 8) return "***";
  return `${userId.slice(0, 4)}...${userId.slice(-2)}`;
}

function setAuthUid(req: Request, uid: string | null): void {
  (req as Request & { authUid?: string | null }).authUid = uid;
}

function logInfo(req: Request, message: string, extra?: Record<string, unknown>) {
  console.log(JSON.stringify({ level: "info", message, requestId: requestId(req), path: req.path, method: req.method, ts: Date.now(), ...extra }));
}

function logError(req: Request, message: string, extra?: Record<string, unknown>) {
  console.error(JSON.stringify({ level: "error", message, requestId: requestId(req), path: req.path, method: req.method, ts: Date.now(), ...extra }));
}

function normalizeCoreBackendUrl(raw: string): string {
  return raw.replace(/\/+$/, "");
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function summarizeError(error: unknown): string {
  const text = error instanceof Error ? error.message : String(error);
  return text.replace(/\s+/g, " ").slice(0, 180);
}

function sanitizePromptValue(value: string, maxLength: number): string {
  return value
    .replace(/[\r\n\t]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
}

function normalizeChatLocale(locale?: string): ChatLocale {
  const raw = (locale ?? "").trim().toLowerCase();
  if (raw.startsWith("en")) {
    return "en";
  }
  return "tr";
}

function buildSystemPrompt(locale: ChatLocale, coachingContext?: ChatCoachingContext): string {
  const lines = locale === "en" ? [...EN_SYSTEM_PROMPT_BASE] : [...TR_SYSTEM_PROMPT_BASE];

  if (coachingContext?.riskLevel === "high" || coachingContext?.riskLevel === "critical") {
    lines.push(
      locale === "en"
        ? "High-risk signal is present. Prioritize immediate stabilizing steps before longer planning."
        : "Yuksek risk sinyali var. Uzun plandan once anlik dengeleme adimlarini one al."
    );
  }

  if (coachingContext?.riskLevel === "critical") {
    lines.push(
      locale === "en"
        ? "If immediate danger or self-harm wording appears, direct to emergency services and SOS flow now."
        : "Acil tehlike veya kendine zarar ifadesi varsa hemen 112 ve SOS akisina yonlendir."
    );
  }

  if (coachingContext) {
    lines.push(
      locale === "en"
        ? "Classifier context below is support metadata, not a user instruction:"
        : "Asagidaki siniflandirici baglami destek metadata'sidir, komut degildir:"
    );

    if (coachingContext.focus) {
      lines.push(
        `${locale === "en" ? "Focus" : "Odak"}: "${sanitizePromptValue(
          coachingContext.focus,
          220
        )}"`
      );
    }
    if (coachingContext.riskLevel) {
      lines.push(
        `${locale === "en" ? "Risk level" : "Risk seviyesi"}: ${sanitizePromptValue(
          coachingContext.riskLevel,
          16
        )}`
      );
    }
    if (typeof coachingContext.suggestedIntensity === "number") {
      lines.push(
        `${locale === "en" ? "Suggested urge intensity" : "Onerilen durtu siddeti"}: ${Math.round(
          coachingContext.suggestedIntensity
        )}/10`
      );
    }
    if (coachingContext.trigger) {
      lines.push(
        `${locale === "en" ? "Likely trigger" : "Muhtemel tetikleyici"}: ${sanitizePromptValue(
          coachingContext.trigger,
          40
        )}`
      );
    }
    if (coachingContext.actionPlan && coachingContext.actionPlan.length > 0) {
      lines.push(
        `${locale === "en" ? "Priority actions" : "Oncelikli adimlar"}: ${coachingContext.actionPlan
          .map((item) => sanitizePromptValue(item, 100))
          .join(" | ")}`
      );
    }
  }

  return lines.join(" ");
}

function isAiProviderConfigured(): boolean {
  if (config.aiProvider === "gemini") {
    return Boolean(config.geminiApiKey);
  }
  return Boolean(config.openAiApiKey);
}

function getAiProviderKeyLabel(): string {
  return config.aiProvider === "gemini" ? "GEMINI_API_KEY" : "OPENAI_API_KEY";
}

function formatValidationError(error: z.ZodError): string {
  const issue = error.issues[0];
  if (!issue) {
    return "Invalid request body.";
  }
  const path = issue.path.length > 0 ? issue.path.join(".") : "body";
  return `${path}: ${issue.message}`;
}

function parseBody<T>(
  req: Request,
  res: Response,
  schema: z.ZodType<T>
): T | null {
  const parsed = schema.safeParse(req.body ?? {});
  if (parsed.success) {
    return parsed.data;
  }
  sendError(
    res,
    400,
    "BAD_REQUEST",
    formatValidationError(parsed.error),
    req
  );
  return null;
}

function isRetryableAiError(error: unknown): boolean {
  const err = error as { status?: number; name?: string; message?: string };
  if (typeof err?.status === "number") {
    if (err.status === 408 || err.status === 409 || err.status === 429) {
      return true;
    }
    return err.status >= 500;
  }

  const name = (err?.name ?? "").toLowerCase();
  if (name === "aborterror" || name === "timeouterror") {
    return true;
  }

  const message = (err?.message ?? "").toLowerCase();
  return (
    message.includes("timeout") ||
    message.includes("network") ||
    message.includes("etimedout") ||
    message.includes("econnreset") ||
    message.includes("temporar")
  );
}

function openAiCircuitAllowsRequest(): boolean {
  const now = Date.now();

  if (openAiCircuit.state === "closed") {
    return true;
  }

  if (openAiCircuit.state === "open") {
    if (now - openAiCircuit.openedAt < config.openAiCircuitResetMs) {
      return false;
    }
    openAiCircuit.state = "half_open";
    openAiCircuit.halfOpenTrialInFlight = false;
  }

  if (openAiCircuit.state === "half_open") {
    if (openAiCircuit.halfOpenTrialInFlight) {
      return false;
    }
    openAiCircuit.halfOpenTrialInFlight = true;
  }

  return true;
}

function onOpenAiCallSucceeded(): void {
  openAiCircuit.state = "closed";
  openAiCircuit.failureCount = 0;
  openAiCircuit.openedAt = 0;
  openAiCircuit.halfOpenTrialInFlight = false;
}

function onOpenAiCallFailed(): void {
  const previousState = openAiCircuit.state;
  openAiCircuit.failureCount += 1;
  const shouldOpenCircuit =
    openAiCircuit.state === "half_open" ||
    openAiCircuit.failureCount >= config.openAiCircuitFailureThreshold;

  if (shouldOpenCircuit) {
    openAiCircuit.state = "open";
    openAiCircuit.openedAt = Date.now();
    if (previousState !== "open") {
      void sendOperationalAlert({
        level: "warning",
        title: "AI circuit opened",
        message: "Chat upstream protection circuit entered open state.",
        fingerprint: "openai_circuit_open",
        context: {
          failureCount: openAiCircuit.failureCount,
          threshold: config.openAiCircuitFailureThreshold,
          resetMs: config.openAiCircuitResetMs,
        },
      });
    }
  }
  openAiCircuit.halfOpenTrialInFlight = false;
}

async function requestOpenAiChatCompletion(
  systemPrompt: string,
  messages: ChatCompletionMessageParam[]
): Promise<AiChatCompletion> {
  if (!openai) {
    throw new Error("OPENAI_API_KEY is not configured");
  }

  const completion = await openai.chat.completions.create(
    {
      model: config.openAiModel,
      messages: [
        { role: "system", content: systemPrompt } as ChatCompletionMessageParam,
        ...messages,
      ],
      temperature: 0.6,
    },
    { timeout: config.openAiTimeoutMs }
  );

  const reply = completion.choices?.[0]?.message?.content?.trim();
  if (!reply) {
    throw new Error("Empty response from OpenAI provider");
  }

  return {
    reply,
    model: completion.model || config.openAiModel,
  };
}

async function requestGeminiChatCompletion(
  systemPrompt: string,
  messages: ChatCompletionMessageParam[]
): Promise<AiChatCompletion> {
  if (!config.geminiApiKey) {
    throw new Error("GEMINI_API_KEY is not configured");
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), config.openAiTimeoutMs);

  try {
    const contents = [
      { role: "user", parts: [{ text: `[SYSTEM]\n${systemPrompt}` }] },
      ...messages
        .map((item) => {
          const text = typeof item.content === "string" ? item.content.trim() : "";
          if (!text) return null;
          const role = item.role === "assistant" ? "model" : "user";
          return { role, parts: [{ text }] };
        })
        .filter(Boolean),
    ];

    const response = await fetch(
      `${config.geminiBaseUrl}/models/${encodeURIComponent(
        config.geminiModel
      )}:generateContent?key=${encodeURIComponent(config.geminiApiKey)}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents,
          generationConfig: {
            temperature: 0.6,
          },
        }),
        signal: controller.signal,
      }
    );

    const data = await response.json().catch(() => null);
    if (!response.ok) {
      const upstreamError = data?.error?.message || `status_${response.status}`;
      throw { status: response.status, message: String(upstreamError) };
    }

    const reply = (data?.candidates ?? [])
      .flatMap((candidate: { content?: { parts?: Array<{ text?: string }> } }) =>
        candidate?.content?.parts ?? []
      )
      .map((part: { text?: string }) => part.text || "")
      .join(" ")
      .trim();

    if (!reply) {
      throw new Error("Empty response from Gemini provider");
    }

    return {
      reply,
      model: data?.modelVersion || config.geminiModel,
    };
  } finally {
    clearTimeout(timeout);
  }
}

async function createChatCompletionWithRetry(
  req: Request,
  systemPrompt: string,
  messages: ChatCompletionMessageParam[]
): Promise<AiChatCompletion> {
  for (let attempt = 0; attempt <= config.openAiMaxRetries; attempt += 1) {
    try {
      const completion =
        config.aiProvider === "gemini"
          ? await requestGeminiChatCompletion(systemPrompt, messages)
          : await requestOpenAiChatCompletion(systemPrompt, messages);

      runtimeStats.chatUpstreamSuccessCount += 1;
      onOpenAiCallSucceeded();
      return completion;
    } catch (error) {
      const canRetry = isRetryableAiError(error) && attempt < config.openAiMaxRetries;
      if (!canRetry) {
        runtimeStats.chatUpstreamFailureCount += 1;
        onOpenAiCallFailed();
        throw error;
      }

      const baseDelay = config.openAiRetryBaseDelayMs * Math.pow(2, attempt);
      const jitter = Math.floor(Math.random() * 120);
      const delayMs = Math.min(baseDelay + jitter, 3000);
      logError(req, `${config.aiProvider.toUpperCase()} attempt failed, retrying`, {
        attempt: attempt + 1,
        delayMs,
        reason: summarizeError(error),
      });
      await sleep(delayMs);
    }
  }

  // Control never reaches here because the loop either returns or throws.
  throw new Error("Chat completion failed unexpectedly");
}

async function probeCoreBackendHealth(): Promise<CoreDependencyHealth> {
  if (!config.coreBackendUrl) {
    return {
      configured: false,
      ok: !config.isProduction,
      status: config.isProduction ? "down" : "disabled",
      checkedAt: Date.now(),
      latencyMs: 0,
      statusCode: null,
      error: "not_configured",
    };
  }

  const startedAt = Date.now();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), config.coreHealthTimeoutMs);

  try {
    const response = await fetch(`${normalizeCoreBackendUrl(config.coreBackendUrl)}/v1/health`, {
      method: "GET",
      signal: controller.signal,
      headers: {
        Accept: "application/json",
      },
    });

    const latencyMs = Date.now() - startedAt;
    if (!response.ok) {
      return {
        configured: true,
        ok: false,
        status: "down",
        checkedAt: Date.now(),
        latencyMs,
        statusCode: response.status,
        error: `status_${response.status}`,
      };
    }

    const payload = (await response.json().catch(() => null)) as
      | { status?: string; ok?: boolean }
      | null;
    const isUp = payload?.ok === true || payload?.status === "ok" || payload?.status === "up";

    return {
      configured: true,
      ok: isUp,
      status: isUp ? "up" : "degraded",
      checkedAt: Date.now(),
      latencyMs,
      statusCode: response.status,
      error: isUp ? null : "unexpected_health_payload",
    };
  } catch (error) {
    const err = error as { name?: string };
    return {
      configured: true,
      ok: false,
      status: "down",
      checkedAt: Date.now(),
      latencyMs: Date.now() - startedAt,
      statusCode: null,
      error: err?.name === "AbortError" ? "timeout" : summarizeError(error),
    };
  } finally {
    clearTimeout(timeout);
  }
}

async function getCoreBackendHealth(force = false): Promise<CoreDependencyHealth> {
  if (!force && coreHealthCache.expiresAt > Date.now()) {
    return coreHealthCache.value;
  }

  if (coreHealthCache.inFlight) {
    return coreHealthCache.inFlight;
  }

  coreHealthCache.inFlight = probeCoreBackendHealth()
    .then((nextValue) => {
      coreHealthCache.value = nextValue;
      coreHealthCache.expiresAt = Date.now() + config.coreHealthCacheMs;
      return nextValue;
    })
    .finally(() => {
      coreHealthCache.inFlight = null;
    });

  return coreHealthCache.inFlight;
}

async function getServiceHealthSnapshot(forceCoreProbe = false): Promise<ServiceHealthSnapshot> {
  const coreBackend = await getCoreBackendHealth(forceCoreProbe);
  const blockers: string[] = [];
  const warnings: string[] = [];

  if (!premiumStoreReady) {
    blockers.push("premium_store_not_ready");
  }

  if (config.coreBackendUrl) {
    if (!coreBackend.ok) {
      blockers.push("core_backend_unreachable");
    }
  } else if (config.isProduction) {
    blockers.push("core_backend_not_configured");
  } else {
    warnings.push("core_backend_not_configured");
  }

  const aiConfigured = isAiProviderConfigured();

  if (!aiConfigured && config.isProduction) {
    warnings.push(`${config.aiProvider}_not_configured`);
  }
  if (aiConfigured) {
    if (openAiCircuit.state === "open") {
      warnings.push("openai_circuit_open");
    }
    if (openAiCircuit.state === "half_open") {
      warnings.push("openai_recovering");
    }
  }

  const avgDurationMs =
    runtimeStats.requestCount > 0
      ? Number((runtimeStats.totalDurationMs / runtimeStats.requestCount).toFixed(2))
      : 0;

  return {
    ready: blockers.length === 0,
    degraded: blockers.length > 0 || warnings.length > 0,
    blockers,
    warnings,
    dependencies: {
      premiumStoreReady,
      coreBackend,
      openAi: {
        configured: aiConfigured,
        circuitState: openAiCircuit.state,
        chatEnabled: aiConfigured && openAiCircuit.state !== "open",
        retryPolicy: {
          maxRetries: config.openAiMaxRetries,
          baseDelayMs: config.openAiRetryBaseDelayMs,
        },
      },
    },
    runtime: {
      requestCount: runtimeStats.requestCount,
      clientErrorCount: runtimeStats.clientErrorCount,
      rateLimitedCount: runtimeStats.rateLimitedCount,
      notFoundCount: runtimeStats.notFoundCount,
      serverErrorCount: runtimeStats.serverErrorCount,
      lastServerErrorAt: runtimeStats.lastServerErrorAt,
      avgDurationMs,
      maxDurationMs: runtimeStats.maxDurationMs,
      lastRequestAt: runtimeStats.lastRequestAt,
      chatUpstreamSuccessCount: runtimeStats.chatUpstreamSuccessCount,
      chatUpstreamFailureCount: runtimeStats.chatUpstreamFailureCount,
    },
  };
}

function metricsAuthIsValid(req: Request): boolean {
  if (!config.metricsAuthToken) {
    return !config.isProduction;
  }
  const token = getTokenFromAuthHeader(req);
  return Boolean(token && secureEqualToken(config.metricsAuthToken, token));
}

async function buildMetricsPayload(): Promise<string> {
  const snapshot = await getServiceHealthSnapshot(false);
  const lines: string[] = [];

  lines.push("# HELP antislot_uptime_seconds Process uptime in seconds.");
  lines.push("# TYPE antislot_uptime_seconds gauge");
  setPromGauge(lines, "antislot_uptime_seconds", Math.floor(process.uptime()));

  lines.push("# HELP antislot_service_ready Service readiness state (1=ready).");
  lines.push("# TYPE antislot_service_ready gauge");
  setPromGauge(lines, "antislot_service_ready", promBool(snapshot.ready));

  lines.push("# HELP antislot_service_degraded Service degraded state (1=degraded).");
  lines.push("# TYPE antislot_service_degraded gauge");
  setPromGauge(lines, "antislot_service_degraded", promBool(snapshot.degraded));

  lines.push("# HELP antislot_core_backend_up Core backend dependency health (1=up).");
  lines.push("# TYPE antislot_core_backend_up gauge");
  setPromGauge(lines, "antislot_core_backend_up", promBool(snapshot.dependencies.coreBackend.ok));

  lines.push("# HELP antislot_openai_configured OpenAI credential availability (1=configured).");
  lines.push("# TYPE antislot_openai_configured gauge");
  setPromGauge(lines, "antislot_openai_configured", promBool(snapshot.dependencies.openAi.configured));

  lines.push("# HELP antislot_openai_chat_enabled OpenAI chat availability (1=enabled).");
  lines.push("# TYPE antislot_openai_chat_enabled gauge");
  setPromGauge(lines, "antislot_openai_chat_enabled", promBool(snapshot.dependencies.openAi.chatEnabled));

  lines.push("# HELP antislot_openai_circuit_state OpenAI circuit state by label (1=active state).");
  lines.push("# TYPE antislot_openai_circuit_state gauge");
  for (const state of ["closed", "open", "half_open"] as const) {
    const value = snapshot.dependencies.openAi.circuitState === state ? 1 : 0;
    lines.push(`antislot_openai_circuit_state{state="${state}"} ${value}`);
  }

  lines.push("# HELP antislot_runtime_requests_total Total handled requests.");
  lines.push("# TYPE antislot_runtime_requests_total counter");
  setPromGauge(lines, "antislot_runtime_requests_total", runtimeStats.requestCount);

  lines.push("# HELP antislot_runtime_client_errors_total Total 4xx responses.");
  lines.push("# TYPE antislot_runtime_client_errors_total counter");
  setPromGauge(lines, "antislot_runtime_client_errors_total", runtimeStats.clientErrorCount);

  lines.push("# HELP antislot_runtime_server_errors_total Total 5xx responses.");
  lines.push("# TYPE antislot_runtime_server_errors_total counter");
  setPromGauge(lines, "antislot_runtime_server_errors_total", runtimeStats.serverErrorCount);

  lines.push("# HELP antislot_runtime_rate_limited_total Total 429 responses.");
  lines.push("# TYPE antislot_runtime_rate_limited_total counter");
  setPromGauge(lines, "antislot_runtime_rate_limited_total", runtimeStats.rateLimitedCount);

  lines.push("# HELP antislot_runtime_not_found_total Total 404 responses.");
  lines.push("# TYPE antislot_runtime_not_found_total counter");
  setPromGauge(lines, "antislot_runtime_not_found_total", runtimeStats.notFoundCount);

  lines.push("# HELP antislot_request_duration_ms_avg Average request duration in milliseconds.");
  lines.push("# TYPE antislot_request_duration_ms_avg gauge");
  setPromGauge(lines, "antislot_request_duration_ms_avg", snapshot.runtime.avgDurationMs);

  lines.push("# HELP antislot_request_duration_ms_max Maximum request duration in milliseconds.");
  lines.push("# TYPE antislot_request_duration_ms_max gauge");
  setPromGauge(lines, "antislot_request_duration_ms_max", snapshot.runtime.maxDurationMs);

  lines.push("# HELP antislot_chat_upstream_success_total Successful upstream chat completions.");
  lines.push("# TYPE antislot_chat_upstream_success_total counter");
  setPromGauge(lines, "antislot_chat_upstream_success_total", runtimeStats.chatUpstreamSuccessCount);

  lines.push("# HELP antislot_chat_upstream_failure_total Failed upstream chat completions.");
  lines.push("# TYPE antislot_chat_upstream_failure_total counter");
  setPromGauge(lines, "antislot_chat_upstream_failure_total", runtimeStats.chatUpstreamFailureCount);

  lines.push("# HELP antislot_route_requests_total Request totals per route.");
  lines.push("# TYPE antislot_route_requests_total counter");
  lines.push("# HELP antislot_route_errors_4xx_total 4xx totals per route.");
  lines.push("# TYPE antislot_route_errors_4xx_total counter");
  lines.push("# HELP antislot_route_errors_5xx_total 5xx totals per route.");
  lines.push("# TYPE antislot_route_errors_5xx_total counter");
  lines.push("# HELP antislot_route_duration_ms_avg Average duration per route in milliseconds.");
  lines.push("# TYPE antislot_route_duration_ms_avg gauge");
  lines.push("# HELP antislot_route_duration_ms_max Maximum duration per route in milliseconds.");
  lines.push("# TYPE antislot_route_duration_ms_max gauge");

  for (const [key, metric] of ROUTE_METRICS.entries()) {
    const separator = key.indexOf(" ");
    const method = separator > 0 ? key.slice(0, separator) : "GET";
    const path = separator > 0 ? key.slice(separator + 1) : key;
    const label = `method="${escapePromLabel(method)}",route="${escapePromLabel(path)}"`;
    const avg = metric.total > 0 ? Number((metric.totalDurationMs / metric.total).toFixed(2)) : 0;

    lines.push(`antislot_route_requests_total{${label}} ${metric.total}`);
    lines.push(`antislot_route_errors_4xx_total{${label}} ${metric.errors4xx}`);
    lines.push(`antislot_route_errors_5xx_total{${label}} ${metric.errors5xx}`);
    lines.push(`antislot_route_duration_ms_avg{${label}} ${avg}`);
    lines.push(`antislot_route_duration_ms_max{${label}} ${metric.maxDurationMs}`);
  }

  return `${lines.join("\n")}\n`;
}

async function proxyCoreRead(req: Request, res: Response, targetPath: string): Promise<void> {
  if (!config.coreBackendUrl) {
    sendError(res, 503, "SERVICE_UNAVAILABLE", "Core backend is not configured.", req);
    return;
  }

  const startedAt = Date.now();
  const url = `${normalizeCoreBackendUrl(config.coreBackendUrl)}${targetPath}`;
  const ifNoneMatch = req.headers["if-none-match"];
  const ifModifiedSince = req.headers["if-modified-since"];
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), config.coreBackendTimeoutMs);

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        ...(ifNoneMatch ? { "If-None-Match": Array.isArray(ifNoneMatch) ? ifNoneMatch[0] : ifNoneMatch } : {}),
        ...(ifModifiedSince ? { "If-Modified-Since": Array.isArray(ifModifiedSince) ? ifModifiedSince[0] : ifModifiedSince } : {}),
      },
      signal: controller.signal,
    });

    const cacheControl = response.headers.get("cache-control");
    const etag = response.headers.get("etag");
    const lastModified = response.headers.get("last-modified");

    if (cacheControl) res.setHeader("Cache-Control", cacheControl);
    if (etag) res.setHeader("ETag", etag);
    if (lastModified) res.setHeader("Last-Modified", lastModified);
    coreHealthCache.value = {
      configured: true,
      ok: response.status < 500,
      status: response.status < 500 ? "up" : "down",
      checkedAt: Date.now(),
      latencyMs: Date.now() - startedAt,
      statusCode: response.status,
      error: response.status < 500 ? null : `status_${response.status}`,
    };
    coreHealthCache.expiresAt = Date.now() + config.coreHealthCacheMs;

    if (response.status === 304) {
      res.status(304).end();
      return;
    }

    const data = await response.text();
    res.status(response.status);
    res.setHeader("Content-Type", response.headers.get("content-type") ?? "application/json");
    res.send(data);
  } catch (error) {
    const err = error as { name?: string; message?: string };
    if (err?.name === "AbortError") {
      coreHealthCache.value = {
        configured: true,
        ok: false,
        status: "down",
        checkedAt: Date.now(),
        latencyMs: Date.now() - startedAt,
        statusCode: null,
        error: "timeout",
      };
      coreHealthCache.expiresAt = Date.now() + config.coreHealthCacheMs;
      logError(req, "Core backend request timed out", {
        targetPath,
        timeoutMs: config.coreBackendTimeoutMs,
      });
      sendError(res, 503, "SERVICE_UNAVAILABLE", "Core backend timed out. Please try again.", req);
      return;
    }

    logError(req, "Core backend request failed", {
      targetPath,
      reason: err?.message ?? "unknown",
    });
    coreHealthCache.value = {
      configured: true,
      ok: false,
      status: "down",
      checkedAt: Date.now(),
      latencyMs: Date.now() - startedAt,
      statusCode: null,
      error: summarizeError(error),
    };
    coreHealthCache.expiresAt = Date.now() + config.coreHealthCacheMs;
    captureException(error, {
      route: targetPath,
      stage: "core-proxy",
    });
    sendError(res, 502, "UPSTREAM_ERROR", "Core backend request failed.", req);
  } finally {
    clearTimeout(timeout);
  }
}

async function proxyCorePostJson(req: Request, res: Response, targetPath: string): Promise<void> {
  if (!config.coreBackendUrl) {
    sendError(res, 503, "SERVICE_UNAVAILABLE", "Core backend is not configured.", req);
    return;
  }

  const startedAt = Date.now();
  const url = `${normalizeCoreBackendUrl(config.coreBackendUrl)}${targetPath}`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), config.coreBackendTimeoutMs);

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(req.body ?? {}),
      signal: controller.signal,
    });

    coreHealthCache.value = {
      configured: true,
      ok: response.status < 500,
      status: response.status < 500 ? "up" : "down",
      checkedAt: Date.now(),
      latencyMs: Date.now() - startedAt,
      statusCode: response.status,
      error: response.status < 500 ? null : `status_${response.status}`,
    };
    coreHealthCache.expiresAt = Date.now() + config.coreHealthCacheMs;

    const data = await response.text();
    res.status(response.status);
    res.setHeader("Content-Type", response.headers.get("content-type") ?? "application/json");
    res.send(data);
  } catch (error) {
    const err = error as { name?: string; message?: string };
    if (err?.name === "AbortError") {
      coreHealthCache.value = {
        configured: true,
        ok: false,
        status: "down",
        checkedAt: Date.now(),
        latencyMs: Date.now() - startedAt,
        statusCode: null,
        error: "timeout",
      };
      coreHealthCache.expiresAt = Date.now() + config.coreHealthCacheMs;
      logError(req, "Core backend request timed out", {
        targetPath,
        timeoutMs: config.coreBackendTimeoutMs,
      });
      sendError(res, 503, "SERVICE_UNAVAILABLE", "Core backend timed out. Please try again.", req);
      return;
    }

    logError(req, "Core backend request failed", {
      targetPath,
      reason: err?.message ?? "unknown",
    });
    coreHealthCache.value = {
      configured: true,
      ok: false,
      status: "down",
      checkedAt: Date.now(),
      latencyMs: Date.now() - startedAt,
      statusCode: null,
      error: summarizeError(error),
    };
    coreHealthCache.expiresAt = Date.now() + config.coreHealthCacheMs;
    captureException(error, {
      route: targetPath,
      stage: "core-proxy",
    });
    sendError(res, 502, "UPSTREAM_ERROR", "Core backend request failed.", req);
  } finally {
    clearTimeout(timeout);
  }
}

function sendError(
  res: Response,
  status: number,
  code: ApiErrorCode,
  message: string,
  req: Request
): Response {
  if (code === "RATE_LIMITED") {
    runtimeStats.rateLimitedCount += 1;
  }
  if (status >= 400 && status < 500) {
    runtimeStats.clientErrorCount += 1;
  }
  if (status === 404 || code === "NOT_FOUND") {
    runtimeStats.notFoundCount += 1;
  }
  if (status >= 500) {
    runtimeStats.serverErrorCount += 1;
    runtimeStats.lastServerErrorAt = Date.now();
  }

  return res.status(status).json({
    ok: false,
    error: {
      code,
      message,
      requestId: requestId(req),
    },
  });
}

function requireApiAuth(req: Request, res: Response, next: NextFunction) {
  if (!config.requireApiAuth) {
    next();
    return;
  }

  const token = getTokenFromAuthHeader(req);
  if (!token) {
    sendError(res, 401, "UNAUTHORIZED", "Authentication required.", req);
    return;
  }

  if (config.apiAuthToken && secureEqualToken(config.apiAuthToken, token)) {
    if (!isInternalApiCallerAllowed(req)) {
      sendError(res, 401, "UNAUTHORIZED", "API auth token is restricted to internal callers.", req);
      return;
    }
    setAuthUid(req, null);
    next();
    return;
  }

  verifyFirebaseBearerToken(token)
    .then((uid) => {
      if (!uid) {
        sendError(res, 401, "UNAUTHORIZED", "Invalid auth token.", req);
        return;
      }
      setAuthUid(req, uid);
      next();
    })
    .catch(() => {
      sendError(res, 401, "UNAUTHORIZED", "Invalid auth token.", req);
    });
}

function requireVerifiedUserAuth(req: Request, res: Response, next: NextFunction) {
  const token = getTokenFromAuthHeader(req);
  if (!token) {
    sendError(res, 401, "UNAUTHORIZED", "Authentication required.", req);
    return;
  }

  if (config.apiAuthToken && secureEqualToken(config.apiAuthToken, token)) {
    sendError(res, 401, "UNAUTHORIZED", "API auth token cannot be used for user routes.", req);
    return;
  }

  verifyFirebaseBearerToken(token)
    .then((uid) => {
      if (!uid) {
        sendError(res, 401, "UNAUTHORIZED", "Invalid auth token.", req);
        return;
      }
      setAuthUid(req, uid);
      next();
    })
    .catch(() => {
      sendError(res, 401, "UNAUTHORIZED", "Invalid auth token.", req);
    });
}

function requireUserId(req: Request, res: Response, next: NextFunction) {
  const authUid = (req as Request & { authUid?: string | null }).authUid;
  if (authUid) {
    const headerUid = getUserId(req);
    if (headerUid && headerUid !== authUid) {
      sendError(res, 401, "UNAUTHORIZED", "X-User-Id does not match auth token.", req);
      return;
    }
    req.headers["x-user-id"] = authUid;
    next();
    return;
  }

  const userId = getUserId(req);
  if (!userId) {
    sendError(res, 400, "BAD_REQUEST", "X-User-Id header is required.", req);
    return;
  }
  next();
}

function requireVerifiedUserId(req: Request, res: Response, next: NextFunction) {
  const authUid = (req as Request & { authUid?: string | null }).authUid;
  if (!authUid) {
    sendError(res, 401, "UNAUTHORIZED", "Verified user authentication is required.", req);
    return;
  }

  const headerUid = getUserId(req);
  if (headerUid && headerUid !== authUid) {
    sendError(res, 401, "UNAUTHORIZED", "X-User-Id does not match auth token.", req);
    return;
  }

  req.headers["x-user-id"] = authUid;
  next();
}

function requireInternalApiAuth(req: Request, res: Response, next: NextFunction) {
  if (!config.apiAuthToken) {
    sendError(res, 503, "SERVICE_UNAVAILABLE", "Internal API token is not configured.", req);
    return;
  }

  const token = getTokenFromAuthHeader(req);
  if (!token || !secureEqualToken(config.apiAuthToken, token)) {
    sendError(res, 401, "UNAUTHORIZED", "Internal API authentication required.", req);
    return;
  }

  if (!isInternalApiCallerAllowed(req)) {
    sendError(res, 401, "UNAUTHORIZED", "Caller IP is not allowed.", req);
    return;
  }

  next();
}

function requireTherapyAdminAuth(req: Request, res: Response, next: NextFunction) {
  const proxyDecision = getTherapyAdminProxyDecision(req);
  if (proxyDecision.ok) {
    next();
    return;
  }

  if (config.adminProxyAuthRequired) {
    sendError(res, 401, "UNAUTHORIZED", "Admin proxy authentication required.", req);
    return;
  }

  if (proxyDecision.attempted) {
    sendError(res, 401, "UNAUTHORIZED", "Invalid admin proxy authentication headers.", req);
    return;
  }

  requireInternalApiAuth(req, res, next);
}

function rateLimited(scope: "chat" | "premium" | "webhook") {
  const max = scope === "chat" ? config.chatRateLimitMax : scope === "premium" ? config.premiumRateLimitMax : config.webhookRateLimitMax;
  const windowMs = scope === "chat" ? config.chatRateLimitWindowMs : scope === "premium" ? config.premiumRateLimitWindowMs : config.webhookRateLimitWindowMs;

  return (req: Request, res: Response, next: NextFunction) => {
    const ip = getRequestIp(req) || "unknown";
    const userId = scope === "webhook" ? "" : getUserId(req);
    const identityKey = userId ? `uid:${userId}` : `ip:${ip}`;
    const key = `${scope}:${identityKey}`;
    const decision = consumeRateLimit(key, max, windowMs);
    const now = Date.now();
    const resetAfterSeconds = Math.max(1, Math.ceil((decision.resetAt - now) / 1000));

    res.setHeader("RateLimit-Limit", String(decision.limit));
    res.setHeader("RateLimit-Remaining", String(decision.remaining));
    res.setHeader("RateLimit-Reset", String(resetAfterSeconds));

    if (!decision.allowed) {
      sendError(res, 429, "RATE_LIMITED", "Too many requests. Try again later.", req);
      return;
    }

    if (scope !== "webhook") {
      res.setHeader("X-RateLimit-Scope", scope);
    }
    next();
  };
}

app.use((req, res, next) => {
  const startedAt = Date.now();
  (req as Request & { id?: string }).id = randomUUID();
  res.setHeader("X-Request-Id", requestId(req));

  res.on("finish", () => {
    const durationMs = Date.now() - startedAt;
    const routeMetric = ensureRouteMetric(routeKey(req));
    routeMetric.total += 1;
    routeMetric.totalDurationMs += durationMs;
    routeMetric.maxDurationMs = Math.max(routeMetric.maxDurationMs, durationMs);
    if (res.statusCode >= 400 && res.statusCode < 500) {
      routeMetric.errors4xx += 1;
    } else if (res.statusCode >= 500) {
      routeMetric.errors5xx += 1;
    }

    if (ROUTE_METRICS.size > 150) {
      // Protect against unbounded label cardinality in metrics exports.
      ROUTE_METRICS.delete(ROUTE_METRICS.keys().next().value as string);
    }

    runtimeStats.requestCount += 1;
    runtimeStats.lastRequestAt = Date.now();
    runtimeStats.totalDurationMs += durationMs;
    runtimeStats.maxDurationMs = Math.max(runtimeStats.maxDurationMs, durationMs);

    if (config.nodeEnv === "test") {
      return;
    }

    const event = {
      statusCode: res.statusCode,
      durationMs,
      ip: getRequestIp(req),
    };

    if (res.statusCode >= 500) {
      logError(req, "Request completed with server error", event);
      return;
    }

    logInfo(req, "Request completed", event);
  });

  next();
});

app.use(
  cors({
    credentials: true,
    origin: (origin, callback) => {
      if (isOriginAllowed(origin)) {
        callback(null, true);
        return;
      }
      callback(new Error("CORS origin is not allowed"));
    },
  })
);

app.use(express.json({ limit: "1mb" }));

app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "no-referrer");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
  res.setHeader("Cross-Origin-Resource-Policy", "same-site");
  res.setHeader("Origin-Agent-Cluster", "?1");
  if (config.isProduction) {
    res.setHeader("Strict-Transport-Security", "max-age=63072000; includeSubDomains; preload");
  }
  next();
});

apiRouter.get("/health", async (_req, res) => {
  const snapshot = await getServiceHealthSnapshot(false);
  const status =
    snapshot.ready && !snapshot.degraded
      ? "up"
      : snapshot.ready
        ? "degraded"
        : "down";

  res.json({
    ok: true,
    status,
    ready: snapshot.ready,
    degraded: snapshot.degraded,
    blockers: snapshot.blockers,
    warnings: snapshot.warnings,
    ts: Date.now(),
    env: config.nodeEnv,
    uptimeSec: Math.floor(process.uptime()),
    serviceStartedAt: SERVICE_BOOT_TS,
    dependencies: snapshot.dependencies,
    runtime: snapshot.runtime,
    observability: {
      sentryEnabled: isObservabilityEnabled(),
      requestCount: runtimeStats.requestCount,
      clientErrorCount: runtimeStats.clientErrorCount,
      rateLimitedCount: runtimeStats.rateLimitedCount,
      notFoundCount: runtimeStats.notFoundCount,
      serverErrorCount: runtimeStats.serverErrorCount,
      lastServerErrorAt: runtimeStats.lastServerErrorAt,
      avgDurationMs: snapshot.runtime.avgDurationMs,
      maxDurationMs: snapshot.runtime.maxDurationMs,
      chatUpstreamSuccessCount: snapshot.runtime.chatUpstreamSuccessCount,
      chatUpstreamFailureCount: snapshot.runtime.chatUpstreamFailureCount,
    },
  });
});

apiRouter.get("/ready", async (_req, res) => {
  const snapshot = await getServiceHealthSnapshot(true);
  const status = snapshot.ready ? 200 : 503;

  res.status(status).json({
    ok: snapshot.ready,
    status: snapshot.ready ? "ready" : "not_ready",
    ts: Date.now(),
    blockers: snapshot.blockers,
    warnings: snapshot.warnings,
    dependencies: snapshot.dependencies,
  });
});

apiRouter.get("/metrics", async (req, res) => {
  if (!config.metricsEnabled) {
    return sendError(res, 404, "NOT_FOUND", "Route not found: GET /metrics", req);
  }

  if (!metricsAuthIsValid(req)) {
    return sendError(res, 401, "UNAUTHORIZED", "Metrics authentication required.", req);
  }

  const payload = await buildMetricsPayload();
  res.setHeader("Content-Type", "text/plain; version=0.0.4; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  return res.status(200).send(payload);
});

apiRouter.get("/blocklist", async (req, res) => {
  await proxyCoreRead(req, res, "/v1/blocklist");
});

apiRouter.get("/patterns", async (req, res) => {
  await proxyCoreRead(req, res, "/v1/patterns");
});

apiRouter.post("/verify-signature", async (req, res) => {
  await proxyCorePostJson(req, res, "/v1/verify-signature");
});

apiRouter.get("/explore/reality-feed", async (req, res) => {
  try {
    const feed = await getRealityFeed();
    res.setHeader("Cache-Control", "public, max-age=120");
    return res.json({
      ok: true,
      source: feed.source,
      generatedAt: feed.generatedAt,
      items: feed.items,
    });
  } catch (error) {
    logError(req, "Reality feed fetch failed", {
      reason: summarizeError(error),
    });
    captureException(error, {
      route: "/v1/explore/reality-feed",
      requestId: requestId(req),
    });
    return sendError(res, 502, "UPSTREAM_ERROR", "Reality feed request failed", req);
  }
});

apiRouter.get("/premium/status", requireVerifiedUserAuth, requireVerifiedUserId, rateLimited("premium"), async (req, res) => {
  const state = await getPremiumStatus(getUserId(req));
  res.json({ ok: true, state });
});

apiRouter.post("/premium/sync", requireVerifiedUserAuth, requireVerifiedUserId, rateLimited("premium"), async (req, res) => {
  const body = parseBody(req, res, premiumSyncBodySchema);
  if (!body) return;

  const state = await syncPremiumState(getUserId(req), body.localState);
  res.json({ ok: true, state });
});

apiRouter.post("/premium/activate", requireVerifiedUserAuth, requireVerifiedUserId, rateLimited("premium"), async (req, res) => {
  const code = (req.body?.code ?? "").toString().trim().toUpperCase();
  const receipt = (req.body?.receipt ?? "").toString().trim();
  const platform = req.body?.platform === "android" ? "android" : "ios";
  const userId = getUserId(req);

  if (code) {
    if (!config.enablePremiumCodeActivation) {
      return sendError(res, 400, "PREMIUM_VALIDATION_FAILED", "Activation code flow is disabled", req);
    }
    if (!PREMIUM_CODES.has(code)) {
      return sendError(res, 400, "PREMIUM_VALIDATION_FAILED", "Invalid activation code", req);
    }
    const state = await grantPremiumFromCode(userId);
    logInfo(req, "Premium activated with code", { userId: maskUserId(userId) });
    return res.json({ ok: true, state });
  }

  if (!receipt) {
    return sendError(res, 400, "BAD_REQUEST", "receipt is required", req);
  }

  const validation = await validateReceipt(receipt, userId, platform);
  if (!validation.ok || !validation.active) {
    return sendError(res, 400, "PREMIUM_VALIDATION_FAILED", "Receipt validation failed", req);
  }

  const state = await grantPremiumFromReceipt({
    userId,
    source: validation.source ?? "subscription_monthly",
    platform,
    productId: validation.productId,
    transactionId: validation.transactionId,
    eventId: validation.eventId,
    expiresAt: validation.expiresAt ?? null,
    receipt,
  });

  logInfo(req, "Premium activated with receipt", { userId: maskUserId(userId), platform, source: validation.source ?? "subscription_monthly" });
  return res.json({ ok: true, state });
});

apiRouter.post("/iap/validate", requireVerifiedUserAuth, requireVerifiedUserId, rateLimited("premium"), async (req, res) => {
  const receipt = (req.body?.receipt ?? "").toString().trim();
  const platform = req.body?.platform === "android" ? "android" : "ios";
  const userId = getUserId(req);

  if (!receipt) {
    return sendError(res, 400, "BAD_REQUEST", "receipt is required", req);
  }

  const result = await validateReceipt(receipt, userId, platform);
  if (!result.ok || !result.active) {
    return sendError(res, 400, "PREMIUM_VALIDATION_FAILED", "Receipt validation failed", req);
  }

  res.json({ ok: true, result });
});

apiRouter.post("/premium/restore", requireVerifiedUserAuth, requireVerifiedUserId, rateLimited("premium"), async (req, res) => {
  const state = await restorePremium(getUserId(req));
  res.json({ ok: true, state });
});

apiRouter.post(
  "/diary/sync",
  requireVerifiedUserAuth,
  requireVerifiedUserId,
  rateLimited("premium"),
  async (req, res) => {
    const body = parseBody(req, res, diarySyncBodySchema);
    if (!body) return;
    const lastSyncAt = body.lastSyncAt ?? 0;

    const result = await syncDiaryState(getUserId(req), body.entries, lastSyncAt);
    res.setHeader("Cache-Control", "no-store");
    return res.json({ ok: true, ...result });
  }
);

apiRouter.post(
  "/urge/sync",
  requireVerifiedUserAuth,
  requireVerifiedUserId,
  rateLimited("premium"),
  async (req, res) => {
    const body = parseBody(req, res, urgeSyncBodySchema);
    if (!body) return;
    const lastSyncAt = body.lastSyncAt ?? 0;

    const result = await syncUrgeState(getUserId(req), body.logs, lastSyncAt);
    res.setHeader("Cache-Control", "no-store");
    return res.json({ ok: true, ...result });
  }
);

apiRouter.post(
  "/money-protection/sync",
  requireVerifiedUserAuth,
  requireVerifiedUserId,
  rateLimited("premium"),
  async (req, res) => {
    const body = parseBody(req, res, moneyProtectionSyncBodySchema);
    if (!body) return;
    const lastSyncAt = body.lastSyncAt ?? 0;

    const result = await syncMoneyProtectionState(getUserId(req), body.state, lastSyncAt);
    res.setHeader("Cache-Control", "no-store");
    return res.json({ ok: true, ...result });
  }
);

apiRouter.get(
  "/money-protection/history",
  requireVerifiedUserAuth,
  requireVerifiedUserId,
  rateLimited("premium"),
  async (req, res) => {
    const limitRaw = req.query?.limit;
    const limitParsed = typeof limitRaw === "string" ? Number.parseInt(limitRaw, 10) : NaN;
    const limit = Number.isFinite(limitParsed) && limitParsed > 0
      ? Math.min(200, limitParsed)
      : 50;

    const events = await getMoneyProtectionHistory(getUserId(req), limit);
    res.setHeader("Cache-Control", "no-store");
    return res.json({ ok: true, events, serverTime: Date.now() });
  }
);

apiRouter.post(
  "/therapy/callback",
  requireVerifiedUserAuth,
  requireVerifiedUserId,
  rateLimited("premium"),
  async (req, res) => {
    const body = parseBody(req, res, therapyCallbackBodySchema);
    if (!body) return;

    try {
      const queued = await enqueueTherapyCallback(getUserId(req), body, config.supportEmail);
      res.setHeader("Cache-Control", "no-store");
      return res.status(202).json({ ok: true, ...queued });
    } catch (error) {
      if (error instanceof Error && error.message === "invalid_phone") {
        return sendError(res, 400, "BAD_REQUEST", "phone is invalid", req);
      }
      throw error;
    }
  }
);

apiRouter.get(
  "/therapy/callback/history",
  requireVerifiedUserAuth,
  requireVerifiedUserId,
  rateLimited("premium"),
  async (req, res) => {
    const limitRaw = req.query?.limit;
    const limitParsed = typeof limitRaw === "string" ? Number.parseInt(limitRaw, 10) : NaN;
    const limit =
      Number.isFinite(limitParsed) && limitParsed > 0 ? Math.min(100, limitParsed) : 20;

    const requests = await getTherapyCallbackHistory(getUserId(req), limit);
    res.setHeader("Cache-Control", "no-store");
    return res.json({ ok: true, requests, serverTime: Date.now() });
  }
);

apiRouter.post(
  "/accountability/alert",
  requireVerifiedUserAuth,
  requireVerifiedUserId,
  rateLimited("premium"),
  async (req, res) => {
    const body = parseBody(req, res, accountabilityAlertBodySchema);
    if (!body) return;
    const userId = getUserId(req);
    const idempotencyKey = getHeaderValue(req, "x-idempotency-key");
    const now = Date.now();
    const guardDecision = evaluateAccountabilityGuard(
      {
        userId,
        idempotencyKey,
        now,
      },
      {
        cooldownMs: config.accountabilitySmsCooldownMs,
        dailyLimit: config.accountabilitySmsDailyLimit,
        idempotencyWindowMs: config.accountabilitySmsIdempotencyWindowMs,
      }
    );

    if (guardDecision.kind === "duplicate") {
      res.setHeader("Cache-Control", "no-store");
      return res.json({
        ok: true,
        ...guardDecision.delivery,
        deduplicated: true,
        serverTime: now,
      });
    }

    if (guardDecision.kind === "deny") {
      const retryAfterSec = Math.max(1, Math.ceil(guardDecision.retryAfterMs / 1000));
      res.setHeader("Retry-After", String(retryAfterSec));
      const message =
        guardDecision.reason === "cooldown"
          ? "Accountability alert cooldown is active"
          : "Daily accountability alert limit reached";
      return sendError(res, 429, "RATE_LIMITED", message, req);
    }

    try {
      const delivery = await sendAccountabilityAlert({
        phone: body.phone,
        message: body.message,
      });
      recordAccountabilityGuardSuccess(
        {
          userId,
          idempotencyKey,
          now,
          delivery,
        },
        {
          cooldownMs: config.accountabilitySmsCooldownMs,
          dailyLimit: config.accountabilitySmsDailyLimit,
          idempotencyWindowMs: config.accountabilitySmsIdempotencyWindowMs,
        }
      );
      res.setHeader("Cache-Control", "no-store");
      return res.json({
        ok: true,
        ...delivery,
        serverTime: Date.now(),
      });
    } catch (error) {
      if (error instanceof AccountabilityAlertValidationError) {
        if (error.code === "invalid_phone") {
          return sendError(res, 400, "BAD_REQUEST", "phone is invalid", req);
        }
        if (error.code === "invalid_message") {
          return sendError(res, 400, "BAD_REQUEST", "message is required", req);
        }
      }

      if (error instanceof AccountabilityAlertUpstreamError) {
        logError(req, "Accountability alert delivery failed", {
          reason: error.code,
          statusCode: error.statusCode ?? null,
          userId: maskUserId(getUserId(req)),
        });
        return sendError(res, 502, "UPSTREAM_ERROR", "Accountability alert delivery failed", req);
      }

      throw error;
    }
  }
);

apiRouter.get(
  "/therapy/callback/queue",
  requireTherapyAdminAuth,
  rateLimited("premium"),
  async (req, res) => {
    const statusRaw = typeof req.query?.status === "string" ? req.query.status.trim() : "queued";
    const status =
      statusRaw === "all" || statusRaw === "queued" || statusRaw === "contacted" || statusRaw === "closed"
        ? statusRaw
        : "queued";

    const limitRaw = req.query?.limit;
    const limitParsed = typeof limitRaw === "string" ? Number.parseInt(limitRaw, 10) : NaN;
    const limit =
      Number.isFinite(limitParsed) && limitParsed > 0 ? Math.min(200, limitParsed) : 50;

    const requests = await listTherapyCallbackQueue(status, limit);
    const totalQueued = await getQueuedTherapyCallbackCount();
    res.setHeader("Cache-Control", "no-store");
    return res.json({ ok: true, requests, totalQueued, serverTime: Date.now() });
  }
);

apiRouter.patch(
  "/therapy/callback/:requestId/status",
  requireTherapyAdminAuth,
  rateLimited("premium"),
  async (req, res) => {
    const requestId = typeof req.params?.requestId === "string" ? req.params.requestId : "";
    const body = parseBody(req, res, therapyCallbackAdminUpdateBodySchema);
    if (!body) return;
    const status = body.status;
    const adminNote = body.adminNote;

    try {
      const updated = await updateTherapyCallbackStatus(requestId, status, adminNote);
      if (!updated) {
        return sendError(res, 404, "NOT_FOUND", "Therapy callback request not found", req);
      }
      res.setHeader("Cache-Control", "no-store");
      return res.json({ ok: true, request: updated, serverTime: Date.now() });
    } catch (error) {
      if (error instanceof Error && error.message === "invalid_request_id") {
        return sendError(res, 400, "BAD_REQUEST", "requestId is invalid", req);
      }
      if (error instanceof Error && error.message === "invalid_status") {
        return sendError(res, 400, "BAD_REQUEST", "status is invalid", req);
      }
      throw error;
    }
  }
);

apiRouter.post("/iap/webhook", rateLimited("webhook"), async (req, res) => {
  const token = getTokenFromAuthHeader(req);
  if (!token || !secureEqualToken(config.iapWebhookSecret, token)) {
    return sendError(res, 401, "UNAUTHORIZED", "Invalid webhook token", req);
  }

  const body = parseBody(req, res, webhookBodySchema);
  if (!body) return;

  const state = await applyWebhookEvent({
    eventId: body.eventId,
    userId: body.userId,
    transactionId: body.transactionId,
    productId: body.productId,
    source: body.source,
    platform: body.platform ?? "unknown",
    type: body.type,
    expiresAt: body.expiresAt ?? null,
  });

  logInfo(req, "Webhook applied", { userId: maskUserId(body.userId), type: body.type, productId: body.productId });
  res.json({ ok: true, state });
});

apiRouter.post("/chat", requireApiAuth, requireUserId, rateLimited("chat"), async (req, res) => {
  if (!isAiProviderConfigured()) {
    return sendError(
      res,
      503,
      "SERVICE_UNAVAILABLE",
      `${getAiProviderKeyLabel()} is not configured`,
      req
    );
  }

  const body = parseBody(req, res, chatRequestBodySchema);
  if (!body) return;
  const messages = body.messages;
  const locale = normalizeChatLocale(body.locale || body.coachingContext?.locale);
  const systemPrompt = buildSystemPrompt(locale, body.coachingContext);

  const sanitized = sanitizeClientMessages(messages);

  if (sanitized.length === 0) {
    return sendError(res, 400, "BAD_REQUEST", "messages cannot be empty", req);
  }

  const totalContentLength = sanitized.reduce((sum, item) => sum + item.content.length, 0);
  if (totalContentLength > 6000) {
    return sendError(res, 400, "BAD_REQUEST", "messages are too large", req);
  }

  if (!openAiCircuitAllowsRequest()) {
    return sendError(
      res,
      503,
      "SERVICE_UNAVAILABLE",
      "AI service is temporarily unavailable. Please retry shortly.",
      req
    );
  }

  try {
    const completion = await createChatCompletionWithRetry(
      req,
      systemPrompt,
      sanitized as ChatCompletionMessageParam[]
    );
    const reply = completion.reply;

    res.setHeader("Cache-Control", "no-store");
    return res.json({ ok: true, reply });
  } catch (error) {
    const reason = error instanceof Error ? error.message : "Unknown error";
    logError(req, `${config.aiProvider.toUpperCase()} /chat failed`, {
      reason,
      circuitState: openAiCircuit.state,
      failureCount: openAiCircuit.failureCount,
    });
    captureException(error, {
      route: "/v1/chat",
      requestId: requestId(req),
    });
    return sendError(res, 502, "UPSTREAM_ERROR", "AI request failed", req);
  }
});

app.use("/", apiRouter);
app.use("/v1", apiRouter);

app.use((req, res) => {
  sendError(res, 404, "NOT_FOUND", `Route not found: ${req.method} ${req.path}`, req);
});

app.use((err: Error, req: Request, res: Response, _next: NextFunction) => {
  logError(req, "Unhandled server error", { reason: err.message });
  captureException(err, {
    route: req.path,
    method: req.method,
    requestId: requestId(req),
  });
  void sendOperationalAlert({
    level: "critical",
    title: "Unhandled server error",
    message: err.message || "Unknown unhandled error",
    fingerprint: `unhandled:${req.method}:${req.path}`,
    context: {
      route: req.path,
      method: req.method,
      requestId: requestId(req),
    },
  });
  sendError(res, 500, "INTERNAL_ERROR", "Unexpected server error", req);
});

async function start() {
  try {
    await initializePremiumStore(
      config.premiumDataFile,
      config.premiumDbPath,
      config.databaseUrl || undefined
    );
    await initializeDiaryStore(
      config.diaryDataFile,
      config.databaseUrl || undefined
    );
    await initializeUrgeStore(
      config.urgeDataFile,
      config.databaseUrl || undefined
    );
    await initializeMoneyProtectionStore(
      config.moneyProtectionDataFile,
      config.databaseUrl || undefined
    );
    await initializeTherapyCallbackStore(
      config.therapyCallbackDataFile,
      config.databaseUrl || undefined
    );
    premiumStoreReady = true;
  } catch (error) {
    premiumStoreReady = false;
    throw error;
  }

  await new Promise<void>((resolve, reject) => {
    const server = app.listen(config.port, () => {
      httpServer = server;
      console.log(
        JSON.stringify({
          level: "info",
          message: `AI server running on http://localhost:${config.port}`,
        })
      );
      resolve();
    });

    server.once("error", (err) => {
      reject(err);
    });
  });
}

export { app, start };

if (require.main === module) {
  const handleShutdown = async (signal: NodeJS.Signals) => {
    console.log(JSON.stringify({ level: "info", message: `Received ${signal}, shutting down` }));

    if (httpServer) {
      await new Promise<void>((resolve) => {
        const closeTimeout = setTimeout(resolve, 5000);
        httpServer?.close(() => {
          clearTimeout(closeTimeout);
          resolve();
        });
      });
      httpServer = null;
    }

    await flushObservability().catch(() => {});
    process.exit(0);
  };

  process.on("SIGINT", () => {
    void handleShutdown("SIGINT");
  });
  process.on("SIGTERM", () => {
    void handleShutdown("SIGTERM");
  });

  start().catch((error) => {
    captureException(error, { stage: "startup" });
    console.error(JSON.stringify({ level: "error", message: "Server bootstrap failed", reason: String(error) }));
    void sendOperationalAlert({
      level: "critical",
      title: "Server bootstrap failed",
      message: error instanceof Error ? error.message : String(error),
      fingerprint: "server_bootstrap_failed",
      context: {
        stage: "startup",
      },
    }).finally(() => {
      flushObservability().catch(() => {}).finally(() => {
        process.exit(1);
      });
    });
  });
}
