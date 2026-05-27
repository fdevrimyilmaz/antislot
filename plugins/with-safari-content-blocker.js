/**
 * Wires the AntislotContentBlocker Safari extension into the iOS project
 * at prebuild time. Mirrors the structure of with-sms-filter-extension.js;
 * see that file for the general design rationale.
 *
 * Apple's Content Blocker contract:
 *   - The extension target has principal class `ContentBlockerRequestHandler`
 *     and NSExtensionPointIdentifier `com.apple.Safari.content-blocker`.
 *   - Rules are JSON; loaded from the App Group container at runtime,
 *     with `blockerList.json` bundled inside the extension as a fallback
 *     so the extension is valid before the first sync.
 *   - The main app calls `SFContentBlockerManager.reloadContentBlocker` to
 *     refresh the rule set; that's what
 *     `AntislotSharedConfigModule.saveSafariContentBlockerRules` does.
 *
 * Provisioning the user must do:
 *   - Apple Developer App ID `com.antislot.app.ContentBlocker` with the
 *     App Group `group.com.antislot.app`.
 *   - Provisioning profile including the extension.
 * Without these, `expo run:ios --device` fails code signing with a clear
 * message.
 */

const fs = require("fs");
const path = require("path");
const {
  withDangerousMod,
  withXcodeProject,
  withEntitlementsPlist,
} = require("expo/config-plugins");

const EXTENSION_NAME = "AntislotContentBlocker";
const EXTENSION_BUNDLE_SUFFIX = "ContentBlocker";
const APP_GROUP = "group.com.antislot.app";
const EXTENSION_SOURCE_DIR = path.join("ios-safari-extension");

const STATIC_SWIFT_FILES = ["ContentBlockerRequestHandler.swift"];
const STATIC_RESOURCE_FILES = ["blockerList.json"];

function destinationDir(config) {
  return path.join(config.modRequest.platformProjectRoot, EXTENSION_NAME);
}

function ensureExtensionFiles(config) {
  return withDangerousMod(config, [
    "ios",
    (cfg) => {
      const root = cfg.modRequest.projectRoot;
      const dest = destinationDir(cfg);
      fs.mkdirSync(dest, { recursive: true });

      for (const filename of [...STATIC_SWIFT_FILES, ...STATIC_RESOURCE_FILES]) {
        fs.copyFileSync(
          path.join(root, EXTENSION_SOURCE_DIR, filename),
          path.join(dest, filename)
        );
      }
      fs.copyFileSync(
        path.join(root, EXTENSION_SOURCE_DIR, "Info.plist"),
        path.join(dest, "Info.plist")
      );
      fs.copyFileSync(
        path.join(root, EXTENSION_SOURCE_DIR, `${EXTENSION_NAME}.entitlements`),
        path.join(dest, `${EXTENSION_NAME}.entitlements`)
      );

      return cfg;
    },
  ]);
}

function ensureAppGroup(config) {
  return withEntitlementsPlist(config, (cfg) => {
    const groups = cfg.modResults["com.apple.security.application-groups"] || [];
    if (!groups.includes(APP_GROUP)) {
      cfg.modResults["com.apple.security.application-groups"] = [
        ...groups,
        APP_GROUP,
      ];
    }
    return cfg;
  });
}

function addXcodeTarget(config) {
  return withXcodeProject(config, (cfg) => {
    const xcode = cfg.modResults;
    const bundleId = `${cfg.ios?.bundleIdentifier ?? "com.antislot.app"}.${EXTENSION_BUNDLE_SUFFIX}`;

    if (xcode.pbxTargetByName(EXTENSION_NAME)) {
      return cfg;
    }

    const target = xcode.addTarget(
      EXTENSION_NAME,
      "app_extension",
      EXTENSION_NAME,
      bundleId
    );

    xcode.addBuildPhase(STATIC_SWIFT_FILES, "PBXSourcesBuildPhase", "Sources", target.uuid);
    xcode.addBuildPhase(STATIC_RESOURCE_FILES, "PBXResourcesBuildPhase", "Resources", target.uuid);
    // No framework dependency; Safari Content Blocker doesn't link SafariServices.

    const groupKey = xcode.pbxCreateGroup(EXTENSION_NAME, EXTENSION_NAME);
    for (const filename of STATIC_SWIFT_FILES) {
      xcode.addFile(filename, groupKey, { target: target.uuid });
    }
    for (const filename of STATIC_RESOURCE_FILES) {
      xcode.addResourceFile(filename, { target: target.uuid }, groupKey);
    }
    xcode.addFile("Info.plist", groupKey, { target: target.uuid });

    const configurations = xcode.pbxXCBuildConfigurationSection();
    for (const key of Object.keys(configurations)) {
      const buildConfig = configurations[key];
      if (typeof buildConfig !== "object") continue;
      const settings = buildConfig.buildSettings;
      if (!settings) continue;
      if (settings.PRODUCT_NAME && String(settings.PRODUCT_NAME).includes(EXTENSION_NAME)) {
        settings.CODE_SIGN_ENTITLEMENTS = `${EXTENSION_NAME}/${EXTENSION_NAME}.entitlements`;
        settings.IPHONEOS_DEPLOYMENT_TARGET = "13.0";
        settings.SWIFT_VERSION = "5.0";
        settings.INFOPLIST_FILE = `${EXTENSION_NAME}/Info.plist`;
        settings.PRODUCT_BUNDLE_IDENTIFIER = bundleId;
        settings.MARKETING_VERSION = cfg.version ?? "1.0.0";
        settings.CURRENT_PROJECT_VERSION = String(cfg.ios?.buildNumber ?? "1");
      }
    }

    return cfg;
  });
}

module.exports = function withSafariContentBlocker(config) {
  config = ensureAppGroup(config);
  config = ensureExtensionFiles(config);
  config = addXcodeTarget(config);
  return config;
};
