import IdentityLookup
import Foundation

/// Swift port of the TS `SMSClassifier`. Kept deliberately close to the JS
/// version so testing the JS classifier in the app proves the same behavior
/// the extension delivers — if the keyword lists or thresholds drift, fix
/// both in lockstep.
struct SpamClassifier {
    let settings: FilterSettings

    struct Outcome {
        let action: ILMessageFilterAction
        let subAction: ILMessageFilterSubAction
    }

    func classify(body rawBody: String, sender: String) -> Outcome {
        let body = rawBody.lowercased()

        let customHits = SpamClassifier.countKeywordHits(body: body, keywords: settings.customKeywords)
        let communityHits = SpamClassifier.countKeywordHits(body: body, keywords: settings.communityKeywords)
        let gamblingHits = SpamClassifier.countKeywordHits(body: body, keywords: SpamLexicons.gambling)
        let scamHits = SpamClassifier.countKeywordHits(body: body, keywords: SpamLexicons.scam)
        let politicalHits = SpamClassifier.countKeywordHits(body: body, keywords: SpamLexicons.political)
        let promotionHits = SpamClassifier.countKeywordHits(body: body, keywords: SpamLexicons.promotion)
        let transactionHits = SpamClassifier.countKeywordHits(body: body, keywords: SpamLexicons.transaction)

        let hasShortNumericCode = SpamClassifier.hasShortNumericCode(in: rawBody)

        // Transaction shield — never junk a real OTP / bank / cargo SMS.
        let shielded = transactionHits >= 2 || (transactionHits >= 1 && hasShortNumericCode)
        if shielded {
            return Outcome(action: .allow, subAction: .transactionalOthers)
        }

        var gamblingScore = Double(gamblingHits) * 0.6 + Double(customHits) * 0.9 + Double(communityHits) * 0.7
        var scamScore = Double(scamHits) * 0.8
        var politicalScore = Double(politicalHits) * 0.7
        var promotionScore = Double(promotionHits) * 0.4

        let hasUrl = body.range(of: "https?://|www\\.|bit\\.ly|tinyurl", options: .regularExpression) != nil
        if hasUrl {
            if gamblingHits > 0 { gamblingScore += 0.5 }
            if scamHits > 0 { scamScore += 0.5 }
            if politicalHits > 0 { politicalScore += 0.4 }
        }

        if SpamClassifier.senderLooksSuspicious(sender) {
            scamScore += 0.2
        }

        // Regex patterns mirroring TS SPAM_PATTERNS — restricted to the
        // high-signal ones that justify a regex pass in extension hot path.
        for pattern in SpamLexicons.patterns {
            if body.range(of: pattern.regex, options: .regularExpression) != nil {
                switch pattern.category {
                case .gambling: gamblingScore += 0.5
                case .scam: scamScore += 0.5
                case .advertisement: promotionScore += 0.3
                }
            }
        }

        let junkThreshold = settings.strictMode ? 0.55 : 0.85
        let promoThreshold = settings.strictMode ? 0.45 : 0.7

        let topJunk = max(gamblingScore, max(scamScore, politicalScore))

        if topJunk >= junkThreshold {
            let sub: ILMessageFilterSubAction
            if gamblingScore == topJunk { sub = .junkPromotionalOffers }
            else if politicalScore == topJunk { sub = .junkOthers }
            else { sub = .junkOthers }
            return Outcome(action: .junk, subAction: sub)
        }

        if promotionScore >= promoThreshold {
            return Outcome(action: .promotion, subAction: .promotionalOffers)
        }

        return Outcome(action: .allow, subAction: .none)
    }

    // MARK: - Helpers

    private static func countKeywordHits(body: String, keywords: [String]) -> Int {
        var count = 0
        for raw in keywords {
            let keyword = raw.lowercased()
            guard !keyword.isEmpty else { continue }
            if keyword.contains(" ") {
                if body.contains(keyword) { count += 1 }
            } else {
                // \b on word-character boundaries
                let escaped = NSRegularExpression.escapedPattern(for: keyword)
                let pattern = "\\b\(escaped)\\b"
                if body.range(of: pattern, options: .regularExpression) != nil {
                    count += 1
                }
            }
        }
        return count
    }

    private static func hasShortNumericCode(in body: String) -> Bool {
        return body.range(of: "\\b\\d{4,8}\\b", options: .regularExpression) != nil
    }

    private static func senderLooksSuspicious(_ sender: String) -> Bool {
        if sender.isEmpty { return false }
        // Long numeric sender, common in bulk-SMS gateways.
        if sender.range(of: "^\\+?\\d{8,}$", options: .regularExpression) != nil { return true }
        return false
    }
}
