// app/(onboarding)/habits-placement-loading.tsx
import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, SafeAreaView } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import LottieView from "lottie-react-native";

const TIPS = [
  "Finding the best time windows for your habits…",
  "Balancing energy-heavy and light habits…",
  "Reducing context switching for better focus…",
  "Optimizing for consistency over perfection…",
];

export default function HabitsPlacementLoadingScreen() {
  const [tipIndex, setTipIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setTipIndex((i) => (i + 1) % TIPS.length);
    }, 1800);

    return () => clearInterval(interval);
  }, []);

  return (
    <LinearGradient
      colors={["#0F1426", "#070B17"]}
      style={styles.container}
    >
      <SafeAreaView style={styles.safe}>
        <View style={styles.content}>
          {/* Lottie Spinner */}
          <LottieView
            autoPlay
            loop
            style={styles.lottie}
            source={require("../../assets/animations/Trail_loading.json")}
          />

          {/* Primary Copy */}
          <Text style={styles.title}>Preparing your day</Text>

          {/* Dynamic Tip */}
     
        </View>

      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safe: { flex: 1 },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },

  lottie: {
    width: 140,
    height: 140,
    marginBottom: 28,
  },

  title: {
    color: "rgba(255,255,255,0.95)",
    fontSize: 22,
    fontWeight: "800",
    letterSpacing: 0.3,
    marginBottom: 6,
  },
  subtitle: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 14.5,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 18,
  },

  tip: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 13,
    textAlign: "center",
    lineHeight: 18,
    maxWidth: 260,
  },

  footer: {
    textAlign: "center",
    color: "rgba(255,255,255,0.4)",
    fontSize: 12,
    paddingBottom: 18,
  },
});
