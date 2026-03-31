import Foundation
import React

@objc(SharedConfigModule)
class SharedConfigModule: NSObject, RCTBridgeModule {
  static func moduleName() -> String! {
    return "SharedConfigModule"
  }

  static func requiresMainQueueSetup() -> Bool {
    return false
  }

  private let appGroupId = "group.com.antislot.app"
  private let keySmsSettings = "sms.settings"
  private let keySmsEnabled = "sms.enabled"
  private let keySmsStrictMode = "sms.strictMode"
  private let keySmsKeywords = "sms.keywords"
  private let keySmsAutoDeleteDays = "sms.autoDeleteDays"
  private let keySmsBlockedCount = "sms.blockedCount"

  private func storage() -> UserDefaults {
    return UserDefaults(suiteName: appGroupId) ?? UserDefaults.standard
  }

  @objc func saveBlocklist(
    _ domains: [String],
    resolver resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    storage().set(domains, forKey: "blocker.blocklist")
    resolve(true)
  }

  @objc func savePatterns(
    _ patterns: NSArray,
    resolver resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    storage().set(patterns, forKey: "blocker.patterns")
    resolve(true)
  }

  @objc func saveWhitelist(
    _ domains: [String],
    resolver resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    storage().set(domains, forKey: "blocker.whitelist")
    resolve(true)
  }

  @objc func saveBlockerHardening(
    _ strictMode: Bool,
    blockDoh: Bool,
    blockDot: Bool,
    blockQuic: Bool,
    lockdownVpn: Bool,
    tamperAlerts: Bool,
    resolver resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    let settings: [String: Any] = [
      "strictMode": strictMode,
      "blockDoh": blockDoh,
      "blockDot": blockDot,
      "blockQuic": blockQuic,
      "lockdownVpn": lockdownVpn,
      "tamperAlerts": tamperAlerts
    ]
    storage().set(settings, forKey: "blocker.hardening")
    resolve(true)
  }

  @objc func saveSmsSettings(
    _ enabled: Bool,
    strictMode: Bool,
    customKeywords: [String],
    autoDeleteDays: NSNumber,
    resolver resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    let normalizedKeywords = customKeywords
      .map { $0.trimmingCharacters(in: .whitespacesAndNewlines).lowercased() }
      .filter { !$0.isEmpty }

    let prefs: [String: Any] = [
      "enabled": enabled,
      "strictMode": strictMode,
      "customKeywords": normalizedKeywords,
      "autoDeleteDays": autoDeleteDays
    ]
    let defaults = storage()
    defaults.set(prefs, forKey: keySmsSettings)
    defaults.set(enabled, forKey: keySmsEnabled)
    defaults.set(strictMode, forKey: keySmsStrictMode)
    defaults.set(normalizedKeywords, forKey: keySmsKeywords)
    if autoDeleteDays.intValue >= 0 {
      defaults.set(autoDeleteDays.intValue, forKey: keySmsAutoDeleteDays)
    } else {
      defaults.removeObject(forKey: keySmsAutoDeleteDays)
    }
    defaults.synchronize()
    resolve(true)
  }

  @objc func getSmsBlockedCount(
    _ resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    let blocked = storage().integer(forKey: keySmsBlockedCount)
    resolve(blocked)
  }

  @objc func resetSmsBlockedCount(
    _ resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    let defaults = storage()
    defaults.removeObject(forKey: keySmsBlockedCount)
    defaults.synchronize()
    resolve(true)
  }

  @objc func cleanupSpamInboxNow(
    _ resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    resolve(0)
  }
}
