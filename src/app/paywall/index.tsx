// app/paywall/index.tsx
import React, { useEffect, useState } from "react";
import { View, Text, Pressable, ActivityIndicator, StyleSheet } from "react-native";
import { Redirect } from "expo-router";
import { useBilling } from "../../providers/BillingProvider";

export default function PaywallScreen() {
  const {
    loading,
    isActive,
    presentPaywall,
    refreshCustomerInfo,
  } = useBilling();

  const [shownOnce, setShownOnce] = useState(false);

  // Show paywall on mount ONCE
  useEffect(() => {
    if (loading || shownOnce) return;

    setShownOnce(true);
    (async () => {
      await presentPaywall();
      await refreshCustomerInfo();
    })();
  }, [loading, shownOnce, presentPaywall, refreshCustomerInfo]);

  // While billing is initializing
  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  // Entitlement active → go into app
  if (isActive) {
    return <Redirect href="/(protected)" />;
  }

  // Not active & paywall dismissed → simple blocking screen
  return (
    <View style={styles.center}>
      <Text style={styles.title}>Unlock Fifteen Pro</Text>
      <Text style={styles.sub}>
        Start your 3-day free trial to get access to Fifteen.
      </Text>

      <Pressable
        style={styles.button}
        onPress={async () => {
          await presentPaywall();
          await refreshCustomerInfo();
        }}
      >
        <Text style={styles.buttonText}>View Subscription Options</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    backgroundColor: "#050816",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  title: {
    color: "white",
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 8,
    textAlign: "center",
  },
  sub: {
    color: "#9CA3AF",
    fontSize: 14,
    textAlign: "center",
    marginBottom: 24,
  },
  button: {
    backgroundColor: "#4F46E5",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 999,
  },
  buttonText: {
    color: "white",
    fontWeight: "600",
  },
});

