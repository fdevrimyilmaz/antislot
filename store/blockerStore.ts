import * as SecureStore from "@/lib/secureStoreCompat";
import { BlocklistEntry, BlocklistPattern, DomainMatcher } from "@/services/gambling-blocker/domain-matcher";
import { trackEvent } from "@/services/analytics";
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
const CONTENT_SYNC_BACKUP_KEY = "antislot_content_sync_backup";
const CONTENT_SCHEMA_VERSION = 1;

const DEFAULT_API_URL = __DEV__ ? "http://localhost:3000" : "https://api.antislot.app";
const LOCAL_HTTP_HOSTS = new Set(["localhost", "127.0.0.1", "10.0.2.2", "10.0.3.2"]);
const VALID_PATTERN_TYPES = new Set<BlocklistPattern["type"]>(["exact", "subdomain", "contains", "regex"]);

type SignedBlocklistResponse = {
  version: number;
  updatedAt: number;
  domains: string[];
  signature: string;
  schemaVersion: number;
};

type SignedPatternsResponse = {
  version: number;
  updatedAt: number;
  patterns: BlocklistPattern[];
  signature: string;
  schemaVersion: number;
};

type SyncBackup = {
  domains: string[];
  patterns: BlocklistPattern[];
  whitelist: string[];
  lastSync: number | null;
  blocklistVersion: number | null;
  patternsVersion: number | null;
};

type SyncStage = "fetch" | "verify" | "compatibility" | "write" | "unknown";

type SyncSource = "manual" | "auto";

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

function normalizeSchemaVersion(value: unknown): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return 1;
  return Math.floor(parsed);
}

function ensureSchemaCompatible(remoteSchemaVersion: number, contentType: "blocklist" | "patterns"): void {
  if (remoteSchemaVersion > CONTENT_SCHEMA_VERSION) {
    throw new Error(`incompatible_${contentType}_schema_v${remoteSchemaVersion}`);
  }
}

async function verifySignatureWithServer(
  payload: object,
  signature: string,
  baseUrl: string
): Promise<boolean> {
  if (!isNonEmptyString(signature)) return false;
  try {
    const res = await fetch(`${baseUrl}/v1/verify-signature`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ payload, signature }),
    });
    if (!res.ok) {
      throw new Error(`verify-signature failed (${res.status})`);
    }
    const data = (await res.json()) as { ok?: boolean };
    return Boolean(data?.ok);
  } catch (error) {
    if (__DEV__) {
      console.warn("Signature verification skipped; server endpoint unavailable.", error);
      return true;
    }
    return false;
  }
}

function parseBlocklistResponse(data: unknown): SignedBlocklistResponse {
  if (!data || typeof data !== "object") {
    throw new Error("invalid_blocklist_response");
  }
  const payload = data as Record<string, unknown>;
  const version = Number(payload.version);
  const updatedAt = Number(payload.updatedAt);
  const domains = payload.domains;
  const signature = payload.signature;
  const schemaVersion = normalizeSchemaVersion(payload.schemaVersion);

  if (!Number.isFinite(version) || !Number.isFinite(updatedAt) || !isStringArray(domains) || !isNonEmptyString(signature)) {
    throw new Error("invalid_blocklist_payload");
  }

  return {
    version,
    updatedAt,
    domains,
    signature: signature.trim(),
    schemaVersion,
  };
}

function parsePatternsResponse(data: unknown): SignedPatternsResponse {
  if (!data || typeof data !== "object") {
    throw new Error("invalid_patterns_response");
  }
  const payload = data as Record<string, unknown>;
  const version = Number(payload.version);
  const updatedAt = Number(payload.updatedAt);
  const patterns = payload.patterns;
  const signature = payload.signature;
  const schemaVersion = normalizeSchemaVersion(payload.schemaVersion);

  if (!Number.isFinite(version) || !Number.isFinite(updatedAt) || !isPatternArray(patterns) || !isNonEmptyString(signature)) {
    throw new Error("invalid_patterns_payload");
  }

  return {
    version,
    updatedAt,
    patterns,
    signature: signature.trim(),
    schemaVersion,
  };
}

async function getStoredArray<T>(key: string, fallback: T[]): Promise<T[]> {
  try {
    const stored = await SecureStore.getItemAsync(key);
    if (!stored) return fallback;
    return JSON.parse(stored);
  } catch (error) {
    console.error(`${key} read failed:`, error);
    return fallback;
  }
}

async function saveSyncBackup(backup: SyncBackup): Promise<void> {
  await SecureStore.setItemAsync(CONTENT_SYNC_BACKUP_KEY, JSON.stringify(backup));
}

async function clearSyncBackup(): Promise<void> {
  await SecureStore.deleteItemAsync(CONTENT_SYNC_BACKUP_KEY);
}

async function restoreSyncBackup(backup: SyncBackup): Promise<void> {
  await SecureStore.setItemAsync(BLOCKLIST_KEY, JSON.stringify(backup.domains));
  await SecureStore.setItemAsync(PATTERNS_KEY, JSON.stringify(backup.patterns));

  if (backup.lastSync === null) {
    await SecureStore.deleteItemAsync(LAST_SYNC_KEY);
  } else {
    await SecureStore.setItemAsync(LAST_SYNC_KEY, backup.lastSync.toString());
  }

  if (backup.blocklistVersion === null) {
    await SecureStore.deleteItemAsync(BLOCKLIST_VERSION_KEY);
  } else {
    await SecureStore.setItemAsync(BLOCKLIST_VERSION_KEY, backup.blocklistVersion.toString());
  }

  if (backup.patternsVersion === null) {
    await SecureStore.deleteItemAsync(PATTERNS_VERSION_KEY);
  } else {
    await SecureStore.setItemAsync(PATTERNS_VERSION_KEY, backup.patternsVersion.toString());
  }

  await SharedConfig.saveBlocklist(backup.domains);
  await SharedConfig.savePatterns(backup.patterns);
  await SharedConfig.saveWhitelist(backup.whitelist);
}

function normalizeReasonCode(error: unknown): string {
  const message = error instanceof Error ? error.message : "unknown_error";
  return message
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, "_")
    .slice(0, 64);
}

function getApiHost(baseUrl: string): string {
  try {
    return new URL(baseUrl).host;
  } catch {
    return "invalid";
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
    throw new Error("invalid_api_url");
  }
  if (!isSecureApiUrl(normalized)) {
    throw new Error("insecure_api_url");
  }
  await SecureStore.setItemAsync(API_URL_KEY, normalized);
  return normalized;
}

export async function syncBlocklist(
  apiUrl?: string,
  source: SyncSource = "manual"
): Promise<BlockerState> {
  const state = await getBlockerState();
  const baseUrl = normalizeApiUrl(apiUrl || state.apiUrl);

  if (!baseUrl || !isValidApiUrl(baseUrl)) {
    throw new Error("invalid_api_url");
  }
  if (!isSecureApiUrl(baseUrl)) {
    throw new Error("sync_requires_https");
  }

  trackEvent("blocklist_sync_started", {
    source,
    apiHost: getApiHost(baseUrl),
  });

  let stage: SyncStage = "fetch";
  try {
    const [blocklistRes, patternsRes] = await Promise.all([
      fetch(`${baseUrl}/v1/blocklist`),
      fetch(`${baseUrl}/v1/patterns`),
    ]);

    if (!blocklistRes.ok || !patternsRes.ok) {
      throw new Error("sync_fetch_failed");
    }

    const blocklistData = parseBlocklistResponse(await blocklistRes.json());
    const patternsData = parsePatternsResponse(await patternsRes.json());

    stage = "compatibility";
    ensureSchemaCompatible(blocklistData.schemaVersion, "blocklist");
    ensureSchemaCompatible(patternsData.schemaVersion, "patterns");

    stage = "verify";
    const blocklistPayload = {
      version: blocklistData.version,
      updatedAt: blocklistData.updatedAt,
      domains: blocklistData.domains,
      schemaVersion: blocklistData.schemaVersion,
    };

    const patternsPayload = {
      version: patternsData.version,
      updatedAt: patternsData.updatedAt,
      patterns: patternsData.patterns,
      schemaVersion: patternsData.schemaVersion,
    };

    const blocklistVerified = await verifySignatureWithServer(
      blocklistPayload,
      blocklistData.signature,
      baseUrl
    );
    const patternsVerified = await verifySignatureWithServer(
      patternsPayload,
      patternsData.signature,
      baseUrl
    );

    if (!blocklistVerified) {
      throw new Error("blocklist_signature_invalid");
    }
    if (!patternsVerified) {
      throw new Error("patterns_signature_invalid");
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

    if (shouldUpdateBlocklist || shouldUpdatePatterns) {
      const backup: SyncBackup = {
        domains: state.domains,
        patterns: state.patterns,
        whitelist: state.whitelist,
        lastSync: state.lastSync,
        blocklistVersion: storedBlocklistVersion,
        patternsVersion: storedPatternsVersion,
      };
      await saveSyncBackup(backup);
    }

    stage = "write";
    try {
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
      await clearSyncBackup();

      trackEvent("blocklist_sync_succeeded", {
        source,
        blocklistUpdated: shouldUpdateBlocklist,
        patternsUpdated: shouldUpdatePatterns,
        blocklistVersion: shouldUpdateBlocklist ? blocklistData.version : storedBlocklistVersion,
        patternsVersion: shouldUpdatePatterns ? patternsData.version : storedPatternsVersion,
      });

      return {
        ...state,
        apiUrl: baseUrl,
        domains,
        patterns,
        lastSync: now,
      };
    } catch (writeError) {
      const backupRaw = await SecureStore.getItemAsync(CONTENT_SYNC_BACKUP_KEY);
      if (backupRaw) {
        try {
          const backup = JSON.parse(backupRaw) as SyncBackup;
          await restoreSyncBackup(backup);
          trackEvent("blocklist_rollback_applied", {
            source,
            blocklistVersion: backup.blocklistVersion,
            patternsVersion: backup.patternsVersion,
          });
        } catch (rollbackError) {
          if (__DEV__) {
            console.warn("Rollback failed after sync write error", rollbackError);
          }
        }
      }
      throw writeError;
    }
  } catch (error) {
    trackEvent("blocklist_sync_failed", {
      source,
      stage,
      reasonCode: normalizeReasonCode(error),
    });
    throw error;
  }
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
      reason: "Synchronized blocklist",
    });
  }

  for (const pattern of patterns) {
    entries.push({
      domain: pattern.pattern,
      patterns: [pattern],
      lastSeen: now,
      reason: "Synchronized pattern",
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
  await SecureStore.deleteItemAsync(CONTENT_SYNC_BACKUP_KEY);
}
