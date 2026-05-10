# Real Device Release Validation

## iOS

- Install release candidate build on at least one physical iPhone.
- Validate onboarding, privacy page links, and crash-free launch.
- Confirm icon, splash, and legal links are correct.

## Android

- Install release candidate APK/AAB on at least one physical Android device.
- Validate notification permission flow and settings persistence.
- Confirm policy-safe permissions (no SMS receive/send permissions).

## Backend Connectivity

- Verify API base URL points to production endpoint.
- Validate chat endpoint response and timeout behavior.
