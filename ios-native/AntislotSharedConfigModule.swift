import Foundation
import React
import SafariServices

/// React Native bridge module that writes SMS filter settings into the
/// shared App Group container, where the MessageFilterExtension reads them.
///
/// Bridged from JS as `NativeModules.SharedConfigModule`. The TS wrapper
/// lives at `react-native-bridge/SharedConfigModule.ts`.
@objc(SharedConfigModule)
final class AntislotSharedConfigModule: NSObject {

    private static let appGroup = "group.com.antislot.app"
    private static let smsSettingsFile = "sms_filter_settings.json"
    private static let safariRulesFile = "safari_blocker_rules.json"
    /// Must match the Safari Content Blocker extension's bundle identifier
    /// (set by the with-safari-content-blocker plugin).
    private static let safariContentBlockerBundleId = "com.antislot.app.ContentBlocker"

    @objc static func requiresMainQueueSetup() -> Bool { false }

    @objc
    func saveSmsSettings(
        _ enabled: Bool,
        strictMode: Bool,
        customKeywords: [String],
        autoDeleteDays: NSNumber,
        communityKeywords: [String],
        resolver resolve: @escaping RCTPromiseResolveBlock,
        rejecter reject: @escaping RCTPromiseRejectBlock
    ) {
        let payload: [String: Any] = [
            "enabled": enabled,
            "strictMode": strictMode,
            "customKeywords": customKeywords,
            "communityKeywords": communityKeywords,
            // autoDeleteDays kept for parity with the TS contract; extension
            // doesn't act on it today but the field stays so a future on-device
            // sweep job can pick it up.
            "autoDeleteDays": autoDeleteDays.intValue,
        ]

        guard let container = FileManager.default.containerURL(
            forSecurityApplicationGroupIdentifier: Self.appGroup
        ) else {
            reject("no_app_group", "App Group container unavailable: \(Self.appGroup)", nil)
            return
        }

        let url = container.appendingPathComponent(Self.smsSettingsFile)
        do {
            let data = try JSONSerialization.data(withJSONObject: payload, options: [])
            try data.write(to: url, options: [.atomic])
            resolve(true)
        } catch {
            reject("write_failed", "Could not write SMS settings: \(error.localizedDescription)", error)
        }
    }

    // The other SharedConfig methods (saveBlocklist, savePatterns, saveWhitelist)
    // are placeholders so the JS-side `react-native-bridge/SharedConfigModule.ts`
    // doesn't crash when it probes them. The DNS-blocker pipeline these were
    // meant to feed is not wired up on iOS in this build, so they accept the
    // payload and resolve without persisting.

    @objc
    func saveBlocklist(
        _ domains: [String],
        resolver resolve: @escaping RCTPromiseResolveBlock,
        rejecter reject: @escaping RCTPromiseRejectBlock
    ) {
        resolve(true)
    }

    /// Persist the Safari Content Blocker rule list (already serialized as
    /// JSON on the JS side) and ask Safari to reload it.
    ///
    /// `reloadContentBlocker` is async; we forward its error to JS so the UI
    /// can show "rules updated" only if Safari accepted them. The most
    /// common failure mode is "extension is disabled" — surfaced as a
    /// specific code so the UI can prompt the user to enable it in Settings.
    @objc
    func saveSafariContentBlockerRules(
        _ rulesJson: NSString,
        resolver resolve: @escaping RCTPromiseResolveBlock,
        rejecter reject: @escaping RCTPromiseRejectBlock
    ) {
        guard let container = FileManager.default.containerURL(
            forSecurityApplicationGroupIdentifier: Self.appGroup
        ) else {
            reject("no_app_group", "App Group container unavailable: \(Self.appGroup)", nil)
            return
        }

        let url = container.appendingPathComponent(Self.safariRulesFile)
        do {
            try (rulesJson as String).write(to: url, atomically: true, encoding: .utf8)
        } catch {
            reject("write_failed", "Could not write Safari rules: \(error.localizedDescription)", error)
            return
        }

        SFContentBlockerManager.reloadContentBlocker(
            withIdentifier: Self.safariContentBlockerBundleId
        ) { reloadError in
            if let reloadError = reloadError {
                // Common: extension disabled → user hasn't enabled it in
                // Settings yet. Resolve with `enabled:false` so UI can
                // distinguish from a hard failure.
                let nsError = reloadError as NSError
                if nsError.domain == "SFErrorDomain" {
                    resolve([
                        "wrote": true,
                        "reloaded": false,
                        "reason": "extension_not_enabled",
                        "code": nsError.code,
                    ])
                    return
                }
                reject("reload_failed", "Safari reload failed: \(reloadError.localizedDescription)", reloadError)
                return
            }
            resolve(["wrote": true, "reloaded": true])
        }
    }

    /// Check whether the user has enabled the Safari Content Blocker.
    @objc
    func getSafariContentBlockerStatus(
        _ resolve: @escaping RCTPromiseResolveBlock,
        rejecter reject: @escaping RCTPromiseRejectBlock
    ) {
        SFContentBlockerManager.getStateOfContentBlocker(
            withIdentifier: Self.safariContentBlockerBundleId
        ) { state, error in
            if let error = error {
                resolve(["enabled": false, "available": false, "error": error.localizedDescription])
                return
            }
            resolve([
                "enabled": state?.isEnabled ?? false,
                "available": true,
            ])
        }
    }

    @objc
    func savePatterns(
        _ patterns: [Any],
        resolver resolve: @escaping RCTPromiseResolveBlock,
        rejecter reject: @escaping RCTPromiseRejectBlock
    ) {
        resolve(true)
    }

    @objc
    func saveWhitelist(
        _ domains: [String],
        resolver resolve: @escaping RCTPromiseResolveBlock,
        rejecter reject: @escaping RCTPromiseRejectBlock
    ) {
        resolve(true)
    }
}
