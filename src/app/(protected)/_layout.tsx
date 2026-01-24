import { Slot, Redirect } from "expo-router";
import React, { useEffect } from "react";
import { AppSplash } from "../../components/home/AppSplash";
import { useAuth } from "../../hooks/useAuth";
import { useBilling } from "../../providers/BillingProvider";
import { useData } from "../../providers/DataProvider";

export default function ProtectedLayout() {
  const { userId, authReady, validateSessionOrSignOut } = useAuth();
  const { loading: billingLoading, isSubscribed , presentPaywall} = useBilling();
  const { homeReady } = useData();


useEffect(() => {
  if (!authReady) return;

  validateSessionOrSignOut();
}, [authReady]);

  // Wait for auth + billing
  if (!authReady || billingLoading) {
  return <AppSplash />;
}


  // Not logged in
  if (!userId) {
    return <Redirect href="/(auth)/welcome" />;
  }

  // Not subscribed → PAYWALL ROUTE
  if (!isSubscribed) {
    presentPaywall();
    return <Redirect href="/paywall" />;
  }

  // Optional data hydration
  if (!homeReady) {
    return <AppSplash />;
  }

  return <Slot />;
}
