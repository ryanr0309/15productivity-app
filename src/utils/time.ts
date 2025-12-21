export function formatTime(date: Date) {
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const period = hours >= 12 ? "PM" : "AM";
  const h12 = hours % 12 || 12;

  return `${h12}:${minutes.toString().padStart(2, "0")}${period}`;
}

export function getBlockDate(timeLabel: string): Date {
  const now = new Date();

  // Extract hour/minute from "h:mmAM"
  const match = timeLabel.match(/(\d+):(\d+)(AM|PM)/);
  if (!match) return now;

  let hour = parseInt(match[1], 10);
  const minute = parseInt(match[2], 10);
  const period = match[3];

  if (period === "PM" && hour !== 12) hour += 12;
  if (period === "AM" && hour === 12) hour = 0;

  const blockDate = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    hour,
    minute
  );

  return blockDate;
}

export function isFutureBlock(timeLabel: string): boolean {
  const blockDate = getBlockDate(timeLabel);
  return blockDate.getTime() > Date.now();
}

export function roundUpToInterval(date: Date, interval: number) {
  const minutes = date.getHours() * 60 + date.getMinutes();
  const rounded = Math.ceil(minutes / interval) * interval;

  const d = new Date(date);
  d.setHours(Math.floor(rounded / 60), rounded % 60, 0, 0);
  return d;
}