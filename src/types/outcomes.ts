import { Block } from "../utils/timeBlocks";
import { ClassifiedBlock } from "./productivity";

type CategoryBreakdownItem = {
  label: string;
  color: string;
  minutes: number;
};

export function breakdownByCategory(blocks: Block[]): CategoryBreakdownItem[] {
  const map = new Map<string, CategoryBreakdownItem>();

  for (const block of blocks) {
    if (!block.categoryLabel || !block.categoryColor) continue;

    const key = block.categoryLabel; // label is the stable identity

    if (!map.has(key)) {
      map.set(key, {
        label: block.categoryLabel,
        color: block.categoryColor,
        minutes: 0,
      });
    }

    map.get(key)!.minutes += 15;
  }

  return Array.from(map.values());
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

