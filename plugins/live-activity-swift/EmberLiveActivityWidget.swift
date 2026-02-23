import ActivityKit
import WidgetKit
import SwiftUI

@main
struct EmberLiveActivityBundle: WidgetBundle {
    var body: some Widget {
        EmberLiveActivityWidget()
    }
}

struct EmberLiveActivityWidget: Widget {
    var body: some WidgetConfiguration {
        ActivityConfiguration(for: EmberSessionAttributes.self) { context in

            // ── Lock Screen banner ────────────────────────────────────────
            HStack(spacing: 16) {
                VStack(alignment: .leading, spacing: 3) {
                    HStack(spacing: 6) {
                        Text("🔥").font(.system(size: 18))
                        Text(context.attributes.sessionName)
                            .font(.system(size: 13, weight: .semibold))
                            .foregroundColor(.white.opacity(0.65))
                    }
                    if !context.state.isComplete {
                        Text(timerInterval: Date.now...context.state.endTime, countsDown: true)
                            .font(.system(size: 30, weight: .black, design: .rounded))
                            .foregroundColor(context.state.isEnding
                                ? Color(red: 1, green: 0.35, blue: 0.2) : .white)
                            .monospacedDigit()
                    } else {
                        Text("Complete! 🎯")
                            .font(.system(size: 24, weight: .black, design: .rounded))
                            .foregroundColor(Color(red: 0.4, green: 0.87, blue: 0.6))
                    }
                }
                Spacer()
                if !context.state.isComplete {
                    ZStack {
                        Circle().stroke(Color.white.opacity(0.10), lineWidth: 4)
                        Circle()
                            .trim(from: 0, to: progressFraction(context))
                            .stroke(
                                context.state.isEnding
                                    ? Color(red: 1, green: 0.38, blue: 0.2)
                                    : Color(red: 1, green: 0.56, blue: 0.06),
                                style: StrokeStyle(lineWidth: 4, lineCap: .round)
                            )
                            .rotationEffect(.degrees(-90))
                        Text("FOCUS")
                            .font(.system(size: 7, weight: .bold))
                            .foregroundColor(.white.opacity(0.45))
                    }
                    .frame(width: 50, height: 50)
                } else {
                    Image(systemName: "checkmark.circle.fill")
                        .font(.system(size: 40))
                        .foregroundColor(Color(red: 0.4, green: 0.87, blue: 0.6))
                }
            }
            .padding(.horizontal, 18)
            .padding(.vertical, 14)
            .background(Color(red: 0.04, green: 0.025, blue: 0.01))
            .activityBackgroundTint(Color(red: 0.06, green: 0.035, blue: 0.015))
            .activitySystemActionForegroundColor(Color(red: 1, green: 0.56, blue: 0.06))

        } dynamicIsland: { context in
            DynamicIsland {
                DynamicIslandExpandedRegion(.leading) {
                    HStack(spacing: 8) {
                        Text("🔥").font(.system(size: 28))
                        VStack(alignment: .leading, spacing: 1) {
                            Text("FOCUS SESSION")
                                .font(.system(size: 9, weight: .bold))
                                .foregroundColor(.white.opacity(0.45))
                                .kerning(1.2)
                            Text(context.attributes.sessionName)
                                .font(.system(size: 13, weight: .semibold))
                                .foregroundColor(.white.opacity(0.80))
                        }
                    }
                    .padding(.leading, 4)
                }
                DynamicIslandExpandedRegion(.trailing) {
                    VStack(alignment: .trailing, spacing: 2) {
                        if !context.state.isComplete {
                            Text(timerInterval: Date.now...context.state.endTime, countsDown: true)
                                .font(.system(size: 26, weight: .black, design: .rounded))
                                .foregroundColor(context.state.isEnding
                                    ? Color(red: 1, green: 0.35, blue: 0.2)
                                    : Color(red: 1, green: 0.80, blue: 0.3))
                                .monospacedDigit()
                            Text("remaining")
                                .font(.system(size: 10, weight: .medium))
                                .foregroundColor(.white.opacity(0.35))
                        } else {
                            Text("Done! 🎯")
                                .font(.system(size: 20, weight: .black, design: .rounded))
                                .foregroundColor(Color(red: 0.4, green: 0.87, blue: 0.6))
                        }
                    }
                    .padding(.trailing, 4)
                }
                DynamicIslandExpandedRegion(.bottom) {
                    GeometryReader { geo in
                        ZStack(alignment: .leading) {
                            RoundedRectangle(cornerRadius: 4)
                                .fill(Color.white.opacity(0.08))
                                .frame(height: 6)
                            RoundedRectangle(cornerRadius: 4)
                                .fill(LinearGradient(
                                    colors: [
                                        Color(red: 1, green: 0.56, blue: 0.06),
                                        Color(red: 1, green: 0.30, blue: 0.05),
                                    ],
                                    startPoint: .leading, endPoint: .trailing
                                ))
                                .frame(width: geo.size.width * progressFraction(context), height: 6)
                        }
                    }
                    .frame(height: 6)
                    .padding(.horizontal, 4)
                    .padding(.bottom, 6)
                }
            } compactLeading: {
                Text("🔥").font(.system(size: 16)).padding(.leading, 2)
            } compactTrailing: {
                if !context.state.isComplete {
                    Text(timerInterval: Date.now...context.state.endTime, countsDown: true)
                        .font(.system(size: 12, weight: .black, design: .rounded))
                        .foregroundColor(context.state.isEnding
                            ? Color(red: 1, green: 0.38, blue: 0.2)
                            : Color(red: 1, green: 0.78, blue: 0.28))
                        .monospacedDigit()
                        .frame(width: 46)
                        .padding(.trailing, 2)
                } else {
                    Image(systemName: "checkmark.circle.fill")
                        .font(.system(size: 14))
                        .foregroundColor(Color(red: 0.4, green: 0.87, blue: 0.6))
                        .padding(.trailing, 2)
                }
            } minimal: {
                Text("🔥").font(.system(size: 14))
            }
        }
    }

    private func progressFraction(_ context: ActivityViewContext<EmberSessionAttributes>) -> CGFloat {
        let total   = Double(context.attributes.totalSeconds)
        let end     = context.state.endTime.timeIntervalSinceNow
        let elapsed = total - end
        return CGFloat(min(max(elapsed / total, 0), 1))
    }
}
