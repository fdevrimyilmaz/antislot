# Play Release 30-Minute Checklist

Use this checklist right before publishing Android on Google Play.
Target total time: ~30 minutes.

## 0-2 min: Clean and version

1. Confirm clean git state (required by EAS config):
   - `git status --short`
   - Must return empty.
2. Bump app version and build numbers:
   - `npm run bump-version -- --patch`
3. Re-check app version values:
   - `node -p "require('./package.json').version"`
   - `node -p "require('./app.json').expo.android.versionCode"`

## 2-10 min: Hard release gates

1. Store assets + listing checks:
   - `npm run preflight:store`
2. Mobile release preflight in strict mode:
   - PowerShell:
     - `$env:RELEASE_PREFLIGHT_STRICT='true'; npm run preflight:release:mobile`
3. Full strict preflight (CI parity):
   - PowerShell:
     - `$env:RELEASE_PREFLIGHT_STRICT='true'; npm run preflight:release`
4. Final production checks:
   - `npm run preflight:prod-final`

Pass condition:
- No `FAIL` lines.
- `EXPO_TOKEN` present.
- Required release secrets present.

## 10-15 min: Ensure submit credentials

1. Prepare Play service account key file:
   - `npm run release:prepare:play-key`
2. Expected output:
   - `Wrote .../credentials/google-play-service-account.json`
3. If missing, set one of:
   - `GOOGLE_PLAY_SERVICE_ACCOUNT_JSON_B64` (recommended)
   - `GOOGLE_PLAY_SERVICE_ACCOUNT_JSON`

## 15-20 min: Build + upload to Play internal

1. Build Android AAB:
   - `npm run release:build:android`
2. Submit latest build to Play internal track:
   - `npm run release:submit:android`
3. Verify EAS build succeeded and artifact exists in EAS dashboard.

## 20-27 min: Play Console policy declarations

Open Play Console and verify these are complete and current:

1. App content declarations:
   - Foreground service declaration (Android 14+)
   - VpnService declaration (app uses VPN service)
2. Data Safety form:
   - Matches real app behavior and privacy policy.
3. Privacy policy URL:
   - Public, reachable, non-PDF.
4. Target audience/content rating:
   - Correct for your app audience.
5. If developer account is personal and created after 2023-11-13:
   - Closed test requirement met (12 opted-in testers, 14 continuous days)
   - Production access approved.

## 27-30 min: Go/No-Go and rollout

1. Confirm release candidate details in Play internal track:
   - Correct `versionCode`
   - No new policy warnings
2. Promote internal -> closed/open/production as planned.
3. Record release notes and EAS build link.

## Fast fail list (do not publish if any true)

- `git status --short` is not clean.
- Strict preflight has any `FAIL`.
- Service account key for submit is missing.
- Play declarations (FGS/VPN/Data Safety) are incomplete.
- Closed-testing production-access requirement not yet satisfied.

## Useful commands (copy/paste)

```powershell
git status --short
npm run bump-version -- --patch
npm run preflight:store
$env:RELEASE_PREFLIGHT_STRICT='true'; npm run preflight:release:mobile
$env:RELEASE_PREFLIGHT_STRICT='true'; npm run preflight:release
npm run preflight:prod-final
npm run release:prepare:play-key
npm run release:build:android
npm run release:submit:android
```
