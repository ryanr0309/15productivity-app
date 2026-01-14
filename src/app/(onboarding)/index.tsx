import React, { useState } from "react";
import PainScreen from "../../components/onboarding/OnboardingPain";
import OnboardingDesireScreen from "./OnboardingDesireScreen";
import OnboardingTimeAwarenessScreen from "./OnboardingTimeAwarenessScreen";
import OnboardingCategoryScreen from "./OnboardingCategoryScreen";
import OnboardingHabitScreen from "./HabitsScreen";
import OnboardingGoalsScreen from "./GoalsScreen";
import { router } from "expo-router";
import { useAuth } from "../../hooks/useAuth";


export default function OnboardingFlow() {
  const [step, setStep] = useState(0);

  const screens = [
    <OnboardingGoalsScreen onContinue={() => setStep(1)}/>,
    <PainScreen onContinue={() => setStep(2)} />,
    <OnboardingDesireScreen onContinue={() => setStep(3)} />,
    <OnboardingTimeAwarenessScreen onContinue={() => setStep(4)}/>,
    <OnboardingCategoryScreen onContinue={() => setStep(5)}/>,
    <OnboardingHabitScreen onContinue={() => {
      router.replace("signup")

    }}/>,
    
    
  ]
  return screens[step];
}
