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
    const startISO = row.start_time;
    const endISO = row.end_time;

    const startDate = new Date(startISO);
    const endDate = new Date(endISO);

    return {
      id: row.id,

      // LOGIC
      startTime: startDate,
      endTime: endDate,

      // UI
      timeLabel: `${formatTime(startISO)} – ${formatTime(endISO)}`,

      completed: row.status === "logged",

      // 🔑 BOTH INTENT + REALITY
      categoryId: row.category_id ?? null,
      habit_id: row.habit_id ?? null, // ✅ THIS FIXES EVERYTHING

      description: row.description ?? "",
      classification: row.classification ?? "neutral",
      goalAlignment: row.goal_alignment ?? "none",
    };
  });
}

export async function ensureTimeBlocksExist(day: any) {


  if (!day.start_time || !day.estimated_sleep_time) return;

  const intervalMs = 15 * 60 * 1000;

  // ─────────────────────────────────────────────
  // 1️⃣ Resolve day start
  // ─────────────────────────────────────────────
  const dayStart = normalizeToInterval(
    new Date(day.start_time),
    15
  );

  if (isNaN(dayStart.getTime())) {
    console.warn("Invalid day.start_time", day.start_time);
    return;
  }

  // ─────────────────────────────────────────────
  // 2️⃣ Resolve sleep as NEAREST occurrence
  // ─────────────────────────────────────────────
  const sleepInput = new Date(day.estimated_sleep_time);

  if (isNaN(sleepInput.getTime())) {
    console.warn("Invalid estimated_sleep_time", day.estimated_sleep_time);
    return;
  }

  // Anchor sleep to SAME day as start_time
  const resolvedSleep = new Date(dayStart);
  resolvedSleep.setHours(
    sleepInput.getHours(),
    sleepInput.getMinutes(),
    0,
    0
  );

  // Roll forward ONLY if sleep is before or equal to wake
  if (resolvedSleep <= dayStart) {
    resolvedSleep.setDate(resolvedSleep.getDate() + 1);
  }

  // ─────────────────────────────────────────────
  // 3️⃣ Fetch existing blocks
  // ─────────────────────────────────────────────
  const { data: existingBlocksRaw } = await supabase
    .from("time_blocks")
    .select("start_time, end_time")
    .eq("day_id", day.id)
    .order("start_time", { ascending: true });

  const existingBlocks = existingBlocksRaw ?? [];

  let nextStart: Date;

  if (existingBlocks.length > 0) {
    nextStart = new Date(
      existingBlocks[existingBlocks.length - 1].end_time
    );
  } else {
    nextStart = dayStart;
  }

  // ─────────────────────────────────────────────
  // 4️⃣ Safety: nothing to generate
  // ─────────────────────────────────────────────
  if (nextStart >= resolvedSleep) {
    return;
  }

  // ─────────────────────────────────────────────
  // 5️⃣ Generate blocks (wake → sleep)
  // ─────────────────────────────────────────────
  const blocksToInsert: any[] = [];

  while (nextStart < resolvedSleep) {
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

