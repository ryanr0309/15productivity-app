/**
 * app/_layout.tsx  (ROOT)
 *
 * Fix: router.replace() called before Expo Router is mounted = silent fail.
 * Solution: separate the "check for session" step from the "navigate" step.
 * We store the result in state, then navigate inside a useEffect that runs
 * AFTER the Stack has rendered (i.e. router is ready).
 */

import { useEffect, useRef, useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { SplashScreen, Stack, router, useRouter } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { rehydrateSession } from '../store/sessionStore';
import React from 'react';
import { hasCompletedOnboarding } from '../store/onboardingStore';
import Purchases from 'react-native-purchases';



export default function RootLayout() {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    async function bootstrap() {
      // 1. Check onboarding
      Purchases.configure({ apiKey: 'appl_oAPrSJxAenzObkBRjVsJJlnudRM' });
      const onboarded = await hasCompletedOnboarding();

      if (!onboarded) {
        // First-time user → onboarding
        router.replace('/(onboarding)');
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