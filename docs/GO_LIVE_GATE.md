# Go-Live Gate

This gate is the minimum production release barrier.

## One-command gate

```bash
npm run go-live:gate
```

This command runs:

1. `npm run quality`
2. `npm run preflight:release`
3. `npm run preflight:prod-final`

## What must pass

1. Coverage-gated tests for app, backend, and server
2. Typecheck, lint, merge-marker check, i18n strict coverage
3. Strict release preflight for required secrets/env
4. Production-final policy and legal checks
5. Security gate baseline check

## IAP-only safety checks

The preflight now also enforces these release defaults in strict mode:

1. `EXPO_PUBLIC_PREMIUM_FREE_FOR_NOW=false`
2. `EXPO_PUBLIC_ENABLE_PREMIUM_CODE_ACTIVATION=false`
3. `ENABLE_PREMIUM_CODE_ACTIVATION=false` (server)

## CI enforcement

1. `.github/workflows/ci.yml` runs strict release preflight on push to `main`/`master`
2. `.github/workflows/release-mobile.yml` runs strict full preflight before EAS build
3. Optional: set `MAESTRO_CI_ENABLED=true` to enable CI job for `e2e:maestro:critical`

## Secret reference

Use `docs/RELEASE_SECRET_MATRIX.md` as the source of truth for required and optional release secrets.
