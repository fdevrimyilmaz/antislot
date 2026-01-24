import * as SecureStore from "expo-secure-store";
import * as CryptoJS from "crypto-js";
import { BlocklistEntry, BlocklistPattern, DomainMatcher } from "@/services/gambling-blocker/domain-matcher";
import { SharedConfig } from "@/react-native-bridge/SharedConfigModule";

export interface BlockerState {
  apiUrl: string;
  lastSync: number | null;
  domains: string[];
  patterns: BlocklistPattern[];
  whitelist: string[];
}

const BLOCKLIST_KEY = "antislot_blocklist_domains";
const PATTERNS_KEY = "antislot_blocklist_patterns";
const LAST_SYNC_KEY = "antislot_blocklist_last_sync";
const API_URL_KEY = "antislot_api_url";
const WHITELIST_KEY = "antislot_whitelist_domains";
const BLOCKLIST_UPDATE_KEY = "antislot_blocklist_update";
const PATTERNS_UPDATE_KEY = "antislot_patterns_update";
const BLOCKLIST_VERSION_KEY = "antislot_blocklist_version";
const PATTERNS_VERSION_KEY = "antislot_patterns_version";
const HMAC_SECRET_KEY = "antislot_hmac_secret";

const DEFAULT_API_URL = __DEV__ ? "http://localhost:3000" : "https://api.antislot.app";
const DEFAULT_HMAC_SECRET = "antislot-secret-key-change-in-production";
const LOCAL_HTTP_HOSTS = new Set(["localhost", "127.0.0.1", "10.0.2.2", "10.0.3.2"]);
const VALID_PATTERN_TYPES = new Set<BlocklistPattern["type"]>(["exact", "subdomain", "contains", "regex"]);

type SignedBlocklistResponse = {
  version: number;
  updatedAt: number;
  domains: string[];
  signature: string;
};

type SignedPatternsResponse = {
  version: number;
  updatedAt: number;
  patterns: BlocklistPattern[];
  signature: string;
};
const DEFAULT_DOMAINS = [
  "bet365.com",
  "betway.com",
  "bwin.com",
  "pinnacle.com",
  "williamhill.com",
  "888casino.com",
  "casino.com",
  "pokerstars.com",
  "partypoker.com",
  "bodog.com",
  "unibet.com",
  "betfair.com",
];

const DEFAULT_PATTERNS: BlocklistPattern[] = [
  { pattern: "bet", type: "contains", weight: 0.7 },
  { pattern: "casino", type: "contains", weight: 0.8 },
  { pattern: "poker", type: "contains", weight: 0.7 },
  { pattern: "slot", type: "contains", weight: 0.7 },
  { pattern: "gambling", type: "contains", weight: 0.9 },
  { pattern: "^bet\\d+\\.", type: "regex", weight: 0.8 },
  { pattern: "^casino\\d+\\.", type: "regex", weight: 0.8 },
  { pattern: "^poker\\d+\\.", type: "regex", weight: 0.8 },
];

function getEnvSecret(key: string): string | null {
  const env = (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env;
  const value = env?.[key];
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

function normalizeApiUrl(value: string): string {
  let url = value.trim();
  if (!url) return "";
  if (!/^https?:\/\//i.test(url)) {
    const lower = url.toLowerCase();
    const isLocal =
      lower.startsWith("localhost") ||
      lower.startsWith("127.0.0.1") ||
      lower.startsWith("10.0.2.2") ||
      lower.startsWith("10.0.3.2");
    url = `${isLocal ? "http" : "https"}://${url}`;
  }
  return url.replace(/\/+$/, "");
}

function isValidApiUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

function isSecureApiUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    if (parsed.protocol === "https:") return true;
    if (parsed.protocol === "http:" && (__DEV__ || LOCAL_HTTP_HOSTS.has(parsed.hostname))) return true;
    return false;
  } catch {
    return false;
  }
}

async function getStoredNumber(key: string): Promise<number | null> {
  const value = await SecureStore.getItemAsync(key);
  if (!value) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

async function getHmacSecret(): Promise<string | null> {
  const stored = await SecureStore.getItemAsync(HMAC_SECRET_KEY);
  if (stored) return stored;
  const envSecret = getEnvSecret("EXPO_PUBLIC_HMAC_SECRET");
  if (envSecret) {
    await SecureStore.setItemAsync(HMAC_SECRET_KEY, envSecret);
    return envSecret;
  }
  return __DEV__ ? DEFAULT_HMAC_SECRET : null;
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => isNonEmptyString(item));
}

function isPattern(value: unknown): value is BlocklistPattern {
  if (!value || typeof value !== "object") return false;
  const pattern = value as BlocklistPattern;
  return (
    isNonEmptyString(pattern.pattern) &&
    VALID_PATTERN_TYPES.has(pattern.type) &&
    typeof pattern.weight === "number" &&
    Number.isFinite(pattern.weight)
  );
}

function isPatternArray(value: unknown): value is BlocklistPattern[] {
  return Array.isArray(value) && value.every(isPattern);
}

function normalizeDomains(domains: string[]): string[] {
  const unique = new Set<string>();
  for (const domain of domains) {
    const normalized = domain.toLowerCase().trim();
    if (!normalized) continue;
    unique.add(normalized);
  }
  return Array.from(unique);
}

function normalizePatterns(patterns: BlocklistPattern[]): BlocklistPattern[] {
  return patterns
    .map((pattern) => ({
      ...pattern,
      pattern: pattern.pattern.trim(),
      weight: Math.max(0, Math.min(1, pattern.weight)),
    }))
    .filter((pattern) => pattern.pattern.length > 0);
}

function computeSignature(payload: object, secret: string): string {
  return CryptoJS.HmacSHA256(JSON.stringify(payload), secret).toString(CryptoJS.enc.Hex);
}

function verifySignature(payload: object, signature: string, secret: string): boolean {
  const expected = computeSignature(payload, secret);
  return expected === signature.trim().toLowerCase();
}

function parseBlocklistResponse(data: unknown): SignedBlocklistResponse {
  if (!data || typeof data !== "object") {
    throw new Error("Engel listesi yanıtı geçersiz.");
  }
  const payload = data as Record<string, unknown>;
  const version = Number(payload.version);
  const updatedAt = Number(payload.updatedAt);
  const domains = payload.domains;
  const signature = payload.signature;
  if (!Number.isFinite(version) || !Number.isFinite(updatedAt) || !isStringArray(domains) || !isNonEmptyString(signature)) {
    throw new Error("Engel listesi yanıtı eksik veya hatalı.");
  }
  return { version, updatedAt, domains, signature: signature.trim() };
}

function parsePatternsResponse(data: unknown): SignedPatternsResponse {
  if (!data || typeof data !== "object") {
    throw new Error("Kalıp yanıtı geçersiz.");
  }
  const payload = data as Record<string, unknown>;
  const version = Number(payload.version);
  const updatedAt = Number(payload.updatedAt);
  const patterns = payload.patterns;
  const signature = payload.signature;
  if (!Number.isFinite(version) || !Number.isFinite(updatedAt) || !isPatternArray(patterns) || !isNonEmptyString(signature)) {
    throw new Error("Kalıp yanıtı eksik veya hatalı.");
  }
  return { version, updatedAt, patterns, signature: signature.trim() };
}

async function getStoredArray<T>(key: string, fallback: T[]): Promise<T[]> {
  try {
    const stored = await SecureStore.getItemAsync(key);
    if (!stored) return fallback;
    return JSON.parse(stored);
  } catch (error) {
    console.error(`${key} okunurken hata:`, error);
    return fallback;
  }
}

export async function getBlockerState(): Promise<BlockerState> {
  const storedUrl = await SecureStore.getItemAsync(API_URL_KEY);
  const normalizedUrl = storedUrl ? normalizeApiUrl(storedUrl) : DEFAULT_API_URL;
  const apiUrl = isValidApiUrl(normalizedUrl) ? normalizedUrl : DEFAULT_API_URL;
  const domains = await getStoredArray<string>(BLOCKLIST_KEY, DEFAULT_DOMAINS);
  const patterns = await getStoredArray<BlocklistPattern>(PATTERNS_KEY, DEFAULT_PATTERNS);
  const whitelist = await getStoredArray<string>(WHITELIST_KEY, []);
  const lastSyncStr = await SecureStore.getItemAsync(LAST_SYNC_KEY);
  const lastSync = lastSyncStr ? parseInt(lastSyncStr, 10) : null;

  return { apiUrl, domains, patterns, whitelist, lastSync };
}

export async function saveApiUrl(url: string): Promise<string> {
  const normalized = normalizeApiUrl(url);
  if (!normalized || !isValidApiUrl(normalized)) {
    throw new Error("Geçersiz API URL'si.");
  }
  if (!isSecureApiUrl(normalized)) {
    throw new Error("Üretimde yalnızca HTTPS API URL'leri kullanılabilir.");
  }
  await SecureStore.setItemAsync(API_URL_KEY, normalized);
  return normalized;
}

export async function syncBlocklist(apiUrl?: string): Promise<BlockerState> {
  const state = await getBlockerState();
  const baseUrl = normalizeApiUrl(apiUrl || state.apiUrl);
  if (!baseUrl || !isValidApiUrl(baseUrl)) {
    throw new Error("Geçersiz API URL'si.");
  }
  if (!isSecureApiUrl(baseUrl)) {
    throw new Error("Senkronizasyon için HTTPS gerekli.");
  }

  const hmacSecret = await getHmacSecret();
  if (!hmacSecret) {
    throw new Error("Güvenlik anahtarı bulunamadı.");
  }

  const [blocklistRes, patternsRes] = await Promise.all([
    fetch(`${baseUrl}/v1/blocklist`),
    fetch(`${baseUrl}/v1/patterns`),
  ]);

  if (!blocklistRes.ok || !patternsRes.ok) {
    throw new Error("Engel listesi veya kalıplar getirilemedi.");
  }

  const blocklistData = parseBlocklistResponse(await blocklistRes.json());
  const patternsData = parsePatternsResponse(await patternsRes.json());

  const blocklistPayload = {
    version: blocklistData.version,
    updatedAt: blocklistData.updatedAt,
    domains: blocklistData.domains,
  };

  const patternsPayload = {
    version: patternsData.version,
    updatedAt: patternsData.updatedAt,
    patterns: patternsData.patterns,
  };

  if (!verifySignature(blocklistPayload, blocklistData.signature, hmacSecret)) {
    throw new Error("Engel listesi imzası geçersiz.");
  }
  if (!verifySignature(patternsPayload, patternsData.signature, hmacSecret)) {
    throw new Error("Kalıp imzası geçersiz.");
  }

  const storedBlocklistVersion = await getStoredNumber(BLOCKLIST_VERSION_KEY);
  const storedPatternsVersion = await getStoredNumber(PATTERNS_VERSION_KEY);

  const shouldUpdateBlocklist =
    storedBlocklistVersion === null || blocklistData.version > storedBlocklistVersion;
  const shouldUpdatePatterns =
    storedPatternsVersion === null || patternsData.version > storedPatternsVersion;

  const domains = shouldUpdateBlocklist ? normalizeDomains(blocklistData.domains) : state.domains;
  const patterns = shouldUpdatePatterns ? normalizePatterns(patternsData.patterns) : state.patterns;
  const now = Date.now();

  if (shouldUpdateBlocklist) {
    await SecureStore.setItemAsync(BLOCKLIST_KEY, JSON.stringify(domains));
    await SecureStore.setItemAsync(BLOCKLIST_VERSION_KEY, blocklistData.version.toString());
    await SecureStore.setItemAsync(BLOCKLIST_UPDATE_KEY, now.toString());
    await SharedConfig.saveBlocklist(domains);
  }

  if (shouldUpdatePatterns) {
    await SecureStore.setItemAsync(PATTERNS_KEY, JSON.stringify(patterns));
    await SecureStore.setItemAsync(PATTERNS_VERSION_KEY, patternsData.version.toString());
    await SecureStore.setItemAsync(PATTERNS_UPDATE_KEY, now.toString());
    await SharedConfig.savePatterns(patterns);
  }

  await SecureStore.setItemAsync(LAST_SYNC_KEY, now.toString());
  await SharedConfig.saveWhitelist(state.whitelist);

  return {
    ...state,
    apiUrl: baseUrl,
    domains,
    patterns,
    lastSync: now,
  };
}

export async function addWhitelistDomain(domain: string): Promise<string[]> {
  const state = await getBlockerState();
  const normalized = domain.toLowerCase().trim();
  if (!normalized) return state.whitelist;
  if (state.whitelist.includes(normalized)) return state.whitelist;

  const updated = [...state.whitelist, normalized];
  await SecureStore.setItemAsync(WHITELIST_KEY, JSON.stringify(updated));
  await SharedConfig.saveWhitelist(updated);
  return updated;
}

export async function removeWhitelistDomain(domain: string): Promise<string[]> {
  const state = await getBlockerState();
  const normalized = domain.toLowerCase().trim();
  const updated = state.whitelist.filter((d) => d !== normalized);
  await SecureStore.setItemAsync(WHITELIST_KEY, JSON.stringify(updated));
  await SharedConfig.saveWhitelist(updated);
  return updated;
}

export function buildBlocklistEntries(domains: string[], patterns: BlocklistPattern[]): BlocklistEntry[] {
  const entries: BlocklistEntry[] = [];
  const now = Date.now();

  for (const domain of domains) {
    const normalized = domain.toLowerCase().trim();
    if (!normalized) continue;
    entries.push({
      domain: normalized,
      patterns: [
        { pattern: normalized, type: "exact", weight: 1.0 },
        { pattern: normalized, type: "subdomain", weight: 0.9 },
      ],
      lastSeen: now,
      reason: "Senkronize engel listesi",
    });
  }

  for (const pattern of patterns) {
    entries.push({
      domain: pattern.pattern,
      patterns: [pattern],
      lastSeen: now,
      reason: "Kalıp engel listesi",
    });
  }

  return entries;
}

export async function checkDomainBlocked(input: string): Promise<{ blocked: boolean; domain: string | null }> {
  const state = await getBlockerState();
  const matcher = new DomainMatcher();
  matcher.loadWhitelist(state.whitelist);
  matcher.loadBlocklist(buildBlocklistEntries(state.domains, state.patterns));

  const domain = matcher.extractDomain(input) || input.toLowerCase().trim();
  if (!domain) return { blocked: false, domain: null };
  return { blocked: matcher.isBlocked(domain), domain };
}

export async function resetBlocklist(): Promise<void> {
  await SecureStore.deleteItemAsync(BLOCKLIST_KEY);
  await SecureStore.deleteItemAsync(PATTERNS_KEY);
  await SecureStore.deleteItemAsync(LAST_SYNC_KEY);
  await SecureStore.deleteItemAsync(BLOCKLIST_VERSION_KEY);
  await SecureStore.deleteItemAsync(PATTERNS_VERSION_KEY);
}
