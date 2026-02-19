// targets/monitor/DeviceActivityMonitorExtension.swift
//
// Runs in a SEPARATE PROCESS, called by iOS when activity thresholds fire.
// This is how blocking gets applied/removed automatically.
//
// react-native-device-activity reads/writes via shared App Group UserDefaults.
// You don't need to write much custom code here — the library handles the
// heavy lifting through the "actions" system you configure from JS.

import DeviceActivity
import ManagedSettings
import Foundation

// The system spawns this extension when a monitored interval starts/ends
// or when a threshold event fires.
@objc(DeviceActivityMonitorExtension)
class DeviceActivityMonitorExtension: DeviceActivityMonitor {

    // Shared store — apply shields here
    let store = ManagedSettingsStore()

    // Shared UserDefaults for reading actions written by JS
    let defaults = UserDefaults(suiteName: "group.com.ryan.fifteen")

    // ── Called when a monitored interval begins ───────────────────────────
    override func intervalDidStart(for activity: DeviceActivityName) {
        super.intervalDidStart(for: activity)
        // react-native-device-activity handles this automatically when
        // you pass actions: [{ type: "blockSelection" }] in startMonitoring()
        // You only need custom code here for non-standard behaviour.
    }

    // ── Called when a monitored interval ends ─────────────────────────────
    override func intervalDidEnd(for activity: DeviceActivityName) {
        super.intervalDidEnd(for: activity)
        // Library handles unblocking automatically.
        // Add any custom logic here, e.g. logging to UserDefaults for Supabase sync.
        logEvent("session_ended", activity: activity.rawValue)
    }

    // ── Called when a threshold event fires (e.g. 10 min of usage) ───────
    override func eventDidReachThreshold(
        _ event: DeviceActivityEvent.Name,
        activity: DeviceActivityName
    ) {
        super.eventDidReachThreshold(event, activity: activity)
        // Library handles blockSelection action automatically.
        // Log for your insights screen:
        logEvent(event.rawValue, activity: activity.rawValue)
    }

    // ── Called when user intervenes (e.g. taps "I need it" on shield) ────
    override func intervalWillStartWarning(for activity: DeviceActivityName) {
        super.intervalWillStartWarning(for: activity)
    }

    // ── Helper: write event to shared UserDefaults for JS to read ─────────
    private func logEvent(_ event: String, activity: String) {
        let key = "events_\(activity)"
        var history = defaults?.array(forKey: key) as? [[String: String]] ?? []
        history.append([
            "event":     event,
            "timestamp": ISO8601DateFormatter().string(from: Date()),
        ])
        // Cap at last 200 events to avoid bloat
        if history.count > 200 { history = Array(history.suffix(200)) }
        defaults?.set(history, forKey: key)
    }
}
