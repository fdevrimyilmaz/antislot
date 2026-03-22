# EAS Headless Setup

Goal: run production builds non-interactively (CI/headless) without stdin prompts.

## Option A (Recommended): Remote Credentials on EAS
This avoids storing signing material in CI. You must do a one-time setup with a terminal that can accept prompts.

1) Android keystore (one-time, interactive):
- Run: `eas credentials -p android`
- Choose: Keystore -> Generate new (or upload existing)

2) iOS credentials (one-time, interactive):
- Run: `eas credentials -p ios`
- Let EAS create or upload distribution cert + provisioning profile
- If your app has extensions, configure each target bundle identifier (example in this repo: `com.antislot.app` and `com.antislot.app.smsfilter`)

3) Headless build (CI):
- Set `EXPO_TOKEN` in GitHub Actions secrets (or your CI) and optionally use `.github/workflows/release-mobile.yml` (trigger on release or manual).
- Run:
  - `eas build -p android --profile production --non-interactive --freeze-credentials`
  - `eas build -p ios --profile production --non-interactive --freeze-credentials`
- For crash/release monitoring: set `EXPO_PUBLIC_SENTRY_DSN` in EAS project secrets (`eas secret:push` or Expo dashboard).

4) Headless submit (after builds are successful):
- Android:
  - `eas submit -p android --profile production --latest --non-interactive --wait`
  - Repo shortcut:
    - `npm run release:submit:android:with-key`
- iOS:
  - `eas submit -p ios --profile production --latest --non-interactive --wait`

Submit prerequisites:
- Android: Google Play service account JSON must be configured in EAS Submit credentials.
- Android (repo-local alternative): write `./credentials/google-play-service-account.json` and keep it out of git.
  - `npm run release:prepare:play-key` accepts:
    - `GOOGLE_PLAY_SERVICE_ACCOUNT_JSON_B64` (recommended)
    - or `GOOGLE_PLAY_SERVICE_ACCOUNT_JSON`
- iOS: App Store Connect API key (or Apple auth flow) must be configured for submit.

Working tree requirement:
- `eas.json` currently uses `cli.requireCommit: true`, so builds require a clean git working tree.
- Temporary local override for diagnostics only: set `EAS_NO_VCS=1` before `eas build`.

If credentials are already configured, the builds will not prompt.

## Option B: Local Credentials (Fully Headless)
Use this if you must avoid any interactive Apple login on CI. Keep files out of git.

1) Generate Android keystore (example):
`keytool -genkeypair -v -keystore android-upload.jks -alias upload -keyalg RSA -keysize 2048 -validity 10000`

2) Create `credentials.json` locally (do NOT commit).
Example format:
```json
{
  "android": {
    "keystore": {
      "keystorePath": "./android-upload.jks",
      "keystorePassword": "change_me",
      "keyAlias": "upload",
      "keyPassword": "change_me"
    }
  },
  "ios": {
    "provisioningProfilePath": "./profiles/app.mobileprovision",
    "distributionCertificate": {
      "path": "./certs/dist.p12",
      "password": "change_me"
    }
  }
}
```

3) Set `credentialsSource: "local"` in the production profile (eas.json).
4) Run headless builds with `--non-interactive --freeze-credentials`.

Note: You still need Apple account access at least once to export the `dist.p12` and provisioning profile.
