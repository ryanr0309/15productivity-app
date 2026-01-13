// app/(protected)/_layout.tsx
import { Slot, Redirect } from "expo-router";
import React, { useEffect, useRef } from "react";
import { AppSplash } from "../../components/home/AppSplash";
import { useAuth } from "../../hooks/useAuth";
import { useData } from "../../providers/DataProvider";

export default function ProtectedLayout() {
  const { userId, authReady, onboardingCompleted } = useAuth();
  const {
    preloadHome,
    preloadInsights,
    preloadLab,
    homeReady,
  } = useData();

  console.log("HITTING PROTECTED LAYOUT")
  // 🔒 ensure bootstrap runs ONCE
  const bootstrappedRef = useRef(false);

  useEffect(() => {
    if (!authReady) return;
    if (!userId) return;
    if (bootstrappedRef.current) return;

    bootstrappedRef.current = true;

    // 🔥 THIS IS YOUR OLD APPBOOTSTRAP
    Promise.all([
      preloadHome(),      // blocks + open day
      preloadInsights(),  // insights cache
      preloadLab(),       // lab cache
    ]);
  }, [
    authReady,
    userId,
    preloadHome,
    preloadInsights,
    preloadLab,
  ]);

  /* ================= ROUTING GATES ================= */

  // 1️⃣ Auth unresolved → splash
  if (!authReady) {
    return <AppSplash />;
  }

  // 2️⃣ Logged out → auth flow
  if (!userId) {
    return <Redirect href="/(auth)/welcome" />;
  }

  // 3️⃣ Onboarding incomplete → onboarding flow
  if (!onboardingCompleted) {
    return <Redirect href="/(onboarding)" />;
  }

  // 4️⃣ Home data not ready → splash (NO SKELETON FLASH)
  if (!homeReady) {
    return <AppSplash />;
  }

  // ✅ Everything ready → render protected routes
  return <Slot />;
}
