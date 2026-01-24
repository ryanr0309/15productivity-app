import { supabase } from "../lib/supabase";
import { dateToHHMM } from "./dateToHHMM";
import { formatTime, normalizeToInterval } from "./time";
import { Block } from "./timeBlocks";

export function getCurrentBlockIndex(blocks: Block[]) {
  const now = Date.now();

  for (let i = 0; i < blocks.length; i++) {
    const start = blocks[i].startTime.getTime();
    const end = blocks[i].endTime.getTime();

    if (now >= start && now < end) {
      return i;
    }
  }

  return null;
}

export function getCurrentBlock(blocks: Block[]) {
  const index = getCurrentBlockIndex(blocks);
  return index !== null ? blocks[index] : null;
}


export function normalizeBlocks(rows: any[]): Block[] {
  return rows.map((row) => {
    const startDate = new Date(row.start_time);
    const endDate = new Date(row.end_time);

    const status =
      (row.status as Block["status"]) ?? "upcoming";

    return {
      id: row.id,

      // LOGIC
      startTime: new Date(row.start_time),
      endTime: new Date(row.end_time),

      // SOURCE OF TRUTH
      status,
      completed: status === "logged",

      // UI
      timeLabel: `${formatTime(row.start_time)} – ${formatTime(row.end_time)}`,

      // CATEGORY / HABIT
      categoryId: row.category_id ?? null,
      habit_id: row.habit_id ?? null,

      description: row.description ?? "",
      edit_count: row.edit_count ?? 0,

      categoryLabel: row.category_label ?? null,
      categoryColor: row.category_color ?? null,

      // CLASSIFICATION
      classification: row.classification ?? "neutral",
      goalAlignment: row.goal_alignment ?? "none",
    };
  });
}


function getGenerationEnd(day: any, resolvedSleep: Date) {
  // If the day is already closed, respect it
  if (day.end_time) {
    return new Date(day.end_time);
  }

  const BUFFER_MINUTES = 90;
  const bufferedNow = new Date(
    Date.now() + BUFFER_MINUTES * 60_000
  );

  // Generate at least until the later of:
  // - estimated sleep
  // - now + buffer
  return bufferedNow > resolvedSleep
    ? bufferedNow
    : resolvedSleep;
}


export async function ensureTimeBlocksExist(day: any) {
  if (!day.start_time || !day.estimated_sleep_time) return;

  const intervalMs = 15 * 60 * 1000;

  const dayStart = normalizeToInterval(
    new Date(day.start_time),
    15
  );

  if (isNaN(dayStart.getTime())) return;

  const sleepInput = new Date(day.estimated_sleep_time);
  if (isNaN(sleepInput.getTime())) return;

  const resolvedSleep = new Date(dayStart);
  resolvedSleep.setHours(
    sleepInput.getHours(),
    sleepInput.getMinutes(),
    0,
    0
  );

  if (resolvedSleep <= dayStart) {
    resolvedSleep.setDate(resolvedSleep.getDate() + 1);
  }

  const { data: existingBlocksRaw } = await supabase
    .from("time_blocks")
    .select("start_time, end_time")
    .eq("day_id", day.id)
    .order("start_time", { ascending: true });

  const existingBlocks = existingBlocksRaw ?? [];

  let nextStart =
    existingBlocks.length > 0
      ? new Date(existingBlocks[existingBlocks.length - 1].end_time)
      : dayStart;

  // 🔑 NEW: dynamic generation horizon
  const generationEnd = getGenerationEnd(day, resolvedSleep);

  if (nextStart >= generationEnd) return;

  const blocksToInsert: any[] = [];

  while (nextStart < generationEnd) {
    const start = new Date(nextStart);
    const end = new Date(start.getTime() + intervalMs);

    blocksToInsert.push({
      day_id: day.id,
      start_time: start.toISOString(),
      end_time: end.toISOString(),
      status: "upcoming",
    });

    nextStart = end;
  }

  if (blocksToInsert.length > 0) {
    await supabase.from("time_blocks").insert(blocksToInsert);
  }
}
