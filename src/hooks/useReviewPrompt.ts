/**
 * hooks/useReviewPrompt.ts
 *
 * Triggers the native iOS App Store review prompt after the user completes
 * their FIRST natural focus session (stayed the full duration, didn't stop early).
 *
 * Rules:
 *  - Only fires once ever (stored in AsyncStorage)
 *  - Only fires on natural session completion (not manual stop)
 *  - Waits 1.5s after session end so the celebration UI shows first
 *  - iOS rate-limits the prompt to 3× per year regardless — this just
 *    requests it at the right moment
 *
 * Usage in your session completion handler:
 *   const { maybeRequestReview } = useReviewPrompt();
 *   // call after natural session end:
 *   await maybeRequestReview();
 */

import { useCallback } from 'react';
import * as StoreReview from 'expo-store-review';
import AsyncStorage from '@react-native-async-storage/async-storage';

const REVIEW_PROMPTED_KEY = '@ember/reviewPrompted';

export function useReviewPrompt() {
  const maybeRequestReview = useCallback(async () => {
    try {
      // Check if we've already prompted
      const alreadyPrompted = await AsyncStorage.getItem(REVIEW_PROMPTED_KEY);
      if (alreadyPrompted) return;

      // Check if the device supports the review API
      const isAvailable = await StoreReview.isAvailableAsync();
      if (!isAvailable) return;

      // Wait a beat so the session complete UI renders first
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Request the review
      await StoreReview.requestReview();

      // Mark as prompted so we never show it again
      await AsyncStorage.setItem(REVIEW_PROMPTED_KEY, 'true');
    } catch (e) {
      // Never crash the app over a review prompt
      console.warn('[Ember] Review prompt error:', e);
    }
  }, []);

  return { maybeRequestReview };
}
