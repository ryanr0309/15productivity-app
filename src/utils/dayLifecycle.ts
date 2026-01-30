import { supabase } from "../lib/supabase";

export async function closeDay({
  dayId,
  endTime,
  reason,
}: {
  dayId: string;
  endTime: Date;
  reason: "manual" | "auto";
}): Promise<string> {
  // 1️⃣ Close the day
  const { error: dayError } = await supabase
    .from("days")
    .update({
      status: "closed",
      end_time: endTime.toISOString(),
      closed_reason: reason,
    })
    .eq("id", dayId)
    .eq("status", "open");

  if (dayError) throw dayError;

  // 2️⃣ Mark all unlogged blocks as missed
// 2️⃣ Mark only truly unlogged blocks as missed
const { error: blocksError } = await supabase
  .from("time_blocks")
  .update({ status: "missed" })
  .eq("day_id", dayId)
  .in("status", ["upcoming", "active"]);


  if (blocksError) throw blocksError;

  // 3️⃣ Fire daily report (fire & forget)
  supabase.functions.invoke("analyze-day", {
    body: { dayId, reason },
  });

  return dayId;
}
