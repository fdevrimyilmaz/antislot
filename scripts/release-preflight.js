#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");
const FORCE_STRICT = process.argv.includes("--strict");

const HINTS = {
  EXPO_TOKEN: "GitHub Secret (Actions)",
  EXPO_PUBLIC_API_URL: "EAS Secret (project) + GitHub Secret for CI preflight",
  EXPO_PUBLIC_SENTRY_DSN: "EAS Secret (project) + GitHub Secret for CI preflight",
  OPENAI_API_KEY: "Server runtime secret manager / deploy env",
  GEMINI_API_KEY: "Server runtime secret manager / deploy env",
  SENTRY_DSN: "Server runtime secret manager / deploy env",
  ALERT_WEBHOOK_URL: "Server runtime env (alert receiver endpoint)",
  ALERT_WEBHOOK_BEARER_TOKEN: "Server runtime secret manager / deploy env",
  CORS_ALLOWLIST: "Server runtime env",
  DATABASE_URL: "Server runtime secret manager / deploy env",
  IAP_WEBHOOK_SECRET: "Server runtime secret manager / deploy env",
  API_AUTH_TOKEN: "Server runtime secret manager / deploy env",
  ADMIN_PROXY_SHARED_SECRET: "Server runtime secret manager / deploy env (admin proxy auth)",
  ADMIN_PROXY_ALLOWED_USERS: "Server runtime env (comma-separated admin emails)",
  ADMIN_PROXY_ALLOWED_GROUPS: "Server runtime env (comma-separated admin groups)",
  FIREBASE_PROJECT_ID: "Server runtime env",
  IAP_VALIDATOR_URL: "Server runtime env",
  IAP_IOS_SHARED_SECRET: "Server runtime secret manager",
  IAP_GOOGLE_SERVICE_ACCOUNT_JSON_B64: "Server runtime secret manager",
};

const ROOT_ENV_FILES = [".env", ".env.production"];
const ROOT_LOCAL_ENV_FILES = [".env.local", ".env.production.local"];
const SERVER_ENV_FILES = ["server/.env", "server/.env.production"];
const SERVER_LOCAL_ENV_FILES = ["server/.env.local", "server/.env.production.local"];
const BACKEND_ENV_FILES = ["backend/.env", "backend/.env.production"];
const BACKEND_LOCAL_ENV_FILES = ["backend/.env.local", "backend/.env.production.local"];

function fail(name, message) {
  const hint = HINTS[name] ? ` [where: ${HINTS[name]}]` : "";
  console.error(`[preflight] FAIL: ${message}${hint}`);
  process.exitCode = 1;
}

function ok(message) {
  console.log(`[preflight] OK: ${message}`);
}

function warn(message) {
  console.warn(`[preflight] WARN: ${message}`);
}

function readJson(relPath) {
  const full = path.resolve(process.cwd(), relPath);
  const raw = fs.readFileSync(full, "utf8");
  return JSON.parse(raw);
}

function parseEnvLine(line) {
  const match = line.match(/^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
  if (!match) return null;
  const key = match[1];
  let value = match[2] ?? "";

  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    value = value.slice(1, -1);
    if (value.includes("\\n")) {
      value = value.replace(/\\n/g, "\n");
    }
  } else {
    value = value.replace(/\s+#.*$/, "").trim();
  }

  return { key, value };
}

function isStrictMode() {
  return (
    FORCE_STRICT ||
    process.env.CI === "true" ||
    process.env.GITHUB_ACTIONS === "true" ||
    process.env.RELEASE_PREFLIGHT_STRICT === "true"
  );
}

function isProductionMode() {
  return (process.env.NODE_ENV || "").trim().toLowerCase() === "production";
}

function getEnvFilesForTarget(target, { includeLocal = true } = {}) {
  const rootFiles = includeLocal ? [...ROOT_ENV_FILES, ...ROOT_LOCAL_ENV_FILES] : ROOT_ENV_FILES;
  const serverFiles = includeLocal
    ? [...SERVER_ENV_FILES, ...SERVER_LOCAL_ENV_FILES]
    : SERVER_ENV_FILES;
  const backendFiles = includeLocal
    ? [...BACKEND_ENV_FILES, ...BACKEND_LOCAL_ENV_FILES]
    : BACKEND_ENV_FILES;

  if (target === "mobile") {
    return rootFiles;
  }
  if (target === "backend") {
    return [...serverFiles, ...backendFiles];
  }
  return [...rootFiles, ...serverFiles, ...backendFiles];
}

function loadEnvFiles(target, { includeLocal = true } = {}) {
  const explicitKeys = new Set(Object.keys(process.env));
  const loadedFiles = [];

  for (const relPath of getEnvFilesForTarget(target, { includeLocal })) {
    const fullPath = path.resolve(process.cwd(), relPath);
    if (!fs.existsSync(fullPath)) continue;

    loadedFiles.push(relPath);
    const lines = fs.readFileSync(fullPath, "utf8").split(/\r?\n/);

    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (!line || line.startsWith("#")) continue;

      const parsed = parseEnvLine(rawLine);
      if (!parsed) continue;
      if (explicitKeys.has(parsed.key)) continue;

      process.env[parsed.key] = parsed.value;
    }
  }

  return loadedFiles;
}

function checkEnv(name, { required = true, enforce = true } = {}) {
  const value = (process.env[name] || "").trim();
  if (!value && required) {
    if (enforce) {
      fail(name, `${name} is required`);
    } else {
      warn(`${name} is missing (required for strict release checks)`);
    }
    return false;
  }
  if (value) {
    if (isPlaceholderValue(name, value)) {
      const message = `${name} appears to use a placeholder value`;
      if (enforce) {
        fail(name, message);
      } else {
        warn(`${message} (required for strict release checks)`);
      }
      return false;
    }
    ok(`${name} is set`);
    return true;
  }
  return true;
}

function checkAnyEnv(names, label, { enforce = true } = {}) {
  const hasAny = names.some((k) => (process.env[k] || "").trim().length > 0);
  if (!hasAny) {
    const message = `${label}: one of [${names.join(", ")}] must be set`;
    if (enforce) {
      fail(names[0], message);
    } else {
      warn(`${message} (required for strict release checks)`);
    }
  } else {
    ok(`${label} is configured`);
  }
}

function parseBooleanLike(value) {
  const normalized = (value || "").trim().toLowerCase();
  return normalized === "1" || normalized === "true" || normalized === "yes";
}

function isPlaceholderValue(name, value) {
  const normalized = value.trim().toLowerCase();
  const genericPlaceholders = new Set([
    "changeme",
    "change-me",
    "replace-me",
    "example",
    "example_value",
    "your-value-here",
    "your-secret-here",
    "todo",
    "tbd",
  ]);
  if (genericPlaceholders.has(normalized)) return true;

  if (/password@|:password@/i.test(value)) return true;
  if (/example\.com/i.test(value) || /example\.org/i.test(value)) return true;

  if (name.endsWith("_URL")) {
    if (normalized.includes("localhost") || normalized.includes("127.0.0.1")) {
      return process.env.NODE_ENV === "production" || process.env.RELEASE_PREFLIGHT_STRICT === "true";
    }
  }

  return false;
}

function assertNativeSourcesReleaseReady({ enforce = true } = {}) {
  if (!enforce && isCngWorkflow()) {
    ok(
      "CNG workflow detected (ios/android gitignored and generated by EAS prebuild); skipping deterministic native source enforcement in non-strict mode."
    );
    return;
  }

  const iosDir = path.resolve(process.cwd(), "ios");
  const androidDir = path.resolve(process.cwd(), "android");
  const gitignorePath = path.resolve(process.cwd(), ".gitignore");

  const missingDirs = [];
  if (!fs.existsSync(iosDir)) missingDirs.push("ios/");
  if (!fs.existsSync(androidDir)) missingDirs.push("android/");

  if (missingDirs.length > 0) {
    const message = `Native source directories missing: ${missingDirs.join(", ")}. Commit native projects or add a config plugin pipeline.`;
    if (enforce) {
      fail("", message);
    } else {
      warn(message);
    }
  } else {
    ok("Native source directories exist (ios/, android/)");
  }

  if (fs.existsSync(gitignorePath)) {
    const ignoredEntries = fs
      .readFileSync(gitignorePath, "utf8")
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean)
      .filter((line) => !line.startsWith("#"));

    const ignoresIos = ignoredEntries.includes("/ios") || ignoredEntries.includes("ios/");
    const ignoresAndroid = ignoredEntries.includes("/android") || ignoredEntries.includes("android/");

    if (ignoresIos || ignoresAndroid) {
      const ignored = [ignoresIos ? "ios" : null, ignoresAndroid ? "android" : null]
        .filter(Boolean)
        .join(", ");
      const message = `.gitignore currently ignores native directories (${ignored}). This breaks deterministic EAS native module inclusion in CI.`;
      if (enforce) {
        fail("", message);
      } else {
        warn(message);
      }
    } else {
      ok(".gitignore does not ignore ios/android native directories");
    }
  }

  const ignoredByGit = ["ios", "android"].filter((relPath) => isGitPathIgnored(relPath));
  if (ignoredByGit.length > 0) {
    const message = `git ignore rules currently hide native directories (${ignoredByGit.join(
      ", "
    )}). Remove ignore rules or commit generated native sources for deterministic CI builds.`;
    if (enforce) {
      fail("", message);
    } else {
      warn(`${message} (required for strict release checks)`);
    }
  } else {
    ok("git ignore rules do not hide ios/android directories");
  }
}

function extractPluginName(pluginEntry) {
  if (typeof pluginEntry === "string") return pluginEntry;
  if (Array.isArray(pluginEntry) && typeof pluginEntry[0] === "string") return pluginEntry[0];
  return "";
}

function getExpoPluginNames(appConfig) {
  const plugins = Array.isArray(appConfig?.expo?.plugins) ? appConfig.expo.plugins : [];
  return new Set(plugins.map(extractPluginName).filter(Boolean));
}

function assertRequiredExpoPlugins({ appConfig, packageJson, enforce = true } = {}) {
  const dependencies = {
    ...(packageJson?.dependencies || {}),
    ...(packageJson?.devDependencies || {}),
  };
  const pluginNames = getExpoPluginNames(appConfig);
  const requiredPlugins = [
    {
      dependency: "react-native-iap",
      plugin: "react-native-iap",
      reason: "prebuild must apply Play Billing/OpenIAP native wiring deterministically",
    },
    {
      dependency: "expo-notifications",
      plugin: "expo-notifications",
      reason: "prebuild must apply native notification permissions/entitlements deterministically",
    },
    {
      dependency: "@sentry/react-native",
      plugin: "@sentry/react-native",
      reason: "native Sentry release configuration must stay in sync with app config",
    },
  ];

  for (const rule of requiredPlugins) {
    if (!dependencies[rule.dependency]) continue;

    if (pluginNames.has(rule.plugin)) {
      ok(`Expo plugin present: ${rule.plugin}`);
      continue;
    }

    const message = `app.json expo.plugins is missing "${rule.plugin}" while ${rule.dependency} is installed (${rule.reason}).`;
    if (enforce) {
      fail(rule.plugin, message);
    } else {
      warn(`${message} (required for strict release checks)`);
    }
  }
}

function isGitPathIgnored(relPath) {
  const result = spawnSync("git", ["check-ignore", relPath], {
    cwd: process.cwd(),
    stdio: "ignore",
    windowsHide: true,
  });
  return result.status === 0;
}

function isGitPathTracked(relPath) {
  const result = spawnSync("git", ["ls-files", "--error-unmatch", "--", relPath], {
    cwd: process.cwd(),
    stdio: "ignore",
    windowsHide: true,
  });
  return result.status === 0;
}

function isCngWorkflow() {
  const iosTracked = isGitPathTracked("ios");
  const androidTracked = isGitPathTracked("android");
  const iosIgnored = isGitPathIgnored("ios");
  const androidIgnored = isGitPathIgnored("android");

  return !iosTracked && !androidTracked && (iosIgnored || androidIgnored);
}

function assertRequiredNativeModuleSources({ enforce = true } = {}) {
  if (!enforce && isCngWorkflow()) {
    ok(
      "CNG workflow detected (ios/android are generated on build); skipping static native module source checks."
    );
    return;
  }

  const allowUntracked = parseBooleanLike(process.env.RELEASE_ALLOW_UNTRACKED_NATIVE || "");
  const requiredGroups = [
    {
      label: "Android NativeModulesPackage",
      paths: ["android/app/src/main/java/com/antislot/NativeModulesPackage.kt"],
    },
    {
      label: "Android GamblingBlockerModule",
      paths: ["android/app/src/main/java/com/antislot/GamblingBlockerModule.kt"],
    },
    {
      label: "Android SharedConfigModule",
      paths: ["android/app/src/main/java/com/antislot/SharedConfigModule.kt"],
    },
    {
      label: "iOS GamblingBlockerModule",
      paths: ["ios/Antislot/GamblingBlockerModule.swift", "ios/HelloWorld/GamblingBlockerModule.swift"],
    },
    {
      label: "iOS SharedConfigModule",
      paths: ["ios/Antislot/SharedConfigModule.swift", "ios/HelloWorld/SharedConfigModule.swift"],
    },
    {
      label: "iOS SMS filter extension",
      paths: ["ios/AntislotMessageFilterExtension/MessageFilterExtension.swift"],
    },
  ];

  for (const group of requiredGroups) {
    const existingPath = group.paths.find((relPath) => fs.existsSync(path.resolve(process.cwd(), relPath)));
    if (!existingPath) {
      const message = `${group.label} source file missing. Expected one of: ${group.paths.join(", ")}.`;
      if (enforce) {
        fail("", message);
      } else {
        warn(`${message} (required for strict release checks)`);
      }
      continue;
    }

    ok(`${group.label} source present (${existingPath})`);

    if (allowUntracked) continue;

    if (!isGitPathTracked(existingPath)) {
      const message = `${existingPath} is not tracked by git. Commit native sources or set RELEASE_ALLOW_UNTRACKED_NATIVE=true only for generated-native CI pipelines.`;
      if (enforce) {
        fail("", message);
      } else {
        warn(`${message} (required for strict release checks)`);
      }
    } else {
      ok(`${existingPath} is tracked by git`);
    }
  }
}

function checkBooleanExpected(name, expected, { enforce = true, hint } = {}) {
  // eslint-disable-next-line expo/no-dynamic-env-var
  const raw = process.env[name];
  const parsed = parseBooleanLike(raw || "");
  const expectedLabel = expected ? "true" : "false";
  const actualLabel = raw == null || raw === "" ? "(missing)" : String(raw);

  if (raw == null || raw === "") {
    const message = `${name} is missing; expected ${expectedLabel}`;
    if (enforce) {
      fail(name, message);
    } else {
      warn(`${message}${hint ? ` (${hint})` : ""}`);
    }
    return;
  }

  if (parsed !== expected) {
    const message = `${name} must be ${expectedLabel} (got ${actualLabel})`;
    if (enforce) {
      fail(name, message);
    } else {
      warn(`${message}${hint ? ` (${hint})` : ""}`);
    }
    return;
  }

  ok(`${name} is ${expectedLabel}`);
}

function parseTarget() {
  const arg = process.argv.find((v) => v.startsWith("--target="));
  if (!arg) return "full";
  const value = arg.split("=")[1];
  if (value === "mobile" || value === "backend" || value === "full") return value;
  fail("", `Unknown target "${value}". Use mobile|backend|full`);
  return "full";
}

function main() {
  const target = parseTarget();
  const strict = isStrictMode();
  const includeLocalEnvFiles = !strict && !isProductionMode();
  const loadedFiles = loadEnvFiles(target, { includeLocal: includeLocalEnvFiles });

  if (loadedFiles.length > 0) {
    ok(`Loaded env files: ${loadedFiles.join(", ")}`);
  } else {
    warn("No local env files found. Using process env only.");
  }
  if (!includeLocalEnvFiles) {
    ok("Skipped *.local env files (production/strict mode).");
  }

  const eas = readJson("eas.json");
  const app = readJson("app.json");
  const pkg = readJson("package.json");

  const appVersionSource = eas?.cli?.appVersionSource;
  if (appVersionSource === "local" || appVersionSource === "remote") {
    ok(`eas.json cli.appVersionSource is "${appVersionSource}"`);
  } else {
    fail(
      "",
      `eas.json cli.appVersionSource must be "local" or "remote" (got "${appVersionSource || "missing"}")`
    );
  }

  const iosBundle = app?.expo?.ios?.bundleIdentifier;
  const androidPkg = app?.expo?.android?.package;
  if (!iosBundle || !androidPkg || iosBundle !== androidPkg) {
    fail("", "iOS bundleIdentifier and Android package must both exist and match");
  } else {
    ok(`bundle/package is consistent (${iosBundle})`);
  }

  if (target === "full" || target === "mobile") {
    assertNativeSourcesReleaseReady({ enforce: strict });
    assertRequiredNativeModuleSources({ enforce: strict });
    assertRequiredExpoPlugins({ appConfig: app, packageJson: pkg, enforce: strict });

    if (strict) {
      checkEnv("EXPO_TOKEN");
    } else if ((process.env.EXPO_TOKEN || "").trim()) {
      ok("EXPO_TOKEN is set");
    } else {
      warn("EXPO_TOKEN is not set. Local runs can use `eas login`; CI requires EXPO_TOKEN.");
    }
    checkEnv("EXPO_PUBLIC_API_URL");
    if (strict) {
      checkEnv("EXPO_PUBLIC_SENTRY_DSN", { enforce: true });
    } else if ((process.env.EXPO_PUBLIC_SENTRY_DSN || "").trim()) {
      ok("EXPO_PUBLIC_SENTRY_DSN is set");
    } else {
      warn("EXPO_PUBLIC_SENTRY_DSN is not set. Crash/release monitoring will be disabled.");
    }

    checkBooleanExpected("EXPO_PUBLIC_PREMIUM_FREE_FOR_NOW", false, {
      enforce: strict,
      hint: "premium free mode must stay disabled for store release",
    });
    checkBooleanExpected("EXPO_PUBLIC_ENABLE_PREMIUM_CODE_ACTIVATION", false, {
      enforce: strict,
      hint: "activation code UI should remain disabled in IAP-only release",
    });
  }

  if (target === "full" || target === "backend") {
    checkAnyEnv(["OPENAI_API_KEY", "GEMINI_API_KEY"], "AI provider key", { enforce: strict });
    checkEnv("CORS_ALLOWLIST", { enforce: strict });
    checkEnv("CORE_BACKEND_URL", { enforce: strict });
    checkEnv("DATABASE_URL", { enforce: strict });
    checkEnv("IAP_WEBHOOK_SECRET", { enforce: strict });
    checkAnyEnv(["API_AUTH_TOKEN", "FIREBASE_PROJECT_ID"], "auth mode", { enforce: strict });
    checkAnyEnv(
      ["IAP_VALIDATOR_URL", "IAP_IOS_SHARED_SECRET", "IAP_GOOGLE_SERVICE_ACCOUNT_JSON_B64"],
      "IAP validation",
      { enforce: strict }
    );
    checkBooleanExpected("ENABLE_PREMIUM_CODE_ACTIVATION", false, {
      enforce: strict,
      hint: "server-side activation code flow should remain disabled in IAP-only release",
    });
    if (strict) {
      checkEnv("SENTRY_DSN", { enforce: true });
    } else if ((process.env.SENTRY_DSN || "").trim()) {
      ok("SENTRY_DSN is set for backend/server observability");
    } else {
      warn("SENTRY_DSN is not set. Backend/server crash monitoring will be disabled.");
    }

    const adminProxyRequired = parseBooleanLike(process.env.ADMIN_PROXY_AUTH_REQUIRED || "");
    if (adminProxyRequired) {
      checkEnv("ADMIN_PROXY_SHARED_SECRET", { enforce: strict });
      const allowedUsers = (process.env.ADMIN_PROXY_ALLOWED_USERS || "").trim();
      const allowedGroups = (process.env.ADMIN_PROXY_ALLOWED_GROUPS || "").trim();
      if (!allowedUsers && !allowedGroups) {
        warn(
          "ADMIN_PROXY_AUTH_REQUIRED=true but no ADMIN_PROXY_ALLOWED_USERS or ADMIN_PROXY_ALLOWED_GROUPS configured."
        );
      } else {
        ok("Admin proxy allowlist is configured");
      }
    }

    checkEnv("ALERT_WEBHOOK_URL", { enforce: strict });
    if (strict) {
      checkEnv("ALERT_WEBHOOK_BEARER_TOKEN", { enforce: true });
    }
    if ((process.env.ALERT_WEBHOOK_URL || "").trim()) {
      const alertUrl = (process.env.ALERT_WEBHOOK_URL || "").trim();
      if (!/^https?:\/\//i.test(alertUrl)) {
        fail("ALERT_WEBHOOK_URL", "ALERT_WEBHOOK_URL must start with http:// or https://");
      } else if (strict && !alertUrl.startsWith("https://")) {
        fail("ALERT_WEBHOOK_URL", "ALERT_WEBHOOK_URL must use https in strict mode");
      } else {
        ok("ALERT_WEBHOOK_URL format is valid");
      }
      if (!strict && (process.env.ALERT_WEBHOOK_BEARER_TOKEN || "").trim()) {
        ok("ALERT_WEBHOOK_BEARER_TOKEN is set");
      } else {
        if (!strict) {
          warn("ALERT_WEBHOOK_BEARER_TOKEN is not set. Use if your alert receiver requires auth.");
        }
      }
    } else if (!strict) {
      warn("ALERT_WEBHOOK_URL is not set. Operational alerts (startup/unhandled/circuit) will not be delivered.");
    }
  }

  if (process.exitCode) {
    console.error(`[preflight] Release preflight failed (target=${target}).`);
    process.exit(process.exitCode);
  }
  console.log(`[preflight] Release preflight passed (target=${target}).`);
}

main();
