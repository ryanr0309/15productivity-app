export function computeProductivityScore(metrics: {
  totalBlocks: number;
  completedBlocks: number;
  longestStreak: number;
  bestWindowCompleted: number;
  bestWindowTotal: number;
  missedAfterDropoff: number;
  afterDropoffTotal: number;
}) {
  const {
    totalBlocks,
    completedBlocks,
    longestStreak,
    bestWindowCompleted,
    bestWindowTotal,
    missedAfterDropoff,
    afterDropoffTotal,
  } = metrics;

  // 1️⃣ Completion (60%)
  const completionRate =
    totalBlocks === 0 ? 0 : completedBlocks / totalBlocks;

  const completionScore = completionRate * 100;

  // 2️⃣ Consistency (25%)
  const idealStreak = Math.max(1, Math.ceil(totalBlocks * 0.25));
  const consistencyScore = Math.min(
    (longestStreak / idealStreak) * 100,
    100
  );

  // 3️⃣ Timing (15%)
  const focusRate =
    bestWindowTotal === 0
      ? 0
      : bestWindowCompleted / bestWindowTotal;

  const dropoffPenalty =
    afterDropoffTotal === 0
      ? 0
      : missedAfterDropoff / afterDropoffTotal;

  const timingScore = Math.max(
    Math.min((focusRate - dropoffPenalty) * 100, 100),
    0
  );

  // FINAL SCORE
  const finalScore =
    completionScore * 0.6 +
    consistencyScore * 0.25 +
    timingScore * 0.15;

  return Math.round(finalScore);
}
