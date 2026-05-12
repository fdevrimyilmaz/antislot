/**
 * AntiSlot Backend API Server
 * Fastify + TypeScript
 */

import { timingSafeEqual } from 'crypto';
import Fastify, { type FastifyReply, type FastifyRequest } from 'fastify';
import cors from '@fastify/cors';
import { config, type AiProvider } from './config';
import { BlocklistStorage } from './storage/blocklist-storage';
import { PatternsStorage } from './storage/patterns-storage';
import { generateSignature } from './utils/signature';
import { setupCacheMiddleware, setCacheControl } from './middleware/cache';
import { HealthResponse, BlocklistResponse, PatternsResponse } from './types';
import { handleTelegramUpdate } from './services/telegram';

type ChatRole = 'system' | 'user' | 'assistant';
type ChatMessage = { role: ChatRole; content: string };
type IncomingMessage = { role?: string; content?: string };
type LegacyHistoryItem = { role?: string; content?: string };
type AiChatRequest = { message?: string; history?: LegacyHistoryItem[]; messages?: IncomingMessage[] };
type AiChatTypedRequest = FastifyRequest<{ Body: AiChatRequest }>;

type GeminiPart = { text: string };
type GeminiContent = { role: 'user' | 'model'; parts: GeminiPart[] };

const fastify = Fastify({
  logger: {
    level: config.nodeEnv === 'production' ? 'info' : 'debug'
  }
});

fastify.register(cors, {
  origin: true
});

setupCacheMiddleware(fastify);

const blocklistStorage = new BlocklistStorage();
const patternsStorage = new PatternsStorage();

const AI_SYSTEM_PROMPT =
  'Sen YAPAY ANTI adli, Turkce konusan destek asistanisin. ' +
  'Amacin: Kumar durtusu ve stres aninda kisa, sakinlestirici ve uygulanabilir adimlar sunmak. ' +
  'Profesyonel yardimin yerine gecmezsin; tani veya tedavi vermezsin. ' +
  'Kullanici acil tehlike, kendine zarar verme veya baskasinin guvende olmadigi bir durumdan bahsederse ' +
  '112\'yi aramasini ve guvendigi birine ulasmasini oner. ' +
  'Kumar oynama stratejileri, bahis, kazanma taktikleri veya kumar nasil oynanir gibi icerik vermezsin. ' +
  'Yanitin 3-6 maddelik, kisa ve net olsun; en sonda bir takip sorusu sor.';

function sanitizeMessages(raw: unknown): ChatMessage[] {
  if (!Array.isArray(raw)) return [];

  return raw
    .filter((item) => item && typeof item === 'object')
    .map((item) => {
      const role = String((item as IncomingMessage).role || '').trim();
      const content = String((item as IncomingMessage).content || '').trim();
      return { role, content };
    })
    .filter((item) => ['system', 'user', 'assistant'].includes(item.role) && item.content.length > 0)
    .map((item) => ({
      role: item.role as ChatRole,
      content: item.content.slice(0, 1200)
    }))
    .slice(-16);
}

function extractChatMessages(body: AiChatRequest | undefined): ChatMessage[] {
  if (!body) return [];

  const structuredMessages = sanitizeMessages(body.messages);
  if (structuredMessages.length > 0) {
    return structuredMessages;
  }

  const history = sanitizeMessages(Array.isArray(body.history) ? body.history : []);
  const next = typeof body.message === 'string' ? body.message.trim() : '';
  if (!next) return history;

  const userMessage: ChatMessage = { role: 'user', content: next.slice(0, 1200) };
  return [...history, userMessage].slice(-16);
}

function normalizeGeminiContents(messages: ChatMessage[]): GeminiContent[] {
  const contents: GeminiContent[] = [];

  for (const message of messages) {
    if (!message.content.trim()) continue;

    if (message.role === 'assistant') {
      contents.push({ role: 'model', parts: [{ text: message.content }] });
      continue;
    }

    if (message.role === 'user') {
      contents.push({ role: 'user', parts: [{ text: message.content }] });
    }
  }

  if (contents.length === 0) {
    const fallback = messages[messages.length - 1]?.content?.trim();
    if (fallback) {
      contents.push({ role: 'user', parts: [{ text: fallback }] });
    }
  }

  return contents;
}

function isAiConfigured(provider: AiProvider): boolean {
  if (provider === 'gemini') {
    return (config.geminiApiKey || '').trim().length > 0;
  }
  return (config.openAiApiKey || '').trim().length > 0;
}

async function completeWithOpenAi(messages: ChatMessage[]): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), config.openAiTimeoutMs);

  try {
    const response = await fetch(`${config.openAiBaseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.openAiApiKey}`
      },
      body: JSON.stringify({
        model: config.openAiModel,
        messages: [{ role: 'system', content: AI_SYSTEM_PROMPT }, ...messages],
        temperature: 0.4,
        max_tokens: config.openAiMaxTokens
      }),
      signal: controller.signal
    });

    if (!response.ok) {
      const errorBody = await response.text().catch(() => '');
      throw new Error(`openai_http_${response.status}:${errorBody.slice(0, 300)}`);
    }

    const data = (await response.json()) as {
      choices?: { message?: { content?: string } }[];
    };

    const replyText = data?.choices?.[0]?.message?.content?.trim();
    if (!replyText) {
      throw new Error('openai_empty_reply');
    }

    return replyText;
  } finally {
    clearTimeout(timeout);
  }
}

async function completeWithGemini(messages: ChatMessage[]): Promise<string> {
  const contents = normalizeGeminiContents(messages);
  if (contents.length === 0) {
    throw new Error('gemini_empty_prompt');
  }

  const endpoint = `${config.geminiBaseUrl}/models/${encodeURIComponent(
    config.geminiModel
  )}:generateContent?key=${encodeURIComponent(config.geminiApiKey)}`;

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      system_instruction: {
        parts: [{ text: AI_SYSTEM_PROMPT }]
      },
      contents,
      generationConfig: {
        temperature: 0.4,
        maxOutputTokens: Math.max(64, Math.min(1024, config.openAiMaxTokens * 2))
      }
    })
  });

  if (!response.ok) {
    const errorBody = await response.text().catch(() => '');
    throw new Error(`gemini_http_${response.status}:${errorBody.slice(0, 300)}`);
  }

  const payload = (await response.json()) as {
    candidates?: {
      content?: { parts?: { text?: string }[] };
    }[];
  };

  const replyText = (payload.candidates?.[0]?.content?.parts || [])
    .map((part) => part.text || '')
    .join(' ')
    .trim();

  if (!replyText) {
    throw new Error('gemini_empty_reply');
  }

  return replyText;
}

async function completeWithProvider(provider: AiProvider, messages: ChatMessage[]): Promise<string> {
  if (provider === 'gemini') {
    return completeWithGemini(messages);
  }
  return completeWithOpenAi(messages);
}

type RedeemRequest = { code?: unknown };
type RedeemTypedRequest = FastifyRequest<{ Body: RedeemRequest }>;

function constantTimeMatch(input: string, allowed: readonly string[]): boolean {
  const inputBuffer = Buffer.from(input);
  let matched = false;

  for (const candidate of allowed) {
    const candidateBuffer = Buffer.from(candidate);
    if (candidateBuffer.length !== inputBuffer.length) {
      // Still perform a compare against the candidate to keep timing roughly stable.
      const padded = Buffer.alloc(candidateBuffer.length);
      timingSafeEqual(padded, candidateBuffer);
      continue;
    }
    if (timingSafeEqual(inputBuffer, candidateBuffer)) {
      matched = true;
    }
  }

  return matched;
}

async function handleRedeem(request: RedeemTypedRequest, reply: FastifyReply) {
  reply.header('Cache-Control', 'no-store');

  const rawCode = typeof request.body?.code === 'string' ? request.body.code : '';
  const normalized = rawCode.trim().toUpperCase();

  if (!normalized || normalized.length > 64) {
    return reply.code(400).send({ ok: false, error: 'INVALID_CODE' });
  }

  if (config.premiumAccessCodes.length === 0) {
    return reply.code(503).send({ ok: false, error: 'REDEEM_NOT_CONFIGURED' });
  }

  if (!constantTimeMatch(normalized, config.premiumAccessCodes)) {
    return reply.code(401).send({ ok: false, error: 'INVALID_CODE' });
  }

  return reply.send({ ok: true, source: 'code' });
}

async function handleAiChat(request: AiChatTypedRequest, reply: FastifyReply) {
  reply.header('Cache-Control', 'no-store');

  const messages = extractChatMessages(request.body);
  if (messages.length === 0) {
    return reply.code(400).send({ error: 'EMPTY_MESSAGE' });
  }

  const provider = config.aiProvider;
  if (!isAiConfigured(provider)) {
    return reply.code(503).send({ error: 'AI_NOT_CONFIGURED', provider });
  }

  try {
    const replyText = await completeWithProvider(provider, messages);
    const model = provider === 'gemini' ? config.geminiModel : config.openAiModel;
    return reply.send({ reply: replyText, model, provider });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown AI error';
    fastify.log.error({ provider, error: errorMessage }, 'AI request failed');
    return reply.code(502).send({ error: 'AI_UPSTREAM_ERROR', provider });
  }
}

fastify.get('/', async (_request, reply) => {
  reply.header('Cache-Control', 'no-store');
  return reply.send({
    ok: true,
    service: 'antislot-backend',
    health: '/v1/health',
    aiProvider: config.aiProvider,
    aiChatPath: '/chat'
  });
});

fastify.get('/health', async (_request, reply) => {
  reply.header('Cache-Control', 'no-store');
  return reply.send({ status: 'ok', service: 'antislot-backend', aiProvider: config.aiProvider });
});

/**
 * GET /v1/health
 */
fastify.get('/v1/health', async (_request, reply) => {
  setCacheControl(reply, config.cacheControl.health);

  const blocklistMeta = await blocklistStorage.getMetadata();
  const patternsMeta = await patternsStorage.getMetadata();
  const domains = await blocklistStorage.getDomains();
  const patternsData = await patternsStorage.load();

  const response: HealthResponse = {
    status: 'ok',
    timestamp: Date.now(),
    version: '1.0.0',
    blocklistVersion: blocklistMeta.version,
    blocklistCount: domains.length,
    patternsVersion: patternsMeta.version,
    patternsCount: patternsData.patterns.length
  };

  return reply.send(response);
});

/**
 * GET /v1/blocklist
 */
fastify.get('/v1/blocklist', async (_request, reply) => {
  setCacheControl(reply, config.cacheControl.blocklist);

  const metadata = await blocklistStorage.getMetadata();
  const domains = await blocklistStorage.getDomains();

  const payload = {
    version: metadata.version,
    updatedAt: metadata.updatedAt,
    domains
  };

  const signature = generateSignature(payload);

  const response: BlocklistResponse = {
    ...payload,
    signature
  };

  return reply.send(response);
});

/**
 * GET /v1/patterns
 */
fastify.get('/v1/patterns', async (_request, reply) => {
  setCacheControl(reply, config.cacheControl.patterns);

  const metadata = await patternsStorage.getMetadata();
  const patternsData = await patternsStorage.load();

  const payload = {
    version: metadata.version,
    updatedAt: metadata.updatedAt,
    patterns: patternsData.patterns
  };

  const signature = generateSignature(payload);

  const response: PatternsResponse = {
    ...payload,
    signature
  };

  return reply.send(response);
});

/**
 * AI chat endpoints
 * - /chat           (frontend currently uses this)
 * - /v1/ai/chat     (legacy compatibility)
 */
fastify.post('/chat', handleAiChat);
fastify.post('/v1/ai/chat', handleAiChat);

/**
 * Premium access code redemption
 */
fastify.post('/v1/premium/redeem', handleRedeem);

/**
 * Telegram admin webhook.
 *
 * The path includes a shared secret to thwart drive-by traffic. Telegram itself
 * additionally sends `X-Telegram-Bot-Api-Secret-Token` when configured via the
 * setWebhook API — we verify both.
 *
 * Configure via env:
 *   TELEGRAM_BOT_TOKEN
 *   TELEGRAM_WEBHOOK_SECRET
 *   TELEGRAM_ADMIN_CHAT_IDS  (comma-separated)
 */
type TelegramWebhookParams = { Params: { secret: string }; Body: unknown };

fastify.post(
  '/v1/telegram/webhook/:secret',
  async (request: FastifyRequest<TelegramWebhookParams>, reply: FastifyReply) => {
    reply.header('Cache-Control', 'no-store');

    if (
      !config.telegramBotToken ||
      !config.telegramWebhookSecret ||
      config.telegramAdminChatIds.length === 0
    ) {
      return reply.code(503).send({ ok: false, error: 'TELEGRAM_NOT_CONFIGURED' });
    }

    const provided = request.params?.secret ?? '';
    const expected = config.telegramWebhookSecret;
    const providedBuf = Buffer.from(provided);
    const expectedBuf = Buffer.from(expected);
    const pathOk =
      providedBuf.length === expectedBuf.length &&
      timingSafeEqual(providedBuf, expectedBuf);

    const headerToken = (request.headers['x-telegram-bot-api-secret-token'] || '') as string;
    const headerOk = headerToken === expected || headerToken === '';

    if (!pathOk || !headerOk) {
      // Return 200 anyway so Telegram does not keep retrying with the wrong URL.
      fastify.log.warn({ pathOk, headerOk }, 'telegram webhook rejected');
      return reply.code(200).send({ ok: true });
    }

    const update = (request.body || {}) as Parameters<typeof handleTelegramUpdate>[0];
    const result = await handleTelegramUpdate(update, blocklistStorage, fastify.log);
    return reply.code(200).send({ ok: result.ok });
  }
);

/**
 * Start server
 */
async function start() {
  try {
    await blocklistStorage.initialize();
    await patternsStorage.initialize();

    const address = await fastify.listen({
      port: config.port,
      host: '0.0.0.0'
    });

    fastify.log.info(`AntiSlot Backend API is running at ${address}`);
    fastify.log.info(`Health endpoint: ${address}/v1/health`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
}

process.on('SIGINT', async () => {
  await fastify.close();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await fastify.close();
  process.exit(0);
});

if (require.main === module) {
  start();
}

export { fastify, blocklistStorage, patternsStorage };
