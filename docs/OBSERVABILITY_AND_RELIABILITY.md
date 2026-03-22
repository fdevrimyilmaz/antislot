# Observability And Reliability Playbook

This document defines the new production-grade reliability controls added for the API stack.

## 1. Runtime Endpoints

- `GET /v1/health`: rich service health payload with `ready`, `degraded`, dependency status, runtime counters.
- `GET /v1/ready`: strict readiness check for load balancers and orchestration (`200` or `503`).
- `GET /v1/metrics`: Prometheus text format metrics export.
  - Controlled by `ENABLE_METRICS_ENDPOINT`.
  - In production, `METRICS_AUTH_TOKEN` is required.
  - Request header: `Authorization: Bearer <METRICS_AUTH_TOKEN>`.

## 2. Prometheus Metrics Export

Main metrics currently exported:

- Service state: `antislot_service_ready`, `antislot_service_degraded`
- Dependency state: `antislot_core_backend_up`, `antislot_openai_configured`, `antislot_openai_chat_enabled`
- OpenAI resilience: `antislot_openai_circuit_state{state=...}`
- Runtime counters: request totals, 4xx, 5xx, rate-limited, not-found
- Latency gauges: global avg/max request duration
- Route-level counters and latency gauges (`antislot_route_*`)

## 3. Alert Rules (Starter)

```yaml
groups:
  - name: antislot-api
    rules:
      - alert: AntiSlotApiNotReady
        expr: antislot_service_ready == 0
        for: 2m
        labels:
          severity: critical

      - alert: AntiSlotApiHigh5xx
        expr: increase(antislot_runtime_server_errors_total[5m]) > 20
        for: 2m
        labels:
          severity: critical

      - alert: AntiSlotApiOpenAiCircuitOpen
        expr: antislot_openai_circuit_state{state="open"} == 1
        for: 3m
        labels:
          severity: warning

      - alert: AntiSlotApiCoreBackendDown
        expr: antislot_core_backend_up == 0
        for: 2m
        labels:
          severity: critical
```

## 4. Operational Alert Delivery

Server can push immediate critical/warning alerts to an external webhook (Slack/PagerDuty bridge, etc.).

Environment variables:

- `ALERT_WEBHOOK_URL` (recommended in production)
- `ALERT_WEBHOOK_BEARER_TOKEN` (optional)
- `ALERT_TIMEOUT_MS` (default `4000`)
- `ALERT_MIN_INTERVAL_MS` (default `300000`)

Current webhook-triggered events:

- Server bootstrap failure (`critical`)
- Unhandled server error middleware path (`critical`)
- OpenAI chat circuit opens (`warning`)

Alert delivery is rate-limited by fingerprint and never blocks request/response flow.

## 5. Crash/Telemetry Scope

- Mobile app: crash and diagnostics events are consent-gated via privacy preferences.
- Backend/server: crash exceptions are captured via Sentry when `SENTRY_DSN` is configured.
- Runtime health + latency + error-rate are exported from `/v1/metrics` for alert evaluation.

## 6. Load And Resilience Drills

- API load smoke: `npm run load:smoke --prefix server`
- Root shortcut: `npm run load:smoke:server`
- Backup/restore drill: `npm run backup:drill --prefix server`
- Root shortcut: `npm run backup:drill:server`

Environment variables for load smoke:

- `LOAD_SMOKE_BASE_URL` (required)
- `LOAD_SMOKE_API_AUTH_TOKEN` (optional)
- `LOAD_SMOKE_DURATION_SEC` (default `30`)
- `LOAD_SMOKE_CONCURRENCY` (default `8`)
- `LOAD_SMOKE_HEALTH_P95_MS` (default `800`)
- `LOAD_SMOKE_READY_P95_MS` (default `1200`)
- `LOAD_SMOKE_MAX_ERROR_RATE` (default `0.02`)

Environment variables for backup drill:

- `DATABASE_URL` (required)
- `BACKUP_DRILL_RESTORE_DB_URL` (optional, executes full restore)
- `BACKUP_DRILL_DIR` (optional, default `./data/backup-drill`)

## 7. Security Regression Gate

Security gate script compares current production dependency vulnerability counts to a baseline and fails on regressions.

- Run: `npm run security:gate`
- Update baseline intentionally: `npm run security:baseline:update`
- Baseline file: `docs/reports/security-baseline.json`

Gate policy:

- Critical vulnerabilities must not increase.
- High vulnerabilities must not increase.
- Moderate vulnerabilities must not increase.

This allows stable operation with known ecosystem findings while preventing silent security drift.
