import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';

const KEY                  = 'ember_onboarding_complete';
const SELECTION_KEY        = 'ember_screen_time_selection_id';
const SCREEN_TIME_SEEN_KEY = 'ember_screen_time_seen';

interface OnboardingState {
  focusStealer:          string | null;
  focusWindow:           string | null;
  protectTime:           string | null;
  dailyPhoneHours:       number | null;
  age:                   number | null;
  screenTimeSelectionId: string | null;

  isComplete:              boolean;
  hasSeenScreenTimePrompt: boolean;

  setAnswer:                  (field: keyof OnboardingAnswers, value: string | number) => void;
  setScreenTimeSelectionId:   (id: string | null) => Promise<void>;
  loadScreenTimeSelectionId:  () => Promise<void>;
  setHasSeenScreenTimePrompt: () => Promise<void>;
  completeOnboarding:         () => Promise<void>;
  checkComplete:              () => Promise<boolean>;
}

type OnboardingAnswers = Pick<
  OnboardingState,
  'focusStealer' | 'focusWindow' | 'protectTime' | 'dailyPhoneHours' | 'age'
>;

export const useOnboardingStore = create<OnboardingState>((set) => ({
  focusStealer:            null,
  focusWindow:             null,
  protectTime:             null,
  dailyPhoneHours:         null,
  age:                     null,
  screenTimeSelectionId:   null,
  isComplete:              false,
  hasSeenScreenTimePrompt: false,

  setAnswer: (field, value) => set({ [field]: value }),

  setScreenTimeSelectionId: async (id) => {
    if (id) {
      await AsyncStorage.setItem(SELECTION_KEY, id);
    } else {
      await AsyncStorage.removeItem(SELECTION_KEY);
    }
    set({ screenTimeSelectionId: id });
  },

  loadScreenTimeSelectionId: async () => {
    try {
      const id = await AsyncStorage.getItem(SELECTION_KEY);
      set({ screenTimeSelectionId: id ?? null });
    } catch {
      // non-fatal
    }
  },

  // Call on both Confirm AND Skip in screen-time.tsx so the user is never
  // re-prompted on next launch regardless of which path they took.
  setHasSeenScreenTimePrompt: async () => {
    await AsyncStorage.setItem(SCREEN_TIME_SEEN_KEY, 'true');
    set({ hasSeenScreenTimePrompt: true });
  },

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

// ── Standalone async helpers for _layout.tsx boot ────────────────────────────
// Read AsyncStorage directly so the root layout can check both flags in
// parallel before the Zustand store has hydrated, preventing a flash of the
// wrong screen on cold start.

export async function hasCompletedOnboarding(): Promise<boolean> {
  try {
    return (await AsyncStorage.getItem(KEY)) === 'true';
  } catch {
    return false;
  }
}

export async function hasSeenScreenTimePrompt(): Promise<boolean> {
  try {
    return (await AsyncStorage.getItem(SCREEN_TIME_SEEN_KEY)) === 'true';
  } catch {
    return false;
  }
}
