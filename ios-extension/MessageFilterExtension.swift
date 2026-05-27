import IdentityLookup

/// Antislot SMS filter extension entry point.
///
/// Apple invokes this for unknown-sender SMS only (messages from contacts
/// always bypass filtering). The extension runs in a strict sandbox: no
/// `UIKit`, no `Foundation` networking unless the network capability is
/// requested via `ILMessageFilterExtension` networking mode — we don't,
/// classification stays fully on-device.
///
/// The user's settings (custom keywords, community list, strict mode) live
/// in the shared App Group container at:
///   `group.com.antislot.app/sms_filter_settings.json`
/// and are written by the main app whenever the user edits them.
final class MessageFilterExtension: ILMessageFilterExtension, ILMessageFilterQueryHandling {

    /// Called for every candidate SMS. We always resolve offline — no
    /// `context` (network) response is provided.
    func handle(
        _ queryRequest: ILMessageFilterQueryRequest,
        context: ILMessageFilterExtensionContext,
        completion: @escaping (ILMessageFilterQueryResponse) -> Void
    ) {
        let response = ILMessageFilterQueryResponse()
        let body = queryRequest.messageBody ?? ""
        let sender = queryRequest.sender ?? ""

        let settings = SettingsLoader.load()
        let result = SpamClassifier(settings: settings).classify(body: body, sender: sender)

        response.action = result.action
        if #available(iOS 16.0, *) {
            response.subAction = result.subAction
        }

        completion(response)
    }
}
