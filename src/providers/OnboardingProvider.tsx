import React, { createContext, useContext, useState } from "react";

type OnboardingHabit = {
  label: string;
  color: string;
};

type OnboardingState = {
  // FINAL
  goals: string[];
  categories: string[];
  habits: OnboardingHabit[];

  // DRAFTS
  draftGoals: string[];
  draftCategoryIds: string[];
  draftHabitIds: string[];

  // Other answers
  painPoint: string | null;
  timeAwareness: string | null;

  // setters
  setGoals: React.Dispatch<React.SetStateAction<string[]>>;
  setCategories: React.Dispatch<React.SetStateAction<string[]>>;
  setHabits: React.Dispatch<React.SetStateAction<OnboardingHabit[]>>;

  setDraftGoals: React.Dispatch<React.SetStateAction<string[]>>;
  setDraftCategoryIds: React.Dispatch<React.SetStateAction<string[]>>;
  setDraftHabitIds: React.Dispatch<React.SetStateAction<string[]>>;

  setPainPoint: (v: string) => void;
  setTimeAwareness: (v: string) => void;
};


const OnboardingContext = createContext<OnboardingState | undefined>(undefined);
export function OnboardingProvider({ children }: { children: React.ReactNode }) {
  const [goals, setGoals] = useState<string[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [habits, setHabits] = useState<OnboardingHabit[]>([]);

  const [draftGoals, setDraftGoals] = useState<string[]>(["", "", ""]);
  const [draftCategoryIds, setDraftCategoryIds] = useState<string[]>([]);
  const [draftHabitIds, setDraftHabitIds] = useState<string[]>([]);

  const [painPoint, setPainPoint] = useState<string | null>(null);
  const [timeAwareness, setTimeAwareness] = useState<string | null>(null);

  return (
    <OnboardingContext.Provider
      value={{
        goals,
        categories,
        habits,

        draftGoals,
        draftCategoryIds,
        draftHabitIds,

        painPoint,
        timeAwareness,

        setGoals,
        setCategories,
        setHabits,

        setDraftGoals,
        setDraftCategoryIds,
        setDraftHabitIds,

        setPainPoint,
        setTimeAwareness,
      }}
    >
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboarding() {
  const ctx = useContext(OnboardingContext);
  if (!ctx) throw new Error("useOnboarding must be used inside OnboardingProvider");
  return ctx;
}
