import { LogicBlock } from "./types";



export type DayMetrics = {
  totalBlocks: number;
  completedBlocks: number;

  longestStreak: number;

  bestWindowCompleted: number;
  bestWindowTotal: number;

  missedAfterDropoff: number;
  afterDropoffTotal: number;
};

export function deriveDayMetrics(
  blocks: LogicBlock[],
  bestWindow: { start: Date; end: Date },
  dropoffTime: Date
): DayMetrics {
  let longestStreak = 0;
  let currentStreak = 0;

  let completedBlocks = 0;

  let bestWindowCompleted = 0;
  let bestWindowTotal = 0;

  let missedAfterDropoff = 0;
  let afterDropoffTotal = 0;

  for (const block of blocks) {
    if (block.completed) {
      completedBlocks++;
      currentStreak++;
      longestStreak = Math.max(longestStreak, currentStreak);
    } else {
      currentStreak = 0;
    }

    // Best focus window
    if (block.start >= bestWindow.start && block.end <= bestWindow.end) {
      bestWindowTotal++;
      if (block.completed) bestWindowCompleted++;
    }

    // Drop-off
    if (block.start >= dropoffTime) {
      afterDropoffTotal++;
      if (!block.completed) missedAfterDropoff++;
    }
  }

  return {
    totalBlocks: blocks.length,
    completedBlocks,
    longestStreak,
    bestWindowCompleted,
    bestWindowTotal,
    missedAfterDropoff,
    afterDropoffTotal,
  };
}
