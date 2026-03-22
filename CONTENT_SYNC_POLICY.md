# Content Sync Policy (Blocklist / Patterns)

## Update Model
- Client fetches:
  - `GET /v1/blocklist`
  - `GET /v1/patterns`
- Signature verification is required via `POST /v1/verify-signature`.
- Update applies only when remote version is newer than stored version.

## Compatibility
- Content schema is versioned (`schemaVersion`).
- Client supports `CONTENT_SCHEMA_VERSION = 1`.
- If server schema is higher than supported, sync is rejected (`compatibility` stage).

## Rollback
- Before write, client stores a sync backup snapshot:
  - domains, patterns, whitelist, last sync timestamp, versions.
- If any write step fails, client restores backup and emits `blocklist_rollback_applied`.
- Backup is cleared after a successful commit.

## Safety Requirements
- HTTPS required in production.
- Non-local HTTP only allowed in development/local emulator scenarios.
- On sync failure, existing working rules remain active.

