import Foundation
import React
import NetworkExtension

@objc(GamblingBlockerModule)
class GamblingBlockerModule: NSObject {

  private let featureFlagKey = "ENABLE_IOS_NE"
  private let appGroupId = "group.com.antislot.app"
  private let nativeStatusKey = "blocker.nativeStatus"
  private let nativeApiUrlKey = "blocker.nativeApiUrl"
  private let nativeLastSyncMsKey = "blocker.nativeLastSyncMs"
  private let blocklistStorageKey = "blocker.blocklist"
  private let patternsStorageKey = "blocker.patterns"
  private let whitelistStorageKey = "blocker.whitelist"
  private let sinkholeDnsServers = ["0.0.0.0"]
  private let maxMatchDomains = 1000
  private let localHttpHosts: Set<String> = ["localhost", "127.0.0.1", "10.0.2.2", "10.0.3.2"]

  private func storage() -> UserDefaults {
    return UserDefaults(suiteName: appGroupId) ?? UserDefaults.standard
  }

  private func isFeatureEnabled() -> Bool {
    if let value = Bundle.main.object(forInfoDictionaryKey: featureFlagKey) as? Bool {
      return value
    }
    if let value = Bundle.main.object(forInfoDictionaryKey: featureFlagKey) as? String {
      let normalized = value.trimmingCharacters(in: .whitespacesAndNewlines).lowercased()
      return normalized == "true" || normalized == "1" || normalized == "yes"
    }
    return true
  }

  private func resolveResult(
    _ resolve: @escaping RCTPromiseResolveBlock,
    ok: Bool,
    code: String,
    message: String
  ) {
    resolve([
      "ok": ok,
      "code": code,
      "message": message,
    ])
  }

  private func resolveUnsupported(_ resolve: @escaping RCTPromiseResolveBlock, message: String) {
    resolveResult(resolve, ok: false, code: "unsupported", message: message)
  }

  private func resolveNotAuthorized(_ resolve: @escaping RCTPromiseResolveBlock, message: String) {
    resolveResult(resolve, ok: false, code: "not_authorized", message: message)
  }

  private func setNativeStatus(_ status: String) {
    storage().set(status, forKey: nativeStatusKey)
  }

  private func normalizeApiUrl(_ value: String) -> String? {
    let trimmed = value.trimmingCharacters(in: .whitespacesAndNewlines)
    if trimmed.isEmpty {
      return nil
    }

    let lower = trimmed.lowercased()
    let withScheme: String
    if lower.hasPrefix("http://") || lower.hasPrefix("https://") {
      withScheme = trimmed
    } else if lower.hasPrefix("localhost") || lower.hasPrefix("127.0.0.1") || lower.hasPrefix("10.0.2.2") || lower.hasPrefix("10.0.3.2") {
      withScheme = "http://\(trimmed)"
    } else {
      withScheme = "https://\(trimmed)"
    }

    return withScheme.replacingOccurrences(of: "/+$", with: "", options: .regularExpression)
  }

  private func isSecureApiUrl(_ value: String) -> Bool {
    guard let url = URL(string: value), let scheme = url.scheme?.lowercased() else {
      return false
    }

    if scheme == "https" {
      return true
    }

    if scheme == "http", let host = url.host?.lowercased() {
#if DEBUG
      return true
#else
      return localHttpHosts.contains(host)
#endif
    }

    return false
  }

  private func normalizeDomain(_ value: String) -> String {
    var normalized = value
      .trimmingCharacters(in: .whitespacesAndNewlines)
      .lowercased()

    if normalized.hasPrefix("http://") {
      normalized = String(normalized.dropFirst("http://".count))
    }
    if normalized.hasPrefix("https://") {
      normalized = String(normalized.dropFirst("https://".count))
    }
    if normalized.hasPrefix("www.") {
      normalized = String(normalized.dropFirst("www.".count))
    }

    if let slash = normalized.firstIndex(of: "/") {
      normalized = String(normalized[..<slash])
    }
    if let question = normalized.firstIndex(of: "?") {
      normalized = String(normalized[..<question])
    }
    if let hash = normalized.firstIndex(of: "#") {
      normalized = String(normalized[..<hash])
    }

    return normalized.trimmingCharacters(in: CharacterSet(charactersIn: "."))
  }

  private func isDomainLike(_ value: String) -> Bool {
    let pattern = #"^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$"#
    return value.range(of: pattern, options: .regularExpression) != nil
  }

  private func literalDomainFromRegexPattern(_ rawPattern: String) -> String? {
    var candidate = rawPattern.trimmingCharacters(in: .whitespacesAndNewlines)
    guard candidate.hasPrefix("^"), candidate.hasSuffix("$"), candidate.count >= 3 else {
      return nil
    }

    candidate.removeFirst()
    candidate.removeLast()
    candidate = candidate.replacingOccurrences(of: "\\\\.", with: ".")
    candidate = candidate.replacingOccurrences(of: "\\\\-", with: "-")
    candidate = candidate.replacingOccurrences(of: "\\\\_", with: "_")

    if candidate.range(of: #"[\[\]\(\)\{\}\+\*\?\|]"#, options: .regularExpression) != nil {
      return nil
    }
    if candidate.contains("\\") {
      return nil
    }

    let normalized = normalizeDomain(candidate)
    if normalized.isEmpty || !isDomainLike(normalized) {
      return nil
    }
    return normalized
  }

  private func extractDomainFromPattern(_ pattern: [String: Any]) -> String? {
    guard let rawPattern = pattern["pattern"] as? String else {
      return nil
    }
    guard let rawType = pattern["type"] as? String else {
      return nil
    }

    let normalizedType = rawType.trimmingCharacters(in: .whitespacesAndNewlines).lowercased()
    switch normalizedType {
    case "exact", "subdomain":
      let domain = normalizeDomain(rawPattern)
      return isDomainLike(domain) ? domain : nil
    case "contains":
      let domain = normalizeDomain(rawPattern)
      return isDomainLike(domain) ? domain : nil
    case "regex":
      return literalDomainFromRegexPattern(rawPattern)
    default:
      return nil
    }
  }

  private func isAllowedByWhitelist(_ domain: String, whitelist: Set<String>) -> Bool {
    for allowed in whitelist {
      if domain == allowed || domain.hasSuffix(".\(allowed)") {
        return true
      }
    }
    return false
  }

  private func resolvedMatchDomains() -> [String] {
    let defaults = storage()
    let storedDomains = (defaults.array(forKey: blocklistStorageKey) as? [String]) ?? []
    let storedPatterns = (defaults.array(forKey: patternsStorageKey) as? [[String: Any]]) ?? []
    let storedWhitelist = (defaults.array(forKey: whitelistStorageKey) as? [String]) ?? []

    var candidates = Set<String>()
    for domain in storedDomains {
      let normalized = normalizeDomain(domain)
      if !normalized.isEmpty && isDomainLike(normalized) {
        candidates.insert(normalized)
      }
    }

    for pattern in storedPatterns {
      if let domain = extractDomainFromPattern(pattern) {
        candidates.insert(domain)
      }
    }

    let normalizedWhitelist = Set(
      storedWhitelist
        .map { normalizeDomain($0) }
        .filter { !$0.isEmpty && isDomainLike($0) }
    )

    let filtered = candidates.filter { !isAllowedByWhitelist($0, whitelist: normalizedWhitelist) }
    let sorted = filtered.sorted()

    if sorted.count > maxMatchDomains {
      return Array(sorted.prefix(maxMatchDomains))
    }
    return sorted
  }

  private func normalizeDomains(from payload: [String: Any]) -> [String] {
    guard let domains = payload["domains"] as? [String] else {
      return []
    }

    var unique = Set<String>()
    var normalized: [String] = []
    for item in domains {
      let value = normalizeDomain(item)
      if value.isEmpty || unique.contains(value) {
        continue
      }
      unique.insert(value)
      normalized.append(value)
    }
    return normalized
  }

  private func sanitizePatterns(from payload: [String: Any]) -> [[String: Any]] {
    guard let patterns = payload["patterns"] as? [[String: Any]] else {
      return []
    }

    let allowedTypes = Set(["exact", "subdomain", "contains", "regex"])
    var result: [[String: Any]] = []

    for pattern in patterns {
      guard let rawPattern = pattern["pattern"] as? String else {
        continue
      }
      guard let rawType = pattern["type"] as? String else {
        continue
      }

      let normalizedPattern = rawPattern.trimmingCharacters(in: .whitespacesAndNewlines)
      let normalizedType = rawType.trimmingCharacters(in: .whitespacesAndNewlines).lowercased()
      if normalizedPattern.isEmpty || !allowedTypes.contains(normalizedType) {
        continue
      }

      let rawWeight = pattern["weight"]
      let weight: Double
      if let numeric = rawWeight as? Double {
        weight = numeric
      } else if let numeric = rawWeight as? Int {
        weight = Double(numeric)
      } else if let text = rawWeight as? String, let numeric = Double(text) {
        weight = numeric
      } else {
        continue
      }

      if !weight.isFinite {
        continue
      }

      result.append([
        "pattern": normalizedPattern,
        "type": normalizedType,
        "weight": min(1.0, max(0.0, weight)),
      ])
    }

    return result
  }

  @available(iOS 14.0, *)
  private func loadDnsSettingsManager(
    _ completion: @escaping (Result<NEDNSSettingsManager, Error>) -> Void
  ) {
    let manager = NEDNSSettingsManager.shared()
    manager.loadFromPreferences { error in
      if let error = error {
        completion(.failure(error))
        return
      }
      completion(.success(manager))
    }
  }

  @available(iOS 14.0, *)
  private func dnsManagerIsRunning(_ manager: NEDNSSettingsManager) -> Bool {
    guard manager.isEnabled else {
      return false
    }

    guard let matchDomains = manager.dnsSettings?.matchDomains else {
      return false
    }

    return !matchDomains.isEmpty
  }

  @available(iOS 14.0, *)
  private func buildDnsSettings(matchDomains: [String]) -> NEDNSSettings {
    let settings = NEDNSSettings(servers: sinkholeDnsServers)
    settings.matchDomains = matchDomains
    settings.matchDomainsNoSearch = true
    return settings
  }

  @available(iOS 14.0, *)
  private func enableDnsBlocking(
    _ manager: NEDNSSettingsManager,
    matchDomains: [String],
    completion: @escaping (Result<Int, Error>) -> Void
  ) {
    guard !matchDomains.isEmpty else {
      completion(
        .failure(
          NSError(
            domain: "GamblingBlockerModule",
            code: -10,
            userInfo: [NSLocalizedDescriptionKey: "empty_blocklist"]
          )
        )
      )
      return
    }

    manager.localizedDescription = "Anti Slot Domain Blocker"
    manager.dnsSettings = buildDnsSettings(matchDomains: matchDomains)
    manager.isEnabled = true
    manager.saveToPreferences { saveError in
      if let saveError = saveError {
        completion(.failure(saveError))
        return
      }
      manager.loadFromPreferences { loadError in
        if let loadError = loadError {
          completion(.failure(loadError))
          return
        }
        completion(.success(matchDomains.count))
      }
    }
  }

  @available(iOS 14.0, *)
  private func disableDnsBlocking(
    _ manager: NEDNSSettingsManager,
    completion: @escaping (Result<Void, Error>) -> Void
  ) {
    manager.isEnabled = false
    manager.dnsSettings = nil
    manager.saveToPreferences { saveError in
      if let saveError = saveError {
        completion(.failure(saveError))
        return
      }
      manager.loadFromPreferences { loadError in
        if let loadError = loadError {
          completion(.failure(loadError))
          return
        }
        completion(.success(()))
      }
    }
  }

  private func refreshRunningConfigurationIfNeeded(
    _ resolve: @escaping RCTPromiseResolveBlock
  ) {
    guard isFeatureEnabled() else {
      resolve(true)
      return
    }

    guard #available(iOS 14.0, *) else {
      resolve(true)
      return
    }

    loadDnsSettingsManager { result in
      switch result {
      case .failure:
        resolve(false)
      case .success(let manager):
        guard self.dnsManagerIsRunning(manager) else {
          resolve(true)
          return
        }

        let matchDomains = self.resolvedMatchDomains()
        guard !matchDomains.isEmpty else {
          self.disableDnsBlocking(manager) { disableResult in
            switch disableResult {
            case .success:
              self.setNativeStatus("stopped")
              resolve(true)
            case .failure:
              resolve(false)
            }
          }
          return
        }

        self.enableDnsBlocking(manager, matchDomains: matchDomains) { enableResult in
          switch enableResult {
          case .success:
            self.setNativeStatus("running")
            resolve(true)
          case .failure:
            resolve(false)
          }
        }
      }
    }
  }

  private func fetchJson(url: URL, completion: @escaping (Result<[String: Any], Error>) -> Void) {
    var request = URLRequest(url: url)
    request.httpMethod = "GET"
    request.timeoutInterval = 10
    request.setValue("application/json", forHTTPHeaderField: "Accept")

    URLSession.shared.dataTask(with: request) { data, response, error in
      if let error = error {
        completion(.failure(error))
        return
      }

      guard let httpResponse = response as? HTTPURLResponse else {
        completion(.failure(NSError(domain: "GamblingBlockerModule", code: -1, userInfo: [NSLocalizedDescriptionKey: "invalid_response"])))
        return
      }

      guard (200...299).contains(httpResponse.statusCode) else {
        completion(.failure(NSError(domain: "GamblingBlockerModule", code: httpResponse.statusCode, userInfo: [NSLocalizedDescriptionKey: "http_\(httpResponse.statusCode)"])))
        return
      }

      guard let data = data, !data.isEmpty else {
        completion(.failure(NSError(domain: "GamblingBlockerModule", code: -2, userInfo: [NSLocalizedDescriptionKey: "empty_response"])))
        return
      }

      do {
        let parsed = try JSONSerialization.jsonObject(with: data, options: [])
        guard let payload = parsed as? [String: Any] else {
          throw NSError(domain: "GamblingBlockerModule", code: -3, userInfo: [NSLocalizedDescriptionKey: "invalid_json_payload"])
        }
        completion(.success(payload))
      } catch {
        completion(.failure(error))
      }
    }.resume()
  }

  @objc func startFilter(
    _ resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    guard isFeatureEnabled() else {
      resolveUnsupported(resolve, message: "ENABLE_IOS_NE is disabled for this build.")
      return
    }

    guard #available(iOS 14.0, *) else {
      resolveUnsupported(resolve, message: "DNS settings protection is not supported on this iOS version.")
      return
    }

    let matchDomains = resolvedMatchDomains()
    guard !matchDomains.isEmpty else {
      resolveResult(resolve, ok: false, code: "empty_blocklist", message: "No blocklist domains are available. Sync the blocklist first.")
      return
    }

    loadDnsSettingsManager { result in
      switch result {
      case .failure(let error):
        self.resolveNotAuthorized(
          resolve,
          message: "DNS settings preferences could not be loaded: \(error.localizedDescription)"
        )
      case .success(let manager):
        self.enableDnsBlocking(manager, matchDomains: matchDomains) { enableResult in
          switch enableResult {
          case .failure(let error):
            self.resolveNotAuthorized(
              resolve,
              message: "DNS settings preferences could not be saved: \(error.localizedDescription). Ensure Network Extension entitlement (dns-settings) is enabled."
            )
          case .success(let count):
            self.setNativeStatus("running")
            self.resolveResult(
              resolve,
              ok: true,
              code: "running",
              message: "iOS protection enabled for \(count) domain\(count == 1 ? "" : "s")."
            )
          }
        }
      }
    }
  }

  @objc func stopFilter(
    _ resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    guard isFeatureEnabled() else {
      resolveUnsupported(resolve, message: "ENABLE_IOS_NE is disabled for this build.")
      return
    }

    guard #available(iOS 14.0, *) else {
      resolveUnsupported(resolve, message: "DNS settings protection is not supported on this iOS version.")
      return
    }

    loadDnsSettingsManager { result in
      switch result {
      case .failure(let error):
        self.resolveNotAuthorized(
          resolve,
          message: "DNS settings preferences could not be loaded: \(error.localizedDescription)"
        )
      case .success(let manager):
        self.disableDnsBlocking(manager) { disableResult in
          switch disableResult {
          case .failure(let error):
            self.resolveNotAuthorized(
              resolve,
              message: "DNS settings preferences could not be saved: \(error.localizedDescription)"
            )
          case .success:
            self.setNativeStatus("stopped")
            self.resolveResult(
              resolve,
              ok: true,
              code: "stopped",
              message: "iOS protection disabled."
            )
          }
        }
      }
    }
  }

  @objc func isFilterEnabled(
    _ resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    guard isFeatureEnabled() else {
      resolve(false)
      return
    }

    guard #available(iOS 14.0, *) else {
      resolve(false)
      return
    }

    loadDnsSettingsManager { result in
      switch result {
      case .failure:
        resolve(false)
      case .success(let manager):
        resolve(self.dnsManagerIsRunning(manager))
      }
    }
  }

  @objc func status(
    _ resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    guard isFeatureEnabled() else {
      resolve("stopped")
      return
    }

    guard #available(iOS 14.0, *) else {
      resolve("stopped")
      return
    }

    loadDnsSettingsManager { result in
      switch result {
      case .failure:
        resolve("error")
      case .success(let manager):
        if self.dnsManagerIsRunning(manager) {
          self.setNativeStatus("running")
          resolve("running")
        } else {
          self.setNativeStatus("stopped")
          resolve("stopped")
        }
      }
    }
  }

  @objc func diagnostics(
    _ resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    let defaults = storage()
    let blocklistCount = (defaults.array(forKey: blocklistStorageKey) as? [String])?.count ?? 0
    let patternsCount = (defaults.array(forKey: patternsStorageKey) as? [[String: Any]])?.count ?? 0
    let whitelistCount = (defaults.array(forKey: whitelistStorageKey) as? [String])?.count ?? 0

    var payload: [String: Any] = [
      "platform": "ios",
      "featureEnabled": isFeatureEnabled(),
      "supported": true,
      "blocklistCount": blocklistCount,
      "patternsCount": patternsCount,
      "whitelistCount": whitelistCount,
      "nativeStatus": defaults.string(forKey: nativeStatusKey) ?? "unknown",
      "nativeApiUrl": defaults.string(forKey: nativeApiUrlKey) ?? NSNull(),
      "nativeLastSyncMs": defaults.object(forKey: nativeLastSyncMsKey) ?? NSNull(),
    ]

    if !isFeatureEnabled() {
      payload["state"] = "feature_disabled"
      resolve(payload)
      return
    }

    guard #available(iOS 14.0, *) else {
      payload["supported"] = false
      payload["state"] = "ios_version_unsupported"
      resolve(payload)
      return
    }

    loadDnsSettingsManager { result in
      switch result {
      case .failure(let error):
        payload["state"] = "manager_load_failed"
        payload["managerLoaded"] = false
        payload["managerEnabled"] = false
        payload["managerRunning"] = false
        payload["managerMatchDomainsCount"] = 0
        payload["managerError"] = error.localizedDescription
      case .success(let manager):
        let matchDomains = manager.dnsSettings?.matchDomains ?? []
        payload["state"] = "ok"
        payload["managerLoaded"] = true
        payload["managerEnabled"] = manager.isEnabled
        payload["managerRunning"] = self.dnsManagerIsRunning(manager)
        payload["managerMatchDomainsCount"] = matchDomains.count
        payload["dnsSettingsConfigured"] = manager.dnsSettings != nil
      }
      resolve(payload)
    }
  }

  @objc func syncBlocklist(
    _ apiUrl: String,
    resolver resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    guard let baseUrl = normalizeApiUrl(apiUrl), isSecureApiUrl(baseUrl) else {
      resolve(false)
      return
    }

    guard
      let blocklistUrl = URL(string: "\(baseUrl)/v1/blocklist"),
      let patternsUrl = URL(string: "\(baseUrl)/v1/patterns")
    else {
      resolve(false)
      return
    }

    let group = DispatchGroup()
    var fetchedDomains: [String] = []
    var fetchedPatterns: [[String: Any]] = []
    var failed = false
    let lock = NSLock()

    group.enter()
    fetchJson(url: blocklistUrl) { result in
      defer { group.leave() }
      switch result {
      case .success(let payload):
        fetchedDomains = self.normalizeDomains(from: payload)
      case .failure:
        lock.lock()
        failed = true
        lock.unlock()
      }
    }

    group.enter()
    fetchJson(url: patternsUrl) { result in
      defer { group.leave() }
      switch result {
      case .success(let payload):
        fetchedPatterns = self.sanitizePatterns(from: payload)
      case .failure:
        lock.lock()
        failed = true
        lock.unlock()
      }
    }

    group.notify(queue: .main) {
      lock.lock()
      let syncFailed = failed
      lock.unlock()

      if syncFailed {
        resolve(false)
        return
      }

      let defaults = self.storage()
      defaults.set(fetchedDomains, forKey: self.blocklistStorageKey)
      defaults.set(fetchedPatterns, forKey: self.patternsStorageKey)
      defaults.set(baseUrl, forKey: self.nativeApiUrlKey)
      defaults.set(Int(Date().timeIntervalSince1970 * 1000), forKey: self.nativeLastSyncMsKey)
      defaults.synchronize()

      self.refreshRunningConfigurationIfNeeded(resolve)
    }
  }
}
