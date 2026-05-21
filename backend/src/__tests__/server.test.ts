/**
 * Unit tests for backend API server.
 */

import { fastify, blocklistStorage, patternsStorage } from '../server';
import { config } from '../config';
import { verifySignature } from '../utils/signature';

describe('API Server', () => {
  beforeAll(async () => {
    await blocklistStorage.initialize();
    await patternsStorage.initialize();
    await blocklistStorage.addDomain('test-bet.com', 'Test domain');
  });

  afterAll(async () => {
    await blocklistStorage.removeDomain('test-bet.com').catch(() => {});
  });

  describe('GET /v1/health', () => {
    it('returns health payload', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: '/v1/health'
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);

      expect(body).toHaveProperty('status', 'ok');
      expect(body).toHaveProperty('timestamp');
      expect(body).toHaveProperty('version');
      expect(body).toHaveProperty('blocklistVersion');
      expect(body).toHaveProperty('blocklistCount');
      expect(body).toHaveProperty('patternsVersion');
      expect(body).toHaveProperty('patternsCount');

      expect(typeof body.timestamp).toBe('number');
      expect(typeof body.blocklistVersion).toBe('number');
      expect(typeof body.blocklistCount).toBe('number');
    });
  });

  describe('GET /v1/blocklist', () => {
    it('returns signed blocklist', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: '/v1/blocklist'
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);

      expect(body).toHaveProperty('version');
      expect(body).toHaveProperty('updatedAt');
      expect(body).toHaveProperty('domains');
      expect(body).toHaveProperty('signature');

      expect(Array.isArray(body.domains)).toBe(true);
      expect(typeof body.signature).toBe('string');
      expect(body.signature.length).toBeGreaterThan(0);

      const { signature, ...payload } = body;
      const isValid = verifySignature(payload, signature);
      expect(isValid).toBe(true);
    });

    it('returns cache headers', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: '/v1/blocklist'
      });

      expect(response.headers['cache-control']).toBeDefined();
      expect(response.headers['cache-control']).toContain('max-age');
    });

    it('returns ETag', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: '/v1/blocklist'
      });

      expect(response.headers['etag']).toBeDefined();
      expect(response.headers['etag']).toMatch(/^"[a-f0-9]{16}"$/);
    });

    it('returns 304 when if-none-match matches', async () => {
      const first = await fastify.inject({
        method: 'GET',
        url: '/v1/blocklist'
      });

      const etag = first.headers['etag'];
      expect(etag).toBeDefined();

      const second = await fastify.inject({
        method: 'GET',
        url: '/v1/blocklist',
        headers: {
          'if-none-match': etag!
        }
      });

      expect(second.statusCode).toBe(304);
    });
  });

  describe('GET /v1/patterns', () => {
    it('returns signed patterns', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: '/v1/patterns'
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);

      expect(body).toHaveProperty('version');
      expect(body).toHaveProperty('updatedAt');
      expect(body).toHaveProperty('patterns');
      expect(body).toHaveProperty('signature');

      expect(Array.isArray(body.patterns)).toBe(true);
      expect(typeof body.signature).toBe('string');

      const { signature, ...payload } = body;
      const isValid = verifySignature(payload, signature);
      expect(isValid).toBe(true);

      if (body.patterns.length > 0) {
        const pattern = body.patterns[0];
        expect(pattern).toHaveProperty('pattern');
        expect(pattern).toHaveProperty('type');
        expect(pattern).toHaveProperty('weight');
        expect(['exact', 'subdomain', 'contains', 'regex']).toContain(pattern.type);
      }
    });

    it('returns cache-control', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: '/v1/patterns'
      });

      expect(response.headers['cache-control']).toBeDefined();
    });

    it('returns ETag', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: '/v1/patterns'
      });

      expect(response.headers['etag']).toBeDefined();
    });
  });

  describe('POST /chat and /v1/ai/chat', () => {
    const originalFetch = global.fetch;
    const originalProvider = config.aiProvider;
    const originalGeminiApiKey = config.geminiApiKey;
    const originalGeminiModel = config.geminiModel;

    beforeAll(() => {
      (config as { aiProvider: string }).aiProvider = 'gemini';
      (config as { geminiApiKey: string }).geminiApiKey = 'test-gemini-key';
      (config as { geminiModel: string }).geminiModel = 'gemini-2.5-flash';
    });

    afterAll(() => {
      global.fetch = originalFetch;
      (config as { aiProvider: string }).aiProvider = originalProvider;
      (config as { geminiApiKey: string }).geminiApiKey = originalGeminiApiKey;
      (config as { geminiModel: string }).geminiModel = originalGeminiModel;
    });

    it('accepts messages[] format on /chat', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          candidates: [{ content: { parts: [{ text: 'Merhaba, buradayim.' }] } }]
        })
      } as any);

      const response = await fastify.inject({
        method: 'POST',
        url: '/chat',
        payload: {
          messages: [{ role: 'user', content: 'Merhaba' }]
        }
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.reply).toContain('Merhaba');
      expect(body.provider).toBe('gemini');
    });

    it('accepts legacy format on /v1/ai/chat', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          candidates: [{ content: { parts: [{ text: 'Nefes al, sakinles.' }] } }]
        })
      } as any);

      const response = await fastify.inject({
        method: 'POST',
        url: '/v1/ai/chat',
        payload: {
          message: 'Kaygiliyim',
          history: [{ role: 'assistant', content: 'Yanindayim.' }]
        }
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.reply).toContain('sakinles');
      expect(body.provider).toBe('gemini');
    });
  });

  describe('POST /v1/premium/redeem', () => {
    const original = config.premiumAccessCodes;

    afterEach(() => {
      (config as { premiumAccessCodes: string[] }).premiumAccessCodes = original;
    });

    it('accepts a configured code (case-insensitive)', async () => {
      (config as { premiumAccessCodes: string[] }).premiumAccessCodes = ['ANTISLOT2026'];

      const response = await fastify.inject({
        method: 'POST',
        url: '/v1/premium/redeem',
        payload: { code: 'antislot2026' }
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body).toEqual({ ok: true, source: 'code' });
    });

    it('rejects an unknown code with 401', async () => {
      (config as { premiumAccessCodes: string[] }).premiumAccessCodes = ['ANTISLOT2026'];

      const response = await fastify.inject({
        method: 'POST',
        url: '/v1/premium/redeem',
        payload: { code: 'WRONG' }
      });

      expect(response.statusCode).toBe(401);
      const body = JSON.parse(response.body);
      expect(body).toEqual({ ok: false, error: 'INVALID_CODE' });
    });

    it('rejects empty input with 400', async () => {
      (config as { premiumAccessCodes: string[] }).premiumAccessCodes = ['ANTISLOT2026'];

      const response = await fastify.inject({
        method: 'POST',
        url: '/v1/premium/redeem',
        payload: { code: '   ' }
      });

      expect(response.statusCode).toBe(400);
    });

    it('returns 503 when no codes are configured', async () => {
      (config as { premiumAccessCodes: string[] }).premiumAccessCodes = [];

      const response = await fastify.inject({
        method: 'POST',
        url: '/v1/premium/redeem',
        payload: { code: 'ANYTHING' }
      });

      expect(response.statusCode).toBe(503);
      const body = JSON.parse(response.body);
      expect(body).toEqual({ ok: false, error: 'REDEEM_NOT_CONFIGURED' });
    });

    it('rejects overlong input with 400', async () => {
      (config as { premiumAccessCodes: string[] }).premiumAccessCodes = ['ANTISLOT2026'];

      const response = await fastify.inject({
        method: 'POST',
        url: '/v1/premium/redeem',
        payload: { code: 'X'.repeat(65) }
      });

      expect(response.statusCode).toBe(400);
    });
  });
});
