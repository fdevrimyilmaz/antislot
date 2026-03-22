#!/usr/bin/env node

const fs = require("node:fs");
const path = require("node:path");

const REQUIRED_FIREBASE_KEYS = [
  "EXPO_PUBLIC_FIREBASE_API_KEY",
  "EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN",
  "EXPO_PUBLIC_FIREBASE_PROJECT_ID",
  "EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET",
  "EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID",
  "EXPO_PUBLIC_FIREBASE_APP_ID",
  "EXPO_PUBLIC_FIREBASE_DATABASE_URL",
];

const MODE = process.argv.includes("--production") ? "production" : "development";

const ENV_FILES =
  MODE === "production"
    ? [".env.production", ".env.production.local"]
    : [".env", ".env.local"];

function parseEnvFile(filePath) {
  const entries = {};
  const content = fs.readFileSync(filePath, "utf8");
  const lines = content.split(/\r?\n/);

  lines.forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) return;

    const splitIndex = trimmed.indexOf("=");
    if (splitIndex < 1) return;

    const key = trimmed.slice(0, splitIndex).trim();
    let value = trimmed.slice(splitIndex + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    entries[key] = value;
  });

  return entries;
}

function loadEnvFromFiles(files) {
  const merged = {};
  const loadedFiles = [];

  files.forEach((file) => {
    const absolute = path.resolve(process.cwd(), file);
    if (!fs.existsSync(absolute)) return;

    Object.assign(merged, parseEnvFile(absolute));
    loadedFiles.push(file);
  });

  return { merged, loadedFiles };
}

function readValue(key, merged) {
  const fromProcess = process.env[key];
  if (typeof fromProcess === "string" && fromProcess.trim().length > 0) {
    return fromProcess.trim();
  }

  const fromFile = merged[key];
  if (typeof fromFile === "string" && fromFile.trim().length > 0) {
    return fromFile.trim();
  }

  return "";
}

const { merged, loadedFiles } = loadEnvFromFiles(ENV_FILES);
const missing = REQUIRED_FIREBASE_KEYS.filter((key) => readValue(key, merged).length === 0);

console.log(`[firebase-env] Mode: ${MODE}`);
if (loadedFiles.length) {
  console.log(`[firebase-env] Loaded files: ${loadedFiles.join(", ")}`);
} else {
  console.log("[firebase-env] No env files found, checking process.env only.");
}

if (missing.length === 0) {
  console.log("[firebase-env] OK: Firebase config is complete.");
  process.exit(0);
}

console.error("[firebase-env] FAIL: Missing Firebase public vars:");
missing.forEach((key) => {
  console.error(`  - ${key}`);
});
console.error(
  "[firebase-env] Set these in .env.local for local development or via EAS project secrets."
);
process.exit(1);
