/**
 * HMAC İmza Üretimi ve Doğrulaması
 * Engel listesi/kalıp bütünlüğünü doğrulamak için kullanılır
 */

import crypto from 'crypto';
import { config } from '../config';

/**
 * Veri için HMAC-SHA256 imzası üret
 */
export function generateSignature(data: string | object): string {
  const stringData = typeof data === 'string' ? data : JSON.stringify(data);
  const hmac = crypto.createHmac('sha256', config.hmacSecret);
  hmac.update(stringData);
  return hmac.digest('hex');
}

/**
 * HMAC imzasını doğrula
 */
export function verifySignature(
  data: string | object,
  signature: string
): boolean {
  const expectedSignature = generateSignature(data);
  return crypto.timingSafeEqual(
    Buffer.from(expectedSignature, 'hex'),
    Buffer.from(signature, 'hex')
  );
}

/**
 * Veriden ETag üret
 */
export function generateETag(data: string | object): string {
  const stringData = typeof data === 'string' ? data : JSON.stringify(data);
  const hash = crypto.createHash('sha256');
  hash.update(stringData);
  return `"${hash.digest('hex').substring(0, 16)}"`; // ETag için 16 karakter
}
