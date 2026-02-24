import ActivityKit
import Foundation

@objc(LiveActivityModule)
class LiveActivityModule: NSObject {

    private var currentActivity: Activity<EmberSessionAttributes>?

    @objc func startActivity(
        _ sessionName: String,
        durationSeconds: Double,
        resolver: @escaping RCTPromiseResolveBlock,
        rejecter: @escaping RCTPromiseRejectBlock
    ) {
        guard ActivityAuthorizationInfo().areActivitiesEnabled else {
            rejecter("LIVE_ACTIVITY_DISABLED", "Live Activities are disabled on this device", nil)
            return
        }
        if let existing = currentActivity {
            Task { await existing.end(nil, dismissalPolicy: .immediate) }
            currentActivity = nil
        }
        let endTime    = Date().addingTimeInterval(durationSeconds)
        let attributes = EmberSessionAttributes(
            sessionName:  sessionName,
            totalSeconds: Int(durationSeconds)
        )
        let state = EmberSessionAttributes.ContentState(
            endTime:        endTime,
            remainingLabel: formatRemaining(durationSeconds),
            isEnding:       durationSeconds < 60,
            isComplete:     false
        )
        do {
            let activity = try Activity.request(
                attributes: attributes,
                content:    .init(state: state, staleDate: endTime.addingTimeInterval(5)),
                pushType:   nil
            )
            currentActivity = activity
            resolver(activity.id)
        } catch {
            rejecter("LIVE_ACTIVITY_ERROR", error.localizedDescription, error)
        }
    }

    @objc func updateActivity(
        _ remainingSeconds: Double,
        resolver: @escaping RCTPromiseResolveBlock,
        rejecter: @escaping RCTPromiseRejectBlock
    ) {
        guard let activity = currentActivity else { resolver(nil); return }
        let endTime  = Date().addingTimeInterval(remainingSeconds)
        let newState = EmberSessionAttributes.ContentState(
            endTime:        endTime,
            remainingLabel: formatRemaining(remainingSeconds),
            isEnding:       remainingSeconds < 60,
            isComplete:     false
        )
        Task {
            await activity.update(.init(state: newState, staleDate: endTime.addingTimeInterval(5)))
            resolver(nil)
        }
    }

    @objc func endActivity(
        _ natural: Bool,
        resolver: @escaping RCTPromiseResolveBlock,
        rejecter: @escaping RCTPromiseRejectBlock
    ) {
        guard let activity = currentActivity else { resolver(nil); return }
        let finalState = EmberSessionAttributes.ContentState(
            endTime:        Date(),
            remainingLabel: "0:00",
            isEnding:       false,
            isComplete:     true
        )
        Task {
            if natural {
                await activity.end(
                    .init(state: finalState, staleDate: Date().addingTimeInterval(4)),
                    dismissalPolicy: .after(Date().addingTimeInterval(4))
                )
            } else {
                await activity.end(nil, dismissalPolicy: .immediate)
            }
            currentActivity = nil
            resolver(nil)
        }
    }

    private func formatRemaining(_ seconds: Double) -> String {
        let s = Int(max(seconds, 0))
        return String(format: "%d:%02d", s / 60, s % 60)
    }

    @objc static func requiresMainQueueSetup() -> Bool { false }
}
