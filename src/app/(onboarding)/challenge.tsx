import React from "react";
import OnboardingQuestionScreen from "../../components/onboarding/OnboardingQuestionScreen";
import { router } from "expo-router";

export default function ChallengeScreen() {
  return (
    <OnboardingQuestionScreen
      question="What do you struggle with the most?"
      subtitle="Choose the biggest challenge holding you back"
      options={[
        { id: "procrastination", label: "Procrastination" },
        { id: "distractions", label: "Constant distractions" },
        { id: "energy", label: "Low energy or motivation" },
        { id: "planning", label: "Poor planning or structure" },
      ]}
      onBack={() => router.back()}
      onContinue={() => router.push("/(onboarding)/impact")}
    />
  );
}
