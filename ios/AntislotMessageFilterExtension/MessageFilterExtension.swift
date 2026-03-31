import Foundation
import IdentityLookup

private struct SmsNativeSettings {
  let enabled: Bool
  let strictMode: Bool
  let keywords: Set<String>
}

private struct SmsSpamResult {
  let isSpam: Bool
}

final class MessageFilterExtension: ILMessageFilterExtension, ILMessageFilterQueryHandling {
  private let appGroupId = "group.com.antislot.app"

  private let keySmsSettings = "sms.settings"
  private let keySmsEnabled = "sms.enabled"
  private let keySmsStrictMode = "sms.strictMode"
  private let keySmsKeywords = "sms.keywords"
  private let keySmsBlockedCount = "sms.blockedCount"

  private let fallbackKeywords: Set<String> = [
    "bahis",
    "casino",
    "slot",
    "bonus",
    "freebet",
    "promo",
    "kupon",
    "jackpot",
    "iddaa",
    "canli bahis",
    "sanal bahis",
    "betting",
    "sportsbook",
    "verify your account"
  ]

  private let transactionalHints: [String] = [
    "otp",
    "dogrulama kodu",
    "verification code",
    "tek kullanimlik",
    "bankaniz",
    "bank",
    "invoice",
    "fatura",
    "kargo takip",
    "delivery update"
  ]

  func handle(
    _ queryRequest: ILMessageFilterQueryRequest,
    context: ILMessageFilterExtensionContext,
    completion: @escaping (ILMessageFilterQueryResponse) -> Void
  ) {
    let response = ILMessageFilterQueryResponse()

    let body = (queryRequest.messageBody ?? "").trimmingCharacters(in: .whitespacesAndNewlines)
    if body.isEmpty {
      response.action = .allow
      completion(response)
      return
    }

    let settings = loadSettings()
    if !settings.enabled {
      response.action = .allow
      completion(response)
      return
    }

    let sender = queryRequest.sender ?? ""
    let result = classify(sender: sender, body: body, settings: settings)

    if result.isSpam {
      response.action = .junk
      incrementBlockedCount()
    } else {
      response.action = .allow
    }

    completion(response)
  }

  private func storage() -> UserDefaults {
    return UserDefaults(suiteName: appGroupId) ?? UserDefaults.standard
  }

  private func loadSettings() -> SmsNativeSettings {
    let defaults = storage()

    let enabled: Bool
    if defaults.object(forKey: keySmsEnabled) != nil {
      enabled = defaults.bool(forKey: keySmsEnabled)
    } else if
      let legacy = defaults.dictionary(forKey: keySmsSettings),
      let legacyEnabled = legacy["enabled"] as? Bool
    {
      enabled = legacyEnabled
    } else {
      enabled = true
    }

    let strictMode: Bool
    if defaults.object(forKey: keySmsStrictMode) != nil {
      strictMode = defaults.bool(forKey: keySmsStrictMode)
    } else if
      let legacy = defaults.dictionary(forKey: keySmsSettings),
      let legacyStrict = legacy["strictMode"] as? Bool
    {
      strictMode = legacyStrict
    } else {
      strictMode = true
    }

    var keywords = Set(
      (defaults.array(forKey: keySmsKeywords) as? [String] ?? [])
        .map { normalizeText($0) }
        .filter { !$0.isEmpty }
    )

    if keywords.isEmpty {
      keywords = extractLegacyKeywords(defaults: defaults)
    }

    if keywords.isEmpty {
      keywords = fallbackKeywords
    }

    return SmsNativeSettings(enabled: enabled, strictMode: strictMode, keywords: keywords)
  }

  private func extractLegacyKeywords(defaults: UserDefaults) -> Set<String> {
    guard let legacy = defaults.dictionary(forKey: keySmsSettings) else {
      return []
    }

    if let legacyKeywords = legacy["customKeywords"] as? [String] {
      return Set(legacyKeywords.map { normalizeText($0) }.filter { !$0.isEmpty })
    }

    return []
  }

  private func incrementBlockedCount() {
    let defaults = storage()
    let nextValue = defaults.integer(forKey: keySmsBlockedCount) + 1
    defaults.set(nextValue, forKey: keySmsBlockedCount)
    defaults.synchronize()
  }

  private func classify(sender: String, body: String, settings: SmsNativeSettings) -> SmsSpamResult {
    let rawBody = body.trimmingCharacters(in: .whitespacesAndNewlines)
    if rawBody.isEmpty {
      return SmsSpamResult(isSpam: false)
    }

    let normalizedBody = normalizeText(rawBody)
    let compactBody = toCompact(normalizedBody)

    let keywordMatches = settings.keywords.filter { keyword in
      keywordMatchesBody(keyword: keyword, normalizedBody: normalizedBody, compactBody: compactBody)
    }

    let hasKeyword = !keywordMatches.isEmpty
    let hasUrl = contains("(https?://|www\\.)", in: rawBody)
    let hasShortUrl = contains(
      "(bit\\.ly|tinyurl|goo\\.gl|t\\.co|ow\\.ly|is\\.gd|buff\\.ly|adf\\.ly|shorte\\.st|cutt\\.ly|rb\\.gy|lnk\\.bio)",
      in: rawBody
    )
    let hasSuspiciousTld = contains("\\b[a-z0-9-]+\\.(xyz|top|click|shop|win|live|bet|vip|pw|sbs)\\b", in: rawBody)
    let hasUrgency = contains("\\b(acil|hemen|simdi|son gun|limited|urgent|hurry|now|last chance)\\b", in: normalizedBody)
    let hasAction = contains("\\b(tikla|click|uye ol|join|register|verify|dogrula|onayla|claim|redeem)\\b", in: normalizedBody)
    let hasMoney = contains("(\\d+[\\.,]\\d+\\s*(tl|try|usd|eur|gbp)|[$€£]\\s*\\d+)", in: rawBody)
    let hasManyDigits = contains("\\d{6,}", in: rawBody)
    let hasPromoCode = contains("(promo|kupon|code|kod)[\\s:=-]*[A-Z0-9]{4,}", in: rawBody)
    let senderSuspicious = isSenderSuspicious(sender)

    let hasTransactionalHint = transactionalHints.contains { normalizedBody.contains($0) }
    let looksLikeOtp = contains("\\b(kod|code|otp|sifre|password|dogrulama)\\b", in: normalizedBody) &&
      contains("\\b\\d{4,8}\\b", in: rawBody)

    var score = 0.0

    if !keywordMatches.isEmpty {
      score += 0.50 + (Double(keywordMatches.count - 1) * 0.14)
    }
    if hasUrl { score += 0.16 }
    if hasShortUrl { score += 0.28 }
    if hasSuspiciousTld { score += 0.26 }
    if hasUrgency { score += 0.10 }
    if hasAction { score += 0.10 }
    if hasMoney { score += 0.10 }
    if hasManyDigits { score += 0.08 }
    if hasPromoCode { score += 0.12 }
    if senderSuspicious { score += 0.18 }

    if hasKeyword && hasUrl { score += 0.28 }
    if hasShortUrl && (hasKeyword || hasUrgency || senderSuspicious) { score += 0.24 }
    if settings.strictMode && hasKeyword { score += 0.11 }

    let strongSignals = [
      hasShortUrl,
      hasSuspiciousTld,
      hasUrgency,
      hasAction,
      hasMoney,
      hasManyDigits,
      hasPromoCode,
      senderSuspicious
    ].filter { $0 }.count

    if strongSignals >= 4 {
      score += settings.strictMode ? 0.30 : 0.22
    }

    if hasTransactionalHint && looksLikeOtp && !hasUrl && !hasShortUrl && !hasSuspiciousTld && keywordMatches.isEmpty {
      score -= settings.strictMode ? 0.32 : 0.44
    }

    let threshold = settings.strictMode ? 0.34 : 0.46
    let confidence = max(0.0, min(0.99, score))

    let decision: Bool
    if keywordMatches.count >= 2 {
      decision = confidence >= (threshold - 0.10)
    } else if keywordMatches.count == 1 {
      decision = confidence >= threshold
    } else if hasShortUrl && strongSignals >= 3 {
      decision = confidence >= 0.52
    } else if hasUrl && strongSignals >= 5 {
      decision = confidence >= 0.44
    } else {
      decision = false
    }

    let finalDecision: Bool
    if hasTransactionalHint && looksLikeOtp && !hasUrl && strongSignals <= 2 {
      finalDecision = false
    } else {
      finalDecision = decision
    }

    return SmsSpamResult(isSpam: finalDecision)
  }

  private func keywordMatchesBody(keyword: String, normalizedBody: String, compactBody: String) -> Bool {
    let normalizedKeyword = normalizeText(keyword)
    if normalizedKeyword.isEmpty {
      return false
    }

    if normalizedKeyword.contains(" ") {
      if normalizedBody.contains(normalizedKeyword) {
        return true
      }
    } else {
      let escaped = NSRegularExpression.escapedPattern(for: normalizedKeyword)
      if contains("\\b\(escaped)\\b", in: normalizedBody) {
        return true
      }
    }

    let compactKeyword = toCompact(normalizedKeyword)
    if compactKeyword.count >= 4 && compactBody.contains(compactKeyword) {
      return true
    }

    if normalizedKeyword.count >= 4 && !normalizedKeyword.contains(" ") {
      let spread = normalizedKeyword.map { NSRegularExpression.escapedPattern(for: String($0)) }.joined(separator: "\\W*")
      if contains(spread, in: normalizedBody) {
        return true
      }
    }

    return false
  }

  private func toCompact(_ value: String) -> String {
    return replacing("[^a-z0-9]", with: "", in: value)
  }

  private func normalizeText(_ value: String) -> String {
    var normalized = value.lowercased()
    normalized = normalized.folding(options: [.diacriticInsensitive], locale: Locale(identifier: "en_US_POSIX"))

    normalized = normalized.replacingOccurrences(of: "ı", with: "i")
    normalized = normalized.replacingOccurrences(of: "ş", with: "s")
    normalized = normalized.replacingOccurrences(of: "ğ", with: "g")
    normalized = normalized.replacingOccurrences(of: "ç", with: "c")
    normalized = normalized.replacingOccurrences(of: "ö", with: "o")
    normalized = normalized.replacingOccurrences(of: "ü", with: "u")
    normalized = normalized.replacingOccurrences(of: "0", with: "o")

    normalized = replacing("[1!|]", with: "i", in: normalized)
    normalized = replacing("3", with: "e", in: normalized)
    normalized = replacing("[4@]", with: "a", in: normalized)
    normalized = replacing("[5$]", with: "s", in: normalized)
    normalized = replacing("7", with: "t", in: normalized)
    normalized = replacing("8", with: "b", in: normalized)
    normalized = replacing("[_\\-.]", with: " ", in: normalized)
    normalized = replacing("[^a-z0-9\\s]", with: " ", in: normalized)
    normalized = replacing("\\s+", with: " ", in: normalized)

    return normalized.trimmingCharacters(in: .whitespacesAndNewlines)
  }

  private func isSenderSuspicious(_ sender: String) -> Bool {
    let clean = sender.trimmingCharacters(in: .whitespacesAndNewlines)
    if clean.isEmpty {
      return false
    }

    return contains("^\\+?\\d{8,}$", in: clean) ||
      contains("^\\d{6,}$", in: clean) ||
      contains("^[A-Z0-9]{7,}$", in: clean)
  }

  private func contains(_ pattern: String, in text: String) -> Bool {
    guard let regex = try? NSRegularExpression(pattern: pattern, options: [.caseInsensitive]) else {
      return false
    }

    let range = NSRange(text.startIndex..<text.endIndex, in: text)
    return regex.firstMatch(in: text, options: [], range: range) != nil
  }

  private func replacing(_ pattern: String, with replacement: String, in text: String) -> String {
    guard let regex = try? NSRegularExpression(pattern: pattern, options: [.caseInsensitive]) else {
      return text
    }

    let range = NSRange(text.startIndex..<text.endIndex, in: text)
    return regex.stringByReplacingMatches(in: text, options: [], range: range, withTemplate: replacement)
  }
}
