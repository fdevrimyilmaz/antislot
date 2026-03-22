# Android VPN Skeleton

## Overview
- `AntislotVpnService` is a minimal `VpnService` that starts/stops and shows a foreground notification.
- `GamblingBlockerModule.startVpn/stopVpn/status` are wired to the service.
- Status values: `running`, `stopped`, `error` (errors are surfaced via start/stop results; `status()` normalizes to running/stopped).
- `startVpn/stopVpn` return a structured result: `{ status, reason? }`.

## Result Format
- `status`: `running | stopped | error`
- `reason` (optional): `permission_denied`, `module_unavailable`, `start_failed`, `stop_failed`, `request_in_flight`, `activity_unavailable`

## How It Works
1. `startVpn()` checks VPN permission via `VpnService.prepare`.
2. If permission is required, it triggers the system prompt and resolves after the user responds.
3. If granted, it starts `AntislotVpnService` in the foreground.
4. If denied, it resolves `{ status: "stopped", reason: "permission_denied" }`.
5. Service establishes a minimal VPN session (routes only `10.0.0.0/8`) and updates status.

## Manifest
The service is registered with:
- `android.permission.BIND_VPN_SERVICE`
- `foregroundServiceType="vpn"`

Required app permissions:
- `android.permission.FOREGROUND_SERVICE`
- `android.permission.INTERNET`
- `android.permission.POST_NOTIFICATIONS` (for the VPN notification)

## How To Test
1. Build/run on Android (emulator or device).
2. Open **Diagnostics → Native Modules Test**.
3. Tap **Start** to trigger VPN permission prompt.
4. Accept permission.
5. Tap **Status** to confirm `running`.
6. Tap **Stop** to stop VPN and confirm `stopped`.

## CHANGELOG
- `android/app/src/main/java/com/antislot/GamblingBlockerModule.kt`: return structured results and handle permission denial cleanly.
- `react-native-bridge/GamblingBlockerModule.ts`: normalize structured native results for JS callers.
- `app/native-modules-test.tsx`: surface `status` + `reason` from start/stop calls.
- `app/blocker.tsx`: handle permission denied and module-unavailable states without crashing.
- `NATIVE_MODULES.md`: document the structured result shape and status semantics.

## Logs
Filter logcat by:
- `AntislotVpnService`
- `AntislotVpnModule`
