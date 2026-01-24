import React from "react";
import { View, Text, StyleSheet, Pressable, Dimensions } from "react-native";
import * as Notifications from "expo-notifications";
import { LinearGradient } from "expo-linear-gradient";
import LottieView from "lottie-react-native";
import { supabase } from "../../lib/supabase";

const { width } = Dimensions.get("window");

type Props = {
  step: number;
  onDone: () => void; // parent advances ONLY after decision
};

export default function NotificationsOnboarding({
  step,
  onDone,
}: Props) {
  async function handleEnable() {
    const { status, canAskAgain } =
    await Notifications.requestPermissionsAsync();

    console.log("Notification status:", status, canAskAgain);


    const user = (await supabase.auth.getUser()).data.user;

    if (user) {
      await supabase
        .from("user_settings")
        .update({
          notifications_enabled: status === "granted",
        })
        .eq("user_id", user.id);
    }

    // ✅ advance ONLY after permission flow completes
    onDone();
  }

  async function handleSkip() {
    const user = (await supabase.auth.getUser()).data.user;

    if (user) {
      await supabase
        .from("user_settings")
        .update({ notifications_enabled: false })
        .eq("user_id", user.id);
    }

    // ✅ advance ONLY after explicit skip
    onDone();
  }

  return (
    <LinearGradient
      colors={["#0F1426", "#070B17"]}
      style={styles.container}
    >
      {/* Progress */}
      <View style={styles.topBar}>
        <View style={styles.progressContainer}>
          {Array.from({ length: 11 }).map((_, i) => (
            <View
              key={i}
              style={[
                styles.progressDot,
                i + 1 <= step && styles.activeDot,
              ]}
            />
          ))}
        </View>
      </View>

      {/* Content */}
      <View style={styles.content}>
        <LottieView
          autoPlay
          loop={false}
          style={styles.lottie}
          source={require("../../assets/animations/Notifications.json")}
        />

        <Text style={styles.title}>Stay on track</Text>

        <Text style={styles.subtitle}>
          Get gentle reminders to start your day, protect streaks, and reflect
          with weekly insights — never spam.
        </Text>

        <Pressable style={styles.primaryButton} onPress={handleEnable}>
          <Text style={styles.primaryText}>Enable notifications</Text>
        </Pressable>

        <Pressable onPress={handleSkip}>
          <Text style={styles.skipText}>Maybe later</Text>
        </Pressable>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 72,
    paddingHorizontal: 20,
    backgroundColor: "#070B17",
  },

  /* Progress */
  topBar: {
    marginBottom: 12,
  },
  progressContainer: {
    flexDirection: "row",
    gap: 6,
  },
  progressDot: {
    width: width * 0.065,
    height: 4,
    borderRadius: 4,
    backgroundColor: "rgba(255,255,255,0.18)",
  },
  activeDot: {
    backgroundColor: "#FFFFFF",
  },

  /* Main content */
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-start",
    paddingTop: 120,
  },

  lottie: {
    width: 220,
    height: 220,
    marginBottom: 8,
  },

  title: {
    fontSize: 27,
    fontWeight: "700",
    color: "#FFFFFF",
    marginTop: 8,
    marginBottom: 8,
    textAlign: "center",
    letterSpacing: -0.3,
  },

  subtitle: {
    fontSize: 15,
    color: "rgba(255,255,255,0.7)",
    textAlign: "center",
    lineHeight: 22,
    maxWidth: width * 0.82,
    marginBottom: 36,
  },

  primaryButton: {
    width: "100%",
    height: 56,
    borderRadius: 28,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 14,
  },

  primaryText: {
    color: "#000000",
    fontSize: 17,
    fontWeight: "600",
  },

  skipText: {
    color: "rgba(255,255,255,0.55)",
    fontSize: 15,
  },
});
