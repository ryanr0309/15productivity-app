// utils/timeBlocks.ts

export type Block = {
  id: string;
  startTime: string;     // "HH:MM"
  endTime: string;       // "HH:MM"
  timeLabel: string;     // "8:00AM – 8:45AM"
  completed: boolean;
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
): Block[] {
  const blocks: Block[] = [];

  const start = toMinutes(wakeTime);
  const end = toMinutes(sleepTime);

  if (intervalMinutes <= 0 || end <= start) return blocks;

  let current = start;

  while (current + intervalMinutes <= end) {
    const startMinutes = current;
    const endMinutes = current + intervalMinutes;

    const startTime = `${Math.floor(startMinutes / 60)
      .toString()
      .padStart(2, "0")}:${(startMinutes % 60)
      .toString()
      .padStart(2, "0")}`;

    const endTime = `${Math.floor(endMinutes / 60)
      .toString()
      .padStart(2, "0")}:${(endMinutes % 60)
      .toString()
      .padStart(2, "0")}`;

    blocks.push({
      id: `block-${startMinutes}`,
      startTime,
      endTime,
      timeLabel: `${formatMinutes(startMinutes)}`,
      completed: false,
      categoryId: null,
      description: "",
    });

    current += intervalMinutes;
  }

  return blocks;
}
