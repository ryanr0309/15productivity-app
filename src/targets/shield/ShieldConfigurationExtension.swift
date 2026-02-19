// targets/shield/ShieldConfigurationExtension.swift
//
// Shield shown when user opens a blocked app during a focus session.
//
// Primary button → opens Ember (lands on session screen which is already open)
// Secondary button → "Go back" dismisses the shield
//
// NOTE: 'openApp' requires a URL scheme registered in app.config.js:
//   ios: { infoPlist: { CFBundleURLTypes: [{ CFBundleURLSchemes: ['ember'] }] } }

import ManagedSettings
import ManagedSettingsUI
import UIKit

class ShieldConfigurationExtension: ShieldConfigurationDataSource {

    override func configuration(
        shieldingApplication application: Application
    ) -> ShieldConfiguration {
        return emberShield()
    }

    override func configuration(
        shieldingApplicationCategory category: ActivityCategory
    ) -> ShieldConfiguration {
        return emberShield()
    }

    override func configuration(
        shieldingWebDomain domain: WebDomain
    ) -> ShieldConfiguration {
        return emberShield()
    }

    private func emberShield() -> ShieldConfiguration {
        return ShieldConfiguration(
            backgroundBlurStyle: .systemUltraThinMaterialDark,

            // ── Mascot placeholder ──
            // Uncomment once EmberMascotSad.png is added to the extension target:
            // icon: UIImage(named: "EmberMascotSad"),

            title: ShieldConfiguration.Label(
                value: "This app is blocked\nduring your session",
                color: UIColor(red: 1.0, green: 0.30, blue: 0.20, alpha: 1.0) // #FF4D33
            ),

            subtitle: ShieldConfiguration.Label(
                value: "Your focus session is active in Ember 🔥",
                color: UIColor(white: 1.0, alpha: 0.55)
            ),

            // Primary: opens Ember — session screen will already be visible
            primaryButtonLabel: ShieldConfiguration.Label(
                value: "Go to Ember",
                color: .white
            ),
            primaryButtonBackgroundColor: UIColor(
                red: 1.0, green: 0.42, blue: 0.10, alpha: 1.0  // #FF6B1A
            ),

            // Secondary: dismisses shield, returns user to blocked app screen
            secondaryButtonLabel: ShieldConfiguration.Label(
                value: "Go back",
                color: UIColor(white: 1.0, alpha: 0.45)
            )
        )
    }
}
