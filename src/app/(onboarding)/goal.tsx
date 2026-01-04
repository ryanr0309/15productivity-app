import { useState } from "react";
import { router } from "expo-router";
import OnboardingQuestionScreen from "../../components/onboarding/OnboardingQuestionScreen";
import React from "react";

export default function GoalScreen() {
  const [goal, setGoal] = useState<string | null>(null);

  function handleContinue() {
    if (!goal) return;

    // TODO: save to Supabase later
    router.push("/(onboarding)/challenge");
  }

  return (
    <OnboardingQuestionScreen
      question="What is your #1 goal right now?"
      subtitle="Choose what you want to improve the most"
      options={[
        { id: "focus", label: "Staying focused and avoiding distractions 🎯" },
        { id: "productivity", label: "Getting more done in less time ⚡" },
        { id: "habits", label: "Building better daily habits 🧠" },
        { id: "stress", label: "Reducing stress and feeling more in control 🧘" },
        { id: "progress", label: "Making consistent progress toward my goals 📈" },
      ]}
      selectedId={goal}
      onSelect={(id) => setGoal(id)}
      onContinue={handleContinue}
    />
  );
}
