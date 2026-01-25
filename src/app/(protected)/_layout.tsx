import { Slot, Redirect } from "expo-router";
import React, { useEffect, useState } from "react";
import { AppSplash } from "../../components/home/AppSplash";
import { useAuth } from "../../hooks/useAuth";
import { useBilling } from "../../providers/BillingProvider";
import { useData } from "../../providers/DataProvider";
import { hasDismissedFreeTrial } from "../../lib/FreeTrial";

export default function ProtectedLayout() {
  const { userId, authReady, validateSessionOrSignOut } = useAuth();
  const {
    loading: billingLoading,
    isActive,
    hasUsedTrial,
  } = useBilling();
  const { homeReady } = useData();
  const [dismissedTrial, setDismissedTrial] = useState<boolean | null>(null);


useEffect(() => {
  hasDismissedFreeTrial().then(setDismissedTrial);
}, []);


  useEffect(() => {
    if (!authReady) return;
    validateSessionOrSignOut();
  }, [authReady]);

  
  console.log(isActive, hasUsedTrial, dismissedTrial);
  if (dismissedTrial === null) {
  return <AppSplash />;
}

  // Wait for auth + billing hydration
  if (!authReady || billingLoading) {
    return <AppSplash />;
  }

  // Not logged in → welcome
  if (!userId) {
    return <Redirect href="/(auth)/welcome" />;
  }

  // ✅ Active entitlement → allow app
  if (isActive) {
    if (!homeReady) return <AppSplash />;
    return <Slot />;
  }

  // ❌ Not active + trial available → Free Trial screen
  if (!isActive && !hasUsedTrial && dismissedTrial === false) {
  return <Redirect href="/paywall/FreeTrialScreen" />;
}

  // ❌ Not active + trial already used → locked app shell
  return <Slot />;
}
