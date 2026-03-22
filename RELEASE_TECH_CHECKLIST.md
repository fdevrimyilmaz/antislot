# Release Tech Checklist

## Permissions Summary
- Android app.json permissions: `android.permission.FOREGROUND_SERVICE`, `android.permission.POST_NOTIFICATIONS`
- Android manifest permissions: `android.permission.FOREGROUND_SERVICE`, `android.permission.INTERNET`, `android.permission.POST_NOTIFICATIONS`
- Removed unused permissions: `READ_EXTERNAL_STORAGE`, `WRITE_EXTERNAL_STORAGE`, `SYSTEM_ALERT_WINDOW`, `VIBRATE`, `RECEIVE_BOOT_COMPLETED`
- SMS permissions: none found (`READ_SMS`, `RECEIVE_SMS`, `SEND_SMS` not present)

## Feature Flags Defaults
- `EXPO_PUBLIC_ENABLE_SMS_ROLE=false`
- `EXPO_PUBLIC_ENABLE_IAP=false`
- `EXPO_PUBLIC_ENABLE_NOTIFICATIONS=false`
- `ENABLE_IOS_NE=false` (Info.plist / app.json `ios.infoPlist`)

## iOS Safety Notes
- Start/Stop blocker returns structured `unsupported` / `not_authorized` results when entitlements are missing.
- App Groups storage uses `suiteName` with safe fallback to standard `UserDefaults`.
- No unhandled promise rejections expected for blocker flows.

## Versioning Scheme
- Use `npm run bump-version [--major|--minor|--patch]` before production builds (default: patch).
- Script updates:
  - `package.json` version (semver bump)
  - `app.json` `expo.version`
  - `app.json` `android.versionCode` (increment +1)
  - `app.json` `ios.buildNumber` (increment +1)
- EAS config uses `appVersionSource: "local"` to avoid drift.
- `app.json` has `runtimeVersion: { "policy": "appVersion" }` for OTA and Sentry release matching.

## Bundle / Package IDs
- iOS: `com.antislot.app` (`expo.ios.bundleIdentifier`)
- Android: `com.antislot.app` (`expo.android.package`)
- Single source of truth in `app.json`.

## EAS Build Results
- `eas build -p android --profile production --non-interactive --freeze-credentials`
  - Result: latest production Android build is successful.
  - Latest build id: `1a0e136a-7458-49c0-9684-037ff7c57880`
  - Artifact: `https://expo.dev/artifacts/eas/4dBgxfTyB32RBHpS3TXvMS.aab`
- `eas build -p ios --profile production --non-interactive --freeze-credentials`
  - Result: no iOS production build artifact yet (credentials setup still pending).
  - Note: one-time interactive `eas credentials:configure-build -p ios -e production` is required before headless iOS build.
  - Note: iOS credentials must be configured for both targets (`com.antislot.app`, `com.antislot.app.smsfilter`).

## Headless Build Setup
- See `EAS_HEADLESS_SETUP.md` for the one-time credentials setup and non-interactive build commands.
- Expected headless commands:
  - `eas build -p android --profile production --non-interactive --freeze-credentials`
  - `eas build -p ios --profile production --non-interactive --freeze-credentials`
- Working tree rule: with `eas.json` `cli.requireCommit=true`, run builds from a clean git state.
- Shortcut npm scripts:
  - `npm run release:build:android`
  - `npm run release:build:ios`
  - `npm run release:prepare:play-key`
  - `npm run release:submit:android`
  - `npm run release:submit:android:with-key`
  - `npm run release:submit:ios`

## CI Release Pipeline (reproducible build + artifact metadata)
- Workflow: `.github/workflows/release-mobile.yml`
- Triggers: GitHub Release published (tag `v*`) or manual `workflow_dispatch` (platform: all | android | ios).
- Build config: `eas.json` production profile uses per-platform images (`android.image`, `ios.image`) and `--freeze-credentials`.
- Version: On release, version can be synced from tag (e.g. `v1.0.1` â†’ `1.0.1` in app.json/package.json). Otherwise run `npm run bump-version` before tagging.
- Secrets: `EXPO_TOKEN` (required). For AI provider strict gate, set at least one of `OPENAI_API_KEY` or `GEMINI_API_KEY`. Sentry: set `EXPO_PUBLIC_SENTRY_DSN` in EAS project secrets for production builds (`eas secret:push`).
- Artifact signing: Build runs on EAS; artifact URLs are in the EAS dashboard. To attach checksums to a GitHub Release: download .ipa/.aab from EAS, run `sha256sum <file> > <file>.sha256`, upload the `.sha256` file to the release. Build metadata (version, versionCode, buildNumber) is exported in the workflow for downstream use.

## Known Limitations
- iOS Network Extension entitlements not enabled yet (expected `not_authorized` until Apple-side setup).
- IAP disabled by default and product lists may be empty until store setup.
- Notifications disabled by default; push token requires FCM/APNs credentials later.

## Crash Reporting & Release Monitoring (Sentry)
- Active: `@sentry/react-native` in app, `services/monitoring.ts` init with `release` and `dist` from app version + build number for release health.
- ErrorBoundary reports React errors via `Sentry.captureException` (when user allows crash reporting).
- Env: `EXPO_PUBLIC_SENTRY_DSN` (required for sends), `EXPO_PUBLIC_SENTRY_ENV` (development | staging | production). Set DSN in EAS secrets for production.
- Release format: `com.antislot.app@<version>`, dist: iOS buildNumber / Android versionCode.

## Release & Post-Release

- **Release checklist** (gÃ¼nlÃ¼k adÄ±mlar): `docs/OPERATIONAL_READINESS.md` Â§ 4
- **Post-release verification**: `docs/OPERATIONAL_READINESS.md` Â§ 5 â€” health, smoke testler, Sentry, manuel kritik akÄ±ÅŸlar

## Go / No-go Items
- Android:
  - Keystore configured on EAS (or local credentials in CI)
  - Non-interactive build completes with `--non-interactive`
- iOS:
  - Distribution cert + provisioning profile configured on EAS (or local credentials in CI)
  - Non-interactive build completes with `--non-interactive`
- Feature flags set as expected for release
- Sentry: `EXPO_PUBLIC_SENTRY_DSN` set in EAS production env for crash/release monitoring

## Release Preflight (new)
- Command: `npm run preflight:release`
- Purpose: Loads local env files and validates release env/secrets. Local runs warn; CI/strict mode fails on missing values.
- Validates:
  - Mobile: `EXPO_TOKEN` (strict), `EXPO_PUBLIC_API_URL` (`EXPO_PUBLIC_SENTRY_DSN` recommended)
  - AI provider key (at least one): `OPENAI_API_KEY` or `GEMINI_API_KEY`
  - `CORS_ALLOWLIST`, `DATABASE_URL`, `IAP_WEBHOOK_SECRET`
  - Auth configuration (`API_AUTH_TOKEN` or `FIREBASE_PROJECT_ID`)
  - If `ADMIN_PROXY_AUTH_REQUIRED=true`: `ADMIN_PROXY_SHARED_SECRET` and admin allowlist (`ADMIN_PROXY_ALLOWED_USERS` or `ADMIN_PROXY_ALLOWED_GROUPS`)
  - IAP validation configuration (`IAP_VALIDATOR_URL` or direct store credentials)
- Strict mode: `RELEASE_PREFLIGHT_STRICT=true npm run preflight:release`
- Secret ownership mapping: `docs/RELEASE_SECRET_MATRIX.md`

## Store + Final Production Checks (new)
- Store metadata/assets check: `npm run preflight:store`
- Final production integrity check: `npm run preflight:prod-final`
- Real device release runbook: `docs/REAL_DEVICE_RELEASE_VALIDATION.md`
- Release report template: `docs/reports/release-validation-template.md`
- Store metadata source: `store-metadata/`

## CHANGELOG
- `release-mobile.yml`: CI workflow for EAS Build on release/manual; version sync from tag, build metadata output; artifact checksum steps documented.
- `eas.json`: removed invalid top-level `build.production.image`; set platform images under `ios.image` and `android.image`.
- `app.json`: `runtimeVersion: { "policy": "appVersion" }` for OTA and Sentry.
- `services/monitoring.ts`: Sentry `release` and `dist` set from app version and iOS buildNumber/Android versionCode for release health.
- `components/ErrorBoundary.tsx`: `Sentry.captureException` in `componentDidCatch` for crash reporting.
- `android/app/src/main/AndroidManifest.xml`: removed unused permissions; kept only required VPN/notification/network permissions.
- `android/app/src/debug/AndroidManifest.xml`: removed unused SYSTEM_ALERT_WINDOW permission.
- `android/app/src/debugOptimized/AndroidManifest.xml`: removed unused SYSTEM_ALERT_WINDOW permission.
- `app.json`: removed `RECEIVE_BOOT_COMPLETED` from Android permissions.
- `eas.json`: set `appVersionSource: local`, removed autoIncrement, updated iOS resource class to `m-medium`, set credentials source to `remote`.
- `scripts/bump-version.js`: added deterministic version bump script for versionCode/buildNumber.
- `package.json`: added `bump-version` script entry.
- `EAS_HEADLESS_SETUP.md`: documented non-interactive credentials and build flow.
