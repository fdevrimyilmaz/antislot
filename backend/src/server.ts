/**
 * AntiSlot Backend API Sunucusu
 * Fastify + TypeScript
 */

import Fastify from 'fastify';
import cors from '@fastify/cors';
import { config } from './config';
import { BlocklistStorage } from './storage/blocklist-storage';
import { PatternsStorage } from './storage/patterns-storage';
import { generateSignature } from './utils/signature';
import { setupCacheMiddleware, setCacheControl } from './middleware/cache';
import { HealthResponse, BlocklistResponse, PatternsResponse } from './types';

type AiHistoryItem = { role: 'user' | 'assistant'; content: string };
type AiChatRequest = { message?: string; history?: AiHistoryItem[] };

const fastify = Fastify({
  logger: {
    level: config.nodeEnv === 'production' ? 'info' : 'debug'
  }
});

// Eklentileri kaydet
fastify.register(cors, {
  origin: true // Üretimde tüm origin'lere izin ver, gerekirse yapılandır
});

// Önbellek ara katmanını ayarla (ETag + Cache-Control)
setupCacheMiddleware(fastify);

// Depolamayı başlat
const blocklistStorage = new BlocklistStorage();
const patternsStorage = new PatternsStorage();

const AI_SYSTEM_PROMPT =
  "Sen YAPAY ANTİ adli, Turkce konusan destek asistanisin. " +
  "Amacin: Kumar durtusu ve stres aninda kisa, sakinlestirici ve uygulanabilir adimlar sunmak. " +
  "Profesyonel yardimin yerine gecmezsin; tani veya tedavi vermezsin. " +
  "Kullanici acil tehlike, kendine zarar verme veya baskasinin guvende olmadigi bir durumdan bahsederse " +
  "112'yi aramasini ve guvendigi birine ulasmasini oner. " +
  "Kumar oynama stratejileri, bahis, kazanma taktikleri veya kumar nasil oynanir gibi icerik vermezsin. " +
  "Yanitin 3-6 maddelik, kisa ve net olsun; en sonda bir takip sorusu sor.";

/**
 * GET /v1/health
 * Sağlık kontrolü uç noktası
 */
fastify.get('/v1/health', async (request, reply) => {
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
 * Sürüm, updatedAt ve HMAC imzasıyla engel listesini döner
 */
fastify.get('/v1/blocklist', async (request, reply) => {
  setCacheControl(reply, config.cacheControl.blocklist);

  const metadata = await blocklistStorage.getMetadata();
  const domains = await blocklistStorage.getDomains();

  // Yanıt payload'u oluştur (şimdilik imzasız)
  const payload = {
    version: metadata.version,
    updatedAt: metadata.updatedAt,
    domains
  };

  // İmza üret
  const signature = generateSignature(payload);

  const response: BlocklistResponse = {
    ...payload,
    signature
  };

  return reply.send(response);
});

/**
 * GET /v1/patterns
 * Sürüm, updatedAt ve HMAC imzasıyla kalıpları döner
 */
fastify.get('/v1/patterns', async (request, reply) => {
  setCacheControl(reply, config.cacheControl.patterns);

  const metadata = await patternsStorage.getMetadata();
  const patternsData = await patternsStorage.load();

  // Yanıt payload'u oluştur (şimdilik imzasız)
  const payload = {
    version: metadata.version,
    updatedAt: metadata.updatedAt,
    patterns: patternsData.patterns
  };

  // İmza üret
  const signature = generateSignature(payload);

  const response: PatternsResponse = {
    ...payload,
    signature
  };

  return reply.send(response);
});

/**
 * POST /v1/ai/chat
 * YAPAY ANTİ sohbet yanıtı
 */
fastify.post('/v1/ai/chat', async (request, reply) => {
  reply.header('Cache-Control', 'no-store');

  if (!config.openAiApiKey) {
    return reply.code(503).send({ error: 'AI_NOT_CONFIGURED' });
  }

  const body = request.body as AiChatRequest | undefined;
  const message = body?.message?.trim();

  if (!message) {
    return reply.code(400).send({ error: 'EMPTY_MESSAGE' });
  }

  const history = Array.isArray(body?.history) ? body?.history : [];
  const sanitizedHistory = history
    .filter((item) => item && typeof item.content === 'string' && (item.role === 'user' || item.role === 'assistant'))
    .slice(-8)
    .map((item) => ({ role: item.role, content: item.content.slice(0, 1200) }));

  const messages = [
    { role: 'system', content: AI_SYSTEM_PROMPT },
    ...sanitizedHistory,
    { role: 'user', content: message.slice(0, 1200) }
  ];

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), config.openAiTimeoutMs);

  try {
    const aiResponse = await fetch(`${config.openAiBaseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.openAiApiKey}`
      },
      body: JSON.stringify({
        model: config.openAiModel,
        messages,
        temperature: 0.4,
        max_tokens: config.openAiMaxTokens
      }),
      signal: controller.signal
    });

    clearTimeout(timeout);

    if (!aiResponse.ok) {
      const errorBody = await aiResponse.json().catch(() => null);
      fastify.log.error({ status: aiResponse.status, error: errorBody }, 'OpenAI yanit hatasi');
      return reply.code(502).send({ error: 'AI_UPSTREAM_ERROR' });
    }

    const data = await aiResponse.json();
    const replyText = data?.choices?.[0]?.message?.content?.trim();

    if (!replyText) {
      return reply.code(502).send({ error: 'AI_EMPTY_RESPONSE' });
    }

    return reply.send({ reply: replyText, model: config.openAiModel });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Bilinmeyen hata';
    fastify.log.error({ error: errorMessage }, 'AI istek hatasi');
    return reply.code(502).send({ error: 'AI_REQUEST_FAILED' });
  } finally {
    clearTimeout(timeout);
  }
});

/**
 * Sunucuyu başlat ve çalıştır
 */
async function start() {
  try {
    // Depolamayı başlat
    await blocklistStorage.initialize();
    await patternsStorage.initialize();

    // Sunucuyu başlat
    const address = await fastify.listen({
      port: config.port,
      host: '0.0.0.0'
    });

    fastify.log.info(`AntiSlot Backend API ${address} üzerinde çalışıyor`);
    fastify.log.info(`Sağlık kontrolü: ${address}/v1/health`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
}

// Zarif kapanışı yönet
process.on('SIGINT', async () => {
  await fastify.close();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await fastify.close();
  process.exit(0);
});

// Sunucuyu başlat
if (require.main === module) {
  start();
}

export { fastify, blocklistStorage, patternsStorage };
