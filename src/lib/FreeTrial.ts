import AsyncStorage from "@react-native-async-storage/async-storage";

const FREE_TRIAL_KEY = "free_trial_dismissed";

export async function markFreeTrialDismissed() {
  await AsyncStorage.setItem(FREE_TRIAL_KEY, "true");
}

export async function hasDismissedFreeTrial() {
  const value = await AsyncStorage.getItem(FREE_TRIAL_KEY);
  return value === "true";
}
