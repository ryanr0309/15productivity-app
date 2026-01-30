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
import SignupAuthScreen from "./signup";
import PersonalizedPlanLoading from "../../components/onboarding/Personalized";


export default function OnboardingFlow() {
  const [step, setStep] = useState(0);   // 0 → first screen

  const goBack = () => {
    if (step > 0) setStep(step - 1);
  };

  const humanStep = step + 1; // for progress display (1-10)
const screens = [
  <PainScreen
    step={humanStep}
    onContinue={() => setStep(1)}
    onBack={() => router.replace("/(auth)/welcome")}
  />,

  <FunctionalScreenExample
    step={humanStep}
    onBack={() => setStep(0)}
    headline="Select one or multiple 15 minute blocks and log your time in ONLY 3 taps"
    image={require("../../assets/images/LogTimeBlock.png")}
    onContinue={() => setStep(2)}
  />,

  <OnboardingTimeAwarenessScreen
    step={humanStep}
    onContinue={() => setStep(3)}
    onBack={goBack}
  />,

  <FunctionalScreenExample
    step={humanStep}
    onBack={() => setStep(2)}
    headline="You don't have to keep guessing. Awareness help you become more productive"
    image={require("../../assets/images/TimeBlockScreen.png")}
    onContinue={() => setStep(4)}
  />,

  <OnboardingGoalsScreen
    step={humanStep}
    onContinue={() => setStep(5)}
    onBack={goBack}
  />,

  <FunctionalScreenExample
    step={humanStep}
    onBack={() => setStep(4)}
    headline="AI holds you accountable with personalized insights and suggestions"
    image={require("../../assets/images/TwoScreens.png")}
    onContinue={() => setStep(6)}
  />,

  <OnboardingCategoryScreen
    step={humanStep}
    onContinue={() => setStep(7)}
    onBack={goBack}
  />,

  <FunctionalScreenExample
    step={humanStep}
    onBack={() => setStep(6)}
    headline="We give you the full breakdown of your day's time usage"
    image={require("../../assets/images/TimeBreakdown.png")}
    onContinue={() => setStep(8)}
  />,

  <OnboardingHabitScreen
    step={humanStep}
    onContinue={() => setStep(9)}
    onBack={goBack}
  />,

  <FunctionalScreenExample
    step={humanStep}
    onBack={() => setStep(8)}
    headline="You can incorporate these into your day to day routine"
    image={require("../../assets/images/HabitPlacement.png")}
    onContinue={() => setStep(10)}
  />,

  <NotificationsOnboarding
    step={humanStep}
    onBack={() => setStep(9)}
    onDone={() => setStep(11)}
  />,

  <PersonalizedPlanLoading onDone={()=>setStep(12)}/>,

  // 👇 SIGN UP STEP
  <SignupAuthScreen
    onBack={() => setStep(10)}
    onSuccess={() => router.replace("/(protected)")}
  />,
];


  return (
    <>

      {screens[step]}
    </>
  );
}
