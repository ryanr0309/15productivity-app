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
  // 1️⃣ Close day
  const { error } = await supabase
    .from("days")
    .update({
      status: "closed",
      end_time: endTime.toISOString(),
      closed_reason: reason, // optional but useful
    })
    .eq("id", dayId)
    .eq("status", "open");

  if (error) throw error;

  // 2️⃣ Fire daily report — fire & forget
  supabase.functions.invoke("analyze-day", {
    body: { dayId, reason },
  });

  return dayId;
}
