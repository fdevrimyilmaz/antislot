# iOS Blocker Notes

## What Works Now
- The iOS app compiles and runs with stubbed Network Extension behavior.
- `GamblingBlockerModule.startFilter/stopFilter` return a structured `{ ok, code, message }` result and never crash.
- `SharedConfigModule` writes to App Group UserDefaults when available, otherwise falls back to standard UserDefaults.

## What Still Requires Apple Entitlements
- DNS proxy / Network Extension activation.
- Message filter activation.
- Any real start/stop implementation of the Network Extension.

If those entitlements are not enabled for the App ID, the module returns `code: "not_authorized"` and a safe message.

## Feature Flag
- `ENABLE_IOS_NE` lives in `app.json` under `ios.infoPlist`.
- Default: `false`
- To enable: set `"ENABLE_IOS_NE": true` in `app.json`, rebuild the iOS app, and ensure Apple entitlements are enabled.
- If you are not re-running prebuild, keep `ios/HelloWorld/Info.plist` in sync with the same flag.

## CHANGELOG
- `app.json`: add `ENABLE_IOS_NE` flag to Info.plist.
- `ios/HelloWorld/GamblingBlockerModule.swift`: return structured results and guard all NE calls.
- `ios/HelloWorld/SharedConfigModule.swift`: write to App Group UserDefaults with safe fallback.
- `react-native-bridge/GamblingBlockerModule.ts`: normalize iOS structured results for JS callers.
- `app/blocker.tsx`: show user-friendly messages for unsupported/not-authorized states.
- `app/native-modules-test.tsx`: show result `message` in debug output.
- `NATIVE_MODULES.md`: document structured result shape and iOS behavior.
