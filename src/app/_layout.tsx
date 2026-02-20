/**
 * app/_layout.tsx  (ROOT)
 *
 * Fix: router.replace() called before Expo Router is mounted = silent fail.
 * Solution: separate the "check for session" step from the "navigate" step.
 * We store the result in state, then navigate inside a useEffect that runs
 * AFTER the Stack has rendered (i.e. router is ready).
 */

import { useEffect, useRef, useState } from 'react';
import { View, ActivityIndicator, StyleSheet, Linking } from 'react-native';
import { SplashScreen, Stack, router, useRouter } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { rehydrateSession, useSessionStore } from '../store/sessionStore';
import React from 'react';
import { hasCompletedOnboarding, hasSeenScreenTimePrompt, useOnboardingStore } from '../store/onboardingStore';
import Purchases from 'react-native-purchases';
import AsyncStorage from '@react-native-async-storage/async-storage';



export default function RootLayout() {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  const { loadScreenTimeSelectionId } = useOnboardingStore();

useEffect(() => { loadScreenTimeSelectionId(); }, []);


  useEffect(() => {
    async function bootstrap() {
      await AsyncStorage.multiRemove([
  'ember_session_v1',
  'ember_onboarding_complete',
  'ember_screen_time_selection_id',
  'ember_screen_time_seen',
]);
      // 1. Check onboarding
      Purchases.configure({ apiKey: 'appl_oAPrSJxAenzObkBRjVsJJlnudRM'});
      const [onboarded, seenScreenTime] = await Promise.all([
  hasCompletedOnboarding(),
  hasSeenScreenTimePrompt(),
]);

      if (!onboarded) {
        // First-time user → onboarding
        router.replace('/(onboarding)');
        setReady(true);
        return;
      }

      if (!seenScreenTime) {
        // User has completed onboarding but hasn't seen screen time prompt yet
        router.replace('/(onboarding)/screentime');
        setReady(true);
        return;
      }

      // 2. Returning user — check for live session
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

  if (!ready){
    console.log("not ready")
  };   // your splash/loading component

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(onboarding)" />
      <Stack.Screen name="(protected)" />
    </Stack>
  );
}