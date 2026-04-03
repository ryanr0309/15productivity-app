import { Stack } from "expo-router";
import React from "react";

export default function OnboardingLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown:  false,
        animation:    'slide_from_right',   
        gestureEnabled: false,              
      }}
    >
      <Stack.Screen name="index"      />    // Screen 1  — Welcome
      <Stack.Screen name="pain"       />    // Screen 2  — Pain
      <Stack.Screen name="stealer"  />    // Screen 3  — Q: what steals focus
      <Stack.Screen name="window"   />    // Screen 4  — Q: focus window
      <Stack.Screen name="protect"  />    // Screen 5  — Q: protect time for
      <Stack.Screen name="age"   />    // Screen 4  — Q: focus window
      <Stack.Screen name="phone"    />    // Screen 6  — Q: daily phone hours
      <Stack.Screen name="waste"      />    // Screen 7  — Life waste animation
      <Stack.Screen name="reframe"    />    // Screen 8  — You're not broken
      <Stack.Screen name="science"    />    // Screen 9 — The science
      <Stack.Screen name="reveal"     />    // Screen 10 — Introducing Ember
         <Stack.Screen name="plan"       />    // Screen 12 — Your personalized plan
         <Stack.Screen name="code" />    // Screen 11 — Creator Code
         <Stack.Screen name="commitment"  />    // Screen 13 — Commitment
<Stack.Screen name="paywall"     />    // Screen 15 — Paywall
            <Stack.Screen name="screentime"/>    // Screen 16 — Screen time permission
            <Stack.Screen name="notifications"  />    // Screen 17 — Notifications permission
      {/*
      
      <Stack.Screen name="reframe"    />    // Screen 8  — You're not broken
      <Stack.Screen name="cost"       />    // Screen 9  — What this costs you
      <Stack.Screen name="science"    />    // Screen 10 — The science
      <Stack.Screen name="reveal"     />    // Screen 11 — Introducing Ember
      <Stack.Screen name="plan"       />    // Screen 12 — Your personalized plan
      <Stack.Screen name="commitment" />    // Screen 13 — Commitment
      <Stack.Screen name="paywall"    />    // Screen 14 — Paywall
      <Stack.Screen name="offer"      />    // Screen 15 — Special offer
      <
      <Stack.Screen name="reminders"  />    // Screen 17 — Notifications  
      */}
    </Stack>
  );
}