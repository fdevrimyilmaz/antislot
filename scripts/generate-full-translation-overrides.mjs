#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import ts from "typescript";

const TARGET_LANGUAGES = {
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

const DELIMITER = "\n__ANTISLOT_TRANSLATION_SPLIT__\n";
const CHUNK_SIZE = 24;
const REQUEST_DELAY_MS = 120;
const MAX_RETRIES = 4;
const SOURCE_LANGUAGE = "en";
const ASCII_LETTER_REGEX = /[A-Za-z]/;

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function resolveModulePath(baseFilePath, request) {
  const baseDir = path.dirname(baseFilePath);
  const candidate = path.resolve(baseDir, request);
  const extensions = ["", ".ts", ".tsx", ".js", ".mjs", ".cjs"];

  for (const extension of extensions) {
    const fullPath = `${candidate}${extension}`;
    if (fs.existsSync(fullPath) && fs.statSync(fullPath).isFile()) {
      return fullPath;
    }
  }

  throw new Error(`Unable to resolve local module "${request}" from ${baseFilePath}`);
}

function loadTranslationsModule(filePath, moduleCache = new Map()) {
  const resolvedFilePath = path.resolve(filePath);
  if (moduleCache.has(resolvedFilePath)) {
    return moduleCache.get(resolvedFilePath).exports;
  }

  const source = fs.readFileSync(resolvedFilePath, "utf8");
  const transpiled = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
    },
  });

  const moduleRef = { exports: {} };
  moduleCache.set(resolvedFilePath, moduleRef);
  const sandbox = {
    module: moduleRef,
    exports: moduleRef.exports,
    require: (id) => {
      if (id.startsWith("./") || id.startsWith("../")) {
        const nextModulePath = resolveModulePath(resolvedFilePath, id);
        return loadTranslationsModule(nextModulePath, moduleCache);
      }

      throw new Error(`Unexpected import in ${resolvedFilePath}: ${id}`);
    },
    __filename: resolvedFilePath,
    __dirname: path.dirname(resolvedFilePath),
    process,
    console,
  };

  vm.runInNewContext(transpiled.outputText, sandbox, { filename: resolvedFilePath });
  return moduleRef.exports;
}

function flattenStringLeaves(input, currentPath = [], out = []) {
  if (typeof input === "string") {
    out.push({ path: currentPath, value: input });
    return out;
  }

  if (!input || typeof input !== "object") {
    return out;
  }

  for (const key of Object.keys(input)) {
    flattenStringLeaves(input[key], [...currentPath, key], out);
  }

  return out;
}

function setAtPath(target, pathSegments, value) {
  let cursor = target;
  for (let index = 0; index < pathSegments.length - 1; index += 1) {
    const segment = pathSegments[index];
    if (!Object.prototype.hasOwnProperty.call(cursor, segment) || typeof cursor[segment] !== "object") {
      cursor[segment] = {};
    }
    cursor = cursor[segment];
  }

  const leafKey = pathSegments[pathSegments.length - 1];
  cursor[leafKey] = value;
}

function chunkArray(items, size) {
  const chunks = [];
  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }
  return chunks;
}

function normalizeForCompare(value) {
  return String(value ?? "").trim().toLowerCase();
}

function hasAsciiLetter(value) {
  return ASCII_LETTER_REGEX.test(value);
}

function isUppercaseStyle(value) {
  const lettersOnly = value.replace(/[^A-Za-z]/g, "");
  return lettersOnly.length > 0 && lettersOnly === lettersOnly.toUpperCase();
}

function isTitleCaseStyle(value) {
  const words = value.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return false;
  return words.every((word) => {
    const first = word[0];
    return first === first.toUpperCase();
  });
}

function toTitleCase(value) {
  return value
    .split(/\s+/)
    .map((word) => {
      if (!word) return word;
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(" ");
}

function shouldRetryUntranslated(source, translated) {
  if (!hasAsciiLetter(source)) return false;
  return normalizeForCompare(source) === normalizeForCompare(translated);
}

function applySourceCasingStyle(source, translated) {
  if (isUppercaseStyle(source)) {
    return translated.toUpperCase();
  }
  if (isTitleCaseStyle(source)) {
    return toTitleCase(translated);
  }
  return translated;
}

async function forceTranslateIfUnchanged(source, translated, targetLanguageCode) {
  if (!shouldRetryUntranslated(source, translated)) {
    return translated;
  }

  const loweredSource = source.toLowerCase();
  const loweredTranslated = await requestTranslation(loweredSource, targetLanguageCode);
  if (normalizeForCompare(loweredTranslated) === normalizeForCompare(loweredSource)) {
    return translated;
  }

  return applySourceCasingStyle(source, loweredTranslated);
}

function extractTranslatedText(payload) {
  if (!Array.isArray(payload) || !Array.isArray(payload[0])) {
    throw new Error("Unexpected translate API payload.");
  }
  return payload[0]
    .map((part) => (Array.isArray(part) ? part[0] ?? "" : ""))
    .join("");
}

async function requestTranslation(text, targetLanguage, attempt = 0) {
  const url =
    "https://translate.googleapis.com/translate_a/single" +
    `?client=gtx&sl=${SOURCE_LANGUAGE}&tl=${encodeURIComponent(targetLanguage)}` +
    `&dt=t&q=${encodeURIComponent(text)}`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    const payload = await response.json();
    return extractTranslatedText(payload);
  } catch (error) {
    if (attempt >= MAX_RETRIES) {
      throw error;
    }
    const backoff = 350 * Math.pow(2, attempt);
    await sleep(backoff);
    return requestTranslation(text, targetLanguage, attempt + 1);
  }
}

async function translateChunk(values, targetLanguageCode) {
  const joined = values.join(DELIMITER);
  const translatedJoined = await requestTranslation(joined, targetLanguageCode);
  const split = translatedJoined.split(DELIMITER);

  if (split.length === values.length) {
    return split;
  }

  // Fallback for delimiter corruption: translate each item separately.
  const translatedValues = [];
  for (const value of values) {
    const translatedValue = await requestTranslation(value, targetLanguageCode);
    translatedValues.push(translatedValue);
    await sleep(REQUEST_DELAY_MS);
  }
  return translatedValues;
}

async function translateUniqueStrings(uniqueStrings, targetLanguageCode, languageLabel) {
  const translatedMap = new Map();
  const chunks = chunkArray(uniqueStrings, CHUNK_SIZE);

  for (let index = 0; index < chunks.length; index += 1) {
    const chunk = chunks[index];
    const translatedChunk = await translateChunk(chunk, targetLanguageCode);

    for (let offset = 0; offset < chunk.length; offset += 1) {
      const sourceValue = chunk[offset];
      const translatedValue = translatedChunk[offset] ?? sourceValue;
      const finalValue = await forceTranslateIfUnchanged(
        sourceValue,
        translatedValue,
        targetLanguageCode
      );
      translatedMap.set(sourceValue, finalValue);
    }

    console.log(
      `[${languageLabel}] chunk ${index + 1}/${chunks.length} translated (${translatedMap.size}/${uniqueStrings.length})`
    );
    await sleep(REQUEST_DELAY_MS);
  }

  return translatedMap;
}

async function main() {
  const repoRoot = process.cwd();
  const translationsPath = path.resolve(repoRoot, "i18n/translations.ts");
  const outputPath = path.resolve(repoRoot, "i18n/translations.full-overrides.generated.ts");

  const mod = loadTranslationsModule(translationsPath);
  if (!mod?.translations?.en) {
    throw new Error("Could not load translations.en from i18n/translations.ts");
  }

  const english = mod.translations.en;
  const leaves = flattenStringLeaves(english);
  const uniqueStrings = [...new Set(leaves.map((leaf) => leaf.value))];

  console.log(`Loaded ${leaves.length} translation leaves (${uniqueStrings.length} unique strings).`);

  const fullOverrides = {};

  for (const [languageCode, apiLanguageCode] of Object.entries(TARGET_LANGUAGES)) {
    console.log(`\nTranslating ${languageCode} (${apiLanguageCode})...`);
    const map = await translateUniqueStrings(uniqueStrings, apiLanguageCode, languageCode);

    const translatedObject = {};
    for (const leaf of leaves) {
      const translated = map.get(leaf.value) ?? leaf.value;
      setAtPath(translatedObject, leaf.path, translated);
    }

    fullOverrides[languageCode] = translatedObject;
  }

  const fileContent = `/*\n` +
    ` * AUTO-GENERATED FILE. DO NOT EDIT DIRECTLY.\n` +
    ` * Generated by: scripts/generate-full-translation-overrides.mjs\n` +
    ` */\n\n` +
    `import type { Translations } from "./translations";\n\n` +
    `export const FULL_TRANSLATION_OVERRIDES: Record<string, Translations> = ${JSON.stringify(fullOverrides, null, 2)};\n`;

  fs.writeFileSync(outputPath, fileContent, "utf8");
  console.log(`\nWrote ${outputPath}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack ?? error.message : String(error));
  process.exit(1);
});
