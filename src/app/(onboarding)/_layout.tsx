// app/(onboarding)/_layout.tsx
import { Slot } from "expo-router";
import { OnboardingProvider } from "../../providers/OnboardingProvider";
import React from "react";

export default function OnboardingLayout() {

  return (
  <OnboardingProvider>
  <Slot />
  </OnboardingProvider>
)
}
