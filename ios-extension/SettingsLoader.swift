import Foundation

/// Filter settings shared between the main app and the extension via the
/// App Group container. The main app writes this file from
/// `SharedConfigModule`; the extension reads it on every classify call.
///
/// The file is JSON so we never need a custom decoder for a quick test in
/// `xcrun simctl` or Console.app.
struct FilterSettings: Codable {
    let enabled: Bool
    let strictMode: Bool
    let customKeywords: [String]
    let communityKeywords: [String]

    static let `default` = FilterSettings(
        enabled: true,
        strictMode: false,
        customKeywords: [],
        communityKeywords: []
    )
}

enum SettingsLoader {
    /// App Group identifier — must match the `entitlements` value in app.json.
    private static let appGroup = "group.com.antislot.app"
    private static let fileName = "sms_filter_settings.json"

    static func load() -> FilterSettings {
        guard
            let container = FileManager.default
                .containerURL(forSecurityApplicationGroupIdentifier: appGroup)
        else {
            return .default
        }
        let url = container.appendingPathComponent(fileName)
        guard let data = try? Data(contentsOf: url) else {
            return .default
        }
        guard let decoded = try? JSONDecoder().decode(FilterSettings.self, from: data) else {
            return .default
        }
        return decoded
    }
}
