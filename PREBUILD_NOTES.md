# Prebuild Notes

## Summary
- Target: migrate Expo managed project toward bare-compatible state to enable native modules.
- Android/ and iOS/ directories are now present in repo root.

## What I ran
1. `npx expo prebuild --clean`
2. `npx expo prebuild --clean --template expo-template-bare-minimum`
3. `npx expo prebuild --clean --template ./node_modules/expo/template.tgz`
4. `npx expo prebuild --clean --platform android`
5. `npx expo prebuild --clean --platform ios`
6. `npx expo prebuild --no-install --platform android`

## Key failure (blocking `--clean`)
All `--clean` runs failed with:

```
AssertionError [ERR_ASSERTION]: [android.dangerous]: withAndroidDangerousBaseMod:
Project file "MainApplication" does not exist in android project for root
"C:\Users\dferh\OneDrive\Masaüstü\antislot"
```

This occurs in `node_modules/@expo/config-plugins/build/android/Paths.js`
while resolving `android/app/src/main/java/**/MainApplication.(java|kt)`.

## Workaround applied
Because `expo prebuild --clean` created an empty `android/` folder (no
`MainApplication`), I manually unpacked the Expo template and copied only:
- `package/android` → `android/`
- `package/ios` → `ios/`

Then I ran:

```
npx expo prebuild --no-install --platform android
```

That completed successfully and applied config plugins to Android.

## iOS limitation on Windows
`npx expo prebuild --clean --platform ios` exits on Windows with:

```
Skipping generating the iOS native project files. Run npx expo prebuild again
from macOS or Linux to generate the iOS project.
```

So the iOS folder is a template copy only and **not** fully configured by
prebuild yet. You’ll need to rerun prebuild on macOS to finalize iOS.

## Remaining blockers
1. `npx expo prebuild --clean` still fails with missing `MainApplication`.
2. `npx expo run:android` fails because Android SDK/adb is missing:
   - Default SDK path not found: `C:\Users\dferh\AppData\Local\Android\Sdk`
3. `npx expo run:ios` fails on Windows (macOS required).

