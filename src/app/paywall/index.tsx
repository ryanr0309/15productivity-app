import React from "react";
import { View, Text, StyleSheet, Pressable, ScrollView } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";

export default function PaywallScreen() {
  const router = useRouter();

  async function handleStartTrial() {
    // TODO: plug RevenueCat here
    // await startTrialWithRevenueCat();

    // For now, simulate success:
    router.replace("/(protected)/(tabs)");

  }

  return (
    <LinearGradient colors={["#0B1224", "#111B34"]} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.header}>Unlock 15</Text>
        <Text style={styles.sub}>
          Start your 3-day free trial to see how 15 helps you track time, build habits, and improve productivity.
        </Text>

        <View style={styles.benefitBox}>
          <Text style={styles.benefit}>✔ Track your day in 15-minute blocks</Text>
          <Text style={styles.benefit}>✔ Categorize time across work & life</Text>
          <Text style={styles.benefit}>✔ Build habits & align to goals</Text>
          <Text style={styles.benefit}>✔ Get insights & productivity scores</Text>
          <Text style={styles.benefit}>✔ AI suggestions tailored to your goals</Text>
        </View>

        <View style={styles.priceBox}>
          <Text style={styles.priceTitle}>3-Day Free Trial</Text>
          <Text style={styles.priceSub}>Then $X.XX/month. Cancel anytime.</Text>
        </View>
      </ScrollView>

      <Pressable onPress={handleStartTrial} style={styles.button}>
        <Text style={styles.buttonText}>Start Free Trial</Text>
      </Pressable>

      <Pressable onPress={() => router.back()} style={styles.close}>
        <Text style={styles.closeText}>Not now</Text>
      </Pressable>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: {
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 120,
  },
  header: {
    color: "#FFFFFF",
    fontSize: 30,
    fontWeight: "700",
    marginBottom: 12,
  },
  sub: {
    color: "#B8C5E4",
    fontSize: 15,
    lineHeight: 20,
    marginBottom: 24,
  },
  benefitBox: {
    backgroundColor: "#151E36",
    borderRadius: 16,
    padding: 20,
    marginBottom: 30,
  },
  benefit: {
    color: "#FFFFFF",
    fontSize: 14,
    marginBottom: 8,
  },
  priceBox: {
    alignItems: "center",
    marginBottom: 40,
  },
  priceTitle: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "600",
  },
  priceSub: {
    color: "#8EA2C8",
    fontSize: 14,
    marginTop: 4,
  },
  button: {
    height: 56,
    marginHorizontal: 24,
    borderRadius: 16,
    backgroundColor: "#4DA3FF",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  buttonText: {
    color: "#0B1224",
    fontWeight: "700",
    fontSize: 17,
  },
  close: {
    alignSelf: "center",
    marginBottom: 40,
  },
  closeText: {
    color: "#8EA2C8",
    fontSize: 14,
  },
});
