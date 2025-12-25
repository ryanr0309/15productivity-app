import { supabase } from "./supabase";

export async function closeOpenDay({
  userId,
  sleepTime,
}: {
  userId: string;
  sleepTime: Date;
}) {
  // 1️⃣ Fetch the open day
  const { data: openDay, error: fetchError } = await supabase
    .from("days")
    .select("id")
    .eq("user_id", userId)
    .eq("status", "open")   // ✅ correct column
    .single();

  if (fetchError || !openDay) {
    throw new Error("No open day to close");
  }

  // 2️⃣ Close the day (save sleep time)
  const { error: closeError } = await supabase
    .from("days")
    .update({
      end_time: sleepTime.toISOString(), // ✅ correct column
      status: "closed",
    })
    .eq("id", openDay.id);

  if (closeError) throw closeError;

  // 3️⃣ DELETE blocks that start after sleep
  const { error: deleteError } = await supabase
    .from("time_blocks")
    .delete()
    .eq("day_id", openDay.id)
    .gte("start_time", sleepTime.toISOString());

  if (deleteError) throw deleteError;

  // 4️⃣ Mark remaining unfinished blocks as missed
  const { error: missError } = await supabase
  .from("time_blocks")
  .update({ status: "missed" })
  .eq("day_id", openDay.id)
  .is("status", null); // 👈 unfinished blocks


  if (missError) throw missError;

  return openDay.id;
}

