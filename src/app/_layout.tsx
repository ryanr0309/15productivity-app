/**
 * app/_layout.tsx  (ROOT)
 */

import { useEffect, useState } from 'react';
import { Linking } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { rehydrateSession } from '../store/sessionStore';
import React from 'react';
import { hasCompletedOnboarding, hasSeenScreenTimePrompt, useOnboardingStore } from '../store/onboardingStore';
import Purchases from 'react-native-purchases';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { setupNotificationTapHandler } from '../lib/sessionNotifications';

const RC_API_KEY = 'appl_oAPrSJxAenzObkBRjVsJJlnudRM';

export default function RootLayout() {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  const { loadScreenTimeSelectionId } = useOnboardingStore();

  useEffect(() => { loadScreenTimeSelectionId(); }, []);
  
  useEffect(() => {
      const sub = setupNotificationTapHandler();
      return () => sub.remove();
  }, []);

  useEffect(() => {
    async function bootstrap() {
      // ── 1. Configure RevenueCat FIRST, synchronously, before anything else.
      //       This must happen before any Purchases.* call anywhere in the app.
      //       Previously this line was commented out — that caused every RC call
      //       to throw "no singleton instance".
   
        Purchases.configure({ apiKey: RC_API_KEY });
      

      // ── 2. DEV ONLY — wipe persisted state so you always start fresh.
      //       Remove this block before shipping to production.
      // if (__DEV__) {
      //   await AsyncStorage.multiRemove([
      //     'ember_session_v1',
      //     'ember_onboarding_complete',
      //     'ember_screen_time_selection_id',
      //     'ember_screen_time_seen',
      //   ]);
      // }

      // ── 3. Check onboarding state and route accordingly.
      const [onboarded, seenScreenTime] = await Promise.all([
        hasCompletedOnboarding(),
        hasSeenScreenTimePrompt(),
      ]);

      if (!onboarded) {
        router.replace('/(onboarding)');
        setReady(true);
        return;
      }

      if (!seenScreenTime) {
        router.replace('/(onboarding)/screentime');
        setReady(true);
        return;
      }

      // ── 4. Returning user — check for live session.
      const hadSession = await rehydrateSession();
      if (hadSession) {
        router.replace('/session');
      } else {
        router.replace('/(protected)/(tabs)');
      }

      setReady(true);
    }

    bootstrap();
  }, []);

  if (!ready) {
    console.log('not ready');
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(onboarding)" />
      <Stack.Screen name="(protected)" />
    </Stack>
  );
}
