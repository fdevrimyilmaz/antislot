# iOS Blocker Notes

## What Works Now
- `GamblingBlockerModule` now uses `NEDNSSettingsManager` for real DNS-based domain blocking.
- `startFilter/stopFilter/isFilterEnabled/status` are backed by live DNS settings state, not fake return values.
- `syncBlocklist` stores remote blocklist + patterns and reapplies DNS match domains when protection is active.
- Blocklist integration reads from App Group keys:
  - `blocker.blocklist`
  - `blocker.patterns`
  - `blocker.whitelist`

## iOS Blocking Model
- Blocking is implemented by applying blocked domains to DNS `matchDomains`.
- Blocked domains are routed to a sinkhole DNS server (`0.0.0.0`), so those domains fail DNS resolution.
- This is limited by iOS DNS behavior and can be bypassed by some hardcoded-IP or tunnel paths.

## Required Entitlements
- App target entitlement:
  - `com.apple.developer.networking.networkextension = ["dns-settings"]`
- App Group entitlement:
  - `com.apple.security.application-groups = ["group.com.antislot.app"]`

If Network Extension entitlement is not enabled in the Apple Developer App ID + provisioning profile, native calls may return `code: "not_authorized"`.

## Feature Flag
- `ENABLE_IOS_NE` lives in `app.json` under `ios.infoPlist`.
- Current value: `true`
- If disabled, iOS native blocker methods return `code: "unsupported"`.

## CHANGELOG
- `ios/Antislot/GamblingBlockerModule.swift`: replaced stub logic with live DNS settings manager flow.
- `ios/HelloWorld/GamblingBlockerModule.swift`: synced with the same implementation.
- `ios/Antislot/Antislot.entitlements`: added `dns-settings` Network Extension entitlement.
- `app.json`: added iOS entitlement for `dns-settings` and set `ENABLE_IOS_NE` to `true`.
- `ios/Antislot/Info.plist` and `ios/HelloWorld/Info.plist`: set `ENABLE_IOS_NE` to `true`.
