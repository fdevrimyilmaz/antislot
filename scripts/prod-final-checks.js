#!/usr/bin/env node
 

const fs = require("fs");
const path = require("path");

const root = process.cwd();
let failed = false;
const warnings = [];
const enforceLiveUrlChecks =
  process.argv.includes("--enforce-public-urls") ||
  process.env.PROD_FINAL_ENFORCE_URLS === "true" ||
  process.env.RELEASE_PREFLIGHT_STRICT === "true";

function readText(relPath) {
  const fullPath = path.resolve(root, relPath);
  if (!fs.existsSync(fullPath)) {
    throw new Error(`Missing file: ${relPath}`);
  }
  return fs.readFileSync(fullPath, "utf8");
}

function readJson(relPath) {
  return JSON.parse(readText(relPath));
}

function ok(message) {
  console.log(`[prod-final] OK: ${message}`);
}

function fail(message) {
  failed = true;
  console.error(`[prod-final] FAIL: ${message}`);
}

function warn(message) {
  warnings.push(message);
  console.warn(`[prod-final] WARN: ${message}`);
}

function mustMatch(content, regex, message) {
  if (!regex.test(content)) {
    fail(message);
    return false;
  }
  ok(message);
  return true;
}

function parseHttpsOrigin(url, fieldName) {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:") {
      fail(`${fieldName} must use https`);
      return null;
    }
    return parsed.origin;
  } catch {
    fail(`${fieldName} must be a valid URL`);
    return null;
  }
}

function checkAppUrls() {
  const appJson = readJson("app.json");
  const extra = appJson?.expo?.extra ?? {};
  const privacyUrl = String(extra.privacyPolicyUrl || "");
  const termsUrl = String(extra.termsUrl || "");
  const supportUrl = String(extra.supportUrl || "");
  const supportEmail = String(extra.supportEmail || "");

  if (!privacyUrl.startsWith("https://")) {
    fail("app.json expo.extra.privacyPolicyUrl must be https");
  } else {
    ok("Privacy policy URL is configured");
  }
  if (!termsUrl.startsWith("https://")) {
    fail("app.json expo.extra.termsUrl must be https");
  } else {
    ok("Terms URL is configured");
  }
  if (!supportUrl.startsWith("https://")) {
    fail("app.json expo.extra.supportUrl must be https");
  } else {
    ok("Support URL is configured");
  }
  if (!supportEmail.includes("@")) {
    fail("app.json expo.extra.supportEmail must be a valid email");
  } else {
    ok("Support email is configured");
  }
}

function checkPolicyPages() {
  const privacy = readText("website/privacy.html").toLowerCase();
  const terms = readText("website/terms.html").toLowerCase();
  const support = readText("website/support.html").toLowerCase();

  mustMatch(
    privacy,
    /(support@antislot\.app|mail)/,
    "privacy page contains support contact"
  );
  mustMatch(
    privacy,
    /(delete|deletion|silme|veri sil)/,
    "privacy page contains deletion guidance"
  );
  mustMatch(
    privacy,
    /(retention|saklama|g[üu]n)/,
    "privacy page contains retention guidance"
  );
  mustMatch(
    terms,
    /(privacy|gizlilik)/,
    "terms page references privacy policy"
  );
  mustMatch(
    terms,
    /(support@antislot\.app|mail)/,
    "terms page contains support contact"
  );
  mustMatch(
    support,
    /support@antislot\.app/,
    "support page contains support email"
  );
}

function checkPolicyRouteAliases() {
  const aliasTargets = [
    { path: "website/privacy/index.html", target: "../privacy.html", label: "privacy alias redirects to privacy.html" },
    { path: "website/terms/index.html", target: "../terms.html", label: "terms alias redirects to terms.html" },
    { path: "website/support/index.html", target: "../support.html", label: "support alias redirects to support.html" },
  ];

  const rootIndexPath = path.resolve(root, "website/index.html");
  if (!fs.existsSync(rootIndexPath)) {
    fail("website/index.html must exist");
  } else {
    const rootIndex = readText("website/index.html").toLowerCase();
    mustMatch(rootIndex, /privacy/, "website index links to privacy route");
    mustMatch(rootIndex, /terms/, "website index links to terms route");
    mustMatch(rootIndex, /support/, "website index links to support route");
  }

  for (const alias of aliasTargets) {
    const fullPath = path.resolve(root, alias.path);
    if (!fs.existsSync(fullPath)) {
      fail(`${alias.path} must exist`);
      continue;
    }
    const content = readText(alias.path);
    const targetRegex = new RegExp(alias.target.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
    mustMatch(content, targetRegex, alias.label);
  }
}

function checkUrlConsistency() {
  const appJson = readJson("app.json");
  const iosListing = readJson("store-metadata/ios/app-store-listing.json");
  const androidListing = readJson("store-metadata/android/play-store-listing.json");
  const constantsUrls = readText("constants/urls.ts");

  const appPrivacy = String(appJson?.expo?.extra?.privacyPolicyUrl || "");
  const appTerms = String(appJson?.expo?.extra?.termsUrl || "");
  const appSupport = String(appJson?.expo?.extra?.supportUrl || "");
  const iosPrivacy = String(iosListing?.privacyPolicyUrl || "");
  const iosSupport = String(iosListing?.supportUrl || "");
  const iosMarketing = String(iosListing?.marketingUrl || "");
  const playPrivacy = String(androidListing?.privacyPolicyUrl || "");
  const playWebsite = String(androidListing?.website || "");

  const originEntries = [
    ["app.json privacyPolicyUrl", appPrivacy],
    ["app.json termsUrl", appTerms],
    ["app.json supportUrl", appSupport],
    ["ios listing privacyPolicyUrl", iosPrivacy],
    ["ios listing supportUrl", iosSupport],
    ["ios listing marketingUrl", iosMarketing],
    ["play listing privacyPolicyUrl", playPrivacy],
    ["play listing website", playWebsite],
  ];

  const origins = new Set();
  for (const [fieldName, url] of originEntries) {
    const origin = parseHttpsOrigin(url, fieldName);
    if (origin) origins.add(origin);
  }

  if (origins.size > 1) {
    fail(`Legal/support URLs must share one origin. Found: ${Array.from(origins).join(", ")}`);
  } else if (origins.size === 1) {
    ok(`Legal/support URLs share one origin: ${Array.from(origins)[0]}`);
  }

  const defaultBaseMatch = constantsUrls.match(/DEFAULT_WEBSITE_BASE_URL\s*=\s*"([^"]+)"/);
  if (!defaultBaseMatch) {
    fail("constants/urls.ts must define DEFAULT_WEBSITE_BASE_URL");
    return;
  }

  const defaultBase = defaultBaseMatch[1];
  if (!appPrivacy.startsWith(defaultBase) || !appTerms.startsWith(defaultBase) || !appSupport.startsWith(defaultBase)) {
    fail("constants/urls.ts default base URL must match app.json legal/support URLs");
  } else {
    ok("constants/urls.ts default base URL matches app.json legal/support URLs");
  }
}

function checkTelemetryDefaults() {
  const privacyStore = readText("store/privacyStore.ts");
  const monitoring = readText("services/monitoring.ts");
  const privacyService = readText("services/privacy.ts");
  const analytics = readText("services/analytics.ts");

  mustMatch(
    privacyStore,
    /shareDiagnostics:\s*false/,
    "privacy default shareDiagnostics is false"
  );
  mustMatch(
    privacyStore,
    /crashReporting:\s*false/,
    "privacy default crashReporting is false"
  );
  mustMatch(
    privacyStore,
    /telemetryEnabled:\s*false/,
    "privacy default telemetryEnabled is false"
  );
  mustMatch(
    privacyStore,
    /dataMinimization:\s*true/,
    "privacy default dataMinimization is true"
  );
  mustMatch(
    privacyStore,
    /retentionDays:\s*30/,
    "privacy default retentionDays is 30"
  );
  mustMatch(
    monitoring,
    /canSendCrashReports\(\)/,
    "monitoring uses crash-reporting consent gate"
  );
  mustMatch(
    privacyService,
    /preferences\.telemetryEnabled/,
    "privacy service checks telemetryEnabled"
  );
  mustMatch(
    analytics,
    /pruneByRetention\(/,
    "analytics enforces retention pruning"
  );
}

function checkIapServerAuthority() {
  const premiumApi = readText("services/premiumApi.ts");
  const serverConfig = readText("server/src/config.ts");
  const serverIndex = readText("server/src/index.ts");

  mustMatch(
    premiumApi,
    /\/v1\/premium\/activate/,
    "mobile premium activation uses server endpoint"
  );
  mustMatch(
    premiumApi,
    /\/v1\/premium\/restore/,
    "mobile premium restore uses server endpoint"
  );
  mustMatch(
    premiumApi,
    /\/v1\/premium\/sync/,
    "mobile premium sync uses server endpoint"
  );
  mustMatch(
    serverConfig,
    /Production requires DATABASE_URL/,
    "server config enforces DATABASE_URL in production"
  );
  mustMatch(
    serverConfig,
    /ALLOW_DEV_RECEIPT_BYPASS cannot be true in production/,
    "server config blocks dev receipt bypass in production"
  );
  mustMatch(
    serverConfig,
    /Production requires IAP_VALIDATOR_URL/,
    "server config enforces IAP validator in production"
  );
  mustMatch(
    serverIndex,
    /post\("\/iap\/webhook"/,
    "server exposes IAP webhook endpoint"
  );
}

function checkStoreMetadata() {
  const iosListingPath = "store-metadata/ios/app-store-listing.json";
  const androidListingPath = "store-metadata/android/play-store-listing.json";
  const assetManifestPath = "store-metadata/assets-manifest.json";
  const realDeviceDocPath = "docs/REAL_DEVICE_RELEASE_VALIDATION.md";

  for (const relPath of [iosListingPath, androidListingPath, assetManifestPath, realDeviceDocPath]) {
    if (!fs.existsSync(path.resolve(root, relPath))) {
      fail(`missing required release file: ${relPath}`);
    } else {
      ok(`release file exists: ${relPath}`);
    }
  }

  if (fs.existsSync(path.resolve(root, iosListingPath))) {
    const iosListing = readJson(iosListingPath);
    if (!iosListing?.name || !iosListing?.description) {
      fail("iOS listing must include name and description");
    } else {
      ok("iOS listing has name and description");
    }
    if (!String(iosListing?.privacyPolicyUrl || "").startsWith("https://")) {
      fail("iOS listing privacyPolicyUrl must be https");
    } else {
      ok("iOS listing privacyPolicyUrl is configured");
    }
    if (!String(iosListing?.supportUrl || "").startsWith("https://")) {
      fail("iOS listing supportUrl must be https");
    } else {
      ok("iOS listing supportUrl is configured");
    }
  }

  if (fs.existsSync(path.resolve(root, androidListingPath))) {
    const playListing = readJson(androidListingPath);
    if (!playListing?.title || !playListing?.shortDescription || !playListing?.fullDescription) {
      fail("Play listing must include title, shortDescription, fullDescription");
    } else {
      ok("Play listing has required text fields");
    }
    if (!String(playListing?.privacyPolicyUrl || "").startsWith("https://")) {
      fail("Play listing privacyPolicyUrl must be https");
    } else {
      ok("Play listing privacyPolicyUrl is configured");
    }
  }

  if (fs.existsSync(path.resolve(root, assetManifestPath))) {
    const manifest = readJson(assetManifestPath);
    const assets = Array.isArray(manifest?.assets) ? manifest.assets : [];
    const requiredAssets = assets.filter((asset) => asset.required === true);
    for (const asset of requiredAssets) {
      const relPath = String(asset.path || "");
      if (!relPath) {
        fail(`asset entry has empty path (${asset.id || "unknown"})`);
        continue;
      }
      if (!fs.existsSync(path.resolve(root, relPath))) {
        fail(`required asset missing: ${relPath}`);
      } else {
        ok(`required asset found: ${relPath}`);
      }
    }
    const missingManualAssets = assets.filter(
      (asset) => asset.manual === true && !fs.existsSync(path.resolve(root, String(asset.path || "")))
    );
    if (missingManualAssets.length > 0) {
      warn(
        `${missingManualAssets.length} store assets still require manual preparation (screenshots/feature graphics).`
      );
    }
  }
}

async function probePublicUrl(url) {
  const reqInit = { redirect: "follow" };

  try {
    let response = await fetch(url, { ...reqInit, method: "HEAD" });
    if (response.status === 405 || response.status === 501) {
      response = await fetch(url, { ...reqInit, method: "GET" });
    }
    return {
      ok: response.ok,
      status: response.status,
      finalUrl: response.url || url,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      ok: false,
      status: null,
      finalUrl: url,
      message,
    };
  }
}

async function checkPublicStoreUrlsReachable() {
  const appJson = readJson("app.json");
  const iosListing = readJson("store-metadata/ios/app-store-listing.json");
  const androidListing = readJson("store-metadata/android/play-store-listing.json");

  const candidates = [
    appJson?.expo?.extra?.privacyPolicyUrl,
    appJson?.expo?.extra?.termsUrl,
    appJson?.expo?.extra?.supportUrl,
    iosListing?.privacyPolicyUrl,
    iosListing?.supportUrl,
    iosListing?.marketingUrl,
    androidListing?.privacyPolicyUrl,
    androidListing?.website,
  ]
    .map((value) => String(value || "").trim())
    .filter((value) => value.startsWith("https://"));

  const uniqueUrls = Array.from(new Set(candidates));

  for (const url of uniqueUrls) {
    const result = await probePublicUrl(url);
    if (result.ok) {
      ok(`public URL reachable: ${url} (${result.status})`);
      continue;
    }

    const detail = result.status
      ? `status ${result.status}`
      : result.message || "request failed";
    const message = `public URL not reachable: ${url} (${detail})`;
    if (enforceLiveUrlChecks) {
      fail(message);
    } else {
      warn(`${message}. Set PROD_FINAL_ENFORCE_URLS=true to fail on this.`);
    }
  }
}

function checkStorePolicySafety() {
  const appJson = readJson("app.json");
  const manifest = readText("android/app/src/main/AndroidManifest.xml");
  const featureFlags = readText("constants/featureFlags.ts");
  const appPermissions = Array.isArray(appJson?.expo?.android?.permissions)
    ? appJson.expo.android.permissions
    : [];
  const restrictedAndroidPermissions = [
    "android.permission.READ_SMS",
    "android.permission.RECEIVE_SMS",
    "android.permission.RECEIVE_MMS",
    "android.permission.RECEIVE_WAP_PUSH",
    "android.permission.SEND_SMS",
    "android.permission.READ_EXTERNAL_STORAGE",
    "android.permission.WRITE_EXTERNAL_STORAGE",
  ];

  for (const permission of restrictedAndroidPermissions) {
    if (appPermissions.includes(permission)) {
      fail(`app.json must not include restricted Android permission: ${permission}`);
    } else {
      ok(`app.json excludes restricted permission: ${permission}`);
    }
  }

  for (const permission of restrictedAndroidPermissions) {
    const escaped = permission.replace(/\./g, "\\.");
    const regex = new RegExp(`<uses-permission\\s+android:name="${escaped}"`, "i");
    if (regex.test(manifest)) {
      fail(`AndroidManifest must not include restricted permission: ${permission}`);
    } else {
      ok(`AndroidManifest excludes restricted permission: ${permission}`);
    }
  }

  const smsEntryRegexes = [
    /com\.antislot\.SmsDeliverReceiver/,
    /com\.antislot\.MmsDeliverReceiver/,
    /com\.antislot\.RespondViaMessageService/,
    /android\.intent\.action\.SENDTO/,
  ];
  for (const regex of smsEntryRegexes) {
    if (regex.test(manifest)) {
      fail(`AndroidManifest contains restricted SMS handler entry: ${regex}`);
    } else {
      ok(`AndroidManifest excludes SMS handler entry: ${regex}`);
    }
  }

  mustMatch(
    featureFlags,
    /ENABLE_SMS_ROLE[\s\S]*process\.env\.EXPO_PUBLIC_ENABLE_SMS_ROLE[\s\S]*false/s,
    "feature flag default for SMS role is false"
  );
  mustMatch(
    featureFlags,
    /ENABLE_IAP[\s\S]*process\.env\.EXPO_PUBLIC_ENABLE_IAP[\s\S]*false/s,
    "feature flag default for IAP is false"
  );
  mustMatch(
    featureFlags,
    /ENABLE_NOTIFICATIONS[\s\S]*process\.env\.EXPO_PUBLIC_ENABLE_NOTIFICATIONS[\s\S]*false/s,
    "feature flag default for notifications is false"
  );
}

function checkOperationalControls() {
  const serverPackage = readJson("server/package.json");
  const scripts = serverPackage?.scripts ?? {};
  const serverConfig = readText("server/src/config.ts");
  const serverIndex = readText("server/src/index.ts");
  const observabilityDoc = readText("docs/OBSERVABILITY_AND_RELIABILITY.md");

  if (!scripts["migrate:money-protection:tables"]) {
    fail("server/package.json must expose migrate:money-protection:tables");
  } else {
    ok("server migration command exists: migrate:money-protection:tables");
  }
  if (!scripts["verify:money-protection:tables"]) {
    fail("server/package.json must expose verify:money-protection:tables");
  } else {
    ok("server verification command exists: verify:money-protection:tables");
  }

  mustMatch(
    serverConfig,
    /ALERT_WEBHOOK_URL/,
    "server config exposes ALERT_WEBHOOK_URL"
  );
  mustMatch(
    serverIndex,
    /sendOperationalAlert\(/,
    "server runtime sends operational alerts"
  );
  mustMatch(
    observabilityDoc,
    /ALERT_WEBHOOK_URL/,
    "observability doc includes alert webhook setup"
  );
}

async function main() {
  console.log("[prod-final] Running final production checks...");
  checkAppUrls();
  checkPolicyPages();
  checkPolicyRouteAliases();
  checkUrlConsistency();
  checkStorePolicySafety();
  checkTelemetryDefaults();
  checkIapServerAuthority();
  checkOperationalControls();
  checkStoreMetadata();
  await checkPublicStoreUrlsReachable();

  if (warnings.length > 0) {
    console.log(`[prod-final] Completed with ${warnings.length} warning(s).`);
  }
  if (failed) {
    console.error("[prod-final] Final checks failed.");
    process.exit(1);
  }
  console.log("[prod-final] Final checks passed.");
}

main().catch((error) => {
  fail(`unexpected error: ${error instanceof Error ? error.message : String(error)}`);
  console.error("[prod-final] Final checks failed.");
  process.exit(1);
});
