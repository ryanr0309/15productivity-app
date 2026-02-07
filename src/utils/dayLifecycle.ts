import { supabase } from "../lib/supabase";

import { floorTo15Minutes } from "../utils/time";

export async function closeDay({
  dayId,
  endTime,
  reason,
}: {
  dayId: string;
  endTime: Date;
  reason: "manual" | "auto";
}): Promise<string> {
  const flooredEndTime = floorTo15Minutes(endTime);

  // 1️⃣ Close the day (snapped)
  const { error: dayError } = await supabase
    .from("days")
    .update({
      status: "closed",
      end_time: flooredEndTime.toISOString(),
      closed_reason: reason,
    })
    .eq("id", dayId)
    .eq("status", "open");

  if (dayError) throw dayError;

  // 2️⃣ Mark only blocks that truly started before end_time
  const { error: blocksError } = await supabase
    .from("time_blocks")
    .update({ status: "missed" })
    .eq("day_id", dayId)
    .in("status", ["upcoming", "active"])
    .lt("start_time", flooredEndTime.toISOString());

  if (blocksError) throw blocksError;

  // 3️⃣ Fire daily report
  supabase.functions.invoke("analyze-day", {
    body: { dayId, reason },
  });

  return dayId;
}

