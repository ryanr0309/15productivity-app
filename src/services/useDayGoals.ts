// hooks/useDayGoals.ts
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export function useDayGoals(dayId: string | null) {
  const [goals, setGoals] = useState<string[]>([]);
  const [goalsReady, setGoalsReady] = useState(false);

  useEffect(() => {
    if (!dayId) {
      setGoals([]);
      setGoalsReady(false);
      return;
    }

    async function loadGoals() {
      setGoalsReady(false);

      const { data } = await supabase
        .from("day_goals")
        .select("text")
        .eq("day_id", dayId)
        .order("created_at");

      setGoals(data?.map(g => g.text) ?? []);
      setGoalsReady(true);
    }

    loadGoals();
  }, [dayId]);

  return { goals, goalsReady };
}
