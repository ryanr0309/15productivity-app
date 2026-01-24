// app/paywall/locked.tsx
import React, { useEffect } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { useBilling } from "../../providers/BillingProvider";
import { useAuth } from "../../hooks/useAuth";
import Purchases from "react-native-purchases";
import { router } from "expo-router";

export default function PaywallLocked() {
  const { presentPaywall } = useBilling();
  const { userId, authReady } = useAuth();

useEffect(() => {
  if (!authReady) return;

  console.log(userId)
  if (!userId) {
    // HARD RESET billing state
    Purchases.logOut().finally(() => {
      router.replace("/(auth)/welcome");
    });
  }
}, [authReady, userId]);


  return (
    <View style={styles.container}>
      <Text style={styles.title}>Fifteen Pro is required</Text>

      <Text style={styles.sub}>
        Fifteen works best when your full day, habits, and insights are connected.
      </Text>

      <View style={styles.list}>
        <Text style={styles.item}>• Daily productivity score</Text>
        <Text style={styles.item}>• Habit streak protection</Text>
        <Text style={styles.item}>• Weekly insights & AI suggestions</Text>
        <Text style={styles.item}>• Sync across devices</Text>
      </View>

      <Pressable style={styles.primary} onPress={presentPaywall}>
        <Text style={styles.primaryText}>Join Fifteen</Text>
      </Pressable>

      <Text style={styles.restore}>
        Purchases sync automatically. Restore available in paywall.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#050816",
    justifyContent: "center",
    padding: 28,
  },
  title: {
    color: "white",
    fontSize: 26,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 12,
  },
  sub: {
    color: "#9CA3AF",
    fontSize: 15,
    textAlign: "center",
    marginBottom: 24,
  },
  list: {
    marginBottom: 32,
  },
  item: {
    color: "#E5E7EB",
    fontSize: 15,
    marginBottom: 8,
  },
  primary: {
    backgroundColor: "#4F46E5",
    paddingVertical: 14,
    borderRadius: 999,
    alignItems: "center",
    marginBottom: 12,
  },
  primaryText: {
    color: "white",
    fontWeight: "600",
    fontSize: 16,
  },
  restore: {
    textAlign: "center",
    fontSize: 12,
    color: "#6B7280",
  },
});
