
// app/index.tsx
import { Redirect } from "expo-router";
import { useAuth } from "../hooks/useAuth";
import { AppSplash } from "../components/home/AppSplash";
import React from "react";

export default function Index() {
  const { userId, authReady, onboardingCompleted } = useAuth();

  console.log(userId, authReady, onboardingCompleted)
  if (!authReady) {
    return <AppSplash />;
  }

   console.log(userId, authReady, onboardingCompleted)

  if (!userId) {
    return <Redirect href="/(auth)/welcome" />;
  }

   console.log(userId, authReady, onboardingCompleted)

  if (!onboardingCompleted) {
    return <Redirect href="/(onboarding)" />;
  }

   console.log(userId, authReady, onboardingCompleted)
  return <Redirect href="/(protected)" />;
}
