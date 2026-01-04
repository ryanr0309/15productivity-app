import { ClassifiedBlock } from "../../types/productivity";
type FocusWindow = {
  start: Date;
  end: Date;
  totalMinutes: number;
};

export function findBestFocusWindow(
  blocks: ClassifiedBlock[]
): FocusWindow | null {
  if (!blocks.length) return null;

  // ensure chronological order
  const sorted = [...blocks].sort(
    (a, b) =>
      new Date(a.startTime).getTime() -
      new Date(b.startTime).getTime()
  );

  let best: FocusWindow | null = null;
  let current: FocusWindow | null = null;

  for (const b of sorted) {
    if (b.classification === "productive") {
      if (!current) {
        current = {
          start: new Date(b.startTime),
          end: new Date(b.startTime),
          totalMinutes: 0,
        };
      }

      current.end = new Date(b.startTime);
      current.totalMinutes += b.durationMinutes;
    } else if (b.classification === "unproductive"  || b.classification === "neutral" ) {
      if (current) {
        if (!best || current.totalMinutes > best.totalMinutes) {
          best = current;
        }
        current = null;
      }
    }
  }

  // flush last window
  if (current) {
    if (!best || current.totalMinutes > best.totalMinutes) {
      best = current;
    }
  }

  return best;
}
