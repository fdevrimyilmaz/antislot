import * as SecureStore from "expo-secure-store";

/**
 * Community-sourced SMS spam keyword list.
 *
 * Cached on-device and refreshed on demand. The classifier merges these
 * with the baked-in lexicon and the user's custom keywords. We keep this
 * separate from the user's custom list so a community update can never
 * silently mutate something the user typed by hand.
 *
 * Server contract: `GET <apiBase>/v1/sms-keywords` returns
 *   { version: number, updatedAt: number, keywords: string[] }
 *
 * Versioning lets the app skip writes when nothing changed.
 */

const KEYS = {
  KEYWORDS: "antislot_sms_community_keywords",
  VERSION: "antislot_sms_community_version",
  LAST_SYNC: "antislot_sms_community_last_sync",
};

const DEFAULT_API_URL = __DEV__
  ? "http://localhost:3000"
  : "https://api.antislot.app";

export interface CommunitySyncResult {
  keywords: string[];
  version: number;
  lastSync: number;
}

export async function getCommunityKeywords(): Promise<string[]> {
  const stored = await SecureStore.getItemAsync(KEYS.KEYWORDS);
  if (!stored) return [];
  try {
    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) ? parsed.filter((k) => typeof k === "string") : [];
  } catch {
    return [];
  }
}

export async function getCommunityLastSync(): Promise<number | null> {
  const v = await SecureStore.getItemAsync(KEYS.LAST_SYNC);
  if (!v) return null;
  const n = parseInt(v, 10);
  return Number.isFinite(n) ? n : null;
}

export async function syncCommunityKeywords(
  apiUrl: string = DEFAULT_API_URL
): Promise<CommunitySyncResult> {
  const base = apiUrl.replace(/\/+$/, "");
  const res = await fetch(`${base}/v1/sms-keywords`);
  if (!res.ok) {
    throw new Error("Topluluk listesi getirilemedi.");
  }
  const payload = await res.json();
  const version = Number(payload?.version);
  const keywords = Array.isArray(payload?.keywords)
    ? payload.keywords
        .filter((k: unknown): k is string => typeof k === "string")
        .map((k: string) => k.trim().toLowerCase())
        .filter((k: string) => k.length > 0)
    : [];

  if (!Number.isFinite(version) || keywords.length === 0) {
    throw new Error("Topluluk listesi yanıtı eksik veya hatalı.");
  }

  const now = Date.now();
  await SecureStore.setItemAsync(KEYS.KEYWORDS, JSON.stringify(keywords));
  await SecureStore.setItemAsync(KEYS.VERSION, String(version));
  await SecureStore.setItemAsync(KEYS.LAST_SYNC, String(now));

  return { keywords, version, lastSync: now };
}

export async function resetCommunityKeywords(): Promise<void> {
  await SecureStore.deleteItemAsync(KEYS.KEYWORDS);
  await SecureStore.deleteItemAsync(KEYS.VERSION);
  await SecureStore.deleteItemAsync(KEYS.LAST_SYNC);
}
