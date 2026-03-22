#!/usr/bin/env node

const { performance } = require("perf_hooks");

function parseIntEnv(name, fallback) {
  const raw = process.env[name];
  if (!raw) return fallback;
  const parsed = Number.parseInt(raw, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error(`${name} must be a positive integer`);
  }
  return parsed;
}

function parseFloatEnv(name, fallback) {
  const raw = process.env[name];
  if (!raw) return fallback;
  const parsed = Number.parseFloat(raw);
  if (!Number.isFinite(parsed) || parsed < 0) {
    throw new Error(`${name} must be a non-negative number`);
  }
  return parsed;
}

function percentile(values, p) {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.ceil((p / 100) * sorted.length) - 1;
  return Math.max(0, sorted[Math.min(sorted.length - 1, index)]);
}

function normalizeBaseUrl(raw) {
  return raw.replace(/\/+$/, "");
}

async function main() {
  const baseUrlRaw = (process.env.LOAD_SMOKE_BASE_URL || "").trim();
  if (!baseUrlRaw) {
    console.error("[load-smoke] LOAD_SMOKE_BASE_URL is required.");
    process.exit(1);
  }

  const baseUrl = normalizeBaseUrl(baseUrlRaw);
  const authToken = (process.env.LOAD_SMOKE_API_AUTH_TOKEN || "").trim();
  const durationSec = parseIntEnv("LOAD_SMOKE_DURATION_SEC", 30);
  const concurrency = parseIntEnv("LOAD_SMOKE_CONCURRENCY", 8);
  const maxErrorRate = parseFloatEnv("LOAD_SMOKE_MAX_ERROR_RATE", 0.02);

  const latencyThresholds = {
    "/v1/health": parseIntEnv("LOAD_SMOKE_HEALTH_P95_MS", 800),
    "/v1/ready": parseIntEnv("LOAD_SMOKE_READY_P95_MS", 1200),
  };

  const endpoints = [
    { path: "/v1/health", expected: new Set([200]) },
    { path: "/v1/ready", expected: new Set([200]) },
  ];

  const stats = new Map();
  for (const endpoint of endpoints) {
    stats.set(endpoint.path, {
      total: 0,
      success: 0,
      latencies: [],
      statusCounts: new Map(),
      networkErrors: 0,
    });
  }

  const startedAt = Date.now();
  const runUntil = startedAt + durationSec * 1000;

  async function runWorker(workerId) {
    let cursor = workerId % endpoints.length;

    while (Date.now() < runUntil) {
      const endpoint = endpoints[cursor % endpoints.length];
      cursor += 1;

      const record = stats.get(endpoint.path);
      record.total += 1;

      const requestStarted = performance.now();
      try {
        const response = await fetch(`${baseUrl}${endpoint.path}`, {
          method: "GET",
          headers: {
            Accept: "application/json",
            ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
          },
        });

        const elapsedMs = Number((performance.now() - requestStarted).toFixed(2));
        record.latencies.push(elapsedMs);
        record.statusCounts.set(
          response.status,
          (record.statusCounts.get(response.status) || 0) + 1
        );

        if (endpoint.expected.has(response.status)) {
          record.success += 1;
        }
      } catch {
        const elapsedMs = Number((performance.now() - requestStarted).toFixed(2));
        record.latencies.push(elapsedMs);
        record.networkErrors += 1;
      }
    }
  }

  console.log(
    `[load-smoke] Starting ${durationSec}s load test with concurrency=${concurrency} against ${baseUrl}`
  );
  await Promise.all(Array.from({ length: concurrency }, (_, index) => runWorker(index)));

  let failures = 0;
  let globalTotal = 0;
  let globalSuccess = 0;

  console.log("[load-smoke] Summary");
  for (const endpoint of endpoints) {
    const record = stats.get(endpoint.path);
    globalTotal += record.total;
    globalSuccess += record.success;

    const p50 = percentile(record.latencies, 50);
    const p95 = percentile(record.latencies, 95);
    const p99 = percentile(record.latencies, 99);
    const successRate = record.total > 0 ? record.success / record.total : 0;

    console.log(
      JSON.stringify({
        endpoint: endpoint.path,
        total: record.total,
        success: record.success,
        successRate: Number(successRate.toFixed(4)),
        networkErrors: record.networkErrors,
        p50Ms: p50,
        p95Ms: p95,
        p99Ms: p99,
        statusCounts: Object.fromEntries(record.statusCounts.entries()),
      })
    );

    const threshold = latencyThresholds[endpoint.path];
    if (p95 > threshold) {
      console.error(
        `[load-smoke] FAIL: ${endpoint.path} p95=${p95}ms exceeds threshold=${threshold}ms`
      );
      failures += 1;
    }

    if (1 - successRate > maxErrorRate) {
      console.error(
        `[load-smoke] FAIL: ${endpoint.path} errorRate=${((1 - successRate) * 100).toFixed(2)}% exceeds max=${(
          maxErrorRate * 100
        ).toFixed(2)}%`
      );
      failures += 1;
    }
  }

  const globalSuccessRate = globalTotal > 0 ? globalSuccess / globalTotal : 0;
  if (globalTotal === 0) {
    console.error("[load-smoke] FAIL: No requests were executed.");
    process.exit(1);
  }

  console.log(
    `[load-smoke] Completed in ${Date.now() - startedAt}ms. globalSuccessRate=${(
      globalSuccessRate * 100
    ).toFixed(2)}%`
  );

  if (failures > 0) {
    process.exit(1);
  }
}

main().catch((error) => {
  console.error("[load-smoke] Fatal error:", error);
  process.exit(1);
});
