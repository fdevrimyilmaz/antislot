#!/usr/bin/env node
/* eslint-disable no-console */

const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const WORKSPACES = [
  { id: "app", cwd: ".", lockfile: "package-lock.json" },
  { id: "backend", cwd: "backend", lockfile: "backend/package-lock.json" },
  { id: "server", cwd: "server", lockfile: "server/package-lock.json" },
];

const BASELINE_PATH = path.resolve(process.cwd(), "docs/reports/security-baseline.json");
const strictMode = process.env.CI === "true" || process.env.GITHUB_ACTIONS === "true";

function readJsonSafe(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch {
    return null;
  }
}

function runAudit(workspace) {
  const cwd = path.resolve(process.cwd(), workspace.cwd);
  const command =
    process.platform === "win32"
      ? "npm.cmd audit --omit=dev --json"
      : "npm audit --omit=dev --json";

  let output = "";
  try {
    output = execSync(command, {
      cwd,
      encoding: "utf8",
      env: process.env,
      stdio: ["ignore", "pipe", "pipe"],
      maxBuffer: 1024 * 1024 * 16,
    });
  } catch (error) {
    output = String(error?.stdout || error?.stderr || "");
  }

  output = output.trim();
  if (!output) {
    throw new Error(`[security-gate] ${workspace.id}: npm audit returned no output.`);
  }

  let parsed;
  try {
    parsed = JSON.parse(output);
  } catch (error) {
    throw new Error(
      `[security-gate] ${workspace.id}: unable to parse npm audit output as JSON (${String(error)})`
    );
  }

  const counts = parsed?.metadata?.vulnerabilities;
  if (!counts) {
    throw new Error(`[security-gate] ${workspace.id}: vulnerability metadata missing.`);
  }

  return {
    info: counts.info || 0,
    low: counts.low || 0,
    moderate: counts.moderate || 0,
    high: counts.high || 0,
    critical: counts.critical || 0,
    total: counts.total || 0,
  };
}

function printCounts(prefix, id, counts) {
  console.log(
    `[security-gate] ${prefix} ${id}: critical=${counts.critical}, high=${counts.high}, moderate=${counts.moderate}, low=${counts.low}, total=${counts.total}`
  );
}

function main() {
  const updateBaseline = process.argv.includes("--update-baseline");

  for (const workspace of WORKSPACES) {
    const lockPath = path.resolve(process.cwd(), workspace.lockfile);
    if (!fs.existsSync(lockPath)) {
      throw new Error(`[security-gate] Missing lockfile: ${workspace.lockfile}`);
    }
  }

  const current = {};
  for (const workspace of WORKSPACES) {
    current[workspace.id] = runAudit(workspace);
    printCounts("current", workspace.id, current[workspace.id]);
  }

  if (updateBaseline) {
    const next = {
      generatedAt: new Date().toISOString(),
      workspaces: current,
    };
    fs.mkdirSync(path.dirname(BASELINE_PATH), { recursive: true });
    fs.writeFileSync(BASELINE_PATH, `${JSON.stringify(next, null, 2)}\n`, "utf8");
    console.log(`[security-gate] Baseline updated: ${BASELINE_PATH}`);
    return;
  }

  const baseline = readJsonSafe(BASELINE_PATH);
  if (!baseline || typeof baseline !== "object" || !baseline.workspaces) {
    const message = `[security-gate] Baseline file is missing or invalid: ${BASELINE_PATH}`;
    if (strictMode) {
      throw new Error(message);
    }
    console.warn(`${message} (non-strict mode)`);
    return;
  }

  let failed = false;

  for (const workspace of WORKSPACES) {
    const id = workspace.id;
    const base = baseline.workspaces[id];
    const now = current[id];

    if (!base) {
      const msg = `[security-gate] Baseline entry missing for workspace=${id}`;
      if (strictMode) {
        console.error(msg);
        failed = true;
      } else {
        console.warn(`${msg} (non-strict mode)`);
      }
      continue;
    }

    printCounts("baseline", id, base);

    if (now.critical > base.critical) {
      console.error(
        `[security-gate] FAIL ${id}: critical vulnerabilities increased (${base.critical} -> ${now.critical})`
      );
      failed = true;
    }

    if (now.high > base.high) {
      console.error(
        `[security-gate] FAIL ${id}: high vulnerabilities increased (${base.high} -> ${now.high})`
      );
      failed = true;
    }

    if (now.moderate > base.moderate) {
      console.error(
        `[security-gate] FAIL ${id}: moderate vulnerabilities increased (${base.moderate} -> ${now.moderate})`
      );
      failed = true;
    }
  }

  if (failed) {
    process.exit(1);
  }

  console.log("[security-gate] PASS: vulnerability counts are within baseline.");
}

try {
  main();
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}
