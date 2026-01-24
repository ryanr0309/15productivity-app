import React, { useState, useEffect } from "react";
import { useBilling } from "../providers/BillingProvider";
import FreeTrialIntro from "./FreeTrialIntro";

export function PaywallGate() {
  const { paywallState, presentPaywall } = useBilling();
  const [introSeen, setIntroSeen] = useState(false);

  useEffect(() => {
    if (paywallState === "PAYWALL") {
      presentPaywall();
    }

    if (paywallState === "INTRO" && introSeen) {
      presentPaywall();
    }
  }, [paywallState, introSeen]);

  if (paywallState !== "INTRO") return null;

  return (
    <FreeTrialIntro onContinue={() => setIntroSeen(true)} />
  );
}
