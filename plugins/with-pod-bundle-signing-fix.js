/**
 * Disables code signing for CocoaPods resource bundle targets.
 *
 * Symptom on EAS Build (Xcode 14+):
 *   "Resource bundles are signed by default, which requires setting the
 *    development team for each resource bundle target."
 *
 * Cause: Xcode 14 turned on code signing for resource bundle targets
 *   (`PRODUCT_TYPE = com.apple.product-type.bundle`) by default. Pods
 *   that ship localized strings or similar resources land in such
 *   targets, but they don't actually need to be signed — only the host
 *   app does. EAS doesn't apply a team to those generated targets, so
 *   the build aborts.
 *
 * Fix: A `post_install` hook in the Podfile that flips
 *   `CODE_SIGNING_ALLOWED = NO` for every bundle target after CocoaPods
 *   generates the Pods project. This is the same workaround React Native
 *   community templates ship — we just inject it from a config plugin so
 *   it survives every `expo prebuild`.
 *
 * Idempotent: we look for a marker comment before injecting, so running
 * prebuild twice doesn't duplicate the block.
 */

const fs = require("fs");
const path = require("path");
const { withDangerousMod } = require("expo/config-plugins");

const MARKER = "# antislot:bundle-signing-fix";

const INJECTION_BODY = `
    ${MARKER}
    # Xcode 14+ requires a development team for resource bundle signing.
    # Pod-shipped resource bundles don't need signing — opt them out so
    # CI builds don't fail looking for a team that EAS never provides.
    installer.pods_project.targets.each do |target|
      if target.respond_to?(:product_type) && target.product_type == "com.apple.product-type.bundle"
        target.build_configurations.each do |bundle_config|
          bundle_config.build_settings['CODE_SIGNING_ALLOWED'] = 'NO'
          bundle_config.build_settings['CODE_SIGNING_REQUIRED'] = 'NO'
        end
      end
    end
`;

function inject(contents) {
  if (contents.includes(MARKER)) return contents;

  // Try to slip the fix into the existing post_install block — CocoaPods
  // only honors a single post_install closure, so appending a second one
  // would silently overwrite the upstream React Native hook.
  const openRegex = /post_install\s+do\s+\|installer\|\s*\n/;
  const match = contents.match(openRegex);
  if (match && match.index !== undefined) {
    const insertAt = match.index + match[0].length;
    return (
      contents.slice(0, insertAt) +
      INJECTION_BODY +
      "\n" +
      contents.slice(insertAt)
    );
  }

  // No existing block (rare — Expo's template always has one). Append
  // a fresh standalone post_install.
  return (
    contents +
    `\npost_install do |installer|\n${INJECTION_BODY}\nend\n`
  );
}

module.exports = function withPodBundleSigningFix(config) {
  return withDangerousMod(config, [
    "ios",
    (cfg) => {
      const podfilePath = path.join(cfg.modRequest.platformProjectRoot, "Podfile");
      if (!fs.existsSync(podfilePath)) {
        console.warn("[with-pod-bundle-signing-fix] Podfile not found — skipping");
        return cfg;
      }
      const original = fs.readFileSync(podfilePath, "utf8");
      const next = inject(original);
      if (next === original) {
        console.log("[with-pod-bundle-signing-fix] marker already present, no-op");
      } else {
        fs.writeFileSync(podfilePath, next);
        console.log("[with-pod-bundle-signing-fix] injected CODE_SIGNING_ALLOWED=NO into Podfile post_install");
      }
      return cfg;
    },
  ]);
};
