// utils/timeBlocks.ts

export type TimeBlock = {
  id: string;
  timeLabel: string;
  completed: boolean;

  // NEW 👇
  categoryId: string | null;
  description: string;
};

/**
 * Converts "HH:mm" to minutes since midnight
 */
function toMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

/**
 * Converts minutes since midnight to "h:mmAM/PM"
 */
function formatMinutes(minutes: number): string {
  const hours24 = Math.floor(minutes / 60);
  const mins = minutes % 60;

  const period = hours24 >= 12 ? "PM" : "AM";
  const hours12 = hours24 % 12 || 12;

  return `${hours12}:${mins.toString().padStart(2, "0")}${period}`;
}

/**
 * Generates time blocks between wake and sleep times
 */
export function generateTimeBlocks(
  wakeTime: string,
  sleepTime: string,
  intervalMinutes: number
): TimeBlock[] {
  const blocks: TimeBlock[] = [];

  const start = toMinutes(wakeTime);
  const end = toMinutes(sleepTime);

  if (intervalMinutes <= 0 || end <= start) return blocks;

  let current = start;

  while (current <= end) {
    blocks.push({
  id: `block-${current}`,
  timeLabel: formatMinutes(current),
  completed: false,
  categoryId: null,
  description: "",
});


    current += intervalMinutes;
  }

  return blocks;
}
