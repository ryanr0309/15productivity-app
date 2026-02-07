// lib/review.ts
import * as StoreReview from "expo-store-review";
import AsyncStorage from "@react-native-async-storage/async-storage";

const REVIEW_KEY = "has_requested_review";

export async function maybeRequestReviewOnce() {
  try {
    const alreadyAsked = await AsyncStorage.getItem(REVIEW_KEY);
    if (alreadyAsked) return;

    const available = await StoreReview.isAvailableAsync();
    if (!available) return;

    await AsyncStorage.setItem(REVIEW_KEY, "true");

    // small delay so it feels intentional, not abrupt
    setTimeout(() => {
      StoreReview.requestReview();
    }, 500);
  } catch {
    // fail silently — never block UX
  }
}
