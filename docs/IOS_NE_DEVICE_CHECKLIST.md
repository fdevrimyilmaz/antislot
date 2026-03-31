# iOS Network Extension Device Checklist

Date baseline: 2026-03-29

## 1) Apple Capability + Signing

- Apple Developer > App ID (`com.antislot.app`) must include Network Extension capability.
- Entitlement value must allow `dns-settings`.
- Regenerate provisioning profiles after capability change.
- Confirm app target uses:
  - `com.apple.developer.networking.networkextension = ["dns-settings"]`
  - `com.apple.security.application-groups = ["group.com.antislot.app"]`

## 2) Local Preflight Commands

Run from repo root:

```bash
npm ci
npx expo prebuild --platform ios
```

Then install pods:

```bash
cd ios
pod install
cd ..
```

## 3) Real Device Run (Xcode)

- Open `ios/HelloWorld.xcodeproj`.
- Select `Antislot` target and a physical iPhone.
- Build + Run (Release preferred for realistic entitlement/signing behavior).
- Go to app screen: `Diagnostics -> Native Modules Test`.
- Tap `iOS Self-Check` and verify:
  - `featureEnabled=true`
  - `managerLoaded=true`
  - `supported=true`

## 4) Blocker Functional Validation

1. Open blocker screen, run `Sync Now`.
2. Enable protection.
3. Confirm status becomes running.
4. Try a known blocked domain on Safari.
5. Add domain to allowlist and verify unblock behavior.
6. Disable protection and verify status returns stopped.

Expected diagnostics while active:

- `managerEnabled=true`
- `managerRunning=true`
- `managerMatchDomainsCount > 0`

## 5) EAS Build + Submit

```bash
npx eas build --platform ios --profile production
npx eas submit --platform ios --latest
```

## 6) Failure Triage

- If `manager_load_failed` or `not_authorized`:
  - Check App ID capability, entitlement values, and provisioning profile.
- If running but no blocking:
  - Verify blocklist sync completed and `managerMatchDomainsCount` is non-zero.
  - Verify tested domain is actually in blocklist and not allowlisted.
