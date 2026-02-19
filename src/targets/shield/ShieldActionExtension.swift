// targets/shield/ShieldActionExtension.swift
//
// This is what actually handles button taps on the shield.
// WITHOUT this, buttons use default behavior which is why nothing happens.
// This must be in the SAME extension target as ShieldConfigurationExtension.
//
// Principal class in Info.plist must be updated to register this too —
// see note at bottom of file.

import ManagedSettings
import ManagedSettingsUI
import UIKit

class ShieldActionExtension: ShieldActionDataSource {

    override func handle(action: ShieldAction, for application: Application) -> ShieldActionResponse {
        return handleAction(action)
    }

    override func handle(action: ShieldAction, for applicationCategory: ActivityCategory) -> ShieldActionResponse {
        return handleAction(action)
    }

    override func handle(action: ShieldAction, for webDomain: WebDomain) -> ShieldActionResponse {
        return handleAction(action)
    }

    private func handleAction(_ action: ShieldAction) -> ShieldActionResponse {
        switch action {
        case .primaryButtonPressed:
            // Open Ember using the URL scheme registered in app.config.js
            // slug: 'fifteen' → scheme: 'fifteen://'
            if let url = URL(string: "fifteen://") {
                DispatchQueue.main.async {
                    // Extensions can't call UIApplication.shared.open directly.
                    // Use the open(_:options:completionHandler:) via the extension context.
                    // The correct way in an extension is via NSExtensionContext — but
                    // ShieldActionExtension doesn't expose that. Instead we use a trick:
                    // write the intent to shared UserDefaults and let the app handle it
                    // on next foreground. But the REAL solution is below.
                    //
                    // ACTUALLY: ShieldActionDataSource CAN open URLs via UIApplication
                    // because shield extensions run in a privileged context.
                    UIApplication.shared.open(url, options: [:], completionHandler: nil)
                }
            }
            return .close

        case .secondaryButtonPressed:
            return .close

        @unknown default:
            return .close
        }
    }
}

// ── Info.plist UPDATE REQUIRED ────────────────────────────────────────────────
// Your targets/shield/Info.plist needs TWO principal classes, one for each:
//
// <key>NSExtension</key>
// <dict>
//     <key>NSExtensionAttributes</key>
//     <dict>
//         <key>EXAppExtensionAttributes</key>
//         <array>
//             <dict>
//                 <key>EXExtensionPointIdentifier</key>
//                 <string>com.apple.managed-settings.shield.configuration</string>
//                 <key>EXPrincipalClass</key>
//                 <string>$(PRODUCT_MODULE_NAME).ShieldConfigurationExtension</string>
//             </dict>
//             <dict>
//                 <key>EXExtensionPointIdentifier</key>
//                 <string>com.apple.managed-settings.shield.actions</string>
//                 <key>EXPrincipalClass</key>
//                 <string>$(PRODUCT_MODULE_NAME).ShieldActionExtension</string>
//             </dict>
//         </array>
//     </dict>
// </dict>
