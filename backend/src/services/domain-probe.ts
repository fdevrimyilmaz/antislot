/**
 * Domain probe — verifies whether a hostname is currently "alive" before adding
 * it to the blocklist. Strategy:
 *   1. DNS resolution (A or AAAA records) with timeout.
 *   2. Optional HTTPS HEAD/GET probe (best-effort; some gambling sites refuse HEAD).
 *
 * A domain is considered alive if EITHER signal succeeds. This minimizes false
 * negatives when sites block automated probes but still resolve via DNS.
 */

import { promises as dns } from 'dns';

const DEFAULT_DNS_TIMEOUT_MS = 4000;
const DEFAULT_HTTP_TIMEOUT_MS = 5000;
const DOMAIN_REGEX = /^(?=.{1,253}$)([a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/i;

export type ProbeResult = {
  domain: string;
  alive: boolean;
  dns: { ok: boolean; addresses?: string[]; error?: string };
  http: { ok: boolean; status?: number; error?: string };
  durationMs: number;
};

export function normalizeDomain(input: string): string | null {
  if (typeof input !== 'string') return null;
  let domain = input.trim().toLowerCase();
  if (!domain) return null;

  // Strip protocol
  domain = domain.replace(/^https?:\/\//, '');
  // Strip path/query/fragment
  domain = domain.split(/[/?#]/)[0] || '';
  // Strip port
  domain = domain.split(':')[0] || '';
  // Strip leading "www."
  domain = domain.replace(/^www\./, '');
  // Remove trailing dot
  domain = domain.replace(/\.$/, '');

  if (!DOMAIN_REGEX.test(domain)) return null;
  if (domain.length > 253) return null;

  return domain;
}

async function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const id = setTimeout(() => reject(new Error(`${label}_timeout_${ms}ms`)), ms);
    promise
      .then((value) => {
        clearTimeout(id);
        resolve(value);
      })
      .catch((err) => {
        clearTimeout(id);
        reject(err);
      });
  });
}

async function probeDns(domain: string, timeoutMs: number): Promise<ProbeResult['dns']> {
  try {
    const a = await withTimeout(dns.resolve4(domain).catch(() => [] as string[]), timeoutMs, 'dns4');
    const aaaa = await withTimeout(dns.resolve6(domain).catch(() => [] as string[]), timeoutMs, 'dns6');
    const addresses = [...a, ...aaaa];
    if (addresses.length === 0) {
      return { ok: false, error: 'no_records' };
    }
    return { ok: true, addresses };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : 'dns_error' };
  }
}

async function probeHttp(domain: string, timeoutMs: number): Promise<ProbeResult['http']> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    // Some sites block HEAD; we try GET with no body consumption.
    const response = await fetch(`https://${domain}`, {
      method: 'GET',
      redirect: 'manual',
      signal: controller.signal,
      headers: {
        'User-Agent': 'AntislotAdminProbe/1.0',
      },
    });
    clearTimeout(id);
    // Any 2xx/3xx/4xx response means the host accepted the connection.
    return { ok: response.status < 500, status: response.status };
  } catch (error) {
    clearTimeout(id);
    return {
      ok: false,
      error: error instanceof Error ? error.message : 'http_error',
    };
  }
}

export async function probeDomain(
  domain: string,
  options: { dnsTimeoutMs?: number; httpTimeoutMs?: number; skipHttp?: boolean } = {}
): Promise<ProbeResult> {
  const started = Date.now();
  const dnsResult = await probeDns(domain, options.dnsTimeoutMs ?? DEFAULT_DNS_TIMEOUT_MS);
  const httpResult = options.skipHttp
    ? { ok: false, error: 'skipped' as const }
    : await probeHttp(domain, options.httpTimeoutMs ?? DEFAULT_HTTP_TIMEOUT_MS);

  return {
    domain,
    alive: dnsResult.ok || httpResult.ok,
    dns: dnsResult,
    http: httpResult,
    durationMs: Date.now() - started,
  };
}
