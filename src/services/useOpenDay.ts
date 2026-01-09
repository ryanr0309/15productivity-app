import { useEffect, useState, useCallback, useRef } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../hooks/useAuth";
import { closeDay } from "../utils/dayLifecycle";

async function maybeAutoEndDay(day: any): Promise<boolean> {
  if (!day?.start_time || day.status !== "open") return false;

  const start = new Date(day.start_time);
  const now = new Date();

  const hoursElapsed =
    (now.getTime() - start.getTime()) / (1000 * 60 * 60);

  // ⛔ Not time yet
  if (hoursElapsed < 36) return false;

  // 1️⃣ Find last logged block
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

  // 2️⃣ actualEnd = max(lastLoggedEnd, estimatedSleep, fallback=start)
  let actualEnd = estimatedSleep ?? null;

  if (
    lastLoggedEnd &&
    (!actualEnd || lastLoggedEnd > actualEnd)
  ) {
    actualEnd = lastLoggedEnd;
  }

  if (!actualEnd) {
    actualEnd = start;
  }

  // 3️⃣ Close via unified lifecycle
  await closeDay({
    dayId: day.id,
    endTime: actualEnd,
    reason: "auto",
  });

  return true;
}



export function useOpenDay() {
  const { userId, authReady: authLoading } = useAuth();

  const [openDay, setOpenDay] = useState<any | null>(null);
  const [openDayChecked, setOpenDayChecked] = useState(false);
  const [loading, setLoading] = useState(false);

  const inFlightRef = useRef(false);
  

  const loadOpenDay = useCallback(async () => {
    if (!userId) {
      setOpenDay(null);
      setOpenDayChecked(true);
      return;
    }

    if (inFlightRef.current) return;
    inFlightRef.current = true;

    setLoading(true);
    try {
      const { data } = await supabase
        .from("days")
        .select("*")
        .eq("user_id", userId)
        .eq("status", "open")
        .maybeSingle();

      if (!data) {
  setOpenDay(null);
  return;
}

// 🔒 AUTO-CLOSE CHECK (36h rule)
const didAutoEnd = await maybeAutoEndDay(data);

if (didAutoEnd) {
  // Day was closed — reload to get the new state
  setOpenDay(null);
  return;
}

setOpenDay(data);

    } catch (err) {
      console.error("Failed to load open day", err);
      setOpenDay(null);
    } finally {
      setOpenDayChecked(true);
      setLoading(false);
      inFlightRef.current = false;
    }
  }, [userId]);

  useEffect(() => {
    if (authLoading) return;
    loadOpenDay();
  }, [authLoading, loadOpenDay]);



  

  return {
    openDay,
    openDayChecked,
    loading,
    reloadOpenDay: loadOpenDay, // ✅ works now
  };
}

