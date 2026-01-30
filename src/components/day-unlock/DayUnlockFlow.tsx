import React from "react";
import BeginDayScreen from "./BeginDayScreen";
import HabitsPlacementScreen from "./HabitsPlacementScreen";
import { supabase } from "../../lib/supabase";
import { ensureTimeBlocksExist } from "../../utils/blocks";
import { useData } from "../../providers/DataProvider";
import { Text, View } from "react-native";
import { HomeLoadingScreen } from "./Preparing";
import HabitsPlacementLoadingScreen from "../habits/HabitLoading";

type Props = {
  day: any | null;
  onDayChanged: () => Promise<void>;
};

export default function DayUnlockFlow({ day, onDayChanged }: Props) {
  const { preloadHome, homeReady, reloadOpenDay, markHomeReady } = useData();

  /* ──────────────────────────────────────────────
   * 1️⃣ No day → Begin flow
   * ────────────────────────────────────────────── */
  if (!day) {
    return (
      <BeginDayScreen
        onBeginDay={async (estimatedSleep) => {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) return;

          const now = new Date();

          const { data: newDay, error } = await supabase
            .from("days")
            .insert({
              user_id: user.id,
              start_time: now.toISOString(),
              estimated_sleep_time: estimatedSleep.toISOString(),
              status: "open",
              day_phase: "habits", // 🔥 jump straight to habits
              interval_minutes: 15,
            })
            .select()
            .single();

          if (error) {
            console.error("BeginDay failed:", error);
            return;
          }

          // generate blocks before habits screen
          await ensureTimeBlocksExist(newDay);

          await onDayChanged();
        }}
      />
    );
  }

  /* ──────────────────────────────────────────────
   * 2️⃣ Habits placement
   * ────────────────────────────────────────────── */
  if (day.day_phase === "habits") {
    return (
      <HabitsPlacementScreen
        dayId={day.id}
        onContinue={async (blocks) => {
  

  // 1. Save habit mappings
  await Promise.all(blocks.map(b =>
    supabase.from("time_blocks")
      .update({ habit_id: b.habit_id })
      .eq("id", b.id)
  ));



  // 2. Ensure blocks
  await ensureTimeBlocksExist(day);


  // 3. Lock day
  await supabase
    .from("days")
    .update({ day_phase: "locked" })
    .eq("id", day.id);

 

  // 4. Reload openDay (critical)
  await reloadOpenDay();
 

  // 5. Preload blocks for Home
  await preloadHome();


  // 6. Mark ready for Home
  markHomeReady();

}}

      />
    );
  }

  /* ──────────────────────────────────────────────
   * 3️⃣ Locked BUT still loading home data
   * ────────────────────────────────────────────── *

  /* ──────────────────────────────────────────────
   * 4️⃣ Locked + homeReady → exit unlock flow
   * parent will render Home
   * ────────────────────────────────────────────── */
  return (
    <HabitsPlacementLoadingScreen/>
  )
}

