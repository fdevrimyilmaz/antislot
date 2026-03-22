# Security Notes

## Summary
- Client bundle no longer contains hardcoded signing secrets.
- Signing/HMAC verification is handled server-side via `POST /v1/verify-signature`.
- Public client configuration (API base URLs, Firebase public config, Sentry DSN) stays in `EXPO_PUBLIC_*`.

## Why EXPO_PUBLIC_* Cannot Contain Secrets
`EXPO_PUBLIC_*` values are bundled into the client app and are visible to anyone who inspects the build.
Secrets (HMAC keys, API tokens, private credentials) must stay server-side only.

## Current Server-Side Model
- Backend keeps `HMAC_SECRET` in server environment variables.
- Client sends `{ payload, signature }` to `POST /v1/verify-signature`.
- Verification result is boolean (`{ ok: true|false }`), and no signing secret is exposed.
- Client verification fallback is development-only; production flow fails closed.

## Changelog
- `backend/src/server.ts`: added `POST /v1/verify-signature` endpoint.
- `backend/src/utils/signature.ts`: hardened signature validation for malformed input.
- `server/src/index.ts`: added proxy route `POST /v1/verify-signature`.
- `store/blockerStore.ts`: production verification now fails closed when endpoint is unavailable.
- `README.md`: updated security notes to reflect active verification endpoint.
