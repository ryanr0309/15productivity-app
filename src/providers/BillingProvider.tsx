import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  ReactNode,
} from "react";
import Purchases, {
  CustomerInfo,
  LOG_LEVEL,
  INTRO_ELIGIBILITY_STATUS,
} from "react-native-purchases";

import RevenueCatUI, { PAYWALL_RESULT } from "react-native-purchases-ui";
import Constants from "expo-constants";
import { useAuth } from "../hooks/useAuth";

const ENTITLEMENT_ID = "Fifteen Pro";

type BillingContextType = {
  loading: boolean;

  // 🔑 Billing states
  isActive: boolean;
  hasUsedTrial: boolean | null;

  // Actions
  presentPaywall: () => Promise<boolean>;
  refreshCustomerInfo: () => Promise<void>;
};

const BillingContext = createContext<BillingContextType | null>(null);

export function BillingProvider({ children }: { children: ReactNode }) {
  const { userId } = useAuth();

  const [initializing, setInitializing] = useState(true);
  const [linking, setLinking] = useState(false);
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null);
  const [rcUserId, setRcUserId] = useState<string | null>(null);
  const [hasUsedTrial, setHasUsedTrial] = useState<boolean | null>(null);


  const apiKey =
    Constants.expoConfig?.extra?.EXPO_PUBLIC_REVENUECAT_API_KEY ?? "";

    
  /* ---------- INIT ---------- */
  useEffect(() => {
    let cancelled = false;

    async function init() {
      try {
        Purchases.setLogLevel(LOG_LEVEL.INFO);
        await Purchases.configure({ apiKey });

        Purchases.addCustomerInfoUpdateListener(info => {
          if (!cancelled) setCustomerInfo(info);
        });

        const info = await Purchases.getCustomerInfo();
        if (!cancelled) setCustomerInfo(info);
      } catch (e) {
        console.warn("RevenueCat init error", e);
      } finally {
        if (!cancelled) setInitializing(false);
      }
    }

    init();
    return () => {
      cancelled = true;
    };
  }, [apiKey]);

  /* ---------- LINK USER ---------- */
  useEffect(() => {
    if (initializing) return;
    if (userId && rcUserId === userId) return;
    if (!userId && rcUserId === null) return;

    let cancelled = false;

    async function syncUser() {
      try {
        setLinking(true);

        if (!userId) {
          await Purchases.logOut();
          const info = await Purchases.getCustomerInfo();
          if (!cancelled) {
            setCustomerInfo(info);
            setRcUserId(null);
          }
        } else {
          const { customerInfo } = await Purchases.logIn(userId);
          if (!cancelled) {
            setCustomerInfo(customerInfo);
            setRcUserId(userId);
          }
        }
      } catch (e) {
        console.warn("RevenueCat link error", e);
      } finally {
        if (!cancelled) setLinking(false);
      }
    }

    syncUser();
    return () => {
      cancelled = true;
    };
  }, [userId, initializing, rcUserId]);

  const loading = initializing || linking;

  /* ---------- DERIVED BILLING STATE ---------- */
const isEligible = (status: number) =>
  status === INTRO_ELIGIBILITY_STATUS.INTRO_ELIGIBILITY_STATUS_ELIGIBLE;


  const isActive = useMemo(() => {
    return !!customerInfo?.entitlements?.active?.[ENTITLEMENT_ID];
  }, [customerInfo]);


 const checkTrialStatus = useCallback(async () => {
  try {
    const offerings = await Purchases.getOfferings();
    const productIds =
      offerings.current?.availablePackages
        .map(p => p.product.identifier) ?? [];

    if (productIds.length === 0) return;

    const eligibility =
      await Purchases.checkTrialOrIntroductoryPriceEligibility(productIds);

    // If ANY product is ineligible → trial already used
    const usedTrial = Object.values(eligibility).some(
  e => !isEligible(e.status)
);




    setHasUsedTrial(usedTrial);
  } catch (e) {
    console.warn("checkTrialStatus error", e);
  }
}, []);

useEffect(() => {
  if (!loading) {
    checkTrialStatus();
  }
}, [loading, checkTrialStatus]);


  /* ---------- ACTIONS ---------- */
  

const refreshCustomerInfo = useCallback(async () => {
  const info = await Purchases.getCustomerInfo();
  setCustomerInfo(info);
  await checkTrialStatus();
}, [checkTrialStatus]);


  const presentPaywall = useCallback(async () => {
    try {
      const offerings = await Purchases.getOfferings();
      const offering = offerings.current;
      if (!offering) return false;

      const result = await RevenueCatUI.presentPaywall({ offering });

      if (
        result === PAYWALL_RESULT.PURCHASED ||
        result === PAYWALL_RESULT.RESTORED
      ) {
        await refreshCustomerInfo();
        return true;
      }

      return false;
    } catch (e) {
      console.warn("presentPaywall error", e);
      return false;
    }
  }, [refreshCustomerInfo]);

  return (
    <BillingContext.Provider
      value={{
        loading,
        isActive,
        hasUsedTrial,
        presentPaywall,
        refreshCustomerInfo,
      }}
    >
      {children}
    </BillingContext.Provider>
  );
}

export function useBilling() {
  const ctx = useContext(BillingContext);
  if (!ctx) throw new Error("useBilling must be used inside BillingProvider");
  return ctx;
}
