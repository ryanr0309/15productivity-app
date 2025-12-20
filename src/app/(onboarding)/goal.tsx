import React from "react";
import OnboardingQuestionScreen from "../../components/onboarding/OnboardingQuestionScreen";
import { router } from "expo-router";

export default function GoalScreen() {
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
      onContinue={(value) => {
        console.log("Goal:", value);
        router.push("/(onboarding)/challenge");
      }}
    />
  );
}
