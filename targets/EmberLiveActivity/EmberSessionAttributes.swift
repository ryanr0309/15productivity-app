import ActivityKit
import Foundation

struct EmberSessionAttributes: ActivityAttributes {
    var sessionName: String
    var totalSeconds: Int

    public struct ContentState: Codable, Hashable {
        var endTime:        Date
        var remainingLabel: String
        var isEnding:       Bool
        var isComplete:     Bool
    }
}
