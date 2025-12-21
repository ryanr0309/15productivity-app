import { useState } from "react";
import OnboardingQuestionScreen from "../../components/onboarding/OnboardingQuestionScreen";
import { router } from "expo-router";
import React from "react";

export default function ChallengeScreen() {
  const [challenge, setChallenge] = useState<string | null>(null);

  function handleContinue() {
    if (!challenge) return;

    console.log("Challenge:", challenge);

    // TODO: save to Supabase later
    router.push("/(onboarding)/impact");
  }

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
      selectedId={challenge}
      onSelect={(id) => setChallenge(id)}
      onBack={() => router.back()}
      onContinue={handleContinue}
    />
  );
}

