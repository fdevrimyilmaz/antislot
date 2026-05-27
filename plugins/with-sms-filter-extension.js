/**
 * Wires the AntislotMessageFilterExtension target into the iOS project at
 * prebuild time. This is the one and only place the extension becomes a
 * real build product; without this plugin running, `ios/` rebuilds will
 * drop the extension on the floor.
 *
 * Responsibilities:
 *   1. Generate `SpamLexicons.swift` from the TS keyword/pattern source so
 *      the extension and the in-app classifier share one truth.
 *   2. Copy the static Swift sources + Info.plist + .entitlements into
 *      `ios/AntislotMessageFilterExtension/`.
 *   3. Use `xcode` (via @expo/config-plugins) to create the extension
 *      target, link IdentityLookup, and add it to the host app's "Embed
 *      App Extensions" build phase.
 *   4. Make sure the main app's entitlements include the App Group the
 *      extension reads its settings from (app.json already lists the group,
 *      this is belt-and-suspenders for the generated entitlements file).
 *
 * Provisioning is on the user: the extension bundle ID
 * `com.antislot.app.MessageFilter` must be registered as an App ID in the
 * Apple Developer portal and granted the Messages Filtering capability and
 * App Group entitlement. Without that, `expo run:ios --device` will fail
 * code signing with a clear message.
 */

const fs = require("fs");
const path = require("path");
const {
  withDangerousMod,
  withXcodeProject,
  withEntitlementsPlist,
} = require("expo/config-plugins");

const EXTENSION_NAME = "AntislotMessageFilterExtension";
const EXTENSION_BUNDLE_SUFFIX = "MessageFilter";
const APP_GROUP = "group.com.antislot.app";
const EXTENSION_SOURCE_DIR = path.join("ios-extension");
const NATIVE_MODULE_SOURCE_DIR = path.join("ios-native");

const STATIC_SWIFT_FILES = [
  "MessageFilterExtension.swift",
  "SpamClassifier.swift",
  "SettingsLoader.swift",
];

const NATIVE_MODULE_FILES = [
  "AntislotSharedConfigModule.swift",
  "AntislotSharedConfigModule.m",
];

function projectRoot(config) {
  return config.modRequest.projectRoot;
}

function destinationDir(config) {
  return path.join(config.modRequest.platformProjectRoot, EXTENSION_NAME);
}

function swiftStringArray(label, items) {
  if (!items.length) return `    static let ${label}: [String] = []`;
  const lines = items.map((kw) => `        ${quoteSwift(kw)}`).join(",\n");
  return `    static let ${label}: [String] = [\n${lines}\n    ]`;
}

function quoteSwift(value) {
  return `"${String(value).replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
}

function swiftPatternArray(patterns) {
  if (!patterns.length) return "    static let patterns: [SpamPattern] = []";
  const lines = patterns
    .map((p) => {
      const cat = `SpamPatternCategory.${p.category === "advertisement" ? "advertisement" : p.category}`;
      return `        SpamPattern(regex: ${quoteSwift(p.regex)}, category: ${cat})`;
    })
    .join(",\n");
  return `    static let patterns: [SpamPattern] = [\n${lines}\n    ]`;
}

/**
 * Load a TS module's runtime exports at plugin time.
 *
 * The keyword/pattern source lives in `services/sms-filter/*.ts`. We need
 * its values, not its types — so we transpile with the `typescript`
 * compiler that already ships as a devDependency, then evaluate the
 * resulting CommonJS in a fresh module scope.
 *
 * This was previously a regex-strip hack that pretended TS = JS minus
 * `export`. That broke the moment a file added a type annotation
 * (`: string[]`) because Node's Function parser is vanilla JS and chokes
 * on the colon. The TS-compiler path handles annotations, interfaces, and
 * `import type` cleanly.
 */
function loadTsExports(filePath) {
  const ts = require("typescript");
  const source = fs.readFileSync(filePath, "utf8");
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
      esModuleInterop: true,
      // Don't emit __esModule markers we'd just have to ignore, and don't
      // type-check — type errors aren't load-bearing for runtime data.
      isolatedModules: true,
    },
    fileName: filePath,
  });
  const moduleObj = { exports: {} };
  const factory = new Function(
    "module",
    "exports",
    "require",
    `${outputText}\nreturn module.exports;`
  );
  return factory(moduleObj, moduleObj.exports, require);
}

function generateLexiconsSwift(root) {
  const keywords = loadTsExports(path.join(root, "services/sms-filter/keywords.ts"));
  const patterns = loadTsExports(path.join(root, "services/sms-filter/patterns.ts"));
  const exports = { ...keywords, ...patterns };

  const lexBody = [
    swiftStringArray("gambling", [
      ...exports.GAMBLING_KEYWORDS.turkish,
      ...exports.GAMBLING_KEYWORDS.english,
    ]),
    swiftStringArray("scam", [
      ...exports.SCAM_KEYWORDS.turkish,
      ...exports.SCAM_KEYWORDS.english,
    ]),
    swiftStringArray("political", [
      ...exports.POLITICAL_KEYWORDS.turkish,
      ...exports.POLITICAL_KEYWORDS.english,
    ]),
    swiftStringArray("promotion", [
      ...exports.PROMOTION_KEYWORDS.turkish,
      ...exports.PROMOTION_KEYWORDS.english,
    ]),
    swiftStringArray("transaction", [
      ...exports.TRANSACTION_KEYWORDS.turkish,
      ...exports.TRANSACTION_KEYWORDS.english,
    ]),
    swiftPatternArray(
      (exports.SPAM_PATTERNS || []).map((p) => ({
        regex: p.regex.source,
        category: p.category,
      }))
    ),
  ].join("\n\n");

  return `// AUTO-GENERATED — regenerated by plugins/with-sms-filter-extension.js on every prebuild.
// Edit services/sms-filter/keywords.ts and services/sms-filter/patterns.ts, not this file.

import Foundation

enum SpamPatternCategory {
    case gambling
    case scam
    case advertisement
}

struct SpamPattern {
    let regex: String
    let category: SpamPatternCategory
}

enum SpamLexicons {
${lexBody}
}
`;
}

function ensureExtensionFiles(config) {
  return withDangerousMod(config, [
    "ios",
    (cfg) => {
      const root = projectRoot(cfg);
      const dest = destinationDir(cfg);
      fs.mkdirSync(dest, { recursive: true });

      for (const filename of STATIC_SWIFT_FILES) {
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

      // Generate the lexicon module fresh from TS source.
      const lex = generateLexiconsSwift(root);
      fs.writeFileSync(path.join(dest, "SpamLexicons.swift"), lex);

      // Drop the native SharedConfigModule into the main app target so the
      // JS bridge can actually persist settings to the App Group.
      const mainTargetDir = path.join(
        cfg.modRequest.platformProjectRoot,
        cfg.modRequest.projectName
      );
      if (fs.existsSync(mainTargetDir)) {
        for (const filename of NATIVE_MODULE_FILES) {
          fs.copyFileSync(
            path.join(root, NATIVE_MODULE_SOURCE_DIR, filename),
            path.join(mainTargetDir, filename)
          );
        }
      }

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

    xcode.addBuildPhase(
      [...STATIC_SWIFT_FILES, "SpamLexicons.swift"],
      "PBXSourcesBuildPhase",
      "Sources",
      target.uuid
    );
    xcode.addBuildPhase([], "PBXResourcesBuildPhase", "Resources", target.uuid);
    xcode.addBuildPhase(
      ["IdentityLookup.framework"],
      "PBXFrameworksBuildPhase",
      "Frameworks",
      target.uuid
    );

    // Add files into the project at the extension group.
    const groupKey = xcode.pbxCreateGroup(EXTENSION_NAME, EXTENSION_NAME);
    for (const filename of [...STATIC_SWIFT_FILES, "SpamLexicons.swift"]) {
      xcode.addFile(filename, groupKey, { target: target.uuid });
    }
    xcode.addFile("Info.plist", groupKey, { target: target.uuid });

    // Patch build settings on every config of the extension target so the
    // extension uses the App Group entitlements and the correct deployment
    // target. Without these the extension would silently fall back to the
    // default app deployment target and an unsigned entitlements file.
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
        settings.CURRENT_PROJECT_VERSION = String(
          cfg.ios?.buildNumber ?? "1"
        );
      }
    }

    return cfg;
  });
}

function addNativeModuleToMainTarget(config) {
  return withXcodeProject(config, (cfg) => {
    const xcode = cfg.modResults;
    const mainGroupName = cfg.modRequest.projectName;
    const mainGroup = xcode.pbxGroupByName(mainGroupName);
    if (!mainGroup) return cfg;

    // Look up the main app target via its product name.
    const nativeTargets = xcode.pbxNativeTargetSection();
    let mainTargetUuid = null;
    for (const key of Object.keys(nativeTargets)) {
      const t = nativeTargets[key];
      if (typeof t !== "object") continue;
      if (t.productType === '"com.apple.product-type.application"' ||
          t.productType === "com.apple.product-type.application") {
        mainTargetUuid = key;
        break;
      }
    }
    if (!mainTargetUuid) return cfg;

    // Add Swift + ObjC files to the main app target's Sources phase.
    // Skip if they're already there from a previous prebuild.
    for (const filename of NATIVE_MODULE_FILES) {
      const exists = (mainGroup.children || []).some((c) => c.comment === filename);
      if (exists) continue;
      xcode.addSourceFile(
        filename,
        { target: mainTargetUuid },
        xcode.findPBXGroupKey({ name: mainGroupName })
      );
    }

    return cfg;
  });
}

module.exports = function withSmsFilterExtension(config) {
  config = ensureAppGroup(config);
  config = ensureExtensionFiles(config);
  config = addXcodeTarget(config);
  config = addNativeModuleToMainTarget(config);
  return config;
};
