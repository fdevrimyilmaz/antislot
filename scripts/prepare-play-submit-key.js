#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

function fail(message) {
  console.error(`[prepare-play-submit-key] ERROR: ${message}`);
  process.exit(1);
}

const projectRoot = path.resolve(__dirname, "..");
const credentialsDir = path.join(projectRoot, "credentials");
const outputPath = path.join(credentialsDir, "google-play-service-account.json");

const rawJson = process.env.GOOGLE_PLAY_SERVICE_ACCOUNT_JSON || "";
const rawB64 =
  process.env.GOOGLE_PLAY_SERVICE_ACCOUNT_JSON_B64 ||
  process.env.IAP_GOOGLE_SERVICE_ACCOUNT_JSON_B64 ||
  "";

if (!rawJson && !rawB64) {
  fail(
    "Missing service account secret. Set GOOGLE_PLAY_SERVICE_ACCOUNT_JSON_B64 (recommended) or GOOGLE_PLAY_SERVICE_ACCOUNT_JSON."
  );
}

let jsonText = rawJson;
if (!jsonText) {
  try {
    jsonText = Buffer.from(rawB64, "base64").toString("utf8");
  } catch (error) {
    fail(`Unable to decode base64 secret: ${error instanceof Error ? error.message : String(error)}`);
  }
}

let parsed;
try {
  parsed = JSON.parse(jsonText);
} catch (error) {
  fail(`Decoded secret is not valid JSON: ${error instanceof Error ? error.message : String(error)}`);
}

if (!parsed.client_email || !parsed.private_key) {
  fail("Service account JSON is missing required keys (client_email/private_key).");
}

fs.mkdirSync(credentialsDir, { recursive: true });
fs.writeFileSync(outputPath, JSON.stringify(parsed, null, 2), { encoding: "utf8", mode: 0o600 });

console.log(`[prepare-play-submit-key] Wrote ${outputPath}`);
