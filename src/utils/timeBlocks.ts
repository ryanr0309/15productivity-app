// utils/timeBlocks.ts

import { supabase } from "../lib/supabase";
import { getBlockDate } from "./time";

export type Block = {
  id: string;

  // UI-friendly
  startTime: string;     // "HH:MM"
  endTime: string;       // "HH:MM"
  timeLabel: string;     // "8:00AM – 8:45AM"

  completed: boolean;    // derived from DB status
  categoryId: string | null;
  description: string;

  // keep these if you need exact timestamps later (recommended)
  startISO: string;
  endISO: string;
};

type BlockState =
  | "upcoming"
  | "active"
  | "completed"
  | "missed";

export function getBlockState(block: Block, now = Date.now()): BlockState {
  const start = new Date(block.startISO).getTime();
  const end = new Date(block.endISO).getTime();

  if (block.completed) return "completed";
  if (now >= start && now < end) return "active";
  if (now >= end) return "missed";
  return "upcoming";
}

export function getBlockStyles(
  state: BlockState,
  categoryColor?: string
) {
  // 🎯 CATEGORY COLOR RULE
  const baseColor = categoryColor ?? "#1E2A4A";

  switch (state) {
    case "completed":
      return {
        backgroundColor: baseColor, // ✅ category color
        opacity: 1,
      };

    case "active":
      return {
        backgroundColor: baseColor, // ✅ category color
        outline: "#4DA3FF",
        opacity: 1,
      };

    case "missed":
      return {
        backgroundColor: baseColor,
        opacity: 1,
      };

    case "upcoming":
    default:
      return {
        backgroundColor: "#1E2A4A",
        opacity: 0.35,
      };
  }
}





function todayISO() {
  return new Date().toISOString().slice(0, 10);
  }

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

export async function loadPersistedTimeBlocks(userId: string) {
  const { data, error } = await supabase
    .from("time_blocks")
    .select("start_time, completed, category_id, description")
    .eq("user_id", userId)
    .eq("date", todayISO());

  if (error) {
    console.error("Failed to load persisted time blocks", error);
    return [];
  }

  return (data ?? []).map(b => ({
    ...b,
    start_time: b.start_time.slice(0, 5), // 🔑 "11:00:00" → "11:00"
  }));
}


export function mergeTimeBlocks(
  generated: Block[],
  persisted: {
    start_time: string;
    completed: boolean;
    category_id: string | null;
    description: string;
  }[]
): Block[] {
  const persistedMap = new Map(
    persisted.map(p => [p.start_time, p])
  );

  return generated.map(block => {
    const persistedBlock = persistedMap.get(block.startTime);

    // Persisted always wins
    if (persistedBlock) {
      return {
        ...block,
        completed: persistedBlock.completed,
        categoryId: persistedBlock.category_id,
        description: persistedBlock.description,
      };
    }

    // Otherwise, keep generated block (even if past)
    return block;
  });
}

export function mergeAfterScheduleChange(
  generated: Block[],
  persisted: {
    start_time: string;
    completed: boolean;
    category_id: string | null;
    description: string;
  }[]
): Block[] {
  function normalizeHHMM(time: string) {
    return time.slice(0, 5);
  }

  const persistedMap = new Map(
    persisted.map(p => [normalizeHHMM(p.start_time), p])
  );

  return generated.map(block => {
    const persistedBlock = persistedMap.get(block.startTime);

    if (persistedBlock) {
      return {
        ...block,
        completed: persistedBlock.completed,
        categoryId: persistedBlock.category_id,
        description: persistedBlock.description,
      };
    }

    return block;
  });
}
