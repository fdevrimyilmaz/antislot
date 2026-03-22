# Native Modules

## GamblingBlockerModule
TS -> Native mappings (start/stop return a structured result):
- `startProtection()` -> Android `startVpn()` / iOS `startFilter()`
- `stopProtection()` -> Android `stopVpn()` / iOS `stopFilter()`
- `isProtectionEnabled()` -> Android `isVpnRunning()` / iOS `isFilterEnabled()`
- `syncBlocklist(apiUrl)` -> Android `syncBlocklist(apiUrl)` (iOS stub returns `true`)
- `status()` -> Android `status()` (iOS derived from `isFilterEnabled`)

Result shape (JS):
- `{ status: "running" | "stopped" | "error", reason?: string, message?: string }`

Behavior:
- Android: `startVpn/stopVpn` return status + reason (e.g., `permission_denied`); `status()` returns `running|stopped`.
- iOS: `startFilter/stopFilter` return `{ ok, code, message }` where `code` is `unsupported` or `not_authorized`; wrapper converts to `{ status: "error", reason: code, message }`.

## SharedConfigModule
TS -> Native mappings:
- `saveBlocklist(domains)` -> `saveBlocklist(domains)`
- `savePatterns(patterns)` -> `savePatterns(patterns)`
- `saveWhitelist(domains)` -> `saveWhitelist(domains)`
- `saveSmsSettings(enabled, strictMode, customKeywords, autoDeleteDays)` -> `saveSmsSettings(...)`
- `getSmsBlockedCount()` -> `getSmsBlockedCount()`
- `resetSmsBlockedCount()` -> `resetSmsBlockedCount()`

Behavior:
- Android: values are persisted into app-local shared config storage.
- iOS: values are persisted into App Group `UserDefaults`.

## SmsRoleModule
- Android native module is implemented (`isDefaultSmsApp`, `requestDefaultSmsRole`).
- iOS has no SMS role module.

## iOS SMS Filter Extension
- `AntislotMessageFilterExtension` uses `IdentityLookup` (`ILMessageFilterExtension`) to classify incoming SMS.
- Filter settings are shared via App Group `UserDefaults` (`group.com.antislot.app`).
- Enable from iOS Settings: `Messages` -> `Unknown & Spam` -> `AntiSlot SMS Filter`.

## Android SMS/MMS Receivers
- `SmsDeliverReceiver`: classifies incoming SMS with native keyword/signal rules, blocks spam, inserts allowed messages into inbox, and shows notification.
- `MmsDeliverReceiver`: currently fallback mode; shows user-visible notification that MMS is not automatically filtered.

## Quick Test
- Screen: `/native-modules-test` (shows live calls to both modules).
