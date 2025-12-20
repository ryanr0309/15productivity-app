import React, { useEffect, useState } from "react";
import { Stack } from "expo-router";

export default function RootLayout() {
 
  // 3️⃣ Only render Stack when route is valid
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(onboarding)" />
      <Stack.Screen name="(tabs)" />
    </Stack>
  );
}
