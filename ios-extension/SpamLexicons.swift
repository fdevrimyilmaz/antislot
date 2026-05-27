// AUTO-GENERATED — do not edit by hand.
//
// This file is regenerated from `services/sms-filter/keywords.ts` and
// `services/sms-filter/patterns.ts` by the `with-sms-filter-extension`
// config plugin on every `expo prebuild`. Keep the JS source canonical.

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
    static let gambling: [String] = []
    static let scam: [String] = []
    static let political: [String] = []
    static let promotion: [String] = []
    static let transaction: [String] = []
    static let patterns: [SpamPattern] = []
}
