import React, { useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  SafeAreaView,
  Image,
  ActivityIndicator,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useBilling } from "../../providers/BillingProvider";
import { markFreeTrialDismissed } from "../../lib/FreeTrial";

export default function FreeTrialScreen() {
  const router = useRouter();
  const { presentPaywall, isActive, loading } = useBilling();

  /* ───────── Guard ───────── */
  useEffect(() => {
    if (!loading && isActive) {
      router.replace("/(protected)/(tabs)");
    }
  }, [isActive, loading]);
  /* ───────────────────────── */

  // Prevent flash while billing state loads
  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color="#FFFFFF" />
      </View>
    );
  }

  return (
    <LinearGradient
      colors={["#0F1426", "#070B17"]}
      style={styles.container}
    >
      <SafeAreaView style={styles.safe}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>
            We want you to try{"\n"}15 Productivity for free
          </Text>
        </View>

        {/* Hero */}
        <View style={styles.hero}>
          <Image
            source={require("../../assets/images/Free.png")}
            style={styles.heroImage}
            resizeMode="contain"
          />
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          <Pressable
            style={styles.primaryButton}
            onPress={async () => {
              await presentPaywall();
            }}
          >
            <Text style={styles.primaryButtonText}>
              Start free trial — $0.00 today
            </Text>
          </Pressable>

          <Text style={styles.secondaryNote}>No payment due now</Text>

          <Pressable
            onPress={async () => {
              await markFreeTrialDismissed();
              router.replace("/(protected)/(tabs)");
            }}
          >
            <Text style={styles.secondaryAction}>
              Continue with limited access
            </Text>
          </Pressable>

          <Text style={styles.finePrint}>
            Free trial converts to a paid subscription unless canceled before it
            ends.
          </Text>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}


/* ───────────── STYLES ───────────── */

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  safe: {
    flex: 1,
    justifyContent: "space-between",
  },

  /* Header */
  header: {
    paddingTop: 24,
    paddingHorizontal: 28,
    alignItems: "center",
  },

  title: {
    fontSize: 26,
    fontWeight: "800",
    color: "#FFFFFF",
    textAlign: "center",
    lineHeight: 32,
    marginBottom: 10,
  },

  subtitle: {
    fontSize: 15,
    color: "rgba(255,255,255,0.65)",
    textAlign: "center",
    lineHeight: 22,
  },

  /* Preview */
  hero: {
    alignItems: "center",
    marginTop: 16,
  },

  heroImage: {
    width: 480,
    height: 460,
    borderRadius: 24,
  },

  previewLabel: {
    marginTop: 10,
    fontSize: 12,
    color: "rgba(255,255,255,0.45)",
  },

  /* Actions */
  actions: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },

  primaryButton: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
  },

  primaryButtonText: {
    color: "#0F1426",
    fontSize: 16,
    fontWeight: "700",
  },

  secondaryNote: {
    marginTop: 8,
    fontSize: 13,
    color: "rgba(255,255,255,0.5)",
    textAlign: "center",
  },

  secondaryAction: {
    marginTop: 18,
    fontSize: 15,
    color: "rgba(255,255,255,0.75)",
    textAlign: "center",
  },

  finePrint: {
    marginTop: 12,
    fontSize: 11,
    color: "rgba(255,255,255,0.4)",
    textAlign: "center",
  },loading: {
  flex: 1,
  backgroundColor: "#0F1426", // match gradient top color
  alignItems: "center",
  justifyContent: "center",
},

});
