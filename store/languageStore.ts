import * as SecureStore from "@/lib/secureStoreCompat";
import { Platform } from "react-native";

import {
  type SupportedLanguage,
  normalizeSupportedLanguage,
  SUPPORTED_LANGUAGE_OPTIONS,
} from "@/i18n/translations";

const KEY = "language";
const DEFAULT_LANGUAGE: SupportedLanguage = "tr";
const SUPPORTED_LANGUAGE_SET = new Set<SupportedLanguage>(
  SUPPORTED_LANGUAGE_OPTIONS.map((option) => option.code)
);
const REGION_DEFAULT_LANGUAGE: Record<string, SupportedLanguage> = {
  TR: "tr",
  DE: "de",
  FR: "fr",
  IN: "hi",
  LV: "lv",
  CN: "zh",
  TW: "zh",
  HK: "zh",
  SG: "zh",
  PH: "tl",
  AL: "sq",
  XK: "sq",
  RS: "sr",
  FI: "fi",
  SE: "sv",
  IT: "it",
  IS: "is",
  JP: "ja",
  KR: "ko",
  ES: "es",
  MX: "es",
  AR: "es",
  CO: "es",
  CL: "es",
  PE: "es",
  VE: "es",
  PT: "pt",
  BR: "pt",
  MY: "ms",
  KH: "km",
  TH: "th",
  US: "en",
  GB: "en",
  CA: "en",
  AU: "en",
  NZ: "en",
  IE: "en",
};

type LocaleParts = {
  language: string | null;
  region: string | null;
};

function parseLocaleParts(locale: string): LocaleParts {
  const normalized = locale.trim().replace(/_/g, "-");
  if (!normalized) {
    return { language: null, region: null };
  }

  const segments = normalized.split("-").filter(Boolean);
  if (segments.length === 0) {
    return { language: null, region: null };
  }

  const language = segments[0]?.toLowerCase() ?? null;
  let region: string | null = null;

  for (let index = 1; index < segments.length; index += 1) {
    const segment = segments[index];
    if (/^[A-Za-z]{2}$/.test(segment) || /^\d{3}$/.test(segment)) {
      region = segment.toUpperCase();
      break;
    }
  }

  return { language, region };
}

export function inferSupportedLanguageFromLocale(
  locale: string | null | undefined
): SupportedLanguage | null {
  if (!locale || typeof locale !== "string") return null;

  const { language, region } = parseLocaleParts(locale);
  let explicitLanguage: SupportedLanguage | null = null;

  if (language) {
    if (language === "fil") {
      explicitLanguage = "tl";
    } else {
      const direct = language as SupportedLanguage;
      if (SUPPORTED_LANGUAGE_SET.has(direct)) {
        explicitLanguage = direct;
      }
    }
  }

  // Preserve explicit non-English preferences (e.g. es-US, tr-DE).
  if (explicitLanguage && explicitLanguage !== "en") {
    return explicitLanguage;
  }

  // Region fallback helps when locale is generic English (e.g. en-TH).
  if (region && REGION_DEFAULT_LANGUAGE[region]) {
    return REGION_DEFAULT_LANGUAGE[region];
  }

  if (explicitLanguage) {
    return explicitLanguage;
  }

  return null;
}

function detectLanguageFromDevice(): SupportedLanguage {
  const candidates: string[] = [];

  if (Platform.OS === "web") {
    const nav = (globalThis as { navigator?: { languages?: readonly string[]; language?: string } })
      .navigator;
    if (Array.isArray(nav?.languages)) {
      candidates.push(...nav.languages);
    }
    if (typeof nav?.language === "string") {
      candidates.push(nav.language);
    }
  }

  try {
    const intlLocale = Intl.DateTimeFormat().resolvedOptions().locale;
    if (intlLocale) {
      candidates.push(intlLocale);
    }
  } catch {
    // no-op: fallback below
  }

  for (const candidate of candidates) {
    const inferred = inferSupportedLanguageFromLocale(candidate);
    if (inferred) return inferred;
  }

  return DEFAULT_LANGUAGE;
}

async function readStoredLanguageRaw(): Promise<string | null> {
  if (Platform.OS === "web") {
    try {
      return localStorage.getItem(KEY);
    } catch {
      return null;
    }
  }

  try {
    return await SecureStore.getItemAsync(KEY);
  } catch {
    return null;
  }
}

export async function getLanguage(): Promise<SupportedLanguage> {
  const stored = await readStoredLanguageRaw();
  if (stored) {
    return normalizeSupportedLanguage(stored);
  }

  const detected = detectLanguageFromDevice();
  await setLanguage(detected);
  return detected;
}

export async function setLanguage(lang: SupportedLanguage): Promise<void> {
  const normalized = normalizeSupportedLanguage(lang);

  if (Platform.OS === "web") {
    try {
      localStorage.setItem(KEY, normalized);
    } catch (e) {
      console.log("localStorage hatasi:", e);
    }
    return;
  }

  try {
    await SecureStore.setItemAsync(KEY, normalized);
  } catch (e) {
    console.log("SecureStore hatasi:", e);
  }
}
