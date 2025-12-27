import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

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

      setOpenDay(data ?? null);
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
