/**
 * API Sunucusu için Birim Testleri
 */

import { fastify, blocklistStorage, patternsStorage } from '../server';
import { verifySignature } from '../utils/signature';

describe('API Sunucusu', () => {
  beforeAll(async () => {
    // Testlerden önce depolamayı başlat
    await blocklistStorage.initialize();
    await patternsStorage.initialize();
    
    // Test alanı ekle
    await blocklistStorage.addDomain('test-bet.com', 'Test alan adı');
  });

  afterAll(async () => {
    // Temizlik
    await blocklistStorage.removeDomain('test-bet.com').catch(() => {});
    // Fastify'yi burada kapatma - tekil (singleton) kullanılıyor
  });

  describe('GET /v1/health', () => {
    it('sağlık durumunu döndürmeli', async () => {
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
    it('imzalı engel listesini döndürmeli', async () => {
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
      
      // İmzayı doğrula
      const { signature, ...payload } = body;
      const isValid = verifySignature(payload, signature);
      expect(isValid).toBe(true);
    });

    it('Cache-Control başlığını içermeli', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: '/v1/blocklist'
      });

      expect(response.headers['cache-control']).toBeDefined();
      expect(response.headers['cache-control']).toContain('max-age');
    });

    it('ETag başlığını içermeli', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: '/v1/blocklist'
      });

      expect(response.headers['etag']).toBeDefined();
      expect(response.headers['etag']).toMatch(/^"[a-f0-9]{16}"$/);
    });

    it('If-None-Match eşleştiğinde 304 Not Modified dönmeli', async () => {
      // ETag almak için ilk istek
      const firstResponse = await fastify.inject({
        method: 'GET',
        url: '/v1/blocklist'
      });
      
      const etag = firstResponse.headers['etag'];
      expect(etag).toBeDefined();

      // If-None-Match ile ikinci istek
      const secondResponse = await fastify.inject({
        method: 'GET',
        url: '/v1/blocklist',
        headers: {
          'if-none-match': etag!
        }
      });

      expect(secondResponse.statusCode).toBe(304);
    });
  });

  describe('GET /v1/patterns', () => {
    it('imzalı kalıpları döndürmeli', async () => {
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
      
      // İmzayı doğrula
      const { signature, ...payload } = body;
      const isValid = verifySignature(payload, signature);
      expect(isValid).toBe(true);
      
      // Kalıp yapısını doğrula
      if (body.patterns.length > 0) {
        const pattern = body.patterns[0];
        expect(pattern).toHaveProperty('pattern');
        expect(pattern).toHaveProperty('type');
        expect(pattern).toHaveProperty('weight');
        expect(['exact', 'subdomain', 'contains', 'regex']).toContain(pattern.type);
      }
    });

    it('Cache-Control başlığını içermeli', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: '/v1/patterns'
      });

      expect(response.headers['cache-control']).toBeDefined();
    });

    it('ETag başlığını içermeli', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: '/v1/patterns'
      });

      expect(response.headers['etag']).toBeDefined();
    });
  });
});
