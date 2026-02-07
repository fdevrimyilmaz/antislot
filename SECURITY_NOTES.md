# Security Notes

## Summary
- Client bundle no longer contains hardcoded signing secrets.
- Any signing/HMAC verification is explicitly delegated to the backend (placeholder endpoint).
- Public client configuration (API base URLs, Firebase public config, Sentry DSN) stays in `EXPO_PUBLIC_*`.

## Why EXPO_PUBLIC_* Cannot Contain Secrets
`EXPO_PUBLIC_*` values are bundled into the client app and are visible to anyone who inspects the build.
Secrets (HMAC keys, API tokens, private credentials) must stay server-side only.

## Follow‑Up (Server‑Side)
- Implement `POST /v1/verify-signature` to validate blocklist/patterns signatures server-side.
- Keep `HMAC_SECRET` and any signing material in backend environment variables only.

## CHANGELOG
- `lib/firebase.ts`: move Firebase config to `EXPO_PUBLIC_FIREBASE_*` and disable features safely when missing.
- `services/auth.ts`: guard anonymous auth when Firebase config is missing.
- `services/progress.ts`: return safe defaults when Firestore is unavailable.
- `lib/community.ts`: guard RTDB usage and avoid crashes when Firebase config is missing.
- `store/blockerStore.ts`: add server-side signature verification placeholder with safe fallback.
- `.env.example`: add public Firebase config placeholders and premium API URL.
- `README.md`: expanded env setup instructions and clarified secret handling.
