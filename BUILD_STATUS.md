# EAS Build Status (2026-03-14)

## Latest verified state
- Android production build is successful.
  - Build ID: `1a0e136a-7458-49c0-9684-037ff7c57880`
  - Artifact (`.aab`): `https://expo.dev/artifacts/eas/4dBgxfTyB32RBHpS3TXvMS.aab`
- iOS build list is empty (`eas build:list --platform ios`), so no TestFlight-ready `.ipa` exists yet.

## Commands used for verification
1. `npx eas-cli build:list --limit 8 --json --non-interactive`
2. `npx eas-cli build:list --platform ios --limit 5 --json --non-interactive`
3. `npm run preflight:store`
4. `npm run preflight:prod-final`
5. `npm run preflight:release`

## Gate status
- `preflight:store`: PASS
- `preflight:prod-final`: PASS
- `preflight:release`: PASS with local warnings (strict secrets not fully populated in local shell)

## Remaining blockers for store release
1. iOS credentials are not configured on EAS yet (one-time interactive setup required).
2. iOS has multiple targets and credentials must be configured for both bundle identifiers:
   - `com.antislot.app`
   - `com.antislot.app.smsfilter`
3. Play submission service account key still needs to be configured in EAS Submit credentials (if not already set in Expo project settings).
4. App Store Connect submission credentials (ASC API key or Apple session flow) must be configured before headless submit.
5. `eas.json` has `cli.requireCommit=true`; on a dirty working tree, non-interactive builds stop before remote build starts.

## Next execution steps
1. Configure iOS credentials once:
   - `npx eas-cli credentials:configure-build -p ios -e production`
   - Ensure provisioning profiles are created for both iOS targets above.
2. Build iOS non-interactive:
   - `npx eas-cli build -p ios --profile production --non-interactive --freeze-credentials`
   - If local tree is intentionally dirty for test runs only: set `EAS_NO_VCS=1` temporarily.
3. Submit Android latest build:
   - `npx eas-cli submit -p android --profile production --latest --non-interactive`
   - If key is not configured on Expo submit credentials:
     - `npm run release:submit:android:with-key` (uses `GOOGLE_PLAY_SERVICE_ACCOUNT_JSON_B64` or `GOOGLE_PLAY_SERVICE_ACCOUNT_JSON`)
4. Submit iOS latest build (after successful iOS build):
   - `npx eas-cli submit -p ios --profile production --latest --non-interactive`

For detailed credential setup options, see [EAS_HEADLESS_SETUP.md](./EAS_HEADLESS_SETUP.md).
