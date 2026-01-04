import React, { useEffect } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  SafeAreaView,
} from "react-native";
import * as Haptics from "expo-haptics";

type Props = {
  onEnterToday: () => void;
};

export default function DayLockedScreen({ onEnterToday }: Props) {
  useEffect(() => {
    // subtle confirmation haptic on mount
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }, []);

  const handleEnter = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onEnterToday();
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* CONTENT */}
      <View style={styles.content}>
        {/* Checkmark */}
        <View style={styles.checkContainer}>
          <Text style={styles.check}>✓</Text>
        </View>

        {/* Text */}
        <Text style={styles.title}>
          Your day is set.
        </Text>

        <Text style={styles.subtitle}>
          Focus on the next block.
          {"\n"}
          Everything else can wait.
        </Text>
      </View>

      {/* CTA */}
      <View style={styles.ctaContainer}>
        <Pressable
          onPress={handleEnter}
          style={({ pressed }) => [
            styles.button,
            pressed && styles.buttonPressed,
          ]}
        >
          <Text style={styles.buttonText}>
            Enter Today
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0B1220",
  },

  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },

  checkContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "rgba(34,197,94,0.15)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },

  check: {
    fontSize: 32,
    fontWeight: "700",
    color: "#22C55E",
  },

  title: {
    fontSize: 22,
    fontWeight: "600",
    color: "#FFFFFF",
    marginBottom: 10,
    textAlign: "center",
  },

  subtitle: {
    fontSize: 15,
    fontWeight: "400",
    color: "#B0B8D4",
    textAlign: "center",
    lineHeight: 22,
  },

  ctaContainer: {
    paddingHorizontal: 24,
    paddingBottom: 28,
  },

  button: {
    height: 58,
    borderRadius: 20,
    backgroundColor: "#4DA3FF",
    alignItems: "center",
    justifyContent: "center",
  },

  buttonPressed: {
    transform: [{ scale: 0.96 }],
  },

  buttonText: {
    fontSize: 17,
    fontWeight: "700",
    color: "#0B1220",
  },
});
