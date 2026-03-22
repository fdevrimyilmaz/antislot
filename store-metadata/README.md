# Store Metadata

This folder is the single source of truth for App Store Connect and Google Play listing content.

## Files

- `ios/app-store-listing.json`: iOS listing text and review notes.
- `android/play-store-listing.json`: Google Play listing text.
- `assets-manifest.json`: store asset inventory and manual screenshot status.

## Process

1. Update listing JSON files before each production submit.
2. (Optional) Generate branded placeholder assets with `powershell -NoProfile -ExecutionPolicy Bypass -File scripts/generate-store-brand-assets.ps1`.
3. Export screenshots from real release builds into `store-metadata/assets/...`.
4. Run checks:
   - `npm run preflight:store`
   - `npm run preflight:prod-final`
5. Submit only after both checks pass.

## Minimum Visual Assets

- Google Play phone screenshots: at least 2 files in `store-metadata/assets/android/phone/`
- Google Play feature graphic: `store-metadata/assets/android/feature-graphic.png` must be `1024x500`
- App Store iPhone screenshots: at least 1 file in `store-metadata/assets/ios/6.7/`
- If `app.json` has `expo.ios.supportsTablet=true`, add iPad screenshots under `store-metadata/assets/ios/ipad/`
