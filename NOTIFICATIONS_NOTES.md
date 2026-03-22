# Notifications Notes

## Current Behavior
- Notifications are gated by `EXPO_PUBLIC_ENABLE_NOTIFICATIONS` (default: `false`).
- Permission flow is centralized and safe:
  - Check permissions
  - Request if needed
  - Gracefully handle denial
- Token acquisition is safe and returns structured results:
  - `no_token`
  - `permission_denied`
  - `not_supported`
  - `error`

## Android Channel
- Channel id: `default`
- Created idempotently via `setNotificationChannelAsync`

## Runtime Fallbacks
- If permission denied: returns `permission_denied` and UI shows a hint.
- If token cannot be obtained (missing credentials/projectId): returns `no_token`.
- Failures never block app startup.

## Later Setup (Push Credentials)
- Configure FCM/APNs credentials in EAS or respective consoles.
- Ensure `projectId` is available for `getExpoPushTokenAsync`.

## CHANGELOG
- `services/notifications.ts`: centralized notification handling with safe permission + token flows.
- `app/diagnostics.tsx`: show notification permission/token status and a settings hint.
- `constants/featureFlags.ts`: add `ENABLE_NOTIFICATIONS`.
- `.env.example`: add `EXPO_PUBLIC_ENABLE_NOTIFICATIONS`.
- `README.md`: document notifications env flag.
