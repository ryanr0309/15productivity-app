import React from "react";
import BeginDayScreen from "./BeginDayScreen";
import DayShapeScreen from "./DayShapeScreen";
import HabitsPlacementScreen from "./HabitsPlacementScreen";
import DayLockedScreen from "./DayLockedScreen";
import { supabase } from "../../lib/supabase";
import { ensureTimeBlocksExist } from "../../utils/blocks";



type Props = {
  day: any | null;
  onDayChanged: () => Promise<void>;
};


export default function DayUnlockFlow({ day, onDayChanged }: Props) {
  if (!day) {
    return (
      <BeginDayScreen
        onBeginDay={async () => {
          const {
            data: { user },
          } = await supabase.auth.getUser();

          if (!user) return;

          const { error } = await supabase.from("days").insert({
            user_id: user.id,
            start_time: new Date().toISOString(),
            day_phase: "rhythm",
            status: "open",
            interval_minutes: 15,
          });

          if (error) {
            console.error(error);
            return;
          }

          await onDayChanged(); // 🔑 THIS updates the real openDay
        }}
      />
    );
  }

if (day.day_phase === "rhythm") {
  return (
    <DayShapeScreen
      day={day}
      onContinue={async sleepISO => {
        await supabase
          .from("days")
          .update({
            estimated_sleep_time: sleepISO,
            day_phase: "habits",
          })
          .eq("id", day.id);

        await ensureTimeBlocksExist({
          ...day,
          estimated_sleep_time: sleepISO,
        });

        await onDayChanged();
      }}
    />
  );
}


  if (day.day_phase === "habits") {
    return (
       <HabitsPlacementScreen
      dayId={day.id} // 🔑 THIS WAS MISSING
      onContinue={async blocks => {
  const updates = blocks.map(b =>
    supabase
      .from("time_blocks")
      .update({ habit_id: b.habit_id })
      .eq("id", b.id)
  );

  const results = await Promise.all(updates);

  const error = results.find(r => r.error)?.error;
  if (error) {
    console.error("Failed to save habit placements", error);
    return;
  }

  await supabase
    .from("days")
    .update({ day_phase: "locked" })
    .eq("id", day.id);

  await onDayChanged();
}}


    />
    );
  }

  return <DayLockedScreen onEnterToday={() => {}} />;
}
