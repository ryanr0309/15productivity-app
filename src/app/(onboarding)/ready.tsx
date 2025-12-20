import { View, Text, Pressable, StyleSheet } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { supabase } from "../../lib/supabase";

export default function OnboardingReadyScreen() {

    async function finishOnboarding() {
    // 1️⃣ Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    // 2️⃣ Mark onboarding as completed
    const { error } = await supabase
      .from("users")
      .update({ onboarding_completed: true })
      .eq("id", user.id);

    if (error) {
      console.error("Failed to complete onboarding:", error);
      return;
    }

    // 3️⃣ Go to app
    router.replace("/(tabs)");
  }

  return (
    <View style={styles.container}>
      {/* Content */}
      <View style={styles.content}>
        <Text style={styles.title}>
          Your personalized 15-minute focus plan is ready
        </Text>

        <Text style={styles.subtitle}>
          Let’s make your days more productive.
        </Text>
      </View>

      {/* Next Arrow */}
      <Pressable onPress={finishOnboarding} style={styles.nextButton}>
        <Ionicons name="arrow-forward" size={26} color="#FFFFFF" />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0F1B3D",
    padding: 24,
    justifyContent: "space-between",
  },

  content: {
    marginTop: 140,
  },

  title: {
    fontSize: 30,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 12,
    lineHeight: 38,
  },

  subtitle: {
    fontSize: 16,
    color: "rgba(255,255,255,0.7)",
  },

  nextButton: {
    alignSelf: "flex-end",
    backgroundColor: "#4DA3FF",
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
});
