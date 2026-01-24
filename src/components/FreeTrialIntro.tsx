import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Dimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import LottieView from "lottie-react-native";

const { width } = Dimensions.get("window");

type Props = {
  onContinue: () => void;
};

export default function FreeTrialIntro({ onContinue }: Props) {
  return (
    <LinearGradient
      colors={["#0F1426", "#070B17"]}
      style={styles.container}
    >
      {/* Visual */}
      <LottieView
        autoPlay
        loop
        style={styles.lottie}
        source={require("../assets/animations/time.json")}
      />

      {/* Copy */}
      <View style={styles.textBlock}>
        <Text style={styles.title}>
          Try 15 for free
        </Text>

        <Text style={styles.subtitle}>
          Build better days before you commit.
        </Text>

        <View style={styles.bullets}>
          <Bullet text="Plan your day in 15-minute blocks" />
          <Bullet text="Track habits & focus automatically" />
          <Bullet text="See insights after real usage" />
        </View>

        <Text style={styles.disclaimer}>
          No charge today · Cancel anytime during trial
        </Text>
      </View>

      {/* CTA */}
      <Pressable style={styles.button} onPress={onContinue}>
        <Text style={styles.buttonText}>
          Continue
        </Text>
      </Pressable>
    </LinearGradient>
  );
}

/* ---------- Bullet ---------- */

function Bullet({ text }: { text: string }) {
  return (
    <View style={styles.bulletRow}>
      <View style={styles.dot} />
      <Text style={styles.bulletText}>{text}</Text>
    </View>
  );
}

/* ---------- Styles ---------- */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 28,
    paddingTop: 120,
    paddingBottom: 48,
    justifyContent: "space-between",
  },

  lottie: {
    width: width * 0.7,
    height: width * 0.7,
    alignSelf: "center",
    marginBottom: 16,
  },

  textBlock: {
    alignItems: "center",
  },

  title: {
    fontSize: 30,
    fontWeight: "700",
    color: "#FFFFFF",
    textAlign: "center",
    marginBottom: 8,
    letterSpacing: -0.3,
  },

  subtitle: {
    fontSize: 16,
    color: "rgba(255,255,255,0.7)",
    textAlign: "center",
    marginBottom: 28,
  },

  bullets: {
    width: "100%",
    gap: 14,
    marginBottom: 22,
  },

  bulletRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#4DA3FF",
    marginTop: 4,
  },

  bulletText: {
    flex: 1,
    fontSize: 15,
    color: "rgba(255,255,255,0.85)",
    lineHeight: 22,
  },

  disclaimer: {
    fontSize: 13,
    color: "rgba(255,255,255,0.55)",
    textAlign: "center",
    marginTop: 8,
  },

  button: {
    height: 56,
    borderRadius: 28,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
  },

  buttonText: {
    fontSize: 17,
    fontWeight: "600",
    color: "#000000",
  },
});
