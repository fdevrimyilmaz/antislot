# Architecture (Single Source)

## Source of truth
- `server` is the public API gateway and business authority for auth, premium, IAP lifecycle, and chat.
- `backend` is a core data service for blocklist/patterns and internal AI utility endpoints.
- Mobile clients must use a single base URL (`EXPO_PUBLIC_API_URL`) that points to `server`.

## Why
- One public entrypoint avoids dual-base-url drift.
- Auth/rate-limit/security policy is enforced in one place.
- API versioning and error contract can evolve without breaking mobile.

## Routing model
- Public API: `server` on `/v1/*` (also backward-compatible non-versioned aliases).
- Core proxy paths on `server`:
  - `/v1/blocklist` -> `backend /v1/blocklist`
  - `/v1/patterns` -> `backend /v1/patterns`

## Premium durability
- Premium state is persisted to **Postgres** (when `DATABASE_URL` is set) or `PREMIUM_DATA_FILE` (JSON + atomic write) as fallback.
- In production either `DATABASE_URL` or `PREMIUM_DATA_FILE` must be set.
- Lifecycle updates are applied by `/v1/iap/webhook` (renewal/cancel/refund/grace/expire).

