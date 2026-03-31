#!/usr/bin/env node
 

const { execSync } = require("child_process");
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

const WORKSPACES = [
  { id: "app", cwd: ".", lockfile: "package-lock.json" },
  { id: "backend", cwd: "backend", lockfile: "backend/package-lock.json" },
  { id: "server", cwd: "server", lockfile: "server/package-lock.json" },
];

const BASELINE_PATH = path.resolve(process.cwd(), "docs/reports/security-baseline.json");
const DEFAULT_REPORT_PATH = path.resolve(process.cwd(), "reports/security-gate-report.json");
const TRACKED_SEVERITIES = ["critical", "high", "moderate", "low"];
const TRACKED_SEVERITY_SET = new Set(TRACKED_SEVERITIES);
const strictMode = process.env.CI === "true" || process.env.GITHUB_ACTIONS === "true";
const enforceZeroVulns = process.env.SECURITY_GATE_ENFORCE_ZERO_VULNS !== "false";
const maxBaselineAgeDays = readPositiveInt(process.env.SECURITY_GATE_MAX_BASELINE_AGE_DAYS, 14);
const reportPath = resolveReportPath();

function readJsonSafe(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch {
    return null;
  }
}

function readPositiveInt(rawValue, fallback) {
  const parsed = Number(rawValue);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }
  return Math.floor(parsed);
}

function toCount(value) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) {
    return 0;
  }
  return Math.floor(parsed);
}

function getArgValue(name) {
  const exactPrefix = `${name}=`;
  for (let index = 0; index < process.argv.length; index += 1) {
    const arg = process.argv[index];
    if (arg === name) {
      const next = process.argv[index + 1];
      return typeof next === "string" && !next.startsWith("--") ? next : "";
    }
    if (arg.startsWith(exactPrefix)) {
      return arg.slice(exactPrefix.length);
    }
  }
  return "";
}

function resolveReportPath() {
  const fromArg = getArgValue("--report") || getArgValue("--report-path");
  const fromEnv = process.env.SECURITY_GATE_REPORT_PATH || "";
  const raw = fromArg || fromEnv;
  return path.resolve(process.cwd(), raw || DEFAULT_REPORT_PATH);
}

function commandForNpm(subCommand) {
  if (process.platform === "win32") {
    return `npm.cmd ${subCommand}`;
  }
  return `npm ${subCommand}`;
}

function getNpmVersion() {
  try {
    return execSync(commandForNpm("--version"), {
      cwd: process.cwd(),
      encoding: "utf8",
      env: process.env,
      stdio: ["ignore", "pipe", "pipe"],
    }).trim();
  } catch {
    return "unknown";
  }
}

function hashFileSha256(filePath) {
  const bytes = fs.readFileSync(filePath);
  return crypto.createHash("sha256").update(bytes).digest("hex");
}

function normalizeSeverity(value) {
  const normalized = String(value || "").toLowerCase();
  if (normalized === "critical") return "critical";
  if (normalized === "high") return "high";
  if (normalized === "moderate") return "moderate";
  if (normalized === "low") return "low";
  if (normalized === "info") return "info";
  return "unknown";
}

function compactToken(value) {
  return String(value || "")
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();
}

function viaFingerprint(via) {
  if (!via) {
    return "via:unknown";
  }

  if (typeof via === "string") {
    return `dependency:${compactToken(via) || "unknown"}`;
  }

  if (typeof via === "object") {
    if (Number.isFinite(via.source)) {
      return `advisory:${via.source}`;
    }

    if (typeof via.url === "string" && via.url.trim()) {
      return `url:${compactToken(via.url)}`;
    }

    const name = compactToken(via.name || via.dependency || via.title || "unknown");
    const range = compactToken(via.range || "unknown");
    return `meta:${name}@${range}`;
  }

  return `via:${compactToken(String(via)) || "unknown"}`;
}

function summarizeVulnerabilities(parsedAudit) {
  const vulnerabilities =
    parsedAudit && typeof parsedAudit.vulnerabilities === "object" && parsedAudit.vulnerabilities
      ? parsedAudit.vulnerabilities
      : {};

  const vulnerablePackagesBySeverity = {
    critical: new Set(),
    high: new Set(),
    moderate: new Set(),
    low: new Set(),
    info: new Set(),
  };
  const trackedFingerprints = {
    critical: new Set(),
    high: new Set(),
    moderate: new Set(),
    low: new Set(),
  };

  for (const [packageName, vulnerability] of Object.entries(vulnerabilities)) {
    const severity = normalizeSeverity(vulnerability?.severity);
    if (vulnerablePackagesBySeverity[severity]) {
      vulnerablePackagesBySeverity[severity].add(packageName);
    }

    if (!TRACKED_SEVERITY_SET.has(severity)) {
      continue;
    }

    const viaEntries =
      Array.isArray(vulnerability?.via) && vulnerability.via.length > 0
        ? vulnerability.via
        : [null];

    for (const via of viaEntries) {
      trackedFingerprints[severity].add(
        `${severity}|${compactToken(packageName) || "unknown"}|${viaFingerprint(via)}`
      );
    }
  }

  return {
    vulnerablePackagesBySeverity: {
      critical: Array.from(vulnerablePackagesBySeverity.critical).sort(),
      high: Array.from(vulnerablePackagesBySeverity.high).sort(),
      moderate: Array.from(vulnerablePackagesBySeverity.moderate).sort(),
      low: Array.from(vulnerablePackagesBySeverity.low).sort(),
      info: Array.from(vulnerablePackagesBySeverity.info).sort(),
    },
    trackedFingerprints: {
      critical: Array.from(trackedFingerprints.critical).sort(),
      high: Array.from(trackedFingerprints.high).sort(),
      moderate: Array.from(trackedFingerprints.moderate).sort(),
      low: Array.from(trackedFingerprints.low).sort(),
    },
  };
}

function parseAuditJson(rawOutput, workspaceId) {
  const trimmed = String(rawOutput || "").trim();
  if (!trimmed) {
    throw new Error(`[security-gate] ${workspaceId}: npm audit returned no output.`);
  }

  try {
    return JSON.parse(trimmed);
  } catch (firstError) {
    const firstBrace = trimmed.indexOf("{");
    const lastBrace = trimmed.lastIndexOf("}");
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      const candidate = trimmed.slice(firstBrace, lastBrace + 1);
      try {
        return JSON.parse(candidate);
      } catch (secondError) {
        throw new Error(
          `[security-gate] ${workspaceId}: unable to parse npm audit JSON (${String(
            secondError
          )}).`
        );
      }
    }

    throw new Error(
      `[security-gate] ${workspaceId}: unable to parse npm audit JSON (${String(firstError)}).`
    );
  }
}

function runAudit(workspace) {
  const cwd = path.resolve(process.cwd(), workspace.cwd);
  const command = commandForNpm("audit --omit=dev --json");

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
    output = [error?.stdout, error?.stderr]
      .filter((chunk) => chunk !== undefined && chunk !== null)
      .map((chunk) => String(chunk))
      .join("\n");
  }

  const parsed = parseAuditJson(output, workspace.id);

  const counts = parsed?.metadata?.vulnerabilities;
  if (!counts) {
    throw new Error(`[security-gate] ${workspace.id}: vulnerability metadata missing.`);
  }

  const summary = summarizeVulnerabilities(parsed);

  return {
    counts: {
      info: toCount(counts.info),
      low: toCount(counts.low),
      moderate: toCount(counts.moderate),
      high: toCount(counts.high),
      critical: toCount(counts.critical),
      total: toCount(counts.total),
    },
    vulnerablePackagesBySeverity: summary.vulnerablePackagesBySeverity,
    trackedFingerprints: summary.trackedFingerprints,
  };
}

function printCounts(prefix, id, counts) {
  console.log(
    `[security-gate] ${prefix} ${id}: critical=${counts.critical}, high=${counts.high}, moderate=${counts.moderate}, low=${counts.low}, total=${counts.total}`
  );
}

function printTrackedSummary(prefix, id, trackedFingerprints) {
  console.log(
    `[security-gate] ${prefix} ${id}: tracked-fingerprints critical=${trackedFingerprints.critical.length}, high=${trackedFingerprints.high.length}, moderate=${trackedFingerprints.moderate.length}, low=${trackedFingerprints.low.length}`
  );
}

function normalizeBaselineTrackedFingerprints(workspaceBaseline) {
  if (!workspaceBaseline || typeof workspaceBaseline !== "object") {
    return null;
  }

  const tracked = workspaceBaseline.trackedFingerprints;
  if (!tracked || typeof tracked !== "object") {
    return null;
  }

  return {
    critical: Array.isArray(tracked.critical)
      ? tracked.critical.map((item) => String(item)).sort()
      : [],
    high: Array.isArray(tracked.high) ? tracked.high.map((item) => String(item)).sort() : [],
    moderate: Array.isArray(tracked.moderate)
      ? tracked.moderate.map((item) => String(item)).sort()
      : [],
    low: Array.isArray(tracked.low) ? tracked.low.map((item) => String(item)).sort() : [],
  };
}

function writeReport(report) {
  fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  console.log(`[security-gate] Report written: ${reportPath}`);
}

function hasIncreases(baseCounts, nowCounts) {
  const failures = [];

  if (nowCounts.critical > toCount(baseCounts.critical)) {
    failures.push(
      `[security-gate] FAIL: critical vulnerabilities increased (${toCount(baseCounts.critical)} -> ${nowCounts.critical})`
    );
  }

  if (nowCounts.high > toCount(baseCounts.high)) {
    failures.push(
      `[security-gate] FAIL: high vulnerabilities increased (${toCount(baseCounts.high)} -> ${nowCounts.high})`
    );
  }

  if (nowCounts.moderate > toCount(baseCounts.moderate)) {
    failures.push(
      `[security-gate] FAIL: moderate vulnerabilities increased (${toCount(baseCounts.moderate)} -> ${nowCounts.moderate})`
    );
  }

  if (nowCounts.low > toCount(baseCounts.low)) {
    failures.push(
      `[security-gate] FAIL: low vulnerabilities increased (${toCount(baseCounts.low)} -> ${nowCounts.low})`
    );
  }

  return failures;
}

function main() {
  const updateBaseline = process.argv.includes("--update-baseline");
  const npmVersion = getNpmVersion();
  const lockfileHashes = {};

  for (const workspace of WORKSPACES) {
    const lockPath = path.resolve(process.cwd(), workspace.lockfile);
    if (!fs.existsSync(lockPath)) {
      throw new Error(`[security-gate] Missing lockfile: ${workspace.lockfile}`);
    }
    lockfileHashes[workspace.id] = hashFileSha256(lockPath);
  }

  const current = {};
  for (const workspace of WORKSPACES) {
    current[workspace.id] = runAudit(workspace);
    printCounts("current", workspace.id, current[workspace.id].counts);
    printTrackedSummary("current", workspace.id, current[workspace.id].trackedFingerprints);
  }

  if (updateBaseline) {
    const workspaces = {};
    for (const workspace of WORKSPACES) {
      const id = workspace.id;
      workspaces[id] = {
        ...current[id].counts,
        lockfileSha256: lockfileHashes[id],
        trackedFingerprints: current[id].trackedFingerprints,
      };
    }

    const next = {
      schemaVersion: 2,
      generatedAt: new Date().toISOString(),
      generator: {
        nodeVersion: process.version,
        npmVersion,
      },
      policy: {
        trackedSeverities: TRACKED_SEVERITIES,
        maxBaselineAgeDays,
        enforceZeroVulns,
      },
      workspaces,
    };
    fs.mkdirSync(path.dirname(BASELINE_PATH), { recursive: true });
    fs.writeFileSync(BASELINE_PATH, `${JSON.stringify(next, null, 2)}\n`, "utf8");
    console.log(`[security-gate] Baseline updated: ${BASELINE_PATH}`);

    writeReport({
      generatedAt: new Date().toISOString(),
      mode: "baseline-update",
      strictMode,
      baselinePath: BASELINE_PATH,
      reportPath,
      tool: {
        nodeVersion: process.version,
        npmVersion,
      },
      policy: {
        trackedSeverities: TRACKED_SEVERITIES,
        maxBaselineAgeDays,
        enforceZeroVulns,
      },
      workspaces: Object.fromEntries(
        WORKSPACES.map((workspace) => {
          const id = workspace.id;
          return [
            id,
            {
              lockfileSha256: lockfileHashes[id],
              counts: current[id].counts,
              vulnerablePackagesBySeverity: current[id].vulnerablePackagesBySeverity,
              trackedFingerprints: current[id].trackedFingerprints,
            },
          ];
        })
      ),
      warnings: [],
      failures: [],
    });
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

  const warnings = [];
  const failures = [];

  const baselineGeneratedAt = Date.parse(String(baseline.generatedAt || ""));
  if (!Number.isFinite(baselineGeneratedAt)) {
    const msg = `[security-gate] Baseline generatedAt is missing or invalid: ${BASELINE_PATH}`;
    if (strictMode) {
      failures.push(msg);
    } else {
      warnings.push(`${msg} (non-strict mode)`);
    }
  } else {
    const ageDays = (Date.now() - baselineGeneratedAt) / (24 * 60 * 60 * 1000);
    if (ageDays > maxBaselineAgeDays) {
      const msg = `[security-gate] Baseline is stale (${ageDays.toFixed(
        1
      )} days old, max ${maxBaselineAgeDays}). Run: npm run security:baseline:update`;
      if (strictMode) {
        failures.push(msg);
      } else {
        warnings.push(`${msg} (non-strict mode)`);
      }
    }
  }

  for (const workspace of WORKSPACES) {
    const id = workspace.id;
    const base = baseline.workspaces[id];
    const now = current[id];

    if (!base) {
      const msg = `[security-gate] Baseline entry missing for workspace=${id}`;
      if (strictMode) {
        failures.push(msg);
      } else {
        warnings.push(`${msg} (non-strict mode)`);
      }
      continue;
    }

    printCounts("baseline", id, {
      info: toCount(base.info),
      low: toCount(base.low),
      moderate: toCount(base.moderate),
      high: toCount(base.high),
      critical: toCount(base.critical),
      total: toCount(base.total),
    });

    const countFailures = hasIncreases(base, now.counts);
    for (const failure of countFailures) {
      failures.push(`${failure.replace("FAIL:", `FAIL ${id}:`)}`);
    }

    if (enforceZeroVulns && now.counts.total > 0) {
      failures.push(
        `[security-gate] FAIL ${id}: zero-vulnerability policy enabled and total vulnerabilities=${now.counts.total}`
      );
    }

    const baselineLockHash =
      typeof base.lockfileSha256 === "string" ? String(base.lockfileSha256) : "";
    if (!baselineLockHash) {
      const msg = `[security-gate] Baseline lockfile hash missing for workspace=${id}. Run: npm run security:baseline:update`;
      if (strictMode) {
        failures.push(msg);
      } else {
        warnings.push(`${msg} (non-strict mode)`);
      }
    } else if (baselineLockHash !== lockfileHashes[id]) {
      const msg = `[security-gate] FAIL ${id}: lockfile hash changed since baseline. Run: npm run security:baseline:update`;
      if (strictMode) {
        failures.push(msg);
      } else {
        warnings.push(`${msg} (non-strict mode)`);
      }
    }

    const baselineTrackedFingerprints = normalizeBaselineTrackedFingerprints(base);
    if (!baselineTrackedFingerprints) {
      const msg = `[security-gate] Baseline tracked fingerprints missing for workspace=${id}. Run: npm run security:baseline:update`;
      if (strictMode) {
        failures.push(msg);
      } else {
        warnings.push(`${msg} (non-strict mode)`);
      }
      continue;
    }

    printTrackedSummary("baseline", id, baselineTrackedFingerprints);

    for (const severity of TRACKED_SEVERITIES) {
      const baselineSet = new Set(baselineTrackedFingerprints[severity] || []);
      const currentSet = new Set(now.trackedFingerprints[severity] || []);
      const added = Array.from(currentSet).filter((item) => !baselineSet.has(item)).sort();

      if (added.length > 0) {
        const sample = added.slice(0, 3).join(", ");
        failures.push(
          `[security-gate] FAIL ${id}: new ${severity} vulnerability fingerprint(s) detected (${added.length}). Example(s): ${sample}`
        );
      }
    }
  }

  for (const warning of warnings) {
    console.warn(warning);
  }
  for (const failure of failures) {
    console.error(failure);
  }

  writeReport({
    generatedAt: new Date().toISOString(),
    mode: "gate",
    strictMode,
    baselinePath: BASELINE_PATH,
    reportPath,
    tool: {
      nodeVersion: process.version,
      npmVersion,
    },
    policy: {
      trackedSeverities: TRACKED_SEVERITIES,
      maxBaselineAgeDays,
      enforceZeroVulns,
    },
    baselineGeneratedAt: baseline.generatedAt || null,
    workspaces: Object.fromEntries(
      WORKSPACES.map((workspace) => {
        const id = workspace.id;
        return [
          id,
          {
            lockfileSha256: lockfileHashes[id],
            counts: current[id].counts,
            vulnerablePackagesBySeverity: current[id].vulnerablePackagesBySeverity,
            trackedFingerprints: current[id].trackedFingerprints,
          },
        ];
      })
    ),
    warnings,
    failures,
  });

  if (failures.length > 0) {
    process.exit(1);
  }

  console.log("[security-gate] PASS: vulnerability counts and fingerprints are within baseline.");
}

try {
  main();
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}
