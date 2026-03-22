import type { SupportedLanguage } from "@/i18n/translations";

const GOOGLE_TARGET_LANGUAGE: Record<SupportedLanguage, string | null> = {
  tr: "tr",
  en: "en",
  de: "de",
  fr: "fr",
  hi: "hi",
  lv: "lv",
  zh: "zh-CN",
  tl: "fil",
  sq: "sq",
  sr: "sr",
  fi: "fi",
  sv: "sv",
  it: "it",
  is: "is",
  ja: "ja",
  ko: "ko",
  es: "es",
  pt: "pt",
  ms: "ms",
  km: "km",
  th: "th",
};

const SOURCE_LANGUAGE = "en";
const DELIMITER = "\n__ANTISLOT_RUNTIME_SPLIT__\n";
const CHUNK_SIZE = 18;
const RETRY_LIMIT = 2;
const STRING_CACHE = new Map<string, string>();

function cacheKey(language: SupportedLanguage, text: string): string {
  return `${language}::${text}`;
}

function collectStrings(value: unknown, out: Set<string>) {
  if (typeof value === "string") {
    if (value.trim().length > 0) {
      out.add(value);
    }
    return;
  }

  if (!value || typeof value !== "object") {
    return;
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      collectStrings(item, out);
    }
    return;
  }

  for (const item of Object.values(value as Record<string, unknown>)) {
    if (typeof item === "function") continue;
    collectStrings(item, out);
  }
}

function mapStringsDeep<T>(value: T, mapValue: (text: string) => string): T {
  if (typeof value === "string") {
    return mapValue(value) as T;
  }

  if (!value || typeof value !== "object") {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map((item) => mapStringsDeep(item, mapValue)) as T;
  }

  const obj = value as Record<string, unknown>;
  const next: Record<string, unknown> = {};

  for (const [key, item] of Object.entries(obj)) {
    if (typeof item === "function") {
      next[key] = item;
      continue;
    }
    next[key] = mapStringsDeep(item, mapValue);
  }

  return next as T;
}

function splitChunks(values: string[], size: number): string[][] {
  const chunks: string[][] = [];
  for (let index = 0; index < values.length; index += size) {
    chunks.push(values.slice(index, index + size));
  }
  return chunks;
}

function extractGooglePayloadText(payload: unknown): string {
  if (!Array.isArray(payload) || !Array.isArray(payload[0])) {
    throw new Error("Unexpected translate payload");
  }

  return payload[0]
    .map((item) => (Array.isArray(item) ? (item[0] ?? "") : ""))
    .join("");
}

async function requestGoogleTranslate(text: string, languageCode: string, retry = 0): Promise<string> {
  const url =
    "https://translate.googleapis.com/translate_a/single" +
    `?client=gtx&sl=${SOURCE_LANGUAGE}` +
    `&tl=${encodeURIComponent(languageCode)}` +
    `&dt=t&q=${encodeURIComponent(text)}`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const payload = await response.json();
    return extractGooglePayloadText(payload);
  } catch (error) {
    if (retry >= RETRY_LIMIT) {
      throw error;
    }

    return requestGoogleTranslate(text, languageCode, retry + 1);
  }
}

async function translateBatch(values: string[], languageCode: string): Promise<string[]> {
  const joined = values.join(DELIMITER);
  const translatedJoined = await requestGoogleTranslate(joined, languageCode);
  const split = translatedJoined.split(DELIMITER);

  if (split.length === values.length) {
    return split;
  }

  const translated: string[] = [];
  for (const value of values) {
    translated.push(await requestGoogleTranslate(value, languageCode));
  }
  return translated;
}

async function fillMissingTranslations(sourceStrings: string[], language: SupportedLanguage): Promise<void> {
  const languageCode = GOOGLE_TARGET_LANGUAGE[language];
  if (!languageCode || language === "en") return;

  const missing = sourceStrings.filter((text) => !STRING_CACHE.has(cacheKey(language, text)));
  if (missing.length === 0) return;

  const chunks = splitChunks(missing, CHUNK_SIZE);
  for (const chunk of chunks) {
    const translated = await translateBatch(chunk, languageCode);
    for (let index = 0; index < chunk.length; index += 1) {
      STRING_CACHE.set(cacheKey(language, chunk[index]), translated[index] ?? chunk[index]);
    }
  }
}

export async function translateCopyObject<T>(copyEn: T, language: SupportedLanguage): Promise<T> {
  if (language === "en") return copyEn;
  if (language === "tr") {
    // tr is handled by screen copy objects directly; this function translates from English source.
    return copyEn;
  }

  const strings = new Set<string>();
  collectStrings(copyEn, strings);
  const sourceStrings = [...strings];

  await fillMissingTranslations(sourceStrings, language);

  return mapStringsDeep(copyEn, (text) => STRING_CACHE.get(cacheKey(language, text)) ?? text);
}

