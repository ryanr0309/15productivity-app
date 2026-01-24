import { useEffect, useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import React from "react";

type Props = {
  unlockTime: Date;
  onFinished?: () => void;
};

export default function CooldownScreen({
  unlockTime,
  onFinished,
}: Props) {
  const [remainingMs, setRemainingMs] = useState(
    Math.max(unlockTime.getTime() - Date.now(), 0)
  );

  const finishedRef = React.useRef(false);

  useEffect(() => {
    const interval = setInterval(() => {
      const remaining =
        unlockTime.getTime() - Date.now();

      if (remaining <= 0) {
        setRemainingMs(0);

        // 🔑 fire once
        if (!finishedRef.current) {
          finishedRef.current = true;
          onFinished?.();
        }

        clearInterval(interval);
      } else {
        setRemainingMs(remaining);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [unlockTime, onFinished]);

  const formatRemaining = (ms: number) => {
    const totalSeconds = Math.ceil(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m ${seconds}s`;
  };

  return (
    <View
      style={styles.container}
    >
      <Ionicons
        name="moon-outline"
        size={54}
        color="#4DA3FF"
        style={styles.icon}
      />

      <Text style={styles.title}>
        Your next day starts soon
      </Text>

      <Text style={styles.subtitle}>
        We’ll unlock your schedule once you’re fully awake.
      </Text>

      <View style={styles.timerContainer}>
        <Text style={styles.timerText}>
          {formatRemaining(remainingMs)}
        </Text>
        <Text style={styles.timerLabel}>
          until Start Day
        </Text>
      </View>

      <Text style={styles.footer}>
        Consistency beats intensity.
      </Text>
    </View>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },

  icon: {
    marginBottom: 24,
    opacity: 0.9,
  },

  title: {
    fontSize: 24,
    fontWeight: "600",
    color: "#FFFFFF",
    textAlign: "center",
    marginBottom: 8,
  },

  subtitle: {
    fontSize: 15,
    color: "#B0B8D4",
    textAlign: "center",
    marginBottom: 36,
    lineHeight: 20,
  },

  timerContainer: {
    alignItems: "center",
    marginBottom: 48,
  },

  timerText: {
    fontSize: 36,
    fontWeight: "700",
    color: "#4DA3FF",
  },

  timerLabel: {
    fontSize: 13,
    color: "#B0B8D4",
    marginTop: 6,
  },

  footer: {
    fontSize: 12,
    color: "#B0B8D4",
    opacity: 0.7,
  },
});
