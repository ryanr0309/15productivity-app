import { ClassifiedBlock } from "../../types/productivity";

type UnproductiveWindow = {
  start: Date;
  end: Date;
  totalMinutes: number;
};

export function findMostUnproductiveWindow(
  blocks: ClassifiedBlock[]
): UnproductiveWindow | null {
  if (!blocks.length) return null;

  const sorted = [...blocks].sort(
    (a, b) =>
      new Date(a.startTime).getTime() -
      new Date(b.startTime).getTime()
  );

  let current: UnproductiveWindow | null = null;
  let worst: UnproductiveWindow | null = null;

  for (const block of sorted) {
    if (block.classification === "unproductive") {
      if (!current) {
        current = {
          start: new Date(block.startTime),
          end: new Date(block.startTime),
          totalMinutes: 0,
        };
      }

      current.end = new Date(block.startTime);
      current.totalMinutes += block.durationMinutes;
    } else {
      if (current) {
        if (
          !worst ||
          current.totalMinutes > worst.totalMinutes
        ) {
          worst = current;
        }
        current = null;
      }
    }
  }

  // flush last window
  if (current) {
    if (!worst || current.totalMinutes > worst.totalMinutes) {
      worst = current;
    }
  }

  return worst;
}
