// utils/timeBlocks.ts

import { supabase } from "../lib/supabase";
import { getBlockDate } from "./time";

export type Block = {
  id: string;

  // 🔑 LOGIC (single source of truth)
  startTime: Date;
  endTime: Date;

  // 🔑 UI
  timeLabel: string;

  completed: boolean;
  categoryId: string | null;
  description: string;

  // 🧠 NEW — classification system
  classification: "productive" | "neutral" | "unproductive";
  goalAlignment: "strong" | "partial" | "none";
  habit_id: string | null
};




type BlockState =
  | "upcoming"
  | "active"
  | "completed"
  | "missed";



export function getBlockState(block: Block, now = Date.now()) {
  const start = block.startTime.getTime();
  const end = block.endTime.getTime();

  if (block.completed) return "completed";
  if (now >= start && now < end) return "active";
  if (now >= end) return "missed";
  return "upcoming";
}

export function didCompletePlannedHabit(block: Block) {
  return (
    block.habit_id !== null &&
    block.categoryId !== null &&
    block.habit_id === block.categoryId
  );
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





export function getCurrentBlockIndex(blocks: Block[]): number | null {
  const now = new Date();


  blocks.forEach((block, i) => {
    const start = new Date(block.startTime);
    const end = new Date(block.endTime);
  });

  const index = blocks.findIndex(block => {
    const start = new Date(block.startTime);
    const end = new Date(block.endTime);
    return now >= start && now < end;
  });

  return index === -1 ? null : index;
}

