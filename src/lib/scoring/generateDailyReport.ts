import { Block } from "../../utils/timeBlocks";
import { toLogicBlocks } from "./adapters";
import { deriveDayMetrics } from "./deriveDayMetrics";
import { computeProductivityScore } from "./computeProductivityScore";
import { LogicBlock } from "./types";

/**
 * Generate a deterministic daily productivity report
 * This should be called ONCE when a day is completed.
 */
export function generateDailyReport({
  blocks,
  bestFocusWindow,
  dropoffTime,
}: {
  blocks: Block[];
  bestFocusWindow: { start: Date; end: Date };
  dropoffTime: Date;
}) {
  // 1️⃣ Adapt UI blocks → logic blocks
  const logicBlocks: LogicBlock[] = toLogicBlocks(blocks);

  // 2️⃣ Derive metrics from raw behavior
  const metrics = deriveDayMetrics(
    logicBlocks,
    bestFocusWindow,
    dropoffTime
  );

  // 3️⃣ Compute final score
  const score = computeProductivityScore(metrics);

  // 4️⃣ Prepare DB-ready payload
  return {
    score,

    blocks_total: metrics.totalBlocks,
    blocks_completed: metrics.completedBlocks,
    blocks_missed:
      metrics.totalBlocks - metrics.completedBlocks,

    longest_streak: metrics.longestStreak,

    best_focus_start: bestFocusWindow.start,
    best_focus_end: bestFocusWindow.end,
    dropoff_time: dropoffTime,

    // Optional: useful for debugging / AI explanations
    raw_metrics: metrics,
  };
}

