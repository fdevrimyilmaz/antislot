# Release Secret Matrix

This document defines the strict go-live secret gate used by `release-preflight`.

## Strict go-live gate

`npm run preflight:release` must pass in strict mode before production release.

- Local strict run: `RELEASE_PREFLIGHT_STRICT=true npm run preflight:release`
- CI strict run: `npm run preflight:release` (strict is automatic in GitHub Actions)
- Full go-live command: `npm run go-live:gate`

## Required secrets and env vars

### Mobile release
- `EXPO_TOKEN`
  - Where: GitHub Actions Secret
  - Used by: `.github/workflows/release-mobile.yml`, strict preflight on main
- `EXPO_PUBLIC_API_URL`
  - Where: EAS env + GitHub Actions Secret
  - Used by: mobile runtime and preflight

### Backend and server release
- `CORS_ALLOWLIST`
  - Where: server/backend env
  - Used by: runtime CORS policy and strict preflight
- `DATABASE_URL`
  - Where: server secret manager
  - Used by: server production persistence and strict preflight
- `IAP_WEBHOOK_SECRET`
  - Where: server secret manager
  - Used by: `/v1/iap/webhook` and strict preflight
- `ALERT_WEBHOOK_URL` (`https://` in strict mode)
  - Where: server env
  - Used by: operational alerts and strict preflight

## One-of groups (at least one must be set)

### Auth mode
- `API_AUTH_TOKEN`
- `FIREBASE_PROJECT_ID`

### IAP validation mode
- `IAP_VALIDATOR_URL`
- `IAP_IOS_SHARED_SECRET`
- `IAP_GOOGLE_SERVICE_ACCOUNT_JSON_B64`

### AI provider mode
- `OPENAI_API_KEY`
- `GEMINI_API_KEY`

## Optional but recommended

- `EXPO_PUBLIC_SENTRY_DSN` (mobile monitoring)
- `SENTRY_DSN` (server/backend monitoring)
- `ALERT_WEBHOOK_BEARER_TOKEN` (alert receiver auth)
- `ADMIN_PROXY_SHARED_SECRET`, `ADMIN_PROXY_ALLOWED_USERS`, `ADMIN_PROXY_ALLOWED_GROUPS` when `ADMIN_PROXY_AUTH_REQUIRED=true`

## CI enforcement

- Main CI (`.github/workflows/ci.yml`) runs strict release preflight on push to `main`/`master`.
- Mobile release workflow also runs release preflight before build.
