import { Slot, Redirect } from "expo-router";
import React, { useEffect, useState } from "react";
import { AppSplash } from "../../components/home/AppSplash";
import { useAuth } from "../../hooks/useAuth";
import { useBilling } from "../../providers/BillingProvider";
import { useData } from "../../providers/DataProvider";
import { hasDismissedFreeTrial } from "../../lib/FreeTrial";

export default function ProtectedLayout() {
  const { userId, authReady, validateSessionOrSignOut } = useAuth();
  const { loading: billingLoading, isActive, hasUsedTrial } = useBilling();
  const { homeReady } = useData();

  const [dismissedTrial, setDismissedTrial] = useState<boolean | null>(null);

  useEffect(() => {
    hasDismissedFreeTrial().then(setDismissedTrial);
  }, []);

  useEffect(() => {
    if (!authReady) return;
    validateSessionOrSignOut();
  }, [authReady, validateSessionOrSignOut]);

  const appNotReady =
    !authReady ||
    billingLoading ||
    dismissedTrial === null ||
    hasUsedTrial === null;

  if (appNotReady) {
    return <AppSplash />;
  }

  if (!userId) {
    return <Redirect href="/(auth)/welcome" />;
  }

  if (isActive) {
    if (!homeReady) return <AppSplash />;
    return <Slot />;   // ✅ FIXED
  }

  if (hasUsedTrial === false && dismissedTrial === false) {
    return <Redirect href="/paywall/FreeTrialScreen" />;
  }

  return <Slot />;  // ✅ FIXED
}
