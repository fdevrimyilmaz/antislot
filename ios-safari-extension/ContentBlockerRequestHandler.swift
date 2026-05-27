import Foundation

/// Safari Content Blocker entry point.
///
/// Safari calls `beginRequest` once when the user enables the blocker in
/// `Settings → Safari → Extensions`, and again whenever the main app calls
/// `SFContentBlockerManager.reloadContentBlocker(withIdentifier:)`.
///
/// The rules list is shared via App Group `group.com.antislot.app`:
///   - Main app writes `safari_blocker_rules.json` after every blocklist
///     sync (see `react-native-bridge/SharedConfigModule` →
///     `AntislotSharedConfigModule.saveSafariContentBlockerRules`).
///   - This handler reads that file and returns it to Safari.
///   - If the file is missing (first launch, or App Group not yet
///     provisioned in dev), we fall back to the bundled default JSON so the
///     extension is still valid.
final class ContentBlockerRequestHandler: NSObject, NSExtensionRequestHandling {

    private static let appGroup = "group.com.antislot.app"
    private static let sharedRulesFile = "safari_blocker_rules.json"
    private static let bundledRulesFile = "blockerList"

    func beginRequest(with context: NSExtensionContext) {
        let attachment = loadAttachment()
        let item = NSExtensionItem()
        item.attachments = [attachment]
        context.completeRequest(returningItems: [item], completionHandler: nil)
    }

    private func loadAttachment() -> NSItemProvider {
        if let sharedURL = sharedRulesURL(),
           FileManager.default.fileExists(atPath: sharedURL.path),
           let provider = NSItemProvider(contentsOf: sharedURL) {
            return provider
        }
        // Fallback: the JSON bundled inside the extension at build time.
        let bundledURL = Bundle.main.url(
            forResource: Self.bundledRulesFile,
            withExtension: "json"
        )!
        return NSItemProvider(contentsOf: bundledURL)!
    }

    private func sharedRulesURL() -> URL? {
        return FileManager.default
            .containerURL(forSecurityApplicationGroupIdentifier: Self.appGroup)?
            .appendingPathComponent(Self.sharedRulesFile)
    }
}
