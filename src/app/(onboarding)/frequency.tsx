import React from "react";
import OnboardingQuestionScreen from "../../components/onboarding/OnboardingQuestionScreen";
import { router } from "expo-router";

export default function FrequencyScreen() {
  return (
    <OnboardingQuestionScreen
      question="How often do you want to log your activity?"
      subtitle="Choose how frequently you want to check in"
      options={[
        {
          id: "15",
          label: "Every 15 minutes (maximum accuracy) ⏱️",
        },
        {
          id: "30",
          label: "Every 30 minutes (balanced) ⚖️",
        },
        {
          id: "45",
          label: "Every 45 minutes (lighter touch) 🌙",
        },
        {
          id: "60",
          label: "Every 60 minutes (low interruption) 🕒",
        }
      ]}
      onBack={() => router.back()}
      onContinue={(value) => {
        console.log("Logging frequency:", value);

        // Later: save to Supabase (interval_minutes)
        // await supabase.from("users").update({ interval_minutes: Number(value) })

        router.push("/(onboarding)/categories"); // or next step
      }}
    />
  );
}
