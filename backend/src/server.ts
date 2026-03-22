import { timingSafeEqual } from "crypto";

import cors from "@fastify/cors";
import swagger from "@fastify/swagger";
import swaggerUi from "@fastify/swagger-ui";
import Fastify, { FastifyReply } from "fastify";

import { config } from "./config";
import { verifyFirebaseBearerToken } from "./firebase-auth";
import { setCacheControl, setupCacheMiddleware } from "./middleware/cache";
import {
  captureException,
  flushObservability,
  initObservability,
  isObservabilityEnabled,
} from "./observability";
import { BlocklistStorage } from "./storage/blocklist-storage";
import { PatternsStorage } from "./storage/patterns-storage";
import {
  BlocklistResponse,
  HealthResponse,
  PatternsResponse,
  VerifySignatureResponse,
} from "./types";
import { generateSignature, verifySignature } from "./utils/signature";

type AiHistoryItem = { role: "user" | "assistant"; content: string };
type AiChatRequest = { message?: string; history?: AiHistoryItem[] };

type ApiErrorBody = {
  ok: false;
  error: {
    code: string;
    message: string;
    requestId: string;
  };
};

const fastify = Fastify({
  logger: {
    level: config.nodeEnv === "production" ? "info" : "debug",
    redact: [
      "req.headers.authorization",
      "headers.authorization",
      "body.history",
      "body.message",
      "body.receipt",
      "body.code",
    ],
  },
});

initObservability({
  dsn: config.sentryDsn,
  environment: config.sentryEnvironment,
  release: config.sentryRelease,
  tracesSampleRate: config.sentryTracesSampleRate,
  profilesSampleRate: config.sentryProfilesSampleRate,
});

const runtimeStats = {
  rateLimitedCount: 0,
  serverErrorCount: 0,
  lastServerErrorAt: 0,
};

function originAllowed(origin?: string): boolean {
  if (!origin) return true;
  if (config.corsAllowlist.length === 0 && !config.isProduction) return true;
  return config.corsAllowlist.includes(origin);
}

function secureEqualToken(expected: string, provided: string): boolean {
  const a = Buffer.from(expected);
  const b = Buffer.from(provided);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

function authTokenFromHeader(headerValue?: string): string {
  if (!headerValue) return "";
  const [scheme, token] = headerValue.split(" ");
  if (scheme?.toLowerCase() !== "bearer") return "";
  return token?.trim() ?? "";
}

function sendError(
  reply: FastifyReply,
  statusCode: number,
  code: string,
  message: string,
  requestId: string
) {
  if (code === "RATE_LIMITED") {
    runtimeStats.rateLimitedCount += 1;
  }
  if (statusCode >= 500) {
    runtimeStats.serverErrorCount += 1;
    runtimeStats.lastServerErrorAt = Date.now();
  }

  const body: ApiErrorBody = {
    ok: false,
    error: { code, message, requestId },
  };
  return reply.code(statusCode).send(body);
}

const aiRateLimitStore = new Map<string, { count: number; resetAt: number }>();

function consumeAiRateLimit(key: string): boolean {
  const now = Date.now();
  const current = aiRateLimitStore.get(key);

  if (!current || current.resetAt <= now) {
    aiRateLimitStore.set(key, {
      count: 1,
      resetAt: now + config.aiRateLimitWindowMs,
    });
    return true;
  }

  if (current.count >= config.aiRateLimitMax) {
    return false;
  }

  current.count += 1;
  aiRateLimitStore.set(key, current);
  return true;
}

const aiRateLimitCleanupInterval = setInterval(() => {
  const now = Date.now();
  for (const [key, value] of aiRateLimitStore.entries()) {
    if (value.resetAt <= now) {
      aiRateLimitStore.delete(key);
    }
  }
}, 60_000);

const aiRateLimitCleanupTimer = aiRateLimitCleanupInterval as unknown as NodeJS.Timeout;
if (typeof aiRateLimitCleanupTimer.unref === "function") {
  aiRateLimitCleanupTimer.unref();
}

fastify.register(cors, {
  credentials: true,
  origin: (origin, cb) => {
    if (originAllowed(origin)) {
      cb(null, true);
      return;
    }
    cb(new Error("CORS origin is not allowed"), false);
  },
});

fastify.register(swagger, {
  openapi: {
    info: {
      title: "AntiSlot Backend API",
      version: "1.0.0",
      description: "AntiSlot backend API endpoints",
    },
    servers: [{ url: `http://localhost:${config.port}`, description: "Local development" }],
  },
});

fastify.register(swaggerUi, {
  routePrefix: "/docs",
  uiConfig: {
    docExpansion: "list",
    deepLinking: false,
  },
});

setupCacheMiddleware(fastify);

fastify.addHook("onSend", async (request, reply, payload) => {
  reply.header("X-Request-Id", request.id);
  reply.header("X-Content-Type-Options", "nosniff");
  reply.header("X-Frame-Options", "DENY");
  reply.header("Referrer-Policy", "no-referrer");
  reply.header("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  if (config.isProduction) {
    reply.header("Strict-Transport-Security", "max-age=63072000; includeSubDomains; preload");
  }
  return payload;
});

const blocklistStorage = new BlocklistStorage();
const patternsStorage = new PatternsStorage();

const AI_SYSTEM_PROMPT =
  "Sen YAPAY ANTI adli, Turkce konusan destek asistanisin. " +
  "Amacin: Kumar durtusu ve stres aninda kisa, sakinlestirici ve uygulanabilir adimlar sunmak. " +
  "Profesyonel yardimin yerine gecmezsin; tani veya tedavi vermezsin. " +
  "Kullanici acil tehlike, kendine zarar verme veya baskasinin guvende olmadigi bir durumdan bahsederse " +
  "112'yi aramasini ve guvendigi birine ulasmasini oner. " +
  "Kumar oynama stratejileri, bahis, kazanma taktikleri veya kumar nasil oynanir gibi icerik vermezsin. " +
  "Yanitin 3-6 maddelik, kisa ve net olsun; en sonda bir takip sorusu sor.";

const errorResponseSchema = {
  type: "object",
  required: ["ok", "error"],
  properties: {
    ok: { type: "boolean", const: false },
    error: {
      type: "object",
      required: ["code", "message", "requestId"],
      properties: {
        code: { type: "string" },
        message: { type: "string" },
        requestId: { type: "string" },
      },
    },
  },
};

const healthResponseSchema = {
  type: "object",
  required: [
    "status",
    "timestamp",
    "version",
    "blocklistVersion",
    "blocklistCount",
    "patternsVersion",
    "patternsCount",
  ],
  properties: {
    status: { type: "string" },
    timestamp: { type: "number" },
    version: { type: "string" },
    blocklistVersion: { type: "number" },
    blocklistCount: { type: "number" },
    patternsVersion: { type: "number" },
    patternsCount: { type: "number" },
    uptimeSec: { type: "number" },
    observability: {
      type: "object",
      properties: {
        sentryEnabled: { type: "boolean" },
        rateLimitedCount: { type: "number" },
        serverErrorCount: { type: "number" },
        lastServerErrorAt: { type: "number" },
      },
    },
  },
};

const blocklistResponseSchema = {
  type: "object",
  required: ["version", "updatedAt", "domains", "signature"],
  properties: {
    version: { type: "number" },
    updatedAt: { type: "number" },
    domains: { type: "array", items: { type: "string" } },
    signature: { type: "string" },
  },
};

const patternsResponseSchema = {
  type: "object",
  required: ["version", "updatedAt", "patterns", "signature"],
  properties: {
    version: { type: "number" },
    updatedAt: { type: "number" },
    patterns: {
      type: "array",
      items: {
        type: "object",
        required: ["pattern", "type", "weight"],
        properties: {
          pattern: { type: "string" },
          type: { type: "string" },
          weight: { type: "number" },
        },
      },
    },
    signature: { type: "string" },
  },
};

const verifySignatureBodySchema = {
  type: "object",
  required: ["payload", "signature"],
  properties: {
    payload: {},
    signature: { type: "string", minLength: 64, maxLength: 128 },
  },
};

const verifySignatureResponseSchema = {
  type: "object",
  required: ["ok"],
  properties: {
    ok: { type: "boolean" },
  },
};

const aiHistoryItemSchema = {
  type: "object",
  required: ["role", "content"],
  properties: {
    role: { type: "string", enum: ["user", "assistant"] },
    content: { type: "string" },
  },
};

const aiChatRequestSchema = {
  type: "object",
  required: ["message"],
  properties: {
    message: { type: "string", minLength: 1 },
    history: { type: "array", items: aiHistoryItemSchema },
  },
};

const aiChatResponseSchema = {
  type: "object",
  required: ["reply", "model"],
  properties: {
    reply: { type: "string" },
    model: { type: "string" },
  },
};

function isAiProviderConfigured(): boolean {
  if (config.aiProvider === "gemini") {
    return Boolean(config.geminiApiKey);
  }
  return Boolean(config.openAiApiKey);
}

function getActiveAiModel(): string {
  return config.aiProvider === "gemini" ? config.geminiModel : config.openAiModel;
}

async function callOpenAi(messages: { role: string; content: string }[]) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), config.openAiTimeoutMs);

  try {
    const response = await fetch(`${config.openAiBaseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.openAiApiKey}`,
      },
      body: JSON.stringify({
        model: config.openAiModel,
        messages,
        temperature: 0.4,
        max_tokens: config.openAiMaxTokens,
      }),
      signal: controller.signal,
    });

    const data = await response.json().catch(() => null);
    return { ok: response.ok, status: response.status, data, replyText: "" };
  } finally {
    clearTimeout(timeout);
  }
}

async function callGemini(messages: { role: string; content: string }[]) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), config.openAiTimeoutMs);

  try {
    const contents = messages
      .map((item) => {
        const text = typeof item.content === "string" ? item.content.trim() : "";
        if (!text) return null;
        const role = item.role === "assistant" ? "model" : "user";
        return { role, parts: [{ text }] };
      })
      .filter(Boolean);

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
            temperature: 0.4,
            maxOutputTokens: config.openAiMaxTokens,
          },
        }),
        signal: controller.signal,
      }
    );

    const data = await response.json().catch(() => null);
    const replyText = (data?.candidates ?? [])
      .flatMap((candidate: { content?: { parts?: { text?: string }[] } }) =>
        candidate?.content?.parts ?? []
      )
      .map((part: { text?: string }) => part.text || "")
      .join(" ")
      .trim();

    return {
      ok: response.ok,
      status: response.status,
      data,
      replyText,
    };
  } finally {
    clearTimeout(timeout);
  }
}

async function callAiProvider(messages: { role: string; content: string }[]) {
  if (config.aiProvider === "gemini") {
    return callGemini(messages);
  }
  return callOpenAi(messages);
}

fastify.get(
  "/v1/health",
  {
    schema: {
      tags: ["system"],
      summary: "Health check",
      response: { 200: healthResponseSchema },
    },
  },
  async (_request, reply) => {
    setCacheControl(reply, config.cacheControl.health);

    const blocklistMeta = await blocklistStorage.getMetadata();
    const patternsMeta = await patternsStorage.getMetadata();
    const domains = await blocklistStorage.getDomains();
    const patternsData = await patternsStorage.load();

    const response: HealthResponse = {
      status: "ok",
      timestamp: Date.now(),
      version: "1.0.0",
      blocklistVersion: blocklistMeta.version,
      blocklistCount: domains.length,
      patternsVersion: patternsMeta.version,
      patternsCount: patternsData.patterns.length,
      uptimeSec: Math.floor(process.uptime()),
      observability: {
        sentryEnabled: isObservabilityEnabled(),
        rateLimitedCount: runtimeStats.rateLimitedCount,
        serverErrorCount: runtimeStats.serverErrorCount,
        lastServerErrorAt: runtimeStats.lastServerErrorAt,
      },
    };

    return reply.send(response);
  }
);

fastify.get(
  "/v1/blocklist",
  {
    schema: {
      tags: ["blocklist"],
      summary: "Get blocklist with signature",
      response: { 200: blocklistResponseSchema },
    },
  },
  async (_request, reply) => {
    setCacheControl(reply, config.cacheControl.blocklist);

    const metadata = await blocklistStorage.getMetadata();
    const domains = await blocklistStorage.getDomains();

    const payload = {
      version: metadata.version,
      updatedAt: metadata.updatedAt,
      domains,
    };

    const signature = generateSignature(payload);

    const response: BlocklistResponse = {
      ...payload,
      signature,
    };

    return reply.send(response);
  }
);

fastify.get(
  "/v1/patterns",
  {
    schema: {
      tags: ["blocklist"],
      summary: "Get patterns with signature",
      response: { 200: patternsResponseSchema },
    },
  },
  async (_request, reply) => {
    setCacheControl(reply, config.cacheControl.patterns);

    const metadata = await patternsStorage.getMetadata();
    const patternsData = await patternsStorage.load();

    const payload = {
      version: metadata.version,
      updatedAt: metadata.updatedAt,
      patterns: patternsData.patterns,
    };

    const signature = generateSignature(payload);

    const response: PatternsResponse = {
      ...payload,
      signature,
    };

    return reply.send(response);
  }
);

fastify.post(
  "/v1/verify-signature",
  {
    schema: {
      tags: ["blocklist"],
      summary: "Verify blocklist/patterns signature",
      body: verifySignatureBodySchema,
      response: { 200: verifySignatureResponseSchema },
    },
  },
  async (request, reply) => {
    reply.header("Cache-Control", "no-store");

    const body = request.body as { payload?: unknown; signature?: string } | undefined;
    if (!body || typeof body.signature !== "string" || typeof body.payload === "undefined") {
      return sendError(reply, 400, "BAD_REQUEST", "payload and signature are required.", request.id);
    }

    const response: VerifySignatureResponse = {
      ok: verifySignature(body.payload as string | object, body.signature),
    };
    return reply.send(response);
  }
);

fastify.post(
  "/v1/ai/chat",
  {
    schema: {
      tags: ["ai"],
      summary: "AI chat completion",
      body: aiChatRequestSchema,
      response: {
        200: aiChatResponseSchema,
        400: errorResponseSchema,
        401: errorResponseSchema,
        429: errorResponseSchema,
        502: errorResponseSchema,
        503: errorResponseSchema,
      },
    },
  },
  async (request, reply) => {
    reply.header("Cache-Control", "no-store");

    const requestId = request.id;

    if (config.requireApiAuth) {
      const token = authTokenFromHeader(request.headers.authorization);
      if (!token) {
        return sendError(reply, 401, "UNAUTHORIZED", "Authentication required.", requestId);
      }

      const tokenAuthorized = config.apiAuthToken && secureEqualToken(config.apiAuthToken, token);
      if (!tokenAuthorized) {
        const firebaseUid = await verifyFirebaseBearerToken(token);
        if (!firebaseUid) {
          return sendError(reply, 401, "UNAUTHORIZED", "Invalid auth token.", requestId);
        }
      }
    }

    const rateKey = `${request.ip}:ai-chat`;
    if (!consumeAiRateLimit(rateKey)) {
      return sendError(reply, 429, "RATE_LIMITED", "Too many requests. Try again later.", requestId);
    }

    if (!isAiProviderConfigured()) {
      return sendError(reply, 503, "SERVICE_UNAVAILABLE", "AI provider is not configured.", requestId);
    }

    const body = request.body as AiChatRequest | undefined;
    const message = body?.message?.trim();

    if (!message) {
      return sendError(reply, 400, "BAD_REQUEST", "Message is required.", requestId);
    }

    const history = Array.isArray(body?.history) ? body?.history : [];
    const sanitizedHistory = history
      .filter(
        (item) =>
          item &&
          typeof item.content === "string" &&
          (item.role === "user" || item.role === "assistant")
      )
      .slice(-8)
      .map((item) => ({ role: item.role, content: item.content.slice(0, 1200) }));

    const messages = [
      { role: "system", content: AI_SYSTEM_PROMPT },
      ...sanitizedHistory,
      { role: "user", content: message.slice(0, 1200) },
    ];

    try {
      let upstream = await callAiProvider(messages);
      if (!upstream.ok && (upstream.status === 429 || upstream.status >= 500)) {
        await new Promise((resolve) => setTimeout(resolve, 300));
        upstream = await callAiProvider(messages);
      }

      if (!upstream.ok) {
        fastify.log.warn(
          { requestId, upstreamStatus: upstream.status },
          "AI upstream request failed"
        );
        return sendError(reply, 502, "UPSTREAM_ERROR", "Upstream AI request failed.", requestId);
      }

      const replyText =
        upstream.replyText ||
        upstream.data?.choices?.[0]?.message?.content?.trim();
      if (!replyText) {
        return sendError(reply, 502, "UPSTREAM_ERROR", "AI returned an empty response.", requestId);
      }

      return reply.send({ reply: replyText, model: getActiveAiModel() });
    } catch (error) {
      const reason = error instanceof Error ? error.message : "Unknown error";
      fastify.log.error({ requestId, reason }, "AI request failure");
      captureException(error, {
        route: "/v1/ai/chat",
        requestId,
      });
      return sendError(reply, 502, "UPSTREAM_ERROR", "AI request failed.", requestId);
    }
  }
);

fastify.setNotFoundHandler((request, reply) => {
  const requestId = request.id;
  const body: ApiErrorBody = {
    ok: false,
    error: { code: "NOT_FOUND", message: `Route not found: ${request.method} ${request.url}`, requestId },
  };
  return reply.code(404).send(body);
});

fastify.setErrorHandler((error, request, reply) => {
  const requestId = request.id;
  const err = error as { validation?: unknown[]; statusCode?: number };
  if (err.validation) {
    const body: ApiErrorBody = {
      ok: false,
      error: { code: "BAD_REQUEST", message: "Validation failed", requestId },
    };
    return reply.code(400).send(body);
  }
  fastify.log.error({ requestId, err: error }, "Unhandled error");
  captureException(error, {
    requestId,
    route: request.url,
    method: request.method,
  });
  const body: ApiErrorBody = {
    ok: false,
    error: { code: "INTERNAL_ERROR", message: "Unexpected server error", requestId },
  };
  return reply.code(500).send(body);
});

async function start() {
  try {
    await blocklistStorage.initialize();
    await patternsStorage.initialize();

    const address = await fastify.listen({
      port: config.port,
      host: "0.0.0.0",
    });

    fastify.log.info(`AntiSlot Backend API running at ${address}`);
    fastify.log.info(`Health endpoint: ${address}/v1/health`);
  } catch (error) {
    fastify.log.error(error);
    captureException(error, {
      stage: "startup",
    });
    process.exit(1);
  }
}

process.on("SIGINT", async () => {
  await flushObservability().catch(() => {});
  await fastify.close();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  await flushObservability().catch(() => {});
  await fastify.close();
  process.exit(0);
});

if (require.main === module) {
  start();
}

export { blocklistStorage, fastify, patternsStorage };
