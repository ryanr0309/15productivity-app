import { Stack } from "expo-router";
import React from "react";

export default function RootLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      {/* Route groups */}
      <Stack.Screen name="(auth)" options={{headerShown: false}} />
      <Stack.Screen name="(onboarding)" options={{headerShown: false, title: 'Onboarding'}}/>
      <Stack.Screen name="(tabs)" options={{headerShown: false, title: 'Tabs'}}/>
    </Stack>
  );
}
