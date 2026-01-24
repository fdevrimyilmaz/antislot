/**
 * Cache-Control and ETag Middleware for Fastify
 */

import { FastifyRequest, FastifyReply } from 'fastify';
import { generateETag } from '../utils/signature';

/**
 * Setup ETag and Cache-Control support for Fastify instance
 */
export function setupCacheMiddleware(fastify: any) {
  // ETag üretimi ve 304 yanıtları için onSend hook'u ekle
  fastify.addHook('onSend', async (request: FastifyRequest, reply: FastifyReply, payload: any) => {
    // Sadece GET isteklerini işle
    if (request.method !== 'GET') {
      return payload;
    }

    // Önce If-None-Match başlığını kontrol et
    const ifNoneMatch = request.headers['if-none-match'];
    
    // Payload'dan ETag üret
    const etag = generateETag(payload);
    reply.header('ETag', etag);

    // İstemcinin ETag'i eşleşiyorsa 304 döndür
    if (ifNoneMatch === etag) {
      reply.code(304);
      return '';
    }

    return payload;
  });
}

/**
 * Set Cache-Control header for response
 */
export function setCacheControl(reply: FastifyReply, cacheControl: string) {
  reply.header('Cache-Control', cacheControl);
}
