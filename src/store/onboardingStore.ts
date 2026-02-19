
import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';

const KEY = 'ember_onboarding_complete';

interface OnboardingState {
  // User answers collected across screens
  focusStealer:    string | null;   // screen 3
  focusWindow:     string | null;   // screen 4
  protectTime:     string | null;   // screen 5
  dailyPhoneHours: number | null;   // screen 6
  // store/onboardingStore.ts — add to state shape
  age: number | null;

// setAnswer call is already generic so it just works:


  // Completion flag
  isComplete: boolean;

  // Actions
  setAnswer:          (field: keyof OnboardingAnswers, value: string | number) => void;
  completeOnboarding: () => Promise<void>;
  checkComplete:      () => Promise<boolean>;
}

type OnboardingAnswers = Pick<
  OnboardingState,
  'focusStealer' | 'focusWindow' | 'protectTime' | 'dailyPhoneHours' | 'age' // add age to answers type
>;

export const useOnboardingStore = create<OnboardingState>((set) => ({
  focusStealer:    null,
  focusWindow:     null,
  protectTime:     null,
  dailyPhoneHours: null,
  age: null,
  isComplete:      false,

  setAnswer: (field, value) => set({ [field]: value }),

  completeOnboarding: async () => {
    await AsyncStorage.setItem(KEY, 'true');
    set({ isComplete: true });
  },

  checkComplete: async () => {
    const val = await AsyncStorage.getItem(KEY);
    const done = val === 'true';
    set({ isComplete: done });
    return done;
  },
}));

export async function hasCompletedOnboarding(): Promise<boolean> {
  try {
    const val = await AsyncStorage.getItem(KEY);
    return val === 'true';
  } catch {
    return false;
  }
}