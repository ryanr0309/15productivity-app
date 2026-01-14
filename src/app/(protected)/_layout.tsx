// app/(protected)/_layout.tsx
import { Slot, Redirect } from "expo-router";
import React from "react";
import { AppSplash } from "../../components/home/AppSplash";
import { useAuth } from "../../hooks/useAuth";
import { useBilling } from "../../providers/BillingProvider";
import { useData } from "../../providers/DataProvider";

export default function ProtectedLayout() {
  const { userId, authReady } = useAuth();
  const { loading: billingLoading, isActive } = useBilling();
  const { homeReady } = useData();

  // 1️⃣ Wait for auth + billing to hydrate
  if (!authReady || billingLoading) {
    return <AppSplash />;
  }

  // 2️⃣ Auth required
  if (!userId) {
    return <Redirect href="/(auth)/welcome" />;
  }

  // 3️⃣ ⚠️ Important: "undefined" means still resolving RC entitlements
  if (isActive === undefined) {
    return <AppSplash />;
  }

  // 4️⃣ User has no entitlement → paywall
  if (!isActive) {
    return <Redirect href="/paywall" />;
  }

  // 5️⃣ Optional data preload
  if (!homeReady) {
    return <AppSplash />;
  }

  // 6️⃣ Fully authorized + hydrated
  return <Slot />;
}
