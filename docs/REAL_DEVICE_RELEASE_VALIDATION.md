# Real Device Release Validation

This runbook is required before App Store / Play production submission.

## Scope

- Minimum devices:
  - 1 iOS physical device (latest iOS minor)
  - 1 Android physical device (Android 13+)
- Build type:
  - Production profile build (`eas build --profile production`)

## Pre-Checks

1. Install the exact release candidate build.
2. Verify backend points to production API.
3. Ensure test account is ready for IAP sandbox.
4. Enable network and then repeat critical tests in offline mode where noted.

## Pass/Fail Test Set

1. App launch and onboarding
   - App opens without crash.
   - Onboarding finishes and routes to home.
2. SOS crisis flow (online + offline)
   - SOS screen opens.
   - Breathing / grounding fallback content is available offline.
3. Premium / IAP flow (online)
   - Premium screen loads plans.
   - Purchase attempt reaches store sheet.
   - Restore purchases returns deterministic response.
4. Telemetry and privacy controls
   - Telemetry defaults OFF on first install.
   - Enabling/disabling telemetry updates behavior without crash.
   - Crash reporting switch obeys telemetry gate.
5. Policy links
   - Privacy and Terms links open valid public URLs.
6. Blocker and sync
   - Blocker UI loads.
   - Sync button gives success/error feedback (no silent failure).
7. Diary stress and cloud sync
   - Diary screen opens, intro modal can be dismissed, save/edit works repeatedly.
   - Run `maestro test e2e/maestro/diary-stress-flow.yaml` on physical device.
   - On two devices with same account, conflicting same-day updates converge after sync.

## Required Evidence

- iOS screen recording for critical path (onboarding -> SOS -> Premium).
- Android screen recording for same path.
- Screenshot of privacy settings with telemetry OFF default.
- Screenshot of policy pages opened from app.
- Release validation report in `docs/reports/`.

## Exit Criteria

- No P0/P1 defects.
- No blocking IAP error.
- Offline SOS fallback works.
- Privacy toggles and policy links behave as expected.
