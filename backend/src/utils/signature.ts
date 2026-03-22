/**
 * HMAC signature generation and verification.
 * Used to protect blocklist/pattern payload integrity.
 */

import crypto from 'crypto';
import { config } from '../config';

/**
 * Generate HMAC-SHA256 signature for payload.
 */
export function generateSignature(data: string | object): string {
  const stringData = typeof data === 'string' ? data : JSON.stringify(data);
  const hmac = crypto.createHmac('sha256', config.hmacSecret);
  hmac.update(stringData);
  return hmac.digest('hex');
}

/**
 * Verify HMAC signature.
 * Returns false for malformed or length-mismatched signatures.
 */
export function verifySignature(
  data: string | object,
  signature: string
): boolean {
  if (typeof signature !== 'string') return false;

  const normalized = signature.trim().toLowerCase();
  if (!/^[a-f0-9]{64}$/.test(normalized)) return false;

  const expectedSignature = generateSignature(data);
  const expectedBuffer = Buffer.from(expectedSignature, 'hex');
  const providedBuffer = Buffer.from(normalized, 'hex');

  if (expectedBuffer.length !== providedBuffer.length) return false;
  return crypto.timingSafeEqual(expectedBuffer, providedBuffer);
}

/**
 * Generate ETag from payload.
 */
export function generateETag(data: string | object): string {
  const stringData = typeof data === 'string' ? data : JSON.stringify(data);
  const hash = crypto.createHash('sha256');
  hash.update(stringData);
  return `"${hash.digest('hex').substring(0, 16)}"`; // 16-char ETag fingerprint
}
