import React from "react";
import { View, Text, StyleSheet, Pressable, SafeAreaView } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import LottieView from "lottie-react-native";
import { useRouter } from "expo-router";
import { useBilling } from "../../providers/BillingProvider";
import { markFreeTrialDismissed } from "../../lib/FreeTrial";

export default function FreeTrialScreen() {
  const router = useRouter();
  const { presentPaywall } = useBilling();

  return (
    <LinearGradient
      colors={["#0F1426", "#070B17"]}
      style={styles.container}
    >
      <SafeAreaView style={styles.safe}>
        {/* Top visual */}
        <View style={styles.hero}>
          <LottieView
            autoPlay
            loop
            style={styles.lottie}
            source={require("../../assets/animations/time.json")}
          />
        </View>

        {/* Copy */}
        <View style={styles.content}>
          <Text style={styles.title}>Try 15 Productivity for free</Text>
          <Text style={styles.subtitle}>
            See exactly where your time goes — in focused 15-minute blocks.
          </Text>

          <View style={styles.bullets}>
            <Text style={styles.bullet}>• Track your day with intention</Text>
            <Text style={styles.bullet}>• See what actually moves you forward</Text>
            <Text style={styles.bullet}>• No charge today. Cancel anytime.</Text>
          </View>
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safe: {
    flex: 1,
    justifyContent: "space-between",
  },
  hero: {
    alignItems: "center",
    marginTop: 40,
  },
  lottie: {
    width: 220,
    height: 220,
  },
  content: {
    paddingHorizontal: 28,
    alignItems: "center",
  },
  title: {
    fontSize: 26,
    fontWeight: "700",
    color: "#FFFFFF",
    textAlign: "center",
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: "rgba(255,255,255,0.7)",
    textAlign: "center",
    marginBottom: 20,
    lineHeight: 22,
  },
  bullets: {
    alignSelf: "stretch",
  },
  bullet: {
    fontSize: 15,
    color: "rgba(255,255,255,0.85)",
    marginBottom: 8,
  },
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
  },
});
