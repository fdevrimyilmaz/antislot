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
    let prefs: [String: Any] = [
      "enabled": enabled,
      "strictMode": strictMode,
      "customKeywords": customKeywords,
      "autoDeleteDays": autoDeleteDays
    ]
    storage().set(prefs, forKey: "sms.settings")
    resolve(true)
  }

  @objc func cleanupSpamInboxNow(
    _ resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    resolve(0)
  }
}
