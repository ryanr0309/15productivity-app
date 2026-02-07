

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

export function formatTime(input: string | Date) {
  const date = typeof input === "string" ? new Date(input) : input;

  return date.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
}

export function floorTo15Minutes(date: Date): Date {
  const floored = new Date(date);
  const minutes = floored.getMinutes();
  const flooredMinutes = Math.floor(minutes / 15) * 15;

  floored.setMinutes(flooredMinutes, 0, 0); // zero seconds/ms
  return floored;
}



export function getCurrentBlockLabel(day: any) {
  if (!day) return "—";

  const start = new Date(day.start_time);
  const now = new Date();

  const minutesSinceStart =
    (now.getTime() - start.getTime()) / 60000;

  const blockIndex = Math.floor(
    minutesSinceStart / day.interval_minutes
  );

  const blockStart = new Date(
    start.getTime() +
      blockIndex * day.interval_minutes * 60000
  );
  const blockEnd = new Date(
    blockStart.getTime() +
      day.interval_minutes * 60000
  );

  return `${formatTime(blockStart.toISOString())} – ${formatTime(
    blockEnd.toISOString()
  )}`;
}

export function normalizeToInterval(date: Date, intervalMinutes: number) {
  const ms = intervalMinutes * 60 * 1000;
  return new Date(Math.floor(date.getTime() / ms) * ms);
}

export function formatRemaining(ms: number) {
  const totalMinutes = Math.ceil(ms / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
}

export function formatDateTime(date: Date) {
  return date.toLocaleString([], {
    month: "2-digit",
    day: "2-digit",
    year: "2-digit",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

export function formatDateRange(start: Date, end: Date) {
  return `${formatDateTime(start)} - ${formatDateTime(end)}`;
}
