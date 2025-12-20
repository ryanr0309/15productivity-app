import React from "react";
import OnboardingQuestionScreen from "../../components/onboarding/OnboardingQuestionScreen";
import { router } from "expo-router";

export default function ImpactScreen() {
  return (
    <OnboardingQuestionScreen
      question="How would fixing this improve your life?"
      subtitle="Think about the outcome you want"
      options={[
        { id: "confidence", label: "I’d feel more confident" },
        { id: "calm", label: "I’d feel calmer and less stressed" },
        { id: "control", label: "I’d feel in control of my time" },
        { id: "success", label: "I’d make faster progress toward success" },
      ]}
      onBack={() => router.back()}
      onContinue={() => router.push("/(onboarding)/frequency")}
    />
  );
}
