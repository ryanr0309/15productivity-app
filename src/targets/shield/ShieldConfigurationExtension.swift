// targets/shield/ShieldConfigurationExtension.swift
//
// This is the UI shown when a blocked app is opened.
// It runs in a SEPARATE PROCESS from your React Native app —
// no RN APIs available here, pure Swift/SwiftUI only.
//
// react-native-device-activity writes shield config into the shared
// App Group UserDefaults from JS. This extension reads those values.

import ManagedSettings
import ManagedSettingsUI
import UIKit

// The system calls this class to get the shield configuration.
// Override the methods for the type(s) of content you're shielding.
class ShieldConfigurationExtension: ShieldConfigurationDataSource {

    // Shared UserDefaults — same App Group as in app.config.js
    private let defaults = UserDefaults(
        suiteName: "group.com.ryan.fifteen"  // ← match your APP_GROUP
    )

    // ── Called when shielding a specific application ──────────────────────
    override func configuration(
        shieldingApplication application: Application
    ) -> ShieldConfiguration {
        return emberShield()
    }

    // ── Called when shielding an app category ─────────────────────────────
    override func configuration(
        shieldingApplicationCategory category: ActivityCategory
    ) -> ShieldConfiguration {
        return emberShield()
    }

    // ── Called when shielding a website ───────────────────────────────────
    override func configuration(
        shieldingWebDomain domain: WebDomain
    ) -> ShieldConfiguration {
        return emberShield()
    }

    // ── Build the shield UI ───────────────────────────────────────────────
    // react-native-device-activity writes shield title/subtitle into
    // UserDefaults so you can update it from JS without a new build.
    private func emberShield() -> ShieldConfiguration {

        // Read dynamic values written by ReactNativeDeviceActivity.updateShield()
        // Falls back to sensible defaults if nothing has been written yet.
        let title    = defaults?.string(forKey: "ember_shield_title")
                     ?? "Focus Session Active 🔥"
        let subtitle = defaults?.string(forKey: "ember_shield_subtitle")
                     ?? "This app is blocked during your focus block."

        return ShieldConfiguration(
            // ── Background ──
            backgroundBlurStyle: .systemMaterialDark,

            // ── Icon: app's own icon shows by default, or override: ──
            // icon: UIImage(named: "EmberShieldIcon"),

            // ── Title ──
            title: ShieldConfiguration.Label(
                value: title,
                color: .white
            ),

            // ── Subtitle ──
            subtitle: ShieldConfiguration.Label(
                value: subtitle,
                color: UIColor(white: 1.0, alpha: 0.65)
            ),

            // ── Primary button: "I need it" — defers shield briefly ──
            primaryButtonLabel: ShieldConfiguration.Label(
                value: "I need it (1 min)",
                color: .white
            ),
            primaryButtonBackgroundColor: UIColor(
                red: 1.0, green: 0.42, blue: 0.10, alpha: 1.0   // #FF6B1A
            ),

            // ── Secondary button: just closes the shield ──
            secondaryButtonLabel: ShieldConfiguration.Label(
                value: "Go back",
                color: UIColor(white: 1.0, alpha: 0.55)
            )
        )
    }
}
