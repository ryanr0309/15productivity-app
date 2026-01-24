// components/onboarding/OnboardingProgress.tsx
import React from "react";
import { View, StyleSheet, Dimensions } from "react-native";

const { width } = Dimensions.get("window");

export default function ProgressBar({ step }: { step: number }) {
  return (
    <View style={styles.progressContainer}>
      {Array.from({ length: 10 }).map((_, i) => (
        <View
          key={i}
          style={[
            styles.progressDot,
            i + 1 <= step && styles.activeDot,
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  progressContainer: {
    flexDirection: "row",
    gap: 6,
    marginTop: 60,
    marginBottom: 30,
    alignSelf: "center",
  },
  progressDot: {
    width: width * 0.07,
    height: 4,
    borderRadius: 4,
    backgroundColor: "#2A2A2A",
  },
  activeDot: {
    backgroundColor: "#FFF",
  },
});
