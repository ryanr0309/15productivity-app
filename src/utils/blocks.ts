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
    const startISO = row.start_time; // ISO string
    const endISO = row.end_time;     // ISO string

    const startDate = new Date(startISO);
    const endDate = new Date(endISO);

    return {
      id: row.id,

      // 🔑 LOGIC (Dates)
      startTime: startDate,
      endTime: endDate,

      // 🔑 UI ONLY
      timeLabel: `${formatTime(startISO)} – ${formatTime(endISO)}`,

      completed: row.status === "logged",
      categoryId: row.category_id ?? null,
      description: row.description ?? "",

      classification: row.classification ?? "neutral",
      goalAlignment: row.goal_alignment ?? "none",
    };
  });
}


export async function ensureTimeBlocksExist(day: any) {
  const { data: existingBlocks } = await supabase
    .from("time_blocks")
    .select("start_time, end_time")
    .eq("day_id", day.id)
    .order("start_time", { ascending: true });

  const intervalMs = day.interval_minutes * 60 * 1000;
  const now = Date.now();

  let nextStart: Date;

  if (existingBlocks && existingBlocks.length > 0) {
    nextStart = new Date(
      existingBlocks[existingBlocks.length - 1].end_time
    );
  } else {
    nextStart = normalizeToInterval(
      new Date(day.start_time),
      day.interval_minutes
    );
  }

  const blocksToInsert: any[] = [];

  // ✅ Generate until one block PAST now
  while (nextStart.getTime() < now + intervalMs) {
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

  // 🔥 THIS WAS MISSING
  if (blocksToInsert.length > 0) {
    await supabase.from("time_blocks").insert(blocksToInsert);
  }

}