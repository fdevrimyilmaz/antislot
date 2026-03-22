# Analytics Measurement Plan (Privacy-First)

## Principles
- Default-off telemetry unless user enables diagnostics (`shareDiagnostics`).
- No PII, no message content, no full URLs/domains.
- Event payloads are schema-versioned and minimal.

## Event Schema
- Common fields: `name`, `ts`, `eventVersion`, `sessionId`.
- Event model source: `services/analytics.ts`.

## Tracked Events
- `crisis_screen_viewed`: protocol version exposure.
- `crisis_call_tapped`, `crisis_sms_tapped`: referral action intent.
- `crisis_continue_tapped`, `crisis_breathing_tapped`: crisis flow choices.
- `breathing_started`, `breathing_completed`: intervention completion funnel.
- `blocklist_sync_started`, `blocklist_sync_succeeded`, `blocklist_sync_failed`.
- `blocklist_rollback_applied`: update safety fallback activated.

## Metrics
- Crisis support conversion:
  - `crisis_call_tapped / crisis_screen_viewed`
  - `crisis_breathing_tapped / crisis_screen_viewed`
- Intervention completion:
  - `breathing_completed / breathing_started`
- Content update reliability:
  - `blocklist_sync_succeeded / blocklist_sync_started`
  - rollback rate: `blocklist_rollback_applied / blocklist_sync_started`

## Data Path
- Runtime emission: `trackEvent(...)` in `services/analytics.ts`.
- Transport: Sentry breadcrumb channel only when diagnostics is enabled.
- Local debug buffer: in-memory circular buffer (last 100 events), no persistent profile.

