import { useState } from "react";
import OnboardingQuestionScreen from "../../components/onboarding/OnboardingQuestionScreen";
import { router } from "expo-router";
import React from "react";

export default function ImpactScreen() {
  const [impact, setImpact] = useState<string | null>(null);

  function handleContinue() {
    if (!impact) return;

 

    // TODO: save to Supabase later
    router.push("/(onboarding)/frequency");
  }

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
      selectedId={impact}
      onSelect={(id) => setImpact(id)}
      onBack={() => router.back()}
      onContinue={handleContinue}
    />
  );
}
