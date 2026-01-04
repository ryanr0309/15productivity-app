import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

async function maybeAutoEndDay(day: any) {
  if (!day?.start_time || day.status !== "open") return;

  const start = new Date(day.start_time);
  const now = new Date();

  const hoursElapsed =
    (now.getTime() - start.getTime()) / (1000 * 60 * 60);


  // ⛔ Not time yet
  if (hoursElapsed < 36) return;

  // 1️⃣ Get last logged block
  const { data: lastBlock } = await supabase
    .from("time_blocks")
    .select("end_time")
    .eq("day_id", day.id)
    .eq("status", "logged")
    .order("end_time", { ascending: false })
    .limit(1)
    .maybeSingle();


  const estimatedSleep = day.estimated_sleep_time
    ? new Date(day.estimated_sleep_time)
    : null;

  const lastLoggedEnd = lastBlock
    ? new Date(lastBlock.end_time)
    : null;

  // 2️⃣ Decide actual end time
  let actualEnd: Date | null = estimatedSleep;

  if (
    lastLoggedEnd &&
    (!actualEnd || lastLoggedEnd > actualEnd)
  ) {
    actualEnd = lastLoggedEnd;
  }

  // Fallback safety
  if (!actualEnd) {
    actualEnd = start;
  }

  // 3️⃣ End the day
  await supabase
    .from("days")
    .update({
      status: "closed",
      end_time: actualEnd.toISOString(),
      day_phase: "locked",
    })
    .eq("id", day.id);
}


export function useOpenDay() {
  const [openDay, setOpenDay] = useState<any | null>(null);
  const [openDayChecked, setOpenDayChecked] = useState(false);
  const [loading, setLoading] = useState(false);

  async function loadOpenDay() {
    setLoading(true);

    try {
      const { data: auth } = await supabase.auth.getUser();

      if (!auth?.user) {
        setOpenDay(null);
        return;
      }

      const { data } = await supabase
  .from("days")
  .select("*")
  .eq("user_id", auth.user.id)
  .eq("status", "open")
  .maybeSingle();

if (data) {
  await maybeAutoEndDay(data);

  // Re-fetch in case it was just ended
  const { data: refreshed } = await supabase
    .from("days")
    .select("*")
    .eq("user_id", auth.user.id)
    .eq("status", "open")
    .maybeSingle();

  setOpenDay(refreshed ?? null);
} else {
  setOpenDay(null);
}

    } catch (err) {
      console.error("Failed to load open day", err);
      setOpenDay(null);
    } finally {
      setOpenDayChecked(true);
      setLoading(false);
    }
  }

  useEffect(() => {
    loadOpenDay();
  }, []);

  return {
    openDay,
    openDayChecked,
    loading,
    reloadOpenDay: loadOpenDay,
  };
}
