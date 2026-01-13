import React, { createContext, useContext, useState } from "react";

type OnboardingState = {
  goals: string[];
  categories: string[];
  habits: string[];
  setGoals: React.Dispatch<React.SetStateAction<string[]>>;
  setCategories: React.Dispatch<React.SetStateAction<string[]>>;
  setHabits: React.Dispatch<React.SetStateAction<string[]>>;
};

const OnboardingContext = createContext<OnboardingState | undefined>(undefined);

type Props = {
  children: React.ReactNode;
};

export function OnboardingProvider({ children }: Props) {
  const [goals, setGoals] = useState<string[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [habits, setHabits] = useState<string[]>([]);

  return (
    <OnboardingContext.Provider
      value={{
        goals,
        setGoals,
        categories,
        setCategories,
        habits,
        setHabits,
      }}
    >
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboarding() {
  const ctx = useContext(OnboardingContext);
  if (!ctx) {
    throw new Error("useOnboarding must be used inside an OnboardingProvider");
  }
  return ctx;
}
