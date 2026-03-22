# Antislot

## Env Setup
- Copy `.env.example` to `.env.local` for mobile dev (file is git-ignored).
- Validate Firebase keys with `npm run check:firebase-env` (dev) or `npm run check:firebase-env:prod` (prod template).
- Copy `server/.env.example` to `server/.env` for backend dev.
- Use `.env.production.example` and `server/.env.production.example` as production templates.
- Dev (local):
  - Set `EXPO_PUBLIC_API_URL=http://localhost:3001`.
  - Set `EXPO_PUBLIC_WEBSITE_BASE_URL=https://antislot-legal.vercel.app` (or your custom legal domain).
  - `server` can proxy core endpoints from `backend` via `CORE_BACKEND_URL`.
  - Set Firebase public config (`EXPO_PUBLIC_FIREBASE_*`) to enable auth/community/progress.
  - Optional: set Sentry vars (`EXPO_PUBLIC_SENTRY_DSN`, `EXPO_PUBLIC_SENTRY_ENV`, etc.).
- Feature flags:
  - `EXPO_PUBLIC_ENABLE_IAP` (default: `false`)
  - `EXPO_PUBLIC_ENABLE_NOTIFICATIONS` (default: `false`)
- Production (EAS):
  - Configure the same `EXPO_PUBLIC_*` values in EAS environment variables.
  - Do not place secrets (HMAC keys, API tokens) in `EXPO_PUBLIC_*`; keep them server-side.
  - Mobile auth for API calls uses Firebase ID token (`Authorization: Bearer <idToken>`), not a public API token.
  - Server side requires: `IAP_WEBHOOK_SECRET`, strict `CORS_ALLOWLIST`, and auth config (`API_AUTH_TOKEN` or Firebase JWT validation).
  - Server/backend observability (recommended): `SENTRY_DSN`, optional `SENTRY_ENV`, `SENTRY_RELEASE`, sampling vars.
  - Operational alerting (recommended): `ALERT_WEBHOOK_URL`, optional `ALERT_WEBHOOK_BEARER_TOKEN`.
  - Real partner SMS delivery (optional): `ACCOUNTABILITY_SMS_ENABLED=true` with Twilio vars (`TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, and `TWILIO_MESSAGING_SERVICE_SID` or `TWILIO_FROM_NUMBER`).
  - Accountability abuse guard (recommended): configure `ACCOUNTABILITY_SMS_COOLDOWN_MS`, `ACCOUNTABILITY_SMS_DAILY_LIMIT`, `ACCOUNTABILITY_SMS_IDEMPOTENCY_WINDOW_MS`.
  - Metrics endpoint controls (recommended): `ENABLE_METRICS_ENDPOINT=true`, `METRICS_AUTH_TOKEN=<secret>`.
  - `ALLOW_DEV_RECEIPT_BYPASS` must be `false`.
  - `DATABASE_URL` is required in production for premium state persistence.
  - Prod setup (schema migrations):
    - `cd server && npm run migrate:premium:tables`
    - `cd server && npm run migrate:money-protection:tables`
    - `cd server && npm run verify:money-protection:tables`
  - If using JWT auth, set `FIREBASE_PROJECT_ID` (+ optional `FIREBASE_SERVICE_ACCOUNT_JSON_B64`) on backend/server.
  - Optional product mapping vars on server: `IAP_PRODUCT_MONTHLY`, `IAP_PRODUCT_YEARLY`, `IAP_PRODUCT_LIFETIME`.
  - Direct store validation vars:
    - iOS: `IAP_IOS_SHARED_SECRET`
    - Android: `IAP_ANDROID_PACKAGE_NAME`, `IAP_GOOGLE_SERVICE_ACCOUNT_JSON_B64`

## SMS Role Feature Flag
- Env var: `EXPO_PUBLIC_ENABLE_SMS_ROLE` (default: `false`)
- When `false`, SMS role module calls are disabled and SMS filter UI is hidden.
- Set to `true` and rebuild to enable SMS role flows.

## iOS SMS Filter
- iOS automatic filtering is provided by `AntislotMessageFilterExtension` (`IdentityLookup`).
- Build with native iOS project and open device settings:
  - `Settings` -> `Messages` -> `Unknown & Spam` -> enable `AntiSlot SMS Filter`.
- App and extension share settings via App Group: `group.com.antislot.app`.

## Security Notes
- Removed client-side secrets from `EXPO_PUBLIC_*` env vars.
- Blocklist/patterns signature verification is delegated to backend endpoint `POST /v1/verify-signature`.
- Client allows dev fallback when verification endpoint is unavailable; production fails closed for verification errors.
- Premium activation is server-authoritative: mobile sends store receipt, server validates and returns entitlement.
- Mobile premium routes (`/v1/premium/status|sync|activate|restore` and `/v1/iap/validate`) accept only Firebase user token; server binds user identity to JWT `uid` and does not trust `X-User-Id` alone.
- `API_AUTH_TOKEN` is reserved for server-to-server traffic and is restricted by `INTERNAL_API_IP_ALLOWLIST`.
- Core proxy and store-validator upstream calls are timeout-protected (`CORE_BACKEND_TIMEOUT_MS`, `IAP_STORE_TIMEOUT_MS`) and network errors are caught (no server crash).
- `POST /iap/validate` endpoint can be used (server-side auth required) to smoke-test receipt validation path.

Quick check (proxy upstream failure handling):
```bash
# Unreachable CORE_BACKEND_URL should return 502 with structured error body
CORE_BACKEND_URL=http://127.0.0.1:9 CORE_BACKEND_TIMEOUT_MS=200 cd server && npm run dev
curl -i http://localhost:3001/v1/blocklist
```
- CI smoke test for IAP validation (`server/scripts/iap-validate-smoke.mjs`) runs when these GitHub secrets are set:
  - `IAP_SMOKE_BASE_URL`
  - `IAP_SMOKE_API_AUTH_TOKEN`
  - `IAP_SMOKE_RECEIPT`
  - Optional: `IAP_SMOKE_USER_ID`, `IAP_SMOKE_PLATFORM`
- CI smoke test for JWT auth validation (`server/scripts/auth-validate-smoke.mjs`) runs when these GitHub secrets are set:
  - `AUTH_SMOKE_SERVER_BASE_URL`
  - `AUTH_SMOKE_ID_TOKEN`
  - Optional: `AUTH_SMOKE_BACKEND_BASE_URL`, `AUTH_SMOKE_USER_ID`

## Architecture
- Single-source architecture and service boundaries: `docs/ARCHITECTURE.md`
- Versioned API contract and shared auth/error model: `docs/API_CONTRACT_V1.md`
- Runtime observability and reliability controls: `docs/OBSERVABILITY_AND_RELIABILITY.md`

## Release Ops
- Store metadata: `store-metadata/`
- Release preflight (local warnings): `npm run preflight:release`
- Release preflight (CI-equivalent strict): `RELEASE_PREFLIGHT_STRICT=true npm run preflight:release`
- Store assets check: `npm run preflight:store`
- Final prod checks (IAP/telemetry/policy): `npm run preflight:prod-final`
- Full go-live gate (quality + strict preflight + prod-final): `npm run go-live:gate`
- Security regression gate: `npm run security:gate`
- Update vulnerability baseline intentionally: `npm run security:baseline:update`
- API load smoke: `npm run load:smoke:server`
- Backup/restore drill: `npm run backup:drill:server`
- Real device validation runbook: `docs/REAL_DEVICE_RELEASE_VALIDATION.md`
- Secret matrix and strict requirements: `docs/RELEASE_SECRET_MATRIX.md`
- Go-live gate details: `docs/GO_LIVE_GATE.md`

## Quality Gates
- Merge conflict marker check: `npm run check:conflicts`
- TypeScript typecheck: `npm run typecheck`
- Coverage-gated test pipeline (app + backend + server): `npm run quality`
- CI Maestro critical flows: enable repository variable `MAESTRO_CI_ENABLED=true` to run `npm run e2e:maestro:critical`
