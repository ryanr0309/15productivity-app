import { ClassifiedBlock } from "./productivity";
import { Block } from "../utils/timeBlocks";

export function breakdownByCategory(
  blocks: Block[]
) {
  const totals: Record<string, number> = {};

  for (const b of blocks) {
    const key = b.categoryId ?? "Uncategorized";

    const durationMinutes =
      (b.endTime.getTime() - b.startTime.getTime()) / 60000;

    totals[key] = (totals[key] || 0) + durationMinutes;
  }

  return totals;
}


export function breakdownByOutcome(
  blocks: ClassifiedBlock[]
) {
  return blocks.reduce(
    (acc, b) => {
      acc[b.classification] += b.durationMinutes;
      return acc;
    },
    {
      productive: 0,
      neutral: 0,
      unproductive: 0,
    }
  );
}

