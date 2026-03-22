#!/usr/bin/env node
/* eslint-disable no-console */

const fs = require("fs");
const path = require("path");

const root = process.cwd();
const manifestPath = path.resolve(root, "store-metadata/assets-manifest.json");
const appConfigPath = path.resolve(root, "app.json");

function fail(message) {
  console.error(`[store-check] FAIL: ${message}`);
  failed = true;
}

function ok(message) {
  console.log(`[store-check] OK: ${message}`);
}

function warn(message) {
  warnings += 1;
  console.warn(`[store-check] WARN: ${message}`);
}

function isImageFile(fileName) {
  return /\.(png|jpe?g)$/i.test(fileName);
}

function listImages(relDirPath) {
  const abs = path.resolve(root, relDirPath);
  if (!fs.existsSync(abs)) return [];
  return fs
    .readdirSync(abs)
    .filter((name) => isImageFile(name))
    .map((name) => path.join(relDirPath, name).replace(/\\/g, "/"))
    .sort();
}

function readPngSize(absPath) {
  const buffer = fs.readFileSync(absPath);
  if (buffer.length < 24) {
    throw new Error("file too small");
  }
  const pngSignature = "89504e470d0a1a0a";
  const signature = buffer.subarray(0, 8).toString("hex");
  if (signature !== pngSignature) {
    throw new Error("not a PNG file");
  }
  return {
    width: buffer.readUInt32BE(16),
    height: buffer.readUInt32BE(20),
  };
}

if (!fs.existsSync(manifestPath)) {
  console.error("[store-check] FAIL: missing store-metadata/assets-manifest.json");
  process.exit(1);
}
if (!fs.existsSync(appConfigPath)) {
  console.error("[store-check] FAIL: missing app.json");
  process.exit(1);
}

const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
const appConfig = JSON.parse(fs.readFileSync(appConfigPath, "utf8"));
const assets = Array.isArray(manifest.assets) ? manifest.assets : [];
let failed = false;
let warnings = 0;

for (const asset of assets) {
  const relPath = String(asset.path || "").trim();
  if (!relPath) {
    failed = true;
    console.error("[store-check] FAIL: asset entry has empty path");
    continue;
  }

  const exists = fs.existsSync(path.resolve(root, relPath));
  if (asset.required === true && !exists) {
    fail(`missing required asset: ${relPath}`);
    continue;
  }

  if (asset.manual === true && !exists) {
    warn(`manual asset not prepared yet: ${relPath}`);
    continue;
  }

  if (exists) {
    ok(relPath);
  }
}

const androidPhoneScreens = listImages("store-metadata/assets/android/phone");
if (androidPhoneScreens.length < 2) {
  fail(
    `Google Play requires at least 2 phone screenshots (found ${androidPhoneScreens.length})`
  );
} else {
  ok(`Google Play phone screenshot count is ${androidPhoneScreens.length}`);
}

for (const relPath of androidPhoneScreens) {
  const absPath = path.resolve(root, relPath);
  if (!/\.png$/i.test(relPath)) {
    warn(`dimension check currently validates PNG only: ${relPath}`);
    continue;
  }
  try {
    const { width, height } = readPngSize(absPath);
    const maxSide = Math.max(width, height);
    const minSide = Math.min(width, height);
    const ratio = maxSide / minSide;
    if (minSide < 320 || maxSide > 3840) {
      fail(`Play screenshot size out of range (320..3840): ${relPath} (${width}x${height})`);
    } else if (ratio > 2) {
      fail(`Play screenshot aspect ratio exceeds 2:1: ${relPath} (${width}x${height})`);
    } else {
      ok(`Play screenshot size valid: ${relPath} (${width}x${height})`);
    }
  } catch (error) {
    fail(`cannot read screenshot dimensions: ${relPath} (${String(error)})`);
  }
}

const featureGraphicPath = "store-metadata/assets/android/feature-graphic.png";
if (fs.existsSync(path.resolve(root, featureGraphicPath))) {
  try {
    const { width, height } = readPngSize(path.resolve(root, featureGraphicPath));
    if (width !== 1024 || height !== 500) {
      fail(`Google Play feature graphic must be 1024x500 (found ${width}x${height})`);
    } else {
      ok("Google Play feature graphic size is valid (1024x500)");
    }
  } catch (error) {
    fail(`cannot read feature graphic dimensions (${String(error)})`);
  }
} else {
  warn("Google Play feature graphic not found");
}

const ios67Screens = listImages("store-metadata/assets/ios/6.7");
if (ios67Screens.length < 1) {
  fail("App Store requires at least 1 iPhone screenshot (6.7 inch set)");
} else {
  ok(`iOS 6.7 screenshot count is ${ios67Screens.length}`);
}

const supportsTablet = Boolean(appConfig?.expo?.ios?.supportsTablet);
if (supportsTablet) {
  const ipadScreens = listImages("store-metadata/assets/ios/ipad");
  if (ipadScreens.length < 1) {
    fail("iOS supportsTablet=true requires at least 1 iPad screenshot set");
  } else {
    ok(`iPad screenshot count is ${ipadScreens.length}`);
  }
}

if (failed) {
  console.error("[store-check] Store asset check failed.");
  process.exit(1);
}

if (warnings > 0) {
  console.log(`[store-check] Completed with ${warnings} warning(s).`);
} else {
  console.log("[store-check] Store asset check passed.");
}
