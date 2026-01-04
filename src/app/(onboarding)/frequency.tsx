import React from "react";
import { useState } from "react";
import { supabase } from "../../lib/supabase";
import OnboardingQuestionScreen from "../../components/onboarding/OnboardingQuestionScreen";
import { router } from "expo-router";
export default function FrequencyScreen() {

  const [intervalMinutes, setIntervalMinutes] = useState<number | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  React.useEffect(() => {
    async function loadUser() {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

    if (error || !user) {
      console.error("No authenticated user");
      return;
    }

      setUserId(user.id);
    }

  loadUser();
}, []);


async function handleContinue() {

  if (!intervalMinutes || !userId) return;

  const { error } = await supabase
    .from("user_settings")
    .upsert({
      user_id: userId,
      interval_minutes: intervalMinutes,
    });

  if (error) {
    console.error("Failed to save interval", error);
    return;
  }

  router.push("/(onboarding)/schedule");
}



  return (
    <OnboardingQuestionScreen
  question="How often do you want to log your activity?"
  subtitle="Choose how frequently you want to check in"
  options={[
    { id: "15", label: "Every 15 minutes (maximum accuracy) ⏱️" },
    { id: "30", label: "Every 30 minutes (balanced) ⚖️" },
    { id: "45", label: "Every 45 minutes (lighter touch) 🌙" },
    { id: "60", label: "Every 60 minutes (low interruption) 🕒" },
  ]}
  selectedId={intervalMinutes?.toString() ?? null}
  onSelect={(id) => setIntervalMinutes(Number(id))}
  onBack={() => router.back()}
  onContinue={handleContinue}
/>

  );
}
