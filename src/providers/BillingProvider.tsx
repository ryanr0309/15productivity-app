import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { Alert } from "react-native";
import Purchases, {
  CustomerInfo,
  LOG_LEVEL,
} from "react-native-purchases";
import RevenueCatUI, { PAYWALL_RESULT } from "react-native-purchases-ui";
import Constants from "expo-constants";
import { useAuth } from "../hooks/useAuth";

const ENTITLEMENT_ID = "Fifteen Pro";



type BillingContextType = {
  loading: boolean;
  isPro: boolean;
  isActive: boolean;
  willRenew: boolean | null;
  periodType: "TRIAL" | "NORMAL" | null;
  expiration: string | null;
  hasUsedTrial: boolean;
  presentPaywall: () => Promise<boolean>;
  presentPaywallIfNeeded: () => Promise<boolean>;
  refreshCustomerInfo: () => Promise<void>;
};
const BillingContext = createContext<BillingContextType | null>(null);

export function BillingProvider({ children }: { children: ReactNode }) {
  const { userId } = useAuth();

  const [loading, setLoading] = useState(true);
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null);


  const apiKey =
    Constants.expoConfig?.extra?.EXPO_PUBLIC_REVENUECAT_API_KEY ?? "";

  /* ============ INIT ============ */
  useEffect(() => {
    let cancelled = false;

    async function init() {
      try {
        if (!apiKey) {
          console.warn("Missing RevenueCat API key");
          setLoading(false);
          return;
        }

        Purchases.setLogLevel(LOG_LEVEL.DEBUG);
        await Purchases.configure({ apiKey });

        Purchases.addCustomerInfoUpdateListener(info => {
          if (!cancelled) setCustomerInfo(info);
        });

        const info = await Purchases.getCustomerInfo();
        if (!cancelled) {
          setCustomerInfo(info);
          setLoading(false);
        }
      } catch (err) {
        console.warn("RevenueCat init error", err);
        setLoading(false);
      }
    }

    init();
    return () => {
      cancelled = true;
    };
  }, [apiKey]);

  /* ============ LINK USER ============ */
useEffect(() => {
  if (loading) return;

  async function link() {
    if (!userId) {
      await Purchases.logOut();
      return;
    }

    console.log("🔗 RC linking to:", userId);
    const info = await Purchases.logIn(userId);
    await refreshCustomerInfo();
  }

  link();
}, [userId, loading]);


  /* ============ HELPERS ============ */
  const refreshCustomerInfo = useCallback(async () => {
    const info = await Purchases.getCustomerInfo();
    setCustomerInfo(info);
  }, []);

  /* ============ ENTITLEMENT CHECK ============ */
  const activeEnt = customerInfo?.entitlements?.active?.[ENTITLEMENT_ID];

  

const isActive = !!activeEnt?.isActive;
const isPro = isActive; // OK

  const willRenew = activeEnt?.willRenew ?? null;
  const periodType = (activeEnt?.periodType as "TRIAL" | "NORMAL") ?? null;
  const expiration = activeEnt?.expirationDate ?? null;

  // Detect past trial use (after trial or restore)
  const hasUsedTrial =
    periodType === "TRIAL" || !!customerInfo?.nonSubscriptionTransactions?.length;

    useEffect(() => {
  console.log("🟨 RC CUSTOMER INFO:", {
    userId,
    entitlements: customerInfo?.entitlements?.active,
    activeEnt,
    isActive,
    willRenew,
    periodType,
    expiration,
    hasUsedTrial,
  });
}, [
  userId,
  customerInfo,
  activeEnt,
  isActive,
  willRenew,
  periodType,
  expiration,
  hasUsedTrial,
]);


  /* ============ PAYWALL ============ */
const presentPaywall = useCallback(async () => {
  try {
    const offerings = await Purchases.getOfferings();
    const offering = offerings.current; // always correct


    if (!offering) {
      console.warn("Offering not found in RevenueCat");
      return false;
    }

    const result: PAYWALL_RESULT = await RevenueCatUI.presentPaywall({
      offering,
    });

    if (result === PAYWALL_RESULT.PURCHASED ||
        result === PAYWALL_RESULT.RESTORED) {
      await refreshCustomerInfo();
      return true;
    }

    return false;
  } catch (e) {
    console.warn("presentPaywall error:", e);
    return false;
  }
}, [refreshCustomerInfo]);



const presentPaywallIfNeeded = useCallback(async () => {
  if (isPro) return false;

  const offerings = await Purchases.getOfferings();
  const offering = offerings.all["ofrnga8061b1582"];

  const result = await RevenueCatUI.presentPaywallIfNeeded({
    offering,
    requiredEntitlementIdentifier: ENTITLEMENT_ID,
  });

  if (result === PAYWALL_RESULT.PURCHASED ||
      result === PAYWALL_RESULT.RESTORED) {
    await refreshCustomerInfo();
    return true;
  }

  return false;
}, [isPro, refreshCustomerInfo]);

  return (
    <BillingContext.Provider
      value={{
        loading,
        isPro,
        isActive,
        willRenew,
        periodType,
        expiration,
        hasUsedTrial,
        presentPaywall,
        presentPaywallIfNeeded,
        refreshCustomerInfo,
      }}
    >
      {children}
    </BillingContext.Provider>
  );
}

export function useBilling() {
  const ctx = useContext(BillingContext);
  if (!ctx) throw new Error("useBilling must be inside BillingProvider");
  return ctx;
}
