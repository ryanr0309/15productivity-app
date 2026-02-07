import { useEffect, useState, useCallback, useRef } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../hooks/useAuth";
import { closeDay } from "../utils/dayLifecycle";

async function maybeAutoEndDay(day: any): Promise<string | null> {
  if (!day?.start_time || day.status !== "open") return null;

  const start = new Date(day.start_time);
  const now = new Date();
  
const hoursElapsed =
  (now.getTime() - start.getTime()) / (1000 * 60 * 60);

if (hoursElapsed < 36) return null;


  // find last logged block
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

  let actualEnd = estimatedSleep ?? lastLoggedEnd ?? start;

  if (lastLoggedEnd && estimatedSleep && lastLoggedEnd > estimatedSleep) {
    actualEnd = lastLoggedEnd;
  }

  await closeDay({
    dayId: day.id,
    endTime: actualEnd,
    reason: "auto",
  });

  return day.id; // 👈 THIS is the key
}



export function useOpenDay() {
  const { userId, authReady: authLoading } = useAuth();

  const [openDay, setOpenDay] = useState<any | null>(null);
  const [openDayChecked, setOpenDayChecked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [autoClosed, setAutoClosed] = useState(false);


  const [justClosedDayId, setJustClosedDayId] = useState<string | null>(null);

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

    // 🔒 AUTO-CLOSE CHECK
    const closedDayId = await maybeAutoEndDay(data); // 👈 CHANGE

    if (closedDayId) {
  setJustClosedDayId(closedDayId);
  setAutoClosed(true);
  setOpenDay(null);
  return;
}



    // still open
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
    reloadOpenDay: loadOpenDay, 
     justClosedDayId, // ✅ works now
  };
}

