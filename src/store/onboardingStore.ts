import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';

const KEY = 'ember_onboarding_complete';
const SELECTION_KEY = 'ember_screen_time_selection_id';

interface OnboardingState {
  // User answers collected across screens
  focusStealer:          string | null;   // screen 3
  focusWindow:           string | null;   // screen 4
  protectTime:           string | null;   // screen 5
  dailyPhoneHours:       number | null;   // screen 6
  age:                   number | null;
  screenTimeSelectionId: string | null;   // screen 15 — persisted separately

  // Completion flag
  isComplete: boolean;

  // Actions
  setAnswer:                (field: keyof OnboardingAnswers, value: string | number) => void;
  setScreenTimeSelectionId: (id: string | null) => Promise<void>;
  loadScreenTimeSelectionId: () => Promise<void>;
  completeOnboarding:       () => Promise<void>;
  checkComplete:            () => Promise<boolean>;
}

type OnboardingAnswers = Pick<
  OnboardingState,
  'focusStealer' | 'focusWindow' | 'protectTime' | 'dailyPhoneHours' | 'age'
>;

export const useOnboardingStore = create<OnboardingState>((set) => ({
  focusStealer:          null,
  focusWindow:           null,
  protectTime:           null,
  dailyPhoneHours:       null,
  age:                   null,
  screenTimeSelectionId: null,
  isComplete:            false,

  // Generic setter for quiz answers
  setAnswer: (field, value) => set({ [field]: value }),

  // ── Screen Time selection ─────────────────────────────────────────────
  // Persisted to AsyncStorage separately from onboarding completion so it
  // survives app restarts — the session screen needs it every time.
  setScreenTimeSelectionId: async (id) => {
    if (id) {
      await AsyncStorage.setItem(SELECTION_KEY, id);
    } else {
      await AsyncStorage.removeItem(SELECTION_KEY);
    }
    set({ screenTimeSelectionId: id });
  },

  // Call once on app start (e.g. in _layout.tsx) to rehydrate the selection
  loadScreenTimeSelectionId: async () => {
    try {
      const id = await AsyncStorage.getItem(SELECTION_KEY);
      set({ screenTimeSelectionId: id ?? null });
    } catch {
      // non-fatal — blocking just won't be active until user re-selects
    }
  },

  // ── Onboarding completion ─────────────────────────────────────────────
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
