import React, { useState } from "react";
import PainScreen from "../../components/onboarding/OnboardingPain";
import OnboardingDesireScreen from "./OnboardingDesireScreen";
import OnboardingTimeAwarenessScreen from "./OnboardingTimeAwarenessScreen";
import OnboardingCategoryScreen from "./OnboardingCategoryScreen";
import OnboardingHabitScreen from "./HabitsScreen";
import OnboardingGoalsScreen from "./GoalsScreen";
import { router } from "expo-router";
import { useAuth } from "../../hooks/useAuth";
import FunctionalScreenExample from "./Info1";
import ProgressBar from "../../components/onboarding/ProgressBar";
import NotificationsOnboarding from "./notifications";
export default function OnboardingFlow() {
  const [step, setStep] = useState(0);   // 0 → first screen

  const goBack = () => {
    if (step > 0) setStep(step - 1);
  };

  const humanStep = step + 1; // for progress display (1-10)

  const screens = [
    <PainScreen step={humanStep} onContinue={() => setStep(1)} onBack={goBack} />,
    <FunctionalScreenExample step={humanStep} headline="Keeping track of your day in 15 minute intervals increases productivity" image={require("../../assets/images/LogTimeBlock.png")} onContinue={() => setStep(2)} onBack={goBack}/>,
    <OnboardingTimeAwarenessScreen step={humanStep} onContinue={() => setStep(3)} onBack={goBack}/>,
    <FunctionalScreenExample step={humanStep} headline="You dont have to guess anymore" image={require("../../assets/images/TimeBlockScreen.png")} onContinue={() => setStep(4)} onBack={goBack}/>,
    <OnboardingGoalsScreen step={humanStep} onContinue={() => setStep(5)} onBack={goBack}/>,
    <FunctionalScreenExample step={humanStep} headline="AI holds you accountable" image={require("../../assets/images/TwoScreens.png")} onContinue={() => setStep(6)} onBack={goBack}/>,
    <OnboardingCategoryScreen step={humanStep} onContinue={() => setStep(7)} onBack={goBack}/>,
    <FunctionalScreenExample step={humanStep} headline="We give you the full breakdown" image={require("../../assets/images/TimeBreakdown.png")} onContinue={() => setStep(8)} onBack={goBack}/>,
    <OnboardingHabitScreen step={humanStep} onContinue={() => setStep(9)} onBack={goBack}/>,
    <FunctionalScreenExample step={humanStep} headline="You can incorporate these into your day to day routine" image={require("../../assets/images/HabitPlacement.png")} onContinue={() => {setStep(10)}} onBack={goBack}/>,
    <NotificationsOnboarding
  step={humanStep}
  onDone={() => {
    setStep(11);
    router.replace("/signup"); // NOT push

  }}
/>
  ]

  return (
    <>

      {screens[step]}
    </>
  );
}
