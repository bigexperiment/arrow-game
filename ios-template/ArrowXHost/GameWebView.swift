import SwiftUI
import WebKit
import UserNotifications

struct GameWebView: UIViewRepresentable {
    func makeCoordinator() -> Coordinator {
        Coordinator()
    }

    func makeUIView(context: Context) -> WKWebView {
        let contentController = WKUserContentController()
        contentController.add(context.coordinator, name: "haptics")
        contentController.add(context.coordinator, name: "notifications")

        let configuration = WKWebViewConfiguration()
        configuration.userContentController = contentController
        configuration.allowsInlineMediaPlayback = true

        let webView = WKWebView(frame: .zero, configuration: configuration)
        webView.scrollView.isScrollEnabled = false
        webView.scrollView.bounces = false
        webView.isOpaque = false
        webView.backgroundColor = .clear

        guard
            let assetsRoot = Bundle.main.resourceURL?.appendingPathComponent("WebAssets"),
            let indexURL = Bundle.main.url(forResource: "index", withExtension: "html", subdirectory: "WebAssets")
        else {
            let html = """
            <html><body style="font-family:-apple-system;padding:24px">
            <h2>ArrowX assets missing</h2>
            <p>Add the WebAssets folder reference to the Xcode target build resources.</p>
            </body></html>
            """
            webView.loadHTMLString(html, baseURL: nil)
            return webView
        }

        webView.loadFileURL(indexURL, allowingReadAccessTo: assetsRoot)
        return webView
    }

    func updateUIView(_ uiView: WKWebView, context: Context) {}

    final class Coordinator: NSObject, WKScriptMessageHandler {
        private let impactGenerator = UIImpactFeedbackGenerator(style: .medium)
        private let notificationGenerator = UINotificationFeedbackGenerator()

        func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage) {
            switch message.name {
            case "haptics":
                handleHaptics(message.body)
            case "notifications":
                handleNotification(message.body)
            default:
                break
            }
        }

        private func handleHaptics(_ body: Any) {
            impactGenerator.prepare()
            notificationGenerator.prepare()

            guard let payload = body as? [String: Any] else {
                impactGenerator.impactOccurred()
                return
            }

            let duration = (payload["duration"] as? Double) ?? 10
            if duration >= 30 {
                notificationGenerator.notificationOccurred(.success)
            } else {
                impactGenerator.impactOccurred(intensity: min(1.0, max(0.3, duration / 40.0)))
            }
        }

        private func handleNotification(_ body: Any) {
            guard let payload = body as? [String: Any] else { return }
            let title = (payload["title"] as? String) ?? "ArrowX"
            let subtitle = (payload["body"] as? String) ?? ""
            let delayMs = (payload["delayMs"] as? Double) ?? 0

            let center = UNUserNotificationCenter.current()
            center.requestAuthorization(options: [.alert, .sound, .badge]) { granted, _ in
                guard granted else { return }

                let content = UNMutableNotificationContent()
                content.title = title
                content.body = subtitle
                content.sound = .default

                let trigger = UNTimeIntervalNotificationTrigger(
                    timeInterval: max(1.0, delayMs / 1000.0),
                    repeats: false
                )

                let request = UNNotificationRequest(
                    identifier: UUID().uuidString,
                    content: content,
                    trigger: trigger
                )

                center.add(request)
            }
        }
    }
}
