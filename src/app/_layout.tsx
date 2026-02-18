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
import { Stack, router } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { rehydrateSession } from '../store/sessionStore';
import React from 'react';

export default function RootLayout() {
  // null  = still checking storage
  // true  = active session found, need to redirect
  // false = no session, show normal app
  const [sessionStatus, setSessionStatus] = useState<boolean | null>(null);
  const hasNavigated = useRef(false);

  // Step 1: check AsyncStorage (no navigation here)
  useEffect(() => {
    rehydrateSession().then(hadSession => {
      setSessionStatus(hadSession);
    });
  }, []);

  // Step 2: navigate only after Stack is rendered and router is ready
  useEffect(() => {
    if (sessionStatus === true && !hasNavigated.current) {
      hasNavigated.current = true;
      // Small timeout ensures the Stack navigator has fully mounted
      setTimeout(() => {
        router.replace('/session');
      }, 50);
    }
  }, [sessionStatus]);

  return (
    <SafeAreaProvider>
      {/* Always render the Stack so the router is ready */}
      <Stack screenOptions={{ headerShown: false, animation: 'fade' }} />

      {/* Overlay a splash screen while we're checking — sits ON TOP of Stack */}
      {sessionStatus === null && (
        <View style={styles.splash}>
          <ActivityIndicator color="#FF6B1A" size="large" />
        </View>
      )}
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  splash: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#0A0603',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 999,
  },
});
